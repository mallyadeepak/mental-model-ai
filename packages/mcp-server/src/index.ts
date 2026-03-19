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

// Mental model JSON structure template
const MENTAL_MODEL_SCHEMA = `{
  "title": "Clear title for this mental model",
  "summary": "1-2 sentence overview",
  "diagramType": "mindmap|flowchart|conceptmap",
  "nodes": [
    {
      "id": "unique-id",
      "label": "Short label",
      "description": "1-2 sentence description",
      "depth": 0,
      "nodeType": "concept|process|example|analogy",
      "parentId": "parent-node-id or null"
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "label": "relationship",
      "edgeType": "contains|leads_to|depends_on|relates"
    }
  ],
  "analogies": [
    {
      "concept": "The abstract concept",
      "realWorldExample": "Familiar real-world thing",
      "explanation": "How they map to each other",
      "relatedNodeId": "node-id"
    }
  ]
}`;

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'explain_concept',
        description: `Generate a mental model to explain a concept with visual structure and real-world analogies.

Returns a structured mental model with:
- Hierarchical nodes (concepts, processes, examples, analogies)
- Edges showing relationships between nodes
- Real-world analogies to make abstract concepts tangible

The output can be visualized as a mind map, flowchart, or concept map.`,
        inputSchema: {
          type: 'object',
          properties: {
            concept: {
              type: 'string',
              description: 'The concept or topic to explain',
            },
            diagramType: {
              type: 'string',
              enum: ['mindmap', 'flowchart', 'conceptmap'],
              default: 'mindmap',
              description: 'Type of diagram structure to use',
            },
            depth: {
              type: 'number',
              default: 2,
              description: 'How many levels deep to explain (1-3)',
            },
            context: {
              type: 'string',
              description: 'Additional context to tailor the explanation',
            },
          },
          required: ['concept'],
        },
      },
      {
        name: 'explain_code',
        description: `Generate a mental model to explain code architecture, logic flow, or data flow.

Analyzes code and creates a visual mental model showing:
- Key components and their responsibilities
- How components interact
- Control flow or data transformations
- Patterns and abstractions used`,
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The code snippet to explain',
            },
            language: {
              type: 'string',
              description: 'Programming language',
            },
            focus: {
              type: 'string',
              enum: ['architecture', 'logic', 'data-flow', 'all'],
              default: 'all',
              description: 'What aspect to focus on',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'explain_file',
        description: `Generate a mental model explaining a file's purpose, structure, and role in the codebase.

Creates a visual breakdown of:
- The file's main responsibility
- Key exports and their purposes
- Dependencies and relationships
- How it fits into the larger system`,
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file',
            },
            fileContent: {
              type: 'string',
              description: 'Content of the file',
            },
            projectContext: {
              type: 'string',
              description: 'Brief description of the project',
            },
          },
          required: ['filePath', 'fileContent'],
        },
      },
      {
        name: 'explain_relationship',
        description: `Generate a mental model showing how multiple components relate to each other.

Visualizes:
- Interactions between components
- Data or control flow
- Dependencies and coupling
- Interface contracts`,
        inputSchema: {
          type: 'object',
          properties: {
            components: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of components/files/modules to analyze',
            },
            codeSnippets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                },
              },
              description: 'Code snippets for each component',
            },
            question: {
              type: 'string',
              description: 'Specific question about the relationship',
            },
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

Output the mental model in this JSON structure:
${MENTAL_MODEL_SCHEMA}

Node types to use:
- "concept": Core ideas and principles
- "process": Actions, steps, or transformations
- "example": Concrete instances
- "analogy": Comparisons to familiar things

Edge types:
- "contains": Parent contains child
- "leads_to": Sequential flow
- "depends_on": Dependency relationship
- "relates": General association

Make the analogies relatable and explain HOW the real-world example maps to the abstract concept.`;

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

      const focusInstructions = {
        architecture: 'Focus on components, modules, and their organization.',
        logic: 'Focus on control flow, algorithms, and decision points.',
        'data-flow': 'Focus on how data moves and transforms through the code.',
        all: 'Cover architecture, logic flow, and data transformations.',
      }[focus] || '';

      const prompt = `Create a mental model to explain this ${language || ''} code:

\`\`\`${language || ''}
${code}
\`\`\`

${focusInstructions}

Generate a mental model JSON with:
1. Nodes for key functions, classes, or components
2. Edges showing how they interact
3. At least 1 analogy to make the code's purpose clear

Output format:
${MENTAL_MODEL_SCHEMA}`;

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

      const prompt = `Create a mental model explaining this file: ${filePath}

${projectContext ? `Project context: ${projectContext}\n` : ''}

File content:
\`\`\`
${fileContent}
\`\`\`

Generate a mental model JSON showing:
1. The file's main purpose (root node)
2. Key exports, functions, or classes
3. Dependencies and how it connects to other parts
4. An analogy for what role this file plays

Output format:
${MENTAL_MODEL_SCHEMA}`;

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

      let codeContext = '';
      if (codeSnippets?.length) {
        codeContext = '\nRelevant code:\n' + codeSnippets
          .map((s) => `### ${s.name}\n\`\`\`\n${s.code}\n\`\`\``)
          .join('\n\n');
      }

      const prompt = `Create a mental model showing how these components relate: ${components.join(', ')}
${codeContext}
${question ? `\nSpecific question: ${question}` : ''}

Generate a mental model JSON showing:
1. Each component as a node
2. Edges showing their interactions and dependencies
3. An analogy for how they work together as a system

Output format:
${MENTAL_MODEL_SCHEMA}`;

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
