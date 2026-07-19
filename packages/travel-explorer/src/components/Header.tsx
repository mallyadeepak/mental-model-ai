import { NavLink } from 'react-router-dom';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
      : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
  }`;

export function Header({ isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-ink-50/90 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-xl">🧭</span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink-900 dark:text-white">
            Wayfinder
          </span>
        </NavLink>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Explore
          </NavLink>
          <NavLink to="/trips" className={navLinkClass}>
            My Trips
          </NavLink>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle dark mode"
            className="ml-2 rounded-full p-2 text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </nav>
      </div>
    </header>
  );
}
