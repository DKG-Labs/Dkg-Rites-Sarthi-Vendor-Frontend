import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../../services/api';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_BATCHES = {
    'RT8746': [
        {
            batchNo: '2025/A/14',
            castDate: '2026-01-12',
            totalCasted: 120,
            castedAsType: 'RT8746',
            previouslyOffered: 30,
            goodSleepers: 108,
            badSleepers: 12,
            // Good sleeper IDs
            goodSleeperIds: Array.from({ length: 108 }, (_, i) => `2025/A/14/G${i + 1}`),
            // Bad sleeper IDs
            badSleeperIds: Array.from({ length: 12 }, (_, i) => `2025/A/14/B${i + 1}`),
        },
        {
            batchNo: '2025/B/22',
            castDate: '2026-01-18',
            totalCasted: 200,
            castedAsType: 'RT8746',
            previouslyOffered: 50,
            goodSleepers: 185,
            badSleepers: 15,
            goodSleeperIds: Array.from({ length: 185 }, (_, i) => `2025/B/22/G${i + 1}`),
            badSleeperIds: Array.from({ length: 15 }, (_, i) => `2025/B/22/B${i + 1}`),
        },
        {
            batchNo: '2025/C/07',
            castDate: '2026-01-25',
            totalCasted: 150,
            castedAsType: 'RT8746',
            previouslyOffered: 10,
            goodSleepers: 143,
            badSleepers: 7,
            goodSleeperIds: Array.from({ length: 143 }, (_, i) => `2025/C/07/G${i + 1}`),
            badSleeperIds: Array.from({ length: 7 }, (_, i) => `2025/C/07/B${i + 1}`),
        },
    ],
    'RT-8521': [
        {
            batchNo: '2025/D/03',
            castDate: '2026-01-10',
            totalCasted: 90,
            castedAsType: 'RT-8521',
            previouslyOffered: 5,
            goodSleepers: 88,
            badSleepers: 2,
            goodSleeperIds: Array.from({ length: 88 }, (_, i) => `2025/D/03/G${i + 1}`),
            badSleeperIds: Array.from({ length: 2 }, (_, i) => `2025/D/03/B${i + 1}`),
        },
    ],
    'RT-8746 (PnC)': []
};

const SLEEPER_TYPES = ['RT-8746', 'RT-2496'];

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

const StatBox = ({ label, value, highlight, color }) => (
    <div style={{
        background: highlight ? '#fef2f2' : '#f8fafc',
        border: `1px solid ${highlight ? '#fca5a5' : '#e2e8f0'}`,
        borderRadius: 10, padding: '10px 14px', minWidth: 130, flex: '1 1 130px',
    }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{
            fontSize: 20, fontWeight: 800,
            color: color || (highlight ? '#dc2626' : '#0f172a'), lineHeight: 1
        }}>{value}</div>
    </div>
);

