import { useMemo, useState } from 'react';
import { allCities, CONTINENTS } from '../data';
import { DEFAULT_FILTERS, matchCity, sortCities, type CityFilters } from '../lib/filters';
import { CityCard } from '../components/CityCard';
import { FilterBar } from '../components/FilterBar';
import { useFavorites } from '../hooks/useFavorites';

type SortOption = 'soloScore' | 'name' | 'socialScore' | 'safetyScore';

const SORT_LABELS: Record<SortOption, string> = {
  soloScore: 'Solo-friendliness',
  socialScore: 'Easiest to meet people',
  safetyScore: 'Safety',
  name: 'Name (A-Z)',
};

export default function ExplorePage() {
  const [filters, setFilters] = useState<CityFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('soloScore');
  const { isFavorite, toggle } = useFavorites();

  const results = useMemo(() => {
    const filtered = allCities.filter((c) => matchCity(c, filters));
    return sortCities(filtered, sortBy);
  }, [filters, sortBy]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-900 dark:text-white sm:text-4xl">
          Where to next?
        </h1>
        <p className="mt-2 max-w-2xl text-ink-600 dark:text-ink-300">
          A curated set of cities picked for solo travel: café culture, easy nightlife, and a real
          shot at meeting people — not just checking off landmarks. Starting deep in Europe, with
          the Americas, the US, and a few starter cities on other continents.
        </p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} continents={CONTINENTS} resultCount={results.length} />

      <div className="flex items-center justify-end gap-2 text-sm text-ink-600 dark:text-ink-300">
        <label htmlFor="sort">Sort by</label>
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-full border border-ink-200 bg-white px-3 py-1.5 focus:border-sunset-400 focus:outline-none dark:border-ink-700 dark:bg-ink-900"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 p-12 text-center text-ink-500 dark:border-ink-700 dark:text-ink-400">
          No cities match those filters yet. Try loosening the budget, month, or vibe filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((city) => (
            <CityCard key={city.id} city={city} isFavorite={isFavorite(city.id)} onToggleFavorite={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
