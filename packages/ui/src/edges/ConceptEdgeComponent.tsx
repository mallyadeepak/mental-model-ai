import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Position,
} from '@xyflow/react';
import type { EdgeData } from '../types.js';

const edgeTypeColors: Record<string, string> = {
  relates: '#6b7280',
  contains: '#3b82f6',
  leads_to: '#10b981',
  depends_on: '#f59e0b',
};

interface ConceptEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: EdgeData;
  label?: string;
  markerEnd?: string;
}

export const ConceptEdgeComponent = memo(function ConceptEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  markerEnd,
}: ConceptEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeType = data?.edge?.edgeType || 'relates';
  const strokeColor = edgeTypeColors[edgeType] || edgeTypeColors.relates;
  const displayLabel = label || data?.edge?.label;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
        }}
      />
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="
              px-2 py-0.5 rounded text-xs font-medium
              bg-white border border-gray-200 shadow-sm
              text-gray-600
            "
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
