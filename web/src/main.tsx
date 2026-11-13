import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { catatSumber } from './lib/simpan';
import './index.css';

catatSumber();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
