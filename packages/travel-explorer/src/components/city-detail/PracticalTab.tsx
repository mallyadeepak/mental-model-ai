import type { City } from '../../types';
import { COST_LABELS } from '../../types';

export function PracticalTab({ city }: { city: City }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-ink-200 p-4 dark:border-ink-800">
        <h3 className="mb-1 font-display text-sm font-semibold text-ink-900 dark:text-white">
          Getting around
        </h3>
        <p className="text-sm text-ink-600 dark:text-ink-300">{city.gettingAround}</p>
      </div>

      <div className="rounded-xl border border-ink-200 p-4 dark:border-ink-800">
        <h3 className="mb-1 font-display text-sm font-semibold text-ink-900 dark:text-white">Budget</h3>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          {COST_LABELS[city.costLevel]} — {city.currency}
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:col-span-2 dark:border-amber-900 dark:bg-amber-950/30">
        <h3 className="mb-1 font-display text-sm font-semibold text-amber-800 dark:text-amber-300">
          Safety notes
        </h3>
        <p className="text-sm text-ink-700 dark:text-ink-200">{city.safetyNotes}</p>
      </div>
    </div>
  );
}
