import React, { useState, useEffect } from 'react';
import InventoryForm from './InventoryForm';
import { apiService } from '../../../services/api';

const InventoryDetail = ({ material, onBack }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
            const currentPlantId = selectedPlant ? selectedPlant.plantId : null;

            const filterByPlant = (items) => {
                if (!currentPlantId || !Array.isArray(items)) return items || [];
                return items.filter(item => String(item.plantId) === String(currentPlantId));
            };

            let data = [];
            if (material.id === 'hts-wire') {
                data = filterByPlant(await apiService.getHtsWires());
            } else if (material.id === 'cement') {
                data = filterByPlant(await apiService.getCements());
            } else if (material.id === 'dowel') {
                data = filterByPlant(await apiService.getDowels());
            } else if (material.id === 'aggregates') {
                data = filterByPlant(await apiService.getAggregates());
            } else if (material.id === 'admixture') {
                data = filterByPlant(await apiService.getAdmixtures());
            } else if (material.id === 'sgci-insert') {
                data = filterByPlant(await apiService.getSgciInserts());
            } else {
                data = getMockEntries(material.id);
            }
            setEntries(data || []);
        } catch (error) {
            console.error('Fetch error:', error);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [material.id]);

    const getMockEntries = (type) => {
        const common = { status: 'Pending for verification', dateOfReceipt: '2026-02-12' };
        switch (type) {
            case 'aggregates':
                return [{
                    id: 'INV-AGG-303', ...common, totalQtyReceived: 1200, details: {
                        type: 'CA1', source: 'Approved Source A', challanNo: 'CH-45678', challanDate: '2026-02-11'
                    }
                }];
            case 'sgci-insert':
                return [{
                    id: 'INV-SGCI-404', ...common, totalQtyReceived: 5000, details: {
                        grade: 'T-6901', manufacturer: 'Adianth', ewayBillNo: 'EW-8821', ewayDate: '2026-02-12', icNo: 'IC-882', icDate: '2026-02-10'
                    }
                }];
            case 'dowel':
                return [{
                    id: 'INV-DWL-404', ...common, totalQtyReceived: 3200, details: {
                        grade: 'Type A', manufacturer: 'Manufacturer 1', ewayBillNo: 'EW-9921', ewayDate: '2026-02-12', icNo: 'IC-992', icDate: '2026-02-10'
                    }
                }];
            case 'admixture':
                return [{
                    id: 'INV-ADX-505', ...common, totalQtyReceived: 450, details: {
                        manufacturer: 'FOSROC', ewayBillNo: 'EW-12345', ewayDate: '2026-02-10', lotNo: 'L-99', mtcNo: 'MTC-101', grade: 'Type 1'
                    }
                }];
            default:
                return [];
        }
    };

    const stats = {
        procured: entries.reduce((acc, curr) => acc + Number(curr.totalQtyReceived || curr.totalQuantity || curr.qty || 0), 0),
        used: material.id === 'hts-wire' ? 43.5 : (material.id === 'cement' ? 150 : 0),
        get balance() { return this.procured - this.used; }
    };

    const handleFormSubmit = () => {
        setShowForm(false);
        setEditingEntry(null);
        fetchEntries();
    };

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                if (material.id === 'hts-wire') {
                    await apiService.deleteHtsWire(id);
                } else if (material.id === 'cement') {
                    await apiService.deleteCement(id);
                } else if (material.id === 'dowel') {
                    await apiService.deleteDowel(id);
                } else if (material.id === 'aggregates') {
                    await apiService.deleteAggregate(id);
                } else if (material.id === 'admixture') {
                    await apiService.deleteAdmixture(id);
                } else if (material.id === 'sgci-insert') {
                    await apiService.deleteSgciInsert(id);
                }
                await fetchEntries();
            } catch (error) {
                alert('Delete failed: ' + error.message);
            }
        }
    };

    const getStatusLabel = (status) => {
        if (!status || status === 'Created') return 'Pending for verification';
        if (status === 'Pending') return 'Pending for verification';
        if (status === 'Completed' || status === 'Locked') return 'Verified & Locked';
        return status;
    };

    const getColumns = () => {
        switch (material.id) {
            case 'cement':
                return [
                    'Date of Receipt', 'Grade/Spec', 'Manufacturer', 'Invoice No.',
                    'Total Quantity (Kg)', 'Batch Numbers', 'Status'
                ];
            case 'hts-wire':
                return [
                    'Date of Receipt', 'Grade/Spec', 'Manufacturer', 'Invoice No.', 'Total Quantity (Kg)', 'Coil Details', 'Status'
                ];
            case 'dowel':
                return [
                    'Date of Receipt', 'Grade/Type', 'Manufacturer', 'Invoice No.', 'Total Quantity (Nos.)', 'RITES IC No.', 'Status'
                ];
            case 'aggregates':
                return [
                    'Date of Receipt', 'Grade/Spec', 'Source', 'Challan No.', 'Total Quantity (Kg)', 'Status'
                ];
            case 'admixture':
                return [
                    'Date of Receipt', 'Grade/Spec', 'Manufacturer', 'Total Quantity (Kg)', 'Lot/MTC No.', 'Status'
                ];
            case 'sgci-insert':
                return [
                    'Date of Receipt', 'Type of Insert', 'Manufacturer', 'Invoice No.', 'Total Qty Received (Nos.)', 'RITES IC No.', 'Status'
                ];
            default:
                return ['Date of Receipt', 'Grade/Spec', 'Manufacturer', 'Quantity', 'Status'];
        }
    };

    const renderRow = (entry) => {
        const tdStyle = { padding: '16px 24px', color: '#1e293b', fontSize: '13px', whiteSpace: 'nowrap' };
        const boldStyle = { ...tdStyle, fontWeight: '700' };

        switch (material.id) {
            case 'cement':
                return (
                    <>
                        <td style={tdStyle}>{entry.dateOfReceipt}</td>
                        <td style={tdStyle}>{entry.gradeSpec}</td>
                        <td style={tdStyle}>{entry.manufacturer}</td>
                        <td style={tdStyle}>{entry.invoiceNumber}</td>
                        <td style={boldStyle}>{entry.totalQtyReceived} <span style={{ fontSize: '11px', color: '#64748b' }}>Kg</span></td>
                        <td style={tdStyle}>
                            {entry.batchDetails?.map(b => `${b.mtcNo} (W${b.weekNo})`).join(', ') || '-'}
                        </td>
                        <td style={tdStyle}>
                            <span style={{ background: '#f0f9fa', color: '#42818c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                {getStatusLabel(entry.status)}
                            </span>
                        </td>
                    </>
                );
            case 'hts-wire': {
                const coilSummary = entry.coilDetails?.map(e =>
                    e.entryType === 'RANGE'
                        ? `C${e.coilFrom}-C${e.coilTo}`
                        : (e.coilNo || `Lot ${e.lotNo}`)
                ).join(', ') || '-';
                return (
                    <>
                        <td style={tdStyle}>{entry.dateOfReceipt}</td>
                        <td style={tdStyle}>{entry.gradeSpec}</td>
                        <td style={tdStyle}>{entry.manufacturer}</td>
                        <td style={tdStyle}>{entry.invoiceNumber}</td>
                        <td style={boldStyle}>{entry.totalQtyReceived} <span style={{ fontSize: '11px', color: '#64748b' }}>Kg</span></td>
                        <td style={{ ...tdStyle, maxWidth: '220px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {coilSummary}
                        </td>
                        <td style={tdStyle}>
                            <span style={{ background: '#f0f9fa', color: '#42818c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                {getStatusLabel(entry.status)}
                            </span>
                        </td>
                    </>
                );
            }
            case 'dowel':
                return (
                    <>
                        <td style={tdStyle}>{entry.dateOfReceipt}</td>
                        <td style={tdStyle}>{entry.gradeType}</td>
                        <td style={tdStyle}>{entry.manufacturer}</td>
                        <td style={tdStyle}>{entry.invoiceNumber}</td>
                        <td style={boldStyle}>{entry.totalQtyReceived} <span style={{ fontSize: '11px', color: '#64748b' }}>Nos.</span></td>
                        <td style={tdStyle}>{entry.ritesIcNumber}</td>
                        <td style={tdStyle}>
                            <span style={{ background: '#f0f9fa', color: '#42818c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                {getStatusLabel(entry.status)}
                            </span>
                        </td>
                    </>
                );
            case 'aggregates':
                return (
                    <>
                        <td style={tdStyle}>{entry.dateOfReceipt}</td>
                        <td style={tdStyle}>{entry.gradeSpec}</td>
                        <td style={tdStyle}>{entry.source}</td>
                        <td style={tdStyle}>{entry.challanNumber}</td>
                        <td style={boldStyle}>{entry.totalQtyReceived} <span style={{ fontSize: '11px', color: '#64748b' }}>Kg</span></td>
                        <td style={tdStyle}>
                            <span style={{ background: '#f0f9fa', color: '#42818c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                {getStatusLabel(entry.status)}
                            </span>
                        </td>
                    </>
                );
            case 'admixture':
                return (
                    <>
                        <td style={tdStyle}>{entry.dateOfReceipt}</td>
                        <td style={tdStyle}>{entry.gradeSpec}</td>
                        <td style={tdStyle}>{entry.manufacturer}</td>
                        <td style={boldStyle}>{entry.totalQuantity} <span style={{ fontSize: '11px', color: '#64748b' }}>Kg</span></td>
                        <td style={tdStyle}>{entry.lotNo} / {entry.mtcNo}</td>
                        <td style={tdStyle}>
                            <span style={{ background: '#f0f9fa', color: '#42818c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                {getStatusLabel(entry.status)}
                            </span>
                        </td>
                    </>
                );
            case 'sgci-insert':
                return (
                    <>
                        <td style={tdStyle}>{entry.dateOfReceipt}</td>
                        <td style={tdStyle}>{entry.gradeType}</td>
                        <td style={tdStyle}>{entry.manufacturer}</td>
                        <td style={tdStyle}>{entry.invoiceNumber}</td>
                        <td style={boldStyle}>{entry.totalQtyReceived} <span style={{ fontSize: '11px', color: '#64748b' }}>Nos.</span></td>
                        <td style={tdStyle}>{entry.ritesIcNumber}</td>
                        <td style={tdStyle}>
                            <span style={{ background: '#f0f9fa', color: '#42818c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                {getStatusLabel(entry.status)}
                            </span>
                        </td>
                    </>
                );
            default:
                return (
                    <>
                        <td style={tdStyle}>{entry.dateOfReceipt || entry.date}</td>
                        <td style={tdStyle}>{entry.gradeSpec || entry.details?.grade || '-'}</td>
                        <td style={tdStyle}>{entry.manufacturer || entry.details?.manufacturer}</td>
                        <td style={boldStyle}>{entry.totalQtyReceived || entry.qty}</td>
                        <td style={tdStyle}>
                            <span style={{ background: '#f0f9fa', color: '#42818c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                {getStatusLabel(entry.status)}
                            </span>
                        </td>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {[{ label: 'Procured', value: stats.procured, color: '#42818c' }, { label: 'Used', value: stats.used, color: '#64748b' }, { label: 'Balance', value: stats.balance.toFixed(2), color: '#10b981' }].map(stat => (
                    <div key={stat.label} style={{ background: 'white', padding: '16px 20px', borderRadius: '20px', border: `1px solid #e2e8f0`, textAlign: 'left', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ fontSize: '12px', color: stat.color, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>{stat.value} <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>{material.unit}</span></div>
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
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading inventory records...</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {getColumns().map(col => (<th key={col} style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{col}</th>))}
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.length === 0 ? (
                                    <tr><td colSpan={getColumns().length + 1} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>
                                ) : (
                                    entries.map((entry, idx) => (
                                        <tr key={entry.id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                            {renderRow(entry)}
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => handleEdit(entry)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Edit</button>
                                                    <button onClick={() => handleDelete(entry.id)} style={{ background: '#fff1f2', border: '1px solid #ffe4e6', color: '#e11d48', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showForm && <InventoryForm material={material} onClose={() => { setShowForm(false); setEditingEntry(null); }} onSubmit={handleFormSubmit} initialData={editingEntry} />}
        </div>
    );
};

export default InventoryDetail;
