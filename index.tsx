import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// CRITICAL FIX: Unregister any existing service workers.
// The error "ServiceWorker intercepted a request" indicates a stale SW is breaking streaming.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      console.warn('Force unregistering Service Worker to fix API streaming:', registration);
      registration.unregister();
    }
  }).catch(err => {
    console.error('Failed to unregister service workers:', err);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);