// ─── Main Form ────────────────────────────────────────────────────────────────
const RaiseInspectionCallForm = ({ srItem, poNo, onClose, onSubmitInspectionCall }) => {
    const callDate = new Date().toLocaleDateString('en-IN');

    // Section B state
    const [sleeperType, setSleeperType] = useState(SLEEPER_TYPES[0]);
    const [batches, setBatches] = useState([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);
    const [batchSelections, setBatchSelections] = useState({}); // { batchNo: { goodSelected: Set<id>, badIncluded: boolean } }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedBatch, setExpandedBatch] = useState(null);

    useEffect(() => {
        if (!sleeperType) {
            setBatches([]);
            return;
        }

        const fetchBatches = async () => {
            setIsLoadingBatches(true);
            try {
                const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
                const currentPlantId = selectedPlant ? selectedPlant.plantId : null;

                const data = await apiService.getCompletedBatches(sleeperType);
                
                const filteredData = currentPlantId 
                    ? data.filter(b => !b.plantId || String(b.plantId) === String(currentPlantId))
                    : data;

                const mappedBatches = filteredData.map(b => {
                    const goodList = (b.goodSleepers || []).filter(s => s.callRaised !== true && s.callRaised !== "true");
                    const badList = (b.badSleepers || []).filter(s => s.callRaised !== true && s.callRaised !== "true");

                    const uniqueGood = Array.from(new Set(goodList.map(s => (s.sleeperNo ? String(s.sleeperNo).trim() : s.sleeperId.toString()))));
                    const uniqueBad = Array.from(new Set(badList.map(s => (s.sleeperNo ? String(s.sleeperNo).trim() : s.sleeperId.toString()))));
                    
                    return {
                        batchNo: b.batchNumber || b.batchId.toString(),
                        castDate: b.castDate || 'N/A',
                        totalCasted: b.totalSleepers || 0,
                        castedAsType: sleeperType,
                        previouslyOffered: 0, // Fallback for now
                        goodSleepers: uniqueGood.length,
                        badSleepers: uniqueBad.length,
                        goodSleeperIds: uniqueGood,
                        badSleeperIds: uniqueBad,
                        goodSleepersData: goodList,
                        badSleepersData: badList,
                        plantId: b.plantId
                    };
                });
                
                setBatches(mappedBatches);
            } catch (err) {
                console.error("Failed to fetch batches", err);
                setBatches([]);
            } finally {
                setIsLoadingBatches(false);
            }
        };

        fetchBatches();
    }, [sleeperType]);

    // Eligible for offering = goodSleepers - previouslyOffered (min 0)
    const getEligible = (batch) => Math.max(0, batch.goodSleepers - batch.previouslyOffered);

    // ── Computed Summary ──────────────────────────────────────────────────────
    const summary = useMemo(() => {
        let batchesSelected = 0;
        let totalSleeperCount = 0;
        let totalPassedCount = 0;
        let totalRejectedCount = 0;

        batches.forEach(b => {
            const sel = batchSelections[b.batchNo];
            if (!sel) return;
            const goodCount = sel.goodSelected ? sel.goodSelected.size : 0;
            const badCount = b.badSleepers; // bad sleepers always included if batch is touched
            if (goodCount === 0 && !sel.batchTouched) return;
            if (goodCount > 0 || sel.batchTouched) {
                batchesSelected++;
                totalSleeperCount += goodCount + badCount;
                totalPassedCount += goodCount;
                totalRejectedCount += badCount;
            }
        });

        const due = srItem.due !== undefined ? srItem.due : null;
        const exceedsCap = due !== null ? totalPassedCount > due : false;
        const afterOffering = due !== null ? due - totalPassedCount : null;

        return { batchesSelected, totalSleeperCount, totalPassedCount, totalRejectedCount, exceedsCap, afterOffering, due };
    }, [batchSelections, batches, srItem]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleOfferAllGood = (batchNo, batch) => {
        const eligible = getEligible(batch);
        setBatchSelections(prev => ({
            ...prev,
            [batchNo]: {
                goodSelected: new Set(batch.goodSleeperIds.slice(0, eligible)),
                batchTouched: true
            }
        }));
    };

    const handleClearBatch = (batchNo) => {
        setBatchSelections(prev => ({ ...prev, [batchNo]: { goodSelected: new Set(), batchTouched: false } }));
    };

    const handleToggleGoodSleeper = (batchNo, sleeperId) => {
        setBatchSelections(prev => {
            const cur = prev[batchNo] || { goodSelected: new Set(), batchTouched: false };
            const newSet = new Set(cur.goodSelected);
            if (newSet.has(sleeperId)) newSet.delete(sleeperId);
            else newSet.add(sleeperId);
            return {
                ...prev,
                [batchNo]: { goodSelected: newSet, batchTouched: newSet.size > 0 }
            };
        });
    };

    const handleToggleExpand = (batchNo) => {
        setExpandedBatch(prev => prev === batchNo ? null : batchNo);
        setBatchSelections(prev => {
            if (!prev[batchNo]) return { ...prev, [batchNo]: { goodSelected: new Set(), batchTouched: false } };
            return prev;
        });
    };

    const getGoodSelected = (batchNo) => batchSelections[batchNo]?.goodSelected || new Set();
    const isBatchTouched = (batchNo) => batchSelections[batchNo]?.batchTouched || false;

    // ── Styles ────────────────────────────────────────────────────────────────
    const overlayStyle = {
        position: 'fixed', inset: 0,
        background: 'rgba(13,59,63,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 3000, backdropFilter: 'blur(6px)', padding: '16px'
    };
    const modalStyle = {
        background: '#fff', borderRadius: 16,
        width: '100%', maxWidth: 1080,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden',
        animation: 'modalFadeIn 0.25s ease-out'
    };

    return createPortal(
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={modalStyle}>
                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
                    padding: '18px 28px', flexShrink: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>
                            RAISE FINAL INSPECTION CALL
                        </div>
                        <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>
                            {poNo} — SR. No. {srItem.itemSrNo || srItem.srNo || (srItem.poSerialNo ? srItem.poSerialNo.split('/').pop() : 'N/A')}
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
                <div style={{ overflowY: 'auto', flex: 1, padding: '20px 28px 0' }}>

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
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{srItem.itemSrNo || srItem.srNo || (srItem.poSerialNo ? srItem.poSerialNo.split('/').pop() : 'N/A')}</div>
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
                            <StatBox label="Quantity on Order" value={(srItem.orderedQty || srItem.ordered || 0).toLocaleString()} />
                            <StatBox label="Cumm. Qty Offered Previously" value={(srItem.offeredTillNow || 0).toLocaleString()} color="#7c3aed" />
                            <StatBox label="Qty. Passed Previously" value={(srItem.acceptedTillNow || 0).toLocaleString()} color="#16a34a" />
                            <StatBox label="Qty Pending for Verification" value={(srItem.due || 0).toLocaleString()} highlight={(srItem.due || 0) === 0} />
                        </div>
                    </div>

                    {/* ════ SECTION B ════ */}
                    <div style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 12, padding: '18px 20px', marginBottom: 20
                    }}>
                        <SectionHeader step="B" label="Sleeper Type & Granular Batch Selection" color="#7c3aed" />

                        {/* Sleeper Type — Hardcoded to RT-8746 */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Sleeper Type <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <select
                                value={sleeperType}
                                onChange={(e) => setSleeperType(e.target.value)}
                                style={{
                                    width: '100%', maxWidth: 280, height: 42, padding: '0 14px',
                                    border: '1.5px solid #21808d', borderRadius: 8,
                                    fontSize: 14, fontWeight: 700, color: '#0f172a',
                                    background: '#f0f9fa', cursor: 'pointer',
                                    outline: 'none', appearance: 'auto'
                                }}
                            >
                                {SLEEPER_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {sleeperType && (
                            <div style={{ 
                                marginBottom: 16, 
                                padding: '8px 14px', 
                                background: '#fdf8e6', 
                                border: '1.5px dashed #fcd34d', 
                                borderRadius: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                                    Casted as selected Sleeper Type:
                                </span>
                                <span style={{ 
                                    fontSize: 14, 
                                    fontWeight: 800, 
                                    color: '#7c3aed',
                                    background: '#fff',
                                    padding: '2px 10px',
                                    borderRadius: 6,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                    {sleeperType}
                                </span>
                            </div>
                        )}

                        {/* Batch Grid */}
                        {sleeperType && isLoadingBatches && (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                                Fetching completed batches...
                            </div>
                        )}

                        {sleeperType && !isLoadingBatches && batches.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>
                                No eligible batches found for {sleeperType}
                            </div>
                        )}

                        {sleeperType && !isLoadingBatches && batches.map(batch => {
                            const goodSelected = getGoodSelected(batch.batchNo);
                            const isExpanded = expandedBatch === batch.batchNo;
                            const isActive = isBatchTouched(batch.batchNo);
                            const eligible = getEligible(batch);
                            const allGoodOffered = goodSelected.size === eligible && eligible > 0;

                            return (
                                <div key={batch.batchNo} style={{
                                    border: `1.5px solid ${isActive ? '#21808d' : '#e2e8f0'}`,
                                    borderRadius: 10, marginBottom: 14, overflow: 'hidden',
                                    background: isActive ? 'rgba(33,128,141,0.03)' : '#fff',
                                    transition: 'all 0.2s'
                                }}>
                                    {/* Batch Summary Row */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.6fr 110px 130px 120px 120px auto',
                                        gap: 8, alignItems: 'center',
                                        padding: '14px 16px',
                                    }}>
                                        {/* Batch No & Cast Date */}
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {isActive && <span style={{ color: '#21808d' }}>✓</span>}
                                                Batch {batch.batchNo}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                Cast Date: {batch.castDate}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 1, fontWeight: 600 }}>
                                                Type: {batch.castedAsType}
                                            </div>
                                        </div>

                                        {/* Total Casted */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total Casted</div>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginTop: 2 }}>{batch.totalCasted}</div>
                                        </div>

                                        {/* Good / Bad */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Good / Bad</div>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                <span style={{ fontWeight: 700, fontSize: 13, color: '#166534', background: '#f0fdf4', padding: '2px 8px', borderRadius: 6 }}>
                                                    ✓ {batch.goodSleepers}
                                                </span>
                                                <span style={{ fontWeight: 700, fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: 6 }}>
                                                    ✕ {batch.badSleepers}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Previously Offered */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Previously Offered</div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#7c3aed' }}>{batch.previouslyOffered}</div>
                                        </div>

                                        {/* Eligible for Offering */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Eligible Now</div>
                                            <div style={{ fontWeight: 800, fontSize: 14, color: eligible > 0 ? '#0f172a' : '#94a3b8' }}>{eligible}</div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                                            <button
                                                disabled={eligible === 0}
                                                onClick={() => allGoodOffered ? handleClearBatch(batch.batchNo) : handleOfferAllGood(batch.batchNo, batch)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: 20, fontSize: 11,
                                                    fontWeight: 700, cursor: eligible === 0 ? 'not-allowed' : 'pointer', border: 'none',
                                                    background: allGoodOffered ? '#21808d' : (eligible === 0 ? '#f1f5f9' : '#f0f9fa'),
                                                    color: allGoodOffered ? '#fff' : (eligible === 0 ? '#94a3b8' : '#21808d'),
                                                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {allGoodOffered ? '✓ All Offered' : 'Offer All'}
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
                                                {isExpanded ? '▲ Collapse' : `▼ Select${goodSelected.size > 0 ? ` (${goodSelected.size})` : ''}`}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Sleeper List — shows GOOD & BAD both */}
                                    {isExpanded && (
                                        <div style={{
                                            borderTop: '1px solid #e2e8f0',
                                            padding: '14px 16px',
                                            background: '#fff'
                                        }}>
                                            {/* Good Sleepers */}
                                            <div style={{ marginBottom: 12 }}>
                                                <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                    ✓ Good Sleepers — {goodSelected.size} of {eligible} selected (eligible: {eligible})
                                                </div>
                                                <div style={{
                                                    maxHeight: 180, overflowY: 'auto',
                                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                                    gap: 5
                                                }}>
                                                    {batch.goodSleeperIds.map((sid, idx) => {
                                                        const isEligible = idx < eligible;
                                                        const isChecked = goodSelected.has(sid);
                                                        return (
                                                            <label key={`${sid}-idx-${idx}`} style={{
                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                                cursor: isEligible ? 'pointer' : 'not-allowed',
                                                                padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                                                                background: isChecked ? 'rgba(33,128,141,0.08)' : (isEligible ? '#f8fafc' : '#f1f5f9'),
                                                                border: `1px solid ${isChecked ? '#21808d' : '#e2e8f0'}`,
                                                                color: isEligible ? '#0f172a' : '#94a3b8',
                                                                transition: 'all 0.15s', opacity: isEligible ? 1 : 0.5
                                                            }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    disabled={!isEligible}
                                                                    onChange={() => isEligible && handleToggleGoodSleeper(batch.batchNo, sid)}
                                                                    style={{ width: 13, height: 13, flexShrink: 0 }}
                                                                />
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {sid}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Bad Sleepers — pre-selected, cannot be unselected */}
                                            {batch.badSleepers > 0 && (
                                                <div>
                                                    <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        ✕ Bad Sleepers — {batch.badSleepers} (always included, cannot be deselected)
                                                    </div>
                                                    <div style={{
                                                        maxHeight: 120, overflowY: 'auto',
                                                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                                        gap: 5
                                                    }}>
                                                        {batch.badSleeperIds.map((sid, idx) => (
                                                            <label key={`${sid}-idx-${idx}`} style={{
                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                                cursor: 'not-allowed',
                                                                padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                                                                background: 'rgba(220,38,38,0.06)',
                                                                border: '1px solid #fca5a5',
                                                                color: '#dc2626', transition: 'all 0.15s'
                                                            }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={true}
                                                                    disabled={true}
                                                                    readOnly
                                                                    style={{ width: 13, height: 13, flexShrink: 0, accentColor: '#dc2626' }}
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
                            <StatBox label="Batches Selected for Offering" value={summary.batchesSelected} />
                            <StatBox label="Sleepers Selected for Offering" value={summary.totalSleeperCount.toLocaleString()} />
                            <StatBox
                                label="No. of Passed Sleepers"
                                value={summary.totalPassedCount.toLocaleString()}
                                color="#16a34a"
                                highlight={summary.exceedsCap}
                            />
                            <StatBox
                                label="No. of Rejected Sleepers"
                                value={summary.totalRejectedCount.toLocaleString()}
                                color={summary.totalRejectedCount > 0 ? '#dc2626' : undefined}
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
                                Offered quantity ({summary.totalPassedCount}) cannot exceed sleepers due for dispatch ({summary.due}). Please reduce your selection.
                            </div>
                        ) : summary.totalPassedCount > 0 ? (
                            <div style={{
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                borderRadius: 8, padding: '10px 14px', fontSize: 12,
                                color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
                            }}>
                                <span>✓ Quantity selected</span>
                                {summary.afterOffering !== null && (
                                    <span style={{ fontWeight: 700 }}>
                                        Sleepers Due After This Offering: <span style={{ fontSize: 15 }}>{summary.afterOffering.toLocaleString()}</span>
                                    </span>
                                )}
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
                    padding: '14px 28px', background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0', flexShrink: 0,
                    display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center'
                }}>
                    <div style={{ flex: 1, fontSize: 11, color: '#94a3b8' }}>
                        {summary.totalSleeperCount > 0
                            ? `${summary.totalSleeperCount.toLocaleString()} sleeper(s) from ${summary.batchesSelected} batch(es) selected`
                            : 'No sleepers selected yet'}
                    </div>
                    <button onClick={onClose} style={{
                        padding: '9px 22px', borderRadius: 8, border: '1.5px solid #cbd5e1',
                        background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                    }}>
                        Cancel
                    </button>
                    <button
                        disabled={summary.totalPassedCount === 0 || summary.exceedsCap || !sleeperType || isSubmitting}
                        onClick={async () => {
                            setIsSubmitting(true);
                            try {
                                const userId = sessionStorage.getItem('userId');
                                const vendorCode = sessionStorage.getItem('vendorCode');
                                
                                const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
                                const currentPlantId = selectedPlant ? selectedPlant.plantId : null;
                                
                                const payload = {
                                    poNo,
                                    srNo: srItem.itemSrNo || srItem.srNo || (srItem.poSerialNo ? srItem.poSerialNo.split('/').pop() : 'N/A'),
                                    sleeperType,
                                    totalOffered: summary.totalPassedCount,
                                    totalRejected: summary.totalRejectedCount,
                                    createdBy: userId,
                                    vendorCode: vendorCode,
                                    plantId: currentPlantId,
                                    batchesSelected: []
                                };
                                
                                for (const [batchNo, selection] of Object.entries(batchSelections)) {
                                    if (selection.batchTouched && selection.goodSelected && selection.goodSelected.size > 0) {
                                        const batch = batches.find(b => b.batchNo === batchNo);
                                        const badSleepers = batch ? batch.badSleeperIds : [];
                                        
                                        // Map sleeper numbers to IDs
                                        const goodSleeperIds = Array.from(selection.goodSelected).map(sno => {
                                            const found = batch.goodSleepersData.find(s => String(s.sleeperNo).trim() === String(sno).trim());
                                            return found ? found.sleeperId : null;
                                        }).filter(id => id !== null);

                                        const badSleeperIds = (batch.badSleepersData || []).map(s => s.sleeperId);

                                        payload.batchesSelected.push({
                                            batchNo,
                                            goodSleepers: Array.from(selection.goodSelected),
                                            badSleepers: badSleepers || [],
                                            goodSleeperIds,
                                            badSleeperIds
                                        });
                                    }
                                }

                                const result = await apiService.submitSleeperInspectionCall(payload);
                                
                                if (onSubmitInspectionCall) {
                                    onSubmitInspectionCall({
                                        ...payload,
                                        callNo: result.responseData?.callNo || result.responseData?.inspectionCallNo,
                                        id: result.responseData?.id,
                                        batchesSelectedCount: summary.batchesSelected
                                    });
                                } else {
                                    const realCallNo = result.responseData?.callNo || result.responseData?.inspectionCallNo || 'N/A';
                                    alert(`✅ Inspection Call submitted!\n\nCall No: ${realCallNo}\nPO: ${payload.poNo} | SR: ${payload.srNo}\nPassed Sleepers: ${payload.totalOffered}\nRejected Sleepers: ${payload.totalRejected}\nBatches: ${summary.batchesSelected}\n\nThis call has been pushed to the IE Dashboard.`);
                                }
                                onClose();
                            } catch (error) {
                                alert("Failed to submit inspection call. Please try again.");
                                setIsSubmitting(false);
                            }
                        }}
                        style={{
                            padding: '9px 24px', borderRadius: 8, border: 'none',
                            background: (summary.totalPassedCount === 0 || summary.exceedsCap || !sleeperType || isSubmitting)
                                ? '#e2e8f0' : 'linear-gradient(135deg, #21808d, #0d3b3f)',
                            color: (summary.totalPassedCount === 0 || summary.exceedsCap || !sleeperType || isSubmitting) ? '#94a3b8' : '#fff',
                            fontWeight: 700, fontSize: 13, cursor:
                                (summary.totalPassedCount === 0 || summary.exceedsCap || !sleeperType || isSubmitting) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Inspection Call'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default RaiseInspectionCallForm;
