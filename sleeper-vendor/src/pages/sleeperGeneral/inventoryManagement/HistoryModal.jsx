import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiService, BASE_URL } from '../../../services/api';

const HistoryModal = ({ entryId, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // If entryId has non-numeric prefix like USED-HTS-ID-1, extract it
                let backendId = entryId;
                if (typeof entryId === 'string' && entryId.includes('-ID-')) {
                    backendId = entryId.split('-ID-')[1];
                }
                
                // Fetch history
                const url = `${BASE_URL}/rm-consumption/${backendId}/history`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch history');
                
                const data = await response.json();
                setHistory(data.responseData || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (entryId) {
            fetchHistory();
        }
    }, [entryId]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    return createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '24px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10, borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Workflow History</h2>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '18px' }}>&times;</button>
                </div>
                
                <div style={{ padding: '24px' }}>
                    {loading && <div style={{ textAlign: 'center', color: '#64748b' }}>Loading history...</div>}
                    {error && <div style={{ textAlign: 'center', color: '#ef4444' }}>{error}</div>}
                    
                    {!loading && !error && history.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No history found for this entry.</div>
                    )}
                    
                    {!loading && !error && history.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {history.map((record, index) => (
                                <div key={index} style={{ display: 'flex', gap: '16px', borderLeft: '2px solid #e2e8f0', paddingLeft: '16px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-7px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: '#0284c7' }}></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: '700', color: '#1e293b' }}>{record.action || record.status}</span>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>{formatDate(record.createdDate)}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#475569' }}>
                                            <strong>By User ID:</strong> {record.createdBy || record.modifiedBy || '-'} <br/>
                                            {record.remarks && <><strong style={{ color: '#1e293b' }}>Remarks:</strong> {record.remarks}</>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default HistoryModal;
