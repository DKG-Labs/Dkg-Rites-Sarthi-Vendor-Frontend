import React, { useState, useEffect } from 'react';
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
    const railpadToken = localStorage.getItem('railpad_token');
    const authToken = localStorage.getItem('authToken');
    return !!railpadToken || !!authToken || new URLSearchParams(window.location.search).get('bypassAuth') === 'true';
  });

  const [selectedPlant, setSelectedPlant] = useState(() => {
    const id = localStorage.getItem('railpad_selectedPlantId');
    const name = localStorage.getItem('railpad_selectedPlantName');
    // Treat "1" as invalid/placeholder to force modal
    return (id && id !== "1") ? { plantId: id, plantName: name } : null;
  });

  const [vendorCode, setVendorCode] = useState(() => localStorage.getItem('railpad_vendorCode'));
  const [vendorName, setVendorName] = useState(() => localStorage.getItem('railpad_vendorName') || 'RailPad Vendor');

  const [activeItem, setActiveItem] = useState('Vendor');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Capture URL params
    const urlVendorCode = searchParams.get('vendorCode');
    const urlVendorName = searchParams.get('vendorName');
    const urlUserId = searchParams.get('userId');
    const urlToken = searchParams.get('token');
    const urlPlant = searchParams.get('selectedRailPlant');

    if (urlVendorCode) {
        localStorage.setItem('railpad_vendorCode', urlVendorCode);
        setVendorCode(urlVendorCode);
    }
    if (urlVendorName) {
        localStorage.setItem('railpad_vendorName', urlVendorName);
        setVendorName(urlVendorName);
    }
    if (urlUserId) localStorage.setItem('railpad_userId', urlUserId);
    if (urlToken) {
        localStorage.setItem('railpad_token', urlToken);
        setIsAuthenticated(true);
    }
    
    if (urlPlant) {
        localStorage.setItem('selectedRailPlant', urlPlant);
        try {
            const p = JSON.parse(urlPlant);
            localStorage.setItem('railpad_selectedPlantId', p.plantId || urlPlant);
            localStorage.setItem('railpad_selectedPlantName', p.plantName || "Selected Plant");
            setSelectedPlant({ plantId: p.plantId || urlPlant, plantName: p.plantName || "Selected Plant" });
        } catch (e) {
            localStorage.setItem('railpad_selectedPlantId', urlPlant);
            setSelectedPlant({ plantId: urlPlant, plantName: "Selected Plant" });
        }
    }

    // Sync with main portal if needed
    const authToken = localStorage.getItem('authToken');
    const railpadToken = localStorage.getItem('railpad_token');
    if (!railpadToken && authToken) {
        localStorage.setItem('railpad_token', authToken);
        setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setVendorCode(localStorage.getItem('railpad_vendorCode'));
    setVendorName(localStorage.getItem('railpad_vendorName') || 'RailPad Vendor');
  };

  const handleLogout = () => {
    logoutUser();
    window.top.postMessage('logout', '*');
    setIsAuthenticated(false);
  };

  const handlePlantSelect = (plant) => {
    localStorage.setItem('railpad_selectedPlantId', plant.plantId);
    localStorage.setItem('railpad_selectedPlantName', plant.plantName);
    setSelectedPlant(plant);
  };

  const renderContent = () => {
    const contextProps = {
        selectedPlant,
        plantId: selectedPlant?.plantId
    };

    switch (activeItem) {
      case 'Vendor':
        return <RailPadVendorDashboard {...contextProps} />;
      case 'PlantDeclaration':
        return <PlantDeclarationDashboard {...contextProps} />;
      default:
        return <RailPadVendorDashboard {...contextProps} />;
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <RailPadVendorLogin onLogin={handleLoginSuccess} />
      ) : (
        <MainLayout 
            activeItem={activeItem} 
            onItemClick={setActiveItem} 
            onLogout={handleLogout}
            selectedPlant={selectedPlant}
            onPlantSelect={handlePlantSelect}
            vendorCode={vendorCode}
            vendorName={vendorName}
        >
          {renderContent()}
        </MainLayout>
      )}
    </>
  );
};

export default App;
