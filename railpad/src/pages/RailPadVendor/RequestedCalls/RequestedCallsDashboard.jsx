import React, { useState, useEffect, useMemo } from 'react';
import inspectionCallService from '../../../services/inspectionCallService';
import { 
    Search, FileText, Calendar, Package, Eye, 
    ChevronRight, Loader2, AlertCircle, CheckCircle2,
    Clock, ArrowLeft, ClipboardList, Info, Plus
} from 'lucide-react';
import { formatDateDDMMYY } from '../../../utils/dateUtils';

const RequestedCallsDashboard = ({ vendorCode }) => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedCall, setSelectedCall] = useState(null);
    const [transitionHistory, setTransitionHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchCalls();
    }, [vendorCode]);

    const fetchCalls = async () => {
        try {
            setLoading(true);
            const data = await inspectionCallService.getByVendor(vendorCode);
            setCalls(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error("Error fetching calls:", err);
            setError("Failed to load inspection calls.");
        } finally {
            setLoading(false);
        }
    };

    const filteredCalls = useMemo(() => {
        return calls.filter(call => 
            call.callNo?.toLowerCase().includes(search.toLowerCase()) ||
            call.poNo?.toLowerCase().includes(search.toLowerCase())
        );
    }, [calls, search]);

    const [loadingDetails, setLoadingDetails] = useState(false);

    const handleViewDetails = async (callId) => {
        try {
            setLoadingDetails(true);
            setLoadingHistory(true);
            const detailedCall = await inspectionCallService.getById(callId);
            setSelectedCall(detailedCall);
            
            if (detailedCall && detailedCall.callNo) {
                try {
                    const historyRes = await inspectionCallService.getWorkflowHistory(detailedCall.callNo);
                    if (historyRes && historyRes.success && Array.isArray(historyRes.data)) {
                        setTransitionHistory(historyRes.data);
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
            // Fallback to local data if fetch fails
            const localCall = calls.find(c => c.id === callId);
            setSelectedCall(localCall);
            setTransitionHistory([]);
        } finally {
            setLoadingDetails(false);
            setLoadingHistory(false);
        }
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

    if (loading || loadingDetails) {
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

    if (selectedCall) {
        return (
            <CallDetailsView 
                call={selectedCall} 
                transitionHistory={transitionHistory}
                loadingHistory={loadingHistory}
                onBack={() => {
                    setSelectedCall(null);
                    setTransitionHistory([]);
                }} 
            />
        );
    }

    return (
        <div className="fade-in">
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
                                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>{call.poNo}</div>
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
                                            <Eye size={16} /> View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

const CallDetailsView = ({ call, transitionHistory, loadingHistory, onBack }) => {
    return (
        <div className="fade-in">
            <button 
                onClick={onBack}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    padding: '8px 12px', borderRadius: '8px', border: 'none', 
                    background: 'transparent', color: '#64748b', fontWeight: 700, 
                    cursor: 'pointer', marginBottom: '20px' 
                }}
            >
                <ArrowLeft size={18} /> Back to List
            </button>

            <div style={{ background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)', borderRadius: '24px', padding: '32px', color: '#fff', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(33,128,141,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '8px' }}>INSPECTION CALL DETAILS</div>
                        <h2 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{call.callNo}</h2>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={18} opacity={0.7} />
                                <span style={{ fontWeight: 700 }}>Raised on: {formatDateDDMMYY(call.inspectionDate)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Package size={18} opacity={0.7} />
                                <span style={{ fontWeight: 700 }}>Total Qty: {call.totalQty?.toLocaleString()} Nos.</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', opacity: 0.8 }}>CURRENT STATUS</div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '30px', fontSize: '14px', fontWeight: 900, border: '1px solid rgba(255,255,255,0.3)' }}>
                            {transitionHistory && transitionHistory.length > 0 
                                ? (transitionHistory[transitionHistory.length - 1].jobStatus || transitionHistory[transitionHistory.length - 1].status || 'PENDING VERIFICATION').replace(/_/g, ' ')
                                : 'PENDING VERIFICATION'}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Lots Breakdown */}
                    <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={18} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Offered Lots</h3>
                        </div>

                        {(call.lots || []).map((lot, lIdx) => (
                            <div key={lot.id || lIdx} style={{ marginBottom: '20px', padding: '20px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '16px' }}>{lot.lotNo}</div>
                                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0891b2' }}>Lot Size: {lot.lotSize} Nos.</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                    {(lot.batches || []).map((batch, bIdx) => (
                                        <div key={batch.id || bIdx} style={{ background: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Batch No</div>
                                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '14px' }}>{batch.batchNo}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #f1f5f9' }}>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>Qty: <span style={{ color: '#0f172a' }}>{batch.quantity}</span></div>
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>Date: <span style={{ color: '#0f172a' }}>{formatDateDDMMYY(batch.productionDate)}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* PO Info Card */}
                    <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '24px' }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO Information</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <InfoRow label="PO Number" value={call.poNo} />
                            <InfoRow label="Rail Pad Type" value={call.railPadType} />
                            <InfoRow label="Plant ID" value={call.plantId} />
                            <InfoRow label="Vendor Code" value={call.vendorCode} />
                        </div>
                    </div>

                    {/* Timeline / Activity */}
                    <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '24px' }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Call Activity</h4>
                        
                        {loadingHistory ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', padding: '12px 0' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Loading call activity...</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '12px', width: '2px', background: '#f1f5f9' }}></div>
                                
                                {transitionHistory && transitionHistory.length > 0 ? (
                                    <>
                                        {transitionHistory.map((tx, idx) => {
                                            const details = getActionActivityDetails(tx);
                                            const isLast = idx === transitionHistory.length - 1;
                                            const hasNextRole = tx.nextRole && tx.status !== 'COMPLETED';
                                            const isActive = isLast && !hasNextRole;
                                            
                                            return (
                                                <ActivityItem 
                                                    key={tx.workflowTransitionId || idx}
                                                    icon={details.icon} 
                                                    title={details.title} 
                                                    date={tx.createdDate ? formatDateDDMMYY(tx.createdDate) : formatDateDDMMYY(call.inspectionDate)} 
                                                    text={details.text} 
                                                    active={isActive}
                                                    customColor={details.color}
                                                />
                                            );
                                        })}
                                        
                                        {(() => {
                                            const lastTx = transitionHistory[transitionHistory.length - 1];
                                            if (lastTx && lastTx.nextRole && lastTx.status !== 'COMPLETED') {
                                                const nextRole = lastTx.nextRole;
                                                const lastAction = (lastTx.action || '').toUpperCase();
                                                
                                                let pendingTitle = 'Pending Verification';
                                                let pendingText = `Awaiting action by ${nextRole}.`;
                                                
                                                if (nextRole === 'RIO Help Desk') {
                                                    pendingTitle = 'Pending RIO Verification';
                                                    pendingText = 'Awaiting review and verification by RIO Help Desk.';
                                                } else if (nextRole === 'Rail Main IE') {
                                                    if (lastAction === 'VERIFY' || lastAction === 'RESUBMIT') {
                                                        pendingTitle = 'Pending IE Allocation';
                                                        pendingText = 'Request is in queue for Inspection Engineer allocation.';
                                                    } else if (lastAction === 'MAIN_IE_SCHEDULE_CALL') {
                                                        pendingTitle = 'Pending Inspection';
                                                        pendingText = 'Inspection scheduled. Awaiting physical inspection start by IE.';
                                                    } else if (lastAction === 'INITIATE_CALL' || lastAction === 'RESUME') {
                                                        pendingTitle = 'Inspection in Progress';
                                                        pendingText = 'Inspection is currently underway by IE.';
                                                    } else if (lastAction === 'PAUSE') {
                                                        pendingTitle = 'Inspection Paused';
                                                        pendingText = 'Inspection has been temporarily paused by IE.';
                                                    }
                                                }
                                                
                                                return (
                                                    <ActivityItem 
                                                        icon={<Clock size={12} />} 
                                                        title={pendingTitle} 
                                                        date="Waiting..." 
                                                        text={pendingText} 
                                                        active={true}
                                                    />
                                                );
                                            }
                                            return null;
                                        })()}
                                    </>
                                ) : (
                                    <>
                                        <ActivityItem 
                                            icon={<Plus size={12} />} 
                                            title="Call Raised" 
                                            date={formatDateDDMMYY(call.inspectionDate)} 
                                            text="Inspection call successfully submitted by vendor." 
                                            active={false} 
                                        />
                                        <ActivityItem 
                                            icon={<Clock size={12} />} 
                                            title="Pending Verification" 
                                            date="Waiting..." 
                                            text="Request is in queue for verification." 
                                            active={true} 
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
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
