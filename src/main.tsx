import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <AdminAuthProvider>
            <App />
          </AdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
