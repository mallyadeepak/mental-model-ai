import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getCityById } from '../data';
import { COST_LABELS } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { useTrips } from '../hooks/useTrips';
import { OverviewTab } from '../components/city-detail/OverviewTab';
import { PlacesTab } from '../components/city-detail/PlacesTab';
import { MeetPeopleTab } from '../components/city-detail/MeetPeopleTab';
import { PracticalTab } from '../components/city-detail/PracticalTab';
import { ItineraryBuilder } from '../components/itinerary/ItineraryBuilder';

const TABS = ['Overview', 'Cafés & Bars', 'Meet People', 'Build Itinerary', 'Practical'] as const;
type Tab = (typeof TABS)[number];

function countryFlag(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
}

export default function CityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const city = getCityById(id);
  const [tab, setTab] = useState<Tab>('Overview');
  const { isFavorite, toggle } = useFavorites();
  const { addTrip } = useTrips();

  if (!city) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <Link to="/" className="text-sm text-ink-500 hover:underline dark:text-ink-400">
          ← Back to Explore
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
        <div className="flex items-center justify-between bg-gradient-to-br from-sunset-400 via-sunset-500 to-teal-600 px-6 py-8">
          <div>
            <span className="text-4xl">{countryFlag(city.countryCode)}</span>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
              {city.name}
            </h1>
            <p className="text-white/90">
              {city.country} · {city.region}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggle(city.id)}
            className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-ink-900 shadow hover:bg-white"
          >
            {isFavorite(city.id) ? '❤️ Saved' : '🤍 Save city'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-white px-6 py-3 text-sm text-ink-600 dark:bg-ink-900 dark:text-ink-300">
          <span>{city.tagline}</span>
          <span className="ml-auto font-medium">{COST_LABELS[city.costLevel]}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-ink-200 dark:border-ink-800">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-b-2 border-sunset-500 text-sunset-600 dark:text-sunset-400'
                : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        {tab === 'Overview' && <OverviewTab city={city} />}
        {tab === 'Cafés & Bars' && <PlacesTab city={city} />}
        {tab === 'Meet People' && <MeetPeopleTab city={city} />}
        {tab === 'Build Itinerary' && (
          <ItineraryBuilder
            city={city}
            onSaveTrip={(days, weights, itinerary) => addTrip(city.id, days, weights, itinerary)}
          />
        )}
        {tab === 'Practical' && <PracticalTab city={city} />}
      </div>
    </div>
  );
}
