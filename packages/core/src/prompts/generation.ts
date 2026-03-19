import type { DiagramType, MentalModel } from '../types.js';
import { DIAGRAM_TYPE_INSTRUCTIONS } from './system.js';

export function buildGenerationPrompt(
  query: string,
  diagramType: DiagramType = 'mindmap',
  context?: string
): string {
  const diagramInstructions = DIAGRAM_TYPE_INSTRUCTIONS[diagramType];

  return `Create a mental model to explain the following concept:

**Query**: ${query}
${context ? `\n**Additional Context**: ${context}` : ''}

**Diagram Type**: ${diagramType}
${diagramInstructions}

Generate a JSON response with the following structure (respond ONLY with valid JSON, no markdown code blocks):

{
  "id": "unique-id",
  "title": "Clear, concise title for this mental model",
  "summary": "A 1-2 sentence overview of the concept",
  "diagramType": "${diagramType}",
  "nodes": [
    {
      "id": "node-1",
      "label": "Short node label",
      "description": "Detailed description of this concept (1-2 sentences)",
      "depth": 0,
      "expandable": true,
      "nodeType": "concept",
      "parentId": null
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "label": "relationship description",
      "edgeType": "contains"
    }
  ],
  "analogies": [
    {
      "concept": "The abstract concept being explained",
      "realWorldExample": "A familiar real-world thing",
      "explanation": "How the real-world example maps to the abstract concept",
      "relatedNodeId": "node-1"
    }
  ]
}

Requirements:
1. Create 5-10 nodes with proper parent-child relationships via parentId
2. Include at least 2-3 real-world analogies to make concepts tangible
3. Set expandable=true for nodes that could have deeper explanations
4. Use appropriate nodeType: concept (for ideas), process (for actions/steps), example (for concrete instances), analogy (for comparisons)
5. Edge types: relates, contains, leads_to, depends_on
6. Depth 0 is the root, depth 1 for direct children, etc.
7. Ensure all edge source/target IDs reference existing node IDs`;
}

export function buildExpansionPrompt(
  nodeLabel: string,
  nodeDescription: string,
  parentContext: MentalModel
): string {
  return `Expand on this concept from a mental model:

**Node to Expand**: ${nodeLabel}
**Current Description**: ${nodeDescription}
**Parent Mental Model Title**: ${parentContext.title}
**Parent Summary**: ${parentContext.summary}

Generate a JSON response with additional nodes and edges that provide deeper explanation. Use the same structure as before, but:
1. Create 3-5 new child nodes that explain this concept in more detail
2. Include at least 1 new analogy
3. All new nodes should have depth = (previous depth + 1)
4. Set parentId on new nodes to reference the expanded node
5. Respond ONLY with valid JSON, no markdown

{
  "nodes": [...],
  "edges": [...],
  "analogies": [...]
}`;
}
