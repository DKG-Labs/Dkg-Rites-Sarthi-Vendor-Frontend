import React, { useState } from 'react';
import { approvedAshSGService } from '../../../services/approvedAshSGService';

const ApprovedAshSG = ({ entries, setEntries, onRefresh, isLoading }) => {
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
    const [padType, setPadType] = useState('');
    const [formData, setFormData] = useState({
        ashA: '', ashB: '', sgA: '', sgB: '', refNo: '', date: ''
    });
    const [errors, setErrors] = useState({});
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

    const padTypes = ["6.00mm GRSP", "10.00mm GRSP", "6.20mm CGRSP", "10.00mm CGRSP", "6.00mm NCRGRSP", "10.00mm NCRGRSP"];

    const isCGRSP = (pt) => pt && pt.includes('CGRSP');

    const handleFieldChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        validateField(field, value);
    };

    const validateField = (field, value) => {
        const val = parseFloat(value);
        let newErrors = { ...errors };

        if (field === 'ashA') {
            if (val > 27.0) newErrors.ashA = 'Max limit is 27.0%';
            else delete newErrors.ashA;
        } else if (field === 'ashB') {
            if (val > 20.0) newErrors.ashB = 'Max limit is 20.0%';
            else delete newErrors.ashB;
        } else if (field === 'sgA') {
            if (val > 1.27) newErrors.sgA = 'Max limit is 1.27';
            else delete newErrors.sgA;
        } else if (field === 'sgB') {
            if (val > 1.17) newErrors.sgB = 'Max limit is 1.17';
            else delete newErrors.sgB;
        }
        setErrors(newErrors);
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setPadType(entry.padType);
        setFormData({
            ashA: entry.ashContentA || '',
            ashB: entry.ashContentB || '',
            sgA: entry.specificGravityA || '',
            sgB: entry.specificGravityB || '',
            refNo: entry.approvalRefNo || '',
            date: entry.approvalDate || ''
        });
        setView('form');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this baseline?')) {
            try {
                await approvedAshSGService.delete(id);
                onRefresh();
            } catch (error) {
                alert('Error deleting entry: ' + error.message);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (Object.keys(errors).length === 0) {
            setIsSaving(true);
            try {
                const plantId = localStorage.getItem('railpad_selectedPlantId');
                const payload = {
                    vendorName: user?.vendorName || "",
                    vendorCode: user?.vendorCode || "",
                    plantId: plantId || "1",
                    shift: "General",
                    padType: padType,
                    ashContentA: parseFloat(formData.ashA),
                    specificGravityA: parseFloat(formData.sgA),
                    ashContentB: formData.ashB ? parseFloat(formData.ashB) : null,
                    specificGravityB: formData.sgB ? parseFloat(formData.sgB) : null,
                    approvalRefNo: formData.refNo,
                    approvalDate: formData.date,
                    status: "PENDING",
                    createdBy: user?.userId || 1,
                    updatedBy: user?.userId || 1
                };

                if (editingEntry) {
                    await approvedAshSGService.update(editingEntry.id, payload);
                } else {
                    await approvedAshSGService.create(payload);
                }

                onRefresh();
                setView('list');
                setPadType('');
                setFormData({ ashA: '', ashB: '', sgA: '', sgB: '', refNo: '', date: '' });
                setEditingEntry(null);
            } catch (error) {
                alert('Error saving entry: ' + error.message);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const SkeletonRow = () => (
        <tr style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
            <td style={{ padding: '20px 12px' }}>
                <div style={{ width: 100, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 60, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 60, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 100, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 80, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
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
                        <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Approved Ash & S.G.</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Capture chemical baseline values for quality monitoring</p>
                    </div>
                    {view === 'list' && (
                        <button className="btn-primary" onClick={() => { setView('form'); setEditingEntry(null); setPadType(''); setFormData({ ashA: '', ashB: '', sgA: '', sgB: '', refNo: '', date: '' }); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                            Add Baseline
                        </button>
                    )}
                </div>

                {view === 'list' && (
                    <div className="status-tabs-row" style={{ marginBottom: 0 }}>
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
                            Verified Baselines
                            <span className="count-badge">{verifiedCount}</span>
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
                                    <th>Rail Pad Type</th>
                                    <th>Appr. Ash (%)</th>
                                    <th>Appr. S.G.</th>
                                    <th>Reference No.</th>
                                    <th>Date</th>
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
                                            <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{entry.padType}</td>
                                            <td>
                                                {entry.ashContentA}%
                                                {isCGRSP(entry.padType) && entry.ashContentB && ` / ${entry.ashContentB}%`}
                                            </td>
                                            <td>
                                                {entry.specificGravityA}
                                                {isCGRSP(entry.padType) && entry.specificGravityB && ` / ${entry.specificGravityB}`}
                                            </td>
                                            <td>{entry.approvalRefNo}</td>
                                            <td>{entry.approvalDate}</td>
                                            <td>
                                                <span className={`badge ${verifiedStatuses.includes(entry.status) ? 'badge-verified' : 'badge-pending'}`}>
                                                    {entry.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="action-buttons-group" style={{ justifyContent: 'center' }}>
                                                    <button onClick={() => { setSelectedEntry(entry); setView('details'); }} className="btn-icon-action view">
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
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
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
                            {editingEntry ? 'Modify Baseline Values' : 'Submit Baseline Values'}
                        </h3>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                            <div className="form-group">
                                <label className="form-label">Rail Pad Type Selection</label>
                                <select className="form-select" value={padType} onChange={(e) => setPadType(e.target.value)} required >
                                    <option value="">Select Type</option>
                                    {padTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {padType && (
                            <div style={{ marginTop: '24px' }}>
                                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Appr. Ash Content {isCGRSP(padType) ? '(A-Hard Side) (%)' : '(%)'}</label>
                                        <input type="number" step="0.01" className="form-input" value={formData.ashA} onChange={(e) => handleFieldChange('ashA', e.target.value)} required />
                                        {errors.ashA && <div className="error-msg-sm">{errors.ashA}</div>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Appr. Specific Gravity {isCGRSP(padType) ? '(A)' : ''}</label>
                                        <input type="number" step="0.01" className="form-input" value={formData.sgA} onChange={(e) => handleFieldChange('sgA', e.target.value)} required />
                                        {errors.sgA && <div className="error-msg-sm">{errors.sgA}</div>}
                                    </div>
                                    {isCGRSP(padType) && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Appr. Ash Content (B-Soft Side) (%)</label>
                                                <input type="number" step="0.01" className="form-input" value={formData.ashB} onChange={(e) => handleFieldChange('ashB', e.target.value)} required />
                                                {errors.ashB && <div className="error-msg-sm">{errors.ashB}</div>}
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Appr. Specific Gravity (B)</label>
                                                <input type="number" step="0.01" className="form-input" value={formData.sgB} onChange={(e) => handleFieldChange('sgB', e.target.value)} required />
                                                {errors.sgB && <div className="error-msg-sm">{errors.sgB}</div>}
                                            </div>
                                        </>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Approval Reference (Letter No.)</label>
                                        <input className="form-input" value={formData.refNo} onChange={(e) => setFormData({ ...formData, refNo: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Approval Date</label>
                                        <input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={Object.keys(errors).length > 0 || !padType || isSaving}>
                                {isSaving ? 'Saving...' : (editingEntry ? 'Update Baseline' : 'Submit Baseline')}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="details-container fade-in" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.25rem', fontWeight: '800' }}>Baseline Details</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Approved chemical fingerprint values</p>
                        </div>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.5rem 1.5rem', fontWeight: '700' }}>Back to List</button>
                    </div>

                <div className="details-card fade-in">
                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'var(--primary-color)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>1</span>
                        Identification & Status
                    </div>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">Rail Pad Type</div>
                            <div className="info-value">{selectedEntry?.padType}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Current Status</div>
                            <div className="info-value">
                                <span className={`badge ${verifiedStatuses.includes(selectedEntry?.status) ? 'badge-verified' : 'badge-pending'}`}>
                                    {selectedEntry?.status}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Approval Reference</div>
                            <div className="info-value">{selectedEntry?.approvalRefNo}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Approval Date</div>
                            <div className="info-value">{selectedEntry?.approvalDate}</div>
                        </div>
                    </div>

                    <div className="section-divider"></div>

                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'var(--primary-color)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>2</span>
                        Approved Parameters
                    </div>

                    <div className="params-grid">
                        <div className="param-box">
                            <div className="param-box-header">
                                <span>📉</span>
                                <h4>Approved Ash Content</h4>
                            </div>
                            <div style={{ padding: '16px 0' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                                    {selectedEntry?.ashContentA}%
                                    {isCGRSP(selectedEntry?.padType) && selectedEntry?.ashContentB && (
                                        <span style={{ color: 'var(--primary-color)', marginLeft: '8px' }}>/ {selectedEntry?.ashContentB}%</span>
                                    )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {isCGRSP(selectedEntry?.padType) ? 'A-Side / B-Side Ash Content' : 'Approved Ash Content Percentage'}
                                </div>
                            </div>
                        </div>

                        <div className="param-box">
                            <div className="param-box-header">
                                <span>⚖️</span>
                                <h4>Specific Gravity</h4>
                            </div>
                            <div style={{ padding: '16px 0' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                                    {selectedEntry?.specificGravityA}
                                    {isCGRSP(selectedEntry?.padType) && selectedEntry?.specificGravityB && (
                                        <span style={{ color: 'var(--primary-color)', marginLeft: '8px' }}>/ {selectedEntry?.specificGravityB}</span>
                                    )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {isCGRSP(selectedEntry?.padType) ? 'A-Side / B-Side S.G.' : 'Approved Specific Gravity Value'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                    {isCGRSP(selectedEntry?.padType) && (
                        <div style={{ marginTop: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', fontSize: '12px', color: '#0369a1', lineHeight: '1.5' }}>
                            <strong style={{ display: 'block', marginBottom: '4px' }}>Note on Multi-Layer Composition:</strong>
                            The values shown above are represented as <b>Layer A (Hard) / Layer B (Soft)</b>. For monitoring purposes, individual layer values must be verified against their respective baselines.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ApprovedAshSG;
