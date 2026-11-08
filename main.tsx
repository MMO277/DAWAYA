import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { LangProvider } from './i18n';
import InstallPrompt from './InstallPrompt';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <LangProvider>
        <App />
        <InstallPrompt />
      </LangProvider>
    </HashRouter>
  </React.StrictMode>,
);

// Register Service Worker immediately so Chrome/Edge/Android enables 1-tap PWA Installation right away.
if ('serviceWorker' in navigator) {
  const registerSw = () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      /* PWA is optional; ignore failures */
    });
  };
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSw();
  } else {
    window.addEventListener('DOMContentLoaded', registerSw);
  }
}
