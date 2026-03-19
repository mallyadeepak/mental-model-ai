import type { ConceptNode, ConceptEdge, MentalModel, Analogy } from '@mental-model/core';

export interface DiagramProps {
  model: MentalModel;
  onNodeClick?: (nodeId: string) => void;
  onNodeExpand?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  selectedNodeId?: string | null;
  className?: string;
}

export type NodeData = {
  node: ConceptNode;
  onExpand?: (nodeId: string) => void;
  isSelected?: boolean;
  isExpandable?: boolean;
  [key: string]: unknown;
};

export type EdgeData = {
  edge: ConceptEdge;
  [key: string]: unknown;
};

export interface AnalogyPanelProps {
  analogies: Analogy[];
  highlightedNodeId?: string | null;
  className?: string;
}

export interface TooltipProps {
  node: ConceptNode | null;
  position?: { x: number; y: number };
  visible: boolean;
}
