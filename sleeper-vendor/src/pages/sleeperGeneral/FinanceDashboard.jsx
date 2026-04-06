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
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>💳</div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>No payment records found.</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Payment history and inspection charges will appear here after verification.</div>
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboard;
