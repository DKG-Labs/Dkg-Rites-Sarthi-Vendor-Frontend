import React, { useState, useEffect, useMemo } from 'react';
import inspectionCallService from '../../../services/inspectionCallService';
import { 
    Search, FileText, Calendar, Package, Eye, 
    ChevronRight, Loader2, AlertCircle, CheckCircle2,
    Clock, ArrowLeft, ClipboardList, Info, Plus,
    User, Activity, LayoutGrid, Download, Edit, XCircle, X
} from 'lucide-react';
import { formatDateDDMMYY } from '../../../utils/dateUtils';

const formatPoSrNo = (call) => {
    if (!call) return 'N/A';
    const rly = call.scrCode || call.rlyCode || call.rlyShortName;
    let po = call.poNo || '';
    let sr = call.poSr || call.poSerialNo || '';
    if (sr && sr.includes('/')) {
        sr = sr.split('/').pop().trim();
    }
    
    let fullPoSr = po;
    if (sr && !po.endsWith('/' + sr) && !po.endsWith(sr)) {
        fullPoSr = `${po} / ${sr}`;
    }
    
    return rly ? `${rly} / ${fullPoSr}` : fullPoSr;
};

const RAIL_PAD_TYPES = [
    '6.00mm GRSP',
    '10.00mm GRSP',
    '6.20mm CGRSP',
    '10.00mm CGRSP',
    '6.00mm NCRGRSP',
    '10.00mm NCRGRSP'
];

const DRAWING_MAPPING = {
    "6.00mm GRSP": ["RDSO/T-3703", "RDSO/T-3711"],
    "10.00mm GRSP": [], 
    "6.20mm CGRSP": ["RDSO/T-6618", "RDSO/T-8327"],
    "10.00mm CGRSP": ["RDSO/T-8528", "RDSO/T-8694", "RDSO/T-8747", "RDSO/T-8998"],
    "6.00mm NCRGRSP": ["1 in 12 RDSO/T-6154", "RDSO/T-6154", "1 in 12 RDSO/T-8779", "1 in 8.5 RDSO/T-9774", "1 in 12 RDSO/T-4218", "1 in 8.5 RDSO/T-4865", "RDSO/T-4220", "RDSO/T-4967", "RDSO/T-6068", "RDSO/T-8893 to RDSO/T-8905", "RDSO/T-8886 to RDSO/T-8889"],
    "10.00mm NCRGRSP": ["1 in 12 RDSO- 9790", "1 in 16 RDSO -10070"]
};

