import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initAppUpdater } from './hooks/useAppUpdater';
import { initPWAListeners } from './hooks/usePWAInstall';
import App from './App.tsx';
import './index.css';

initPWAListeners();
initAppUpdater();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
