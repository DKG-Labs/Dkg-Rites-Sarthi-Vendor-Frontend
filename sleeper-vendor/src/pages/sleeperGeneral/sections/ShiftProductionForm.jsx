import React, { useState } from 'react';

const ShiftProductionForm = ({ onBack, onSave, lastBatchNumber }) => {
    const [activeSections, setActiveSections] = useState({ 1: true, 2: false, 3: false });
    const [plantType, setPlantType] = useState('Stress Bench'); // Stress Bench or Long Line
    const [formHeader, setFormHeader] = useState({
        unit: 'Shed A',
        date: new Date().toISOString().split('T')[0],
        shift: 'A (08:00 - 20:00)',
        batchNo: lastBatchNumber + 1,
        mixDesign: 'M60 - Design A (Active)',
        timeLbc: ''
    });
    const [chambers, setChambers] = useState([{ id: 1, chamberNo: '', benches: [''], sleeperType: 'RT-8746', sleepersPerBench: 8 }]);
    const [longLineData, setLongLineData] = useState({ sleeperType: 'RT-8746', mode: 'Range', startGang: '', endGang: '', individualGangs: '', sleepersPerGang: 8 });

    const toggleSection = (id) => {
        setActiveSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const addChamber = () => {
        setChambers([...chambers, { id: Date.now(), chamberNo: '', benches: [''], sleeperType: 'RT-8746', sleepersPerBench: 8 }]);
    };

    const updateChamber = (index, field, value) => {
        const newChambers = [...chambers];
        newChambers[index][field] = value;
        setChambers(newChambers);
    };

    const addBenchToChamber = (chamberIndex) => {
        const newChambers = [...chambers];
        newChambers[chamberIndex].benches.push('');
        setChambers(newChambers);
    };

    const updateBench = (chamberIndex, benchIndex, value) => {
        const newChambers = [...chambers];
        newChambers[chamberIndex].benches[benchIndex] = value;
        setChambers(newChambers);
    };

    const calculateTotalCast = () => {
        if (plantType === 'Stress Bench') {
            return chambers.reduce((acc, c) => acc + (c.benches.length * c.sleepersPerBench), 0);
        } else {
            if (longLineData.mode === 'Range') {
                const count = (parseInt(longLineData.endGang) - parseInt(longLineData.startGang) + 1) || 0;
                return Math.max(0, count * 8);
            } else {
                const count = longLineData.individualGangs.split(',').filter(g => g.trim()).length;
                return count * 8;
            }
        }
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
    const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' };

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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                            <div>
                                <label style={labelStyle}>Plant Type</label>
                                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                        <input type="radio" name="plantType" checked={plantType === 'Stress Bench'} onChange={() => setPlantType('Stress Bench')} />
                                        Stress Bench
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                        <input type="radio" name="plantType" checked={plantType === 'Long Line'} onChange={() => setPlantType('Long Line')} />
                                        Long Line
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>{plantType === 'Stress Bench' ? 'Production Unit (Shed No.)' : 'Production Unit (Line No.)'}</label>
                                <select
                                    style={inputStyle}
                                    value={formHeader.unit}
                                    onChange={(e) => setFormHeader({ ...formHeader, unit: e.target.value })}
                                >
                                    <option value="">Select Unit</option>
                                    {plantType === 'Stress Bench' ? (
                                        <>
                                            <option value="Shed A">Shed A</option>
                                            <option value="Shed B">Shed B</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Line 1">Line 1</option>
                                            <option value="Line 2">Line 2</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Date of Casting</label>
                                <input
                                    type="date"
                                    value={formHeader.date}
                                    onChange={(e) => setFormHeader({ ...formHeader, date: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Shift</label>
                                <select
                                    style={inputStyle}
                                    value={formHeader.shift}
                                    onChange={(e) => setFormHeader({ ...formHeader, shift: e.target.value })}
                                >
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
                                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>Auto-suggested: Last Batch + 1</span>
                            </div>
                            <div>
                                <label style={labelStyle}>Mix Design Reference</label>
                                <select
                                    style={inputStyle}
                                    value={formHeader.mixDesign}
                                    onChange={(e) => setFormHeader({ ...formHeader, mixDesign: e.target.value })}
                                >
                                    <option value="M60 - Design A (Active)">M60 - Design A (Active)</option>
                                    <option value="M60 - Design B">M60 - Design B</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Time of L.B.C (Last Bench Casting)</label>
                                <input type="time" style={inputStyle} />
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
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Map benches grouped by steam chambers. Each chamber requires 1 test sample.</p>
                                    <button onClick={addChamber} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Chamber Group</button>
                                </div>

                                {chambers.map((chamber, cIdx) => (
                                    <div key={chamber.id} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr 1fr', gap: '20px', alignItems: 'start' }}>
                                            <div>
                                                <label style={labelStyle}>Chamber No.</label>
                                                <input type="number" value={chamber.chamberNo} onChange={(e) => updateChamber(cIdx, 'chamberNo', e.target.value)} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Benches Cast (Enter Bench #)</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {chamber.benches.map((bench, bIdx) => (
                                                        <input
                                                            key={bIdx}
                                                            type="text"
                                                            value={bench}
                                                            onChange={(e) => updateBench(cIdx, bIdx, e.target.value)}
                                                            style={{ ...inputStyle, width: '60px', padding: '8px' }}
                                                        />
                                                    ))}
                                                    <button onClick={() => addBenchToChamber(cIdx)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: 'white', cursor: 'pointer' }}>+</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Sleeper Type</label>
                                                <input type="text" disabled value={chamber.sleeperType} style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b' }} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Per Bench</label>
                                                <input type="number" value={chamber.sleepersPerBench} onChange={(e) => updateChamber(cIdx, 'sleepersPerBench', e.target.value)} style={inputStyle} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
                                <div style={{ display: 'grid', gap: '24px' }}>
                                    <div>
                                        <label style={labelStyle}>Sleeper Type</label>
                                        <select style={inputStyle} value={longLineData.sleeperType} onChange={(e) => setLongLineData({ ...longLineData, sleeperType: e.target.value })}>
                                            <option>RT-8746</option>
                                            <option>RT-8521</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Gang Declaration Mode</label>
                                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                                <input type="radio" checked={longLineData.mode === 'Range'} onChange={() => setLongLineData({ ...longLineData, mode: 'Range' })} />
                                                Range
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                                <input type="radio" checked={longLineData.mode === 'Individual'} onChange={() => setLongLineData({ ...longLineData, mode: 'Individual' })} />
                                                Individual
                                            </label>
                                        </div>
                                    </div>
                                    {longLineData.mode === 'Range' ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={labelStyle}>Start Gang No.</label>
                                                <input type="number" value={longLineData.startGang} onChange={(e) => setLongLineData({ ...longLineData, startGang: e.target.value })} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>End Gang No.</label>
                                                <input type="number" value={longLineData.endGang} onChange={(e) => setLongLineData({ ...longLineData, endGang: e.target.value })} style={inputStyle} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={labelStyle}>Gang Numbers (Comma separated)</label>
                                            <input type="text" placeholder="e.g. 1, 3, 5, 10" value={longLineData.individualGangs} onChange={(e) => setLongLineData({ ...longLineData, individualGangs: e.target.value })} style={inputStyle} />
                                        </div>
                                    )}
                                </div>
                                <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Sleepers per Gang</p>
                                    <h2 style={{ margin: 0, fontSize: '48px', color: '#42818c', fontWeight: '900' }}>8</h2>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>(Fixed as per Plant Configuration)</p>
                                </div>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#64748b', fontSize: '14px' }}>Total Casted Sleepers:</span>
                                    <span style={{ color: '#115e59', fontSize: '20px', fontWeight: '800' }}>{calculateTotalCast()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#64748b', fontSize: '14px' }}>Digital Twins to be Generated:</span>
                                    <span style={{ color: '#115e59', fontSize: '20px', fontWeight: '800' }}>{calculateTotalCast()}</span>
                                </div>
                                <div style={{ marginTop: '20px', padding: '12px', background: 'white', borderRadius: '8px', fontSize: '11px', color: '#0d9488' }}>
                                    <strong>Triggers:</strong> Visual Inspection, Steam Cube Testing, Water Cube Testing tasks will be auto-generated for the IE.
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Remarks / Observations</label>
                                <textarea rows="6" style={{ ...inputStyle, resize: 'none' }} placeholder="Enter any specific observations about this shift production..."></textarea>
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
                        const newDeclaration = {
                            date: formHeader.date,
                            shift: formHeader.shift.split(' ')[0],
                            batchNo: `B-${formHeader.batchNo}`,
                            unit: formHeader.unit,
                            total: calculateTotalCast(),
                            netGood: calculateTotalCast(), // Mocking netGood as equal to total for genesis record
                            status: 'Open'
                        };
                        onSave(newDeclaration);
                        alert(`Production Declaration Submitted successfully!\nUnique Batch Record Created: B-${formHeader.batchNo}\nSleeper IDs Generated (Digital Twin)\nTasks assigned to IE Dashboard.`);
                        onBack();
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
