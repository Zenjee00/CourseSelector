import './index.css';

import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import App from './App.jsx';

const storedTheme = localStorage.getItem('theme')
const initialTheme = storedTheme === 'dark' ? 'dark' : 'light'
document.documentElement.setAttribute('data-theme', initialTheme)
document.body.setAttribute('data-theme', initialTheme)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
