import type { FrameworkRef } from '../types.js';

export function FrameworksGrid({ frameworks }: { frameworks?: FrameworkRef[] }) {
  if (!frameworks || !frameworks.length) return null;

  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
        Frameworks & Tools
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {frameworks.map((f) => (
          <div
            key={f.name}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <div className="font-medium text-gray-900 dark:text-white text-sm">{f.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{f.blurb}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