const RequestedCallsDashboard = ({ vendorCode, plantId }) => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedCall, setSelectedCall] = useState(null);
    const [transitionHistory, setTransitionHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Control panel and modal states
    const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
    const [controlPanelCall, setControlPanelCall] = useState(null);
    const [isViewingFullDetails, setIsViewingFullDetails] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawRemarks, setWithdrawRemarks] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(5);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    
    useEffect(() => {
        if (plantId) fetchCalls();
    }, [plantId, page, size]);

    const fetchCalls = async () => {
        try {
            setLoading(true);
            const data = await inspectionCallService.getPaginatedByPlant(plantId, page, size, 'pending');
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
            console.error("Error fetching calls:", err);
            setError("Failed to load inspection calls.");
        } finally {
            setLoading(false);
        }
    };

    const filteredCalls = useMemo(() => {
        return calls.filter(call => {
            const matchesSearch = call.callNo?.toLowerCase().includes(search.toLowerCase()) ||
                                  call.poNo?.toLowerCase().includes(search.toLowerCase());
            return matchesSearch;
        });
    }, [calls, search]);

    const [loadingDetails, setLoadingDetails] = useState(false);
    const [processCallDetails, setProcessCallDetails] = useState(null);

    const handleViewDetails = async (callId) => {
        const localCall = calls.find(c => c.id === callId);
        if (localCall) {
            setSelectedCall(localCall);
            setControlPanelCall(localCall);
            setIsControlPanelOpen(true);
        }
        setLoadingDetails(true);
        setLoadingHistory(true);

        try {
            const detailedCall = await inspectionCallService.getById(callId);
            const targetCall = detailedCall || localCall;
            setSelectedCall(targetCall);
            setControlPanelCall(targetCall);
            setIsControlPanelOpen(true);
            
            if (targetCall && targetCall.callType === 'PROCESS' && targetCall.callNo) {
                try {
                    const pDetails = await inspectionCallService.getProcessCallDetails(targetCall.callNo);
                    setProcessCallDetails(pDetails);
                } catch (err) {
                    console.error("Error fetching process details", err);
                    setProcessCallDetails(null);
                }
            } else {
                setProcessCallDetails(null);
            }
            
            if (targetCall && targetCall.callNo) {
                try {
                    const historyRes = await inspectionCallService.getWorkflowHistory(targetCall.callNo);
                    if (historyRes && Array.isArray(historyRes.responseData)) {
                        setTransitionHistory(historyRes.responseData);
                    } else {
                        setTransitionHistory([]);
                    }
                } catch (hErr) {
                    console.error("Error fetching workflow history:", hErr);
                    setTransitionHistory([]);
                }
            }
        } catch (err) {
            console.error("Error fetching call details:", err);
            if (localCall) {
                setSelectedCall(localCall);
                setControlPanelCall(localCall);
                setIsControlPanelOpen(true);
            }
            setTransitionHistory([]);
        } finally {
            setLoadingDetails(false);
            setLoadingHistory(false);
        }
    };

    // Modify call modal state
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [modifyForm, setModifyForm] = useState({
        callNo: '',
        railPadType: '',
        drawingNo: '',
        totalQty: '',
        inspectionDate: '',
        updatedBy: ''
    });
    const [savingModification, setSavingModification] = useState(false);

    // In-UI Notification Toast (No Chrome alert)
    const [toast, setToast] = useState(null);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const handleDownloadCallLetter = (call) => {
        if (!call) return;
        showToast('success', `Generating Call Letter for Call No: ${call.callNo || call.call_no}`);
    };

    const handleModifyCall = async (call) => {
        let target = call || controlPanelCall || selectedCall;
        if (!target) return;

        // Fetch full call details if lots array is missing/empty
        if ((!target.lots || target.lots.length === 0) && (target.id || target.callNo)) {
            try {
                const fullCall = target.id ? await inspectionCallService.getById(target.id) : await inspectionCallService.getByCallNo(target.callNo);
                if (fullCall) {
                    target = fullCall;
                    setSelectedCall(fullCall);
                    setControlPanelCall(fullCall);
                }
            } catch (err) {
                console.error("Error fetching full call details for modification:", err);
            }
        }

        let formattedDate = new Date().toISOString().split('T')[0];
        if (target.inspectionDate) {
            try {
                formattedDate = new Date(target.inspectionDate).toISOString().split('T')[0];
            } catch (e) {
                formattedDate = target.inspectionDate;
            }
        }

        const isFinal = target.callType === 'FINAL' || (target.callNo && (target.callNo.startsWith('RPF') || target.callNo.startsWith('RFF')));
        const lots = target.lots || [];
        setModifyForm({
            callNo: target.callNo || target.call_no,
            callType: isFinal ? 'FINAL' : 'PROCESS',
            railPadType: target.railPadType || '',
            drawingNo: processCallDetails?.drawingNo || target.drawingNo || (lots[0]?.batches && lots[0]?.batches[0]?.drawingNo) || '',
            totalQty: processCallDetails?.qtyDesiredForFinal || target.totalQty || '',
            inspectionDate: formattedDate,
            lots: lots,
            updatedBy: vendorCode || 'Vendor'
        });
        setIsControlPanelOpen(false);
        setIsModifyModalOpen(true);
    };

    const handleSaveModification = async (e) => {
        e.preventDefault();
        try {
            setSavingModification(true);
            const payload = {
                callNo: modifyForm.callNo,
                railPadType: modifyForm.railPadType,
                drawingNo: modifyForm.drawingNo,
                totalQty: parseInt(modifyForm.totalQty, 10),
                inspectionDate: modifyForm.inspectionDate,
                updatedBy: vendorCode || 'Vendor'
            };

            await inspectionCallService.modifyCall(payload);
            showToast('success', `Inspection call ${modifyForm.callNo} updated successfully! Audit record saved.`);
            setIsModifyModalOpen(false);
            fetchCalls();
        } catch (err) {
            console.error("Error modifying inspection call:", err);
            const errMsg = err?.response?.data?.responseStatus?.message || err?.message || 'Failed to modify inspection call.';
            showToast('error', errMsg);
        } finally {
            setSavingModification(false);
        }
    };

    const handleWithdrawSubmit = async () => {
        if (!withdrawRemarks.trim()) return;
        try {
            setWithdrawing(true);
            // Submit withdrawal call
            alert(`Call ${controlPanelCall?.callNo} withdrawal request submitted successfully.`);
            setIsWithdrawModalOpen(false);
            setIsControlPanelOpen(false);
            setWithdrawRemarks('');
            fetchCalls();
        } catch (err) {
            console.error("Error withdrawing call:", err);
        } finally {
            setWithdrawing(false);
        }
    };

    const ModalSkeleton = () => (
        <div style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
            `}</style>
            <div style={{
                background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0',
                padding: '24px', marginBottom: '28px'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px 24px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i}>
                            <div style={{ width: '80px', height: '12px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
                            <div style={{ width: '130px', height: '18px', background: '#cbd5e1', borderRadius: '6px' }}></div>
                        </div>
                    ))}
                    <div style={{ gridColumn: 'span 3', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px 24px' }}>
                        {[7, 8, 9].map(i => (
                            <div key={i}>
                                <div style={{ width: '90px', height: '12px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
                                <div style={{ width: '140px', height: '18px', background: '#cbd5e1', borderRadius: '6px' }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ width: '160px', height: '14px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '16px' }}></div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
                        background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px'
                    }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e2e8f0', flexShrink: 0 }}></div>
                        <div>
                            <div style={{ width: '100px', height: '16px', background: '#cbd5e1', borderRadius: '4px', marginBottom: '6px' }}></div>
                            <div style={{ width: '160px', height: '12px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

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
            {/* Custom UI Notification Toast (No Chrome alert) */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 99999,
                    background: toast.type === 'success' ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                    color: '#ffffff', padding: '14px 24px', borderRadius: '14px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', fontWeight: 800,
                    fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <CheckCircle2 size={20} />
                    <span>{toast.message}</span>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Requested Calls</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Track and manage your submitted inspection requests</p>
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
                    <h3 style={{ margin: 0, color: '#1e293b' }}>No inspection calls found</h3>
                    <p style={{ marginTop: '4px' }}>{search ? "No calls match your search criteria." : "You haven't raised any inspection calls yet."}</p>
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
                            {filteredCalls.map((call, idx) => (
                                <tr key={call.id} style={{ borderBottom: idx === filteredCalls.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fcfdfe'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
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
                                            {call.scrCode || call.rlyCode || call.rlyShortName ? `${call.scrCode || call.rlyCode || call.rlyShortName} / ` : ''}{call.poNo}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Vendor: {call.vendorCode}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>{call.railPadType}</div>
                                        <div style={{ fontSize: '11px', color: '#0891b2', fontWeight: 800, marginTop: '2px' }}>Qty: {call.totalQty?.toLocaleString()} (Nos.)</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ 
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
                                            background: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a'
                                        }}>
                                            <Clock size={12} /> PENDING
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => handleViewDetails(call.id)}
                                            style={{ 
                                                padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                                background: '#fff', color: '#1e293b', fontSize: '13px', fontWeight: 700,
                                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                        >
                                            <Eye size={16} /> View Actions
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
                                            setPage(0); // Reset to first page
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

            {/* ============ INSPECTION CALL CONTROL PANEL MODAL ============ */}
            {isControlPanelOpen && controlPanelCall && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => setIsControlPanelOpen(false)}>
                    <div style={{
                        background: '#ffffff', borderRadius: '24px', maxWidth: '820px', width: '100%',
                        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        position: 'relative', border: '1px solid #e2e8f0'
                    }} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div style={{ padding: '24px 32px 16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Inspection Call Control Panel</h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Quick actions and documentation utility for this inspection request.</p>
                            </div>
                            <button onClick={() => setIsControlPanelOpen(false)} style={{
                                background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b',
                                transition: 'all 0.2s'
                            }} onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div style={{ padding: '16px 32px 32px 32px' }}>
                            {loadingDetails ? (
                                <ModalSkeleton />
                            ) : (
                                <>
                                    {/* Summary Info Box */}
                                    <div style={{
                                        background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0',
                                        padding: '24px', marginBottom: '28px'
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px 24px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FileText size={12} /> CALL NO
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>{controlPanelCall.callNo || 'N/A'}</div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} /> DESIRED DATE
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                                                    {formatDateDDMMYY(controlPanelCall.inspectionDate || controlPanelCall.desiredInspectionDate)}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> STATUS
                                                </div>
                                                <div style={{ display: 'inline-block', background: '#e2e8f0', color: '#334155', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
                                                    {controlPanelCall.status || 'PENDING'}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Package size={12} /> QTY OFFERED
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                                                    {controlPanelCall.totalQty?.toLocaleString() || controlPanelCall.qtyDesiredForFinal || '0'} Nos.
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <User size={12} /> IE ASSIGNED
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#059669' }}>
                                                    {(transitionHistory || []).slice().reverse().find(t => t.assignedToUserName)?.assignedToUserName || controlPanelCall.ieAssignedName || 'IE Not Assigned'}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Activity size={12} /> STAGE
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                                                    {controlPanelCall.callType === 'PROCESS' ? 'Process' : 'Final'}
                                                </div>
                                            </div>

                                            <div style={{ gridColumn: 'span 3', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px 24px' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FileText size={12} /> PO / SR. NO.
                                                    </div>
                                                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                                                        {formatPoSrNo(controlPanelCall)}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FileText size={12} /> IC NO.
                                                    </div>
                                                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                                                        {controlPanelCall.callNo || 'N/A'}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Info size={12} /> DETAIL OF CALL
                                                    </div>
                                                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                                                        {controlPanelCall.railPadType || '6.00mm NCRGRSP'} {processCallDetails?.drawingNo ? `- Drawing: ${processCallDetails.drawingNo}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operations Header */}
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <LayoutGrid size={14} /> AVAILABLE OPERATIONS
                                    </div>

                                    {/* Operations Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                        {/* Operation 1: View Details */}
                                        <button onClick={() => {
                                            setIsControlPanelOpen(false);
                                            setIsViewingFullDetails(true);
                                        }} style={{
                                            display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
                                            background: '#ffffff', border: '1.5px solid #e2e8f0', borderLeft: '4px solid #3b82f6',
                                            borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                        }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Eye size={22} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>View Details</div>
                                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Review submitted form details</div>
                                            </div>
                                        </button>

                                        {/* Operation 2: Call Letter */}
                                        <button onClick={() => handleDownloadCallLetter(controlPanelCall)} style={{
                                            display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
                                            background: '#ffffff', border: '1.5px solid #e2e8f0', borderLeft: '4px solid #10b981',
                                            borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                        }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Download size={22} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>Call Letter</div>
                                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Download official letter PDF</div>
                                            </div>
                                        </button>

                                        {/* Operation 3: Modify Call */}
                                        <button onClick={() => handleModifyCall(controlPanelCall)} style={{
                                            display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
                                            background: '#ffffff', border: '1.5px solid #e2e8f0', borderLeft: '4px solid #f59e0b',
                                            borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                        }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Edit size={22} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>Modify Call</div>
                                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Update inspection call parameters</div>
                                            </div>
                                        </button>

                                        {/* Operation 4: Withdraw Call */}
                                        <button onClick={() => setIsWithdrawModalOpen(true)} style={{
                                            display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
                                            background: '#ffffff', border: '1.5px solid #e2e8f0', borderLeft: '4px solid #ef4444',
                                            borderRadius: '16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                        }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <XCircle size={22} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#dc2626' }}>Withdraw Call</div>
                                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Cancel inspection request</div>
                                            </div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ============ READ-ONLY CALL DETAILS POPUP MODAL ============ */}
            {isViewingFullDetails && selectedCall && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
                    zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => setIsViewingFullDetails(false)}>
                    <div style={{
                        background: '#ffffff', borderRadius: '24px', maxWidth: '960px', width: '100%',
                        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                        position: 'relative', border: '1px solid #e2e8f0', padding: '0px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <CallDetailsView 
                            call={selectedCall} 
                            transitionHistory={transitionHistory}
                            loadingHistory={loadingHistory}
                            processCallDetails={processCallDetails}
                            loadingDetails={loadingDetails}
                            onBack={() => setIsViewingFullDetails(false)} 
                        />
                    </div>
                </div>
            )}

            {/* ============ INTERACTIVE MODIFY CALL MODAL ============ */}
            {isModifyModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)',
                    zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => setIsModifyModalOpen(false)}>
                    <div style={{
                        background: '#ffffff', borderRadius: '24px', maxWidth: '900px', width: '100%',
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                        position: 'relative', border: '1px solid #e2e8f0', overflow: 'hidden'
                    }} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header Banner - Fixed Top */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
                            padding: '24px 32px', color: '#fff',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, marginBottom: '4px' }}>
                                    MODIFY {modifyForm.callType === 'FINAL' ? 'FINAL' : 'PROCESS'} INSPECTION CALL
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                                    <Edit size={20} /> {modifyForm.callNo}
                                </h2>
                            </div>
                            <button onClick={() => setIsModifyModalOpen(false)} style={{
                                background: 'rgba(255, 255, 255, 0.2)', border: 'none', borderRadius: '50%',
                                width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', color: '#ffffff'
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveModification} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
                            {/* Scrollable Form Content */}
                            <div style={{ padding: '28px 32px 16px', overflowY: 'auto', flex: 1 }}>
                                {/* Top Field: Type of Call */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                        TYPE OF CALL <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        disabled
                                        value={modifyForm.callType === 'FINAL' ? 'Final' : 'Process'}
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                                            border: '1px solid #cbd5e1', background: '#f8fafc',
                                            color: '#64748b', fontWeight: 700, fontSize: '14px'
                                        }}
                                    />
                                </div>

                                {/* Section A: Call Header & Basic Information */}
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                                    <SectionHeader label="Call Header & Basic Information" step="A" color="#3b82f6" />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                                TYPE OF RAIL PAD <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <select
                                                value={modifyForm.railPadType}
                                                onChange={(e) => {
                                                    const newPad = e.target.value;
                                                    const firstDraw = (DRAWING_MAPPING[newPad] || [])[0] || '';
                                                    setModifyForm(prev => ({ ...prev, railPadType: newPad, drawingNo: firstDraw }));
                                                }}
                                                required
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                                    border: '1.5px solid #3b82f6', background: '#fff',
                                                    color: '#0f172a', fontWeight: 700, fontSize: '14px', outline: 'none'
                                                }}
                                            >
                                                <option value="">Select Rail Pad Type</option>
                                                {RAIL_PAD_TYPES.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                                DRAWING NO. <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            {(DRAWING_MAPPING[modifyForm.railPadType] || []).length > 0 ? (
                                                <select
                                                    value={modifyForm.drawingNo}
                                                    onChange={(e) => setModifyForm(prev => ({ ...prev, drawingNo: e.target.value }))}
                                                    required
                                                    style={{
                                                        width: '100%', padding: '12px 16px', borderRadius: '12px',
                                                        border: '1.5px solid #3b82f6', background: '#fff',
                                                        color: '#0f172a', fontWeight: 700, fontSize: '14px', outline: 'none'
                                                    }}
                                                >
                                                    <option value="">Select Drawing No</option>
                                                    {(DRAWING_MAPPING[modifyForm.railPadType] || []).map(drg => (
                                                        <option key={drg} value={drg}>{drg}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={modifyForm.drawingNo}
                                                    onChange={(e) => setModifyForm(prev => ({ ...prev, drawingNo: e.target.value }))}
                                                    placeholder="Enter drawing no."
                                                    required
                                                    style={{
                                                        width: '100%', padding: '12px 16px', borderRadius: '12px',
                                                        border: '1.5px solid #3b82f6', background: '#fff',
                                                        color: '#0f172a', fontWeight: 700, fontSize: '14px', outline: 'none'
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section B: Quantities & Schedules */}
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                                    <SectionHeader label="Quantities & Schedules" step="B" color="#8b5cf6" />
                                    
                                    {/* Stat Boxes */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                        <StatBox label="UNIT OF MEASUREMENT" value="Nos." />
                                        <StatBox label="QUANTITY ON ORDER" value="50,000" />
                                        <StatBox label="QTY ACCEPTED TILL NOW" value="0" color="#059669" />
                                        <StatBox label="QUANTITY DUE" value="50,000" highlight={true} />
                                    </div>

                                    {/* Editable Fields */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                                {modifyForm.callType === 'FINAL' ? 'TOTAL QUANTITY TO OFFER *' : 'QUANTITY DESIRED FOR FINAL INSPECTION *'}
                                            </label>
                                            <input
                                                type="number"
                                                value={modifyForm.totalQty}
                                                onChange={(e) => setModifyForm(prev => ({ ...prev, totalQty: e.target.value }))}
                                                placeholder="Enter quantity"
                                                required
                                                min="1"
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                                    border: '1.5px solid #8b5cf6', background: '#fff',
                                                    color: '#0f172a', fontWeight: 800, fontSize: '14px', outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                                {modifyForm.callType === 'FINAL' ? 'DESIRED INSPECTION DATE *' : 'APPROX. DATE OF PRODUCTION INITIATION *'}
                                            </label>
                                            <input
                                                type="date"
                                                value={modifyForm.inspectionDate}
                                                onChange={(e) => setModifyForm(prev => ({ ...prev, inspectionDate: e.target.value }))}
                                                required
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                                    border: '1.5px solid #8b5cf6', background: '#fff',
                                                    color: '#0f172a', fontWeight: 700, fontSize: '14px', outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section C: Offered Lots & Batches (for Final Calls) */}
                                {modifyForm.callType === 'FINAL' && (
                                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                                        <SectionHeader label="Offered Lots & Batches" step="C" color="#10b981" />
                                        {(modifyForm.lots || []).length > 0 ? (
                                            (modifyForm.lots || []).map((lot, lIdx) => (
                                                <div key={lot.id || lIdx} style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>{lot.lotNo || `Lot ${lIdx + 1}`}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Lot Size:</span>
                                                            <input
                                                                type="number"
                                                                value={lot.lotSize || 0}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value, 10) || 0;
                                                                    setModifyForm(prev => {
                                                                        const updatedLots = [...(prev.lots || [])];
                                                                        updatedLots[lIdx] = { ...updatedLots[lIdx], lotSize: val };
                                                                        return { ...prev, lots: updatedLots };
                                                                    });
                                                                }}
                                                                style={{
                                                                    width: '100px', padding: '6px 10px', borderRadius: '8px',
                                                                    border: '1.5px solid #10b981', fontWeight: 800, fontSize: '13px',
                                                                    color: '#059669', background: '#fff'
                                                                }}
                                                            />
                                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Nos.</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                                                        {(lot.batches || []).map((batch, bIdx) => (
                                                            <div key={batch.id || bIdx} style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Batch No</div>
                                                                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '13px' }}>{batch.batchNo}</div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #f1f5f9', fontSize: '10px', color: '#64748b' }}>
                                                                    <span>Qty: <strong>{batch.quantity || batch.qtyToUse || batch.availableQty || 0}</strong></span>
                                                                    <span>Drawing: <strong>{batch.drawingNo || modifyForm.drawingNo || 'N/A'}</strong></span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                                                No offered lots assigned to this final call.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pinned Sticky Footer Row */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '16px 32px', borderTop: '1px solid #e2e8f0', background: '#ffffff',
                                flexShrink: 0
                            }}>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                    All modifications are logged in audit trail (call_no, field_name, old_value, new_value).
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsModifyModalOpen(false)}
                                        style={{
                                            padding: '10px 24px', borderRadius: '10px', border: '1px solid #cbd5e1',
                                            background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingModification}
                                        style={{
                                            padding: '10px 28px', borderRadius: '10px', border: 'none',
                                            background: '#21808d', color: '#ffffff', fontSize: '14px', fontWeight: 800,
                                            cursor: savingModification ? 'not-allowed' : 'pointer', opacity: savingModification ? 0.7 : 1,
                                            boxShadow: '0 4px 12px rgba(33,128,141,0.25)'
                                        }}
                                    >
                                        {savingModification ? 'Saving...' : 'Save Modifications'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ WITHDRAW CALL MODAL ============ */}
            {isWithdrawModalOpen && controlPanelCall && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
                    zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setIsWithdrawModalOpen(false)}>
                    <div style={{
                        background: '#fff', borderRadius: '20px', maxWidth: '540px', width: '100%',
                        padding: '28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', border: '1px solid #e2e8f0'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Withdraw Inspection Call</h3>
                            <button onClick={() => setIsWithdrawModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px', color: '#991b1b', fontSize: '13px', marginBottom: '20px' }}>
                            <strong>Attention:</strong> Withdrawing this inspection call will cancel the request. This action cannot be undone.
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                Withdrawal Remarks <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <textarea
                                rows="3"
                                value={withdrawRemarks}
                                onChange={(e) => setWithdrawRemarks(e.target.value)}
                                placeholder="Please provide a reason for withdrawing this inspection call..."
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setIsWithdrawModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleWithdrawSubmit} disabled={withdrawing || !withdrawRemarks.trim()} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: withdrawing || !withdrawRemarks.trim() ? 'not-allowed' : 'pointer', opacity: withdrawing || !withdrawRemarks.trim() ? 0.6 : 1 }}>
                                {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getActionActivityDetails = (tx) => {
    const action = (tx.action || '').toUpperCase();
    
    switch (action) {
        case 'CREATED':
            return {
                title: 'Call Raised',
                text: tx.remarks || 'Inspection call successfully submitted by vendor.',
                icon: <Plus size={12} />,
                color: '#2563eb' // Blue
            };
        case 'VERIFY':
            return {
                title: 'Call Verified by RIO',
                text: tx.remarks || 'Verified and forwarded by RIO Help Desk.',
                icon: <CheckCircle2 size={12} />,
                color: '#10b981' // Green
            };
        case 'MAIN_IE_SCHEDULE_CALL':
            return {
                title: 'Inspection Scheduled',
                text: tx.remarks || 'Call scheduled for inspection by Main IE.',
                icon: <Calendar size={12} />,
                color: '#06b6d4' // Cyan
            };
        case 'RESCHEDULE_CALL':
            return {
                title: 'Inspection Rescheduled',
                text: tx.remarks || 'Call rescheduled for inspection by Main IE.',
                icon: <Calendar size={12} />,
                color: '#f59e0b' // Amber
            };
        case 'INITIATE_CALL':
            return {
                title: 'Inspection Initiated',
                text: tx.remarks || 'Physical inspection initiated by Main IE.',
                icon: <Clock size={12} />,
                color: '#3b82f6' // Blue
            };
        case 'PAUSE':
            return {
                title: 'Inspection Paused',
                text: tx.remarks || 'Inspection paused temporarily by Main IE.',
                icon: <Clock size={12} />,
                color: '#ef4444' // Red
            };
        case 'RESUME':
            return {
                title: 'Inspection Resumed',
                text: tx.remarks || 'Inspection resumed by Main IE.',
                icon: <CheckCircle2 size={12} />,
                color: '#10b981' // Green
            };
        case 'WITHHELD':
            return {
                title: 'Inspection Withheld',
                text: tx.remarks || 'Inspection withheld by Main IE.',
                icon: <AlertCircle size={12} />,
                color: '#ef4444' // Red
            };
        case 'RETURN_TO_VENDOR':
            return {
                title: 'Call Returned to Vendor',
                text: tx.remarks || 'Call returned for corrections.',
                icon: <AlertCircle size={12} />,
                color: '#ef4444' // Red
            };
        case 'RESUBMIT':
            return {
                title: 'Call Resubmitted',
                text: tx.remarks || 'Call details corrected and resubmitted by vendor.',
                icon: <Plus size={12} />,
                color: '#3b82f6' // Blue
            };
        case 'COMPLETED':
        case 'FINISH':
            return {
                title: 'Inspection Completed',
                text: tx.remarks || 'Inspection completed successfully by Main IE.',
                icon: <CheckCircle2 size={12} />,
                color: '#10b981' // Green
            };
        case 'IC_GENERATION':
        case 'IC_ISSUE':
            return {
                title: 'IC Certificate Issued',
                text: tx.remarks || 'Inspection Certificate generated.',
                icon: <FileText size={12} />,
                color: '#10b981' // Green
            };
        default:
            const formattedTitle = action.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return {
                title: formattedTitle || 'Workflow Update',
                text: tx.remarks || `Status: ${tx.status || 'PENDING'}`,
                icon: <Info size={12} />,
                color: '#64748b' // Slate
            };
    }
};

const SectionHeader = ({ label, step, color = '#21808d' }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 16, paddingBottom: 8,
        borderBottom: `1px solid #f1f5f9`
    }}>
        <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 12, flexShrink: 0,
            boxShadow: `0 2px 6px ${color}33`
        }}>{step}</div>
        <span style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', letterSpacing: '0.01em' }}>
            {label}
        </span>
    </div>
);

const StatBox = ({ label, value, highlight, color, suffix }) => (
    <div style={{
        background: highlight ? 'linear-gradient(135deg, #fefce8, #fef9c3)' : '#f8fafc',
        border: `1px solid ${highlight ? '#fde047' : '#e2e8f0'}`,
        borderRadius: 12, padding: '12px 16px', flex: 1
    }}>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{
            fontSize: '16px', fontWeight: 900,
            color: color || (highlight ? '#1e293b' : '#0f172a')
        }}>
            {value} {suffix && <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{suffix}</span>}
        </div>
    </div>
);

const CallDetailsView = ({ call, transitionHistory, processCallDetails, loadingDetails, onBack }) => {
    const isProcess = call.callType === 'PROCESS';
    const assignedIeName = (transitionHistory || []).slice().reverse().find(t => t.assignedToUserName)?.assignedToUserName || call.ieAssignedName || 'IE Not Assigned';

    return (
        <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden' }}>
            {/* Header Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
                padding: '24px 32px', color: '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, marginBottom: '4px' }}>
                        {isProcess ? 'RAISE PROCESS INSPECTION CALL' : 'RAISE FINAL INSPECTION CALL'}
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                        <Package size={22} /> {formatPoSrNo(call)}
                    </h2>
                </div>
                <button onClick={onBack} style={{
                    background: 'rgba(255, 255, 255, 0.2)', border: 'none', borderRadius: '50%',
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#ffffff', transition: 'all 0.2s'
                }}>
                    <X size={20} />
                </button>
            </div>

            <div style={{ padding: '28px 32px' }}>
                {/* Top Field: Type of Call */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        TYPE OF CALL <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        readOnly
                        disabled
                        value={isProcess ? 'Process' : 'Final'}
                        style={{
                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                            border: '1px solid #cbd5e1', background: '#f8fafc',
                            color: '#1e293b', fontWeight: 700, fontSize: '14px'
                        }}
                    />
                </div>

                {/* Section A: Call Header & Basic Information */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                    <SectionHeader label="Call Header & Basic Information" step="A" color="#3b82f6" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                TYPE OF RAIL PAD <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                readOnly
                                disabled
                                value={call.railPadType || processCallDetails?.railPadType || (call.poDes?.includes('NCRGRSP') || call.itemDescription?.includes('NCRGRSP') ? '6.00mm NCRGRSP' : (call.poDes?.includes('CGRSP') ? '6.20mm CGRSP' : (call.poDes?.includes('GRSP') ? '6.00mm GRSP' : 'N/A')))}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                    border: '1px solid #cbd5e1', background: '#f8fafc',
                                    color: '#1e293b', fontWeight: 700, fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                DRAWING NO. <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                readOnly
                                disabled
                                value={call.drawingNo || processCallDetails?.drawingNo || (call.lots && call.lots[0]?.batches && call.lots[0]?.batches[0]?.drawingNo) || 'N/A'}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                    border: '1px solid #cbd5e1', background: '#f8fafc',
                                    color: '#1e293b', fontWeight: 700, fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                ASSIGNED INSPECTION ENGINEER (IE)
                            </label>
                            <input
                                type="text"
                                readOnly
                                disabled
                                value={assignedIeName}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                    border: '1px solid #cbd5e1', background: '#f8fafc',
                                    color: '#059669', fontWeight: 800, fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Section B: Quantities & Schedules */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                    <SectionHeader label="Quantities & Schedules" step="B" color="#8b5cf6" />
                    
                    {/* Stat Boxes */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <StatBox label="UNIT OF MEASUREMENT" value={processCallDetails?.uom || call.uom || 'Nos.'} />
                        <StatBox label="QUANTITY ON ORDER" value={processCallDetails?.qtyOnOrder?.toLocaleString() || call.qtyOnOrder?.toLocaleString() || '50,000'} />
                        <StatBox label="QTY ACCEPTED TILL NOW" value={processCallDetails?.qtyAcceptedTillNow?.toLocaleString() || call.qtyAcceptedTillNow?.toLocaleString() || '0'} color="#059669" />
                        <StatBox label="QUANTITY DUE" value={processCallDetails?.qtyDue?.toLocaleString() || call.qtyDue?.toLocaleString() || '50,000'} highlight={true} />
                    </div>

                    {/* Quantity & Date Form Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                {isProcess ? 'QUANTITY DESIRED FOR FINAL INSPECTION *' : 'TOTAL QUANTITY TO OFFER *'}
                            </label>
                            <input
                                type="text"
                                readOnly
                                disabled
                                value={processCallDetails?.qtyDesiredForFinal?.toLocaleString() || call.totalQty?.toLocaleString() || '0'}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                    border: '1px solid #cbd5e1', background: '#f8fafc',
                                    color: '#1e293b', fontWeight: 800, fontSize: '14px'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                {isProcess ? 'APPROX. DATE OF PRODUCTION INITIATION *' : 'DESIRED INSPECTION DATE *'}
                            </label>
                            <input
                                type="text"
                                readOnly
                                disabled
                                value={formatDateDDMMYY(processCallDetails?.productionInitiationDate || call.inspectionDate)}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                    border: '1px solid #cbd5e1', background: '#f8fafc',
                                    color: '#1e293b', fontWeight: 700, fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Section C: Offered Lots (if Final Call) */}
                {!isProcess && (call.lots || []).length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                        <SectionHeader label="Offered Lots & Batches" step="C" color="#10b981" />
                        {(call.lots || []).map((lot, lIdx) => (
                            <div key={lot.id || lIdx} style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>{lot.lotNo || `Lot ${lIdx + 1}`}</div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>Lot Size: {lot.lotSize} Nos.</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                                    {(lot.batches || []).map((batch, bIdx) => (
                                        <div key={batch.id || bIdx} style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Batch No</div>
                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '13px' }}>{batch.batchNo}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #f1f5f9', fontSize: '10px', color: '#64748b' }}>
                                                <span>Qty: <strong>{batch.quantity || batch.qtyToUse || batch.availableQty || 0}</strong></span>
                                                <span>Date: <strong>{formatDateDDMMYY(batch.productionDate || batch.manufactureDate || batch.createdDate || batch.date || call.inspectionDate)}</strong></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                        Read-Only View: Submitted inspection request parameters.
                    </div>
                    <button onClick={onBack} style={{
                        padding: '10px 28px', borderRadius: '10px', border: '1px solid #cbd5e1',
                        background: '#f8fafc', color: '#334155', fontSize: '14px', fontWeight: 800,
                        cursor: 'pointer', transition: 'all 0.2s'
                    }} onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const InfoRow = ({ label, value }) => (
    <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>{value}</div>
    </div>
);

const ActivityItem = ({ icon, title, date, text, active, customColor }) => {
    const bgColor = active ? (customColor || '#2563eb') : '#f1f5f9';
    const textColor = active ? '#fff' : '#94a3b8';
    
    return (
        <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', 
                background: bgColor, 
                color: textColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? `0 0 0 4px ${bgColor}1a` : 'none'
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontWeight: 800, color: active ? '#1e293b' : '#94a3b8', fontSize: '13px' }}>{title}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>{date}</div>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>{text}</div>
            </div>
        </div>
    );
};

export default RequestedCallsDashboard;
