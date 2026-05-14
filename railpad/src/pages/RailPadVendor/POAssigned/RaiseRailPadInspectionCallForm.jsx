import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { inventoryService } from '../../../services/inventoryService';
import inspectionCallService from '../../../services/inspectionCallService';
import { formatDateDDMMYY } from '../../../utils/dateUtils';
import {
    Calendar, Package, ClipboardList, CheckCircle2,
    AlertCircle, Trash2, ChevronDown, ChevronUp, Plus, Minus,
    Info, Search
} from 'lucide-react';
import { API_CONFIG } from '../../../services/config';

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
// (Mock data removed)

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

const StatBox = ({ label, value, highlight, color, Icon, suffix }) => (
    <div style={{
        background: highlight ? 'linear-gradient(135deg, #fefce8, #fef9c3)' : '#fff',
        border: `1px solid ${highlight ? '#fde047' : '#e2e8f0'}`,
        borderRadius: 12, padding: '16px 20px', minWidth: 150, flex: 1,
        boxShadow: highlight ? '0 4px 12px rgba(234,179,8,0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex', alignItems: 'center', gap: '16px'
    }}>
        {Icon && <div style={{ color: color || '#21808d', opacity: 0.8 }}><Icon size={24} /></div>}
        <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{
                fontSize: '22px', fontWeight: 900,
                color: color || (highlight ? '#dc2626' : '#1e293b'), lineHeight: 1,
                display: 'flex', alignItems: 'baseline', gap: '4px'
            }}>
                {value} {suffix && <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>{suffix}</span>}
            </div>
        </div>
    </div>
);

