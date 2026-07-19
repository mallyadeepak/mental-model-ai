import type { CodeSample } from '../types.js';

export function CodeBlock({ code }: { code?: CodeSample }) {
  if (!code) return null;

  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
        {code.caption}
      </h3>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
        <code>{code.code}</code>
      </pre>
    </section>
  );
}
