import { useEffect, useState } from 'react';

export function YamlPanel({
  filename,
  value,
  onChange,
  onApply,
  notes,
}: {
  filename: string;
  value: string;
  onChange: (v: string) => void;
  onApply: () => { applied: { kind: string; name: string; action: string }[]; errors: string[] };
  notes: { match: string; note: string }[];
}) {
  const [result, setResult] = useState<{ applied: { kind: string; name: string; action: string }[]; errors: string[] } | null>(null);

  useEffect(() => setResult(null), [filename]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{filename}</span>
        <button
          onClick={() => setResult(onApply())}
          className="rounded-lg bg-k8s-blue px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          ▶ kubectl apply -f {filename}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        rows={16}
        className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-[12px] leading-5 text-slate-800 outline-none focus:border-k8s-blue focus:ring-1 focus:ring-k8s-blue dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      />
      {result && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-900">
          {result.applied.map((a, i) => (
            <div key={i} className="text-emerald-600 dark:text-emerald-400">
              ✓ {a.kind}/{a.name} {a.action}
            </div>
          ))}
          {result.errors.map((e, i) => (
            <div key={i} className="text-red-600 dark:text-red-400">
              ✗ {e}
            </div>
          ))}
        </div>
      )}
      {notes.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-1.5 font-semibold text-slate-500 dark:text-slate-400">Field notes</p>
          <ul className="space-y-1">
            {notes.map((n, i) => (
              <li key={i}>
                <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-k8s-blue dark:bg-slate-800 dark:text-blue-300">{n.match}</code>
                <span className="text-slate-600 dark:text-slate-400"> — {n.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
