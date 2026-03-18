import React, { useState } from 'react';

const MasterUpdatingDashboard = () => {
    const [masters] = useState([
        { id: 1, type: 'Plant Unit', name: 'Sleeper Unit - 1', location: 'Industrial Area, Ph-II', status: 'Active' },
        { id: 2, type: 'Consignee', name: 'Northern Railway', location: 'New Delhi', status: 'Active' },
        { id: 3, type: 'Material Source', name: 'Cement Supplier X', location: 'Zonal Region', status: 'Verified & Locked' },
    ]);

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '24px', fontWeight: '800' }}>Master Data Management</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Update and maintain resource masters for your plant</p>
                </div>
                <button style={{
                    background: '#42818c',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                }}>
                    Update Master Request
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Master Type</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Entity Name</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Location/Details</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {masters.map((master, index) => (
                            <tr key={master.id} style={{ borderBottom: index === masters.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                <td style={{ padding: '20px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#42818c' }}>{master.type}</span>
                                </td>
                                <td style={{ padding: '20px', fontWeight: '700', color: '#1e293b' }}>{master.name}</td>
                                <td style={{ padding: '20px', color: '#64748b', fontSize: '14px' }}>{master.location}</td>
                                <td style={{ padding: '20px', textAlign: 'center' }}>
                                    <span style={{
                                        background: '#f0fdf4',
                                        color: '#166534',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}>
                                        {master.status}
                                    </span>
                                </td>
                                <td style={{ padding: '20px', textAlign: 'center' }}>
                                    <button style={{ background: 'none', border: 'none', color: '#42818c', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MasterUpdatingDashboard;
