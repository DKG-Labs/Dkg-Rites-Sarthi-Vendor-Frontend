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
                                    {selectedPlant ? `Railpad Vendor • Plant ID : ${selectedPlant.plantId}` : `Railpad Vendor • ID: ${vendorCode}`}
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

