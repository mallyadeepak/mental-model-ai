// Types
export type {
  DiagramType,
  NodeType,
  ConceptNode,
  ConceptEdge,
  Analogy,
  MentalModel,
  GenerationRequest,
  ExpansionRequest,
  GenerationResult,
  AIProviderType,
  AIProviderConfig,
  ProviderResponse,
} from './types.js';

export {
  ConceptNodeSchema,
  ConceptEdgeSchema,
  AnalogySchema,
  MentalModelSchema,
} from './types.js';

// Providers
export {
  createProvider,
  AnthropicProvider,
  OpenAIProvider,
  type AIProvider,
} from './providers/index.js';

// Generator
export { MentalModelGenerator, createGenerator } from './generator.js';

// Parser utilities
export { parseMentalModel, parseExpansion, generateId } from './parser.js';

// Prompts (for custom usage)
export {
  SYSTEM_PROMPT,
  DIAGRAM_TYPE_INSTRUCTIONS,
  buildGenerationPrompt,
  buildExpansionPrompt,
} from './prompts/index.js';
