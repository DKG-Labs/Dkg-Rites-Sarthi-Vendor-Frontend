import React, { useState, useMemo } from 'react';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_BATCHES = {
    'RT-8746': [
        {
            batchNo: '2025/A/14',
            date: '2026-01-12',
            totalCast: 120,
            goodSleepers: 108,
            badSleepers: 12,
            sleeperIds: Array.from({ length: 108 }, (_, i) => `2025/A/14/${String.fromCharCode(65 + Math.floor(i / 26))}${i + 1}`)
        },
        {
            batchNo: '2025/B/22',
            date: '2026-01-18',
            totalCast: 200,
            goodSleepers: 185,
            badSleepers: 15,
            sleeperIds: Array.from({ length: 185 }, (_, i) => `2025/B/22/${String.fromCharCode(65 + Math.floor(i / 26))}${i + 1}`)
        },
        {
            batchNo: '2025/C/07',
            date: '2026-01-25',
            totalCast: 150,
            goodSleepers: 143,
            badSleepers: 7,
            sleeperIds: Array.from({ length: 143 }, (_, i) => `2025/C/07/${String.fromCharCode(65 + Math.floor(i / 26))}${i + 1}`)
        },
    ],
    'PSC-60KG': [
        {
            batchNo: '2025/D/03',
            date: '2026-01-10',
            totalCast: 90,
            goodSleepers: 88,
            badSleepers: 2,
            sleeperIds: Array.from({ length: 88 }, (_, i) => `2025/D/03/${String.fromCharCode(65 + Math.floor(i / 26))}${i + 1}`)
        },
    ]
};

const SLEEPER_TYPES = ['RT-8746', 'PSC-60KG'];

// ─── Sub-Components ───────────────────────────────────────────────────────────
const SectionHeader = ({ label, step, color = '#21808d' }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 16, paddingBottom: 10,
        borderBottom: `2px solid ${color}22`
    }}>
        <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, flexShrink: 0
        }}>{step}</div>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', letterSpacing: '0.02em' }}>
            {label}
        </span>
    </div>
);

const StatBox = ({ label, value, highlight }) => (
    <div style={{
        background: highlight ? '#fef2f2' : '#f8fafc',
        border: `1px solid ${highlight ? '#fca5a5' : '#e2e8f0'}`,
        borderRadius: 10, padding: '10px 14px', minWidth: 120,
    }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{
            fontSize: 20, fontWeight: 800,
            color: highlight ? '#dc2626' : '#0f172a', lineHeight: 1
        }}>{value}</div>
    </div>
);

