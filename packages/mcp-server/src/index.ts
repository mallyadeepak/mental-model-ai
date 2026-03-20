#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface MentalModelNode {
  id: string;
  label: string;
  description: string;
  depth: number;
  nodeType: string;
  parentId?: string | null;
}

interface MentalModelEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  edgeType: string;
}

interface MentalModelAnalogy {
  concept: string;
  realWorldExample: string;
  explanation: string;
  relatedNodeId?: string;
}

interface MentalModel {
  title: string;
  summary: string;
  diagramType: string;
  nodes: MentalModelNode[];
  edges: MentalModelEdge[];
  analogies: MentalModelAnalogy[];
}

function generateMermaidDiagram(model: MentalModel): string {
  const lines: string[] = [];
  const nodeMap = new Map(model.nodes.map((n) => [n.id, n]));

  // Use flowchart for all types - better visual control
  lines.push('flowchart TB');

  // Clean, professional color scheme
  lines.push('  classDef concept fill:#4A90A4,stroke:#2C5F6E,stroke-width:2px,color:#fff');
  lines.push('  classDef process fill:#7B68A6,stroke:#4A3D6E,stroke-width:2px,color:#fff');
  lines.push('  classDef example fill:#5DAE8B,stroke:#3D7A5E,stroke-width:2px,color:#fff');
  lines.push('  classDef analogy fill:#D4A574,stroke:#A67B4A,stroke-width:2px,color:#fff');

  // Define nodes with distinct shapes per type (no emojis)
  for (const node of model.nodes) {
    // Different shapes: concept=rounded rect, process=rect, example=parallelogram, analogy=hexagon
    const shape = node.nodeType === 'concept' ? `${node.id}(${node.label})` :
                  node.nodeType === 'process' ? `${node.id}[${node.label}]` :
                  node.nodeType === 'example' ? `${node.id}[/${node.label}/]` :
                  `${node.id}{{${node.label}}}`;
    lines.push(`  ${shape}`);
  }

  // Apply styles to nodes
  const conceptNodes = model.nodes.filter(n => n.nodeType === 'concept').map(n => n.id);
  const processNodes = model.nodes.filter(n => n.nodeType === 'process').map(n => n.id);
  const exampleNodes = model.nodes.filter(n => n.nodeType === 'example').map(n => n.id);
  const analogyNodes = model.nodes.filter(n => n.nodeType === 'analogy').map(n => n.id);

  if (conceptNodes.length) lines.push(`  class ${conceptNodes.join(',')} concept`);
  if (processNodes.length) lines.push(`  class ${processNodes.join(',')} process`);
  if (exampleNodes.length) lines.push(`  class ${exampleNodes.join(',')} example`);
  if (analogyNodes.length) lines.push(`  class ${analogyNodes.join(',')} analogy`);

  // Define edges
  for (const edge of model.edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (source && target) {
      const arrow = edge.edgeType === 'contains' ? '-->' :
                    edge.edgeType === 'leads_to' ? '==>' :
                    edge.edgeType === 'depends_on' ? '-.->' :
                    '---';
      lines.push(`  ${edge.source} ${arrow}|${edge.label}| ${edge.target}`);
    }
  }

  // Add legend
  lines.push('');
  lines.push('  subgraph Legend');
  lines.push('    L1(Concept):::concept');
  lines.push('    L2[Process]:::process');
  lines.push('    L3[/Example/]:::example');
  lines.push('    L4{{Analogy}}:::analogy');
  lines.push('  end');

  return lines.join('\n');
}

function formatMentalModelAsMarkdown(model: MentalModel): string {
  const lines: string[] = [];

  // Title and summary
  lines.push(`# ${model.title}`);
  lines.push('');
  lines.push(`> ${model.summary}`);
  lines.push('');

  // Mermaid diagram
  lines.push('## Diagram');
  lines.push('');
  lines.push('```mermaid');
  lines.push(generateMermaidDiagram(model));
  lines.push('```');
  lines.push('');

  // Build node hierarchy for text representation
  const nodeMap = new Map(model.nodes.map((n) => [n.id, n]));
  const rootNodes = model.nodes.filter((n) => !n.parentId || n.parentId === null);
  const childrenMap = new Map<string, MentalModelNode[]>();

  for (const node of model.nodes) {
    if (node.parentId) {
      const children = childrenMap.get(node.parentId) || [];
      children.push(node);
      childrenMap.set(node.parentId, children);
    }
  }

  // Render nodes hierarchically as text
  lines.push('## Concepts');
  lines.push('');

  function renderNode(node: MentalModelNode, indent: string = ''): void {
    const typeLabel: Record<string, string> = {
      concept: '[Concept]',
      process: '[Process]',
      example: '[Example]',
      analogy: '[Analogy]',
    };
    const label = typeLabel[node.nodeType] || '';

    lines.push(`${indent}- **${node.label}** ${label}`);
    if (node.description) {
      lines.push(`${indent}  _${node.description}_`);
    }

    const children = childrenMap.get(node.id) || [];
    for (const child of children) {
      renderNode(child, indent + '  ');
    }
  }

  for (const root of rootNodes) {
    renderNode(root);
    lines.push('');
  }

  // Relationships (text version)
  if (model.edges.length > 0) {
    lines.push('## Relationships');
    lines.push('');
    for (const edge of model.edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (source && target) {
        lines.push(`- **${source.label}** → *${edge.label}* → **${target.label}**`);
      }
    }
    lines.push('');
  }

  // Analogies
  if (model.analogies.length > 0) {
    lines.push('## Real-World Analogies');
    lines.push('');
    for (const analogy of model.analogies) {
      lines.push(`### ${analogy.concept} ↔ ${analogy.realWorldExample}`);
      lines.push('');
      lines.push(analogy.explanation);
      lines.push('');
    }
  }

  // Footer with metadata
  lines.push('---');
  lines.push(`*Generated on ${new Date().toISOString().split('T')[0]}*`);

  return lines.join('\n');
}

