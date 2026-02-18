import React, { useState } from 'react';
import InventoryForm from './InventoryForm';

const InventoryDetail = ({ material, onBack }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    const getMockEntries = (type) => {
        const common = { status: 'Unverified', date: '2026-02-12' };
        switch (type) {
            case 'cement':
                return [{
                    id: 'INV-CEM-101', ...common, qty: 50, details: {
                        consignmentNo: 'C-78923', cementType: 'OPC 53', mfgWeek: 5, mfgYear: 2026, manufacturer: 'Ultratech',
                        lotNo: 'L22', noOfBags: 1000, bagWeight: 50, mtcNo: 'MTC-99', age: 0.5
                    }
                }];
            case 'hts-wire':
                return [{
                    id: 'INV-HTS-202', ...common, status: 'Verified', qty: 25, details: {
                        grade: 'Class I', manufacturer: 'JSW', serialNumbers: 'C-1, C-2, C-3', relaxationDate: '2026-01-15'
                    }
                }];
            case 'aggregates':
                return [{
                    id: 'INV-AGG-303', ...common, qty: 120, details: {
                        type: 'CA1', source: 'Approved Source A', truckNo: 'RJ-14-GA-1234'
                    }
                }];
            default:
                return [{ id: 'INV-GEN-999', ...common, qty: 100, details: { manufacturer: 'Generic Vendor' } }];
        }
    };

    const [entries, setEntries] = useState(getMockEntries(material.id));

    const stats = {
        procured: entries.reduce((acc, curr) => acc + Number(curr.qty), 200),
        used: 43.5,
        balance: 156.5
    };

    const handleFormSubmit = (data) => {
        if (editingEntry) {
            setEntries(entries.map(e => e.id === editingEntry.id ? data : e));
        } else {
            setEntries([data, ...entries]);
        }
        setShowForm(false);
        setEditingEntry(null);
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    const handleVerify = (id) => {
        setEntries(entries.map(e => e.id === id ? { ...e, status: 'Verified' } : e));
    };

    const getColumns = () => {
        switch (material.id) {
            case 'cement':
                return [
                    'Date of Receipt', 'Consignment Number', 'Inventory ID (auto Generated)', 'Cement Type',
                    'Manufacturer Name', 'Manufacturing Week', 'Manufacturing Year', 'Lot No.',
                    'No. of Bags', 'Weight of Each Bag (Kg)', 'MTC No.', 'Age of cement (Months)', 'Total Qty Received (MT)'
                ];
            case 'hts-wire':
                return [
                    'Date of Receipt', 'Inventory ID (auto Generated)', 'Grade / Spec',
                    'Manufacturer Name', 'Serial Number of Coils (multiple entries)', 'Relaxation Test Pass Date', 'Total Qty Received (MT)'
                ];
            case 'aggregates':
                return [
                    'Date of Receipt', 'Type of Aggregate (CA1, CA2, Fine Aggregate)', 'Inventory ID (System Generated)',
                    'Source (as declared and approved by IE)', 'Truck No.', 'Quantity (MT)'
                ];
            default:
                return ['Data of Receipt', 'Inventory ID (auto Generated)', 'Grade / Spec', 'Manufacturer Name', 'Total Qty Received (Nos.)'];
        }
    };

    const renderRow = (entry) => {
        const tdStyle = { padding: '16px 24px', color: '#1e293b', fontSize: '13px', whiteSpace: 'nowrap' };
        switch (material.id) {
            case 'cement':
                return (
                    <>
                        <td style={tdStyle}>{entry.date}</td>
                        <td style={tdStyle}>{entry.details.consignmentNo}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{entry.id}</td>
                        <td style={tdStyle}>{entry.details.cementType}</td>
                        <td style={tdStyle}>{entry.details.manufacturer}</td>
                        <td style={tdStyle}>{entry.details.mfgWeek}</td>
                        <td style={tdStyle}>{entry.details.mfgYear}</td>
                        <td style={tdStyle}>{entry.details.lotNo}</td>
                        <td style={tdStyle}>{entry.details.noOfBags}</td>
                        <td style={tdStyle}>{entry.details.bagWeight}</td>
                        <td style={tdStyle}>{entry.details.mtcNo}</td>
                        <td style={tdStyle}>{entry.details.age || '0'}</td>
                        <td style={{ ...tdStyle, fontWeight: '700' }}>{entry.qty}</td>
                    </>
                );
            case 'hts-wire':
                return (
                    <>
                        <td style={tdStyle}>{entry.date}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{entry.id}</td>
                        <td style={tdStyle}>{entry.details.grade}</td>
                        <td style={tdStyle}>{entry.details.manufacturer}</td>
                        <td style={tdStyle}>{entry.details.serialNumbers}</td>
                        <td style={tdStyle}>{entry.details.relaxationDate}</td>
                        <td style={{ ...tdStyle, fontWeight: '700' }}>{entry.qty}</td>
                    </>
                );
            case 'aggregates':
                return (
                    <>
                        <td style={tdStyle}>{entry.date}</td>
                        <td style={tdStyle}>{entry.details.type}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{entry.id}</td>
                        <td style={tdStyle}>{entry.details.source}</td>
                        <td style={tdStyle}>{entry.details.truckNo}</td>
                        <td style={{ ...tdStyle, fontWeight: '700' }}>{entry.qty}</td>
                    </>
                );
            default:
                return (
                    <>
                        <td style={tdStyle}>{entry.date}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{entry.id}</td>
                        <td style={tdStyle}>{entry.details.grade}</td>
                        <td style={tdStyle}>{entry.details.manufacturer}</td>
                        <td style={{ ...tdStyle, fontWeight: '700' }}>{entry.qty}</td>
                    </>
                );
        }
    };

    return (
        <div className="inventory-detail fade-in">
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={onBack} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#64748b' }}>
                    ← Back
                </button>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {material.icon}
                </div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{material.name} Management</h2>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Cumulative Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {[{ label: 'Procured', value: stats.procured, color: '#42818c' }, { label: 'Used', value: stats.used, color: '#64748b' }, { label: 'Balance', value: stats.balance, color: '#10b981' }].map(stat => (
                    <div key={stat.label} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: `1px solid #e2e8f0`, textAlign: 'left', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ fontSize: '12px', color: stat.color, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{stat.value} <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{material.unit}</span></div>
                    </div>
                ))}
            </div>

            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>List of Inventory Entered</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>View and manage record entries for {material.name}</p>
                    </div>
                    <button onClick={() => { setEditingEntry(null); setShowForm(true); }} style={{ background: '#42818c', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(66, 129, 140, 0.2)' }}>
                        + Add Entry
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                                {getColumns().map(col => (<th key={col} style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{col}</th>))}
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', width: 'fit-content', background: entry.status === 'Verified' ? '#f0fdf4' : '#fff1f2', color: entry.status === 'Verified' ? '#16a34a' : '#e11d48', border: `1px solid ${entry.status === 'Verified' ? '#dcfce7' : '#ffe4e6'}` }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>{entry.status}
                                        </div>
                                    </td>
                                    {renderRow(entry)}
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {entry.status === 'Unverified' ? (
                                                <><button onClick={() => handleVerify(entry.id)} style={{ background: '#42818c10', border: '1px solid #42818c30', color: '#42818c', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>Verify</button>
                                                    <button onClick={() => handleEdit(entry)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                                                    <button onClick={() => handleDelete(entry.id)} style={{ background: '#fff1f2', border: '1px solid #ffe4e6', color: '#e11d48', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>Delete</button></>
                                            ) : (<div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '11px', fontWeight: '600' }}>🔒 Locked</div>)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && <InventoryForm material={material} onClose={() => { setShowForm(false); setEditingEntry(null); }} onSubmit={handleFormSubmit} initialData={editingEntry} />}
        </div>
    );
};

export default InventoryDetail;
