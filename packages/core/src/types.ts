import { z } from 'zod';

// Diagram types supported by the system
export type DiagramType = 'mindmap' | 'flowchart' | 'conceptmap';

// Node types for different kinds of concepts
export type NodeType = 'concept' | 'process' | 'example' | 'analogy';

// Zod schemas for validation
export const ConceptNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  depth: z.number().int().min(0),
  expandable: z.boolean(),
  nodeType: z.enum(['concept', 'process', 'example', 'analogy']),
  parentId: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

export const ConceptEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  edgeType: z.enum(['relates', 'contains', 'leads_to', 'depends_on']).optional(),
});

export const AnalogySchema = z.object({
  concept: z.string(),
  realWorldExample: z.string(),
  explanation: z.string(),
  relatedNodeId: z.string(),
});

export const MentalModelSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  diagramType: z.enum(['mindmap', 'flowchart', 'conceptmap']),
  nodes: z.array(ConceptNodeSchema),
  edges: z.array(ConceptEdgeSchema),
  analogies: z.array(AnalogySchema),
});

// TypeScript types derived from schemas
export type ConceptNode = z.infer<typeof ConceptNodeSchema>;
export type ConceptEdge = z.infer<typeof ConceptEdgeSchema>;
export type Analogy = z.infer<typeof AnalogySchema>;
export type MentalModel = z.infer<typeof MentalModelSchema>;

// Request/Response types
export interface GenerationRequest {
  query: string;
  diagramType?: DiagramType;
  depth?: number;
  context?: string;
}

export interface ExpansionRequest {
  nodeId: string;
  currentModel: MentalModel;
  depth?: number;
}

export interface GenerationResult {
  success: boolean;
  model?: MentalModel;
  error?: string;
}

// AI Provider configuration
export type AIProviderType = 'anthropic' | 'openai';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model?: string;
}

// Provider response format
export interface ProviderResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
