import React, { useState, useEffect } from 'react';
import { apiService } from '../../../../services/api';

const MixDesignSection = () => {
    const [mixDesigns, setMixDesigns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [newMix, setNewMix] = useState({
        iden: '', grade: 'M60', authority: 'RDSO', cement: '', ca1: '', ca2: '', fa: '', water: '', status: 'Pending for verification'
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchMixDesigns();
    }, []);

    const fetchMixDesigns = async () => {
        setLoading(true);
        try {
            const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
            const currentPlantId = selectedPlant ? selectedPlant.plantId : null;

            const data = await apiService.getMixDesigns();
            const filtered = currentPlantId
                ? data.filter(m => String(m.plantId) === String(currentPlantId))
                : data;
            const mappedData = filtered.map(m => ({
                id: m.id,
                iden: m.identification,
                grade: m.concreteGrade,
                authority: m.authorityOfApproval,
                cement: m.cement,
                ca1: m.ca1,
                ca2: m.ca2,
                fa: m.fa,
                water: m.water,
                status: (m.status === 'Pending' || m.status === 'NOT_STARTED' ? 'Pending for verification' : (m.status === 'Completed' || m.status === 'completed' || m.status === 'COMPLETED' || m.status === 'Locked' ? 'Verified & Locked' : (m.status || (m.updatedDate ? 'Verified & Locked' : 'Pending for verification'))))
            }));
            setMixDesigns(mappedData);
            setError(null);
        } catch (err) {
            setError('Failed to fetch mix designs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateAC = (m) => {
        const totalAgg = Number(m.ca1 || 0) + Number(m.ca2 || 0) + Number(m.fa || 0);
        const cement = Number(m.cement || 0);
        return cement > 0 ? (totalAgg / cement).toFixed(2) : '0.00';
    };

    const calculateWC = (m) => {
        const water = Number(m.water || 0);
        const cement = Number(m.cement || 0);
        return cement > 0 ? (water / cement).toFixed(2) : '0.00';
    };

    const handleAddMix = async () => {
        if (!newMix.iden) {
            alert('Please provide Identification');
            return;
        }

        const userId = sessionStorage.getItem('userId') || 0;
        const vendorCode = sessionStorage.getItem('vendorCode');
        const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
        const plantId = selectedPlant ? selectedPlant.plantId : '';

        const mixDto = {
            id: editingId,
            identification: newMix.iden,
            concreteGrade: newMix.grade,
            authorityOfApproval: newMix.authority,
            cement: parseFloat(newMix.cement) || 0,
            ca1: parseFloat(newMix.ca1) || 0,
            ca2: parseFloat(newMix.ca2) || 0,
            fa: parseFloat(newMix.fa) || 0,
            water: parseFloat(newMix.water) || 0,
            acRatio: parseFloat(calculateAC(newMix)),
            wcRatio: parseFloat(calculateWC(newMix)),
            vendorId: userId,
            vendorCode: vendorCode,
            createdBy: userId,
            updatedBy: editingId ? userId : null,
            plantId: plantId
        };

        try {
            setLoading(true);
            await apiService.saveMixDesign(mixDto);
            await fetchMixDesigns();
            setEditingId(null);
            setNewMix({
                iden: '', grade: 'M60', authority: 'RDSO', cement: '', ca1: '', ca2: '', fa: '', water: '', status: 'Pending for verification'
            });
            alert(editingId ? 'Mix design updated successfully' : 'Mix design added successfully');
        } catch (err) {
            alert(err.message || 'Error saving mix design');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (mix) => {
        if (mix.status === 'Verified & Locked' || mix.status === 'Locked') {
            alert('Verified & Locked entries cannot be edited.');
            return;
        }
        setNewMix(mix);
        setEditingId(mix.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id, status) => {
        if (status === 'Verified & Locked' || status === 'Locked') {
            alert('Verified & Locked entries cannot be deleted.');
            return;
        }
        if (window.confirm('Are you sure you want to delete this mix design?')) {
            try {
                setLoading(true);
                await apiService.deleteMixDesign(id);
                await fetchMixDesigns();
                alert('Mix design deleted successfully');
            } catch (err) {
                alert(err.message || 'Error deleting mix design');
            } finally {
                setLoading(false);
            }
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Verified & Locked':
            case 'Locked':
                return { background: '#ecfdf5', color: '#059669', border: '1px solid #10b981' };
            case 'Unlocked for Modification':
                return { background: '#fffbeb', color: '#d97706', border: '1px solid #f59e0b' };
            case 'Pending for verification':
            default:
                return { background: '#eff6ff', color: '#2563eb', border: '1px solid #3b82f6' };
        }
    };

    return (
        <div className="fade-in" style={{ position: 'relative' }}>
            {loading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.6)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="spinner">Loading...</div>
                </div>
            )}
            <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>Mix Design Declaration</h3>

            {/* Mix Design Form */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h4 style={{ color: '#42818c', marginTop: 0, marginBottom: '20px', fontSize: '14px' }}>{editingId ? 'Edit Mix Design' : 'Add New Mix Design'}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Identification</label>
                        <input
                            type="text"
                            placeholder="e.g. MIX-LC-01"
                            value={newMix.iden}
                            onChange={(e) => setNewMix({ ...newMix, iden: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Concrete Grade</label>
                        <select
                            value={newMix.grade}
                            onChange={(e) => setNewMix({ ...newMix, grade: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                            <option>M60</option>
                            <option>M55</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Authority of Approval</label>
                        <select
                            value={newMix.authority}
                            onChange={(e) => setNewMix({ ...newMix, authority: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="RDSO">RDSO</option>
                            <option value="Zonal Rly.">Zonal Rly.</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Cement (Kg/m³)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newMix.cement}
                            onChange={(e) => setNewMix({ ...newMix, cement: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>CA1 (Kg/m³)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newMix.ca1}
                            onChange={(e) => setNewMix({ ...newMix, ca1: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>CA2 (Kg/m³)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newMix.ca2}
                            onChange={(e) => setNewMix({ ...newMix, ca2: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>FA (Kg/m³)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newMix.fa}
                            onChange={(e) => setNewMix({ ...newMix, fa: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Water (Litres)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newMix.water}
                            onChange={(e) => setNewMix({ ...newMix, water: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>A/C (Auto)</label>
                        <div style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '700', color: '#42818c', fontSize: '13px' }}>
                            {calculateAC(newMix)}
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>W/C (Auto)</label>
                        <div style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '700', color: '#42818c', fontSize: '13px' }}>
                            {calculateWC(newMix)}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    {editingId && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setNewMix({ iden: '', grade: 'M60', authority: 'RDSO', cement: '', ca1: '', ca2: '', fa: '', water: '', status: 'Pending for verification' });
                            }}
                            style={{ background: '#cbd5e1', color: '#1e293b', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleAddMix}
                        style={{ background: '#42818c', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        {editingId ? 'Update Entry' : 'Add to List'}
                    </button>
                </div>
            </div>

            {/* Existing Mix Designs Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Identification</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Grade</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Authority</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Cement</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>CA1</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>CA2</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>FA</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Water</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>A/C</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>W/C</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mixDesigns.map(mix => (
                            <tr key={mix.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '500' }}>{mix.iden}</td>
                                <td style={{ padding: '12px 16px' }}><span style={{ padding: '2px 8px', background: '#f0f9fa', color: '#42818c', borderRadius: '4px', fontWeight: '600', fontSize: '11px' }}>{mix.grade}</span></td>
                                <td style={{ padding: '12px 16px' }}>{mix.authority}</td>
                                <td style={{ padding: '12px 16px' }}>{mix.cement}</td>
                                <td style={{ padding: '12px 16px' }}>{mix.ca1}</td>
                                <td style={{ padding: '12px 16px' }}>{mix.ca2}</td>
                                <td style={{ padding: '12px 16px' }}>{mix.fa}</td>
                                <td style={{ padding: '12px 16px' }}>{mix.water}</td>
                                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#42818c' }}>{calculateAC(mix)}</td>
                                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#42818c' }}>{calculateWC(mix)}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        ...getStatusStyle(mix.status)
                                    }}>
                                        {mix.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEdit(mix)}
                                            disabled={mix.status === 'Verified & Locked' || mix.status === 'Locked'}
                                            style={{
                                                padding: '4px 8px',
                                                background: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '4px',
                                                cursor: (mix.status === 'Verified & Locked' || mix.status === 'Locked') ? 'not-allowed' : 'pointer',
                                                color: '#64748b'
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(mix.id, mix.status)}
                                            disabled={mix.status === 'Verified & Locked' || mix.status === 'Locked'}
                                            style={{
                                                padding: '4px 8px',
                                                background: '#fef2f2',
                                                border: '1px solid #fee2e2',
                                                borderRadius: '4px',
                                                cursor: (mix.status === 'Verified & Locked' || mix.status === 'Locked') ? 'not-allowed' : 'pointer',
                                                color: '#ef4444'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MixDesignSection;
