import React, { useState, useEffect } from 'react';

const ShiftProductionForm = ({ onBack, onSave, lastBatchNumber, initialData }) => {
    const AVAILABLE_SHEDS = [
        { name: 'Stress Bench A', type: 'Twin', mouldsPerBench: 8 },
        { name: 'Stress Bench B', type: 'Single', mouldsPerBench: 4 },
        { name: 'Stress Bench C', type: 'Twin', mouldsPerBench: 8 },
    ];
    const AVAILABLE_LINES = [
        { name: 'Long Line 1', type: 'Long Line', mouldsPerGang: 8 },
        { name: 'Long Line 2', type: 'Long Line', mouldsPerGang: 8 },
    ];

    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().split(' ')[0].substring(0, 5);
    };

    const generateSleeperIds = (benchNo, count) => {
        if (!benchNo || !count) return [];
        return Array.from({ length: count }).map((_, i) => `${benchNo}${String.fromCharCode(65 + i)}`);
    };

    const getBenchMasterDetails = (benchNo) => {
        if (!benchNo) return { moulds: 0, rft: 0, sleeperNames: [], sleeperType: '' };
        // Simulated lookup based on typical data - in production this would fetch from a master state
        const moulds = 8;
        const isPnC = parseInt(benchNo) % 5 === 0;
        const rft = isPnC ? 2.5 : 0;
        const sleeperType = isPnC ? 'RT-8746 (PnC)' : 'RT-8521';
        const sleeperNames = Array.from({ length: moulds }).map((_, i) => `${benchNo}${String.fromCharCode(65 + i)}`);
        return { moulds, rft, sleeperNames, isPnC, sleeperType };
    };

    const [activeSections, setActiveSections] = useState({ 1: true, 2: false, 3: false });
    const [plantType, setPlantType] = useState('Stress Bench'); // Stress Bench or Long Line
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

    const [chambers, setChambers] = useState([{
        id: 1,
        chamberNo: '',
        benchGroups: [{ id: Date.now(), benches: [''], mouldsPerBench: 8, sleeperType: '' }]
    }]);

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
        if (initialData) {
            setPlantType(initialData.plantType === 'LONG_LINE' ? 'Long Line' : 'Stress Bench');
            
            // Map header
            const [d, m, y] = (initialData.castingDate || '').split('/');
            setFormHeader({
                unit: initialData.productionUnit || '',
                shedType: initialData.plantType === 'LONG_LINE' ? 'Long Line' : (AVAILABLE_SHEDS.find(s => s.name === initialData.productionUnit)?.type || 'Twin'),
                date: (y && m && d) ? `${y}-${m}-${d}` : new Date().toISOString().split('T')[0],
                shift: initialData.shift || 'Day Shift',
                batchNo: initialData.batchNumber || '',
                mixDesign: initialData.mixDesignReference || 'M60 - Design A (Active)',
                timeLbc: (initialData.lbcTime || getCurrentTime())?.substring(0, 5),
                remarks: initialData.remarks || ''
            });

            // Map chambers for Stress Bench
            if (initialData.plantType === 'STRESS' && initialData.chambers) {
                const mappedChambers = initialData.chambers.map((c, cIdx) => ({
                    id: cIdx + 1,
                    chamberNo: c.chamberNo,
                    benchGroups: c.benchGroups ? c.benchGroups.map((g, gIdx) => ({
                        id: Date.now() + cIdx + gIdx,
                        benches: [g.benchNo.toString()],
                        mouldsPerBench: g.mouldPerBench,
                        sleeperType: g.sleeperType
                    })) : []
                }));
                if (mappedChambers.length > 0) setChambers(mappedChambers);
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

    const isGroupPnC = (group) => {
        return group.sleeperType && group.sleeperType.toLowerCase().includes('pnc');
    };

    const isBenchDuplicate = (benchNo, currentChamberId, currentGroupId, currentBenchIdx) => {
        if (!benchNo) return false;
        let count = 0;
        chambers.forEach(c => {
            c.benchGroups.forEach(g => {
                g.benches.forEach((b, idx) => {
                    if (b === benchNo) {
                        if (c.id === currentChamberId && g.id === currentGroupId && idx === currentBenchIdx) {
                            // self
                        } else {
                            count++;
                        }
                    }
                });
            });
        });
        return count > 0;
    };

    const toggleSection = (id) => {
        setActiveSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const addChamber = () => {
        setChambers([...chambers, {
            id: Date.now(),
            chamberNo: '',
            benchGroups: [{ id: Date.now() + 1, benches: [''], mouldsPerBench: formHeader.shedType === 'Single' ? 4 : 8, sleeperType: '' }]
        }]);
    };

    const removeChamber = (index) => {
        const newChambers = [...chambers];
        if (newChambers.length <= 1) return;
        newChambers.splice(index, 1);
        setChambers(newChambers);
    };

    const updateChamberNo = (index, value) => {
        const val = parseInt(value);
        if (!isNaN(val) && val < 0) return;
        const newChambers = [...chambers];
        newChambers[index].chamberNo = value;
        setChambers(newChambers);
    };

    const addBenchGroup = (cIdx) => {
        const newChambers = [...chambers];
        newChambers[cIdx].benchGroups.push({
            id: Date.now(),
            benches: [''],
            mouldsPerBench: formHeader.shedType === 'Single' ? 4 : 8,
            sleeperType: ''
        });
        setChambers(newChambers);
    };

    const removeBenchGroup = (cIdx, gIdx) => {
        const newChambers = [...chambers];
        if (newChambers[cIdx].benchGroups.length <= 1) return;
        newChambers[cIdx].benchGroups.splice(gIdx, 1);
        setChambers(newChambers);
    };

    const updateBenchInGroup = (cIdx, gIdx, bIdx, value) => {
        const newChambers = [...chambers];
        const group = newChambers[cIdx].benchGroups[gIdx];
        group.benches[bIdx] = value;

        // Auto determine sleeper type from master
        const types = group.benches.map(b => getBenchMasterDetails(b).sleeperType).filter(t => t);
        const uniqueTypes = [...new Set(types)];
        if (uniqueTypes.length > 1) {
            group.error = 'Mixed sleeper types in same group';
            group.sleeperType = 'Error';
        } else {
            group.error = null;
            group.sleeperType = uniqueTypes[0] || '';
        }

        setChambers(newChambers);
    };

    const removeBenchFromGroup = (cIdx, gIdx, bIdx) => {
        const newChambers = [...chambers];
        const group = newChambers[cIdx].benchGroups[gIdx];
        group.benches.splice(bIdx, 1);

        // Recalculate group error/type after removal from master
        const types = group.benches.map(b => getBenchMasterDetails(b).sleeperType).filter(t => t);
        const uniqueTypes = [...new Set(types)];
        if (uniqueTypes.length > 1) {
            group.error = 'Mixed sleeper types in same group';
            group.sleeperType = 'Error';
        } else {
            group.error = null;
            group.sleeperType = uniqueTypes[0] || '';
        }

        setChambers(newChambers);
    };

    const addBenchToGroup = (cIdx, gIdx) => {
        const newChambers = [...chambers];
        newChambers[cIdx].benchGroups[gIdx].benches.push('');
        setChambers(newChambers);
    };

    const updateMouldsInGroup = (cIdx, gIdx, value) => {
        const newChambers = [...chambers];
        const val = parseInt(value) || 0;
        newChambers[cIdx].benchGroups[gIdx].mouldsPerBench = Math.max(0, val);
        setChambers(newChambers);
    };

    const calculateTotalCast = () => {
        if (plantType === 'Stress Bench') {
            return chambers.reduce((acc, c) => {
                return acc + c.benchGroups.reduce((gAcc, g) => {
                    const validBenches = g.benches.filter(b => b.trim()).length;
                    return gAcc + (validBenches * g.mouldsPerBench);
                }, 0);
            }, 0);
        } else {
            return longLineEntries.reduce((acc, e) => {
                const count = e.entryMode === 'range' ? (parseInt(e.toNo) - parseInt(e.fromNo) + 1) : 1;
                return acc + (count * e.mouldsPerGang);
            }, 0);
        }
    };

    const calculateTotalRFT = () => {
        if (plantType === 'Stress Bench') {
            return chambers.reduce((acc, c) => {
                return acc + c.benchGroups.reduce((gAcc, g) => {
                    return gAcc + g.benches.reduce((bAcc, b) => bAcc + getBenchMasterDetails(b).rft, 0);
                }, 0);
            }, 0);
        }
        return 0;
    };

    const getProductionBreakdown = () => {
        const counts = {};
        if (plantType === 'Stress Bench') {
            chambers.forEach(c => {
                c.benchGroups.forEach(g => {
                    if (g.sleeperType && g.sleeperType !== 'Error') {
                        const validBenches = g.benches.filter(b => b.trim()).length;
                        counts[g.sleeperType] = (counts[g.sleeperType] || 0) + (validBenches * g.mouldsPerBench);
                    }
                });
            });
        } else {
            longLineEntries.forEach(e => {
                const count = e.entryMode === 'range' ? (parseInt(e.toNo) - parseInt(e.fromNo) + 1) : 1;
                counts[e.sleeperType] = (counts[e.sleeperType] || 0) + (count * e.mouldsPerGang);
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
                                                setFormHeader({ ...formHeader, unit: AVAILABLE_SHEDS[0].name, shedType: AVAILABLE_SHEDS[0].type });
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
                                                setFormHeader({ ...formHeader, unit: AVAILABLE_LINES[0].name, shedType: 'Long Line' });
                                            }}
                                            style={radioStyle}
                                        />
                                        Long Line
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>{plantType === 'Stress Bench' ? 'Production Unit (Stress Bench No.)' : 'Production Unit (Gang No.)'}</label>
                                <select
                                    style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}
                                    value={formHeader.unit}
                                    onChange={(e) => {
                                        const selectedUnit = e.target.value;
                                        const unitData = plantType === 'Stress Bench'
                                            ? AVAILABLE_SHEDS.find(s => s.name === selectedUnit)
                                            : AVAILABLE_LINES.find(l => l.name === selectedUnit);
                                        setFormHeader({
                                            ...formHeader,
                                            unit: selectedUnit,
                                            shedType: unitData ? unitData.type : ''
                                        });
                                    }}
                                >
                                    <option value="">Select Unit</option>
                                    {(plantType === 'Stress Bench' ? AVAILABLE_SHEDS : AVAILABLE_LINES).map(u => (
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
                                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Map multiple bench groups to steam chambers. Each chamber requires individual monitoring.</p>
                                    <button onClick={addChamber} style={{ background: '#42818c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ Add Chamber</button>
                                </div>

                                {chambers.map((chamber, cIdx) => (
                                    <div key={chamber.id} style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                                            <div style={{ width: '200px' }}>
                                                <label style={labelStyle}>Chamber No.</label>
                                                <input type="number" min="0" value={chamber.chamberNo} onChange={(e) => updateChamberNo(cIdx, e.target.value)} style={{ ...inputStyle, background: 'white' }} placeholder="e.g. 1" />
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Manage Chamber / Benches</div>
                                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                    {chambers.length > 1 && (
                                                        <button
                                                            onClick={() => removeChamber(cIdx)}
                                                            title="Delete this chamber"
                                                            style={{
                                                                background: '#fff5f5',
                                                                color: '#ef4444',
                                                                border: '1px solid #fecaca',
                                                                padding: '8px 16px',
                                                                borderRadius: '8px',
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            🗑 Delete Chamber
                                                        </button>
                                                    )}
                                                    <button onClick={() => addBenchGroup(cIdx)} style={{ background: '#42818c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Bench Group</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ width: '4px', height: '16px', background: '#42818c', borderRadius: '2px' }}></span>
                                                Bench Groups in Chamber
                                            </h4>
                                        </div>

                                        {(() => {
                                            const anyGroupIsPnC = chamber.benchGroups.some(g => isGroupPnC(g));
                                            return (
                                                <>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                                                <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px' }}>Benches Cast</th>
                                                                <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '100px' }}>Count</th>
                                                                <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '200px' }}>Sleeper Type</th>
                                                                <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '120px' }}>Mould per Bench</th>
                                                                {anyGroupIsPnC && (
                                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '100px' }}>RFT (m)</th>
                                                                )}
                                                                <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '60px' }}>Del</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {chamber.benchGroups.map((group, gIdx) => (
                                                                <tr key={group.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                                    <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                            {group.benches.map((bench, bIdx) => {
                                                                                const isDuplicate = isBenchDuplicate(bench, chamber.id, group.id, bIdx);
                                                                                const isMixedError = group.error === 'Mixed sleeper types in same group';
                                                                                return (
                                                                                    <div key={bIdx} style={{ position: 'relative' }}>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={bench}
                                                                                            onChange={(e) => updateBenchInGroup(cIdx, gIdx, bIdx, e.target.value)}
                                                                                            style={{
                                                                                                ...inputStyle,
                                                                                                width: '70px',
                                                                                                padding: '10px',
                                                                                                borderColor: (isDuplicate || isMixedError) ? '#ef4444' : '#cbd5e1',
                                                                                                backgroundColor: (isDuplicate || isMixedError) ? '#fef2f2' : 'white'
                                                                                            }}
                                                                                            placeholder="No."
                                                                                        />
                                                                                        <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={generateSleeperIds(bench, group.mouldsPerBench).join(', ')}>
                                                                                            {generateSleeperIds(bench, group.mouldsPerBench).slice(0, 3).join(',')}{group.mouldsPerBench > 3 ? '...' : ''}
                                                                                        </div>
                                                                                        {isDuplicate && <span style={{ position: 'absolute', bottom: '-14px', left: 0, fontSize: '9px', color: '#ef4444', fontWeight: 'bold' }}>Duplicate</span>}
                                                                                        {group.benches.length > 1 && (
                                                                                            <button
                                                                                                onClick={() => removeBenchFromGroup(cIdx, gIdx, bIdx)}
                                                                                                style={{
                                                                                                    position: 'absolute',
                                                                                                    top: '-8px',
                                                                                                    right: '-8px',
                                                                                                    width: '18px',
                                                                                                    height: '18px',
                                                                                                    borderRadius: '50%',
                                                                                                    background: '#ef4444',
                                                                                                    color: 'white',
                                                                                                    border: 'none',
                                                                                                    fontSize: '10px',
                                                                                                    display: 'flex',
                                                                                                    alignItems: 'center',
                                                                                                    justifyContent: 'center',
                                                                                                    cursor: 'pointer',
                                                                                                    zIndex: 2,
                                                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                                                                }}
                                                                                                title="Remove bench"
                                                                                            >
                                                                                                ×
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                            <button onClick={() => addBenchToGroup(cIdx, gIdx)} style={{ width: '42px', height: '42px', borderRadius: '10px', border: '1px dashed #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '20px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '16px 8px', textAlign: 'center', verticalAlign: 'top' }}>
                                                                        <div style={{ ...inputStyle, background: '#f1f5f9', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '42px' }}>
                                                                            {group.benches.filter(b => b.trim()).length}
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                                                                        <div style={{
                                                                            ...inputStyle,
                                                                            background: group.error ? '#fef2f2' : '#f1f5f9',
                                                                            color: group.error ? '#ef4444' : '#1e293b',
                                                                            fontSize: '13px',
                                                                            fontWeight: '600',
                                                                            minHeight: '42px',
                                                                            display: 'flex',
                                                                            alignItems: 'center'
                                                                        }}>
                                                                            {group.sleeperType || 'Identify...'}
                                                                        </div>
                                                                        {group.error && <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>{group.error}</div>}
                                                                    </td>
                                                                    <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={group.mouldsPerBench}
                                                                            onChange={(e) => updateMouldsInGroup(cIdx, gIdx, e.target.value)}
                                                                            style={{ ...inputStyle, textAlign: 'center', background: 'white', minHeight: '42px' }}
                                                                        />
                                                                    </td>
                                                                    {isGroupPnC(group) && (
                                                                        <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                                                                            <div style={{ ...inputStyle, background: '#f1f5f9', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '42px' }}>
                                                                                {group.benches.reduce((sum, b) => sum + getBenchMasterDetails(b).rft, 0)}
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                    <td style={{ padding: '16px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                                        {chamber.benchGroups.length > 1 && (
                                                                            <button
                                                                                onClick={() => removeBenchGroup(cIdx, gIdx)}
                                                                                title="Delete this bench group"
                                                                                style={{
                                                                                    width: '34px',
                                                                                    height: '34px',
                                                                                    borderRadius: '8px',
                                                                                    border: '1px solid #fecaca',
                                                                                    background: '#fff5f5',
                                                                                    color: '#ef4444',
                                                                                    cursor: 'pointer',
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    fontSize: '15px',
                                                                                    lineHeight: 1,
                                                                                    fontWeight: '700'
                                                                                }}
                                                                                onMouseEnter={e => {
                                                                                    e.currentTarget.style.background = '#fee2e2';
                                                                                    e.currentTarget.style.borderColor = '#ef4444';
                                                                                }}
                                                                                onMouseLeave={e => {
                                                                                    e.currentTarget.style.background = '#fff5f5';
                                                                                    e.currentTarget.style.borderColor = '#fecaca';
                                                                                }}
                                                                            >
                                                                                🗑
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <div style={{ marginTop: '16px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Sleeper Numbers in Chamber:</div>
                                                        <div style={{ fontSize: '11px', color: '#1e293b', lineHeight: '1.4' }}>
                                                            {chamber.benchGroups.flatMap(g =>
                                                                g.benches.flatMap(b => generateSleeperIds(b, g.mouldsPerBench))
                                                            ).filter(Boolean).join(', ')}
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                ))}
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

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', alignItems: 'end' }}>
                                        {longLineForm.entryMode === 'range' ? (
                                            <>
                                                <div>
                                                    <label style={labelStyle}>Gang No. From</label>
                                                    <input type="number" value={longLineForm.fromNo} onChange={(e) => setLongLineForm({ ...longLineForm, fromNo: e.target.value })} style={{ ...inputStyle, background: 'white' }} placeholder="Start" />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Gang No. To</label>
                                                    <input type="number" value={longLineForm.toNo} onChange={(e) => setLongLineForm({ ...longLineForm, toNo: e.target.value })} style={{ ...inputStyle, background: 'white' }} placeholder="End" />
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={labelStyle}>Gang No.</label>
                                                <input type="number" value={longLineForm.singleNo} onChange={(e) => setLongLineForm({ ...longLineForm, singleNo: e.target.value })} style={{ ...inputStyle, background: 'white' }} placeholder="Enter No." />
                                            </div>
                                        )}
                                        <div>
                                            <label style={labelStyle}>Sleeper Type</label>
                                            <select value={longLineForm.sleeperType} onChange={(e) => setLongLineForm({ ...longLineForm, sleeperType: e.target.value })} style={{ ...inputStyle, background: 'white' }}>
                                                <option value="RT-8746">RT-8746</option>
                                                <option value="RT-8521">RT-8521</option>
                                            </select>
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
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px' }}>Gangs</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '100px' }}>Count</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'left', padding: '12px 8px', width: '180px' }}>Sleeper Type</th>
                                                    <th style={{ ...labelStyle, display: 'table-cell', marginBottom: 0, textAlign: 'center', padding: '12px 8px', width: '130px' }}>Moulds/Gang</th>
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
                                    benchGroups: chamber.benchGroups.flatMap(group =>
                                        group.benches.filter(b => b.trim()).map(bench => ({
                                            benchNo: parseInt(bench) || 0,
                                            sleeperType: group.sleeperType,
                                            mouldPerBench: parseInt(group.mouldsPerBench) || 0,
                                            rft: getBenchMasterDetails(bench).rft,
                                            sleepers: generateSleeperIds(bench, group.mouldsPerBench)
                                        }))
                                    )
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
        </div>
    );
};

export default ShiftProductionForm;
