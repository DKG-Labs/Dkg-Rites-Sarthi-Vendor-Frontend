import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './utils/authInterceptor'
import './index.css'
import App from './App.jsx'

// Synchronously sync auth credentials from URL params (from iframe host) into localStorage BEFORE React renders
if (typeof window !== 'undefined' && window.location && window.location.search) {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token') || searchParams.get('authToken');
    const vendorCode = searchParams.get('vendorCode');
    const vendorName = searchParams.get('vendorName');
    const userId = searchParams.get('userId');
    const selectedPlant = searchParams.get('selectedPlant');
    const plantId = searchParams.get('plantId');

    if (token) {
      localStorage.setItem('sleeper_token', token);
      localStorage.setItem('authToken', token);
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('authToken', token);
    }
    if (vendorCode) {
      localStorage.setItem('vendorCode', vendorCode);
      sessionStorage.setItem('vendorCode', vendorCode);
    }
    if (vendorName) {
      localStorage.setItem('vendorName', vendorName);
      sessionStorage.setItem('vendorName', vendorName);
    }
    if (userId) {
      localStorage.setItem('userId', userId);
      sessionStorage.setItem('userId', userId);
    }
    if (selectedPlant) {
      localStorage.setItem('selectedPlant', selectedPlant);
    }
    if (plantId) {
      localStorage.setItem('plantId', plantId);
      sessionStorage.setItem('plantId', plantId);
    }
  } catch (e) {
    console.error('Error synchronizing auth credentials from URL in sleeper-vendor:', e);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
