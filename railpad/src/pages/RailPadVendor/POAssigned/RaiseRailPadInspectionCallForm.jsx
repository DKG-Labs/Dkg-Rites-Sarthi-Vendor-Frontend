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
import NCRGRSPFinalInspectionCall from './NCRGRSPFinalInspectionCall';

// ─── Constants ────────────────────────────────────────────────────────────────
const RAIL_PAD_TYPES = [
    '6.00mm GRSP',
    '10.00mm GRSP',
    '6.20mm CGRSP',
    '10.00mm CGRSP',
    '6.00mm NCRGRSP',
    '10.00mm NCRGRSP'
];

const DRAWING_MAPPING = {
    "6.00mm GRSP": ["RDSO/T-3703", "RDSO/T-3711"],
    "10.00mm GRSP": [], 
    "6.20mm CGRSP": ["RDSO/T-6618", "RDSO/T-8327"],
    "10.00mm CGRSP": ["RDSO/T-8528", "RDSO/T-8747", "RDSO/T-8998"],
    "6.00mm NCRGRSP": ["1 in 12 RDSO/T-8779", "1 in 8.5 RDSO/T-9774", "1 in 12 RDSO/T-4218", "1 in 8.5 RDSO/T-4865", "RDSO/T-4220", "RDSO/T-4967", "RDSO/T-6068", "RDSO/T-8893 to RDSO/T-8905", "RDSO/T-8886 to RDSO/T-8889"],
    "10.00mm NCRGRSP": ["1 in 12 RDSO- 9790", "1 in 16 RDSO -10070"]
};

const UOM_OPTIONS = ['Nos.', 'Set'];

// ─── Mock Inventory Data ──────────────────────────────────────────────────────
// (Mock data removed)

// ─── Sub-Components ───────────────────────────────────────────────────────────
const SectionHeader = ({ label, step, color = '#21808d' }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 10, paddingBottom: 6,
        borderBottom: `1px solid #f1f5f9`
    }}>
        <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 11, flexShrink: 0,
            boxShadow: `0 2px 6px ${color}33`
        }}>{step}</div>
        <span style={{ fontWeight: 800, fontSize: 13, color: '#1e293b', letterSpacing: '0.01em' }}>
            {label}
        </span>
    </div>
);

const StatBox = ({ label, value, highlight, color, Icon, suffix }) => (
    <div style={{
        background: highlight ? 'linear-gradient(135deg, #fefce8, #fef9c3)' : '#fff',
        border: `1px solid ${highlight ? '#fde047' : '#e2e8f0'}`,
        borderRadius: 6, padding: '6px 10px', minWidth: 100, flex: 1,
        boxShadow: highlight ? '0 1px 4px rgba(234,179,8,0.03)' : '0 1px 2px rgba(0,0,0,0.01)',
        display: 'flex', alignItems: 'center', gap: '6px'
    }}>
        {Icon && <div style={{ color: color || '#21808d', opacity: 0.8, display: 'flex', alignItems: 'center' }}><Icon size={14} /></div>}
        <div>
            <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 700, marginBottom: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{
                fontSize: '13px', fontWeight: 900,
                color: color || (highlight ? '#dc2626' : '#1e293b'), lineHeight: 1.1,
                display: 'flex', alignItems: 'baseline', gap: '1px'
            }}>
                {value} {suffix && <span style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8' }}>{suffix}</span>}
            </div>
        </div>
    </div>
);

