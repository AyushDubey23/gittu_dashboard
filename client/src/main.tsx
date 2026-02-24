import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import { App } from './App';
import { ErrorBoundary } from './ErrorBoundary';

const rootEl = document.getElementById('app');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <ErrorBoundary>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </ErrorBoundary>,
  );
} else {
  document.body.innerHTML = '<div style="padding:2rem;color:#c9d1d9;font-family:system-ui">Root element #app not found</div>';
}
