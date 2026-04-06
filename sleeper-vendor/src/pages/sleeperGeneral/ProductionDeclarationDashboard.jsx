import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ShiftProductionForm from './sections/ShiftProductionForm';
import { apiService } from '../../services/api';

// ── Cache helpers ─────────────────────────────────────────────────────────────
const CACHE_KEY = 'pd_declarations_cache';

const readCache = () => {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const writeCache = (data) => {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch { /* storage full – silently ignore */ }
};

const clearCache = () => {
    try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
};

// ── Skeleton row shown while data is loading ──────────────────────────────────
const SkeletonRow = () => {
    const pulse = {
        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonPulse 1.4s ease-in-out infinite',
        borderRadius: '6px',
        height: '14px',
    };
    return (
        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
            {[140, 90, 80, 80, 80, 110, 100].map((w, i) => (
                <td key={i} style={{ padding: '18px 20px' }}>
                    <div style={{ ...pulse, width: `${w}px` }} />
                </td>
            ))}
        </tr>
    );
};

const ProductionDeclarationDashboard = () => {
    const cached = readCache();
    // Only treat as a valid cache if it has actual records
    const hasCache = Array.isArray(cached) && cached.length > 0;

    const [showForm, setShowForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    // Seed state from cache so the table renders instantly — only if data exists
    const [declarations, setDeclarations] = useState(hasCache ? cached : []);

    // Show skeleton only when there is NO valid cached data
    const [loading, setLoading] = useState(!hasCache);

    // Background-refresh indicator (small, non-blocking)
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // ── Stale-while-revalidate fetch ──────────────────────────────────────────
    // If cache exists  → show it immediately, then silently update in background
    // If no cache      → show skeleton, wait for response, then render
    const fetchDeclarations = useCallback(async ({ silent = false } = {}) => {
        if (silent) {
            setRefreshing(true);  // subtle pill indicator
        } else {
            setLoading(true);     // full skeleton
        }
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20_000);

        try {
            const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
            const currentPlantId = selectedPlant ? selectedPlant.plantId : null;

            const data = await apiService.getProductionDeclarations();
            const fresh = currentPlantId
                ? (data || []).filter(d => String(d.plantId) === String(currentPlantId))
                : (data || []);
            setDeclarations(fresh);
            writeCache(fresh); // persist for next visit
        } catch (err) {
            if (err.name === 'AbortError') {
                if (!silent) setError('Request timed out. Please try again.');
            } else {
                console.error('Failed to fetch declarations:', err);
                if (!silent) setError('Failed to load production declarations.');
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (hasCache) {
            // Valid data already visible — silently refresh in background
            fetchDeclarations({ silent: true });
        } else {
            // Nothing cached (or cache was empty) — show skeleton and wait
            fetchDeclarations({ silent: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const getStatusStyle = (status) => {
        if (status === 'Verified & Locked' || status === 'Locked' || status === 'Completed') {
            return { background: '#f0fdf4', color: '#166534' };
        }
        return { background: '#fef3c7', color: '#92400e' };
    };

    const getStatusLabel = (status) => {
        if (!status || status === 'Created' || status === 'Pending') return 'Pending for verification';
        if (status === 'Completed' || status === 'Locked') return 'Verified & Locked';
        return status;
    };

    const handleSaveProduction = async (pdData) => {
        try {
            await apiService.saveProductionDeclaration(pdData);
            clearCache(); // force fresh fetch on next load
            fetchDeclarations({ silent: false });
            setShowForm(false);
        } catch (err) {
            console.error('Failed to save declaration:', err);
            alert('Failed to save declaration: ' + (err.message || 'Unknown error'));
        }
    };

    // ── Optimistic delete: remove from UI immediately, call API in background ─
    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('Are you sure you want to delete this declaration?')) return;

        // Remove instantly from local state AND cache
        setDeclarations(prev => {
            const updated = prev.filter(d => d.id !== id);
            writeCache(updated); // keep cache consistent
            return updated;
        });

        try {
            await apiService.deleteProductionDeclaration(id);
        } catch (err) {
            console.error('Failed to delete declaration:', err);
            alert('Delete failed. Refreshing list...');
            clearCache();
            fetchDeclarations({ silent: false }); // rollback via full re-fetch
        }
    }, [fetchDeclarations]);

    const handleEdit = useCallback(async (item) => {
        try {
            setRefreshing(true);
            const fullDetails = await apiService.getProductionDeclarationById(item.id);
            setSelectedItem(fullDetails || item);
            setIsReadOnly(false);
            setShowForm(true);
        } catch (err) {
            console.error('Failed to fetch full details for editing:', err);
            setSelectedItem(item);
            setIsReadOnly(false);
            setShowForm(true);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleView = useCallback(async (item) => {
        try {
            setRefreshing(true);
            const fullDetails = await apiService.getProductionDeclarationById(item.id);
            setSelectedItem(fullDetails || item);
            setIsReadOnly(true);
            setShowForm(true);
        } catch (err) {
            console.error('Failed to fetch full details for viewing:', err);
            setSelectedItem(item);
            setIsReadOnly(true);
            setShowForm(true);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleAddNew = useCallback(() => {
        setSelectedItem(null);
        setIsReadOnly(false);
        setShowForm(true);
    }, []);

    // ── Derived state — only recalculated when `declarations` changes ─────────
    const isVerified = useCallback((status) =>
        status === 'Verified & Locked' || status === 'Locked' || status === 'Completed'
    , []);

    const { pendingDeclarations, verifiedDeclarations, stats } = useMemo(() => {
        const sorted = [...declarations].sort((a, b) => (b.id || 0) - (a.id || 0));
        
        const totalCasted = declarations.reduce((acc, d) => acc + (d.totalCastedSleepers || 0), 0);
        // Using || 0 for totalRejectedSleepers as it may be added to the DTO in future
        const totalRejected = declarations.reduce((acc, d) => acc + (d.totalRejectedSleepers || 0), 0);
        const avgRejectionRate = totalCasted > 0 ? ((totalRejected / totalCasted) * 100).toFixed(1) : "0.0";

        return {
            pendingDeclarations: sorted.filter(d => !isVerified(d.status)),
            verifiedDeclarations: sorted.filter(d => isVerified(d.status)),
            stats: {
                totalCasted,
                avgRejectionRate
            }
        };
    }, [declarations, isVerified]);

    if (showForm) {
        return <ShiftProductionForm
            onBack={() => setShowForm(false)}
            onSave={handleSaveProduction}
            lastBatchNumber={declarations.length > 0 ? (declarations[0].batchNumber || '100') : '100'}
            initialData={selectedItem}
            isReadOnly={isReadOnly}
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
                        {stats.totalCasted.toLocaleString()}
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
                    <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '900' }}>{stats.avgRejectionRate}%</h2>
                </div>
            </div>

            {/* Header with Add Button + Refreshing Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>Production Declaration Dashboard</h3>
                    {refreshing && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: '#f0f9fa', color: '#42818c',
                            border: '1px solid #42818c33',
                            padding: '4px 10px', borderRadius: '20px',
                            fontSize: '11px', fontWeight: '600'
                        }}>
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#42818c', animation: 'skeletonPulse 1s ease-in-out infinite' }} />
                            Refreshing…
                        </span>
                    )}
                </div>
                <button
                    onClick={handleAddNew}
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

            {/* Skeleton / Error / Content */}
            {loading ? (
                <>
                    {/* Inject skeleton keyframe once */}
                    <style>{`
                        @keyframes skeletonPulse {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                    `}</style>
                    <div style={{ display: 'grid', gap: '24px' }}>
                        {/* Tab switcher skeleton */}
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '14px', width: 'fit-content', gap: '4px' }}>
                            {['Pending Declaration', 'Verified Production'].map(label => (
                                <div key={label} style={{ padding: '10px 24px', borderRadius: '10px', background: '#e2e8f0', color: 'transparent', fontSize: '14px', fontWeight: '700' }}>{label}</div>
                            ))}
                        </div>
                        {/* Skeleton table */}
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>{['Date & Shift','Line/Shed No.','Batch No.','Total Casted','Type','Status','Actions'].map(h => (
                                        <th key={h} style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b', textAlign: 'left' }}>{h}</th>
                                    ))}</tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : error ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                    <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '16px' }}>{error}</p>
                    <button
                        onClick={fetchDeclarations}
                        style={{ background: '#42818c', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '24px' }}>
                    
                    {/* Modern Card Switcher */}
                    <div style={{ 
                        display: 'flex', 
                        background: '#f1f5f9', 
                        padding: '6px', 
                        borderRadius: '14px', 
                        width: 'fit-content',
                        marginBottom: '8px',
                        boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.02)'
                    }}>
                        <button 
                            onClick={() => setActiveTab('pending')}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '10px',
                                border: 'none',
                                background: activeTab === 'pending' ? 'white' : 'transparent',
                                color: activeTab === 'pending' ? '#42818c' : '#64748b',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: activeTab === 'pending' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <span style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                background: '#f59e0b',
                                opacity: activeTab === 'pending' ? 1 : 0.6
                            }}></span>
                            Pending Declaration
                            <span style={{ 
                                background: activeTab === 'pending' ? '#f0fdfa' : '#e2e8f0', 
                                color: activeTab === 'pending' ? '#42818c' : '#475569',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                marginLeft: '4px'
                            }}>
                                {pendingDeclarations.length}
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('verified')}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '10px',
                                border: 'none',
                                background: activeTab === 'verified' ? 'white' : 'transparent',
                                color: activeTab === 'verified' ? '#42818c' : '#64748b',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: activeTab === 'verified' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <span style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                background: '#10b981',
                                opacity: activeTab === 'verified' ? 1 : 0.6
                            }}></span>
                            Verified Production
                            <span style={{ 
                                background: activeTab === 'verified' ? '#f0fdfa' : '#e2e8f0', 
                                color: activeTab === 'verified' ? '#42818c' : '#475569',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                marginLeft: '4px'
                            }}>
                                {verifiedDeclarations.length}
                            </span>
                        </button>
                    </div>

                    {/* Pending Section */}
                    {activeTab === 'pending' && (
                        <div className="fade-in">
                            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <tr>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Date & Shift</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Line/Shed No.</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Batch No.</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Total Casted</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Type</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Status</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingDeclarations.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
                                                    No pending production declarations found.
                                                </td>
                                            </tr>
                                        ) : (
                                            pendingDeclarations.map((item, index) => (
                                                <tr key={item.id || index} style={{ borderBottom: index === pendingDeclarations.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
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
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                            <button onClick={() => handleEdit(item)} style={{ border: 'none', background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'transform 0.1s' }}>Modify</button>
                                                            <button onClick={() => handleDelete(item.id)} style={{ border: 'none', background: '#fee2e2', color: '#b91c1c', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Verified Section */}
                    {activeTab === 'verified' && (
                        <div className="fade-in">
                            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <tr>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Date & Shift</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Line/Shed No.</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Batch No.</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Total Casted</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Type</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Status</th>
                                            <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {verifiedDeclarations.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
                                                    No verified production declarations found.
                                                </td>
                                            </tr>
                                        ) : (
                                            verifiedDeclarations.map((item, index) => (
                                                <tr key={item.id || index} style={{ borderBottom: index === verifiedDeclarations.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
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
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                            <button onClick={() => handleView(item)} style={{ border: 'none', background: '#f1f5f9', color: '#475569', padding: '6px 15px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>View Details</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductionDeclarationDashboard;
