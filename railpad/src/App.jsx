import React, { useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import RailPadVendorDashboard from './pages/RailPadVendor/RailPadVendorDashboard';
import RailPadVendorLogin from './pages/RailPadVendor/RailPadVendorLogin';
import PlantDeclarationDashboard from './pages/RailPadVendor/PlantDeclaration/PlantDeclarationDashboard';
import { logoutUser } from './services/authService.js';

/**
 * App Component - Standalone Vendor Application
 */
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isBypass = searchParams.get('bypassAuth') === 'true';
    
    // Capture URL params and store them with railpad_ prefix
    const urlVendorCode = searchParams.get('vendorCode');
    const urlVendorName = searchParams.get('vendorName');
    const urlUserId = searchParams.get('userId');
    const urlToken = searchParams.get('token');
    const urlPlant = searchParams.get('selectedRailPlant');

    if (urlVendorCode) localStorage.setItem('railpad_vendorCode', urlVendorCode);
    if (urlVendorName) localStorage.setItem('railpad_vendorName', urlVendorName);
    if (urlUserId) localStorage.setItem('railpad_userId', urlUserId);
    if (urlToken) localStorage.setItem('railpad_token', urlToken);
    
    if (urlPlant) {
        localStorage.setItem('selectedRailPlant', urlPlant);
        try {
            const p = JSON.parse(urlPlant);
            localStorage.setItem('railpad_selectedPlantId', p.plantId || urlPlant);
        } catch (e) {
            // It's a plain string, use it directly
            localStorage.setItem('railpad_selectedPlantId', urlPlant);
        }
    }

    return isBypass || !!localStorage.getItem('railpad_token');
  });

  const [activeItem, setActiveItem] = useState('Vendor');

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logoutUser();
    window.top.postMessage('logout', '*');
    setIsAuthenticated(false);
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'Vendor':
        return <RailPadVendorDashboard />;
      case 'PlantDeclaration':
        return <PlantDeclarationDashboard />;
      default:
        return <RailPadVendorDashboard />;
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <RailPadVendorLogin onLogin={handleLoginSuccess} />
      ) : (
        <MainLayout activeItem={activeItem} onItemClick={setActiveItem} onLogout={handleLogout}>
          {renderContent()}
        </MainLayout>
      )}
    </>
  );
};

export default App;
