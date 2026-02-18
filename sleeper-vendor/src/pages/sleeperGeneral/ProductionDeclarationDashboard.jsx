import React, { useState } from 'react';
import ShiftProductionForm from './sections/ShiftProductionForm';

const ProductionDeclarationDashboard = () => {
    const [showForm, setShowForm] = useState(false);
    const [declarations, setDeclarations] = useState([
        { date: '2026-02-10', shift: 'A', batchNo: 'B-102', unit: 'Shed A', total: 400, netGood: 395, status: 'Open' },
        { date: '2026-02-09', shift: 'B', batchNo: 'B-101', unit: 'Shed B', total: 380, netGood: 370, status: 'Locked' },
        { date: '2026-02-08', shift: 'A', batchNo: 'B-100', unit: 'Shed A', total: 420, netGood: 410, status: 'Locked' },
        { date: '2026-02-07', shift: 'C', batchNo: 'B-099', unit: 'Line 1', total: 350, netGood: 345, status: 'Locked' },
        { id: 4, date: '2026-02-06', shift: 'General', batchNo: 'B-098', unit: 'Shed A', total: 400, netGood: 390, status: 'Locked' },
    ]);

    const handleSaveProduction = (newEntry) => {
        setDeclarations([newEntry, ...declarations]);
    };

    if (showForm) {
        return <ShiftProductionForm
            onBack={() => setShowForm(false)}
            onSave={handleSaveProduction}
            lastBatchNumber={declarations.length > 0 ? parseInt(declarations[0].batchNo.split('-')[1]) : 100}
        />;
    }

    return (
        <div className="fade-in">
            {/* Statistical Summary Bar */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    padding: '24px',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '60px', opacity: 0.05, transform: 'rotate(-15deg)' }}>🏗️</div>
                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Sleepers Cast</p>
                    <p style={{ margin: '0 0 4px 0', color: '#94a3b8', fontSize: '10px', fontWeight: '600' }}>Current Month</p>
                    <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '900' }}>
                        {(declarations.reduce((acc, d) => acc + d.total, 0)).toLocaleString()}
                    </h2>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f9fa 100%)',
                    padding: '24px',
                    borderRadius: '20px',
                    border: '1px solid #42818c33',
                    boxShadow: '0 10px 15px -3px rgba(66, 129, 140, 0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '60px', opacity: 0.05, transform: 'rotate(-15deg)' }}>🔢</div>
                    <p style={{ margin: '0 0 8px 0', color: '#42818c', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last Batch Declared</p>
                    <p style={{ margin: '0 0 4px 0', color: '#94a3b8', fontSize: '10px', fontWeight: '600' }}>Batch No. & Date</p>
                    <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '900' }}>
                        {declarations[0]?.batchNo} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>({declarations[0]?.date})</span>
                    </h2>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)',
                    padding: '24px',
                    borderRadius: '20px',
                    border: '1px solid #fecdd3',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '60px', opacity: 0.05, transform: 'rotate(-15deg)' }}>📉</div>
                    <p style={{ margin: '0 0 8px 0', color: '#e11d48', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Avg. Rejection Rate</p>
                    <p style={{ margin: '0 0 4px 0', color: '#94a3b8', fontSize: '10px', fontWeight: '600' }}>Quality Matrix (%)</p>
                    <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '900' }}>1.2%</h2>
                </div>
            </div>

            {/* Header with Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>Recent Declarations (Last 10)</h3>
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        background: '#42818c',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px -1px rgba(66, 129, 140, 0.2)'
                    }}
                >
                    <span style={{ fontSize: '18px' }}>+</span> Add New Shift Production
                </button>
            </div>

            {/* Declarations Table */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Date</th>
                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Shift</th>
                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Batch No.</th>
                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Line/Shed</th>
                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Total Casted</th>
                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Net Good</th>
                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {declarations.map((item, index) => (
                            <tr key={index} style={{ borderBottom: index === declarations.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155', fontWeight: '500' }}>{item.date}</td>
                                <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155' }}>
                                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '11px' }}>{item.shift}</span>
                                </td>
                                <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155', fontWeight: '600' }}>{item.batchNo}</td>
                                <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155' }}>{item.unit}</td>
                                <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155' }}>{item.total}</td>
                                <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#16a34a' }}>{item.netGood}</td>
                                <td style={{ padding: '16px 20px', fontSize: '14px' }}>
                                    <span style={{
                                        background: item.status === 'Locked' ? '#fee2e2' : '#f0fdf4',
                                        color: item.status === 'Locked' ? '#b91c1c' : '#166534',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductionDeclarationDashboard;
