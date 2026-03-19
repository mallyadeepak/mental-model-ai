import type { TooltipProps } from '../types.js';

const nodeTypeLabels: Record<string, string> = {
  concept: 'Concept',
  process: 'Process',
  example: 'Example',
  analogy: 'Analogy',
};

export function NodeTooltip({ node, position, visible }: TooltipProps) {
  if (!visible || !node) {
    return null;
  }

  return (
    <div
      className="
        fixed z-50 pointer-events-none
        bg-gray-900 text-white rounded-lg shadow-xl
        p-3 max-w-[300px]
        transition-opacity duration-150
      "
      style={{
        left: position?.x ?? 0,
        top: position?.y ?? 0,
        transform: 'translate(-50%, -100%) translateY(-10px)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
          {nodeTypeLabels[node.nodeType] || 'Node'}
        </span>
        <span className="text-xs text-gray-400">
          Depth: {node.depth}
        </span>
      </div>
      <h4 className="font-semibold text-sm mb-1">{node.label}</h4>
      <p className="text-xs text-gray-300 leading-relaxed">
        {node.description}
      </p>
      {node.expandable && (
        <p className="text-xs text-blue-300 mt-2 flex items-center gap-1">
          <span>Click to expand</span>
          <span>↓</span>
        </p>
      )}

      {/* Tooltip arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full"
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid rgb(17, 24, 39)',
        }}
      />
    </div>
  );
}
