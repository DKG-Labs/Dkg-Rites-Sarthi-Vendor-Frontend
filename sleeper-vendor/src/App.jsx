import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout.js';
import VendorDashboard from './pages/sleeperGeneral/VendorDashboard.jsx';
import VendorLogin from './pages/sleeperGeneral/VendorLogin.jsx';
import VendorIncomingRequests from './pages/vendor/VendorIncomingRequests.jsx';
import VendorEditRequest from './pages/vendor/VendorEditRequest.jsx';

/**
 * App Inner - Core application component within Router
 */
const AppInner = ({ onLogout, onLogin, isAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    return <VendorLogin onLogin={onLogin} />;
  }

  const getActiveItem = () => {
    if (!location || !location.pathname) return 'Vendor';
    const path = location.pathname;
    if (path === '/' || path === '') return 'Vendor';
    return 'Vendor';
  };

  const handleItemClick = (id) => {
    if (id === 'Vendor') navigate('/');
  };

  return (
    <MainLayout
      activeItem={getActiveItem()}
      onItemClick={handleItemClick}
      onLogout={onLogout}
    >
      <Routes>
        <Route path="/" element={<VendorDashboard />} />
        <Route path="/vendor/edit/:moduleId/:requestId/:workflowTransitionId" element={<VendorEditRequest />} />
        <Route path="*" element={<VendorDashboard />} />
      </Routes>
    </MainLayout>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for bypass flag
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('bypassAuth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('selectedPlant');
    window.top.postMessage('logout', '*');
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppInner
        isAuthenticated={isAuthenticated}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  );
};

export default App;
