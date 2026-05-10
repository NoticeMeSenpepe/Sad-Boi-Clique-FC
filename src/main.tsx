import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import './styles.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found in index.html');

// Vercel Analytics: pageview + Web Vitals tracking. Sits at the root so it
// stays mounted across landing-splash <-> site mode transitions in App.
// In dev (vite serve) it no-ops; in prod it points at /_vercel/insights.
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
