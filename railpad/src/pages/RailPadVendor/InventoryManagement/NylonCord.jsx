import React, { useState } from 'react';
import InventoryTable from './InventoryTable';
import { validateDuplicateDocs } from './inventoryUtils';
import { FormDate, FormSelect, FormInput, FormFile } from './VirginMaterial';

const NYLON_STYLES = ['1680/2', '1260/2'];

const MIN_DENIER = {
    '1680/2': 3200,
    '1260/2': 2400,
};

const EMPTY = {
    dateOfReceipt: '', style: '', denierValue: '', sourceOfSupply: '',
    invoiceNumber: '', ewayBillNumber: '', invoiceDate: '',
    ewayBillDate: '', tcNumber: '', tcDate: '',
    quantity: '', document: null,
};

const NylonCord = ({ entries, setEntries, approvedSuppliers, allInvoices }) => {
    const [view, setView] = useState('list');
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [editId, setEditId] = useState(null);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const denierVal = parseFloat(form.denierValue);
    const minDenier = form.style ? MIN_DENIER[form.style] : null;
    const denierWarning = form.style && form.denierValue && !isNaN(denierVal) && denierVal < minDenier;

    const validate = () => {
        const errs = {};
        if (!form.dateOfReceipt) errs.dateOfReceipt = 'Required';
        if (!form.style) errs.style = 'Required';
        if (!form.denierValue || isNaN(denierVal)) errs.denierValue = 'Required';
        else if (form.style && denierVal < MIN_DENIER[form.style]) {
            errs.denierValue = `❌ Denier for ${form.style} must be ≥ ${MIN_DENIER[form.style]}. Entry cannot be saved.`;
        }
        if (!form.sourceOfSupply) errs.sourceOfSupply = 'Required';
        if (!form.invoiceNumber.trim()) errs.invoiceNumber = 'Required';
        if (!form.ewayBillNumber.trim()) errs.ewayBillNumber = 'Required';
        if (!form.invoiceDate) errs.invoiceDate = 'Required';
        if (!form.ewayBillDate) errs.ewayBillDate = 'Required';
        if (!form.tcNumber.trim()) errs.tcNumber = 'Required';
        if (!form.tcDate) errs.tcDate = 'Required';
        if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0) errs.quantity = 'Enter valid quantity';
        if (!form.document) errs.document = 'Document upload is required';
        const dup = validateDuplicateDocs(form.invoiceNumber, form.ewayBillNumber, allInvoices, editId);
        if (dup.invoice) errs.invoiceNumber = dup.invoice;
        if (dup.eway) errs.ewayBillNumber = dup.eway;
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
        setForm(EMPTY); setErrors({}); setView('list');
    };

    const handleEdit = (entry) => { setForm({ ...entry }); setEditId(entry.id); setView('form'); };
    const handleDelete = (id) => setEntries(entries.filter(e => e.id !== id));

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Nylon Cord</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Style and denier-value validated — 1680/2 ≥ 3200 D, 1260/2 ≥ 2400 D</p>
                </div>
                {view === 'list' && (
                    <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setErrors({}); setView('form'); }}>
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
                        { key: 'style', label: 'Style' },
                        { key: 'denierValue', label: 'Denier' },
                        { key: 'sourceOfSupply', label: 'Source' },
                        { key: 'invoiceNumber', label: 'Invoice No.' },
                        { key: 'quantity', label: 'Qty (Kg)', numeric: true },
                        { key: 'used', label: 'Used (Kg)', numeric: true },
                        { key: 'status', label: 'Status', isStatus: true },
                    ]}
                    onEdit={handleEdit} onDelete={handleDelete}
                />
            ) : (
                <div className="inv-form-container">
                    <div className="inv-form-header">
                        <h3>{editId ? 'Edit Entry' : 'Add Nylon Cord Entry'}</h3>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="inv-form-grid">
                            <FormDate label="Date of Receipt" value={form.dateOfReceipt} onChange={v => set('dateOfReceipt', v)} error={errors.dateOfReceipt} />

                            {/* Style */}
                            <FormSelect
                                label="Style"
                                value={form.style}
                                options={NYLON_STYLES}
                                onChange={v => { set('style', v); set('denierValue', ''); setErrors({}); }}
                                error={errors.style}
                            />

                            {/* Denier Value with live validation */}
                            <div className="form-group">
                                <label className="form-label">
                                    Denier Value <span style={{ color: '#dc2626' }}>*</span>
                                    {form.style && (
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '8px' }}>
                                            (min. {MIN_DENIER[form.style]} for {form.style})
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="number" step="1" min="0"
                                    className={`form-input${denierWarning ? ' input-error' : ''}`}
                                    value={form.denierValue}
                                    onChange={e => { set('denierValue', e.target.value); setErrors(prev => ({ ...prev, denierValue: '' })); }}
                                    placeholder={form.style ? `Min. ${MIN_DENIER[form.style]}` : 'Select style first'}
                                    disabled={!form.style}
                                />
                                {denierWarning && (
                                    <div style={{
                                        background: '#fef2f2', border: '1px solid #fecaca',
                                        borderRadius: '6px', padding: '8px 12px',
                                        color: '#dc2626', fontSize: '11px', fontWeight: '700', marginTop: '4px'
                                    }}>
                                        ❌ Style {form.style} requires Denier ≥ {MIN_DENIER[form.style]}. This entry CANNOT be saved.
                                    </div>
                                )}
                                {errors.denierValue && !denierWarning && <span className="error-msg">{errors.denierValue}</span>}
                            </div>

                            <FormSelect label="Source of Supply" value={form.sourceOfSupply} options={approvedSuppliers} onChange={v => set('sourceOfSupply', v)} error={errors.sourceOfSupply} placeholder="Select approved supplier" />
                            <FormInput label="Invoice Number" value={form.invoiceNumber} onChange={v => set('invoiceNumber', v)} error={errors.invoiceNumber} placeholder="Invoice reference" />
                            <FormInput label="E-way Bill Number" value={form.ewayBillNumber} onChange={v => set('ewayBillNumber', v)} error={errors.ewayBillNumber} placeholder="Numeric" />
                            <FormDate label="Invoice Date" value={form.invoiceDate} onChange={v => set('invoiceDate', v)} error={errors.invoiceDate} />
                            <FormDate label="E-way Bill Date" value={form.ewayBillDate} onChange={v => set('ewayBillDate', v)} error={errors.ewayBillDate} />
                            <FormInput label="Test Certificate Number" value={form.tcNumber} onChange={v => set('tcNumber', v)} error={errors.tcNumber} placeholder="TC Reference" />
                            <FormDate label="Test Certificate Date" value={form.tcDate} onChange={v => set('tcDate', v)} error={errors.tcDate} />
                            <FormInput label="Quantity (Kgs)" value={form.quantity} onChange={v => set('quantity', v)} error={errors.quantity} type="number" min="0" step="0.01" placeholder="0.00" />
                            <FormFile label="Upload Document (PDF)" onChange={f => set('document', f)} current={form.document} error={errors.document} />
                        </div>
                        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
                            <button type="submit" className="btn-primary" style={{ padding: '0.7rem 2.5rem' }} disabled={denierWarning}>
                                {editId ? 'Save Changes' : 'Submit Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default NylonCord;