// ─── Main Form Component ──────────────────────────────────────────────────────
const RaiseRailPadInspectionCallForm = ({ srItem, poNo, plantId, vendorCode, onClose, onSubmitInspectionCall }) => {
    // Form State
    const [railPadType, setRailPadType] = useState('');
    const [uom, setUom] = useState(UOM_OPTIONS[0]);
    const [desiredDate, setDesiredDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalQtyToOffer, setTotalQtyToOffer] = useState('');
    const [noOfLots, setNoOfLots] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inventory State
    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        if (type === 'success') {
            setTimeout(() => {
                setNotification(null);
                onClose();
            }, 3000);
        } else {
            setTimeout(() => setNotification(null), 5000);
        }
    };

    // Dynamic Lots State
    const [lots, setLots] = useState([{ id: 1, lotNo: 'LOT-1', selectedBatches: {} }]);

    // UI State
    const [expandedLots, setExpandedLots] = useState({ 0: true });
    const [expandedDates, setExpandedDates] = useState({});

    // Partial Declaration UI State
    const [activePartialLotIdx, setActivePartialLotIdx] = useState(null);

    // ─── Effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchInventory = async () => {
            if (!plantId) return;
            try {
                setLoadingInventory(true);
                const data = await inventoryService.getAcceptedInventory(plantId, railPadType);
                setInventory(data || []);
            } catch (error) {
                console.error('Error fetching inventory:', error);
            } finally {
                setLoadingInventory(false);
            }
        };
        fetchInventory();
    }, [plantId, railPadType]);
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

    const getLotSum = (lot) => Object.values(lot?.selectedBatches || {}).reduce((acc, v) => acc + (parseInt(v) || 0), 0);

    const filteredInventory = useMemo(() => {
        if (!Array.isArray(inventory)) return [];
        return inventory.map(group => ({
            productionDate: group.castingDate,
            batches: (group.batches || []).map(b => ({
                id: b.infoId || b.id,
                batchNo: b.batchNo,
                type: b.productType,
                qty: b.acceptedQty || b.quantity,
                pending: b.acceptedQty || b.quantity
            }))
        }));
    }, [inventory]);

    const totalOfferedFromLots = lots.reduce((acc, lot) => acc + getLotSum(lot), 0);
    const totalMatchesOffered = totalOfferedFromLots === (parseInt(totalQtyToOffer) || 0);
    const isValid = totalMatchesOffered && totalOfferedFromLots > 0 && !lotCountError;

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const userId = localStorage.getItem('railpad_userId');

            const payload = {
                poNo: `${poNo}/${srItem?.itemSrNo || srItem?.srNo || '01'}`,
                vendorCode: vendorCode || srItem?.vendorCode || 'V001',
                plantId: plantId,
                railPadType: railPadType,
                totalQty: parseInt(totalQtyToOffer),
                noOfLots: parseInt(noOfLots),
                inspectionDate: desiredDate,
                createdBy: userId,
                updatedBy: userId,
                lots: lots.map(lot => ({
                    lotNo: lot.lotNo,
                    lotSize: getLotSum(lot),
                    batches: Object.entries(lot.selectedBatches).map(([batchId, qty]) => {
                        let batchInfo = null;
                        (inventory || []).forEach(group => {
                            const found = (group.batches || []).find(b => String(b.infoId) === String(batchId));
                            if (found) batchInfo = { ...found, productionDate: group.castingDate };
                        });

                        return {
                            batchNo: batchInfo?.batchNo,
                            quantity: parseInt(qty),
                            productionDate: batchInfo?.productionDate
                        };
                    })
                }))
            };

            const result = await inspectionCallService.create(payload);



            showNotification(`✅ Inspection Call raised successfully!\nCall No: ${result}`, 'success');
        } catch (error) {
            console.error("[Submit Inspection Call] Error:", error);
            showNotification("❌ Failed to raise inspection call.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };


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
                        <div style={{ color: '#fff', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Package size={24} />
                            {poNo || '06255012201348'} — SR. No. {srItem?.itemSrNo || srItem?.srNo || '001'}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                        width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                        fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}><Plus style={{ transform: 'rotate(45deg)' }} /></button>
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
                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '18px' }}>{srItem?.itemSrNo || srItem?.srNo || '001'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CALL DATE</div>
                                <div style={{ fontWeight: 900, color: '#0891b2', fontSize: '18px' }}>{new Date().toLocaleDateString('en-IN')}</div>
                            </div>
                        </div>
                        <div style={{ paddingLeft: '48px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PO STATUS TRACKER</div>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <StatBox label="Total Quantity on Order" value={(srItem?.orderedQty || 59420).toLocaleString()} Icon={ClipboardList} />
                                <StatBox label="Quantity Offered Till Now" value={(srItem?.offeredTillNow || 0).toLocaleString()} color="#7c3aed" Icon={Package} />
                                <StatBox label="Quantity Accepted Till Now" value={(srItem?.acceptedTillNow || 0).toLocaleString()} color="#16a34a" Icon={CheckCircle2} />
                                <StatBox label="Quantity Rejected Till Now" value="0" color="#ef4444" Icon={AlertCircle} />
                                <StatBox label="Qty Due for Dispatch" value={(srItem?.due || 59420).toLocaleString()} highlight Icon={Calendar} />
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
                                        <option value="" disabled>Select Rail Pad Type</option>
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
                                    <input
                                        type="text"
                                        value={totalQtyToOffer}
                                        onChange={e => setTotalQtyToOffer(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="Enter quantity"
                                        style={{ width: '100%', height: '46px', padding: '0 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontWeight: 900, fontSize: '18px', color: '#0891b2' }}
                                    />
                                    {totalQtyToOffer > (srItem?.due || 59420) && <p style={{ color: '#dc2626', fontSize: '11px', marginTop: '8px', fontWeight: 800 }}>⚠️ Cannot exceed Qty Due for Dispatch!</p>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No. of Lots to be Offered</label>
                                    <input
                                        type="text"
                                        value={noOfLots}
                                        onChange={e => setNoOfLots(e.target.value.replace(/[^0-9]/g, ''))}
                                        style={{ width: '100%', height: '46px', padding: '0 16px', borderRadius: '10px', border: lotCountError ? '2px solid #ef4444' : '2px solid #e2e8f0', fontWeight: 900, fontSize: '18px', color: '#1e293b' }}
                                    />
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
                            {lots.map((lot, lotIdx) => {
                                const lotSum = getLotSum(lot);
                                return (
                                    <div key={lot.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div
                                            onClick={() => setExpandedLots(prev => ({ ...prev, [lotIdx]: !prev[lotIdx] }))}
                                            style={{
                                                background: '#f8fafc', padding: '16px 24px', cursor: 'pointer',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                borderBottom: expandedLots[lotIdx] ? '1px solid #e2e8f0' : 'none'
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
                                                        setActivePartialLotIdx(lotIdx);
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
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>{expandedLots[lotIdx] ? '▲' : '▼'}</span>
                                        </div>

                                        {expandedLots[lotIdx] && (
                                            <div style={{ padding: '24px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Lot No.</label>
                                                        <input
                                                            type="text" value={lot.lotNo}
                                                            onChange={e => {
                                                                const newLots = [...lots];
                                                                newLots[lotIdx].lotNo = e.target.value;
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
                                                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Accepted Inventory (Date-Wise)</span>
                                                            {loadingInventory && <span style={{ color: '#0891b2', fontSize: '10px' }}>Refreshing...</span>}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                            {loadingInventory && filteredInventory.length === 0 ? (
                                                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}>
                                                                    ⏳ Fetching accepted batches from database...
                                                                </div>
                                                            ) : filteredInventory.length === 0 ? (
                                                                <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', background: '#fef2f2', borderRadius: '12px', border: '1px dashed #fee2e2' }}>
                                                                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>🚫</div>
                                                                    <div style={{ fontSize: '14px', fontWeight: 800 }}>No Accepted Inventory Found</div>
                                                                    <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px', opacity: 0.8 }}>No production verification records exist for {railPadType} at this plant.</div>
                                                                </div>
                                                            ) : (
                                                                filteredInventory.map(dateGroup => (
                                                                    <div key={dateGroup.productionDate} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                                                        <div style={{ padding: '12px 20px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                                                    checked={dateGroup.batches.every(b => isBatchSelected(lotIdx, b.id))}
                                                                                    onChange={e => handleDateMasterToggle(lotIdx, dateGroup, e.target.checked)}
                                                                                />
                                                                                <span style={{ fontSize: '14px', fontWeight: 900, color: '#334155' }}>{formatDateDDMMYY(dateGroup.productionDate)}</span>
                                                                                <span style={{ fontSize: '11px', fontWeight: 800, background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px' }}>{dateGroup.batches.length} Batches</span>
                                                                            </div>
                                                                            <button onClick={() => setExpandedDates(p => ({ ...p, [dateGroup.productionDate]: !p[dateGroup.productionDate] }))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                                                                {expandedDates[dateGroup.productionDate] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                                                            </button>
                                                                        </div>
                                                                        <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', background: '#fcfcfd' }}>
                                                                            {dateGroup.batches.map(batch => {
                                                                                const isSelected = isBatchSelected(lotIdx, batch.id);
                                                                                return (
                                                                                    <div
                                                                                        key={batch.id}
                                                                                        onClick={() => handleBatchSelection(lotIdx, batch, !isSelected)}
                                                                                        style={{
                                                                                            padding: '6px 10px', borderRadius: '8px', background: isSelected ? '#0f172a' : '#fff',
                                                                                            border: `1.5px solid ${isSelected ? '#0f172a' : '#e2e8f0'}`,
                                                                                            display: 'flex', alignItems: 'center', gap: '8px',
                                                                                            cursor: 'pointer', transition: 'all 0.1s',
                                                                                            boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                                                                        }}
                                                                                    >
                                                                                        <div style={{
                                                                                            width: '16px', height: '16px', borderRadius: '4px',
                                                                                            border: `1.5px solid ${isSelected ? '#38bdf8' : '#cbd5e1'}`,
                                                                                            background: isSelected ? '#38bdf8' : 'transparent',
                                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#0f172a' : '#fff'
                                                                                        }}>
                                                                                            {isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
                                                                                        </div>
                                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                                            <div style={{ fontSize: '11px', fontWeight: 800, color: isSelected ? '#fff' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Batch no : {batch.batchNo}</div>
                                                                                            <div style={{ fontSize: '9px', color: isSelected ? '#94a3b8' : '#64748b', fontWeight: 700 }}>
                                                                                                accepted no : {batch.qty.toLocaleString()} ({uom})
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
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
                        {totalOfferedFromLots === 0 ? "No pads selected yet" : <span>Total Offered: <span style={{ color: totalMatchesOffered ? '#16a34a' : '#ef4444', fontWeight: 900, fontSize: '16px' }}>{totalOfferedFromLots.toLocaleString()}</span> / {(parseInt(totalQtyToOffer) || 0).toLocaleString()}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={onClose} style={{ padding: '12px 32px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                        <button
                            disabled={!isValid || isSubmitting}
                            onClick={handleSubmit}
                            style={{
                                padding: '12px 36px', borderRadius: '12px', border: 'none',
                                background: isValid ? 'linear-gradient(135deg, #21808d, #0d3b3f)' : '#e2e8f0',
                                color: isValid ? '#fff' : '#94a3b8', fontWeight: 900, fontSize: '14px',
                                cursor: isValid ? 'pointer' : 'not-allowed',
                                boxShadow: isValid ? '0 10px 20px -5px rgba(33,128,141,0.4)' : 'none'
                            }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Inspection Call'}
                        </button>
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
            {/* ─── Notification Overlay ────────────────────────────────── */}
            {notification && (
                <div style={{
                    position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
                    background: notification.type === 'success' ? '#065f46' : '#991b1b',
                    color: '#fff', padding: '16px 24px', borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    zIndex: 10000, minWidth: '320px', animation: 'slideDown 0.3s ease-out'
                }}>
                    {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <div style={{ fontWeight: 600, whiteSpace: 'pre-line' }}>{notification.message}</div>
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from { transform: translate(-50%, -100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </div>,
        document.body
    );
};

// ─── Partial Offering Modal Component ──────────────────────────────────────────
const PartialOfferingModal = ({ lot, inventory, onClose, onSubmit }) => {
    // Initialize with existing selections from the lot
    const [selectedBatches, setSelectedBatches] = useState(lot.selectedBatches || {});

    const allBatches = useMemo(() => {
        const list = [];
        // 'inventory' prop here is actually 'filteredInventory' passed from parent
        (inventory || []).forEach(group => {
            (group.batches || []).forEach(b => {
                list.push({
                    id: b.id,
                    batchNo: b.batchNo,
                    pending: b.pending || b.qty || 0,
                    productionDate: group.productionDate
                });
            });
        });
        return list;
    }, [inventory]);

    const handleAddBatch = (val) => {
        if (!val) return;
        // Convert both to string to handle potential number/string mismatch
        const batch = allBatches.find(b => String(b.id) === String(val));
        if (batch && !selectedBatches[batch.id]) {
            setSelectedBatches(prev => ({ ...prev, [batch.id]: batch.pending }));
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <ClipboardList size={32} />
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.8, textTransform: 'uppercase' }}>Declaration for {lot.lotNo}</div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Partial Offering Configuration</h3>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                        width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                        fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}><Plus style={{ transform: 'rotate(45deg)' }} /></button>
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
                                    {b.batchNo || 'Unnamed Batch'} — {b.pending.toLocaleString()} Nos available ({formatDateDDMMYY(b.productionDate)})
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
                                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                                    <Package size={48} />
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 700 }}>No batches selected yet</div>
                                <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '4px' }}>Use the dropdown above to add batches to this lot</div>
                            </div>
                        ) : (
                            Object.entries(selectedBatches).map(([batchId, qty]) => {
                                const batch = allBatches.find(b => String(b.id) === String(batchId));
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
                                        ><Trash2 size={18} /></button>
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
