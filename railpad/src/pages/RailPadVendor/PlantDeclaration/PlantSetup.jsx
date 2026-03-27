import React, { useState } from 'react';

const PlantSetup = ({ entries, setEntries }) => {
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [numUnits, setNumUnits] = useState(0);
    const [unitSections, setUnitSections] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);

    const productOptions = [
        "6.00mm GRSP", "10.00mm GRSP", "6.20mm CGRSP", "10.00mm CGRSP", "6.00mm NCRGRSP", "10.00mm NCRGRSP"
    ];

    const handleNumUnitsChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setNumUnits(val);
        const newSections = Array.from({ length: val }, (_, i) => ({
            id: Date.now() + i,
            unitName: '',
            address: '',
            numLines: '',
            selectedProducts: []
        }));
        setUnitSections(newSections);
    };

    const handleUnitChange = (index, field, value) => {
        const updated = [...unitSections];
        updated[index][field] = value;
        setUnitSections(updated);
    };

    const handleProductSelect = (unitIndex, product) => {
        const updated = [...unitSections];
        const currentProducts = updated[unitIndex].selectedProducts;
        if (currentProducts.find(p => p.name === product)) {
            updated[unitIndex].selectedProducts = currentProducts.filter(p => p.name !== product);
        } else {
            updated[unitIndex].selectedProducts.push({
                name: product,
                approvalNo: '',
                approvalDate: '',
                capacity: ''
            });
        }
        setUnitSections(updated);
    };

    const handleProductDetailChange = (unitIndex, prodIndex, field, value) => {
        const updated = [...unitSections];
        updated[unitIndex].selectedProducts[prodIndex][field] = value;
        setUnitSections(updated);
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setNumUnits(1);
        setUnitSections([{
            id: entry.id,
            unitName: entry.unitName,
            address: entry.address,
            numLines: entry.numLines,
            selectedProducts: entry.selectedProducts || []
        }]);
        setView('form');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this plant unit?')) {
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
                    const unit = unitSections[0];
                    return {
                        ...entry,
                        unitName: unit.unitName,
                        address: unit.address,
                        numLines: unit.numLines,
                        selectedProducts: unit.selectedProducts,
                        capacity: unit.selectedProducts.length > 0 ? `${unit.selectedProducts[0].capacity} Pcs/Month` : '-',
                        status: "Pending Verification"
                    };
                }
                return entry;
            });
            setEntries(updatedEntries);
            setEditingEntry(null);
        } else {
            const newEntries = unitSections.map(unit => ({
                id: unit.id || Date.now() + Math.random(),
                manufacturer: "ABC Industries (VEND001)",
                unitName: unit.unitName,
                address: unit.address,
                numLines: unit.numLines,
                selectedProducts: unit.selectedProducts,
                capacity: unit.selectedProducts.length > 0 ? `${unit.selectedProducts[0].capacity} Pcs/Month` : '-',
                status: "Pending Verification"
            }));
            setEntries([...entries, ...newEntries]);
        }

        setIsSubmitted(true);
        setView('list');
        // Reset form
        setNumUnits(0);
        setUnitSections([]);
    };

    const handleViewDetails = (entry) => {
        setSelectedEntry(entry);
        setView('details');
    };

    return (
        <div className="fade-in">
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Plant Set Up</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Manage plant units and RDSO approval details</p>
                </div>
                {view === 'list' && (
                    <button className="btn-primary" onClick={() => { setView('form'); setEditingEntry(null); setNumUnits(0); setUnitSections([]); }}>
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
                                <th>Manufacturer & Code</th>
                                <th>Unit Name & Address</th>
                                <th>No. of Lines</th>
                                <th>Capacity</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(unit => (
                                <tr key={unit.id}>
                                    <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{unit.manufacturer}</td>
                                    <td>
                                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{unit.unitName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{unit.address}</div>
                                    </td>
                                    <td>{unit.numLines}</td>
                                    <td>{unit.capacity}</td>
                                    <td>
                                        <span className={`badge ${unit.status === 'Verified & Locked' ? 'badge-verified' : 'badge-pending'} `}>
                                            {unit.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {(unit.status === 'Pending Verification' || unit.status === 'Unlocked for Modification') ? (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(unit)}
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
                                                        onClick={() => handleDelete(unit.id)}
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
                                                    onClick={() => handleViewDetails(unit)}
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
                            {editingEntry ? 'Modify Plant Set Up' : 'Submit Plant Set Up'}
                        </h3>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '32px' }}>
                            <div className="form-group">
                                <label className="form-label">Vendor Name</label>
                                <input className="form-input" value="ABC Industries" disabled style={{ background: '#f1f5f9' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vendor Code</label>
                                <input className="form-input" value="VEND001" disabled style={{ background: '#f1f5f9' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">NO. of Units</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Enter units count"
                                    value={numUnits}
                                    onChange={handleNumUnitsChange}
                                    min="0"
                                    required
                                    disabled={editingEntry !== null}
                                    style={{ background: editingEntry !== null ? '#f1f5f9' : 'white' }}
                                />
                            </div>
                        </div>

                        {unitSections.map((unit, unitIdx) => (
                            <div key={unitIdx} className="unit-section fade-in">
                                <h4>Unit {unitIdx + 1} Details</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Unit Name</label>
                                        <input
                                            className="form-input"
                                            value={unit.unitName}
                                            onChange={(e) => handleUnitChange(unitIdx, 'unitName', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">No. of Lines</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={unit.numLines}
                                            onChange={(e) => handleUnitChange(unitIdx, 'numLines', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label">Address of Unit</label>
                                    <textarea
                                        className="form-textarea"
                                        rows="2"
                                        value={unit.address}
                                        onChange={(e) => handleUnitChange(unitIdx, 'address', e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label">Production Items Selection</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginTop: '4px' }}>
                                        {productOptions.map(prod => (
                                            <div
                                                key={prod}
                                                onClick={() => handleProductSelect(unitIdx, prod)}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    border: '1px solid var(--border-color)',
                                                    background: unit.selectedProducts.find(p => p.name === prod) ? 'rgba(66, 129, 140, 0.1)' : 'white',
                                                    color: unit.selectedProducts.find(p => p.name === prod) ? 'var(--primary-color)' : 'var(--text-muted)',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'center',
                                                    borderColor: unit.selectedProducts.find(p => p.name === prod) ? 'var(--primary-color)' : 'var(--border-color)'
                                                }}
                                            >
                                                {prod}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {unit.selectedProducts.map((prod, pIdx) => (
                                    <div key={pIdx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginTop: '12px', border: '1px solid rgba(66, 129, 140, 0.15)' }}>
                                        <div style={{ fontWeight: '800', marginBottom: '12px', fontSize: '11px', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            RDSO Approval for {prod.name}
                                        </div>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label className="form-label">RDSO Appr. No.</label>
                                                <input
                                                    className="form-input"
                                                    value={prod.approvalNo}
                                                    onChange={(e) => handleProductDetailChange(unitIdx, pIdx, 'approvalNo', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">date</label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={prod.approvalDate}
                                                    onChange={(e) => handleProductDetailChange(unitIdx, pIdx, 'approvalDate', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Approved Capacity</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={prod.capacity}
                                                    onChange={(e) => handleProductDetailChange(unitIdx, pIdx, 'capacity', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '0.8rem 3rem' }}>
                                {editingEntry ? 'Update Entry' : 'Submit Declaration'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="details-container fade-in" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.25rem', fontWeight: '800' }}>Plant Set Up Details</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Complete plant and unit verification details</p>
                        </div>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.5rem 1.5rem', fontWeight: '700' }}>Back to List</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px', padding: '20px', background: 'var(--accent-bg)', borderRadius: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>Manufacturer</label>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedEntry?.manufacturer}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>Unit Name</label>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedEntry?.unitName}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>Status</label>
                            <span className={`badge ${selectedEntry?.status === 'Verified & Locked' ? 'badge-verified' : 'badge-pending'}`}>
                                {selectedEntry?.status}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800' }}>Unit Overview</h4>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Total Lines</label>
                                    <div style={{ fontWeight: '700' }}>{selectedEntry?.numLines}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Address</label>
                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{selectedEntry?.address}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Capacity</label>
                                    <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{selectedEntry?.capacity}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800' }}>RDSO Approval Details</h4>
                            <div className="table-container" style={{ margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <table style={{ width: '100%', fontSize: '12px' }}>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Approval No.</th>
                                            <th>Approval Date</th>
                                            <th>Capacity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedEntry?.selectedProducts?.map((prod, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: '700' }}>{prod.name}</td>
                                                <td>{prod.approvalNo}</td>
                                                <td>{prod.approvalDate}</td>
                                                <td style={{ fontWeight: '600' }}>{prod.capacity} Pcs/M</td>
                                            </tr>
                                        )) || (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No products listed</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlantSetup;
