import React, { useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import RailPadVendorDashboard from './pages/RailPadVendor/RailPadVendorDashboard';
import RailPadVendorLogin from './pages/RailPadVendor/RailPadVendorLogin';

/**
 * App Component - Standalone Vendor Application
 */
const App = () => {
  const isBypassAuth = new URLSearchParams(window.location.search).get('bypassAuth') === 'true';
  const [isAuthenticated, setIsAuthenticated] = useState(isBypassAuth);

  if (!isAuthenticated) {
    return <RailPadVendorLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    // Notify the parent app to logout
    window.top.postMessage('logout', '*');
    if (!isBypassAuth) {
      setIsAuthenticated(false);
    }
  };

  return (
    <MainLayout activeItem="Vendor" onItemClick={() => { }} onLogout={handleLogout}>
      <RailPadVendorDashboard />
    </MainLayout>
  );
};

export default App;
