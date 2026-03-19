import { z } from 'zod';
import type { MentalModelGenerator } from '@mental-model/core';
import type { MentalModel } from '@mental-model/core';

export const explainConceptSchema = z.object({
  concept: z.string().describe('The concept or topic to explain'),
  diagramType: z
    .enum(['mindmap', 'flowchart', 'conceptmap'])
    .default('mindmap')
    .describe('Type of diagram to generate'),
  context: z.string().optional().describe('Additional context to help with explanation'),
});

export type ExplainConceptInput = z.infer<typeof explainConceptSchema>;

export async function explainConcept(
  generator: MentalModelGenerator,
  input: ExplainConceptInput
): Promise<{ model: MentalModel | null; error?: string }> {
  const result = await generator.generate({
    query: input.concept,
    diagramType: input.diagramType,
    context: input.context,
  });

  if (result.success && result.model) {
    return { model: result.model };
  }

  return { model: null, error: result.error };
}

export function formatModelAsText(model: MentalModel): string {
  const lines: string[] = [];

  lines.push(`# ${model.title}`);
  lines.push('');
  lines.push(`**Summary:** ${model.summary}`);
  lines.push('');
  lines.push(`**Diagram Type:** ${model.diagramType}`);
  lines.push('');

  // Nodes section
  lines.push('## Concepts');
  lines.push('');

  // Group nodes by depth
  const nodesByDepth = new Map<number, typeof model.nodes>();
  for (const node of model.nodes) {
    if (!nodesByDepth.has(node.depth)) {
      nodesByDepth.set(node.depth, []);
    }
    nodesByDepth.get(node.depth)!.push(node);
  }

  // Output nodes by depth level
  const depths = Array.from(nodesByDepth.keys()).sort();
  for (const depth of depths) {
    const nodes = nodesByDepth.get(depth)!;
    const indent = '  '.repeat(depth);

    for (const node of nodes) {
      const expandable = node.expandable ? ' [+]' : '';
      const typeIcon = {
        concept: '💡',
        process: '⚙️',
        example: '📌',
        analogy: '🔗',
      }[node.nodeType] || '•';

      lines.push(`${indent}${typeIcon} **${node.label}**${expandable}`);
      lines.push(`${indent}  ${node.description}`);
      lines.push('');
    }
  }

  // Relationships section
  if (model.edges.length > 0) {
    lines.push('## Relationships');
    lines.push('');

    for (const edge of model.edges) {
      const sourceNode = model.nodes.find((n) => n.id === edge.source);
      const targetNode = model.nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        const label = edge.label ? ` (${edge.label})` : '';
        lines.push(`- ${sourceNode.label} → ${targetNode.label}${label}`);
      }
    }
    lines.push('');
  }

  // Analogies section
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

  return lines.join('\n');
}
