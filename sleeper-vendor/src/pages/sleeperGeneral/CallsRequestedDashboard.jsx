import React, { useState } from 'react';

const CallsRequestedDashboard = ({ inspectionCalls }) => {
    const calls = inspectionCalls || [];

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '24px', fontWeight: '800' }}>Inspection Calls Requested</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Monitor status of your raised inspection calls</p>
                </div>
                <button style={{
                    background: '#42818c',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(66, 129, 140, 0.2)'
                }}>
                    + Raise New Call
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Call Details</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>PO Reference</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Inspection Stage</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Qty Offered</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calls.map((call, index) => (
                            <tr key={call.id} style={{ borderBottom: index === calls.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{call.callNo}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Raised: {call.date}</div>
                                </td>
                                <td style={{ padding: '20px', color: '#475569', fontSize: '14px' }}>{call.poNo}</td>
                                <td style={{ padding: '20px' }}>
                                    <span style={{
                                        background: '#ecf2ff',
                                        color: '#34495e',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}>
                                        {call.stage}
                                    </span>
                                </td>
                                <td style={{ padding: '20px', textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>
                                    {call.qty.toLocaleString()}
                                </td>
                                <td style={{ padding: '20px', textAlign: 'center' }}>
                                    <span style={{
                                        background: call.status === 'Pending' ? '#fff7ed' : call.status === 'Scheduled' ? '#eff6ff' : '#f0fdf4',
                                        color: call.status === 'Pending' ? '#9a3412' : call.status === 'Scheduled' ? '#1e40af' : '#166534',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}>
                                        {call.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CallsRequestedDashboard;
