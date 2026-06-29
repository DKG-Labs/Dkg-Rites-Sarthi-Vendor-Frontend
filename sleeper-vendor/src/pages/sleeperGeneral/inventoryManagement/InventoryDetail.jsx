import React, { useState, useEffect } from 'react';
import InventoryForm from './InventoryForm';
import InventoryUsedForm from './InventoryUsedForm';
import InventoryRegister from './InventoryRegister';
import HistoryModal from './HistoryModal';
import Notification from '../../../components/common/Notification';
import { apiService } from '../../../services/api';

const InventoryDetail = ({ material, onBack }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [entries, setEntries] = useState([]); // Procured entries
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('unverified'); // 'unverified' or 'verified' (inner tabs)

    // New states for RM Used and Inventory Register
    const [activeSection, setActiveSection] = useState('procured'); // 'procured', 'used', 'register'
    const [unverifiedUsed, setUnverifiedUsed] = useState([]);
    const [verifiedUsed, setVerifiedUsed] = useState([]);
    const [allVerifiedUsed, setAllVerifiedUsed] = useState([]); // For Ledger and cumulative stats
    const [unverifiedTotal, setUnverifiedTotal] = useState(0);
    const [verifiedTotal, setVerifiedTotal] = useState(0);
    
    const [productionDeclarations, setProductionDeclarations] = useState([]);
    const [mixDesigns, setMixDesigns] = useState([]);
    const [showUsedForm, setShowUsedForm] = useState(false);
    const [editingUsedEntry, setEditingUsedEntry] = useState(null);
    const [historyEntryId, setHistoryEntryId] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    const [unverifiedPage, setUnverifiedPage] = useState(0);
    const [verifiedPage, setVerifiedPage] = useState(0);
    const [unverifiedTotalPages, setUnverifiedTotalPages] = useState(0);
    const [verifiedTotalPages, setVerifiedTotalPages] = useState(0);
    const pageSize = 10;

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

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

            // Load RM Used from API — fetch ALL records, categorize client-side by workflowStatus
            if (currentPlantId) {
                try {
                    const [pageData, allData] = await Promise.all([
                        apiService.getRmConsumptionsByMaterial(currentPlantId, material.name, [], unverifiedPage, 100),
                        apiService.getAllVerifiedRmConsumptions(currentPlantId, material.name)
                    ]);
                    
                    const allRecords = pageData.responseData || [];
                    
                    // A record is "verified" if its workflowStatus is Completed/Verified/Locked,
                    // regardless of what the DB status field says.
                    const isRecordVerified = (rec) => {
                        const wf = rec.workflowStatus;
                        return wf === 'Completed' || wf === 'Verified' || wf === 'Locked';
                    };

                    const unverified = allRecords.filter(r => !isRecordVerified(r));
                    const verified = allRecords.filter(r => isRecordVerified(r));

                    setUnverifiedUsed(unverified.slice(unverifiedPage * pageSize, (unverifiedPage + 1) * pageSize));
                    setUnverifiedTotalPages(Math.ceil(unverified.length / pageSize) || 1);
                    setUnverifiedTotal(unverified.length);

                    setVerifiedUsed(verified.slice(verifiedPage * pageSize, (verifiedPage + 1) * pageSize));
                    setVerifiedTotalPages(Math.ceil(verified.length / pageSize) || 1);
                    setVerifiedTotal(verified.length);

                    // allVerifiedUsed for ledger stats — use verified records from current page + allVerified from API
                    setAllVerifiedUsed(allData && allData.length > 0 ? allData : verified);
                } catch (err) {
                    console.error('Failed to fetch RM Consumptions:', err);
                    setUnverifiedUsed([]); setVerifiedUsed([]); setAllVerifiedUsed([]);
                }
            } else {
                setUnverifiedUsed([]); setVerifiedUsed([]); setAllVerifiedUsed([]);
            }

            // Fetch production declarations and mix designs for estimations
            const pdData = await apiService.getProductionDeclarations();
            setProductionDeclarations(filterByPlant(pdData) || []);

            const mixData = await apiService.getMixDesigns();
            setMixDesigns(filterByPlant(mixData) || []);

        } catch (error) {
            console.error('Fetch error:', error);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when pagination states change
    useEffect(() => {
        fetchEntries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [material.id, unverifiedPage, verifiedPage]);

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

    // Helper checking verified status on procured entries (uses DB status field)
    const isVerifiedStatus = (status) => {
        return status === 'Completed' || status === 'Locked' || status === 'Verified';
    };

    // Helper for RM Used: also check workflowStatus for IE-verified records
    const isUsedEntryVerified = (entry) => {
        const wf = entry.workflowStatus;
        if (wf === 'Completed' || wf === 'Verified' || wf === 'Locked') return true;
        return isVerifiedStatus(entry.status);
    };

    // Calculate official register stats (verified entries only)
    const stats = {
        procured: entries
            .filter(e => isVerifiedStatus(e.status))
            .reduce((acc, curr) => acc + Number(curr.totalQtyReceived || curr.totalQuantity || curr.qty || 0), 0),
        
        used: allVerifiedUsed
            .reduce((acc, curr) => acc + Number(curr.qty || 0), 0),
        
        get balance() { return this.procured - this.used; }
    };

    // Procured categorization
    const unverifiedEntries = entries.filter(e => !isVerifiedStatus(e.status));
    const verifiedEntries = entries.filter(e => isVerifiedStatus(e.status));
    const filteredProcured = activeTab === 'verified' ? verifiedEntries : unverifiedEntries;

    // Used categorization (directly from server-paginated state)
    const filteredUsed = activeTab === 'verified' ? verifiedUsed : unverifiedUsed;

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

    // Simulate Inspecting Engineer Approval for Procured
    const handleSimulateVerifyProcured = async (entry) => {
        if (!window.confirm('Simulate Inspecting Engineer verification for this procurement entry?')) return;
        setLoading(true);
        try {
            const payload = {
                ...entry,
                status: 'Completed',
                totalQtyReceived: entry.totalQtyReceived || entry.qty,
                invoiceNumber: entry.invoiceNumber || entry.details?.invoiceNo,
                ritesIcNumber: entry.ritesIcNumber || entry.details?.icNo
            };

            if (material.id === 'hts-wire') {
                await apiService.saveHtsWire(payload);
            } else if (material.id === 'cement') {
                await apiService.saveCement(payload);
            } else if (material.id === 'dowel') {
                await apiService.saveDowel(payload);
            } else if (material.id === 'aggregates') {
                await apiService.saveAggregate(payload);
            } else if (material.id === 'admixture') {
                await apiService.saveAdmixture(payload);
            } else if (material.id === 'sgci-insert') {
                await apiService.saveSgciInsert(payload);
            } else {
                // Mock behavior
                const updatedMock = entries.map(e => e.id === entry.id ? { ...e, status: 'Completed' } : e);
                setEntries(updatedMock);
            }
            alert('Inspecting Engineer verified this entry! Officially added to stock.');
            await fetchEntries();
        } catch (error) {
            alert('Verification failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // RM Used logic handlers
    const handleUsedFormSubmit = async (data) => {
        try {
            const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
            data.plantId = selectedPlant ? selectedPlant.plantId : null;
            data.vendorCode = (selectedPlant && selectedPlant.vendorCode) ? selectedPlant.vendorCode : (localStorage.getItem('vendorCode') || sessionStorage.getItem('vendorCode'));
            const currentUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
            if (data.numericId) {
                data.updatedBy = currentUserId ? parseInt(currentUserId, 10) : null;
            } else {
                data.createdBy = currentUserId ? parseInt(currentUserId, 10) : null;
            }
            
            await apiService.saveRmConsumption(data);
            setShowUsedForm(false);
            setEditingUsedEntry(null);
            showNotification(data.numericId ? 'Consumption entry updated successfully!' : 'Consumption entry saved successfully!', 'success');
            fetchEntries(); // Refresh the list from the backend
        } catch (error) {
            showNotification('Failed to save consumption entry: ' + error.message, 'error');
        }
    };

    const handleUsedDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this consumption entry?')) {
            try {
                // Determine if it's a numeric ID (backend) or string ID
                let backendId = id;
                const entryToDelete = usedEntries.find(e => e.id === id);
                if (entryToDelete && entryToDelete.numericId) {
                    backendId = entryToDelete.numericId;
                } else if (typeof id === 'string' && id.includes('-ID-')) {
                    backendId = id.split('-ID-')[1];
                }
                
                await apiService.deleteRmConsumption(backendId);
                setShowUsedForm(false);
                setEditingUsedEntry(null);
                showNotification('Consumption record deleted successfully!', 'success');
                fetchEntries();
            } catch (error) {
                showNotification('Failed to delete consumption entry: ' + error.message, 'error');
            }
        }
    };

    const handleSimulateVerifyUsed = async (entry) => {
        if (!window.confirm('Simulate Inspecting Engineer verification for this consumption entry?')) return;
        try {
            const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
            const currentUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
            const payload = { 
                ...entry, 
                status: 'Completed', 
                plantId: selectedPlant ? selectedPlant.plantId : null,
                vendorCode: (selectedPlant && selectedPlant.vendorCode) ? selectedPlant.vendorCode : (localStorage.getItem('vendorCode') || sessionStorage.getItem('vendorCode')),
                updatedBy: currentUserId ? parseInt(currentUserId, 10) : null
            };
            await apiService.saveRmConsumption(payload);
            showNotification('Inspecting Engineer verified this entry! Consumption deducted from register.', 'success');
            fetchEntries();
        } catch (error) {
            showNotification('Verification failed: ' + error.message, 'error');
        }
    };

    const getStatusLabel = (status) => {
        if (!status || status === 'Created' || status === 'Pending') return 'Pending for verification';
        if (status === 'Completed' || status === 'Locked' || status === 'Verified') return 'Verified & Locked';
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
                            <span style={{ 
                                background: isVerifiedStatus(entry.status) ? '#ecfdf5' : '#fffbeb', 
                                color: isVerifiedStatus(entry.status) ? '#047857' : '#d97706', 
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' 
                            }}>
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
                            {entry.relaxationTestValidity || '-'}
                        </td>
                        <td style={boldStyle}>{entry.totalQtyReceived} <span style={{ fontSize: '11px', color: '#64748b' }}>Kg</span></td>
                        <td style={{ ...tdStyle, maxWidth: '220px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {coilSummary}
                        </td>
                        <td style={tdStyle}>
                            <span style={{ 
                                background: isVerifiedStatus(entry.status) ? '#ecfdf5' : '#fffbeb', 
                                color: isVerifiedStatus(entry.status) ? '#047857' : '#d97706', 
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' 
                            }}>
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
                            <span style={{ 
                                background: isVerifiedStatus(entry.status) ? '#ecfdf5' : '#fffbeb', 
                                color: isVerifiedStatus(entry.status) ? '#047857' : '#d97706', 
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' 
                            }}>
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
                            <span style={{ 
                                background: isVerifiedStatus(entry.status) ? '#ecfdf5' : '#fffbeb', 
                                color: isVerifiedStatus(entry.status) ? '#047857' : '#d97706', 
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' 
                            }}>
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
                            <span style={{ 
                                background: isVerifiedStatus(entry.status) ? '#ecfdf5' : '#fffbeb', 
                                color: isVerifiedStatus(entry.status) ? '#047857' : '#d97706', 
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' 
                            }}>
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
                            <span style={{ 
                                background: isVerifiedStatus(entry.status) ? '#ecfdf5' : '#fffbeb', 
                                color: isVerifiedStatus(entry.status) ? '#047857' : '#d97706', 
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' 
                            }}>
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
                            <span style={{ 
                                background: isVerifiedStatus(entry.status) ? '#ecfdf5' : '#fffbeb', 
                                color: isVerifiedStatus(entry.status) ? '#047857' : '#d97706', 
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' 
                            }}>
                                {getStatusLabel(entry.status)}
                            </span>
                        </td>
                    </>
                );
        }
    };

    const actionButtonStyle = {
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
    };

    return (
        <div className="inventory-detail fade-in">
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} autoClose={true} autoCloseDelay={5000} />
            
            {/* Page Header */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={onBack} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#64748b' }}>
                    ← Back
                </button>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {material.icon}
                </div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{material.name} Management</h2>
            </div>

            {/* Dynamic Status Tabs (Cumulative Status Cards) */}
            <div style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Cumulative Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {[
                    { id: 'procured', label: 'RM Procured', value: stats.procured, color: '#42818c' },
                    { id: 'used', label: 'RM Used', value: stats.used, color: '#64748b' },
                    { id: 'register', label: 'RM Inventory Register', value: stats.balance.toFixed(2), color: '#10b981' }
                ].map(stat => {
                    const isActive = activeSection === stat.id;
                    return (
                        <div 
                            key={stat.id} 
                            onClick={() => {
                                setActiveSection(stat.id);
                                // Default inner tab to unverified when switching sections
                                setActiveTab('unverified');
                            }}
                            style={{ 
                                background: isActive ? '#f0f7ff' : 'white', 
                                padding: '16px 20px', 
                                borderRadius: '20px', 
                                border: `2px solid ${isActive ? '#0ea5e9' : '#e2e8f0'}`, 
                                textAlign: 'left', 
                                boxShadow: isActive ? '0 10px 15px -3px rgba(14, 165, 233, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                        >
                            <div style={{ fontSize: '11px', color: stat.color, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>
                                {stat.value.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>{material.unit}</span>
                            </div>
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-10px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '0',
                                    height: '0',
                                    borderLeft: '10px solid transparent',
                                    borderRight: '10px solid transparent',
                                    borderBottom: '10px solid #ffffff',
                                    zIndex: 10
                                }}></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Main Action Block Based on Active Section */}
            {activeSection === 'register' ? (
                <InventoryRegister 
                    material={material}
                    procuredEntries={entries}
                    usedEntries={allVerifiedUsed}
                />
            ) : (
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    {/* Header */}
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                                {activeSection === 'procured' ? 'RM Procured Registry' : 'RM Consumption Records'}
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                                {activeSection === 'procured' 
                                    ? `View and declare incoming inventory for ${material.name}`
                                    : `View and log daily consumption/wastage for ${material.name}`}
                            </p>
                        </div>
                        
                        {activeSection === 'procured' ? (
                            <button 
                                onClick={() => { setEditingEntry(null); setShowForm(true); }} 
                                style={{ background: '#42818c', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(66, 129, 140, 0.2)' }}
                            >
                                + Add New Inventory
                            </button>
                        ) : (
                            <button 
                                onClick={() => { setEditingUsedEntry(null); setShowUsedForm(true); }} 
                                style={{ background: '#0284c7', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)' }}
                            >
                                + Add New Entry
                            </button>
                        )}
                    </div>

                    {/* Inner Tabs: Pending vs Verified Switcher */}
                    <div style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            background: '#f1f5f9',
                            borderRadius: '16px',
                            padding: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
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
                                    boxShadow: activeTab === 'unverified' ? '0 4px 6px -1px rgba(0, 0, 0, 0.08)' : 'none',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                            >
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                                <span style={{ color: '#374151', fontWeight: '700', fontSize: '13px' }}>Pending for Verification</span>
                                <span style={{ background: '#fffbeb', color: '#b45309', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                                    {activeSection === 'procured' ? unverifiedEntries.length : unverifiedTotal}
                                </span>
                            </button>

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
                                    boxShadow: activeTab === 'verified' ? '0 4px 6px -1px rgba(0, 0, 0, 0.08)' : 'none',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                            >
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                                <span style={{ color: '#374151', fontWeight: '700', fontSize: '13px' }}>Verified</span>
                                <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                                    {activeSection === 'procured' ? verifiedEntries.length : verifiedTotal}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Table Render */}
                    <div style={{ overflowX: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading records...</div>
                        ) : activeSection === 'procured' ? (
                            // RM Procured Table
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {getColumns().map(col => (<th key={col} style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{col}</th>))}
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProcured.length === 0 ? (
                                        <tr><td colSpan={getColumns().length + 1} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>
                                    ) : (
                                        filteredProcured.map((entry, idx) => (
                                            <tr key={entry.id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                                {renderRow(entry)}
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                        {activeTab === 'unverified' ? (
                                                            <>
                                                                <button onClick={() => handleEdit(entry)} style={{ ...actionButtonStyle, color: '#0284c7' }}>
                                                                    Modify
                                                                </button>
                                                                <button onClick={() => handleDelete(entry.id)} style={{ ...actionButtonStyle, color: '#ef4444' }}>
                                                                    Delete
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button onClick={() => handleEdit(entry)} style={actionButtonStyle}>
                                                                👁 View
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <>
                                {/* RM Used Table */}
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Date of Use</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Raw Material & Sub Type</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>RM Used For</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Sleepers Made</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Estimated Qty Used</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Actual Qty Used</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsed.length === 0 ? (
                                        <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No consumption records found.</td></tr>
                                    ) : (
                                        filteredUsed.map((entry, idx) => (
                                            <tr key={entry.id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '16px 24px', fontSize: '13px', color: '#1e293b' }}>{entry.date}</td>
                                                <td style={{ padding: '16px 24px', fontSize: '13px', color: '#1e293b' }}>
                                                    <span style={{ fontWeight: '700' }}>{material.name}</span>
                                                    <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: '700' }}>{entry.subType}</span>
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '13px', color: '#475569' }}>{entry.usedFor}</td>
                                                <td style={{ padding: '16px 24px', fontSize: '13px', color: '#1e293b', fontWeight: '600', textAlign: 'right' }}>
                                                    {entry.usedFor === 'Wastage' ? '-' : entry.sleepersMade}
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '13px', color: '#047857', fontWeight: '600', textAlign: 'right' }}>
                                                    {entry.usedFor === 'Wastage' ? '-' : `${entry.estimatedQty.toLocaleString()} ${material.unit}`}
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '13px', color: '#1e293b', fontWeight: '700', textAlign: 'right' }}>
                                                    {entry.qty.toLocaleString()} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{material.unit}</span>
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                                                    <span style={{ 
                                                        background: isUsedEntryVerified(entry) ? '#ecfdf5' : '#fffbeb', 
                                                        color: isUsedEntryVerified(entry) ? '#047857' : '#d97706', 
                                                        padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' 
                                                    }}>
                                                        {entry.workflowRemarks
                                                            ? entry.workflowRemarks
                                                            : getStatusLabel(entry.status)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                        {isUsedEntryVerified(entry) ? (
                                                            <>
                                                                <span title="Verified & Locked by IE" style={{ fontSize: '14px' }}>🔒</span>
                                                                <button onClick={() => { setEditingUsedEntry(entry); setShowUsedForm(true); }} style={actionButtonStyle}>
                                                                    👁 View
                                                                </button>
                                                                <button onClick={() => setHistoryEntryId(entry.numericId || entry.id)} style={{ ...actionButtonStyle, color: '#10b981' }}>
                                                                    History
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => { setEditingUsedEntry(entry); setShowUsedForm(true); }} style={{ ...actionButtonStyle, color: '#0284c7' }}>
                                                                    Modify
                                                                </button>
                                                                <button onClick={() => handleUsedDelete(entry.id)} style={{ ...actionButtonStyle, color: '#ef4444' }}>
                                                                    Delete
                                                                </button>
                                                                <button onClick={() => setHistoryEntryId(entry.id)} style={{ ...actionButtonStyle, color: '#4f46e5' }}>
                                                                    History
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                                
                        {/* Pagination for RM Used */}
                        {activeSection === 'used' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                                    Showing {activeTab === 'verified' ? verifiedTotal : unverifiedTotal} items
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button 
                                        onClick={() => {
                                            if (activeTab === 'verified') {
                                                setVerifiedPage(Math.max(0, verifiedPage - 1));
                                            } else {
                                                setUnverifiedPage(Math.max(0, unverifiedPage - 1));
                                            }
                                        }}
                                        disabled={activeTab === 'verified' ? verifiedPage === 0 : unverifiedPage === 0}
                                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: (activeTab === 'verified' ? verifiedPage === 0 : unverifiedPage === 0) ? '#f8fafc' : 'white', cursor: (activeTab === 'verified' ? verifiedPage === 0 : unverifiedPage === 0) ? 'not-allowed' : 'pointer', color: '#475569', fontWeight: '600', fontSize: '13px' }}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ fontSize: '13px', color: '#334155', fontWeight: '600', margin: '0 8px' }}>
                                        Page {(activeTab === 'verified' ? verifiedPage : unverifiedPage) + 1} of {Math.max(1, activeTab === 'verified' ? verifiedTotalPages : unverifiedTotalPages)}
                                    </span>
                                    <button 
                                        onClick={() => {
                                            if (activeTab === 'verified') {
                                                setVerifiedPage(Math.min(verifiedTotalPages - 1, verifiedPage + 1));
                                            } else {
                                                setUnverifiedPage(Math.min(unverifiedTotalPages - 1, unverifiedPage + 1));
                                            }
                                        }}
                                        disabled={activeTab === 'verified' ? verifiedPage >= verifiedTotalPages - 1 : unverifiedPage >= unverifiedTotalPages - 1}
                                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: (activeTab === 'verified' ? verifiedPage >= verifiedTotalPages - 1 : unverifiedPage >= unverifiedTotalPages - 1) ? '#f8fafc' : 'white', cursor: (activeTab === 'verified' ? verifiedPage >= verifiedTotalPages - 1 : unverifiedPage >= unverifiedTotalPages - 1) ? 'not-allowed' : 'pointer', color: '#475569', fontWeight: '600', fontSize: '13px' }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Forms */}
            {showForm && (
                <InventoryForm
                    material={material}
                    onClose={() => { setShowForm(false); setEditingEntry(null); }}
                    onSubmit={handleFormSubmit}
                    onDelete={handleDelete}
                    initialData={editingEntry}
                    existingEntries={entries}
                />
            )}

            {showUsedForm && (
                <InventoryUsedForm
                    material={material}
                    onClose={() => { setShowUsedForm(false); setEditingUsedEntry(null); }}
                    onSubmit={handleUsedFormSubmit}
                    onDelete={handleUsedDelete}
                    initialData={editingUsedEntry}
                    productionDeclarations={productionDeclarations}
                    mixDesigns={mixDesigns}
                />
            )}

            {historyEntryId && (
                <HistoryModal 
                    entryId={historyEntryId} 
                    onClose={() => setHistoryEntryId(null)} 
                />
            )}

            <Notification 
                message={notification.message} 
                type={notification.type} 
                onClose={() => setNotification({ message: '', type: '' })} 
            />
        </div>
    );
};

export default InventoryDetail;