const server = new Server(
  {
    name: 'mental-model-ai',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Compact JSON schema - removed verbose descriptions to save tokens
const MENTAL_MODEL_SCHEMA = `{
  "title": "string", "summary": "string", "diagramType": "mindmap|flowchart|conceptmap",
  "nodes": [{ "id": "string", "label": "string", "description": "string", "depth": 0-3, "nodeType": "concept|process|example|analogy", "parentId": "string|null" }],
  "edges": [{ "id": "string", "source": "node-id", "target": "node-id", "label": "string", "edgeType": "contains|leads_to|depends_on|relates" }],
  "analogies": [{ "concept": "string", "realWorldExample": "string", "explanation": "string", "relatedNodeId": "string" }]
}`;

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'explain_concept',
        description: 'Generate a mental model to explain a concept with visual structure and real-world analogies.',
        inputSchema: {
          type: 'object',
          properties: {
            concept: { type: 'string', description: 'The concept or topic to explain' },
            diagramType: { type: 'string', enum: ['mindmap', 'flowchart', 'conceptmap'], default: 'mindmap', description: 'Type of diagram structure to use' },
            depth: { type: 'number', default: 2, description: 'How many levels deep to explain (1-3)' },
            context: { type: 'string', description: 'Additional context to tailor the explanation' },
          },
          required: ['concept'],
        },
      },
      {
        name: 'explain_code',
        description: 'Generate a mental model to explain code architecture, logic flow, or data flow.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'The code snippet to explain' },
            language: { type: 'string', description: 'Programming language' },
            focus: { type: 'string', enum: ['architecture', 'logic', 'data-flow', 'all'], default: 'all', description: 'What aspect to focus on' },
          },
          required: ['code'],
        },
      },
      {
        name: 'explain_file',
        description: "Generate a mental model explaining a file's purpose, structure, and role in the codebase.",
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path to the file' },
            fileContent: { type: 'string', description: 'Content of the file' },
            projectContext: { type: 'string', description: 'Brief description of the project' },
          },
          required: ['filePath', 'fileContent'],
        },
      },
      {
        name: 'explain_relationship',
        description: 'Generate a mental model showing how multiple components relate to each other.',
        inputSchema: {
          type: 'object',
          properties: {
            components: { type: 'array', items: { type: 'string' }, description: 'List of components/files/modules to analyze' },
            codeSnippets: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } }, description: 'Code snippets for each component' },
            question: { type: 'string', description: 'Specific question about the relationship' },
          },
          required: ['components'],
        },
      },
      {
        name: 'format_mental_model',
        description: 'Format a mental model as readable markdown with a visual diagram. By default only returns the formatted content for preview. Use save=true to write to file, and commit=true to also commit to git.',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'The mental model JSON content to format' },
            filename: { type: 'string', description: 'Filename for the mental model (e.g., "react-hooks"). Required if save=true.' },
            save: { type: 'boolean', default: false, description: 'If true, save to mental-models/ directory. Default is false (preview only).' },
            commit: { type: 'boolean', default: false, description: 'If true, also commit the file to git. Requires save=true.' },
            commitMessage: { type: 'string', description: 'Custom commit message (only used if commit is true).' },
          },
          required: ['content'],
        },
      },
    ],
  };
});

