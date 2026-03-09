import React, { useState } from 'react';

const ApprovedAshSG = ({ entries, setEntries }) => {
    const [view, setView] = useState('list');
    const [padType, setPadType] = useState('');
    const [formData, setFormData] = useState({
        ashA: '', ashB: '', sgA: '', sgB: '', refNo: '', date: ''
    });
    const [errors, setErrors] = useState({});

    const padTypes = ["6.00mm GRSP", "10.00mm GRSP", "6.20mm CGRSP", "10.00mm CGRSP", "6.00mm NCRGRSP", "10.00mm NCRGRSP"];

    const isCGRSP = padType && padType.includes('CGRSP');

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (Object.keys(errors).length === 0) {
            const newEntry = {
                id: Date.now(),
                padType: padType,
                ash: isCGRSP ? `${formData.ashA}% / ${formData.ashB}%` : `${formData.ashA}%`,
                sg: isCGRSP ? `${formData.sgA} / ${formData.sgB}` : formData.sgA,
                refNo: formData.refNo,
                date: formData.date,
                status: "Pending Verification"
            };
            setEntries([...entries, newEntry]);
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
                    <button className="btn-primary" onClick={() => setView('form')}>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="form-container fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '800' }}>Submit Baseline Values</h3>
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
                                    Baseline Details {isCGRSP ? '(Dual Layer Compounds)' : ''}
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Appr. Ash Content {isCGRSP ? '(A-Hard Side)' : '(%)'}</label>
                                        <input type="number" step="0.01" className="form-input" value={formData.ashA} onChange={(e) => handleFieldChange('ashA', e.target.value)} required />
                                        {errors.ashA && <div className="error-msg">{errors.ashA}</div>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Appr. Specific Gravity {isCGRSP ? '(A)' : ''}</label>
                                        <input type="number" step="0.01" className="form-input" value={formData.sgA} onChange={(e) => handleFieldChange('sgA', e.target.value)} required />
                                        {errors.sgA && <div className="error-msg">{errors.sgA}</div>}
                                    </div>
                                    {isCGRSP && (
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
                            <button type="submit" className="btn-primary" disabled={Object.keys(errors).length > 0 || !padType} style={{ padding: '0.8rem 3rem', opacity: (Object.keys(errors).length > 0 || !padType) ? 0.5 : 1 }}>Submit Baseline</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ApprovedAshSG;
