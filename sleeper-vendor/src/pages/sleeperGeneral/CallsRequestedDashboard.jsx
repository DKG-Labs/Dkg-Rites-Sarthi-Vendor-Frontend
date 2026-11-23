import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../../services/api';
import { generateOfferListPDF } from '../../utils/offerListGenerator';
import { generateCallLetterPDF } from '../../utils/generateCallLetterPDF';
import RaiseInspectionCallForm from './RaiseInspectionCallForm';
import { getIeContact } from '../../utils/userMasterContacts';

// ─── Status Configuration ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
    'Pending - Call Scheduled': {
        bg: '#fff1f2', color: '#be123c', border: '#fecdd3',
        dot: '#e11d48', canModify: true, canWithdraw: false, needsWorkflow: false,
        icon: '📅', description: 'Inspection date scheduled'
    },
    'Scheduled by IE': {
        bg: '#fff1f2', color: '#be123c', border: '#fecdd3',
        dot: '#e11d48', canModify: true, canWithdraw: false, needsWorkflow: false,
        icon: '📅', description: 'Inspection date scheduled'
    },
    'Pending - Call Raised': {
        bg: '#fff7ed', color: '#c2410c', border: '#fed7aa',
        dot: '#f97316', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '📋', description: 'Awaiting Call Desk review'
    },
    'Call Raised': {
        bg: '#fff7ed', color: '#c2410c', border: '#fed7aa',
        dot: '#f97316', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '📋', description: 'Awaiting Call Desk review'
    },
    'Pending - Call Registered': {
        bg: '#fff7ed', color: '#c2410c', border: '#fed7aa',
        dot: '#f97316', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '📋', description: 'Call registered and verified'
    },
    'Pending for verification': {
        bg: '#fff7ed', color: '#c2410c', border: '#fed7aa',
        dot: '#f97316', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '📋', description: 'Awaiting verification'
    },
    'Pending - PO Verification': {
        bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe',
        dot: '#3b82f6', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '🔍', description: 'Under PO Verification'
    },
    'PO Verification': {
        bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe',
        dot: '#3b82f6', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '🔍', description: 'Under PO Verification'
    },
    'Pending - Returned to Vendor': {
        bg: '#fff7ed', color: '#c2410c', border: '#fed7aa',
        dot: '#f97316', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '↩️', description: 'Returned for rectification'
    },
    'Returned by Call Desk': {
        bg: '#fff7ed', color: '#c2410c', border: '#fed7aa',
        dot: '#f97316', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '↩️', description: 'Returned for rectification'
    },
    'RETURNED': {
        bg: '#fff7ed', color: '#c2410c', border: '#fed7aa',
        dot: '#f97316', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '↩️', description: 'Returned for rectification'
    },
    'Pending - Resubmitted': {
        bg: '#fefce8', color: '#a16207', border: '#fde68a',
        dot: '#eab308', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '🔄', description: 'Resubmitted to Call Desk'
    },
    'Resubmitted': {
        bg: '#fefce8', color: '#a16207', border: '#fde68a',
        dot: '#eab308', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '🔄', description: 'Resubmitted to Call Desk'
    },
    'Pending - Call Assigned to IE': {
        bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0',
        dot: '#22c55e', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '👷', description: 'Assigned to IE'
    },
    'Call Assigned to IE': {
        bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0',
        dot: '#22c55e', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '👷', description: 'Assigned to IE'
    },
    'Under Inspection': {
        bg: '#ecfdf5', color: '#047857', border: '#a7f3d0',
        dot: '#10b981', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '🔍', description: 'Inspection in progress'
    },
    'Paused': {
        bg: '#ecfdf5', color: '#047857', border: '#a7f3d0',
        dot: '#10b981', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '⏸️', description: 'Inspection paused'
    },
    'Under Inspection - Paused': {
        bg: '#ecfdf5', color: '#047857', border: '#a7f3d0',
        dot: '#10b981', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '⏸️', description: 'Inspection paused'
    },
    'Withheld': {
        bg: '#fdf2f8', color: '#9d174d', border: '#f9a8d4',
        dot: '#ec4899', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '⏸️', description: 'Withheld by IE'
    },
    'Under Inspection - Withheld': {
        bg: '#fdf2f8', color: '#9d174d', border: '#f9a8d4',
        dot: '#ec4899', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '⏸️', description: 'Withheld by IE'
    },
    'Cancelled': {
        bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5',
        dot: '#ef4444', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '❌', description: 'Call cancelled'
    },
    'Completed': {
        bg: '#f0fdf4', color: '#166534', border: '#86efac',
        dot: '#16a34a', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '✅', description: 'Inspection completed'
    },
    'Completed - E-Signed': {
        bg: '#f0fdf4', color: '#166534', border: '#86efac',
        dot: '#16a34a', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '✅', description: 'Completed - E-Signed'
    },
    'Completed - IC Issued': {
        bg: '#f0fdf4', color: '#166534', border: '#86efac',
        dot: '#16a34a', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '✅', description: 'Completed - IC Issued'
    },
    'Locked': {
        bg: '#f0fdf4', color: '#166534', border: '#86efac',
        dot: '#16a34a', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '🔒', description: 'Inspection completed (Locked)'
    },
};

export const formatDateDDMMYY = (val) => {
    if (!val) return 'N/A';
    try {
        if (typeof val === 'string') {
            const s = val.trim();
            // Already dd/mm/yyyy (vendor-calls API) - normalise padding only
            const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
            if (dmy) return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
            // ISO yyyy-mm-dd[Thh:mm...]
            const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
        }
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            return `${day}/${month}/${d.getFullYear()}`;
        }
    } catch (e) { }
    return String(val);
};

export const getCallUom = (call) => {
    if (call?.uom && String(call.uom).trim() !== '') {
        const u = String(call.uom).trim();
        return u.toUpperCase().includes('SET') ? 'Set' : u;
    }
    if (call?.unit && String(call.unit).trim() !== '') {
        const u = String(call.unit).trim();
        return u.toUpperCase().includes('SET') ? 'Set' : u;
    }
    const st = (call?.sleeperType || '').toUpperCase();
    if (st.includes('SET') || st.includes('PNC') || st.includes('TURNOUT') || st.includes('4218') || st.includes('4865') || st.includes('9790') || st.includes('4732') || st.includes('DERAIL')) {
        return 'Set';
    }
    return 'Nos.';
};

