import React, { useState, useMemo } from 'react';

const PRODUCT_TYPES = [
    "6.00mm GRSP",
    "10.00mm GRSP",
    "6.20mm CGRSP",
    "10.00mm CGRSP",
    "6.00mm NCRGRSP",
    "10.00mm NCRGRSP"
];

const SHIFTS = ["Shift A", "Shift B", "Shift C", "General", "Day", "Night"];

const ProductionDeclarationDashboard = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [declarations, setDeclarations] = useState([
        {
            id: 1,
            date: "2024-03-20",
            shift: "Shift A",
            lineId: "PL-01",
            productBlocks: [
                {
                    id: 101,
                    productType: "6.20mm CGRSP",
                    mode: "Pieces",
                    batches: [{ id: 102, batchNo: '', compoundABatchNo: 'A-123', compoundBBatchNo: 'B-456', initialWeight: '150.5', finalWeight: '148.2', qty: '4500' }]
                }
            ],
            products: [
                { type: "6.20mm CGRSP", qty: 4500, unit: "Pieces" }
            ],
            status: "Verified"
        },
        {
            id: 2,
            date: "2024-03-21",
            shift: "Shift B",
            lineId: "PL-02",
            productBlocks: [
                {
                    id: 201,
                    productType: "10.00mm GRSP",
                    mode: "Sets",
                    batches: [{ id: 202, batchNo: 'B-789', compoundABatchNo: '', compoundBBatchNo: '', initialWeight: '200', finalWeight: '198', qty: '2100' }]
                }
            ],
            products: [
                { type: "10.00mm GRSP", qty: 2100, unit: "Sets" }
            ],
            status: "Pending"
        }
    ]);

    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        shift: '',
        lineId: '',
        productBlocks: [
            {
                id: Date.now(),
                productType: '',
                mode: 'Pieces',
                batches: [{ id: Date.now() + 1, batchNo: '', compoundABatchNo: '', compoundBBatchNo: '', initialWeight: '', finalWeight: '', qty: '' }]
            }
        ]
    };

    const [formData, setFormData] = useState(initialFormState);

    const isComposite = (type) => type && type.includes('CGRSP');

    const handleAddProductBlock = () => {
        setFormData(prev => ({
            ...prev,
            productBlocks: [...prev.productBlocks, {
                id: Date.now(),
                productType: '',
                mode: 'Pieces',
                batches: [{ id: Date.now() + 1, batchNo: '', compoundABatchNo: '', compoundBBatchNo: '', initialWeight: '', finalWeight: '', qty: '' }]
            }]
        }));
    };

    const handleRemoveProductBlock = (blockId) => {
        setFormData(prev => ({
            ...prev,
            productBlocks: prev.productBlocks.filter(b => b.id !== blockId)
        }));
    };

    const handleAddBatch = (blockId) => {
        setFormData(prev => ({
            ...prev,
            productBlocks: prev.productBlocks.map(block => 
                block.id === blockId 
                ? { ...block, batches: [...block.batches, { id: Date.now(), batchNo: '', compoundABatchNo: '', compoundBBatchNo: '', initialWeight: '', finalWeight: '', qty: '' }] }
                : block
            )
        }));
    };

    const handleRemoveBatch = (blockId, batchId) => {
        setFormData(prev => ({
            ...prev,
            productBlocks: prev.productBlocks.map(block => 
                block.id === blockId 
                ? { ...block, batches: block.batches.filter(b => b.id !== batchId) }
                : block
            )
        }));
    };

    const handleBlockChange = (blockId, field, value) => {
        setFormData(prev => ({
            ...prev,
            productBlocks: prev.productBlocks.map(block => 
                block.id === blockId ? { ...block, [field]: value } : block
            )
        }));
    };

    const handleBatchChange = (blockId, batchId, field, value) => {
        setFormData(prev => ({
            ...prev,
            productBlocks: prev.productBlocks.map(block => 
                block.id === blockId 
                ? { ...block, batches: block.batches.map(batch => batch.id === batchId ? { ...batch, [field]: value } : batch) }
                : block
            )
        }));
    };

    const summary = useMemo(() => {
        const result = {};
        formData.productBlocks.forEach(block => {
            if (!block.productType) return;
            const total = block.batches.reduce((sum, b) => sum + (parseInt(b.qty) || 0), 0);
            if (result[block.productType]) {
                result[block.productType].qty += total;
            } else {
                result[block.productType] = { qty: total, mode: block.mode };
            }
        });
        return Object.entries(result);
    }, [formData.productBlocks]);

    const handleDelete = (id) => {
        if(window.confirm('Are you sure you want to delete this declaration?')) {
            setDeclarations(declarations.filter(d => d.id !== id));
        }
    };

    const handleEdit = (decl) => {
        setFormData({
            date: decl.date,
            shift: decl.shift,
            lineId: decl.lineId,
            productBlocks: decl.productBlocks
        });
        setEditingId(decl.id);
        setIsReadOnly(false);
        setIsModalOpen(true);
    };

    const handleView = (decl) => {
        setFormData({
            date: decl.date,
            shift: decl.shift,
            lineId: decl.lineId,
            productBlocks: decl.productBlocks
        });
        setEditingId(decl.id);
        setIsReadOnly(true);
        setIsModalOpen(true);
    };

    const openNewModal = () => {
        setFormData(initialFormState);
        setEditingId(null);
        setIsReadOnly(false);
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newDeclaration = {
            id: editingId || Date.now(),
            ...formData,
            status: 'Pending',
            products: summary.map(([type, data]) => ({ type, qty: data.qty, unit: data.mode }))
        };

        if (editingId) {
            setDeclarations(declarations.map(d => d.id === editingId ? newDeclaration : d));
        } else {
            setDeclarations([newDeclaration, ...declarations]);
        }
        
        setIsModalOpen(false);
        setFormData(initialFormState);
        setEditingId(null);
    };

    const filteredDeclarations = declarations.filter(d => 
        activeTab === 'pending' ? d.status === 'Pending' : d.status === 'Verified'
    );

    return (
        <div className="fade-in railpad-container" style={{ padding: 0 }}>
            {/* Dashboard Header */}
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', fontFamily: 'var(--font-secondary)' }}>
                        Production Declaration
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, fontWeight: '500' }}>
                        Manage shift-wise manufacturing output and track batch-wise efficiency.
                    </p>
                </div>
                <button className="btn-primary" onClick={openNewModal} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    Declare New Production
                </button>
            </div>

            {/* Dashboard Tabs */}
            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: 'transparent', border: 'none', padding: 0, marginBottom: '24px' }}>
                <div className={`ie-tab-card ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                    <h3 className="ie-tab-title">Pending Production Verification</h3>
                    <p className="ie-tab-subtitle">{declarations.filter(d => d.status === 'Pending').length} Declarations Awaiting Audit</p>
                </div>
                <div className={`ie-tab-card ${activeTab === 'verified' ? 'active' : ''}`} onClick={() => setActiveTab('verified')}>
                    <h3 className="ie-tab-title">Verified Production</h3>
                    <p className="ie-tab-subtitle">{declarations.filter(d => d.status === 'Verified').length} Locked Records</p>
                </div>
            </div>

            {/* Content Table */}
            <div className="table-container fade-in">
                <table>
                    <thead>
                        <tr>
                            <th>Date & Shift</th>
                            <th>Line ID</th>
                            <th>Product Details</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDeclarations.map(decl => (
                            <tr key={decl.id}>
                                <td>
                                    <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>{decl.date}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{decl.shift}</div>
                                </td>
                                <td><span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{decl.lineId}</span></td>
                                <td>
                                    {decl.products.map((p, i) => (
                                        <div key={i} style={{ fontSize: '12px', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: '700' }}>{p.type}:</span> {p.qty.toLocaleString()} {p.unit}
                                        </div>
                                    ))}
                                </td>
                                <td>
                                    <span className={`badge ${decl.status === 'Verified' ? 'badge-verified' : 'badge-pending'}`}>
                                        {decl.status}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {decl.status === 'Pending' ? (
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button className="btn-secondary" onClick={() => handleEdit(decl)} style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}>Edit</button>
                                            <button className="btn-secondary" onClick={() => handleDelete(decl.id)} style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px', color: '#ef4444', borderColor: '#fee2e2' }}>Delete</button>
                                        </div>
                                    ) : (
                                        <button className="btn-secondary" onClick={() => handleView(decl)} style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}>View Details</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content fade-in">
                        <div className="modal-header">
                            <h2>{isReadOnly ? 'View Declaration' : (editingId ? 'Edit Declaration' : 'Declare New Production')}</h2>
                            <button className="close-modal" onClick={() => setIsModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <form id="declaration-form" onSubmit={handleSubmit} className="modal-body">
                            {/* Section A: Header */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>1</div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>Shift Information</h3>
                                </div>
                                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Date of Production</label>
                                        <input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required disabled={isReadOnly} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Shift</label>
                                        <select className="form-select" value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value})} required disabled={isReadOnly}>
                                            <option value="">Select Shift</option>
                                            {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Production Line ID</label>
                                        <select className="form-select" value={formData.lineId} onChange={(e) => setFormData({...formData, lineId: e.target.value})} required disabled={isReadOnly}>
                                            <option value="">Select Line</option>
                                            <option value="PL-01">PL-01 (Main Line)</option>
                                            <option value="PL-02">PL-02 (Secondary)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section B: Dynamic Product Blocks */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>2</div>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>Product-Wise Batch Declaration</h3>
                                    </div>
                                    {!isReadOnly && (
                                        <button type="button" className="btn-secondary" onClick={handleAddProductBlock} style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '11px' }}>
                                            + Add Product Type
                                        </button>
                                    )}
                                </div>

                                {formData.productBlocks.map((block) => (
                                    <div key={block.id} className="product-block">
                                        {formData.productBlocks.length > 1 && !isReadOnly && (
                                            <button type="button" className="batch-row-remove" style={{ top: '12px', right: '12px' }} onClick={() => handleRemoveProductBlock(block.id)}>×</button>
                                        )}
                                        
                                        <div className="product-block-header">
                                            <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: 0, flex: 1 }}>
                                                <div className="form-group">
                                                    <label className="form-label">Product Type</label>
                                                    <select className="form-select" value={block.productType} onChange={(e) => handleBlockChange(block.id, 'productType', e.target.value)} required disabled={isReadOnly}>
                                                        <option value="">Select Product</option>
                                                        {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Measurement Mode</label>
                                                    <div className="toggle-container" style={{ height: '40px' }}>
                                                        <span className="toggle-label" style={{ color: block.mode === 'Pieces' ? 'var(--primary-color)' : '#94a3b8' }}>Pieces</span>
                                                        <label className="switch">
                                                            <input type="checkbox" checked={block.mode === 'Sets'} onChange={(e) => handleBlockChange(block.id, 'mode', e.target.checked ? 'Sets' : 'Pieces')} disabled={isReadOnly} />
                                                            <span className="slider"></span>
                                                        </label>
                                                        <span className="toggle-label" style={{ color: block.mode === 'Sets' ? 'var(--primary-color)' : '#94a3b8' }}>Sets</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Batch Rows */}
                                        <div style={{ marginTop: '16px' }}>
                                            {isComposite(block.productType) && !isReadOnly && (
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--primary-color)' }}>
                                                    ℹ️ <b>Note:</b> Compound A & B batches must map back to the batches logged during the mixing stage.
                                                </div>
                                            )}
                                            {block.batches.map((batch) => (
                                                <div key={batch.id} className="batch-row">
                                                    {block.batches.length > 1 && !isReadOnly && (
                                                        <button type="button" className="batch-row-remove" onClick={() => handleRemoveBatch(block.id, batch.id)}>×</button>
                                                    )}
                                                    
                                                    {isComposite(block.productType) ? (
                                                        <>
                                                            <div className="form-group">
                                                                <label className="form-label">Comp. A Batch</label>
                                                                <input type="text" className="form-input" placeholder="A-XXXX" value={batch.compoundABatchNo} onChange={(e) => handleBatchChange(block.id, batch.id, 'compoundABatchNo', e.target.value)} required disabled={isReadOnly} />
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="form-label">Comp. B Batch</label>
                                                                <input type="text" className="form-input" placeholder="B-XXXX" value={batch.compoundBBatchNo} onChange={(e) => handleBatchChange(block.id, batch.id, 'compoundBBatchNo', e.target.value)} required disabled={isReadOnly} />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="form-group">
                                                            <label className="form-label">Batch No.</label>
                                                            <input type="text" className="form-input" placeholder="Batch XXXX" value={batch.batchNo} onChange={(e) => handleBatchChange(block.id, batch.id, 'batchNo', e.target.value)} required disabled={isReadOnly} />
                                                        </div>
                                                    )}

                                                    <div className="form-group">
                                                        <label className="form-label">Initial Wt (Kg)</label>
                                                        <input type="number" step="0.01" className="form-input" placeholder="Optional" value={batch.initialWeight} onChange={(e) => handleBatchChange(block.id, batch.id, 'initialWeight', e.target.value)} disabled={isReadOnly} />
                                                    </div>
                                                    
                                                    <div className="form-group">
                                                        <label className="form-label">Final Wt (Kg)</label>
                                                        <input type="number" step="0.01" className="form-input" placeholder="Optional" value={batch.finalWeight} onChange={(e) => handleBatchChange(block.id, batch.id, 'finalWeight', e.target.value)} disabled={isReadOnly} />
                                                    </div>
                                                    
                                                    <div className="form-group">
                                                        <label className="form-label">Final Qty ({block.mode})</label>
                                                        <input type="number" className="form-input" placeholder="0" value={batch.qty} onChange={(e) => handleBatchChange(block.id, batch.id, 'qty', e.target.value)} required disabled={isReadOnly} />
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {!isReadOnly && (
                                                <button type="button" onClick={() => handleAddBatch(block.id)} style={{ background: 'transparent', border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
                                                    + Add Batch Row
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Section C: Summary */}
                            {summary.length > 0 && (
                                <div className="summary-container fade-in">
                                    <div className="summary-title">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                        Total Production Summary
                                    </div>
                                    {summary.map(([type, data]) => (
                                        <div key={type} className="summary-item">
                                            <span>{type}</span>
                                            <span style={{ fontWeight: '800' }}>{data.qty.toLocaleString()} {data.mode}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </form>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{isReadOnly ? 'Close' : 'Cancel'}</button>
                            {!isReadOnly && (
                                <button type="submit" form="declaration-form" className="btn-primary" style={{ padding: '8px 32px' }}>
                                    {editingId ? 'Update Declaration' : 'Submit Declaration'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionDeclarationDashboard;
