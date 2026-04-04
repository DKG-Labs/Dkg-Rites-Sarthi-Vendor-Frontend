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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {userId && (
                                <div className="user-id-display" style={{
                                    background: '#ffffff',
                                    color: '#21808d',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: 'var(--fs-xs)',
                                    fontWeight: '600',
                                    border: '1px solid rgba(33, 128, 141, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <span style={{ opacity: 0.7 }}>👤</span>
                                    User ID: {userId}
                                </div>
                            )}
                            {selectedPlant && (
                                <div className="selected-plant-display" style={{
                                    background: '#f0f9fa',
                                    color: '#21808d',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: 'var(--fs-xs)',
                                    fontWeight: '600',
                                    border: '1px solid rgba(33, 128, 141, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{ opacity: 0.7 }}>📍</span>
                                    {selectedPlant.plantName} - {selectedPlant.plantId} ({vendorCode})
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: '#338691',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'var(--fs-sm)',
                                fontWeight: '600'
                            }}>V</div>
                            <button
                                onClick={onLogout}
                                style={{ padding: '0', background: 'transparent', border: 'none', color: '#475467', fontSize: 'var(--fs-sm)', fontWeight: '500', cursor: 'pointer' }}
                            >
                                Logout
                            </button>
                        </div>
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
