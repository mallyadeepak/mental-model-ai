import { useState } from 'react';
import { DiagramView } from '@mental-model/ui';
import { atlasModel, getPillarList } from '../content/index.js';
import { NodeInspector } from './NodeInspector.js';

interface AtlasViewProps {
  onOpenTopic: (id: string) => void;
}

export function AtlasView({ onOpenTopic }: AtlasViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const pillars = getPillarList();

  const handleNodeClick = (nodeId: string) => {
    if (nodeId === 'hub') {
      setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
      return;
    }
    onOpenTopic(nodeId);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 pt-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">The Atlas</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Ten pillars of LLM & agent system design, and how they relate. Click a pillar node, or a card below, to go deep.
        </p>
      </div>

      <div className="h-[42vh] min-h-[300px] px-6 pt-3">
        <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <DiagramView model={atlasModel} onNodeClick={handleNodeClick} selectedNodeId={selectedNodeId} />
        </div>
      </div>

      {selectedNodeId === 'hub' && (
        <div className="px-6 pt-4">
          <NodeInspector model={atlasModel} selectedNodeId={selectedNodeId} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {pillars.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpenTopic(p.id)}
              className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">{p.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{p.tagline}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
