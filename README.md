# Mental Model AI

An interactive tool that explains complex concepts through visual mental model diagrams with real-world analogies. Powered by AI (Anthropic Claude or OpenAI GPT).

## Features

- Generate hierarchical mind maps, flowcharts, and concept maps
- Real-world analogies to make abstract concepts tangible
- Interactive node expansion for deeper exploration
- Support for multiple AI providers (Anthropic Claude, OpenAI)
- MCP server for Claude Code integration
- React component library for custom integrations

## Project Structure

```
mental-model-ai/
├── packages/
│   ├── core/           # Core AI logic and data structures
│   ├── ui/             # React visualization components
│   ├── web/            # Full-featured web application
│   └── mcp-server/     # MCP server for Claude Code
├── package.json        # Root workspace configuration
└── turbo.json          # Turbo build pipeline
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/mallyadeepak/mental-model-ai.git
cd mental-model-ai

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Environment Setup

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env

# Add your API key (at least one required)
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...
```

---

## Usage

### 1. As an MCP Server (Claude Code Plugin)

The MCP server allows Claude Code to generate mental model diagrams directly in your terminal.

#### Installation

**Option A: Local Installation (for development)**

Add to your Claude Code configuration file (`~/.claude/claude_code_config.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "mental-model": {
      "command": "node",
      "args": ["/path/to/mental-model-ai/packages/mcp-server/dist/index.js"]
    }
  }
}
```

**Option B: npx (after publishing to npm)**

```json
{
  "mcpServers": {
    "mental-model": {
      "command": "npx",
      "args": ["@mental-model/mcp-server"]
    }
  }
}
```

#### Available Tools

Once configured, Claude Code will have access to these tools:

| Tool | Description |
|------|-------------|
| `explain_concept` | Generate a mental model for any concept |
| `explain_code` | Create visual diagrams from code snippets |
| `explain_file` | Document a file's purpose and structure |
| `explain_relationship` | Visualize how components relate |

#### Examples

```
# In Claude Code, just ask:
> Explain the concept of dependency injection using a mental model

> Use explain_code to analyze this React component

> Show me how these three files relate to each other
```

---

### 2. As a React Component Library

Import the UI components into your React application.

#### Installation

```bash
# Install the packages
pnpm add @mental-model/core @mental-model/ui
```

#### Usage

```tsx
import { MentalModelGenerator } from '@mental-model/core';
import { DiagramView, AnalogyPanel } from '@mental-model/ui';

// Initialize the generator
const generator = new MentalModelGenerator({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-20250514', // optional
});

// Generate a mental model
const result = await generator.generate({
  query: 'How does React's virtual DOM work?',
  diagramType: 'mindmap',
  depth: 2,
});

if (result.success && result.model) {
  // Render the diagram
  return (
    <div className="flex">
      <DiagramView
        model={result.model}
        onNodeClick={(nodeId) => console.log('Clicked:', nodeId)}
        onExpandNode={(nodeId) => generator.expand({ nodeId, currentModel: result.model })}
      />
      <AnalogyPanel
        analogies={result.model.analogies}
        selectedNodeId={selectedNode}
      />
    </div>
  );
}
```

---

### 3. As a Standalone Web Application

Run the full-featured web app locally.

```bash
# Start development server
pnpm dev

# Or build for production
pnpm build
cd packages/web
pnpm preview
```

Open http://localhost:5173 in your browser.

---

### 4. Core Library Only

Use just the core generation logic without UI.

```typescript
import {
  MentalModelGenerator,
  createGenerator,
  type MentalModel,
  type GenerationRequest,
} from '@mental-model/core';

// Using the factory function
const generator = createGenerator({
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o',
});

// Generate a mental model
const result = await generator.generate({
  query: 'Explain microservices architecture',
  diagramType: 'flowchart',
  context: 'For a team new to distributed systems',
});

// Expand a node for more detail
const expanded = await generator.expand({
  nodeId: 'node-2',
  currentModel: result.model!,
});
```

---

## API Reference

### Core Types

```typescript
// Diagram types
type DiagramType = 'mindmap' | 'flowchart' | 'conceptmap';

// Node types
type NodeType = 'concept' | 'process' | 'example' | 'analogy';

// Mental model structure
interface MentalModel {
  id: string;
  title: string;
  summary: string;
  diagramType: DiagramType;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  analogies: Analogy[];
}

// Node structure
interface ConceptNode {
  id: string;
  label: string;
  description: string;
  depth: number;
  expandable: boolean;
  nodeType: NodeType;
  parentId?: string;
  position?: { x: number; y: number };
}

// Edge structure
interface ConceptEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  edgeType?: 'relates' | 'contains' | 'leads_to' | 'depends_on';
}

// Analogy structure
interface Analogy {
  concept: string;
  realWorldExample: string;
  explanation: string;
  relatedNodeId: string;
}
```

### MentalModelGenerator

```typescript
class MentalModelGenerator {
  constructor(config: AIProviderConfig);

  // Generate a new mental model
  generate(request: GenerationRequest): Promise<GenerationResult>;

  // Expand a node with more detail
  expand(request: ExpansionRequest): Promise<GenerationResult>;
}

interface AIProviderConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model?: string; // Optional, uses defaults
}

interface GenerationRequest {
  query: string;
  diagramType?: DiagramType;
  depth?: number;        // 1-3, default: 2
  context?: string;      // Additional context
}

interface GenerationResult {
  success: boolean;
  model?: MentalModel;
  error?: string;
}
```

---

## Development

### Commands

```bash
# Install dependencies
pnpm install

# Development mode (all packages)
pnpm dev

# Build all packages
pnpm build

# Type checking
pnpm typecheck

# Run tests
pnpm test

# Clean build artifacts
pnpm clean
```

### Package-specific Development

```bash
# Core library
cd packages/core
pnpm dev      # Watch mode
pnpm test     # Run tests

# UI components
cd packages/ui
pnpm dev      # Watch mode

# Web app
cd packages/web
pnpm dev      # Start dev server at http://localhost:5173

# MCP server
cd packages/mcp-server
pnpm dev      # Watch mode
pnpm start    # Run the server
```

---

## Configuration

### Supported AI Models

**Anthropic (default)**
- `claude-sonnet-4-20250514` (default)
- `claude-opus-4-20250514`
- `claude-3-5-sonnet-20241022`

**OpenAI**
- `gpt-4o` (default)
- `gpt-4-turbo`
- `gpt-4`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key | One of these |
| `OPENAI_API_KEY` | OpenAI API key | is required |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Applications                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Web App       │   MCP Server    │   Your Custom App       │
│ (packages/web)  │(packages/mcp)   │                         │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    @mental-model/ui                          │
│              React visualization components                  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   @mental-model/core                         │
│         AI generation logic, types, validation               │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│    Anthropic Claude     │     │        OpenAI GPT           │
└─────────────────────────┘     └─────────────────────────────┘
```

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Built with [React Flow](https://reactflow.dev/) for graph visualization
- AI powered by [Anthropic Claude](https://anthropic.com) and [OpenAI](https://openai.com)
- MCP integration via [@modelcontextprotocol/sdk](https://github.com/anthropics/mcp)
