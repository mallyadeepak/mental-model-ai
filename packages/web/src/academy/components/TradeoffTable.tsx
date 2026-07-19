import type { Tradeoff } from '../types.js';

export function TradeoffTable({ tradeoffs }: { tradeoffs?: Tradeoff[] }) {
  if (!tradeoffs || !tradeoffs.length) return null;

  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
        Trade-offs
      </h3>
      <div className="space-y-3">
        {tradeoffs.map((t) => (
          <div
            key={t.dimension}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              {t.dimension}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
              <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                {t.left}
              </span>
              <span className="text-gray-300 dark:text-gray-600">vs</span>
              <span className="px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                {t.right}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t.guidance}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
