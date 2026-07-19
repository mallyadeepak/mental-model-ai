import { playbookCards } from '../content/index.js';

interface DecisionPlaybookProps {
  onOpenTopic: (id: string) => void;
}

export function DecisionPlaybook({ onOpenTopic }: DecisionPlaybookProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Decision Playbook</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
          Problem-solving cheat sheet: start from what you&apos;re trying to build, land on a pattern, and jump straight
          to where it&apos;s explained.
        </p>
        <div className="space-y-4">
          {playbookCards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">&ldquo;{card.prompt}&rdquo;</div>
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-400">{card.recommendation}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{card.rationale}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {card.links.map((link) => (
                  <button
                    key={link.topicId}
                    onClick={() => onOpenTopic(link.topicId)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {link.label} &rarr;
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
