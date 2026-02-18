import React, { useState } from 'react';
import PlantDeclarationDashboard from './plantDeclaration/PlantDeclarationDashboard';
import ProductionDeclarationDashboard from './ProductionDeclarationDashboard';
import InventoryManagementDashboard from './inventoryManagement/InventoryManagementDashboard';

const VendorDashboard = () => {
    const [selectedModule, setSelectedModule] = useState('inventory-management');

    const modules = [
        { id: 'plant-declaration', title: 'Plant Declaration', subtitle: 'Plant setup & masters' },
        { id: 'inventory-management', title: 'Inventory Management System', subtitle: 'Stock & consumption' },
        { id: 'production-declaration', title: 'Production Declaration', subtitle: 'Daily production logs' },
        { id: 'calibration-approval', title: 'Calibration & Approval', subtitle: 'Equipment validation' }
    ];

    const renderContent = () => {
        switch (selectedModule) {
            case 'plant-declaration':
                return <PlantDeclarationDashboard />;
            case 'production-declaration':
                return <ProductionDeclarationDashboard />;
            case 'inventory-management':
                return <InventoryManagementDashboard />;
            default:
                return (
                    <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🏗️</div>
                        <h3>{modules.find(m => m.id === selectedModule)?.title}</h3>
                        <p>This module is currently under development.</p>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-container" style={{ padding: '24px' }}>
            <header style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{
                            fontSize: 'var(--fs-2xl)',
                            fontWeight: '800',
                            color: '#1e293b',
                            margin: '0 0 8px 0',
                            letterSpacing: '-0.025em'
                        }}>
                            Sleeper-Vendor
                        </h1>
                        <p style={{ margin: 0, color: '#64748b', fontSize: 'var(--fs-sm)' }}>
                            Manage plant setup and daily production declarations
                        </p>
                    </div>
                </div>
            </header>

            {/* Module Navigation */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 300px))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                {modules.map(mod => (
                    <div
                        key={mod.id}
                        onClick={() => setSelectedModule(mod.id)}
                        style={{
                            background: selectedModule === mod.id ? '#f0f9fa' : 'white',
                            border: `2px solid ${selectedModule === mod.id ? '#42818c' : '#e2e8f0'}`,
                            borderRadius: '32px',
                            padding: '24px 20px',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            textAlign: 'center',
                            boxShadow: selectedModule === mod.id ? '0 10px 15px -3px rgba(66, 129, 140, 0.05)' : 'none',
                            transform: selectedModule === mod.id ? 'translateY(-2px)' : 'none'
                        }}
                    >
                        <span style={{
                            fontWeight: '800',
                            fontSize: 'var(--fs-md)',
                            color: '#42818c',
                            letterSpacing: '-0.01em'
                        }}>
                            {mod.title}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{mod.subtitle}</span>
                    </div>
                ))}
            </div>

            <div className="fade-in">
                {renderContent()}
            </div>
        </div>
    );
};

export default VendorDashboard;
