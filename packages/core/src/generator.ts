import type { AIProvider } from './providers/base.js';
import { createProvider } from './providers/index.js';
import type {
  AIProviderConfig,
  MentalModel,
  GenerationRequest,
  ExpansionRequest,
  GenerationResult,
} from './types.js';
import { SYSTEM_PROMPT } from './prompts/system.js';
import { buildGenerationPrompt, buildExpansionPrompt } from './prompts/generation.js';
import { parseMentalModel, parseExpansion, generateId } from './parser.js';

export class MentalModelGenerator {
  private provider: AIProvider;

  constructor(config: AIProviderConfig) {
    this.provider = createProvider(config);
  }

  /**
   * Generate a new mental model from a query
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const {
      query,
      diagramType = 'mindmap',
      context,
    } = request;

    try {
      const prompt = buildGenerationPrompt(query, diagramType, context);
      const response = await this.provider.generateCompletion(prompt, SYSTEM_PROMPT);

      const parseResult = parseMentalModel(response.content);

      if (!parseResult.success || !parseResult.data) {
        return {
          success: false,
          error: parseResult.error || 'Failed to parse response',
        };
      }

      // Ensure unique ID
      const model: MentalModel = {
        ...parseResult.data,
        id: generateId('model'),
      };

      // Calculate positions for nodes if not present
      this.calculateNodePositions(model);

      return {
        success: true,
        model,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
      };
    }
  }

  /**
   * Expand a node to generate deeper explanations
   */
  async expand(request: ExpansionRequest): Promise<GenerationResult> {
    const { nodeId, currentModel } = request;

    const nodeToExpand = currentModel.nodes.find((n) => n.id === nodeId);
    if (!nodeToExpand) {
      return {
        success: false,
        error: `Node ${nodeId} not found`,
      };
    }

    try {
      const prompt = buildExpansionPrompt(
        nodeToExpand.label,
        nodeToExpand.description,
        currentModel
      );
      const response = await this.provider.generateCompletion(prompt, SYSTEM_PROMPT);

      const parseResult = parseExpansion(response.content);

      if (!parseResult.success || !parseResult.data) {
        return {
          success: false,
          error: parseResult.error || 'Failed to parse expansion',
        };
      }

      // Merge new nodes/edges/analogies into the model
      const updatedModel: MentalModel = {
        ...currentModel,
        nodes: [...currentModel.nodes, ...parseResult.data.nodes],
        edges: [...currentModel.edges, ...parseResult.data.edges],
        analogies: [...currentModel.analogies, ...parseResult.data.analogies],
      };

      // Mark the original node as no longer expandable (already expanded)
      const expandedNodeIndex = updatedModel.nodes.findIndex((n) => n.id === nodeId);
      if (expandedNodeIndex !== -1) {
        updatedModel.nodes[expandedNodeIndex] = {
          ...updatedModel.nodes[expandedNodeIndex],
          expandable: false,
        };
      }

      // Recalculate positions
      this.calculateNodePositions(updatedModel);

      return {
        success: true,
        model: updatedModel,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Expansion failed',
      };
    }
  }

  /**
   * Calculate node positions for visualization
   * Uses a simple hierarchical layout based on depth and parent relationships
   */
  private calculateNodePositions(model: MentalModel): void {
    const nodesByDepth = new Map<number, typeof model.nodes>();

    // Group nodes by depth
    for (const node of model.nodes) {
      const depth = node.depth;
      if (!nodesByDepth.has(depth)) {
        nodesByDepth.set(depth, []);
      }
      nodesByDepth.get(depth)!.push(node);
    }

    // Position nodes at each depth level
    const horizontalSpacing = 250;
    const verticalSpacing = 150;

    for (const [depth, nodes] of nodesByDepth) {
      const levelWidth = nodes.length * horizontalSpacing;
      const startX = -levelWidth / 2 + horizontalSpacing / 2;

      nodes.forEach((node, index) => {
        node.position = {
          x: startX + index * horizontalSpacing,
          y: depth * verticalSpacing,
        };
      });
    }
  }
}

/**
 * Create a mental model generator with the given provider configuration
 */
export function createGenerator(config: AIProviderConfig): MentalModelGenerator {
  return new MentalModelGenerator(config);
}
