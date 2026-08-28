import React, { useState, useEffect, useMemo } from 'react';
import './PaymentDetails.css';
import PaymentFormModal from './PaymentFormModal';
import inspectionCallService from '../../../services/inspectionCallService';
import { formatDateDDMMYY } from '../../../utils/dateUtils';
import { 
    Search, CreditCard, Clock, CheckCircle2, AlertCircle, 
    XCircle, FileText, ChevronRight, Eye, RefreshCw, Filter, ArrowUpRight, Loader2 
} from 'lucide-react';

const PaymentDetailsDashboard = ({ plantId, vendorCode, vendorName }) => {
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

    // Modal state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [paymentRedirectCall, setPaymentRedirectCall] = useState(null);

    const getRioEmail = (call) => {
        if (call?.rio_email) return call.rio_email;
        if (call?.rioEmail) return call.rioEmail;
        const rioStr = (call?.rio || call?.plant_id || plantId || '').toUpperCase();
        if (rioStr.includes('EAST') || rioStr.includes('KOLKATA') || rioStr.includes('ER') || rioStr.includes('SER') || rioStr.includes('ECR')) return 'sbu.einsp@rites.com';
        if (rioStr.includes('WEST') || rioStr.includes('MUMBAI') || rioStr.includes('WR') || rioStr.includes('CR')) return 'sbu.winsp@rites.com';
        if (rioStr.includes('SOUTH') || rioStr.includes('CHENNAI') || rioStr.includes('SR') || rioStr.includes('SCR') || rioStr.includes('SWR')) return 'sbu.sinsp@rites.com';
        if (rioStr.includes('CENT') || rioStr.includes('BHILAI') || rioStr.includes('RAIPUR') || rioStr.includes('SECR') || rioStr.includes('WCR')) return 'sbu.cinsp@rites.com';
        return 'sbu.ninsp@rites.com';
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

    // Combine only verified cancelled calls from workflow transactions with user-entered payments
    const allCombinedPaymentItems = useMemo(() => {
        return cancelledCalls.map(c => {
            const callNo = c.callNo || c.call_no;
            const saved = savedPaymentsMap[callNo] || {};
            const isPaymentBlocked = String(c.status || '').toLowerCase().includes('payment');

            const baseAmount = saved.base_payable_amount !== undefined ? saved.base_payable_amount : (c.basePayableAmount !== undefined ? c.basePayableAmount : (c.base_payable_amount || 0));
            const gst = saved.gst !== undefined ? saved.gst : (c.gst !== undefined ? c.gst : Math.round((baseAmount * 18) / 100));
            const total = saved.total_payable_amount !== undefined ? saved.total_payable_amount : (c.totalPayableAmount !== undefined ? c.totalPayableAmount : (c.total_payable_amount || (baseAmount + gst)));

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
                payment_status: saved.payment_status || c.paymentStatus || (isPaymentBlocked ? 'Payment Pending' : 'Payment Pending')
            };
        });
    }, [cancelledCalls, savedPaymentsMap]);

    // Filtered items based on status, search, and 30-day rule
    const filteredPaymentItems = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return allCombinedPaymentItems.filter(item => {
            // Status filter
            if (paymentStatusFilter !== 'all') {
                if (paymentStatusFilter === 'Payment Pending' && item.payment_status !== 'Payment Pending' && item.payment_status !== 'Payment Pending for Approval' && item.payment_status !== 'Not Approved by RITES Finance') {
                    return false;
                }
                if (paymentStatusFilter === 'Approved by RITES Finance' && item.payment_status !== 'Approved by RITES Finance') {
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
            if (item.payment_status === 'Approved by RITES Finance' && !showOldApproved) {
                const approvedDate = item.approved_date ? new Date(item.approved_date) : new Date(item.call_date);
                if (approvedDate < thirtyDaysAgo) return false;
            }

            return true;
        });
    }, [allCombinedPaymentItems, paymentStatusFilter, searchTerm, showOldApproved]);

    const handleOpenPaymentModal = (item = null) => {
        setEditingPayment(item);
        setIsPaymentModalOpen(true);
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

    const pendingCount = allCombinedPaymentItems.filter(i => 
        i.payment_status === 'Payment Pending' || 
        i.payment_status === 'Payment Pending for Approval' || 
        i.payment_status === 'Not Approved by RITES Finance'
    ).length;

    const approvedCount = allCombinedPaymentItems.filter(i => 
        i.payment_status === 'Approved by RITES Finance'
    ).length;

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
                            <th style={{ textAlign: 'right' }}>Action</th>
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
                            filteredPaymentItems.map((row) => {
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
                                            <span style={{ fontWeight: 600, color: row.payment_reason === 'Cancellation' ? '#dc2626' : '#2563eb' }}>
                                                {row.payment_reason || 'Cancellation'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 800, color: '#0f172a' }}>
                                            ₹{Number(row.total_payable_amount || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
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
                                                    }}
                                                    style={{
                                                        padding: '6px 14px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #0284c7',
                                                        background: '#e0f2fe',
                                                        color: '#0369a1',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Verify Payment
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment Form Modal */}
            <PaymentFormModal
                isOpen={isPaymentModalOpen}
                onClose={handleClosePaymentModal}
                onSubmit={handleSubmitPayment}
                editData={editingPayment}
                selectedCall={editingPayment}
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>• IBS Case No.:</span>
                                    <span style={{ fontWeight: 800, color: '#0f172a' }}>
                                        {paymentRedirectCall.ibs_case_no || paymentRedirectCall.ibsCaseNo || paymentRedirectCall.case_no || '-'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>• IBS Call Sr. No.:</span>
                                    <span style={{ fontWeight: 800, color: '#0f172a' }}>
                                        {paymentRedirectCall.ibs_call_no || paymentRedirectCall.ibsCallNo || paymentRedirectCall.ibs_call_sr_no || '-'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>• Call Date:</span>
                                    <span style={{ fontWeight: 800, color: '#0f172a' }}>
                                        {formatDateDDMMYY(paymentRedirectCall.call_date || paymentRedirectCall.callDate)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                                    <span style={{ color: '#b91c1c', fontWeight: 700 }}>• Cancellation/Rejection Charges:</span>
                                    <span style={{ fontWeight: 900, color: '#dc2626', fontSize: '15px' }}>
                                        ₹{Number(paymentRedirectCall.total_payable_amount || paymentRedirectCall.totalPayableAmount || paymentRedirectCall.charges || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <p style={{ marginBottom: '14px', color: '#475569', fontSize: '13.5px' }}>
                                Please enter these details on the payment page to complete the payment.
                            </p>

                            <div style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                marginBottom: '18px',
                                color: '#1e40af',
                                fontSize: '13px',
                                lineHeight: 1.5
                            }}>
                                After successful payment, please email the payment receipt to{' '}
                                <strong style={{ fontWeight: 800, textDecoration: 'underline' }}>
                                    {paymentRedirectCall.rio_email || paymentRedirectCall.rioEmail || getRioEmail(paymentRedirectCall)}
                                </strong>.
                            </div>

                            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: '13.5px' }}>
                                Click “OK” to proceed to the payment page.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '16px 24px',
                            background: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button
                                onClick={() => setPaymentRedirectCall(null)}
                                style={{
                                    padding: '9px 18px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #cbd5e1',
                                    background: '#fff',
                                    color: '#475569',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer'
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
                                    padding: '9px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#16a34a',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentDetailsDashboard;
