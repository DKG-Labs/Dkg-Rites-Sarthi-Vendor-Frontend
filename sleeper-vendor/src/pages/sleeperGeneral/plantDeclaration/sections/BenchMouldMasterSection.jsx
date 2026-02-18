import React, { useState } from 'react';

const BenchMouldMasterSection = () => {
    // In a real app, this would come from the plant profile or global state
    const [isLongLine, setIsLongLine] = useState(false);

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#1e293b', margin: 0 }}>Bench / Mould Master Declaration</h3>
                <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setIsLongLine(false)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: !isLongLine ? '#fff' : 'transparent',
                            color: !isLongLine ? '#42818c' : '#64748b',
                            boxShadow: !isLongLine ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Conventional
                    </button>
                    <button
                        onClick={() => setIsLongLine(true)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: isLongLine ? '#fff' : 'transparent',
                            color: isLongLine ? '#42818c' : '#64748b',
                            boxShadow: isLongLine ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Long Line
                    </button>
                </div>
            </div>

            {!isLongLine ? (
                /* Bench Details for Conventional */
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ color: '#42818c', marginTop: 0, marginBottom: '20px', fontSize: '14px' }}>A. Bench Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No. of total Benches</label>
                            <input type="number" placeholder="Enter total benches" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Bench Numbers (Single or Range)</label>
                            <input type="text" placeholder="e.g. 1-10 or 1,2,5" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Number of Moulds</label>
                            <input type="number" placeholder="Enter number of moulds" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Sleeper Type Category</label>
                            <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                <option>RT-8527 (Pre-stressed)</option>
                                <option>RT-4852 (Wider)</option>
                                <option>RT-2495 (Turnout)</option>
                            </select>
                        </div>
                    </div>
                </div>
            ) : (
                /* Mould Details for Long Line */
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ color: '#42818c', marginTop: 0, marginBottom: '20px', fontSize: '14px' }}>B. Mould Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>No. of Moulds</label>
                            <input type="number" placeholder="Enter total moulds" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Mould Numbers (Single or Range)</label>
                            <input type="text" placeholder="e.g. 1-100" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Sleeper Type Category</label>
                            <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                <option>RT-8527 (Pre-stressed)</option>
                                <option>RT-4852 (Wider)</option>
                                <option>RT-2495 (Turnout)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Assigned Bench/Line Range</label>
                            <input type="text" placeholder="e.g. Line 1-4" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                    </div>
                </div>
            )}

            <button style={{
                marginTop: '24px',
                background: '#42818c',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
            }}>
                Save Master Data
            </button>
        </div>
    );
};

export default BenchMouldMasterSection;
