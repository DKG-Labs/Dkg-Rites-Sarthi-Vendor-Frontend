import React from 'react';
import { isEditable } from './inventoryUtils';

const InventoryTable = ({ entries, columns, onEdit, onDelete }) => {
    if (!entries || entries.length === 0) {
        return (
            <div style={{
                textAlign: 'center', padding: '40px 24px',
                background: '#fafafa', borderRadius: '12px',
                border: '1px dashed var(--border-color)', color: 'var(--text-muted)'
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                <div style={{ fontWeight: '600', fontSize: 'var(--fs-sm)' }}>No entries yet</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>Click "Add New Entry" to log your first receipt.</div>
            </div>
        );
    }

    const getStatusStyle = (status) => {
        if (status === 'Verified and Locked') return { background: '#dcfce7', color: '#166534' };
        if (status === 'Pending for Verification') return { background: '#fef9c3', color: '#854d0e' };
        return { background: '#dbeafe', color: '#1e40af' };
    };

    return (
        <div className="table-container">
            <table style={{ minWidth: '700px' }}>
                <thead>
                    <tr>
                        <th style={{ width: '40px', paddingLeft: '16px' }}>#</th>
                        {columns.map(col => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                        <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.filter(e => e.status !== 'Deleted').map((entry, idx) => (
                        <tr key={entry.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                            <td style={{ paddingLeft: '16px', color: 'var(--text-muted)', fontSize: '11px' }}>{idx + 1}</td>
                            {columns.map(col => (
                                <td key={col.key}>
                                    {col.isStatus ? (
                                        <span style={{
                                            ...getStatusStyle(entry[col.key]),
                                            padding: '3px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {entry[col.key]}
                                        </span>
                                    ) : col.numeric ? (
                                        <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>
                                            {(parseFloat(entry[col.key]) || 0).toFixed(2)}
                                        </span>
                                    ) : (
                                        <span style={{ color: col.key === 'invoiceNumber' ? 'var(--text-main)' : undefined, fontWeight: col.key === 'type' ? '600' : undefined }}>
                                            {entry[col.key] || '—'}
                                        </span>
                                    )}
                                </td>
                            ))}
                            <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                                {isEditable(entry) ? (
                                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                                        <button
                                            onClick={() => onEdit(entry)}
                                            style={{
                                                background: '#eff6ff', color: '#1d4ed8', border: 'none',
                                                borderRadius: '6px', padding: '4px 10px', fontSize: '11px',
                                                fontWeight: '600', cursor: 'pointer'
                                            }}>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this entry?')) onDelete(entry.id);
                                            }}
                                            style={{
                                                background: '#fef2f2', color: '#dc2626', border: 'none',
                                                borderRadius: '6px', padding: '4px 10px', fontSize: '11px',
                                                fontWeight: '600', cursor: 'pointer'
                                            }}>
                                            Delete
                                        </button>
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                                        🔒 Locked
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryTable;
