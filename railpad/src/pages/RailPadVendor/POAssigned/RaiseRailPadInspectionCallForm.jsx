import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { inventoryService } from '../../../services/inventoryService';
import inspectionCallService from '../../../services/inspectionCallService';
import { formatDateDDMMYY } from '../../../utils/dateUtils';
import {
    Calendar, Package, ClipboardList, CheckCircle2,
    AlertCircle, Trash2, ChevronDown, ChevronUp, Plus, Minus,
    Info, Search, Edit
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
    "6.20mm CGRSP": ["RT-6618", "RT-8327"],
    "10.00mm CGRSP": ["RT-8528", "RT-8694", "RT-8747", "RT-8998"],
    "6.00mm NCRGRSP": [
        "RT-6154",
        "RT-6155",
        "RT-8779",
        "RT-9774",
        "RT-4218",
        "RT-4218_1",
        "RT-4865 (52 KG)",
        "RT-4865 Alt-8",
        "RT-4865 Alt-9",
        "RT-4220",
        "RT-4967",
        "RT-6068",
        "RT-8893 to RT-8905",
        "RT-8886 to RT-8889",
        "RT-4734",
        "RT-4733",
        "RT-4867",
        "RT-5691",
        "RT-5693",
        "RT-10241",
        "RT-10243",
        "RT-8822",
        "RT-9790",
        "RT-4732",
        "RT-9841"
    ],
    "10.00mm NCRGRSP": [
        "RT-4218",
        "RT-4218_1",
        "RT-4865 (52 KG)",
        "RT-9790",
        "RT-10070",
        "RT-4734",
        "RT-6154",
        "RT-6155",
        "RT-4733",
        "RT-4867",
        "RT-5691",
        "RT-5693",
        "RT-6068",
        "RT-10241",
        "RT-10243",
        "RT-8822",
        "T-9842 to T-9843"
    ]
};

