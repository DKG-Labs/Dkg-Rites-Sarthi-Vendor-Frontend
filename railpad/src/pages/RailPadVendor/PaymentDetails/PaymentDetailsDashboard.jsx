import React, { useState, useEffect, useMemo } from 'react';
import './PaymentDetails.css';
import PaymentFormModal from './PaymentFormModal';
import VerifyPaymentModal from './VerifyPaymentModal';
import inspectionCallService from '../../../services/inspectionCallService';
import { API_BASE_URL } from '../../../services/config';
import { formatDateDDMMYY } from '../../../utils/dateUtils';
import { 
    Search, CreditCard, CheckCircle2,
    FileText, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Loader2,
    Copy, Check, Mail, Info, ArrowRight, ShieldAlert
} from 'lucide-react';

const PaymentDetailsDashboard = ({ plantId, vendorCode, vendorName }) => {
    const [copiedField, setCopiedField] = useState(null);

    const handleCopyText = (text, fieldName) => {
        if (!text || text === '-') return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };
    const [savedPaymentsMap, setSavedPaymentsMap] = useState(() => {
        try {
            const saved = localStorage.getItem('railpad_vendor_payments_map');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const [cancelledCalls, setCancelledCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [showOldApproved, setShowOldApproved] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPaymentCall, setSelectedPaymentCall] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [paymentRedirectCall, setPaymentRedirectCall] = useState(null);

    // Cancellation Document Viewer state
    const [viewingDocCall, setViewingDocCall] = useState(null);
    const [docBlobUrl, setDocBlobUrl] = useState(null);
    const [docFileName, setDocFileName] = useState('Cancellation_Document.pdf');
    const [docLoading, setDocLoading] = useState(false);
    const [docError, setDocError] = useState(null);

    // IBS Verify Payment state
    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [verifyingCall, setVerifyingCall] = useState(null);  // callNo of row being checked
    const [verifyRowRef, setVerifyRowRef] = useState(null);    // the actual row object
    const [ibsResult, setIbsResult] = useState(null);
    const [verifyLoading, setVerifyLoading] = useState(null); // stores callNo of the row being verified

    const getRioEmail = (call) => {
        const rioStr = (call?.rio || call?.plant_id || plantId || '').toUpperCase();
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
        const callNo = call?.call_no || call?.callNo || call?.inspection_call_number;
        if (!callNo) return;
        setViewingDocCall(call);
        setDocLoading(true);
        setDocError(null);
        setDocBlobUrl(null);
        const defaultName = call?.document_name || call?.documentName || `Cancellation_${callNo}.pdf`;
        setDocFileName(defaultName);

        try {
            const certData = await inspectionCallService.getSignedCertificate(callNo);
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
                if (certData.fileName) setDocFileName(certData.fileName);
            } else {
                const directUrl = `${API_BASE_URL}/certificate-storage/view/${encodeURIComponent(callNo)}.pdf`;
                setDocBlobUrl(directUrl);
            }
        } catch (err) {
            console.error("Error fetching cancellation document:", err);
            setDocError("Cancellation document could not be loaded or is not available for this call.");
        } finally {
            setDocLoading(false);
        }
    };

    useEffect(() => {
        localStorage.setItem('railpad_vendor_payments_map', JSON.stringify(savedPaymentsMap));
    }, [savedPaymentsMap]);

    useEffect(() => {
        if (plantId) {
            fetchPlantCalls();
        }
    }, [plantId]);

    const fetchPlantCalls = async () => {
        try {
            setLoading(true);
            
            // 1. Try dedicated Backend API for cancelled calls
            try {
                const apiRes = await inspectionCallService.getCancelledCallsForPayment(plantId, vendorCode);
                if (Array.isArray(apiRes)) {
                    setCancelledCalls(apiRes);
                    setLoading(false);
                    return;
                }
            } catch (apiErr) {
                console.warn("Dedicated API failed, falling back to transaction history scan:", apiErr);
            }

            // 2. Fallback: Scan plant calls & transaction history
            const [pendingRes, completedRes] = await Promise.all([
                inspectionCallService.getPaginatedByPlant(plantId, 0, 100, 'all'),
                inspectionCallService.getCompletedPaginatedByPlant(plantId, 0, 100)
            ]);

            const allFetched = [
                ...(pendingRes?.content || (Array.isArray(pendingRes) ? pendingRes : [])),
                ...(completedRes?.content || (Array.isArray(completedRes) ? completedRes : []))
            ];

            // Deduplicate by callNo
            const uniqueCallsMap = new Map();
            allFetched.forEach(c => {
                const cNo = c.callNo || c.call_no;
                if (cNo && !uniqueCallsMap.has(cNo)) {
                    uniqueCallsMap.set(cNo, c);
                }
            });
            const uniqueCalls = Array.from(uniqueCallsMap.values());

            // Check workflow history for each call to see if status in rail_workflow_transaction is CANCELLED
            const cancelledList = [];
            await Promise.all(uniqueCalls.map(async (call) => {
                const callNo = call.callNo || call.call_no;
                if (!callNo) return;

                let isCancelledInWorkflow = false;
                let cancelTx = null;

                const directStatus = String(call.status || call.workflowStatus || call.latestAction || '').toUpperCase();
                if (directStatus === 'CANCELLED' || directStatus === 'CANCEL' || directStatus.includes('CANCEL')) {
                    isCancelledInWorkflow = true;
                }

                try {
                    const historyRes = await inspectionCallService.getWorkflowHistory(callNo);
                    const txList = Array.isArray(historyRes?.responseData) ? historyRes.responseData : (Array.isArray(historyRes) ? historyRes : []);
                    
                    const foundCancelTx = txList.find(tx => {
                        const st = String(tx.status || '').toUpperCase();
                        const jst = String(tx.jobStatus || '').toUpperCase();
                        const act = String(tx.action || '').toUpperCase();
                        return st === 'CANCELLED' || jst === 'CANCELLED' || act.includes('CANCEL');
                    });

                    if (foundCancelTx) {
                        isCancelledInWorkflow = true;
                        cancelTx = foundCancelTx;
                    }
                } catch (e) {
                    // Ignore workflow fetch error for individual call
                }

                if (isCancelledInWorkflow) {
                    cancelledList.push({
                        ...call,
                        callNo,
                        cancelRemarks: cancelTx?.remarks || call.remarks || '',
                        cancelAction: cancelTx?.action || '',
                        cancelDate: cancelTx?.createdDate || cancelTx?.updatedDate || call.inspectionDate || call.createdAt
                    });
                }
            }));

            setCancelledCalls(cancelledList);
        } catch (err) {
            console.error("Error fetching calls for payment module:", err);
        } finally {
            setLoading(false);
        }
    };

    const isPaymentApproved = (status) => {
        if (!status) return false;
        const s = String(status).toUpperCase().trim();
        return s === 'APPROVED BY RITES FINANCE' || s === 'APPROVED' || s === 'PAID' || s === 'COMPLETED' || s === 'PAYMENT COMPLETED';
    };

    // Combine only verified cancelled calls from workflow transactions with user-entered payments
    const allCombinedPaymentItems = useMemo(() => {
        return cancelledCalls.map(c => {
            const callNo = c.callNo || c.call_no;
            const saved = savedPaymentsMap[callNo] || {};
            const isPaymentBlocked = String(c.status || '').toLowerCase().includes('payment');

            const baseAmount = saved.base_payable_amount !== undefined ? saved.base_payable_amount : (c.basePayableAmount !== undefined ? c.basePayableAmount : (c.base_payable_amount || 0));
            const gst = saved.gst !== undefined ? saved.gst : (c.gst !== undefined ? c.gst : Math.round((baseAmount * 18) / 100));
            const total = saved.total_payable_amount !== undefined ? saved.total_payable_amount : (c.totalPayableAmount !== undefined ? c.totalPayableAmount : (c.total_payable_amount || (baseAmount + gst)));

            // Backend status from database (c.paymentStatus) takes precedence over stale localStorage
            const backendStatus = c.paymentStatus || c.payment_status;
            let finalPaymentStatus = 'Payment Pending';
            if (backendStatus) {
                const s = String(backendStatus).toUpperCase().trim();
                if (s === 'APPROVED BY RITES FINANCE' || s === 'APPROVED' || s === 'PAID' || s === 'COMPLETED' || s === 'PAYMENT COMPLETED') {
                    finalPaymentStatus = 'Approved by RITES Finance';
                } else if (s === 'PAYMENT PENDING FOR APPROVAL') {
                    finalPaymentStatus = 'Payment Pending for Approval';
                } else if (s === 'NOT APPROVED BY RITES FINANCE' || s === 'REJECTED') {
                    finalPaymentStatus = 'Not Approved by RITES Finance';
                } else {
                    finalPaymentStatus = 'Payment Pending';
                }
            } else if (saved.payment_status) {
                finalPaymentStatus = saved.payment_status;
            }

            return {
                id: c.id || c.workflowTransitionId || callNo,
                call_no: callNo,
                call_date: c.callDate || c.cancelDate || c.inspectionDate || c.createdAt || new Date().toISOString().split('T')[0],
                po_no: c.poNo || c.po_no || '-',
                po_item_no: c.poSr || c.po_item_no || '001',
                ibs_case_no: c.ibsCaseNo || c.caseNo || c.ibs_case_no || '-',
                ibs_call_no: c.ibsCallNo || c.ibs_call_no || '',
                payment_reason: c.paymentReason || saved.payment_reason || 'Cancellation',
                offered_qty: c.offeredQty !== undefined ? c.offeredQty : (c.totalQty || 0),
                charge_type: saved.charge_type || c.chargeType || 'Cancellation',
                bank_account_details: saved.bank_account_details || c.bankAccountDetails || c.bank_account_details || '',
                base_payable_amount: baseAmount,
                gst: gst,
                total_payable_amount: total,
                payment_mode: saved.payment_mode || '',
                transaction_reference_number: saved.transaction_reference_number || '',
                payment_date: saved.payment_date || null,
                payment_proof_filename: saved.payment_proof_filename || '',
                remarks: saved.remarks || c.cancelRemarks || c.remarks || '',
                rejection_reason: c.cancelRemarks || c.rejectionReason || '',
                payment_status: finalPaymentStatus
            };
        });
    }, [cancelledCalls, savedPaymentsMap]);

    // Filtered items based on status, search, and 30-day rule
    const filteredPaymentItems = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return allCombinedPaymentItems.filter(item => {
            const approved = isPaymentApproved(item.payment_status);

            // Status filter
            if (paymentStatusFilter !== 'all') {
                if (paymentStatusFilter === 'Payment Pending' && approved) {
                    return false;
                }
                if (paymentStatusFilter === 'Approved by RITES Finance' && !approved) {
                    return false;
                }
            }

            // Search filter
            if (searchTerm.trim()) {
                const s = searchTerm.toLowerCase();
                const matches = (item.call_no || '').toLowerCase().includes(s) ||
                                (item.po_no || '').toLowerCase().includes(s) ||
                                (item.ibs_case_no || '').toLowerCase().includes(s) ||
                                (item.payment_reason || '').toLowerCase().includes(s);
                if (!matches) return false;
            }

            // 30 Days filter for Approved items
            if (approved && !showOldApproved) {
                const approvedDate = item.approved_date ? new Date(item.approved_date) : new Date(item.call_date);
                if (approvedDate < thirtyDaysAgo) return false;
            }

            return true;
        });
    }, [allCombinedPaymentItems, paymentStatusFilter, searchTerm, showOldApproved]);

    // Reset page to 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [paymentStatusFilter, searchTerm, pageSize]);

    // Pagination calculations
    const totalItems = filteredPaymentItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const paginatedPaymentItems = useMemo(() => {
        const startIdx = (validCurrentPage - 1) * pageSize;
        return filteredPaymentItems.slice(startIdx, startIdx + pageSize);
    }, [filteredPaymentItems, validCurrentPage, pageSize]);

    const handleOpenPaymentModal = (item = null) => {
        setEditingPayment(item);
        setIsPaymentModalOpen(true);
    };

    /**
     * Formats a date string (YYYY-MM-DD or ISO) to DD-MM-YYYY for the IBS API.
     */
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

    /**
     * Called when vendor clicks "Verify Payment".
     * Calls the IBS API via backend proxy and opens the result modal.
     */
    const handleVerifyPayment = async (row) => {
        const caseNo = row.ibs_case_no;
        const ibsCallSno = row.ibs_call_no;
        const callDate = formatForIbs(row.call_date);

        const hasValidCase = Boolean(caseNo && String(caseNo).trim() !== '' && String(caseNo).trim() !== '-');
        const hasValidCallSno = Boolean(ibsCallSno && String(ibsCallSno).trim() !== '' && String(ibsCallSno).trim() !== '-');
        const hasValidDate = Boolean(callDate && String(callDate).trim() !== '' && String(callDate).trim() !== '-');

        if (!hasValidCase || !hasValidCallSno || !hasValidDate) {
            const missing = [];
            if (!hasValidCase) missing.push('IBS Case No.');
            if (!hasValidCallSno) missing.push('IBS Call Sr. No.');
            if (!hasValidDate) missing.push('Call Date');

            setVerifyRowRef(row);
            setIbsResult({
                resultFlag: 'missing',
                isMissingParams: true,
                message: `IBS verification cannot proceed because ${missing.join(', ')} is missing or not yet generated in IBS.`,
                bill_details: [],
                payment_details: [],
                bill_details_error: `Missing parameters: ${missing.join(', ')}`,
                payment_details_error: null
            });
            setVerifyModalOpen(true);
            return;
        }

        setVerifyingCall(row.call_no);
        setVerifyRowRef(row);
        setVerifyModalOpen(false);
        setIbsResult(null);

        try {
            const result = await inspectionCallService.verifyIbsPayment(caseNo, callDate, ibsCallSno, row.call_no);
            setIbsResult(result);
            setVerifyingCall(null);

            const rf = Number(result?.resultFlag ?? 0);
            if (rf === 1 || rf === 2) {
                handlePaymentApproved(row.call_no);
            }

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

    const handlePaymentApproved = async (callNo) => {
        try {
            await inspectionCallService.markPaymentApproved(callNo);
        } catch (err) {
            console.error('Error invoking markPaymentApproved:', err);
        }
        setSavedPaymentsMap(prev => ({
            ...prev,
            [callNo]: {
                ...(prev[callNo] || {}),
                payment_status: 'Approved by RITES Finance'
            }
        }));
        // Re-fetch to sync with backend
        setTimeout(() => fetchPlantCalls(), 600);
    };

    const handleClosePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setEditingPayment(null);
    };

    const handleSubmitPayment = (formData) => {
        if (editingPayment) {
            const callNo = editingPayment.call_no || formData.inspection_call_number;
            if (callNo) {
                setSavedPaymentsMap(prev => ({
                    ...prev,
                    [callNo]: {
                        ...editingPayment,
                        ...formData,
                        call_no: callNo,
                        payment_status: 'Payment Pending for Approval'
                    }
                }));
            }
            if (selectedPaymentCall && selectedPaymentCall.call_no === callNo) {
                setSelectedPaymentCall(prev => ({ ...prev, ...formData, payment_status: 'Payment Pending for Approval' }));
            }
        }
        handleClosePaymentModal();
    };

    const pendingCount = allCombinedPaymentItems.filter(i => !isPaymentApproved(i.payment_status)).length;
    const approvedCount = allCombinedPaymentItems.filter(i => isPaymentApproved(i.payment_status)).length;

    return (
        <div className="payment-module-container fade-in" style={{ padding: '16px 20px' }}>
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
                                gap: '6px',
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
                                gap: '6px',
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
                                <td colSpan={8} style={{ textAlign: 'center', padding: '60px 16px', color: '#64748b' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                        <Loader2 size={36} className="spin-animation" style={{ color: '#2563eb' }} />
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                                            Loading payment records...
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredPaymentItems.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                                    <CreditCard size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                    <div>No payment records found.</div>
                                </td>
                            </tr>
                        ) : (
                            paginatedPaymentItems.map((row) => {
                                const isSelected = selectedPaymentCall?.call_no === row.call_no;
                                const hasIbsCallNo = Boolean(
                                    row.ibs_call_no && 
                                    String(row.ibs_call_no).trim() !== '' && 
                                    String(row.ibs_call_no).trim() !== '-'
                                );

                                return (
                                    <tr key={row.id || row.call_no}>
                                        <td style={{ fontWeight: 800, color: '#1e3a5f' }}>{row.call_no}</td>
                                        <td>{formatDateDDMMYY(row.call_date)}</td>
                                        <td style={{ fontWeight: 600 }}>{row.po_no}</td>
                                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{row.ibs_case_no || '-'}</td>
                                        <td style={{ color: '#64748b', fontWeight: hasIbsCallNo ? 700 : 400 }}>{row.ibs_call_no || '-'}</td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: row.payment_reason === 'Cancellation' ? '#dc2626' : '#2563eb' }}>
                                                {row.payment_reason || 'Cancellation'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 800, color: '#0f172a' }}>
                                            ₹{Number(row.total_payable_amount || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenCancellationDoc(row);
                                                    }}
                                                    title="View Cancellation Letter / Document"
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #cbd5e1',
                                                        background: '#fff',
                                                        color: '#1e293b',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <FileText size={13} style={{ color: '#dc2626' }} /> Letter
                                                </button>

                                                {isPaymentApproved(row.payment_status) ? (
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

            {/* Modern Pagination Footer */}
            {filteredPaymentItems.length > 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: '1px solid #e2e8f0',
                    flexWrap: 'wrap',
                    gap: '12px',
                    background: '#fafbfd',
                    borderBottomLeftRadius: '14px',
                    borderBottomRightRadius: '14px'
                }}>
                    {/* Left: Item Counter & Page Size Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                            Showing <strong style={{ color: '#0f172a' }}>{totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1}</strong> to <strong style={{ color: '#0f172a' }}>{Math.min(validCurrentPage * pageSize, totalItems)}</strong> of <strong style={{ color: '#0f172a' }}>{totalItems}</strong> calls
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Per page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#334155',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    {/* Right: Page Navigation Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                            type="button"
                            disabled={validCurrentPage === 1}
                            onClick={() => setCurrentPage(1)}
                            title="First Page"
                            style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                background: validCurrentPage === 1 ? '#f8fafc' : '#ffffff',
                                color: validCurrentPage === 1 ? '#cbd5e1' : '#475569',
                                cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                            }}
                        >
                            <ChevronsLeft size={14} />
                        </button>

                        <button
                            type="button"
                            disabled={validCurrentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            title="Previous Page"
                            style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                background: validCurrentPage === 1 ? '#f8fafc' : '#ffffff',
                                color: validCurrentPage === 1 ? '#cbd5e1' : '#475569',
                                cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'all 0.15s'
                            }}
                        >
                            <ChevronLeft size={14} />
                            <span>Prev</span>
                        </button>

                        {/* Page Numbers */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                                .filter(p => p === 1 || p === totalPages || (p >= validCurrentPage - 1 && p <= validCurrentPage + 1))
                                .map((page, index, array) => {
                                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                                    return (
                                        <React.Fragment key={page}>
                                            {showEllipsis && (
                                                <span style={{ padding: '0 4px', color: '#94a3b8', fontSize: '12px' }}>...</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                style={{
                                                    minWidth: '28px',
                                                    height: '28px',
                                                    padding: '0 6px',
                                                    borderRadius: '6px',
                                                    border: page === validCurrentPage ? '1px solid #0284c7' : '1px solid #e2e8f0',
                                                    background: page === validCurrentPage ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
                                                    color: page === validCurrentPage ? '#ffffff' : '#334155',
                                                    fontWeight: page === validCurrentPage ? 700 : 500,
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: page === validCurrentPage ? '0 2px 4px rgba(2,132,199,0.25)' : 'none',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {page}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                        </div>

                        <button
                            type="button"
                            disabled={validCurrentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            title="Next Page"
                            style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                background: (validCurrentPage === totalPages || totalPages === 0) ? '#f8fafc' : '#ffffff',
                                color: (validCurrentPage === totalPages || totalPages === 0) ? '#cbd5e1' : '#475569',
                                cursor: (validCurrentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'all 0.15s'
                            }}
                        >
                            <span>Next</span>
                            <ChevronRight size={14} />
                        </button>

                        <button
                            type="button"
                            disabled={validCurrentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(totalPages)}
                            title="Last Page"
                            style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                background: (validCurrentPage === totalPages || totalPages === 0) ? '#f8fafc' : '#ffffff',
                                color: (validCurrentPage === totalPages || totalPages === 0) ? '#cbd5e1' : '#475569',
                                cursor: (validCurrentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                            }}
                        >
                            <ChevronsRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Form Modal */}
            <PaymentFormModal
                isOpen={isPaymentModalOpen}
                onClose={handleClosePaymentModal}
                onSubmit={handleSubmitPayment}
                editData={editingPayment}
                selectedCall={editingPayment}
            />

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
                    backgroundColor: 'rgba(15, 23, 42, 0.68)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, padding: '20px',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        maxWidth: '540px',
                        width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.06)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px 24px 18px',
                            borderBottom: '1px solid #e0f2fe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                                    color: '#ffffff',
                                    flexShrink: 0
                                }}>
                                    <CreditCard size={22} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                                        Payment Information
                                    </h3>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#0369a1', fontWeight: 600 }}>
                                        Review billing details before IBS redirection
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPaymentRedirectCall(null)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: '1px solid rgba(186, 230, 253, 0.8)',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '22px 24px 18px', fontSize: '13.5px', color: '#334155' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '16px',
                                padding: '8px 12px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #f1f5f9',
                                color: '#475569',
                                fontSize: '12.5px',
                                fontWeight: 500
                            }}>
                                <Info size={15} style={{ color: '#0284c7', flexShrink: 0 }} />
                                <span>You will be redirected to the RITES online portal. Please use these details:</span>
                            </div>

                            {/* Details Card */}
                            <div style={{
                                background: 'linear-gradient(180deg, #fafbfd 0%, #f4f6fa 100%)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '16px',
                                padding: '16px 18px',
                                marginBottom: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                            }}>
                                {/* IBS Case No */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '13px' }}>IBS Case No.</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontWeight: 800,
                                            fontSize: '14px',
                                            color: '#0f172a',
                                            background: '#ffffff',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1'
                                        }}>
                                            {paymentRedirectCall.ibs_case_no || paymentRedirectCall.ibsCaseNo || paymentRedirectCall.case_no || '-'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyText(paymentRedirectCall.ibs_case_no || paymentRedirectCall.ibsCaseNo || paymentRedirectCall.case_no, 'case_no')}
                                            title="Copy Case No."
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0',
                                                background: '#ffffff',
                                                color: copiedField === 'case_no' ? '#16a34a' : '#64748b',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px'
                                            }}
                                        >
                                            {copiedField === 'case_no' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                        </button>
                                    </div>
                                </div>

                                {/* IBS Call Sr No */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '13px' }}>IBS Call Sr. No.</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontWeight: 800,
                                            fontSize: '14px',
                                            color: '#0f172a',
                                            background: '#ffffff',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1'
                                        }}>
                                            {paymentRedirectCall.ibs_call_no || paymentRedirectCall.ibsCallNo || paymentRedirectCall.ibs_call_sr_no || '-'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyText(paymentRedirectCall.ibs_call_no || paymentRedirectCall.ibsCallNo || paymentRedirectCall.ibs_call_sr_no, 'call_no')}
                                            title="Copy Call Sr. No."
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0',
                                                background: '#ffffff',
                                                color: copiedField === 'call_no' ? '#16a34a' : '#64748b',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px'
                                            }}
                                        >
                                            {copiedField === 'call_no' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                                        </button>
                                    </div>
                                </div>

                                {/* Call Date */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '13px' }}>Call Date</span>
                                    <span style={{
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        color: '#0f172a',
                                        background: '#ffffff',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        {formatDateDDMMYY(paymentRedirectCall.call_date || paymentRedirectCall.callDate)}
                                    </span>
                                </div>

                                {/* Cancellation Document */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '13px' }}>Cancellation Letter</span>
                                    <button
                                        onClick={() => handleOpenCancellationDoc(paymentRedirectCall)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '5px 12px',
                                            borderRadius: '6px',
                                            background: '#fff',
                                            border: '1px solid #fca5a5',
                                            color: '#dc2626',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(220, 38, 38, 0.05)',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <FileText size={13} /> View Document
                                    </button>
                                </div>

                                {/* Highlight Charges Box */}
                                <div style={{
                                    marginTop: '4px',
                                    background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                                    border: '1px solid #fecdd3',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Cancellation / Rejection Charges
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#be123c', fontWeight: 500, marginTop: '1px' }}>
                                            Total Payable Amount
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: 900,
                                        color: '#be123c',
                                        letterSpacing: '-0.02em'
                                    }}>
                                        ₹{Number(paymentRedirectCall.total_payable_amount || paymentRedirectCall.totalPayableAmount || paymentRedirectCall.charges || 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>

                            {/* Email Receipt Guidance */}
                            <div style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                marginBottom: '6px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px'
                            }}>
                                <Mail size={16} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                                <div style={{ fontSize: '12.5px', color: '#166534', lineHeight: 1.45 }}>
                                    After payment completion, please email your transaction receipt to{' '}
                                    <strong style={{ fontWeight: 800, color: '#15803d', wordBreak: 'break-all' }}>
                                        {getRioEmail(paymentRedirectCall)}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '16px 24px 20px',
                            background: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <button
                                onClick={() => setPaymentRedirectCall(null)}
                                style={{
                                    padding: '9px 18px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#475569',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    window.open('https://ritesinsp.com/ibs2/OnlinePaymentGateway', '_blank');
                                    setPaymentRedirectCall(null);
                                }}
                                style={{
                                    padding: '9px 22px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                    color: '#ffffff',
                                    fontWeight: 800,
                                    fontSize: '13.5px',
                                    cursor: 'pointer',
                                    boxShadow: '0 3px 10px rgba(22, 163, 74, 0.35)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <span>Proceed to Payment</span>
                                <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancellation Document Viewer Modal */}
            {viewingDocCall && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10000, padding: '16px'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        maxWidth: '900px',
                        width: '100%',
                        height: '88vh',
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileText size={22} style={{ color: '#dc2626' }} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                        Cancellation Document
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                                        Call No: {viewingDocCall.call_no || viewingDocCall.callNo} | {docFileName}
                                    </div>
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
                                                color: '#1d4ed8',
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
