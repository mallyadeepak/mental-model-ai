import type { City, Place } from '../../types';

function PlaceList({ title, emoji, places }: { title: string; emoji: string; places: Place[] }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-ink-900 dark:text-white">
        <span>{emoji}</span> {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {places.map((p) => (
          <li key={p.name} className="rounded-lg border border-ink-100 p-3 text-sm dark:border-ink-800">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-semibold text-ink-900 dark:text-white">{p.name}</span>
              <span className="text-xs text-ink-400">{p.area}</span>
            </div>
            <p className="mt-1 text-ink-600 dark:text-ink-300">{p.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlacesTab({ city }: { city: City }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500 dark:bg-ink-800/60 dark:text-ink-400">
        Starting points, not a fixed list — treat these as a way to pick a neighborhood and then
        wander. Verify hours before a special trip, since venues change over time.
      </p>
      <PlaceList title="Cafés" emoji="☕" places={city.cafes} />
      <PlaceList title="Bars" emoji="🍸" places={city.bars} />
      <PlaceList title="Food" emoji="🍽️" places={city.restaurants} />
    </div>
  );
}
