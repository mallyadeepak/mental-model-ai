import type { MentalModel } from '@mental-model/core';

interface NodeInspectorProps {
  model: MentalModel;
  selectedNodeId: string | null;
}

export function NodeInspector({ model, selectedNodeId }: NodeInspectorProps) {
  const node =
    model.nodes.find((n) => n.id === selectedNodeId) ?? model.nodes.find((n) => n.depth === 0);
  if (!node) return null;

  const analogies = model.analogies.filter((a) => a.relatedNodeId === node.id);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
        {selectedNodeId ? 'Selected node' : 'Overview'}
      </div>
      <div className="font-semibold text-gray-900 dark:text-white">{node.label}</div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{node.description}</p>

      {analogies.map((a, i) => (
        <div key={i} className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
            <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
              {a.concept}
            </span>
            <span className="text-gray-400 dark:text-gray-500">&harr;</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
              {a.realWorldExample}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{a.explanation}</p>
        </div>
      ))}
    </div>
  );
}
