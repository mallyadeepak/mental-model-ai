import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { useDarkMode } from './hooks/useDarkMode';
import ExplorePage from './pages/ExplorePage';
import CityDetailPage from './pages/CityDetailPage';
import TripsPage from './pages/TripsPage';

export default function App() {
  const { isDark, toggleTheme } = useDarkMode();

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <Header isDark={isDark} onToggleTheme={toggleTheme} />
      <main>
        <Routes>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/city/:id" element={<CityDetailPage />} />
          <Route path="/trips" element={<TripsPage />} />
        </Routes>
      </main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-ink-400 sm:px-6 dark:text-ink-600">
        Wayfinder is a personal trip-planning aid built from general, curated knowledge — always
        double-check hours, safety conditions, and current events for your destination before you
        travel.
      </footer>
    </div>
  );
}
