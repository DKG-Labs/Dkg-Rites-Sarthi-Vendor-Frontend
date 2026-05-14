import React, { useState, useMemo, useEffect } from 'react';
import { productionDeclarationService } from '../../../services/productionDeclarationService';
import poAssignedService from '../../../services/poAssignedService';
import { API_CONFIG } from '../../../services/config';

const PRODUCT_TYPES = [
    "6.00mm GRSP",
    "10.00mm GRSP",
    "6.20mm CGRSP",
    "10.00mm CGRSP",
    "6.00mm NCRGRSP",
    "10.00mm NCRGRSP"
];

const SHIFTS = ["Shift A", "Shift B", "Shift C", "General", "Day", "Night"];

const ProductionDeclarationDashboard = ({ plantId, vendorCode: propVendorCode }) => {
    const [activeTab, setActiveTab] = useState('pending');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [currentEditingStatus, setCurrentEditingStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [pendingTransitions, setPendingTransitions] = useState([]);
    const [pos, setPos] = useState([]);
    const [posLoading, setPosLoading] = useState(false);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type, fading: false });
        setTimeout(() => {
            setNotification(prev => prev ? { ...prev, fading: true } : null);
            setTimeout(() => setNotification(null), 400);
        }, 3000);
    };

    const [declarations, setDeclarations] = useState([]);

    const getLatestUserAndPlant = () => {
        let userInfo = { vendorName: "", vendorCode: "", userId: "1" };
        const railpadUser = localStorage.getItem('railpad_user');
        
        if (railpadUser && railpadUser !== "undefined") {
            try { 
                userInfo = JSON.parse(railpadUser); 
            } catch (e) { console.error(e); }
        } else {
            const rpVName = localStorage.getItem('railpad_vendorName');
            const rpVCode = localStorage.getItem('railpad_vendorCode');
            const rpUId = localStorage.getItem('railpad_userId');

            const vName = localStorage.getItem('vendorName');
            const uName = localStorage.getItem('userName');
            const vCode = localStorage.getItem('vendorCode') || localStorage.getItem('vendor_code') || uName;
            const uId = localStorage.getItem('userId') || localStorage.getItem('user_id');

            userInfo = {
                vendorName: rpVName || vName || (uName && !uName.startsWith(':') ? uName : ""),
                vendorCode: rpVCode || vCode || "",
                userId: rpUId || uId || "1"
            };
        }

        let plantInfo = { plantId: "1", plantName: "Default" };
        const plantStr = localStorage.getItem('selectedRailPlant') || localStorage.getItem('railpad_selectedPlant');
        const rpPlantId = localStorage.getItem('railpad_selectedPlantId') || localStorage.getItem('plantId') || localStorage.getItem('selectedPlantId');

        if (plantStr && plantStr !== "undefined") {
            try { 
                plantInfo = JSON.parse(plantStr); 
            } catch (e) { 
                console.error("Error parsing plantStr:", e);
                if (typeof plantStr === 'string' && plantStr.length > 1) {
                    plantInfo = { plantId: plantStr, plantName: "Selected Plant" };
                }
            }
        } else if (rpPlantId && rpPlantId !== "undefined") {
            plantInfo = { 
                plantId: rpPlantId, 
                plantName: localStorage.getItem('railpad_selectedPlantName') || localStorage.getItem('plantName') || "Default" 
            };
        }

        return { user: userInfo, plant: plantInfo };
    };

    const initialFormState = {
        productionDate: new Date().toISOString().split('T')[0],
        shift: '',
        productionLine: '',
        poNo: '',
        productBlocks: [
            {
                id: Date.now(),
                productType: '',
                mode: 'Pieces',
                batches: [{ id: Date.now() + 1, batchNo: '', compoundABatchNo: '', compoundBBatchNo: '', initialWeight: '', finalWeight: '', qty: '' }]
            }
        ]
    };

    const [formData, setFormData] = useState(initialFormState);

    const fetchPOs = async () => {
        try {
            setPosLoading(true);
            const { user } = getLatestUserAndPlant();
            const vcode = propVendorCode || user.vendorCode;
            if (vcode) {
                const data = await poAssignedService.getPoAssigned(vcode);
                const list = Array.isArray(data) ? data : (data.responseData || []);
                setPos(list);
            }
        } catch (error) {
            console.error('Error fetching POs:', error);
        } finally {
            setPosLoading(false);
        }
    };

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const { plant: localPlant, user } = getLatestUserAndPlant();
            const actualPlantId = plantId || localPlant.plantId;
            
            if (!actualPlantId || actualPlantId === "1") {
                console.warn("[Dashboard] Skipping fetch: Invalid plantId", actualPlantId);
                return;
            }

            // 1. Fetch declarations
            const res = await productionDeclarationService.getByPlantId(actualPlantId);
            const actualData = res?.responseData || (Array.isArray(res) ? res : []);
            setDeclarations(actualData);

            // 2. Fetch pending transitions for workflow mapping
            const transUrl = `${API_CONFIG.RAILPAD_WORKFLOW}/allPendingWorkflowTransition?roleName=Rail%20Vendor`;
            const transRes = await fetch(transUrl, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const transData = await transRes.json();
            if (transData.responseStatus?.statusCode === 0) {
                const transitions = transData.responseData || [];
                setPendingTransitions(transitions);
                console.log(`[Workflow] Found ${transitions.length} pending tasks for Rail Vendor`);
            }
        } catch (error) {
            console.error('Error fetching declarations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
        fetchPOs();
    }, [plantId, propVendorCode]);

    const isComposite = (type) => type?.includes('CGRSP') || type?.includes('NCRGRSP');

    const handleAddProductBlock = () => {
        setFormData(prev => ({
            ...prev,
            productBlocks: [...prev.productBlocks, {
                id: Date.now(),
                productType: '',
                mode: 'Pieces',
                batches: [{ id: Date.now() + 1, batchNo: '', compoundABatchNo: '', compoundBBatchNo: '', initialWeight: '', finalWeight: '', qty: '' }]
            }]
        }));
    };

    const handleRemoveProductBlock = (id) => {
        setFormData(prev => ({
            ...prev,
            productBlocks: prev.productBlocks.filter(b => b.id !== id)
        }));
    };

    const handleAddBatch = (blockId) => {
        setFormData(prev => ({
            ...prev,
            productBlocks: prev.productBlocks.map(block => 
                block.id === blockId 
                ? { ...block, batches: [...block.batches, { id: Date.now(), batchNo: '', compoundABatchNo: '', compoundBBatchNo: '', initialWeight: '', finalWeight: '', qty: '' }] }
                : block
            )
        }));
    };

    const handleRemoveBatch = (blockId, batchId) => {
        setFormData(prev => ({
            ...prev,
            productBlocks: prev.productBlocks.map(block => 
                block.id === blockId 
                ? { ...block, batches: block.batches.filter(b => b.id !== batchId) }
                : block
            )
        }));
    };

    const handleBlockChange = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            productBlocks: prev.productBlocks.map(block => block.id === id ? { ...block, [field]: value } : block)
        }));
    };

    const handleBatchChange = (blockId, batchId, field, value) => {
        setFormData(prev => ({
            ...prev,
            productBlocks: prev.productBlocks.map(block => 
                block.id === blockId 
                ? { ...block, batches: block.batches.map(batch => batch.id === batchId ? { ...batch, [field]: value } : batch) }
                : block
            )
        }));
    };

    const summary = useMemo(() => {
        const result = {};
        formData.productBlocks.forEach(block => {
            if (!block.productType) return;
            const total = block.batches.reduce((sum, b) => sum + (parseInt(b.qty) || 0), 0);
            if (result[block.productType]) {
                result[block.productType].qty += total;
            } else {
                result[block.productType] = { qty: total, mode: block.mode };
            }
        });
        return Object.entries(result);
    }, [formData.productBlocks]);

    const handleDelete = async (id) => {
        if(window.confirm('Are you sure you want to delete this declaration?')) {
            try {
                await productionDeclarationService.delete(id);
                fetchAllData();
                showNotification('Declaration deleted successfully');
            } catch (error) {
                showNotification('Error deleting: ' + error.message, 'error');
            }
        }
    };

    const handleEdit = (decl) => {
        setEditingId(decl.id);
        setCurrentEditingStatus(decl.status);
        setIsReadOnly(false);
        setFormData({
            productionDate: decl.productionDate,
            shift: decl.shift,
            productionLine: decl.productionLine,
            poNo: decl.poNo || '',
            productBlocks: (decl.products || []).map(p => ({
                id: p.id,
                productType: p.productType,
                mode: p.measurementMode,
                batches: (p.batches || []).map(b => ({
                    id: b.id,
                    batchNo: b.batchNo || '',
                    compoundABatchNo: b.compABatch || '',
                    compoundBBatchNo: b.compBBatch || '',
                    initialWeight: b.initialWt || '',
                    finalWeight: b.finalWt || '',
                    qty: b.quantity || ''
                }))
            }))
        });
        setIsModalOpen(true);
    };

    const handleView = (decl) => {
        handleEdit(decl);
        setIsReadOnly(true);
    };

    const openNewModal = () => {
        setFormData(initialFormState);
        setEditingId(null);
        setIsReadOnly(false);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        console.log('[Submit] Starting submission for ID:', editingId);

        try {
            const { user, plant } = getLatestUserAndPlant();

            const payload = {
                productionDate: formData.productionDate,
                shift: formData.shift,
                productionLine: formData.productionLine,
                poNo: formData.poNo,
                vendorName: user.vendorName,
                vendorCode: user.vendorCode,
                plantId: plant.plantId,
                createdBy: user.userId,
                updatedBy: user.userId,
                products: formData.productBlocks.map(block => ({
                    productType: block.productType,
                    measurementMode: block.mode,
                    batches: block.batches.map(batch => ({
                        batchNo: batch.batchNo,
                        compABatch: batch.compoundABatchNo,
                        compBBatch: batch.compoundBBatchNo,
                        initialWt: batch.initialWeight ? parseFloat(batch.initialWeight) : null,
                        finalWt: batch.finalWeight ? parseFloat(batch.finalWeight) : null,
                        quantity: parseInt(batch.qty) || 0
                    }))
                }))
            };

            if (editingId) {
                // 1. PERSIST DATA
                await productionDeclarationService.update(editingId, payload);
                console.log('[Submit] Data updated successfully');
                
                // 2. TRIGGER WORKFLOW: ONLY IF RETURNED
                if (currentEditingStatus?.toUpperCase() === 'RETURNED') {
                    console.log('[Workflow] Status is RETURNED, triggering RESUBMIT...');
                    let transitionId = null;

                    // Step A: Check memory
                    const existing = pendingTransitions.find(t => t.requestId?.toString() === editingId.toString());
                    if (existing) {
                        transitionId = existing.workflowTransitionId;
                    }

                    // Step B: Fallback - Deep Scan History
                    if (!transitionId) {
                        try {
                            const historyUrl = `${API_CONFIG.RAILPAD_WORKFLOW}/WorkflowTransitionHistory?requestId=${editingId}`;
                            console.log('[Workflow] Fetching history from:', historyUrl);
                            const historyRes = await fetch(historyUrl, { headers: { 'Authorization': `Bearer ${user.token}` } });
                            const historyData = await historyRes.json();
                            console.log('[Workflow] History response:', historyData);
                            
                            // Check both responseData and data fields (depending on ResponseBuilder)
                            const results = historyData.responseData || historyData.data || [];
                            if (results.length > 0) {
                                const latest = results[results.length - 1];
                                transitionId = latest.workflowTransitionId;
                                console.log('[Workflow] Found Transition ID:', transitionId);
                            } else {
                                console.warn('[Workflow] No history found for Request:', editingId);
                            }
                        } catch (hErr) {
                            console.error('[Workflow] History scan failed:', hErr);
                        }
                    }

                    // Step C: Trigger Transition
                    if (transitionId) {
                        try {
                            const wfRes = await fetch(`${API_CONFIG.RAILPAD_WORKFLOW}/performTransitionAction`, {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${user.token}`
                                },
                                body: JSON.stringify({
                                    workflowTransitionId: transitionId,
                                    requestId: editingId.toString(),
                                    moduleId: 3,
                                    action: 'RESUBMIT',
                                    remarks: 'Corrected data resubmitted by vendor',
                                    actionBy: user.userId,
                                    shift: formData.shift
                                })
                            });
                            
                            const wfData = await wfRes.json();
                            if (wfRes.ok) {
                                console.log('[Workflow] RESUBMIT successful:', wfData);
                            } else {
                                console.error('[Workflow] RESUBMIT failed:', wfData);
                            }
                        } catch (wfErr) {
                            console.error('[Workflow] Network error during RESUBMIT:', wfErr);
                        }
                    }
                } else {
                    console.log('[Workflow] Status is not RETURNED, skipping workflow trigger.');
                }
                
                showNotification('Declaration updated successfully');
            } else {
                // CREATE NEW RECORD
                await productionDeclarationService.create(payload);
                showNotification('Production successfully declared');
            }
            
            setIsModalOpen(false);
            fetchAllData();
            setEditingId(null);
        } catch (error) {
            showNotification('Error saving: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredDeclarations = declarations.filter(d => {
        const status = (d.status || '').toUpperCase();
        const isVerified = status === 'VERIFIED' || status === 'APPROVED' || status === 'COMPLETED';
        return activeTab === 'pending' ? !isVerified : isVerified;
    });

    const getPendingCount = () => declarations.filter(d => {
        const status = (d.status || '').toUpperCase();
        return status !== 'VERIFIED' && status !== 'APPROVED' && status !== 'COMPLETED';
    }).length;

    const getVerifiedCount = () => declarations.filter(d => {
        const status = (d.status || '').toUpperCase();
        return status === 'VERIFIED' || status === 'APPROVED' || status === 'COMPLETED';
    }).length;

    const SkeletonRow = () => (
        <tr style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 100, height: 14, background: '#f1f5f9', borderRadius: 4, marginBottom: 6 }}></div>
                <div style={{ width: 60, height: 10, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 80, height: 14, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 140, height: 12, background: '#f1f5f9', borderRadius: 4, marginBottom: 6 }}></div>
                <div style={{ width: 180, height: 12, background: '#f1f5f9', borderRadius: 4 }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ width: 70, height: 24, background: '#f1f5f9', borderRadius: 12, margin: '0 auto' }}></div>
            </td>
            <td style={{ padding: '20px 8px' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ width: 50, height: 28, background: '#f1f5f9', borderRadius: 8 }}></div>
                    <div style={{ width: 50, height: 28, background: '#f1f5f9', borderRadius: 8 }}></div>
                    <div style={{ width: 50, height: 28, background: '#f1f5f9', borderRadius: 8 }}></div>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="fade-in railpad-container" style={{ padding: 0 }}>
            {/* Dashboard Header */}
            <div className="section-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', fontFamily: 'var(--font-secondary)' }}>
                        Production Declaration
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0, fontWeight: '500' }}>
                        Manage shift-wise manufacturing output and track batch-wise efficiency.
                    </p>
                </div>
                <button className="btn-primary" onClick={openNewModal} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    Declare New Production
                </button>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="pv-notification-container">
                    <div className={`pv-notification ${notification.type} ${notification.fading ? 'fade-out' : ''}`}>
                        <div className="pv-notification-icon">{notification.type === 'success' ? '✅' : '❌'}</div>
                        <div className="pv-notification-content">
                            <span className="pv-notification-title">{notification.type === 'success' ? 'Success' : 'Attention'}</span>
                            <span className="pv-notification-message">{notification.message}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Tabs */}
            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: 'transparent', border: 'none', padding: 0, marginBottom: '24px' }}>
                <div className={`ie-tab-card ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                    <h3 className="ie-tab-title">Pending Production Verification</h3>
                    <p className="ie-tab-subtitle">{getPendingCount()} Declarations Awaiting Audit</p>
                </div>
                <div className={`ie-tab-card ${activeTab === 'verified' ? 'active' : ''}`} onClick={() => setActiveTab('verified')}>
                    <h3 className="ie-tab-title">Verified Production</h3>
                    <p className="ie-tab-subtitle">{getVerifiedCount()} Locked Records</p>
                </div>
            </div>

            {/* Content Table */}
            <div className="table-container fade-in">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '20%', fontSize: '13px' }}>Date & Shift</th>
                            <th style={{ width: '12%', fontSize: '13px' }}>Line ID</th>
                            <th style={{ width: '15%', fontSize: '13px' }}>PO Number</th>
                            <th style={{ width: '30%', fontSize: '13px' }}>Product Details</th>
                            <th style={{ width: '15%', textAlign: 'center', fontSize: '13px' }}>Status</th>
                            <th style={{ width: '20%', textAlign: 'center', fontSize: '13px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <>
                                <SkeletonRow />
                                <SkeletonRow />
                                <SkeletonRow />
                                <SkeletonRow />
                            </>
                        ) : filteredDeclarations.map(decl => (
                            <tr key={decl.id}>
                                <td>
                                    <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>{decl.productionDate}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>{decl.shift}</div>
                                </td>
                                <td><span style={{ fontWeight: '700', color: 'var(--primary-color)', fontSize: '14px' }}>{decl.productionLine}</span></td>
                                <td><span style={{ fontWeight: '600', color: '#64748b', fontSize: '13px' }}>{decl.poNo || '—'}</span></td>
                                <td>
                                    {decl.products?.map((p, i) => (
                                        <div key={i} style={{ fontSize: '14px', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: '700' }}>{p.productType}:</span> {p.batches?.reduce((sum, b) => sum + (b.quantity || 0), 0).toLocaleString()} {p.measurementMode}
                                        </div>
                                    ))}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className={`badge ${decl.status === 'VERIFIED' || decl.status === 'APPROVED' ? 'badge-verified' : 'badge-pending'}`} style={{ margin: 0, fontSize: '12px', padding: '6px 12px' }}>
                                        {decl.status}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button className="btn-secondary" onClick={() => handleView(decl)} style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}>View</button>
                                        {(decl.status || '').toUpperCase() !== 'VERIFIED' && (decl.status || '').toUpperCase() !== 'APPROVED' && (decl.status || '').toUpperCase() !== 'COMPLETED' && (
                                            <>
                                                <button className="btn-secondary" onClick={() => handleEdit(decl)} style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}>Edit</button>
                                                <button className="btn-secondary" onClick={() => handleDelete(decl.id)} style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px', color: '#ef4444', borderColor: '#fee2e2' }}>Delete</button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content fade-in">
                        <div className="modal-header">
                            <h2>{isReadOnly ? 'View Declaration' : (editingId ? 'Edit Declaration' : 'Declare New Production')}</h2>
                            <button className="close-modal" onClick={() => setIsModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <form id="declaration-form" onSubmit={handleSubmit} className="modal-body">
                            {/* Section A: Header */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>1</div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>Shift Information</h3>
                                </div>
                                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Date of Production</label>
                                        <input type="date" className="form-input" value={formData.productionDate} onChange={(e) => setFormData({...formData, productionDate: e.target.value})} required disabled={isReadOnly} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Shift</label>
                                        <select className="form-select" value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value})} required disabled={isReadOnly}>
                                            <option value="">Select Shift</option>
                                            {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Production Line ID</label>
                                        <select className="form-select" value={formData.productionLine} onChange={(e) => setFormData({...formData, productionLine: e.target.value})} required disabled={isReadOnly}>
                                            <option value="">Select Line</option>
                                            <option value="PL-01">PL-01 (Main Line)</option>
                                            <option value="PL-02">PL-02 (Secondary)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">PO Number</label>
                                        <select 
                                            className="form-select" 
                                            value={formData.poNo} 
                                            onChange={(e) => setFormData({...formData, poNo: e.target.value})} 
                                            required 
                                            disabled={isReadOnly || posLoading}
                                        >
                                            <option value="">{posLoading ? 'Loading POs...' : 'Select PO'}</option>
                                            {pos.map(p => (
                                                <option key={p.poNo} value={p.poNo}>{p.poNo}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section B: Dynamic Product Blocks */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>2</div>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>Product-Wise Batch Declaration</h3>
                                    </div>
                                    {!isReadOnly && (
                                        <button type="button" className="btn-secondary" onClick={handleAddProductBlock} style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '11px' }}>
                                            + Add Product Type
                                        </button>
                                    )}
                                </div>

                                {formData.productBlocks.map((block) => (
                                    <div key={block.id} className="product-block">
                                        {formData.productBlocks.length > 1 && !isReadOnly && (
                                            <button type="button" className="batch-row-remove" style={{ top: '12px', right: '12px' }} onClick={() => handleRemoveProductBlock(block.id)}>×</button>
                                        )}
                                        
                                        <div className="product-block-header">
                                            <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: 0, flex: 1 }}>
                                                <div className="form-group">
                                                    <label className="form-label">Product Type</label>
                                                    <select className="form-select" value={block.productType} onChange={(e) => handleBlockChange(block.id, 'productType', e.target.value)} required disabled={isReadOnly}>
                                                        <option value="">Select Product</option>
                                                        {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Measurement Mode</label>
                                                    <div className="toggle-container" style={{ height: '40px' }}>
                                                        <span className="toggle-label" style={{ color: block.mode === 'Pieces' ? 'var(--primary-color)' : '#94a3b8' }}>Pieces</span>
                                                        <label className="switch">
                                                            <input type="checkbox" checked={block.mode === 'Sets'} onChange={(e) => handleBlockChange(block.id, 'mode', e.target.checked ? 'Sets' : 'Pieces')} disabled={isReadOnly} />
                                                            <span className="slider"></span>
                                                        </label>
                                                        <span className="toggle-label" style={{ color: block.mode === 'Sets' ? 'var(--primary-color)' : '#94a3b8' }}>Sets</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Batch Rows */}
                                        <div style={{ marginTop: '16px' }}>
                                            {isComposite(block.productType) && !isReadOnly && (
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--primary-color)' }}>
                                                    ℹ️ <b>Note:</b> Compound A & B batches must map back to the batches logged during the mixing stage.
                                                </div>
                                            )}
                                            {block.batches.map((batch) => (
                                                <div key={batch.id} className="batch-row">
                                                    {block.batches.length > 1 && !isReadOnly && (
                                                        <button type="button" className="batch-row-remove" onClick={() => handleRemoveBatch(block.id, batch.id)}>×</button>
                                                    )}
                                                    
                                                    {isComposite(block.productType) ? (
                                                        <>
                                                            <div className="form-group">
                                                                <label className="form-label">Comp. A Batch</label>
                                                                <input type="text" className="form-input" placeholder="A-XXXX" value={batch.compoundABatchNo} onChange={(e) => handleBatchChange(block.id, batch.id, 'compoundABatchNo', e.target.value)} required disabled={isReadOnly} />
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="form-label">Comp. B Batch</label>
                                                                <input type="text" className="form-input" placeholder="B-XXXX" value={batch.compoundBBatchNo} onChange={(e) => handleBatchChange(block.id, batch.id, 'compoundBBatchNo', e.target.value)} required disabled={isReadOnly} />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="form-group">
                                                            <label className="form-label">Batch No.</label>
                                                            <input type="text" className="form-input" placeholder="Batch XXXX" value={batch.batchNo} onChange={(e) => handleBatchChange(block.id, batch.id, 'batchNo', e.target.value)} required disabled={isReadOnly} />
                                                        </div>
                                                    )}

                                                    <div className="form-group">
                                                        <label className="form-label">Initial Wt (Kg)</label>
                                                        <input type="number" step="0.01" className="form-input" placeholder="Optional" value={batch.initialWeight} onChange={(e) => handleBatchChange(block.id, batch.id, 'initialWeight', e.target.value)} disabled={isReadOnly} />
                                                    </div>
                                                    
                                                    <div className="form-group">
                                                        <label className="form-label">Final Wt (Kg)</label>
                                                        <input type="number" step="0.01" className="form-input" placeholder="Optional" value={batch.finalWeight} onChange={(e) => handleBatchChange(block.id, batch.id, 'finalWeight', e.target.value)} disabled={isReadOnly} />
                                                    </div>
                                                    
                                                    <div className="form-group">
                                                        <label className="form-label">Final Qty ({block.mode})</label>
                                                        <input type="number" className="form-input" placeholder="0" value={batch.qty} onChange={(e) => handleBatchChange(block.id, batch.id, 'qty', e.target.value)} required disabled={isReadOnly} />
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {!isReadOnly && (
                                                <button type="button" onClick={() => handleAddBatch(block.id)} style={{ background: 'transparent', border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
                                                    + Add Batch Row
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Section C: Summary */}
                            {summary.length > 0 && (
                                <div className="summary-container fade-in">
                                    <div className="summary-title">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                        Total Production Summary
                                    </div>
                                    {summary.map(([type, data]) => (
                                        <div key={type} className="summary-item">
                                            <span>{type}</span>
                                            <span style={{ fontWeight: '800' }}>{data.qty.toLocaleString()} {data.mode}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </form>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{isReadOnly ? 'Close' : 'Cancel'}</button>
                            {!isReadOnly && (
                                <button 
                                    type="submit" 
                                    form="declaration-form" 
                                    className={`btn-primary ${isSaving ? 'btn-loading' : ''}`} 
                                    style={{ padding: '8px 32px' }}
                                    disabled={isSaving}
                                >
                                    {isSaving && <div className="btn-spinner"></div>}
                                    {isSaving ? (editingId ? 'Updating...' : 'Saving...') : (editingId ? 'Update Declaration' : 'Submit Declaration')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionDeclarationDashboard;
