import React, { useState } from 'react';

const PlantProfileSection = () => {
    const [plantType, setPlantType] = useState('Stress Bench – Single');

    return (
        <div className="fade-in">
            <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>Plant Profile Declaration</h3>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Plant Name & Location</label>
                        <input
                            type="text"
                            disabled
                            value="M/s ABC Sleepers - Nagpur Plant"
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#64748b'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Vendor Code</label>
                        <input
                            type="text"
                            disabled
                            value="V-10294"
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#64748b'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Type of Plant</label>
                        <select
                            value={plantType}
                            onChange={(e) => setPlantType(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="Stress Bench – Single">Stress Bench – Single</option>
                            <option value="Stress Bench – Twin">Stress Bench – Twin</option>
                            <option value="Long Line">Long Line</option>
                        </select>
                    </div>

                    {plantType.includes('Stress') ? (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Number of Sheds</label>
                            <input
                                type="number"
                                placeholder="Enter number of sheds"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Number of Lines</label>
                            <input
                                type="number"
                                placeholder="Enter number of lines"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            />
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                    <button style={{
                        background: '#42818c',
                        color: 'white',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }}>
                        Save Profile
                    </button>
                    <button style={{
                        background: 'transparent',
                        color: '#64748b',
                        border: '1px solid #cbd5e1',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}>
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlantProfileSection;
