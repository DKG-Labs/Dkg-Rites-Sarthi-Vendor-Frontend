import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

const SearchableSelect = ({ value, onChange, options, placeholder, searchPlaceholder = "Search...", loading, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        } else {
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredOptions = useMemo(() => {
        return options.filter(opt => {
            const label = opt.label || '';
            const val = opt.value || '';
            return label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   val.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [options, searchTerm]);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <input 
                type="text" 
                value={value || ''} 
                onChange={() => {}} 
                required 
                style={{ 
                    opacity: 0, 
                    position: 'absolute', 
                    width: 0, 
                    height: 0, 
                    pointerEvents: 'none' 
                }} 
            />
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    height: '40px',
                    border: isOpen ? '1px solid var(--primary-color)' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: 'var(--fs-md)',
                    background: disabled ? '#f1f5f9' : '#fff',
                    color: selectedOption ? 'var(--text-main)' : '#94a3b8',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                }}
            >
                <span 
                    title={selectedOption ? selectedOption.label : placeholder}
                    style={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        fontWeight: selectedOption ? '600' : 'normal'
                    }}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                    style={{ 
                        transform: isOpen ? 'rotate(180deg)' : 'none', 
                        transition: 'transform 0.2s',
                        color: '#64748b',
                        flexShrink: 0
                    }}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    minWidth: '100%',
                    width: 'max-content',
                    maxWidth: '400px',
                    zIndex: 1050,
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '260px',
                    boxSizing: 'border-box',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        padding: '8px', 
                        borderBottom: '1px solid #e2e8f0', 
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#64748b' }}>
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                width: '100%',
                                outline: 'none',
                                fontSize: '13px',
                                padding: '4px 0',
                                color: 'var(--text-main)'
                            }}
                        />
                        {searchTerm && (
                            <button 
                                type="button" 
                                onClick={() => setSearchTerm('')} 
                                style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: '#64748b', 
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    padding: '0 4px'
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
                        {loading ? (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                Loading POs...
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                No POs found
                            </div>
                        ) : (
                             filteredOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    title={opt.label}
                                    style={{
                                        padding: '10px 12px',
                                        fontSize: '13px',
                                        color: opt.value === value ? '#fff' : 'var(--text-main)',
                                        background: opt.value === value ? 'var(--primary-color)' : 'transparent',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        fontWeight: opt.value === value ? '600' : 'normal',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (opt.value !== value) {
                                            e.target.style.background = '#f1f5f9';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (opt.value !== value) {
                                            e.target.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

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
    const [productionLines, setProductionLines] = useState([]);
    const [linesLoading, setLinesLoading] = useState(false);

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
                mode: 'Nos',
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

    const fetchProductionLines = async () => {
        try {
            setLinesLoading(true);
            const { plant: localPlant, user } = getLatestUserAndPlant();
            const actualPlantId = plantId || localPlant.plantId;
            
            if (!actualPlantId || actualPlantId === "1") {
                return;
            }

            const token = localStorage.getItem('authToken') || user.token;
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await fetch(`${API_CONFIG.PLANT_SETUP}/plant?plantId=${actualPlantId}`, { headers });
            if (res.ok) {
                const data = await res.json();
                
                const cleanUnitName = (name) => {
                    if (!name) return "";
                    let cleaned = name;
                    if (cleaned.startsWith(':')) {
                        cleaned = cleaned.substring(1);
                    }
                    if (cleaned.includes('/')) {
                        const parts = cleaned.split('/');
                        return parts[1];
                    }
                    return cleaned;
                };

                // Get units only from verified setups
                const verifiedStatuses = ['COMPLETED', 'VERIFIED', 'APPROVED'];
                const setups = (Array.isArray(data) ? data : []).filter(setup => 
                    setup.status && verifiedStatuses.includes(setup.status.toUpperCase())
                );
                const generatedLines = [];
                
                setups.forEach(setup => {
                    if (setup.units && Array.isArray(setup.units)) {
                        setup.units.forEach(unit => {
                            const name = cleanUnitName(unit.unitName || 'Line');
                            const num = parseInt(unit.numLines) || 0;
                            for (let i = 1; i <= num; i++) {
                                const val = `${name}- Line ${i}`;
                                if (!generatedLines.some(x => x.value === val)) {
                                    generatedLines.push({
                                        value: val,
                                        label: val
                                    });
                                }
                            }
                        });
                    }
                });

                setProductionLines(generatedLines);
            } else {
                setProductionLines([]);
            }
        } catch (error) {
            console.error('Error fetching production lines:', error);
            setProductionLines([]);
        } finally {
            setLinesLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
        fetchPOs();
        fetchProductionLines();
    }, [plantId, propVendorCode]);

    const isComposite = (type) => type?.includes('CGRSP') || type?.includes('NCRGRSP');

    const handleAddProductBlock = () => {
        setFormData(prev => ({
            ...prev,
            productBlocks: [...prev.productBlocks, {
                id: Date.now(),
                productType: '',
                mode: 'Nos',
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

    const poOptions = useMemo(() => {
        const list = pos.map(p => {
            const formattedDate = p.poDate ? p.poDate.split('-').reverse().join('-') : '';
            const label = formattedDate ? `${p.poNo} (${formattedDate})` : p.poNo;
            return { value: p.poNo, label };
        });
        
        // Add defensive fallback
        if (formData.poNo && !list.some(opt => opt.value === formData.poNo)) {
            list.push({ value: formData.poNo, label: formData.poNo });
        }
        
        return list;
    }, [pos, formData.poNo]);

    const lineOptions = useMemo(() => {
        const list = Array.isArray(productionLines) ? [...productionLines] : [];
        // Add defensive fallback
        if (formData.productionLine && !list.some(opt => opt.value === formData.productionLine)) {
            list.push({ value: formData.productionLine, label: formData.productionLine });
        }
        return list;
    }, [productionLines, formData.productionLine]);

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
                mode: p.measurementMode === 'Pieces' ? 'Nos' : (p.measurementMode || 'Nos'),
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
            {notification && createPortal(
                <div className="pv-notification-container" style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    pointerEvents: 'none'
                }}>
                    <div 
                        className={`pv-notification ${notification.type} ${notification.fading ? 'fade-out' : ''}`}
                        style={{
                            pointerEvents: 'auto',
                            minWidth: '340px',
                            maxWidth: '450px',
                            padding: '16px 20px',
                            borderRadius: '16px',
                            background: '#ffffff',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            borderLeft: `5px solid ${notification.type === 'success' ? '#21808d' : '#ef4444'}`,
                            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ fontSize: '24px', flexShrink: 0 }}>
                            {notification.type === 'success' ? '✅' : '❌'}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ 
                                display: 'block', 
                                fontWeight: '800', 
                                fontSize: '14px', 
                                color: '#1e293b',
                                lineHeight: '1.2',
                                margin: 0
                            }}>
                                {notification.type === 'success' ? 'Success' : 'Attention'}
                            </span>
                            <span style={{ 
                                display: 'block', 
                                fontSize: '13px', 
                                color: '#64748b',
                                lineHeight: '1.4',
                                fontWeight: '500',
                                margin: 0
                            }}>
                                {notification.message}
                            </span>
                        </div>
                    </div>
                </div>,
                document.body
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
                                         <SearchableSelect
                                             value={formData.productionLine}
                                             onChange={(val) => setFormData({...formData, productionLine: val})}
                                             options={lineOptions}
                                             placeholder={linesLoading ? 'Loading Lines...' : 'Select Line'}
                                             searchPlaceholder="Search Line..."
                                             loading={linesLoading}
                                             disabled={isReadOnly}
                                         />
                                     </div>
                                     <div className="form-group">
                                          <label className="form-label">PO Number</label>
                                          <SearchableSelect
                                              value={formData.poNo}
                                              onChange={(val) => setFormData({...formData, poNo: val})}
                                              options={poOptions}
                                              placeholder={posLoading ? 'Loading POs...' : 'Select PO'}
                                              searchPlaceholder="Search PO..."
                                              loading={posLoading}
                                              disabled={isReadOnly}
                                          />
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
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '24px', 
                                                        height: '40px',
                                                        boxSizing: 'border-box'
                                                    }}>
                                                        <label style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '8px', 
                                                            cursor: isReadOnly ? 'not-allowed' : 'pointer',
                                                            fontSize: 'var(--fs-md)',
                                                            color: 'var(--text-main)',
                                                            fontWeight: block.mode !== 'Sets' ? '600' : 'normal',
                                                            margin: 0
                                                        }}>
                                                            <input 
                                                                type="radio" 
                                                                name={`measurementMode-${block.id}`} 
                                                                value="Nos" 
                                                                checked={block.mode !== 'Sets'} 
                                                                onChange={() => handleBlockChange(block.id, 'mode', 'Nos')} 
                                                                disabled={isReadOnly}
                                                                style={{ 
                                                                    cursor: isReadOnly ? 'not-allowed' : 'pointer',
                                                                    width: '16px',
                                                                    height: '16px',
                                                                    accentColor: 'var(--primary-color)'
                                                                }}
                                                            />
                                                            Nos
                                                        </label>
                                                        <label style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '8px', 
                                                            cursor: isReadOnly ? 'not-allowed' : 'pointer',
                                                            fontSize: 'var(--fs-md)',
                                                            color: 'var(--text-main)',
                                                            fontWeight: block.mode === 'Sets' ? '600' : 'normal',
                                                            margin: 0
                                                        }}>
                                                            <input 
                                                                type="radio" 
                                                                name={`measurementMode-${block.id}`} 
                                                                value="Sets" 
                                                                checked={block.mode === 'Sets'} 
                                                                onChange={() => handleBlockChange(block.id, 'mode', 'Sets')} 
                                                                disabled={isReadOnly}
                                                                style={{ 
                                                                    cursor: isReadOnly ? 'not-allowed' : 'pointer',
                                                                    width: '16px',
                                                                    height: '16px',
                                                                    accentColor: 'var(--primary-color)'
                                                                }}
                                                            />
                                                            Sets
                                                        </label>
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
