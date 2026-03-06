import React, { useState } from 'react';

const RawMaterialSource = ({ entries, setEntries }) => {
    const [view, setView] = useState('list');
    const [formData, setFormData] = useState({
        nameOfRawMaterial: '',
        typeOfRawMaterial: '',
        supplier: '',
        docRef: '',
        docDate: ''
    });

    const materialOptions = [
        "Virgin Material", "Carbon Black", "Silica", "Nylon Cord", "Activator",
        "Accelerator", "Antioxidant", "Plasticizer"
    ];

    const dependentOptions = {
        "Virgin Material": ["Natural Rubber", "RSS1", "RSS2", "RSS3", "SBR", "PBR"],
        "Carbon Black": ["N-765", "N-330", "N-650", "N-326", "N-110"],
        "Silica": [], // Disabled
        "Nylon Cord": ["1680/2", "1260/2"],
        "Activator": ["Zinc Oxide", "Stearic Acid"],
        "Accelerator": ["CBS", "TMTD", "MBTS"],
        "Antioxidant": ["HS/TDQ", "Vul.4020", "Pil-13"],
        "Plasticizer": ["Stearic Acid", "Paraffin Wax"]
    };

    const handleMaterialChange = (e) => {
        const val = e.target.value;
        setFormData({
            ...formData,
            nameOfRawMaterial: val,
            typeOfRawMaterial: '' // Reset dependent dropdown
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newEntry = {
            id: Date.now(),
            materialName: `${formData.nameOfRawMaterial} (${formData.typeOfRawMaterial})`,
            supplier: formData.supplier,
            docRef: formData.docRef,
            status: "Pending"
        };
        setEntries([...entries, newEntry]);
        setView('list');
        // Reset form
        setFormData({
            nameOfRawMaterial: '',
            typeOfRawMaterial: '',
            supplier: '',
            docRef: '',
            docDate: ''
        });
    };

    return (
        <div className="fade-in">
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Raw Material Source</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Establish traceability for virgin material and chemicals</p>
                </div>
                {view === 'list' && (
                    <button className="btn-primary" onClick={() => setView('form')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Add New Entry
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Raw Material Name</th>
                                <th>Supplier / Source</th>
                                <th>Document Reference</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => (
                                <tr key={entry.id}>
                                    <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{entry.materialName}</td>
                                    <td>{entry.supplier}</td>
                                    <td>{entry.docRef}</td>
                                    <td><span className={`badge ${entry.status === 'Verified' ? 'badge-verified' : 'badge-pending'}`}>{entry.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="form-container fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '800' }}>Add Raw Material Source</h3>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Name of Raw Material</label>
                                <select
                                    className="form-select"
                                    value={formData.nameOfRawMaterial}
                                    onChange={handleMaterialChange}
                                    required
                                >
                                    <option value="">Select Material</option>
                                    {materialOptions.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Type of Raw Material</label>
                                <select
                                    className="form-select"
                                    value={formData.typeOfRawMaterial}
                                    onChange={(e) => setFormData({ ...formData, typeOfRawMaterial: e.target.value })}
                                    required
                                    disabled={!formData.nameOfRawMaterial || formData.nameOfRawMaterial === 'Silica'}
                                    style={{ background: (!formData.nameOfRawMaterial || formData.nameOfRawMaterial === 'Silica') ? '#f1f5f9' : 'white' }}
                                >
                                    <option value="">Select Type</option>
                                    {formData.nameOfRawMaterial && dependentOptions[formData.nameOfRawMaterial].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                {formData.nameOfRawMaterial === 'Silica' && (
                                    <div style={{ color: '#0ea5e9', fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>
                                        Verification not applicable (as per RB)
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Supplier / Source</label>
                                <input
                                    className="form-input"
                                    placeholder="Enter source name"
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Doc Reference No.</label>
                                <input
                                    className="form-input"
                                    placeholder="Invoice / e-way bill"
                                    value={formData.docRef}
                                    onChange={(e) => setFormData({ ...formData, docRef: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Document Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.docDate}
                                    onChange={(e) => setFormData({ ...formData, docDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '0.8rem 3rem' }}>
                                Submit Entry
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default RawMaterialSource;
