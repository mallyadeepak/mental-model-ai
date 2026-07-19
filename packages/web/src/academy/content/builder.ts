import type { ConceptEdge, ConceptNode, MentalModel, NodeType, Analogy } from '@mental-model/core';
import { layoutByDepth } from './layout.js';

export interface NodeSpec {
  id: string;
  label: string;
  description: string;
  depth: number;
  nodeType: NodeType;
}

export interface EdgeSpec {
  source: string;
  target: string;
  label?: string;
  edgeType?: ConceptEdge['edgeType'];
}

export interface AnalogySpec {
  concept: string;
  realWorldExample: string;
  explanation: string;
  relatedNodeId: string;
}

export interface BuildModelOptions {
  id: string;
  title: string;
  summary: string;
  nodes: NodeSpec[];
  edges: EdgeSpec[];
  analogies?: AnalogySpec[];
}

/**
 * Builds a validated MentalModel from a compact authoring spec, computing
 * layout positions automatically. All Academy content is authored this way
 * so it renders through the same diagram engine as the AI generator.
 */
export function buildModel({ id, title, summary, nodes, edges, analogies = [] }: BuildModelOptions): MentalModel {
  const positions = layoutByDepth(nodes);

  const conceptNodes: ConceptNode[] = nodes.map((node) => ({
    id: node.id,
    label: node.label,
    description: node.description,
    depth: node.depth,
    expandable: false,
    nodeType: node.nodeType,
    position: positions.get(node.id) ?? { x: 0, y: 0 },
  }));

  const conceptEdges: ConceptEdge[] = edges.map((edge, index) => ({
    id: `${id}-edge-${index}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    edgeType: edge.edgeType ?? 'relates',
  }));

  const conceptAnalogies: Analogy[] = analogies.map((a) => ({
    concept: a.concept,
    realWorldExample: a.realWorldExample,
    explanation: a.explanation,
    relatedNodeId: a.relatedNodeId,
  }));

  return {
    id,
    title,
    summary,
    diagramType: 'mindmap',
    nodes: conceptNodes,
    edges: conceptEdges,
    analogies: conceptAnalogies,
  };
}
