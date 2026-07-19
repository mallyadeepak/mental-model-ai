import { useCallback, useEffect, useState } from 'react';
import { loadFavorites, toggleFavorite } from '../lib/storage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const toggle = useCallback((cityId: string) => {
    setFavorites(toggleFavorite(cityId));
  }, []);

  const isFavorite = useCallback((cityId: string) => favorites.includes(cityId), [favorites]);

  return { favorites, toggle, isFavorite };
}