// ─── Main Form Component ──────────────────────────────────────────────────────
const RaiseRailPadInspectionCallForm = ({ srItem, poNo, plantId, vendorCode, onClose, onSubmitInspectionCall, isWrapped }) => {
    // ─── ALL STATE HOOKS (must all be declared before any conditional return) ─────
    const defaultPadType = (srItem?.poDes?.includes('NCRGRSP') || srItem?.description?.includes('NCRGRSP')) ? '6.00mm NCRGRSP' : '';
    const [railPadType, setRailPadType] = useState(defaultPadType);
    const [drawingNo, setDrawingNo] = useState('');
    const [selectedProcessIcs, setSelectedProcessIcs] = useState([]);
    const [processCalls, setProcessCalls] = useState([]);
    const [loadingProcessCalls, setLoadingProcessCalls] = useState(false);
    const uom = srItem?.unit || srItem?.uom || 'Nos.';
    const [desiredDate, setDesiredDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalQtyToOffer, setTotalQtyToOffer] = useState('');
    const [noOfLots, setNoOfLots] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [notification, setNotification] = useState(null);
    const [lots, setLots] = useState([{ id: 1, lotNo: 'LOT-1', selectedBatches: {} }]);
    const [expandedLots, setExpandedLots] = useState({ 0: true });
    const [expandedDates, setExpandedDates] = useState({});
    const [activePartialLotIdx, setActivePartialLotIdx] = useState(null);

    // ─── ALL EFFECTS (must all be declared before any conditional return) ─────
    // Fetch process calls matching railPadType and drawingNo
    useEffect(() => {
        const fetchProcessCalls = async () => {
            if (!railPadType || !drawingNo || !plantId) {
                setProcessCalls([]);
                return;
            }
            try {
                setLoadingProcessCalls(true);
                const poSrNo = srItem?.itemSrNo || srItem?.srNo || '';
                const data = await inspectionCallService.getProcessCalls(railPadType, drawingNo, plantId, poNo, poSrNo);
                const sortedData = Array.isArray(data) ? [...data].sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.created_at || a.createdOn || 0);
                    const dateB = new Date(b.createdAt || b.created_at || b.createdOn || 0);
                    if (dateA.getTime() !== dateB.getTime()) {
                        return dateB.getTime() - dateA.getTime();
                    }
                    const callNoA = String(a.inspectionCallNo || a.callNo || a.id || '');
                    const callNoB = String(b.inspectionCallNo || b.callNo || b.id || '');
                    return callNoB.localeCompare(callNoA, undefined, { numeric: true, sensitivity: 'base' });
                }) : [];
                setProcessCalls(sortedData);
            } catch (error) {
                console.error('Error fetching process calls:', error);
            } finally {
                setLoadingProcessCalls(false);
            }
        };
        fetchProcessCalls();
    }, [railPadType, drawingNo, plantId, poNo, srItem?.itemSrNo, srItem?.srNo]);

    // Fetch process inspection result batches on selectedProcessIcs change
    useEffect(() => {
        const fetchProcessBatches = async () => {
            if (selectedProcessIcs.length === 0) {
                setInventory([]);
                return;
            }
            try {
                setLoadingInventory(true);
                const results = await Promise.all(
                    selectedProcessIcs.map(ic => inspectionCallService.getAvailableFinalBatches(ic))
                );
                
                const allBatches = [];
                results.forEach(processResult => {
                    if (processResult && processResult.batches) {
                        allBatches.push(...processResult.batches);
                    }
                });

                const grouped = {};
                allBatches.forEach(b => {
                    const dateStr = b.productionDate;
                    if (!grouped[dateStr]) {
                        grouped[dateStr] = [];
                    }
                    const existingBatch = grouped[dateStr].find(eb => eb.batchNo === b.batchNo && eb.drawingNo === b.drawingNo);
                    if (existingBatch) {
                        existingBatch.acceptedQty += b.qtyAccepted;
                        existingBatch.quantity += b.qtyAccepted;
                    } else {
                        grouped[dateStr].push({
                            id: b.declarationBatchId || b.id,
                            infoId: b.declarationBatchId || b.id,
                            batchNo: b.batchNo,
                            productType: railPadType,
                            drawingNo: b.drawingNo,
                            acceptedQty: b.qtyAccepted,
                            quantity: b.qtyAccepted
                        });
                    }
                });

                const mappedInventory = Object.entries(grouped).map(([date, batches]) => ({
                    castingDate: date,
                    batches: batches
                }));
                setInventory(mappedInventory);
            } catch (error) {
                console.error('Error fetching process batches:', error);
                setInventory([]);
            } finally {
                setLoadingInventory(false);
            }
        };
        fetchProcessBatches();
    }, [selectedProcessIcs, railPadType]);

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

    // ─── useMemo HOOKS (must also be declared before any conditional return) ───
    const getLotSum = (lot) => Object.values(lot?.selectedBatches || {}).reduce((acc, v) => acc + (parseInt(v) || 0), 0);

    const filteredInventory = useMemo(() => {
        if (!Array.isArray(inventory)) return [];
        return inventory.map(group => ({
            productionDate: group.castingDate,
            batches: (group.batches || []).map(b => ({
                id: b.infoId || b.id,
                batchNo: b.batchNo,
                type: b.productType,
                drawingNo: b.drawingNo,
                qty: b.acceptedQty || b.quantity,
                pending: b.acceptedQty || b.quantity
            }))
        }));
    }, [inventory]);

    // Reset drawing no and process IC on railPadType change
    const handleRailPadTypeChange = (val) => {
        setRailPadType(val);
        setDrawingNo('');
        setSelectedProcessIcs([]);
        setProcessCalls([]);
        setInventory([]);
    };

    // ─── NCRGRSP Early Exit ── placed AFTER ALL hooks (React Rules of Hooks) ──
    if (railPadType.includes('NCRGRSP')) {
        return (
            <NCRGRSPFinalInspectionCall
                srItem={srItem}
                poNo={poNo}
                plantId={plantId}
                vendorCode={vendorCode}
                onClose={onClose}
                onSubmitInspectionCall={onSubmitInspectionCall}
                initialRailPadType={railPadType || '6.00mm NCRGRSP'}
                onRailPadTypeChange={handleRailPadTypeChange}
            />
        );
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────
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


    // ─── Computed Values & Validations ────────────────────────────────────────
    const isNCRGRSP = railPadType.includes('NCRGRSP');
    const lotLimit = isNCRGRSP ? 5000 : 10000;
    const minLotsRequired = Math.ceil((parseInt(totalQtyToOffer) || 0) / lotLimit);
    const lotCountError = noOfLots < minLotsRequired ? `Minimum ${minLotsRequired} lots required for this quantity (IRS T-55 Constraint).` : null;

    const totalOfferedFromLots = lots.reduce((acc, lot) => acc + getLotSum(lot), 0);
    const totalMatchesOffered = totalOfferedFromLots === (parseInt(totalQtyToOffer) || 0);
    const hasLotExceedingLimit = lots.some(lot => getLotSum(lot) > lotLimit);
    const isValid = railPadType && drawingNo && selectedProcessIcs.length > 0 && totalMatchesOffered && totalOfferedFromLots > 0 && !lotCountError && !hasLotExceedingLimit;

    const handleSubmit = async () => {
        if (hasLotExceedingLimit) {
            alert(`Lot Limit Exceeded!\n\nOne or more lots exceed the maximum limit of ${lotLimit.toLocaleString()} Nos. (IRS T-55 constraint).\n\nPlease reduce the quantity or allocate the excess to a second lot.`);
            return;
        }
        try {
            setIsSubmitting(true);
            const userId = localStorage.getItem('railpad_userId');

            const payload = {
                poNo: `${poNo}/${srItem?.itemSrNo || srItem?.srNo || '01'}`,
                vendorCode: vendorCode || srItem?.vendorCode || 'V001',
                plantId: plantId,
                callType: 'FINAL',
                railPadType: railPadType,
                drawingNo: drawingNo,
                processIcNo: selectedProcessIcs.join(','),
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
        if (checked) {
            const currentLotSum = getLotSum(lots[lotIdx]);
            if (currentLotSum + batch.pending > lotLimit) {
                alert(`Lot Limit Exceeded!\n\n1 lot cannot have more than ${lotLimit.toLocaleString()} Nos. (IRS T-55 constraint).\n\nYou need to select/create a second lot for quantities exceeding ${lotLimit.toLocaleString()} Nos.`);
                return;
            }
        }
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
        if (checked) {
            let potentialAddedQty = 0;
            dateGroup.batches.forEach(b => {
                const isSelectedInOther = lots.some((l, idx) => idx !== lotIdx && l.selectedBatches[b.id] !== undefined);
                const isAlreadySelectedInCurrent = lots[lotIdx].selectedBatches[b.id] !== undefined;
                if (!isSelectedInOther && !isAlreadySelectedInCurrent) {
                    potentialAddedQty += b.pending;
                }
            });

            const currentLotSum = getLotSum(lots[lotIdx]);
            if (currentLotSum + potentialAddedQty > lotLimit) {
                alert(`Lot Limit Exceeded!\n\n1 lot cannot have more than ${lotLimit.toLocaleString()} Nos. (IRS T-55 constraint).\n\nYou need to select/create a second lot for quantities exceeding ${lotLimit.toLocaleString()} Nos.`);
                return;
            }
        }
        setLots(prev => {
            const newLots = [...prev];
            const currentLot = { ...newLots[lotIdx] };
            const newSelected = { ...currentLot.selectedBatches };

            dateGroup.batches.forEach(b => {
                if (checked) {
                    const isSelectedInOther = prev.some((l, idx) => idx !== lotIdx && l.selectedBatches[b.id] !== undefined);
                    if (!isSelectedInOther) {
                        newSelected[b.id] = b.pending;
                    }
                } else {
                    delete newSelected[b.id];
                }
            });

            currentLot.selectedBatches = newSelected;
            newLots[lotIdx] = currentLot;
            return newLots;
        });
    };

    const isBatchSelected = (lotIdx, batchId) => lots[lotIdx]?.selectedBatches[batchId] !== undefined;

    const isBatchSelectedInOtherLot = (currentLotIdx, batchId) => {
        return lots.some((lot, idx) => idx !== currentLotIdx && lot.selectedBatches[batchId] !== undefined);
    };


    // ─── Styles ───────────────────────────────────────────────────────────────
    const overlayStyle = {
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '12px'
    };

    const modalStyle = {
        background: '#fff', width: '100%', maxWidth: '1100px', maxHeight: '98vh',
        borderRadius: '16px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden',
        border: '1px solid #e2e8f0'
    };

    const content = (
        <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* ── Scrollable Body ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>

                    {/* ════ SECTION A ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '10px 14px', marginBottom: '10px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                    }}>
                        <SectionHeader step="A" label="Call Header & PO Statistics" color="#21808d" />
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '8px', paddingLeft: '8px' }}>
                            <div>
                                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO NO.</div>
                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '12px' }}>{poNo || '06255012201348'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SR. NO.</div>
                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '12px' }}>{srItem?.itemSrNo || srItem?.srNo || '1'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CALL DATE</div>
                                <div style={{ fontWeight: 900, color: '#0891b2', fontSize: '12px' }}>{new Date().toLocaleDateString('en-IN')}</div>
                            </div>
                        </div>
                        <div style={{ paddingLeft: '8px' }}>
                            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PO STATUS TRACKER</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                        borderRadius: '10px', padding: '10px 14px', marginBottom: '10px'
                    }}>
                        <SectionHeader step="B" label="Rail Pad Type & Granular Batch Selection" color="#7c3aed" />
                        <div style={{ paddingLeft: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>RAIL PAD TYPE <span style={{ color: '#ef4444' }}>*</span></label>
                                    <select value={railPadType} onChange={e => handleRailPadTypeChange(e.target.value)} style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b', background: '#fff', fontSize: '12px', outline: 'none' }}>
                                        <option value="" disabled>Select Rail Pad Type</option>
                                        {RAIL_PAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Drawing No. <span style={{ color: '#ef4444' }}>*</span></label>
                                    {DRAWING_MAPPING[railPadType] && DRAWING_MAPPING[railPadType].length > 0 ? (
                                        <select value={drawingNo} onChange={e => { setDrawingNo(e.target.value); setSelectedProcessIcs([]); setInventory([]); }} style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b', background: '#fff', fontSize: '12px', outline: 'none' }} disabled={!railPadType}>
                                            <option value="" disabled>Select Drawing</option>
                                            {DRAWING_MAPPING[railPadType].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    ) : (
                                        <input type="text" value={drawingNo} onChange={e => { setDrawingNo(e.target.value); setSelectedProcessIcs([]); setInventory([]); }} placeholder="Enter drawing no." style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b', fontSize: '12px', outline: 'none' }} disabled={!railPadType} />
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Process ICs <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px', maxHeight: '58px', overflowY: 'auto', background: '#fff', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {loadingProcessCalls ? (
                                            <span style={{ fontSize: '11px', color: '#94a3b8', padding: '2px 4px' }}>Loading...</span>
                                        ) : processCalls.length === 0 ? (
                                            <span style={{ fontSize: '11px', color: '#94a3b8', padding: '2px 4px' }}>No Process ICs</span>
                                        ) : (
                                            processCalls.map(c => {
                                                const isChecked = selectedProcessIcs.includes(c.callNo);
                                                return (
                                                    <label key={c.callNo} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 4px', cursor: 'pointer', borderRadius: '4px', background: isChecked ? '#f1f5f9' : 'transparent', margin: 0 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedProcessIcs(prev => [...prev, c.callNo]);
                                                                } else {
                                                                    setSelectedProcessIcs(prev => prev.filter(id => id !== c.callNo));
                                                                }
                                                            }}
                                                            style={{ cursor: 'pointer', margin: 0, width: '13px', height: '13px' }}
                                                        />
                                                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#1e293b' }}>
                                                            {c.callNo} ({c.totalQty} Nos.)
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Unit of Measurement</label>
                                    <div style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#64748b', background: '#f8fafc', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                                        {uom}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Desired Inspection Date</label>
                                    <input type="date" value={desiredDate} onChange={e => setDesiredDate(e.target.value)} style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b', fontSize: '12px', outline: 'none' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Total Qty to be Offered</label>
                                    <input
                                        type="text"
                                        value={totalQtyToOffer}
                                        onChange={e => setTotalQtyToOffer(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="Enter quantity"
                                        style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '13px', color: '#0891b2', outline: 'none' }}
                                    />
                                    {totalQtyToOffer > (srItem?.due || 59420) && <p style={{ color: '#dc2626', fontSize: '9px', marginTop: '2px', fontWeight: 700 }}>⚠️ Cannot exceed Qty Due for Dispatch!</p>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>No. of Lots to be Offered</label>
                                    <input
                                        type="text"
                                        value={noOfLots}
                                        onChange={e => setNoOfLots(e.target.value.replace(/[^0-9]/g, ''))}
                                        style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px', border: lotCountError ? '1px solid #ef4444' : '1px solid #cbd5e1', fontWeight: 800, fontSize: '13px', color: '#1e293b', outline: 'none' }}
                                    />
                                    {lotCountError && <p style={{ color: '#dc2626', fontSize: '9px', marginTop: '2px', fontWeight: 700 }}>⚠️ {lotCountError}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ════ SECTION C ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '12px 14px', marginBottom: '10px'
                    }}>
                        <SectionHeader step="C" label="Dynamic Lot Formation (Collapsible Sections)" color="#0891b2" />
                        <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {lots.map((lot, lotIdx) => {
                                const lotSum = getLotSum(lot);
                                return (
                                    <div key={lot.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                        <div
                                            onClick={() => setExpandedLots(prev => ({ ...prev, [lotIdx]: !prev[lotIdx] }))}
                                            style={{
                                                background: '#f8fafc', padding: '8px 12px', cursor: 'pointer',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                borderBottom: expandedLots[lotIdx] ? '1px solid #e2e8f0' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontWeight: 900, color: '#0891b2', fontSize: '13px' }}>{lot.lotNo}</span>
                                                <span style={{
                                                    fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '12px',
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
                                                        marginLeft: '8px', padding: '4px 8px', borderRadius: '4px',
                                                        background: '#0891b2', color: '#fff', border: 'none',
                                                        fontSize: '10px', fontWeight: 800, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                        height: '24px', boxShadow: '0 2px 4px -1px rgba(8,145,178,0.15)'
                                                    }}
                                                >
                                                    <span>(+) Partial Declaration</span>
                                                </button>
                                            </div>
                                            <span style={{ fontSize: '10px', color: '#64748b' }}>{expandedLots[lotIdx] ? '▲' : '▼'}</span>
                                        </div>

                                        {expandedLots[lotIdx] && (
                                            <div style={{ padding: '10px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Lot No.</label>
                                                        <input
                                                            type="text" value={lot.lotNo}
                                                            onChange={e => {
                                                                const newLots = [...lots];
                                                                newLots[lotIdx].lotNo = e.target.value;
                                                                setLots(newLots);
                                                            }}
                                                            style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 700 }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Lot Size (Auto-Calculated)</label>
                                                        <div style={{
                                                            width: '100%', height: '32px', padding: '0 8px', borderRadius: '6px',
                                                            border: '1px solid #0891b2', background: '#ecfeff',
                                                            display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 900, color: '#0891b2'
                                                        }}>
                                                            {lotSum.toLocaleString()}
                                                        </div>
                                                        {lotSum > lotLimit && (
                                                            <p style={{ color: '#ef4444', fontSize: '9px', marginTop: '3px', fontWeight: 800 }}>⚠️ Lot size exceeds limit of {lotLimit.toLocaleString()}!</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {/* Batch Tree */}
                                                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Accepted Inventory (Date-Wise)</span>
                                                            {loadingInventory && <span style={{ color: '#0891b2', fontSize: '9px' }}>Refreshing...</span>}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {loadingInventory && filteredInventory.length === 0 ? (
                                                                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
                                                                    ⏳ Fetching accepted batches...
                                                                </div>
                                                            ) : filteredInventory.length === 0 ? (
                                                                <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', background: '#fef2f2', borderRadius: '8px', border: '1px dashed #fee2e2' }}>
                                                                    <div style={{ fontSize: '18px', marginBottom: '6px' }}>🚫</div>
                                                                    <div style={{ fontSize: '12px', fontWeight: 800 }}>No Accepted Inventory Found</div>
                                                                    <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px', opacity: 0.8 }}>No production verification records exist for {railPadType} at this plant.</div>
                                                                </div>
                                                            ) : (
                                                                filteredInventory.map(dateGroup => {
                                                                    const availableBatches = dateGroup.batches.filter(b => !isBatchSelectedInOtherLot(lotIdx, b.id));
                                                                    if (availableBatches.length === 0) return null;
                                                                    return (
                                                                        <div key={dateGroup.productionDate} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                                                                            <div style={{ padding: '6px 10px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                                                                                        checked={availableBatches.length > 0 && availableBatches.every(b => isBatchSelected(lotIdx, b.id))}
                                                                                        onChange={e => handleDateMasterToggle(lotIdx, dateGroup, e.target.checked)}
                                                                                    />
                                                                                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#334155' }}>{formatDateDDMMYY(dateGroup.productionDate)}</span>
                                                                                    <span style={{ fontSize: '9px', fontWeight: 800, background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: '8px' }}>{availableBatches.length} Batches</span>
                                                                                </div>
                                                                                <button onClick={() => setExpandedDates(p => ({ ...p, [dateGroup.productionDate]: !p[dateGroup.productionDate] }))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: 0 }}>
                                                                                    {expandedDates[dateGroup.productionDate] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                                                                </button>
                                                                            </div>
                                                                            <div style={{ padding: '6px 8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '5px', background: '#fcfcfd' }}>
                                                                                {availableBatches.map(batch => {
                                                                                    const isSelected = isBatchSelected(lotIdx, batch.id);
                                                                                    return (
                                                                                        <div
                                                                                            key={batch.id}
                                                                                            onClick={() => handleBatchSelection(lotIdx, batch, !isSelected)}
                                                                                            style={{
                                                                                                padding: '4px 8px', borderRadius: '6px', background: isSelected ? '#0f172a' : '#fff',
                                                                                                border: `1px solid ${isSelected ? '#0f172a' : '#e2e8f0'}`,
                                                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                                                cursor: 'pointer', transition: 'all 0.1s',
                                                                                                boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                                                                            }}
                                                                                        >
                                                                                            <div style={{
                                                                                                width: '12px', height: '12px', borderRadius: '3px',
                                                                                                border: `1px solid ${isSelected ? '#38bdf8' : '#cbd5e1'}`,
                                                                                                background: isSelected ? '#38bdf8' : 'transparent',
                                                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#0f172a' : '#fff',
                                                                                                flexShrink: 0
                                                                                            }}>
                                                                                                {isSelected && <CheckCircle2 size={8} strokeWidth={3} />}
                                                                                            </div>
                                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                                <div style={{ fontSize: '10px', fontWeight: 800, color: isSelected ? '#fff' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Batch: {batch.batchNo}</div>
                                                                                                {railPadType?.includes('NCRGRSP') && (
                                                                                                    <div style={{ fontSize: '9px', color: isSelected ? '#bae6fd' : '#0284c7', fontWeight: 700 }}>Drawing No: {batch.drawingNo || 'N/A'}</div>
                                                                                                )}
                                                                                                <div style={{ fontSize: '8px', color: isSelected ? '#94a3b8' : '#64748b', fontWeight: 700 }}>
                                                                                                    Qty: {batch.qty.toLocaleString()}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
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
                        borderRadius: '10px', padding: '12px 14px', marginBottom: '10px'
                    }}>
                        <SectionHeader step="D" label="Final Call Summary" color="#1e293b" />
                        <div style={{ paddingLeft: '8px' }}>
                            <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800 }}>TOTAL QTY OFFERED</div>
                                        <div style={{ fontSize: '15px', fontWeight: 950, color: totalMatchesOffered ? '#16a34a' : '#ef4444' }}>
                                            {totalOfferedFromLots.toLocaleString()} / {(parseInt(totalQtyToOffer) || 0).toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8' }}>{uom}</div>
                                    </div>
                                    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800 }}>TOTAL LOTS</div>
                                        <div style={{ fontSize: '15px', fontWeight: 950, color: '#1e293b' }}>{noOfLots}</div>
                                    </div>
                                    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800 }}>STATUS</div>
                                        <div style={{ fontSize: '12px', fontWeight: 900, color: isValid ? '#16a34a' : '#ef4444' }}>{isValid ? 'READY TO SUBMIT' : 'VALIDATION PENDING'}</div>
                                    </div>
                                </div>
                                {!totalMatchesOffered && totalQtyToOffer > 0 && (
                                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#ef4444', fontWeight: 800, textAlign: 'center' }}>
                                        ⚠️ Sum of all lots must exactly match the "Total Qty to be Offered" ({totalQtyToOffer.toLocaleString()})
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                        {totalOfferedFromLots === 0 ? "No pads selected yet" : <span>Total Offered: <span style={{ color: totalMatchesOffered ? '#16a34a' : '#ef4444', fontWeight: 900, fontSize: '14px' }}>{totalOfferedFromLots.toLocaleString()}</span> / {(parseInt(totalQtyToOffer) || 0).toLocaleString()}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} style={{
                            height: '34px', padding: '0 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            background: '#fff', color: '#475569', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>Cancel</button>
                        <button
                            disabled={!isValid || isSubmitting}
                            onClick={handleSubmit}
                            style={{
                                height: '34px', padding: '0 24px', borderRadius: '8px', border: 'none',
                                background: isValid ? 'linear-gradient(135deg, #21808d, #0d3b3f)' : '#e2e8f0',
                                color: isValid ? '#fff' : '#94a3b8', fontWeight: 900, fontSize: '12px',
                                cursor: isValid ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: isValid ? '0 4px 6px -1px rgba(33,128,141,0.2)' : 'none'
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
                    lotLimit={lotLimit}
                    inventory={filteredInventory}
                    alreadySelectedBatchIds={(() => {
                        const ids = new Set();
                        lots.forEach((l, idx) => {
                            if (idx !== activePartialLotIdx) {
                                Object.keys(l.selectedBatches).forEach(id => ids.add(String(id)));
                            }
                        });
                        return ids;
                    })()}
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
                /* Custom Scrollbar for compact feel */
                div::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                div::-webkit-scrollbar-track {
                    background: transparent;
                }
                div::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </>
    );

    if (isWrapped) return content;

    return createPortal(
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
                    padding: '10px 16px', flexShrink: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px', textTransform: 'uppercase' }}>
                            RAISE FINAL INSPECTION CALL
                        </div>
                        <div style={{ color: '#fff', fontSize: '16px', fontWeight: 900, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={18} />
                            {poNo || '06255012201348'} — SR. No. {srItem?.itemSrNo || srItem?.srNo || '1'}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                        width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></button>
                </div>
                {content}
            </div>
        </div>,
        document.body
    );
};

// ─── Partial Offering Modal Component ──────────────────────────────────────────
const PartialOfferingModal = ({ lot, lotLimit = 10000, inventory, alreadySelectedBatchIds = new Set(), onClose, onSubmit }) => {
    // Initialize with existing selections from the lot
    const [selectedBatches, setSelectedBatches] = useState(lot.selectedBatches || {});

    const allBatches = useMemo(() => {
        const list = [];
        // 'inventory' prop here is actually 'filteredInventory' passed from parent
        (inventory || []).forEach(group => {
            (group.batches || []).forEach(b => {
                if (alreadySelectedBatchIds.has(String(b.id))) return;

                list.push({
                    id: b.id,
                    batchNo: b.batchNo,
                    pending: b.pending || b.qty || 0,
                    productionDate: group.productionDate
                });
            });
        });
        return list;
    }, [inventory, alreadySelectedBatchIds]);

    const totalSelected = Object.values(selectedBatches).reduce((acc, v) => acc + v, 0);

    const handleAddBatch = (val) => {
        if (!val) return;
        // Convert both to string to handle potential number/string mismatch
        const batch = allBatches.find(b => String(b.id) === String(val));
        if (batch && !selectedBatches[batch.id]) {
            const potentialNewTotal = totalSelected + batch.pending;
            if (potentialNewTotal > lotLimit) {
                alert(`Lot Limit Exceeded!\n\n1 lot cannot have more than ${lotLimit.toLocaleString()} Nos. (IRS T-55 constraint).\n\nYou need to select/create a second lot for quantities exceeding ${lotLimit.toLocaleString()} Nos.`);
                const remainingCapacity = Math.max(0, lotLimit - totalSelected);
                if (remainingCapacity > 0) {
                    setSelectedBatches(prev => ({ ...prev, [batch.id]: remainingCapacity }));
                }
                return;
            }
            setSelectedBatches(prev => ({ ...prev, [batch.id]: batch.pending }));
        }
    };

    const handleQtyChange = (batchId, qty, max) => {
        const val = Math.max(0, Math.min(parseInt(qty) || 0, max));
        const currentVal = selectedBatches[batchId] || 0;
        const otherBatchesSum = totalSelected - currentVal;

        if (otherBatchesSum + val > lotLimit) {
            alert(`Lot Limit Exceeded!\n\n1 lot cannot have more than ${lotLimit.toLocaleString()} Nos. (IRS T-55 constraint).\n\nYou need to select/create a second lot for quantities exceeding ${lotLimit.toLocaleString()} Nos.`);
            const allowedVal = Math.max(0, lotLimit - otherBatchesSum);
            setSelectedBatches(prev => ({ ...prev, [batchId]: allowedVal }));
            return;
        }

        setSelectedBatches(prev => ({ ...prev, [batchId]: val }));
    };

    const handleRemove = (batchId) => {
        const newSelected = { ...selectedBatches };
        delete newSelected[batchId];
        setSelectedBatches(newSelected);
    };

    const availableOptions = allBatches.filter(b => !selectedBatches[b.id]);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(6px)', zIndex: 11000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '12px'
        }}>
            <div style={{
                background: '#fff', width: '100%', maxWidth: '640px',
                borderRadius: '16px', display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', overflow: 'hidden',
                border: '1px solid #e2e8f0'
            }}>
                {/* Header */}
                <div style={{
                    padding: '10px 16px', background: 'linear-gradient(135deg, #0891b2, #0e7490)', color: '#fff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ClipboardList size={18} />
                        <div>
                            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.8, textTransform: 'uppercase' }}>Declaration for {lot.lotNo}</div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Partial Offering Configuration</h3>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                        width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></button>
                </div>

                <div style={{ padding: '12px 16px', overflowY: 'auto', maxHeight: '65vh', background: '#fcfcfd' }}>
                    {/* Batch Selector */}
                    <div style={{
                        background: '#fff', padding: '10px 14px', borderRadius: '10px',
                        border: '1px solid #e2e8f0', marginBottom: '10px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                        <label style={{ display: 'block', fontSize: '9px', fontWeight: 900, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            Add Production Batch to Lot
                        </label>
                        <select
                            onChange={(e) => handleAddBatch(e.target.value)}
                            value=""
                            style={{
                                width: '100%', height: '32px', padding: '0 8px',
                                borderRadius: '6px', border: '1px solid #e2e8f0',
                                fontWeight: 800, color: '#1e293b', background: '#f8fafc',
                                outline: 'none', cursor: 'pointer', fontSize: '12px'
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
                            <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                                {allBatches.length === 0
                                    ? "No batches selected in Section C for this lot."
                                    : "All selected batches from lot are already configured."}
                            </p>
                        )}
                    </div>

                    {/* Selection List */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase' }}>Selected Items ({Object.keys(selectedBatches).length})</div>
                        {Object.keys(selectedBatches).length > 0 && (
                            <button onClick={() => setSelectedBatches({})} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}>REMOVE ALL</button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(selectedBatches).length === 0 ? (
                            <div style={{
                                padding: '20px', textAlign: 'center', color: '#94a3b8',
                                background: '#fff', border: '1px dashed #e2e8f0', borderRadius: '10px',
                            }}>
                                <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'center' }}>
                                    <Package size={32} />
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 700 }}>No batches selected yet</div>
                                <div style={{ fontSize: '10px', fontWeight: 500, marginTop: '2px' }}>Use the dropdown above to add batches to this lot</div>
                            </div>
                        ) : (
                            Object.entries(selectedBatches).map(([batchId, qty]) => {
                                const batch = allBatches.find(b => String(b.id) === String(batchId));
                                const isInvalid = qty <= 0 || qty > (batch?.pending || 0);

                                return (
                                    <div key={batchId} style={{
                                        padding: '8px 12px', background: '#fff', borderRadius: '10px', border: `1px solid ${isInvalid ? '#fee2e2' : '#e2e8f0'}`,
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>{batch?.batchNo}</div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{formatDateDDMMYY(batch?.productionDate)}</span>
                                                <span style={{ fontSize: '10px', color: '#0891b2', fontWeight: 800 }}>Available: {batch?.pending.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div style={{ width: '120px' }}>
                                            <div style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Quantity to Offer</div>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    value={qty}
                                                    onChange={(e) => handleQtyChange(batchId, e.target.value, batch?.pending)}
                                                    style={{
                                                        width: '100%', height: '30px', padding: '0 8px',
                                                        borderRadius: '6px', border: `1px solid ${isInvalid ? '#ef4444' : '#0891b2'}`,
                                                        fontWeight: 900, fontSize: '13px', color: '#0891b2',
                                                        outline: 'none', background: isInvalid ? '#fff1f2' : '#f0f9ff'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(batchId)}
                                            style={{
                                                width: '28px', height: '28px', border: 'none',
                                                background: '#fee2e2', color: '#ef4444',
                                                borderRadius: '6px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
                                            onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
                                        ><Trash2 size={14} /></button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Lot Quantity:</span>
                        <span style={{ fontSize: '16px', fontWeight: 950, color: '#1e293b' }}>{totalSelected.toLocaleString()}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>Nos.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} style={{ height: '34px', padding: '0 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                        <button
                            disabled={Object.keys(selectedBatches).length === 0}
                            onClick={() => onSubmit(selectedBatches)}
                            style={{
                                height: '34px', padding: '0 20px', borderRadius: '8px', border: 'none',
                                background: Object.keys(selectedBatches).length === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #0891b2, #0e7490)',
                                color: Object.keys(selectedBatches).length === 0 ? '#94a3b8' : '#fff',
                                fontWeight: 900, fontSize: '12px', cursor: Object.keys(selectedBatches).length === 0 ? 'not-allowed' : 'pointer',
                                boxShadow: Object.keys(selectedBatches).length === 0 ? 'none' : '0 4px 6px -1px rgba(8,145,178,0.15)'
                            }}
                        >Confirm & Update Lot</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RaiseRailPadInspectionCallForm;
