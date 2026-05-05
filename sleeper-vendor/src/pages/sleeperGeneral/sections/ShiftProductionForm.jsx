import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import { BASE_URL } from '../../../services/api';

const ShiftProductionForm = ({ onBack, onSave, lastBatchNumber, initialData, isReadOnly, currentDeclarations }) => {
    const [masterBenches, setMasterBenches] = useState([]);
    const [masterLongLines, setMasterLongLines] = useState([]);
    const [plantProfiles, setPlantProfiles] = useState([]);
    const [plantDetails, setPlantDetails] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [activeSections, setActiveSections] = useState({ 1: true, 2: false, 3: false });
    const [plantType, setPlantType] = useState('Stress Bench'); // Stress Bench or Long Line


    const vendorCode = sessionStorage.getItem('vendorCode') || '';
    const userId = sessionStorage.getItem('userId') || 0;
    const selectedPlantRaw = localStorage.getItem('selectedPlant');
    const selectedPlant = selectedPlantRaw ? JSON.parse(selectedPlantRaw) : null;
    const plantId = selectedPlant ? selectedPlant.plantId : '';

    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().split(' ')[0].substring(0, 5);
    };

    const [formHeader, setFormHeader] = useState({
        unit: '',
        shedType: 'Twin',
        date: new Date().toISOString().split('T')[0],
        shift: 'Day',
        batchNo: '',
        mixDesign: 'M60',
        timeLbc: getCurrentTime(),
        remarks: ''
    });

    const [chambers, setChambers] = useState([]); // Will be derived from stressBenchEntries
    const [stressBenchEntries, setStressBenchEntries] = useState([]);
    const [stressBenchForm, setStressBenchForm] = useState({
        chamberNo: '',
        entryMode: 'range',
        fromNo: '',
        toNo: '',
        singleNo: '',
        sleeperType: 'RT-8746', // Default can remain RT-8746
        mouldsPerBench: 8
    });

    const [longLineEntries, setLongLineEntries] = useState([]);
    const [longLineForm, setLongLineForm] = useState({
        entryMode: 'range',
        fromNo: '',
        toNo: '',
        singleNo: '',
        mouldsPerGang: 8,
        sleeperType: 'RT-8746'
    });

    const [unitOptions, setUnitOptions] = useState([]);
    const [editingEntryId, setEditingEntryId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        message: '',
        onConfirm: null
    });

    const getSleeperTypeForBench = (benchNo) => {
        if (!benchNo) return null;
        // Mock logic for auto-population: even benches are RT-8746, odd are RT-8521
        return parseInt(benchNo) % 2 === 0 ? 'RT-8746' : 'RT-8521';
    };

    useEffect(() => {
    const fetchUnits = async () => {
        try {
            const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
            const plantId = selectedPlant?.plantId;
           const vendorId = sessionStorage.getItem('userId');

            const res = await fetch(
                `${BASE_URL}/plant-profile/vendor/{vendorId}/{plantId}/sheds?vendorId=${vendorId}&plantId=${encodeURIComponent(plantId)}`
            );
            const data = await res.json();

            if (data?.responseData) {
                if (plantType === 'Stress Bench') {
                    setUnitOptions(data.responseData["Stress Bench"] || []);
                } else {
                    setUnitOptions(data.responseData["Longline"] || []);
                }
            }
        } catch (err) {
            console.error("Failed to fetch units", err);
        }
    };

    fetchUnits();
}, [plantType]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [benches, longLines, profiles, details] = await Promise.all([
                    apiService.getStressBenches(),
                    apiService.getLongLines(),
                    apiService.getPlantProfiles(),
                    apiService.getPlantDetails(vendorCode)
                ]);
                setMasterBenches(benches || []);
                setMasterLongLines(longLines || []);
                setPlantProfiles(profiles || []);
                setPlantDetails(details?.responseData || []);
                
                // Set initial default unit only when creating a NEW declaration (not editing)
                // In edit/modify mode, initialData's useEffect handles setting the correct unit.
                if (!initialData) {
                    const availableDetails = details?.responseData || [];
                    if (availableDetails.length > 0) {
                        const firstMatch = [...availableDetails].reverse().find(p => {
                            const type = p.plantType || '';
                            if (plantType === 'Stress Bench') return type === 'Stress Bench';
                            return type === 'Longline' || type === 'Long Line';
                        }) || availableDetails[availableDetails.length - 1];
                        const initialPlantType = firstMatch.plantType === 'Longline' ? 'Long Line' : 'Stress Bench';
                        setPlantType(initialPlantType);

                        const firstUnit = firstMatch.units?.[0];
                        if (firstUnit) {
                            const label = (initialPlantType === 'Stress Bench' && firstUnit.toLowerCase().includes('line'))
                                ? firstUnit.toLowerCase().replace('line', 'Shed')
                                : firstUnit;
                            const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
                            setFormHeader(prev => ({ ...prev, unit: formattedLabel }));
                        }
                    } else if (profiles && profiles.length > 0) {
                        const firstProfile = profiles.find(p => p.type === 'Stress Bench') || profiles[0];
                        const initialPlantType = firstProfile.type;
                        const totalUnits = parseInt(firstProfile.numberOfSheds || firstProfile.shedLines || 0);
                        const prefix = initialPlantType === 'Stress Bench' ? 'Shed' : 'Line';
                        if (totalUnits > 0) {
                            setFormHeader(prev => ({ ...prev, unit: `${prefix} 1` }));
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch master data:', err);
            }
        };
        fetchMasterData();
    }, []);
    const dynamicUnits = React.useMemo(() => {
        // First try to use plantDetails API data
        // Filter plantDetails to only use records verified by Sleeper IE
        const verifiedPlantDetails = plantDetails.filter(p => {
            const isVerified = p.status === 'Completed' || p.status === 'completed' || p.status === 'COMPLETED' || p.status === 'Locked' || (!p.status && p.updatedDate);
            return isVerified || p.status === undefined; // Fallback if API doesn't return status directly in plantDetails
        });

        const apiMatch = [...verifiedPlantDetails].reverse().find(p => {
            const type = p.plantType || '';
            if (plantType === 'Stress Bench') return type === 'Stress Bench';
            return type === 'Longline' || type === 'Long Line';
        });

        if (apiMatch && apiMatch.units && apiMatch.units.length > 0) {
            return apiMatch.units.map(unit => {
                let name = unit;
                if (plantType === 'Stress Bench' && unit.toLowerCase().includes('line')) {
                    name = unit.toLowerCase().replace('line', 'Shed').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                }
                return {
                    name: name,
                    type: plantType === 'Stress Bench' ? 'Twin' : 'Long Line',
                    mouldsPerBench: 8,
                    mouldsPerGang: 8
                };
            });
        }

        // Fallback to plantProfiles if API data is missing or incomplete
        const filtered = plantProfiles.filter(p => {
            // Check if verified from Sleeper IE
            const isVerified = p.status === 'Completed' || p.status === 'completed' || p.status === 'COMPLETED' || p.status === 'Locked' || (!p.status && p.updatedDate);
            if (!isVerified) return false;

            const type = p.plantType || '';
            if (plantType === 'Stress Bench') {
                return type === 'Stress Bench';
            } else {
                return type === 'Longline' || type === 'Long Line';
            }
        });

        const latestProfile = filtered.length > 0 ? filtered[filtered.length - 1] : null;
        const totalUnits = latestProfile ? (parseInt(latestProfile.numberOfSheds) || 0) : 0;
        const prefix = plantType === 'Stress Bench' ? 'Shed' : 'Line';

        return Array.from({ length: totalUnits }).map((_, i) => ({
            name: `${prefix} ${i + 1}`,
            type: plantType === 'Stress Bench' ? 'Twin' : 'Long Line',
            mouldsPerBench: 8,
            mouldsPerGang: 8
        }));
    }, [plantDetails, plantProfiles, plantType]);
    
    const allSleeperTypes = React.useMemo(() => {
        // Hardcoded as per request, others commented out
        const types = ['RT-8746', 'RT-2496'];
        /* 
        masterBenches.forEach(b => {
            if (b.sleeperCategory) types.add(b.sleeperCategory);
        });
        masterLongLines.forEach(l => {
            if (l.category) types.add(l.category);
        });
        */
        return types;
    }, []);

    const generateSleeperIds = (benchNo, count) => {
        if (!benchNo || !count) return [];
        return Array.from({ length: count }).map((_, i) => `${benchNo}${String.fromCharCode(65 + i)}`);
    };

    const getBenchMasterDetails = (benchNo) => {
        if (!benchNo) return { moulds: 0, rft: 0, sleeperNames: [], sleeperType: '' };

        // Find all matches in masterBenches (a bench might have multiple types, e.g. Turnouts)
        const bNo = parseInt(benchNo);
        const matches = masterBenches.filter(b => {
            if (b.entryType === 'SINGLE') {
                return b.benchNo == bNo;
            } else if (b.entryType === 'RANGE') {
                return bNo >= b.benchFrom && bNo <= b.benchTo;
            }
            return false;
        });

        if (matches.length > 0) {
            // Join all unique sleeper types found for this bench
            const uniqueTypes = [...new Set(matches.map(m => m.sleeperCategory).filter(Boolean))];
            const moulds = matches[0].numMouldsPerItem || matches[0].mouldsPerBench || 0;
            const sleeperType = uniqueTypes.join(', ');
            const isPnC = sleeperType.toLowerCase().includes('pnc');
            const rft = isPnC ? 2.5 : 0;
            const sleeperNames = Array.from({ length: moulds }).map((_, i) => `${benchNo}${String.fromCharCode(65 + i)}`);
            return { moulds, rft, sleeperNames, isPnC, sleeperType, allTypes: uniqueTypes };
        }

        // Fallback or default
        return { moulds: 0, rft: 0, sleeperNames: [], sleeperType: '' };
    };

    // Returns details scoped to a specific sleeper type (for per-type bench groups)
    const getBenchMasterDetailsForType = (benchNo, sleeperType) => {
        if (!benchNo || !sleeperType) return { moulds: 0, rft: 0, sleeperNames: [] };
        const bNo = parseInt(benchNo);
        const match = masterBenches.find(b => {
            const typeMatch = b.sleeperCategory === sleeperType;
            if (b.entryType === 'SINGLE') return b.benchNo == bNo && typeMatch;
            if (b.entryType === 'RANGE') return bNo >= b.benchFrom && bNo <= b.benchTo && typeMatch;
            return false;
        });
        if (match) {
            const moulds = match.numMouldsPerItem || match.mouldsPerBench || 0;
            const isPnC = sleeperType.toLowerCase().includes('pnc');
            const rft = isPnC ? 2.5 : 0;
            const sleeperNames = Array.from({ length: moulds }).map((_, i) => `${benchNo}${String.fromCharCode(65 + i)}`);
            return { moulds, rft, sleeperNames, isPnC };
        }
        return { moulds: 0, rft: 0, sleeperNames: [] };
    };


    const hasInitialized = React.useRef(false);

    useEffect(() => {
        if (initialData && !hasInitialized.current) {
            setPlantType(initialData.plantType === 'LONG_LINE' ? 'Long Line' : 'Stress Bench');

            // Map header
            const [d, m, y] = (initialData.castingDate || '').split('/');
            setFormHeader({
                unit: initialData.productionUnit || '',
                shedType: initialData.plantType === 'LONG_LINE' ? 'Long Line' : 'Twin',
                date: (y && m && d) ? `${y}-${m}-${d}` : new Date().toISOString().split('T')[0],
                shift: initialData.shift || 'Day',
                batchNo: initialData.batchNumber || '',
                mixDesign: initialData.mixDesignReference || 'M60',
                timeLbc: (initialData.lbcTime || getCurrentTime())?.substring(0, 5),
                remarks: initialData.remarks || ''
            });

            // Map chambers for Stress Bench with deduplication
            const isStress = initialData.plantType === 'STRESS' || initialData.plantType === 'Stress Bench';
            if (isStress && initialData.chambers) {
                const mappedEntries = [];

                initialData.chambers.forEach(c => {
                    c.benchGroups.forEach(g => {
                        mappedEntries.push({
                            id: Date.now() + Math.random(), // Unique ID for form state
                            chamberNo: c.chamberNo,
                            chamberId: c.id, // Store original chamber ID
                            groupId: g.id,   // Store original benchGroup ID
                            entryMode: g.mode?.toLowerCase() || 'single', 
                            fromNo: g.benchFrom?.toString() || '',
                            toNo: g.benchTo?.toString() || '',
                            singleNo: g.benchNo?.toString() || '',
                            sleeperType: g.sleeperType || '',
                            mouldsPerBench: g.mouldPerBench || 8,
                            _originalRft: g.rft,
                            _originalSleepers: g.sleepers,
                            _originalSleeperList: g.sleeperList, // Store original sleeperList
                            _isOld: true
                        });
                    });
                });
                if (mappedEntries.length > 0) setStressBenchEntries(mappedEntries);
            }

            // Map gangs for Long Line
            const isLongLine = initialData.plantType === 'LONG_LINE' || initialData.plantType === 'Long Line';
            if (isLongLine && initialData.gangs) {
                const mappedEntries = [];
                
                initialData.gangs.forEach((g, gIdx) => {
                    mappedEntries.push({
                        id: Date.now() + gIdx,
                        originalId: g.id, // Store original gang ID
                        entryMode: g.mode?.toLowerCase() || 'range',
                        fromNo: g.gangFrom?.toString() || '',
                        toNo: g.gangTo?.toString() || '',
                        singleNo: g.gangNo?.toString() || '',
                        mouldsPerGang: g.mouldsPerGang,
                        sleeperType: g.sleeperType,
                        _isOld: true,
                        _originalSleepers: g.sleepers,
                        _originalSleeperList: g.sleeperList // Store original sleeperList
                    });
                });
                if (mappedEntries.length > 0) setLongLineEntries(mappedEntries);
            }

            // Move to Section 1
            setActiveSections({ 1: true, 2: true, 3: true });
            hasInitialized.current = true;
        }
    }, [initialData]);

    // Re-sync the unit from initialData once dynamicUnits are available (after async master-data fetch).
    // This ensures the select dropdown shows the correct saved unit (e.g. "Shed 4") even though
    // dynamicUnits was empty when the initialData effect first ran.
    useEffect(() => {
        if (initialData?.productionUnit && dynamicUnits.length > 0) {
            setFormHeader(prev => ({
                ...prev,
                unit: initialData.productionUnit,
                shedType: initialData.plantType === 'LONG_LINE'
                    ? 'Long Line'
                    : (dynamicUnits.find(u => u.name === initialData.productionUnit)?.type || 'Twin')
            }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dynamicUnits]);

    useEffect(() => {
        const gangNo = longLineForm.entryMode === 'single' ? longLineForm.singleNo : longLineForm.fromNo;
        if (!gangNo || masterLongLines.length === 0) return;

        const gNo = parseInt(gangNo);
        const matches = masterLongLines.filter(m => {
            if (m.entryType === 'SINGLE') {
                return m.gangNo == gNo;
            } else if (m.entryType === 'RANGE') {
                return gNo >= m.gangFrom && gNo <= m.gangTo;
            }
            return false;
        });

        if (matches.length > 0) {
            const uniqueTypes = [...new Set(matches.map(m => m.category).filter(Boolean))];
            setLongLineForm(prev => ({
                ...prev,
                sleeperType: uniqueTypes.join(', ') || prev.sleeperType,
                mouldsPerGang: matches[0].mouldsPerGang || prev.mouldsPerGang
            }));
        }
    }, [longLineForm.singleNo, longLineForm.fromNo, longLineForm.entryMode, masterLongLines]);

    // This useEffect will group stressBenchEntries into chambers for submission/display
    useEffect(() => {
        const groupedChambers = stressBenchEntries.reduce((acc, entry) => {
            const chamberNo = entry.chamberNo;
            if (!acc[chamberNo]) {
                acc[chamberNo] = {
                    id: entry.chamberId || 0, // Use stored chamberId or 0
                    chamberNo: chamberNo,
                    benchGroups: []
                };
            }
            acc[chamberNo].benchGroups.push({
                id: entry.groupId || 0, // Use stored groupId or 0
                entryMode: entry.entryMode,
                benches: entry.entryMode === 'single' ? [entry.singleNo] : [], 
                fromNo: entry.fromNo,
                toNo: entry.toNo,
                singleNo: entry.singleNo,
                mouldsPerBench: entry.mouldsPerBench,
                sleeperType: entry.sleeperType,
                _originalRft: entry._originalRft,
                _originalSleepers: entry._originalSleepers,
                _originalSleeperList: entry._originalSleeperList,
                _isOld: entry._isOld
            });
            return acc;
        }, {});
        setChambers(Object.values(groupedChambers));
    }, [stressBenchEntries]);

    // Autopopulate Stress Bench sleeper type from bench master
    useEffect(() => {
        const benchNo = stressBenchForm.entryMode === 'single' ? stressBenchForm.singleNo : stressBenchForm.fromNo;
        if (!benchNo) return;

        const details = getBenchMasterDetails(benchNo);
        if (details.sleeperType) {
            setStressBenchForm(prev => ({
                ...prev,
                sleeperType: prev.sleeperType || 'RT-8746', // Keep current or default
                mouldsPerBench: details.moulds || prev.mouldsPerBench
            }));
        }
    }, [stressBenchForm.singleNo, stressBenchForm.fromNo, stressBenchForm.entryMode]);


    const isGroupPnC = (group) => {
        return group.sleeperType && group.sleeperType.toLowerCase().includes('pnc');
    };

    // This function is no longer directly used by the UI, but kept for potential future use or logic
    const isBenchDuplicate = (benchNo, currentChamberId, currentGroupId, currentBenchIdx) => {
        if (!benchNo) return false;
        // Find the current group's pinned type so we can allow the same bench
        // across groups that are type-separated (auto-split behaviour)
        let currentPinnedType = null;
        chambers.forEach(c => {
            if (c.id === currentChamberId) {
                c.benchGroups.forEach(g => {
                    if (g.id === currentGroupId) currentPinnedType = g.pinnedSleeperType || null;
                });
            }
        });

        let count = 0;
        chambers.forEach(c => {
            c.benchGroups.forEach(g => {
                if (g.id === currentGroupId) return; // skip self-group
                const otherPinnedType = g.pinnedSleeperType || null;
                // If both groups have different pinned types, the duplication is intentional
                if (currentPinnedType && otherPinnedType && currentPinnedType !== otherPinnedType) return;
                g.benches.forEach((b, idx) => {
                    if (b === benchNo) count++;
                });
            });
        });
        return count > 0;
    };

    const toggleSection = (id) => {
        setActiveSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // These functions are no longer directly used by the UI, as the UI now uses stressBenchEntries
    // const addChamber = () => {
    //     setChambers([...chambers, {
    //         id: Date.now(),
    //         chamberNo: '',
    //         benchGroups: [{ id: Date.now() + 1, entryMode: 'range', benches: [''], fromNo: '', toNo: '', singleNo: '', mouldsPerBench: formHeader.shedType === 'Single' ? 4 : 8, sleeperType: '' }]
    //     }]);
    // };

    // const removeChamber = (index) => {
    //     const newChambers = [...chambers];
    //     if (newChambers.length <= 1) return;
    //     newChambers.splice(index, 1);
    //     setChambers(newChambers);
    // };

    // const updateChamberNo = (index, value) => {
    //     const val = parseInt(value);
    //     if (!isNaN(val) && val < 0) return;
    //     const newChambers = [...chambers];
    //     newChambers[index].chamberNo = value;
    //     setChambers(newChambers);
    // };

    // const addBenchGroup = (cIdx) => {
    //     const newChambers = [...chambers];
    //     newChambers[cIdx].benchGroups.push({
    //         id: Date.now(),
    //         entryMode: 'range',
    //         benches: [''],
    //         fromNo: '',
    //         toNo: '',
    //         singleNo: '',
    //         mouldsPerBench: formHeader.shedType === 'Single' ? 4 : 8,
    //         sleeperType: ''
    //     });
    //     setChambers(newChambers);
    // };

    // const removeBenchGroup = (cIdx, gIdx) => {
    //     const newChambers = [...chambers];
    //     if (newChambers[cIdx].benchGroups.length <= 1) return;
    //     newChambers[cIdx].benchGroups.splice(gIdx, 1);
    //     setChambers(newChambers);
    // };

    // const handleGroupEntryModeChange = (cIdx, gIdx, mode) => {
    //     const newChambers = [...chambers];
    //     newChambers[cIdx].benchGroups[gIdx].entryMode = mode;
    //     setChambers(newChambers);
    // };

    // const handleGroupValueChange = (cIdx, gIdx, field, value) => {
    //     const newChambers = [...chambers];
    //     newChambers[cIdx].benchGroups[gIdx][field] = value;
    //     setChambers(newChambers);
    // };

    // const handleBenchValueChange = (cIdx, gIdx, bIdx, value) => {
    //     const newChambers = [...chambers];
    //     newChambers[cIdx].benchGroups[gIdx].benches[bIdx] = value;
    //     setChambers(newChambers);
    // };

    // const resolveBenchMasterData = (cIdx, gIdx, bIdx, value) => {
    //     if (!value) {
    //         const newChambers = [...chambers];
    //         const group = newChambers[cIdx].benchGroups[gIdx];
    //         if (!group.benches.some(b => b.trim())) {
    //             group.sleeperType = group.pinnedSleeperType || '';
    //         }
    //         setChambers(newChambers);
    //         return;
    //     }

    //     const newChambers = [...chambers];
    //     const chamber = newChambers[cIdx];
    //     const group = chamber.benchGroups[gIdx];

    //     // Resolve master details for the entered bench value
    //     const details = getBenchMasterDetails(value);
    //     const newTypes = details.allTypes && details.allTypes.length > 0 ? details.allTypes : (details.sleeperType ? [details.sleeperType] : []);

    //     const currentGroupType = group.pinnedSleeperType || null;

    //     if (newTypes.length > 1 && !currentGroupType) {
    //         // Multiple types — split into separate groups
    //         const firstType = newTypes[0];
    //         const firstDetails = getBenchMasterDetailsForType(value, firstType);
    //         group.sleeperType = firstType;
    //         group.pinnedSleeperType = firstType;
    //         group.mouldsPerBench = firstDetails.moulds || details.moulds || group.mouldsPerBench;
    //         group.error = null;

    //         const extraGroups = newTypes.slice(1).map((type, i) => {
    //             const typeDetails = getBenchMasterDetailsForType(value, type);
    //             return {
    //                 id: Date.now() + i + 1,
    //                 entryMode: 'single',
    //                 benches: [value],
    //                 fromNo: '',
    //                 toNo: '',
    //                 singleNo: value,
    //                 mouldsPerBench: typeDetails.moulds || details.moulds || group.mouldsPerBench,
    //                 sleeperType: type,
    //                 pinnedSleeperType: type,
    //                 error: null,
    //                 _autoCreated: true
    //             };
    //         });

    //         chamber.benchGroups.splice(gIdx + 1, 0, ...extraGroups);
    //     } else {
    //         // Single type or already pinned group
    //         const resolvedType = currentGroupType || newTypes[0];
    //         if (resolvedType) {
    //             const typeDetails = getBenchMasterDetailsForType(value, resolvedType);
    //             group.sleeperType = resolvedType;
    //             group.mouldsPerBench = typeDetails.moulds || details.moulds || group.mouldsPerBench;
    //             group.error = null;
    //         } else if (value) {
    //             // Not found in master
    //             group.sleeperType = 'Unknown...';
    //         }
    //     }

    //     setChambers(newChambers);
    // };

    // const removeBenchFromGroup = (cIdx, gIdx, bIdx) => {
    //     const newChambers = [...chambers];
    //     const group = newChambers[cIdx].benchGroups[gIdx];
    //     group.benches.splice(bIdx, 1);

    //     // Recalculate group type after removal — respect pinnedSleeperType
    //     if (group.pinnedSleeperType) {
    //         // Keep the pinned type; just verify remaining benches still match
    //         const validBenches = group.benches.filter(b => b.trim());
    //         group.error = null;
    //         group.sleeperType = validBenches.length > 0 ? group.pinnedSleeperType : '';
    //     } else {
    //         const types = group.benches.map(b => getBenchMasterDetails(b).sleeperType).filter(t => t);
    //         const uniqueTypes = [...new Set(types)];
    //         if (uniqueTypes.length > 1) {
    //             group.error = 'Mixed sleeper types in same group';
    //             group.sleeperType = 'Error';
    //         } else {
    //             group.error = null;
    //             group.sleeperType = uniqueTypes[0] || '';
    //         }
    //     }

    //     setChambers(newChambers);
    // };

    // const addBenchToGroup = (cIdx, gIdx) => {
    //     const newChambers = [...chambers];
    //     newChambers[cIdx].benchGroups[gIdx].benches.push('');
    //     setChambers(newChambers);
    // };

    // const updateMouldsInGroup = (cIdx, gIdx, value) => {
    //     const newChambers = [...chambers];
    //     const val = parseInt(value) || 0;
    //     newChambers[cIdx].benchGroups[gIdx].mouldsPerBench = Math.max(0, val);
    //     setChambers(newChambers);
    // };

    const calculateTotalCast = () => {
        if (plantType === 'Stress Bench') {
            return stressBenchEntries.reduce((acc, entry) => {
                let count = 0;
                if (entry.entryMode === 'range') {
                    const from = parseInt(entry.fromNo) || 0;
                    const to = parseInt(entry.toNo) || 0;
                    count = from > 0 && to >= from ? (to - from + 1) : 0;
                } else if (entry.entryMode === 'single') {
                    count = entry.singleNo ? 1 : 0;
                }
                return acc + (count * (parseInt(entry.mouldsPerBench) || 0));
            }, 0);
        } else {
            return longLineEntries.reduce((acc, e) => {
                const count = e.entryMode === 'range' ? (parseInt(e.toNo) - parseInt(e.fromNo) + 1) : 1;
                return acc + (count * (parseInt(e.mouldsPerGang) || 0));
            }, 0);
        }
    };

    const calculateTotalBenchesGangs = () => {
        if (plantType === 'Stress Bench') {
            return stressBenchEntries.reduce((acc, entry) => {
                let count = 0;
                if (entry.entryMode === 'range') {
                    const from = parseInt(entry.fromNo) || 0;
                    const to = parseInt(entry.toNo) || 0;
                    count = from > 0 && to >= from ? (to - from + 1) : 0;
                } else if (entry.entryMode === 'single') {
                    count = entry.singleNo ? 1 : 0;
                }
                return acc + count;
            }, 0);
        } else {
            return longLineEntries.reduce((acc, e) => {
                const count = e.entryMode === 'range' ? ((parseInt(e.toNo) || 0) - (parseInt(e.fromNo) || 0) + 1) : 1;
                return acc + Math.max(0, count);
            }, 0);
        }
    };

    const calculateTotalRFT = () => {
        if (plantType === 'Stress Bench') {
            return stressBenchEntries.reduce((acc, entry) => {
                let benchesToSum = [];
                if (entry.entryMode === 'range') {
                    const from = parseInt(entry.fromNo) || 0;
                    const to = parseInt(entry.toNo) || 0;
                    if (from > 0 && to >= from) {
                        for (let i = from; i <= to; i++) benchesToSum.push(i.toString());
                    }
                } else if (entry.entryMode === 'single') {
                    if (entry.singleNo) benchesToSum.push(entry.singleNo);
                }
                // For stress bench, RFT is per bench, not per mould.
                // Assuming RFT is determined by sleeper type of the bench.
                return acc + benchesToSum.reduce((bAcc, b) => bAcc + getBenchMasterDetailsForType(b, entry.sleeperType).rft, 0);
            }, 0);
        }
        return 0;
    };

    const getProductionBreakdown = () => {
        const counts = {};
        if (plantType === 'Stress Bench') {
            stressBenchEntries.forEach(entry => {
                if (entry.sleeperType) {
                    let count = 0;
                    if (entry.entryMode === 'range') {
                        const from = parseInt(entry.fromNo) || 0;
                        const to = parseInt(entry.toNo) || 0;
                        count = from > 0 && to >= from ? (to - from + 1) : 0;
                    } else if (entry.entryMode === 'single') {
                        count = entry.singleNo ? 1 : 0;
                    }
                    counts[entry.sleeperType] = (counts[entry.sleeperType] || 0) + (count * (parseInt(entry.mouldsPerBench) || 0));
                }
            });
        } else {
            longLineEntries.forEach(e => {
                const count = e.entryMode === 'range' ? (parseInt(e.toNo) - parseInt(e.fromNo) + 1) : 1;
                counts[e.sleeperType] = (counts[e.sleeperType] || 0) + (count * (parseInt(e.mouldsPerGang) || 0));
            });
        }
        return counts;
    };

    const handleAddStressBench = () => {
        if (!stressBenchForm.chamberNo) return alert('Chamber No is required');
        
        let currentBenchesToAdd = [];
        if (stressBenchForm.entryMode === 'range') {
            if (!stressBenchForm.fromNo || !stressBenchForm.toNo) return alert('Bench From and To are required');
            const from = parseInt(stressBenchForm.fromNo);
            const to = parseInt(stressBenchForm.toNo);
            if (from > to) return alert('Bench From cannot be greater than To');
            for (let i = from; i <= to; i++) currentBenchesToAdd.push(i);
        } else {
            if (!stressBenchForm.singleNo) return alert('Bench No is required');
            const benches = stressBenchForm.singleNo.toString().split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            if (benches.length === 0) return alert('Valid Bench No is required');
            currentBenchesToAdd.push(...benches);
        }

        if (stressBenchForm.sleeperType !== 'RT-8746' && stressBenchForm.sleeperType !== 'RT-2496') {
            return alert('Sleeper Type RT-8746 or RT-2496 is mandatory');
        }

        // Check for duplicates in current session
        let duplicates = [];
        stressBenchEntries.forEach(entry => {
            if (editingEntryId === entry.id) return;
            let entryBenches = [];
            if (entry.entryMode === 'range') {
                const f = parseInt(entry.fromNo);
                const t = parseInt(entry.toNo);
                for (let i = f; i <= t; i++) entryBenches.push(i);
            } else {
                entryBenches.push(parseInt(entry.singleNo));
            }
            currentBenchesToAdd.forEach(b => {
                if (entryBenches.includes(b)) duplicates.push(b);
            });
        });

        // Check for duplicates in other declarations of the plant
        if (currentDeclarations) {
            currentDeclarations.forEach(pd => {
                if (initialData && pd.id === initialData.id) return;
                if (pd.chambers) {
                    pd.chambers.forEach(c => {
                        if (c.benchGroups) {
                            c.benchGroups.forEach(bg => {
                                const f = parseInt(bg.benchFrom || bg.benchNo);
                                const t = parseInt(bg.benchTo || bg.benchNo);
                                if (!isNaN(f) && !isNaN(t)) {
                                    for (let i = f; i <= t; i++) {
                                        if (currentBenchesToAdd.includes(i)) duplicates.push(i);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }

        const uniqueDuplicates = [...new Set(duplicates)];
        
        const proceedWithAddition = () => {
            if (stressBenchForm.entryMode === 'single') {
                const benches = stressBenchForm.singleNo.toString().split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                const newEntries = benches.map((bench, idx) => ({
                    ...stressBenchForm,
                    singleNo: bench.toString(),
                    id: editingEntryId && idx === 0 ? editingEntryId : Date.now() + idx
                }));
                
                if (editingEntryId) {
                    let updatedEntries = stressBenchEntries.map(e => e.id === editingEntryId ? newEntries[0] : e);
                    if (newEntries.length > 1) {
                        updatedEntries = [...updatedEntries, ...newEntries.slice(1)];
                    }
                    setStressBenchEntries(updatedEntries);
                    setEditingEntryId(null);
                } else {
                    setStressBenchEntries([...stressBenchEntries, ...newEntries]);
                }
            } else {
                if (editingEntryId) {
                    setStressBenchEntries(stressBenchEntries.map(e => e.id === editingEntryId ? { ...stressBenchForm, id: editingEntryId } : e));
                    setEditingEntryId(null);
                } else {
                    const newEntry = { ...stressBenchForm, id: Date.now() };
                    setStressBenchEntries([...stressBenchEntries, newEntry]);
                }
            }
            setStressBenchForm({ ...stressBenchForm, fromNo: '', toNo: '', singleNo: '' });
            setConfirmModal({ show: false, message: '', onConfirm: null });
        };

        if (uniqueDuplicates.length > 0) {
            setConfirmModal({
                show: true,
                message: `The bench no ${uniqueDuplicates.join(', ')} already exist. Do you want to proceed with same bench no?`,
                onConfirm: proceedWithAddition
            });
            return;
        }

        proceedWithAddition();
    };

    const handleAddLongLine = () => {
        if (longLineForm.entryMode === 'range') {
            if (!longLineForm.fromNo || !longLineForm.toNo) return alert('Gang From and To are required');
        } else {
            if (!longLineForm.singleNo) return alert('Gang No is required');
        }
        if (longLineForm.sleeperType !== 'RT-8746' && longLineForm.sleeperType !== 'RT-2496') {
            return alert('Sleeper Type RT-8746 or RT-2496 is mandatory');
        }

        let currentGangsToAdd = [];
        if (longLineForm.entryMode === 'range') {
            const from = parseInt(longLineForm.fromNo);
            const to = parseInt(longLineForm.toNo);
            for (let i = from; i <= to; i++) currentGangsToAdd.push(i);
        } else {
            const gangs = longLineForm.singleNo.toString().split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            if (gangs.length === 0) return alert('Valid Gang No is required');
            currentGangsToAdd.push(...gangs);
        }

        let duplicates = [];
        longLineEntries.forEach(entry => {
            if (editingEntryId === entry.id) return;
            let entryGangs = [];
            if (entry.entryMode === 'range') {
                const f = parseInt(entry.fromNo);
                const t = parseInt(entry.toNo);
                for (let i = f; i <= t; i++) entryGangs.push(i);
            } else {
                entryGangs.push(parseInt(entry.singleNo));
            }
            currentGangsToAdd.forEach(g => {
                if (entryGangs.includes(g)) duplicates.push(g);
            });
        });

        if (currentDeclarations) {
            currentDeclarations.forEach(pd => {
                if (initialData && pd.id === initialData.id) return;
                if (pd.gangs) {
                    pd.gangs.forEach(g => {
                        const f = parseInt(g.gangFrom || g.gangNo);
                        const t = parseInt(g.gangTo || g.gangNo);
                        if (!isNaN(f) && !isNaN(t)) {
                            for (let i = f; i <= t; i++) {
                                if (currentGangsToAdd.includes(i)) duplicates.push(i);
                            }
                        }
                    });
                }
            });
        }

        const uniqueDuplicates = [...new Set(duplicates)];
        
        const proceedWithAddition = () => {
            if (longLineForm.entryMode === 'single') {
                const gangs = longLineForm.singleNo.toString().split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                const newEntries = gangs.map((gang, idx) => ({
                    ...longLineForm,
                    singleNo: gang.toString(),
                    id: editingEntryId && idx === 0 ? editingEntryId : Date.now() + idx
                }));
                
                if (editingEntryId) {
                    let updatedEntries = longLineEntries.map(e => e.id === editingEntryId ? newEntries[0] : e);
                    if (newEntries.length > 1) {
                        updatedEntries = [...updatedEntries, ...newEntries.slice(1)];
                    }
                    setLongLineEntries(updatedEntries);
                    setEditingEntryId(null);
                } else {
                    setLongLineEntries([...longLineEntries, ...newEntries]);
                }
            } else {
                if (editingEntryId) {
                    setLongLineEntries(longLineEntries.map(e => e.id === editingEntryId ? { ...longLineForm, id: editingEntryId } : e));
                    setEditingEntryId(null);
                } else {
                    const newEntry = { ...longLineForm, id: Date.now() };
                    setLongLineEntries([...longLineEntries, newEntry]);
                }
            }
            setLongLineForm({ ...longLineForm, fromNo: '', toNo: '', singleNo: '' });
            setConfirmModal({ show: false, message: '', onConfirm: null });
        };

        if (uniqueDuplicates.length > 0) {
            setConfirmModal({
                show: true,
                message: `The gang no ${uniqueDuplicates.join(', ')} already exist. Do you want to proceed with same gang no?`,
                onConfirm: proceedWithAddition
            });
            return;
        }

        proceedWithAddition();
    };

    const handleKeyDownStress = (e) => {
        if (e.key === 'Enter') handleAddStressBench();
    };

    const handleKeyDownLongLine = (e) => {
        if (e.key === 'Enter') handleAddLongLine();
    };

    const DuplicateBenchConfirmModal = ({ isOpen, message, onYes, onNo }) => {
        if (!isOpen) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(8px)',
                padding: '20px'
            }}>
                <div style={{
                    background: 'white',
                    padding: '32px',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '450px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    textAlign: 'center',
                    animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <style>{`
                        @keyframes modalSlideIn {
                            from { transform: translateY(20px); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                    `}</style>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '20px', fontWeight: '800' }}>Duplicate Bench Detected</h3>
                    <p style={{ margin: '0 0 32px 0', color: '#64748b', fontSize: '16px', lineHeight: '1.6', fontWeight: '500' }}>{message}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <button 
                            onClick={onNo}
                            style={{ 
                                padding: '14px', 
                                borderRadius: '14px', 
                                border: '1.5px solid #e2e8f0', 
                                background: 'white', 
                                color: '#64748b', 
                                fontWeight: '700', 
                                fontSize: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1'; }}
                            onMouseOut={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#e2e8f0'; }}
                        >
                            No, Take Back
                        </button>
                        <button 
                            onClick={onYes}
                            style={{ 
                                padding: '14px', 
                                borderRadius: '14px', 
                                border: 'none', 
                                background: 'linear-gradient(135deg, #42818c 0%, #356972 100%)', 
                                color: 'white', 
                                fontWeight: '700', 
                                fontSize: '15px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(66, 129, 140, 0.3)',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(66, 129, 140, 0.4)'; }}
                            onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(66, 129, 140, 0.3)'; }}
                        >
                            Yes, Proceed
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const sectionHeaderStyle = {
        background: '#f8fafc',
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none'
    };

    const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' };
    const inputStyle = {
        width: '100%',
        padding: '0 16px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        fontSize: '14px',
        backgroundColor: '#ffffff',
        height: '45px',
        color: '#1e293b',
        transition: 'border-color 0.2s',
        outline: 'none'
    };
    const radioStyle = { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#42818c' };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={onBack}
                    style={{ background: 'none', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}
                >
                    ← Back
                </button>
                <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>New Shift Production Declaration</h2>
            </div>
            <style>
                {`
                    /* Custom Date Picker Indicator Styling (Optional) */
                    input[type="date"]::-webkit-calendar-picker-indicator {
                        cursor: pointer;
                        opacity: 0.6;
                        transition: opacity 0.2s;
                    }
                    input[type="date"]::-webkit-calendar-picker-indicator:hover {
                        opacity: 1;
                    }
                `}
            </style>

            {/* Section 1: Batch Header */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={sectionHeaderStyle} onClick={() => toggleSection(1)}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Section 1: Batch Header (Initial Declaration)</h3>
                    <span>{activeSections[1] ? '▼' : '▶'}</span>
                </div>
                {activeSections[1] && (
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Plant Type</label>
                                <div style={{ display: 'flex', gap: '30px', marginTop: '10px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
                                        <input
                                            type="radio"
                                            name="plantType"
                                            checked={plantType === 'Stress Bench'}
                                            onChange={() => {
                                                setPlantType('Stress Bench');
                                                // Calculate prefix for Sheds
                                                const benchProfile = plantProfiles.find(p => p.type === 'Stress Bench');
                                                const totalSheds = parseInt(benchProfile?.numberOfSheds || benchProfile?.shedLines || 0);
                                                const firstUnit = totalSheds > 0 ? 'Shed 1' : '';
                                                setFormHeader({ ...formHeader, unit: firstUnit, shedType: 'Twin' });
                                                setEditingEntryId(null);
                                            }}
                                            disabled={isReadOnly}
                                            style={radioStyle}
                                        />
                                        Stress Bench
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
                                        <input
                                            type="radio"
                                            name="plantType"
                                            checked={plantType === 'Long Line'}
                                            onChange={() => {
                                                setPlantType('Long Line');
                                                // Calculate prefix for Gangs
                                                const longLineProfile = plantProfiles.find(p => p.type === 'Longline' || p.type === 'Long Line');
                                                const totalLines = parseInt(longLineProfile?.numberOfSheds || longLineProfile?.shedLines || 0);
                                                const firstUnit = totalLines > 0 ? 'Line 1' : '';
                                                setFormHeader({ ...formHeader, unit: firstUnit, shedType: 'Long Line' });
                                                setEditingEntryId(null);
                                            }}
                                            style={radioStyle}
                                        />
                                        Long Line
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>{plantType === 'Stress Bench' ? 'Production Unit (Shed No.)' : 'Production Unit (Line No.)'}</label>
                                <select
                                            disabled={isReadOnly}
                                            style={{ ...inputStyle, background: 'white', cursor: isReadOnly ? 'default' : 'pointer' }}
                                    value={formHeader.unit}
                                  onChange={(e) => {
    setFormHeader({
        ...formHeader,
        unit: e.target.value,
        shedType: plantType   
    });
}}
                                >
                                    <option value="">Select Unit</option>
                                   {unitOptions.map(unit => (
    <option key={unit} value={unit}>{unit}</option>
))}
                                </select>
                            </div>


                            <div>
                                <label style={labelStyle}>Date of Casting</label>
                                <input
                                    type="date"
                                    max={new Date().toISOString().split('T')[0]}
                                    value={formHeader.date}
                                    onChange={(e) => setFormHeader({ ...formHeader, date: e.target.value })}
                                    disabled={isReadOnly}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Shift</label>
                                <select
                                    disabled={isReadOnly}
                                    style={{ ...inputStyle, background: 'white', cursor: isReadOnly ? 'default' : 'pointer' }}
                                    value={formHeader.shift}
                                    onChange={(e) => setFormHeader({ ...formHeader, shift: e.target.value })}
                                >
                                    <option value="Day">Day</option>
                                    <option value="Night">Night</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Batch Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 103A"
                                    value={formHeader.batchNo}
                                    onChange={(e) => setFormHeader({ ...formHeader, batchNo: e.target.value })}
                                    disabled={isReadOnly}
                                    style={inputStyle}
                                />

                            </div>
                            <div>
                                <label style={labelStyle}>Concrete Grade</label>
                                <select
                                    disabled={isReadOnly}
                                    style={{ ...inputStyle, background: 'white', cursor: isReadOnly ? 'default' : 'pointer' }}
                                    value={formHeader.mixDesign}
                                    onChange={(e) => setFormHeader({ ...formHeader, mixDesign: e.target.value })}
                                >
                                    <option value="M60">M60</option>
                                    <option value="M55">M55</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Time of LBC</label>
                                <input
                                    type="time"
                                    style={inputStyle}
                                    value={formHeader.timeLbc}
                                    onChange={(e) => setFormHeader({ ...formHeader, timeLbc: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Section 2: Casting & Bench Mapping */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={sectionHeaderStyle} onClick={() => toggleSection(2)}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Section 2: Casting & Bench Mapping</h3>
                    <span>{activeSections[2] ? '▼' : '▶'}</span>
                </div>
                {activeSections[2] && (
                    <div style={{ padding: '24px' }}>
                        {plantType === 'Stress Bench' ? (
                            <div>
                                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h4 style={{ margin: 0, color: '#1e293b' }}>Stress Bench Entry</h4>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isReadOnly ? 'default' : 'pointer', fontWeight: '600' }}>
                                                <input type="radio" disabled={isReadOnly} checked={stressBenchForm.entryMode === 'range'} onChange={() => setStressBenchForm({ ...stressBenchForm, entryMode: 'range' })} style={radioStyle} />
                                                Range
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isReadOnly ? 'default' : 'pointer', fontWeight: '600' }}>
                                                <input type="radio" disabled={isReadOnly} checked={stressBenchForm.entryMode === 'single'} onChange={() => setStressBenchForm({ ...stressBenchForm, entryMode: 'single' })} style={radioStyle} />
                                                Single
                                            </label>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2.5fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
                                        <div>
                                            <label style={labelStyle}>Chamber No.</label>
                                            <input type="number" disabled={isReadOnly} value={stressBenchForm.chamberNo} onChange={(e) => setStressBenchForm({ ...stressBenchForm, chamberNo: e.target.value })} onKeyDown={handleKeyDownStress} style={{ ...inputStyle, background: 'white' }} placeholder="No." />
                                        </div>
                                        {stressBenchForm.entryMode === 'range' ? (
                                            <>
                                                <div>
                                                    <label style={labelStyle}>Bench From</label>
                                                    <input type="number" disabled={isReadOnly} value={stressBenchForm.fromNo} onChange={(e) => setStressBenchForm({ ...stressBenchForm, fromNo: e.target.value })} onKeyDown={handleKeyDownStress} style={{ ...inputStyle, background: 'white' }} placeholder="Start" />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Bench To</label>
                                                    <input type="number" disabled={isReadOnly} value={stressBenchForm.toNo} onChange={(e) => setStressBenchForm({ ...stressBenchForm, toNo: e.target.value })} onKeyDown={handleKeyDownStress} style={{ ...inputStyle, background: 'white' }} placeholder="End" />
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>Bench No.</label>
                                                <input type="text" disabled={isReadOnly} value={stressBenchForm.singleNo} onChange={(e) => setStressBenchForm({ ...stressBenchForm, singleNo: e.target.value })} onKeyDown={handleKeyDownStress} style={{ ...inputStyle, background: 'white' }} placeholder="Enter No. (e.g. 12, 13)" />
                                            </div>
                                        )}
                                        <div style={{ position: 'relative' }}>
                                            <label style={labelStyle}>Sleeper Type</label>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <select
                                                    disabled={isReadOnly}
                                                    value={stressBenchForm.sleeperType}
                                                    onChange={(e) => setStressBenchForm({ ...stressBenchForm, sleeperType: e.target.value })}
                                                    style={{ 
                                                        ...inputStyle, 
                                                        background: '#ffffff', 
                                                        textAlign: 'center', 
                                                        fontWeight: '700', 
                                                        paddingRight: '40px',
                                                        cursor: 'pointer',
                                                        border: '2px solid #e2e8f0',
                                                        boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
                                                        appearance: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {allSleeperTypes.map(type => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                                <span style={{ 
                                                    position: 'absolute', 
                                                    right: '15px', 
                                                    fontSize: '10px',
                                                    color: '#42818c',
                                                    pointerEvents: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    background: '#f1f5f9',
                                                    padding: '4px 6px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e2e8f0'
                                                }}>▼</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Moulds/Bench</label>
                                            <input type="number" disabled={isReadOnly} value={stressBenchForm.mouldsPerBench} onChange={(e) => setStressBenchForm({ ...stressBenchForm, mouldsPerBench: e.target.value })} style={{ ...inputStyle, background: 'white' }} />
                                        </div>
                                        {!isReadOnly && (
                                            <button
                                                onClick={handleAddStressBench}
                                                style={{ background: editingEntryId ? '#0261c7ff' : '#42818c', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                {editingEntryId ? 'Update Entry' : 'Add Entry'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {stressBenchEntries.length > 0 && (
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '50px' }}>S.No.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '100px' }}>Chamber</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px' }}>Mode</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px' }}>Benches</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '80px' }}>Count</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '150px' }}>Sleeper Type</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '100px' }}>Moulds/B.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '80px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stressBenchEntries.map((entry, index) => {
                                                    const count = entry.entryMode === 'range' ? (parseInt(entry.toNo) - parseInt(entry.fromNo) + 1) : 1;
                                                    return (
                                                        <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '12px 8px', color: '#64748b', fontSize: '14px' }}>{index + 1}</td>
                                                            <td style={{ padding: '12px 8px', fontWeight: '700', color: '#115e59' }}>#{entry.chamberNo}</td>
                                                            <td style={{ padding: '12px 8px', textTransform: 'capitalize', color: '#1e293b' }}>{entry.entryMode}</td>
                                                            <td style={{ padding: '12px 8px', fontWeight: '600', color: '#1e293b' }}>{entry.entryMode === 'range' ? `${entry.fromNo} - ${entry.toNo}` : entry.singleNo}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{count}</td>
                                                            <td style={{ padding: '12px 8px', color: '#1e293b' }}>{entry.sleeperType}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{entry.mouldsPerBench}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                                {!isReadOnly && (
                                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                        <button 
                                                                            onClick={() => {
                                                                                setEditingEntryId(entry.id);
                                                                                setStressBenchForm({ ...entry });
                                                                            }}
                                                                            style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <span style={{ color: '#cbd5e1' }}>|</span>
                                                                        <button 
                                                                            onClick={() => {
                                                                                if (editingEntryId === entry.id) setEditingEntryId(null);
                                                                                setStressBenchEntries(stressBenchEntries.filter(e => e.id !== entry.id));
                                                                            }}
                                                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h4 style={{ margin: 0, color: '#1e293b' }}>Long Line Gang Entry</h4>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isReadOnly ? 'default' : 'pointer', fontWeight: '600' }}>
                                                <input type="radio" disabled={isReadOnly} checked={longLineForm.entryMode === 'range'} onChange={() => setLongLineForm({ ...longLineForm, entryMode: 'range' })} style={radioStyle} />
                                                Range
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isReadOnly ? 'default' : 'pointer', fontWeight: '600' }}>
                                                <input type="radio" disabled={isReadOnly} checked={longLineForm.entryMode === 'single'} onChange={() => setLongLineForm({ ...longLineForm, entryMode: 'single' })} style={radioStyle} />
                                                Single
                                            </label>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2.5fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
                                        {longLineForm.entryMode === 'range' ? (
                                            <>
                                                <div>
                                                    <label style={labelStyle}>Gang No. From</label>
                                                    <input type="number" disabled={isReadOnly} value={longLineForm.fromNo} onChange={(e) => setLongLineForm({ ...longLineForm, fromNo: e.target.value })} onKeyDown={handleKeyDownLongLine} style={{ ...inputStyle, background: 'white' }} placeholder="Start" />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Gang No. To</label>
                                                    <input type="number" disabled={isReadOnly} value={longLineForm.toNo} onChange={(e) => setLongLineForm({ ...longLineForm, toNo: e.target.value })} onKeyDown={handleKeyDownLongLine} style={{ ...inputStyle, background: 'white' }} placeholder="End" />
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>Gang No.</label>
                                                <input type="text" disabled={isReadOnly} value={longLineForm.singleNo} onChange={(e) => setLongLineForm({ ...longLineForm, singleNo: e.target.value })} onKeyDown={handleKeyDownLongLine} style={{ ...inputStyle, background: 'white' }} placeholder="Enter No. (e.g. 24, 25)" />
                                            </div>
                                        )}
                                        <div style={{ position: 'relative' }}>
                                            <label style={labelStyle}>Sleeper Type</label>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <select
                                                    disabled={isReadOnly}
                                                    value={longLineForm.sleeperType}
                                                    onChange={(e) => setLongLineForm({ ...longLineForm, sleeperType: e.target.value })}
                                                    style={{ 
                                                        ...inputStyle, 
                                                        background: '#ffffff', 
                                                        textAlign: 'center', 
                                                        fontWeight: '700', 
                                                        paddingRight: '40px',
                                                        cursor: 'pointer',
                                                        border: '2px solid #e2e8f0',
                                                        boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
                                                        appearance: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {allSleeperTypes.map(type => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                                <span style={{ 
                                                    position: 'absolute', 
                                                    right: '15px', 
                                                    fontSize: '10px',
                                                    color: '#42818c',
                                                    pointerEvents: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    background: '#f1f5f9',
                                                    padding: '4px 6px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e2e8f0'
                                                }}>▼</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Moulds/Gang</label>
                                            <input type="number" disabled={isReadOnly} value={longLineForm.mouldsPerGang} onChange={(e) => setLongLineForm({ ...longLineForm, mouldsPerGang: e.target.value })} style={{ ...inputStyle, background: 'white' }} />
                                        </div>
                                        {!isReadOnly && (
                                            <button
                                                onClick={handleAddLongLine}
                                                style={{ background: editingEntryId ? '#0284c7' : '#42818c', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                {editingEntryId ? 'Update Entry' : 'Add Entry'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {longLineEntries.length > 0 && (
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '50px' }}>S.No.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px' }}>Mode</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px' }}>Gangs</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '100px' }}>Count</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '180px' }}>Sleeper Type</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '130px' }}>Moulds/Gang</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '100px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {longLineEntries.map((entry, index) => {
                                                    const count = entry.entryMode === 'range' ? (parseInt(entry.toNo) - parseInt(entry.fromNo) + 1) : 1;
                                                    return (
                                                        <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '12px 8px', color: '#64748b', fontSize: '14px' }}>{index + 1}</td>
                                                            <td style={{ padding: '12px 8px', textTransform: 'capitalize', color: '#1e293b' }}>{entry.entryMode}</td>
                                                            <td style={{ padding: '12px 8px', fontWeight: '600', color: '#1e293b' }}>{entry.entryMode === 'range' ? `${entry.fromNo} - ${entry.toNo}` : entry.singleNo}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{count}</td>
                                                            <td style={{ padding: '12px 8px', color: '#1e293b' }}>{entry.sleeperType}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{entry.mouldsPerGang}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                                {!isReadOnly && (
                                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                        <button 
                                                                            onClick={() => {
                                                                                setEditingEntryId(entry.id);
                                                                                setLongLineForm({ ...entry });
                                                                            }}
                                                                            style={{ color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <span style={{ color: '#cbd5e1' }}>|</span>
                                                                        <button 
                                                                            onClick={() => {
                                                                                if (editingEntryId === entry.id) setEditingEntryId(null);
                                                                                setLongLineEntries(longLineEntries.filter(e => e.id !== entry.id));
                                                                            }}
                                                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Section 3: Summary & Observation */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={sectionHeaderStyle} onClick={() => toggleSection(3)}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Section 3: Summary & Observation</h3>
                    <span>{activeSections[3] ? '▼' : '▶'}</span>
                </div>
                {activeSections[3] && (
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                            <div style={{ background: '#f0f9fa', padding: '24px', borderRadius: '16px', border: '1px solid #ccfbf1' }}>
                                <h4 style={{ margin: '0 0 16px 0', color: '#115e59', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase' }}>Production Calculation</h4>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Total Casted Sleepers:</span>
                                        <span style={{ color: '#115e59', fontSize: '20px', fontWeight: '800' }}>{calculateTotalCast()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Total {plantType === 'Stress Bench' ? 'Benches' : 'Gangs'} Added:</span>
                                        <span style={{ color: '#115e59', fontSize: '20px', fontWeight: '800' }}>{calculateTotalBenchesGangs()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Total Types of Sleepers:</span>
                                        <span style={{ color: '#115e59', fontSize: '20px', fontWeight: '800' }}>{Object.keys(getProductionBreakdown()).length}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Total RFT Casted:</span>
                                        <span style={{ color: '#115e59', fontSize: '20px', fontWeight: '800' }}>{calculateTotalRFT().toFixed(2)} m</span>
                                    </div>
                                    <div style={{ borderTop: '1px dashed #ccfbf1', paddingTop: '10px', marginTop: '5px' }}>
                                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Breakdown by Type:</span>
                                        {Object.entries(getProductionBreakdown()).map(([type, count]) => (
                                            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ color: '#64748b', fontSize: '13px' }}>{type}:</span>
                                                <span style={{ color: '#115e59', fontSize: '14px', fontWeight: '700' }}>{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', padding: '12px', background: 'white', borderRadius: '8px', fontSize: '11px', color: '#0d9488' }}>
                                    <strong>Triggers:</strong> Visual Inspection, Steam Cube Testing, Water Cube Testing tasks will be auto-generated for the IE.
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Remarks / Observations</label>
                                <textarea
                                    rows="6"
                                    disabled={isReadOnly}
                                    style={{ ...inputStyle, resize: 'none', height: 'auto', padding: '12px 16px' }}
                                    placeholder="Enter any specific observations about this shift production..."
                                    value={formHeader.remarks}
                                    onChange={(e) => setFormHeader({ ...formHeader, remarks: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Actions */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button
                    onClick={onBack}
                    style={{ background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                >
                    Cancel
                </button>
                {!isReadOnly && (
                    <>
                        <button
                            onClick={() => {
                                try {
                                    if (!formHeader.unit) {
                                        return alert('Production Unit is mandatory. Please select a unit in Section 1.');
                                    }

                                    const breakdown = getProductionBreakdown();
                                    const invalidTypes = Object.keys(breakdown).filter(type => type !== 'RT-8746' && type !== 'RT-2496');

                                    if (invalidTypes.length > 0) {
                                        return alert('Form Submission Failed: Only RT-8746 and RT-2496 sleeper types are allowed for production declaration.');
                                    }

                                    if (calculateTotalCast() === 0) {
                                        return alert('Please add at least one valid entry.');
                                    }

                                    // Formatting the DTO for the backend
                                    const isUpdate = !!(initialData?.id && !isNaN(initialData.id));
                                    const pdDto = {
                                        ...(isUpdate ? initialData : {}),
                                        ...(isUpdate ? { id: initialData.id } : {}),
                                        plantType: plantType === 'Stress Bench' ? 'STRESS' : 'LONG_LINE',
                                        productionUnit: formHeader.unit,
                                        castingDate: formHeader.date.split('-').reverse().join('/'), // Convert YYYY-MM-DD to DD/MM/YYYY
                                        shift: formHeader.shift,
                                        batchNumber: formHeader.batchNo.toString(),
                                        mixDesignReference: formHeader.mixDesign,
                                        lbcTime: formHeader.timeLbc?.substring(0, 5),
                                        totalCastedSleepers: calculateTotalCast(),
                                        totalSleeperTypes: Object.keys(getProductionBreakdown()).length,
                                        totalRft: calculateTotalRFT(),
                                        remarks: formHeader.remarks || '',
                                        vendorId: userId,
                                        vendorCode: vendorCode,
                                        plantId: plantId,
                                        createdBy: userId,
                                        updatedBy: userId,

                                        chambers: plantType === 'Stress Bench' ? chambers
                                            .map(chamber => ({
                                                id: chamber.id || 0,
                                                chamberNo: parseInt(chamber.chamberNo) || 0,
                                                benchGroups: chamber.benchGroups
                                                    .flatMap(group => {
                                                        let benchList = [];
                                                        if (group.entryMode === 'range') {
                                                            const from = parseInt(group.fromNo) || 0;
                                                            const to = parseInt(group.toNo) || 0;
                                                            if (from > 0 && to >= from) {
                                                                for (let i = from; i <= to; i++) benchList.push(i.toString());
                                                            }
                                                        } else if (group.entryMode === 'single') {
                                                            if (group.singleNo) benchList.push(group.singleNo);
                                                        } else {
                                                            benchList = group.benches.filter(b => b.trim());
                                                        }

                                                        return benchList.map(bench => {
                                                            const isOriginalBench = group._isOld && bench === group.singleNo;
                                                            const originalRft = isOriginalBench ? group._originalRft : getBenchMasterDetails(bench).rft;
                                                            const originalSleepers = isOriginalBench ? group._originalSleepers : generateSleeperIds(bench, group.mouldsPerBench);
                                                            const originalSleeperList = isOriginalBench ? group._originalSleeperList : null;
                                                            
                                                            return {
                                                                id: group.id || 0,
                                                                benchNo: parseInt(bench) || 0,
                                                                sleeperType: group.sleeperType,
                                                                mouldPerBench: parseInt(group.mouldsPerBench) || 0,
                                                                rft: originalRft,
                                                                sleepers: originalSleepers,
                                                                sleeperList: originalSleeperList || originalSleepers.map(s => ({ id: 0, sleeperNo: s }))
                                                            };
                                                        });
                                                    })
                                            })) : [],
                                        gangs: plantType === 'Long Line' ? longLineEntries
                                            .map(entry => {
                                                const mode = entry.entryMode.toUpperCase();
                                                const gangFrom = entry.entryMode === 'range' ? parseInt(entry.fromNo) : null;
                                                const gangTo = entry.entryMode === 'range' ? parseInt(entry.toNo) : null;
                                                const gangNo = entry.entryMode === 'single' ? parseInt(entry.singleNo) : null;
                                                const mouldsPerGang = parseInt(entry.mouldsPerGang) || 0;

                                                let sleepers = entry._originalSleepers || [];
                                                if (sleepers.length === 0) {
                                                    if (mode === 'RANGE' && gangFrom && gangTo) {
                                                        for (let i = gangFrom; i <= gangTo; i++) {
                                                            sleepers.push(...generateSleeperIds(i.toString(), mouldsPerGang));
                                                        }
                                                    } else if (mode === 'SINGLE' && gangNo) {
                                                        sleepers = generateSleeperIds(gangNo.toString(), mouldsPerGang);
                                                    }
                                                }

                                                return {
                                                    id: entry.originalId || 0,
                                                    mode,
                                                    gangFrom,
                                                    gangTo,
                                                    gangNo,
                                                    sleeperType: entry.sleeperType,
                                                    mouldsPerGang,
                                                    sleepers,
                                                    sleeperList: entry._originalSleeperList || sleepers.map(s => ({ id: 0, sleeperNo: s }))
                                                };
                                            }) : []
                                    };

                                    setIsSubmitting(true);
                                    onSave(pdDto).finally(() => setIsSubmitting(false));
                                } catch (error) {
                                    console.error("Validation error:", error);
                                    setIsSubmitting(false);
                                    alert("Failed to submit. Please check your data and try again.");
                                }
                            }}
                            disabled={isSubmitting}
                            style={{ 
                                background: isSubmitting ? '#94a3b8' : '#0284c7', 
                                color: 'white', 
                                border: 'none', 
                                padding: '12px 24px', 
                                borderRadius: '10px', 
                                fontWeight: '700', 
                                cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                                boxShadow: isSubmitting ? 'none' : '0 4px 6px -1px rgba(2, 132, 199, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span style={{ 
                                        display: 'inline-block', 
                                        width: '12px', 
                                        height: '12px', 
                                        border: '2px solid rgba(255,255,255,0.3)', 
                                        borderTopColor: 'white', 
                                        borderRadius: '50%', 
                                        animation: 'spin 0.8s linear infinite' 
                                    }} />
                                    Processing...
                                </>
                            ) : (
                                (initialData?.id && !isNaN(initialData.id)) ? 'Update Declaration' : 'Submit Declaration'
                            )}
                        </button>
                        <style>{`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </>
                )}
            </div>

            <DuplicateBenchConfirmModal 
                isOpen={confirmModal.show}
                message={confirmModal.message}
                onYes={confirmModal.onConfirm}
                onNo={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
            />
        </div>
    );
};

export default ShiftProductionForm;
