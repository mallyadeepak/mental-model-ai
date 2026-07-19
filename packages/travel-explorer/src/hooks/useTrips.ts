import { useCallback, useEffect, useState } from 'react';
import type { InterestWeights, ItineraryDay, TripPlan } from '../types';
import { deleteTrip, loadTrips, saveTrip } from '../lib/storage';

export function useTrips() {
  const [trips, setTrips] = useState<TripPlan[]>([]);

  useEffect(() => {
    setTrips(loadTrips());
  }, []);

  const addTrip = useCallback(
    (cityId: string, days: number, weights: InterestWeights, itinerary: ItineraryDay[]) => {
      saveTrip(cityId, days, weights, itinerary);
      setTrips(loadTrips());
    },
    []
  );

  const removeTrip = useCallback((tripId: string) => {
    setTrips(deleteTrip(tripId));
  }, []);

  return { trips, addTrip, removeTrip };
}
