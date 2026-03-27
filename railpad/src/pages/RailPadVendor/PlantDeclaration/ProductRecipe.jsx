import React, { useState, useEffect } from 'react';

const ProductRecipe = ({ entries, setEntries }) => {
    const [view, setView] = useState('list');
    const [recipeId, setRecipeId] = useState('');
    const [padType, setPadType] = useState('');
    const [ingredients, setIngredients] = useState([
        { material: '', percentage: 0 }
    ]);
    const [totalPercentage, setTotalPercentage] = useState(0);
    const [virginTotal, setVirginTotal] = useState(0);
    const [error, setError] = useState('');
    const [editingEntry, setEditingEntry] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null);

    const padTypes = ["6.00mm GRSP", "10.00mm GRSP", "6.20mm CGRSP", "10.00mm CGRSP", "6.00mm NCRGRSP", "10.00mm NCRGRSP"];
    const materials = ["Natural Rubber", "RSS1", "RSS2", "RSS3", "SBR", "PBR", "Carbon Black", "Silica"];
    const virginMaterials = ["Natural Rubber", "RSS1", "RSS2", "RSS3", "SBR", "PBR"];

    useEffect(() => {
        const total = ingredients.reduce((sum, item) => sum + parseFloat(item.percentage || 0), 0);
        const virginSum = ingredients
            .filter(item => virginMaterials.includes(item.material))
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
        setIngredients([...ingredients, { material: '', percentage: 0 }]);
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
        setRecipeId(entry.recipeId);
        setPadType(entry.padType);
        // If the entry has raw ingredients, use them, otherwise try to reconstruct or start fresh
        if (entry.ingredients) {
            setIngredients(entry.ingredients);
        } else {
            setIngredients([{ material: '', percentage: 0 }]);
        }
        setView('form');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this recipe?')) {
            setEntries(entries.filter(entry => entry.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (totalPercentage <= 100 && virginTotal >= 50) {
            const compositionSummary = ingredients.map(ing => `${ing.material}: ${ing.percentage}%`).join(', ').substring(0, 30) + '...';

            if (editingEntry) {
                const updatedEntries = entries.map(entry => {
                    if (entry.id === editingEntry.id) {
                        return {
                            ...entry,
                            recipeId: recipeId,
                            padType: padType,
                            composition: compositionSummary,
                            ingredients: [...ingredients],
                            status: "Pending Verification"
                        };
                    }
                    return entry;
                });
                setEntries(updatedEntries);
                setEditingEntry(null);
            } else {
                const newEntry = {
                    id: Date.now(),
                    recipeId: recipeId,
                    padType: padType,
                    composition: compositionSummary,
                    ingredients: [...ingredients],
                    status: "Pending Verification"
                };
                setEntries([...entries, newEntry]);
            }

            setView('list');
            // Reset form
            setRecipeId('');
            setPadType('');
            setIngredients([{ material: '', percentage: 0 }]);
        }
    };

    return (
        <div className="fade-in">
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Product Recipe</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Chemical composition as per IRS T-55-2023</p>
                </div>
                {view === 'list' && (
                    <button className="btn-primary" onClick={() => { setView('form'); setEditingEntry(null); setRecipeId(''); setPadType(''); setIngredients([{ material: '', percentage: 0 }]); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Add Recipe
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="table-container fade-in">
                    <table>
                        <thead>
                            <tr>
                                <th>Recipe ID</th>
                                <th>Rail Pad Type</th>
                                <th>Composition</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => (
                                <tr key={entry.id}>
                                    <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{entry.recipeId}</td>
                                    <td>{entry.padType}</td>
                                    <td style={{ fontSize: '11px' }}>{entry.composition}</td>
                                    <td>
                                        <span className={`badge ${entry.status === 'Verified & Locked' ? 'badge-verified' : 'badge-pending'}`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {(entry.status === 'Pending Verification' || entry.status === 'Unlocked for Modification') && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(entry)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            fontSize: '11px',
                                                            background: 'rgba(66, 129, 140, 0.1)',
                                                            color: 'var(--primary-color)',
                                                            border: '1px solid var(--primary-color)',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontWeight: '700'
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            fontSize: '11px',
                                                            background: 'rgba(220, 38, 38, 0.1)',
                                                            color: '#dc2626',
                                                            border: '1px solid #dc2626',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontWeight: '700'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: '0.4rem 1rem', fontSize: '11px' }}
                                                onClick={() => { setSelectedEntry(entry); setView('details'); }}
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Recipe Identification</label>
                                <input className="form-input" placeholder="e.g. Batch-A-01" value={recipeId} onChange={(e) => setRecipeId(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type of Rail Pad</label>
                                <select className="form-select" value={padType} onChange={(e) => setPadType(e.target.value)} required >
                                    <option value="">Select Type</option>
                                    {padTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label className="form-label">Composition Builder</label>
                                <button type="button" onClick={handleAddIngredient} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '11px' }}>+ Ingredient</button>
                            </div>

                            {ingredients.map((ing, idx) => (
                                <div key={idx} className="composition-row fade-in">
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '10px' }}>Raw Material</label>
                                        <select className="form-select" value={ing.material} onChange={(e) => handleIngredientChange(idx, 'material', e.target.value)} required >
                                            <option value="">Select</option>
                                            {materials.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '10px' }}>Percentage (%)</label>
                                        <input type="number" step="0.01" className="form-input" value={ing.percentage} onChange={(e) => handleIngredientChange(idx, 'percentage', e.target.value)} required />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveIngredient(idx)} style={{ background: '#fee2e2', border: 'none', color: '#b91c1c', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg></button>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--accent-bg)', borderRadius: '12px', border: '1px solid rgba(66, 129, 140, 0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}>
                                <span>Total Composition: <span style={{ color: totalPercentage > 100 ? '#dc2626' : 'var(--primary-color)' }}>{totalPercentage.toFixed(2)}%</span></span>
                                <span>Virgin Total: <span style={{ color: virginTotal < 50 ? '#dc2626' : '#16a34a' }}>{virginTotal.toFixed(2)}%</span></span>
                            </div>
                            {error && <div className="error-msg" style={{ marginTop: '8px' }}>{error}</div>}
                        </div>

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" disabled={!!error} style={{ padding: '0.8rem 3rem', opacity: error ? 0.5 : 1 }}>
                                {editingEntry ? 'Update Recipe' : 'Submit Recipe'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="details-container fade-in" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.25rem', fontWeight: '800' }}>Recipe Details</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Full breakdown of chemical composition</p>
                        </div>
                        <button className="btn-secondary" onClick={() => setView('list')} style={{ padding: '0.5rem 1.5rem', fontWeight: '700' }}>Back to List</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px', padding: '20px', background: 'var(--accent-bg)', borderRadius: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>Recipe ID</label>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedEntry?.recipeId}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>Rail Pad Type</label>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedEntry?.padType}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '700' }}>Current Status</label>
                            <span className={`badge ${selectedEntry?.status === 'Verified & Locked' ? 'badge-verified' : 'badge-pending'}`}>
                                {selectedEntry?.status}
                            </span>
                        </div>
                    </div>

                    <h4 style={{ fontSize: 'var(--fs-md)', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20" /></svg>
                        Composition Breakdown
                    </h4>

                    <div className="table-container" style={{ margin: '0 0 24px 0', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>Material Name</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>Percentage (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedEntry?.ingredients?.map((ing, idx) => (
                                    <tr key={idx} style={{ borderBottom: idx === selectedEntry.ingredients.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{ing.material}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: 'var(--primary-color)' }}>{parseFloat(ing.percentage).toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ padding: '16px', background: '#f0f9fa', borderRadius: '10px', border: '1px solid rgba(33, 128, 141, 0.2)' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Composition</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                                {selectedEntry?.ingredients?.reduce((sum, ing) => sum + parseFloat(ing.percentage || 0), 0).toFixed(2)}%
                            </div>
                        </div>
                        <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', marginBottom: '4px' }}>Virgin Material Total</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#16a34a' }}>
                                {selectedEntry?.ingredients?.filter(ing => ["Natural Rubber", "RSS1", "RSS2", "RSS3", "SBR", "PBR"].includes(ing.material)).reduce((sum, ing) => sum + parseFloat(ing.percentage || 0), 0).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductRecipe;
