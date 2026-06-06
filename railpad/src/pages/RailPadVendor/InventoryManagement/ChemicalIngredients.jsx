import React, { useState } from 'react';
import InventoryTable from './InventoryTable';
import { validateDuplicateDocs } from './inventoryUtils';
import { FormDate, FormSelect, FormInput, FormFile } from './VirginMaterial';

const INGREDIENT_TYPES = ['Activator', 'Accelerator', 'Antioxidant', 'Plasticizer'];

const SUB_TYPES = {
    Activator: ['Zinc Oxide', 'Stearic Acid'],
    Accelerator: ['CBS', 'TMTD', 'MBTS'],
    Antioxidant: ['HS/TDQ', 'Vul.4020', 'Pil-13'],
    Plasticizer: ['Stearic Acid', 'Paraffin Wax'],
};

const EMPTY = {
    dateOfReceipt: '', ingredientType: '', ingredientSubType: '', sourceOfSupply: '',
    invoiceNumber: '', ewayBillNumber: '', invoiceDate: '',
    ewayBillDate: '', tcNumber: '', tcDate: '',
    quantity: '', document: null,
};

const ChemicalIngredients = ({ entries, setEntries, approvedSuppliers, sourceObjects, allInvoices }) => {
    const [view, setView] = useState('list');
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [editId, setEditId] = useState(null);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const availableSuppliers = React.useMemo(() => {
        if (sourceObjects && sourceObjects.length > 0) {
            const filtered = sourceObjects.filter(src => 
                src.materialName?.trim().toLowerCase() === form.ingredientType?.trim().toLowerCase() && 
                src.materialType?.trim().toLowerCase() === form.ingredientSubType?.trim().toLowerCase()
            );
            const names = [...new Set(filtered.map(src => src.supplierName).filter(Boolean))];
            return names;
        }
        return [];
    }, [sourceObjects, form.ingredientType, form.ingredientSubType]);

    const validate = () => {
        const errs = {};
        if (!form.dateOfReceipt) errs.dateOfReceipt = 'Required';
        if (!form.ingredientType) errs.ingredientType = 'Required';
        if (!form.ingredientSubType) errs.ingredientSubType = 'Required';
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
        const displayType = `${form.ingredientType} – ${form.ingredientSubType}`;
        if (editId !== null) {
            setEntries(entries.map(en => en.id === editId ? { ...en, ...form, displayType, id: editId, status: 'Pending for Verification' } : en));
            setEditId(null);
        } else {
            setEntries([...entries, { ...form, displayType, id: Date.now(), status: 'Pending for Verification', used: 0 }]);
        }
        setForm(EMPTY); setErrors({}); setView('list');
    };

    const handleEdit = (entry) => { setForm({ ...entry }); setEditId(entry.id); setView('form'); };
    const handleDelete = (id) => setEntries(entries.filter(e => e.id !== id));

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Other Chemical Ingredients</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Log activators, accelerators, antioxidants and plasticizers</p>
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
                        { key: 'ingredientType', label: 'Type' },
                        { key: 'ingredientSubType', label: 'Sub-Type' },
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
                        <h3>{editId ? 'Edit Entry' : 'Add Chemical Ingredient Entry'}</h3>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="inv-form-grid">
                            <FormDate label="Date of Receipt" value={form.dateOfReceipt} onChange={v => set('dateOfReceipt', v)} error={errors.dateOfReceipt} />

                            {/* Ingredient Type */}
                            <div className="form-group">
                                <label className="form-label">Ingredient Type <span style={{ color: '#dc2626' }}>*</span></label>
                                <select
                                    className={`form-select${errors.ingredientType ? ' input-error' : ''}`}
                                    value={form.ingredientType}
                                    onChange={e => { set('ingredientType', e.target.value); set('ingredientSubType', ''); setErrors({}); }}
                                >
                                    <option value="">Select Ingredient Type</option>
                                    {INGREDIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                {errors.ingredientType && <span className="error-msg">{errors.ingredientType}</span>}
                            </div>

                            {/* Ingredient Sub-Type (dependent) */}
                            <div className="form-group">
                                <label className="form-label">Ingredient Sub-Type <span style={{ color: '#dc2626' }}>*</span></label>
                                <select
                                    className={`form-select${errors.ingredientSubType ? ' input-error' : ''}`}
                                    value={form.ingredientSubType}
                                    onChange={e => set('ingredientSubType', e.target.value)}
                                    disabled={!form.ingredientType}
                                    style={{ background: !form.ingredientType ? '#f1f5f9' : 'white' }}
                                >
                                    <option value="">Select Sub-Type</option>
                                    {form.ingredientType && SUB_TYPES[form.ingredientType].map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                                {errors.ingredientSubType && <span className="error-msg">{errors.ingredientSubType}</span>}
                            </div>

                            <FormSelect label="Source of Supply" value={form.sourceOfSupply} options={availableSuppliers} onChange={v => set('sourceOfSupply', v)} error={errors.sourceOfSupply} placeholder="Select approved supplier" />
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

export default ChemicalIngredients;
