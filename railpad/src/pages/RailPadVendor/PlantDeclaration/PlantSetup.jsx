import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { plantSetupService } from '../../../services/plantSetupService';

const PlantSetup = ({ entries, setEntries, onRefresh, isLoading }) => {
    const cleanUnitName = (name) => {
        if (!name) return "";
        let cleaned = name;
        if (cleaned.startsWith(':')) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.includes('/')) {
            const parts = cleaned.split('/');
            return parts[1];
        }
        return cleaned;
    };

    const user = (() => {
        const vName = localStorage.getItem('railpad_vendorName');
        const vCode = localStorage.getItem('railpad_vendorCode');
        const uId = localStorage.getItem('railpad_userId');

        return {
            vendorName: vName || "",
            vendorCode: vCode || "",
            userId: uId || "1"
        };
    })();

    const [isSaving, setIsSaving] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [statusTab, setStatusTab] = useState('PENDING'); // 'PENDING' or 'COMPLETED'
    const [numUnits, setNumUnits] = useState('');
    const [unitSections, setUnitSections] = useState([]);
    const [editingEntry, setEditingEntry] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, fading: false });
        setTimeout(() => {
            setNotification(prev => prev ? { ...prev, fading: true } : null);
            setTimeout(() => setNotification(null), 400);
        }, 3000);
    };

    const pendingStatuses = ['CREATED', 'PENDING', 'NOT_STARTED', 'IN_PROGRESS', 'CREATE', 'RETURNED', 'RESUBMITTED'];
    const verifiedStatuses = ['COMPLETED', 'VERIFIED', 'APPROVED'];

    const filteredEntries = (entries || []).filter(entry => {
        if (statusTab === 'PENDING') {
            return pendingStatuses.includes(entry.status);
        } else {
            return verifiedStatuses.includes(entry.status);
        }
    });

    const pendingCount = (entries || []).filter(e => pendingStatuses.includes(e.status)).length;
    const verifiedCount = (entries || []).filter(e => verifiedStatuses.includes(e.status)).length;

    const productOptions = [
        "6.00mm GRSP", "10.00mm GRSP", "6.20mm CGRSP", "10.00mm CGRSP", "6.00mm NCRGRSP", "10.00mm NCRGRSP"
    ];

    const handleNumUnitsChange = (e) => {
        const val = e.target.value;
        setNumUnits(val);
        const num = parseInt(val) || 0;
        const newSections = Array.from({ length: num }, (_, i) => ({
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
        setNumUnits(entry.numberOfUnits);
        setUnitSections((entry.units || []).map(unit => ({
            id: unit.id,
            unitName: unit.unitName || localStorage.getItem('railpad_selectedPlantId') || '',
            address: unit.address,
            numLines: unit.numLines,
            selectedProducts: (unit.products || []).map(p => ({
                name: p.productName,
                approvalNo: p.approvalNo,
                approvalDate: p.approvalDate,
                capacity: p.capacity
            }))
        })));
        setView('form');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this plant unit?')) {
            try {
                await plantSetupService.delete(id);
                onRefresh();
                showNotification('Plant setup deleted successfully');
            } catch (error) {
                showNotification('Error deleting plant setup: ' + error.message, 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const plantId = localStorage.getItem('railpad_selectedPlantId');

            const payload = {
                vendorName: user?.vendorName || "",
                vendorCode: user?.vendorCode || "",
                numberOfUnits: parseInt(numUnits) || 0,
                plantId: plantId || "1",
                shift: "General",
                createdBy: user?.userId || 1,
                updatedBy: user?.userId || 1,
                units: unitSections.map(unit => ({
                    unitName: unit.unitName,
                    address: unit.address,
                    numLines: parseInt(unit.numLines) || 0,
                    products: (unit.selectedProducts || []).map(prod => ({
                        productName: prod.name,
                        approvalNo: prod.approvalNo,
                        approvalDate: prod.approvalDate,
                        capacity: parseInt(prod.capacity) || 0
                    }))
                }))
            };

            if (editingEntry) {
                await plantSetupService.update(editingEntry.id, payload);
                showNotification('Plant setup updated successfully');
            } else {
                await plantSetupService.create(payload);
                showNotification('Plant setup created successfully');
            }

            onRefresh();
            setView('list');
            setNumUnits(0);
            setUnitSections([]);
            setEditingEntry(null);
        } catch (error) {
            showNotification('Error saving plant setup: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleViewDetails = (entry) => {
        setSelectedEntry(entry);
        setView('details');
    };

    const SkeletonRow = () => (
        <tr style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
            <td style={{ padding: '20px 12px' }}>
                <div style={{ width: 120, height: 14, background: '#f1f5f9', borderRadius: 4, marginBottom: 6 }}></div>
                <div style={{ width: 80, height: 10, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 60, height: 14, background: '#f1f5f9', borderRadius: 4, marginBottom: 6 }}></div>
                <div style={{ width: 50, height: 10, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 60, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 70, height: 24, background: '#f1f5f9', borderRadius: 12 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ width: 60, height: 28, background: '#f1f5f9', borderRadius: 8 }}></div>
                    <div style={{ width: 60, height: 28, background: '#f1f5f9', borderRadius: 8 }}></div>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="fade-in">
            <div style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                marginBottom: '24px'
            }}>
                <div className="section-header" style={{ marginBottom: view === 'list' ? '24px' : '0' }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Plant Set Up</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Manage plant units and RDSO approval details</p>
                    </div>
                    {view === 'list' && (
                        <button 
                            className="btn-primary" 
                            title={(entries || []).length > 0 ? "Plant Setup already exists (only one setup allowed)" : "Add New Entry"}
                            style={{
                                opacity: (entries || []).length > 0 ? 0.65 : 1,
                                cursor: (entries || []).length > 0 ? 'not-allowed' : 'pointer',
                                background: (entries || []).length > 0 ? '#94a3b8' : undefined,
                                borderColor: (entries || []).length > 0 ? '#94a3b8' : undefined,
                                transform: (entries || []).length > 0 ? 'none' : undefined,
                                boxShadow: (entries || []).length > 0 ? 'none' : undefined
                            }}
                            onClick={() => {
                                if ((entries || []).length > 0) {
                                    showNotification("Plant setup already exists. Only one setup is allowed per plant.", "error");
                                    return;
                                }
                                setView('form');
                                setEditingEntry(null);
                                setNumUnits(1);
                                setUnitSections([{
                                    id: Date.now(),
                                    unitName: localStorage.getItem('railpad_selectedPlantId') || '',
                                    address: '',
                                    numLines: '',
                                    selectedProducts: []
                                }]);
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                            Add New Entry
                        </button>
                    )}
                </div>

                {view === 'list' && (
                    <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        background: 'rgba(241, 245, 249, 0.5)',
                        padding: '8px',
                        borderRadius: '12px',
                        width: 'fit-content'
                    }}>
                        <button 
                            onClick={() => setStatusTab('PENDING')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                background: statusTab === 'PENDING' ? 'white' : 'transparent',
                                color: statusTab === 'PENDING' ? 'var(--primary-color)' : 'var(--text-muted)',
                                boxShadow: statusTab === 'PENDING' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '13px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                            Pending
                            <span style={{ 
                                background: 'rgba(66, 129, 140, 0.08)', 
                                padding: '2px 8px', 
                                borderRadius: '6px',
                                fontSize: '11px'
                            }}>{pendingCount}</span>
                        </button>
                        <button 
                            onClick={() => setStatusTab('COMPLETED')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                background: statusTab === 'COMPLETED' ? 'white' : 'transparent',
                                color: statusTab === 'COMPLETED' ? 'var(--primary-color)' : 'var(--text-muted)',
                                boxShadow: statusTab === 'COMPLETED' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '13px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                            Verified
                            <span style={{ 
                                background: 'rgba(66, 129, 140, 0.08)', 
                                padding: '2px 8px', 
                                borderRadius: '6px',
                                fontSize: '11px'
                            }}>{verifiedCount}</span>
                        </button>
                    </div>
                )}
            </div>

            {view === 'list' ? (
                <div className="fade-in">

                    <div className="table-container fade-in">
                        <table>
                            <thead>
                                <tr>
                                    <th>Manufacturer & Code</th>
                                    <th>Units & Shift</th>
                                    <th>No. of Lines</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <>
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                    </>
                                ) : filteredEntries.length > 0 ? (
                                    filteredEntries.map(entry => (
                                        <tr key={entry.id}>
                                            <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                                                {user?.vendorName} ({user?.vendorCode})
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{entry.numberOfUnits} Units</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{entry.shift} Shift</div>
                                            </td>
                                            <td>
                                                {entry.units?.reduce((acc, u) => acc + (u.numLines || 0), 0) || 0} Lines
                                            </td>
                                            <td>
                                                <span className={`badge ${verifiedStatuses.includes(entry.status) ? 'badge-verified' : 'badge-pending'} `}>
                                                    {entry.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="action-buttons-group" style={{ justifyContent: 'center' }}>
                                                    <button onClick={() => handleViewDetails(entry)} className="btn-icon-action view">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                        Details
                                                    </button>
                                                    {pendingStatuses.includes(entry.status) && (
                                                        <>
                                                            <button onClick={() => handleEdit(entry)} className="btn-icon-action edit">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                                Edit
                                                            </button>
                                                            <button onClick={() => handleDelete(entry.id)} className="btn-icon-action delete">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                            No {statusTab === 'PENDING' ? 'pending' : 'verified'} entries found for this plant.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '32px' }}>
                            <div className="form-group">
                                <label className="form-label">Vendor Name</label>
                                <input className="form-input" value={user?.vendorName} disabled style={{ background: '#f1f5f9' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vendor Code</label>
                                <input className="form-input" value={user?.vendorCode} disabled style={{ background: '#f1f5f9' }} />
                            </div>
                            {/* 
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
                                />
                            </div>
                            */}
                        </div>

                        {unitSections.map((unit, unitIdx) => (
                            <div key={unitIdx} className="unit-section fade-in">
                                <h4>Unit {unitIdx + 1} Details</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Unit Name</label>
                                        <input
                                            className="form-input"
                                            value={cleanUnitName(unit.unitName)}
                                            required
                                            readOnly
                                            style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
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

                                {/* 
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label">Production Items Selection <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '11px' }}>(Optional)</span></label>
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
                                            RDSO Approval for {prod.name} <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'none' }}>(Optional)</span>
                                        </div>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label className="form-label">RDSO Appr. No. <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>(Optional)</span></label>
                                                <input
                                                    className="form-input"
                                                    value={prod.approvalNo}
                                                    onChange={(e) => handleProductDetailChange(unitIdx, pIdx, 'approvalNo', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">date <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>(Optional)</span></label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={prod.approvalDate}
                                                    onChange={(e) => handleProductDetailChange(unitIdx, pIdx, 'approvalDate', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Approved Capacity <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>(Optional)</span></label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={prod.capacity}
                                                    onChange={(e) => handleProductDetailChange(unitIdx, pIdx, 'capacity', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                */}
                            </div>
                        ))}

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '0.8rem 3rem' }} disabled={isSaving}>
                                {isSaving ? 'Saving...' : (editingEntry ? 'Update Entry' : 'Submit Declaration')}
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
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{user?.vendorName}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>Total Units</label>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedEntry?.numberOfUnits} Units</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>Status</label>
                            <span className={`badge ${verifiedStatuses.includes(selectedEntry?.status) ? 'badge-verified' : 'badge-pending'}`}>
                                {selectedEntry?.status}
                            </span>
                        </div>
                    </div>

                    <div className="unit-details-section">
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800' }}>Unit Details</h4>
                        {selectedEntry?.units?.map((unit, uIdx) => (
                            <div key={uIdx} style={{
                                marginBottom: '20px',
                                padding: '20px',
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                display: 'flex',
                                gap: '20px',
                                alignItems: 'center',
                                flexWrap: 'wrap'
                            }}>
                                {/* Sleek Icon Badge */}
                                <div style={{
                                    background: 'rgba(66, 129, 140, 0.1)',
                                    color: 'var(--primary-color)',
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                                    </svg>
                                </div>

                                {/* Details Horizontal Grid */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                    gap: '24px', 
                                    flexGrow: 1,
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '4px', letterSpacing: '0.05em' }}>Unit Name</span>
                                        <span style={{ fontSize: '13.5px', fontWeight: '750', color: 'var(--text-main)' }}>{cleanUnitName(unit.unitName)}</span>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '4px', letterSpacing: '0.05em' }}>No. of Lines</span>
                                        <span style={{ 
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            background: 'rgba(66, 129, 140, 0.08)',
                                            color: 'var(--primary-color)',
                                            padding: '4px 12px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            border: '1px solid rgba(66, 129, 140, 0.15)'
                                        }}>
                                            {unit.numLines} Lines
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '4px', letterSpacing: '0.05em' }}>Address of Unit</span>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{unit.address}</span>
                                    </div>
                                </div>
                                
                                {/* 
                                <div className="table-container small-table" style={{ margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Approval No.</th>
                                                <th>Approval Date</th>
                                                <th>Capacity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {unit.products?.map((prod, pIdx) => (
                                                <tr key={pIdx}>
                                                    <td style={{ fontWeight: '700' }}>{prod.productName}</td>
                                                    <td>{prod.approvalNo}</td>
                                                    <td>{prod.approvalDate}</td>
                                                    <td style={{ fontWeight: '600' }}>{prod.capacity} Pcs/M</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                */}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification && createPortal(
                <div className="pv-notification-container" style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    pointerEvents: 'none'
                }}>
                    <div 
                        className={`pv-notification ${notification.type} ${notification.fading ? 'fade-out' : ''}`}
                        style={{
                            pointerEvents: 'auto',
                            minWidth: '340px',
                            maxWidth: '450px',
                            padding: '16px 20px',
                            borderRadius: '16px',
                            background: '#ffffff',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            borderLeft: `5px solid ${notification.type === 'success' ? '#21808d' : '#ef4444'}`,
                            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ fontSize: '24px', flexShrink: 0 }}>
                            {notification.type === 'success' ? '✅' : '❌'}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ 
                                display: 'block', 
                                fontWeight: '800', 
                                fontSize: '14px', 
                                color: '#1e293b',
                                lineHeight: '1.2',
                                margin: 0
                            }}>
                                {notification.type === 'success' ? 'Success' : 'Attention'}
                            </span>
                            <span style={{ 
                                display: 'block', 
                                fontSize: '13px', 
                                color: '#64748b',
                                lineHeight: '1.4',
                                fontWeight: '500',
                                margin: 0
                            }}>
                                {notification.message}
                            </span>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PlantSetup;
