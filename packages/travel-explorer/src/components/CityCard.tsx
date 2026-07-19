import { Link } from 'react-router-dom';
import type { City } from '../types';
import { COST_LABELS, VIBE_LABELS } from '../types';
import { Chip } from './Chip';

interface CityCardProps {
  city: City;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

function countryFlag(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
}

export function CityCard({ city, isFavorite, onToggleFavorite }: CityCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white transition-shadow hover:shadow-lg dark:border-ink-800 dark:bg-ink-900">
      <button
        type="button"
        onClick={() => onToggleFavorite(city.id)}
        aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-lg shadow dark:bg-ink-900/90"
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>

      <Link to={`/city/${city.id}`} className="flex flex-1 flex-col">
        <div className="flex h-24 items-end bg-gradient-to-br from-sunset-400 via-sunset-500 to-teal-600 px-4 pb-3">
          <span className="text-3xl drop-shadow">{countryFlag(city.countryCode)}</span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">
              {city.name}
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              {city.country} · {city.continent}
            </p>
          </div>

          <p className="text-sm text-ink-600 dark:text-ink-300">{city.tagline}</p>

          <div className="flex flex-wrap gap-1.5">
            {city.vibeTags.slice(0, 3).map((tag) => (
              <Chip key={tag} label={VIBE_LABELS[tag].label} emoji={VIBE_LABELS[tag].emoji} />
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-500 dark:border-ink-800 dark:text-ink-400">
            <span title="Solo-friendliness score">🧳 {city.soloScore.toFixed(1)}/10 solo</span>
            <span>{COST_LABELS[city.costLevel]}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
