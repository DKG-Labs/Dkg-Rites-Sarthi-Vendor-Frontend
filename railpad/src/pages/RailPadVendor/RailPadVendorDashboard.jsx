import React, { useState } from 'react';
import '../../styles/RailPadVendor.css';
import PlantDeclarationDashboard from './PlantDeclaration/PlantDeclarationDashboard';
import InventoryManagementDashboard from './InventoryManagement/InventoryManagementDashboard';

const RailPadVendorDashboard = () => {
    const [currentView, setCurrentView] = useState('main');

    const modules = [
        { id: 'plant-declaration', title: 'Plant Declaration', subtitle: 'Plant setup & masters', active: true },
        { id: 'inventory-management', title: 'Inventory Management', subtitle: 'Stock & consumption', active: true },
        { id: 'production-declaration', title: 'Production Declaration', subtitle: 'Daily production logs', active: false },
        { id: 'calibration-approval', title: 'Calibration & Approval', subtitle: 'Equipment validation', active: false }
    ];

    const handleCardClick = (moduleId) => {
        if (moduleId === 'plant-declaration') setCurrentView('plant-declaration');
        if (moduleId === 'inventory-management') setCurrentView('inventory-management');
    };

    const handleBackToMain = () => setCurrentView('main');

    if (currentView === 'plant-declaration') {
        return <PlantDeclarationDashboard onBack={handleBackToMain} />;
    }

    if (currentView === 'inventory-management') {
        return <InventoryManagementDashboard onBack={handleBackToMain} />;
    }

    return (
        <div className="railpad-container">
            <header className="dashboard-header">
                <div className="dashboard-title">
                    <h1>Rail-Pad Vendor</h1>
                    <p>Manage plant setup and daily production declarations</p>
                </div>
                <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '8px 16px', borderRadius: '50px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ padding: '6px', background: 'var(--accent-bg)', borderRadius: '50%', color: 'var(--primary-color)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>ABC Industries</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>VEND001</div>
                    </div>
                </div>
            </header>

            <div className="grid-container">
                {modules.map(mod => (
                    <div
                        key={mod.id}
                        className={`main-card ${mod.active ? 'active' : ''}`}
                        onClick={() => handleCardClick(mod.id)}
                        style={{ opacity: mod.active ? 1 : 0.5, cursor: mod.active ? 'pointer' : 'not-allowed' }}
                    >
                        <h3>{mod.title}</h3>
                        <p>{mod.subtitle}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RailPadVendorDashboard;
