import React, { useState, useEffect } from 'react';
import { apiService } from '../../../../services/api';

const STATUSES = {
    PENDING: 'Pending for verification',
    LOCKED: 'Verified & Locked',
    UNLOCKED: 'Unlocked for Modification'
};

const PlantProfileSection = ({ profiles, setProfiles, refreshProfiles }) => {


    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [plantDetails, setPlantDetails] = useState([]);
    const vendorCode = sessionStorage.getItem('vendorCode') || '';
    const [formData, setFormData] = useState({
        type: 'Stress Bench',
        shedsLines: ''
    });


    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await apiService.getPlantDetails(vendorCode);
                if (response && response.responseData) {
                    setPlantDetails(response.responseData);
                }
            } catch (err) {
                console.error('Error fetching plant details:', err);
            }
        };
        fetchDetails();
    }, [vendorCode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'shedsLines' && value < 0) return;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.shedsLines || parseInt(formData.shedsLines) < 0) {
            alert('Please enter a valid non-negative number of sheds/gangs');
            return;
        }

        const userId = sessionStorage.getItem('userId') || 0;
        const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
        const plantId = selectedPlant ? selectedPlant.plantId : '';

        const plantDto = {
            id: editingId,
            plantNameLocation: 'M/s ABC Sleepers - Nagpur Plant',
            vendorCode: vendorCode,
            plantType: formData.type,
            numberOfSheds: parseInt(formData.shedsLines),
            vendorId: userId,
            createdBy: userId,
            updatedBy: editingId ? userId : null,
            plantId: plantId
        };

        try {
            setLoading(true);
            await apiService.savePlantProfile(plantDto);
            if (refreshProfiles) await refreshProfiles();
            setEditingId(null);
            setFormData({ type: 'Stress Bench', shedsLines: '' });
            alert(editingId ? 'Profile updated successfully' : 'Profile added successfully');
        } catch (err) {
            alert(err.message || 'Error saving plant profile');
        } finally {
            setLoading(false);
        }
    };

    const handleModify = (profile) => {
        if (profile.status === STATUSES.LOCKED) return;
        setEditingId(profile.id);
        setFormData({
            type: profile.type,
            shedsLines: profile.shedsLines
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id, status) => {
        if (status === STATUSES.LOCKED) return;
        if (window.confirm('Are you sure you want to delete this profile?')) {
            try {
                setLoading(true);
                await apiService.deletePlantProfile(id);
                if (refreshProfiles) await refreshProfiles();
                alert('Profile deleted successfully');
            } catch (err) {
                alert(err.message || 'Error deleting plant profile');
            } finally {
                setLoading(false);
            }
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case STATUSES.LOCKED: return { color: '#059669', background: '#ecfdf5', border: '1px solid #10b981' };
            case STATUSES.UNLOCKED: return { color: '#b45309', background: '#fffbeb', border: '1px solid #f59e0b' };
            default: return { color: '#2563eb', background: '#eff6ff', border: '1px solid #3b82f6' };
        }
    };

    return (
        <div className="fade-in" style={{ position: 'relative' }}>
            {loading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.6)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="spinner">Loading...</div>
                </div>
            )}
            <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>Plant Profile Declaration</h3>

            {/* Form Section - Always visible to maintain layout */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <>
                    <h4 style={{ marginTop: 0, marginBottom: '20px', color: '#475569', fontSize: '14px', borderLeft: '4px solid #42818c', paddingLeft: '12px' }}>
                        {editingId ? 'Modify Plant Profile' : 'Add New Plant Profile'}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Plant Name & Location</label>
                            <input type="text" disabled value="M/s ABC Sleepers - Nagpur Plant" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Vendor Code</label>
                            <input type="text" disabled value={vendorCode} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Type of Plant</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                            >
                                <option value="Stress Bench">Stress Bench</option>
                                <option value="Longline">Longline</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                {formData.type === 'Stress Bench' ? 'Number of Sheds' : 'Number of Lines'}
                            </label>
                            <input
                                type="number"
                                name="shedsLines"
                                min="0"
                                value={formData.shedsLines}
                                onChange={handleInputChange}
                                placeholder={`Enter number of ${formData.type === 'Stress Bench' ? 'sheds' : 'lines'}`}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleSave(); }}
                            style={{ background: '#42818c', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            {editingId ? 'Update Profile' : 'Add Profile'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); setEditingId(null); setFormData({ type: 'Stress Bench', shedsLines: '' }); }}
                                style={{ background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </>
            </div>

            {/* List Section */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 style={{ margin: 0, color: '#475569', fontSize: '14px' }}>Added Plant Profiles ({profiles.length})</h4>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plant Type</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capacity / Units</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
                                        No profiles added yet. Please use the form above.
                                    </td>
                                </tr>
                            ) : (
                                profiles.map(profile => (
                                    <tr key={profile.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b' }}>{profile.type}</td>
                                        <td style={{ padding: '16px', color: '#475569' }}>
                                            {profile.shedsLines} {profile.type === 'Stress Bench' ? 'Sheds' : 'Lines'}
                                            {profile.shedsLines > 0 && (
                                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                                    {Array.from({ length: parseInt(profile.shedsLines) }, (_, i) =>
                                                        profile.type === 'Stress Bench' ? `Shed ${i + 1}` : `Line ${i + 1}`
                                                    ).join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                ...getStatusStyle(profile.status)
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', marginRight: '8px' }}></span>
                                                {profile.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    disabled={profile.status === STATUSES.LOCKED}
                                                    onClick={(e) => { e.preventDefault(); handleModify(profile); }}
                                                    style={{
                                                        padding: '6px 14px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #cbd5e1',
                                                        background: profile.status === STATUSES.LOCKED ? '#f8fafc' : '#fff',
                                                        cursor: profile.status === STATUSES.LOCKED ? 'not-allowed' : 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        color: profile.status === STATUSES.LOCKED ? '#cbd5e1' : '#475569',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Modify
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={profile.status === STATUSES.LOCKED}
                                                    onClick={(e) => { e.preventDefault(); handleDelete(profile.id, profile.status); }}
                                                    style={{
                                                        padding: '6px 14px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #fee2e2',
                                                        background: profile.status === STATUSES.LOCKED ? '#f8fafc' : '#fef2f2',
                                                        cursor: profile.status === STATUSES.LOCKED ? 'not-allowed' : 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        color: profile.status === STATUSES.LOCKED ? '#cbd5e1' : '#ef4444',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {profiles.some(p => p.status === STATUSES.LOCKED) && (
                    <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        <strong>Note:</strong> Verified & Locked entries cannot be modified. Contact your IE for unlocking if changes are required.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlantProfileSection;
