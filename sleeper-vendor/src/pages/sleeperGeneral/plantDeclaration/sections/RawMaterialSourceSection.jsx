import React, { useState } from 'react';

const RawMaterialSourceSection = () => {
    const materialTypes = [
        'Cement', 'HTS Wire', 'Dowel', 'SGCI Insert',
        'Aggregates - CA1', 'Aggregates - CA2', 'Aggregates - FA',
        'Admixtures', 'Water Source'
    ];

    const [entries, setEntries] = useState([
        {
            id: 1,
            rawMaterialType: 'Cement',
            source: 'ACC Limited, Wadi',
            approvalReference: 'RITES/QA/2023/123',
            validityFrom: '2024-01-01',
            validityTo: '2024-12-31',
            status: 'Verified & Locked'
        },
        {
            id: 2,
            rawMaterialType: 'HTS Wire',
            source: 'Tata Steel, Jamshedpur',
            approvalReference: 'RDSO/2023/CIVIL/045',
            validityFrom: '2024-02-15',
            validityTo: '2025-02-14',
            status: 'Verification Pending'
        },
        {
            id: 3,
            rawMaterialType: 'Admixtures',
            source: 'Sika India, Mumbai',
            approvalReference: 'RITES/QA/AD/2023/089',
            validityFrom: '2024-03-01',
            validityTo: '2025-02-28',
            status: 'Unlocked for Modification'
        }
    ]);

    const initialFormState = {
        rawMaterialType: '',
        source: '',
        approvalReference: '',
        validityFrom: '',
        validityTo: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            setEntries(entries.map(entry =>
                entry.id === editingId
                    ? { ...formData, id: editingId, status: 'Verification Pending' }
                    : entry
            ));
            setEditingId(null);
        } else {
            const newEntry = {
                ...formData,
                id: Date.now(),
                status: 'Verification Pending'
            };
            setEntries([...entries, newEntry]);
        }
        setFormData(initialFormState);
    };

    const handleEdit = (entry) => {
        if (entry.status === 'Verified & Locked') return;
        setFormData({
            rawMaterialType: entry.rawMaterialType,
            source: entry.source,
            approvalReference: entry.approvalReference,
            validityFrom: entry.validityFrom,
            validityTo: entry.validityTo
        });
        setEditingId(entry.id);
    };

    const handleDelete = (id, status) => {
        if (status === 'Verified & Locked') return;
        setEntries(entries.filter(entry => entry.id !== id));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Verified & Locked': return '#10b981';
            case 'Verification Pending': return '#f59e0b';
            case 'Unlocked for Modification': return '#3b82f6';
            default: return '#64748b';
        }
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <h3 style={{ color: '#1e293b', marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
                Raw Material Source Declaration
            </h3>

            {/* Form Section */}
            <div style={{
                background: '#ffffff',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                marginBottom: '32px'
            }}>
                <h4 style={{
                    margin: '0 0 30px 0',
                    color: '#3e4c59',
                    fontSize: '18px',
                    fontWeight: '700'
                }}>
                    {editingId ? 'Modify Entry' : 'Add New Raw Material Source'}
                </h4>
                <form onSubmit={handleSubmit}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: formData.rawMaterialType === 'Water Source' ? '1fr 1fr 1fr' : '1fr 1fr 1fr 1fr',
                        gap: '24px',
                        marginBottom: '30px'
                    }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8c9fb1', marginBottom: '12px' }}>Raw Material Type</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    name="rawMaterialType"
                                    value={formData.rawMaterialType}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        height: '48px',
                                        padding: '0 40px 0 16px',
                                        borderRadius: '12px',
                                        border: '1px solid #ebf0f5',
                                        backgroundColor: '#fdfdfd',
                                        fontSize: '14px',
                                        color: '#3e4c59',
                                        outline: 'none',
                                        appearance: 'none',
                                        cursor: 'pointer',
                                        lineHeight: '48px'
                                    }}
                                >
                                    <option value="">Select Material</option>
                                    {materialTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <div style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: '#8c9fb1',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8c9fb1', marginBottom: '12px' }}>Source / Supplier</label>
                            <input
                                name="source"
                                type="text"
                                placeholder="Enter supplier name"
                                value={formData.source}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #ebf0f5',
                                    backgroundColor: '#fdfdfd',
                                    fontSize: '14px',
                                    color: '#3e4c59',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8c9fb1', marginBottom: '12px' }}>Approval Reference</label>
                            <input
                                name="approvalReference"
                                type="text"
                                placeholder="RDSO/RITES Reference"
                                value={formData.approvalReference}
                                onChange={handleInputChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #ebf0f5',
                                    backgroundColor: '#fdfdfd',
                                    fontSize: '14px',
                                    color: '#3e4c59',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        {formData.rawMaterialType !== 'Water Source' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8c9fb1', marginBottom: '12px' }}>Validity Period</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        name="validityFrom"
                                        type="date"
                                        value={formData.validityFrom}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '14px 12px',
                                            borderRadius: '12px',
                                            border: '1px solid #ebf0f5',
                                            backgroundColor: '#fdfdfd',
                                            fontSize: '14px',
                                            color: '#3e4c59',
                                            outline: 'none'
                                        }}
                                    />
                                    <input
                                        name="validityTo"
                                        type="date"
                                        value={formData.validityTo}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '14px 12px',
                                            borderRadius: '12px',
                                            border: '1px solid #ebf0f5',
                                            backgroundColor: '#fdfdfd',
                                            fontSize: '14px',
                                            color: '#3e4c59',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" style={{
                            background: '#47848d',
                            color: 'white',
                            border: 'none',
                            padding: '14px 44px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px rgba(71, 132, 141, 0.1)'
                        }}>
                            {editingId ? 'Update Entry' : 'Add Entry'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => { setEditingId(null); setFormData(initialFormState); }}
                                style={{
                                    padding: '14px 32px',
                                    borderRadius: '12px',
                                    border: '1px solid #ebf0f5',
                                    background: '#fff',
                                    color: '#8c9fb1',
                                    fontWeight: '600',
                                    fontSize: '15px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List Section */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Raw Material</th>
                            <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Source/Supplier</th>
                            <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Approval Ref.</th>
                            <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Validity</th>
                            <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Status</th>
                            <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No entries found. Add a source above.</td>
                            </tr>
                        ) : (
                            entries.map((entry) => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{entry.rawMaterialType}</td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{entry.source}</td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{entry.approvalReference}</td>
                                    <td style={{ padding: '16px', fontSize: '13px', color: '#475569' }}>
                                        {entry.rawMaterialType === 'Water Source'
                                            ? <span style={{ color: '#94a3b8' }}>—</span>
                                            : <>{entry.validityFrom} <span style={{ color: '#94a3b8' }}>to</span> {entry.validityTo}</>}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            backgroundColor: getStatusColor(entry.status) + '15',
                                            color: getStatusColor(entry.status),
                                            border: `1px solid ${getStatusColor(entry.status)}30`
                                        }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getStatusColor(entry.status), marginRight: '6px' }}></div>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                disabled={entry.status === 'Verified & Locked'}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: entry.status === 'Verified & Locked' ? 'not-allowed' : 'pointer',
                                                    background: entry.status === 'Verified & Locked' ? '#f1f5f9' : '#fff',
                                                    color: entry.status === 'Verified & Locked' ? '#94a3b8' : '#42818c',
                                                    border: `1px solid ${entry.status === 'Verified & Locked' ? '#e2e8f0' : '#42818c'}`,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Modify
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.id, entry.status)}
                                                disabled={entry.status === 'Verified & Locked'}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: entry.status === 'Verified & Locked' ? 'not-allowed' : 'pointer',
                                                    background: entry.status === 'Verified & Locked' ? '#f1f5f9' : '#fff',
                                                    color: entry.status === 'Verified & Locked' ? '#94a3b8' : '#ef4444',
                                                    border: `1px solid ${entry.status === 'Verified & Locked' ? '#e2e8f0' : '#ef4444'}`,
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

            <div style={{ marginTop: '24px', textAlign: 'right', color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                * New entries are set to 'Verification Pending' by default. Locked entries cannot be modified or deleted.
            </div>
        </div>
    );
};

export default RawMaterialSourceSection;
