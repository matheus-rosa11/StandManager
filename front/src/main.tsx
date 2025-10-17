import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { I18nProvider } from './i18n';
import { IdentityProvider } from './contexts/IdentityContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <IdentityProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </IdentityProvider>
    </BrowserRouter>
  </React.StrictMode>
);
