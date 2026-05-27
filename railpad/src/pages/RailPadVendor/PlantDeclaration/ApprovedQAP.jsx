import React, { useState, useEffect, useRef } from 'react';
import { approvedQAPService } from '../../../services/approvedQAPService';

const PAD_TYPES = ["6.00mm GRSP", "10.00mm GRSP", "6.20mm CGRSP", "10.00mm CGRSP", "6.00mm NCRGRSP", "10.00mm NCRGRSP"];
const APPROVING_AUTHORITIES = ["RDSO", "Zonal Railway", "Ministry of Railways", "Other"];

const emptyProductParams = (padType) => ({
    padType: padType,
    minMixingTime: '', maxMixingTime: '',
    minMixingTemp: '', maxMixingTemp: '',
    mixingWeight: '',
    minCuringTime: '', maxCuringTime: '',
    minCuringTemp: '', maxCuringTemp: '',
    minCuringPressure: '', maxCuringPressure: ''
});

const emptyForm = () => ({
    qapNo: '',
    approvalDate: '',
    effectiveDate: '',
    approvingAuthority: '',
    validityDate: '',
    selectedPadTypes: [],
    productDetails: []
});

const getBadgeClass = (status) => {
    if (status === 'COMPLETED' || status === 'VERIFIED' || status === 'APPROVED') return 'badge-verified';
    if (status === 'REJECTED') return 'badge-rejected';
    return 'badge-pending';
};

const summarizeMixing = (params) => {
    if (!params) return '—';
    const parts = [];
    if (params.minMixingTime || params.maxMixingTime) parts.push(`Time: ${params.minMixingTime}-${params.maxMixingTime}m`);
    if (params.minMixingTemp || params.maxMixingTemp) parts.push(`Temp: ${params.minMixingTemp}-${params.maxMixingTemp}°C`);
    return parts.join(' | ') || '—';
};

const summarizeMoulding = (params) => {
    if (!params) return '—';
    const parts = [];
    if (params.minCuringTime || params.maxCuringTime) parts.push(`Time: ${params.minCuringTime}-${params.maxCuringTime}m`);
    if (params.minCuringTemp || params.maxCuringTemp) parts.push(`Temp: ${params.minCuringTemp}-${params.maxCuringTemp}°C`);
    if (params.minCuringPressure || params.maxCuringPressure) parts.push(`Press: ${params.minCuringPressure}-${params.maxCuringPressure} Kg/cm²`);
    return parts.join(' | ') || '—';
};

