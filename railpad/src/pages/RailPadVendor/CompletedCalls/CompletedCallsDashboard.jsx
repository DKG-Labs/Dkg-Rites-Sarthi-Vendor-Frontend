import React, { useState, useEffect, useMemo } from 'react';
import inspectionCallService from '../../../services/inspectionCallService';
import { 
    Search, FileText, Calendar, Package, Eye, 
    ChevronRight, Loader2, AlertCircle, CheckCircle2,
    Clock, ArrowLeft, ClipboardList, Info, Plus, X,
    Download, FileCheck, ExternalLink, ShieldCheck, Lock
} from 'lucide-react';
import { formatDateDDMMYY } from '../../../utils/dateUtils';
import { generateRailpadCallLetterPDF } from '../../../utils/generateCallLetterPDF';
import { 
    generateRailpadPoPDF, 
    generateRailpadIcPdf, 
    downloadAllCallDocuments 
} from '../../../utils/generateDocumentPDFs';

const getCallStatusInfo = (statusStr) => {
    const raw = String(statusStr || 'COMPLETED').toUpperCase().trim();
    if (raw.includes('WITHDRAW') || raw.includes('CANCEL')) {
        return {
            label: 'WITHDRAW',
            bg: '#fee2e2',
            color: '#991b1b',
            border: '#fca5a5',
            icon: <AlertCircle size={12} />
        };
    }
    if (raw.includes('COMPLETE') || raw.includes('CONFIRM') || raw.includes('FINISH') || raw.includes('IC_ISSUE') || raw.includes('GENERATE_IC') || raw.includes('IC_GENERATION') || raw.includes('APPROVED')) {
        return {
            label: raw === 'COMPLETED' ? 'INSPECTION COMPLETE CONFIRM' : raw.replace(/_/g, ' '),
            bg: '#dcfce7',
            color: '#15803d',
            border: '#86efac',
            icon: <CheckCircle2 size={12} />
        };
    }
    if (raw.includes('PENDING') || raw.includes('PROGRESS') || raw.includes('VERIFY')) {
        return {
            label: raw.replace(/_/g, ' '),
            bg: '#fef9c3',
            color: '#854d0e',
            border: '#fef08a',
            icon: <Clock size={12} />
        };
    }
    return {
        label: raw.replace(/_/g, ' '),
        bg: '#eff6ff',
        color: '#1d4ed8',
        border: '#bfdbfe',
        icon: <CheckCircle2 size={12} />
    };
};

export const formatPoSrNo = (call, includeRly = true) => {
    if (!call) return '-';
    const rly = call.scrCode || call.rlyCode || call.rlyShortName;
    let po = String(call.poNo || call.po_no || '').trim();
    let sr = String(call.poSr || call.po_sr || call.poSerialNo || '').trim();
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

    if (includeRly && rly) {
        return `${rly} / ${fullPoSr}`;
    }
    return fullPoSr;
};

const checkIsIcAvailable = (call, history) => {
    if (!call) return false;
    const rawStatus = String(call.status || call.workflowStatus || '').toUpperCase().trim();
    // If call is withdrawn or cancelled, IC is never available
    if (rawStatus.includes('WITHDRAW') || rawStatus.includes('CANCEL')) {
        return false;
    }
    if (call.isIcGenerated === true) return true;
    if (call.latestAction === 'IC_GENERATION' || call.latestAction === 'IC_ISSUE') return true;
    if (rawStatus === 'IC_GENERATION' || rawStatus === 'IC_ISSUE' || rawStatus === 'GENERATE_IC' || rawStatus === 'COMPLETED') return true;
    if (Array.isArray(history) && history.length > 0) {
        return history.some(tx => {
            const act = String(tx.action || '').toUpperCase();
            const st = String(tx.status || tx.jobStatus || '').toUpperCase();
            return act === 'IC_GENERATION' || act === 'IC_ISSUE' || st === 'IC_GENERATION' || st === 'IC_ISSUE';
        });
    }
    return false;
};

