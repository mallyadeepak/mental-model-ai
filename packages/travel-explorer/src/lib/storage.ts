import type { InterestWeights, ItineraryDay, TripPlan } from '../types';

const FAVORITES_KEY = 'wayfinder:favorites';
const TRIPS_KEY = 'wayfinder:trips';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently, favorites/trips just won't persist.
  }
}

export function loadFavorites(): string[] {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(cityId: string): string[] {
  const current = loadFavorites();
  const next = current.includes(cityId)
    ? current.filter((id) => id !== cityId)
    : [...current, cityId];
  writeJson(FAVORITES_KEY, next);
  return next;
}

export function loadTrips(): TripPlan[] {
  return readJson<TripPlan[]>(TRIPS_KEY, []);
}

export function saveTrip(cityId: string, days: number, weights: InterestWeights, itinerary: ItineraryDay[]): TripPlan {
  const trip: TripPlan = {
    id: `${cityId}-${Date.now()}`,
    cityId,
    days,
    weights,
    itinerary,
    createdAt: new Date().toISOString(),
  };
  const current = loadTrips();
  const next = [trip, ...current];
  writeJson(TRIPS_KEY, next);
  return trip;
}

export function deleteTrip(tripId: string): TripPlan[] {
  const current = loadTrips();
  const next = current.filter((t) => t.id !== tripId);
  writeJson(TRIPS_KEY, next);
  return next;
}
