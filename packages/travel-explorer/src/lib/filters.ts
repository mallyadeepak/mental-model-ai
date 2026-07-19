import type { City, Continent, VibeTag } from '../types';

export interface CityFilters {
  query: string;
  continents: Continent[];
  vibes: VibeTag[];
  maxCost: 1 | 2 | 3 | 4;
  minSoloScore: number;
  month: number | null; // 1-12, null = any time
}

export const DEFAULT_FILTERS: CityFilters = {
  query: '',
  continents: [],
  vibes: [],
  maxCost: 4,
  minSoloScore: 0,
  month: null,
};

export function matchCity(city: City, filters: CityFilters): boolean {
  if (filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    const haystack = `${city.name} ${city.country} ${city.region} ${city.tagline}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.continents.length > 0 && !filters.continents.includes(city.continent)) {
    return false;
  }
  if (filters.vibes.length > 0 && !filters.vibes.every((v) => city.vibeTags.includes(v))) {
    return false;
  }
  if (city.costLevel > filters.maxCost) return false;
  if (city.soloScore < filters.minSoloScore) return false;
  if (filters.month && !city.bestMonths.includes(filters.month)) return false;
  return true;
}

export function sortCities(cities: City[], sortBy: 'soloScore' | 'name' | 'socialScore' | 'safetyScore'): City[] {
  const copy = [...cities];
  if (sortBy === 'name') {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy.sort((a, b) => b[sortBy] - a[sortBy]);
}
