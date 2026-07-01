import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import PlantSelectionModal from '../common/PlantSelectionModal';
import { BASE_URL } from '../../services/api';
import logo from '../../assets/sarthi-logo.png';

const MainLayout = ({ children, activeItem, onItemClick, onLogout }) => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

    const [vendorCode, setVendorCode] = useState(() => sessionStorage.getItem('vendorCode'));
    const [userId, setUserId] = useState(() => sessionStorage.getItem('userId'));
    const [vendorName, setVendorName] = useState(() => localStorage.getItem('vendorName') || 'Sleeper Vendor');
    const [selectedPlant, setSelectedPlant] = useState(() => {
        const saved = localStorage.getItem('selectedPlant');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search || window.location.search);
        const code = params.get('vendorCode');
        
        // Only trigger silent login if:
        // 1. There's a code in the URL
        // 2. AND it's different from the already logged-in vendorCode
        if (code && code !== sessionStorage.getItem('vendorCode')) {
            setVendorCode(code);
            sessionStorage.setItem('vendorCode', code);
            
            fetch(`${BASE_URL}/auth/loginBasedOnType`, {
                method: 'POST',
                headers: {
                    'accept': '*/*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    loginType: 'vendor',
                    loginId: code,
                    password: 'password'
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data && data.responseData) {
                    if (data.responseData.userId) {
                        setUserId(data.responseData.userId);
                        sessionStorage.setItem('userId', data.responseData.userId);
                    }
                    // Only use userName as vendorCode if it's not JUST the numeric userId
                    // This protects the alphanumeric vendor code (e.g. :41647) from being overwritten
                    // by the numeric database ID (e.g. 135).
                    if (data.responseData.userName && data.responseData.userName !== String(data.responseData.userId)) {
                        setVendorCode(data.responseData.userName);
                        sessionStorage.setItem('vendorCode', data.responseData.userName);
                    }
                    if (data.responseData.vendorName) {
                        setVendorName(data.responseData.vendorName);
                        localStorage.setItem('vendorName', data.responseData.vendorName);
                    }
                    
                    // Clean up URL parameters after successful silent login to prevent re-triggering
                    const newSearchParams = new URLSearchParams(window.location.search);
                    newSearchParams.delete('vendorCode');
                    const newPath = window.location.pathname + (newSearchParams.toString() ? '?' + newSearchParams.toString() : '');
                    window.history.replaceState({}, '', newPath);
                }
            })
            .catch(err => console.error("API error fetching user:", err));
        }
    }, [location]);

    const handlePlantSelect = (plant) => {
        setSelectedPlant(plant);
        localStorage.setItem('selectedPlant', JSON.stringify(plant));
        // Force refresh to re-init all components with new plantId
        window.location.reload();
    };

    return (
        <div className="main-layout-root">
            {/* Plant Selection Modal */}
            {vendorCode && !selectedPlant && (
                <PlantSelectionModal 
                    vendorCode={vendorCode} 
                    onSelect={handlePlantSelect} 
                    onLogout={onLogout}
                />
            )}

            {isMobileMenuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar
                activeItem={activeItem}
                onItemClick={(item) => {
                    onItemClick(item);
                    setIsMobileMenuOpen(false);
                }}
                isOpen={isMobileMenuOpen}
                expanded={isSidebarPinned || isSidebarHovered}
                onMouseEnter={() => setIsSidebarHovered(true)}
                onMouseLeave={() => setIsSidebarHovered(false)}
                onClick={() => setIsSidebarPinned(!isSidebarPinned)}
            />

            <div className="main-content-wrapper">
                <header className="main-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open menu"
                            style={{ background: '#f5f5f5', border: 'none', borderRadius: '4px', padding: '8px', display: 'flex' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <img 
                            src={logo} 
                            alt="Sarthi Logo" 
                            style={{ 
                                height: '42px', 
                                width: 'auto', 
                                objectFit: 'contain',
                                marginLeft: '8px'
                            }} 
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                            <span style={{ 
                                fontSize: 'var(--fs-lg)', 
                                fontWeight: '800', 
                                color: '#131d26',
                                letterSpacing: '0.5px'
                            }}>SARTHI</span>
                            <span style={{ 
                                fontSize: '10px', 
                                color: '#667685',
                                fontWeight: '500'
                            }}>System for Automated Review, Tracking & Holistic Inspection</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px', borderRadius: '50px' }}>
                            <div className="user-avatar" style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: '#0f172a',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '15px',
                                fontWeight: '700'
                            }}>{vendorName.substring(0, 2).toUpperCase()}</div>
                            <div className="user-meta" style={{ display: 'flex', flexDirection: 'column', paddingRight: '8px' }}>
                                <div className="user-role" style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', lineHeight: '1.2' }} title={vendorName}>
                                    {vendorName}
                                </div>
                                <div className="user-email" style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>
                                    {selectedPlant ? `Sleeper Vendor • Plant ID : ${selectedPlant.plantId}` : `Sleeper Vendor • ID: ${vendorCode}`}
                                </div>
                            </div>
                        </div>

                        {/* Separator */}
                        <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>

                        <button
                            className="btn btn-sm btn-outline logout-btn"
                            onClick={onLogout}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                padding: '8px 16px',
                                border: '1px solid #e2e8f0',
                                background: '#ffffff',
                                color: '#475569',
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#475569' }}>
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Logout
                        </button>
                    </div>
                </header>

                <main className="main-content">
                    {children}
                </main>
            </div>
        </div >
    );
};

export default MainLayout;
