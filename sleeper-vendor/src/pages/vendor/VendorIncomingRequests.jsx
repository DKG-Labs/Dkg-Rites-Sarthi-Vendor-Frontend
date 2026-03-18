import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

const VendorIncomingRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyModal, setHistoryModal] = useState({ open: false, data: [], loading: false, requestId: null });
    const navigate = useNavigate();

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const res = await apiService.getAllPendingWorkflowTransitions("Vendor");
            setRequests(res.responseData || []);
        } catch (error) {
            console.error("Failed to load vendor requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (row) => {
        navigate(`/vendor/edit/${row.moduleId}/${row.requestId}/${row.workflowTransitionId}`);
    };

    const handleShowHistory = async (requestId) => {
        setHistoryModal({ open: true, data: [], loading: true, requestId });
        try {
            const res = await apiService.getWorkflowHistory(requestId);
            setHistoryModal(prev => ({ ...prev, data: res.responseData || [], loading: false }));
        } catch (error) {
            console.error("Failed to load history:", error);
            setHistoryModal(prev => ({ ...prev, loading: false }));
        }
    };

    const getModuleName = (moduleId) => {
        const modules = {
            1: "Plant Profile",
            2: "Bench Mould Master",
            3: "Raw Material Source",
            4: "Mix Design",
            5: "HTS Wire",
            6: "Cement Inventory",
            7: "Admixture Receipt",
            8: "Aggregate Receipt",
            9: "SGCI Insert",
            10: "Dowel Receipt",
            11: "Production Declaration"
        };
        return modules[moduleId] || `Module ${moduleId}`;
    };

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>Requested Changes</h2>
                <button 
                    onClick={loadRequests}
                    style={{ 
                        padding: '8px 16px', 
                        background: '#f1f5f9', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading requests...</div>
            ) : requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                    No pending requests from IE.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>#</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Request ID</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Module</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Status</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Remarks</th>
                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((row, index) => (
                                <tr key={row.workflowTransitionId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '12px 16px' }}>{index + 1}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{row.requestId}</td>
                                    <td style={{ padding: '12px 16px' }}>{getModuleName(row.moduleId)}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '9999px', 
                                            fontSize: '12px', 
                                            fontWeight: '600',
                                            background: row.action === 'REQUEST_BACK' ? '#fef2f2' : (row.status === 'Completed' ? '#dcfce7' : '#fef9c3'),
                                            color: row.action === 'REQUEST_BACK' ? '#991b1b' : (row.status === 'Completed' ? '#166534' : '#854d0e')
                                        }}>
                                            {row.action === 'REQUEST_BACK' ? 'Return for modification' : (row.status === 'Pending' ? 'Pending for verification' : (row.status === 'Completed' ? 'Verified & Locked' : row.status))}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>{row.remarks || 'No remarks'}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => handleEdit(row)}
                                                style={{ 
                                                    padding: '6px 14px', 
                                                    background: '#2563eb', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                Edit & Resubmit
                                            </button>
                                            <button 
                                                onClick={() => handleShowHistory(row.requestId)}
                                                style={{ 
                                                    padding: '6px 14px', 
                                                    background: '#f1f5f9', 
                                                    color: '#475569', 
                                                    border: '1px solid #cbd5e1', 
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                History
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* History Modal */}
            {historyModal.open && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        width: '100%',
                        maxWidth: '800px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#1e293b' }}>Workflow History (Request ID: {historyModal.requestId})</h3>
                            <button 
                                onClick={() => setHistoryModal({ ...historyModal, open: false })}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
                            >
                                &times;
                            </button>
                        </div>
                        <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                            {historyModal.loading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>Fetching history...</div>
                            ) : historyModal.data.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No history available for this record.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                            <th style={{ padding: '12px', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Req ID</th>
                                            <th style={{ padding: '12px', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Action</th>
                                            <th style={{ padding: '12px', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Status</th>
                                            <th style={{ padding: '12px', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Date</th>
                                            <th style={{ padding: '12px', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyModal.data.map((h, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>{h.requestId}</td>
                                                <td style={{ padding: '12px', fontSize: '13px' }}>
                                                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{h.action}</span>
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '13px' }}>
                                                    <span style={{ 
                                                        padding: '2px 8px', 
                                                        borderRadius: '4px', 
                                                        background: h.status?.includes('REJECT') || h.status?.includes('BACK') || h.action === 'REQUEST_BACK' ? '#fef2f2' : (h.status === 'Completed' ? '#dcfce7' : '#f0f9ff'),
                                                        color: h.status?.includes('REJECT') || h.status?.includes('BACK') || h.action === 'REQUEST_BACK' ? '#991b1b' : (h.status === 'Completed' ? '#166534' : '#075985'),
                                                        fontWeight: '500'
                                                    }}>
                                                        {h.action === 'REQUEST_BACK' ? 'Return for modification' : h.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>
                                                    {new Date(h.createdDate).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px', fontSize: '13px', color: '#334155', maxWidth: '300px' }}>
                                                    {h.remarks || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
                            <button 
                                onClick={() => setHistoryModal({ ...historyModal, open: false })}
                                style={{ 
                                    padding: '8px 20px', 
                                    background: '#fff', 
                                    border: '1px solid #cbd5e1', 
                                    borderRadius: '8px', 
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    color: '#475569'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorIncomingRequests;
