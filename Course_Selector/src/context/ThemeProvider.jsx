import { useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { applyTheme, readTheme, saveTheme } from '../utils/theme';
import { ThemeContext } from './theme-context';

export default function ThemeProvider({ userId, children }) {
  const { pathname } = useLocation();
  const [preferredTheme, setPreferredTheme] = useState(() => readTheme(userId));
  const theme = pathname.replace(/\/+$/, '') === '/login' ? 'light' : preferredTheme;

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const next = preferredTheme === 'dark' ? 'light' : 'dark';
    saveTheme(userId, next);
    setPreferredTheme(next);
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
