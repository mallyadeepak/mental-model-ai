import type { AnalogyPanelProps } from '../types.js';

export function AnalogyPanel({
  analogies,
  highlightedNodeId,
  className = '',
}: AnalogyPanelProps) {
  const relevantAnalogies = highlightedNodeId
    ? analogies.filter((a) => a.relatedNodeId === highlightedNodeId)
    : analogies;

  if (analogies.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span>🔗</span>
          <span>Real-World Analogies</span>
        </h3>
        {highlightedNodeId && relevantAnalogies.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Showing analogies for selected node
          </p>
        )}
      </div>

      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {(relevantAnalogies.length > 0 ? relevantAnalogies : analogies).map((analogy, index) => (
          <div
            key={`${analogy.relatedNodeId}-${index}`}
            className={`
              p-3 rounded-lg border transition-colors duration-200
              ${analogy.relatedNodeId === highlightedNodeId
                ? 'bg-purple-50 border-purple-300'
                : 'bg-gray-50 border-gray-200'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                {analogy.concept}
              </span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                {analogy.realWorldExample}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {analogy.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
