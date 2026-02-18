import React, { useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import VendorDashboard from './pages/sleeperGeneral/VendorDashboard';
import VendorLogin from './pages/sleeperGeneral/VendorLogin';

/**
 * App Component - Standalone Vendor Application
 */
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for bypass flag (used when integrated with Rites-Main)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bypassAuth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <VendorLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    // Notify the parent app to logout
    window.top.postMessage('logout', '*');
  };

  return (
    <MainLayout activeItem="Vendor" onItemClick={() => { }} onLogout={handleLogout}>
      <VendorDashboard />
    </MainLayout>
  );
};

export default App;
