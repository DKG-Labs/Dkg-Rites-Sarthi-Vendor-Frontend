import React, { useState, useEffect } from 'react';
import IELandingPage from './pages/IELandingPage';
import InspectionInitiationPage from './pages/InspectionInitiationPage';
import MultiTabInspectionInitiationPage from './pages/MultiTabInspectionInitiationPage';
import RawMaterialDashboard from './pages/RawMaterialDashboard';
import ProcessDashboard from './pages/ProcessDashboard';
import FinalProductDashboard from './pages/FinalProductDashboard';
import CalibrationDocumentsPage from './pages/CalibrationDocumentsPage';
import VisualMaterialTestingPage from './pages/VisualMaterialTestingPage';
import SummaryReportsPage from './pages/SummaryReportsPage';
import VendorDashboardPage from './pages/VendorDashboardPage';
import Header from './components/Header';
import { isAuthenticated, getStoredUser } from './services/authService';
import LoginPage from './pages/LoginPage';
import SleeperVendorHost from './pages/SleeperVendorHost';


const App = () => {
  const [currentPage, setCurrentPage] = useState('vendor-dashboard');
  const [selectedCall, setSelectedCall] = useState(null);
  const [selectedCalls, setSelectedCalls] = useState([]);
  // const [userEmail] = useState('inspector@sarthi.com');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [rmHeats, setRmHeats] = useState([{ heatNo: '', weight: '' }]);
  const [rmProductModel, setRmProductModel] = useState('MK-III');



  useEffect(() => {
    try {
      window.scrollTo(0, 0);
      const mainEl = document.querySelector('.main-content');
      if (mainEl) mainEl.scrollTop = 0;
    } catch (e) { }
  }, [currentPage]);

  const handleStartInspection = (call) => {
    setSelectedCall(call);
    setSelectedCalls([call]);
    setCurrentPage('initiation');
  };

  const handleStartMultipleInspections = (calls) => {
    setSelectedCalls(calls);
    setSelectedCall(null);
    setCurrentPage('multi-initiation');
  };

  const handleProceedToInspection = (productType) => {
    if (productType === 'Raw Material') {
      setCurrentPage('raw-material');
    } else if (productType === 'ERC Process' || productType.includes('Process')) {
      setCurrentPage('process');
    } else if (productType === 'Final Product' || productType.includes('Final')) {
      setCurrentPage('final-product');
    }
  };

  const handleBackToLanding = () => {
    setCurrentPage('vendor-dashboard');
    setSelectedCall(null);
    setSelectedCalls([]);
  };

  const handleNavigateToSubModule = (subModule) => {
    setCurrentPage(subModule);
  };

  const handleBackToRawMaterial = () => {
    setCurrentPage('raw-material');
  };

  const user = getStoredUser();

  return (
    !isAuthenticated() ? (
      <LoginPage />
    ) : user?.roleName === 'SLEEPER_VENDOR' ? (
      <SleeperVendorHost />
    ) : (
      <div>

        <Header />

        {/* <header className="app-header">
        <div className="header-left">
          <div className="app-logo">SARTHI</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Inspection Engineer Dashboard
          </div>
        </div>

        <div className="header-right">
          <button
            className="btn btn-sm btn-outline hamburger-btn"
            onClick={() => setIsSidebarOpen(open => !open)}
            aria-label="Toggle menu"
            style={{ marginRight: '8px' }}
          >
            ☰
          </button>

          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {new Date('2025-11-14T17:00:00').toLocaleString()}
          </div>

          <div className="user-info">
            <div className="user-avatar">IE</div>
            <div>
              <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>
                Vendor Dashboard
              </div>
              <div>{userEmail}</div>
            </div>
          </div>

          <button className="btn btn-sm btn-outline">Logout</button>
        </div>
      </header> */}

        <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

          <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? '»' : '«'}
            </button>

            <nav>
              <ul className="sidebar-nav">

                {/* <li
                className={`sidebar-item ${currentPage === 'landing' ? 'active' : ''}`}
                onClick={() => { handleBackToLanding(); setIsSidebarOpen(false); }}
                title="Landing Page"
              >
                <span className="sidebar-icon">🏠</span>
                <span className="sidebar-text">Landing Page</span>
              </li>

              <li
                className={`sidebar-item ${currentPage === 'raw-material' ? 'active' : ''}`}
                onClick={() => { if (selectedCall) { setCurrentPage('raw-material'); setIsSidebarOpen(false); } }}
                style={{ opacity: selectedCall ? 1 : 0.5, cursor: selectedCall ? 'pointer' : 'not-allowed' }}
                title="Raw Material Inspection"
              >
                <span className="sidebar-icon">📦</span>
                <span className="sidebar-text">Raw Material Inspection</span>
              </li>

              <li
                className={`sidebar-item ${currentPage === 'process' ? 'active' : ''}`}
                onClick={() => { if (selectedCall) { setCurrentPage('process'); setIsSidebarOpen(false); } }}
                style={{ opacity: selectedCall ? 1 : 0.5, cursor: selectedCall ? 'pointer' : 'not-allowed' }}
                title="Process Inspection"
              >
                <span className="sidebar-icon">⚙️</span>
                <span className="sidebar-text">Process Inspection</span>
              </li>

              <li
                className={`sidebar-item ${currentPage === 'final-product' ? 'active' : ''}`}
                onClick={() => { if (selectedCall) { setCurrentPage('final-product'); setIsSidebarOpen(false); } }}
                style={{ opacity: selectedCall ? 1 : 0.5, cursor: selectedCall ? 'pointer' : 'not-allowed' }}
                title="Final Product Inspection"
              >
                <span className="sidebar-icon">✅</span>
                <span className="sidebar-text">Final Product Inspection</span>
              </li> */}

                {/* ⭐ Vendor Dashboard Sidebar Button */}
                <li
                  className={`sidebar-item ${currentPage === 'vendor-dashboard' ? 'active' : ''}`}
                  onClick={() => { setCurrentPage('vendor-dashboard'); setIsSidebarOpen(false); }}
                  title="Vendor Dashboard"
                >
                  <span className="sidebar-icon">🏭</span>
                  <span className="sidebar-text">Vendor Dashboard</span>
                </li>

              </ul>
            </nav>
          </aside>

          {/* Mobile overlay */}
          {isSidebarOpen && (
            <div
              className="sidebar-overlay"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          <main className="main-content">

            {currentPage === 'landing' && (
              <IELandingPage
                onStartInspection={handleStartInspection}
                onStartMultipleInspections={handleStartMultipleInspections}
              />
            )}

            {currentPage === 'initiation' && selectedCall && (
              <InspectionInitiationPage
                call={selectedCall}
                onProceed={handleProceedToInspection}
                onBack={handleBackToLanding}
              />
            )}

            {currentPage === 'multi-initiation' && selectedCalls.length > 0 && (
              <MultiTabInspectionInitiationPage
                calls={selectedCalls}
                onProceed={handleProceedToInspection}
                onBack={handleBackToLanding}
              />
            )}

            {currentPage === 'raw-material' && (
              <RawMaterialDashboard
                onBack={handleBackToLanding}
                onNavigateToSubModule={handleNavigateToSubModule}
                onHeatsChange={setRmHeats}
                onProductModelChange={setRmProductModel}
              />
            )}

            {currentPage === 'process' && (
              <ProcessDashboard onBack={handleBackToLanding} />
            )}

            {currentPage === 'final-product' && (
              <FinalProductDashboard onBack={handleBackToLanding} />
            )}

            {/* ⭐ Vendor Dashboard Page Render */}
            {currentPage === 'vendor-dashboard' && (
              <VendorDashboardPage onBack={handleBackToLanding} />
            )}

            {/* Sub Module Pages */}
            {currentPage === 'calibration-documents' && (
              <CalibrationDocumentsPage
                onBack={handleBackToRawMaterial}
                heats={rmHeats}
              />
            )}

            {currentPage === 'visual-material-testing' && (
              <VisualMaterialTestingPage
                onBack={handleBackToRawMaterial}
                heats={rmHeats}
                productModel={rmProductModel}
              />
            )}

            {currentPage === 'summary-reports' && (
              <SummaryReportsPage onBack={handleBackToRawMaterial} />
            )}

          </main>
        </div>
      </div>
    )
  );

};

export default App;




// import React, { useState, useEffect } from 'react';
// import IELandingPage from './pages/IELandingPage';
// import InspectionInitiationPage from './pages/InspectionInitiationPage';
// import MultiTabInspectionInitiationPage from './pages/MultiTabInspectionInitiationPage';
// import RawMaterialDashboard from './pages/RawMaterialDashboard';
// import ProcessDashboard from './pages/ProcessDashboard';
// import FinalProductDashboard from './pages/FinalProductDashboard';
// import CalibrationDocumentsPage from './pages/CalibrationDocumentsPage';
// import VisualMaterialTestingPage from './pages/VisualMaterialTestingPage';
// import SummaryReportsPage from './pages/SummaryReportsPage';
// import VendorDashboardPage from './pages/VendorDashboardPage';


// const App = () => {
//   const [currentPage, setCurrentPage] = useState('landing');
//   const [selectedCall, setSelectedCall] = useState(null);
//   const [selectedCalls, setSelectedCalls] = useState([]);
//   const [userEmail] = useState('inspector@sarthi.com');
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile overlay
//   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse

//   // Shared state for submodule pages
//   const [rmHeats, setRmHeats] = useState([{ heatNo: '', weight: '' }]);
//   const [rmProductModel, setRmProductModel] = useState('MK-III');

//   useEffect(() => {
//     // Ensure page scrolls to top when switching pages
//     try {
//       window.scrollTo(0, 0);
//       const mainEl = document.querySelector('.main-content');
//       if (mainEl) mainEl.scrollTop = 0;
//     } catch (e) {
//       // ignore in non-browser environments
//     }
//   }, [currentPage]);

//   const handleStartInspection = (call) => {
//     setSelectedCall(call);
//     setSelectedCalls([call]);
//     setCurrentPage('initiation');
//   };

//   const handleStartMultipleInspections = (calls) => {
//     setSelectedCalls(calls);
//     setSelectedCall(null);
//     setCurrentPage('multi-initiation');
//   };

//   const handleProceedToInspection = (productType) => {
//     if (productType === 'Raw Material') {
//       setCurrentPage('raw-material');
//     } else if (productType === 'ERC Process' || productType.includes('Process')) {
//       setCurrentPage('process');
//     } else if (productType === 'Final Product' || productType.includes('Final')) {
//       setCurrentPage('final-product');
//     }
//   };

//   const handleBackToLanding = () => {
//     setCurrentPage('landing');
//     setSelectedCall(null);
//     setSelectedCalls([]);
//   };

//   // Navigation to submodule pages
//   const handleNavigateToSubModule = (subModule) => {
//     setCurrentPage(subModule);
//   };

//   const handleBackToRawMaterial = () => {
//     setCurrentPage('raw-material');
//   };

//   return (
//     <div>
//       <header className="app-header">
//         <div className="header-left">
//           <div className="app-logo">SARTHI</div>
//           <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
//             Inspection Engineer Dashboard
//           </div>
//         </div>
//         <div className="header-right">
//           <button
//             className="btn btn-sm btn-outline hamburger-btn"
//             onClick={() => setIsSidebarOpen(open => !open)}
//             aria-label="Toggle menu"
//             style={{ marginRight: '8px' }}
//           >
//             ☰
//           </button>
//           <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
//             {new Date('2025-11-14T17:00:00').toLocaleString()}
//           </div>
//           <div className="user-info">
//             <div className="user-avatar">IE</div>
//             <div>
//               <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>Inspector Engineer</div>
//               <div>{userEmail}</div>
//             </div>
//           </div>
//           <button className="btn btn-sm btn-outline">Logout</button>
//         </div>
//       </header>

//       <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
//         <aside className={`sidebar ${isSidebarOpen ? 'open' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
//           {/* Desktop collapse toggle button */}
//           <button
//             className="sidebar-toggle-btn"
//             onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
//             aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
//           >
//             {isSidebarCollapsed ? '»' : '«'}
//           </button>
//           <nav>
//             <ul className="sidebar-nav">
//               <li
//                 className={`sidebar-item ${currentPage === 'landing' ? 'active' : ''}`}
//                 onClick={() => { handleBackToLanding(); setIsSidebarOpen(false); }}
//                 title="Landing Page"
//               >
//                 <span className="sidebar-icon">🏠</span>
//                 <span className="sidebar-text">Landing Page</span>
//               </li>
//               <li
//                 className={`sidebar-item ${currentPage === 'raw-material' ? 'active' : ''}`}
//                 onClick={() => { if (selectedCall) { setCurrentPage('raw-material'); setIsSidebarOpen(false); } }}
//                 style={{ opacity: selectedCall ? 1 : 0.5, cursor: selectedCall ? 'pointer' : 'not-allowed' }}
//                 title="Raw Material Inspection"
//               >
//                 <span className="sidebar-icon">📦</span>
//                 <span className="sidebar-text">Raw Material Inspection</span>
//               </li>
//               <li
//                 className={`sidebar-item ${currentPage === 'process' ? 'active' : ''}`}
//                 onClick={() => { if (selectedCall) { setCurrentPage('process'); setIsSidebarOpen(false); } }}
//                 style={{ opacity: selectedCall ? 1 : 0.5, cursor: selectedCall ? 'pointer' : 'not-allowed' }}
//                 title="Process Inspection"
//               >
//                 <span className="sidebar-icon">⚙️</span>
//                 <span className="sidebar-text">Process Inspection</span>
//               </li>
//               <li
//                 className={`sidebar-item ${currentPage === 'final-product' ? 'active' : ''}`}
//                 onClick={() => { if (selectedCall) { setCurrentPage('final-product'); setIsSidebarOpen(false); } }}
//                 style={{ opacity: selectedCall ? 1 : 0.5, cursor: selectedCall ? 'pointer' : 'not-allowed' }}
//                 title="Final Product Inspection"
//               >
//                 <span className="sidebar-icon">✅</span>
//                 <span className="sidebar-text">Final Product Inspection</span>
//               </li>
//               <li
//   className={`sidebar-item ${currentPage === 'vendor-dashboard' ? 'active' : ''}`}
//   onClick={() => { setCurrentPage('vendor-dashboard'); setIsSidebarOpen(false); }}
//   title="Vendor Dashboard"
// >
//   <span className="sidebar-icon">🏭</span>
//   <span className="sidebar-text">Vendor Dashboard</span>
// </li>

//             </ul>
//           </nav>
//         </aside>

//         {/* Mobile overlay when sidebar is open */}
//         {isSidebarOpen && (
//           <div
//             className="sidebar-overlay"
//             onClick={() => setIsSidebarOpen(false)}
//             aria-hidden="true"
//           />
//         )}

//         <main className="main-content">
//           {currentPage === 'landing' && (
//             <IELandingPage
//               onStartInspection={handleStartInspection}
//               onStartMultipleInspections={handleStartMultipleInspections}
//             />
//           )}
//           {currentPage === 'initiation' && selectedCall && (
//             <InspectionInitiationPage
//               call={selectedCall}
//               onProceed={handleProceedToInspection}
//               onBack={handleBackToLanding}
//             />
//           )}
//           {currentPage === 'multi-initiation' && selectedCalls.length > 0 && (
//             <MultiTabInspectionInitiationPage
//               calls={selectedCalls}
//               onProceed={handleProceedToInspection}
//               onBack={handleBackToLanding}
//             />
//           )}
//           {currentPage === 'raw-material' && (
//             <RawMaterialDashboard
//               onBack={handleBackToLanding}
//               onNavigateToSubModule={handleNavigateToSubModule}
//               onHeatsChange={setRmHeats}
//               onProductModelChange={setRmProductModel}
//             />
//           )}
//           {currentPage === 'process' && (
//             <ProcessDashboard onBack={handleBackToLanding} />
//           )}
//           {currentPage === 'final-product' && (
//             <FinalProductDashboard onBack={handleBackToLanding} />
//           )}
//           {currentPage === 'vendor-dashboard' && (
//   <VendorDashboardPage onBack={handleBackToLanding} />
// )}


//           {/* Sub Module Pages - Completely Separate Pages */}
//           {currentPage === 'calibration-documents' && (
//             <CalibrationDocumentsPage
//               onBack={handleBackToRawMaterial}
//               heats={rmHeats}
//             />
//           )}
//           {currentPage === 'visual-material-testing' && (
//             <VisualMaterialTestingPage
//               onBack={handleBackToRawMaterial}
//               heats={rmHeats}
//               productModel={rmProductModel}
//             />
//           )}
//           {currentPage === 'summary-reports' && (
//             <SummaryReportsPage
//               onBack={handleBackToRawMaterial}
//             />
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default App;