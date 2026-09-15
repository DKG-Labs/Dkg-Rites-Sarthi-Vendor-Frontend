import React, { useState } from 'react';
import {
    CheckCircle2, AlertTriangle, XCircle, Loader2,
    FileText, ExternalLink, CreditCard, ChevronRight,
    Info, BadgeCheck, Clock
} from 'lucide-react';
import inspectionCallService from '../../../services/inspectionCallService';

/**
 * VerifyPaymentModal
 * Ultra-modern, aesthetic dialog showing IBS payment verification status
 */
const VerifyPaymentModal = ({ isOpen, onClose, ibsResult, callRow, onApproved }) => {
    const [approving, setApproving] = useState(false);
    const [approveError, setApproveError] = useState(null);
    const [approved, setApproved] = useState(false);

    React.useEffect(() => {
        if (ibsResult && callRow?.call_no) {
            const rf = Number(ibsResult.resultFlag ?? 0);
            if (rf === 1 || rf === 2) {
                inspectionCallService.markPaymentApproved(callRow.call_no)
                    .then(() => {
                        setApproved(true);
                        if (onApproved) onApproved(callRow.call_no);
                    })
                    .catch((err) => {
                        console.warn('Auto-mark payment approved failed:', err);
                        setApproved(true);
                        if (onApproved) onApproved(callRow.call_no);
                    });
            } else {
                setApproved(false);
            }
        }
    }, [ibsResult, callRow?.call_no, onApproved]);

    if (!isOpen || !ibsResult) return null;

    const resultFlag = ibsResult.resultFlag;
    const isMissingParams = resultFlag === 'missing' || ibsResult.isMissingParams;
    const billDetails = Array.isArray(ibsResult.bill_details) ? ibsResult.bill_details[0] : null;
    const paymentDetails = Array.isArray(ibsResult.payment_details) && ibsResult.payment_details.length > 0
        ? ibsResult.payment_details[0] : null;
    const billError = ibsResult.bill_details_error || null;
    const paymentError = ibsResult.payment_details_error || null;

    const canApprove = (Number(resultFlag) === 1 || Number(resultFlag) === 2) && !approved;

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d)) return dateStr;
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch { return dateStr; }
    };

    const formatAmount = (amt) => {
        if (amt == null) return '-';
        return `₹${Number(amt).toLocaleString('en-IN')}`;
    };

    const handleMarkApproved = async () => {
        if (!callRow?.call_no) return;
        setApproving(true);
        setApproveError(null);
        try {
            await inspectionCallService.markPaymentApproved(callRow.call_no);
            setApproved(true);
            if (onApproved) onApproved(callRow.call_no);
        } catch (err) {
            setApproveError('Failed to mark payment approved. Please try again.');
        } finally {
            setApproving(false);
        }
    };

    const scenarios = {
        1: {
            icon: <BadgeCheck size={24} style={{ color: '#16a34a' }} />,
            title: 'Payment Verified Successfully',
            subtitle: 'Both bill and payment confirmed by IBS',
            headerBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            headerBorder: '#bbf7d0',
            titleColor: '#15803d',
            subtitleColor: '#166534',
            iconBg: '#ffffff',
            iconShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
            badge: { bg: '#bbf7d0', color: '#14532d', text: '✓ FULLY VERIFIED' }
        },
        2: {
            icon: <CheckCircle2 size={24} style={{ color: '#0284c7' }} />,
            title: 'Bill Confirmed — Payment Cleared',
            subtitle: 'RITES bill is finalized and digitally signed',
            headerBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            headerBorder: '#bfdbfe',
            titleColor: '#0369a1',
            subtitleColor: '#1e40af',
            iconBg: '#ffffff',
            iconShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
            badge: { bg: '#bfdbfe', color: '#1e3a8a', text: '✓ BILL VERIFIED' }
        },
        3: {
            icon: <AlertTriangle size={24} style={{ color: '#d97706' }} />,
            title: 'Payment Received — Bill Pending',
            subtitle: 'Payment captured, IBS bill not yet finalized',
            headerBg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            headerBorder: '#fde68a',
            titleColor: '#b45309',
            subtitleColor: '#92400e',
            iconBg: '#ffffff',
            iconShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
            badge: { bg: '#fde68a', color: '#78350f', text: '⚠ BILL PENDING' }
        },
        0: {
            icon: <XCircle size={24} style={{ color: '#dc2626' }} />,
            title: 'Verification Not Found',
            subtitle: 'IBS could not locate bill or payment for this call',
            headerBg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            headerBorder: '#fecaca',
            titleColor: '#b91c1c',
            subtitleColor: '#991b1b',
            iconBg: '#ffffff',
            iconShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
            badge: { bg: '#fecaca', color: '#7f1d1d', text: '✗ NOT VERIFIED' }
        },
        missing: {
            icon: <AlertTriangle size={24} style={{ color: '#d97706' }} />,
            title: 'Verification Details Pending',
            subtitle: 'Required IBS parameters are not yet synchronized',
            headerBg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            headerBorder: '#fde68a',
            titleColor: '#92400e',
            subtitleColor: '#a16207',
            iconBg: '#ffffff',
            iconShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
            badge: { bg: '#fde68a', color: '#78350f', text: '⚠ DETAILS REQUIRED' }
        }
    };

    const sc = isMissingParams ? scenarios.missing : (scenarios[resultFlag] || scenarios[0]);

    const hasCaseNo = Boolean(callRow?.ibs_case_no && String(callRow.ibs_case_no).trim() !== '' && String(callRow.ibs_case_no).trim() !== '-');
    const hasCallSno = Boolean(callRow?.ibs_call_no && String(callRow.ibs_call_no).trim() !== '' && String(callRow.ibs_call_no).trim() !== '-');
    const hasCallDate = Boolean(callRow?.call_date && String(callRow.call_date).trim() !== '' && String(callRow.call_date).trim() !== '-');

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10001, padding: '20px'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '22px',
                maxWidth: '520px',
                width: '100%',
                boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(15, 23, 42, 0.06)',
                overflow: 'hidden',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Modern Header Banner */}
                <div style={{
                    padding: '18px 22px',
                    background: sc.headerBg,
                    borderBottom: `1px solid ${sc.headerBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            background: sc.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: sc.iconShadow,
                            flexShrink: 0
                        }}>
                            {sc.icon}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: sc.titleColor, letterSpacing: '-0.01em' }}>
                                    {sc.title}
                                </h3>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    background: sc.badge.bg,
                                    color: sc.badge.color,
                                    letterSpacing: '0.04em'
                                }}>
                                    {sc.badge.text}
                                </span>
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: '12px', color: sc.subtitleColor, fontWeight: 500 }}>
                                {sc.subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        title="Close"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '1px solid rgba(0,0,0,0.06)',
                            background: 'rgba(255,255,255,0.75)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            fontSize: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            flexShrink: 0
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>

                    {/* Scenario: Missing / Pending Parameters */}
                    {isMissingParams ? (
                        <div>
                            {/* Summary description */}
                            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
                                IBS requires all three parameters below to locate and verify digital billing and payment records for this call.
                            </p>

                            {/* Parameter Cards Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '10px',
                                marginBottom: '16px'
                            }}>
                                {/* Call Number */}
                                <div style={{
                                    background: '#f8fafc',
                                    borderRadius: '12px',
                                    padding: '12px 14px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Call No.
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                                        {callRow?.call_no || '-'}
                                    </div>
                                    <div style={{ marginTop: '6px' }}>
                                        <span style={{
                                            fontSize: '10.5px', fontWeight: 700, padding: '2px 7px',
                                            borderRadius: '6px', background: '#e0e7ff', color: '#3730a3'
                                        }}>
                                            Inspection Call
                                        </span>
                                    </div>
                                </div>

                                {/* Call Date */}
                                <div style={{
                                    background: hasCallDate ? '#f8fafc' : '#fff1f2',
                                    borderRadius: '12px',
                                    padding: '12px 14px',
                                    border: hasCallDate ? '1px solid #e2e8f0' : '1px solid #fecdd3'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Call Date
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                                        {formatDateDisplay(callRow?.call_date)}
                                    </div>
                                    <div style={{ marginTop: '6px' }}>
                                        <span style={{
                                            fontSize: '10.5px', fontWeight: 700, padding: '2px 7px',
                                            borderRadius: '6px',
                                            background: hasCallDate ? '#dcfce7' : '#fee2e2',
                                            color: hasCallDate ? '#166534' : '#991b1b'
                                        }}>
                                            {hasCallDate ? '✓ Date Available' : '✗ Missing'}
                                        </span>
                                    </div>
                                </div>

                                {/* IBS Case No */}
                                <div style={{
                                    background: hasCaseNo ? '#f8fafc' : '#fff1f2',
                                    borderRadius: '12px',
                                    padding: '12px 14px',
                                    border: hasCaseNo ? '1px solid #e2e8f0' : '1px solid #fecdd3'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                        IBS Case No.
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: hasCaseNo ? '#0f172a' : '#94a3b8', marginTop: '2px' }}>
                                        {hasCaseNo ? callRow.ibs_case_no : 'Not Available'}
                                    </div>
                                    <div style={{ marginTop: '6px' }}>
                                        <span style={{
                                            fontSize: '10.5px', fontWeight: 700, padding: '2px 7px',
                                            borderRadius: '6px',
                                            background: hasCaseNo ? '#dcfce7' : '#fee2e2',
                                            color: hasCaseNo ? '#166534' : '#991b1b'
                                        }}>
                                            {hasCaseNo ? '✓ Case Linked' : '✗ Missing'}
                                        </span>
                                    </div>
                                </div>

                                {/* IBS Call Sr No */}
                                <div style={{
                                    background: hasCallSno ? '#f0fdf4' : '#fffbeb',
                                    borderRadius: '12px',
                                    padding: '12px 14px',
                                    border: hasCallSno ? '1px solid #bbf7d0' : '1px solid #fde68a'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                        IBS Call Sr. No.
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: hasCallSno ? '#15803d' : '#b45309', marginTop: '2px' }}>
                                        {hasCallSno ? callRow.ibs_call_no : 'Pending Sync'}
                                    </div>
                                    <div style={{ marginTop: '6px' }}>
                                        <span style={{
                                            fontSize: '10.5px', fontWeight: 700, padding: '2px 7px',
                                            borderRadius: '6px',
                                            background: hasCallSno ? '#dcfce7' : '#fef3c7',
                                            color: hasCallSno ? '#166534' : '#92400e',
                                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            {hasCallSno ? '✓ Assigned' : <><Clock size={11} /> Awaiting IBS</>}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Informational Workflow Note */}
                            <div style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px'
                            }}>
                                <Info size={16} style={{ color: '#0284c7', marginTop: '1px', flexShrink: 0 }} />
                                <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                                    <strong>Why is IBS Call Sr. No. pending?</strong> The RITES IBS server generates this number after processing the cancellation or inspection event. Once synced, click <strong>Verify Payment</strong> to check status.
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Normal Verification Results */
                        <div>
                            {/* Call Reference Strip */}
                            <div style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '10px 14px',
                                marginBottom: '14px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '10px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>CALL NO</div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{callRow?.call_no || '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>IBS CASE NO</div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{callRow?.ibs_case_no || '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>IBS CALL SR</div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{callRow?.ibs_call_no || '-'}</div>
                                </div>
                            </div>

                            {/* Bill Details */}
                            {billDetails && (
                                <div style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '14px',
                                    padding: '14px 16px',
                                    marginBottom: '14px'
                                }}>
                                    <div style={{
                                        fontSize: '11px', fontWeight: 800, color: '#15803d',
                                        textTransform: 'uppercase', letterSpacing: '0.06em',
                                        marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px'
                                    }}>
                                        <FileText size={13} /> Bill Details
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {[
                                            ['Bill No', billDetails.bill_no],
                                            ['Invoice No', billDetails.invoice_no],
                                            ['Invoice Date', formatDateDisplay(billDetails.invoice_date)],
                                            ['Book / Set', `${billDetails.bk_no || '-'} / ${billDetails.set_no || '-'}`]
                                        ].map(([label, val]) => (
                                            <div key={label}>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{val || '-'}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {(billDetails.invoice_pdf || billDetails.invoice_supp_docs) && (
                                        <div style={{
                                            marginTop: '12px', paddingTop: '10px',
                                            borderTop: '1px dashed #bbf7d0',
                                            display: 'flex', gap: '8px', flexWrap: 'wrap'
                                        }}>
                                            {billDetails.invoice_pdf && (
                                                <a href={billDetails.invoice_pdf} target="_blank" rel="noreferrer" style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    padding: '5px 12px', borderRadius: '6px',
                                                    background: '#fff', border: '1px solid #86efac',
                                                    color: '#15803d', fontSize: '12px', fontWeight: 700, textDecoration: 'none'
                                                }}>
                                                    <ExternalLink size={12} /> Invoice PDF
                                                </a>
                                            )}
                                            {billDetails.invoice_supp_docs && (
                                                <a href={billDetails.invoice_supp_docs} target="_blank" rel="noreferrer" style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    padding: '5px 12px', borderRadius: '6px',
                                                    background: '#fff', border: '1px solid #86efac',
                                                    color: '#15803d', fontSize: '12px', fontWeight: 700, textDecoration: 'none'
                                                }}>
                                                    <ExternalLink size={12} /> Supporting Docs
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payment Record */}
                            {paymentDetails && (
                                <div style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '14px',
                                    padding: '14px 16px',
                                    marginBottom: '14px'
                                }}>
                                    <div style={{
                                        fontSize: '11px', fontWeight: 800, color: '#1d4ed8',
                                        textTransform: 'uppercase', letterSpacing: '0.06em',
                                        marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px'
                                    }}>
                                        <CreditCard size={13} /> Payment Record
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {[
                                            ['Amount', formatAmount(paymentDetails.amount)],
                                            ['Transaction ID', paymentDetails.mer_txn_id],
                                            ['Description', paymentDetails.description],
                                            ['Completed On', formatDateDisplay(paymentDetails.txn_complete_date)]
                                        ].map(([label, val]) => (
                                            <div key={label}>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>
                                                    {val || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Result flag 2 explanation */}
                            {Number(resultFlag) === 2 && !paymentDetails && (
                                <div style={{
                                    background: '#fffbeb', border: '1px solid #fde68a',
                                    borderRadius: '12px', padding: '12px 14px',
                                    marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start'
                                }}>
                                    <Info size={15} style={{ color: '#d97706', marginTop: '1px', flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '12.5px', color: '#92400e', fontWeight: 500, lineHeight: 1.5 }}>
                                        No online payment record found in IBS. The bill is finalized and digitally signed, indicating payment was cleared offline.
                                    </p>
                                </div>
                            )}

                            {/* Result flag 3 explanation */}
                            {Number(resultFlag) === 3 && (
                                <div style={{
                                    background: '#fffbeb', border: '1px solid #fde68a',
                                    borderRadius: '12px', padding: '12px 14px',
                                    marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start'
                                }}>
                                    <AlertTriangle size={15} style={{ color: '#d97706', marginTop: '1px', flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '12.5px', color: '#92400e', fontWeight: 500, lineHeight: 1.5 }}>
                                        Your payment was captured in the gateway, but RITES has not yet generated the IBS bill for this call.
                                    </p>
                                </div>
                            )}

                            {/* Error Details */}
                            {(billError || paymentError) && (
                                <div style={{
                                    background: '#fef2f2', border: '1px solid #fecaca',
                                    borderRadius: '12px', padding: '12px 14px', marginBottom: '14px'
                                }}>
                                    <div style={{
                                        fontSize: '11px', fontWeight: 800, color: '#b91c1c',
                                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px'
                                    }}>
                                        IBS Error Details
                                    </div>
                                    {billError && <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#7f1d1d', fontWeight: 500 }}>
                                        <strong>Bill:</strong> {billError}
                                    </p>}
                                    {paymentError && <p style={{ margin: 0, fontSize: '12px', color: '#7f1d1d', fontWeight: 500 }}>
                                        <strong>Payment:</strong> {paymentError}
                                    </p>}
                                </div>
                            )}

                            {/* Approve Error Message */}
                            {approveError && (
                                <div style={{
                                    background: '#fef2f2', border: '1px solid #fecaca',
                                    borderRadius: '10px', padding: '10px 14px',
                                    marginBottom: '12px', fontSize: '12.5px', color: '#b91c1c', fontWeight: 600
                                }}>
                                    {approveError}
                                </div>
                            )}

                            {/* Approved Success Message */}
                            {approved && (
                                <div style={{
                                    background: '#f0fdf4', border: '1px solid #86efac',
                                    borderRadius: '12px', padding: '14px 16px',
                                    display: 'flex', alignItems: 'center', gap: '12px'
                                }}>
                                    <CheckCircle2 size={22} style={{ color: '#16a34a', flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d' }}>
                                            Payment Approved!
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                                            Inspection call raising is now unblocked.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div style={{
                    padding: '14px 22px',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '9px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isMissingParams || approved || !canApprove ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#e2e8f0',
                            color: isMissingParams || approved || !canApprove ? '#ffffff' : '#475569',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: isMissingParams || approved || !canApprove ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
                            transition: 'all 0.15s'
                        }}
                    >
                        {isMissingParams ? 'Understood' : (approved ? 'Done' : 'Close')}
                    </button>

                    {canApprove && (
                        <button
                            onClick={handleMarkApproved}
                            disabled={approving}
                            style={{
                                padding: '9px 22px',
                                borderRadius: '10px',
                                border: 'none',
                                background: approving ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: approving ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '7px',
                                boxShadow: approving ? 'none' : '0 4px 14px rgba(22,163,74,0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {approving ? (
                                <><Loader2 size={14} className="spin-animation" /> Approving...</>
                            ) : (
                                <>Mark as Approved <ChevronRight size={14} /></>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyPaymentModal;