// ─── No Mock Data ─────────────────────────────────────────────────────────────
const MOCK_CALLS = [];

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, scheduledDate }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pending - Call Raised'] || STATUS_CONFIG['Call Raised'];
    const label = (status && status.includes('Scheduled') && scheduledDate)
        ? `${status} (${scheduledDate})` : status;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span style={{
                background: cfg.bg, color: cfg.color,
                border: `1px solid ${cfg.border}`,
                padding: '4px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 5
            }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, flexShrink: 0, display: 'inline-block' }} />
                {cfg.icon} {label}
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8', paddingLeft: 4 }}>{cfg.description}</span>
        </div>
    );
};

// ─── Workflow Tag ─────────────────────────────────────────────────────────────
const WorkflowTag = () => (
    <span style={{
        background: '#fff3cd', color: '#8a5700', border: '1px solid #ffd97d',
        borderRadius: 4, padding: '2px 7px', fontSize: 9, fontWeight: 800,
        letterSpacing: '0.05em', whiteSpace: 'nowrap'
    }}>
        WORKFLOW REQUIRED
    </span>
);

// ─── Call Detail Popup ────────────────────────────────────────────────────────
const CallDetailPopup = ({ call, onClose, onModify, onWithdraw, onResubmit, onDownload, onDownloadOfferList }) => {
    const [activeTab, setActiveTab] = useState('details');
    if (!call) return null;
    const cfg = STATUS_CONFIG[call.status] || STATUS_CONFIG['Pending for verification'] || {};
    const isReturned = call.status === 'Returned by Call Desk' || call.status === 'RETURNED';

    const rawJobStatus = String(call.jobStatus || call.job_status || '').toUpperCase().trim();
    const rawStatus = String(call.status || call.rawStatus || '').toUpperCase().trim();

    // Completion rule: Both blocked
    const isCompleted =
        rawStatus === 'SEND_CALL_TO_IBS' ||
        rawJobStatus === 'SEND_CALL_TO_IBS' ||
        rawStatus.includes('SEND_CALL_TO_IBS') ||
        rawJobStatus.includes('SEND_CALL_TO_IBS') ||
        rawStatus.includes('IBS') ||
        rawJobStatus.includes('IBS');

    // Active inspection / Paused rule: Both Modify and Withdraw are BLOCKED
    const isUnderInspection = rawJobStatus === 'PAUSED' || rawJobStatus === 'INITIATED' || rawJobStatus.includes('INSPECT') || rawStatus === 'UNDER INSPECTION' || rawStatus === 'PAUSED';

    // PO_VERIFICATION rule: Both Modify and Withdraw are BLOCKED
    const isPoVerification = rawJobStatus === 'PO_VERIFICATION' || rawJobStatus.includes('PO_VERIF') || rawStatus === 'PO_VERIFICATION' || rawStatus.includes('PO_VERIF');

    // SCHEDULED rule: Withdraw is BLOCKED, Modify is ALLOWED
    const isScheduled = rawJobStatus === 'SCHEDULED' || rawJobStatus === 'RESCHEDULE' || rawJobStatus.includes('SCHEDULE') || rawStatus === 'SCHEDULED BY IE' || rawStatus === 'SCHEDULED';

    // Action permissions
    const canModify = !isCompleted && !isUnderInspection && !isPoVerification && (cfg.canModify !== false);
    const canWithdraw = !isCompleted && !isPoVerification && !isUnderInspection && !isScheduled && (cfg.canWithdraw !== false);
    const locked = isCompleted || isUnderInspection || (!canModify && !canWithdraw && !isReturned);

    const statusLabel = (rawJobStatus === 'SCHEDULED' || rawJobStatus === 'RESCHEDULE' || call.status === 'Scheduled by IE')
        ? (call.scheduledDate ? `Scheduled (${call.scheduledDate})` : 'Scheduled by IE')
        : (isUnderInspection ? (rawJobStatus === 'PAUSED' ? 'Paused' : 'Under Inspection') : ((call.status === 'Completed' || call.status === 'Locked') ? 'Completed Calls' : (isPoVerification ? 'PO Verification' : call.status)));

    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(13,59,63,0.72)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 99999, backdropFilter: 'blur(6px)', padding: 16
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                background: '#fff', borderRadius: 18,
                width: '100%', maxWidth: 700,
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 60px rgba(0,0,0,0.28)', overflow: 'hidden'
            }}>
                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
                    padding: '14px 18px 0', flexShrink: 0
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
                                INSPECTION CALL
                            </div>
                            <div style={{ color: '#fff', fontSize: 19, fontWeight: 800, marginBottom: 6 }}>
                                {call.callNo}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{
                                    background: cfg.bg, color: cfg.color,
                                    border: `1px solid ${cfg.border}`,
                                    padding: '2px 10px', borderRadius: 20,
                                    fontSize: 10, fontWeight: 700,
                                    display: 'inline-flex', alignItems: 'center', gap: 4
                                }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                                    {cfg.icon} {statusLabel}
                                </span>
                                {cfg.needsWorkflow && !locked && (
                                    <span style={{
                                        background: 'rgba(255,200,0,0.2)', color: '#ffd97d',
                                        border: '1px solid rgba(255,200,0,0.3)',
                                        borderRadius: 4, padding: '2px 8px', fontSize: 9, fontWeight: 800
                                    }}>⚡ WORKFLOW REQUIRED</span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} style={{
                            background: 'rgba(255,255,255,0.15)', border: 'none',
                            color: '#fff', borderRadius: '50%', width: 34, height: 34,
                            fontSize: 19, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>×</button>
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', gap: 18, marginBottom: 14, flexWrap: 'wrap' }}>
                        {[
                            { label: 'PO No.', value: call.poNo },
                            { label: 'SR No.', value: call.srNo },
                            { label: 'Call Date', value: call.callDate },
                            { label: 'Sleeper Type', value: call.sleeperType },
                            { label: 'Qty Offered', value: `${(Number(call.qtyOffered) || 0).toLocaleString()} ${getCallUom(call)}` },
                            { label: 'Batches', value: `${call.batches}` },
                        ].map(m => (
                            <div key={m.label}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</div>
                                <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>{m.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[
                            { key: 'details', label: '📋 Details & History' },
                            { key: 'actions', label: '⚙️ Actions' },
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                style={{
                                    padding: '7px 18px', borderRadius: '8px 8px 0 0', fontSize: 11,
                                    fontWeight: 700, cursor: 'pointer', border: 'none',
                                    background: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.12)',
                                    color: activeTab === t.key ? '#0d3b3f' : 'rgba(255,255,255,0.75)',
                                    transition: 'all 0.15s'
                                }}
                            >{t.label}</button>
                        ))}
                    </div>
                </div>

                {/* ── Body ── */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px' }}>

                    {/* TAB: Details & History */}
                    {activeTab === 'details' && (
                        <div>
                            {/* Return reason banner */}
                            {isReturned && call.returnReason && (
                                <div style={{
                                    background: '#fff7ed', border: '1.5px solid #fed7aa',
                                    borderRadius: 10, padding: '12px 16px', marginBottom: 14,
                                    display: 'flex', gap: 10, alignItems: 'flex-start'
                                }}>
                                    <span style={{ fontSize: 18, flexShrink: 0 }}>↩️</span>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 12, color: '#c2410c', marginBottom: 3 }}>Returned by Call Desk — Reason</div>
                                        <div style={{ fontSize: 12, color: '#7c3015' }}>{call.returnReason}</div>
                                    </div>
                                </div>
                            )}

                            {/* IE / Schedule info */}
                            {call.ieName && (
                                <div style={{
                                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                                    borderRadius: 10, padding: '12px 16px', marginBottom: 14,
                                    display: 'flex', gap: 20, flexWrap: 'wrap'
                                }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Assigned IE</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>👷 {call.ieName}</div>
                                    </div>
                                    {call.scheduledDate && (
                                        <div>
                                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Scheduled Date</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9' }}>📅 {call.scheduledDate}</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* History Timeline */}
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                                Call History
                            </div>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 2, background: '#e2e8f0', borderRadius: 999 }} />
                                {[...call.history].reverse().map((entry, idx) => {
                                    const hcfg = STATUS_CONFIG[entry.action];
                                    return (
                                        <div key={idx} style={{
                                            display: 'flex', gap: 14,
                                            marginBottom: idx === call.history.length - 1 ? 0 : 16,
                                            position: 'relative'
                                        }}>
                                            <div style={{
                                                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                                background: hcfg ? hcfg.bg : '#f1f5f9',
                                                border: `2px solid ${hcfg ? hcfg.border : '#e2e8f0'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 13, zIndex: 1
                                            }}>
                                                {hcfg ? hcfg.icon : '📋'}
                                            </div>
                                            <div style={{
                                                flex: 1, background: '#f8fafc',
                                                border: '1px solid #e2e8f0', borderRadius: 10,
                                                padding: '9px 13px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                                                    <span style={{ fontWeight: 700, fontSize: 12, color: hcfg ? hcfg.color : '#0f172a' }}>{entry.action}</span>
                                                    <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>{entry.date}</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: entry.note ? 3 : 0 }}>
                                                    By: <strong style={{ color: '#334155' }}>{entry.by}</strong>
                                                </div>
                                                {entry.note && <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>"{entry.note}"</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}


                    {/* TAB: Actions */}
                    {activeTab === 'actions' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                            {/* Download Call Letter — always available */}
                            <div style={{
                                border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
                            }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', marginBottom: 3 }}>📄 Download Call Letter</div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>Download the official inspection call letter for this request.</div>
                                </div>
                                <button
                                    onClick={() => onDownload(call)}
                                    style={{
                                        padding: '9px 20px', borderRadius: 8, border: 'none', flexShrink: 0,
                                        background: 'linear-gradient(135deg, #0d3b3f, #21808d)',
                                        color: '#fff', fontWeight: 700, fontSize: 12,
                                        cursor: 'pointer', whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 8px rgba(33,128,141,0.3)'
                                    }}
                                >⬇ Download</button>
                            </div>

                            {/* Download Sleeper Offer List — added as requested */}
                            <div style={{
                                border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
                            }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', marginBottom: 3 }}>📋 Download Sleeper Offer List</div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>Download the list of sleepers offered for this inspection call.</div>
                                </div>
                                <button
                                    onClick={() => onDownloadOfferList(call)}
                                    style={{
                                        padding: '9px 20px', borderRadius: 8, border: 'none', flexShrink: 0,
                                        background: 'linear-gradient(135deg, #21808d, #0d3b3f)',
                                        color: '#fff', fontWeight: 700, fontSize: 12,
                                        cursor: 'pointer', whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 8px rgba(33,128,141,0.3)'
                                    }}
                                >⬇ Download</button>
                            </div>

                            {/* Resubmit — only when Returned by Call Desk */}
                            {isReturned && (
                                <div style={{
                                    border: '1.5px solid #fed7aa', borderRadius: 12, padding: '12px 14px',
                                    background: '#fff9f5',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 13, color: '#c2410c', marginBottom: 3 }}>🔄 Resubmit Call</div>
                                        <div style={{ fontSize: 11, color: '#7c3015' }}>Rectify errors and resubmit. Call Date will update to today's date.</div>
                                    </div>
                                    <button
                                        onClick={() => { onResubmit(call); onClose(); }}
                                        style={{
                                            padding: '9px 20px', borderRadius: 8, border: 'none', flexShrink: 0,
                                            background: 'linear-gradient(135deg, #f97316, #c2410c)',
                                            color: '#fff', fontWeight: 700, fontSize: 12,
                                            cursor: 'pointer', whiteSpace: 'nowrap',
                                            boxShadow: '0 2px 8px rgba(249,115,22,0.3)'
                                        }}
                                    >🔄 Resubmit</button>
                                </div>
                            )}

                            {/* Modify Call */}
                            {canModify && (
                                <div style={{
                                    border: `1.5px solid ${cfg.needsWorkflow ? '#fde68a' : '#bfdbfe'}`,
                                    borderRadius: 12, padding: '12px 14px',
                                    background: cfg.needsWorkflow ? '#fefce8' : '#eff6ff',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 13, color: cfg.needsWorkflow ? '#a16207' : '#1d4ed8', marginBottom: 3 }}>✏️ Modify Call</div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: cfg.needsWorkflow ? 6 : 0 }}>
                                            {cfg.needsWorkflow
                                                ? 'Modification requires formal workflow approval as IE has been assigned.'
                                                : 'Update call details such as batch selection or quantities before submission.'}
                                        </div>
                                        {cfg.needsWorkflow && <WorkflowTag />}
                                    </div>
                                    <button
                                        onClick={() => { onModify(call); onClose(); }}
                                        style={{
                                            padding: '9px 20px', borderRadius: 8, border: 'none', flexShrink: 0,
                                            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                            color: '#fff', fontWeight: 700, fontSize: 12,
                                            cursor: 'pointer', whiteSpace: 'nowrap',
                                            boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
                                        }}
                                    >✏️ Modify</button>
                                </div>
                            )}

                            {/* Withdraw Call */}
                            {canWithdraw && (
                                <div style={{
                                    border: `1.5px solid ${cfg.needsWorkflow ? '#fde68a' : '#fca5a5'}`,
                                    borderRadius: 12, padding: '12px 14px',
                                    background: cfg.needsWorkflow ? '#fefce8' : '#fff5f5',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 13, color: cfg.needsWorkflow ? '#a16207' : '#b91c1c', marginBottom: 3 }}>✕ Withdraw Call</div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: cfg.needsWorkflow ? 6 : 0 }}>
                                            {cfg.needsWorkflow
                                                ? 'Withdrawal requires formal workflow approval as IE has been assigned.'
                                                : 'Cancel and remove this call from the inspection queue.'}
                                        </div>
                                        {cfg.needsWorkflow && <WorkflowTag />}
                                    </div>
                                    <button
                                        onClick={() => { onWithdraw(call); onClose(); }}
                                        style={{
                                            padding: '9px 20px', borderRadius: 8, flexShrink: 0,
                                            border: '1.5px solid #fca5a5',
                                            background: '#fff', color: '#dc2626',
                                            fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap'
                                        }}
                                    >✕ Withdraw</button>
                                </div>
                            )}

                            {/* Locked / Restricted state */}
                            {(!canModify && !canWithdraw && !isReturned) && (
                                <div style={{
                                    border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 14px',
                                    background: '#f8fafc', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 4 }}>No Actions Available</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                        {isPoVerification ? (
                                            <>This call is under <strong>PO Verification</strong>. Modifications and withdrawals are not permitted at this stage.</>
                                        ) : (
                                            <>This call is <strong>{call.status}</strong>. Modifications and withdrawals are not permitted at this stage.</>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Workflow Confirmation Modal ──────────────────────────────────────────────
const WorkflowModal = ({ call, actionType, onConfirm, onClose }) => {
    const [reason, setReason] = useState('');
    if (!call) return null;
    return createPortal(
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, backdropFilter: 'blur(4px)', padding: 16
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
                boxShadow: '0 20px 48px rgba(0,0,0,0.22)', overflow: 'hidden'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
                    padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', marginBottom: 2 }}>
                            WORKFLOW REQUIRED
                        </div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>
                            {actionType === 'modify' ? '✏️ Modify Call' : '✕ Withdraw Call'}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 }}>{call.callNo}</div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                        borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>×</button>
                </div>
                <div style={{ padding: '16px 18px' }}>
                    <div style={{
                        background: '#fef9ec', border: '1px solid #fde68a',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#8a5700'
                    }}>
                        ⚠️ This action requires a formal workflow since the call has been assigned. A reason must be provided and the request will be routed for approval.
                    </div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                        Reason / Justification <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder={actionType === 'modify' ? 'State reason for modification...' : 'State reason for withdrawal...'}
                        rows={3}
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: 8,
                            border: '1.5px solid #cbd5e1', fontSize: 13, color: '#0f172a',
                            resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit'
                        }}
                    />
                    <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={{
                            padding: '8px 18px', borderRadius: 8, border: '1.5px solid #cbd5e1',
                            background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                        }}>Cancel</button>
                        <button
                            disabled={!reason.trim()}
                            onClick={() => { if (reason.trim()) onConfirm(call, actionType, reason); }}
                            style={{
                                padding: '8px 18px', borderRadius: 8, border: 'none',
                                background: !reason.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #7c3aed, #4c1d95)',
                                color: !reason.trim() ? '#94a3b8' : '#fff',
                                fontWeight: 700, fontSize: 13,
                                cursor: !reason.trim() ? 'not-allowed' : 'pointer'
                            }}
                        >Submit for Approval</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ─── Withdraw Confirm Modal (no-workflow) ─────────────────────────────────────
const WithdrawSimpleModal = ({ call, onConfirm, onClose }) => {
    const [remarks, setRemarks] = useState('');
    if (!call) return null;
    return createPortal(
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, backdropFilter: 'blur(4px)', padding: 16
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
                boxShadow: '0 20px 48px rgba(0,0,0,0.22)', overflow: 'hidden'
            }}>
                <div style={{ padding: '18px 20px' }}>
                    <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
                    <h3 style={{ margin: '0 0 8px', textAlign: 'center', color: '#0f172a', fontWeight: 800 }}>Withdraw Call?</h3>
                    <p style={{ margin: '0 0 20px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                        Are you sure you want to withdraw <strong>{call.callNo}</strong>? This action will remove the call from the queue.
                    </p>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                        Reason for withdrawal (optional)
                    </label>
                    <textarea
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        placeholder="State reason for withdrawal..."
                        rows={2}
                        style={{
                            width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 16,
                            border: '1.5px solid #cbd5e1', fontSize: 13, color: '#0f172a',
                            resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit'
                        }}
                    />
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button onClick={onClose} style={{
                            padding: '8px 22px', borderRadius: 8, border: '1.5px solid #cbd5e1',
                            background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                        }}>Cancel</button>
                        <button onClick={() => onConfirm(call, remarks)} style={{
                            padding: '8px 22px', borderRadius: 8, border: 'none',
                            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer'
                        }}>Yes, Withdraw</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
// ─── Filter Tab ───────────────────────────────────────────────────────────────
const FilterTab = ({ label, count, active, color, onClick }) => (
    <button onClick={onClick} style={{
        padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        cursor: 'pointer', border: `1.5px solid ${active ? color : '#e2e8f0'}`,
        background: active ? color : '#fff', color: active ? '#fff' : '#64748b',
        transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap'
    }}>
        {label}
        {count > 0 && (
            <span style={{
                background: active ? 'rgba(255,255,255,0.3)' : '#f1f5f9',
                color: active ? '#fff' : '#64748b',
                borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800
            }}>{count}</span>
        )}
    </button>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const CallsRequestedDashboard = ({ inspectionCalls: propCalls, onRefresh }) => {
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedCall, setSelectedCall] = useState(null);
    const [editCall, setEditCall] = useState(null);
    const [workflowModal, setWorkflowModal] = useState(null);
    const [withdrawSimpleModal, setWithdrawSimpleModal] = useState(null);
    const [toast, setToast] = useState(null);
    const [fetchedCalls, setFetchedCalls] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!propCalls || propCalls.length === 0) {
            const loadCalls = async () => {
                setLoading(true);
                try {
                    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId') || 118;
                    const res = await apiService.getVendorInspectionCalls(userId);
                    if (res && res.length > 0) {
                        setFetchedCalls(res);
                    }
                } catch (e) {
                    console.error('Error fetching requested calls:', e);
                } finally {
                    setLoading(false);
                }
            };
            loadCalls();
        }
    }, [propCalls]);

    const rawCallsList = (propCalls && propCalls.length > 0) ? propCalls : fetchedCalls;

    // Single source of truth
    const allCalls = (rawCallsList || []).map(c => {
        const rawStatus = (c.status || '').trim();
        const rawJobStatus = (c.jobStatus || c.job_status || '').trim();
        const norm = rawStatus.toUpperCase();
        const normJob = rawJobStatus.toUpperCase();

        let status = 'Pending - Call Raised';
        if (norm.includes('E-SIGNED') || normJob.includes('E-SIGNED') || norm.includes('E_SIGNED') || normJob.includes('E_SIGNED') || norm.includes('ESIGN') || normJob.includes('ESIGN')) {
            status = 'Completed - E-Signed';
        } else if (norm.includes('IC_ISSUE') || normJob.includes('IC_ISSUE') || norm.includes('IC_ISSUED') || normJob.includes('IC_ISSUED') || norm.includes('GENERATE_IC') || normJob.includes('GENERATE_IC')) {
            status = 'Completed - IC Issued';
        } else if (norm === 'COMPLETED' || normJob === 'COMPLETED' || norm.includes('FINISH') || normJob.includes('FINISH')) {
            status = 'Completed';
        } else if (norm === 'LOCKED' || normJob === 'LOCKED') {
            status = 'Locked';
        } else if (normJob === 'PO_VERIFICATION' || normJob.includes('PO_VERIF') || norm === 'PO_VERIFICATION' || norm.includes('PO_VERIF')) {
            status = 'Pending - PO Verification';
        } else if (normJob === 'PAUSED' || norm === 'PAUSED') {
            status = 'Under Inspection - Paused';
        } else if (normJob === 'INITIATED' || normJob.includes('INSPECT') || norm === 'UNDER INSPECTION' || norm === 'UNDER_INSPECTION') {
            status = 'Under Inspection';
        } else if (c.scheduledDate || c.scheduleDate || normJob === 'SCHEDULED' || normJob === 'RESCHEDULE' || normJob.includes('SCHEDULE') || norm === 'SCHEDULED BY IE' || norm === 'SCHEDULED') {
            status = 'Pending - Call Scheduled';
        } else if (norm === 'RETURNED BY CALL DESK' || norm === 'RETURNED') {
            status = 'Pending - Returned to Vendor';
        } else if (norm === 'RESUBMITTED') {
            status = 'Pending - Resubmitted';
        } else if (norm === 'CALL ASSIGNED TO IE' || norm === 'ASSIGNED' || norm === 'ASSIGNED TO IE' || normJob === 'ASSIGNED') {
            status = 'Pending - Call Assigned to IE';
        } else if (norm === 'WITHHELD') {
            status = 'Under Inspection - Withheld';
        } else if (norm === 'CANCELLED') {
            status = 'Cancelled';
        } else if (norm === 'VERIFIED' || norm === 'CALL_REGISTERED') {
            status = 'Pending - Call Registered';
        } else if (norm === 'PENDING FOR VERIFICATION' || norm === 'PENDING' || norm === 'CALL RAISED' || norm === 'CREATED') {
            status = 'Pending - Call Raised';
        } else if (rawStatus) {
            status = rawStatus;
        }

        return {
            ...c,
            id: c.id,
            callNo: c.callNo || 'N/A',
            poNo: c.poNo,
            srNo: c.srNo,
            callDate: c.callDate || new Date().toLocaleDateString('en-IN'),
            scheduledDate: c.scheduledDate ? formatDateDDMMYY(c.scheduledDate) : (c.scheduleDate ? formatDateDDMMYY(c.scheduleDate) : (c.scheduled_date ? formatDateDDMMYY(c.scheduled_date) : null)),
            sleeperType: c.sleeperType,
            uom: c.uom || getCallUom(c),
            qtyOffered: Number(c.qtyOffered) || 0,
            batches: Number(c.batches) || 0,
            status: status,
            jobStatus: c.jobStatus || c.job_status || '',
            rawStatus: rawStatus,
            history: c.history || [{ action: status, date: c.callDate || new Date().toLocaleDateString('en-IN'), by: 'Vendor', note: 'Initial submission' }]
        };
    });

    const isCompletedSectionCall = (c) => {
        if (!c) return false;
        if (c.isClosed) return true;
        const combined = [
            c?.status,
            c?.workflowStatus,
            c?.workflow_status,
            c?.latestAction,
            c?.action,
            c?.rawStatus,
            c?.jobStatus,
            c?.job_status,
            c?.ibsStatus,
            c?.ibs_status
        ].map(v => String(v || '').trim().toUpperCase()).join(' ');
        return (
            combined.includes('WITHDRAW') ||
            combined.includes('CANCEL') ||
            combined.includes('REJECT') ||
            combined.includes('SEND_CALL_TO_IBS') ||
            combined.includes('SENT_CALL_TO_IBS') ||
            combined.includes('SENT_TO_IBS') ||
            combined.includes('SEND_TO_IBS') ||
            combined.includes('SEND CALL TO IBS') ||
            combined.includes('CLOSED') ||
            combined.includes('IBS')
        );
    };

    const displayCalls = allCalls.filter(c => !isCompletedSectionCall(c));

    const matchesFilter = (callStatus, tabKey) => {
        if (!callStatus || !tabKey) return false;
        if (tabKey === 'All') return true;
        if (callStatus === tabKey) return true;
        const normCall = String(callStatus).replace(/^Pending -\s*/i, '').replace(/^Under Inspection -\s*/i, '').trim().toUpperCase();
        const normTab = String(tabKey).replace(/^Pending -\s*/i, '').replace(/^Under Inspection -\s*/i, '').trim().toUpperCase();
        return normCall === normTab;
    };

    const statusCounts = {};
    Object.keys(STATUS_CONFIG).forEach(s => {
        statusCounts[s] = displayCalls.filter(c => c.status === s).length;
    });

    const filtered = filterStatus === 'All'
        ? displayCalls
        : displayCalls.filter(c => matchesFilter(c.status, filterStatus));

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleModify = (call) => {
        setEditCall(call);
    };

    const handleWithdraw = (call) => {
        const cfg = STATUS_CONFIG[call.status];
        if (cfg?.needsWorkflow) {
            setWorkflowModal({ call, actionType: 'withdraw' });
        } else {
            setWithdrawSimpleModal(call);
        }
    };

    const handleResubmit = async (call) => {
        showToast(`Resubmitting ${call.callNo}...`, 'info');
        if (onRefresh) await onRefresh();
        showToast(`${call.callNo} has been resubmitted.`);
    };

    const handleWorkflowConfirm = (call, actionType) => {
        setWorkflowModal(null);
        showToast(`Workflow request for ${actionType === 'modify' ? 'modification' : 'withdrawal'} of ${call.callNo} submitted for approval.`, 'info');
    };

    const handleWithdrawConfirm = async (call, remarks) => {
        setWithdrawSimpleModal(null);
        showToast(`Withdrawing call ${call.callNo}...`, 'info');
        try {
            await apiService.withdrawSleeperInspectionCall(call.callNo, remarks);
            showToast(`Call ${call.callNo} has been withdrawn successfully.`, 'success');
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Error withdrawing call:', err);
            showToast(`Failed to withdraw call ${call.callNo}. Please try again.`, 'error');
        }
    };

    const handleDownloadCallLetter = async (call) => {
        const callId = call?.callNo || call?.callNumber || call?.requestId || call?.id;
        if (!callId) {
            showToast('Call ID not found. Cannot generate PDF.', 'info');
            return;
        }
        showToast(`Generating Call Letter for ${callId}...`, 'info');
        try {
            const details = await apiService.getCallLetterDetails(callId);
            let activePlant = null;
            try {
                const sp = localStorage.getItem('selectedPlant');
                if (sp) activePlant = JSON.parse(sp);
            } catch (e) { }

            const enrichedCall = {
                ...call,
                ...(details || {}),
                callNumber: call.callNo || call.callNumber || callId,
                poNumber: call.poNo || call.poNumber || details?.poNo,
                totalOffered: call.totalOffered || details?.totalOffered || 0,
                totalRejected: call.totalRejected || details?.totalRejected || 0,
                vendorName: (activePlant?.plantName && (!details?.vendorName || details?.vendorName === '-' || call.plantId === activePlant.plantId))
                    ? activePlant.plantName
                    : (details?.vendorName || call.vendorName || activePlant?.plantName),
                manufacturerName: (activePlant?.plantName && (!details?.manufacturerName || details?.manufacturerName === '-' || call.plantId === activePlant.plantId))
                    ? activePlant.plantName
                    : (details?.manufacturerName || call.manufacturerName || activePlant?.plantName),
                placeOfInspection: (activePlant?.plantName && (!details?.placeOfInspection || details?.placeOfInspection === '-' || call.plantId === activePlant.plantId))
                    ? activePlant.plantName
                    : (details?.placeOfInspection || call.placeOfInspection || activePlant?.plantName)
            };
            generateCallLetterPDF(enrichedCall, true);
            showToast(`Call letter for ${callId} downloaded successfully!`);
        } catch (err) {
            console.error('Error generating Call Letter PDF:', err);
            try {
                generateCallLetterPDF(call, true);
                showToast(`Call letter for ${callId} downloaded!`);
            } catch (e2) {
                showToast('Failed to generate Call Letter PDF.', 'info');
            }
        }
    };

    const handleDownloadOfferList = async (call) => {
        const callId = call?.callNo || call?.callNumber || call?.requestId || call?.id;
        try {
            const details = callId ? await apiService.getCallLetterDetails(callId) : null;
            let activePlant = null;
            try {
                const sp = localStorage.getItem('selectedPlant');
                if (sp) activePlant = JSON.parse(sp);
            } catch (e) { }

            const enrichedCall = {
                ...call,
                ...(details || {}),
                manufacturerName: (activePlant?.plantName && (!details?.manufacturerName || details?.manufacturerName === '-' || call.plantId === activePlant.plantId))
                    ? activePlant.plantName
                    : (details?.manufacturerName || details?.vendorName || details?.placeOfInspection || call.manufacturerName || call.vendorName || call.companyName || call.plantName || activePlant?.plantName),
                callNo: call.callNo || call.callNumber || callId,
                poNo: call.poNo || details?.poNo,
                consignee: details?.consigneeDetail || call.consignee || call.consigneeDetail,
                poDate: details?.poDate || call.poDate,
                bookNo: details?.bookNo || call.bookNo || '-',
                setNo: details?.setNo || call.setNo || '-',
                drawingNo: details?.drawingNo || call.drawingNo || call.sleeperType || '-',
                batchesSelected: (details?.batchesSelected && details.batchesSelected.length > 0)
                    ? details.batchesSelected
                    : ((details?.heatDetails && details.heatDetails.length > 0)
                        ? details.heatDetails.map(h => ({
                            batchNo: h.heatNo,
                            castDate: h.castDate,
                            totalCasted: h.totalCasted !== undefined ? h.totalCasted : (parseInt(h.qtyOffered) || 0),
                            previouslyOffered: h.previouslyOffered || 0,
                            goodSleepers: h.goodSleepers || h.goodCount || parseInt(h.qtyOffered) || 0,
                            badSleepers: h.badSleepers || h.badCount || 0,
                            etNo: h.etNo || '',
                            rejNo: h.rejNo || '',
                            mfNo: h.mfNo || '',
                            normAccepted: h.normAccepted || 0,
                            etAccepted: h.etAccepted || 0,
                            mftAccepted: h.mftAccepted || 0,
                            rejSurf: h.rejSurf || 0,
                            rejDim: h.rejDim || 0,
                            rejOth: h.rejOth !== undefined ? h.rejOth : (Array.isArray(h.badSleepers) ? h.badSleepers.length : (h.badCount || 0)),
                            rejSbt: h.rejSbt || 0,
                            notOffered: h.notOffered || 0
                        }))
                        : ((call.batchesSelected && call.batchesSelected.length > 0)
                            ? call.batchesSelected
                            : [])),
                // Shed batch ranges from backend (computed from productionUnit)
                shed1BatchNo: details?.shed1BatchNo || call.shed1BatchNo || undefined,
                shed2BatchNo: details?.shed2BatchNo !== undefined ? details.shed2BatchNo : (call.shed2BatchNo || undefined),
            };
            generateOfferListPDF(enrichedCall);
            showToast(`Offer list downloaded successfully!`);
        } catch (e) {
            console.error('Error generating offer list PDF:', e);
            generateOfferListPDF(call);
        }
    };

    const FILTER_TABS = [
        { key: 'All', label: 'All Active', color: '#21808d' },
        { key: 'Pending - Call Raised', label: 'Call Raised', color: '#3b82f6' },
        { key: 'Pending - PO Verification', label: 'PO Verification', color: '#3b82f6' },
        { key: 'Pending - Returned to Vendor', label: 'Returned', color: '#f97316' },
        { key: 'Pending - Resubmitted', label: 'Resubmitted', color: '#eab308' },
        { key: 'Pending - Call Assigned to IE', label: 'Assigned to IE', color: '#22c55e' },
        { key: 'Pending - Call Scheduled', label: 'Call Scheduled', color: '#8b5cf6' },
        { key: 'Under Inspection', label: 'Under Inspection', color: '#10b981' },
        { key: 'Under Inspection - Paused', label: 'Paused', color: '#047857' },
        { key: 'Under Inspection - Withheld', label: 'Withheld', color: '#ec4899' },
        { key: 'Completed', label: 'Completed', color: '#166534' },
    ];

    return (
        <div className="fade-in">
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: 22, fontWeight: 800 }}>
                        Inspection Calls — Requested
                    </h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                        Track and manage all active inspection call requests. Click <strong>View</strong> on any call to see details and take actions.
                    </p>
                </div>

                {/* Summary Chips */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total Active', val: displayCalls.length, bg: '#f0f9fa', color: '#21808d', border: '#a7d8dc' },
                        { label: 'Pending for verification', val: (statusCounts['Pending - Call Raised'] || statusCounts['Call Raised'] || 0) + (statusCounts['Pending - Resubmitted'] || statusCounts['Resubmitted'] || 0), bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
                        { label: 'Needs Action', val: (statusCounts['Pending - Returned to Vendor'] || statusCounts['Returned by Call Desk'] || 0), bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: s.bg, border: `1.5px solid ${s.border}`,
                            borderRadius: 12, padding: '8px 14px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                            <div style={{ fontSize: 10, color: s.color, fontWeight: 600, marginTop: 2, opacity: 0.8 }}>{s.label.toUpperCase()}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Filter Tabs ── */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {FILTER_TABS.map(tab => (
                    <FilterTab
                        key={tab.key}
                        label={tab.label || (tab.key === 'All' ? 'All Active' : tab.key)}
                        count={tab.key === 'All' ? displayCalls.length : (statusCounts[tab.key] || statusCounts[tab.key.replace(/^Pending -\s*/, '')] || 0)}
                        active={filterStatus === tab.key}
                        color={tab.color}
                        onClick={() => setFilterStatus(tab.key)}
                    />
                ))}
            </div>

            <div style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid #e2e8f0', overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>No calls with status "{filterStatus}"</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Try selecting a different filter above.</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                            <thead>
                                <tr style={{ background: '#fdf8e6', borderBottom: '2px solid #e2e8f0' }}>
                                    {['Call Details', 'PO Refrence', 'Detail of Inspection Call', 'Offered Qunatity', 'IE Assigned & mobile Number', 'Status', 'Action'].map(h => (
                                        <th key={h} style={{
                                            padding: '10px 16px', fontSize: 10, fontWeight: 800,
                                            color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                                            whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0',
                                            textAlign: h === 'Action' ? 'center' : 'left'
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((call, idx) => {
                                    const isReturned = call.status === 'Returned by Call Desk';
                                    return (
                                        <tr
                                            key={call.id || call.callNo || `call-row-${idx}`}
                                            style={{
                                                borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid #f1f5f9',
                                                background: isReturned ? '#fff9f5' : (idx % 2 === 0 ? '#fff' : '#fafcff'),
                                                transition: 'background 0.15s'
                                            }}
                                        >
                                            {/* Call Details */}
                                            <td style={{ padding: '10px 16px' }}>
                                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{call.callNo}</div>
                                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{call.callDate || call.inspectionDate || ''}</div>
                                                {isReturned && call.returnReason && (
                                                    <div style={{
                                                        marginTop: 6, fontSize: 10, color: '#c2410c',
                                                        background: '#fff7ed', border: '1px solid #fed7aa',
                                                        borderRadius: 6, padding: '3px 8px', maxWidth: 220
                                                    }}>
                                                        ↩ {call.returnReason}
                                                    </div>
                                                )}
                                            </td>

                                            {/* PO Reference */}
                                            <td style={{ padding: '10px 16px' }}>
                                                <div style={{ fontWeight: 600, fontSize: 12, color: '#334155' }}>{call.poNo}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>SR. No. {call.srNo}</div>
                                            </td>

                                            {/* Detail of Inspection Call */}
                                            <td style={{ padding: '10px 16px' }}>
                                                <div style={{ fontWeight: 700, fontSize: 12, color: '#7c3aed' }}>{call.sleeperType}</div>
                                                {call.batches ? (
                                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{call.batches} batch{call.batches !== 1 ? 'es' : ''}</div>
                                                ) : null}
                                            </td>

                                            {/* Offered Quantity */}
                                            <td style={{ padding: '10px 16px' }}>
                                                <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>
                                                    {(Number(call.qtyOffered) || 0).toLocaleString()} {getCallUom(call)}
                                                </div>
                                            </td>

                                            {/* IE Assigned & mobile Number */}
                                            <td style={{ padding: '10px 16px' }}>
                                                {(() => {
                                                    const ieName = call.ieName;
                                                    const hasIe = ieName && ieName !== 'Not Assigned' && ieName !== 'N/A';
                                                    const iePhone = getIeContact(ieName || call.assigned_to_user, call.ieContactNo || call.ieMobile || call.mobileNo || call.iePhone);
                                                    return hasIe ? (
                                                        <>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>{ieName}</div>
                                                            {iePhone ? (
                                                                <div style={{ fontSize: 11, color: '#475569', marginTop: 2, fontWeight: 600 }}>
                                                                    {iePhone}
                                                                </div>
                                                            ) : null}
                                                        </>
                                                    ) : (
                                                        <span style={{ fontSize: 11, color: '#94a3b8' }}>Not Assigned</span>
                                                    );
                                                })()}
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: '10px 16px', minWidth: 200 }}>
                                                <StatusBadge status={call.status} scheduledDate={call.scheduledDate} />
                                            </td>

                                            {/* Action */}
                                            <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => setSelectedCall(call)}
                                                    style={{
                                                        padding: '7px 20px', borderRadius: 20, fontSize: 11,
                                                        fontWeight: 700, cursor: 'pointer', border: 'none',
                                                        background: 'linear-gradient(135deg, #21808d, #0d3b3f)',
                                                        color: '#fff', whiteSpace: 'nowrap',
                                                        boxShadow: '0 2px 8px rgba(33,128,141,0.3)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    👁 View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Call Detail Popup ── */}
            {selectedCall && (
                <CallDetailPopup
                    call={selectedCall}
                    onClose={() => setSelectedCall(null)}
                    onModify={(c) => { setSelectedCall(null); handleModify(c); }}
                    onWithdraw={(c) => { setSelectedCall(null); handleWithdraw(c); }}
                    onResubmit={(c) => { handleResubmit(c); }}
                    onDownload={(c) => handleDownloadCallLetter(c)}
                    onDownloadOfferList={(c) => handleDownloadOfferList(c)}
                />
            )}

            {/* ── Workflow Modal ── */}
            {workflowModal && (
                <WorkflowModal
                    call={workflowModal.call}
                    actionType={workflowModal.actionType}
                    onConfirm={handleWorkflowConfirm}
                    onClose={() => setWorkflowModal(null)}
                />
            )}

            {/* ── Withdraw Confirm Modal ── */}
            {withdrawSimpleModal && (
                <WithdrawSimpleModal
                    call={withdrawSimpleModal}
                    onConfirm={handleWithdrawConfirm}
                    onClose={() => setWithdrawSimpleModal(null)}
                />
            )}

            {/* ── Modify Inspection Call Modal ── */}
            {editCall && (
                <RaiseInspectionCallForm
                    isEdit={true}
                    editCall={editCall}
                    poNo={editCall.poNo}
                    srItem={{
                        itemSrNo: editCall.srNo,
                        srNo: editCall.srNo,
                        description: editCall.itemDesc || editCall.description || editCall.poDes || `Sleeper PO Item ${editCall.srNo}`,
                        due: 999999,
                        orderedQty: editCall.poQty || editCall.orderedQty || 0,
                        acceptedTillNow: editCall.acceptedTillNow || 0,
                        offeredTillNow: editCall.qtyOffered || 0,
                        uom: editCall.uom || getCallUom(editCall)
                    }}
                    onClose={() => setEditCall(null)}
                    onSubmitInspectionCall={async () => {
                        setEditCall(null);
                        showToast(`Call ${editCall.callNo} modified successfully!`, 'success');
                        if (onRefresh) await onRefresh();
                    }}
                />
            )}

            {/* ── Toast ── */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
                    background: toast.type === 'info' ? '#1d4ed8' : '#16a34a',
                    color: '#fff', borderRadius: 12, padding: '12px 20px',
                    fontSize: 13, fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    maxWidth: 380
                }}>
                    {toast.type === 'info' ? 'ℹ️' : '✅'} {toast.msg}
                </div>
            )}
        </div>
    );
};

export default CallsRequestedDashboard;
