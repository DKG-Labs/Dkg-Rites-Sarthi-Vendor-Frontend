import React, { useState, useEffect } from 'react';
import InventoryForm from './InventoryForm';
import { apiService } from '../../../services/api';

const InventoryDetail = ({ material, onBack }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('unverified'); // 'unverified' or 'verified'

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
                const apiData = filterByPlant(await apiService.getHtsWires());
                data = apiData.map(entry => {
                    const localDataStr = localStorage.getItem(`hts_relaxation_${entry.id}`);
                    if (localDataStr) {
                        try {
                            const localData = JSON.parse(localDataStr);
                            return {
                                ...entry,
                                relaxationTest: entry.relaxationTest || localData.relaxationTest || '',
                                relaxationTestTc: entry.relaxationTestTc || localData.relaxationTestTc || '',
                                relaxationTestDate: entry.relaxationTestDate || localData.relaxationTestDate || '',
                                relaxationTestValidity: entry.relaxationTestValidity || localData.relaxationTestValidity || ''
                            };
                        } catch (e) {
                            console.error('Error parsing local relaxation data', e);
                        }
                    }
                    return entry;
                });
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

    const unverifiedEntries = entries.filter(entry => entry.status !== 'Completed' && entry.status !== 'Locked');
    const verifiedEntries = entries.filter(entry => entry.status === 'Completed' || entry.status === 'Locked');
    const filteredEntries = activeTab === 'verified' ? verifiedEntries : unverifiedEntries;

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
                    'Date of Receipt', 'Grade/Spec', 'Manufacturer', 'Invoice No.',
                    'Relaxation Test', 'Relaxation TC & Date', 'Relaxation Validity',
                    'Total Quantity (Kg)', 'Coil Details', 'Status'
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
                        <td style={tdStyle}>{entry.relaxationTest || '-'}</td>
                        <td style={tdStyle}>
                            {entry.relaxationTestTc ? entry.relaxationTestTc : ''}
                            {entry.relaxationTestDate ? ` (${entry.relaxationTestDate})` : ''}
                            {!entry.relaxationTestTc && !entry.relaxationTestDate && '-'}
                        </td>
                        <td style={tdStyle}>
                            {entry.relaxationTestValidity || (() => {
                                if (entry.relaxationTestDate && entry.relaxationTest) {
                                    try {
                                        const parts = entry.relaxationTestDate.split('/');
                                        if (parts.length === 3) {
                                            const day = parseInt(parts[0], 10);
                                            const month = parseInt(parts[1], 10) - 1;
                                            const year = parseInt(parts[2], 10);
                                            const date = new Date(year, month, day);
                                            if (!isNaN(date.getTime())) {
                                                if (entry.relaxationTest === '1000 Hours Test') {
                                                    date.setFullYear(date.getFullYear() + 1);
                                                } else if (entry.relaxationTest === '100 Hours Test') {
                                                    date.setMonth(date.getMonth() + 6);
                                                }
                                                const d = String(date.getDate()).padStart(2, '0');
                                                const m = String(date.getMonth() + 1).padStart(2, '0');
                                                const y = date.getFullYear();
                                                return `${d}/${m}/${y}`;
                                            }
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }
                                return '-';
                            })()}
                        </td>
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

                {/* Modern Pill Tab Switcher */}
                <div style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        background: '#f1f5f9',
                        borderRadius: '16px',
                        padding: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {/* Tab: Pending Declaration / Unverified */}
                        <button
                            onClick={() => setActiveTab('unverified')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                background: activeTab === 'unverified' ? 'white' : 'transparent',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: activeTab === 'unverified' ? '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)' : 'none',
                                transition: 'all 0.2s ease',
                                outline: 'none'
                            }}
                        >
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#f59e0b',
                                display: 'inline-block'
                            }}></span>
                            <span style={{
                                color: '#374151',
                                fontWeight: '700',
                                fontSize: '13px'
                            }}>
                                Pending Declaration
                            </span>
                            <span style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700'
                            }}>
                                {unverifiedEntries.length}
                            </span>
                        </button>

                        {/* Tab: Verified Production / Verified */}
                        <button
                            onClick={() => setActiveTab('verified')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                background: activeTab === 'verified' ? 'white' : 'transparent',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: activeTab === 'verified' ? '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)' : 'none',
                                transition: 'all 0.2s ease',
                                outline: 'none'
                            }}
                        >
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#34d399',
                                display: 'inline-block'
                            }}></span>
                            <span style={{
                                color: '#374151',
                                fontWeight: '700',
                                fontSize: '13px'
                            }}>
                                Verified Production
                            </span>
                            <span style={{
                                background: '#e5e7eb',
                                color: '#374151',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700'
                            }}>
                                {verifiedEntries.length}
                            </span>
                        </button>
                    </div>
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
                                {filteredEntries.length === 0 ? (
                                    <tr><td colSpan={getColumns().length + 1} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>
                                ) : (
                                    filteredEntries.map((entry, idx) => (
                                        <tr key={entry.id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                            {renderRow(entry)}
                                            <td style={{ padding: '16px 24px' }}>
                                                <button
                                                    onClick={() => handleEdit(entry)}
                                                    style={{
                                                        background: '#f8fafc',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#42818c',
                                                        padding: '6px 14px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    👁 View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showForm && (
                <InventoryForm
                    material={material}
                    onClose={() => { setShowForm(false); setEditingEntry(null); }}
                    onSubmit={handleFormSubmit}
                    onDelete={handleDelete}
                    initialData={editingEntry}
                />
            )}
        </div>
    );
};

export default InventoryDetail;
