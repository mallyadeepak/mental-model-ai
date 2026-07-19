import { useMemo, useState } from 'react';
import type { City } from '../../types';
import { DEFAULT_WEIGHTS, generateItinerary, itineraryToText } from '../../lib/itinerary';
import { WeightSliders } from './WeightSliders';
import { DayCard } from './DayCard';

interface ItineraryBuilderProps {
  city: City;
  onSaveTrip: (days: number, weights: typeof DEFAULT_WEIGHTS, itinerary: ReturnType<typeof generateItinerary>) => void;
}

export function ItineraryBuilder({ city, onSaveTrip }: ItineraryBuilderProps) {
  const [days, setDays] = useState(4);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [seed, setSeed] = useState(0);
  const [saved, setSaved] = useState(false);

  const itinerary = useMemo(() => generateItinerary(city, days, weights, seed), [city, days, weights, seed]);

  const handleSave = () => {
    onSaveTrip(days, weights, itinerary);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const text = itineraryToText(city, itinerary, weights);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${city.id}-${days}day-itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <label className="mb-2 flex items-center gap-3 text-sm font-medium text-ink-800 dark:text-ink-100">
              Trip length
              <input
                type="range"
                min={1}
                max={10}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="flex-1 accent-sunset-500"
              />
              <span className="w-16 text-right text-ink-600 dark:text-ink-300">{days} days</span>
            </label>
            <WeightSliders weights={weights} onChange={setWeights} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:border-sunset-300 dark:border-ink-700 dark:text-ink-200"
          >
            🔀 Shuffle picks
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-sunset-500 px-4 py-2 text-sm font-medium text-white hover:bg-sunset-600"
          >
            {saved ? 'Saved ✓' : 'Save this trip'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:border-sunset-300 dark:border-ink-700 dark:text-ink-200"
          >
            ⬇️ Export as text
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {itinerary.map((day) => (
          <DayCard key={day.day} day={day} />
        ))}
      </div>
    </div>
  );
}
