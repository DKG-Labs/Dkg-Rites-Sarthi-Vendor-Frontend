import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

const ShiftProductionForm = ({ onBack, onSave, lastBatchNumber, initialData }) => {
    const [masterBenches, setMasterBenches] = useState([]);
    const [masterLongLines, setMasterLongLines] = useState([]);
    const [plantProfiles, setPlantProfiles] = useState([]);

    const [activeSections, setActiveSections] = useState({ 1: true, 2: false, 3: false });
    const [plantType, setPlantType] = useState('Stress Bench'); // Stress Bench or Long Line

    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().split(' ')[0].substring(0, 5);
    };

    const [formHeader, setFormHeader] = useState({
        unit: 'Stress Bench A',
        shedType: 'Twin',
        date: new Date().toISOString().split('T')[0],
        shift: 'Day Shift',
        batchNo: '',
        mixDesign: 'M60 - Design A (Active)',
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
        sleeperType: 'RT-8746',
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

    const getSleeperTypeForBench = (benchNo) => {
        if (!benchNo) return null;
        // Mock logic for auto-population: even benches are RT-8746, odd are RT-8521
        return parseInt(benchNo) % 2 === 0 ? 'RT-8746' : 'RT-8521';
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [benches, longLines, profiles] = await Promise.all([
                    apiService.getStressBenches(),
                    apiService.getLongLines(),
                    apiService.getPlantProfiles()
                ]);
                setMasterBenches(benches || []);
                setMasterLongLines(longLines || []);
                setPlantProfiles(profiles || []);
            } catch (err) {
                console.error('Failed to fetch master data:', err);
            }
        };
        fetchMasterData();
    }, []);
    const dynamicUnits = React.useMemo(() => {
        const filtered = plantProfiles.filter(p => {
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
    }, [plantProfiles, plantType]);
    
    const allSleeperTypes = React.useMemo(() => {
        // Hardcoded as per request, others commented out
        const types = ['RT-8746'];
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


    useEffect(() => {
        if (initialData) {
            setPlantType(initialData.plantType === 'LONG_LINE' ? 'Long Line' : 'Stress Bench');

            // Map header
            const [d, m, y] = (initialData.castingDate || '').split('/');
            setFormHeader({
                unit: initialData.productionUnit || '',
                shedType: initialData.plantType === 'LONG_LINE' ? 'Long Line' : (dynamicUnits.find(s => s.name === initialData.productionUnit)?.type || 'Twin'),
                date: (y && m && d) ? `${y}-${m}-${d}` : new Date().toISOString().split('T')[0],
                shift: initialData.shift || 'Day Shift',
                batchNo: initialData.batchNumber || '',
                mixDesign: initialData.mixDesignReference || 'M60 - Design A (Active)',
                timeLbc: (initialData.lbcTime || getCurrentTime())?.substring(0, 5),
                remarks: initialData.remarks || ''
            });

            // Map chambers for Stress Bench
            if (initialData.plantType === 'STRESS' && initialData.chambers) {
                const mappedEntries = [];
                initialData.chambers.forEach(c => {
                    c.benchGroups.forEach(g => {
                        mappedEntries.push({
                            id: Date.now() + Math.random(), // Unique ID
                            chamberNo: c.chamberNo,
                            entryMode: g.mode?.toLowerCase() || 'single', // Assuming 'single' if not specified
                            fromNo: g.benchFrom?.toString() || '',
                            toNo: g.benchTo?.toString() || '',
                            singleNo: g.benchNo?.toString() || '',
                            sleeperType: g.sleeperType || '',
                            mouldsPerBench: g.mouldPerBench || 8
                        });
                    });
                });
                if (mappedEntries.length > 0) setStressBenchEntries(mappedEntries);
            }

            // Map gangs for Long Line
            if (initialData.plantType === 'LONG_LINE' && initialData.gangs) {
                const mappedEntries = initialData.gangs.map((g, gIdx) => ({
                    id: Date.now() + gIdx,
                    entryMode: g.mode?.toLowerCase() || 'range',
                    fromNo: g.gangFrom?.toString() || '',
                    toNo: g.gangTo?.toString() || '',
                    singleNo: g.gangNo?.toString() || '',
                    mouldsPerGang: g.mouldsPerGang,
                    sleeperType: g.sleeperType
                }));
                if (mappedEntries.length > 0) setLongLineEntries(mappedEntries);
            }

            // Move to Section 1
            setActiveSections({ 1: true, 2: true, 3: true });
        }
    }, [initialData]);

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
                    id: chamberNo, // Use chamberNo as ID for grouping
                    chamberNo: chamberNo,
                    benchGroups: []
                };
            }
            acc[chamberNo].benchGroups.push({
                id: entry.id,
                entryMode: entry.entryMode,
                benches: entry.entryMode === 'single' ? [entry.singleNo] : [], // For single, use singleNo
                fromNo: entry.fromNo,
                toNo: entry.toNo,
                singleNo: entry.singleNo,
                mouldsPerBench: entry.mouldsPerBench,
                sleeperType: entry.sleeperType,
                // Add other properties if needed for calculations or display
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
                sleeperType: 'RT-8746', // Always default to RT-8746 as per hardcode request
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
                    input::-webkit-calendar-picker-indicator {
                        display: none !important;
                        -webkit-appearance: none;
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
                                                const firstUnit = dynamicUnits.length > 0 ? dynamicUnits[0].name : '';
                                                setFormHeader({ ...formHeader, unit: firstUnit, shedType: 'Twin' });
                                            }}
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
                                                const firstUnit = dynamicUnits.length > 0 ? dynamicUnits[0].name : '';
                                                setFormHeader({ ...formHeader, unit: firstUnit, shedType: 'Long Line' });
                                            }}
                                            style={radioStyle}
                                        />
                                        Long Line
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>{plantType === 'Stress Bench' ? 'Production Unit (Stress Bench No.)' : 'Production Unit (Line No.)'}</label>
                                <select
                                    style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}
                                    value={formHeader.unit}
                                    onChange={(e) => {
                                        const selectedUnit = e.target.value;
                                        const unitData = dynamicUnits.find(u => u.name === selectedUnit);
                                        setFormHeader({
                                            ...formHeader,
                                            unit: selectedUnit,
                                            shedType: unitData ? unitData.type : ''
                                        });
                                    }}
                                >
                                    <option value="">Select Unit</option>
                                    {dynamicUnits.map(u => (
                                        <option key={u.name} value={u.name}>{u.name}</option>
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
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Shift</label>
                                <select
                                    style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}
                                    value={formHeader.shift}
                                    onChange={(e) => setFormHeader({ ...formHeader, shift: e.target.value })}
                                >
                                    <option value="Day Shift">Day Shift</option>
                                    <option value="Night Shift">Night Shift</option>
                                    <option value="A">A (08:00 - 20:00)</option>
                                    <option value="B">B (20:00 - 08:00)</option>
                                    <option value="C">C</option>
                                    <option value="General">General</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Batch Number</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 103"
                                    value={formHeader.batchNo}
                                    onChange={(e) => setFormHeader({ ...formHeader, batchNo: e.target.value })}
                                    style={inputStyle}
                                />

                            </div>
                            <div>
                                <label style={labelStyle}>Mix Design Reference</label>
                                <select
                                    style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}
                                    value={formHeader.mixDesign}
                                    onChange={(e) => setFormHeader({ ...formHeader, mixDesign: e.target.value })}
                                >
                                    <option value="M60 - Design A (Active)">M60 - Design A (Active)</option>
                                    <option value="M60 - Design B">M60 - Design B</option>
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
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                                <input type="radio" checked={stressBenchForm.entryMode === 'range'} onChange={() => setStressBenchForm({ ...stressBenchForm, entryMode: 'range' })} style={radioStyle} />
                                                Range
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                                <input type="radio" checked={stressBenchForm.entryMode === 'single'} onChange={() => setStressBenchForm({ ...stressBenchForm, entryMode: 'single' })} style={radioStyle} />
                                                Single
                                            </label>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2.5fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
                                        <div>
                                            <label style={labelStyle}>Chamber No.</label>
                                            <input type="number" value={stressBenchForm.chamberNo} onChange={(e) => setStressBenchForm({ ...stressBenchForm, chamberNo: e.target.value })} style={{ ...inputStyle, background: 'white' }} placeholder="No." />
                                        </div>
                                        {stressBenchForm.entryMode === 'range' ? (
                                            <>
                                                <div>
                                                    <label style={labelStyle}>Bench From</label>
                                                    <input type="number" value={stressBenchForm.fromNo} onChange={(e) => setStressBenchForm({ ...stressBenchForm, fromNo: e.target.value })} style={{ ...inputStyle, background: 'white' }} placeholder="Start" />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Bench To</label>
                                                    <input type="number" value={stressBenchForm.toNo} onChange={(e) => setStressBenchForm({ ...stressBenchForm, toNo: e.target.value })} style={{ ...inputStyle, background: 'white' }} placeholder="End" />
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>Bench No.</label>
                                                <input type="number" value={stressBenchForm.singleNo} onChange={(e) => setStressBenchForm({ ...stressBenchForm, singleNo: e.target.value })} style={{ ...inputStyle, background: 'white' }} placeholder="Enter No." />
                                            </div>
                                        )}
                                        <div style={{ position: 'relative' }}>
                                            <label style={labelStyle}>Sleeper Type</label>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    list="sleeper-types-list"
                                                    value={stressBenchForm.sleeperType}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => setStressBenchForm({ ...stressBenchForm, sleeperType: e.target.value })}
                                                    style={{ ...inputStyle, background: 'white', textAlign: 'center', fontWeight: 'bold', paddingRight: '40px' }}
                                                    placeholder="Select or Type"
                                                />
                                                <span style={{ 
                                                    position: 'absolute', 
                                                    right: '15px', 
                                                    fontSize: '12px',
                                                    color: '#42818c',
                                                    pointerEvents: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>▼</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Moulds/Bench</label>
                                            <input type="number" value={stressBenchForm.mouldsPerBench} onChange={(e) => setStressBenchForm({ ...stressBenchForm, mouldsPerBench: e.target.value })} style={{ ...inputStyle, background: 'white' }} />
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!stressBenchForm.chamberNo) return alert('Chamber No is required');
                                                const newEntry = { ...stressBenchForm, id: Date.now() };
                                                setStressBenchEntries([...stressBenchEntries, newEntry]);
                                                setStressBenchForm({ ...stressBenchForm, fromNo: '', toNo: '', singleNo: '', sleeperType: '' });
                                            }}
                                            style={{ background: '#42818c', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            Add Entry
                                        </button>
                                    </div>
                                </div>

                                {stressBenchEntries.length > 0 && (
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
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
                                                {stressBenchEntries.map((entry) => {
                                                    const count = entry.entryMode === 'range' ? (parseInt(entry.toNo) - parseInt(entry.fromNo) + 1) : 1;
                                                    return (
                                                        <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '12px 8px', fontWeight: '700', color: '#115e59' }}>#{entry.chamberNo}</td>
                                                            <td style={{ padding: '12px 8px', textTransform: 'capitalize', color: '#1e293b' }}>{entry.entryMode}</td>
                                                            <td style={{ padding: '12px 8px', fontWeight: '600', color: '#1e293b' }}>{entry.entryMode === 'range' ? `${entry.fromNo} - ${entry.toNo}` : entry.singleNo}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{count}</td>
                                                            <td style={{ padding: '12px 8px', color: '#1e293b' }}>{entry.sleeperType}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{entry.mouldsPerBench}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                                <button onClick={() => setStressBenchEntries(stressBenchEntries.filter(e => e.id !== entry.id))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}>Remove</button>
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
                                        <h4 style={{ margin: 0, color: '#1e293b' }}>Long Line Entry</h4>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                                <input type="radio" checked={longLineForm.entryMode === 'range'} onChange={() => setLongLineForm({ ...longLineForm, entryMode: 'range' })} style={radioStyle} />
                                                Range
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                                <input type="radio" checked={longLineForm.entryMode === 'single'} onChange={() => setLongLineForm({ ...longLineForm, entryMode: 'single' })} style={radioStyle} />
                                                Single
                                            </label>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2.5fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
                                        {longLineForm.entryMode === 'range' ? (
                                            <>
                                                <div>
                                                    <label style={labelStyle}>Line No. From</label>
                                                    <input type="number" value={longLineForm.fromNo} onChange={(e) => setLongLineForm({ ...longLineForm, fromNo: e.target.value })} style={{ ...inputStyle, background: 'white' }} placeholder="Start" />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Line No. To</label>
                                                    <input type="number" value={longLineForm.toNo} onChange={(e) => setLongLineForm({ ...longLineForm, toNo: e.target.value })} style={{ ...inputStyle, background: 'white' }} placeholder="End" />
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>Line No.</label>
                                                <input type="number" value={longLineForm.singleNo} onChange={(e) => setLongLineForm({ ...longLineForm, singleNo: e.target.value })} style={{ ...inputStyle, background: 'white' }} placeholder="Enter No." />
                                            </div>
                                        )}
                                        <div style={{ position: 'relative' }}>
                                            <label style={labelStyle}>Sleeper Type</label>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    list="sleeper-types-list"
                                                    value={longLineForm.sleeperType}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => setLongLineForm({ ...longLineForm, sleeperType: e.target.value })}
                                                    style={{ ...inputStyle, background: 'white', textAlign: 'center', fontWeight: 'bold', paddingRight: '40px' }}
                                                    placeholder="Select or Type"
                                                />
                                                <span style={{ 
                                                    position: 'absolute', 
                                                    right: '15px', 
                                                    fontSize: '12px',
                                                    color: '#42818c',
                                                    pointerEvents: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>▼</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Moulds/Line</label>
                                            <input type="number" value={longLineForm.mouldsPerGang} onChange={(e) => setLongLineForm({ ...longLineForm, mouldsPerGang: e.target.value })} style={{ ...inputStyle, background: 'white' }} />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newEntry = { ...longLineForm, id: Date.now() };
                                                setLongLineEntries([...longLineEntries, newEntry]);
                                                setLongLineForm({ ...longLineForm, fromNo: '', toNo: '', singleNo: '' });
                                            }}
                                            style={{ background: '#42818c', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            Add Entry
                                        </button>
                                    </div>
                                </div>

                                {longLineEntries.length > 0 && (
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px' }}>Mode</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px' }}>Lines</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '100px' }}>Count</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '180px' }}>Sleeper Type</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '130px' }}>Moulds/Line</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '100px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {longLineEntries.map((entry) => {
                                                    const count = entry.entryMode === 'range' ? (parseInt(entry.toNo) - parseInt(entry.fromNo) + 1) : 1;
                                                    return (
                                                        <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '12px 8px', textTransform: 'capitalize', color: '#1e293b' }}>{entry.entryMode}</td>
                                                            <td style={{ padding: '12px 8px', fontWeight: '600', color: '#1e293b' }}>{entry.entryMode === 'range' ? `${entry.fromNo} - ${entry.toNo}` : entry.singleNo}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{count}</td>
                                                            <td style={{ padding: '12px 8px', color: '#1e293b' }}>{entry.sleeperType}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{entry.mouldsPerGang}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                                <button onClick={() => setLongLineEntries(longLineEntries.filter(e => e.id !== entry.id))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Remove</button>
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
                <button
                    onClick={() => {
                        try {
                            const breakdown = getProductionBreakdown();
                            const invalidTypes = Object.keys(breakdown).filter(type => type !== 'RT-8746');

                            if (invalidTypes.length > 0) {
                                return alert('Form Submission Failed: Only RT-8746 sleeper types are allowed for production declaration.');
                            }

                            if (calculateTotalCast() === 0) {
                                return alert('Please add at least one valid entry.');
                            }

                            // Formatting the DTO for the backend
                            const pdDto = {
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
                                vendorId: 118,
                                createdBy: 118,
                                updatedBy: 118,
                                chambers: plantType === 'Stress Bench' ? chambers.map(chamber => ({
                                    chamberNo: parseInt(chamber.chamberNo) || 0,
                                    benchGroups: chamber.benchGroups.flatMap(group => {
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

                                        return benchList.map(bench => ({
                                            benchNo: parseInt(bench) || 0,
                                            sleeperType: group.sleeperType,
                                            mouldPerBench: parseInt(group.mouldsPerBench) || 0,
                                            rft: getBenchMasterDetails(bench).rft,
                                            sleepers: generateSleeperIds(bench, group.mouldsPerBench)
                                        }));
                                    })
                                })) : [],
                                gangs: plantType === 'Long Line' ? longLineEntries.map(entry => ({
                                    mode: entry.entryMode.toUpperCase(),
                                    gangFrom: entry.entryMode === 'range' ? parseInt(entry.fromNo) : null,
                                    gangTo: entry.entryMode === 'range' ? parseInt(entry.toNo) : null,
                                    gangNo: entry.entryMode === 'single' ? parseInt(entry.singleNo) : null,
                                    sleeperType: entry.sleeperType,
                                    mouldsPerGang: parseInt(entry.mouldsPerGang) || 0
                                })) : []
                            };

                            onSave(pdDto);
                            alert(`Production Declaration Submitted successfully!\nUnique Batch Record Created: ${formHeader.batchNo}\nSleeper IDs Generated (Digital Twin)\nTasks assigned to IE Dashboard.`);
                        } catch (err) {
                            console.error('Error formatting DTO:', err);
                            alert('Error preparing data for submission. Please check form inputs.');
                        }
                    }}
                    style={{ background: '#42818c', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(66, 129, 140, 0.4)' }}
                >
                    Submit Declaration
                </button>
            </div>
            <datalist id="sleeper-types-list">
                {allSleeperTypes.map(type => (
                    <option key={type} value={type} />
                ))}
            </datalist>
        </div>
    );
};

export default ShiftProductionForm;
