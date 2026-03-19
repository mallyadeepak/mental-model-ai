import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onSettingsClick: () => void;
  onClear: () => void;
  hasModel: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Header({ onSettingsClick, onClear, hasModel, isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🧠</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Mental Model AI
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Interactive concept visualization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasModel && (
            <button
              onClick={onClear}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300
                       hover:text-gray-900 dark:hover:text-white
                       hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <button
            onClick={onSettingsClick}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300
                     hover:text-gray-900 dark:hover:text-white
                     bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                     rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}
