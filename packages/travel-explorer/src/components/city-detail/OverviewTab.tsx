import type { City } from '../../types';
import { MONTH_NAMES, VIBE_LABELS } from '../../types';
import { Chip } from '../Chip';
import { ScoreBadge } from '../ScoreBadge';

export function OverviewTab({ city }: { city: City }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="flex flex-col gap-5 md:col-span-2">
        <p className="text-ink-700 dark:text-ink-200">{city.summary}</p>

        <div className="rounded-xl border border-sunset-200 bg-sunset-50 p-4 dark:border-sunset-900 dark:bg-sunset-950/40">
          <h3 className="mb-1 font-display text-sm font-semibold text-sunset-700 dark:text-sunset-300">
            Why it works for solo travel
          </h3>
          <p className="text-sm text-ink-700 dark:text-ink-200">{city.whyForSolo}</p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-sm font-semibold text-ink-900 dark:text-white">
            Neighborhoods to know
          </h3>
          <ul className="flex flex-col gap-2">
            {city.neighborhoods.map((n) => (
              <li key={n.name} className="rounded-lg border border-ink-100 p-3 text-sm dark:border-ink-800">
                <span className="font-semibold text-ink-900 dark:text-white">{n.name}</span>
                <span className="text-ink-600 dark:text-ink-300"> — {n.vibe}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 font-display text-sm font-semibold text-ink-900 dark:text-white">Vibe</h3>
          <div className="flex flex-wrap gap-1.5">
            {city.vibeTags.map((tag) => (
              <Chip key={tag} label={VIBE_LABELS[tag].label} emoji={VIBE_LABELS[tag].emoji} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-ink-200 p-4 dark:border-ink-800">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink-900 dark:text-white">Scores</h3>
          <div className="flex flex-col gap-2">
            <ScoreBadge label="Solo-friendly" value={city.soloScore} />
            <ScoreBadge label="Meet people" value={city.socialScore} />
            <ScoreBadge label="Safety" value={city.safetyScore} />
          </div>
        </div>

        <div className="rounded-xl border border-ink-200 p-4 text-sm dark:border-ink-800">
          <dl className="flex flex-col gap-2">
            <div className="flex justify-between">
              <dt className="text-ink-500 dark:text-ink-400">Best months</dt>
              <dd className="font-medium text-ink-800 dark:text-ink-100">
                {city.bestMonths.map((m) => MONTH_NAMES[m - 1]).join(', ')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500 dark:text-ink-400">Ideal trip</dt>
              <dd className="font-medium text-ink-800 dark:text-ink-100">{city.idealTripLength}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500 dark:text-ink-400">Pace</dt>
              <dd className="font-medium capitalize text-ink-800 dark:text-ink-100">{city.pace}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500 dark:text-ink-400">Currency</dt>
              <dd className="font-medium text-ink-800 dark:text-ink-100">{city.currency}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500 dark:text-ink-400">Languages</dt>
              <dd className="text-right font-medium text-ink-800 dark:text-ink-100">
                {city.languages.join(', ')}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
