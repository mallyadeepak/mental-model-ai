import {
  MentalModelSchema,
  ConceptNodeSchema,
  ConceptEdgeSchema,
  AnalogySchema,
  type MentalModel,
  type ConceptNode,
  type ConceptEdge,
  type Analogy,
} from './types.js';

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Extract JSON from a string that might contain markdown code blocks or other text
 */
function extractJSON(text: string): string {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find raw JSON object or array
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  return text.trim();
}

/**
 * Parse a raw LLM response into a MentalModel
 */
export function parseMentalModel(rawResponse: string): ParseResult<MentalModel> {
  try {
    const jsonString = extractJSON(rawResponse);
    const parsed = JSON.parse(jsonString);
    const validated = MentalModelSchema.parse(parsed);

    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse mental model',
    };
  }
}

/**
 * Parse expansion response (nodes, edges, analogies only)
 */
export function parseExpansion(rawResponse: string): ParseResult<{
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  analogies: Analogy[];
}> {
  try {
    const jsonString = extractJSON(rawResponse);
    const parsed = JSON.parse(jsonString);

    const nodes = parsed.nodes?.map((n: unknown) => ConceptNodeSchema.parse(n)) || [];
    const edges = parsed.edges?.map((e: unknown) => ConceptEdgeSchema.parse(e)) || [];
    const analogies = parsed.analogies?.map((a: unknown) => AnalogySchema.parse(a)) || [];

    return {
      success: true,
      data: { nodes, edges, analogies },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse expansion',
    };
  }
}

/**
 * Generate a unique ID for nodes/edges
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
