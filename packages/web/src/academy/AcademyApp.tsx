import { useCallback, useState } from 'react';
import { AtlasView } from './components/AtlasView.js';
import { TopicView } from './components/TopicView.js';
import { DecisionPlaybook } from './components/DecisionPlaybook.js';
import { Breadcrumb } from './components/Breadcrumb.js';
import { ATLAS_ID, getBreadcrumb, getTopic } from './content/index.js';

type View = { type: 'atlas' } | { type: 'topic'; id: string } | { type: 'playbook' };

export function AcademyApp() {
  const [view, setView] = useState<View>({ type: 'atlas' });

  const openTopic = useCallback((id: string) => setView({ type: 'topic', id }), []);
  const openAtlas = useCallback(() => setView({ type: 'atlas' }), []);
  const openPlaybook = useCallback(() => setView({ type: 'playbook' }), []);

  const handleBreadcrumbNavigate = useCallback(
    (id: string) => {
      if (id === ATLAS_ID) {
        openAtlas();
      } else {
        openTopic(id);
      }
    },
    [openAtlas, openTopic]
  );

  const topic = view.type === 'topic' ? getTopic(view.id) : undefined;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={openAtlas}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              view.type !== 'playbook'
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            🗺️ Atlas
          </button>
          <button
            onClick={openPlaybook}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              view.type === 'playbook'
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            🧭 Decision Playbook
          </button>
        </div>

        {view.type === 'topic' && topic && (
          <Breadcrumb trail={getBreadcrumb(topic.id)} onNavigate={handleBreadcrumbNavigate} />
        )}
      </div>

      {view.type === 'atlas' && <AtlasView onOpenTopic={openTopic} />}
      {view.type === 'playbook' && <DecisionPlaybook onOpenTopic={openTopic} />}
      {view.type === 'topic' && topic && <TopicView topic={topic} onNavigate={openTopic} />}
      {view.type === 'topic' && !topic && (
        <div className="flex-1 flex items-center justify-center text-gray-400">Topic not found.</div>
      )}
    </div>
  );
}
