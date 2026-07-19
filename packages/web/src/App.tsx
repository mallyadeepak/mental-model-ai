import { useState } from 'react';
import { AcademyApp } from './academy/AcademyApp';
import GeneratorApp from './GeneratorApp';
import { ThemeToggle } from './components/ThemeToggle';
import { useDarkMode } from './hooks/useDarkMode';

type Mode = 'academy' | 'generator';

export default function App() {
  const [mode, setMode] = useState<Mode>('academy');
  const { isDark, toggleTheme } = useDarkMode();

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <div className="flex items-center justify-between px-6 py-2.5 bg-gray-900 text-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-base">
            🧠
          </div>
          <span className="font-semibold text-sm">Mental Model AI</span>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setMode('academy')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                mode === 'academy' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              LLM & Agents Academy
            </button>
            <button
              onClick={() => setMode('generator')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                mode === 'generator' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              AI Generator
            </button>
          </div>
        </div>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>

      {mode === 'academy' ? <AcademyApp /> : <GeneratorApp />}
    </div>
  );
}
