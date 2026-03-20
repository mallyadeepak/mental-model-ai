#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

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
