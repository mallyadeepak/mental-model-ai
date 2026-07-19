import { Link } from 'react-router-dom';
import { getCityById } from '../data';
import { useFavorites } from '../hooks/useFavorites';
import { useTrips } from '../hooks/useTrips';
import { DayCard } from '../components/itinerary/DayCard';

export default function TripsPage() {
  const { favorites, toggle } = useFavorites();
  const { trips, removeTrip } = useTrips();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-900 dark:text-white">My Trips</h1>
        <p className="mt-2 text-ink-600 dark:text-ink-300">
          Saved cities and itineraries live here — stored locally in this browser.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-ink-900 dark:text-white">
          Saved cities
        </h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-ink-500 dark:text-ink-400">
            No saved cities yet — hit the heart icon on any city to bookmark it.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favorites.map((id) => {
              const city = getCityById(id);
              if (!city) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1.5 pl-4 pr-2 text-sm dark:border-ink-800 dark:bg-ink-900"
                >
                  <Link to={`/city/${id}`} className="font-medium text-ink-800 hover:underline dark:text-ink-100">
                    {city.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-label={`Remove ${city.name}`}
                    className="rounded-full px-2 text-ink-400 hover:text-sunset-500"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-ink-900 dark:text-white">
          Saved itineraries
        </h2>
        {trips.length === 0 ? (
          <p className="text-sm text-ink-500 dark:text-ink-400">
            No saved itineraries yet — build one from any city page and click "Save this trip".
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {trips.map((trip) => {
              const city = getCityById(trip.cityId);
              return (
                <div key={trip.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-white">
                      {city ? (
                        <Link to={`/city/${city.id}`} className="hover:underline">
                          {city.name}
                        </Link>
                      ) : (
                        'Unknown city'
                      )}{' '}
                      <span className="text-sm font-normal text-ink-500 dark:text-ink-400">
                        · {trip.days} days · saved {new Date(trip.createdAt).toLocaleDateString()}
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeTrip(trip.id)}
                      className="text-sm text-ink-400 hover:text-sunset-500"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {trip.itinerary.map((day) => (
                      <DayCard key={day.day} day={day} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
