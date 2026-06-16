import React, { useState, useEffect } from 'react';
import InventoryDetail from './InventoryDetail';
import { apiService } from '../../../services/api';

const InventoryManagementDashboard = () => {
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [materials, setMaterials] = useState([
        { id: 'hts-wire', name: 'HTS wire', unit: 'Kg', quantity: 156.5, alerts: ['Test expiring in 3 days'], icon: '⛓️' },
        { id: 'cement', name: 'Cement', unit: 'Kg', quantity: 1250, alerts: [], icon: '🧱' },
        { id: 'admixture', name: 'Admixture', unit: 'Kg', quantity: 450, alerts: ['Min stock breach'], icon: '🧪' },
        { id: 'aggregates', name: 'Aggregates', unit: 'Kg', quantity: 890, alerts: [], icon: '🪨' },
        { id: 'sgci-insert', name: 'SGCI Insert', unit: 'Nos', quantity: 5000, alerts: [], icon: '🔩' },
        { id: 'dowel', name: 'Dowel', unit: 'Nos', quantity: 3200, alerts: [], icon: '📍' },
    ]);

    useEffect(() => {
        const fetchAllBalances = async () => {
            try {
                const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
                const currentPlantId = selectedPlant ? selectedPlant.plantId : null;

                const filterByPlant = (items) => {
                    if (!currentPlantId || !Array.isArray(items)) return items || [];
                    return items.filter(item => String(item.plantId) === String(currentPlantId));
                };

                const isVerifiedStatus = (status) => {
                    return status === 'Completed' || status === 'Locked' || status === 'Verified';
                };

                const getBalanceForMaterial = async (matId) => {
                    let procuredList = [];
                    if (matId === 'hts-wire') {
                        procuredList = filterByPlant(await apiService.getHtsWires());
                    } else if (matId === 'cement') {
                        procuredList = filterByPlant(await apiService.getCements());
                    } else if (matId === 'dowel') {
                        procuredList = filterByPlant(await apiService.getDowels());
                    } else if (matId === 'aggregates') {
                        procuredList = filterByPlant(await apiService.getAggregates());
                    } else if (matId === 'admixture') {
                        procuredList = filterByPlant(await apiService.getAdmixtures());
                    } else if (matId === 'sgci-insert') {
                        procuredList = filterByPlant(await apiService.getSgciInserts());
                    }

                    const procuredTotal = procuredList
                        .filter(e => isVerifiedStatus(e.status))
                        .reduce((acc, curr) => acc + Number(curr.totalQtyReceived || curr.totalQuantity || curr.qty || 0), 0);

                    let usedList = [];
                    const savedUsed = localStorage.getItem(`inventory_used_${matId}`);
                    if (savedUsed) {
                        usedList = JSON.parse(savedUsed);
                    } else {
                        // Default seed values for demonstration
                        if (matId === 'hts-wire' && procuredTotal > 0) usedList = [{ qty: 1085, status: 'Completed' }];
                        else if (matId === 'cement' && procuredTotal > 0) usedList = [{ qty: 5000, status: 'Completed' }];
                        else if (matId === 'aggregates' && procuredTotal > 0) usedList = [{ qty: 6200, status: 'Completed' }];
                    }

                    const usedTotal = usedList
                        .filter(e => isVerifiedStatus(e.status))
                        .reduce((acc, curr) => acc + Number(curr.qty || 0), 0);

                    // Return the calculated balance if there are entries, otherwise 0
                    if (procuredList.length === 0 && usedList.length === 0) return -1;
                    return procuredTotal - usedTotal;
                };

                const updated = await Promise.all(
                    materials.map(async (m) => {
                        const bal = await getBalanceForMaterial(m.id);
                        return {
                            ...m,
                            quantity: bal >= 0 ? bal : m.quantity
                        };
                    })
                );
                setMaterials(updated);
            } catch (error) {
                console.error("Error fetching balances for dashboard:", error);
            }
        };

        fetchAllBalances();
    }, [selectedMaterial]);

    return (
        <div className="inventory-dashboard fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Inventory Overview</h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Select a material to view details and manage stock</p>
            </div>

            {/* Horizontal Row of Material Cards */}
            <div style={{
                display: 'flex',
                gap: '12px',
                padding: '10px 4px 20px 4px',
                flexWrap: 'wrap',
                justifyContent: 'flex-start'
            }}>
                {materials.map(material => (
                    <div
                        key={material.id}
                        onClick={() => setSelectedMaterial(selectedMaterial?.id === material.id ? null : material)}
                        style={{
                            minWidth: '180px',
                            flex: '1 1 180px',
                            maxWidth: '220px',
                            background: selectedMaterial?.id === material.id ? '#f0f9ff' : 'white',
                            borderRadius: '16px',
                            padding: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: `2px solid ${selectedMaterial?.id === material.id ? '#0ea5e9' : '#e2e8f0'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: selectedMaterial?.id === material.id ? '0 10px 15px -3px rgba(14, 165, 233, 0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedMaterial?.id !== material.id) {
                                e.currentTarget.style.borderColor = '#0ea5e9';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedMaterial?.id !== material.id) {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: selectedMaterial?.id === material.id ? '#e0f2fe' : '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                        }}>
                            {material.icon}
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                                    {material.name}
                                </h3>
                                {material.alerts.length > 0 && (
                                    <span title={material.alerts.join(', ')} style={{ color: '#ef4444', fontSize: '14px' }}>⚠️</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: '18px', fontWeight: '800', color: '#0369a1' }}>
                                    {material.quantity.toLocaleString()}
                                </span>
                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                    {material.unit}
                                </span>
                            </div>
                        </div>

                        {selectedMaterial?.id === material.id && (
                            <div style={{
                                position: 'absolute',
                                bottom: '-10px',
                                  left: '50%',
                                transform: 'translateX(-50%)',
                                width: '0',
                                height: '0',
                                borderLeft: '10px solid transparent',
                                borderRight: '10px solid transparent',
                                borderBottom: '10px solid #f8fafc',
                                zIndex: 10
                            }}></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Detail View Below the Row */}
            {selectedMaterial ? (
                <div style={{
                    marginTop: '20px',
                    padding: '24px',
                    background: '#f8fafc',
                    borderRadius: '24px',
                    border: '1px solid #e2e8f0',
                    minHeight: '400px'
                }}>
                    <InventoryDetail
                        material={selectedMaterial}
                        onBack={() => setSelectedMaterial(null)}
                    />
                </div>
            ) : (
                <div style={{
                    marginTop: '20px',
                    padding: '60px',
                    textAlign: 'center',
                    background: 'white',
                    borderRadius: '24px',
                    border: '2px dashed #e2e8f0',
                    color: '#94a3b8'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#64748b' }}>No Material Selected</h3>
                    <p style={{ margin: 0 }}>Click on any material above to view its detailed inventory and management options.</p>
                </div>
            )}
        </div>
    );
};

export default InventoryManagementDashboard;
