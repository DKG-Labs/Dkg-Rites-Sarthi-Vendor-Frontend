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
    const plant = searchParams.get('selectedRailPlant') || searchParams.get('selectedPlant');
    const plantId = searchParams.get('plantId');

    if (token) {
      localStorage.setItem('railpad_token', token);
      localStorage.setItem('authToken', token);
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('authToken', token);
    }
    if (vendorCode) {
      localStorage.setItem('railpad_vendorCode', vendorCode);
      localStorage.setItem('vendorCode', vendorCode);
      sessionStorage.setItem('vendorCode', vendorCode);
    }
    if (vendorName) {
      localStorage.setItem('railpad_vendorName', vendorName);
      localStorage.setItem('vendorName', vendorName);
      sessionStorage.setItem('vendorName', vendorName);
    }
    if (userId) {
      localStorage.setItem('railpad_userId', userId);
      localStorage.setItem('userId', userId);
      sessionStorage.setItem('userId', userId);
    }
    if (plant) {
      localStorage.setItem('selectedRailPlant', plant);
      localStorage.setItem('selectedPlant', plant);
      try {
        const p = JSON.parse(plant);
        localStorage.setItem('railpad_selectedPlantId', p.plantId || plant);
        localStorage.setItem('railpad_selectedPlantName', p.plantName || "Selected Plant");
      } catch (e) {
        localStorage.setItem('railpad_selectedPlantId', plant);
        localStorage.setItem('railpad_selectedPlantName', "Selected Plant");
      }
    }
    if (plantId) {
      localStorage.setItem('railpad_selectedPlantId', plantId);
      localStorage.setItem('plantId', plantId);
      sessionStorage.setItem('plantId', plantId);
    }
  } catch (e) {
    console.error('Error synchronizing auth credentials from URL:', e);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