const CompletedCallsDashboard = ({ vendorCode, plantId }) => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedCall, setSelectedCall] = useState(null);
    const [transitionHistory, setTransitionHistory] = useState([]);
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
    const [downloadingDoc, setDownloadingDoc] = useState(null);
    const [toast, setToast] = useState(null);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(5);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    
    useEffect(() => {
        if (plantId) fetchCalls();
    }, [plantId, page, size]);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4500);
    };

    const fetchCalls = async () => {
        try {
            setLoading(true);
            const data = await inspectionCallService.getCompletedPaginatedByPlant(plantId, page, size);
            if (data && data.content) {
                setCalls(data.content);
                setTotalPages(data.totalPages);
                setTotalElements(data.totalElements);
            } else {
                setCalls(Array.isArray(data) ? data : []);
                setTotalPages(1);
            }
            setError(null);
        } catch (err) {
            console.error("Error fetching completed calls:", err);
            setError("Failed to load completed inspection calls.");
        } finally {
            setLoading(false);
        }
    };

    const filteredCalls = useMemo(() => {
        return calls.filter(call => {
            const matchesSearch = call.callNo?.toLowerCase().includes(search.toLowerCase()) ||
                                  call.poNo?.toLowerCase().includes(search.toLowerCase()) ||
                                  call.railPadType?.toLowerCase().includes(search.toLowerCase());
            return matchesSearch;
        });
    }, [calls, search]);

    const handleOpenActions = async (call) => {
        setSelectedCall(call);
        setTransitionHistory([]);
        setIsActionsModalOpen(true);
        
        try {
            if (call.id) {
                const fullCall = await inspectionCallService.getById(call.id);
                if (fullCall) {
                    setSelectedCall(prev => ({ ...prev, ...fullCall }));
                }
            }
            if (call.callNo) {
                const historyRes = await inspectionCallService.getWorkflowHistory(call.callNo);
                if (historyRes && Array.isArray(historyRes.responseData)) {
                    setTransitionHistory(historyRes.responseData);
                }
            }
        } catch (err) {
            console.warn("Could not fetch full call/workflow details:", err);
        }
    };

    // ── Document Handlers ──
    const handleDownloadPo = async (call) => {
        try {
            setDownloadingDoc('po');
            showToast('info', `Preparing PO document for PO No: ${call.poNo}...`);
            await generateRailpadPoPDF(call, true);
            showToast('success', `Purchase Order PDF downloaded successfully!`);
        } catch (err) {
            console.error("Error downloading PO PDF:", err);
            showToast('error', "Failed to download PO document.");
        } finally {
            setDownloadingDoc(null);
        }
    };

    const handleDownloadCallLetter = async (call) => {
        try {
            setDownloadingDoc('call_letter');
            showToast('info', `Generating official Call Letter PDF for ${call.callNo}...`);
            await generateRailpadCallLetterPDF(call, true);
            showToast('success', `Call Letter PDF downloaded successfully!`);
        } catch (err) {
            console.error("Error downloading Call Letter PDF:", err);
            showToast('error', "Failed to generate Call Letter PDF.");
        } finally {
            setDownloadingDoc(null);
        }
    };

    const handleDownloadIC = async (call) => {
        const isIcAvailable = checkIsIcAvailable(call, transitionHistory);
        if (!isIcAvailable) {
            showToast('info', 'Inspection Certificate (IC) is only available after the IC_GENERATION action is completed.');
            return;
        }

        try {
            setDownloadingDoc('ic');
            showToast('info', `Fetching e-signed Inspection Certificate for ${call.callNo}...`);
            await generateRailpadIcPdf(call, true);
            showToast('success', `Inspection Certificate (IC) PDF downloaded successfully!`);
        } catch (err) {
            console.error("Error downloading IC PDF:", err);
            showToast('error', "Failed to download Inspection Certificate PDF.");
        } finally {
            setDownloadingDoc(null);
        }
    };

    const handleDownloadAll = async (call) => {
        const isIcAvailable = checkIsIcAvailable(call, transitionHistory);
        try {
            setDownloadingDoc('all');
            if (isIcAvailable) {
                showToast('info', `Downloading all available documents (Call Letter, PO, IC)...`);
                await downloadAllCallDocuments(call);
                showToast('success', `All documents downloaded successfully!`);
            } else {
                showToast('info', `Downloading available documents (Call Letter & PO). IC is not yet generated.`);
                await generateRailpadCallLetterPDF(call, true);
                await new Promise(r => setTimeout(r, 600));
                await generateRailpadPoPDF(call, true);
                showToast('success', `Call Letter & Purchase Order downloaded successfully!`);
            }
        } catch (err) {
            console.error("Error downloading documents:", err);
            showToast('error', "Failed to download documents.");
        } finally {
            setDownloadingDoc(null);
        }
    };

    const isCurrentIcAvailable = checkIsIcAvailable(selectedCall, transitionHistory);

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
                    {toast.type === 'success' && <CheckCircle2 size={18} />}
                    {toast.type === 'error' && <AlertCircle size={18} />}
                    {toast.type === 'info' && <Info size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Completed Calls</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>View and manage your completed inspection requests and download certificates</p>
                </div>
                
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                    <input 
                        type="text"
                        placeholder="Search Call No / PO No..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            padding: '12px 12px 12px 40px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            width: '300px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>
            </div>

            {error ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2', color: '#991b1b' }}>
                    <AlertCircle style={{ marginBottom: '12px' }} size={48} />
                    <h3 style={{ margin: 0, fontWeight: 800 }}>Error</h3>
                    <p>{error}</p>
                    <button onClick={fetchCalls} style={{ marginTop: '16px', padding: '8px 24px', borderRadius: '8px', background: '#991b1b', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
                </div>
            ) : filteredCalls.length === 0 ? (
                <div style={{ padding: '100px 0', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px dashed #e2e8f0', color: '#94a3b8' }}>
                    <div style={{ marginBottom: '16px' }}><ClipboardList size={64} opacity={0.2} /></div>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>No completed inspection calls found</h3>
                    <p style={{ marginTop: '4px' }}>{search ? "No calls match your search criteria." : "Completed inspection calls and certificates will appear here."}</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Call Details</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO Reference</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Details</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCalls.map((call, idx) => {
                                const statusInfo = getCallStatusInfo(call.status || call.workflowStatus);
                                return (
                                    <tr key={call.id || idx} style={{ borderBottom: idx === filteredCalls.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fcfdfe'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '14px' }}>{call.callNo || 'N/A'}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                        <Calendar size={12} /> {formatDateDDMMYY(call.inspectionDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>
                                                {formatPoSrNo(call, true)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>{call.railPadType}</div>
                                            <div style={{ fontSize: '11px', color: '#0891b2', fontWeight: 800, marginTop: '2px' }}>Qty: {call.totalQty?.toLocaleString()} (Nos.)</div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
                                                background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`
                                            }}>
                                                {statusInfo.icon} {statusInfo.label}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleOpenActions(call)}
                                                style={{ 
                                                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                                    background: '#fff', color: '#1e293b', fontSize: '13px', fontWeight: 700,
                                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            >
                                                <Eye size={16} /> View Actions
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {totalElements > 0 && (
                        <div style={{
                            padding: '16px 24px', background: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontSize: '13px', color: '#64748b', flexWrap: 'wrap', gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div>
                                    Showing page <strong style={{ color: '#0f172a' }}>{page + 1}</strong> of <strong style={{ color: '#0f172a' }}>{totalPages || 1}</strong> 
                                    <span style={{ marginLeft: 8 }}>({totalElements} total calls)</span>
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
                                    disabled={page >= totalPages - 1 || totalPages <= 1}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px',
                                        border: '1px solid #e2e8f0', background: '#fff',
                                        color: (page >= totalPages - 1 || totalPages <= 1) ? '#cbd5e1' : '#475569',
                                        cursor: (page >= totalPages - 1 || totalPages <= 1) ? 'not-allowed' : 'pointer', fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                >Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============ ACTIONS & DOCUMENTS POPUP MODAL ============ */}
            {isActionsModalOpen && selectedCall && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
                    zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => setIsActionsModalOpen(false)}>
                    <div style={{
                        background: '#ffffff', borderRadius: '24px', maxWidth: '820px', width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                        position: 'relative', border: '1px solid #e2e8f0', overflow: 'hidden',
                        padding: '28px 32px'
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📋 Inspection Call Details - <span style={{ color: '#0d3b3f' }}>{selectedCall.callNo}</span>
                            </h3>
                            <button onClick={() => setIsActionsModalOpen(false)} style={{
                                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
                            }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Top Info Box with Blue Left Accent Border */}
                        <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderLeft: '4px solid #0284c7',
                            borderRadius: '16px',
                            padding: '20px 24px',
                            marginBottom: '28px'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '20px 24px',
                                marginBottom: '18px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                        CALL NUMBER
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                                        {selectedCall.callNo}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                        PO NUMBER
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                                        {formatPoSrNo(selectedCall, false)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                        COMPLETION DATE
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                                        {formatDateDDMMYY(selectedCall.updatedAt || selectedCall.inspectionDate)}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '20px 24px',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                        STATUS
                                    </div>
                                    <span style={{
                                        display: 'inline-block',
                                        background: '#f1f5f9',
                                        color: '#334155',
                                        border: '1px solid #cbd5e1',
                                        padding: '4px 12px',
                                        borderRadius: '16px',
                                        fontSize: '11px',
                                        fontWeight: 800
                                    }}>
                                        {(selectedCall.status || 'INSPECTION COMPLETE CONFIRM').replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                        QTY OFFERED / ACCEPTED
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                                        {Number(selectedCall.totalQty || selectedCall.orderedQty || 0).toLocaleString()} / {Number(selectedCall.qtyAcceptedTillNow || selectedCall.totalQty || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Documents Cards */}
                        <div>
                            <h4 style={{
                                margin: '0 0 16px',
                                fontSize: '15px',
                                fontWeight: 900,
                                color: '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ color: '#f59e0b' }}>⚡</span> Actions & Documents
                            </h4>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                gap: '16px'
                            }}>
                                {/* Card 1: PO & MA */}
                                <div
                                    onClick={() => handleDownloadPo(selectedCall)}
                                    style={{
                                        background: '#faf5ff',
                                        border: '1.5px solid #e9d5ff',
                                        borderRadius: '16px',
                                        padding: '20px 12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'center'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#c084fc'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(192, 132, 252, 0.15)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#e9d5ff'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fff', border: '1px solid #e9d5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                        {downloadingDoc === 'po' ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#7e22ce' }}>PO & MA</div>
                                </div>

                                {/* Card 2: Annexures (Under Development) */}
                                <div
                                    style={{
                                        background: '#eff6ff',
                                        border: '1.5px solid #dbeafe',
                                        borderRadius: '16px',
                                        padding: '20px 12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'not-allowed',
                                        transition: 'all 0.2s',
                                        textAlign: 'center',
                                        position: 'relative'
                                    }}
                                    title="Under Development"
                                    onClick={() => showToast('info', 'Annexures feature is currently under development.')}
                                >
                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fff', border: '1px solid #dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                        <FileText size={20} />
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1d4ed8' }}>Annexures</div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '2px 6px', borderRadius: '6px', marginTop: '4px' }}>
                                        Under Dev
                                    </div>
                                </div>

                                {/* Card 3: Call Letter */}
                                <div
                                    onClick={() => handleDownloadCallLetter(selectedCall)}
                                    style={{
                                        background: '#ecfeff',
                                        border: '1.5px solid #cffafe',
                                        borderRadius: '16px',
                                        padding: '20px 12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'center'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#22d3ee'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(34, 211, 238, 0.15)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#cffafe'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fff', border: '1px solid #cffafe', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                        {downloadingDoc === 'call_letter' ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0e7490' }}>Call Letter</div>
                                </div>

                                {/* Card 4: IC (Inspection Certificate) - Displayed ONLY when status/action is IC_GENERATION */}
                                {isCurrentIcAvailable && (
                                    <div
                                        onClick={() => handleDownloadIC(selectedCall)}
                                        style={{
                                            background: '#fff7ed',
                                            border: '1.5px solid #ffedd5',
                                            borderRadius: '16px',
                                            padding: '20px 12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'center'
                                        }}
                                        title="Download e-signed Inspection Certificate"
                                        onMouseEnter={(e) => { 
                                            e.currentTarget.style.transform = 'translateY(-2px)'; 
                                            e.currentTarget.style.borderColor = '#fb923c'; 
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(251, 146, 60, 0.15)'; 
                                        }}
                                        onMouseLeave={(e) => { 
                                            e.currentTarget.style.transform = 'none'; 
                                            e.currentTarget.style.borderColor = '#ffedd5'; 
                                            e.currentTarget.style.boxShadow = 'none'; 
                                        }}
                                    >
                                        <div style={{ 
                                            width: '42px', height: '42px', borderRadius: '50%', 
                                            background: '#fff', 
                                            border: '1px solid #ffedd5', 
                                            color: '#ea580c', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' 
                                        }}>
                                            {downloadingDoc === 'ic' ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : (
                                                <FileCheck size={20} />
                                            )}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#c2410c' }}>IC</div>
                                    </div>
                                )}

                                {/* Card 5: Download All */}
                                <div
                                    onClick={() => handleDownloadAll(selectedCall)}
                                    style={{
                                        background: '#f0fdf4',
                                        border: '1.5px solid #bbf7d0',
                                        borderRadius: '16px',
                                        padding: '20px 12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'center'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(74, 222, 128, 0.15)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#bbf7d0'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fff', border: '1px solid #bbf7d0', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                        {downloadingDoc === 'all' ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#15803d' }}>Download All</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompletedCallsDashboard;
