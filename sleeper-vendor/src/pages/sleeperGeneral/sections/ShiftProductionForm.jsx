import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { apiService } from '../../../services/api';
import { BASE_URL } from '../../../services/api';

const EditableSleeperTags = ({ sleepers, onChange, isReadOnly }) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState('');

    const handleRemove = (idx) => {
        if (isReadOnly) return;
        const newSleepers = [...sleepers];
        newSleepers.splice(idx, 1);
        onChange(newSleepers);
    };

    const startEdit = (idx, value) => {
        if (isReadOnly) return;
        setEditingIndex(idx);
        setEditValue(value);
    };

    const saveEdit = (idx) => {
        if (editValue.trim() !== '') {
            const newSleepers = [...sleepers];
            newSleepers[idx] = editValue.trim();
            onChange(newSleepers);
        }
        setEditingIndex(null);
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {sleepers.map((sleeper, idx) => (
                <div key={idx} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#e6f4f5',
                    color: '#2c5a62',
                    border: '1.5px solid #42818c',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600'
                }}>
                    {editingIndex === idx ? (
                        <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(idx)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(idx); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid #2c5a62',
                                color: '#2c5a62',
                                width: '40px',
                                outline: 'none',
                                fontSize: '13px',
                                fontWeight: '600',
                                padding: 0
                            }}
                        />
                    ) : (
                        <span 
                            onClick={() => startEdit(idx, sleeper)}
                            style={{ 
                                cursor: isReadOnly ? 'default' : 'pointer',
                                borderBottom: isReadOnly ? 'none' : '1px dotted #2c5a62' 
                            }}
                        >
                            {sleeper}
                        </span>
                    )}
                    {!isReadOnly && (
                        <span 
                            onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                            style={{ 
                                marginLeft: '6px', 
                                color: '#94a3b8', 
                                cursor: 'pointer',
                                fontSize: '12px',
                                marginTop: '-1px'
                            }}
                        >
                            x
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

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

    const generateSleepers = (benchName, sequenceType, count) => {
        let sleepers = [];
        if (sequenceType.includes('A, B, C, D, E, F, G, Z')) {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Z'];
            for (let i = 0; i < count && i < letters.length; i++) {
                sleepers.push(`${benchName}${letters[i]}`);
            }
        } else if (sequenceType.includes('A, B, C, D, E, V, W, X, Y, Z')) {
            const letters = ['A', 'B', 'C', 'D', 'E', 'V', 'W', 'X', 'Y', 'Z'];
            for (let i = 0; i < count && i < letters.length; i++) {
                sleepers.push(`${benchName}${letters[i]}`);
            }
        } else if (sequenceType.includes('A, B, C, D, E, F, G, H')) {
            const letters = Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i));
            for (let i = 0; i < count && i < letters.length; i++) {
                sleepers.push(`${benchName}${letters[i]}`);
            }
        } else if (sequenceType.includes('Numeric')) {
            for (let i = 1; i <= count; i++) {
                sleepers.push(`${benchName}${i}`);
            }
        } else {
            for (let i = 1; i <= count; i++) {
                sleepers.push(`${benchName}${i}`);
            }
        }
        return sleepers;
    };

    const [formHeader, setFormHeader] = useState({
        unit: '',
        shedType: 'Twin',
        date: new Date().toISOString().split('T')[0],
        shift: 'Day',
        batchNo: '',
        mixDesign: 'M60',
        timeLbc: getCurrentTime(),
        remarks: '',
        mouldSequence: 'Preset — A, B, C, D, E, F, G, Z (default)'
    });

    const [chambers, setChambers] = useState([]); // Will be derived from stressBenchEntries
    const [stressBenchEntries, setStressBenchEntries] = useState([]);
    const [longLineEntries, setLongLineEntries] = useState([]);
    const getInitialStressBenchForm = () => ({
        id: Date.now() + Math.random(),
        chamberNo: '',
        entryMode: 'single',
        fromNo: '',
        toNo: '',
        singleNo: '',
        sleeperCategory: 'Mainline',
        sleeperType: '',
        mouldsPerBench: 8,
        totalRmt: '',
        turnoutSelectedSleepers: { approach: [], turnout: [], exit: [] }
    });

    const getInitialLongLineForm = () => ({
        id: Date.now() + Math.random(),
        entryMode: 'single',
        fromNo: '',
        toNo: '',
        singleNo: '',
        sleeperCategory: 'Mainline',
        sleeperType: '',
        mouldsPerGang: 8,
        totalRmt: '',
        turnoutSelectedSleepers: { approach: [], turnout: [], exit: [] }
    });

    const [stressBenchForms, setStressBenchForms] = useState([getInitialStressBenchForm()]);
    const [longLineForms, setLongLineForms] = useState([getInitialLongLineForm()]);

    const updateStressBenchRow = (index, field, value) => {
        setStressBenchForms(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
    };

    const addStressBenchRow = () => {
        setStressBenchForms(prev => {
            if (prev.length > 0) {
                const lastRow = prev[prev.length - 1];
                return [...prev, {
                    ...getInitialStressBenchForm(),
                    sleeperCategory: lastRow.sleeperCategory,
                    sleeperType: lastRow.sleeperType,
                    mouldsPerBench: lastRow.mouldsPerBench,
                    totalRmt: lastRow.totalRmt,
                    turnoutSelectedSleepers: { approach: [], turnout: [], exit: [] }
                }];
            }
            return [...prev, getInitialStressBenchForm()];
        });
    };

    const removeStressBenchRow = (index) => {
        setStressBenchForms(prev => prev.filter((_, i) => i !== index));
    };

    const updateLongLineRow = (index, field, value) => {
        setLongLineForms(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
    };

    const addLongLineRow = () => {
        setLongLineForms(prev => {
            if (prev.length > 0) {
                const lastRow = prev[prev.length - 1];
                return [...prev, {
                    ...getInitialLongLineForm(),
                    sleeperCategory: lastRow.sleeperCategory,
                    sleeperType: lastRow.sleeperType,
                    mouldsPerGang: lastRow.mouldsPerGang,
                    totalRmt: lastRow.totalRmt,
                    turnoutSelectedSleepers: { approach: [], turnout: [], exit: [] }
                }];
            }
            return [...prev, getInitialLongLineForm()];
        });
    };

    const removeLongLineRow = (index) => {
        setLongLineForms(prev => prev.filter((_, i) => i !== index));
    };

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
                    const stressUnits = (data.responseData["Stress Bench"] || []).map(u => ({ label: `Stress Bench - ${u}`, value: u, type: 'Stress Bench' }));
                    const longlineUnits = (data.responseData["Longline"] || []).map(u => ({ label: `Long Line - ${u}`, value: u, type: 'Long Line' }));
                    setUnitOptions([...stressUnits, ...longlineUnits]);
                }
            } catch (err) {
                console.error("Failed to fetch units", err);
            }
        };

        fetchUnits();
    }, []);

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
        const totalUnits = latestProfile ? (parseInt(latestProfile.numberOfSheds || latestProfile.shedLines) || 0) : 0;
        const prefix = plantType === 'Stress Bench' ? 'Shed' : 'Line';

        return Array.from({ length: totalUnits }).map((_, i) => ({
            name: `${prefix} ${i + 1}`,
            type: plantType === 'Stress Bench' ? 'Twin' : 'Long Line',
            mouldsPerBench: 8,
            mouldsPerGang: 8
        }));
    }, [plantDetails, plantProfiles, plantType]);
    
    // Drawing No. options grouped by Sleeper Category
    const sleeperTypesByCategory = {
        'Mainline': [
            'BG: RT-2496',
            'WB: RT-8527',
            'WB: RT-8746',
            'BG: RT-7008',
            'WB: RT-9007'
        ],
        'Turnout': [
            '1 in 12 PnC: RT-4218',
            '1 in 12 PnC: RT-9790',
            '1 in 8.5 PnC: RT-4865',
            '1 in 8.5 PnC: RT-9841',
            '1 in 8.5 DS: RT-6068',
            '1 in 16 curved: RT-5691',
            '1 in 20 curved: RT-5858',
            '1 in 8.5 SCC: RT-6092',
            '1 in 12 SCC: RT-8109',
            '1 in 8.5 DCS: RT-6492',
            '1 in 8.5 DCS: RT-6493',
            '1 in 8.5 DCS: RT-6494'
        ]
    };

    // Sleeper layout config per Turnout drawing
    const turnoutSleeperConfig = {
        '1 in 12 PnC: RT-4218':  { approach: ['60S', '1AS', '2AS', '3A', '4A'],             turnout: Array.from({ length: 83 },  (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E', '4E'] },
        '1 in 12 PnC: RT-9790':  { approach: ['70S', '70-4A', '70-3A', '70-2AS', '70-1AS'],  turnout: Array.from({ length: 83 },  (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E', '4E'] },
        '1 in 8.5 PnC: RT-4865': { approach: ['60S', '1AS', '2AS', '3A', '4A'],             turnout: Array.from({ length: 54 },  (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E', '4E'] },
        '1 in 8.5 PnC: RT-9841': { approach: ['90S', '90-4A', '90-3A', '90-2AS'],             turnout: Array.from({ length: 83 },  (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E','4E'] },
        '1 in 8.5 DS: RT-6068':  { approach: ['60S', '1AS', '2AS', '3A', '4A'],             turnout: Array.from({ length: 22 },  (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E', '4E'] },
        '1 in 16 curved: RT-5691': { approach: ['60S', '1AS', '2AS', '3A', '4A'],             turnout: Array.from({ length: 101 }, (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E', '4E'] },
        '1 in 20 curved: RT-5858': { approach: ['120S', '120-4A', '120-3A'],                   turnout: Array.from({ length: 83 }, (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E', '4E'] },
        '1 in 8.5 SCC: RT-6092': { approach: ['130S', '130-4A', '130-3A'],                    turnout: Array.from({ length: 83 },  (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E','4E'] },
        '1 in 12 SCC: RT-8109':  { approach: ['140S', '140-4A', '140-3A', '140-2AS'],         turnout: Array.from({ length: 83 },  (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E', '4E'] },
        '1 in 8.5 DCS: RT-6492': { approach: ['150S', '150-4A', '150-3A'],                    turnout: Array.from({ length: 83 },  (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E','4E'] },
        '1 in 8.5 DCS: RT-6493': { approach: ['160S', '160-4A'],                               turnout: Array.from({ length: 83 },  (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E','4E'] },
        '1 in 8.5 DCS: RT-6494': { approach: ['170S', '170-4A', '170-3A'],                     turnout: Array.from({ length: 83 },  (_, i) => (i + 1).toString()), exit: ['1E', '2E', '3E','4E'] }
    };

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

    // Get Drawing No. options for the currently selected sleeperCategory
    const getDrawingOptions = (category) => {
        return sleeperTypesByCategory[category] || allSleeperTypes;
    };

    const getSleeperLetter = (index, totalCount) => {
        const sequence = formHeader.mouldSequence || 'Preset — A, B, C, D, E, F, G, Z (default)';
        
        if (sequence === 'Numeric — 1, 2, 3, 4...') {
            return (index + 1).toString(); // 1, 2, 3, 4...
        } else if (sequence === 'Preset — A, B, C, D, E, F, G, H') {
            return String.fromCharCode(65 + index); // A, B, C, D, E, F, G, H
        } else if (sequence === 'Preset — A, B, C, D, E, V, W, X, Y, Z') {
            if (index < 5) return String.fromCharCode(65 + index); // A-E
            return String.fromCharCode(86 + (index - 5)); // V-Z
        } else {
            // Default: 'Preset — A, B, C, D, E, F, G, Z (default)'
            if (Number(totalCount) === 10) {
                if (index < 5) return String.fromCharCode(65 + index); // A-E
                return String.fromCharCode(86 + (index - 5)); // V-Z
            }
            if (index < 7) return String.fromCharCode(65 + index); // A-G
            if (index === 7) return 'Z';
            return String.fromCharCode(65 + index); // Fallback for index > 7
        }
    };

    const generateSleeperIds = (benchNo, count) => {
        if (!benchNo || !count) return [];
        const numCount = Number(count);
        return Array.from({ length: numCount }).map((_, i) => `${benchNo}${getSleeperLetter(i, numCount)}`);
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
            const sleeperNames = Array.from({ length: moulds }).map((_, i) => `${benchNo}${getSleeperLetter(i, moulds)}`);
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
            const sleeperNames = Array.from({ length: moulds }).map((_, i) => `${benchNo}${getSleeperLetter(i, moulds)}`);
            return { moulds, rft, sleeperNames, isPnC };
        }
        return { moulds: 0, rft: 0, sleeperNames: [] };
    };

    const getLongLineMasterDetails = (gangNo) => {
        if (!gangNo) return { moulds: 0, sleeperType: '' };
        const gNo = parseInt(gangNo);
        const match = masterLongLines.find(l => {
            if (l.entryMode === 'SINGLE') {
                return l.gangNo == gNo;
            } else if (l.entryMode === 'RANGE') {
                return gNo >= l.gangFrom && gNo <= l.gangTo;
            }
            return false;
        });
        if (match) {
            const moulds = match.numMouldsPerItem || match.mouldsPerGang || 0;
            const sleeperType = match.category || '';
            return { moulds, sleeperType };
        }
        return { moulds: 0, sleeperType: '' };
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
                remarks: initialData.remarks || '',
                mouldSequence: initialData.mouldSequence || 'Preset — A, B, C, D, E, F, G, Z (default)'
            });

            // Map chambers for Stress Bench with deduplication
            const isStress = initialData.plantType === 'STRESS' || initialData.plantType === 'Stress Bench';
            if (isStress && initialData.chambers) {
                const mappedEntries = [];

                initialData.chambers.forEach(c => {
                    c.benchGroups.forEach(g => {
                        const isPnC = g.sleeperType && (
                            sleeperTypesByCategory['Turnout']?.includes(g.sleeperType) || 
                            g.sleeperType.toLowerCase().includes('pnc') || 
                            g.sleeperType.toLowerCase().includes('curved') || 
                            g.sleeperType.toLowerCase().includes('scc') || 
                            g.sleeperType.toLowerCase().includes('dcs') || 
                            g.sleeperType.toLowerCase().includes('ds')
                        );
                        const category = isPnC ? 'Turnout' : 'Mainline';
                        const sleepersList = g.sleepers || g.sleeperList?.map(s => s.sleeperNo) || [];

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
                            sleeperCategory: category,
                            sleepers: sleepersList,
                            mouldsPerBench: g.mouldPerBench || 8,
                            totalRmt: g.rft || '',
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
                    const isPnC = g.sleeperType && (
                        sleeperTypesByCategory['Turnout']?.includes(g.sleeperType) || 
                        g.sleeperType.toLowerCase().includes('pnc') || 
                        g.sleeperType.toLowerCase().includes('curved') || 
                        g.sleeperType.toLowerCase().includes('scc') || 
                        g.sleeperType.toLowerCase().includes('dcs') || 
                        g.sleeperType.toLowerCase().includes('ds')
                    );
                    const category = isPnC ? 'Turnout' : 'Mainline';
                    const sleepersList = g.sleepers || g.sleeperList?.map(s => s.sleeperNo) || [];

                    mappedEntries.push({
                        id: Date.now() + gIdx,
                        originalId: g.id, // Store original gang ID
                        entryMode: g.mode?.toLowerCase() || 'range',
                        fromNo: g.gangFrom?.toString() || '',
                        toNo: g.gangTo?.toString() || '',
                        singleNo: g.gangNo?.toString() || '',
                        mouldsPerGang: g.mouldsPerGang,
                        sleeperType: g.sleeperType,
                        sleeperCategory: category,
                        sleepers: sleepersList,
                        totalRmt: g.rft || '',
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
                sleeperCategory: entry.sleeperCategory,
                totalRmt: entry.totalRmt,
                turnoutSelectedSleepers: entry.turnoutSelectedSleepers,
                sleepers: entry.sleepers,
                _originalRft: entry._originalRft,
                _originalSleepers: entry._originalSleepers,
                _originalSleeperList: entry._originalSleeperList,
                _isOld: entry._isOld
            });
            return acc;
        }, {});
        setChambers(Object.values(groupedChambers));
    }, [stressBenchEntries]);




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
                if (entry.sleepers) {
                    return acc + entry.sleepers.length;
                }
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
                if (e.sleepers) {
                    return acc + e.sleepers.length;
                }
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
                if (entry.totalRmt && parseFloat(entry.totalRmt) > 0) {
                    return acc + parseFloat(entry.totalRmt);
                }
                return acc + benchesToSum.reduce((bAcc, b) => bAcc + getBenchMasterDetailsForType(b, entry.sleeperType).rft, 0);
            }, 0);
        } else if (plantType === 'Long Line') {
            return longLineEntries.reduce((acc, entry) => {
                if (entry.totalRmt && parseFloat(entry.totalRmt) > 0) {
                    return acc + parseFloat(entry.totalRmt);
                }
                return acc;
            }, 0);
        }
        return 0;
    };

    const getProductionBreakdown = () => {
        const counts = {};
        if (plantType === 'Stress Bench') {
            stressBenchEntries.forEach(entry => {
                if (entry.sleeperType) {
                    let totalVal = 0;
                    if (entry.sleeperCategory === 'Turnout' && entry.sleepers) {
                        totalVal = entry.sleepers.length;
                    } else {
                        let count = 0;
                        if (entry.entryMode === 'range') {
                            const from = parseInt(entry.fromNo) || 0;
                            const to = parseInt(entry.toNo) || 0;
                            count = from > 0 && to >= from ? (to - from + 1) : 0;
                        } else if (entry.entryMode === 'single') {
                            count = entry.singleNo ? 1 : 0;
                        }
                        totalVal = count * (parseInt(entry.mouldsPerBench) || 0);
                    }
                    counts[entry.sleeperType] = (counts[entry.sleeperType] || 0) + totalVal;
                }
            });
        } else {
            longLineEntries.forEach(e => {
                if (e.sleeperType) {
                    let totalVal = 0;
                    if (e.sleeperCategory === 'Turnout' && e.sleepers) {
                        totalVal = e.sleepers.length;
                    } else {
                        const count = e.entryMode === 'range' ? (parseInt(e.toNo) - parseInt(e.fromNo) + 1) : 1;
                        totalVal = count * (parseInt(e.mouldsPerGang) || 0);
                    }
                    counts[e.sleeperType] = (counts[e.sleeperType] || 0) + totalVal;
                }
            });
        }
        return counts;
    };

    const handleAddStressBench = () => {
        const activeFormsWithIndices = stressBenchForms
            .map((row, index) => ({ row, index }))
            .filter(item => item.row.chamberNo.toString().trim() !== '' || item.row.singleNo.toString().trim() !== '');

        if (activeFormsWithIndices.length === 0) {
            return alert('Please fill in at least one entry.');
        }

        let lastDrawingNo = null;
        let targetCategory = stressBenchEntries.length > 0 ? stressBenchEntries[0].sleeperCategory : null;
        let targetDrawing = stressBenchEntries.length > 0 ? stressBenchEntries[0].sleeperType : null;

        for (let i = 0; i < activeFormsWithIndices.length; i++) {
            const { row, index } = activeFormsWithIndices[i];
            const displayIndex = index + 1;
            if (!row.chamberNo) return alert(`Row ${displayIndex}: Chamber No is required`);
            if (!row.singleNo) return alert(`Row ${displayIndex}: Bench No is required`);

            const benches = row.singleNo.toString().split(',').map(s => s.trim().toUpperCase()).filter(s => s !== '');
            if (benches.length === 0) return alert(`Row ${displayIndex}: Valid Bench No is required`);

            if (row.sleeperType) {
                lastDrawingNo = row.sleeperType;
            } else if (lastDrawingNo) {
                row.sleeperType = lastDrawingNo;
            }

            const allValidDrawings = Object.values(sleeperTypesByCategory).flat();
            if (!row.sleeperType || !allValidDrawings.includes(row.sleeperType)) {
                return alert(`Row ${displayIndex}: Please select a valid Drawing No.`);
            }

            if (targetCategory === null && targetDrawing === null) {
                targetCategory = row.sleeperCategory;
                targetDrawing = row.sleeperType;
            } else if (row.sleeperCategory !== targetCategory || row.sleeperType !== targetDrawing) {
                return alert(`Row ${displayIndex}: You can only select ONE Sleeper Category and Drawing No per shift form. All rows must match: ${targetCategory} / ${targetDrawing}.`);
            }

            if (row.sleeperCategory !== 'Turnout') {
                const is8MouldSequence = formHeader.mouldSequence === 'Preset — A, B, C, D, E, F, G, Z (default)';
                if (is8MouldSequence && parseInt(row.mouldsPerBench) !== 8) {
                    return alert(`Row ${displayIndex}: The selected Mould Sequence can only be used when exactly 8 Moulds/Bench is selected.`);
                }
                
                const is26MouldSequence = formHeader.mouldSequence === 'Preset — A, B, C, D, E, F, G, H';
                if (is26MouldSequence && parseInt(row.mouldsPerBench) > 26) {
                    return alert(`Row ${displayIndex}: The selected Mould Sequence supports a maximum of 26 Moulds/Bench.`);
                }
                
                const is10MouldSequence = formHeader.mouldSequence === 'Preset — A, B, C, D, E, V, W, X, Y, Z';
                if (is10MouldSequence && parseInt(row.mouldsPerBench) !== 10) {
                    return alert(`Row ${displayIndex}: The selected Mould Sequence can only be used when 10 Moulds/Bench is selected.`);
                }
            }
        }

        let allNewEntries = [];
        let duplicates = [];

        // --- Pool turnout sleepers and benches by Drawing No ---
        const turnoutSleepersByType = {};
        const turnoutBenchesCount = {};
        
        activeFormsWithIndices.forEach(({ row }) => {
            if (row.sleeperCategory === 'Turnout' && row.sleeperType) {
                const type = row.sleeperType;
                if (!turnoutSleepersByType[type]) turnoutSleepersByType[type] = [];
                
                const sleepers = [
                    ...(row.turnoutSelectedSleepers.approach || []),
                    ...(row.turnoutSelectedSleepers.turnout || []),
                    ...(row.turnoutSelectedSleepers.exit || [])
                ];
                sleepers.forEach(s => {
                    turnoutSleepersByType[type].push(s);
                });
                
                const benches = row.singleNo.toString().split(',').map(s => s.trim().toUpperCase()).filter(s => s !== '');
                turnoutBenchesCount[type] = (turnoutBenchesCount[type] || 0) + benches.length;
            }
        });
        
        const turnoutAllocatedBenches = {};

        activeFormsWithIndices.forEach(({ row }) => {
            const benches = row.singleNo.toString().split(',').map(s => s.trim().toUpperCase()).filter(s => s !== '');
            
            benches.forEach(b => {
                stressBenchEntries.forEach(entry => {
                    if (editingEntryId === entry.id) return;
                    if (entry.singleNo.toString().toUpperCase() === b) duplicates.push(b);
                });
            });

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
                                            if (benches.includes(i.toString())) duplicates.push(i.toString());
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }

            benches.forEach((bench, idx) => {
                let sleepers = null;
                if (row.sleeperCategory === 'Turnout' && row.sleeperType) {
                    const type = row.sleeperType;
                    const allTurnoutSleepers = turnoutSleepersByType[type];
                    const totalSleepers = allTurnoutSleepers.length;
                    const numBenches = turnoutBenchesCount[type];
                    
                    if (!turnoutAllocatedBenches[type]) turnoutAllocatedBenches[type] = 0;
                    const globalIdx = turnoutAllocatedBenches[type]++;
                    
                    if (numBenches > 0) {
                        const baseSize = Math.floor(totalSleepers / numBenches);
                        const remainder = totalSleepers % numBenches;
                        
                        let startIndex = 0;
                        if (globalIdx < numBenches - remainder) {
                            startIndex = globalIdx * baseSize;
                        } else {
                            startIndex = (numBenches - remainder) * baseSize + (globalIdx - (numBenches - remainder)) * (baseSize + 1);
                        }
                        
                        const bucketSize = globalIdx < numBenches - remainder ? baseSize : baseSize + 1;
                        sleepers = allTurnoutSleepers.slice(startIndex, startIndex + bucketSize);
                    } else {
                        sleepers = [...allTurnoutSleepers];
                    }
                } else if (row.sleeperCategory !== 'Turnout') {
                    sleepers = generateSleepers(bench.toString(), formHeader.mouldSequence, parseInt(row.mouldsPerBench) || 0);
                }
                allNewEntries.push({
                    ...row,
                    entryMode: 'single',
                    singleNo: bench.toString(),
                    id: editingEntryId && idx === 0 ? editingEntryId : Date.now() + Math.random(),
                    sleepers: sleepers
                });
            });
        });

        const uniqueDuplicates = [...new Set(duplicates)];

        const proceedWithAddition = () => {
            if (editingEntryId) {
                let updatedEntries = stressBenchEntries.map(e => e.id === editingEntryId ? allNewEntries[0] : e);
                if (allNewEntries.length > 1) {
                    updatedEntries = [...updatedEntries, ...allNewEntries.slice(1)];
                }
                setStressBenchEntries(updatedEntries);
                setEditingEntryId(null);
            } else {
                setStressBenchEntries([...stressBenchEntries, ...allNewEntries]);
            }
            setStressBenchForms([getInitialStressBenchForm()]);
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
        const activeFormsWithIndices = longLineForms
            .map((row, index) => ({ row, index }))
            .filter(item => item.row.singleNo.toString().trim() !== '');

        if (activeFormsWithIndices.length === 0) {
            return alert('Please fill in at least one entry.');
        }

        let lastDrawingNo = null;
        let targetCategory = longLineEntries.length > 0 ? longLineEntries[0].sleeperCategory : null;
        let targetDrawing = longLineEntries.length > 0 ? longLineEntries[0].sleeperType : null;

        for (let i = 0; i < activeFormsWithIndices.length; i++) {
            const { row, index } = activeFormsWithIndices[i];
            const displayIndex = index + 1;
            if (!row.singleNo) return alert(`Row ${displayIndex}: Gang No is required`);

            const gangs = row.singleNo.toString().split(',').map(s => s.trim().toUpperCase()).filter(s => s !== '');
            if (gangs.length === 0) return alert(`Row ${displayIndex}: Valid Gang No is required`);

            if (row.sleeperType) {
                lastDrawingNo = row.sleeperType;
            } else if (lastDrawingNo) {
                row.sleeperType = lastDrawingNo;
            }

            const allValidDrawings = Object.values(sleeperTypesByCategory).flat();
            if (!row.sleeperType || !allValidDrawings.includes(row.sleeperType)) {
                return alert(`Row ${displayIndex}: Please select a valid Drawing No.`);
            }

            if (targetCategory === null && targetDrawing === null) {
                targetCategory = row.sleeperCategory;
                targetDrawing = row.sleeperType;
            } else if (row.sleeperCategory !== targetCategory || row.sleeperType !== targetDrawing) {
                return alert(`Row ${displayIndex}: You can only select ONE Sleeper Category and Drawing No per shift form. All rows must match: ${targetCategory} / ${targetDrawing}.`);
            }

            if (row.sleeperCategory !== 'Turnout') {
                const is8MouldSequence = formHeader.mouldSequence === 'Preset — A, B, C, D, E, F, G, Z (default)';
                if (is8MouldSequence && parseInt(row.mouldsPerGang) !== 8) {
                    return alert(`Row ${displayIndex}: The selected Mould Sequence can only be used when exactly 8 Moulds/Gang is selected.`);
                }
                
                const is26MouldSequence = formHeader.mouldSequence === 'Preset — A, B, C, D, E, F, G, H';
                if (is26MouldSequence && parseInt(row.mouldsPerGang) > 26) {
                    return alert(`Row ${displayIndex}: The selected Mould Sequence supports a maximum of 26 Moulds/Gang.`);
                }
                
                const is10MouldSequence = formHeader.mouldSequence === 'Preset — A, B, C, D, E, V, W, X, Y, Z';
                if (is10MouldSequence && parseInt(row.mouldsPerGang) !== 10) {
                    return alert(`Row ${displayIndex}: The selected Mould Sequence can only be used when 10 Moulds/Gang is selected.`);
                }
            }
        }

        let allNewEntries = [];
        let duplicates = [];

        // --- Pool turnout sleepers and gangs by Drawing No ---
        const turnoutSleepersByType = {};
        const turnoutGangsCount = {};
        
        activeFormsWithIndices.forEach(({ row }) => {
            if (row.sleeperCategory === 'Turnout' && row.sleeperType) {
                const type = row.sleeperType;
                if (!turnoutSleepersByType[type]) turnoutSleepersByType[type] = [];
                
                const sleepers = [
                    ...(row.turnoutSelectedSleepers.approach || []),
                    ...(row.turnoutSelectedSleepers.turnout || []),
                    ...(row.turnoutSelectedSleepers.exit || [])
                ];
                sleepers.forEach(s => {
                    turnoutSleepersByType[type].push(s);
                });
                
                const gangs = row.singleNo.toString().split(',').map(s => s.trim().toUpperCase()).filter(s => s !== '');
                turnoutGangsCount[type] = (turnoutGangsCount[type] || 0) + gangs.length;
            }
        });
        
        const turnoutAllocatedGangs = {};

        activeFormsWithIndices.forEach(({ row }) => {
            const gangs = row.singleNo.toString().split(',').map(s => s.trim().toUpperCase()).filter(s => s !== '');

            gangs.forEach(g => {
                longLineEntries.forEach(entry => {
                    if (editingEntryId === entry.id) return;
                    let entryGangs = [];
                    if (entry.entryMode === 'range') {
                        const f = parseInt(entry.fromNo);
                        const t = parseInt(entry.toNo);
                        if (!isNaN(f) && !isNaN(t)) {
                            for (let idx = f; idx <= t; idx++) entryGangs.push(idx);
                        }
                    } else {
                        const bVal = entry.singleNo ? entry.singleNo.toString().trim().toUpperCase() : '';
                        if (bVal) entryGangs.push(bVal);
                    }
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
                                for (let idx = f; idx <= t; idx++) {
                                    if (gangs.includes(idx.toString())) duplicates.push(idx.toString());
                                }
                            }
                        });
                    }
                });
            }

            gangs.forEach((gang, idx) => {
                let sleepers = null;
                if (row.sleeperCategory === 'Turnout' && row.sleeperType) {
                    const type = row.sleeperType;
                    const allTurnoutSleepers = turnoutSleepersByType[type];
                    const totalSleepers = allTurnoutSleepers.length;
                    const numGangs = turnoutGangsCount[type];
                    
                    if (!turnoutAllocatedGangs[type]) turnoutAllocatedGangs[type] = 0;
                    const globalIdx = turnoutAllocatedGangs[type]++;
                    
                    if (numGangs > 0) {
                        const baseSize = Math.floor(totalSleepers / numGangs);
                        const remainder = totalSleepers % numGangs;
                        
                        let startIndex = 0;
                        if (globalIdx < numGangs - remainder) {
                            startIndex = globalIdx * baseSize;
                        } else {
                            startIndex = (numGangs - remainder) * baseSize + (globalIdx - (numGangs - remainder)) * (baseSize + 1);
                        }
                        
                        const bucketSize = globalIdx < numGangs - remainder ? baseSize : baseSize + 1;
                        sleepers = allTurnoutSleepers.slice(startIndex, startIndex + bucketSize);
                    } else {
                        sleepers = [...allTurnoutSleepers];
                    }
                } else if (row.sleeperCategory !== 'Turnout') {
                    sleepers = generateSleepers(gang.toString(), formHeader.mouldSequence, parseInt(row.mouldsPerGang) || 0);
                }
                allNewEntries.push({
                    ...row,
                    entryMode: 'single',
                    singleNo: gang.toString(),
                    id: editingEntryId && idx === 0 ? editingEntryId : Date.now() + Math.random(),
                    sleepers: sleepers
                });
            });
        });

        const uniqueDuplicates = [...new Set(duplicates)];

        const proceedWithAddition = () => {
            if (editingEntryId) {
                let updatedEntries = longLineEntries.map(e => e.id === editingEntryId ? allNewEntries[0] : e);
                if (allNewEntries.length > 1) {
                    updatedEntries = [...updatedEntries, ...allNewEntries.slice(1)];
                }
                setLongLineEntries(updatedEntries);
                setEditingEntryId(null);
            } else {
                setLongLineEntries([...longLineEntries, ...allNewEntries]);
            }
            setLongLineForms([getInitialLongLineForm()]);
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

    // Custom dropdown — uses a portal so it escapes overflow:hidden parents
    const CustomDropdown = ({ value, onChange, options, disabled, placeholder, bold }) => {
        const [open, setOpen] = React.useState(false);
        const [rect, setRect] = React.useState(null);
        const triggerRef = React.useRef(null);

        const openDropdown = () => {
            if (disabled) return;
            if (!open && triggerRef.current) {
                setRect(triggerRef.current.getBoundingClientRect());
            }
            setOpen(prev => !prev);
        };

        React.useEffect(() => {
            if (!open) return;
            const handleClose = (e) => {
                if (triggerRef.current && !triggerRef.current.contains(e.target)) {
                    // Check if click is inside the portal list
                    const list = document.getElementById('custom-dropdown-portal');
                    if (list && list.contains(e.target)) return;
                    setOpen(false);
                }
            };
            const handleScroll = () => {
                if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
            };
            document.addEventListener('mousedown', handleClose);
            window.addEventListener('scroll', handleScroll, true);
            return () => {
                document.removeEventListener('mousedown', handleClose);
                window.removeEventListener('scroll', handleScroll, true);
            };
        }, [open]);

        const displayLabel = value || placeholder || 'Select';

        const dropdownList = open && rect && ReactDOM.createPortal(
            <div
                id="custom-dropdown-portal"
                style={{
                    position: 'fixed',
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width,
                    zIndex: 999999,
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    maxHeight: '260px',
                    overflowY: 'auto'
                }}
            >
                {placeholder && (
                    <div
                        onMouseDown={(e) => { e.preventDefault(); onChange(''); setOpen(false); }}
                        style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderBottom: '1px solid #f1f5f9',
                            background: !value ? '#1a69d8' : 'white',
                            color: !value ? 'white' : '#94a3b8',
                            borderRadius: '10px 10px 0 0'
                        }}
                    >
                        {placeholder}
                    </div>
                )}
                {options.map((opt, idx) => (
                    <div
                        key={opt}
                        onMouseDown={(e) => { e.preventDefault(); onChange(opt); setOpen(false); }}
                        style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            background: value === opt ? '#1a69d8' : 'white',
                            color: value === opt ? 'white' : '#1e293b',
                            borderRadius: idx === options.length - 1 ? '0 0 10px 10px' : '0',
                            transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = '#f1f5f9'; }}
                        onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = 'white'; }}
                    >
                        {opt}
                    </div>
                ))}
            </div>,
            document.body
        );

        return (
            <div style={{ position: 'relative', width: '100%' }}>
                <div
                    ref={triggerRef}
                    onClick={openDropdown}
                    style={{
                        ...inputStyle,
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: disabled ? 'default' : 'pointer',
                        userSelect: 'none',
                        border: bold ? '2px solid #e2e8f0' : '1px solid #cbd5e1',
                        boxShadow: bold ? 'inset 0 2px 4px 0 rgba(0,0,0,0.06)' : 'none',
                        fontWeight: bold ? '700' : '400',
                        paddingRight: '8px'
                    }}
                >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? '#1e293b' : '#94a3b8' }}>
                        {displayLabel}
                    </span>
                    <span style={{
                        fontSize: '10px',
                        color: '#42818c',
                        background: '#f1f5f9',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        marginLeft: '6px',
                        flexShrink: 0,
                        transition: 'transform 0.2s',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>▼</span>
                </div>
                {dropdownList}
            </div>
        );
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Production Unit (Shed/Line No.)</label>
                                <select
                                    disabled={isReadOnly}
                                    style={{ ...inputStyle, background: 'white', cursor: isReadOnly ? 'default' : 'pointer' }}
                                    value={formHeader.unit && plantType ? `${formHeader.unit}|${plantType}` : ""}
                                    onChange={(e) => {
                                        if (!e.target.value) {
                                            setFormHeader({ ...formHeader, unit: "", shedType: "" });
                                            setPlantType("");
                                            return;
                                        }
                                        const [val, type] = e.target.value.split('|');
                                        setPlantType(type);
                                        setFormHeader({
                                            ...formHeader,
                                            unit: val,
                                            shedType: type === 'Long Line' ? 'Long Line' : 'Twin'
                                        });
                                        setEditingEntryId(null);
                                    }}
                                >
                                    <option value="">Select Unit</option>
                                    {unitOptions.filter(opt => opt.type === 'Stress Bench').length > 0 && (
                                        <optgroup label="Sheds">
                                            {unitOptions.filter(opt => opt.type === 'Stress Bench').map(opt => (
                                                <option key={`${opt.type}-${opt.value}`} value={`${opt.value}|${opt.type}`}>
                                                    {opt.value}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {unitOptions.filter(opt => opt.type === 'Long Line').length > 0 && (
                                        <optgroup label="Lines">
                                            {unitOptions.filter(opt => opt.type === 'Long Line').map(opt => (
                                                <option key={`${opt.type}-${opt.value}`} value={`${opt.value}|${opt.type}`}>
                                                    {opt.value}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
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
                                    <option value="ShiftA">ShiftA</option>
                                    <option value="ShiftB">ShiftB</option>
                                    <option value="ShiftC">ShiftC</option>
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
                                <label style={labelStyle}>Time of LBC (24h)</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <CustomDropdown
                                            disabled={isReadOnly}
                                            value={(formHeader.timeLbc || '00:00').split(':')[0]}
                                            onChange={(val) => setFormHeader({ ...formHeader, timeLbc: `${val}:${(formHeader.timeLbc || '00:00').split(':')[1]}` })}
                                            options={Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))}
                                            placeholder="HH"
                                        />
                                    </div>
                                    <span style={{ fontWeight: 'bold', color: '#475569' }}>:</span>
                                    <div style={{ flex: 1 }}>
                                        <CustomDropdown
                                            disabled={isReadOnly}
                                            value={(formHeader.timeLbc || '00:00').split(':')[1]}
                                            onChange={(val) => setFormHeader({ ...formHeader, timeLbc: `${(formHeader.timeLbc || '00:00').split(':')[0]}:${val}` })}
                                            options={Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))}
                                            placeholder="MM"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Mould Sequence</label>
                                <select
                                    disabled={isReadOnly}
                                    style={{ ...inputStyle, background: 'white', cursor: isReadOnly ? 'default' : 'pointer' }}
                                    value={formHeader.mouldSequence}
                                    onChange={(e) => setFormHeader({ ...formHeader, mouldSequence: e.target.value })}
                                >
                                    <option value="Preset — A, B, C, D, E, F, G, Z (default)">Preset — A, B, C, D, E, F, G, Z (default)</option>
                                    <option value="Preset — A, B, C, D, E, F, G, H">Preset — A, B, C, D, E, F, G, H</option>
                                    <option value="Numeric — 1, 2, 3, 4...">Numeric — 1, 2, 3, 4...</option>
                                    <option value="Preset — A, B, C, D, E, V, W, X, Y, Z">Preset — A, B, C, D, E, V, W, X, Y, Z</option>
                                </select>
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
                                {stressBenchForms.map((row, rowIndex) => (
                                    <div key={row.id} style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h4 style={{ margin: 0, color: '#1e293b', fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stress Bench Row #{rowIndex + 1}</h4>
                                            {stressBenchForms.length > 1 && !isReadOnly && (
                                                <button
                                                    onClick={() => removeStressBenchRow(rowIndex)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    Remove Row
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 1fr 1.5fr 1fr 0.8fr 0.9fr', gap: '12px', alignItems: 'end' }}>
                                            <div>
                                                <label style={labelStyle}>Chamber No.</label>
                                                <input
                                                    type="number"
                                                    disabled={isReadOnly}
                                                    value={row.chamberNo}
                                                    onChange={(e) => updateStressBenchRow(rowIndex, 'chamberNo', e.target.value)}
                                                    onKeyDown={handleKeyDownStress}
                                                    style={{ ...inputStyle, background: 'white' }}
                                                    placeholder="No."
                                                />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Bench No.</label>
                                                <input
                                                    type="text"
                                                    disabled={isReadOnly}
                                                    value={row.singleNo}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        updateStressBenchRow(rowIndex, 'singleNo', val);
                                                        
                                                        const firstBench = val.split(',')[0]?.trim();
                                                        if (firstBench) {
                                                            const details = getBenchMasterDetails(firstBench);
                                                            if (details && details.moulds > 0) {
                                                                updateStressBenchRow(rowIndex, 'mouldsPerBench', details.moulds);
                                                                if (details.sleeperType) {
                                                                    const isPnC = details.sleeperType.toLowerCase().includes('pnc');
                                                                    const category = isPnC ? 'Turnout' : 'Mainline';
                                                                    updateStressBenchRow(rowIndex, 'sleeperCategory', category);
                                                                    
                                                                    const options = sleeperTypesByCategory[category] || [];
                                                                    const matchedDrawing = options.find(opt => opt.includes(details.sleeperType) || details.sleeperType.includes(opt.split(': ')[1]));
                                                                    if (matchedDrawing) {
                                                                        updateStressBenchRow(rowIndex, 'sleeperType', matchedDrawing);
                                                                    } else if (allSleeperTypes.includes(details.sleeperType)) {
                                                                        updateStressBenchRow(rowIndex, 'sleeperType', details.sleeperType);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    onKeyDown={handleKeyDownStress}
                                                    style={{ ...inputStyle, background: 'white' }}
                                                    placeholder="e.g. 12, 13"
                                                />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <label style={labelStyle}>Sleeper Category</label>
                                                <CustomDropdown
                                                    disabled={isReadOnly}
                                                    value={row.sleeperCategory}
                                                    onChange={(newCategory) => {
                                                        updateStressBenchRow(rowIndex, 'sleeperCategory', newCategory);
                                                        updateStressBenchRow(rowIndex, 'sleeperType', '');
                                                        updateStressBenchRow(rowIndex, 'turnoutSelectedSleepers', { approach: [], turnout: [], exit: [] });
                                                    }}
                                                    options={['Mainline', 'Turnout']}
                                                    bold={true}
                                                />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <label style={labelStyle}>Drawing No.</label>
                                                <CustomDropdown
                                                    disabled={isReadOnly}
                                                    value={row.sleeperType}
                                                    onChange={(val) => {
                                                        updateStressBenchRow(rowIndex, 'sleeperType', val);
                                                        updateStressBenchRow(rowIndex, 'turnoutSelectedSleepers', { approach: [], turnout: [], exit: [] });
                                                    }}
                                                    options={getDrawingOptions(row.sleeperCategory)}
                                                    placeholder="Select Drawing No."
                                                    bold={true}
                                                />
                                            </div>
                                            <div style={{ visibility: row.sleeperCategory === 'Turnout' ? 'hidden' : 'visible' }}>
                                                <label style={labelStyle}>Moulds/Bench</label>
                                                <input
                                                    type="number"
                                                    disabled={isReadOnly}
                                                    value={row.mouldsPerBench}
                                                    onChange={(e) => updateStressBenchRow(rowIndex, 'mouldsPerBench', e.target.value)}
                                                    style={{ ...inputStyle, background: 'white' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Total Sleepers</label>
                                                <input
                                                    type="number"
                                                    readOnly
                                                    value={(() => {
                                                        if (row.sleeperCategory === 'Turnout') {
                                                            return (row.turnoutSelectedSleepers?.approach?.length || 0)
                                                                 + (row.turnoutSelectedSleepers?.turnout?.length || 0)
                                                                 + (row.turnoutSelectedSleepers?.exit?.length || 0);
                                                        }
                                                        const cnt = row.singleNo ? row.singleNo.toString().split(',').filter(s => s.trim()).length : 0;
                                                        return cnt * (parseInt(row.mouldsPerBench) || 0);
                                                    })()}
                                                    style={{ ...inputStyle, background: '#f1f5f9', color: '#42818c', fontWeight: '700', cursor: 'default' }}
                                                />
                                            </div>
                                            <div style={{ visibility: row.sleeperCategory === 'Mainline' ? 'hidden' : 'visible' }}>
                                                <label style={labelStyle}>Total RMT</label>
                                                <input
                                                    type="number"
                                                    disabled={isReadOnly}
                                                    value={row.totalRmt}
                                                    onChange={(e) => updateStressBenchRow(rowIndex, 'totalRmt', e.target.value)}
                                                    style={{ ...inputStyle, background: 'white' }}
                                                    placeholder="RMT"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Turnout Sleeper Selection Panels (Global for pooled rows) */}
                                {(() => {
                                    const distinctTurnoutTypes = [...new Set(stressBenchForms.filter(r => r.sleeperCategory === 'Turnout' && r.sleeperType).map(r => r.sleeperType))];
                                    
                                    return distinctTurnoutTypes.map(type => {
                                        const rowIndex = stressBenchForms.findIndex(r => r.sleeperCategory === 'Turnout' && r.sleeperType === type);
                                        const row = stressBenchForms[rowIndex];
                                        const cfg = turnoutSleeperConfig[type];
                                        if (!cfg) return null;

                                        const increaseSleeper = (section, id) => {
                                            const current = row.turnoutSelectedSleepers[section] || [];
                                            const updatedSection = [...current, id];
                                            updateStressBenchRow(rowIndex, 'turnoutSelectedSleepers', {
                                                ...row.turnoutSelectedSleepers,
                                                [section]: updatedSection
                                            });
                                        };

                                        const decreaseSleeper = (section, id) => {
                                            const current = row.turnoutSelectedSleepers[section] || [];
                                            const index = current.indexOf(id);
                                            if (index !== -1) {
                                                const updatedSection = [...current];
                                                updatedSection.splice(index, 1);
                                                updateStressBenchRow(rowIndex, 'turnoutSelectedSleepers', {
                                                    ...row.turnoutSelectedSleepers,
                                                    [section]: updatedSection
                                                });
                                            }
                                        };

                                        const selectAll = (section) => {
                                            updateStressBenchRow(rowIndex, 'turnoutSelectedSleepers', {
                                                ...row.turnoutSelectedSleepers,
                                                [section]: [...cfg[section]]
                                            });
                                        };

                                        const deselectAll = (section) => {
                                            updateStressBenchRow(rowIndex, 'turnoutSelectedSleepers', {
                                                ...row.turnoutSelectedSleepers,
                                                [section]: []
                                            });
                                        };

                                        const sectionBtnStyle = {
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            background: 'white',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            color: '#475569'
                                        };

                                        const renderSection = (label, sectionKey) => (
                                            <div style={{ marginBottom: '18px' }} key={sectionKey}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', minWidth: '80px' }}>{label}</span>
                                                    {!isReadOnly && (
                                                        <>
                                                            <button style={sectionBtnStyle} onClick={() => selectAll(sectionKey)}>Select All</button>
                                                            <button style={sectionBtnStyle} onClick={() => deselectAll(sectionKey)}>Deselect All</button>
                                                        </>
                                                    )}
                                                    <span style={{ fontSize: '12px', color: '#42818c', fontWeight: '600' }}>
                                                        {row.turnoutSelectedSleepers[sectionKey]?.length || 0} selected
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {cfg[sectionKey].map(id => {
                                                        const qty = row.turnoutSelectedSleepers[sectionKey]?.filter(x => x === id).length || 0;
                                                        const isSelected = qty > 0;
                                                        
                                                        return (
                                                            <div
                                                                key={id}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    borderRadius: '8px',
                                                                    border: isSelected ? '1.5px solid #42818c' : '1.5px solid #e2e8f0',
                                                                    background: isSelected ? '#e6f4f5' : '#fff',
                                                                    fontSize: '13px',
                                                                    fontWeight: '600',
                                                                    color: isSelected ? '#42818c' : '#475569',
                                                                    transition: 'all 0.15s',
                                                                    userSelect: 'none',
                                                                    overflow: 'hidden'
                                                                }}
                                                            >
                                                                {/* Left side: Decrement */}
                                                                <div
                                                                    style={{
                                                                        padding: '5px 8px 5px 10px',
                                                                        cursor: isReadOnly ? 'default' : 'pointer',
                                                                        borderRight: isSelected ? '1.5px solid #42818c' : '1.5px solid #e2e8f0',
                                                                        background: isSelected ? '#d9edef' : 'transparent',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                    onClick={() => !isReadOnly && decreaseSleeper(sectionKey, id)}
                                                                    title="Click to decrease quantity"
                                                                >
                                                                    {!isReadOnly && <span style={{ fontSize: '12px', fontWeight: 'bold', color: isSelected ? '#2c5a62' : '#94a3b8' }}>(-)</span>}
                                                                    <span>{id}</span>
                                                                </div>
                                                                
                                                                {/* Right side: Increment */}
                                                                <div
                                                                    style={{
                                                                        padding: '5px 10px 5px 8px',
                                                                        cursor: isReadOnly ? 'default' : 'pointer',
                                                                        background: isSelected ? '#42818c' : '#f1f5f9',
                                                                        color: isSelected ? 'white' : '#94a3b8',
                                                                        fontWeight: '700',
                                                                        fontSize: '11px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '4px',
                                                                        minWidth: '20px'
                                                                    }}
                                                                    onClick={() => !isReadOnly && increaseSleeper(sectionKey, id)}
                                                                    title="Click to increase quantity"
                                                                >
                                                                    <span>{qty}</span>
                                                                    {!isReadOnly && <span style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.8 }}>(+)</span>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );

                                        return (
                                            <div key={type} style={{ background: 'white', padding: '20px 24px', borderRadius: '14px', border: '1px solid #e2e8f0', marginTop: '16px', marginBottom: '16px' }}>
                                                <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b', marginBottom: '18px' }}>
                                                    Select Sleepers for Turnout
                                                    <span style={{ marginLeft: '12px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                                        — {type}
                                                    </span>
                                                </div>
                                                {renderSection('Approach', 'approach')}
                                                {renderSection('Turnout', 'turnout')}
                                                {renderSection('Exit', 'exit')}
                                            </div>
                                        );
                                    });
                                })()}

                                {/* Multi-row entry action buttons */}
                                {!isReadOnly && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '24px' }}>
                                        <button
                                            onClick={addStressBenchRow}
                                            style={{
                                                background: 'transparent',
                                                color: '#42818c',
                                                border: '2px solid #42818c',
                                                padding: '10px 20px',
                                                borderRadius: '10px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => { e.target.style.background = '#e6f4f5'; }}
                                            onMouseOut={e => { e.target.style.background = 'transparent'; }}
                                        >
                                            + Add Row
                                        </button>
                                        <button
                                            onClick={handleAddStressBench}
                                            style={{
                                                background: editingEntryId ? '#0261c7ff' : '#42818c',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 24px',
                                                borderRadius: '10px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 10px rgba(66, 129, 140, 0.2)'
                                            }}
                                        >
                                            {editingEntryId ? 'Update Entry' : 'Add Entries to Table'}
                                        </button>
                                    </div>
                                )}

                                {stressBenchEntries.length > 0 && (
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '40px' }}>S.No.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '90px' }}>Chamber</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '80px' }}>Bench No.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '100px' }}>Category</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px' }}>Drawing No.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '250px' }}>SLEEPER NUMBERS</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '90px' }}>Moulds/B.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '100px' }}>Total Sleepers</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '90px' }}>Total RMT</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '80px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stressBenchEntries.map((entry, index) => {
                                                    const totalSleepers = entry.sleepers
                                                        ? entry.sleepers.length
                                                        : (parseInt(entry.mouldsPerBench) || 0);
                                                    return (
                                                        <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '12px 8px', color: '#64748b', fontSize: '14px' }}>{index + 1}</td>
                                                            <td style={{ padding: '12px 8px', fontWeight: '700', color: '#115e59' }}>#{entry.chamberNo}</td>
                                                            <td style={{ padding: '12px 8px', fontWeight: '600', color: '#1e293b' }}>{entry.singleNo}</td>
                                                            <td style={{ padding: '12px 8px', color: '#1e293b' }}>{entry.sleeperCategory || '—'}</td>
                                                            <td style={{ padding: '12px 8px', color: '#1e293b' }}>{entry.sleeperType}</td>
                                                            <td style={{ padding: '12px 8px' }}>
                                                                <EditableSleeperTags 
                                                                    sleepers={entry.sleepers || []} 
                                                                    isReadOnly={isReadOnly}
                                                                    onChange={(newSleepers) => {
                                                                        const updatedEntries = stressBenchEntries.map(eItem =>
                                                                            eItem.id === entry.id ? { ...eItem, sleepers: newSleepers } : eItem
                                                                        );
                                                                        setStressBenchEntries(updatedEntries);
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{entry.sleeperCategory === 'Turnout' ? '—' : entry.mouldsPerBench}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '700', color: '#42818c' }}>{totalSleepers}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{entry.totalRmt || '—'}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                                {!isReadOnly && (
                                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                        <button 
                                                                            onClick={() => {
                                                                                setEditingEntryId(entry.id);
                                                                                let turnoutSelected = entry.turnoutSelectedSleepers || { approach: [], turnout: [], exit: [] };
                                                                                if (entry.sleeperCategory === 'Turnout' && entry.sleepers && (!entry.turnoutSelectedSleepers || (entry.turnoutSelectedSleepers.approach.length === 0 && entry.turnoutSelectedSleepers.turnout.length === 0 && entry.turnoutSelectedSleepers.exit.length === 0))) {
                                                                                    const cfg = turnoutSleeperConfig[entry.sleeperType];
                                                                                    if (cfg) {
                                                                                        turnoutSelected = {
                                                                                            approach: entry.sleepers.filter(s => cfg.approach?.includes(s)),
                                                                                            turnout: entry.sleepers.filter(s => cfg.turnout?.includes(s)),
                                                                                            exit: entry.sleepers.filter(s => cfg.exit?.includes(s))
                                                                                        };
                                                                                    }
                                                                                }
                                                                                setStressBenchForms([{ ...entry, sleeperCategory: entry.sleeperCategory || 'Mainline', totalRmt: entry.totalRmt || '', turnoutSelectedSleepers: turnoutSelected }]);
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
                                {longLineForms.map((row, rowIndex) => (
                                    <div key={row.id} style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h4 style={{ margin: 0, color: '#1e293b', fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Long Line Row #{rowIndex + 1}</h4>
                                            {longLineForms.length > 1 && !isReadOnly && (
                                                <button
                                                    onClick={() => removeLongLineRow(rowIndex)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    Remove Row
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.5fr 1fr 0.8fr 0.9fr', gap: '12px', alignItems: 'end' }}>
                                            <div>
                                                <label style={labelStyle}>Gang No.</label>
                                                <input
                                                    type="text"
                                                    disabled={isReadOnly}
                                                    value={row.singleNo}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        updateLongLineRow(rowIndex, 'singleNo', val);
                                                        
                                                        const firstGang = val.split(',')[0]?.trim();
                                                        if (firstGang) {
                                                            const details = getLongLineMasterDetails(firstGang);
                                                            if (details && details.moulds > 0) {
                                                                updateLongLineRow(rowIndex, 'mouldsPerGang', details.moulds);
                                                                if (details.sleeperType) {
                                                                    updateLongLineRow(rowIndex, 'sleeperCategory', 'Mainline');
                                                                    const options = sleeperTypesByCategory['Mainline'] || [];
                                                                    const matchedDrawing = options.find(opt => opt.includes(details.sleeperType) || details.sleeperType.includes(opt.split(': ')[1]));
                                                                    if (matchedDrawing) {
                                                                        updateLongLineRow(rowIndex, 'sleeperType', matchedDrawing);
                                                                    } else if (allSleeperTypes.includes(details.sleeperType)) {
                                                                        updateLongLineRow(rowIndex, 'sleeperType', details.sleeperType);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    onKeyDown={handleKeyDownLongLine}
                                                    style={{ ...inputStyle, background: 'white' }}
                                                    placeholder="e.g. 12, 13"
                                                />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <label style={labelStyle}>Sleeper Category</label>
                                                <CustomDropdown
                                                    disabled={isReadOnly}
                                                    value={row.sleeperCategory}
                                                    onChange={(newCategory) => {
                                                        updateLongLineRow(rowIndex, 'sleeperCategory', newCategory);
                                                        updateLongLineRow(rowIndex, 'sleeperType', '');
                                                        updateLongLineRow(rowIndex, 'turnoutSelectedSleepers', { approach: [], turnout: [], exit: [] });
                                                    }}
                                                    options={['Mainline']}
                                                    bold={true}
                                                />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <label style={labelStyle}>Drawing No.</label>
                                                <CustomDropdown
                                                    disabled={isReadOnly}
                                                    value={row.sleeperType}
                                                    onChange={(val) => {
                                                        updateLongLineRow(rowIndex, 'sleeperType', val);
                                                        updateLongLineRow(rowIndex, 'turnoutSelectedSleepers', { approach: [], turnout: [], exit: [] });
                                                    }}
                                                    options={getDrawingOptions(row.sleeperCategory)}
                                                    placeholder="Select Drawing No."
                                                    bold={true}
                                                />
                                            </div>
                                            <div style={{ visibility: row.sleeperCategory === 'Turnout' ? 'hidden' : 'visible' }}>
                                                <label style={labelStyle}>Moulds/Gang</label>
                                                <input
                                                    type="number"
                                                    disabled={isReadOnly}
                                                    value={row.mouldsPerGang}
                                                    onChange={(e) => updateLongLineRow(rowIndex, 'mouldsPerGang', e.target.value)}
                                                    style={{ ...inputStyle, background: 'white' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Total Sleepers</label>
                                                <input
                                                    type="number"
                                                    readOnly
                                                    value={(() => {
                                                        if (row.sleeperCategory === 'Turnout') {
                                                            return (row.turnoutSelectedSleepers?.approach?.length || 0)
                                                                 + (row.turnoutSelectedSleepers?.turnout?.length || 0)
                                                                 + (row.turnoutSelectedSleepers?.exit?.length || 0);
                                                        }
                                                        const cnt = row.singleNo ? row.singleNo.toString().split(',').filter(s => s.trim()).length : 0;
                                                        return cnt * (parseInt(row.mouldsPerGang) || 0);
                                                    })()}
                                                    style={{ ...inputStyle, background: '#f1f5f9', color: '#42818c', fontWeight: '700', cursor: 'default' }}
                                                />
                                            </div>
                                            <div style={{ visibility: row.sleeperCategory === 'Mainline' ? 'hidden' : 'visible' }}>
                                                <label style={labelStyle}>Total RMT</label>
                                                <input
                                                    type="number"
                                                    disabled={isReadOnly}
                                                    value={row.totalRmt}
                                                    onChange={(e) => updateLongLineRow(rowIndex, 'totalRmt', e.target.value)}
                                                    style={{ ...inputStyle, background: 'white' }}
                                                    placeholder="RMT"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Turnout Sleeper Selection Panels (Global for pooled rows) for Long Line */}
                                {(() => {
                                    const distinctTurnoutTypes = [...new Set(longLineForms.filter(r => r.sleeperCategory === 'Turnout' && r.sleeperType).map(r => r.sleeperType))];
                                    
                                    return distinctTurnoutTypes.map(type => {
                                        const rowIndex = longLineForms.findIndex(r => r.sleeperCategory === 'Turnout' && r.sleeperType === type);
                                        const row = longLineForms[rowIndex];
                                        const cfg = turnoutSleeperConfig[type];
                                        if (!cfg) return null;

                                        const increaseSleeper = (section, id) => {
                                            const current = row.turnoutSelectedSleepers[section] || [];
                                            const updatedSection = [...current, id];
                                            updateLongLineRow(rowIndex, 'turnoutSelectedSleepers', {
                                                ...row.turnoutSelectedSleepers,
                                                [section]: updatedSection
                                            });
                                        };

                                        const decreaseSleeper = (section, id) => {
                                            const current = row.turnoutSelectedSleepers[section] || [];
                                            const index = current.indexOf(id);
                                            if (index !== -1) {
                                                const updatedSection = [...current];
                                                updatedSection.splice(index, 1);
                                                updateLongLineRow(rowIndex, 'turnoutSelectedSleepers', {
                                                    ...row.turnoutSelectedSleepers,
                                                    [section]: updatedSection
                                                });
                                            }
                                        };

                                        const selectAll = (section) => {
                                            updateLongLineRow(rowIndex, 'turnoutSelectedSleepers', {
                                                ...row.turnoutSelectedSleepers,
                                                [section]: [...cfg[section]]
                                            });
                                        };

                                        const deselectAll = (section) => {
                                            updateLongLineRow(rowIndex, 'turnoutSelectedSleepers', {
                                                ...row.turnoutSelectedSleepers,
                                                [section]: []
                                            });
                                        };

                                        const sectionBtnStyle = {
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            background: 'white',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            color: '#475569'
                                        };

                                        const renderSection = (label, sectionKey) => (
                                            <div style={{ marginBottom: '18px' }} key={sectionKey}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', minWidth: '80px' }}>{label}</span>
                                                    {!isReadOnly && (
                                                        <>
                                                            <button style={sectionBtnStyle} onClick={() => selectAll(sectionKey)}>Select All</button>
                                                            <button style={sectionBtnStyle} onClick={() => deselectAll(sectionKey)}>Deselect All</button>
                                                        </>
                                                    )}
                                                    <span style={{ fontSize: '12px', color: '#42818c', fontWeight: '600' }}>
                                                        {row.turnoutSelectedSleepers[sectionKey]?.length || 0} selected
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {cfg[sectionKey].map(id => {
                                                        const qty = row.turnoutSelectedSleepers[sectionKey]?.filter(x => x === id).length || 0;
                                                        const isSelected = qty > 0;
                                                        
                                                        return (
                                                            <div
                                                                key={id}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    borderRadius: '8px',
                                                                    border: isSelected ? '1.5px solid #42818c' : '1.5px solid #e2e8f0',
                                                                    background: isSelected ? '#e6f4f5' : '#fff',
                                                                    fontSize: '13px',
                                                                    fontWeight: '600',
                                                                    color: isSelected ? '#42818c' : '#475569',
                                                                    transition: 'all 0.15s',
                                                                    userSelect: 'none',
                                                                    overflow: 'hidden'
                                                                }}
                                                            >
                                                                {/* Left side: Decrement */}
                                                                <div
                                                                    style={{
                                                                        padding: '5px 8px 5px 10px',
                                                                        cursor: isReadOnly ? 'default' : 'pointer',
                                                                        borderRight: isSelected ? '1.5px solid #42818c' : '1.5px solid #e2e8f0',
                                                                        background: isSelected ? '#d9edef' : 'transparent',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                    onClick={() => !isReadOnly && decreaseSleeper(sectionKey, id)}
                                                                    title="Click to decrease quantity"
                                                                >
                                                                    {!isReadOnly && <span style={{ fontSize: '12px', fontWeight: 'bold', color: isSelected ? '#2c5a62' : '#94a3b8' }}>(-)</span>}
                                                                    <span>{id}</span>
                                                                </div>
                                                                
                                                                {/* Right side: Increment */}
                                                                <div
                                                                    style={{
                                                                        padding: '5px 10px 5px 8px',
                                                                        cursor: isReadOnly ? 'default' : 'pointer',
                                                                        background: isSelected ? '#42818c' : '#f1f5f9',
                                                                        color: isSelected ? 'white' : '#94a3b8',
                                                                        fontWeight: '700',
                                                                        fontSize: '11px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '4px',
                                                                        minWidth: '20px'
                                                                    }}
                                                                    onClick={() => !isReadOnly && increaseSleeper(sectionKey, id)}
                                                                    title="Click to increase quantity"
                                                                >
                                                                    <span>{qty}</span>
                                                                    {!isReadOnly && <span style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.8 }}>(+)</span>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );

                                        return (
                                            <div key={type} style={{ background: 'white', padding: '20px 24px', borderRadius: '14px', border: '1px solid #e2e8f0', marginTop: '16px', marginBottom: '24px' }}>
                                                <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b', marginBottom: '18px' }}>
                                                    Select Sleepers for Turnout
                                                    <span style={{ marginLeft: '12px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                                        — {type}
                                                    </span>
                                                </div>
                                                {renderSection('Approach', 'approach')}
                                                {renderSection('Turnout', 'turnout')}
                                                {renderSection('Exit', 'exit')}
                                            </div>
                                        );
                                    });
                                })()}

                                {/* Multi-row entry action buttons for Long Line */}
                                {!isReadOnly && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '24px' }}>
                                        <button
                                            onClick={addLongLineRow}
                                            style={{
                                                background: 'transparent',
                                                color: '#42818c',
                                                border: '2px solid #42818c',
                                                padding: '10px 20px',
                                                borderRadius: '10px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => { e.target.style.background = '#e6f4f5'; }}
                                            onMouseOut={e => { e.target.style.background = 'transparent'; }}
                                        >
                                            + Add Row
                                        </button>
                                        <button
                                            onClick={handleAddLongLine}
                                            style={{
                                                background: editingEntryId ? '#0261c7ff' : '#42818c',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 24px',
                                                borderRadius: '10px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 10px rgba(66, 129, 140, 0.2)'
                                            }}
                                        >
                                            {editingEntryId ? 'Update Entry' : 'Add Entries to Table'}
                                        </button>
                                    </div>
                                )}

                                {longLineEntries.length > 0 && (
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '50px' }}>S.No.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '120px' }}>Gang No.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '120px' }}>Category</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px' }}>Drawing No.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '250px' }}>SLEEPER NUMBERS</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '110px' }}>Moulds/G.</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '130px' }}>Total Sleepers</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '110px' }}>Total RMT</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '100px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {longLineEntries.map((entry, index) => {
                                                    const totalSleepers = entry.sleepers 
                                                        ? entry.sleepers.length 
                                                        : (entry.entryMode === 'range' ? (parseInt(entry.toNo) - parseInt(entry.fromNo) + 1) * (parseInt(entry.mouldsPerGang) || 0) : (parseInt(entry.mouldsPerGang) || 0));
                                                    
                                                    const gangDisplay = entry.entryMode === 'range' ? `${entry.fromNo} - ${entry.toNo}` : entry.singleNo;

                                                    return (
                                                        <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '12px 8px', color: '#64748b', fontSize: '14px' }}>{index + 1}</td>
                                                            <td style={{ padding: '12px 8px', fontWeight: '600', color: '#1e293b' }}>{gangDisplay}</td>
                                                            <td style={{ padding: '12px 8px', color: '#1e293b' }}>{entry.sleeperCategory || '—'}</td>
                                                            <td style={{ padding: '12px 8px', color: '#1e293b' }}>{entry.sleeperType}</td>
                                                            <td style={{ padding: '12px 8px' }}>
                                                                <EditableSleeperTags 
                                                                    sleepers={entry.sleepers || []} 
                                                                    isReadOnly={isReadOnly}
                                                                    onChange={(newSleepers) => {
                                                                        const updatedEntries = longLineEntries.map(eItem =>
                                                                            eItem.id === entry.id ? { ...eItem, sleepers: newSleepers } : eItem
                                                                        );
                                                                        setLongLineEntries(updatedEntries);
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{entry.sleeperCategory === 'Turnout' ? '—' : entry.mouldsPerGang}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '700', color: '#42818c' }}>{totalSleepers}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{entry.totalRmt || '—'}</td>
                                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                                {!isReadOnly && (
                                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                        <button 
                                                                            onClick={() => {
                                                                                setEditingEntryId(entry.id);
                                                                                let turnoutSelected = entry.turnoutSelectedSleepers || { approach: [], turnout: [], exit: [] };
                                                                                if (entry.sleeperCategory === 'Turnout' && entry.sleepers && (!entry.turnoutSelectedSleepers || (entry.turnoutSelectedSleepers.approach.length === 0 && entry.turnoutSelectedSleepers.turnout.length === 0 && entry.turnoutSelectedSleepers.exit.length === 0))) {
                                                                                    const cfg = turnoutSleeperConfig[entry.sleeperType];
                                                                                    if (cfg) {
                                                                                        turnoutSelected = {
                                                                                            approach: entry.sleepers.filter(s => cfg.approach?.includes(s)),
                                                                                            turnout: entry.sleepers.filter(s => cfg.turnout?.includes(s)),
                                                                                            exit: entry.sleepers.filter(s => cfg.exit?.includes(s))
                                                                                        };
                                                                                    }
                                                                                }
                                                                                setLongLineForms([{ ...entry, sleeperCategory: entry.sleeperCategory || 'Mainline', totalRmt: entry.totalRmt || '', turnoutSelectedSleepers: turnoutSelected }]);
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

                                    if (!formHeader.batchNo || formHeader.batchNo.trim() === '') {
                                        return alert('Batch Number is required. Please fill it in Section 1.');
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
                                                            const isTurnout = group.sleeperCategory === 'Turnout';
                                                            const explicitRft = group.totalRmt ? parseFloat(group.totalRmt) : 0;
                                                            const rftToUse = (isTurnout && explicitRft > 0) ? (explicitRft / benchList.length) : (isOriginalBench ? group._originalRft : getBenchMasterDetails(bench).rft);
                                                            
                                                            let finalSleepers = [];
                                                            if (isTurnout && group.sleepers) {
                                                                finalSleepers = [...group.sleepers];
                                                            } else if (isTurnout && group.turnoutSelectedSleepers) {
                                                                const s = group.turnoutSelectedSleepers;
                                                                finalSleepers = [...(s.approach || []), ...(s.turnout || []), ...(s.exit || [])];
                                                            } else {
                                                                finalSleepers = group.sleepers || (isOriginalBench ? (group._originalSleepers || (group._originalSleeperList ? group._originalSleeperList.map(s=>s.sleeperNo) : [])) : generateSleeperIds(bench, group.mouldsPerBench));
                                                            }
                                                            finalSleepers = finalSleepers || [];

                                                            const originalSleeperList = (isOriginalBench && !isTurnout) ? group._originalSleeperList : null;
                                                            
                                                            return {
                                                                id: group.id || 0,
                                                                benchNo: parseInt(bench) || 0,
                                                                sleeperType: group.sleeperType,
                                                                mouldPerBench: parseInt(group.mouldsPerBench) || 0,
                                                                rft: rftToUse,
                                                                sleeperCategory: group.sleeperCategory || 'Mainline',
                                                                totalSleepers: finalSleepers.length,
                                                                sleepers: finalSleepers,
                                                                sleeperList: originalSleeperList || finalSleepers.map(s => ({ id: 0, sleeperNo: s }))
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

                                                const isTurnout = entry.sleeperCategory === 'Turnout';
                                                
                                                let sleepers = [];
                                                if (isTurnout && entry.sleepers) {
                                                    sleepers = [...entry.sleepers];
                                                } else if (isTurnout && entry.turnoutSelectedSleepers) {
                                                    const s = entry.turnoutSelectedSleepers;
                                                    sleepers = [...(s.approach || []), ...(s.turnout || []), ...(s.exit || [])];
                                                } else {
                                                    sleepers = entry.sleepers || entry._originalSleepers || (entry._originalSleeperList ? entry._originalSleeperList.map(s=>s.sleeperNo) : []) || [];
                                                    if (sleepers.length === 0) {
                                                        if (mode === 'RANGE' && gangFrom && gangTo) {
                                                            for (let i = gangFrom; i <= gangTo; i++) {
                                                                sleepers.push(...generateSleeperIds(i.toString(), mouldsPerGang));
                                                            }
                                                        } else if (mode === 'SINGLE' && gangNo) {
                                                            sleepers = generateSleeperIds(gangNo.toString(), mouldsPerGang);
                                                        }
                                                    }
                                                }
                                                sleepers = sleepers || [];
                                                const explicitRft = entry.totalRmt ? parseFloat(entry.totalRmt) : 0;

                                                return {
                                                    id: entry.originalId || 0,
                                                    mode,
                                                    gangFrom,
                                                    gangTo,
                                                    gangNo,
                                                    sleeperType: entry.sleeperType,
                                                    mouldsPerGang,
                                                    sleeperCategory: entry.sleeperCategory || 'Mainline',
                                                    totalSleepers: sleepers.length,
                                                    rft: explicitRft,
                                                    sleepers,
                                                    sleeperList: (entry._originalSleeperList && !isTurnout) ? entry._originalSleeperList : sleepers.map(s => ({ id: 0, sleeperNo: s }))
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
