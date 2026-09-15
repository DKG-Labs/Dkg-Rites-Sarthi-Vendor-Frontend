import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../services/api';

// Native SVG Icons to ensure 100% React 19 compatibility
const SearchIcon = ({ size = 18, color = '#94a3b8' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const FileTextIcon = ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);

const CalendarIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const EyeIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const AlertCircleIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const CheckCircleIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const ClockIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const ClipboardListIcon = ({ size = 64, color = '#94a3b8' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
    </svg>
);

const InfoIcon = ({ size = 18, color = '#fff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const getCallStatusInfo = (statusStr, actionStr, jobStatusStr) => {
    const raw = String(actionStr || jobStatusStr || statusStr || 'COMPLETED').toUpperCase().trim();
    if (raw.includes('CANCEL')) {
        return {
            label: 'CANCELLED',
            bg: '#fee2e2',
            color: '#dc2626',
            border: '#fca5a5',
            type: 'cancel'
        };
    }
    if (raw.includes('WITHDRAW')) {
        return {
            label: 'WITHDRAWN',
            bg: '#fee2e2',
            color: '#991b1b',
            border: '#fca5a5',
            type: 'withdraw'
        };
    }
    if (raw.includes('IC_ISSUE') || raw.includes('IC_GENERATION') || raw.includes('GENERATE_IC') || raw.includes('DSC_SIGN_IC') || raw.includes('IC_SIGNED')) {
        return {
            label: 'IC ISSUED',
            bg: '#dcfce7',
            color: '#15803d',
            border: '#86efac',
            type: 'complete'
        };
    }
    if (raw.includes('FINISH') || raw.includes('COMPLETE') || raw.includes('CONFIRM') || raw.includes('APPROVED') || raw.includes('ACCEPTED')) {
        return {
            label: 'INSPECTION COMPLETE CONFIRM',
            bg: '#dcfce7',
            color: '#15803d',
            border: '#86efac',
            type: 'complete'
        };
    }
    if (raw.includes('PENDING') || raw.includes('PROGRESS') || raw.includes('VERIFY')) {
        return {
            label: raw.replace(/_/g, ' '),
            bg: '#fef9c3',
            color: '#854d0e',
            border: '#fef08a',
            type: 'pending'
        };
    }
    return {
        label: raw.replace(/_/g, ' '),
        bg: '#eff6ff',
        color: '#1d4ed8',
        border: '#bfdbfe',
        type: 'default'
    };
};

const formatDateDDMMYY = (val) => {
    if (!val) return 'N/A';
    try {
        if (typeof val === 'string' && val.includes('T')) {
            const parts = val.split('T')[0].split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
            return val.split('T')[0];
        }
        if (typeof val === 'string' && val.includes('-')) {
            const parts = val.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
        }
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear()).slice(-2);
            return `${day}/${month}/${year}`;
        }
    } catch (e) {}
    return String(val);
};

const formatPoSrNo = (call) => {
    if (!call) return '-';
    const rly = call.rlyShortName || call.scrCode || call.rlyCode;
    let po = String(call.poNo || '').trim();
    let sr = String(call.poSr || call.srNo || '').trim();
    if (sr && sr.includes('/')) {
        sr = sr.split('/').pop().trim();
    }

    let fullPoSr = po;
    if (sr && sr !== 'null' && sr !== 'undefined' && sr !== '') {
        if (!po.includes('/')) {
            fullPoSr = `${po}/${sr}`;
        } else {
            const parts = po.split('/');
            if (parts.length === 1 || !parts[1] || parts[1] !== sr) {
                fullPoSr = `${parts[0]}/${sr}`;
            }
        }
    }

    if (rly) {
        return `${rly} / ${fullPoSr}`;
    }
    return fullPoSr || 'N/A';
};

const cleanPlantStr = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const isPlantMatching = (callPlantId, allowedPlantList) => {
    if (!allowedPlantList || allowedPlantList.length === 0 || !allowedPlantList[0]) return true;
    const cleanCall = cleanPlantStr(callPlantId);
    if (!cleanCall) return false;

    return allowedPlantList.some(target => {
        const cleanTarget = cleanPlantStr(target);
        if (!cleanTarget) return false;
        
        if (cleanCall === cleanTarget) return true;
        
        if (cleanCall.includes(cleanTarget) || cleanTarget.includes(cleanCall)) {
            const callParts = String(callPlantId).split(/[/:]/).filter(Boolean);
            const targetParts = String(target).split(/[/:]/).filter(Boolean);
            if (callParts.length > 1 && targetParts.length > 1) {
                const callUnit = cleanPlantStr(callParts[callParts.length - 1]);
                const targetUnit = cleanPlantStr(targetParts[targetParts.length - 1]);
                return callUnit === targetUnit || callUnit.includes(targetUnit) || targetUnit.includes(callUnit);
            }
            return true;
        }
        return false;
    });
};

const getEffectivePlantId = (propPlantId) => {
    if (propPlantId) return propPlantId;
    const sessionPlant = sessionStorage.getItem('plantId');
    if (sessionPlant) return sessionPlant;
    const localPlant = localStorage.getItem('plantId');
    if (localPlant) return localPlant;
    try {
        const savedPlant = localStorage.getItem('selectedPlant');
        if (savedPlant) {
            const parsed = JSON.parse(savedPlant);
            if (parsed?.plantId) return parsed.plantId;
        }
    } catch (e) {}
    return '';
};

const CallsCompletedDashboard = ({ plantId: propPlantId }) => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(5);
    const [toast, setToast] = useState(null);

    const plantId = getEffectivePlantId(propPlantId);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchCompletedCalls = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getCompletedFinalCalls(plantId);
            const list = Array.isArray(data) ? data : [];
            const plantFiltered = plantId ? list.filter(item => isPlantMatching(item.plantId, [plantId])) : list;
            setCalls(plantFiltered);
        } catch (err) {
            console.error('Error fetching completed calls:', err);
            setError('Failed to load completed inspection calls.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompletedCalls();
    }, [plantId]);

    const filteredCalls = useMemo(() => {
        if (!search.trim()) return calls;
        const q = search.toLowerCase();
        return calls.filter(call => {
            const callNo = (call.requestId || call.callNo || '').toLowerCase();
            const icNo = (call.icNo || '').toLowerCase();
            const poNo = (call.poNo || '').toLowerCase();
            const sleeperType = (call.sleeperType || call.productType || '').toLowerCase();
            const ieName = (call.assignedToUserName || call.ieName || '').toLowerCase();
            return callNo.includes(q) || icNo.includes(q) || poNo.includes(q) || sleeperType.includes(q) || ieName.includes(q);
        });
    }, [calls, search]);

    const paginatedCalls = useMemo(() => {
        const start = page * size;
        return filteredCalls.slice(start, start + size);
    }, [filteredCalls, page, size]);

    const totalPages = Math.ceil(filteredCalls.length / size) || 1;

    const handleViewActions = (call) => {
        showToast('info', `Actions for Call: ${call.requestId || call.callNo || call.workflowTransitionId}`);
    };

    const SkeletonRow = () => (
        <div style={{ 
            display: 'flex', gap: '16px', padding: '16px', background: '#fff', 
            borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '12px',
            animation: 'pulse 1.5s infinite ease-in-out'
        }}>
            <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '8px' }}></div>
            <div style={{ flex: 1 }}>
                <div style={{ width: '120px', height: '14px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div style={{ width: '200px', height: '10px', background: '#f1f5f9', borderRadius: '4px' }}></div>
            </div>
            <div style={{ width: '80px', height: '32px', background: '#f1f5f9', borderRadius: '20px' }}></div>
        </div>
    );

    if (loading) {
        return (
            <div className="fade-in">
                <style>{`
                    @keyframes pulse {
                        0% { opacity: 0.6; }
                        50% { opacity: 1; }
                        100% { opacity: 0.6; }
                    }
                `}</style>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ width: '200px', height: '24px', background: '#f1f5f9', borderRadius: '6px', marginBottom: '8px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                    <div style={{ width: '300px', height: '14px', background: '#f1f5f9', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                </div>
                {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 24, zIndex: 11000,
                    padding: '12px 20px', borderRadius: 10,
                    color: '#fff', fontWeight: 600, fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                    background: toast.type === 'success' ? '#059669' : (toast.type === 'error' ? '#dc2626' : '#2563eb'),
                    animation: 'slideIn 0.3s ease'
                }}>
                    {toast.type === 'success' && <CheckCircleIcon size={18} color="#fff" />}
                    {toast.type === 'error' && <AlertCircleIcon size={18} color="#fff" />}
                    {toast.type === 'info' && <InfoIcon size={18} color="#fff" />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header with Title & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Completed Calls</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>View and manage your completed inspection requests and download certificates</p>
                </div>
                
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <SearchIcon size={18} color="#94a3b8" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search Call No / PO No..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        style={{
                            padding: '12px 12px 12px 40px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            width: '300px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            background: '#fff'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>
            </div>

            {error ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2', color: '#991b1b' }}>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                        <AlertCircleIcon size={48} color="#dc2626" />
                    </div>
                    <h3 style={{ margin: 0, fontWeight: 800 }}>Error</h3>
                    <p>{error}</p>
                    <button onClick={fetchCompletedCalls} style={{ marginTop: '16px', padding: '8px 24px', borderRadius: '8px', background: '#991b1b', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
                </div>
            ) : filteredCalls.length === 0 ? (
                <div style={{ padding: '100px 0', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px dashed #e2e8f0', color: '#94a3b8' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <ClipboardListIcon size={64} color="#94a3b8" />
                    </div>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>No completed inspection calls found</h3>
                    <p style={{ marginTop: '4px' }}>{search ? "No calls match your search criteria." : "Completed inspection calls and certificates will appear here."}</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#fcf8ee', borderBottom: '1px solid #f2e9d8' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Call Details</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO Reference</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Details</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCalls.map((call, idx) => {
                                const callNo = call.requestId || call.callNo || (call.workflowTransitionId ? `CALL-${call.workflowTransitionId}` : 'N/A');
                                const inspectionDate = call.callDate || call.desiredInspectionDate || call.createdDate;
                                const sleeperItem = call.sleeperType || call.productType || 'Sleeper';
                                const offeredQuantity = Number(call.offeredQty || call.qtyOffered || call.totalCastedSleepers || 0);
                                const acceptedQuantity = Number(call.acceptedQty != null ? call.acceptedQty : (call.totalOffered != null ? call.totalOffered : (call.qtyAccepted != null ? call.qtyAccepted : offeredQuantity)));
                                const statusInfo = getCallStatusInfo(call.status, call.action, call.jobStatus);

                                return (
                                    <tr 
                                        key={call.workflowTransitionId || call.id || idx} 
                                        style={{ borderBottom: idx === paginatedCalls.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }} 
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fcfdfe'} 
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {/* 1. Call Details */}
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FileTextIcon size={18} color="#2563eb" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '14px' }}>{callNo}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                        <CalendarIcon size={12} color="#64748b" /> {formatDateDDMMYY(inspectionDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. PO Reference */}
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>
                                                {formatPoSrNo(call)}
                                            </div>
                                        </td>

                                        {/* 3. Item & Quantities */}
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>{sleeperItem}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span>Off: <strong>{offeredQuantity.toLocaleString()}</strong></span>
                                                <span style={{ color: '#cbd5e1' }}>|</span>
                                                <span style={{ color: '#15803d', fontWeight: 800, background: '#dcfce7', padding: '1px 6px', borderRadius: '6px' }}>
                                                    Acc: {acceptedQuantity.toLocaleString()} (Nos.)
                                                </span>
                                            </div>
                                        </td>

                                        {/* 4. Status */}
                                        <td style={{ padding: '18px 24px' }}>
                                            <div style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
                                                background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`
                                            }}>
                                                {statusInfo.type === 'cancel' || statusInfo.type === 'withdraw' ? (
                                                    <AlertCircleIcon size={12} color={statusInfo.color} />
                                                ) : statusInfo.type === 'pending' ? (
                                                    <ClockIcon size={12} color={statusInfo.color} />
                                                ) : (
                                                    <CheckCircleIcon size={12} color={statusInfo.color} />
                                                )}
                                                {statusInfo.label}
                                            </div>
                                        </td>

                                        {/* 5. Action */}
                                        <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleViewActions(call)}
                                                style={{ 
                                                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                                    background: '#fff', color: '#1e293b', fontSize: '13px', fontWeight: 700,
                                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            >
                                                <EyeIcon size={16} color="#1e293b" /> View Actions
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {filteredCalls.length > 0 && (
                        <div style={{
                            padding: '16px 24px', background: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontSize: '13px', color: '#64748b', flexWrap: 'wrap', gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div>
                                    Showing page <strong style={{ color: '#0f172a' }}>{page + 1}</strong> of <strong style={{ color: '#0f172a' }}>{totalPages}</strong> 
                                    <span style={{ marginLeft: 8 }}>({filteredCalls.length} total calls)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <label htmlFor="pageSize" style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>Rows per page:</label>
                                    <select
                                        id="pageSize"
                                        value={size}
                                        onChange={(e) => {
                                            setSize(Number(e.target.value));
                                            setPage(0);
                                        }}
                                        style={{
                                            padding: '6px 10px', borderRadius: '8px',
                                            border: '1px solid #cbd5e1', background: '#fff',
                                            color: '#0f172a', fontSize: '13px', fontWeight: 600, 
                                            outline: 'none', cursor: 'pointer', minWidth: '60px'
                                        }}
                                    >
                                        {[5, 10, 15, 20, 25].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px',
                                        border: '1px solid #e2e8f0', background: '#fff',
                                        color: page === 0 ? '#cbd5e1' : '#475569',
                                        cursor: page === 0 ? 'not-allowed' : 'pointer', fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                >Previous</button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px',
                                        border: '1px solid #e2e8f0', background: '#fff',
                                        color: page >= totalPages - 1 ? '#cbd5e1' : '#475569',
                                        cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                >Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CallsCompletedDashboard;
