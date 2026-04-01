import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import PlantSelectionModal from '../common/PlantSelectionModal';

const MainLayout = ({ children, activeItem, onItemClick, onLogout }) => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

    const [vendorCode, setVendorCode] = useState(null);
    const [userId, setUserId] = useState(null);
    const [selectedPlant, setSelectedPlant] = useState(() => {
        const saved = localStorage.getItem('selectedPlant');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search || window.location.search);
        const code = params.get('vendorCode');
        if (code) {
            setVendorCode(code);
            sessionStorage.setItem('vendorCode', code);
            // Directly fetch user details matching the plant/vendor code pattern without using local storage
            fetch('https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/api/auth/loginBasedOnType', {
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
                if (data && data.responseData && data.responseData.userId) {
                    setUserId(data.responseData.userId);
                    sessionStorage.setItem('userId', data.responseData.userId);
                }
            })
            .catch(err => console.error("API error fetching user:", err));
        }
    }, [location]);

    const handlePlantSelect = (plant) => {
        setSelectedPlant(plant);
        localStorage.setItem('selectedPlant', JSON.stringify(plant));
    };

    return (
        <div className="main-layout-root">
            {/* Plant Selection Modal */}
            {vendorCode && !selectedPlant && (
                <PlantSelectionModal 
                    vendorCode={vendorCode} 
                    onSelect={handlePlantSelect} 
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

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
