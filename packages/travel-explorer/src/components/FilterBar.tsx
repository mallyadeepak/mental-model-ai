import type { Continent, VibeTag } from '../types';
import { MONTH_NAMES, VIBE_LABELS } from '../types';
import type { CityFilters } from '../lib/filters';
import { Chip } from './Chip';

interface FilterBarProps {
  filters: CityFilters;
  onChange: (filters: CityFilters) => void;
  continents: Continent[];
  resultCount: number;
}

const ALL_VIBES = Object.keys(VIBE_LABELS) as VibeTag[];

export function FilterBar({ filters, onChange, continents, resultCount }: FilterBarProps) {
  const toggleContinent = (c: Continent) => {
    const has = filters.continents.includes(c);
    onChange({
      ...filters,
      continents: has ? filters.continents.filter((x) => x !== c) : [...filters.continents, c],
    });
  };

  const toggleVibe = (v: VibeTag) => {
    const has = filters.vibes.includes(v);
    onChange({
      ...filters,
      vibes: has ? filters.vibes.filter((x) => x !== v) : [...filters.vibes, v],
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search a city or country…"
          className="w-full rounded-full border border-ink-200 bg-ink-50 px-4 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sunset-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-white sm:max-w-xs"
        />

        <select
          value={filters.month ?? ''}
          onChange={(e) => onChange({ ...filters, month: e.target.value ? Number(e.target.value) : null })}
          className="rounded-full border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-900 focus:border-sunset-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800 dark:text-white"
        >
          <option value="">Any month</option>
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>
              Best in {m}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          Max budget
          <input
            type="range"
            min={1}
            max={4}
            value={filters.maxCost}
            onChange={(e) => onChange({ ...filters, maxCost: Number(e.target.value) as CityFilters['maxCost'] })}
          />
          <span className="w-10 font-medium">{'$'.repeat(filters.maxCost)}</span>
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          Min solo score
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={filters.minSoloScore}
            onChange={(e) => onChange({ ...filters, minSoloScore: Number(e.target.value) })}
          />
          <span className="w-8 font-medium">{filters.minSoloScore}</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {continents.map((c) => (
          <Chip key={c} label={c} active={filters.continents.includes(c)} onClick={() => toggleContinent(c)} />
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ALL_VIBES.map((v) => (
          <Chip
            key={v}
            label={VIBE_LABELS[v].label}
            emoji={VIBE_LABELS[v].emoji}
            active={filters.vibes.includes(v)}
            onClick={() => toggleVibe(v)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
        <span>{resultCount} cities match</span>
        {(filters.continents.length > 0 ||
          filters.vibes.length > 0 ||
          filters.query ||
          filters.month ||
          filters.minSoloScore > 0 ||
          filters.maxCost < 4) && (
          <button
            type="button"
            onClick={() =>
              onChange({ query: '', continents: [], vibes: [], maxCost: 4, minSoloScore: 0, month: null })
            }
            className="font-medium text-sunset-600 hover:underline dark:text-sunset-400"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
