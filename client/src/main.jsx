import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './theme.css';

// apply saved theme before first paint so every page (including auth) starts correct
document.documentElement.classList.toggle('dark', localStorage.getItem('medflow_dark') === '1');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
