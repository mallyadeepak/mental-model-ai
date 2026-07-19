import type { Principle } from '../types.js';

export function PrinciplesList({ principles }: { principles: Principle[] }) {
  if (!principles.length) return null;

  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
        Design Principles
      </h3>
      <ul className="space-y-3">
        {principles.map((p) => (
          <li
            key={p.title}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <div className="font-medium text-gray-900 dark:text-white text-sm">{p.title}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{p.detail}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
