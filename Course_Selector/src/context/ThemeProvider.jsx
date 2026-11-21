import { useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { applyTheme, DEFAULT_THEME, readTheme, saveTheme } from '../utils/theme';
import { ThemeContext } from './theme-context';

export default function ThemeProvider({ userId, ready = true, children }) {
  const { pathname } = useLocation();
  const [preferredTheme, setPreferredTheme] = useState(() => readTheme(userId));
  const isAuthPage = pathname.replace(/\/+$/, '').toLowerCase() === '/login';
  const theme = !ready || isAuthPage ? DEFAULT_THEME : preferredTheme;

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    if (!ready || isAuthPage) return;
    const next = preferredTheme === 'dark' ? 'light' : 'dark';
    saveTheme(userId, next);
    setPreferredTheme(next);
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