// ─── Main Form ────────────────────────────────────────────────────────────────
const RaiseInspectionCallForm = ({ srItem, poNo, onClose, onSubmitInspectionCall }) => {
    const callDate = new Date().toLocaleDateString('en-IN');

    // Section B state
    const [sleeperType, setSleeperType] = useState('');
    const [batchSelections, setBatchSelections] = useState({}); // { batchNo: { mode: 'all'|'partial'|'none', selected: Set<id> } }
    const [expandedBatch, setExpandedBatch] = useState(null);

    const batches = sleeperType ? (MOCK_BATCHES[sleeperType] || []) : [];

    // ── Computed Summary ──────────────────────────────────────────────────────
    const summary = useMemo(() => {
        let batchesTouched = 0;
        let totalCast = 0;
        let totalBad = 0;
        let totalOffered = 0;

        batches.forEach(b => {
            const sel = batchSelections[b.batchNo];
            if (!sel || sel.mode === 'none') return;
            batchesTouched++;
            totalCast += b.totalCast;
            totalBad += b.badSleepers;
            if (sel.mode === 'all') totalOffered += b.goodSleepers;
            else totalOffered += sel.selected.size;
        });

        const due = srItem.due;
        const exceedsCap = totalOffered > due;
        const afterOffering = due - totalOffered;

        return { batchesTouched, totalCast, totalBad, totalOffered, exceedsCap, afterOffering };
    }, [batchSelections, batches, srItem]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleOfferAll = (batchNo, goodSleepers, sleeperIds) => {
        setBatchSelections(prev => ({
            ...prev,
            [batchNo]: { mode: 'all', selected: new Set(sleeperIds.slice(0, goodSleepers)) }
        }));
    };

    const handleClearBatch = (batchNo) => {
        setBatchSelections(prev => ({ ...prev, [batchNo]: { mode: 'none', selected: new Set() } }));
    };

    const handleToggleSleeper = (batchNo, sleeperId, sleeperIds, goodSleepers) => {
        setBatchSelections(prev => {
            const cur = prev[batchNo] || { mode: 'partial', selected: new Set() };
            const newSet = new Set(cur.selected);
            if (newSet.has(sleeperId)) newSet.delete(sleeperId);
            else newSet.add(sleeperId);
            return {
                ...prev,
                [batchNo]: { mode: newSet.size === goodSleepers ? 'all' : 'partial', selected: newSet }
            };
        });
    };

    const handleToggleExpand = (batchNo) => {
        setExpandedBatch(prev => prev === batchNo ? null : batchNo);
        // Ensure partial mode entry if not already set
        setBatchSelections(prev => {
            if (!prev[batchNo]) return { ...prev, [batchNo]: { mode: 'partial', selected: new Set() } };
            return prev;
        });
    };

    const getBatchMode = (batchNo) => batchSelections[batchNo]?.mode || 'none';
    const getBatchSelected = (batchNo) => batchSelections[batchNo]?.selected || new Set();

    // ── Styles ────────────────────────────────────────────────────────────────
    const overlayStyle = {
        position: 'fixed', inset: 0,
        background: 'rgba(13,59,63,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 3000, backdropFilter: 'blur(6px)', padding: '16px'
    };
    const modalStyle = {
        background: '#fff', borderRadius: 16,
        width: '100%', maxWidth: 860,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden',
        animation: 'modalFadeIn 0.25s ease-out'
    };

    return (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={modalStyle}>
                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
                    padding: '18px 24px', flexShrink: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>
                            RAISE FINAL INSPECTION CALL
                        </div>
                        <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>
                            {poNo} — SR. No. {srItem.srNo}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>
                            {srItem.description}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none',
                        color: '#fff', borderRadius: '50%', width: 34, height: 34,
                        fontSize: 18, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>×</button>
                </div>

                {/* ── Scrollable Body ── */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px 0' }}>

                    {/* ════ SECTION A ════ */}
                    <div style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 12, padding: '18px 20px', marginBottom: 20
                    }}>
                        <SectionHeader step="A" label="Call Header & PO Statistics (Auto-Fetched)" color="#21808d" />

                        {/* Call info row */}
                        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 3 }}>PO NO.</div>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{poNo}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: 120 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 3 }}>SR. NO.</div>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{srItem.srNo}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: 120 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 3 }}>CALL DATE</div>
                                <div style={{ fontWeight: 700, color: '#21808d', fontSize: 14 }}>{callDate}</div>
                            </div>
                        </div>

                        {/* PO Status Tracker */}
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            PO Status Tracker
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <StatBox label="Quantity on Order" value={srItem.ordered.toLocaleString()} />
                            <StatBox label="Offered Till Now" value={srItem.offeredTillNow.toLocaleString()} />
                            <StatBox label="Accepted Till Now" value={srItem.acceptedTillNow.toLocaleString()} />
                            <StatBox label="Rejected Till Now" value={srItem.rejectedTillNow.toLocaleString()} />
                            <StatBox label="Sleepers Due for Dispatch" value={srItem.due.toLocaleString()} highlight={srItem.due === 0} />
                        </div>
                    </div>

                    {/* ════ SECTION B ════ */}
                    <div style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 12, padding: '18px 20px', marginBottom: 20
                    }}>
                        <SectionHeader step="B" label="Sleeper Type & Granular Batch Selection" color="#7c3aed" />

                        {/* Sleeper Type Dropdown */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Sleeper Type <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <select
                                value={sleeperType}
                                onChange={e => { setSleeperType(e.target.value); setBatchSelections({}); setExpandedBatch(null); }}
                                style={{
                                    width: '100%', maxWidth: 280, height: 42, padding: '0 14px',
                                    border: '1.5px solid #cbd5e1', borderRadius: 8,
                                    fontSize: 14, fontWeight: 600, color: '#0f172a',
                                    background: '#fff', cursor: 'pointer'
                                }}
                            >
                                <option value="">— Select Sleeper Type —</option>
                                {SLEEPER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Batch Grid */}
                        {sleeperType && batches.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>
                                No eligible batches found for {sleeperType}
                            </div>
                        )}

                        {sleeperType && batches.map(batch => {
                            const mode = getBatchMode(batch.batchNo);
                            const selected = getBatchSelected(batch.batchNo);
                            const isExpanded = expandedBatch === batch.batchNo;
                            const isActive = mode !== 'none';

                            return (
                                <div key={batch.batchNo} style={{
                                    border: `1.5px solid ${isActive ? '#21808d' : '#e2e8f0'}`,
                                    borderRadius: 10, marginBottom: 12, overflow: 'hidden',
                                    background: isActive ? 'rgba(33,128,141,0.03)' : '#fff',
                                    transition: 'all 0.2s'
                                }}>
                                    {/* Batch Row */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 100px 90px 90px auto',
                                        gap: 8, alignItems: 'center',
                                        padding: '12px 16px', flexWrap: 'wrap'
                                    }}>
                                        {/* Batch info */}
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                                                {isActive && <span style={{ color: '#21808d', marginRight: 6 }}>✓</span>}
                                                Batch {batch.batchNo}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                Cast: {batch.date}
                                            </div>
                                        </div>
                                        {/* Stats */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>TOTAL CAST</div>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{batch.totalCast}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>GOOD</div>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: '#166534' }}>{batch.goodSleepers}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>BAD</div>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: '#dc2626' }}>{batch.badSleepers}</div>
                                        </div>
                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                                            <button
                                                onClick={() => mode === 'all' ? handleClearBatch(batch.batchNo) : handleOfferAll(batch.batchNo, batch.goodSleepers, batch.sleeperIds)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: 20, fontSize: 11,
                                                    fontWeight: 700, cursor: 'pointer', border: 'none',
                                                    background: mode === 'all' ? '#21808d' : '#f0f9fa',
                                                    color: mode === 'all' ? '#fff' : '#21808d',
                                                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {mode === 'all' ? '✓ All Offered' : 'Offer All'}
                                            </button>
                                            <button
                                                onClick={() => handleToggleExpand(batch.batchNo)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: 20, fontSize: 11,
                                                    fontWeight: 700, cursor: 'pointer',
                                                    border: '1.5px solid #e2e8f0',
                                                    background: isExpanded ? '#f0f7ff' : '#fff',
                                                    color: isExpanded ? '#2563eb' : '#475569',
                                                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {isExpanded ? '▲ Collapse' : `▼ Offer Selected${mode === 'partial' && selected.size > 0 ? ` (${selected.size})` : ''}`}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Sleeper List */}
                                    {isExpanded && (
                                        <div style={{
                                            borderTop: '1px solid #e2e8f0',
                                            padding: '12px 16px',
                                            background: '#fff'
                                        }}>
                                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 10 }}>
                                                SELECT INDIVIDUAL SLEEPERS — {selected.size} of {batch.goodSleepers} selected
                                            </div>
                                            <div style={{
                                                maxHeight: 200, overflowY: 'auto',
                                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                                gap: 6
                                            }}>
                                                {batch.sleeperIds.slice(0, batch.goodSleepers).map(sid => (
                                                    <label key={sid} style={{
                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                        cursor: 'pointer', padding: '4px 8px',
                                                        borderRadius: 6, fontSize: 11, fontWeight: 500,
                                                        background: selected.has(sid) ? 'rgba(33,128,141,0.08)' : '#f8fafc',
                                                        border: `1px solid ${selected.has(sid) ? '#21808d' : '#e2e8f0'}`,
                                                        color: '#0f172a', transition: 'all 0.15s'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selected.has(sid)}
                                                            onChange={() => handleToggleSleeper(batch.batchNo, sid, batch.sleeperIds, batch.goodSleepers)}
                                                            style={{ width: 14, height: 14, flexShrink: 0 }}
                                                        />
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {sid}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ════ SECTION C ════ */}
                    <div style={{
                        background: summary.exceedsCap ? '#fff5f5' : '#f0fdf4',
                        border: `1.5px solid ${summary.exceedsCap ? '#fca5a5' : '#bbf7d0'}`,
                        borderRadius: 12, padding: '18px 20px', marginBottom: 20
                    }}>
                        <SectionHeader step="C" label="Combined Summary & System Validations" color={summary.exceedsCap ? '#dc2626' : '#16a34a'} />

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                            <StatBox label="Batches Touched" value={summary.batchesTouched} />
                            <StatBox label="Combined Total Cast" value={summary.totalCast.toLocaleString()} />
                            <StatBox label="Combined Bad Sleepers" value={summary.totalBad.toLocaleString()} />
                            <StatBox
                                label="Total Good Offered (This Call)"
                                value={summary.totalOffered.toLocaleString()}
                                highlight={summary.exceedsCap}
                            />
                        </div>

                        {/* Validation Banner */}
                        {summary.exceedsCap ? (
                            <div style={{
                                background: '#fef2f2', border: '1px solid #fca5a5',
                                borderRadius: 8, padding: '10px 14px', fontSize: 12,
                                color: '#dc2626', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center'
                            }}>
                                <span style={{ fontSize: 16 }}>⚠️</span>
                                Offered quantity ({summary.totalOffered}) cannot exceed sleepers due for dispatch ({srItem.due}). Please reduce your selection.
                            </div>
                        ) : summary.totalOffered > 0 ? (
                            <div style={{
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                borderRadius: 8, padding: '10px 14px', fontSize: 12,
                                color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
                            }}>
                                <span>✓ Quantity within valid range</span>
                                <span style={{ fontWeight: 700 }}>
                                    Sleepers Due After This Offering: <span style={{ fontSize: 15 }}>{summary.afterOffering.toLocaleString()}</span>
                                </span>
                            </div>
                        ) : (
                            <div style={{
                                background: '#f1f5f9', border: '1px solid #e2e8f0',
                                borderRadius: 8, padding: '10px 14px', fontSize: 12,
                                color: '#64748b', fontWeight: 500
                            }}>
                                Select batches or individual sleepers in Section B to populate the summary.
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: '14px 24px', background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0', flexShrink: 0,
                    display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center'
                }}>
                    <div style={{ flex: 1, fontSize: 11, color: '#94a3b8' }}>
                        {summary.totalOffered > 0
                            ? `${summary.totalOffered.toLocaleString()} sleeper(s) from ${summary.batchesTouched} batch(es) selected`
                            : 'No sleepers selected yet'}
                    </div>
                    <button onClick={onClose} style={{
                        padding: '9px 22px', borderRadius: 8, border: '1.5px solid #cbd5e1',
                        background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                    }}>
                        Cancel
                    </button>
                    <button
                        disabled={summary.totalOffered === 0 || summary.exceedsCap || !sleeperType}
                        onClick={() => {
                            if (onSubmitInspectionCall) {
                                onSubmitInspectionCall({
                                    poNo,
                                    srNo: srItem.srNo,
                                    sleeperType,
                                    totalOffered: summary.totalOffered,
                                    batchesTouched: summary.batchesTouched,
                                });
                            } else {
                                alert(`✅ Inspection Call submitted!\n\nPO: ${poNo} | SR: ${srItem.srNo}\nSleepers Offered: ${summary.totalOffered}\nBatches: ${summary.batchesTouched}\n\nThis call has been pushed to the IE Dashboard.`);
                            }
                            onClose();
                        }}
                        style={{
                            padding: '9px 24px', borderRadius: 8, border: 'none',
                            background: (summary.totalOffered === 0 || summary.exceedsCap || !sleeperType)
                                ? '#e2e8f0' : 'linear-gradient(135deg, #21808d, #0d3b3f)',
                            color: (summary.totalOffered === 0 || summary.exceedsCap || !sleeperType) ? '#94a3b8' : '#fff',
                            fontWeight: 700, fontSize: 13, cursor:
                                (summary.totalOffered === 0 || summary.exceedsCap || !sleeperType) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Submit Inspection Call
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RaiseInspectionCallForm;
