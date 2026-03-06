import React, { useState } from 'react';

const PAD_TYPES = [
    "6.00mm GRSP",
    "10.00mm GRSP",
    "6.20mm CGRSP",
    "10.00mm CGRSP",
    "6.00mm NCRGRSP",
    "10.00mm NCRGRSP"
];

const APPROVING_AUTHORITIES = ["RDSO", "Zonal Railway", "Ministry of Railways", "Other"];

const emptyProductParams = () => ({
    // Mixing
    minMixTime: '', maxMixTime: '',
    minMixTemp: '', maxMixTemp: '',
    mixWeight: '',
    // Moulding
    minCureTime: '', maxCureTime: '',
    minCureTemp: '', maxCureTemp: '',
    minCurePress: '', maxCurePress: ''
});

const emptyForm = () => ({
    qapNo: '',
    qapApprovalDate: '',
    qapEffectiveDate: '',
    qapApprovingAuthority: '',
    qapValidityDate: '',
    selectedPadTypes: [],
    productParams: {}
});

const getBadgeClass = (status) => {
    if (status === 'Verified') return 'badge-verified';
    if (status === 'Rejected') return 'badge-rejected';
    return 'badge-pending';
};

const summarizeMixing = (params) => {
    if (!params) return '—';
    const parts = [];
    if (params.minMixTime || params.maxMixTime) parts.push(`Time: ${params.minMixTime}-${params.maxMixTime}m`);
    if (params.minMixTemp || params.maxMixTemp) parts.push(`Temp: ${params.minMixTemp}-${params.maxMixTemp}°C`);
    return parts.join(' | ') || '—';
};

const summarizeMoulding = (params) => {
    if (!params) return '—';
    const parts = [];
    if (params.minCureTime || params.maxCureTime) parts.push(`Time: ${params.minCureTime}-${params.maxCureTime}m`);
    if (params.minCureTemp || params.maxCureTemp) parts.push(`Temp: ${params.minCureTemp}-${params.maxCureTemp}°C`);
    if (params.minCurePress || params.maxCurePress) parts.push(`Press: ${params.minCurePress}-${params.maxCurePress} Kg/cm²`);
    return parts.join(' | ') || '—';
};