const UOM_OPTIONS = ['Nos.', 'Set'];

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
const RaiseRailPadInspectionCallForm = ({
    srItem,
    poNo,
    plantId,
    vendorCode,
    onClose,
    onSubmitInspectionCall,
    isWrapped,
    isReadOnly = false,
    isModifyMode = false,
    callData = null
}) => {
    const effectivePoNo = poNo || callData?.poNo || callData?.po_no || '';
    const effectiveSrItem = srItem || {
        itemSrNo: callData?.poSr || callData?.poSerialNo || callData?.po_sr || '001',
        orderedQty: callData?.orderedQty || callData?.totalQty || 0,
        acceptedTillNow: callData?.qtyAcceptedTillNow || 0,
        rejectedTillNow: callData?.qtyRejectedTillNow || 0,
        offeredTillNow: callData?.qtyOfferedTillNow || 0,
        due: callData?.dueQty || callData?.orderedQty || callData?.totalQty || 0,
        ...callData
    };
    const effectiveCallNo = callData?.callNo || callData?.call_no || '';

    // ─── ALL STATE HOOKS (must all be declared before any conditional return) ─────
    const storageKey = useMemo(() => {
        const po = effectivePoNo ? String(effectivePoNo).replace(/[^a-zA-Z0-9_-]/g, '_') : 'PO';
        const sr = effectiveSrItem?.itemSrNo || effectiveSrItem?.srNo || '1';
        return `railpad_draft_std_final_${po}_${sr}`;
    }, [effectivePoNo, effectiveSrItem?.itemSrNo, effectiveSrItem?.srNo]);

    const savedDraft = useMemo(() => {
        if (callData || isReadOnly || isModifyMode) return null;
        try {
            const item = localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            return null;
        }
    }, [storageKey, callData, isReadOnly, isModifyMode]);

    const defaultPadType = (effectiveSrItem?.poDes?.includes('NCRGRSP') || effectiveSrItem?.description?.includes('NCRGRSP'))
        ? '6.00mm NCRGRSP'
        : (callData?.railPadType || '');
    const extractProcessIcs = (data) => {
        if (!data) return [];
        const raw = data.processInspectionCertNo || data.processIcNo || data.process_ic_no || data.processIcNumbers || data.processIc || '';
        if (Array.isArray(raw)) return raw.map(s => String(s).trim()).filter(Boolean);
        if (typeof raw === 'string' && raw.trim()) {
            return raw.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [];
    };

    const initialProcessIcs = callData ? extractProcessIcs(callData) : [];
    const [railPadType, setRailPadType] = useState(callData?.railPadType || savedDraft?.railPadType || defaultPadType);
    const [drawingNo, setDrawingNo] = useState(callData?.drawingNo || savedDraft?.drawingNo || '');
    const [selectedProcessIcs, setSelectedProcessIcs] = useState(
        initialProcessIcs.length > 0 ? initialProcessIcs : (savedDraft?.selectedProcessIcs || [])
    );
    const [processCalls, setProcessCalls] = useState([]);
    const [loadingProcessCalls, setLoadingProcessCalls] = useState(false);
    const uom = effectiveSrItem?.unit || effectiveSrItem?.uom || 'Nos.';
    const [desiredDate, setDesiredDate] = useState(() => {
        if (callData?.inspectionDate) {
            try {
                return new Date(callData.inspectionDate).toISOString().split('T')[0];
            } catch (e) {
                return callData.inspectionDate;
            }
        }
        return savedDraft?.desiredDate || new Date().toISOString().split('T')[0];
    });
    const [totalQtyToOffer, setTotalQtyToOffer] = useState(
        callData?.totalQty !== undefined ? String(callData.totalQty) : (savedDraft?.totalQtyToOffer || '')
    );
    const initialLotsCount = callData?.noOfLots || (callData?.lots && callData.lots.length > 0 ? callData.lots.length : (savedDraft?.noOfLots !== undefined ? savedDraft.noOfLots : 1));
    const [noOfLots, setNoOfLots] = useState(initialLotsCount);
    const [remarks, setRemarks] = useState(callData?.remarks || savedDraft?.remarks || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [notification, setNotification] = useState(null);

    // Auto-dismiss notification toast after 4 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const initialLotsState = useMemo(() => {
        if (callData?.lots && Array.isArray(callData.lots) && callData.lots.length > 0) {
            return callData.lots.map((l, lIdx) => {
                const sel = {};
                (l.batches || []).forEach(b => {
                    const qty = Number(b.quantity || b.qtyToUse || 0);
                    const key = b.batchNo || b.declarationBatchId || b.id;
                    if (key) sel[key] = qty;
                });
                return {
                    id: l.id || lIdx + 1,
                    lotNo: l.lotNo || `LOT-${lIdx + 1}`,
                    selectedBatches: sel,
                    savedBatches: l.batches || []
                };
            });
        }
        return savedDraft?.lots || [{ id: 1, lotNo: 'LOT-1', selectedBatches: {} }];
    }, [callData, savedDraft]);

    const [lots, setLots] = useState(initialLotsState);
    const [expandedLots, setExpandedLots] = useState({ 0: true });
    const [expandedDates, setExpandedDates] = useState({});
    const [activePartialLotIdx, setActivePartialLotIdx] = useState(null);

    // Sync state if callData changes
    useEffect(() => {
        if (callData) {
            if (callData.railPadType) setRailPadType(callData.railPadType);
            if (callData.drawingNo) setDrawingNo(callData.drawingNo);
            const ics = extractProcessIcs(callData);
            if (ics.length > 0) {
                setSelectedProcessIcs(ics);
            }
            if (callData.inspectionDate) {
                try {
                    setDesiredDate(new Date(callData.inspectionDate).toISOString().split('T')[0]);
                } catch (e) {
                    setDesiredDate(callData.inspectionDate);
                }
            }
            if (callData.totalQty !== undefined) setTotalQtyToOffer(String(callData.totalQty));
            if (callData.remarks !== undefined) setRemarks(callData.remarks || '');
            const lotsCount = callData.noOfLots || (callData.lots && callData.lots.length > 0 ? callData.lots.length : 1);
            setNoOfLots(lotsCount);

            if (Array.isArray(callData.lots) && callData.lots.length > 0) {
                const mappedLots = callData.lots.map((l, lIdx) => {
                    const sel = {};
                    (l.batches || []).forEach(b => {
                        const qty = Number(b.quantity || b.qtyToUse || 0);
                        const key = b.batchNo || b.declarationBatchId || b.id;
                        if (key) sel[key] = qty;
                    });
                    return {
                        id: l.id || lIdx + 1,
                        lotNo: l.lotNo || `LOT-${lIdx + 1}`,
                        selectedBatches: sel,
                        savedBatches: l.batches || []
                    };
                });
                setLots(mappedLots);
            }
        }
    }, [callData]);

    // Persist standard final call draft to localStorage (only when raising new call)
    useEffect(() => {
        if (callData || isReadOnly || isModifyMode) return;
        if (railPadType && railPadType.includes('NCRGRSP')) return; // NCRGRSP manages its own draft
        try {
            const draftData = {
                railPadType,
                drawingNo,
                selectedProcessIcs,
                desiredDate,
                totalQtyToOffer,
                noOfLots,
                lots,
                remarks
            };
            localStorage.setItem(storageKey, JSON.stringify(draftData));
        } catch (e) {
            console.warn('Error persisting standard final call draft:', e);
        }
    }, [storageKey, callData, isReadOnly, isModifyMode, railPadType, drawingNo, selectedProcessIcs, desiredDate, totalQtyToOffer, noOfLots, lots, remarks]);

    // Fetch process calls matching railPadType and drawingNo
    useEffect(() => {
        const fetchProcessCalls = async () => {
            if (!railPadType || !drawingNo || !plantId) {
                setProcessCalls([]);
                return;
            }
            try {
                setLoadingProcessCalls(true);
                const cleanPo = effectivePoNo ? String(effectivePoNo).split('/')[0].trim() : '';
                const data = await inspectionCallService.getProcessCalls(railPadType, drawingNo, plantId, cleanPo, '');
                const sortedData = Array.isArray(data) ? [...data].sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.created_at || a.createdOn || a.inspectionDate || 0);
                    const dateB = new Date(b.createdAt || b.created_at || b.createdOn || b.inspectionDate || 0);
                    if (dateA.getTime() !== dateB.getTime()) {
                        return dateB.getTime() - dateA.getTime();
                    }
                    const callNoA = String(a.inspectionCallNo || a.callNo || a.id || '');
                    const callNoB = String(b.inspectionCallNo || b.callNo || b.id || '');
                    return callNoB.localeCompare(callNoA, undefined, { numeric: true, sensitivity: 'base' });
                }) : [];

                // Fetch detailed available final batches breakdown for each process call
                const detailsList = await Promise.all(
                    sortedData.map(async (pc) => {
                        const pcNo = pc.callNo || pc.inspectionCallNo || pc.id;
                        try {
                            const res = await inspectionCallService.getAvailableFinalBatches(pcNo, effectiveCallNo);
                            const batches = res?.batches || [];
                            const totalAccepted = batches.reduce((sum, b) => sum + Number(b.qtyAccepted || 0), 0);
                            const totalPreviouslyUsed = batches.reduce((sum, b) => sum + Number(b.previouslyOfferedQty || 0), 0);
                            const totalAvailableBalance = batches.reduce((sum, b) => sum + Number(b.qtyRemaining || 0), 0);
                            return {
                                ...pc,
                                callNo: pcNo,
                                inspectionDate: pc.inspectionDate || pc.callDate || pc.createdAt,
                                batches,
                                totalAccepted: totalAccepted || Number(pc.totalQty || 0),
                                totalPreviouslyUsed: totalPreviouslyUsed,
                                totalAvailableBalance: batches.length > 0 ? totalAvailableBalance : Number(pc.totalQty || 0)
                            };
                        } catch (e) {
                            return {
                                ...pc,
                                callNo: pcNo,
                                inspectionDate: pc.inspectionDate || pc.callDate || pc.createdAt,
                                batches: [],
                                totalAccepted: Number(pc.totalQty || 0),
                                totalPreviouslyUsed: 0,
                                totalAvailableBalance: Number(pc.totalQty || 0)
                            };
                        }
                    })
                );

                setProcessCalls(detailsList);

                // Only preselect process ICs for existing saved calls (view/modify mode)
                if (callData) {
                    setSelectedProcessIcs(prev => {
                        if (prev && prev.length > 0) return prev;
                        const extracted = extractProcessIcs(callData);
                        return extracted;
                    });
                }
            } catch (error) {
                console.error('Error fetching process calls:', error);
            } finally {
                setLoadingProcessCalls(false);
            }
        };
        fetchProcessCalls();
    }, [railPadType, drawingNo, plantId, effectivePoNo, callData, isReadOnly, isModifyMode]);

    // Fetch process inspection result batches on selectedProcessIcs change
    useEffect(() => {
        const fetchProcessBatches = async () => {
            if (selectedProcessIcs.length === 0 && (!callData?.lots || callData.lots.length === 0)) {
                setInventory([]);
                if (!callData && !isModifyMode && !isReadOnly) {
                    setLots(prev => prev.map(l => ({ ...l, selectedBatches: {} })));
                }
                return;
            }
            try {
                setLoadingInventory(true);
                const results = await Promise.all(
                    selectedProcessIcs.map(ic => inspectionCallService.getAvailableFinalBatches(ic, effectiveCallNo))
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
                    const manufactured = Number(b.qtyManufactured || b.quantityProduced || b.quantity || b.totalQty || 0);
                    const rejected = Number(b.verificationRejectedQty || b.rejectedQty || b.qtyRejected || 0);
                    const netAccepted = Math.max(0, manufactured - rejected);
                    const finalAccepted = (b.qtyAccepted !== undefined && b.qtyAccepted !== null)
                        ? Math.max(0, Math.min(Number(b.qtyAccepted), netAccepted))
                        : netAccepted;

                    const bKey = b.declarationBatchId || b.id || b.batchNo;
                    const existingBatch = grouped[dateStr].find(eb => eb.batchNo === b.batchNo && (eb.drawingNo === b.drawingNo || String(eb.id) === String(bKey)));
                    if (existingBatch) {
                        existingBatch.acceptedQty += finalAccepted;
                        existingBatch.quantity += finalAccepted;
                    } else {
                        grouped[dateStr].push({
                            id: bKey,
                            infoId: bKey,
                            batchNo: b.batchNo,
                            productType: railPadType,
                            drawingNo: b.drawingNo,
                            acceptedQty: finalAccepted,
                            quantity: finalAccepted
                        });
                    }
                });

                // Ensure batches saved in callData.lots are also present in grouped inventory (for View and Modify modes)
                if (callData?.lots && Array.isArray(callData.lots)) {
                    callData.lots.forEach(lot => {
                        (lot.batches || []).forEach(b => {
                            const dateStr = b.productionDate || new Date().toISOString().split('T')[0];
                            if (!grouped[dateStr]) {
                                grouped[dateStr] = [];
                            }
                            const bKey = b.declarationBatchId || b.infoId || b.id || b.batchNo;
                            const existing = grouped[dateStr].find(eb => eb.batchNo === b.batchNo && (String(eb.id) === String(bKey) || eb.drawingNo === b.drawingNo));
                            const bQty = Number(b.quantity || b.qtyToUse || 0);
                            if (!existing) {
                                grouped[dateStr].push({
                                    id: bKey,
                                    infoId: bKey,
                                    batchNo: b.batchNo,
                                    productType: railPadType,
                                    drawingNo: b.drawingNo || drawingNo,
                                    acceptedQty: bQty,
                                    quantity: bQty
                                });
                            } else if (existing.acceptedQty < bQty) {
                                existing.acceptedQty = Math.max(existing.acceptedQty, bQty);
                                existing.quantity = Math.max(existing.quantity, bQty);
                            }
                        });
                    });
                }

                const mappedInventory = Object.entries(grouped).map(([date, batches]) => ({
                    castingDate: date,
                    batches: batches
                }));
                setInventory(mappedInventory);

                // Prune any orphan/stale batch selections from lots that do not exist in the newly loaded inventory
                if (!callData && !isModifyMode && !isReadOnly) {
                    const validBatchKeys = new Set();
                    Object.values(grouped).forEach(batchList => {
                        batchList.forEach(b => {
                            if (b.id) validBatchKeys.add(String(b.id));
                            if (b.infoId) validBatchKeys.add(String(b.infoId));
                            if (b.batchNo) validBatchKeys.add(String(b.batchNo));
                        });
                    });

                    setLots(prevLots => prevLots.map(l => {
                        const newSel = {};
                        let changed = false;
                        Object.entries(l.selectedBatches || {}).forEach(([k, v]) => {
                            if (validBatchKeys.has(String(k))) {
                                newSel[k] = v;
                            } else {
                                changed = true;
                            }
                        });
                        return changed ? { ...l, selectedBatches: newSel } : l;
                    }));
                }
            } catch (error) {
                console.error('Error fetching process batches:', error);
                if (callData?.lots && Array.isArray(callData.lots)) {
                    const grouped = {};
                    callData.lots.forEach(lot => {
                        (lot.batches || []).forEach(b => {
                            const dateStr = b.productionDate || new Date().toISOString().split('T')[0];
                            if (!grouped[dateStr]) grouped[dateStr] = [];
                            const bKey = b.declarationBatchId || b.infoId || b.id || b.batchNo;
                            const bQty = Number(b.quantity || b.qtyToUse || 0);
                            grouped[dateStr].push({
                                id: bKey,
                                infoId: bKey,
                                batchNo: b.batchNo,
                                productType: railPadType,
                                drawingNo: b.drawingNo || drawingNo,
                                acceptedQty: bQty,
                                quantity: bQty
                            });
                        });
                    });
                    setInventory(Object.entries(grouped).map(([date, batches]) => ({ castingDate: date, batches })));
                } else {
                    setInventory([]);
                }
            } finally {
                setLoadingInventory(false);
            }
        };
        fetchProcessBatches();
    }, [selectedProcessIcs, railPadType, effectiveCallNo, callData, drawingNo]);

    // Handle lots count change when raising/modifying
    useEffect(() => {
        if (isReadOnly) return; // In read-only mode, lots are populated directly from callData
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
    }, [noOfLots, isReadOnly]);

    // ─── useMemo HOOKS (must also be declared before any conditional return) ───
    const getLotSum = (lot) => {
        if (isReadOnly && lot?.savedBatches && lot.savedBatches.length > 0) {
            return lot.savedBatches.reduce((acc, b) => acc + Number(b.quantity || b.qtyToUse || 0), 0);
        }
        return Object.values(lot?.selectedBatches || {}).reduce((acc, v) => acc + (parseInt(v) || 0), 0);
    };

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

    const selectedProcessSummary = useMemo(() => {
        let totalAccepted = 0;
        let totalUsed = 0;
        let totalBalance = 0;

        selectedProcessIcs.forEach(icNo => {
            const found = processCalls.find(pc => String(pc.callNo).trim().toUpperCase() === String(icNo).trim().toUpperCase());
            if (found) {
                totalAccepted += Number(found.totalAccepted || 0);
                totalUsed += Number(found.totalPreviouslyUsed || 0);
                totalBalance += Number(found.totalAvailableBalance || 0);
            }
        });

        return { totalAccepted, totalUsed, totalBalance };
    }, [selectedProcessIcs, processCalls]);

    // Reset drawing no and process IC on railPadType change
    const handleRailPadTypeChange = (val) => {
        setRailPadType(val);
        setDrawingNo('');
        setSelectedProcessIcs([]);
        setProcessCalls([]);
        setInventory([]);
        setLots([{ id: 1, lotNo: 'LOT-1', selectedBatches: {} }]);
    };

    // ─── NCRGRSP Early Exit ── placed AFTER ALL hooks (React Rules of Hooks) ──
    if (railPadType.includes('NCRGRSP')) {
        return (
            <NCRGRSPFinalInspectionCall
                srItem={effectiveSrItem}
                poNo={effectivePoNo}
                plantId={plantId}
                vendorCode={vendorCode}
                onClose={onClose}
                onSubmitInspectionCall={onSubmitInspectionCall}
                initialRailPadType={railPadType || '6.00mm NCRGRSP'}
                onRailPadTypeChange={handleRailPadTypeChange}
                isReadOnly={isReadOnly}
                isModifyMode={isModifyMode}
                callData={callData}
            />
        );
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────
    const showNotification = (message, type = 'success', shouldClose = false) => {
        setNotification({ message, type });
        if (shouldClose) {
            setTimeout(() => {
                setNotification(null);
                if (onClose) onClose();
            }, 2500);
        } else {
            setTimeout(() => setNotification(null), 3500);
        }
    };

    // ─── Computed Values & Validations ────────────────────────────────────────
    const isNCRGRSP = railPadType.includes('NCRGRSP');
    const lotLimit = isNCRGRSP ? 5000 : 10000;
    const minLotsRequired = Math.ceil((parseInt(totalQtyToOffer) || 0) / lotLimit);
    const lotCountError = !isReadOnly && noOfLots < minLotsRequired ? `Minimum ${minLotsRequired} lots required for this quantity (IRS T-55 Constraint).` : null;

    const totalOfferedFromLots = lots.reduce((acc, lot) => acc + getLotSum(lot), 0);
    const totalMatchesOffered = isReadOnly ? true : (totalOfferedFromLots === (parseInt(totalQtyToOffer) || 0));
    const hasLotExceedingLimit = !isReadOnly && lots.some(lot => getLotSum(lot) > lotLimit);
    const isValid = railPadType && drawingNo && (isReadOnly || selectedProcessIcs.length > 0) && totalMatchesOffered && totalOfferedFromLots > 0 && !lotCountError && !hasLotExceedingLimit;

    const handleSubmit = async () => {
        if (isReadOnly) return;
        if (hasLotExceedingLimit) {
            alert(`Lot Limit Exceeded!\n\nOne or more lots exceed the maximum limit of ${lotLimit.toLocaleString()} Nos. (IRS T-55 constraint).\n\nPlease reduce the quantity or allocate the excess to a second lot.`);
            return;
        }
        try {
            setIsSubmitting(true);
            const userId = localStorage.getItem('railpad_userId') || vendorCode || 'Vendor';
            const cleanPo = String(effectivePoNo || '').split('/')[0].trim();
            const effectiveSr = effectiveSrItem?.itemSrNo || effectiveSrItem?.srNo || (String(effectivePoNo || '').includes('/') ? String(effectivePoNo).split('/')[1].trim() : '01');

            const payload = {
                callNo: effectiveCallNo || undefined,
                poNo: cleanPo,
                poSr: effectiveSr,
                poSrNo: effectiveSr,
                vendorCode: (vendorCode || effectiveSrItem?.vendorCode || 'V001').replace(/^:/, ''),
                plantId: (plantId || '').replace(/^:/, ''),
                callType: 'FINAL',
                railPadType: railPadType,
                drawingNo: drawingNo,
                processIcNo: selectedProcessIcs.join(','),
                totalQty: parseInt(totalQtyToOffer),
                noOfLots: parseInt(noOfLots),
                inspectionDate: desiredDate,
                remarks: remarks ? remarks.trim() : '',
                createdBy: userId,
                updatedBy: userId,
                lots: lots.map(lot => {
                    const batchList = [];
                    const seenBatchKeys = new Set();

                    Object.entries(lot.selectedBatches || {}).forEach(([batchId, qty]) => {
                        let batchInfo = null;
                        (inventory || []).forEach(group => {
                            const found = (group.batches || []).find(b => String(b.infoId) === String(batchId) || String(b.id) === String(batchId) || b.batchNo === batchId);
                            if (found) batchInfo = { ...found, productionDate: group.castingDate };
                        });

                        const effectiveBatchNo = batchInfo?.batchNo || batchId;
                        if (!seenBatchKeys.has(effectiveBatchNo)) {
                            seenBatchKeys.add(effectiveBatchNo);
                            seenBatchKeys.add(String(batchId));
                            batchList.push({
                                batchNo: effectiveBatchNo,
                                drawingNo: batchInfo?.drawingNo || drawingNo,
                                quantity: parseInt(qty),
                                qtyToUse: parseInt(qty),
                                productionDate: batchInfo?.productionDate || desiredDate
                            });
                        }
                    });

                    return {
                        lotNo: lot.lotNo,
                        lotSize: getLotSum(lot),
                        batches: batchList
                    };
                })
            };

            let result;
            if (onSubmitInspectionCall) {
                result = await onSubmitInspectionCall(payload);
            } else if (isModifyMode) {
                result = await inspectionCallService.modifyCall(payload);
            } else {
                result = await inspectionCallService.create(payload);
            }

            // Clear standard draft and wrapper draft on successful submission (if not modifying)
            if (!isModifyMode) {
                try {
                    localStorage.removeItem(storageKey);
                    const wrapperKey = `railpad_draft_call_type_${String(effectivePoNo || 'PO').replace(/[^a-zA-Z0-9_-]/g, '_')}_${effectiveSrItem?.itemSrNo || effectiveSrItem?.srNo || '1'}`;
                    localStorage.removeItem(wrapperKey);
                } catch (e) {
                    console.warn('Error clearing standard draft:', e);
                }
            }

            const callNo = (typeof result === 'string' && result)
                || result?.callNo
                || result?.responseData?.callNo
                || result?.data?.callNo
                || result?.responseData
                || result
                || effectiveCallNo;

            if (isModifyMode) {
                showNotification(`✅ Final Inspection Call modified successfully!\nCall No: ${callNo}`, 'success', true);
            } else {
                showNotification(`✅ Final Inspection Call raised successfully!\nCall No: ${callNo}`, 'success', true);
            }
        } catch (error) {
            console.error("[Submit Inspection Call] Error:", error);
            showNotification(isModifyMode ? "❌ Failed to modify inspection call." : "❌ Failed to raise inspection call.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const getQtyUsedInOtherLots = (currentLotIdx, batchId, batchNo) => {
        return lots.reduce((acc, lot, idx) => {
            if (idx !== currentLotIdx) {
                const sel = lot.selectedBatches || {};
                let qty = 0;
                if (batchId !== undefined && sel[batchId] !== undefined) {
                    qty = parseInt(sel[batchId]) || 0;
                } else if (batchNo && sel[batchNo] !== undefined) {
                    qty = parseInt(sel[batchNo]) || 0;
                }
                return acc + qty;
            }
            return acc;
        }, 0);
    };

    const getRemainingBatchQty = (currentLotIdx, batchId, batchNo, totalQty) => {
        const usedInOther = getQtyUsedInOtherLots(currentLotIdx, batchId, batchNo);
        return Math.max(0, totalQty - usedInOther);
    };

    const handleBatchSelection = (lotIdx, batch, checked) => {
        if (isReadOnly) return;
        const currentLot = lots[lotIdx];
        const currentLotSum = getLotSum(currentLot);
        const lotLimitForPad = lotLimit;
        const targetQty = parseInt(totalQtyToOffer) || 0;
        const currentTotalOffered = lots.reduce((acc, l) => acc + getLotSum(l), 0);

        if (checked) {
            if (targetQty > 0 && currentTotalOffered >= targetQty) {
                showNotification(`⚠️ Total Offered has reached the Total Qty to be Offered (${targetQty.toLocaleString()} Nos.)! Cannot select more batches.`, 'error');
                return;
            }
            if (currentLotSum >= lotLimitForPad) {
                showNotification(`⚠️ ${currentLot.lotNo} has already reached the maximum limit of ${lotLimitForPad.toLocaleString()} Nos.! Cannot select more batches.`, 'error');
                return;
            }
            const remainingForThisLot = getRemainingBatchQty(lotIdx, batch.id, batch.batchNo, batch.qty);
            if (remainingForThisLot <= 0) return;

            const remainingLotCap = lotLimitForPad - currentLotSum;
            const remainingOverallCap = targetQty > 0 ? Math.max(0, targetQty - currentTotalOffered) : remainingLotCap;
            const remainingCap = Math.min(remainingLotCap, remainingOverallCap);
            const qtyToTake = Math.min(remainingForThisLot, remainingCap);

            if (qtyToTake <= 0) return;

            setLots(prev => {
                const newLots = [...prev];
                const currentLotCopy = { ...newLots[lotIdx] };
                const newSelected = { ...currentLotCopy.selectedBatches, [batch.id]: qtyToTake };
                if (batch.batchNo) {
                    delete newSelected[batch.batchNo];
                }
                currentLotCopy.selectedBatches = newSelected;
                newLots[lotIdx] = currentLotCopy;
                return newLots;
            });

            if (qtyToTake < remainingForThisLot) {
                if (remainingCap === remainingOverallCap && remainingOverallCap < remainingLotCap) {
                    showNotification(`ℹ️ Added partial quantity of ${qtyToTake.toLocaleString()} Nos. (out of ${remainingForThisLot.toLocaleString()} Nos.) to complete Total Qty to be Offered at ${targetQty.toLocaleString()} Nos. max.`, 'success');
                } else {
                    showNotification(`ℹ️ Added partial quantity of ${qtyToTake.toLocaleString()} Nos. (out of ${remainingForThisLot.toLocaleString()} Nos.) to complete ${currentLot.lotNo} at ${lotLimitForPad.toLocaleString()} Nos. max.`, 'success');
                }
            }
        } else {
            setLots(prev => {
                const newLots = [...prev];
                const currentLotCopy = { ...newLots[lotIdx] };
                const newSelected = { ...currentLotCopy.selectedBatches };
                delete newSelected[batch.id];
                if (batch.batchNo) {
                    delete newSelected[batch.batchNo];
                }
                currentLotCopy.selectedBatches = newSelected;
                newLots[lotIdx] = currentLotCopy;
                return newLots;
            });
        }
    };

    const handleBatchQtyChange = (lotIdx, batchId, qty, max) => {
        if (isReadOnly) return;
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
        if (isReadOnly) return;
        const currentLot = lots[lotIdx];
        const currentLotSum = getLotSum(currentLot);
        const lotLimitForPad = lotLimit;
        const targetQty = parseInt(totalQtyToOffer) || 0;
        const currentTotalOffered = lots.reduce((acc, l) => acc + getLotSum(l), 0);

        if (!checked) {
            setLots(prev => {
                const newLots = [...prev];
                const currentLotCopy = { ...newLots[lotIdx] };
                const newSelected = { ...currentLotCopy.selectedBatches };
                dateGroup.batches.forEach(b => {
                    delete newSelected[b.id];
                    if (b.batchNo) delete newSelected[b.batchNo];
                });
                currentLotCopy.selectedBatches = newSelected;
                newLots[lotIdx] = currentLotCopy;
                return newLots;
            });
            return;
        }

        if (targetQty > 0 && currentTotalOffered >= targetQty) {
            showNotification(`⚠️ Total Offered has already reached the Total Qty to be Offered (${targetQty.toLocaleString()} Nos.)! Cannot select more batches.`, 'error');
            return;
        }

        if (currentLotSum >= lotLimitForPad) {
            showNotification(`⚠️ ${currentLot.lotNo} has already reached the maximum limit of ${lotLimitForPad.toLocaleString()} Nos.! Cannot select more batches.`, 'error');
            return;
        }

        let remainingLotCap = lotLimitForPad - currentLotSum;
        let remainingOverallCap = targetQty > 0 ? Math.max(0, targetQty - currentTotalOffered) : remainingLotCap;
        let remainingCap = Math.min(remainingLotCap, remainingOverallCap);
        const batchesToAdd = [];
        let partialAdded = false;

        for (const b of dateGroup.batches) {
            if (remainingCap <= 0) break;
            if (!isBatchSelected(lotIdx, b.id, b.batchNo)) {
                const bRemaining = getRemainingBatchQty(lotIdx, b.id, b.batchNo, b.qty);
                if (bRemaining > 0) {
                    const take = Math.min(bRemaining, remainingCap);
                    batchesToAdd.push({ id: b.id, batchNo: b.batchNo, qty: take });
                    remainingCap -= take;
                    if (take < bRemaining) {
                        partialAdded = true;
                    }
                }
            }
        }

        if (batchesToAdd.length === 0) return;

        setLots(prev => {
            const newLots = [...prev];
            const currentLotCopy = { ...newLots[lotIdx] };
            const newSelected = { ...currentLotCopy.selectedBatches };
            batchesToAdd.forEach(b => {
                newSelected[b.id] = b.qty;
                if (b.batchNo) delete newSelected[b.batchNo];
            });
            currentLotCopy.selectedBatches = newSelected;
            newLots[lotIdx] = currentLotCopy;
            return newLots;
        });

        if (partialAdded) {
            showNotification(`ℹ️ Batches added up to the limit (with partial quantity on the last batch).`, 'success');
        }
    };

    const isBatchSelected = (lotIdx, batchId, batchNo) => {
        const sel = lots[lotIdx]?.selectedBatches;
        if (!sel) return false;
        if (batchId !== undefined && sel[batchId] !== undefined) return true;
        if (batchNo && sel[batchNo] !== undefined) return true;
        return false;
    };

    const getSelectedBatchQty = (lotIdx, batchId, batchNo) => {
        const sel = lots[lotIdx]?.selectedBatches;
        if (!sel) return undefined;
        if (batchId !== undefined && sel[batchId] !== undefined) return sel[batchId];
        if (batchNo && sel[batchNo] !== undefined) return sel[batchNo];
        return undefined;
    };

    // ─── Styles ───────────────────────────────────────────────────────────────
    const overlayStyle = {
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '12px'
    };

    const modalStyle = {
        background: '#fff', width: '100%', maxWidth: '1150px', maxHeight: '98vh',
        borderRadius: '16px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden',
        border: '1px solid #e2e8f0'
    };

    const content = (
        <>
            {/* Toast Notification */}
            {notification && (
                <div style={{
                    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                    background: notification.type === 'success'
                        ? '#065f46'
                        : (notification.type === 'info'
                            ? '#1e40af'
                            : (notification.type === 'warning' ? '#b45309' : '#991b1b')),
                    color: '#fff', padding: '12px 20px', borderRadius: 10,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                    display: 'flex', alignItems: 'center', gap: 12,
                    zIndex: 100000, minWidth: 320, maxWidth: 550, fontWeight: 600, fontSize: 13
                }}>
                    {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <div style={{ whiteSpace: 'pre-line', flex: 1 }}>{notification.message}</div>
                    <button
                        type="button"
                        onClick={() => setNotification(null)}
                        style={{
                            background: 'transparent', border: 'none', color: '#fff',
                            cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, opacity: 0.8
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* ── Top Banner for Wrapped View/Modify Mode ── */}
                {(isWrapped && (isReadOnly || isModifyMode || (callData && effectiveCallNo))) && (
                    <div style={{
                        background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
                        padding: '16px 24px', color: '#fff',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexShrink: 0
                    }}>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, marginBottom: '4px' }}>
                                {isReadOnly ? 'VIEW FINAL INSPECTION CALL (READ-ONLY)' : isModifyMode ? 'MODIFY FINAL INSPECTION CALL' : 'RAISE FINAL INSPECTION CALL'}
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                                <Package size={22} />
                                {effectiveCallNo ? (
                                    <>
                                        <span>CALL NO: <span style={{ color: '#fef08a' }}>{effectiveCallNo}</span></span>
                                        <span style={{ fontSize: '14px', fontWeight: 700, opacity: 0.9, marginLeft: '8px' }}>
                                            — {effectivePoNo ? `${effectivePoNo}` : ''} {effectiveSrItem?.itemSrNo ? `(SR: ${effectiveSrItem.itemSrNo})` : ''}
                                        </span>
                                    </>
                                ) : (
                                    <span>{effectivePoNo || '06255012201348'} — SR. No. {effectiveSrItem?.itemSrNo || effectiveSrItem?.srNo || '001'}</span>
                                )}
                            </h2>
                        </div>
                        {onClose && (
                            <button onClick={onClose} style={{
                                background: 'rgba(255, 255, 255, 0.2)', border: 'none', borderRadius: '50%',
                                width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', color: '#ffffff', transition: 'all 0.2s'
                            }}>
                                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        )}
                    </div>
                )}

                {/* ── Scrollable Body ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Top Field: Type of Call */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '10px 14px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                    }}>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>
                            TYPE OF CALL <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                            value="Final"
                            disabled={true}
                            style={{
                                width: '100%', maxWidth: '280px', height: '34px', padding: '0 10px',
                                borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700,
                                color: '#1e293b', background: '#f8fafc', fontSize: '12px', outline: 'none'
                            }}
                        >
                            <option value="Final">Final</option>
                        </select>
                    </div>

                    {/* ════ SECTION A ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '12px 16px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                    }}>
                        <SectionHeader step="A" label="Call Header & PO Statistics" color="#21808d" />
                        <div style={{ display: 'flex', gap: '28px', marginBottom: '10px', paddingLeft: '8px' }}>
                            <div>
                                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO NO.</div>
                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '13px' }}>{effectivePoNo || '06255012201348'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SR. NO.</div>
                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '13px' }}>{effectiveSrItem?.itemSrNo || effectiveSrItem?.srNo || '001'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CALL DATE</div>
                                <div style={{ fontWeight: 900, color: '#0891b2', fontSize: '13px' }}>
                                    {callData?.callDate ? formatDateDDMMYY(callData.callDate) : new Date().toLocaleDateString('en-IN')}
                                </div>
                            </div>
                        </div>
                        <div style={{ paddingLeft: '8px' }}>
                            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PO STATUS TRACKER</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <StatBox label="Total Quantity on Order" value={(effectiveSrItem?.orderedQty || callData?.orderedQty || callData?.totalQty || 59420).toLocaleString()} Icon={ClipboardList} />
                                <StatBox label="Quantity Offered Till Now" value={(effectiveSrItem?.offeredTillNow || callData?.qtyOfferedTillNow || 0).toLocaleString()} color="#7c3aed" Icon={Package} />
                                <StatBox label="Quantity Accepted Till Now" value={(effectiveSrItem?.acceptedTillNow || callData?.qtyAcceptedTillNow || 0).toLocaleString()} color="#16a34a" Icon={CheckCircle2} />
                                <StatBox label="Quantity Rejected Till Now" value={(effectiveSrItem?.rejectedTillNow || callData?.qtyRejectedTillNow || 0).toLocaleString()} color="#ef4444" Icon={AlertCircle} />
                                <StatBox label="Qty Due for Dispatch" value={(effectiveSrItem?.due || callData?.dueQty || effectiveSrItem?.orderedQty || 59420).toLocaleString()} highlight Icon={Calendar} />
                            </div>
                        </div>
                    </div>

                    {/* ════ SECTION B ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '12px 16px'
                    }}>
                        <SectionHeader step="B" label="Rail Pad Specification & Dispatch Request" color="#7c3aed" />
                        <div style={{ paddingLeft: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>RAIL PAD TYPE <span style={{ color: '#ef4444' }}>*</span></label>
                                    <select
                                        value={railPadType}
                                        onChange={e => handleRailPadTypeChange(e.target.value)}
                                        disabled={isReadOnly}
                                        style={{
                                            width: '100%', height: '34px', padding: '0 8px', borderRadius: '6px',
                                            border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b',
                                            background: isReadOnly ? '#f8fafc' : '#fff', fontSize: '12px', outline: 'none',
                                            cursor: isReadOnly ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <option value="" disabled>Select Rail Pad Type</option>
                                        {RAIL_PAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Drawing No. <span style={{ color: '#ef4444' }}>*</span></label>
                                    {DRAWING_MAPPING[railPadType] && DRAWING_MAPPING[railPadType].length > 0 ? (
                                        <select
                                            value={drawingNo}
                                            onChange={e => { setDrawingNo(e.target.value); setSelectedProcessIcs([]); setInventory([]); setLots([{ id: 1, lotNo: 'LOT-1', selectedBatches: {} }]); }}
                                            disabled={isReadOnly || !railPadType}
                                            style={{
                                                width: '100%', height: '34px', padding: '0 8px', borderRadius: '6px',
                                                border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b',
                                                background: isReadOnly ? '#f8fafc' : '#fff', fontSize: '12px', outline: 'none',
                                                cursor: isReadOnly ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            <option value="" disabled>Select Drawing</option>
                                            {DRAWING_MAPPING[railPadType].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={drawingNo}
                                            onChange={e => { setDrawingNo(e.target.value); setSelectedProcessIcs([]); setInventory([]); setLots([{ id: 1, lotNo: 'LOT-1', selectedBatches: {} }]); }}
                                            placeholder="Enter drawing no."
                                            disabled={isReadOnly || !railPadType}
                                            style={{
                                                width: '100%', height: '34px', padding: '0 8px', borderRadius: '6px',
                                                border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b',
                                                background: isReadOnly ? '#f8fafc' : '#fff', fontSize: '12px', outline: 'none'
                                            }}
                                        />
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Unit of Measurement</label>
                                    <div style={{ width: '100%', height: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#64748b', background: '#f8fafc', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                                        {uom}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Desired Inspection Date</label>
                                    <input
                                        type="date"
                                        value={desiredDate}
                                        disabled={isReadOnly}
                                        onChange={e => setDesiredDate(e.target.value)}
                                        style={{
                                            width: '100%', height: '34px', padding: '0 8px', borderRadius: '6px',
                                            border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b',
                                            background: isReadOnly ? '#f8fafc' : '#fff', fontSize: '12px', outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Total Qty to be Offered</label>
                                    <input
                                        type="text"
                                        value={totalQtyToOffer}
                                        disabled={isReadOnly}
                                        onChange={e => setTotalQtyToOffer(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="Enter quantity"
                                        style={{
                                            width: '100%', height: '34px', padding: '0 8px', borderRadius: '6px',
                                            border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '13px',
                                            color: '#0891b2', background: isReadOnly ? '#f8fafc' : '#fff', outline: 'none'
                                        }}
                                    />
                                    {!isReadOnly && totalQtyToOffer > (effectiveSrItem?.due || 59420) && (
                                        <p style={{ color: '#dc2626', fontSize: '9px', marginTop: '2px', fontWeight: 700 }}>⚠️ Cannot exceed Qty Due for Dispatch!</p>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>No. of Lots to be Offered</label>
                                    <input
                                        type="text"
                                        value={noOfLots}
                                        disabled={isReadOnly}
                                        onChange={e => setNoOfLots(e.target.value.replace(/[^0-9]/g, ''))}
                                        style={{
                                            width: '100%', height: '34px', padding: '0 8px', borderRadius: '6px',
                                            border: lotCountError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                            fontWeight: 800, fontSize: '13px', color: '#1e293b',
                                            background: isReadOnly ? '#f8fafc' : '#fff', outline: 'none'
                                        }}
                                    />
                                    {lotCountError && <p style={{ color: '#dc2626', fontSize: '9px', marginTop: '2px', fontWeight: 700 }}>⚠️ {lotCountError}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ════ SECTION C: Process Inspection Certificates Allocation ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '12px 16px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <SectionHeader step="C" label="Process Inspection Certificates (Process ICs) Allocation" color="#0284c7" />
                            {selectedProcessIcs.length > 0 && (
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '12px' }}>
                                    {selectedProcessIcs.length} {selectedProcessIcs.length === 1 ? 'IC Selected' : 'ICs Selected'}
                                </span>
                            )}
                        </div>

                        <div style={{ paddingLeft: '8px' }}>
                            {/* Balance Summary Header Bar */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '10px',
                                marginBottom: '12px',
                                background: '#f8fafc',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Selected ICs Accepted Qty</div>
                                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#16a34a' }}>
                                        {selectedProcessSummary.totalAccepted.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Nos.</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Qty Previously Used</div>
                                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#d97706' }}>
                                        {selectedProcessSummary.totalUsed.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Nos.</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Available Balance to Use</div>
                                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#0284c7' }}>
                                        {selectedProcessSummary.totalBalance.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Nos.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Table of Available Process ICs */}
                            {loadingProcessCalls ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '11.5px', fontWeight: 700 }}>
                                    ⏳ Loading Process ICs and calculating available balances...
                                </div>
                            ) : (processCalls.length === 0 && selectedProcessIcs.length === 0) ? (
                                <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '11.5px', fontWeight: 700, background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                    {!railPadType ? 'Please select a Rail Pad Type above to view eligible Process ICs.' : 'No Process ICs found for this Rail Pad specification.'}
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontWeight: 800, textTransform: 'uppercase', fontSize: '9.5px', letterSpacing: '0.04em' }}>
                                                <th style={{ padding: '8px 10px', width: '40px', textAlign: 'center' }}>Select</th>
                                                <th style={{ padding: '8px 10px' }}>Process IC No.</th>
                                                <th style={{ padding: '8px 10px' }}>Call Date</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Accepted Qty</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Previously Used</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Available Balance</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const items = [...processCalls];
                                                selectedProcessIcs.forEach(ic => {
                                                    const exists = items.some(c => (c.callNo || c.inspectionCallNo || c.id) === ic);
                                                    if (!exists) {
                                                        items.push({ callNo: ic, inspectionCallNo: ic, id: ic, totalAccepted: 0, totalPreviouslyUsed: 0, totalAvailableBalance: 0 });
                                                    }
                                                });

                                                return items.map((c, idx) => {
                                                    const cCallNo = c.callNo || c.inspectionCallNo || c.id;
                                                    const isChecked = selectedProcessIcs.some(ic => String(ic).trim().toUpperCase() === String(cCallNo).trim().toUpperCase());
                                                    const accepted = Number(c.totalAccepted || c.totalQty || 0);
                                                    const used = Number(c.totalPreviouslyUsed || 0);
                                                    const balance = Number(c.totalAvailableBalance !== undefined ? c.totalAvailableBalance : (accepted - used));
                                                    const isFullyConsumed = balance <= 0 && !isChecked;

                                                    return (
                                                        <tr
                                                            key={cCallNo || idx}
                                                            onClick={() => {
                                                                if (isReadOnly) return;
                                                                if (isFullyConsumed && !isChecked) {
                                                                    setNotification({
                                                                        type: 'warning',
                                                                        message: `⚠️ Process IC ${cCallNo} is fully consumed (0 Available Balance) and cannot be selected.`
                                                                    });
                                                                    return;
                                                                }
                                                                if (isChecked) {
                                                                    setSelectedProcessIcs(prev => prev.filter(id => String(id).trim().toUpperCase() !== String(cCallNo).trim().toUpperCase()));
                                                                } else {
                                                                    setSelectedProcessIcs(prev => [...prev, cCallNo]);
                                                                }
                                                            }}
                                                            title={isFullyConsumed && !isChecked ? `Process IC ${cCallNo} is fully consumed and cannot be selected.` : ''}
                                                            style={{
                                                                borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                                background: isChecked ? '#f0f9ff' : (isFullyConsumed && !isChecked ? '#f8fafc' : (idx % 2 === 0 ? '#fff' : '#fafafa')),
                                                                cursor: isReadOnly ? 'default' : (isFullyConsumed && !isChecked ? 'not-allowed' : 'pointer'),
                                                                opacity: isFullyConsumed && !isChecked ? 0.75 : 1,
                                                                transition: 'background 0.15s'
                                                            }}
                                                        >
                                                            <td 
                                                                style={{ padding: '8px 10px', textAlign: 'center', cursor: isFullyConsumed && !isChecked ? 'not-allowed' : 'default' }} 
                                                                onClick={e => {
                                                                    if (isFullyConsumed && !isChecked) {
                                                                        e.stopPropagation();
                                                                        setNotification({
                                                                            type: 'warning',
                                                                            message: `⚠️ Process IC ${cCallNo} is fully consumed (0 Available Balance) and cannot be selected.`
                                                                        });
                                                                    } else {
                                                                        e.stopPropagation();
                                                                    }
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    disabled={isReadOnly || (isFullyConsumed && !isChecked)}
                                                                    onChange={(e) => {
                                                                        if (isReadOnly) return;
                                                                        if (e.target.checked) {
                                                                            setSelectedProcessIcs(prev => [...prev, cCallNo]);
                                                                        } else {
                                                                            setSelectedProcessIcs(prev => prev.filter(id => String(id).trim().toUpperCase() !== String(cCallNo).trim().toUpperCase()));
                                                                        }
                                                                    }}
                                                                    style={{ cursor: isReadOnly || (isFullyConsumed && !isChecked) ? 'not-allowed' : 'pointer', width: '13px', height: '13px' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '8px 10px', fontWeight: 800, color: '#1e293b' }}>
                                                                {cCallNo}
                                                            </td>
                                                            <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                                                {c.inspectionDate ? formatDateDDMMYY(c.inspectionDate) : (c.callDate ? formatDateDDMMYY(c.callDate) : '-')}
                                                            </td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                                                {accepted.toLocaleString()}
                                                            </td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                                                                {used.toLocaleString()}
                                                            </td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: balance > 0 ? '#0284c7' : '#94a3b8' }}>
                                                                {balance.toLocaleString()}
                                                            </td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                                {balance > 0 ? (
                                                                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: '#dcfce7', color: '#166534' }}>
                                                                        Available
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b' }}>
                                                                        Consumed
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {!isReadOnly && selectedProcessIcs.length === 0 && processCalls.length > 0 && (
                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>⚠️</span> Please select at least one Process IC to allocate batches for lot formation below.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ════ SECTION D ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '12px 16px'
                    }}>
                        <SectionHeader step="D" label="Dynamic Lot Formation (Collapsible Sections)" color="#0891b2" />
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
                                                {!isReadOnly && (
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
                                                )}
                                            </div>
                                            <span style={{ fontSize: '10px', color: '#64748b' }}>{expandedLots[lotIdx] ? '▲' : '▼'}</span>
                                        </div>

                                        {expandedLots[lotIdx] && (
                                            <div style={{ padding: '12px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Lot No.</label>
                                                        <input
                                                            type="text"
                                                            value={lot.lotNo}
                                                            disabled={isReadOnly}
                                                            onChange={e => {
                                                                if (isReadOnly) return;
                                                                const newLots = [...lots];
                                                                newLots[lotIdx].lotNo = e.target.value;
                                                                setLots(newLots);
                                                            }}
                                                            style={{
                                                                width: '100%', height: '34px', padding: '0 8px', borderRadius: '6px',
                                                                border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 700,
                                                                background: isReadOnly ? '#f8fafc' : '#fff'
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Lot Size (Auto-Calculated)</label>
                                                        <div style={{
                                                            width: '100%', height: '34px', padding: '0 8px', borderRadius: '6px',
                                                            border: '1px solid #0891b2', background: '#ecfeff',
                                                            display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 900, color: '#0891b2'
                                                        }}>
                                                            {lotSum.toLocaleString()}
                                                        </div>
                                                        {!isReadOnly && lotSum > lotLimit && (
                                                            <p style={{ color: '#ef4444', fontSize: '9px', marginTop: '3px', fontWeight: 800 }}>⚠️ Lot size exceeds limit of {lotLimit.toLocaleString()}!</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {/* Batch Tree */}
                                                    {isReadOnly ? (
                                                        /* Read-Only Mode: Show only the batches allocated to this specific lot */
                                                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Allocated Batches in this Lot</span>
                                                                <span style={{ color: '#0891b2', fontSize: '10px', fontWeight: 800 }}>{(lot.savedBatches || lot.batches || []).length} Batches</span>
                                                            </div>
                                                            {(!lot.savedBatches || lot.savedBatches.length === 0) && (!lot.batches || lot.batches.length === 0) ? (
                                                                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>
                                                                    No batches allocated to this lot.
                                                                </div>
                                                            ) : (
                                                                (() => {
                                                                    const savedList = lot.savedBatches || lot.batches || [];
                                                                    const dateGrouped = {};
                                                                    savedList.forEach(b => {
                                                                        const dateKey = b.productionDate ? String(b.productionDate).split('T')[0] : 'N/A';
                                                                        if (!dateGrouped[dateKey]) dateGrouped[dateKey] = [];
                                                                        dateGrouped[dateKey].push(b);
                                                                    });

                                                                    return (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                            {Object.entries(dateGrouped).map(([prodDate, bList]) => (
                                                                                <div key={prodDate} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                                                                                    <div style={{ padding: '6px 10px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                            <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                                                                                <CheckCircle2 size={10} strokeWidth={3} />
                                                                                            </div>
                                                                                            <span style={{ fontSize: '12px', fontWeight: 900, color: '#334155' }}>
                                                                                                {prodDate !== 'N/A' ? formatDateDDMMYY(prodDate) : 'Date: N/A'}
                                                                                            </span>
                                                                                            <span style={{ fontSize: '9px', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '8px' }}>
                                                                                                {bList.length} {bList.length === 1 ? 'Batch' : 'Batches'}
                                                                                            </span>
                                                                                        </div>
                                                                                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#0891b2' }}>
                                                                                            {bList.reduce((sum, b) => sum + Number(b.quantity || b.qtyToUse || 0), 0).toLocaleString()} Nos.
                                                                                        </span>
                                                                                    </div>
                                                                                    <div style={{ padding: '6px 8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px', background: '#fcfcfd' }}>
                                                                                        {bList.map((batch, bIdx) => {
                                                                                            const bQty = Number(batch.quantity || batch.qtyToUse || 0);
                                                                                            return (
                                                                                                <div
                                                                                                    key={batch.id || bIdx}
                                                                                                    style={{
                                                                                                        padding: '8px 10px', borderRadius: '6px',
                                                                                                        background: '#0f172a',
                                                                                                        border: '1px solid #1e293b',
                                                                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                                                                    }}
                                                                                                >
                                                                                                    <div style={{
                                                                                                        width: '14px', height: '14px', borderRadius: '3px',
                                                                                                        border: '1px solid #38bdf8',
                                                                                                        background: '#38bdf8',
                                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a',
                                                                                                        flexShrink: 0
                                                                                                    }}>
                                                                                                        <CheckCircle2 size={10} strokeWidth={3} />
                                                                                                    </div>
                                                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={batch.batchNo}>
                                                                                                            Batch: {batch.batchNo}
                                                                                                        </div>
                                                                                                        {batch.drawingNo && (
                                                                                                            <div style={{ fontSize: '9px', color: '#bae6fd', fontWeight: 700 }}>
                                                                                                                Drawing: {batch.drawingNo}
                                                                                                            </div>
                                                                                                        )}
                                                                                                        <div style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 800, marginTop: '2px' }}>
                                                                                                            Allocated Qty: <span style={{ color: '#fff' }}>{bQty.toLocaleString()}</span> Nos.
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                })()
                                                            )}
                                                        </div>
                                                    ) : (
                                                        /* Edit / Raise Mode: Interactive Accepted Inventory Date Tree */
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
                                                                        <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px', opacity: 0.8 }}>
                                                                            {selectedProcessIcs.length === 0 
                                                                                ? 'Please select one or more Process ICs above to load accepted batches.' 
                                                                                : `No production verification records exist for ${railPadType} under the selected Process IC(s).`}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    filteredInventory.map(dateGroup => {
                                                                        const availableBatches = dateGroup.batches.map(b => {
                                                                            const remaining = getRemainingBatchQty(lotIdx, b.id, b.batchNo, b.qty);
                                                                            return { ...b, remaining };
                                                                        }).filter(b => b.remaining > 0 || isBatchSelected(lotIdx, b.id, b.batchNo));

                                                                        const isLotFull = lotSum >= lotLimit;
                                                                        const targetQtyNum = parseInt(totalQtyToOffer) || 0;
                                                                        const isCallFull = targetQtyNum > 0 && totalOfferedFromLots >= targetQtyNum;
                                                                        const allDateBatchesSelected = availableBatches.length > 0 && availableBatches.every(b => isBatchSelected(lotIdx, b.id, b.batchNo));

                                                                        if (availableBatches.length === 0) return null;
                                                                        return (
                                                                            <div key={dateGroup.productionDate} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
                                                                                <div style={{ padding: '6px 10px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            disabled={isReadOnly || (!allDateBatchesSelected && (isLotFull || isCallFull))}
                                                                                            style={{ width: '14px', height: '14px', cursor: (isReadOnly || (!allDateBatchesSelected && (isLotFull || isCallFull))) ? 'not-allowed' : 'pointer' }}
                                                                                            checked={allDateBatchesSelected}
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
                                                                                        const isSelected = isBatchSelected(lotIdx, batch.id, batch.batchNo);
                                                                                        const selectedQtyInThisLot = getSelectedBatchQty(lotIdx, batch.id, batch.batchNo);
                                                                                        const isBatchDisabled = !isSelected && (isLotFull || isCallFull);

                                                                                        return (
                                                                                            <div
                                                                                                key={batch.id}
                                                                                                onClick={() => !isReadOnly && handleBatchSelection(lotIdx, batch, !isSelected)}
                                                                                                title={isBatchDisabled ? (isCallFull ? `Total Offered has reached the Total Qty to be Offered (${targetQtyNum.toLocaleString()} Nos.)` : `${lot.lotNo} has reached the ${lotLimit.toLocaleString()} max limit`) : ''}
                                                                                                style={{
                                                                                                    padding: '6px 8px', borderRadius: '6px',
                                                                                                    background: isSelected ? '#0f172a' : isBatchDisabled ? '#f1f5f9' : '#fff',
                                                                                                    border: `1px solid ${isSelected ? '#0f172a' : isBatchDisabled ? '#e2e8f0' : '#e2e8f0'}`,
                                                                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                                                                    cursor: isReadOnly ? 'default' : isBatchDisabled ? 'not-allowed' : 'pointer',
                                                                                                    opacity: isBatchDisabled ? 0.55 : 1,
                                                                                                    transition: 'all 0.1s',
                                                                                                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                                                                                }}
                                                                                            >
                                                                                                <div style={{
                                                                                                    width: '12px', height: '12px', borderRadius: '3px',
                                                                                                    border: `1px solid ${isSelected ? '#38bdf8' : isBatchDisabled ? '#cbd5e1' : '#cbd5e1'}`,
                                                                                                    background: isSelected ? '#38bdf8' : 'transparent',
                                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? '#0f172a' : '#fff',
                                                                                                    flexShrink: 0
                                                                                                }}>
                                                                                                    {isSelected && <CheckCircle2 size={8} strokeWidth={3} />}
                                                                                                </div>
                                                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                                                    <div style={{ fontSize: '10px', fontWeight: 800, color: isSelected ? '#fff' : isBatchDisabled ? '#64748b' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Batch: {batch.batchNo}</div>
                                                                                                    {railPadType?.includes('NCRGRSP') && (
                                                                                                        <div style={{ fontSize: '9px', color: isSelected ? '#bae6fd' : '#0284c7', fontWeight: 700 }}>Drawing No: {batch.drawingNo || 'N/A'}</div>
                                                                                                    )}
                                                                                                    <div style={{ fontSize: '8px', color: isSelected ? '#94a3b8' : '#64748b', fontWeight: 700 }}>
                                                                                                        Qty: {isSelected && selectedQtyInThisLot !== undefined ? selectedQtyInThisLot.toLocaleString() : batch.remaining.toLocaleString()}
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
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ════ SECTION E ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '12px 16px'
                    }}>
                        <SectionHeader step="E" label="Final Call Summary" color="#1e293b" />
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
                                        <div style={{ fontSize: '12px', fontWeight: 900, color: (isReadOnly || isValid) ? '#16a34a' : '#ef4444' }}>
                                            {isReadOnly ? (callData?.status || 'VALIDATION PASSED') : isValid ? 'READY TO SUBMIT' : 'VALIDATION PENDING'}
                                        </div>
                                    </div>
                                </div>
                                {!isReadOnly && !totalMatchesOffered && totalQtyToOffer > 0 && (
                                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#ef4444', fontWeight: 800, textAlign: 'center' }}>
                                        ⚠️ Sum of all lots must exactly match the "Total Qty to be Offered" ({Number(totalQtyToOffer).toLocaleString()})
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ════ SECTION F ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '12px 16px'
                    }}>
                        <SectionHeader step="F" label="Remarks / Special Instructions" color="#059669" />
                        <div style={{ paddingLeft: '8px' }}>
                            <textarea
                                rows={3}
                                value={remarks}
                                disabled={isReadOnly}
                                onChange={e => setRemarks(e.target.value)}
                                placeholder="Enter any specific remarks, vendor notes, or special instructions for final inspection (optional)..."
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#1e293b',
                                    background: isReadOnly ? '#f8fafc' : '#fff',
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    resize: 'vertical',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                        {totalOfferedFromLots === 0 ? "No pads selected yet" : <span>Total Offered: <span style={{ color: totalMatchesOffered ? '#16a34a' : '#ef4444', fontWeight: 900, fontSize: '14px' }}>{totalOfferedFromLots.toLocaleString()}</span> / {(parseInt(totalQtyToOffer) || 0).toLocaleString()}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} style={{
                            height: '36px', padding: '0 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                            background: '#fff', color: '#475569', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>{isReadOnly ? 'Close' : 'Cancel'}</button>
                        {!isReadOnly && (
                            <button
                                disabled={!isValid || isSubmitting}
                                onClick={handleSubmit}
                                style={{
                                    height: '36px', padding: '0 24px', borderRadius: '8px', border: 'none',
                                    background: isValid ? 'linear-gradient(135deg, #21808d, #0d3b3f)' : '#e2e8f0',
                                    color: isValid ? '#fff' : '#94a3b8', fontWeight: 900, fontSize: '12px',
                                    cursor: isValid ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: isValid ? '0 4px 6px -1px rgba(33,128,141,0.2)' : 'none'
                                }}
                            >
                                {isSubmitting ? 'Submitting...' : isModifyMode ? 'Save Modifications' : 'Submit Inspection Call'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Partial Offering Modal ── */}
            {activePartialLotIdx !== null && (
                <PartialOfferingModal
                    lot={lots[activePartialLotIdx]}
                    activePartialLotIdx={activePartialLotIdx}
                    allLots={lots}
                    lotLimit={lotLimit}
                    totalQtyToOffer={totalQtyToOffer}
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
                    padding: '12px 20px', flexShrink: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px', textTransform: 'uppercase' }}>
                            {isReadOnly ? 'VIEW FINAL INSPECTION CALL (READ-ONLY)' : isModifyMode ? 'MODIFY FINAL INSPECTION CALL' : 'RAISE FINAL INSPECTION CALL'}
                        </div>
                        <div style={{ color: '#fff', fontSize: '16px', fontWeight: 900, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={18} />
                            {effectiveCallNo ? (
                                <>
                                    <span>CALL NO: <span style={{ color: '#fef08a' }}>{effectiveCallNo}</span></span>
                                    <span style={{ fontSize: '13px', opacity: 0.9, marginLeft: '6px' }}>— {effectivePoNo}</span>
                                </>
                            ) : (
                                `${effectivePoNo || '06255012201348'} — SR. No. ${effectiveSrItem?.itemSrNo || effectiveSrItem?.srNo || '1'}`
                            )}
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
const PartialOfferingModal = ({ lot, activePartialLotIdx, allLots = [], lotLimit = 10000, totalQtyToOffer = 0, inventory, onClose, onSubmit }) => {
    const getQtyUsedInOtherLots = (batchId) => {
        return (allLots || []).reduce((acc, l, idx) => {
            if (idx !== activePartialLotIdx) {
                return acc + (parseInt(l.selectedBatches[batchId]) || 0);
            }
            return acc;
        }, 0);
    };

    const targetQty = parseInt(totalQtyToOffer) || 0;
    const totalUsedInOtherLots = (allLots || []).reduce((acc, l, idx) => {
        if (idx !== activePartialLotIdx) {
            return acc + Object.values(l.selectedBatches || {}).reduce((s, v) => s + (parseInt(v) || 0), 0);
        }
        return acc;
    }, 0);

    const allBatches = useMemo(() => {
        const list = [];
        (inventory || []).forEach(group => {
            (group.batches || []).forEach(b => {
                const usedInOther = getQtyUsedInOtherLots(b.id);
                const totalBatchQty = b.qty || b.pending || 0;
                const remainingForThisLot = Math.max(0, totalBatchQty - usedInOther);

                if (remainingForThisLot > 0 || (lot.selectedBatches && (lot.selectedBatches[b.id] !== undefined || (b.batchNo && lot.selectedBatches[b.batchNo] !== undefined)))) {
                    list.push({
                        id: b.id,
                        batchNo: b.batchNo,
                        pending: remainingForThisLot,
                        productionDate: group.productionDate
                    });
                }
            });
        });
        return list;
    }, [inventory, allLots, activePartialLotIdx, lot.selectedBatches]);

    // Initialize with existing valid selections from the lot
    const [selectedBatches, setSelectedBatches] = useState(() => {
        const initial = lot.selectedBatches || {};
        const valid = {};
        Object.entries(initial).forEach(([k, v]) => {
            if (allBatches.some(b => String(b.id) === String(k) || b.batchNo === k)) {
                valid[k] = v;
            }
        });
        return valid;
    });

    const totalSelected = Object.values(selectedBatches).reduce((acc, v) => acc + (parseInt(v) || 0), 0);

    const handleAddBatch = (val) => {
        if (!val) return;
        const batch = allBatches.find(b => String(b.id) === String(val));
        if (batch && selectedBatches[batch.id] === undefined) {
            const currentLotTotal = Object.values(selectedBatches).reduce((acc, v) => acc + (parseInt(v) || 0), 0);
            const remainingLotCap = Math.max(0, lotLimit - currentLotTotal);
            const remainingOverallCap = targetQty > 0 ? Math.max(0, targetQty - (totalUsedInOtherLots + currentLotTotal)) : remainingLotCap;
            const remainingCap = Math.min(remainingLotCap, remainingOverallCap);
            const defaultQty = remainingCap > 0 ? Math.min(batch.pending, remainingCap) : Math.min(batch.pending, 1);
            setSelectedBatches(prev => ({ ...prev, [batch.id]: defaultQty }));
        }
    };

    const handleQtyChange = (batchId, qty, max) => {
        const currentOtherInThisLot = Object.entries(selectedBatches)
            .filter(([k]) => String(k) !== String(batchId))
            .reduce((acc, [, v]) => acc + (parseInt(v) || 0), 0);
        const remainingLotCap = Math.max(0, lotLimit - currentOtherInThisLot);
        const remainingOverallCap = targetQty > 0 ? Math.max(0, targetQty - (totalUsedInOtherLots + currentOtherInThisLot)) : remainingLotCap;
        const effectiveMax = Math.min(max, remainingLotCap, remainingOverallCap);
        const val = Math.max(0, Math.min(parseInt(qty) || 0, effectiveMax));
        setSelectedBatches(prev => ({ ...prev, [batchId]: val }));
    };

    const handleRemove = (batchId) => {
        const newSelected = { ...selectedBatches };
        delete newSelected[batchId];
        setSelectedBatches(newSelected);
    };

    const availableOptions = allBatches.filter(b => selectedBatches[b.id] === undefined);
    const isLotExceedingLimit = totalSelected > lotLimit;
    const hasInvalidQty = Object.entries(selectedBatches).some(([batchId, qty]) => {
        const batch = allBatches.find(b => String(b.id) === String(batchId));
        return qty <= 0 || qty > (batch?.pending || 0);
    });
    const isModalDisabled = Object.keys(selectedBatches).length === 0 || isLotExceedingLimit || hasInvalidQty;

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
                            Object.entries(selectedBatches)
                                .filter(([batchId]) => allBatches.some(b => String(b.id) === String(batchId) || b.batchNo === batchId))
                                .map(([batchId, qty]) => {
                                    const batch = allBatches.find(b => String(b.id) === String(batchId) || b.batchNo === batchId);
                                    if (!batch) return null;
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
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '10px 16px', background: '#fff', borderTop: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                            Total Lot Quantity: <span style={{ fontWeight: 900, fontSize: '14px', color: isLotExceedingLimit ? '#ef4444' : '#0f172a' }}>{totalSelected.toLocaleString()}</span> Nos.
                        </div>
                        {isLotExceedingLimit && (
                            <div style={{ fontSize: '9px', color: '#ef4444', fontWeight: 800 }}>⚠️ Lot size exceeds limit of {lotLimit.toLocaleString()}!</div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onClose} style={{
                            padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1',
                            background: '#fff', color: '#475569', fontWeight: 800, fontSize: '11px', cursor: 'pointer'
                        }}>Cancel</button>
                        <button
                            disabled={isModalDisabled}
                            onClick={() => onSubmit(selectedBatches)}
                            style={{
                                padding: '6px 16px', borderRadius: '6px', border: 'none',
                                background: !isModalDisabled ? 'linear-gradient(135deg, #0891b2, #0e7490)' : '#e2e8f0',
                                color: !isModalDisabled ? '#fff' : '#94a3b8', fontWeight: 900, fontSize: '11px',
                                cursor: !isModalDisabled ? 'pointer' : 'not-allowed',
                                boxShadow: !isModalDisabled ? '0 2px 4px rgba(8,145,178,0.2)' : 'none'
                            }}
                        >Confirm & Update Lot</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RaiseRailPadInspectionCallForm;

