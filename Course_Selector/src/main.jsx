import './index.css';

import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import {
  applyTheme,
  DEFAULT_THEME,
} from './utils/theme';

// Start light until Firebase identifies whose preference should be restored.
applyTheme(DEFAULT_THEME);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
)
