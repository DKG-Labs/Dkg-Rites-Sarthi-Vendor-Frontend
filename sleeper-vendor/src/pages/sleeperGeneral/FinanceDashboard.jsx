import React, { useState } from 'react';

const FinanceDashboard = () => {
    const [payments] = useState([
        { id: 1, callNo: 'IC/SLP/2026/001', type: 'Inspection', amount: 150000, date: '2026-01-22', status: 'Approved', ref: 'TXN-908756' },
        { id: 2, callNo: 'IC/SLP/2026/002', type: 'Cancellation', amount: 25000, date: '2026-01-28', status: 'Pending for verification', ref: 'TXN-909812' },
        { id: 3, callNo: 'IC/SLP/2026/003', type: 'Inspection', amount: 120000, date: '2026-02-08', status: 'Under Verification', ref: 'TXN-910243' },
    ]);

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '24px', fontWeight: '800' }}>Finance & Payments</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Track inspection charges and payment approvals</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ textAlign: 'right', padding: '12px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Total Paid</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>₹ 2,70,000</div>
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Transaction Details</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Reference</th>
                            <th style={{ padding: '20px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment, index) => (
                            <tr key={payment.id} style={{ borderBottom: index === payments.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{payment.callNo}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Date: {payment.date}</div>
                                </td>
                                <td style={{ padding: '20px' }}>
                                    <span style={{ fontSize: '14px', color: '#475569' }}>{payment.type}</span>
                                </td>
                                <td style={{ padding: '20px', textAlign: 'right' }}>
                                    <div style={{ fontWeight: '800', color: '#1e293b' }}>₹ {payment.amount.toLocaleString()}</div>
                                </td>
                                <td style={{ padding: '20px', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
                                    {payment.ref}
                                </td>
                                <td style={{ padding: '20px', textAlign: 'center' }}>
                                    <span style={{
                                        background: payment.status === 'Approved' ? '#f0fdf4' : payment.status === 'Pending for verification' ? '#fff1f2' : '#f0f9ff',
                                        color: payment.status === 'Approved' ? '#166534' : payment.status === 'Pending for verification' ? '#9f1239' : '#0369a1',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}>
                                        {payment.status}
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

export default FinanceDashboard;
