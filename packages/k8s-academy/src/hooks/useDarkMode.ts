import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useDarkMode() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('k8s-academy-theme') as Theme) || 'system';
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    const updateDarkMode = () => {
      const shouldBeDark = theme === 'dark' || (theme === 'system' && systemDark.matches);
      setIsDark(shouldBeDark);
      root.classList.toggle('dark', shouldBeDark);
    };

    updateDarkMode();
    systemDark.addEventListener('change', updateDarkMode);
    return () => systemDark.removeEventListener('change', updateDarkMode);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('k8s-academy-theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  return { theme, setTheme, isDark, toggleTheme };
}
