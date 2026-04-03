import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

// ─── Status Configuration ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
    'Call Raised': {
        bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe',
        dot: '#3b82f6', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '📋', description: 'Awaiting Call Desk review'
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
    'Resubmitted': {
        bg: '#fefce8', color: '#a16207', border: '#fde68a',
        dot: '#eab308', canModify: true, canWithdraw: true, needsWorkflow: false,
        icon: '🔄', description: 'Resubmitted to Call Desk'
    },
    'Call Assigned to IE': {
        bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0',
        dot: '#22c55e', canModify: true, canWithdraw: true, needsWorkflow: true,
        icon: '👷', description: 'Locked & assigned to IE'
    },
    'Scheduled by IE': {
        bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe',
        dot: '#8b5cf6', canModify: true, canWithdraw: true, needsWorkflow: true,
        icon: '📅', description: 'Inspection date scheduled'
    },
    'Under Inspection': {
        bg: '#ecfdf5', color: '#047857', border: '#a7f3d0',
        dot: '#10b981', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '🔍', description: 'Inspection in progress'
    },
    'Withheld': {
        bg: '#fdf2f8', color: '#9d174d', border: '#f9a8d4',
        dot: '#ec4899', canModify: true, canWithdraw: true, needsWorkflow: true,
        icon: '⏸️', description: 'Withheld by IE'
    },
    'Cancelled': {
        bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5',
        dot: '#ef4444', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '❌', description: 'Call cancelled'
    },
    'Locked': {
        bg: '#f0fdf4', color: '#166534', border: '#86efac',
        dot: '#16a34a', canModify: false, canWithdraw: false, needsWorkflow: false,
        icon: '✅', description: 'Moved to Verified & Locked Calls'
    },
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CALLS = [
    {
        id: 1, callNo: 'IC/SLP/2026/001', poNo: 'PO/RDSO/SLP/2025/001',
        srNo: '1', callDate: '10/03/2026', sleeperType: 'RT-8746',
        qtyOffered: 500, batches: 2, ieName: null, scheduledDate: null,
        status: 'Call Raised',
        history: [{ action: 'Call Raised', date: '10/03/2026', by: 'Vendor', note: 'Initial submission' }]
    },
    {
        id: 2, callNo: 'IC/SLP/2026/002', poNo: 'PO/RDSO/SLP/2025/001',
        srNo: '2', callDate: '08/03/2026', sleeperType: 'RT-8746',
        qtyOffered: 320, batches: 1, ieName: null, scheduledDate: null,
        status: 'Returned by Call Desk',
        returnReason: 'Incorrect batch details submitted. Please verify and resubmit.',
        history: [
            { action: 'Call Raised', date: '08/03/2026', by: 'Vendor', note: 'Initial submission' },
            { action: 'Returned by Call Desk', date: '09/03/2026', by: 'Call Desk', note: 'Incorrect batch details submitted.' }
        ]
    },
    {
        id: 3, callNo: 'IC/SLP/2026/003', poNo: 'PO/ECoR/BBS/2024/112',
        srNo: '1', callDate: '11/03/2026', sleeperType: 'PSC-60KG',
        qtyOffered: 200, batches: 1, ieName: null, scheduledDate: null,
        status: 'Resubmitted',
        history: [
            { action: 'Call Raised', date: '06/03/2026', by: 'Vendor', note: 'Initial submission' },
            { action: 'Returned by Call Desk', date: '07/03/2026', by: 'Call Desk', note: 'Missing cast date for batch.' },
            { action: 'Resubmitted', date: '11/03/2026', by: 'Vendor', note: 'Updated batch information and resubmitted.' }
        ]
    },
    {
        id: 4, callNo: 'IC/SLP/2026/004', poNo: 'PO/SER/KGP/2025/045',
        srNo: '1', callDate: '05/03/2026', sleeperType: 'PSC-60KG',
        qtyOffered: 450, batches: 2, ieName: 'Er. Ramesh Kumar (IE/RDSO)', scheduledDate: null,
        status: 'Call Assigned to IE',
        history: [
            { action: 'Call Raised', date: '05/03/2026', by: 'Vendor', note: 'Initial submission' },
            { action: 'Call Assigned to IE', date: '06/03/2026', by: 'Call Desk', note: 'Assigned to Er. Ramesh Kumar' }
        ]
    },
    {
        id: 5, callNo: 'IC/SLP/2026/005', poNo: 'PO/ECoR/BBS/2024/112',
        srNo: '2', callDate: '01/03/2026', sleeperType: 'RT-8746',
        qtyOffered: 600, batches: 3, ieName: 'Er. Priya Nair (IE/SER)', scheduledDate: '18/03/2026',
        status: 'Scheduled by IE',
        history: [
            { action: 'Call Raised', date: '01/03/2026', by: 'Vendor', note: 'Initial submission' },
            { action: 'Call Assigned to IE', date: '02/03/2026', by: 'Call Desk', note: 'Assigned to Er. Priya Nair' },
            { action: 'Scheduled by IE', date: '04/03/2026', by: 'IE', note: 'Scheduled for 18/03/2026' }
        ]
    },
    {
        id: 6, callNo: 'IC/SLP/2026/006', poNo: 'PO/RDSO/SLP/2025/001',
        srNo: '1', callDate: '25/02/2026', sleeperType: 'RT-8746',
        qtyOffered: 350, batches: 2, ieName: 'Er. Sunil Mehta (IE/ECoR)', scheduledDate: '13/03/2026',
        status: 'Under Inspection',
        history: [
            { action: 'Call Raised', date: '25/02/2026', by: 'Vendor', note: 'Initial submission' },
            { action: 'Call Assigned to IE', date: '26/02/2026', by: 'Call Desk', note: 'Assigned to Er. Sunil Mehta' },
            { action: 'Scheduled by IE', date: '28/02/2026', by: 'IE', note: 'Scheduled for 13/03/2026' },
            { action: 'Under Inspection', date: '13/03/2026', by: 'IE', note: 'Inspection initiated on site' }
        ]
    },
    {
        id: 7, callNo: 'IC/SLP/2026/007', poNo: 'PO/ECoR/BBS/2024/112',
        srNo: '3', callDate: '20/02/2026', sleeperType: 'RT-8746',
        qtyOffered: 280, batches: 1, ieName: 'Er. Priya Nair (IE/SER)', scheduledDate: '05/03/2026',
        status: 'Withheld',
        history: [
            { action: 'Call Raised', date: '20/02/2026', by: 'Vendor', note: 'Initial submission' },
            { action: 'Call Assigned to IE', date: '21/02/2026', by: 'Call Desk', note: 'Assigned to Er. Priya Nair' },
            { action: 'Scheduled by IE', date: '22/02/2026', by: 'IE', note: 'Scheduled for 05/03/2026' },
            { action: 'Withheld', date: '05/03/2026', by: 'IE', note: 'Withheld pending raw material verification' }
        ]
    },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, scheduledDate }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Call Raised'];
    const label = (status === 'Scheduled by IE' && scheduledDate)
        ? `Scheduled (${scheduledDate})` : status;
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
const CallDetailPopup = ({ call, onClose, onModify, onWithdraw, onResubmit, onDownload }) => {
    const [activeTab, setActiveTab] = useState('details');
    if (!call) return null;
    const cfg = STATUS_CONFIG[call.status] || {};
    const isReturned = call.status === 'Returned by Call Desk';
    const locked = call.status === 'Under Inspection' || call.status === 'Cancelled' || call.status === 'Locked';
    const statusLabel = (call.status === 'Scheduled by IE' && call.scheduledDate)
        ? `Scheduled (${call.scheduledDate})` : (call.status === 'Locked' ? 'Verified & Locked' : call.status);

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(13,59,63,0.72)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 5000, backdropFilter: 'blur(6px)', padding: 16
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
                    padding: '18px 24px 0', flexShrink: 0
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
                            { label: 'Qty Offered', value: `${(Number(call.qtyOffered) || 0).toLocaleString()} Nos.` },
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
                <div style={{ overflowY: 'auto', flex: 1, padding: '22px 24px' }}>

                    {/* TAB: Details & History */}
                    {activeTab === 'details' && (
                        <div>
                            {/* Return reason banner */}
                            {isReturned && call.returnReason && (
                                <div style={{
                                    background: '#fff7ed', border: '1.5px solid #fed7aa',
                                    borderRadius: 10, padding: '12px 16px', marginBottom: 18,
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
                                    borderRadius: 10, padding: '12px 16px', marginBottom: 18,
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                            {/* Download Call Letter — always available */}
                            <div style={{
                                border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 18px',
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

                            {/* Resubmit — only when Returned by Call Desk */}
                            {isReturned && (
                                <div style={{
                                    border: '1.5px solid #fed7aa', borderRadius: 12, padding: '16px 18px',
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
                            {cfg.canModify && !locked && (
                                <div style={{
                                    border: `1.5px solid ${cfg.needsWorkflow ? '#fde68a' : '#bfdbfe'}`,
                                    borderRadius: 12, padding: '16px 18px',
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
                            {cfg.canWithdraw && !locked && (
                                <div style={{
                                    border: `1.5px solid ${cfg.needsWorkflow ? '#fde68a' : '#fca5a5'}`,
                                    borderRadius: 12, padding: '16px 18px',
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

                            {/* Locked state */}
                            {locked && (
                                <div style={{
                                    border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '24px 18px',
                                    background: '#f8fafc', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 4 }}>No Actions Available</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                        This call is <strong>{call.status}</strong>. Modifications and withdrawals are not permitted at this stage.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Workflow Confirmation Modal ──────────────────────────────────────────────
const WorkflowModal = ({ call, actionType, onConfirm, onClose }) => {
    const [reason, setReason] = useState('');
    if (!call) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 6000, backdropFilter: 'blur(4px)', padding: 16
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
                <div style={{ padding: '20px 24px' }}>
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
        </div>
    );
};

// ─── Withdraw Confirm Modal (no-workflow) ─────────────────────────────────────
const WithdrawSimpleModal = ({ call, onConfirm, onClose }) => {
    if (!call) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 6000, backdropFilter: 'blur(4px)', padding: 16
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
                boxShadow: '0 20px 48px rgba(0,0,0,0.22)', overflow: 'hidden'
            }}>
                <div style={{ padding: '24px 26px' }}>
                    <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
                    <h3 style={{ margin: '0 0 8px', textAlign: 'center', color: '#0f172a', fontWeight: 800 }}>Withdraw Call?</h3>
                    <p style={{ margin: '0 0 20px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                        Are you sure you want to withdraw <strong>{call.callNo}</strong>? This action will remove the call from the queue.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button onClick={onClose} style={{
                            padding: '8px 22px', borderRadius: 8, border: '1.5px solid #cbd5e1',
                            background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                        }}>Cancel</button>
                        <button onClick={() => onConfirm(call)} style={{
                            padding: '8px 22px', borderRadius: 8, border: 'none',
                            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer'
                        }}>Yes, Withdraw</button>
                    </div>
                </div>
            </div>
        </div>
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
const CallsRequestedDashboard = ({ inspectionCalls: propCalls }) => {
    const [calls, setCalls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedCall, setSelectedCall] = useState(null);
    const [workflowModal, setWorkflowModal] = useState(null);
    const [withdrawSimpleModal, setWithdrawSimpleModal] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchCalls = async () => {
            setIsLoading(true);
            try {
                // Fetch calls for the logged-in user
                const userId = sessionStorage.getItem('userId') || 118;
                const data = await apiService.getVendorInspectionCalls(userId);
                const mappedCalls = data.map(c => {
                    const status = c.status === "Pending for verification" ? "Call Raised" : (c.status || "Call Raised");
                    return {
                        id: c.id,
                        callNo: c.callNo || `IC/SLP/${c.id}`,
                        poNo: c.poNo,
                        srNo: c.srNo,
                        callDate: c.callDate,
                        sleeperType: c.sleeperType,
                        qtyOffered: c.qtyOffered || 0,
                        batches: c.batches || 0,
                        ieName: null,
                        scheduledDate: null,
                        status: status,
                        history: [{ action: status, date: c.callDate, by: 'Vendor', note: 'Initial submission' }]
                    };
                });
                // Sort by ID descending (newest first)
                setCalls(mappedCalls.sort((a, b) => b.id - a.id));
            } catch (err) {
                console.error("Failed to load inspection calls", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCalls();
    }, []);

    // Merge in prop calls from PO Assigned raise
    const allCalls = [
        ...(propCalls || []).map(c => ({
            id: c.id + 1000,
            callNo: `IC/SLP/2026/${String(c.id + 10).padStart(3, '0')}`,
            poNo: c.poNo, srNo: c.srNo,
            callDate: new Date().toLocaleDateString('en-IN'),
            sleeperType: c.sleeperType,
            qtyOffered: Number(c.totalOffered) || 0,
            batches: Number(c.batchesSelected) || 0,
            ieName: null, scheduledDate: null,
            status: 'Call Raised',
            history: [{ action: 'Call Raised', date: new Date().toLocaleDateString('en-IN'), by: 'Vendor', note: 'Raised via PO Assigned module' }]
        })),
        ...calls
    ];

    const ACTIVE_STATUSES = ['Call Raised', 'Returned by Call Desk', 'Resubmitted', 'Call Assigned to IE', 'Scheduled by IE', 'Under Inspection', 'Withheld'];
    const displayCalls = allCalls.filter(c => ACTIVE_STATUSES.includes(c.status));

    const statusCounts = {};
    Object.keys(STATUS_CONFIG).forEach(s => {
        statusCounts[s] = allCalls.filter(c => c.status === s).length;
    });

    const filtered = filterStatus === 'All'
        ? displayCalls
        : displayCalls.filter(c => c.status === filterStatus);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleModify = (call) => {
        const cfg = STATUS_CONFIG[call.status];
        if (cfg?.needsWorkflow) {
            setWorkflowModal({ call, actionType: 'modify' });
        } else {
            showToast(`Modification form for ${call.callNo} would open here.`, 'info');
        }
    };

    const handleWithdraw = (call) => {
        const cfg = STATUS_CONFIG[call.status];
        if (cfg?.needsWorkflow) {
            setWorkflowModal({ call, actionType: 'withdraw' });
        } else {
            setWithdrawSimpleModal(call);
        }
    };

    const handleResubmit = (call) => {
        setCalls(prev => prev.map(c => {
            if (c.id !== call.id) return c;
            const today = new Date().toLocaleDateString('en-IN');
            return {
                ...c,
                status: 'Resubmitted',
                callDate: today,
                history: [
                    ...c.history,
                    { action: 'Resubmitted', date: today, by: 'Vendor', note: 'Rectified and resubmitted after Call Desk return.' }
                ]
            };
        }));
        showToast(`${call.callNo} has been resubmitted. Call date updated to today.`);
    };

    const handleWorkflowConfirm = (call, actionType) => {
        setWorkflowModal(null);
        showToast(`Workflow request for ${actionType === 'modify' ? 'modification' : 'withdrawal'} of ${call.callNo} submitted for approval.`, 'info');
    };

    const handleWithdrawConfirm = (call) => {
        setCalls(prev => prev.filter(c => c.id !== call.id));
        setWithdrawSimpleModal(null);
        showToast(`${call.callNo} has been withdrawn successfully.`);
    };

    const FILTER_TABS = [
        { key: 'All', color: '#21808d' },
        { key: 'Call Raised', color: '#3b82f6' },
        { key: 'Returned by Call Desk', color: '#f97316' },
        { key: 'Resubmitted', color: '#eab308' },
        { key: 'Call Assigned to IE', color: '#22c55e' },
        { key: 'Scheduled by IE', color: '#8b5cf6' },
        { key: 'Under Inspection', color: '#10b981' },
        { key: 'Withheld', color: '#ec4899' },
    ];

    return (
        <div className="fade-in">
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
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
                        { label: 'Pending for verification', val: (statusCounts['Call Raised'] || 0) + (statusCounts['Resubmitted'] || 0), bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
                        { label: 'Needs Action', val: statusCounts['Returned by Call Desk'] || 0, bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
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
                        label={tab.key === 'All' ? 'All Active' : tab.key}
                        count={tab.key === 'All' ? displayCalls.length : (statusCounts[tab.key] || 0)}
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
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Loading inspection calls...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>No calls with status "{filterStatus}"</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Try selecting a different filter above.</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                            <thead>
                                <tr style={{ background: '#fdf8e6', borderBottom: '2px solid #e2e8f0' }}>
                                    {['Call Details', 'PO Reference', 'Sleeper Info', 'IE / Schedule', 'Status', 'Action'].map(h => (
                                        <th key={h} style={{
                                            padding: '12px 16px', fontSize: 10, fontWeight: 800,
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
                                            key={call.id}
                                            style={{
                                                borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid #f1f5f9',
                                                background: isReturned ? '#fff9f5' : (idx % 2 === 0 ? '#fff' : '#fafcff'),
                                                transition: 'background 0.15s'
                                            }}
                                        >
                                            {/* Call Details */}
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{call.callNo}</div>
                                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Raised: {call.callDate}</div>
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
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: 600, fontSize: 12, color: '#334155' }}>{call.poNo}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>SR. No. {call.srNo}</div>
                                            </td>

                                            {/* Sleeper Info */}
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: 700, fontSize: 12, color: '#7c3aed' }}>{call.sleeperType}</div>
                                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{(Number(call.qtyOffered) || 0).toLocaleString()} Nos.</div>
                                                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{call.batches} batch{call.batches !== 1 ? 'es' : ''}</div>
                                            </td>

                                            {/* IE / Schedule */}
                                            <td style={{ padding: '14px 16px' }}>
                                                {call.ieName ? (
                                                    <>
                                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#15803d' }}>👷 {call.ieName}</div>
                                                        {call.scheduledDate && (
                                                            <div style={{ fontSize: 11, color: '#6d28d9', marginTop: 3, fontWeight: 600 }}>📅 {call.scheduledDate}</div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: '14px 16px', minWidth: 200 }}>
                                                <StatusBadge status={call.status} scheduledDate={call.scheduledDate} />
                                            </td>

                                            {/* View Button */}
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
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
                    onDownload={(c) => showToast(`Call letter for ${c.callNo} downloading...`, 'info')}
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
