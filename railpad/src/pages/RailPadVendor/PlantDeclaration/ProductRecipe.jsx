import React, { useState, useEffect } from 'react';
import { productRecipeService } from '../../../services/productRecipeService';

const ProductRecipe = ({ entries, setEntries, onRefresh, isLoading }) => {
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

    const [isSaving, setIsSaving] = useState(false);
    const [view, setView] = useState('list');
    const [statusTab, setStatusTab] = useState('PENDING');
    const [recipeId, setRecipeId] = useState('');
    const [padType, setPadType] = useState('');
    const [ingredients, setIngredients] = useState([
        { rawMaterial: '', percentage: 0 }
    ]);
    const [totalPercentage, setTotalPercentage] = useState(0);
    const [virginTotal, setVirginTotal] = useState(0);
    const [error, setError] = useState('');
    const [editingEntry, setEditingEntry] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);

    const pendingStatuses = ['CREATED', 'PENDING', 'NOT_STARTED', 'IN_PROGRESS', 'CREATE', 'RETURNED', 'RESUBMITTED'];
    const verifiedStatuses = ['COMPLETED', 'VERIFIED', 'APPROVED'];

    const filteredEntries = (entries || []).filter(entry => {
        if (statusTab === 'PENDING') {
            return pendingStatuses.includes(entry.status);
        } else {
            return verifiedStatuses.includes(entry.status);
        }
    });

    const pendingCount = (entries || []).filter(e => pendingStatuses.includes(e.status)).length;
    const verifiedCount = (entries || []).filter(e => verifiedStatuses.includes(e.status)).length;

    const padTypes = ["6.00mm GRSP", "10.00mm GRSP", "6.20mm CGRSP", "10.00mm CGRSP", "6.00mm NCRGRSP", "10.00mm NCRGRSP"];
    const materials = ["Natural Rubber", "RSS1", "RSS2", "RSS3", "SBR", "PBR", "Carbon Black", "Silica"];
    const virginMaterials = ["Natural Rubber", "RSS1", "RSS2", "RSS3", "SBR", "PBR"];

    useEffect(() => {
        const total = ingredients.reduce((sum, item) => sum + parseFloat(item.percentage || 0), 0);
        const virginSum = ingredients
            .filter(item => virginMaterials.includes(item.rawMaterial))
            .reduce((sum, item) => sum + parseFloat(item.percentage || 0), 0);

        setTotalPercentage(total);
        setVirginTotal(virginSum);

        if (total > 100) {
            setError('Error: Total composition exceeds 100%');
        } else if (view === 'form' && total > 0 && virginSum < 50) {
            setError('Error: Virgin Material must be at least 50%');
        } else {
            setError('');
        }
    }, [ingredients, view]);

    const handleAddIngredient = () => {
        setIngredients([...ingredients, { rawMaterial: '', percentage: 0 }]);
    };

    const handleIngredientChange = (index, field, value) => {
        const updated = [...ingredients];
        updated[index][field] = value;
        setIngredients(updated);
    };

    const handleRemoveIngredient = (index) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setRecipeId(entry.recipeIdentification);
        setPadType(entry.padType);
        setIngredients((entry.ingredients || []).map(ing => ({
            rawMaterial: ing.rawMaterial,
            percentage: ing.percentage
        })));
        setView('form');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this recipe?')) {
            try {
                await productRecipeService.delete(id);
                onRefresh();
            } catch (error) {
                alert('Error deleting entry: ' + error.message);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (totalPercentage <= 100 && virginTotal >= 50) {
            setIsSaving(true);
            try {
                const plantId = localStorage.getItem('railpad_selectedPlantId');
                const payload = {
                    vendorName: user?.vendorName || "",
                    vendorCode: user?.vendorCode || "",
                    plantId: plantId || "1",
                    shift: "General",
                    recipeIdentification: recipeId,
                    padType: padType,
                    totalPercentage: totalPercentage,
                    virginTotalPercentage: virginTotal,
                    status: "PENDING",
                    createdBy: user?.userId || 1,
                    updatedBy: user?.userId || 1,
                    ingredients: ingredients.map(ing => ({
                        rawMaterial: ing.rawMaterial,
                        percentage: parseFloat(ing.percentage)
                    }))
                };

                if (editingEntry) {
                    await productRecipeService.update(editingEntry.id, payload);
                } else {
                    await productRecipeService.create(payload);
                }

                onRefresh();
                setView('list');
                setRecipeId('');
                setPadType('');
                setIngredients([{ rawMaterial: '', percentage: 0 }]);
                setEditingEntry(null);
            } catch (error) {
                alert('Error saving entry: ' + error.message);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const SkeletonRow = () => (
        <tr style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
            <td style={{ padding: '20px 12px' }}>
                <div style={{ width: 100, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 120, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 60, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 60, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
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
                <div className="section-header" style={{ marginBottom: view === 'list' ? '24px' : '0' }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Product Recipe</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Chemical composition as per IRS T-55-2023</p>
                    </div>
                    {view === 'list' && (
                        <button className="btn-primary" onClick={() => { setView('form'); setEditingEntry(null); setRecipeId(''); setPadType(''); setIngredients([{ rawMaterial: '', percentage: 0 }]); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                            Add Recipe
                        </button>
                    )}
                </div>

                {view === 'list' && (
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
                )}
            </div>

            {view === 'list' ? (
                <div className="fade-in">

                    <div className="table-container fade-in">
                        <table>
                            <thead>
                                <tr>
                                    <th>Recipe Identification</th>
                                    <th>Rail Pad Type</th>
                                    <th>Total %</th>
                                    <th>Virgin %</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
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
                                ) : filteredEntries.length > 0 ? (
                                    filteredEntries.map(entry => (
                                        <tr key={entry.id}>
                                            <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{entry.recipeIdentification}</td>
                                            <td>{entry.padType}</td>
                                            <td>{entry.totalPercentage}%</td>
                                            <td>{entry.virginTotalPercentage}%</td>
                                            <td>
                                                <span className={`badge ${verifiedStatuses.includes(entry.status) ? 'badge-verified' : 'badge-pending'}`}>
                                                    {entry.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="action-buttons-group" style={{ justifyContent: 'center' }}>
                                                    <button onClick={() => { setSelectedEntry(entry); setView('details'); }} className="btn-icon-action view">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                        Details
                                                    </button>
                                                    {pendingStatuses.includes(entry.status) && (
                                                        <>
                                                            <button onClick={() => handleEdit(entry)} className="btn-icon-action edit">
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
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                            No {statusTab === 'PENDING' ? 'pending' : 'verified'} entries found for this plant.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : view === 'form' ? (
                <div className="form-container fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '800' }}>
                            {editingEntry ? 'Modify Recipe Composition' : 'Build Recipe Composition'}
                        </h3>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Recipe Identification *</label>
                                <input 
                                    className="form-input" 
                                    placeholder="e.g. Batch-A-01" 
                                    value={recipeId} 
                                    onChange={(e) => setRecipeId(e.target.value)} 
                                    required 
                                    style={{ border: '1px solid #cbd5e1', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Type of Rail Pad *</label>
                                <select 
                                    className="form-select" 
                                    value={padType} 
                                    onChange={(e) => setPadType(e.target.value)} 
                                    required 
                                    style={{ border: '1px solid #cbd5e1', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                                >
                                    <option value="">Select Pad Type</option>
                                    {padTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '32px', background: 'rgba(248, 250, 252, 0.6)', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Composition Builder</h4>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Define the ingredients and their percentage in the mix.</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleAddIngredient} 
                                    style={{
                                        background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px',
                                        fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                        boxShadow: '0 2px 4px rgba(33,128,141,0.2)', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                                    Add Ingredient
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {ingredients.map((ing, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '16px', background: '#fff', 
                                        padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)', transition: 'border-color 0.2s'
                                    }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', 
                                            color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: '700', flexShrink: 0, marginTop: '28px'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '12px', color: '#475569' }}>Raw Material</label>
                                            <select 
                                                className="form-select" 
                                                value={ing.rawMaterial} 
                                                onChange={(e) => handleIngredientChange(idx, 'rawMaterial', e.target.value)} 
                                                required 
                                                style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', background: '#f8fafc' }}
                                            >
                                                <option value="">Select Material...</option>
                                                {materials
                                                    .filter(m => !ingredients.some((otherIng, otherIdx) => otherIdx !== idx && otherIng.rawMaterial === m))
                                                    .map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '12px', color: '#475569' }}>Percentage (%)</label>
                                            <div style={{ position: 'relative' }}>
                                                <input 
                                                    type="number" 
                                                    step="0.01" 
                                                    className="form-input" 
                                                    value={ing.percentage} 
                                                    onChange={(e) => handleIngredientChange(idx, 'percentage', e.target.value)} 
                                                    required 
                                                    style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', background: '#f8fafc', paddingRight: '32px' }}
                                                />
                                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>%</span>
                                            </div>
                                        </div>
                                        {ingredients.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveIngredient(idx)} 
                                                style={{
                                                    background: 'transparent', border: 'none', color: '#ef4444', 
                                                    padding: '8px', cursor: 'pointer', alignSelf: 'center', marginTop: '20px',
                                                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                title="Remove Ingredient"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ 
                            marginTop: '24px', 
                            background: totalPercentage > 100 || (totalPercentage > 0 && virginTotal < 50) ? '#fef2f2' : 'linear-gradient(to right, #f0fdf4, #dcfce7)',
                            border: `1px solid ${totalPercentage > 100 || (totalPercentage > 0 && virginTotal < 50) ? '#fca5a5' : '#86efac'}`,
                            borderRadius: '12px', padding: '16px 24px', 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Composition</div>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: totalPercentage > 100 ? '#dc2626' : '#166534' }}>
                                    {totalPercentage.toFixed(2)}%
                                </div>
                            </div>
                            
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Virgin Material</div>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: (totalPercentage > 0 && virginTotal < 50) ? '#dc2626' : '#166534' }}>
                                    {virginTotal.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                        {error && (
                            <div style={{ marginTop: '12px', padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                            <button type="button" className="btn-secondary" onClick={() => setView('list')} style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '8px' }}>Cancel</button>
                            <button 
                                type="submit" 
                                disabled={!!error || isSaving}
                                style={{
                                    background: (!!error || isSaving) ? '#94a3b8' : 'var(--primary-color)',
                                    color: '#fff', border: 'none', padding: '10px 32px', borderRadius: '8px',
                                    fontSize: '14px', fontWeight: '700', cursor: (!!error || isSaving) ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 6px rgba(33,128,141,0.2)', transition: 'all 0.2s'
                                }}
                            >
                                {isSaving ? 'Saving...' : (editingEntry ? 'Update Recipe' : 'Submit Recipe')}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="details-card fade-in">
                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'var(--primary-color)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>1</span>
                        Recipe Identification
                    </div>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">Recipe ID</div>
                            <div className="info-value">{selectedEntry?.recipeIdentification}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Rail Pad Type</div>
                            <div className="info-value">{selectedEntry?.padType}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Current Status</div>
                            <div className="info-value">
                                <span className={`badge ${verifiedStatuses.includes(selectedEntry?.status) ? 'badge-verified' : 'badge-pending'}`}>
                                    {selectedEntry?.status}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Total %</div>
                            <div className="info-value">{selectedEntry?.totalPercentage}%</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Virgin %</div>
                            <div className="info-value" style={{ color: '#059669' }}>{selectedEntry?.virginTotalPercentage}%</div>
                        </div>
                    </div>

                    <div className="section-divider"></div>

                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--primary-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'var(--primary-color)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>2</span>
                        Composition Breakdown
                    </div>

                    <div className="table-container fade-in" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ margin: 0 }}>
                            <thead>
                                <tr style={{ background: 'var(--accent-bg)' }}>
                                    <th style={{ padding: '12px 20px', fontSize: '11px' }}>Ingredient / Raw Material</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '11px' }}>Percentage (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedEntry?.ingredients?.map((ing, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text-main)' }}>{ing.rawMaterial}</td>
                                        <td style={{ padding: '12px 20px', textAlign: 'center', fontWeight: '700', color: 'var(--primary-color)' }}>{parseFloat(ing.percentage).toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductRecipe;
