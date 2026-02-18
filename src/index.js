import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/forms.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Global behavior: disable native number input increment via mouse wheel and arrow keys
if (typeof window !== 'undefined' && !window.__numberInputListenersInstalled) {
  // Prevent wheel from changing number inputs when focused
  document.addEventListener('wheel', function (e) {
    const active = document.activeElement;
    if (active && active.tagName === 'INPUT' && active.type === 'number') {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent ArrowUp / ArrowDown from incrementing number inputs
  document.addEventListener('keydown', function (e) {
    const active = document.activeElement;
    if (active && active.tagName === 'INPUT' && active.type === 'number') {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
    }
  });

  // Mark as installed so React StrictMode won't attach duplicates in dev
  window.__numberInputListenersInstalled = true;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
     <BrowserRouter>      
      <App />
    </BrowserRouter> 
  </React.StrictMode>
);