// Handle tool calls - return prompts for Claude to generate the mental model
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'explain_concept': {
      const { concept, diagramType = 'mindmap', depth = 2, context } = args as {
        concept: string;
        diagramType?: string;
        depth?: number;
        context?: string;
      };

      const prompt = `Create a mental model to explain: "${concept}"
${context ? `Context: ${context}\n` : ''}
Diagram type: ${diagramType}
Depth: ${depth} levels

Please generate a mental model with:
1. **${depth * 3}-${depth * 5} nodes** organized hierarchically (depth 0 = root, higher = more detail)
2. **Edges** connecting related nodes with labeled relationships
3. **2-3 real-world analogies** that make the concept tangible

Output format:
${MENTAL_MODEL_SCHEMA}

Node types: concept (core ideas), process (actions/steps), example (concrete instances), analogy (comparisons)
Edge types: contains, leads_to, depends_on, relates

Make analogies relatable - explain HOW the real-world example maps to the abstract concept.`;

      return {
        content: [{ type: 'text', text: prompt }],
      };
    }

    case 'explain_code': {
      const { code, language, focus = 'all' } = args as {
        code: string;
        language?: string;
        focus?: string;
      };

      const focusMap: Record<string, string> = {
        architecture: 'Focus: components & organization',
        logic: 'Focus: control flow & algorithms',
        'data-flow': 'Focus: data movement & transforms',
        all: 'Focus: architecture, logic, data flow',
      };

      const prompt = `Mental model for ${language || ''} code:
\`\`\`${language || ''}
${code}
\`\`\`
${focusMap[focus] || ''}
Include: nodes for key functions/classes, edges for interactions, 1+ analogy.
Output: ${MENTAL_MODEL_SCHEMA}`;

      return {
        content: [{ type: 'text', text: prompt }],
      };
    }

    case 'explain_file': {
      const { filePath, fileContent, projectContext } = args as {
        filePath: string;
        fileContent: string;
        projectContext?: string;
      };

      const prompt = `Mental model for file: ${filePath}
${projectContext ? `Project: ${projectContext}\n` : ''}\`\`\`
${fileContent}
\`\`\`
Include: main purpose (root), key exports/functions, dependencies, 1 analogy.
Output: ${MENTAL_MODEL_SCHEMA}`;

      return {
        content: [{ type: 'text', text: prompt }],
      };
    }

    case 'explain_relationship': {
      const { components, codeSnippets, question } = args as {
        components: string[];
        codeSnippets?: Array<{ name: string; code: string }>;
        question?: string;
      };

      const codeContext = codeSnippets?.length
        ? '\nCode:\n' + codeSnippets.map((s) => `${s.name}:\n\`\`\`\n${s.code}\n\`\`\``).join('\n')
        : '';

      const prompt = `Mental model for component relationships: ${components.join(', ')}${codeContext}${question ? `\nQ: ${question}` : ''}
Include: node per component, edges for interactions/dependencies, 1 analogy.
Output: ${MENTAL_MODEL_SCHEMA}`;

      return {
        content: [{ type: 'text', text: prompt }],
      };
    }

    case 'format_mental_model': {
      const { content, filename, save = false, commit = false, commitMessage } = args as {
        content: string;
        filename?: string;
        save?: boolean;
        commit?: boolean;
        commitMessage?: string;
      };

      try {
        // Convert JSON to readable markdown
        let markdownContent: string;
        let modelTitle = 'Mental Model';
        try {
          const model = JSON.parse(content);
          modelTitle = model.title || modelTitle;
          markdownContent = formatMentalModelAsMarkdown(model);
        } catch {
          // If it's not valid JSON, format as-is in a code block
          markdownContent = `# Mental Model\n\n\`\`\`json\n${content}\n\`\`\``;
        }

        // If save is false, just return the preview
        if (!save) {
          return {
            content: [
              {
                type: 'text',
                text: `**Preview** (not saved yet)\n\n---\n\n${markdownContent}`,
              },
            ],
          };
        }

        // Save requires filename
        if (!filename) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: filename is required when save=true',
              },
            ],
            isError: true,
          };
        }

        // Get the git repository root
        const { stdout: gitRoot } = await execAsync('git rev-parse --show-toplevel');
        const repoRoot = gitRoot.trim();

        // Create the mental-models directory if it doesn't exist
        const outputDir = join(repoRoot, 'mental-models');
        await mkdir(outputDir, { recursive: true });

        // Sanitize filename and ensure .md extension
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_\.]/g, '-').replace(/\.(json|md)$/, '');
        const finalFilename = `${sanitizedFilename}.md`;
        const filePath = join(outputDir, finalFilename);

        // Write the file
        await writeFile(filePath, markdownContent, 'utf-8');

        const relativePath = `mental-models/${finalFilename}`;
        let statusMessage = `**Saved to:** ${relativePath}`;

        // Optionally commit
        if (commit) {
          await execAsync(`git add "${relativePath}"`, { cwd: repoRoot });
          const message = commitMessage || `Add mental model: ${sanitizedFilename}`;
          await execAsync(`git commit -m "${message}"`, { cwd: repoRoot });
          statusMessage += `\n**Committed:** ${message}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: `${statusMessage}\n\n---\n\n${markdownContent}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Failed to format mental model: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Mental Model AI MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
