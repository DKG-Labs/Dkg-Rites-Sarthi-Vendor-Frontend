import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const InventoryUsedForm = ({ 
    material, 
    onClose, 
    onSubmit, 
    onDelete, 
    initialData, 
    productionDeclarations = [], 
    mixDesigns = [] 
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Sub-types based on material
    const getSubTypes = (id) => {
        switch (id) {
            case 'hts-wire': return ['9.5mm', '4mm', '5mm'];
            case 'cement': return ['OPC 53', 'PPC', 'PSC'];
            case 'aggregates': return ['CA1', 'CA2', 'Fine Aggregate'];
            case 'sgci-insert': return ['RT-381', 'RT-2501'];
            case 'dowel': return ['Type A', 'Type B'];
            case 'admixture': return ['Type 1', 'Type 2'];
            default: return ['Default'];
        }
    };

    const subTypes = getSubTypes(material.id);

    const [formData, setFormData] = useState(() => {
        if (initialData) {
            return {
                id: initialData.id,
                date: initialData.date,
                rawMaterial: initialData.rawMaterial,
                subType: initialData.subType || subTypes[0],
                usedFor: initialData.usedFor || 'Manufacturing of Sleepers',
                sleepersMade: initialData.sleepersMade || 0,
                estimatedQty: initialData.estimatedQty || 0,
                qty: initialData.qty || '',
                status: initialData.status || 'Pending'
            };
        }
        return {
            date: new Date().toISOString().split('T')[0],
            rawMaterial: material.name,
            subType: subTypes[0],
            usedFor: 'Manufacturing of Sleepers',
            sleepersMade: 0,
            estimatedQty: 0,
            qty: '',
            status: 'Pending'
        };
    });

    useEffect(() => {
        if (formData.date) {
            // Convert YYYY-MM-DD to DD/MM/YYYY
            const formattedDate = formData.date.split('-').reverse().join('/');
            
            // Find approved production declarations for this date
            const matchedDecls = productionDeclarations.filter(d => 
                d.castingDate === formattedDate && 
                (d.status === 'Completed' || d.status === 'Locked' || d.status === 'Verified & Locked')
            );
            
            const totalCasted = matchedDecls.reduce((sum, d) => sum + (d.totalCastedSleepers || 0), 0);
            
            // Find approved mix design or fallback
            const approvedMix = mixDesigns.find(m => 
                m.status === 'Verified & Locked' || m.status === 'Locked' || m.status === 'Completed'
            ) || mixDesigns[0];

            const volumePerSleeper = 0.104; // Standard volume per concrete sleeper in m3
            let estimated = 0;

            if (formData.usedFor === 'Wastage') {
                estimated = 0; // Estimation is for manufacturing
            } else {
                if (material.id === 'cement') {
                    const factor = approvedMix ? (Number(approvedMix.cement) || 400) * volumePerSleeper : 40;
                    estimated = totalCasted * factor;
                } else if (material.id === 'aggregates') {
                    let factor = 50; // Fallback CA1
                    if (formData.subType === 'CA2') {
                        factor = approvedMix ? (Number(approvedMix.ca2) || 300) * volumePerSleeper : 30;
                    } else if (formData.subType === 'Fine Aggregate') {
                        factor = approvedMix ? (Number(approvedMix.fa) || 450) * volumePerSleeper : 45;
                    } else { // CA1
                        factor = approvedMix ? (Number(approvedMix.ca1) || 500) * volumePerSleeper : 50;
                    }
                    estimated = totalCasted * factor;
                } else if (material.id === 'admixture') {
                    const factor = approvedMix ? (Number(approvedMix.admixtureKg) || 5) * volumePerSleeper : 0.5;
                    estimated = totalCasted * factor;
                } else if (material.id === 'hts-wire') {
                    estimated = totalCasted * 9.25; // standard 9.25 Kg per sleeper
                } else if (material.id === 'sgci-insert') {
                    estimated = totalCasted * 4; // 4 inserts per sleeper
                } else if (material.id === 'dowel') {
                    estimated = totalCasted * 4; // 4 dowels per sleeper
                }
            }

            setFormData(prev => ({
                ...prev,
                sleepersMade: totalCasted,
                estimatedQty: Number(estimated.toFixed(3))
            }));
        }
    }, [formData.date, formData.subType, formData.usedFor, productionDeclarations, mixDesigns, material.id]);

    const handleChange = (e, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const isReadOnly = initialData && (initialData.status === 'Completed' || initialData.status === 'Locked' || initialData.status === 'Verified');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        const payload = {
            ...formData,
            id: initialData?.id || `USED-${material.id.toUpperCase().substring(0, 3)}-${Date.now()}`,
            qty: parseFloat(formData.qty) || 0
        };
        
        try {
            await onSubmit(payload);
        } finally {
            if (document.body.contains(e.target)) {
                setIsSubmitting(false);
            }
        }
    };

    const handleDeleteClick = () => {
        if (onDelete && initialData?.id) {
            onDelete(initialData.id);
        }
    };

    const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' };
    const groupStyle = { marginBottom: '16px' };
    const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

    return createPortal(
        <div style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', 
            backdropFilter: 'blur(4px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000, 
            padding: '20px'
        }}>
            <div style={{
                background: 'white', 
                borderRadius: '32px', 
                width: '100%', 
                maxWidth: '650px',
                maxHeight: '90vh', 
                overflowY: 'auto', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex', 
                flexDirection: 'column',
            }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isReadOnly ? `View RM Used Entry` : (initialData ? `Edit RM Used Entry` : `Add RM Used Entry`)}
                        {isReadOnly && <span style={{ fontSize: '11px', color: '#047857', background: '#ecfdf5', padding: '4px 8px', borderRadius: '8px', fontWeight: '700' }}>🔒 Verified & Locked</span>}
                    </h2>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
                    <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
                        <div style={gridStyle}>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Date of Use</label>
                                <input type="date" value={formData.date} onChange={(e) => handleChange(e, 'date')} required style={inputStyle} />
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Raw Material</label>
                                <input type="text" value={formData.rawMaterial} readOnly style={{ ...inputStyle, background: '#f8fafc', color: '#64748b' }} />
                            </div>
                        </div>

                        <div style={gridStyle}>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Raw Material Sub Type</label>
                                <select value={formData.subType} onChange={(e) => handleChange(e, 'subType')} style={inputStyle}>
                                    {subTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>RM Used For</label>
                                <select value={formData.usedFor} onChange={(e) => handleChange(e, 'usedFor')} style={inputStyle}>
                                    <option value="Manufacturing of Sleepers">Manufacturing of Sleepers</option>
                                    <option value="Wastage">Wastage</option>
                                </select>
                            </div>
                        </div>

                        {formData.usedFor === 'Manufacturing of Sleepers' && (
                            <div style={gridStyle}>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>No. of Sleepers Made (Approved)</label>
                                    <input type="number" value={formData.sleepersMade} readOnly style={{ ...inputStyle, background: '#f8fafc', fontWeight: '600' }} />
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Auto-fetched from production logs for this date</span>
                                </div>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>Estimated Qty Used ({material.unit})</label>
                                    <input type="number" value={formData.estimatedQty} readOnly style={{ ...inputStyle, background: '#f0fdfa', color: '#047857', fontWeight: '700', border: '1px solid #a7f3d0' }} />
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Auto-calculated by Mix Design / Drawing</span>
                                </div>
                            </div>
                        )}

                        <div style={groupStyle}>
                            <label style={{ ...labelStyle, color: '#0284c7' }}>RM Used Qty ({material.unit})</label>
                            <input 
                                type="number" 
                                step="0.001" 
                                value={formData.qty} 
                                onChange={(e) => handleChange(e, 'qty')} 
                                required 
                                placeholder={`Enter actual physical quantity in ${material.unit}`} 
                                style={{ ...inputStyle, borderColor: '#0284c7', borderWidth: '1.5px' }} 
                            />
                        </div>
                    </fieldset>

                    <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                        {isReadOnly ? (
                            <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#42818c', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                                Close
                            </button>
                        ) : (
                            <>
                                <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                                {initialData && (
                                    <button type="button" onClick={handleDeleteClick} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid #ffe4e6', background: '#fff1f2', fontWeight: '700', color: '#e11d48', cursor: 'pointer' }}>
                                        Delete Entry
                                    </button>
                                )}
                                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: isSubmitting ? '#94a3b8' : '#42818c', color: 'white', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                                    {isSubmitting ? 'Saving...' : (initialData ? 'Update Entry' : 'Save Entry')}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default InventoryUsedForm;
