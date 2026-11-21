export const DEFAULT_THEME = 'light';

export function readTheme(userId) {
  try {
    return localStorage.getItem(userId ? `theme:${userId}` : 'theme:guest') === 'dark'
      ? 'dark'
      : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(userId, theme) {
  try {
    localStorage.setItem(userId ? `theme:${userId}` : 'theme:guest', theme);
  } catch {
    // The current session can still switch themes when browser storage is unavailable.
  }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
}
