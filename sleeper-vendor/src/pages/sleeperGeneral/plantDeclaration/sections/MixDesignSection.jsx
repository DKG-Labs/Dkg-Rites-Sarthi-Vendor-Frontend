import React, { useState } from 'react';

const MixDesignSection = () => {
    const [mixDesigns, setMixDesigns] = useState([
        { id: 1, iden: 'MIX-2024-01', grade: 'M60', authority: 'RDSO', cement: 450, ca1: 700, ca2: 500, fa: 600, water: 160 }
    ]);

    const [newMix, setNewMix] = useState({
        iden: '', grade: 'M60', authority: '', cement: '', ca1: '', ca2: '', fa: '', water: ''
    });

    const calculateAC = (m) => {
        const totalAgg = Number(m.ca1 || 0) + Number(m.ca2 || 0) + Number(m.fa || 0);
        const cement = Number(m.cement || 0);
        return cement > 0 ? (totalAgg / cement).toFixed(2) : '0.00';
    };

    const calculateWC = (m) => {
        const water = Number(m.water || 0);
        const cement = Number(m.cement || 0);
        return cement > 0 ? (water / cement).toFixed(2) : '0.00';
    };

    return (
        <div className="fade-in">
            <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>Mix Design Declaration</h3>

            {/* New Mix Design Form */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h4 style={{ color: '#42818c', marginTop: 0, marginBottom: '20px', fontSize: '14px' }}>Add New Mix Design</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Identification</label>
                        <input type="text" placeholder="e.g. MIX-LC-01" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Concrete Grade</label>
                        <select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <option>M60</option>
                            <option>M55</option>
                            <option>M45</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Authority of Approval</label>
                        <input type="text" placeholder="e.g. RDSO" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Water (Liters)</label>
                        <input
                            type="number"
                            onChange={(e) => setNewMix({ ...newMix, water: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Cement (Kg/m³)</label>
                        <input
                            type="number"
                            onChange={(e) => setNewMix({ ...newMix, cement: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>CA1 (Kg/m³)</label>
                        <input
                            type="number"
                            onChange={(e) => setNewMix({ ...newMix, ca1: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>CA2 (Kg/m³)</label>
                        <input
                            type="number"
                            onChange={(e) => setNewMix({ ...newMix, ca2: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>FA (Kg/m³)</label>
                        <input
                            type="number"
                            onChange={(e) => setNewMix({ ...newMix, fa: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block' }}>A/C Ratio (Auto)</span>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#42818c' }}>{calculateAC(newMix)}</span>
                    </div>
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block' }}>W/C Ratio (Auto)</span>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#42818c' }}>{calculateWC(newMix)}</span>
                    </div>
                    <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                        <button style={{ background: '#42818c', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                            Add to List
                        </button>
                    </div>
                </div>
            </div>

            {/* Existing Mix Designs Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Identification</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Grade</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Cement</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>CA1</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>CA2</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>FA</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Water</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>A/C</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>W/C</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mixDesigns.map(mix => (
                            <tr key={mix.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '500' }}>{mix.iden}</td>
                                <td style={{ padding: '12px 16px' }}><span style={{ padding: '2px 8px', background: '#f0f9fa', color: '#42818c', borderRadius: '4px', fontWeight: '600', fontSize: '11px' }}>{mix.grade}</span></td>
                                <td style={{ padding: '12px 16px' }}>{mix.cement}</td>
                                <td style={{ padding: '12px 16px' }}>{mix.ca1}</td>
                                <td style={{ padding: '12px 16px' }}>{mix.ca2}</td>
                                <td style={{ padding: '12px 16px' }}>{mix.fa}</td>
                                <td style={{ padding: '12px 16px' }}>{mix.water}</td>
                                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#42818c' }}>{calculateAC(mix)}</td>
                                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#42818c' }}>{calculateWC(mix)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MixDesignSection;
