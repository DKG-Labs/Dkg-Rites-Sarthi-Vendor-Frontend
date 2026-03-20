import React, { useState, useEffect } from 'react';
import ShiftProductionForm from './sections/ShiftProductionForm';
import { apiService } from '../../services/api';

const ProductionDeclarationDashboard = () => {
    const [showForm, setShowForm] = useState(false);
    const [declarations, setDeclarations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDeclarations = async () => {
        setLoading(true);
        try {
            const data = await apiService.getProductionDeclarations();
            setDeclarations(data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch declarations:', err);
            setError('Failed to load production declarations.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        if (status === 'Verified & Locked' || status === 'Locked' || status === 'Completed') {
            return { background: '#f0fdf4', color: '#166534' };
        }
        return { background: '#fef3c7', color: '#92400e' }; // Amber for pending
    };

    const getStatusLabel = (status) => {
        if (!status || status === 'Created' || status === 'Pending') return 'Pending for verification';
        if (status === 'Completed' || status === 'Locked') return 'Verified & Locked';
        return status;
    };

    useEffect(() => {
        fetchDeclarations();
    }, []);

    const handleSaveProduction = async (pdData) => {
        try {
            await apiService.saveProductionDeclaration(pdData);
            fetchDeclarations(); // Refresh list
            setShowForm(false);
        } catch (err) {
            console.error('Failed to save declaration:', err);
            alert('Failed to save declaration: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this declaration?')) return;
        try {
            await apiService.deleteProductionDeclaration(id);
            fetchDeclarations(); // Refresh list
        } catch (err) {
            console.error('Failed to delete declaration:', err);
            alert('Failed to delete declaration.');
        }
    };

    if (showForm) {
        return <ShiftProductionForm
            onBack={() => setShowForm(false)}
            onSave={handleSaveProduction}
            lastBatchNumber={declarations.length > 0 ? declarations[0].batchNumber : '100'}
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
                        {(declarations.reduce((acc, d) => acc + (d.totalCastedSleepers || 0), 0)).toLocaleString()}
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
                        {declarations[0]?.batchNumber || 'N/A'} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>({declarations[0]?.castingDate || 'N/A'})</span>
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
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading production declarations...</div>
                ) : error ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Date & Shift</th>
                                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Line/Shed No.</th>
                                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Batch No.</th>
                                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Total Casted</th>
                                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Type</th>
                                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Status</th>
                                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {declarations.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No production declarations found.</td>
                                </tr>
                            ) : (
                                declarations.map((item, index) => (
                                    <tr key={item.id || index} style={{ borderBottom: index === declarations.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155' }}>
                                            <div style={{ fontWeight: '600' }}>{item.castingDate}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>{item.shift}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155' }}>{item.productionUnit}</td>
                                        <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155', fontWeight: '700' }}>{item.batchNumber}</td>
                                        <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155', fontWeight: '600' }}>{item.totalCastedSleepers}</td>
                                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569' }}>{item.plantType}</td>
                                        <td style={{ padding: '16px 20px', fontSize: '14px' }}>
                                            <span style={{
                                                ...getStatusStyle(item.status),
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '700'
                                            }}>
                                                {getStatusLabel(item.status).toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    style={{
                                                        border: 'none',
                                                        background: '#fee2e2',
                                                        color: '#b91c1c',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ProductionDeclarationDashboard;
