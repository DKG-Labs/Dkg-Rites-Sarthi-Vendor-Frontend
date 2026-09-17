import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../../services/api';

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

// ─── Helper for Date Parsing ──────────────────────────────────────────────────
const toInputDateFormat = (dStr) => {
    if (!dStr) return new Date().toISOString().split('T')[0];
    const s = String(dStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.split('T')[0];
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
        const [d, m, y] = s.split('/');
        return `${y}-${m}-${d}`;
    }
    if (/^\d{2}-\d{2}-\d{4}/.test(s)) {
        const [d, m, y] = s.split('-');
        return `${y}-${m}-${d}`;
    }
    try {
        const dt = new Date(s);
        if (!isNaN(dt.getTime())) {
            return dt.toISOString().split('T')[0];
        }
    } catch (e) {}
    return new Date().toISOString().split('T')[0];
};

// ─── Main Form ────────────────────────────────────────────────────────────────
const RaiseInspectionCallForm = ({ srItem, poNo, onClose, onSubmitInspectionCall, isEdit = false, editCall = null }) => {
    const callDate = isEdit && editCall?.callDate ? editCall.callDate : new Date().toLocaleDateString('en-IN');
    const editCallNo = isEdit ? (editCall?.callNo || editCall?.callNumber || editCall?.id) : null;
    const uom = srItem?.uom || srItem?.unit || srItem?.poUnit || srItem?.itemUom || 'Nos.';
    const isEffectiveSetUom = Boolean(uom && String(uom).toUpperCase().includes('SET'));
    const displayUom = uom;

    // Section A & B state
    const [mainSleeperType, setMainSleeperType] = useState(isEdit && editCall?.sleeperType ? editCall.sleeperType : '');

    const [dateOfInspection, setDateOfInspection] = useState(() => {
        if (isEdit && (editCall?.desiredInspectionDate || editCall?.inspectionDate)) {
            return toInputDateFormat(editCall.desiredInspectionDate || editCall.inspectionDate);
        }
        return new Date().toISOString().split('T')[0];
    });
    const [toBeOffered, setToBeOffered] = useState(() => {
        if (isEdit && editCall?.totalOffered) return editCall.totalOffered;
        if (isEdit && editCall?.qtyOffered) return editCall.qtyOffered;
        if (isEffectiveSetUom) return Math.min(1, srItem?.due !== undefined && srItem?.due > 0 ? srItem.due : 1);
        return '';
    });
    const [sleeperTypes, setSleeperTypes] = useState([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [selectedSleeperTypes, setSelectedSleeperTypes] = useState(isEdit && editCall?.sleeperType ? [editCall.sleeperType] : []);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [typeSearchText, setTypeSearchText] = useState('');
    const dropdownRef = useRef(null);
    const [batches, setBatches] = useState([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);
    const [batchSelections, setBatchSelections] = useState({}); // { batchKey: { goodSelected: Set<id>, batchTouched: boolean } }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [editCallDetails, setEditCallDetails] = useState(null);
    const [initialSelectionsApplied, setInitialSelectionsApplied] = useState(false);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── 1. Fetch distinct sleeper types & call details on mount ───────────────
    useEffect(() => {
        let isCancelled = false;

        const initializeData = async () => {
            setIsLoadingTypes(true);
            try {
                const vendorCode = sessionStorage.getItem('vendorCode') || '';
                const typesPromise = apiService.getDistinctSleeperTypes(vendorCode);
                const detailsPromise = (isEdit && editCallNo)
                    ? apiService.getSleeperInspectionCallDetails(editCallNo)
                    : Promise.resolve(null);

                const [types, details] = await Promise.all([typesPromise, detailsPromise]);

                if (isCancelled) return;

                const validTypes = Array.isArray(types) ? types : [];
                setSleeperTypes(validTypes);

                let initialType = '';
                if (details) {
                    setEditCallDetails(details);
                    if (details.sleeperType) initialType = details.sleeperType;
                    if (details.desiredInspectionDate) {
                        setDateOfInspection(toInputDateFormat(details.desiredInspectionDate));
                    }
                    if (details.totalOffered) {
                        setToBeOffered(details.totalOffered);
                    }
                } else if (editCall?.sleeperType) {
                    initialType = editCall.sleeperType;
                } else if (validTypes.length > 0) {
                    const matchedType = validTypes.find(t =>
                        (srItem?.sleeperType && t.toLowerCase().includes(srItem.sleeperType.toLowerCase())) ||
                        (srItem?.itemDescription && t.toLowerCase().includes(srItem.itemDescription.toLowerCase()))
                    ) || validTypes[0];
                    initialType = matchedType;
                }

                if (initialType) {
                    setMainSleeperType(initialType);
                    setSelectedSleeperTypes([initialType]);
                }
            } catch (err) {
                console.error("Initialization error in RaiseInspectionCallForm:", err);
            } finally {
                if (!isCancelled) {
                    setIsLoadingTypes(false);
                }
            }
        };

        initializeData();

        return () => {
            isCancelled = true;
        };
    }, [isEdit, editCallNo]);

    // Helper: Map a single batch response with its sleeper type
    const mapBatch = (b, sType) => {
        // All good/bad sleepers (including already-raised ones)
        const allGoodList = (b.goodSleepers || []);
        const allBadList  = (b.badSleepers  || []);

        // Eligible = not yet raised in a previous call
        const goodList = allGoodList.filter(s => s.callRaised !== true && s.callRaised !== "true");
        const badList  = allBadList.filter(s => s.callRaised !== true && s.callRaised !== "true");
        const raisedGoodList = allGoodList.filter(s => s.callRaised === true || s.callRaised === "true");
        const raisedBadList = allBadList.filter(s => s.callRaised === true || s.callRaised === "true");

        // Helper: deduplicate by sleeperId or sleeperNo
        const buildDisplayList = (list) => {
            const seenKeys = new Set();
            return list.filter((s, idx) => {
                const uniqueKey = (s.sleeperId && String(s.sleeperId) !== '0') 
                    ? String(s.sleeperId) 
                    : (s.sleeperNo ? String(s.sleeperNo).trim() : `item-${idx}`);
                if (seenKeys.has(uniqueKey)) return false;
                seenKeys.add(uniqueKey);
                return true;
            }).map((s, idx) => {
                const sid = (s.sleeperId && String(s.sleeperId) !== '0') 
                    ? String(s.sleeperId) 
                    : (s.sleeperNo ? String(s.sleeperNo).trim() : `item-${idx}`);
                
                let formName = s.moduleName || '';
                if (!formName && s.moduleId) {
                    if (s.moduleId === 1) formName = 'Visual';
                    else if (s.moduleId === 2) formName = 'Critical Dim';
                    else if (s.moduleId === 3) formName = 'Non-Critical Dim';
                    else if (s.moduleId === 4) formName = 'Demoulding';
                    else formName = `Module ${s.moduleId}`;
                }

                return {
                    sleeperId: sid,
                    displayNo: s.sleeperNo ? String(s.sleeperNo).trim() : (s.sleeperId ? String(s.sleeperId) : 'N/A'),
                    formName: formName || '',
                    reason: s.reason || ''
                };
            });
        };

        // Build display lists (deduplicated by sleeperId)
        const allGoodDisplay    = buildDisplayList(allGoodList);
        const allBadDisplay     = buildDisplayList(allBadList);
        const goodDisplay       = buildDisplayList(goodList);
        const badDisplay        = buildDisplayList(badList);
        const raisedGoodDisplay = buildDisplayList(raisedGoodList);
        const raisedBadDisplay  = buildDisplayList(raisedBadList);

        // Sort in ascending order (natural alphanumeric sort by display label)
        const sortDisplay = arr => arr.sort((a, b) => a.displayNo.localeCompare(b.displayNo, undefined, { numeric: true, sensitivity: 'base' }));
        sortDisplay(allGoodDisplay);
        sortDisplay(allBadDisplay);
        sortDisplay(goodDisplay);
        sortDisplay(badDisplay);
        sortDisplay(raisedGoodDisplay);
        sortDisplay(raisedBadDisplay);

        const previouslyOfferedGood  = allGoodDisplay.length - goodDisplay.length;
        const previouslyOfferedBad   = allBadDisplay.length - badDisplay.length;
        const previouslyOfferedCount = previouslyOfferedGood + previouslyOfferedBad;

        const batchNum = b.batchNumber || b.batchId.toString();
        const batchKey = `${sType}_${batchNum}`;

        return {
            batchKey,
            batchNo: batchNum,
            castDate: b.castDate || 'N/A',
            totalCasted: b.totalSleepers || 0,
            castedAsType: sType,
            previouslyOffered: previouslyOfferedCount,
            previouslyOfferedGood,
            previouslyOfferedBad,
            // Total counts (all sleepers including previously raised)
            goodSleepers: allGoodDisplay.length,
            badSleepers: allBadDisplay.length,
            // Eligible counts (only those not yet raised)
            goodSleepersEligible: goodDisplay.length,
            badSleepersEligible: badDisplay.length,
            goodSleepersRaised: raisedGoodDisplay.length,
            badSleepersRaised: raisedBadDisplay.length,
            // Checkbox keys = sleeperId strings
            goodSleeperIds: goodDisplay.map(s => String(s.sleeperId)),
            badSleeperIds:  badDisplay.map(s => String(s.sleeperId)),
            // Label maps: sleeperId → sleeperNo for display only
            goodSleeperLabels: Object.fromEntries(goodDisplay.map(s => [String(s.sleeperId), s.displayNo])),
            badSleeperLabels:  Object.fromEntries(badDisplay.map(s => [String(s.sleeperId), s.displayNo])),
            badSleeperForms:   Object.fromEntries(badDisplay.map(s => [String(s.sleeperId), s.formName])),
            badSleeperReasons: Object.fromEntries(badDisplay.map(s => [String(s.sleeperId), s.reason])),
            raisedBadSleeperLabels: Object.fromEntries(raisedBadDisplay.map(s => [String(s.sleeperId), s.displayNo])),
            raisedBadSleeperForms:  Object.fromEntries(raisedBadDisplay.map(s => [String(s.sleeperId), s.formName])),
            // Full objects needed to map sleeperId on submit
            goodSleepersDisplay: goodDisplay,
            badSleepersDisplay:  badDisplay,
            raisedGoodSleepersDisplay: raisedGoodDisplay,
            raisedBadSleepersDisplay: raisedBadDisplay,
            goodSleepersData: goodList,
            badSleepersData: badList,
            plantId: b.plantId
        };
    };

    // Eligible Now = eligible good sleepers
    const getEligible = (batch) => {
        return batch.goodSleepersEligible || 0;
    };

    // Helper to convert an editCallDetails batch into a complete batch card format
    const convertCallBatchToBatchCard = (eb, sType) => {
        const batchNum = String(eb.batchNo || '');
        const batchKey = `${sType}_${batchNum}`;

        const goodList = (eb.goodSleepers || []).map((sno, idx) => {
            const sid = (eb.goodSleeperIds && eb.goodSleeperIds[idx]) ? String(eb.goodSleeperIds[idx]) : `good-${idx}`;
            return {
                sleeperId: sid,
                displayNo: String(sno).trim(),
                formName: 'Good',
                reason: ''
            };
        });

        const badList = (eb.badSleepers || []).map((sno, idx) => {
            const sid = (eb.badSleeperIds && eb.badSleeperIds[idx]) ? String(eb.badSleeperIds[idx]) : `bad-${idx}`;
            return {
                sleeperId: sid,
                displayNo: String(sno).trim(),
                formName: 'Defect',
                reason: ''
            };
        });

        const goodDisplay = goodList;
        const badDisplay = badList;

        return {
            batchKey,
            batchNo: batchNum,
            castDate: eb.castDate || 'N/A',
            totalCasted: eb.totalCasted || (goodDisplay.length + badDisplay.length),
            castedAsType: sType,
            previouslyOffered: eb.previouslyOffered || 0,
            previouslyOfferedGood: 0,
            previouslyOfferedBad: 0,
            goodSleepers: goodDisplay.length,
            badSleepers: badDisplay.length,
            goodSleepersEligible: goodDisplay.length,
            badSleepersEligible: badDisplay.length,
            goodSleepersRaised: 0,
            badSleepersRaised: 0,
            goodSleeperIds: goodDisplay.map(s => String(s.sleeperId)),
            badSleeperIds: badDisplay.map(s => String(s.sleeperId)),
            goodSleeperLabels: Object.fromEntries(goodDisplay.map(s => [String(s.sleeperId), s.displayNo])),
            badSleeperLabels: Object.fromEntries(badDisplay.map(s => [String(s.sleeperId), s.displayNo])),
            badSleeperForms: Object.fromEntries(badDisplay.map(s => [String(s.sleeperId), s.formName])),
            badSleeperReasons: Object.fromEntries(badDisplay.map(s => [String(s.sleeperId), s.reason])),
            raisedBadSleeperLabels: {},
            raisedBadSleeperForms: {},
            goodSleepersDisplay: goodDisplay,
            badSleepersDisplay: badDisplay,
            raisedGoodSleepersDisplay: [],
            raisedBadSleepersDisplay: [],
            goodSleepersData: goodList,
            badSleepersData: badList,
            plantId: eb.plantId || editCallDetails?.plantId
        };
    };

    const editCallDetailsRef = useRef(editCallDetails);
    useEffect(() => {
        editCallDetailsRef.current = editCallDetails;
    }, [editCallDetails]);

    const selectedTypesKey = (selectedSleeperTypes || []).join('|');

    // ── 2. Fetch batches for all selected sleeper types ───────────────────────
    useEffect(() => {
        if (!selectedSleeperTypes || selectedSleeperTypes.length === 0) {
            setBatches([]);
            return;
        }

        let isCancelled = false;

        const fetchBatches = async () => {
            setIsLoadingBatches(true);
            try {
                const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
                const currentPlantId = selectedPlant ? selectedPlant.plantId : null;
                const vendorCode = sessionStorage.getItem('vendorCode') || '';
                const excludeCallNo = isEdit ? editCallNo : null;

                const batchPromises = selectedSleeperTypes.map(async (sType) => {
                    try {
                        const data = await apiService.getCompletedBatches(sType, vendorCode, excludeCallNo, currentPlantId);
                        const filteredData = currentPlantId 
                            ? data.filter(b => {
                                if (!b.plantId) return true;
                                const bPid = String(b.plantId).replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
                                const cPid = String(currentPlantId).replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
                                return !cPid || !bPid || bPid === cPid || bPid.includes(cPid) || cPid.includes(bPid);
                            })
                            : data;
                        return filteredData.map(b => mapBatch(b, sType));
                    } catch (e) {
                        console.error(`Failed to fetch batches for ${sType}`, e);
                        return [];
                    }
                });

                const results = await Promise.all(batchPromises);
                if (isCancelled) return;

                let allBatches = results.flat();

                // Merge with existing call batches in edit mode to ensure they always display
                const currentDetails = editCallDetailsRef.current;
                if (isEdit && currentDetails && currentDetails.batchesSelected) {
                    currentDetails.batchesSelected.forEach(eb => {
                        const ebNo = String(eb.batchNo || '').trim().toLowerCase();
                        const exists = allBatches.some(b => {
                            const bNo = String(b.batchNo || '').trim().toLowerCase();
                            return bNo === ebNo || bNo === ebNo.replace(/^batch\s*[-_]?/i, '') || ebNo === bNo.replace(/^batch\s*[-_]?/i, '');
                        });
                        if (!exists) {
                            const callType = currentDetails.sleeperType || mainSleeperType || selectedSleeperTypes[0] || 'Sleeper';
                            allBatches.unshift(convertCallBatchToBatchCard(eb, callType));
                        }
                    });
                }

                setBatches(allBatches);
            } catch (err) {
                if (!isCancelled) {
                    console.error("Failed to fetch batches", err);
                    setBatches([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingBatches(false);
                }
            }
        };

        fetchBatches();

        return () => {
            isCancelled = true;
        };
    }, [selectedTypesKey, isEdit, editCallNo]);

    // ── Merge call details into batches in-memory when editCallDetails loads without refetching from network ──
    useEffect(() => {
        if (isEdit && editCallDetails && editCallDetails.batchesSelected && batches.length > 0) {
            setBatches(prevBatches => {
                const newBatches = [...prevBatches];
                let changed = false;
                editCallDetails.batchesSelected.forEach(eb => {
                    const ebNo = String(eb.batchNo || '').trim().toLowerCase();
                    const exists = newBatches.some(b => {
                        const bNo = String(b.batchNo || '').trim().toLowerCase();
                        return bNo === ebNo || bNo === ebNo.replace(/^batch\s*[-_]?/i, '') || ebNo === bNo.replace(/^batch\s*[-_]?/i, '');
                    });
                    if (!exists) {
                        const callType = editCallDetails.sleeperType || mainSleeperType || selectedSleeperTypes[0] || 'Sleeper';
                        newBatches.unshift(convertCallBatchToBatchCard(eb, callType));
                        changed = true;
                    }
                });
                return changed ? newBatches : prevBatches;
            });
        }
    }, [editCallDetails]);

    // ── 3. Apply pre-selected batches and good sleepers when in edit mode ────
    useEffect(() => {
        if (isEdit && editCallDetails && editCallDetails.batchesSelected && batches.length > 0 && !initialSelectionsApplied) {
            const initialSelections = {};
            let firstExpandedKey = null;

            editCallDetails.batchesSelected.forEach(eb => {
                const ebNo = String(eb.batchNo || '').trim().toLowerCase();
                const matchingBatch = batches.find(b => {
                    const bNo = String(b.batchNo || '').trim().toLowerCase();
                    return bNo === ebNo 
                        || bNo === ebNo.replace(/^batch\s*[-_]?/i, '') 
                        || ebNo === bNo.replace(/^batch\s*[-_]?/i, '')
                        || bNo.includes(ebNo)
                        || ebNo.includes(bNo);
                });

                if (matchingBatch) {
                    const key = matchingBatch.batchKey || matchingBatch.batchNo;
                    if (!firstExpandedKey) firstExpandedKey = key;

                    const selectedIds = new Set();
                    const ebSleeperIds = (eb.goodSleeperIds || []).map(String);
                    const ebSleeperNos = (eb.goodSleepers || []).map(s => String(s).trim().toLowerCase());

                    (matchingBatch.goodSleepersDisplay || []).forEach(gs => {
                        const sidStr = String(gs.sleeperId);
                        const dispStr = String(gs.displayNo).trim().toLowerCase();
                        if (ebSleeperIds.includes(sidStr) || ebSleeperNos.includes(dispStr) || ebSleeperNos.includes(dispStr.replace(/^0+/, ''))) {
                            selectedIds.add(sidStr);
                        }
                    });

                    if (selectedIds.size === 0 && ebSleeperIds.length > 0) {
                        ebSleeperIds.forEach(id => {
                            if (matchingBatch.goodSleeperIds.includes(id)) {
                                selectedIds.add(id);
                            }
                        });
                    }

                    if (selectedIds.size === 0 && ebSleeperNos.length > 0) {
                        (matchingBatch.goodSleepersDisplay || []).slice(0, ebSleeperNos.length).forEach(gs => {
                            selectedIds.add(String(gs.sleeperId));
                        });
                    }

                    if (selectedIds.size > 0) {
                        initialSelections[key] = {
                            goodSelected: selectedIds,
                            batchTouched: true
                        };
                    }
                }
            });

            if (Object.keys(initialSelections).length > 0) {
                setBatchSelections(prev => ({ ...prev, ...initialSelections }));
                setInitialSelectionsApplied(true);
                if (firstExpandedKey) {
                    setExpandedBatch(firstExpandedKey);
                }
            }
        }
    }, [isEdit, editCallDetails, batches, initialSelectionsApplied]);

    // ── Computed Summary ──────────────────────────────────────────────────────
    const summary = useMemo(() => {
        let batchesSelected = 0;
        let totalSleeperCount = 0;
        let totalPassedCount = 0;
        let totalRejectedCount = 0;

        batches.forEach(b => {
            const key = b.batchKey || b.batchNo;
            const sel = batchSelections[key];
            if (!sel) return;
            const goodCount = sel.goodSelected ? sel.goodSelected.size : 0;
            // Include only unraised bad sleepers if this batch has selected sleepers
            const badCount = (goodCount > 0 || sel.batchTouched) ? (b.badSleepersEligible || 0) : 0;
            if (goodCount === 0 && !sel.batchTouched) return;
            if (goodCount > 0 || sel.batchTouched) {
                batchesSelected++;
                totalSleeperCount += goodCount + badCount;
                totalPassedCount += goodCount;
                totalRejectedCount += badCount;
            }
        });

        const due = srItem.due !== undefined ? srItem.due : null;

        let exceedsCap = false;
        let afterOffering = null;
        let offeredQtyValue = 0;

        if (isEffectiveSetUom) {
            // When UOM is SET, validate "To Be Offered" (Sets) against due (Sets)
            // DO NOT validate individual sleeper pieces (e.g. 37 or 71 pieces) against due (Sets)
            offeredQtyValue = (toBeOffered !== '' && toBeOffered !== null && toBeOffered !== undefined) ? Number(toBeOffered) : 0;
            exceedsCap = (due !== null && due !== undefined && offeredQtyValue > 0) ? (offeredQtyValue > due) : false;
            afterOffering = (due !== null && due !== undefined && offeredQtyValue > 0) ? (due - offeredQtyValue) : null;
        } else {
            // When UOM is Nos./standard, validate totalPassedCount against due (Nos.)
            offeredQtyValue = totalPassedCount;
            exceedsCap = (due !== null && due !== undefined) ? (offeredQtyValue > due) : false;
            afterOffering = (due !== null && due !== undefined) ? (due - offeredQtyValue) : null;
        }

        return { 
            batchesSelected, 
            totalSleeperCount, 
            totalPassedCount, 
            totalRejectedCount, 
            exceedsCap, 
            afterOffering, 
            due,
            offeredQtyValue
        };
    }, [batchSelections, batches, srItem, isEffectiveSetUom, toBeOffered]);

    // Keep toBeOffered in sync when batches are selected ONLY if UOM is 'SET'
    useEffect(() => {
        if (isEffectiveSetUom) {
            setToBeOffered(prev => {
                if (prev === '' || prev === null || prev === undefined || (prev === summary.totalPassedCount && summary.totalPassedCount > (srItem?.due || 1))) {
                    return (srItem?.due !== undefined && srItem?.due > 0) ? 1 : 1;
                }
                return prev;
            });
        } else {
            setToBeOffered(summary.totalPassedCount);
        }
    }, [summary.totalPassedCount, isEffectiveSetUom, srItem?.due]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleOfferAllGood = (batchKey, batch) => {
        const goodEligible = batch.goodSleepersEligible || 0;
        if (goodEligible === 0) return;
        setBatchSelections(prev => ({
            ...prev,
            [batchKey]: {
                goodSelected: new Set(batch.goodSleeperIds.slice(0, goodEligible)),
                batchTouched: true
            }
        }));
    };

    const handleClearBatch = (batchKey) => {
        setBatchSelections(prev => ({ ...prev, [batchKey]: { goodSelected: new Set(), batchTouched: false } }));
    };

    const handleToggleGoodSleeper = (batchKey, sleeperId) => {
        const batch = batches.find(b => (b.batchKey || b.batchNo) === batchKey);
        if (!batch || getEligible(batch) === 0) return;
        setBatchSelections(prev => {
            const cur = prev[batchKey] || { goodSelected: new Set(), batchTouched: false };
            const newSet = new Set(cur.goodSelected);
            if (newSet.has(sleeperId)) newSet.delete(sleeperId);
            else newSet.add(sleeperId);
            return {
                ...prev,
                [batchKey]: { goodSelected: newSet, batchTouched: newSet.size > 0 }
            };
        });
    };

    const handleToggleExpand = (batchKey) => {
        setExpandedBatch(prev => prev === batchKey ? null : batchKey);
        setBatchSelections(prev => {
            if (!prev[batchKey]) return { ...prev, [batchKey]: { goodSelected: new Set(), batchTouched: false } };
            return prev;
        });
    };

    const getGoodSelected = (batchKey) => batchSelections[batchKey]?.goodSelected || new Set();
    const isBatchTouched = (batchKey) => batchSelections[batchKey]?.batchTouched || false;

    // ── Styles ────────────────────────────────────────────────────────────────
    const overlayStyle = {
        position: 'fixed', inset: 0,
        background: 'rgba(13,59,63,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, backdropFilter: 'blur(6px)', padding: '16px'
    };
    const modalStyle = {
        background: '#fff', borderRadius: 16,
        width: '80vw', maxWidth: '80vw',
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
                            {isEdit ? 'MODIFY FINAL INSPECTION CALL' : 'RAISE FINAL INSPECTION CALL'}
                        </div>
                        <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>
                            {poNo} — SR. No. {srItem.itemSrNo || srItem.srNo || (srItem.poSerialNo ? srItem.poSerialNo.split('/').pop() : 'N/A')}
                            {isEdit && editCallNo ? ` (${editCallNo})` : ''}
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
                        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, minWidth: 120 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 3 }}>PO NO.</div>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{poNo}</div>
                            </div>
                            <div style={{ flex: 0.8, minWidth: 80 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 3 }}>SR. NO.</div>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{srItem.itemSrNo || srItem.srNo || (srItem.poSerialNo ? srItem.poSerialNo.split('/').pop() : 'N/A')}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: 100 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 3 }}>CALL DATE</div>
                                <div style={{ fontWeight: 700, color: '#21808d', fontSize: 14 }}>{callDate}</div>
                            </div>
                            <div style={{ flex: 1.2, minWidth: 150 }}>
                                <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Date of Inspection <span style={{ color: '#dc2626' }}>*</span>
                                </div>
                                <input
                                    type="date"
                                    value={dateOfInspection}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setDateOfInspection(e.target.value)}
                                    style={{
                                        width: '100%', height: 38, padding: '0 10px',
                                        border: '1.5px solid #21808d', borderRadius: 8,
                                        fontSize: 13, fontWeight: 700, color: '#0f172a',
                                        background: '#fff', cursor: 'pointer', outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1.6, minWidth: 240 }}>
                                <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Select Sleeper Type for Inspection <span style={{ color: '#dc2626' }}>*</span>
                                </div>
                                {isLoadingTypes ? (
                                    <div style={{
                                        height: 38, display: 'flex', alignItems: 'center', padding: '0 12px',
                                        border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 12, color: '#94a3b8', background: '#fff'
                                    }}>
                                        Loading sleeper types...
                                    </div>
                                ) : sleeperTypes.length === 0 ? (
                                    <div style={{
                                        height: 38, display: 'flex', alignItems: 'center', padding: '0 12px',
                                        border: '1.5px dashed #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', background: '#fef2f2'
                                    }}>
                                        No sleeper types found
                                    </div>
                                ) : (
                                    <select
                                        value={mainSleeperType}
                                        onChange={(e) => {
                                            const selected = e.target.value;
                                            setMainSleeperType(selected);
                                            setSelectedSleeperTypes([selected]);
                                            setBatchSelections({});
                                            setExpandedBatch(null);
                                        }}
                                        style={{
                                            width: '100%', height: 38, padding: '0 12px',
                                            border: '1.5px solid #21808d', borderRadius: 8,
                                            fontSize: 13, fontWeight: 700, color: '#0f172a',
                                            background: '#fff', cursor: 'pointer', outline: 'none'
                                        }}
                                    >
                                        {sleeperTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* PO Status Tracker */}
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            PO Status Tracker
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'stretch' }}>
                            <StatBox label="Quantity on Order" value={(srItem.orderedQty || srItem.ordered || 0).toLocaleString()} />
                            <StatBox label="UOM" value={displayUom} />
                            <StatBox label="Cumm. Qty Offered Previously" value={(srItem.offeredTillNow || 0).toLocaleString()} color="#7c3aed" />
                            <StatBox label="Qty. Passed Previously" value={(srItem.acceptedTillNow || 0).toLocaleString()} color="#16a34a" />
                            <StatBox label="Qty Pending for Verification" value={(srItem.due || 0).toLocaleString()} highlight={(srItem.due || 0) === 0} />
                            {isEffectiveSetUom ? (
                                <div style={{
                                    background: '#fff',
                                    border: '1.5px solid #21808d',
                                    borderRadius: 10, padding: '8px 12px', minWidth: 150, flex: '1 1 150px',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    boxShadow: '0 2px 6px rgba(33,128,141,0.08)'
                                }}>
                                    <div style={{ fontSize: 11, color: '#21808d', fontWeight: 700, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>To Be Offered ({displayUom}) <span style={{ color: '#dc2626' }}>*</span></span>
                                        {srItem.due !== undefined && (
                                            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Max: {srItem.due}</span>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        max={srItem.due !== undefined ? srItem.due : undefined}
                                        step="1"
                                        value={toBeOffered}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setToBeOffered(val === '' ? '' : parseInt(val, 10) || 0);
                                        }}
                                        placeholder="1"
                                        style={{
                                            width: '100%',
                                            height: 28,
                                            border: '1px solid #cbd5e1',
                                            borderRadius: 6,
                                            padding: '2px 8px',
                                            fontSize: 17,
                                            fontWeight: 800,
                                            color: '#0d3b3f',
                                            outline: 'none',
                                            background: '#f8fafc',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 3 }}>
                                        Enter number of <strong>Sets</strong> (e.g. 1)
                                    </div>
                                </div>
                            ) : (
                                <StatBox label={`To Be Offered (${displayUom})`} value={summary.totalPassedCount.toLocaleString()} color="#21808d" />
                            )}
                        </div>
                    </div>

                    {/* ════ SECTION B ════ */}
                    <div style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 12, padding: '18px 20px', marginBottom: 20
                    }}>
                        <SectionHeader step="B" label="Sleeper Type & Granular Batch Selection" color="#7c3aed" />

                        {/* Sleeper Type(s) Multi-Select Dropdown */}
                        <div style={{ marginBottom: 18, position: 'relative' }} ref={dropdownRef}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Sleeper Type(s) <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            {isLoadingTypes ? (
                                <div style={{
                                    width: '100%', maxWidth: 360, height: 42,
                                    display: 'flex', alignItems: 'center', padding: '0 14px',
                                    border: '1.5px solid #cbd5e1', borderRadius: 8,
                                    fontSize: 13, color: '#94a3b8', background: '#fff'
                                }}>
                                    Loading sleeper types...
                                </div>
                            ) : sleeperTypes.length === 0 ? (
                                <div style={{
                                    width: '100%', maxWidth: 360, height: 42,
                                    display: 'flex', alignItems: 'center', padding: '0 14px',
                                    border: '1.5px dashed #fca5a5', borderRadius: 8,
                                    fontSize: 13, color: '#dc2626', background: '#fef2f2'
                                }}>
                                    No sleeper types found
                                </div>
                            ) : (
                                <div style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
                                    {/* Dropdown Input Box */}
                                    <div
                                        onClick={() => setIsDropdownOpen(prev => !prev)}
                                        style={{
                                            width: '100%', minHeight: 42, padding: '6px 14px',
                                            border: `1.5px solid ${isDropdownOpen ? '#21808d' : '#cbd5e1'}`,
                                            borderRadius: 8, fontSize: 13, fontWeight: 700,
                                            color: selectedSleeperTypes.length > 0 ? '#0f172a' : '#94a3b8',
                                            background: '#fff', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            boxShadow: isDropdownOpen ? '0 0 0 3px rgba(33,128,141,0.15)' : 'none',
                                            transition: 'all 0.2s', userSelect: 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
                                            {selectedSleeperTypes.length === 0 ? (
                                                <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                                                    -- Select Sleeper Type(s) --
                                                </span>
                                            ) : selectedSleeperTypes.length === 1 ? (
                                                <span style={{ color: '#0d3b3f', fontWeight: 800 }}>
                                                    {selectedSleeperTypes[0]}
                                                </span>
                                            ) : (
                                                <>
                                                    <span style={{
                                                        background: 'rgba(33,128,141,0.12)', color: '#0d3b3f',
                                                        padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800
                                                    }}>
                                                        {selectedSleeperTypes.length} Selected
                                                    </span>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontSize: 12, fontWeight: 600 }}>
                                                        {selectedSleeperTypes.join(', ')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <span style={{ fontSize: 11, color: '#21808d', fontWeight: 800, marginLeft: 8, flexShrink: 0 }}>
                                            {isDropdownOpen ? '▲' : '▼'}
                                        </span>
                                    </div>

                                    {/* Dropdown Menu Overlay */}
                                    {isDropdownOpen && (
                                        <div style={{
                                            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                            background: '#fff', border: '1.5px solid #21808d', borderRadius: 10,
                                            boxShadow: '0 16px 36px rgba(0,0,0,0.18)', zIndex: 100,
                                            overflow: 'hidden', animation: 'modalFadeIn 0.15s ease-out'
                                        }}>
                                            {/* Search Bar inside Dropdown */}
                                            <div style={{ padding: '8px 10px', background: '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{
                                                    position: 'relative', display: 'flex', alignItems: 'center',
                                                    background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6,
                                                    padding: '5px 10px'
                                                }}>
                                                    <span style={{ fontSize: 12, color: '#94a3b8', marginRight: 6 }}>🔍</span>
                                                    <input
                                                        type="text"
                                                        value={typeSearchText}
                                                        onChange={(e) => setTypeSearchText(e.target.value)}
                                                        placeholder="Search sleeper type..."
                                                        autoFocus
                                                        style={{
                                                            border: 'none', background: 'transparent', outline: 'none',
                                                            fontSize: 12, fontWeight: 600, color: '#0f172a', width: '100%'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    {typeSearchText && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setTypeSearchText(''); }}
                                                            style={{
                                                                border: 'none', background: 'none', color: '#94a3b8',
                                                                fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Counter & Action Bar */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '6px 12px', borderBottom: '1px solid #f1f5f9', background: '#fff'
                                            }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                                                    {selectedSleeperTypes.length} of {sleeperTypes.length} selected
                                                </span>
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const filtered = sleeperTypes.filter(t => t.toLowerCase().includes(typeSearchText.toLowerCase()));
                                                            const toAdd = filtered.filter(t => !selectedSleeperTypes.includes(t));
                                                            setSelectedSleeperTypes(prev => [...prev, ...toAdd]);
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: '#21808d', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (typeSearchText) {
                                                                const filtered = sleeperTypes.filter(t => t.toLowerCase().includes(typeSearchText.toLowerCase()));
                                                                setSelectedSleeperTypes(prev => prev.filter(t => !filtered.includes(t)));
                                                            } else {
                                                                setSelectedSleeperTypes([]);
                                                            }
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Scrollable Sleeper Types List */}
                                            <div style={{
                                                maxHeight: 220, overflowY: 'auto', padding: '6px'
                                            }}>
                                                {sleeperTypes
                                                    .filter(type => type.toLowerCase().includes(typeSearchText.toLowerCase()))
                                                    .length === 0 ? (
                                                        <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                                                            No sleeper type matches "{typeSearchText}"
                                                        </div>
                                                    ) : (
                                                        sleeperTypes
                                                            .filter(type => type.toLowerCase().includes(typeSearchText.toLowerCase()))
                                                            .map(type => {
                                                                const isChecked = selectedSleeperTypes.includes(type);
                                                                return (
                                                                    <div
                                                                        key={type}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedSleeperTypes(prev => {
                                                                                const next = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
                                                                                if (next.length > 0 && (!mainSleeperType || !next.includes(mainSleeperType))) {
                                                                                    setMainSleeperType(next[0]);
                                                                                } else if (next.length === 0) {
                                                                                    setMainSleeperType('');
                                                                                }
                                                                                return next;
                                                                            });
                                                                        }}
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', gap: 10,
                                                                            padding: '8px 10px', borderRadius: 6, marginBottom: 2,
                                                                            background: isChecked ? 'rgba(33,128,141,0.08)' : 'transparent',
                                                                            color: isChecked ? '#0d3b3f' : '#334155',
                                                                            fontSize: 13, fontWeight: isChecked ? 700 : 500,
                                                                            cursor: 'pointer', transition: 'background 0.15s'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            if (!isChecked) e.currentTarget.style.background = '#f8fafc';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            if (!isChecked) e.currentTarget.style.background = 'transparent';
                                                                        }}
                                                                    >
                                                                        <span style={{
                                                                            width: 17, height: 17, borderRadius: 4,
                                                                            border: `1.5px solid ${isChecked ? '#21808d' : '#cbd5e1'}`,
                                                                            background: isChecked ? '#21808d' : '#fff',
                                                                            color: '#fff', fontSize: 11, display: 'flex',
                                                                            alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0,
                                                                            transition: 'all 0.15s'
                                                                        }}>
                                                                            {isChecked ? '✓' : ''}
                                                                        </span>
                                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {type}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedSleeperTypes.length > 0 && (
                            <div style={{ 
                                marginBottom: 16, 
                                padding: '8px 14px', 
                                background: '#fdf8e6', 
                                border: '1.5px dashed #fcd34d', 
                                borderRadius: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 8
                            }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                                    Batches loading for selected types:
                                </span>
                                {selectedSleeperTypes.map(st => (
                                    <span key={st} style={{ 
                                        fontSize: 12, 
                                        fontWeight: 800, 
                                        color: '#7c3aed',
                                        background: '#fff',
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        {st}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Batch Grid */}
                        {selectedSleeperTypes.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>
                                Please select at least one Sleeper Type above to view completed batches.
                            </div>
                        )}

                        {selectedSleeperTypes.length > 0 && isLoadingBatches && (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                                Fetching completed batches...
                            </div>
                        )}

                        {selectedSleeperTypes.length > 0 && !isLoadingBatches && batches.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>
                                No eligible batches found for the selected sleeper type(s)
                            </div>
                        )}

                        {selectedSleeperTypes.length > 0 && !isLoadingBatches && batches.map(batch => {
                            const batchKey = batch.batchKey || batch.batchNo;
                            const goodSelected = getGoodSelected(batchKey);
                            const isExpanded = expandedBatch === batchKey;
                            const isActive = isBatchTouched(batchKey);
                            const eligible = getEligible(batch);
                            const allGoodOffered = goodSelected.size === batch.goodSleepersEligible && batch.goodSleepersEligible > 0;

                            return (
                                <div key={batchKey} style={{
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
                                            {/* Discrepancy warning: uninspected sleepers detected */}
                                            {batch.totalCasted > (batch.goodSleepers || 0) + (batch.badSleepers || 0) && (
                                                <div
                                                    title={`${batch.totalCasted - (batch.goodSleepers || 0) - (batch.badSleepers || 0)} sleeper(s) found in production records but missing from inspection results`}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        marginTop: 4, padding: '2px 7px', borderRadius: 10,
                                                        background: '#fef9c3', border: '1px solid #fde047',
                                                        fontSize: 10, fontWeight: 700, color: '#854d0e',
                                                        cursor: 'help'
                                                    }}
                                                >
                                                    ⚠ {batch.totalCasted - (batch.goodSleepers || 0) - (batch.badSleepers || 0)} uninspected
                                                </div>
                                            )}
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
                                                <span
                                                    style={{ fontWeight: 700, fontSize: 13, color: '#166534', background: '#f0fdf4', padding: '2px 8px', borderRadius: 6 }}
                                                >
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
                                            <div
                                                title={batch.previouslyOfferedBad > 0 ? `${batch.previouslyOfferedGood} Good + ${batch.previouslyOfferedBad} Bad previously offered` : undefined}
                                                style={{ fontWeight: 700, fontSize: 14, color: batch.previouslyOffered > 0 ? '#7c3aed' : '#94a3b8' }}
                                            >
                                                {batch.previouslyOffered}
                                            </div>
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
                                                onClick={() => allGoodOffered ? handleClearBatch(batchKey) : handleOfferAllGood(batchKey, batch)}
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
                                                onClick={() => handleToggleExpand(batchKey)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: 20, fontSize: 11,
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    border: '1.5px solid #e2e8f0',
                                                    background: isExpanded ? '#f0f7ff' : '#fff',
                                                    color: isExpanded ? '#2563eb' : '#475569',
                                                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {isExpanded ? '▲ Collapse' : (eligible > 0 ? `▼ Select${goodSelected.size > 0 ? ` (${goodSelected.size})` : ''}` : '▼ View')}
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
                                            {/* Good Sleepers (Eligible) */}
                                            {batch.goodSleepersEligible > 0 && (
                                                <div style={{ marginBottom: 12 }}>
                                                    <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                        ✓ Eligible Good Sleepers — {goodSelected.size} of {eligible} selected
                                                    </div>
                                                    <div style={{
                                                        maxHeight: 180, overflowY: 'auto',
                                                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                                        gap: 5
                                                    }}>
                                                        {batch.goodSleeperIds.map((sid, idx) => {
                                                            const label = (batch.goodSleeperLabels || {})[sid] || sid;
                                                            const isEligible = idx < eligible;
                                                            const isChecked = goodSelected.has(sid);
                                                            return (
                                                                <label key={sid} style={{
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
                                                                        onChange={() => isEligible && handleToggleGoodSleeper(batchKey, sid)}
                                                                        style={{ width: 13, height: 13, flexShrink: 0 }}
                                                                    />
                                                                    <span style={{ fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                                        {label}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Previously Offered Good Sleepers */}
                                            {batch.goodSleepersRaised > 0 && (
                                                <div style={{ marginBottom: 12 }}>
                                                    <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        ✓ Good Sleepers — {batch.goodSleepersRaised} already raised in previous call (not included in this call)
                                                    </div>
                                                    <div style={{
                                                        maxHeight: 140, overflowY: 'auto',
                                                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
                                                        gap: 5
                                                    }}>
                                                        {(batch.raisedGoodSleepersDisplay || []).map((s, idx) => (
                                                            <div key={`raised-good-${s.sleeperId}-${idx}`} style={{
                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                                padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                                                                background: '#f0f9ff',
                                                                border: '1px dashed #bae6fd',
                                                                color: '#0369a1'
                                                            }}>
                                                                <span style={{ color: '#0284c7', fontSize: 10, flexShrink: 0 }}>✓</span>
                                                                <span style={{ fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                                    {s.displayNo}
                                                                </span>
                                                                <span style={{ fontSize: 9, color: '#0284c7', background: '#e0f2fe', padding: '1px 4px', borderRadius: 4, marginLeft: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                                    Offered
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Bad Sleepers */}
                                            {(batch.badSleepersEligible > 0 || batch.badSleepersRaised > 0) && (
                                                <div style={{ marginTop: 12 }}>
                                                    {/* Unraised bad sleepers (to be included in this call) */}
                                                    {batch.badSleepersEligible > 0 && (
                                                        <div style={{ marginBottom: batch.badSleepersRaised > 0 ? 10 : 0 }}>
                                                            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                ✕ Bad Sleepers — {batch.badSleepersEligible} to be reported in this call (automatically included)
                                                            </div>
                                                            <div style={{
                                                                maxHeight: 140, overflowY: 'auto',
                                                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                                                gap: 6
                                                            }}>
                                                                {batch.badSleeperIds.map((sid, idx) => {
                                                                    const label = (batch.badSleeperLabels || {})[sid] || sid;
                                                                    const formName = (batch.badSleeperForms || {})[sid] || '';
                                                                    const reason = (batch.badSleeperReasons || {})[sid] || '';
                                                                    return (
                                                                        <label key={`${sid}-idx-${idx}`} 
                                                                            title={reason ? `Form: ${formName || 'Inspection'}\nReason: ${reason}` : (formName ? `Form: ${formName}` : 'Rejected')}
                                                                            style={{
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
                                                                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                                                {label}
                                                                            </span>
                                                                            {formName && (
                                                                                <span style={{
                                                                                    fontSize: 9.5,
                                                                                    color: '#991b1b',
                                                                                    background: '#fee2e2',
                                                                                    padding: '1px 5px',
                                                                                    borderRadius: 4,
                                                                                    fontWeight: 600,
                                                                                    marginLeft: 'auto',
                                                                                    whiteSpace: 'nowrap'
                                                                                }}>
                                                                                    {formName}
                                                                                </span>
                                                                            )}
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Already raised bad sleepers in previous call (not included in this call) */}
                                                    {batch.badSleepersRaised > 0 && (
                                                        <div>
                                                            <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                ✓ Bad Sleepers — {batch.badSleepersRaised} already raised in previous call (not included in this call)
                                                            </div>
                                                            <div style={{
                                                                maxHeight: 140, overflowY: 'auto',
                                                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                                                                gap: 6
                                                            }}>
                                                                {(batch.raisedBadSleepersDisplay || []).map((s, idx) => {
                                                                    const formName = s.formName || (batch.raisedBadSleeperForms || {})[String(s.sleeperId)] || '';
                                                                    return (
                                                                        <div key={`raised-bad-${s.sleeperId}-${idx}`} 
                                                                            title={formName ? `Form: ${formName}` : 'Raised in previous call'}
                                                                            style={{
                                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                                                padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                                                                background: '#f8fafc',
                                                                                border: '1px dashed #cbd5e1',
                                                                                color: '#64748b'
                                                                            }}>
                                                                            <span style={{ color: '#059669', fontSize: 10, flexShrink: 0 }}>✓</span>
                                                                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                                                {s.displayNo}
                                                                            </span>
                                                                            {formName && (
                                                                                <span style={{
                                                                                    fontSize: 9,
                                                                                    color: '#475569',
                                                                                    background: '#f1f5f9',
                                                                                    padding: '1px 4px',
                                                                                    borderRadius: 4,
                                                                                    marginLeft: 'auto',
                                                                                    whiteSpace: 'nowrap'
                                                                                }}>
                                                                                    {formName}
                                                                                </span>
                                                                            )}
                                                                            <span style={{
                                                                                fontSize: 9,
                                                                                color: '#b45309',
                                                                                background: '#fef3c7',
                                                                                padding: '1px 4px',
                                                                                borderRadius: 4,
                                                                                marginLeft: formName ? 4 : 'auto',
                                                                                whiteSpace: 'nowrap',
                                                                                flexShrink: 0
                                                                            }}>
                                                                                Raised
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
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
                                highlight={summary.exceedsCap && !isEffectiveSetUom}
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
                                {isEffectiveSetUom
                                    ? `Offered quantity (${summary.offeredQtyValue} ${displayUom}) cannot exceed ${displayUom} due for dispatch (${summary.due} ${displayUom}). Please reduce "To Be Offered".`
                                    : `Offered quantity (${summary.offeredQtyValue}) cannot exceed sleepers due for dispatch (${summary.due}). Please reduce your selection.`
                                }
                            </div>
                        ) : isEffectiveSetUom && (!toBeOffered || Number(toBeOffered) <= 0) ? (
                            <div style={{
                                background: '#fffbeb', border: '1px solid #fde68a',
                                borderRadius: 8, padding: '10px 14px', fontSize: 12,
                                color: '#b45309', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center'
                            }}>
                                <span>ℹ️</span>
                                Please enter the quantity of {displayUom} in "To Be Offered" above.
                            </div>
                        ) : summary.totalPassedCount > 0 ? (
                            <div style={{
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                borderRadius: 8, padding: '10px 14px', fontSize: 12,
                                color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
                            }}>
                                <span>✓ Quantity selected ({summary.totalPassedCount} individual sleepers{isEffectiveSetUom && toBeOffered ? ` for ${toBeOffered} ${displayUom}` : ''})</span>
                                {summary.afterOffering !== null && (
                                    <span style={{ fontWeight: 700 }}>
                                        {isEffectiveSetUom ? `${displayUom} Due After This Offering:` : 'Sleepers Due After This Offering:'} <span style={{ fontSize: 15 }}>{summary.afterOffering.toLocaleString()}</span>
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
                        disabled={
                            isEffectiveSetUom
                                ? (!toBeOffered || Number(toBeOffered) <= 0 || (srItem.due !== undefined && srItem.due !== null && Number(toBeOffered) > srItem.due) || summary.totalPassedCount === 0 || summary.exceedsCap || !mainSleeperType || !dateOfInspection || isSubmitting)
                                : (summary.totalPassedCount === 0 || summary.exceedsCap || !mainSleeperType || !dateOfInspection || isSubmitting)
                        }
                        onClick={async () => {
                            setIsSubmitting(true);
                            try {
                                const rawUserId = sessionStorage.getItem('userId');
                                const parsedUserId = parseInt(rawUserId, 10);
                                const numericUserId = (!isNaN(parsedUserId) && parsedUserId > 0) ? parsedUserId : 1;
                                const vendorCode = sessionStorage.getItem('vendorCode');
                                
                                const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
                                const currentPlantId = selectedPlant ? selectedPlant.plantId : null;
                                
                                const effectiveOffered = isEffectiveSetUom
                                    ? (toBeOffered !== '' ? Number(toBeOffered) : 1)
                                    : (Number(summary.totalPassedCount) || 0);

                                // Call's sleeperType is ALWAYS the Main Sleeper Type selected in Section A
                                const payload = {
                                    poNo,
                                    srNo: srItem.itemSrNo || srItem.srNo || (srItem.poSerialNo ? srItem.poSerialNo.split('/').pop() : 'N/A'),
                                    sleeperType: mainSleeperType,
                                    totalOffered: effectiveOffered,
                                    totalRejected: Number(summary.totalRejectedCount) || 0,
                                    desiredInspectionDate: dateOfInspection || null,
                                    createdBy: numericUserId,
                                    vendorCode: vendorCode || '',
                                    plantId: currentPlantId ? String(currentPlantId) : '',
                                    batchesSelected: []
                                };
                                
                                for (const [batchKey, selection] of Object.entries(batchSelections)) {
                                    if (selection && selection.goodSelected && selection.goodSelected.size > 0) {
                                        const batch = batches.find(b => 
                                             (b.batchKey || b.batchNo) === batchKey ||
                                             b.batchKey === batchKey ||
                                             b.batchNo === batchKey ||
                                             (b.batchNo && (batchKey.endsWith('_' + b.batchNo) || batchKey === b.batchNo)) ||
                                             (b.batchKey && (batchKey.endsWith(b.batchKey) || batchKey === b.batchKey))
                                        );
                                        if (!batch) {
                                            console.warn("Could not match batch for key:", batchKey);
                                            continue;
                                        }
                                        const goodLabels = batch.goodSleeperLabels || {};
                                        const goodSleepers = Array.from(selection.goodSelected).map(sid => goodLabels[sid] || String(sid));
                                        const badSleepers = (batch.badSleepersDisplay || []).map(s => String(s.displayNo));
                                        
                                        const goodSleeperIds = Array.from(selection.goodSelected)
                                            .map(id => {
                                                const num = parseInt(id, 10);
                                                return (!isNaN(num) && num > 0) ? num : 0;
                                            });

                                        const badSleeperIds = (batch?.badSleepersDisplay || batch?.badSleepersData || [])
                                            .map(s => {
                                                const num = parseInt(s.sleeperId, 10);
                                                return (!isNaN(num) && num > 0) ? num : 0;
                                            });

                                        payload.batchesSelected.push({
                                            batchNo: batch.batchNo,
                                            goodSleepers,
                                            badSleepers,
                                            goodSleeperIds,
                                            badSleeperIds,
                                            totalCasted: batch.totalCasted || (goodSleepers.length + badSleepers.length),
                                            castDate: batch.castDate || 'N/A',
                                            previouslyOffered: batch.previouslyOffered || 0
                                        });
                                    }
                                }

                                if (isEdit) {
                                    payload.callNo = editCallNo;
                                    const result = await apiService.modifySleeperInspectionCall(payload);
                                    if (onSubmitInspectionCall) {
                                        onSubmitInspectionCall({
                                            ...payload,
                                            callNo: editCallNo,
                                            batchesSelectedCount: summary.batchesSelected
                                        });
                                    } else {
                                        alert(`✅ Inspection Call ${editCallNo} modified successfully!\n\nPO: ${payload.poNo} | SR: ${payload.srNo}\nPassed Sleepers: ${payload.totalOffered}\nRejected Sleepers: ${payload.totalRejected}\nBatches: ${summary.batchesSelected}`);
                                    }
                                } else {
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
                                }
                                onClose();
                            } catch (error) {
                                alert(isEdit ? "Failed to modify inspection call. Please try again." : "Failed to submit inspection call. Please try again.");
                                setIsSubmitting(false);
                            }
                        }}
                        style={{
                            padding: '9px 24px', borderRadius: 8, border: 'none',
                            background: (
                                isEffectiveSetUom
                                    ? (!toBeOffered || Number(toBeOffered) <= 0 || (srItem.due !== undefined && srItem.due !== null && Number(toBeOffered) > srItem.due) || summary.totalPassedCount === 0 || summary.exceedsCap || !mainSleeperType || !dateOfInspection || isSubmitting)
                                    : ((toBeOffered !== '' ? Number(toBeOffered) <= 0 : summary.totalPassedCount === 0) || (srItem.due !== undefined && srItem.due !== null && (toBeOffered !== '' ? Number(toBeOffered) > srItem.due : summary.exceedsCap)) || !mainSleeperType || !dateOfInspection || isSubmitting)
                            )
                                ? '#e2e8f0' : 'linear-gradient(135deg, #21808d, #0d3b3f)',
                            color: (
                                isEffectiveSetUom
                                    ? (!toBeOffered || Number(toBeOffered) <= 0 || (srItem.due !== undefined && srItem.due !== null && Number(toBeOffered) > srItem.due) || summary.totalPassedCount === 0 || summary.exceedsCap || !mainSleeperType || !dateOfInspection || isSubmitting)
                                    : ((toBeOffered !== '' ? Number(toBeOffered) <= 0 : summary.totalPassedCount === 0) || (srItem.due !== undefined && srItem.due !== null && (toBeOffered !== '' ? Number(toBeOffered) > srItem.due : summary.exceedsCap)) || !mainSleeperType || !dateOfInspection || isSubmitting)
                            ) ? '#94a3b8' : '#fff',
                            fontWeight: 700, fontSize: 13, cursor:
                                (
                                    isEffectiveSetUom
                                        ? (!toBeOffered || Number(toBeOffered) <= 0 || (srItem.due !== undefined && srItem.due !== null && Number(toBeOffered) > srItem.due) || summary.totalPassedCount === 0 || summary.exceedsCap || !mainSleeperType || !dateOfInspection || isSubmitting)
                                        : ((toBeOffered !== '' ? Number(toBeOffered) <= 0 : summary.totalPassedCount === 0) || (srItem.due !== undefined && srItem.due !== null && (toBeOffered !== '' ? Number(toBeOffered) > srItem.due : summary.exceedsCap)) || !mainSleeperType || !dateOfInspection || isSubmitting)
                                ) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isSubmitting ? (isEdit ? 'Updating...' : 'Submitting...') : (isEdit ? 'Update Inspection Call' : 'Submit Inspection Call')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default RaiseInspectionCallForm;

