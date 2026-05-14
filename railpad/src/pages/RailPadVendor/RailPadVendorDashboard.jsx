import React, { useState, useEffect } from 'react';
import '../../styles/RailPadVendor.css';
import PlantDeclarationDashboard from './PlantDeclaration/PlantDeclarationDashboard';
import InventoryManagementDashboard from './InventoryManagement/InventoryManagementDashboard';
import ProductionDeclarationDashboard from './ProductionDeclaration/ProductionDeclarationDashboard';
import PoAssignedDashboard from './POAssigned/PoAssignedDashboard';
import RequestedCallsDashboard from './RequestedCalls/RequestedCallsDashboard';
import inspectionCallService from '../../services/inspectionCallService';

const RailPadVendorDashboard = ({ selectedPlant, plantId: propPlantId }) => {
    const [selectedModule, setSelectedModule] = useState(() => {
        return localStorage.getItem('railpad_selectedModule') || 'po-assigned';
    });
    const [requestedCallsCount, setRequestedCallsCount] = useState(0);

    const vendorName = localStorage.getItem('railpad_vendorName') || 'RailPad Vendor';
    const plantName = selectedPlant?.plantName || localStorage.getItem('railpad_selectedPlantName');
    let plantId = propPlantId || selectedPlant?.plantId || localStorage.getItem('railpad_selectedPlantId');
    if (plantId === "1") plantId = null;

    useEffect(() => {
        localStorage.setItem('railpad_selectedModule', selectedModule);
    }, [selectedModule]);

    useEffect(() => {
        fetchCounts();
    }, []);

    const fetchCounts = async () => {
        try {
            const vendorCode = localStorage.getItem('railpad_vendorCode');
            if (vendorCode) {
                const calls = await inspectionCallService.getByVendor(vendorCode);
                setRequestedCallsCount(Array.isArray(calls) ? calls.length : 0);
            }
        } catch (err) {
            console.error("Error fetching module counts:", err);
        }
    };

    const modules = [
        { id: 'po-assigned', title: 'PO Assigned to Vendor', subtitle: 'PO status & details', icon: '📦' },
        { id: 'requested-calls', title: 'Requested Calls', subtitle: 'Request Inspection Call Status', count: requestedCallsCount },
        { id: 'verified-locked', title: 'Verified & Locked Calls', subtitle: 'Inspection Calls & IC Download', icon: '🔒' },
        { id: 'inventory-management', title: 'Inventory Management System', subtitle: 'Stock & consumption', icon: '📦' },
        { id: 'production-declaration', title: 'Production Declaration', subtitle: 'Daily production logs', icon: '📝' },
        { id: 'calibration-approval', title: 'Calibration & Approval', subtitle: 'Equipment validation', icon: '⚖️' },
        { id: 'finance', title: 'Finance', subtitle: 'Payments & Billings', icon: '💰' },
        { id: 'plant-declaration', title: 'Plant Declaration', subtitle: 'Plant setup & masters', icon: '🏗️' }
    ];


    const renderContent = () => {
        const contextProps = {
            plantId,
            vendorCode: localStorage.getItem('railpad_vendorCode'),
            vendorName,
            selectedModule
        };

        switch (selectedModule) {
            case 'plant-declaration':
                return <PlantDeclarationDashboard {...contextProps} />;
            case 'inventory-management':
                return <InventoryManagementDashboard {...contextProps} />;
            case 'production-declaration':
                return <ProductionDeclarationDashboard {...contextProps} />;
            case 'po-assigned':
                return <PoAssignedDashboard {...contextProps} />;
            case 'requested-calls':
                return <RequestedCallsDashboard {...contextProps} />;
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
            <header style={{ 
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                marginBottom: '24px' 
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <span style={{ 
                                background: '#e0f2fe', 
                                color: '#0369a1', 
                                padding: '6px 14px', 
                                borderRadius: '20px', 
                                fontSize: '12px', 
                                fontWeight: '700',
                                border: '1px solid #bae6fd',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                🏢 {vendorName}
                            </span>
                            {plantName && (
                                <span style={{ 
                                    background: '#f0fdf4', 
                                    color: '#166534', 
                                    padding: '6px 14px', 
                                    borderRadius: '20px', 
                                    fontSize: '12px', 
                                    fontWeight: '700',
                                    border: '1px solid #bbf7d0',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    📍 {plantName} {plantId ? `(${plantId})` : ''}
                                </span>
                            )}
                        </div>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            color: '#0f172a',
                            letterSpacing: '-0.025em',
                            margin: 0,
                            lineHeight: '1.2'
                        }}>
                            Rail-Pad Vendor Dashboard
                        </h1>
                    </div>
                    <div style={{ 
                        textAlign: 'right',
                        background: '#f8fafc',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Today's Date
                        </p>
                        <p style={{ margin: '4px 0 0 0', color: '#0f172a', fontSize: '16px', fontWeight: '700' }}>
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
                    gridTemplateColumns: 'repeat(4, 1fr)',
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
