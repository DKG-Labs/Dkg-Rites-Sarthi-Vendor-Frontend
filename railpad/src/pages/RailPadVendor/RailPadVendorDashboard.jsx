import React, { useState } from 'react';
import '../../styles/RailPadVendor.css';
import PlantDeclarationDashboard from './PlantDeclaration/PlantDeclarationDashboard';
import InventoryManagementDashboard from './InventoryManagement/InventoryManagementDashboard';
import ProductionDeclarationDashboard from './ProductionDeclaration/ProductionDeclarationDashboard';
import VendorFeedback from '../../components/Feedback/VendorFeedback';


const RailPadVendorDashboard = () => {
    const [selectedModule, setSelectedModule] = useState(() => {
        return localStorage.getItem('railpad_selectedModule') || 'inventory-management';
    });

    React.useEffect(() => {
        localStorage.setItem('railpad_selectedModule', selectedModule);
    }, [selectedModule]);

    const modules = [
        { id: 'plant-declaration', title: 'Plant Declaration', subtitle: 'Plant setup & masters', icon: '🏗️' },
        { id: 'inventory-management', title: 'Inventory Management System', subtitle: 'Stock & consumption', icon: '📦' },
        { id: 'production-declaration', title: 'Production Declaration', subtitle: 'Daily production logs', icon: '📝' },
        { id: 'feedback', title: 'Feedback', subtitle: 'Send feedback to Board', icon: '💬' }
    ];


    const renderContent = () => {
        switch (selectedModule) {
            case 'plant-declaration':
                return <PlantDeclarationDashboard />;
            case 'inventory-management':
                return <InventoryManagementDashboard />;
            case 'production-declaration':
                return <ProductionDeclarationDashboard />;
            case 'feedback':
                const railpadUser = {
                    userId: localStorage.getItem('railpad_userId') || 999,
                    userName: localStorage.getItem('railpad_userName') || 'RailPad Vendor',
                    roleName: 'Railpad Vendor'
                };
                return <VendorFeedback currentUser={railpadUser} productContext="Railpad Vendor" />;

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
        <div className="railpad-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
            <header style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            color: '#0f172a',
                            letterSpacing: '-0.025em'
                        }}>
                            Rail-Pad Vendor Dashboard
                        </h1>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
                            Quality assurance and production management system
                        </p>
                    </div>
                </div>
            </header>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px'
                }}>
                    {modules.map(mod => (
                        <div
                            key={mod.id}
                            onClick={() => setSelectedModule(mod.id)}
                            className={`main-card ${selectedModule === mod.id ? 'active' : ''}`}
                            style={{
                                background: selectedModule === mod.id ? '#f0f7ff' : '#ffffff',
                                border: `1px solid ${selectedModule === mod.id ? '#3b82f6' : '#e5e7eb'}`,
                                borderRadius: '10px',
                                padding: '10px 14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                height: '85px',
                                width: '100%',
                                boxSizing: 'border-box',
                                boxShadow: selectedModule === mod.id ? '0 0 0 1px #3b82f6' : 'none'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                flex: 1,
                                minWidth: 0
                            }}>
                                <span style={{
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    color: selectedModule === mod.id ? '#1e40af' : '#111827',
                                    lineHeight: '1.2',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {mod.title}
                                </span>
                                <span style={{
                                    fontSize: '10px',
                                    color: selectedModule === mod.id ? '#3b82f6' : '#6b7280',
                                    fontWeight: '500',
                                    lineHeight: '1.1',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {mod.subtitle}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: '6px'
                            }}>
                                {mod.count !== undefined ? (
                                    <span style={{
                                        fontSize: '28px',
                                        fontWeight: '800',
                                        color: selectedModule === mod.id ? '#2563eb' : '#000000',
                                        lineHeight: '1'
                                    }}>
                                        {mod.count}
                                    </span>
                                ) : (
                                    <div style={{
                                        fontSize: '18px',
                                        background: mod.id === 'calibration-approval' ? '#3b82f6' : 'transparent',
                                        padding: mod.id === 'calibration-approval' ? '6px' : '0',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {mod.icon}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fade-in" style={{ marginTop: '20px' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default RailPadVendorDashboard;
