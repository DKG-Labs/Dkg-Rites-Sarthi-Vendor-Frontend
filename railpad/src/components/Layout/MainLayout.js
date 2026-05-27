import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import PlantSelectionModal from '../Modals/PlantSelectionModal.jsx';

const MainLayout = ({ children, activeItem, onItemClick, onLogout, selectedPlant, onPlantSelect, vendorCode: propVendorCode, vendorName: propVendorName }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

    const vendorCode = propVendorCode || localStorage.getItem('railpad_vendorCode');
    const vendorName = propVendorName || localStorage.getItem('railpad_vendorName') || 'RailPad Vendor';

    const handlePlantSelect = (plant) => {
        onPlantSelect(plant);
    };

    return (
        <div className="main-layout-root">
            {/* Plant Selection Modal */}
            {vendorCode && !selectedPlant && (
                <PlantSelectionModal
                    vendorCode={vendorCode}
                    initialVendorName={vendorName}
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
                        <div className="brand-block" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginLeft: '8px' }}>
                            <img
                                src="/railpad/sarthi-logo.png"
                                alt="SARTHI Logo"
                                className="brand-logo"
                                style={{ height: '64px', width: 'auto' }}
                            />
                            <div className="brand-text" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="brand-title" style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.5px', lineHeight: '1.2' }}>SARTHI</div>
                                <div className="brand-subtitle" style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                    System for Automated Review, Tracking & Holistic Inspection
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {selectedPlant && (
                            <div style={{
                                background: '#f0fdf4',
                                color: '#166534',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '700',
                                border: '1px solid #bbf7d0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                📍 {selectedPlant.plantName} ({selectedPlant.plantId})
                            </div>
                        )}
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
                                fontSize: '14px',
                                fontWeight: '700'
                            }}>{vendorName.charAt(0)}</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{vendorName}</span>
                                <button
                                    onClick={onLogout}
                                    style={{ padding: '0', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    Logout
                                </button>
                            </div>
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