/* ── Multi-select Dropdown ─────────────────────────────────────────────── */
const MultiSelect = ({ options, selected, onChange }) => {
    const [open, setOpen] = useState(false);

    const toggle = (val) => {
        const next = selected.includes(val)
            ? selected.filter(v => v !== val)
            : [...selected, val];
        onChange(next);
    };

    return (
        <div style={{ position: 'relative' }}>
            <div
                className="form-input"
                style={{
                    height: 'auto', minHeight: '40px', padding: '6px 12px',
                    cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: '4px',
                    alignItems: 'center', userSelect: 'none'
                }}
                onClick={() => setOpen(o => !o)}
            >
                {selected.length === 0 && <span style={{ color: '#94a3b8', fontSize: 'var(--fs-md)' }}>Select pad types…</span>}
                {selected.map(s => (
                    <span key={s} style={{
                        background: 'rgba(33,128,141,0.12)', color: 'var(--primary-color)',
                        borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '600'
                    }}>
                        {s}
                        <span
                            style={{ marginLeft: '6px', cursor: 'pointer', fontWeight: '800', opacity: 0.7 }}
                            onClick={e => { e.stopPropagation(); toggle(s); }}
                        >×</span>
                    </span>
                ))}
                <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '12px' }}>▾</span>
            </div>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999,
                    background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden'
                }}>
                    {options.map(opt => (
                        <div
                            key={opt}
                            onClick={() => toggle(opt)}
                            style={{
                                padding: '10px 14px', cursor: 'pointer', fontSize: 'var(--fs-sm)',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: selected.includes(opt) ? 'rgba(33,128,141,0.06)' : '#fff',
                                color: selected.includes(opt) ? 'var(--primary-color)' : 'var(--text-main)',
                                transition: 'background 0.15s'
                            }}
                        >
                            <span style={{
                                width: '16px', height: '16px', borderRadius: '4px',
                                border: `2px solid ${selected.includes(opt) ? 'var(--primary-color)' : '#cbd5e1'}`,
                                background: selected.includes(opt) ? 'var(--primary-color)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                {selected.includes(opt) && (
                                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </span>
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Product Params Block (per pad type) ────────────────────────────────── */
const ProductParamsBlock = ({ padType, params, onChange }) => {
    const field = (key) => (
        <input
            type="number"
            step="0.01"
            className="form-input"
            value={params[key]}
            onChange={e => onChange(padType, key, e.target.value)}
            placeholder="—"
        />
    );

    return (
        <div style={{
            border: '1px solid rgba(66,129,140,0.2)',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '20px',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(33,128,141,0.06)'
        }}>
            {/* Pad type header */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(33,128,141,0.08) 0%, rgba(33,128,141,0.03) 100%)',
                padding: '10px 18px',
                borderBottom: '1px solid rgba(66,129,140,0.15)',
                display: 'flex', alignItems: 'center', gap: '10px'
            }}>
                <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'var(--primary-color)', flexShrink: 0
                }} />
                <span style={{ fontWeight: '800', fontSize: 'var(--fs-md)', color: 'var(--primary-color)' }}>
                    {padType}
                </span>
            </div>

            <div style={{ padding: '18px' }}>
                {/* Mixing Section */}
                <div style={{
                    fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: '#7c5c2e',
                    background: '#fdf8e6', padding: '6px 12px', borderRadius: '6px',
                    marginBottom: '14px', display: 'inline-block'
                }}>
                    🔄 Mixing Parameters
                </div>
                <div className="form-grid" style={{ marginBottom: '20px' }}>
                    <div className="form-group">
                        <label className="form-label">1.1 Min Mixing Time (min)</label>
                        {field('minMixTime')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">1.2 Max Mixing Time (min)</label>
                        {field('maxMixTime')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">1.3 Min Mixing Temp (°C)</label>
                        {field('minMixTemp')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">1.4 Max Mixing Temp (°C)</label>
                        {field('maxMixTemp')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">1.5 Mixing Weight (Kg)</label>
                        {field('mixWeight')}
                    </div>
                </div>

                {/* Moulding Section */}
                <div style={{
                    fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: '#1a5276',
                    background: '#eaf4fb', padding: '6px 12px', borderRadius: '6px',
                    marginBottom: '14px', display: 'inline-block'
                }}>
                    🏭 Moulding Parameters
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">2.1 Min Curing Time (min)</label>
                        {field('minCureTime')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">2.2 Max Curing Time (min)</label>
                        {field('maxCureTime')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">2.3 Min Curing Temp (°C)</label>
                        {field('minCureTemp')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">2.4 Max Curing Temp (°C)</label>
                        {field('maxCureTemp')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">2.5 Min Curing Pressure (Kg/cm²)</label>
                        {field('minCurePress')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">2.6 Max Curing Pressure (Kg/cm²)</label>
                        {field('maxCurePress')}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Main Component ─────────────────────────────────────────────────────── */
const ApprovedQAP = ({ entries, setEntries }) => {
    const [view, setView] = useState('list');           // 'list' | 'form' | 'view'
    const [editingId, setEditingId] = useState(null);
    const [activeProductTab, setActiveProductTab] = useState(null);
    const [form, setForm] = useState(emptyForm());

    /* ── Helpers ── */
    const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handlePadTypeChange = (selected) => {
        const oldParams = form.productParams;
        const newParams = {};
        selected.forEach(pt => {
            newParams[pt] = oldParams[pt] || emptyProductParams();
        });
        setForm(f => ({ ...f, selectedPadTypes: selected, productParams: newParams }));
        if (selected.length > 0 && !selected.includes(activeProductTab)) {
            setActiveProductTab(selected[0]);
        }
    };

    const handleParamChange = (padType, key, val) => {
        setForm(f => ({
            ...f,
            productParams: {
                ...f.productParams,
                [padType]: { ...f.productParams[padType], [key]: val }
            }
        }));
    };

    const openAdd = () => {
        setForm(emptyForm());
        setEditingId(null);
        setActiveProductTab(null);
        setView('form');
    };

    const openView = (entry) => {
        setForm({
            qapNo: entry.qapNo,
            qapApprovalDate: entry.qapApprovalDate,
            qapEffectiveDate: entry.qapEffectiveDate,
            qapApprovingAuthority: entry.qapApprovingAuthority,
            qapValidityDate: entry.qapValidityDate,
            selectedPadTypes: entry.selectedPadTypes,
            productParams: entry.productParams
        });
        setEditingId(entry.id);
        setActiveProductTab(entry.selectedPadTypes?.[0] || null);
        setView('view');
    };

    const openEdit = (entry) => {
        openView(entry);
        setView('form');
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this QAP entry?')) {
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (form.selectedPadTypes.length === 0) {
            alert('Please select at least one Rail Pad Type.');
            return;
        }

        const payload = {
            id: editingId || Date.now(),
            qapNo: form.qapNo,
            qapApprovalDate: form.qapApprovalDate,
            qapEffectiveDate: form.qapEffectiveDate,
            qapApprovingAuthority: form.qapApprovingAuthority,
            qapValidityDate: form.qapValidityDate,
            selectedPadTypes: form.selectedPadTypes,
            productParams: form.productParams,
            status: 'Unverified'
        };

        if (editingId) {
            setEntries(entries.map(e => e.id === editingId ? payload : e));
        } else {
            setEntries([...entries, payload]);
        }
        setView('list');
        setEditingId(null);
    };

    const isEditable = (entry) => entry.status === 'Unverified' || entry.status === 'Unlocked';

    const canDelete = (entry) => entry.status === 'Unverified';

    /* ── Read-only View ── */
    if (view === 'view') {
        const entry = entries.find(e => e.id === editingId);
        return (
            <div className="fade-in">
                <div className="section-header" style={{ marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                            QAP Details
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                            QAP No: <strong>{entry?.qapNo}</strong>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {entry && isEditable(entry) && (
                            <button className="btn-primary" onClick={() => openEdit(entry)}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Edit
                            </button>
                        )}
                        <button className="btn-secondary" onClick={() => setView('list')}>← Back to List</button>
                    </div>
                </div>

                <div className="form-container fade-in">
                    {/* Section A */}
                    <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '16px' }}>
                            Section A — QAP Document Details
                        </div>
                        <div className="form-grid">
                            {[
                                ['QAP No.', entry?.qapNo],
                                ['Approving Authority', entry?.qapApprovingAuthority],
                                ['Approval Date', entry?.qapApprovalDate],
                                ['Effective Date', entry?.qapEffectiveDate],
                                ['Validity Date', entry?.qapValidityDate],
                            ].map(([label, val]) => (
                                <div key={label}>
                                    <div style={{ fontSize: 'var(--fs-xs)', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                                    <div style={{ fontSize: 'var(--fs-md)', fontWeight: '600', color: 'var(--text-main)' }}>{val || '—'}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section B – product tabs */}
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '16px' }}>
                            Section B — Process Parameters
                        </div>
                        {/* Tab bar */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                            {entry?.selectedPadTypes?.map(pt => (
                                <button
                                    key={pt}
                                    onClick={() => setActiveProductTab(pt)}
                                    style={{
                                        padding: '6px 14px', border: 'none', borderRadius: '20px',
                                        cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                        background: activeProductTab === pt ? 'var(--primary-color)' : 'rgba(33,128,141,0.08)',
                                        color: activeProductTab === pt ? '#fff' : 'var(--primary-color)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {pt}
                                </button>
                            ))}
                        </div>

                        {activeProductTab && entry?.productParams?.[activeProductTab] && (
                            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
                                {/* Mixing */}
                                <div style={{ background: '#fdf8e6', borderRadius: '12px', padding: '18px', border: '1px solid #f0e6c0' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#7c5c2e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>🔄 Mixing</div>
                                    {[
                                        ['Min Time', `${entry.productParams[activeProductTab].minMixTime} min`],
                                        ['Max Time', `${entry.productParams[activeProductTab].maxMixTime} min`],
                                        ['Min Temp', `${entry.productParams[activeProductTab].minMixTemp} °C`],
                                        ['Max Temp', `${entry.productParams[activeProductTab].maxMixTemp} °C`],
                                        ['Weight', `${entry.productParams[activeProductTab].mixWeight} Kg`],
                                    ].map(([l, v]) => (
                                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0e6c0', fontSize: 'var(--fs-sm)' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{v || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Moulding */}
                                <div style={{ background: '#eaf4fb', borderRadius: '12px', padding: '18px', border: '1px solid #c0dff0' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#1a5276', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>🏭 Moulding</div>
                                    {[
                                        ['Min Cure Time', `${entry.productParams[activeProductTab].minCureTime} min`],
                                        ['Max Cure Time', `${entry.productParams[activeProductTab].maxCureTime} min`],
                                        ['Min Temp', `${entry.productParams[activeProductTab].minCureTemp} °C`],
                                        ['Max Temp', `${entry.productParams[activeProductTab].maxCureTemp} °C`],
                                        ['Min Pressure', `${entry.productParams[activeProductTab].minCurePress} Kg/cm²`],
                                        ['Max Pressure', `${entry.productParams[activeProductTab].maxCurePress} Kg/cm²`],
                                    ].map(([l, v]) => (
                                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #c0dff0', fontSize: 'var(--fs-sm)' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{v || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ── Add/Edit Form ── */
    if (view === 'form') {
        return (
            <div className="fade-in">
                <div className="section-header" style={{ marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                            {editingId ? 'Edit QAP Entry' : 'Add New QAP Entry'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                            Declare approved Quality Assurance Plan parameters for Rail Pads
                        </p>
                    </div>
                    <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Section A */}
                    <div className="form-container fade-in" style={{ marginBottom: '20px' }}>
                        <div style={{
                            fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                            letterSpacing: '0.07em', color: 'var(--primary-color)',
                            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <span style={{
                                background: 'var(--primary-color)', color: '#fff',
                                width: '20px', height: '20px', borderRadius: '50%',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: '900', flexShrink: 0
                            }}>A</span>
                            QAP Document Details
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">QAP No. <span style={{ color: '#dc2626' }}>*</span></label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. QAP/RDSO/2024/001"
                                    value={form.qapNo}
                                    onChange={e => setField('qapNo', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">QAP Approving Authority <span style={{ color: '#dc2626' }}>*</span></label>
                                <select
                                    className="form-select"
                                    value={form.qapApprovingAuthority}
                                    onChange={e => setField('qapApprovingAuthority', e.target.value)}
                                    required
                                >
                                    <option value="">Select Authority</option>
                                    {APPROVING_AUTHORITIES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">QAP Approval Date <span style={{ color: '#dc2626' }}>*</span></label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={form.qapApprovalDate}
                                    onChange={e => setField('qapApprovalDate', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">QAP Effective Date <span style={{ color: '#dc2626' }}>*</span></label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={form.qapEffectiveDate}
                                    onChange={e => setField('qapEffectiveDate', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">QAP Validity Date <span style={{ color: '#dc2626' }}>*</span></label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={form.qapValidityDate}
                                    onChange={e => setField('qapValidityDate', e.target.value)}
                                    required
                                />
                                <span style={{ fontSize: '10px', color: '#0ea5e9', fontWeight: '600', marginTop: '2px' }}>
                                    ℹ️ Alerts will be triggered before this date expires
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section B */}
                    <div className="form-container fade-in">
                        <div style={{
                            fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                            letterSpacing: '0.07em', color: 'var(--primary-color)',
                            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <span style={{
                                background: 'var(--primary-color)', color: '#fff',
                                width: '20px', height: '20px', borderRadius: '50%',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: '900', flexShrink: 0
                            }}>B</span>
                            Product Selection &amp; Parameters
                        </div>

                        <div className="form-group" style={{ marginBottom: '24px', maxWidth: '600px' }}>
                            <label className="form-label">Rail Pad Type(s) <span style={{ color: '#dc2626' }}>*</span></label>
                            <MultiSelect
                                options={PAD_TYPES}
                                selected={form.selectedPadTypes}
                                onChange={handlePadTypeChange}
                            />
                            {form.selectedPadTypes.length === 0 && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Select one or more pad types to define their QAP parameters below
                                </span>
                            )}
                        </div>

                        {/* Tab bar for pad types */}
                        {form.selectedPadTypes.length > 0 && (
                            <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                    {form.selectedPadTypes.map(pt => (
                                        <button
                                            key={pt}
                                            type="button"
                                            onClick={() => setActiveProductTab(pt)}
                                            style={{
                                                padding: '6px 14px', border: 'none', borderRadius: '20px',
                                                cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                                                background: activeProductTab === pt ? 'var(--primary-color)' : 'rgba(33,128,141,0.08)',
                                                color: activeProductTab === pt ? '#fff' : 'var(--primary-color)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {pt}
                                        </button>
                                    ))}
                                </div>

                                {activeProductTab && (
                                    <ProductParamsBlock
                                        key={activeProductTab}
                                        padType={activeProductTab}
                                        params={form.productParams[activeProductTab] || emptyProductParams()}
                                        onChange={handleParamChange}
                                    />
                                )}

                                {!activeProductTab && (
                                    <div style={{
                                        padding: '32px', textAlign: 'center',
                                        color: 'var(--text-muted)', fontSize: 'var(--fs-sm)',
                                        border: '2px dashed var(--border-color)', borderRadius: '12px'
                                    }}>
                                        Select a pad type tab above to enter its QAP parameters
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
                        <button type="submit" className="btn-primary" style={{ padding: '0.8rem 3rem' }}>
                            {editingId ? 'Update QAP Entry' : 'Submit QAP Entry'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    /* ── List View ── */
    return (
        <div className="fade-in">
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                        Approved QAP Values
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                        Declare approved Quality Assurance Plan parameters — used as master reference for process validation
                    </p>
                </div>
                <button className="btn-primary" onClick={openAdd}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14" /><path d="M12 5v14" />
                    </svg>
                    Add New Entry
                </button>
            </div>

            <div className="table-container fade-in">
                <table>
                    <thead>
                        <tr>
                            <th>QAP No.</th>
                            <th>Rail Pad Type(s)</th>
                            <th>Mixing Parameters</th>
                            <th>Moulding Parameters</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No QAP entries found. Click "Add New Entry" to get started.
                                </td>
                            </tr>
                        )}
                        {entries.map(entry => {
                            const firstPad = entry.selectedPadTypes?.[0];
                            const firstParams = firstPad ? entry.productParams?.[firstPad] : null;
                            return (
                                <tr key={entry.id}>
                                    <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{entry.qapNo}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {entry.selectedPadTypes?.map(pt => (
                                                <span key={pt} style={{
                                                    background: 'rgba(33,128,141,0.1)', color: 'var(--primary-color)',
                                                    borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: '600'
                                                }}>{pt}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '200px' }}>
                                        {firstPad ? (
                                            <span title={summarizeMixing(firstParams)}>{summarizeMixing(firstParams)}</span>
                                        ) : '—'}
                                        {entry.selectedPadTypes?.length > 1 && (
                                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}> +{entry.selectedPadTypes.length - 1} more</span>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                                        {firstPad ? (
                                            <span title={summarizeMoulding(firstParams)}>{summarizeMoulding(firstParams)}</span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        <span className={`badge ${getBadgeClass(entry.status)}`}>{entry.status}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                onClick={() => isEditable(entry) ? openEdit(entry) : openView(entry)}
                                                style={{
                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                                                    fontWeight: '600', cursor: 'pointer', border: '1px solid #cbd5e1',
                                                    background: 'transparent', color: 'var(--text-main)', transition: 'all 0.2s'
                                                }}
                                            >
                                                {isEditable(entry) ? 'View / Edit' : 'View'}
                                            </button>
                                            {canDelete(entry) && (
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    style={{
                                                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                                                        fontWeight: '600', cursor: 'pointer', border: '1px solid #fca5a5',
                                                        background: '#fff5f5', color: '#dc2626', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ApprovedQAP;
