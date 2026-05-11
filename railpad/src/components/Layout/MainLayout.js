import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import PlantSelectionModal from '../Modals/PlantSelectionModal.jsx';

const MainLayout = ({ children, activeItem, onItemClick, onLogout }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

    const [vendorCode] = useState(() => localStorage.getItem('railpad_vendorCode'));
    const [vendorName] = useState(() => localStorage.getItem('railpad_vendorName') || 'RailPad Vendor');
    const [selectedPlant, setSelectedPlant] = useState(() => {
        const id = localStorage.getItem('railpad_selectedPlantId');
        const name = localStorage.getItem('railpad_selectedPlantName');
        return id ? { plantId: id, plantName: name } : null;
    });

    const handlePlantSelect = (plant) => {
        localStorage.setItem('railpad_selectedPlantId', plant.plantId);
        localStorage.setItem('railpad_selectedPlantName', plant.plantName);
        setSelectedPlant(plant);
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

