import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

// ─── Constants ────────────────────────────────────────────────────────────────
const RAIL_PAD_TYPES = [
    '6.00mm GRSP',
    '10.00mm GRSP',
    '6.20mm CGRSP',
    '10.00mm CGRSP',
    '6.00mm NCRGRSP',
    '10.00mm NCRGRSP'
];

const UOM_OPTIONS = ['Nos.', 'Set'];

// ─── Mock Inventory Data ──────────────────────────────────────────────────────
const MOCK_ACCEPTED_INVENTORY = [
    {
        productionDate: '2026-04-20',
        batches: [
            { id: 'batch-1', batchNo: 'RP/26/04/20-01', type: '6.00mm GRSP', qty: 5000, pending: 5000 },
            { id: 'batch-2', batchNo: 'RP/26/04/20-02', type: '6.00mm GRSP', qty: 5000, pending: 5000 },
            { id: 'batch-3', batchNo: 'RP/26/04/20-03', type: '10.00mm NCRGRSP', qty: 2500, pending: 2500 },
        ]
    },
    {
        productionDate: '2026-04-21',
        batches: [
            { id: 'batch-4', batchNo: 'RP/26/04/21-01', type: '6.00mm GRSP', qty: 5000, pending: 5000 },
            { id: 'batch-5', batchNo: 'RP/26/04/21-02', type: '6.20mm CGRSP', qty: 4000, pending: 4000, compoundA: 'A-991', compoundB: 'B-991' },
            { id: 'batch-6', batchNo: 'RP/26/04/21-03', type: '6.20mm CGRSP', qty: 4000, pending: 4000, compoundA: 'A-992', compoundB: 'B-992' },
        ]
    },
    {
        productionDate: '2026-04-22',
        batches: [
            { id: 'batch-7', batchNo: 'RP/26/04/22-01', type: '6.00mm GRSP', qty: 8000, pending: 8000 },
            { id: 'batch-8', batchNo: 'RP/26/04/22-02', type: '6.00mm NCRGRSP', qty: 5000, pending: 5000 },
        ]
    }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDateDDMMYY = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
};

// ─── Sub-Components ───────────────────────────────────────────────────────────
const SectionHeader = ({ label, step, color = '#21808d' }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 20, paddingBottom: 12,
        borderBottom: `2px solid #f1f5f9`
    }}>
        <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, flexShrink: 0,
            boxShadow: `0 4px 10px ${color}44`
        }}>{step}</div>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', letterSpacing: '0.01em' }}>
            {label}
        </span>
    </div>
);

const StatBox = ({ label, value, highlight, color, suffix }) => (
    <div style={{
        background: '#fff',
        border: `1px solid ${highlight ? '#fee2e2' : '#e2e8f0'}`,
        borderRadius: 12, padding: '16px 20px', minWidth: 150, flex: 1,
        boxShadow: highlight ? '0 4px 12px rgba(239,68,68,0.05)' : '0 1px 3px rgba(0,0,0,0.02)'
    }}>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{
            fontSize: '22px', fontWeight: 900,
            color: color || (highlight ? '#dc2626' : '#1e293b'), lineHeight: 1,
            display: 'flex', alignItems: 'baseline', gap: '4px'
        }}>
            {value} {suffix && <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>{suffix}</span>}
        </div>
    </div>
);

