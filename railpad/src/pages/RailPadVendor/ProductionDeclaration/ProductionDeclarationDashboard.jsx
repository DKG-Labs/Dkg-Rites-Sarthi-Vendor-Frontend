import React, { useState, useEffect } from 'react';

const PAD_TYPES = [
    "6.00mm GRSP",
    "10.00mm GRSP",
    "6.20mm CGRSP",
    "10.00mm CGRSP",
    "6.00mm NCRGRSP",
    "10.00mm NCRGRSP"
];

const STANDARD_WEIGHTS = {
    "6.00mm GRSP": 0.450,
    "10.00mm GRSP": 0.780,
    "6.20mm CGRSP": 0.520,  // Total of both components approx.
    "10.00mm CGRSP": 0.880,
    "6.00mm NCRGRSP": 0.465,
    "10.00mm NCRGRSP": 0.795
};

const MIN_PRODUCTION = {
    "6.20mm CGRSP": 4500,
    "10.00mm CGRSP": 1850,
    "6.00mm NCRGRSP": 2000,
    "10.00mm NCRGRSP": 1200
};

const ProductionDeclarationDashboard = () => {
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [entries, setEntries] = useState([
        {
            id: 1,
            date: "2024-03-20",
            shift: "Shift A",
            lineNo: "PL-01",
            productType: "6.20mm CGRSP",
            batchNos: "B-H021 / B-S044",
            qty: 4800,
            rawConsumed: 2150.5,
            status: "Verified by IE"
        },
        {
            id: 2,
            date: "2024-03-20",
            shift: "Shift B",
            lineNo: "PL-02",
            productType: "10.00mm GRSP",
            batchNos: "B-1025",
            qty: 2100,
            rawConsumed: 1638.0,
            status: "Submitted"
        }
    ]);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        shift: '',
        lineNo: '',
        productType: '',
        productRecipe: '',
        batchNo: '',
        batchWeight: '',
        compoundA_BatchNo: '',
        compoundA_Weight: '',
        compoundB_BatchNo: '',
        compoundB_Weight: '',
        totalQty: '',
        totalWeightCalc: 0,
        justification: ''
    });

    const [errors, setErrors] = useState({});
    const [lineOptions] = useState(["PL-01", "PL-02", "PL-03"]); // Mocked from Plant Setup
    const [recipeOptions] = useState([
        "R-001 (High Hardness)", 
        "R-002 (Standard)", 
        "R-C01 (Composite Softer)", 
        "R-C02 (Composite Harder)"
    ]); // Mocked from Plant Setup

    const [isReadOnly, setIsReadOnly] = useState(false);

    // Auto-calculate Total Weight and validate min production
    useEffect(() => {
        if (form.productType && form.totalQty) {
            const stdWeight = STANDARD_WEIGHTS[form.productType] || 0;
            const calcWeight = (parseInt(form.totalQty) || 0) * stdWeight;
            setForm(prev => ({ ...prev, totalWeightCalc: calcWeight.toFixed(3) }));
        } else {
            setForm(prev => ({ ...prev, totalWeightCalc: 0 }));
        }
    }, [form.productType, form.totalQty]);

    const handleView = (entry) => {
        const isComp = isComposite(entry.productType);
        let batchInfo = {};
        if (isComp) {
            const parts = entry.batchNos.split(' / ');
            batchInfo = {
                compoundA_BatchNo: parts[0] || '',
                compoundB_BatchNo: parts[1] || '',
                compoundA_Weight: (entry.rawConsumed / 2).toFixed(2),
                compoundB_Weight: (entry.rawConsumed / 2).toFixed(2),
            };
        } else {
            batchInfo = {
                batchNo: entry.batchNos,
                batchWeight: entry.rawConsumed,
            };
        }

        setForm({
            date: entry.date,
            shift: entry.shift,
            lineNo: entry.lineNo,
            productType: entry.productType,
            productRecipe: recipeOptions[0], // Simulated
            ...batchInfo,
            totalQty: entry.qty,
            totalWeightCalc: (entry.qty * (STANDARD_WEIGHTS[entry.productType] || 0)).toFixed(3),
            justification: entry.qty < MIN_PRODUCTION[entry.productType] ? "System verified production log." : ""
        });
        setIsReadOnly(true);
        setView('form');
    };

    const handleAddNew = () => {
        setForm({
            date: new Date().toISOString().split('T')[0],
            shift: '',
            lineNo: '',
            productType: '',
            productRecipe: '',
            batchNo: '',
            batchWeight: '',
            compoundA_BatchNo: '',
            compoundA_Weight: '',
            compoundB_BatchNo: '',
            compoundB_Weight: '',
            totalQty: '',
            totalWeightCalc: 0,
            justification: ''
        });
        setIsReadOnly(false);
        setErrors({});
        setView('form');
    };

    const handleChange = (e) => {
        if (isReadOnly) return;
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const isComposite = (type) => {
        return type === "6.20mm CGRSP" || type === "10.00mm CGRSP";
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.shift) newErrors.shift = "Shift is required";
        if (!form.lineNo) newErrors.lineNo = "Line number is required";
        if (!form.productType) newErrors.productType = "Product type is required";
        if (!form.productRecipe) newErrors.productRecipe = "Product recipe is required";
        
        if (isComposite(form.productType)) {
            if (!form.compoundA_BatchNo) newErrors.compoundA_BatchNo = "Required";
            if (!form.compoundA_Weight) newErrors.compoundA_Weight = "Required";
            if (!form.compoundB_BatchNo) newErrors.compoundB_BatchNo = "Required";
            if (!form.compoundB_Weight) newErrors.compoundB_Weight = "Required";
        } else {
            if (!form.batchNo) newErrors.batchNo = "Required";
            if (!form.batchWeight) newErrors.batchWeight = "Required";
        }

        if (!form.totalQty) {
            newErrors.totalQty = "Quantity is required";
        } else {
            const minAllowed = MIN_PRODUCTION[form.productType];
            if (minAllowed && parseInt(form.totalQty) < minAllowed) {
                if (!form.justification || form.justification.trim().length < 10) {
                    newErrors.totalQty = `Below PIO limit of ${minAllowed}. Mandatory justification remark required (min 10 chars).`;
                    newErrors.justification = "Please provide a valid justification for low production.";
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isReadOnly) {
            setView('list');
            return;
        }
        if (!validateForm()) {
            return;
        }

        // --- Backend Sync Logic & Anti-Manipulation (Simulated) ---
        
        // 1. Mass Balance Auto-Check
        const declaredBatchWeight = isComposite(form.productType)
            ? (parseFloat(form.compoundA_Weight) + parseFloat(form.compoundB_Weight))
            : parseFloat(form.batchWeight);
        
        const finishedWeight = parseFloat(form.totalWeightCalc);
        
        // If finished weight > batch weight, that's impossible/manipulation
        if (finishedWeight > declaredBatchWeight * 1.05) { // 5% buffer for moisture/etc if applicable
            setErrors(prev => ({ ...prev, totalQty: "Total production weight cannot exceed the batch weight consumed. Possible data manipulation detected." }));
            return;
        }

        // 2. Insufficient Stock Block (Simulated)
        // Let's assume for demo purposes that if quantity > 10000, we trigger an inventory error
        if (parseInt(form.totalQty) > 10000) {
            alert("❌ Submission Blocked: Insufficient verified raw material inventory for declared production. Please verify your Material Balance in the Inventory Management module.");
            return;
        }

        console.log("Submitting production entry with Inventory Sync checks...");
        
        const newEntry = {
            id: Date.now(),
            date: form.date,
            shift: form.shift,
            lineNo: form.lineNo,
            productType: form.productType,
            batchNos: isComposite(form.productType) 
                ? `${form.compoundA_BatchNo} / ${form.compoundB_BatchNo}` 
                : form.batchNo,
            qty: parseInt(form.totalQty),
            rawConsumed: declaredBatchWeight.toFixed(2),
            status: "Submitted"
        };

        setEntries([newEntry, ...entries]);
        
        // Notify user about KPI updates
        alert(`✅ Production Declared Successfully!\n\n- Material Balance deducted based on Product Recipe.\n- "Material Used" KPI updated in real-time.\n- Entry locked for IE Verification.`);
        
        setView('list');
    };

    return (
        <div className="fade-in">
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                        Production Declaration
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                        Declare shift-wise manufacturing output and track material consumption
                    </p>
                </div>
                {view === 'list' && (
                    <button className="btn-primary" onClick={handleAddNew}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Add Production Entry
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Date & Shift</th>
                                <th>Line ID</th>
                                <th>Product Type</th>
                                <th>Batch Number(s)</th>
                                <th>Quantity Produced (Nos.)</th>
                                <th>Material Consumed (Kg)</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => (
                                <tr key={entry.id}>
                                    <td>
                                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{entry.date}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{entry.shift}</div>
                                    </td>
                                    <td><span style={{ fontWeight: '600' }}>{entry.lineNo}</span></td>
                                    <td>{entry.productType}</td>
                                    <td><code style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>{entry.batchNos}</code></td>
                                    <td style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{entry.qty.toLocaleString()}</td>
                                    <td>{entry.rawConsumed} Kg</td>
                                    <td>
                                        <span className={`badge ${entry.status === 'Verified by IE' ? 'badge-verified' : 'badge-pending'}`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleView(entry)}
                                            style={{ 
                                                padding: '4px 8px', fontSize: '11px', background: 'transparent',
                                                border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer'
                                            }}
                                        >View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="form-container fade-in">
                    <form onSubmit={handleSubmit}>
                        {/* Section A: Context */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <div style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>A</div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>Shift & Line Context</h3>
                            </div>
                            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                <div className="form-group">
                                    <label className="form-label">Date of Production</label>
                                    <input type="date" name="date" className="form-input" value={form.date} onChange={handleChange} required disabled={isReadOnly} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Shift</label>
                                    <select name="shift" className={`form-select ${errors.shift ? 'error' : ''}`} value={form.shift} onChange={handleChange} required disabled={isReadOnly}>
                                        <option value="">Select Shift</option>
                                        <option value="Shift A">Shift A</option>
                                        <option value="Shift B">Shift B</option>
                                        <option value="Shift C">Shift C</option>
                                    </select>
                                    {errors.shift && <div style={{ color: 'red', fontSize: '10px', marginTop: '4px' }}>{errors.shift}</div>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Production Line Number</label>
                                    <select name="lineNo" className={`form-select ${errors.lineNo ? 'error' : ''}`} value={form.lineNo} onChange={handleChange} required disabled={isReadOnly}>
                                        <option value="">Select Line</option>
                                        {lineOptions.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    {errors.lineNo && <div style={{ color: 'red', fontSize: '10px', marginTop: '4px' }}>{errors.lineNo}</div>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Product Type</label>
                                    <select name="productType" className={`form-select ${errors.productType ? 'error' : ''}`} value={form.productType} onChange={handleChange} required disabled={isReadOnly}>
                                        <option value="">Select Product</option>
                                        {PAD_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    {errors.productType && <div style={{ color: 'red', fontSize: '10px', marginTop: '4px' }}>{errors.productType}</div>}
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '16px', maxWidth: '50%' }}>
                                <label className="form-label">Product Recipe</label>
                                <select name="productRecipe" className={`form-select ${errors.productRecipe ? 'error' : ''}`} value={form.productRecipe} onChange={handleChange} required disabled={isReadOnly}>
                                    <option value="">Select recipe used for this batch</option>
                                    {recipeOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                {errors.productRecipe && <div style={{ color: 'red', fontSize: '10px', marginTop: '4px' }}>{errors.productRecipe}</div>}
                            </div>
                        </div>

                        {/* Section B: Batch Mapping */}
                        <div style={{ marginBottom: '32px', background: 'rgba(66, 129, 140, 0.03)', padding: '24px', borderRadius: '16px', border: '1px dashed rgba(66, 129, 140, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <div style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>B</div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>Batch Mapping & Material Consumption</h3>
                            </div>

                            {!isComposite(form.productType) ? (
                                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="form-group">
                                        <label className="form-label">Batch Number Used</label>
                                        <input type="text" name="batchNo" className={`form-input ${errors.batchNo ? 'error' : ''}`} placeholder="Enter Batch No." value={form.batchNo} onChange={handleChange} required={!isComposite(form.productType)} disabled={isReadOnly} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Total Batch Weight Consumed (Kg)</label>
                                        <input type="number" step="0.01" name="batchWeight" className={`form-input ${errors.batchWeight ? 'error' : ''}`} placeholder="0.00" value={form.batchWeight} onChange={handleChange} required={!isComposite(form.productType)} disabled={isReadOnly} />
                                    </div>
                                </div>
                            ) : (
                                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '12px' }}>Compound A Details (Harder Side)</div>
                                        <div className="form-group">
                                            <label className="form-label">Batch Number Used (A)</label>
                                            <input type="text" name="compoundA_BatchNo" className="form-input" value={form.compoundA_BatchNo} onChange={handleChange} required disabled={isReadOnly} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Weight Consumed (Kg)</label>
                                            <input type="number" step="0.01" name="compoundA_Weight" className="form-input" value={form.compoundA_Weight} onChange={handleChange} required disabled={isReadOnly} />
                                        </div>
                                    </div>
                                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Compound B Details (Softer Side)</div>
                                        <div className="form-group">
                                            <label className="form-label">Batch Number Used (B)</label>
                                            <input type="text" name="compoundB_BatchNo" className="form-input" value={form.compoundB_BatchNo} onChange={handleChange} required disabled={isReadOnly} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Weight Consumed (Kg)</label>
                                            <input type="number" step="0.01" name="compoundB_Weight" className="form-input" value={form.compoundB_Weight} onChange={handleChange} required disabled={isReadOnly} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section C: Output */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <div style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>C</div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>Output Declaration & Validations</h3>
                            </div>
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="form-group">
                                    <label className="form-label">Total Quantity Produced (Nos.)</label>
                                    <input type="number" name="totalQty" className={`form-input ${errors.totalQty ? 'error' : ''}`} placeholder="Enter finished quantity" value={form.totalQty} onChange={handleChange} required disabled={isReadOnly} />
                                    {errors.totalQty && (
                                        <div style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', marginTop: '6px', background: '#fef2f2', padding: '8px', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                                            ⚠️ {errors.totalQty}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Total Weight of Production (Kg)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input className="form-input" value={form.totalWeightCalc} readOnly style={{ background: '#f8fafc', fontWeight: '700', color: 'var(--primary-color)' }} />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#64748b' }}>Computed from Appendix N</span>
                                    </div>
                                </div>
                            </div>

                            {/* Conditional Justification Field */}
                            {(errors.totalQty && errors.totalQty.includes("justification")) || (form.productType && MIN_PRODUCTION[form.productType] && parseInt(form.totalQty) < MIN_PRODUCTION[form.productType]) ? (
                                <div className="form-group fade-in" style={{ marginTop: '16px' }}>
                                    <label className="form-label" style={{ color: '#dc2626' }}>Mandatory Justification Remark <span style={{ color: '#dc2626' }}>*</span></label>
                                    <textarea 
                                        name="justification" 
                                        className={`form-textarea ${errors.justification ? 'error' : ''}`} 
                                        rows="3" 
                                        placeholder="Explain reason for low production (e.g., machine breakdown, power failure, etc.)"
                                        value={form.justification}
                                        onChange={handleChange}
                                        disabled={isReadOnly}
                                    ></textarea>
                                    {errors.justification && <div style={{ color: '#dc2626', fontSize: '10px', marginTop: '4px' }}>{errors.justification}</div>}
                                </div>
                            ) : null}
                        </div>

                        {/* Footer / Actions */}
                        <div style={{ 
                            marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border-color)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🛡️ <span style={{ maxWidth: '300px' }}>Your material balance will be automatically checked and deducted upon submission.</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setView('list')}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '0.8rem 3rem' }}>
                                    {isReadOnly ? 'Close View' : 'Submit Production Log'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
            
            {/* Mass Balance Insight (Optional Premium Detail) */}
            {view === 'form' && form.totalQty && (
                <div className="fade-in" style={{ 
                    marginTop: '20px', padding: '16px', background: '#f0f9ff', borderRadius: '12px', 
                    border: '1px solid #e0f2fe', display: 'flex', alignItems: 'center', gap: '16px' 
                }}>
                    <div style={{ fontSize: '24px' }}>📊</div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1' }}>Mass Balance Preview</div>
                        <div style={{ fontSize: '11px', color: '#0c4a6e' }}>
                            Declared Batch Weight: <b>{isComposite(form.productType) ? (parseFloat(form.compoundA_Weight||0) + parseFloat(form.compoundB_Weight||0)).toFixed(2) : (form.batchWeight || 0)} Kg</b> 
                            &nbsp;|&nbsp; 
                            Finished Production: <b>{form.totalWeightCalc} Kg</b>
                            &nbsp;|&nbsp; 
                            Process Waste/Scrap: <b>{Math.max(0, (isComposite(form.productType) ? (parseFloat(form.compoundA_Weight||0) + parseFloat(form.compoundB_Weight||0)) : (form.batchWeight || 0)) - form.totalWeightCalc).toFixed(2)} Kg</b>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionDeclarationDashboard;
