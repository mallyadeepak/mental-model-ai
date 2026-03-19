import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { DiagramProps, NodeData, EdgeData } from '../types.js';
import { ConceptNodeComponent } from '../nodes/ConceptNodeComponent.js';
import { ConceptEdgeComponent } from '../edges/ConceptEdgeComponent.js';

const nodeTypes: NodeTypes = {
  concept: ConceptNodeComponent as NodeTypes[string],
};

const edgeTypes: EdgeTypes = {
  concept: ConceptEdgeComponent as EdgeTypes[string],
};

export function FlowChart({
  model,
  onNodeClick,
  onNodeExpand,
  onNodeHover,
  selectedNodeId,
  className = '',
}: DiagramProps) {
  // Convert model nodes to React Flow nodes with flowchart-style positioning
  const initialNodes: Node<NodeData>[] = useMemo(() => {
    return model.nodes.map((node, index) => ({
      id: node.id,
      type: 'concept',
      position: node.position || { x: 0, y: index * 150 },
      data: {
        node,
        onExpand: onNodeExpand,
        isSelected: node.id === selectedNodeId,
        isExpandable: node.expandable,
      },
    }));
  }, [model.nodes, onNodeExpand, selectedNodeId]);

  // Convert model edges to React Flow edges with animated arrows
  const initialEdges: Edge<EdgeData>[] = useMemo(() => {
    return model.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'concept',
      label: edge.label,
      animated: edge.edgeType === 'leads_to',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      data: { edge },
    }));
  }, [model.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  const handleNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeHover?.(node.id);
    },
    [onNodeHover]
  );

  const handleNodeMouseLeave = useCallback(() => {
    onNodeHover?.(null);
  }, [onNodeHover]);

  return (
    <div className={`w-full h-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 1.2,
        }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls className="bg-white rounded-lg shadow-lg" />
        <MiniMap className="bg-white rounded-lg shadow-lg" />
        <Background variant={BackgroundVariant.Lines} gap={30} size={1} />
      </ReactFlow>
    </div>
  );
}