// ─── Main Form Component ──────────────────────────────────────────────────────
const RaiseRailPadInspectionCallForm = ({ srItem, poNo, onClose, onSubmitInspectionCall }) => {
    // Form State
    const [railPadType, setRailPadType] = useState(RAIL_PAD_TYPES[0]);
    const [uom, setUom] = useState(UOM_OPTIONS[0]);
    const [desiredDate, setDesiredDate] = useState('2026-05-02');
    const [totalQtyToOffer, setTotalQtyToOffer] = useState('');
    const [noOfLots, setNoOfLots] = useState(1);
    
    // Dynamic Lots State
    const [lots, setLots] = useState([{ id: 1, lotNo: 'LOT-1', selectedBatches: {} }]); 
    
    // UI State
    const [expandedLots, setExpandedLots] = useState({ 0: true });
    const [expandedDates, setExpandedDates] = useState({});
    
    // Partial Declaration UI State
    const [activePartialLotIdx, setActivePartialLotIdx] = useState(null);

    // ─── Effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const count = parseInt(noOfLots) || 0;
        if (count > 0) {
            setLots(prev => {
                const newLots = [...prev];
                if (count > newLots.length) {
                    for (let i = newLots.length; i < count; i++) {
                        newLots.push({ id: i + 1, lotNo: `LOT-${i + 1}`, selectedBatches: {} });
                    }
                } else if (count < newLots.length) {
                    return newLots.slice(0, count);
                }
                return newLots;
            });
        }
    }, [noOfLots]);

    // ─── Computed Values & Validations ────────────────────────────────────────
    const isNCRGRSP = railPadType.includes('NCRGRSP');
    const lotLimit = isNCRGRSP ? 5000 : 10000;
    const minLotsRequired = Math.ceil((parseInt(totalQtyToOffer) || 0) / lotLimit);
    const lotCountError = noOfLots < minLotsRequired ? `Minimum ${minLotsRequired} lots required for this quantity (IRS T-55 Constraint).` : null;

    const filteredInventory = useMemo(() => {
        return MOCK_ACCEPTED_INVENTORY.map(dateGroup => ({
            ...dateGroup,
            batches: dateGroup.batches.filter(b => b.type === railPadType)
        })).filter(group => group.batches.length > 0);
    }, [railPadType]);

    const getLotSum = (lot) => Object.values(lot.selectedBatches).reduce((acc, v) => acc + (parseInt(v) || 0), 0);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleBatchSelection = (lotIdx, batch, checked) => {
        setLots(prev => {
            const newLots = [...prev];
            const currentLot = { ...newLots[lotIdx] };
            const newSelected = { ...currentLot.selectedBatches };
            
            if (checked) {
                newSelected[batch.id] = batch.pending; 
            } else {
                delete newSelected[batch.id];
            }
            
            currentLot.selectedBatches = newSelected;
            newLots[lotIdx] = currentLot;
            return newLots;
        });
    };

    const handleBatchQtyChange = (lotIdx, batchId, qty, max) => {
        const value = Math.min(parseInt(qty) || 0, max);
        setLots(prev => {
            const newLots = [...prev];
            const currentLot = { ...newLots[lotIdx] };
            currentLot.selectedBatches = { ...currentLot.selectedBatches, [batchId]: value };
            newLots[lotIdx] = currentLot;
            return newLots;
        });
    };

    const handleDateMasterToggle = (lotIdx, dateGroup, checked) => {
        setLots(prev => {
            const newLots = [...prev];
            const currentLot = { ...newLots[lotIdx] };
            const newSelected = { ...currentLot.selectedBatches };
            
            dateGroup.batches.forEach(b => {
                if (checked) newSelected[b.id] = b.pending;
                else delete newSelected[b.id];
            });
            
            currentLot.selectedBatches = newSelected;
            newLots[lotIdx] = currentLot;
            return newLots;
        });
    };

    const isBatchSelected = (lotIdx, batchId) => lots[lotIdx]?.selectedBatches[batchId] !== undefined;

    // ─── Submission Logic ─────────────────────────────────────────────────────
    const totalOfferedFromLots = lots.reduce((acc, l) => acc + getLotSum(l), 0);
    const allLotsWithinLimits = lots.every(l => getLotSum(l) > 0 && getLotSum(l) <= lotLimit);
    const totalMatchesOffered = totalOfferedFromLots === (parseInt(totalQtyToOffer) || 0);

    const isValid = !lotCountError && 
                    desiredDate && 
                    totalQtyToOffer > 0 && 
                    allLotsWithinLimits &&
                    totalMatchesOffered;

    // ─── Styles ───────────────────────────────────────────────────────────────
    const overlayStyle = {
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', 
        alignItems: 'center', justifyContent: 'center', padding: '24px'
    };
    
    const modalStyle = {
        background: '#fff', width: '100%', maxWidth: '1200px', maxHeight: '95vh',
        borderRadius: '24px', display: 'flex', flexDirection: 'column', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
    };

    return createPortal(
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
                    padding: '24px 32px', flexShrink: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '6px', textTransform: 'uppercase' }}>
                            RAISE FINAL INSPECTION CALL
                        </div>
                        <div style={{ color: '#fff', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                            {poNo || '06255012201348'} — SR. No. {srItem.srNo || '001'}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                        width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                        fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}>×</button>
                </div>

                {/* ── Scrollable Body ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    
                    {/* ════ SECTION A ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '16px', padding: '28px', marginBottom: '28px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                        <SectionHeader step="A" label="Call Header & PO Statistics (Auto-Fetched)" color="#21808d" />
                        <div style={{ display: 'flex', gap: '64px', marginBottom: '32px', paddingLeft: '48px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO NO.</div>
                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '18px' }}>{poNo || '06255012201348'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SR. NO.</div>
                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '18px' }}>{srItem.srNo || '001'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CALL DATE</div>
                                <div style={{ fontWeight: 900, color: '#0891b2', fontSize: '18px' }}>{new Date().toLocaleDateString('en-IN')}</div>
                            </div>
                        </div>
                        <div style={{ paddingLeft: '48px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PO STATUS TRACKER</div>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <StatBox label="Total Quantity on Order" value={(srItem.orderedQty || 59420).toLocaleString()} />
                                <StatBox label="Quantity Offered Till Now" value={(srItem.offeredTillNow || 0).toLocaleString()} color="#7c3aed" />
                                <StatBox label="Quantity Accepted Till Now" value={(srItem.acceptedTillNow || 0).toLocaleString()} color="#16a34a" />
                                <StatBox label="Quantity Rejected Till Now" value="0" color="#ef4444" />
                                <StatBox label="Qty Due for Dispatch" value={(srItem.due || 59420).toLocaleString()} highlight />
                            </div>
                        </div>
                    </div>

                    {/* ════ SECTION B ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '16px', padding: '28px', marginBottom: '28px'
                    }}>
                        <SectionHeader step="B" label="Rail Pad Type & Granular Batch Selection" color="#7c3aed" />
                        <div style={{ paddingLeft: '48px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px', marginBottom: '32px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RAIL PAD TYPE <span style={{ color: '#ef4444' }}>*</span></label>
                                    <select value={railPadType} onChange={e => setRailPadType(e.target.value)} style={{ width: '100%', height: '46px', padding: '0 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontWeight: 800, color: '#1e293b', background: '#f8fafc', fontSize: '14px', outline: 'none' }}>
                                        {RAIL_PAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select UoM</label>
                                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '5px', gap: '5px' }}>
                                        {UOM_OPTIONS.map(opt => (
                                            <button key={opt} onClick={() => setUom(opt)} style={{ flex: 1, height: '36px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer', background: uom === opt ? '#fff' : 'transparent', boxShadow: uom === opt ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: uom === opt ? '#0f172a' : '#64748b', transition: 'all 0.2s' }}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desired Inspection Date</label>
                                    <input type="date" value={desiredDate} onChange={e => setDesiredDate(e.target.value)} style={{ width: '100%', height: '46px', padding: '0 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontWeight: 800, color: '#1e293b', fontSize: '14px' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '32px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Qty to be Offered</label>
                                    <input type="number" value={totalQtyToOffer} onChange={e => setTotalQtyToOffer(e.target.value)} placeholder="Enter quantity" style={{ width: '100%', height: '46px', padding: '0 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontWeight: 900, fontSize: '18px', color: '#0891b2' }} />
                                    {totalQtyToOffer > (srItem.due || 59420) && <p style={{ color: '#dc2626', fontSize: '11px', marginTop: '8px', fontWeight: 800 }}>⚠️ Cannot exceed Qty Due for Dispatch!</p>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No. of Lots to be Offered</label>
                                    <input type="number" value={noOfLots} onChange={e => setNoOfLots(e.target.value)} style={{ width: '100%', height: '46px', padding: '0 16px', borderRadius: '10px', border: lotCountError ? '2px solid #ef4444' : '2px solid #e2e8f0', fontWeight: 900, fontSize: '18px', color: '#1e293b' }} />
                                    {lotCountError && <p style={{ color: '#dc2626', fontSize: '11px', marginTop: '8px', fontWeight: 800 }}>⚠️ {lotCountError}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ════ SECTION C ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '16px', padding: '28px', marginBottom: '28px'
                    }}>
                        <SectionHeader step="C" label="Dynamic Lot Formation (Collapsible Sections)" color="#0891b2" />
                        <div style={{ paddingLeft: '48px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {lots.map((lot, idx) => {
                                const lotSum = getLotSum(lot);
                                return (
                                    <div key={lot.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div 
                                            onClick={() => setExpandedLots(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                            style={{ 
                                                background: '#f8fafc', padding: '16px 24px', cursor: 'pointer',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                borderBottom: expandedLots[idx] ? '1px solid #e2e8f0' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <span style={{ fontWeight: 900, color: '#0891b2', fontSize: '15px' }}>{lot.lotNo}</span>
                                                <span style={{ 
                                                    fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px',
                                                    background: lotSum > 0 && lotSum <= lotLimit ? '#dcfce7' : '#fee2e2',
                                                    color: lotSum > 0 && lotSum <= lotLimit ? '#166534' : '#991b1b'
                                                }}>
                                                    {lotSum.toLocaleString()} / {lotLimit.toLocaleString()} (Max)
                                                </span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActivePartialLotIdx(idx);
                                                    }}
                                                    style={{
                                                        marginLeft: '12px', padding: '6px 12px', borderRadius: '6px',
                                                        background: '#0891b2', color: '#fff', border: 'none',
                                                        fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                        boxShadow: '0 4px 6px -1px rgba(8,145,178,0.2)'
                                                    }}
                                                >
                                                    <span>(+) Partial Declaration</span>
                                                </button>
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>{expandedLots[idx] ? '▲' : '▼'}</span>
                                        </div>
                                        
                                        {expandedLots[idx] && (
                                            <div style={{ padding: '24px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Lot No.</label>
                                                        <input 
                                                            type="text" value={lot.lotNo} 
                                                            onChange={e => {
                                                                const newLots = [...lots];
                                                                newLots[idx].lotNo = e.target.value;
                                                                setLots(newLots);
                                                            }}
                                                            style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 700 }} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Lot Size (Auto-Calculated)</label>
                                                        <div style={{ 
                                                            width: '100%', height: '40px', padding: '0 12px', borderRadius: '8px', 
                                                            border: '2px solid #0891b2', background: '#ecfeff',
                                                            display: 'flex', alignItems: 'center', fontSize: '16px', fontWeight: 900, color: '#0891b2'
                                                        }}>
                                                            {lotSum.toLocaleString()}
                                                        </div>
                                                        {lotSum > lotLimit && (
                                                            <p style={{ color: '#ef4444', fontSize: '10px', marginTop: '6px', fontWeight: 800 }}>⚠️ Lot size exceeds limit of {lotLimit.toLocaleString()}!</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                                    {/* Batch Tree */}
                                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase' }}>Accepted Inventory (Date-Wise)</div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                            {filteredInventory.map(dateGroup => (
                                                                <div key={dateGroup.productionDate} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                                                    <div style={{ padding: '10px 16px', background: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                            <input type="checkbox" checked={dateGroup.batches.every(b => isBatchSelected(idx, b.id))} onChange={e => handleDateMasterToggle(idx, dateGroup, e.target.checked)} />
                                                                            <span style={{ fontSize: '13px', fontWeight: 800 }}>{formatDateDDMMYY(dateGroup.productionDate)}</span>
                                                                        </div>
                                                                        <button onClick={() => setExpandedDates(p => ({...p, [dateGroup.productionDate]: !p[dateGroup.productionDate]}))} style={{ border: 'none', background: 'transparent', fontSize: '10px', cursor: 'pointer' }}>{expandedDates[dateGroup.productionDate] ? '▼' : '▲'}</button>
                                                                    </div>
                                                                    {!expandedDates[dateGroup.productionDate] && (
                                                                        <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                                                            {dateGroup.batches.map(batch => (
                                                                                <div key={batch.id} style={{ 
                                                                                    padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', 
                                                                                    border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px',
                                                                                    minWidth: '200px'
                                                                                }}>
                                                                                    <input type="checkbox" checked={isBatchSelected(idx, batch.id)} onChange={e => handleBatchSelection(idx, batch, e.target.checked)} />
                                                                                    <div style={{ flex: 1 }}>
                                                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{batch.batchNo}</div>
                                                                                        {batch.compoundA && (
                                                                                            <div style={{ fontSize: '10px', color: '#0891b2', fontWeight: 700 }}>
                                                                                                {batch.compoundA} + {batch.compoundB}
                                                                                            </div>
                                                                                        )}
                                                                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{batch.pending.toLocaleString()} Nos.</div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Allocation Grid removed as per request */}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                        </div>

                    {/* ════ SECTION D ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '16px', padding: '28px', marginBottom: '28px'
                    }}>
                        <SectionHeader step="D" label="Final Call Summary" color="#1e293b" />
                        <div style={{ paddingLeft: '48px' }}>
                            <div style={{ background: '#f1f5f9', borderRadius: '16px', padding: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                    <div style={{ background: '#fff', padding: '16px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>TOTAL QTY OFFERED</div>
                                        <div style={{ fontSize: '20px', fontWeight: 950, color: totalMatchesOffered ? '#16a34a' : '#ef4444' }}>
                                            {totalOfferedFromLots.toLocaleString()} / {(parseInt(totalQtyToOffer) || 0).toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>{uom}</div>
                                    </div>
                                    <div style={{ background: '#fff', padding: '16px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>TOTAL LOTS</div>
                                        <div style={{ fontSize: '20px', fontWeight: 950, color: '#1e293b' }}>{noOfLots}</div>
                                    </div>
                                    <div style={{ background: '#fff', padding: '16px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>STATUS</div>
                                        <div style={{ fontSize: '14px', fontWeight: 900, color: isValid ? '#16a34a' : '#ef4444' }}>{isValid ? 'READY TO SUBMIT' : 'VALIDATION PENDING'}</div>
                                    </div>
                                </div>
                                {!totalMatchesOffered && totalQtyToOffer > 0 && (
                                    <p style={{ margin: '16px 0 0', fontSize: '12px', color: '#ef4444', fontWeight: 800, textAlign: 'center' }}>
                                        ⚠️ Sum of all lots must exactly match the "Total Qty to be Offered" ({totalQtyToOffer.toLocaleString()})
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>
                        {totalOfferedFromLots === 0 ? "No pads selected yet" : <span>Total Offered: <span style={{ color: totalMatchesOffered ? '#16a34a' : '#ef4444', fontWeight: 900, fontSize: '16px' }}>{totalOfferedFromLots.toLocaleString()}</span> / {parseInt(totalQtyToOffer).toLocaleString() || 0}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={onClose} style={{ padding: '12px 32px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                        <button disabled={!isValid} onClick={() => onSubmitInspectionCall({})} style={{ padding: '12px 36px', borderRadius: '12px', border: 'none', background: isValid ? 'linear-gradient(135deg, #21808d, #0d3b3f)' : '#e2e8f0', color: isValid ? '#fff' : '#94a3b8', fontWeight: 900, fontSize: '14px', cursor: isValid ? 'pointer' : 'not-allowed', boxShadow: isValid ? '0 10px 20px -5px rgba(33,128,141,0.4)' : 'none' }}>Submit Inspection Call</button>
                    </div>
                </div>
            </div>

            {/* ── Partial Offering Modal ── */}
            {activePartialLotIdx !== null && (
                <PartialOfferingModal 
                    lot={lots[activePartialLotIdx]}
                    inventory={filteredInventory}
                    onClose={() => setActivePartialLotIdx(null)}
                    onSubmit={(selected) => {
                        setLots(prev => {
                            const newLots = [...prev];
                            newLots[activePartialLotIdx].selectedBatches = selected;
                            return newLots;
                        });
                        setActivePartialLotIdx(null);
                    }}
                />
            )}
        </div>,
        document.body
    );
};

// ─── Partial Offering Modal Component ──────────────────────────────────────────
const PartialOfferingModal = ({ lot, inventory, onClose, onSubmit }) => {
    // Start with empty configuration so user can pick from the lot's selected batches
    const [selectedBatches, setSelectedBatches] = useState({});

    const allBatches = useMemo(() => {
        const list = [];
        inventory.forEach(group => {
            group.batches.forEach(b => {
                // Only show batches that were selected in the main lot form (Section C)
                if (lot.selectedBatches && lot.selectedBatches[b.id] !== undefined) {
                    list.push({ ...b, productionDate: group.productionDate });
                }
            });
        });
        return list;
    }, [inventory, lot.selectedBatches]);

    const handleAddBatch = (batchId) => {
        if (!batchId) return;
        const batch = allBatches.find(b => b.id === batchId);
        if (batch && !selectedBatches[batchId]) {
            setSelectedBatches(prev => ({ ...prev, [batchId]: batch.pending }));
        }
    };

    const handleQtyChange = (batchId, qty, max) => {
        const val = Math.max(0, Math.min(parseInt(qty) || 0, max));
        setSelectedBatches(prev => ({ ...prev, [batchId]: val }));
    };

    const handleRemove = (batchId) => {
        const newSelected = { ...selectedBatches };
        delete newSelected[batchId];
        setSelectedBatches(newSelected);
    };

    const totalSelected = Object.values(selectedBatches).reduce((acc, v) => acc + v, 0);
    const availableOptions = allBatches.filter(b => !selectedBatches[b.id]);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(8px)', zIndex: 11000, display: 'flex', 
            alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
            <div style={{
                background: '#fff', width: '100%', maxWidth: '750px',
                borderRadius: '24px', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                {/* Header */}
                <div style={{ 
                    padding: '24px 32px', background: 'linear-gradient(135deg, #0891b2, #0e7490)', color: '#fff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.8, textTransform: 'uppercase' }}>Declaration for {lot.lotNo}</div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Partial Offering Configuration</h3>
                    </div>
                    <button onClick={onClose} style={{ 
                        background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', 
                        width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                        fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>×</button>
                </div>

                <div style={{ padding: '32px', overflowY: 'auto', maxHeight: '65vh', background: '#fcfcfd' }}>
                    {/* Batch Selector */}
                    <div style={{ 
                        background: '#fff', padding: '20px', borderRadius: '16px', 
                        border: '1px solid #e2e8f0', marginBottom: '24px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            Add Production Batch to Lot
                        </label>
                        <select 
                            onChange={(e) => handleAddBatch(e.target.value)}
                            value=""
                            style={{ 
                                width: '100%', height: '48px', padding: '0 16px', 
                                borderRadius: '12px', border: '2px solid #e2e8f0',
                                fontWeight: 800, color: '#1e293b', background: '#f8fafc',
                                outline: 'none', cursor: 'pointer'
                            }}
                        >
                            <option value="" disabled>Search or Select Batch...</option>
                            {availableOptions.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.batchNo} — {b.pending.toLocaleString()} Nos available ({formatDateDDMMYY(b.productionDate)})
                                </option>
                            ))}
                        </select>
                        {availableOptions.length === 0 && (
                            <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                {allBatches.length === 0 
                                    ? "No batches selected in Section C for this lot." 
                                    : "All selected batches from lot are already configured."}
                            </p>
                        )}
                    </div>

                    {/* Selection List */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase' }}>Selected Items ({Object.keys(selectedBatches).length})</div>
                        {Object.keys(selectedBatches).length > 0 && (
                            <button onClick={() => setSelectedBatches({})} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>REMOVE ALL</button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.entries(selectedBatches).length === 0 ? (
                            <div style={{ 
                                padding: '48px', textAlign: 'center', color: '#94a3b8', 
                                background: '#fff', border: '2px dashed #e2e8f0', borderRadius: '16px',
                            }}>
                                <div style={{ fontSize: '24px', marginBottom: '12px' }}>📦</div>
                                <div style={{ fontSize: '14px', fontWeight: 700 }}>No batches selected yet</div>
                                <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '4px' }}>Use the dropdown above to add batches to this lot</div>
                            </div>
                        ) : (
                            Object.entries(selectedBatches).map(([batchId, qty]) => {
                                const batch = allBatches.find(b => b.id === batchId);
                                const isInvalid = qty <= 0 || qty > (batch?.pending || 0);
                                
                                return (
                                    <div key={batchId} style={{ 
                                        padding: '16px 20px', background: '#fff', borderRadius: '16px', border: `1px solid ${isInvalid ? '#fee2e2' : '#e2e8f0'}`,
                                        display: 'flex', alignItems: 'center', gap: '20px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: 900, color: '#1e293b' }}>{batch?.batchNo}</div>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{formatDateDDMMYY(batch?.productionDate)}</span>
                                                <span style={{ fontSize: '11px', color: '#0891b2', fontWeight: 800 }}>Available: {batch?.pending.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div style={{ width: '160px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Quantity to Offer</div>
                                            <div style={{ position: 'relative' }}>
                                                <input 
                                                    type="number" 
                                                    value={qty}
                                                    onChange={(e) => handleQtyChange(batchId, e.target.value, batch?.pending)}
                                                    style={{ 
                                                        width: '100%', height: '40px', padding: '0 12px', 
                                                        borderRadius: '8px', border: `2px solid ${isInvalid ? '#ef4444' : '#0891b2'}`,
                                                        fontWeight: 900, fontSize: '16px', color: '#0891b2',
                                                        outline: 'none', background: isInvalid ? '#fff1f2' : '#f0f9ff'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemove(batchId)} 
                                            style={{ 
                                                width: '36px', height: '36px', border: 'none', 
                                                background: '#fee2e2', color: '#ef4444', 
                                                borderRadius: '10px', cursor: 'pointer', fontSize: '16px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
                                            onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
                                        >×</button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Lot Quantity:</span>
                        <span style={{ fontSize: '22px', fontWeight: 950, color: '#1e293b' }}>{totalSelected.toLocaleString()}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>Nos.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                        <button 
                            disabled={Object.keys(selectedBatches).length === 0}
                            onClick={() => onSubmit(selectedBatches)}
                            style={{ 
                                padding: '12px 32px', borderRadius: '12px', border: 'none', 
                                background: Object.keys(selectedBatches).length === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #0891b2, #0e7490)', 
                                color: Object.keys(selectedBatches).length === 0 ? '#94a3b8' : '#fff', 
                                fontWeight: 900, fontSize: '14px', cursor: Object.keys(selectedBatches).length === 0 ? 'not-allowed' : 'pointer',
                                boxShadow: Object.keys(selectedBatches).length === 0 ? 'none' : '0 10px 15px -3px rgba(8,145,178,0.3)'
                            }}
                        >Confirm & Update Lot</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RaiseRailPadInspectionCallForm;
