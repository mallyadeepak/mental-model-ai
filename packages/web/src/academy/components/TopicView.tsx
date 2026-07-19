import { useEffect, useState } from 'react';
import { DiagramView } from '@mental-model/ui';
import type { TopicContent } from '../types.js';
import { NodeInspector } from './NodeInspector.js';
import { PrinciplesList } from './PrinciplesList.js';
import { TradeoffTable } from './TradeoffTable.js';
import { FrameworksGrid } from './FrameworksGrid.js';
import { CodeBlock } from './CodeBlock.js';

interface TopicViewProps {
  topic: TopicContent;
  onNavigate: (id: string) => void;
}

export function TopicView({ topic, onNavigate }: TopicViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedNodeId(null);
  }, [topic.id]);

  const handleNodeClick = (nodeId: string) => {
    const leafId = topic.deepDives?.[nodeId];
    if (leafId) {
      onNavigate(leafId);
      return;
    }
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 pt-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none">{topic.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{topic.title}</h2>
              {topic.kind === 'leaf' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  deep dive
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{topic.tagline}</p>
          </div>
        </div>
      </div>

      <div className="h-[38vh] min-h-[280px] px-6 pt-4">
        <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <DiagramView model={topic.model} onNodeClick={handleNodeClick} selectedNodeId={selectedNodeId} />
        </div>
      </div>

      <div className="px-6 pt-4">
        <NodeInspector model={topic.model} selectedNodeId={selectedNodeId} />
      </div>

      <div className="px-6 py-6 grid lg:grid-cols-2 gap-x-8 gap-y-6 max-w-6xl">
        <div className="space-y-6">
          <PrinciplesList principles={topic.principles} />
          <TradeoffTable tradeoffs={topic.tradeoffs} />
        </div>
        <div className="space-y-6">
          <FrameworksGrid frameworks={topic.frameworks} />
          <CodeBlock code={topic.code} />
          {topic.furtherReading && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                Further Reading
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {topic.furtherReading}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
