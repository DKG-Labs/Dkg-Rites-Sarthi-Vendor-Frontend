import React, { useState, useEffect } from 'react';
import PlantDeclarationDashboard from './plantDeclaration/PlantDeclarationDashboard';
import ProductionDeclarationDashboard from './ProductionDeclarationDashboard';
import InventoryManagementDashboard from './inventoryManagement/InventoryManagementDashboard';
import PoAssignedDashboard from './PoAssignedDashboard';
import CallsRequestedDashboard from './CallsRequestedDashboard';
import CallsCompletedDashboard from './CallsCompletedDashboard';
import FinanceDashboard from './FinanceDashboard';
import MasterUpdatingDashboard from './MasterUpdatingDashboard';
import VendorIncomingRequests from '../vendor/VendorIncomingRequests';
import VendorFeedback from '../../components/Feedback/VendorFeedback';
import { apiService } from '../../services/api';


import { useLocation } from 'react-router-dom';

const VendorDashboard = () => {
    const location = useLocation();
    const [selectedModule, setSelectedModule] = useState(() => {
        return sessionStorage.getItem('sleeperVendorActiveModule') || location.state?.selectedModule || 'inventory-management';
    });

    useEffect(() => {
        sessionStorage.setItem('sleeperVendorActiveModule', selectedModule);
    }, [selectedModule]);

    // ── Shared State (lifted up) ─────────────────────────────────────────────
    const [inspectionCalls, setInspectionCalls] = useState([]);
    const [poCount, setPoCount] = useState(0);

    const fetchInitialCounts = async () => {
        try {
            const userId = sessionStorage.getItem('userId') || 118;
            const calls = await apiService.getVendorInspectionCalls(userId);
            setInspectionCalls(calls || []);

            const pos = await apiService.getVendorPOs();
            setPoCount(pos?.length || 0);
        } catch (err) {
            console.error("Failed to fetch dashboard counts", err);
        }
    };

    useEffect(() => {
        fetchInitialCounts();
    }, []);

    /** Called by RaiseInspectionCallForm → PoAssignedDashboard → here */
    const handleSubmitInspectionCall = async (newCall) => {
        // Fetch fresh data from server to ensure card count and list are in sync
        await fetchInitialCounts();
        // Switch to Requested Calls tab
        setSelectedModule('calls-requested');
    };

    // Pending = only "Pending for verification" status calls
    const pendingCount = inspectionCalls.filter(c => c.status === 'Pending for verification').length;

    const modules = [
        { id: 'po-assigned', title: 'PO Assigned to Vendor', subtitle: 'PO status & details', count: poCount },
        { id: 'calls-requested', title: 'Requested Calls', subtitle: 'Request Inspection Call Status', count: inspectionCalls.length },
        { id: 'calls-completed', title: 'Completed Calls', subtitle: 'Inspection Calls & IC Download', count: 4 },
        { id: 'calibration-approval', title: 'Calibration & Approval', subtitle: 'Equipment validation', icon: '⚖️', underDevelopment: true },
        { id: 'finance', title: 'Finance', subtitle: 'Payments & Billings', icon: '💰', underDevelopment: true, hidden: true },
        { id: 'production-declaration', title: 'Production Declaration', subtitle: 'Daily production logs', icon: '📝' },
        { id: 'inventory-management', title: 'Inventory Management System', subtitle: 'Stock & consumption', icon: '📦', underDevelopment: true },
        { id: 'plant-declaration', title: 'Plant Declaration', subtitle: 'Plant setup & masters', icon: '🏗️' },
        { id: 'master-updating', title: 'Master Updating', subtitle: 'Resource masters', icon: '🔄', underDevelopment: true, hidden: true },
        { id: 'requested-changes', title: 'Requested Changes', subtitle: 'Modifications from IE', icon: '🔔', hidden: true },
        { id: 'feedback', title: 'Feedback', subtitle: 'Send feedback to Board', icon: '💬', hidden: true }
    ];


    const renderContent = () => {
        switch (selectedModule) {
            case 'requested-changes':
                return <VendorIncomingRequests />;
            case 'plant-declaration':
                return <PlantDeclarationDashboard />;
            case 'production-declaration':
                return <ProductionDeclarationDashboard />;
            case 'inventory-management':
                return <InventoryManagementDashboard />;
            case 'po-assigned':
                return <PoAssignedDashboard onSubmitInspectionCall={handleSubmitInspectionCall} />;
            case 'calls-requested':
                return <CallsRequestedDashboard inspectionCalls={inspectionCalls} onRefresh={fetchInitialCounts} />;
            case 'calls-completed':
                return <CallsCompletedDashboard inspectionCalls={inspectionCalls} />;
            case 'finance':
                return <FinanceDashboard inspectionCalls={inspectionCalls} />;
            case 'feedback':
                const sleeperUser = {
                    userId: sessionStorage.getItem('userId'),       // numeric DB id (e.g. "183") → used for API calls
                    vendorCode: sessionStorage.getItem('vendorCode'), // e.g. ":41647" → used for display
                    userCode: sessionStorage.getItem('vendorCode'),
                    userName: sessionStorage.getItem('vendorCode'),
                    roleName: 'Sleeper Vendor'
                };

                return <VendorFeedback currentUser={sleeperUser} productContext="Sleeper Vendor" />;
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
        <div className="dashboard-container" style={{ padding: '0px 24px 24px', background: '#f8fafc', minHeight: '100vh' }}>
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
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '10px'
                }}>
                    {modules.map(mod => (
                        <div
                            key={mod.id}
                            onClick={() => setSelectedModule(mod.id)}
                            style={{
                                background: selectedModule === mod.id ? '#f0f7ff' : '#ffffff',
                                border: `1px solid ${selectedModule === mod.id ? '#3b82f6' : '#e5e7eb'}`,
                                borderRadius: '10px',
                                padding: '10px 14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: mod.hidden ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                minHeight: '85px',
                                height: 'auto',
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
                                {mod.underDevelopment && (
                                    <span style={{
                                        alignSelf: 'flex-start',
                                        background: selectedModule === mod.id ? '#fffbeb' : '#fffbeb',
                                        color: '#b45309',
                                        border: '1px solid #fde68a',
                                        borderRadius: '4px',
                                        fontSize: '8.5px',
                                        fontWeight: '800',
                                        padding: '2px 6px',
                                        marginTop: '4px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.03em',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        lineHeight: '1'
                                    }}>
                                        <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: '#b45309' }}></span>
                                        Under Development
                                    </span>
                                )}
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

export default VendorDashboard;
