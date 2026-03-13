import React, { useState } from 'react';
import InventoryTable from './InventoryTable';
import { validateDuplicateDocs } from './inventoryUtils';

const RUBBER_TYPES = ['Natural Rubber', 'RSS1', 'RSS2', 'RSS3', 'SBR', 'PBR'];

const EMPTY_FORM = {
    dateOfReceipt: '', type: '', sourceOfSupply: '',
    invoiceNumber: '', ewayBillNumber: '', invoiceDate: '',
    ewayBillDate: '', tcNumber: '', tcDate: '',
    quantity: '', document: null,
};

const VirginMaterial = ({ entries, setEntries, approvedSuppliers, allInvoices }) => {
    const [view, setView] = useState('list');
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [editId, setEditId] = useState(null);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const validate = () => {
        const errs = {};
        if (!form.dateOfReceipt) errs.dateOfReceipt = 'Required';
        if (!form.type) errs.type = 'Required';
        if (!form.sourceOfSupply) errs.sourceOfSupply = 'Required';
        if (!form.invoiceNumber.trim()) errs.invoiceNumber = 'Required';
        if (!form.ewayBillNumber.trim()) errs.ewayBillNumber = 'Required';
        if (!form.invoiceDate) errs.invoiceDate = 'Required';
        if (!form.ewayBillDate) errs.ewayBillDate = 'Required';
        if (!form.tcNumber.trim()) errs.tcNumber = 'Required';
        if (!form.tcDate) errs.tcDate = 'Required';
        if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0) errs.quantity = 'Enter valid quantity';
        if (!form.document) errs.document = 'Document upload is required';

        const dupErr = validateDuplicateDocs(form.invoiceNumber, form.ewayBillNumber, allInvoices, editId);
        if (dupErr.invoice) errs.invoiceNumber = dupErr.invoice;
        if (dupErr.eway) errs.ewayBillNumber = dupErr.eway;

        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        if (editId !== null) {
            setEntries(entries.map(en => en.id === editId ? { ...en, ...form, id: editId, status: 'Pending for Verification' } : en));
            setEditId(null);
        } else {
            setEntries([...entries, { ...form, id: Date.now(), status: 'Pending for Verification', used: 0 }]);
        }
        setForm(EMPTY_FORM);
        setErrors({});
        setView('list');
    };

    const handleEdit = (entry) => {
        setForm({ ...entry });
        setEditId(entry.id);
        setView('form');
    };

    const handleDelete = (id) => {
        setEntries(entries.filter(e => e.id !== id));
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Virgin Material – Rubber</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Log all virgin rubber receipts with full traceability</p>
                </div>
                {view === 'list' && (
                    <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setErrors({}); setView('form'); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Add New Entry
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <InventoryTable
                    entries={entries}
                    columns={[
                        { key: 'dateOfReceipt', label: 'Date of Receipt' },
                        { key: 'type', label: 'Type' },
                        { key: 'sourceOfSupply', label: 'Source' },
                        { key: 'invoiceNumber', label: 'Invoice No.' },
                        { key: 'quantity', label: 'Qty (Kg)', numeric: true },
                        { key: 'used', label: 'Used (Kg)', numeric: true },
                        { key: 'tcNumber', label: 'TC No.' },
                        { key: 'status', label: 'Status', isStatus: true },
                    ]}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ) : (
                <div className="inv-form-container">
                    <div className="inv-form-header">
                        <h3>{editId ? 'Edit Entry' : 'Add Virgin Material Entry'}</h3>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="inv-form-grid">
                            <FormDate label="Date of Receipt" value={form.dateOfReceipt} onChange={v => set('dateOfReceipt', v)} error={errors.dateOfReceipt} />
                            <FormSelect label="Type" value={form.type} options={RUBBER_TYPES} onChange={v => set('type', v)} error={errors.type} />
                            <FormSelect label="Source of Supply" value={form.sourceOfSupply} options={approvedSuppliers} onChange={v => set('sourceOfSupply', v)} error={errors.sourceOfSupply} placeholder="Select approved supplier" />
                            <FormInput label="Invoice Number" value={form.invoiceNumber} onChange={v => set('invoiceNumber', v)} error={errors.invoiceNumber} placeholder="e.g. INV/2024/0045" />
                            <FormInput label="E-way Bill Number" value={form.ewayBillNumber} onChange={v => set('ewayBillNumber', v)} error={errors.ewayBillNumber} placeholder="Numeric" type="text" inputMode="numeric" />
                            <FormDate label="Invoice Date" value={form.invoiceDate} onChange={v => set('invoiceDate', v)} error={errors.invoiceDate} />
                            <FormDate label="E-way Bill Date" value={form.ewayBillDate} onChange={v => set('ewayBillDate', v)} error={errors.ewayBillDate} />
                            <FormInput label="Test Certificate Number" value={form.tcNumber} onChange={v => set('tcNumber', v)} error={errors.tcNumber} placeholder="TC Reference" />
                            <FormDate label="Test Certificate Date" value={form.tcDate} onChange={v => set('tcDate', v)} error={errors.tcDate} />
                            <FormInput label="Quantity (Kgs)" value={form.quantity} onChange={v => set('quantity', v)} error={errors.quantity} type="number" min="0" step="0.01" placeholder="0.00" />
                            <FormFile label="Upload Document (PDF)" onChange={f => set('document', f)} current={form.document} error={errors.document} />
                        </div>
                        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
                            <button type="submit" className="btn-primary" style={{ padding: '0.7rem 2.5rem' }}>
                                {editId ? 'Save Changes' : 'Submit Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// ── Shared small form widgets ─────────────────────────────────────────────────
export const FormDate = ({ label, value, onChange, error }) => (
    <div className="form-group">
        <label className="form-label">{label} <span style={{ color: '#dc2626' }}>*</span></label>
        <input type="date" className={`form-input${error ? ' input-error' : ''}`} value={value} onChange={e => onChange(e.target.value)} />
        {error && <span className="error-msg">{error}</span>}
    </div>
);

export const FormSelect = ({ label, value, options, onChange, error, placeholder }) => (
    <div className="form-group">
        <label className="form-label">{label} <span style={{ color: '#dc2626' }}>*</span></label>
        <select className={`form-select${error ? ' input-error' : ''}`} value={value} onChange={e => onChange(e.target.value)}>
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {error && <span className="error-msg">{error}</span>}
    </div>
);

export const FormInput = ({ label, value, onChange, error, type = 'text', ...rest }) => (
    <div className="form-group">
        <label className="form-label">{label} <span style={{ color: '#dc2626' }}>*</span></label>
        <input type={type} className={`form-input${error ? ' input-error' : ''}`} value={value} onChange={e => onChange(e.target.value)} {...rest} />
        {error && <span className="error-msg">{error}</span>}
    </div>
);

export const FormFile = ({ label, onChange, current, error }) => (
    <div className="form-group">
        <label className="form-label">{label} <span style={{ color: '#dc2626' }}>*</span></label>
        <label className={`file-upload-label${error ? ' input-error' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            {current ? (typeof current === 'string' ? current : current.name) : 'Choose PDF file'}
            <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => onChange(e.target.files[0] || null)} />
        </label>
        {error && <span className="error-msg">{error}</span>}
    </div>
);

export default VirginMaterial;
