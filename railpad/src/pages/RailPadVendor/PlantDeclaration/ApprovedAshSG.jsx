import React, { useState } from 'react';

const ApprovedAshSG = ({ entries, setEntries }) => {
    const [view, setView] = useState('list');
    const [padType, setPadType] = useState('');
    const [formData, setFormData] = useState({
        ashA: '', ashB: '', sgA: '', sgB: '', refNo: '', date: ''
    });
    const [errors, setErrors] = useState({});
    const [editingEntry, setEditingEntry] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);

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

        // Reconstruct form data from display strings if necessary, 
        // or better yet, store the raw values in the entry.
        if (entry.rawValues) {
            setFormData(entry.rawValues);
        } else {
            // Fallback for existing entries
            const ashVals = entry.ash.split(' / ');
            const sgVals = entry.sg.split(' / ');
            setFormData({
                ashA: ashVals[0]?.replace('%', '') || '',
                ashB: ashVals[1]?.replace('%', '') || '',
                sgA: sgVals[0] || '',
                sgB: sgVals[1] || '',
                refNo: entry.refNo,
                date: entry.date
            });
        }
        setView('form');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (Object.keys(errors).length === 0) {
            const entryIsCGRSP = isCGRSP(padType);
            const entryData = {
                padType: padType,
                ash: entryIsCGRSP ? `${formData.ashA}% / ${formData.ashB}%` : `${formData.ashA}%`,
                sg: entryIsCGRSP ? `${formData.sgA} / ${formData.sgB}` : formData.sgA,
                refNo: formData.refNo,
                date: formData.date,
                rawValues: { ...formData },
                status: "Pending Verification"
            };

            if (editingEntry) {
                const updatedEntries = entries.map(entry =>
                    entry.id === editingEntry.id ? { ...entry, ...entryData } : entry
                );
                setEntries(updatedEntries);
                setEditingEntry(null);
            } else {
                const newEntry = {
                    id: Date.now(),
                    ...entryData
                };
                setEntries([...entries, newEntry]);
            }

            setView('list');
            // Reset form
            setPadType('');
            setFormData({ ashA: '', ashB: '', sgA: '', sgB: '', refNo: '', date: '' });
        }
    };

    return (
        <div className="fade-in">
            <div className="section-header" style={{ marginBottom: '24px' }}>
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

            {view === 'list' ? (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Rail Pad Type</th>
                                <th>Appr. Ash (%)</th>
                                <th>Appr. S.G.</th>
                                <th>Approval Reference</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => (
                                <tr key={entry.id}>
                                    <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{entry.padType}</td>
                                    <td>{entry.ash}</td>
                                    <td>{entry.sg}</td>
                                    <td>{entry.refNo}</td>
                                    <td>{entry.date}</td>
                                    <td>
                                        <span className={`badge ${entry.status === 'Verified & Locked' ? 'badge-verified' : 'badge-pending'}`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {(entry.status === 'Pending Verification' || entry.status === 'Unlocked for Modification') && (
                                                <button
                                                    onClick={() => handleEdit(entry)}
                                                    style={{
                                                        padding: '4px 10px',
                                                        fontSize: '11px',
                                                        background: 'rgba(66, 129, 140, 0.1)',
                                                        color: 'var(--primary-color)',
                                                        border: '1px solid var(--primary-color)',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontWeight: '700'
                                                    }}
                                                >
                                                    Modify
                                                </button>
                                            )}
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: '0.4rem 1rem', fontSize: '11px' }}
                                                onClick={() => { setSelectedEntry(entry); setView('details'); }}
                                            >
                                                Details
                                            </button>
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
                            {editingEntry ? 'Modify Baseline Values' : 'Submit Baseline Values'}
                        </h3>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ maxWidth: '400px', marginBottom: '24px' }}>
                            <label className="form-label">Rail Pad Type Selection</label>
                            <select className="form-select" value={padType} onChange={(e) => setPadType(e.target.value)} required >
                                <option value="">Select Type</option>
                                {padTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {padType && (
                            <div style={{ background: 'var(--accent-bg)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(66, 129, 140, 0.15)', marginTop: '24px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Baseline Details {isCGRSP(padType) ? '(Dual Layer Compounds)' : ''}
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Appr. Ash Content {isCGRSP(padType) ? '(A-Hard Side)' : '(%)'}</label>
                                        <input type="number" step="0.01" className="form-input" value={formData.ashA} onChange={(e) => handleFieldChange('ashA', e.target.value)} required />
                                        {errors.ashA && <div className="error-msg">{errors.ashA}</div>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Appr. Specific Gravity {isCGRSP(padType) ? '(A)' : ''}</label>
                                        <input type="number" step="0.01" className="form-input" value={formData.sgA} onChange={(e) => handleFieldChange('sgA', e.target.value)} required />
                                        {errors.sgA && <div className="error-msg">{errors.sgA}</div>}
                                    </div>
                                    {isCGRSP(padType) && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Appr. Ash Content (B-Soft Side)</label>
                                                <input type="number" step="0.01" className="form-input" value={formData.ashB} onChange={(e) => handleFieldChange('ashB', e.target.value)} required />
                                                {errors.ashB && <div className="error-msg">{errors.ashB}</div>}
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Appr. Specific Gravity (B)</label>
                                                <input type="number" step="0.01" className="form-input" value={formData.sgB} onChange={(e) => handleFieldChange('sgB', e.target.value)} required />
                                                {errors.sgB && <div className="error-msg">{errors.sgB}</div>}
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

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" disabled={Object.keys(errors).length > 0 || !padType} style={{ padding: '0.8rem 3rem', opacity: (Object.keys(errors).length > 0 || !padType) ? 0.5 : 1 }}>
                                {editingEntry ? 'Update Baseline' : 'Submit Baseline'}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px', padding: '20px', background: 'var(--accent-bg)', borderRadius: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>Rail Pad Type</label>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedEntry?.padType}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>Current Status</label>
                            <span className={`badge ${selectedEntry?.status === 'Verified & Locked' ? 'badge-verified' : 'badge-pending'}`}>
                                {selectedEntry?.status}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div style={{ background: 'rgba(66, 129, 140, 0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(66, 129, 140, 0.1)' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', marginTop: 0 }}>Approved Values</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Approved Ash (%)</label>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>{selectedEntry?.ash}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Approved Specific Gravity</label>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>{selectedEntry?.sg}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', marginTop: 0 }}>Reference Details</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Approval Reference</label>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedEntry?.refNo}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Approval Date</label>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedEntry?.date}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isCGRSP(selectedEntry?.padType) && (
                        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <i style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: 'var(--text-main)' }}>Note on Multi-Layer Composition:</i>
                            The values shown above are represented as <b>Layer A (Hard) / Layer B (Soft)</b>. For monitoring purposes, individual layer values must be verified against their respective baselines.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ApprovedAshSG;
