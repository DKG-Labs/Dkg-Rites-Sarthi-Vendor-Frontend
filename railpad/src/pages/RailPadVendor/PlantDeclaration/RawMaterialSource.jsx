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
    const [editingEntry, setEditingEntry] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);

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

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        let name = entry.materialNameRaw || '';
        let type = entry.materialType || '';

        if (!name && entry.materialName) {
            const match = entry.materialName.match(/(.*) \((.*)\)/);
            if (match) {
                name = match[1];
                type = match[2];
            } else {
                name = entry.materialName;
            }
        }

        setFormData({
            nameOfRawMaterial: name,
            typeOfRawMaterial: type,
            supplier: entry.supplier,
            docRef: entry.docRef,
            docDate: entry.docDate || ''
        });
        setView('form');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this raw material source?')) {
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    const handleUnlock = (id) => {
        setEntries(entries.map(e => e.id === id ? { ...e, status: 'Unlocked for Modification' } : e));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingEntry) {
            const updatedEntries = entries.map(entry => {
                if (entry.id === editingEntry.id) {
                    return {
                        ...entry,
                        materialNameRaw: formData.nameOfRawMaterial,
                        materialType: formData.typeOfRawMaterial,
                        materialName: `${formData.nameOfRawMaterial} (${formData.typeOfRawMaterial})`,
                        supplier: formData.supplier,
                        docRef: formData.docRef,
                        docDate: formData.docDate,
                        status: "Pending Verification"
                    };
                }
                return entry;
            });
            setEntries(updatedEntries);
            setEditingEntry(null);
        } else {
            const newEntry = {
                id: Date.now(),
                materialNameRaw: formData.nameOfRawMaterial,
                materialType: formData.typeOfRawMaterial,
                materialName: `${formData.nameOfRawMaterial} (${formData.typeOfRawMaterial})`,
                supplier: formData.supplier,
                docRef: formData.docRef,
                docDate: formData.docDate,
                status: "Pending Verification"
            };
            setEntries([...entries, newEntry]);
        }

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

    const handleViewDetails = (entry) => {
        setSelectedEntry(entry);
        setView('details');
    };

    return (
        <div className="fade-in">
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Raw Material Source</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Establish traceability for virgin material and chemicals</p>
                </div>
                {view === 'list' && (
                    <button className="btn-primary" onClick={() => { setView('form'); setEditingEntry(null); setFormData({ nameOfRawMaterial: '', typeOfRawMaterial: '', supplier: '', docRef: '', docDate: '' }); }}>
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
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => (
                                <tr key={entry.id}>
                                    <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{entry.materialName}</td>
                                    <td>{entry.supplier}</td>
                                    <td>{entry.docRef}</td>
                                    <td><span className={`badge ${entry.status === 'Verified & Locked' ? 'badge-verified' : 'badge-pending'}`}>{entry.status}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {(entry.status === 'Pending Verification' || entry.status === 'Unlocked for Modification') ? (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(entry)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            background: 'rgba(66, 129, 140, 0.1)',
                                                            color: 'var(--primary-color)',
                                                            border: '1px solid var(--primary-color)',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            background: 'rgba(220, 38, 38, 0.1)',
                                                            color: '#dc2626',
                                                            border: '1px solid #dc2626',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleViewDetails(entry)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        fontSize: '11px',
                                                        background: 'rgba(33, 128, 141, 0.1)',
                                                        color: 'var(--primary-color)',
                                                        border: '1px solid var(--primary-color)',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    Details
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : view === 'form' ? (
                <div className="form-container fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '800' }}>
                            {editingEntry ? 'Modify Raw Material Source' : 'Add Raw Material Source'}
                        </h3>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
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
                                {editingEntry ? 'Update Entry' : 'Submit Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="details-container fade-in" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.25rem', fontWeight: '800' }}>Raw Material Details</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Traceability information for raw materials</p>
                        </div>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.5rem 1.5rem', fontWeight: '700' }}>Back to List</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700' }}>Material Name</label>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)' }}>{selectedEntry?.materialName}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700' }}>Supplier / Source</label>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedEntry?.supplier}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700' }}>Doc Reference</label>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedEntry?.docRef}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700' }}>Current Status</label>
                            <span className={`badge ${selectedEntry?.status === 'Verified & Locked' ? 'badge-verified' : 'badge-pending'}`}>
                                {selectedEntry?.status}
                            </span>
                        </div>
                    </div>

                    <div style={{ marginTop: '32px' }}>
                        <h4 style={{ fontSize: 'var(--fs-md)', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)' }}>Traceability Timeline</h4>
                        <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700' }}>Document Issued: {selectedEntry?.docDate || 'N/A'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified against physical stock and RDSO requirements</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RawMaterialSource;