/* ── Multi-select Dropdown ─────────────────────────────────────────────── */
const MultiSelect = ({ options, selected, onChange }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        else document.removeEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const toggle = (val) => {
        const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val];
        onChange(next);
    };

    return (
        <div style={{ position: 'relative' }} ref={containerRef}>
            <div 
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    border: open ? '1px solid var(--primary-color)' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#fff',
                    cursor: 'pointer',
                    minHeight: '42px',
                    boxShadow: open ? '0 0 0 3px rgba(33,128,141,0.1)' : 'none',
                    transition: 'all 0.2s'
                }}
            >
                {selected.length === 0 && <span style={{ color: '#94a3b8', fontSize: '14px' }}>Select pad types...</span>}
                {selected.map(s => (
                    <span key={s} style={{
                        background: 'rgba(33,128,141,0.1)',
                        color: 'var(--primary-color)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {s}
                        <span 
                            onClick={e => { e.stopPropagation(); toggle(s); }}
                            style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', lineHeight: 1 }}
                        >×</span>
                    </span>
                ))}
                <span style={{ marginLeft: 'auto', color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </div>
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    zIndex: 50,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '8px'
                }}>
                    {options.map(opt => (
                        <div 
                            key={opt} 
                            onClick={() => toggle(opt)} 
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background: selected.includes(opt) ? 'rgba(33,128,141,0.05)' : 'transparent',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => !selected.includes(opt) && (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={e => !selected.includes(opt) && (e.currentTarget.style.background = 'transparent')}
                        >
                            <span style={{
                                width: '18px',
                                height: '18px',
                                border: selected.includes(opt) ? 'none' : '2px solid #cbd5e1',
                                background: selected.includes(opt) ? 'var(--primary-color)' : '#fff',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {selected.includes(opt) && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </span>
                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: selected.includes(opt) ? '600' : '400' }}>{opt}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Product Params Block ────────────────────────────────── */
const ProductParamsBlock = ({ padType, params, onChange }) => {
    const field = (key) => (
        <input
            type="number"
            step="0.01"
            className="form-input"
            value={params[key] || ''}
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
                <span style={{ fontWeight: '800', fontSize: '13px', color: 'var(--primary-color)' }}>
                    {padType}
                </span>
            </div>

            <div style={{ padding: '18px' }}>
                <div style={{
                    fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: '#7c5c2e',
                    background: '#fdf8e6', padding: '6px 12px', borderRadius: '6px',
                    marginBottom: '14px', display: 'inline-block'
                }}>
                    🔄 Mixing Parameters
                </div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    <div className="form-group">
                        <label className="form-label">Min Mixing Time (min)</label>
                        {field('minMixingTime')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Mixing Time (min)</label>
                        {field('maxMixingTime')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Min Mixing Temp (°C)</label>
                        {field('minMixingTemp')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Mixing Temp (°C)</label>
                        {field('maxMixingTemp')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mixing Weight (Kg)</label>
                        {field('mixingWeight')}
                    </div>
                </div>

                <div style={{
                    fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: '#1a5276',
                    background: '#eaf4fb', padding: '6px 12px', borderRadius: '6px',
                    marginBottom: '14px', display: 'inline-block'
                }}>
                    🏭 Moulding Parameters
                </div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Min Curing Time (min)</label>
                        {field('minCuringTime')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Curing Time (min)</label>
                        {field('maxCuringTime')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Min Curing Temp (°C)</label>
                        {field('minCuringTemp')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Curing Temp (°C)</label>
                        {field('maxCuringTemp')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Min Curing Pressure (Kg/cm²)</label>
                        {field('minCuringPressure')}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Max Curing Pressure (Kg/cm²)</label>
                        {field('maxCuringPressure')}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ApprovedQAP = ({ entries, setEntries, onRefresh, isLoading }) => {
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

    const [view, setView] = useState('list');
    const [statusTab, setStatusTab] = useState('PENDING');
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [activeProductTab, setActiveProductTab] = useState(null);
    const [form, setForm] = useState(emptyForm());

    const pendingStatuses = ['CREATED', 'PENDING', 'NOT_STARTED', 'IN_PROGRESS', 'CREATE', 'RETURNED', 'RESUBMITTED'];
    const verifiedStatuses = ['COMPLETED', 'VERIFIED', 'APPROVED'];

    const filteredEntries = (entries || []).filter(entry => {
        if (statusTab === 'PENDING') return pendingStatuses.includes(entry.status);
        return verifiedStatuses.includes(entry.status);
    });

    const pendingCount = (entries || []).filter(e => pendingStatuses.includes(e.status)).length;
    const verifiedCount = (entries || []).filter(e => verifiedStatuses.includes(e.status)).length;

    const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handlePadTypeChange = (selected) => {
        const oldDetails = form.productDetails;
        const newDetails = selected.map(pt => {
            const existing = oldDetails.find(d => d.padType === pt);
            return existing || emptyProductParams(pt);
        });
        setForm(f => ({ ...f, selectedPadTypes: selected, productDetails: newDetails }));
        if (selected.length > 0 && !selected.includes(activeProductTab)) {
            setActiveProductTab(selected[0]);
        }
    };

    const handleParamChange = (padType, key, val) => {
        setForm(f => ({
            ...f,
            productDetails: f.productDetails.map(d => 
                d.padType === padType ? { ...d, [key]: val ? parseFloat(val) : '' } : d
            )
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
            approvalDate: entry.approvalDate,
            effectiveDate: entry.effectiveDate,
            approvingAuthority: entry.approvingAuthority,
            validityDate: entry.validityDate,
            selectedPadTypes: entry.productDetails.map(d => d.padType),
            productDetails: entry.productDetails
        });
        setEditingId(entry.id);
        setActiveProductTab(entry.productDetails?.[0]?.padType || null);
        setView('view');
    };

    const openEdit = (entry) => {
        openView(entry);
        setView('form');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this QAP entry?')) {
            try {
                await approvedQAPService.delete(id);
                onRefresh();
            } catch (error) {
                alert('Error deleting entry: ' + error.message);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.selectedPadTypes.length === 0) {
            alert('Please select at least one Rail Pad Type.');
            return;
        }

        setIsSaving(true);
        try {
            const plantId = localStorage.getItem('railpad_selectedPlantId');
            const payload = {
                vendorName: user?.vendorName || "",
                vendorCode: user?.vendorCode || "",
                plantId: plantId || "1",
                shift: "General",
                qapNo: form.qapNo,
                approvingAuthority: form.approvingAuthority,
                approvalDate: form.approvalDate,
                effectiveDate: form.effectiveDate,
                validityDate: form.validityDate,
                status: "PENDING",
                createdBy: user?.userId || 1,
                updatedBy: user?.userId || 1,
                productDetails: form.productDetails
            };

            if (editingId) {
                await approvedQAPService.update(editingId, payload);
            } else {
                await approvedQAPService.create(payload);
            }

            onRefresh();
            setView('list');
            setEditingId(null);
        } catch (error) {
            alert('Error saving entry: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (view === 'view') {
        const entry = entries.find(e => e.id === editingId);
        return (
            <div className="fade-in">
                <div className="section-header" style={{ marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>QAP Details</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>QAP No: <strong>{entry?.qapNo}</strong></p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {entry && pendingStatuses.includes(entry.status) && <button className="btn-primary" onClick={() => openEdit(entry)}>Edit</button>}
                        <button className="btn-secondary" onClick={() => setView('list')}>Back to List</button>
                    </div>
                </div>

                <div className="details-card fade-in">
                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'var(--primary-color)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>A</span>
                        QAP Document Details
                    </div>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">QAP No.</div>
                            <div className="info-value">{entry?.qapNo}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Approving Authority</div>
                            <div className="info-value">{entry?.approvingAuthority}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Approval Date</div>
                            <div className="info-value">{entry?.approvalDate}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Effective Date</div>
                            <div className="info-value">{entry?.effectiveDate}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Validity Date</div>
                            <div className="info-value" style={{ color: 'var(--color-danger)' }}>{entry?.validityDate}</div>
                        </div>
                    </div>

                    <div className="section-divider"></div>

                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'var(--primary-color)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>B</span>
                        Process Parameters
                    </div>

                    <div className="tab-bar" style={{ marginBottom: '24px', background: 'rgba(66, 129, 140, 0.04)', padding: '6px', borderRadius: '12px', display: 'inline-flex', gap: '4px' }}>
                        {entry?.productDetails?.map(d => (
                            <button 
                                key={d.padType} 
                                onClick={() => setActiveProductTab(d.padType)} 
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    transition: 'all 0.2s',
                                    background: activeProductTab === d.padType ? '#fff' : 'transparent',
                                    color: activeProductTab === d.padType ? 'var(--primary-color)' : 'var(--text-muted)',
                                    boxShadow: activeProductTab === d.padType ? 'var(--shadow-sm)' : 'none'
                                }}
                            >
                                {d.padType}
                            </button>
                        ))}
                    </div>

                    {activeProductTab && (
                        <div className="params-grid fade-in">
                            {(() => {
                                const params = entry.productDetails.find(d => d.padType === activeProductTab);
                                return (
                                    <>
                                        <div className="param-box">
                                            <div className="param-box-header">
                                                <span>🔄</span>
                                                <h4>Mixing Parameters</h4>
                                            </div>
                                            {[
                                                ['Min Time', `${params.minMixingTime} min`],
                                                ['Max Time', `${params.maxMixingTime} min`],
                                                ['Min Temp', `${params.minMixingTemp} °C`],
                                                ['Max Temp', `${params.maxMixingTemp} °C`],
                                                ['Batch Weight', `${params.mixingWeight} Kg`],
                                            ].map(([l, v]) => (
                                                <div key={l} className="param-row">
                                                    <span className="param-label">{l}</span>
                                                    <span className="param-value">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="param-box">
                                            <div className="param-box-header">
                                                <span>🏭</span>
                                                <h4>Moulding Parameters</h4>
                                            </div>
                                            {[
                                                ['Min Cure Time', `${params.minCuringTime} min`],
                                                ['Max Cure Time', `${params.maxCuringTime} min`],
                                                ['Min Temp', `${params.minCuringTemp} °C`],
                                                ['Max Temp', `${params.maxCuringTemp} °C`],
                                                ['Min Pressure', `${params.minCuringPressure} Kg/cm²`],
                                                ['Max Pressure', `${params.maxCuringPressure} Kg/cm²`],
                                            ].map(([l, v]) => (
                                                <div key={l} className="param-row">
                                                    <span className="param-label">{l}</span>
                                                    <span className="param-value">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'form') {
        return (
            <div className="fade-in">
                <div className="section-header">
                    <div>
                        <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>{editingId ? 'Edit QAP Entry' : 'Add New QAP Entry'}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Declare approved QAP parameters for Rail Pads</p>
                    </div>
                    <button className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Section A */}
                    <div className="form-container fade-in" style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: 'var(--primary-color)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>A</span>
                            QAP DOCUMENT DETAILS
                        </div>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                            <div className="form-group"><label className="form-label">QAP No. *</label><input className="form-input" value={form.qapNo} onChange={e => setField('qapNo', e.target.value)} required /></div>
                            <div className="form-group"><label className="form-label">Approving Authority *</label>
                                <select className="form-select" value={form.approvingAuthority} onChange={e => setField('approvingAuthority', e.target.value)} required>
                                    <option value="">Select Authority</option>
                                    {APPROVING_AUTHORITIES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Approval Date *</label><input type="date" className="form-input" value={form.approvalDate} onChange={e => setField('approvalDate', e.target.value)} required /></div>
                            <div className="form-group"><label className="form-label">Effective Date *</label><input type="date" className="form-input" value={form.effectiveDate} onChange={e => setField('effectiveDate', e.target.value)} required /></div>
                            <div className="form-group"><label className="form-label">Validity Date *</label><input type="date" className="form-input" value={form.validityDate} onChange={e => setField('validityDate', e.target.value)} required /></div>
                        </div>
                    </div>

                    <div className="form-container fade-in" style={{ marginTop: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: 'var(--primary-color)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>B</span>
                            PRODUCT SELECTION & PARAMETERS
                        </div>
                        <div className="form-group" style={{ maxWidth: '600px', marginBottom: '24px' }}>
                            <label className="form-label">Rail Pad Type(s) *</label>
                            <MultiSelect options={PAD_TYPES} selected={form.selectedPadTypes} onChange={handlePadTypeChange} />
                        </div>

                        {form.selectedPadTypes.length > 0 && (
                            <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                    {form.selectedPadTypes.map(pt => (
                                        <button key={pt} type="button" onClick={() => setActiveProductTab(pt)} style={{ padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', background: activeProductTab === pt ? 'var(--primary-color)' : 'rgba(33,128,141,0.08)', color: activeProductTab === pt ? '#fff' : 'var(--primary-color)', transition: 'all 0.2s' }}>
                                            {pt}
                                        </button>
                                    ))}
                                </div>
                                {activeProductTab && <ProductParamsBlock padType={activeProductTab} params={form.productDetails.find(d => d.padType === activeProductTab)} onChange={handleParamChange} />}
                            </>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Submit QAP Entry'}</button>
                    </div>
                </form>
            </div>
        );
    }

    const SkeletonRow = () => (
        <tr style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
            <td style={{ padding: '20px 12px' }}>
                <div style={{ width: 100, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 140, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 120, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 120, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
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
                <div className="section-header" style={{ marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Approved QAP Values</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Define master reference for process validation</p>
                    </div>
                    <button className="btn-primary" onClick={openAdd}>+ Add New Entry</button>
                </div>

                <div className="status-tabs-row" style={{ marginBottom: 0 }}>
                    <button 
                        onClick={() => setStatusTab('PENDING')} 
                        className={`status-tab ${statusTab === 'PENDING' ? 'active' : ''}`}
                    >
                        <span className="dot pending"></span>
                        Pending
                        <span className="count-badge">{pendingCount}</span>
                    </button>
                    <button 
                        onClick={() => setStatusTab('COMPLETED')} 
                        className={`status-tab ${statusTab === 'COMPLETED' ? 'active' : ''}`}
                    >
                        <span className="dot success"></span>
                        Verified
                        <span className="count-badge">{verifiedCount}</span>
                    </button>
                </div>
            </div>

                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr><th>QAP No.</th><th>Pad Types</th><th>Mixing</th><th>Moulding</th><th>Status</th><th style={{ textAlign: 'center' }}>Action</th></tr>
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
                            ) : filteredEntries.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No QAP entries found.</td></tr>
                                ) : (
                                    filteredEntries.map(entry => (
                                        <tr key={entry.id}>
                                            <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{entry.qapNo}</td>
                                            <td>{entry.productDetails?.map(d => d.padType).join(', ')}</td>
                                            <td style={{ fontSize: '11px' }}>{summarizeMixing(entry.productDetails?.[0])}</td>
                                            <td style={{ fontSize: '11px' }}>{summarizeMoulding(entry.productDetails?.[0])}</td>
                                            <td><span className={`badge ${getBadgeClass(entry.status)}`}>{entry.status}</span></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="action-buttons-group" style={{ justifyContent: 'center' }}>
                                                    <button onClick={() => openView(entry)} className="btn-icon-action view">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                        View
                                                    </button>
                                                    {pendingStatuses.includes(entry.status) && (
                                                        <>
                                                            <button onClick={() => openEdit(entry)} className="btn-icon-action edit">
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
                                )}
                            </tbody>
                        </table>
                    </div>

        </div>
    );
};

export default ApprovedQAP;
