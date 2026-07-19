import type { City } from '../types';
import { europeCities } from './europe';
import { usaCities } from './usa';
import { americasCities } from './americas';
import { otherCities } from './other';

export const allCities: City[] = [
  ...europeCities,
  ...usaCities,
  ...americasCities,
  ...otherCities,
];

export function getCityById(id: string | undefined): City | undefined {
  if (!id) return undefined;
  return allCities.find((c) => c.id === id);
}

export const CONTINENTS = Array.from(new Set(allCities.map((c) => c.continent))).sort();
