import React, { useState } from 'react';
import InventoryDetail from './InventoryDetail';

const InventoryManagementDashboard = () => {
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    const materials = [
        { id: 'hts-wire', name: 'HTS wire', unit: 'MT', quantity: 156.5, alerts: ['Test expiring in 3 days'], icon: '⛓️' },
        { id: 'cement', name: 'Cement', unit: 'Bags', quantity: 1250, alerts: [], icon: '🧱' },
        { id: 'admixture', name: 'Admixture', unit: 'Liters', quantity: 450, alerts: ['Min stock breach'], icon: '🧪' },
        { id: 'aggregates', name: 'Aggregates', unit: 'MT', quantity: 890, alerts: [], icon: '🪨' },
        { id: 'sgci-insert', name: 'SGCI Insert', unit: 'Nos', quantity: 5000, alerts: [], icon: '🔩' },
        { id: 'dowel', name: 'Dowel', unit: 'Nos', quantity: 3200, alerts: [], icon: '📍' },
    ];

    if (selectedMaterial) {
        return (
            <InventoryDetail
                material={selectedMaterial}
                onBack={() => setSelectedMaterial(null)}
            />
        );
    }

    return (
        <div className="inventory-dashboard fade-in">
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
                padding: '10px 0'
            }}>
                {materials.map(material => (
                    <div
                        key={material.id}
                        onClick={() => setSelectedMaterial(material)}
                        style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '1px solid #e2e8f0',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                            e.currentTarget.style.borderColor = '#42818c';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                background: '#f0fdfa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                            }}>
                                {material.icon}
                            </div>
                            {material.alerts.length > 0 && (
                                <div style={{
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    ⚠️ {material.alerts.length} Alert{material.alerts.length > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                                {material.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <span style={{ fontSize: '28px', fontWeight: '800', color: '#42818c' }}>
                                    {material.quantity.toLocaleString()}
                                </span>
                                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                                    {material.unit} available
                                </span>
                            </div>
                        </div>

                        {material.alerts.length > 0 && (
                            <div style={{
                                background: '#fff7ed',
                                border: '1px solid #ffedd5',
                                borderRadius: '12px',
                                padding: '10px 12px'
                            }}>
                                {material.alerts.map((alert, idx) => (
                                    <div key={idx} style={{ fontSize: '12px', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        • {alert}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{
                            marginTop: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '16px',
                            borderTop: '1px solid #f1f5f9'
                        }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>View Details</span>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#42818c'
                            }}>
                                →
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InventoryManagementDashboard;
