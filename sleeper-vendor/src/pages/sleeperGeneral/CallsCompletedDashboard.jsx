import React, { useState } from 'react';

const CallsCompletedDashboard = ({ inspectionCalls }) => {
    const completedCalls = (inspectionCalls || []).filter(c => 
        c.status === 'Completed' || c.status === 'Verified' || c.status === 'Accepted'
    ).map(c => ({
        id: c.id,
        icNo: c.icNo || `IC-${c.callNo || c.id}`,
        callNo: c.callNo || 'N/A',
        date: c.callDate || 'N/A',
        qtyOffered: Number(c.qtyOffered) || 0,
        qtyAccepted: Number(c.qtyAccepted) || Number(c.qtyOffered) || 0,
        status: c.status || 'Completed'
    }));

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '24px', fontWeight: '800' }}>Verified & Locked Inspections</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>View inspection certificates and acceptance details</p>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                {completedCalls.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>No completed inspections found yet.</div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>Once your calls are verified by the IE, they will appear here.</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>IC Number</th>
                                <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Completion Date</th>
                                <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Offered / Accepted</th>
                                <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Result</th>
                                <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Certificate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completedCalls.map((call, index) => (
                                <tr key={call.id} style={{ borderBottom: index === completedCalls.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{call.icNo}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Ref: {call.callNo}</div>
                                    </td>
                                    <td style={{ padding: '20px', color: '#475569', fontSize: '14px' }}>{call.date}</td>
                                    <td style={{ padding: '20px', textAlign: 'right' }}>
                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{call.qtyAccepted.toLocaleString()}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>of {call.qtyOffered.toLocaleString()}</div>
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'center' }}>
                                        <span style={{
                                            background: (call.status === 'Accepted' || call.status === 'Completed') ? '#f0fdf4' : '#fefce8',
                                            color: (call.status === 'Accepted' || call.status === 'Completed') ? '#166534' : '#854d0e',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '700'
                                        }}>
                                            {call.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'center' }}>
                                        <button style={{
                                            background: '#f1f5f9',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            color: '#475569',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            📄 Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CallsCompletedDashboard;
