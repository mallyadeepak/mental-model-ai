import { useState } from 'react';
import type { Challenge } from '../data/types';
import type { ClusterState } from '../engine/types';

export function ChallengePanel({
  challenge,
  state,
  solved,
  onSolved,
}: {
  challenge: Challenge;
  state: ClusterState;
  solved: boolean;
  onSolved: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(0);

  const check = () => {
    const problem = challenge.check(state);
    if (problem) {
      setMessage(problem);
    } else {
      setMessage(null);
      onSolved();
    }
  };

  return (
    <div className={`rounded-xl border p-4 ${solved ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30' : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20'}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">{solved ? '🏆' : '🎯'}</span>
        <h4 className="font-bold text-slate-800 dark:text-slate-100">{solved ? 'Challenge solved!' : 'Hands-on challenge'}</h4>
      </div>
      <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">{solved ? challenge.successMessage : challenge.instructions}</p>
      {!solved && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={check}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-95 dark:bg-slate-100 dark:text-slate-900"
          >
            ✅ Check my work
          </button>
          {showHints < challenge.hints.length && (
            <button
              onClick={() => setShowHints((n) => n + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              💡 Hint ({showHints}/{challenge.hints.length})
            </button>
          )}
        </div>
      )}
      {message && !solved && (
        <p className="mt-2 rounded-md bg-white/70 px-2 py-1.5 text-xs text-amber-800 dark:bg-black/20 dark:text-amber-300">Not yet: {message}</p>
      )}
      {showHints > 0 && !solved && (
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600 dark:text-slate-400">
          {challenge.hints.slice(0, showHints).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
