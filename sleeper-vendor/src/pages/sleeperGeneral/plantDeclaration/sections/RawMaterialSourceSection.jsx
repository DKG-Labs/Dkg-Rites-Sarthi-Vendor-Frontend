import React from 'react';

const RawMaterialSourceSection = () => {
    const materials = [
        'Cement', 'HTS Wire', 'Dowel', 'SGCI Insert',
        'Aggregates - CA1', 'Aggregates - CA2', 'Aggregates - FA',
        'Admixtures', 'Water Source'
    ];

    return (
        <div className="fade-in">
            <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>Raw Material Source Declaration</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {materials.map((mat, index) => (
                    <div key={index} style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#42818c' }}></div>
                            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '14px' }}>{mat}</h4>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Supplier Name</label>
                                <input type="text" placeholder="Enter supplier" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Source Location</label>
                                <input type="text" placeholder="Enter location" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Approval Ref (RDSO/RITES)</label>
                                <input type="text" placeholder="Enter reference" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Validity Period</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="date" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                                    <input type="date" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{
                    background: '#42818c',
                    color: 'white',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(66, 129, 140, 0.2)'
                }}>
                    Save All Sources
                </button>
            </div>
        </div>
    );
};

export default RawMaterialSourceSection;
