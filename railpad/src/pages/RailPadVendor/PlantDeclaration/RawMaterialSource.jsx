import React, { useState } from 'react';
import { rawMaterialService } from '../../../services/rawMaterialService';

const RawMaterialSource = ({ entries, setEntries, onRefresh, isLoading }) => {
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
    const [view, setView] = useState('list');
    const [statusTab, setStatusTab] = useState('PENDING');
    const [formData, setFormData] = useState({
        materialName: '',
        materialType: '',
        supplierName: '',
        docRefNo: '',
        docDate: ''
    });
    const [editingEntry, setEditingEntry] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);

    const pendingStatuses = ['CREATED', 'PENDING', 'NOT_STARTED', 'IN_PROGRESS'];
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
        "Plasticizer": ["Paraffin Wax"]
    };

    const handleMaterialChange = (e) => {
        const val = e.target.value;
        setFormData({
            ...formData,
            materialName: val,
            materialType: '' // Reset dependent dropdown
        });
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setFormData({
            materialName: entry.materialName,
            materialType: entry.materialType,
            supplierName: entry.supplierName,
            docRefNo: entry.docRefNo,
            docDate: entry.docDate || ''
        });
        setView('form');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this raw material source?')) {
            try {
                await rawMaterialService.delete(id);
                onRefresh();
            } catch (error) {
                alert('Error deleting entry: ' + error.message);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const plantId = localStorage.getItem('railpad_selectedPlantId');
            const payload = {
                ...formData,
                vendorName: user?.vendorName || "",
                vendorCode: user?.vendorCode || "",
                plantId: plantId || "1",
                shift: "General",
                status: "PENDING",
                createdBy: user?.userId || 1,
                updatedBy: user?.userId || 1
            };

            if (editingEntry) {
                await rawMaterialService.update(editingEntry.id, payload);
            } else {
                await rawMaterialService.create(payload);
            }

            onRefresh();
            setView('list');
            setFormData({
                materialName: '',
                materialType: '',
                supplierName: '',
                docRefNo: '',
                docDate: ''
            });
            setEditingEntry(null);
        } catch (error) {
            alert('Error saving entry: ' + error.message);
        } finally {
            setIsSaving(false);
        }
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
                    <button className="btn-primary" onClick={() => { setView('form'); setEditingEntry(null); setFormData({ materialName: '', materialType: '', supplierName: '', docRefNo: '', docDate: '' }); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Add New Entry
                    </button>
                )}
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div className="spinner"></div>
                    <p>Loading raw material entries...</p>
                </div>
            ) : view === 'list' ? (
                <div className="fade-in">
                    <div className="status-tabs-row">
                        <button 
                            onClick={() => setStatusTab('PENDING')}
                            className={`status-tab ${statusTab === 'PENDING' ? 'active' : ''}`}
                        >
                            <span className="dot pending"></span>
                            Pending Verification
                            <span className="count-badge">{pendingCount}</span>
                        </button>
                        <button 
                            onClick={() => setStatusTab('COMPLETED')}
                            className={`status-tab ${statusTab === 'COMPLETED' ? 'active' : ''}`}
                        >
                            <span className="dot success"></span>
                            Verified Stock
                            <span className="count-badge">{verifiedCount}</span>
                        </button>
                    </div>

                    <div className="table-container fade-in">
                        <table>
                            <thead>
                                <tr>
                                    <th>Raw Material Name</th>
                                    <th>Supplier / Source</th>
                                    <th>Document Reference</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.length > 0 ? (
                                    filteredEntries.map(entry => (
                                        <tr key={entry.id}>
                                            <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                                                {entry.materialName} {entry.materialType ? `(${entry.materialType})` : ''}
                                            </td>
                                            <td>{entry.supplierName}</td>
                                            <td>{entry.docRefNo}</td>
                                            <td>
                                                <span className={`badge ${verifiedStatuses.includes(entry.status) ? 'badge-verified' : 'badge-pending'}`}>
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
                                    value={formData.materialName}
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
                                    value={formData.materialType}
                                    onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                                    required
                                    disabled={!formData.materialName || formData.materialName === 'Silica'}
                                    style={{ background: (!formData.materialName || formData.materialName === 'Silica') ? '#f1f5f9' : 'white' }}
                                >
                                    <option value="">Select Type</option>
                                    {formData.materialName && dependentOptions[formData.materialName].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                {formData.materialName === 'Silica' && (
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
                                    value={formData.supplierName}
                                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Doc Reference No.</label>
                                <input
                                    className="form-input"
                                    placeholder="Invoice / e-way bill"
                                    value={formData.docRefNo}
                                    onChange={(e) => setFormData({ ...formData, docRefNo: e.target.value })}
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
                            <button type="submit" className="btn-primary" style={{ padding: '0.8rem 3rem' }} disabled={isSaving}>
                                {isSaving ? 'Saving...' : (editingEntry ? 'Update Entry' : 'Submit Entry')}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="details-card fade-in">
                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'var(--primary-color)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>1</span>
                        Material Identification
                    </div>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">Material Name</div>
                            <div className="info-value">{selectedEntry?.materialName}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Material Type</div>
                            <div className="info-value">{selectedEntry?.materialType || 'N/A'}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Supplier / Source</div>
                            <div className="info-value">{selectedEntry?.supplierName}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Current Status</div>
                            <div className="info-value">
                                <span className={`badge ${verifiedStatuses.includes(selectedEntry?.status) ? 'badge-verified' : 'badge-pending'}`}>
                                    {selectedEntry?.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="section-divider"></div>

                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'var(--primary-color)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>2</span>
                        Document Traceability
                    </div>

                    <div className="params-grid">
                        <div className="param-box">
                            <div className="param-box-header">
                                <span>📄</span>
                                <h4>Reference Details</h4>
                            </div>
                            <div className="param-row">
                                <span className="param-label">Document Ref. No.</span>
                                <span className="param-value">{selectedEntry?.docRefNo}</span>
                            </div>
                            <div className="param-row">
                                <span className="param-label">Document Date</span>
                                <span className="param-value">{selectedEntry?.docDate || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="param-box">
                            <div className="param-box-header">
                                <span>🛤️</span>
                                <h4>Traceability Timeline</h4>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '4px 0' }}>
                                <div style={{ marginTop: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0 }}></div>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>Stock Verified</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Verified against physical inventory and test certificates.</div>
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
