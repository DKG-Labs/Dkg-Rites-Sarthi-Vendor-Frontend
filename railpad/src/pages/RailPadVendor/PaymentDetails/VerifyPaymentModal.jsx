import React, { useState } from 'react';
import {
    CheckCircle2, AlertTriangle, XCircle, Loader2,
    FileText, ExternalLink, CreditCard, ChevronRight,
    Info, BadgeCheck
} from 'lucide-react';
import inspectionCallService from '../../../services/inspectionCallService';

/**
 * VerifyPaymentModal
 * Shows IBS payment verification results based on resultFlag:
 *   1 → Both bill + payment found  → Allow Mark Approved
 *   2 → Bill found, no payment     → Allow Mark Approved (bill finalized = payment cleared)
 *   3 → Payment found, bill pending→ Info only, no approval
 *   0 → Both failed                → Error, contact RITES Finance
 */
const VerifyPaymentModal = ({ isOpen, onClose, ibsResult, callRow, onApproved }) => {
    const [approving, setApproving] = useState(false);
    const [approveError, setApproveError] = useState(null);
    const [approved, setApproved] = useState(false);

    if (!isOpen || !ibsResult) return null;

    const resultFlag = Number(ibsResult.resultFlag ?? 0);
    const billDetails = Array.isArray(ibsResult.bill_details) ? ibsResult.bill_details[0] : null;
    const paymentDetails = Array.isArray(ibsResult.payment_details) && ibsResult.payment_details.length > 0
        ? ibsResult.payment_details[0] : null;
    const billError = ibsResult.bill_details_error || null;
    const paymentError = ibsResult.payment_details_error || null;

    const canApprove = (resultFlag === 1 || resultFlag === 2) && !approved;

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
        return `\u20b9${Number(amt).toLocaleString('en-IN')}`;
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
            icon: <BadgeCheck size={28} style={{ color: '#16a34a' }} />,
            title: 'Payment Verified Successfully',
            subtitle: 'Both bill and payment confirmed by IBS',
            headerBg: '#f0fdf4', headerBorder: '#bbf7d0', titleColor: '#15803d',
            badge: { bg: '#dcfce7', color: '#15803d', text: '\u2713 FULLY VERIFIED' }
        },
        2: {
            icon: <CheckCircle2 size={28} style={{ color: '#0284c7' }} />,
            title: 'Bill Confirmed \u2014 Payment Cleared',
            subtitle: 'RITES bill is finalized and digitally signed',
            headerBg: '#eff6ff', headerBorder: '#bfdbfe', titleColor: '#0369a1',
            badge: { bg: '#dbeafe', color: '#1d4ed8', text: '\u2713 BILL VERIFIED' }
        },
        3: {
            icon: <AlertTriangle size={28} style={{ color: '#d97706' }} />,
            title: 'Payment Received \u2014 Bill Pending',
            subtitle: 'Razorpay payment captured, IBS bill not yet available',
            headerBg: '#fffbeb', headerBorder: '#fde68a', titleColor: '#b45309',
            badge: { bg: '#fef3c7', color: '#92400e', text: '\u26a0 BILL PENDING' }
        },
        0: {
            icon: <XCircle size={28} style={{ color: '#dc2626' }} />,
            title: 'Verification Failed',
            subtitle: 'IBS could not confirm bill or payment',
            headerBg: '#fef2f2', headerBorder: '#fecaca', titleColor: '#b91c1c',
            badge: { bg: '#fee2e2', color: '#991b1b', text: '\u2717 NOT VERIFIED' }
        }
    };

    const sc = scenarios[resultFlag] || scenarios[0];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10001, padding: '20px'
        }}>
            <div style={{
                background: '#fff', borderRadius: '18px',
                maxWidth: '560px', width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                overflow: 'hidden', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px 18px', background: sc.headerBg,
                    borderBottom: `1px solid ${sc.headerBorder}`,
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)', flexShrink: 0
                        }}>
                            {sc.icon}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: sc.titleColor }}>
                                    {sc.title}
                                </h3>
                                <span style={{
                                    padding: '2px 8px', borderRadius: '20px', fontSize: '10px',
                                    fontWeight: 800, background: sc.badge.bg, color: sc.badge.color,
                                    letterSpacing: '0.04em'
                                }}>{sc.badge.text}</span>
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                                {sc.subtitle}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        border: 'none', background: 'transparent', fontSize: '18px',
                        color: '#94a3b8', cursor: 'pointer', fontWeight: 700,
                        padding: '4px', flexShrink: 0, borderRadius: '6px', lineHeight: 1
                    }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

                    {/* Call reference */}
                    <div style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '10px 14px',
                        marginBottom: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap'
                    }}>
                        {[
                            ['CALL NO', callRow?.call_no],
                            ['IBS CASE NO', callRow?.ibs_case_no],
                            ['IBS CALL SR', callRow?.ibs_call_no]
                        ].map(([label, value]) => (
                            <div key={label}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{value || '-'}</div>
                            </div>
                        ))}
                    </div>

                    {/* Bill Details (resultFlag 1 or 2) */}
                    {billDetails && (
                        <div style={{
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: '12px', padding: '14px 16px', marginBottom: '14px'
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

                    {/* Payment Record (resultFlag 1 or 3) */}
                    {paymentDetails && (
                        <div style={{
                            background: '#eff6ff', border: '1px solid #bfdbfe',
                            borderRadius: '12px', padding: '14px 16px', marginBottom: '14px'
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

                    {/* resultFlag 2 — no payment record, explain */}
                    {resultFlag === 2 && !paymentDetails && (
                        <div style={{
                            background: '#fffbeb', border: '1px solid #fde68a',
                            borderRadius: '10px', padding: '12px 14px',
                            marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start'
                        }}>
                            <Info size={15} style={{ color: '#d97706', marginTop: '1px', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '12.5px', color: '#92400e', fontWeight: 500, lineHeight: 1.5 }}>
                                No online payment record found in IBS. The bill is finalized and digitally signed,
                                indicating payment was likely made offline (challan/DD).
                            </p>
                        </div>
                    )}

                    {/* resultFlag 3 — guidance */}
                    {resultFlag === 3 && (
                        <div style={{
                            background: '#fffbeb', border: '1px solid #fde68a',
                            borderRadius: '10px', padding: '12px 14px',
                            marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start'
                        }}>
                            <AlertTriangle size={15} style={{ color: '#d97706', marginTop: '1px', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '12.5px', color: '#92400e', fontWeight: 500, lineHeight: 1.5 }}>
                                Your payment was captured in the payment gateway, but RITES has not yet generated
                                the IBS bill for this call. Please check again after some time, or contact RITES Finance.
                            </p>
                        </div>
                    )}

                    {/* Error details */}
                    {(billError || paymentError) && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '10px', padding: '12px 14px', marginBottom: '14px'
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

                    {/* resultFlag 0 — guidance */}
                    {resultFlag === 0 && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '10px', padding: '12px 14px',
                            marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start'
                        }}>
                            <XCircle size={15} style={{ color: '#dc2626', marginTop: '1px', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '12.5px', color: '#7f1d1d', fontWeight: 500, lineHeight: 1.5 }}>
                                IBS could not confirm this payment. Please contact RITES Finance with your payment
                                receipt and IBS Case No. to resolve this.
                            </p>
                        </div>
                    )}

                    {/* Approve error */}
                    {approveError && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '8px', padding: '10px 14px',
                            marginBottom: '12px', fontSize: '13px', color: '#b91c1c', fontWeight: 600
                        }}>
                            {approveError}
                        </div>
                    )}

                    {/* Approved success state */}
                    {approved && (
                        <div style={{
                            background: '#f0fdf4', border: '1px solid #86efac',
                            borderRadius: '10px', padding: '14px 16px',
                            display: 'flex', alignItems: 'center', gap: '12px'
                        }}>
                            <CheckCircle2 size={22} style={{ color: '#16a34a', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d' }}>
                                    Payment Approved!
                                </div>
                                <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                                    Call raising is now unblocked. You can raise a new inspection call from PO Assigned.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 24px', background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'flex-end', gap: '10px'
                }}>
                    <button onClick={onClose} style={{
                        padding: '9px 18px', borderRadius: '8px',
                        border: '1.5px solid #cbd5e1', background: '#fff',
                        color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                    }}>
                        {approved ? 'Close' : 'Cancel'}
                    </button>

                    {canApprove && (
                        <button
                            onClick={handleMarkApproved}
                            disabled={approving}
                            style={{
                                padding: '9px 20px', borderRadius: '8px', border: 'none',
                                background: approving ? '#94a3b8' : '#16a34a',
                                color: '#fff', fontWeight: 800, fontSize: '13px',
                                cursor: approving ? 'not-allowed' : 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '7px',
                                boxShadow: approving ? 'none' : '0 2px 4px rgba(22,163,74,0.3)',
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
