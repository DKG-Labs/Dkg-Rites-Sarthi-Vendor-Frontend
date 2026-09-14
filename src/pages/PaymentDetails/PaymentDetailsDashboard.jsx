import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './PaymentDetails.css';
import VerifyPaymentModal from './VerifyPaymentModal';
import inspectionCallService from '../../services/inspectionCallService';
import { getBaseUrl } from '../../services/apiConfig';
import { 
    Search, CheckCircle2, AlertCircle, 
    FileText, ArrowUpRight, Loader2,
    Download, ExternalLink
} from './icons';

export const formatDateDDMMYY = (dateStr) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    } catch {
        return String(dateStr);
    }
};

const PaymentDetailsDashboard = ({ plantId: propPlantId, vendorCode: propVendorCode, vendorName }) => {
    const effectivePlantId = propPlantId || sessionStorage.getItem('plantId') || localStorage.getItem('plantId') || localStorage.getItem('selectedPlantId') || '';
    const effectiveVendorCode = propVendorCode || sessionStorage.getItem('vendorCode') || localStorage.getItem('vendorCode') || localStorage.getItem('vendor_code') || '';

    const [savedPaymentsMap, setSavedPaymentsMap] = useState(() => {
        try {
            const saved = localStorage.getItem('erc_vendor_payments_map');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const [cancelledCalls, setCancelledCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [showOldApproved] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentRedirectCall, setPaymentRedirectCall] = useState(null);

    // IBS Verification modal state
    const [verifyingCall, setVerifyingCall] = useState(null);
    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [ibsResult, setIbsResult] = useState(null);
    const [verifyRowRef, setVerifyRowRef] = useState(null);

    // Cancellation Document Viewer state
    const [viewingDocCall, setViewingDocCall] = useState(null);
    const [docBlobUrl, setDocBlobUrl] = useState(null);
    const [docFileName, setDocFileName] = useState('Cancellation_Document.pdf');
    const [docLoading, setDocLoading] = useState(false);
    const [docError, setDocError] = useState(null);

    const getRioEmail = (call) => {
        const rioStr = (call?.rio || call?.plant_id || call?.plantId || effectivePlantId || '').toUpperCase();
        if (rioStr.includes('EAST') || rioStr.includes('KOLKATA') || rioStr.includes('ER') || rioStr.includes('SER') || rioStr.includes('ECR') || rioStr.includes('ERIO')) return 'callletter.er@rites.com';
        if (rioStr.includes('WEST') || rioStr.includes('MUMBAI') || rioStr.includes('WR') || rioStr.includes('WRIO')) return 'dfo.wrio@rites.com';
        if (rioStr.includes('SOUTH') || rioStr.includes('CHENNAI') || rioStr.includes('SR') || rioStr.includes('SCR') || rioStr.includes('SWR') || rioStr.includes('SRIO')) return 'dfo.srio@rites.com';
        if (rioStr.includes('CENT') || rioStr.includes('BHILAI') || rioStr.includes('RAIPUR') || rioStr.includes('SECR') || rioStr.includes('WCR') || rioStr.includes('CR') || rioStr.includes('CRIO')) return 'dfo.crio@rites.com';
        if (rioStr.includes('NORTH') || rioStr.includes('DELHI') || rioStr.includes('NR') || rioStr.includes('NCR') || rioStr.includes('NWR') || rioStr.includes('NRIO')) return 'nrinspn.fin@rites.com';

        if (call?.rio_email && !call.rio_email.startsWith('sbu.')) return call.rio_email;
        if (call?.rioEmail && !call.rioEmail.startsWith('sbu.')) return call.rioEmail;

        return 'nrinspn.fin@rites.com';
    };

    const handleOpenCancellationDoc = async (call) => {
        const callNo = call?.call_no || call?.callNo || call?.inspection_call_number || call?.requestId;
        if (!callNo) return;
        setViewingDocCall(call);
        setDocLoading(true);
        setDocError(null);
        setDocBlobUrl(null);
        const defaultName = call?.document_name || call?.documentName || `Cancellation_${callNo}.pdf`;
        setDocFileName(defaultName);

        try {
            const rawBase = getBaseUrl() || 'http://localhost:8080/sarthi-backend/api';
            const cleanBase = rawBase.replace(/\/api\/?$/, '');
            const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const certResp = await fetch(`${cleanBase}/api/certificate-storage/get/${encodeURIComponent(callNo)}`, { headers });
            if (certResp.ok) {
                const json = await certResp.json();
                const certData = json.responseData || json.data || json;
                if (certData && certData.signedData) {
                    const cleanBase64 = String(certData.signedData).replace(/^data:application\/pdf;base64,/, '').trim();
                    const byteCharacters = atob(cleanBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    setDocBlobUrl(url);
                    setDocLoading(false);
                    return;
                }
            }

            const docResp = await fetch(`${cleanBase}/api/workflow/cancellation-documents/download/${encodeURIComponent(callNo)}`, { headers });
            if (docResp.ok) {
                const blob = await docResp.blob();
                const url = URL.createObjectURL(blob);
                setDocBlobUrl(url);
                setDocLoading(false);
                return;
            }

            setDocError('Cancellation letter PDF is not available for this call.');
            setDocLoading(false);
        } catch (err) {
            console.error('Error fetching cancellation document:', err);
            setDocError('Failed to load cancellation document. Please try again.');
            setDocLoading(false);
        }
    };

    const fetchPlantCalls = useCallback(async () => {
        setLoading(true);
        try {
            const data = await inspectionCallService.getCancelledCallsForPayment(effectivePlantId, effectiveVendorCode);
            setCancelledCalls(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load cancelled calls for payment:', err);
            setCancelledCalls([]);
        } finally {
            setLoading(false);
        }
    }, [effectivePlantId, effectiveVendorCode]);

    useEffect(() => {
        fetchPlantCalls();
    }, [fetchPlantCalls]);

    useEffect(() => {
        try {
            localStorage.setItem('erc_vendor_payments_map', JSON.stringify(savedPaymentsMap));
        } catch (e) {
            console.error('Failed to save payment map to storage', e);
        }
    }, [savedPaymentsMap]);

    const allCombinedPaymentItems = useMemo(() => {
        const list = [];
        cancelledCalls.forEach(call => {
            const callNo = call.callNo || call.call_no;
            const saved = savedPaymentsMap[callNo];

            let paymentStatus = call.paymentStatus || 'Payment Pending';
            if (saved?.payment_status) {
                paymentStatus = saved.payment_status;
            } else if (
                paymentStatus === 'PAID' || 
                paymentStatus === 'Payment Completed' || 
                paymentStatus === 'COMPLETED' || 
                paymentStatus === 'APPROVED' || 
                paymentStatus === 'Approved by RITES Finance'
            ) {
                paymentStatus = 'Approved by RITES Finance';
            }

            list.push({
                ...call,
                call_no: callNo,
                call_date: call.callDate || call.createdDate,
                po_no: call.poNo,
                po_sr: call.poSr,
                offered_qty: call.offeredQty || 0,
                erc_type: call.ercType || 'ERC',
                ibs_case_no: call.ibsCaseNo || call.caseNo || '',
                ibs_call_no: call.ibsCallNo || '',
                payment_reason: call.paymentReason || 'Cancellation',
                charge_type: call.chargeType || 'Cancellation',
                base_payable_amount: call.basePayableAmount || 0,
                gst: call.gst || 0,
                total_payable_amount: call.totalPayableAmount || 0,
                bank_account_details: call.bankAccountDetails || 'SBI A/c: 39482910482, IFSC: SBIN0001234, Branch: RITES Central',
                payment_status: paymentStatus,
                rio: call.rio || 'Northern',
                rio_email: call.rioEmail || 'nrinspn.fin@rites.com',
                document_name: call.documentName || null,
                cancel_remarks: call.cancelRemarks || '',
                ...(saved || {})
            });
        });
        return list;
    }, [cancelledCalls, savedPaymentsMap]);

    const filteredPaymentItems = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return allCombinedPaymentItems.filter(item => {
            if (paymentStatusFilter !== 'all') {
                if (paymentStatusFilter === 'Payment Pending' && item.payment_status !== 'Payment Pending' && item.payment_status !== 'Payment Pending for Approval' && item.payment_status !== 'Not Approved by RITES Finance') {
                    return false;
                }
                if (paymentStatusFilter === 'Approved by RITES Finance' && item.payment_status !== 'Approved by RITES Finance') {
                    return false;
                }
            }

            if (searchTerm.trim()) {
                const s = searchTerm.toLowerCase();
                const matches = (item.call_no || '').toLowerCase().includes(s) ||
                                (item.po_no || '').toLowerCase().includes(s) ||
                                (item.ibs_case_no || '').toLowerCase().includes(s) ||
                                (item.payment_reason || '').toLowerCase().includes(s);
                if (!matches) return false;
            }

            if (item.payment_status === 'Approved by RITES Finance' && !showOldApproved) {
                const approvedDate = item.approved_date ? new Date(item.approved_date) : new Date(item.call_date);
                if (approvedDate < thirtyDaysAgo) return false;
            }

            return true;
        });
    }, [allCombinedPaymentItems, paymentStatusFilter, searchTerm, showOldApproved]);

    const formatForIbs = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d)) return dateStr;
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        } catch { return dateStr; }
    };

    const handleVerifyPayment = async (row) => {
        const caseNo = row.ibs_case_no;
        const ibsCallSno = row.ibs_call_no;
        const callDate = formatForIbs(row.call_date);

        if (!caseNo || !ibsCallSno || !callDate) {
            alert('IBS Case No., IBS Call Sr. No. and Call Date are required to verify payment.');
            return;
        }

        setVerifyingCall(row.call_no);
        setVerifyRowRef(row);
        setVerifyModalOpen(false);
        setIbsResult(null);

        try {
            const result = await inspectionCallService.verifyIbsPayment(caseNo, callDate, ibsCallSno);
            setIbsResult(result);
            setVerifyingCall(null);
            setVerifyModalOpen(true);
        } catch (err) {
            setVerifyingCall(null);
            setIbsResult({
                resultFlag: 0,
                message: 'Failed to reach verification service. Please try again.',
                bill_details: [],
                payment_details: [],
                bill_details_error: err?.message || 'Network error',
                payment_details_error: null
            });
            setVerifyModalOpen(true);
        }
    };

    const handlePaymentApproved = (callNo) => {
        setSavedPaymentsMap(prev => ({
            ...prev,
            [callNo]: {
                ...(prev[callNo] || {}),
                payment_status: 'Approved by RITES Finance'
            }
        }));
        setTimeout(() => fetchPlantCalls(), 800);
    };

    const pendingCount = allCombinedPaymentItems.filter(i => 
        i.payment_status === 'Payment Pending' || 
        i.payment_status === 'Payment Pending for Approval' || 
        i.payment_status === 'Not Approved by RITES Finance'
    ).length;

    const approvedCount = allCombinedPaymentItems.filter(i => 
        i.payment_status === 'Approved by RITES Finance' ||
        i.payment_status === 'PAID' ||
        i.payment_status === 'Completed'
    ).length;

    return (
        <div className="payment-module-container fade-in" style={{ padding: '16px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            {/* Header with Segmented Filter & Search */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                marginBottom: '16px'
            }}>
                {/* Title & Subtitle */}
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                        Payment Details Updating Module
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                        Inspection calls requiring charges payment (Cancelled / Rejected)
                    </p>
                </div>

                {/* Right controls: Segmented Tabs & Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Modern Segmented Status Tabs */}
                    <div style={{
                        display: 'inline-flex',
                        background: '#f1f5f9',
                        borderRadius: '8px',
                        padding: '3px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <button
                            type="button"
                            onClick={() => setPaymentStatusFilter('all')}
                            style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: paymentStatusFilter === 'all' ? '#ffffff' : 'transparent',
                                color: paymentStatusFilter === 'all' ? '#0f172a' : '#64748b',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                                boxShadow: paymentStatusFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s'
                            }}
                        >
                            All ({allCombinedPaymentItems.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentStatusFilter('Payment Pending')}
                            style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: paymentStatusFilter === 'Payment Pending' ? '#ffffff' : 'transparent',
                                color: paymentStatusFilter === 'Payment Pending' ? '#dc2626' : '#64748b',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: paymentStatusFilter === 'Payment Pending' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s'
                            }}
                        >
                            <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: '#dc2626',
                                display: 'inline-block'
                            }} />
                            Pending ({pendingCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentStatusFilter('Approved by RITES Finance')}
                            style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: paymentStatusFilter === 'Approved by RITES Finance' ? '#ffffff' : 'transparent',
                                color: paymentStatusFilter === 'Approved by RITES Finance' ? '#16a34a' : '#64748b',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: paymentStatusFilter === 'Approved by RITES Finance' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s'
                            }}
                        >
                            <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: '#16a34a',
                                display: 'inline-block'
                            }} />
                            Approved ({approvedCount})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={14} />
                        <input
                            type="text"
                            placeholder="Search Call / PO / Case No..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '6px 12px 6px 30px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '12.5px',
                                width: '220px',
                                outline: 'none',
                                background: '#fff',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Table */}
            <div className="payment-table-container">
                <table className="payment-table">
                    <thead>
                        <tr>
                            <th>Call No.</th>
                            <th>Call Date</th>
                            <th>PO No.</th>
                            <th>IBS Case No.</th>
                            <th>IBS Call No.</th>
                            <th>Reason</th>
                            <th>Charges (₹)</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b' }}>
                                        <Loader2 size={18} className="spin-animation" />
                                        <span>Loading payment records...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredPaymentItems.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                                    No cancelled or payment pending inspection calls found.
                                </td>
                            </tr>
                        ) : (
                            filteredPaymentItems.map((row) => {
                                const hasIbsCallNo = !!(row.ibs_call_no && String(row.ibs_call_no).trim().length > 0);
                                return (
                                    <tr key={row.call_no}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.call_no}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenCancellationDoc(row);
                                                    }}
                                                    title="View Official RITES Cancellation Letter (PDF)"
                                                    style={{
                                                        border: 'none',
                                                        background: '#eff6ff',
                                                        color: '#2563eb',
                                                        padding: '3px 6px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        fontSize: '11px',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    <FileText size={12} /> Letter
                                                </button>
                                            </div>
                                        </td>
                                        <td>{formatDateDDMMYY(row.call_date)}</td>
                                        <td>
                                            <span style={{ fontWeight: 600 }}>{row.po_no}</span>
                                            {row.po_sr && <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '4px' }}>({row.po_sr})</span>}
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: '#334155' }}>
                                                {row.ibs_case_no || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ 
                                                fontWeight: 700, 
                                                color: hasIbsCallNo ? '#0f172a' : '#94a3b8',
                                                background: hasIbsCallNo ? '#f1f5f9' : 'transparent',
                                                padding: hasIbsCallNo ? '2px 8px' : '0',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                {hasIbsCallNo ? row.ibs_call_no : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                background: '#fef2f2',
                                                color: '#dc2626'
                                            }}>
                                                {row.payment_reason}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 800, color: '#0f172a' }}>
                                                ₹{Number(row.total_payable_amount || 0).toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                {(
                                                    row.payment_status === 'Approved by RITES Finance' || 
                                                    row.payment_status === 'PAID' || 
                                                    row.payment_status === 'Payment Completed' || 
                                                    row.payment_status === 'COMPLETED' || 
                                                    row.payment_status === 'APPROVED'
                                                ) ? (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '5px 12px',
                                                        borderRadius: '20px',
                                                        background: '#f0fdf4',
                                                        color: '#16a34a',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        border: '1px solid #bbf7d0'
                                                    }}>
                                                        <CheckCircle2 size={14} /> Completed
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            disabled={!hasIbsCallNo}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (hasIbsCallNo) {
                                                                    setPaymentRedirectCall(row);
                                                                }
                                                            }}
                                                            title={!hasIbsCallNo ? "IBS Call Sr. No. is not available yet" : "Click to pay cancellation/rejection charges"}
                                                            style={{
                                                                padding: '6px 14px',
                                                                borderRadius: '6px',
                                                                border: hasIbsCallNo ? 'none' : '1px solid #cbd5e1',
                                                                background: hasIbsCallNo ? '#16a34a' : '#94a3b8',
                                                                color: '#fff',
                                                                fontSize: '12px',
                                                                fontWeight: 700,
                                                                cursor: hasIbsCallNo ? 'pointer' : 'not-allowed',
                                                                opacity: hasIbsCallNo ? 1 : 0.65,
                                                                boxShadow: hasIbsCallNo ? '0 1px 2px rgba(22, 163, 74, 0.2)' : 'none',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            Pay Charges
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleVerifyPayment(row);
                                                            }}
                                                            disabled={verifyingCall === row.call_no}
                                                            title={!hasIbsCallNo ? 'IBS Call Sr. No. is not available yet' : 'Verify payment status with IBS'}
                                                            style={{
                                                                padding: '6px 14px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #0284c7',
                                                                background: '#e0f2fe',
                                                                color: '#0369a1',
                                                                fontSize: '12px',
                                                                fontWeight: 700,
                                                                cursor: verifyingCall === row.call_no ? 'not-allowed' : 'pointer',
                                                                transition: 'all 0.2s',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                opacity: verifyingCall === row.call_no ? 0.7 : 1
                                                            }}
                                                        >
                                                            {verifyingCall === row.call_no
                                                                ? <><Loader2 size={12} className="spin-animation" /> Verifying...</>
                                                                : 'Verify Payment'
                                                            }
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* IBS Verify Payment Modal */}
            <VerifyPaymentModal
                isOpen={verifyModalOpen}
                onClose={() => {
                    setVerifyModalOpen(false);
                    setIbsResult(null);
                }}
                ibsResult={ibsResult}
                callRow={verifyRowRef}
                onApproved={handlePaymentApproved}
            />

            {/* Payment Redirect Pop-up Modal */}
            {paymentRedirectCall && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, padding: '20px'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        maxWidth: '520px',
                        width: '100%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '18px 24px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>💳</span>
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                                    Payment Information
                                </h3>
                            </div>
                            <button
                                onClick={() => setPaymentRedirectCall(null)}
                                style={{
                                    border: 'none', background: 'transparent',
                                    fontSize: '18px', color: '#94a3b8', cursor: 'pointer', fontWeight: 700
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px', fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                            <p style={{ marginTop: 0, marginBottom: '16px', color: '#334155', fontWeight: 500 }}>
                                You will now be redirected to the payment page. Please note the following details:
                            </p>

                            <div style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                marginBottom: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>IBS Case No:</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                                        {paymentRedirectCall.ibs_case_no || '-'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>IBS Call Sr. No:</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                                        {paymentRedirectCall.ibs_call_no || '-'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Call Date:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                        {formatDateDDMMYY(paymentRedirectCall.call_date)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Payable (incl. GST):</span>
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a' }}>
                                        ₹{Number(paymentRedirectCall.total_payable_amount || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                fontSize: '12.5px',
                                color: '#1e40af',
                                marginBottom: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                <div>
                                    <span style={{ fontWeight: 700 }}>Note:</span> Please share the payment receipt with the respective RITES Finance Division:
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1d4ed8' }}>
                                    ✉️ <a href={`mailto:${getRioEmail(paymentRedirectCall)}`} style={{ color: '#1d4ed8', textDecoration: 'underline' }}>
                                        {getRioEmail(paymentRedirectCall)}
                                    </a>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    onClick={() => setPaymentRedirectCall(null)}
                                    style={{
                                        padding: '9px 18px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: '#fff',
                                        color: '#475569',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <a
                                    href="https://ritesinsp.com/RBS/Vendor_charges.aspx"
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setPaymentRedirectCall(null)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '9px 20px',
                                        borderRadius: '8px',
                                        background: '#16a34a',
                                        color: '#fff',
                                        fontWeight: 800,
                                        fontSize: '13px',
                                        textDecoration: 'none',
                                        boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                                    }}
                                >
                                    Proceed to Pay <ArrowUpRight size={15} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Official RITES Cancellation Letter Viewer Modal */}
            {viewingDocCall && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '24px'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '900px',
                        height: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '8px',
                                    background: '#eff6ff', color: '#2563eb',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                        Official RITES Cancellation Letter
                                    </h3>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                                        Call No: <span style={{ fontWeight: 700, color: '#0f172a' }}>{viewingDocCall.call_no || viewingDocCall.callNo}</span>
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {docBlobUrl && (
                                    <>
                                        <a
                                            href={docBlobUrl}
                                            download={docFileName}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                background: '#eff6ff',
                                                color: '#2563eb',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                textDecoration: 'none',
                                                border: '1px solid #bfdbfe'
                                            }}
                                        >
                                            <Download size={13} /> Download
                                        </a>
                                        <a
                                            href={docBlobUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                background: '#f1f5f9',
                                                color: '#334155',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                textDecoration: 'none',
                                                border: '1px solid #cbd5e1'
                                            }}
                                        >
                                            <ExternalLink size={13} /> Open in New Tab
                                        </a>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        setViewingDocCall(null);
                                        setDocBlobUrl(null);
                                    }}
                                    style={{
                                        border: 'none', background: 'transparent',
                                        fontSize: '20px', color: '#94a3b8', cursor: 'pointer', fontWeight: 700,
                                        padding: '4px 8px'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div style={{ flex: 1, position: 'relative', background: '#f1f5f9', overflow: 'hidden' }}>
                            {docLoading ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <Loader2 size={40} className="spin-animation" style={{ color: '#2563eb' }} />
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                                        Loading cancellation document...
                                    </div>
                                </div>
                            ) : docError ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px' }}>
                                    <AlertCircle size={40} style={{ color: '#dc2626' }} />
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#b91c1c', textAlign: 'center' }}>
                                        {docError}
                                    </div>
                                    <button
                                        onClick={() => handleOpenCancellationDoc(viewingDocCall)}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '6px',
                                            background: '#2563eb',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : docBlobUrl ? (
                                <iframe
                                    src={docBlobUrl}
                                    title="Cancellation Letter PDF"
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentDetailsDashboard;
