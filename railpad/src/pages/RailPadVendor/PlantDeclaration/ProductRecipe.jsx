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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (totalPercentage <= 100 && virginTotal >= 50) {
            const newEntry = {
                id: Date.now(),
                recipeId: recipeId,
                padType: padType,
                composition: ingredients.map(ing => `${ing.material}: ${ing.percentage}%`).join(', ').substring(0, 30) + '...',
                status: "Pending Verification"
            };
            setEntries([...entries, newEntry]);
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
                    <button className="btn-primary" onClick={() => setView('form')}>
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
                                <th>Action</th>
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
                                    <td><button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '11px' }}>Details</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="form-container fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '800' }}>Build Recipe Composition</h3>
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
                            <button type="submit" className="btn-primary" disabled={!!error} style={{ padding: '0.8rem 3rem', opacity: error ? 0.5 : 1 }}>Submit Recipe</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ProductRecipe;
