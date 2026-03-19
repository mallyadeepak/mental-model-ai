import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeData } from '../types.js';

const nodeTypeStyles: Record<string, { bg: string; border: string; icon: string }> = {
  concept: { bg: 'bg-blue-50', border: 'border-blue-400', icon: '💡' },
  process: { bg: 'bg-green-50', border: 'border-green-400', icon: '⚙️' },
  example: { bg: 'bg-amber-50', border: 'border-amber-400', icon: '📌' },
  analogy: { bg: 'bg-purple-50', border: 'border-purple-400', icon: '🔗' },
};

interface ConceptNodeProps {
  data: NodeData;
}

export const ConceptNodeComponent = memo(function ConceptNodeComponent({
  data,
}: ConceptNodeProps) {
  const { node, onExpand, isSelected, isExpandable } = data;
  const styles = nodeTypeStyles[node.nodeType] || nodeTypeStyles.concept;

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExpand && isExpandable) {
      onExpand(node.id);
    }
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 shadow-md min-w-[180px] max-w-[280px]
        transition-all duration-200 cursor-pointer
        ${styles.bg} ${styles.border}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        hover:shadow-lg hover:scale-105
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">{styles.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 text-sm leading-tight">
            {node.label}
          </div>
          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
            {node.description}
          </div>
        </div>
      </div>

      {isExpandable && (
        <button
          onClick={handleExpandClick}
          className="
            mt-2 w-full py-1 px-2 text-xs rounded
            bg-white/50 hover:bg-white/80 border border-gray-300
            text-gray-600 hover:text-gray-800
            transition-colors duration-150
            flex items-center justify-center gap-1
          "
        >
          <span>Expand</span>
          <span className="text-[10px]">▼</span>
        </button>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400"
      />
    </div>
  );
});
