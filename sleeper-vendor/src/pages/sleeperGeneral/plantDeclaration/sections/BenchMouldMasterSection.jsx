import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../../../services/api';
import './PlantDeclaration.css';

const STATUSES = {
    PENDING: 'Pending for verification',
    LOCKED: 'Verified & Locked',
    UNLOCKED: 'Unlocked for Modification'
};

const CATEGORY_HIERARCHY = {
    "Normal PSC Sleepers": {
        "Main 60 kg MNC": ["T-2496", "RT-8746"],
        "Main 52 kg MNC": ["RT-2495"],
        "Others": ["T-4912", "T-4512"]
    },
    "Special Sleepers": {
        "Turnouts, Points & Crossings": ["1 in 12 (Set): T-4218", "1 in 8.5 (Set): T-4865"],
        "Bridge Straight - Standard 60KG": ["RT-4088"],
        "Bridge Approach - Standard 60KG": ["RT-4089", "RT-4090", "RT-4091", "RT-4092", "RT-4093", "RT-4094", "RT-4095", "RT-4096", "RT-4097"]
    },
    "Wider / Heavy-Duty": {},
    "Curved Track": {}
};

const TURNOUT_SET_DATA = {
    "1 in 12 (Set): T-4218": [
        { code: "60S", drg: "T-4786" }, { code: "1AS", drg: "T-4787" }, { code: "2AS", drg: "T-4788" }, { code: "3A", drg: "T-4789" }, { code: "4A", drg: "T-4790" },
        { code: "1", drg: "T-4512" }, { code: "2", drg: "T-4513" }, { code: "3", drg: "T-4514 & T-4514A" }, { code: "4", drg: "T-4515 & T-4515A" }, { code: "5", drg: "T-4516" },
        { code: "6", drg: "T-4517" }, { code: "7", drg: "T-4518" }, { code: "8", drg: "T-4519" }, { code: "9", drg: "T-4520" }, { code: "10", drg: "T-4521" },
        { code: "11", drg: "T-4522" }, { code: "12", drg: "T-4523" }, { code: "13", drg: "T-4524" }, { code: "14", drg: "T-4525" }, { code: "15", drg: "T-4526" },
        { code: "16", drg: "T-4527" }, { code: "17", drg: "T-4528" }, { code: "18", drg: "T-4529" }, { code: "19", drg: "T-4530" }, { code: "20", drg: "T-4531" },
        { code: "21", drg: "T-4532" }, { code: "22", drg: "T-4533" }, { code: "23", drg: "T-4534" }, { code: "24", drg: "T-4535" }, { code: "25", drg: "T-4536" },
        { code: "26", drg: "T-4537" }, { code: "27", drg: "T-4538" }, { code: "28", drg: "T-4539" }, { code: "29", drg: "T-4540" }, { code: "30", drg: "T-4541" },
        { code: "31", drg: "T-4542" }, { code: "32", drg: "T-4543" }, { code: "33", drg: "T-4544" }, { code: "34", drg: "T-4545" }, { code: "35", drg: "T-4546" },
        { code: "36", drg: "T-4547" }, { code: "37", drg: "T-4548" }, { code: "38", drg: "T-4549" }, { code: "39", drg: "T-4550" }, { code: "40", drg: "T-4551" },
        { code: "41", drg: "T-4552" }, { code: "42", drg: "T-4553" }, { code: "43", drg: "T-4554" }, { code: "44", drg: "T-4555" }, { code: "45", drg: "T-4556" },
        { code: "46", drg: "T-4557" }, { code: "47", drg: "T-4558" }, { code: "48", drg: "T-4559" }, { code: "49", drg: "T-4560" }, { code: "50", drg: "T-4561" },
        { code: "51", drg: "T-4562" }, { code: "52", drg: "T-4563" }, { code: "53", drg: "T-4564" }, { code: "54", drg: "T-4565" }, { code: "55", drg: "T-4566" },
        { code: "56", drg: "T-4567" }, { code: "57", drg: "T-4568" }, { code: "58", drg: "T-4569" }, { code: "59", drg: "T-4570" }, { code: "60", drg: "T-4571" },
        { code: "61", drg: "T-4572" }, { code: "62", drg: "T-4573" }, { code: "63", drg: "T-4574" }, { code: "64", drg: "T-4575" }, { code: "65", drg: "T-4576" },
        { code: "66", drg: "T-4577" }, { code: "67", drg: "T-4578" }, { code: "68", drg: "T-4579" }, { code: "69", drg: "T-4580" }, { code: "70", drg: "T-4581" },
        { code: "71", drg: "T-4582" }, { code: "72", drg: "T-4583" }, { code: "73", drg: "T-4584" }, { code: "74", drg: "T-4585" }, { code: "75", drg: "T-4586" },
        { code: "76", drg: "T-4587" }, { code: "77", drg: "T-4588" }, { code: "78", drg: "T-4589" }, { code: "79", drg: "T-4590" }, { code: "80", drg: "T-4591" },
        { code: "81", drg: "T-4592" }, { code: "82", drg: "T-4593" }, { code: "83", drg: "T-4594" }, { code: "1E", drg: "T-5471" }, { code: "2E", drg: "T-5472" },
        { code: "3E", drg: "T-5473" }, { code: "4E", drg: "T-5474" }
    ],
    "1 in 8.5 (Set): T-4865": [
        { code: "60-S", drg: "RT-4786" }, { code: "4A", drg: "RT-4790" }, { code: "3A", drg: "RT-4789" }, { code: "2AS", drg: "RT-4788" }, { code: "1AS", drg: "RT-4787" },
        { code: "1", drg: "RT-4791" }, { code: "2", drg: "RT-4791" }, { code: "3", drg: "RT-4793" }, { code: "4", drg: "RT-4794" }, { code: "5", drg: "RT-4795" },
        { code: "6", drg: "RT-4796" }, { code: "7", drg: "RT-4797" }, { code: "8", drg: "RT-4798" }, { code: "9", drg: "RT-4799" }, { code: "10", drg: "RT-4800" },
        { code: "11", drg: "RT-4801" }, { code: "12", drg: "RT-4802" }, { code: "13", drg: "RT-4803" }, { code: "14", drg: "RT-4804" }, { code: "15", drg: "RT-4805" },
        { code: "16", drg: "RT-4806" }, { code: "17", drg: "RT-4807" }, { code: "18", drg: "RT-4808" }, { code: "19", drg: "RT-4809" }, { code: "20", drg: "RT-4810" },
        { code: "21", drg: "RT-4811" }, { code: "22", drg: "RT-4812" }, { code: "23", drg: "RT-4813" }, { code: "24", drg: "RT-4814" }, { code: "25", drg: "RT-4815" },
        { code: "26", drg: "RT-4816" }, { code: "27", drg: "RT-4817" }, { code: "28", drg: "RT-4818" }, { code: "29", drg: "RT-4819" }, { code: "30", drg: "RT-4820" },
        { code: "31", drg: "RT-4821" }, { code: "32", drg: "RT-4822" }, { code: "33", drg: "RT-4823" }, { code: "34", drg: "RT-4824" }, { code: "35", drg: "RT-4825" },
        { code: "36", drg: "RT-4826" }, { code: "37", drg: "RT-4827" }, { code: "38", drg: "RT-4828" }, { code: "39", drg: "RT-4829" }, { code: "40", drg: "RT-4830" },
        { code: "41", drg: "RT-4831" }, { code: "42", drg: "RT-4832" }, { code: "43", drg: "RT-4833" }, { code: "44", drg: "RT-4834" }, { code: "45", drg: "RT-4835" },
        { code: "46", drg: "RT-4836" }, { code: "47", drg: "RT-4837" }, { code: "48", drg: "RT-4838" }, { code: "49", drg: "RT-4839" }, { code: "50", drg: "RT-4840" },
        { code: "51", drg: "RT-4841" }, { code: "52", drg: "RT-4842" }, { code: "53", drg: "RT-4843" }, { code: "54", drg: "RT-4844" }, { code: "1E", drg: "RT-5471" },
        { code: "2E", drg: "RT-5472" }, { code: "3E", drg: "RT-5473" }, { code: "4E", drg: "RT-5474" }
    ]
};

const BenchMouldMasterSection = ({ profiles = [] }) => {
    const [loading, setLoading] = useState(false);

    const seenTypes = new Set();
    const dynamicTabs = [];

    profiles.forEach(profile => {
        if (profile.type === 'Stress Bench' && !seenTypes.has('Stress Bench')) {
            seenTypes.add('Stress Bench');
            dynamicTabs.push({ id: 'shed-1', label: 'Stress Bench', type: 'conventional', defaultMoulds: 4 });
        } else if (profile.type === 'Longline' && !seenTypes.has('Longline')) {
            seenTypes.add('Longline');
            dynamicTabs.push({ id: 'line-1', label: 'Longline', type: 'longline', defaultMoulds: 4 });
        }
    });

    const [activeTabId, setActiveTabId] = useState('');
    const [allEntries, setAllEntries] = useState([]);
    const formRef = useRef(null);

    useEffect(() => {
        fetchAllBMData();

        // Reset form selections when switching between Stress Bench and Longline, 
        // but ONLY if we are NOT in editing mode (to avoid wiping out loaded data)
        if (!formState.isEditing) {
            setFormState(prev => ({
                ...prev,
                level1: '',
                level2: '',
                level3: '',
                level4: ''
            }));
        }
    }, [activeTabId]);

    const fetchAllBMData = async () => {
        try {
            setLoading(true);
            const data = await apiService.getAllBenchMouldStressLongline();
            const flattened = [];
            
            data.forEach(master => {
                const plantTypeLabel = master.plantType === 'STRESS' ? 'Stress Bench' : 'Longline';
                master.details.forEach(detail => {
                    const isRange = detail.declarationMode?.toUpperCase() === 'RANGE';
                    const start = detail.benchFrom || detail.gangFrom || 0;
                    const end = detail.benchTo || detail.gangTo || 0;
                    const count = isRange ? (Math.max(0, Math.abs(end - start)) + 1) : 1;

                    flattened.push({
                        id: detail.id,
                        masterId: master.id,
                        plantType: plantTypeLabel,
                        category: master.category,
                        subCategory: master.subCategory,
                        drawingNo: master.drawingNo,
                        sleeperCode: detail.sleeperCode,
                        sleeperDrawingNo: detail.sleeperDrawingNo,
                        entryMode: detail.declarationMode?.toLowerCase() || 'single',
                        fromNo: detail.benchFrom || detail.gangFrom || '',
                        toNo: detail.benchTo || detail.gangTo || '',
                        singleNo: detail.benchNumber || detail.gangNumber || '',
                        numMouldsPerItem: detail.noOfMoulds || 0,
                        count: count,
                        totalMouldsRow: count * (detail.noOfMoulds || 0),
                        status: STATUSES.PENDING
                    });
                });
            });
            
            setAllEntries(flattened);
        } catch (error) {
            console.error('Error fetching unified BM data:', error);
        } finally {
            setLoading(false);
        }
    };

    const [formState, setFormState] = useState({
        level1: '',
        level2: '',
        level3: '',
        level4: '',
        entryMode: 'single',
        singleNo: '',
        fromNo: '',
        toNo: '',
        numMouldsPerItem: '',
        isEditing: false,
        editingId: null,
        editingDetailId: null
    });

    const [turnoutRows, setTurnoutRows] = useState([]);
    const [bulkState, setBulkState] = useState({ mode: 'single', bench: '', moulds: '' });

    useEffect(() => {
        // Skip initialization if we are in editing mode and already have data (likely loaded via handleModify)
        if (formState.isEditing && turnoutRows.length > 0 && turnoutRows.some(r => r.dbId)) {
            return;
        }

        if (TURNOUT_SET_DATA[formState.level3]) {
            const initialRows = TURNOUT_SET_DATA[formState.level3].map((item, idx) => ({
                id: idx,
                sleeperCode: item.code,
                drawingNo: item.drg,
                mode: 'single',
                benchNo: '',
                fromNo: '',
                toNo: '',
                moulds: '',
                checked: false
            }));
            setTurnoutRows(initialRows);
            setFormState(prev => ({ ...prev, level4: formState.level3 }));
        } else {
            setTurnoutRows([]);
        }
    }, [formState.level3]);

    const handleBulkApply = () => {
        setTurnoutRows(prev => prev.map(row => ({
            ...row,
            mode: bulkState.mode,
            benchNo: bulkState.mode === 'single' ? bulkState.bench : '',
            fromNo: bulkState.mode === 'range' ? bulkState.bench : '',
            toNo: bulkState.mode === 'range' ? bulkState.bench : '',
            moulds: bulkState.moulds
        })));
    };

    const handleSelectAll = () => {
        const anyUnchecked = turnoutRows.some(r => !r.checked);
        setTurnoutRows(prev => prev.map(r => ({ ...r, checked: anyUnchecked })));
    };

    const handleTurnoutRowChange = (id, field, value) => {
        setTurnoutRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const handleAddTurnoutToMaster = async () => {
        const checkedRows = turnoutRows.filter(r => r.checked);
        if (checkedRows.length === 0) { alert('No rows selected'); return; }
        await handleProfessionalDynamicSave(checkedRows);
    };

    useEffect(() => {
        const l2Options = Object.keys(CATEGORY_HIERARCHY[formState.level1] || {});
        // If current level2 is not valid for new level1, reset it to empty
        if (formState.level1 && !l2Options.includes(formState.level2)) {
            setFormState(prev => ({ ...prev, level2: '', level3: '', level4: '' }));
        }
        if (!formState.level1) {
            setFormState(prev => ({ ...prev, level2: '', level3: '', level4: '' }));
        }
    }, [formState.level1]);

    useEffect(() => {
        const l3Options = CATEGORY_HIERARCHY[formState.level1]?.[formState.level2] || [];
        if (formState.level2 && !l3Options.includes(formState.level3)) {
            setFormState(prev => ({ ...prev, level3: '', level4: '' }));
        }
        if (!formState.level2) {
            setFormState(prev => ({ ...prev, level3: '', level4: '' }));
        }
    }, [formState.level2]);

    useEffect(() => {
        setFormState(prev => ({ ...prev, level4: formState.level3 }));
    }, [formState.level3]);

    useEffect(() => {
        if (!activeTabId && dynamicTabs.length > 0) setActiveTabId(dynamicTabs[0].id);
    }, [dynamicTabs]);

    const handleSave = async () => {
        const item = {
            sleeperDrawingNo: formState.level4,
            mode: formState.entryMode,
            benchNo: formState.singleNo,
            fromNo: formState.fromNo,
            toNo: formState.toNo,
            moulds: formState.numMouldsPerItem
        };
        await handleProfessionalDynamicSave([item]);
    };

    const handleDelete = async (id, status) => {
        if (status === STATUSES.LOCKED) return;
        if (!window.confirm('Are you sure you want to delete this entry?')) return;

        try {
            setLoading(true);
            await apiService.deleteBenchMouldStressLongline(id);
            alert('Selection deleted successfully');
            await fetchAllBMData();
        } catch (err) {
            alert('Error deleting entry: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleModify = async (id) => {
        try {
            setLoading(true);
            const master = await apiService.getBenchMouldStressLonglineById(id);
            if (!master) throw new Error('Could not fetch record details');

            // 1. Determine which tab to switch to
            const targetTab = master.plantType === 'STRESS' ? 'shed-1' : 'line-1';
            
            // 2. Set active tab (triggers reset effect, but we check isEditing there)
            setActiveTabId(targetTab);

            // 3. Populate form state
            setFormState({
                level1: master.category || '',
                level2: master.subCategory || '',
                level3: master.drawingNo || '',
                level4: master.drawingNo || '',
                entryMode: master.details?.[0]?.declarationMode?.toLowerCase() || 'single',
                singleNo: master.details?.[0]?.benchNumber || master.details?.[0]?.gangNumber || '',
                fromNo: (master.details?.[0]?.benchFrom !== undefined && master.details[0].benchFrom !== null ? master.details[0].benchFrom : master.details?.[0]?.gangFrom) || '',
                toNo: (master.details?.[0]?.benchTo !== undefined && master.details[0].benchTo !== null ? master.details[0].benchTo : master.details?.[0]?.gangTo) || '',
                numMouldsPerItem: master.details?.[0]?.noOfMoulds || '',
                isEditing: true,
                editingId: master.id,
                editingDetailId: master.details?.[0]?.id || null
            });

            // 4. If it's a turnout (multiple details or turnout drawing), populate full turnoutRows
            const isTurnout = master.drawingNo?.includes('Set') && TURNOUT_SET_DATA[master.drawingNo];
            if (isTurnout) {
                const allPossibleRows = TURNOUT_SET_DATA[master.drawingNo].map((item, idx) => {
                    const existing = (master.details || []).find(d => 
                        d.sleeperCode === item.code || d.sleeperDrawingNo === item.drg
                    );
                    
                    return {
                        id: idx,
                        dbId: existing?.id || null,
                        sleeperCode: item.code,
                        drawingNo: item.drg,
                        mode: existing?.declarationMode?.toLowerCase() || 'single',
                        benchNo: existing?.benchNumber || existing?.gangNumber || '',
                        fromNo: (existing?.benchFrom !== undefined && existing.benchFrom !== null ? existing.benchFrom : existing?.gangFrom) || '',
                        toNo: (existing?.benchTo !== undefined && existing.benchTo !== null ? existing.benchTo : existing?.gangTo) || '',
                        moulds: existing?.noOfMoulds || '',
                        checked: !!existing
                    };
                });
                setTurnoutRows(allPossibleRows);
            } else if (master.details && master.details.length > 1) {
                const rows = master.details.map((d, idx) => ({
                    id: idx,
                    dbId: d.id, // Keep original DB ID for update
                    sleeperCode: d.sleeperCode,
                    drawingNo: d.sleeperDrawingNo,
                    mode: d.declarationMode?.toLowerCase() || 'single',
                    benchNo: d.benchNumber || d.gangNumber || '',
                    fromNo: d.benchFrom || d.gangFrom || '',
                    toNo: d.benchTo || d.gangTo || '',
                    moulds: d.noOfMoulds,
                    checked: true
                }));
                setTurnoutRows(rows);
            }

            // Scroll to form
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
            alert('Error loading entry: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const currentEntries = allEntries;
    const totalItems = currentEntries.reduce((acc, c) => acc + (c.count || 0), 0);
    const totalMoulds = currentEntries.reduce((acc, c) => acc + (c.totalMouldsRow || 0), 0);

    const findHierarchy = (drawingNo) => {
        if (!drawingNo) return { category: 'Normal PSC Sleepers', subCategory: 'General' };

        // First check standard hierarchy (exact match)
        for (const [category, subs] of Object.entries(CATEGORY_HIERARCHY)) {
            for (const [subCategory, drawings] of Object.entries(subs)) {
                if (drawings.includes(drawingNo)) {
                    return { category, subCategory };
                }
            }
        }

        // If not found, try extracting DRG from "CODE (DRG)" or "NAME: DRG" formats
        let drgToMatch = drawingNo;
        // Case 1: "60S (T-4786)"
        const parenMatch = drawingNo.match(/\((.*?)\)/);
        if (parenMatch) {
            drgToMatch = parenMatch[1];
        } else if (drawingNo.includes(':')) {
            // Case 2: "1 in 12 (Set): T-4218" -> extract "T-4218"
            drgToMatch = drawingNo.split(':').pop().trim();
        }

        // Re-check standard hierarchy with extracted DRG
        for (const [category, subs] of Object.entries(CATEGORY_HIERARCHY)) {
            for (const [subCategory, drawings] of Object.entries(subs)) {
                if (drawings.some(d => d.includes(drgToMatch))) {
                    return { category, subCategory };
                }
            }
        }

        // Check turnout components
        for (const [setName, components] of Object.entries(TURNOUT_SET_DATA)) {
            if (components.some(c => c.drg === drgToMatch || c.drg === drawingNo)) {
                return { category: 'Special Sleepers', subCategory: 'Turnouts, Points & Crossings' };
            }
        }

        return { category: 'Normal PSC Sleepers', subCategory: 'General' };
    };

    const formatMasterDrawing = (drg) => {
        if (!drg) return '';
        return drg.replace("(Set)", "").replace(":", "").replace(/\s+/g, ' ').trim();
    };

    const formatCategoryDisplay = (cat) => {
        if (!cat) return '';
        if (cat.includes('/')) return cat;

        const match = cat.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
            const code = match[1].trim();
            const drg = match[2].trim();

            for (const [setName, components] of Object.entries(TURNOUT_SET_DATA)) {
                if (components.some(c => c.code === code || c.drg === drg)) {
                    const setParts = setName.split(':');
                    const name = setParts[0].replace("(Set)", "").trim();
                    const sDrg = setParts[1] ? setParts[1].trim() : "";
                    return `${code}/${drg}/ ${name} ( ${sDrg})`;
                }
            }
        }
        return cat;
    };

    // ==========================================
    // PROFESSIONAL DYNAMIC API INTEGRATION
    // ==========================================
    const handleProfessionalDynamicSave = async (items) => {
        const isLongLine = activeTabId === 'line-1';
        const isTurnout = formState.level3?.includes('Set');
        
        const userId = sessionStorage.getItem('userId') || 0;
        const vendorCode = sessionStorage.getItem('vendorCode');
        const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
        const plantId = selectedPlant ? selectedPlant.plantId : '';

        try {
            setLoading(true);
            const payload = {
                plantType: isLongLine ? "LONG_LINE" : "STRESS",
                category: formState.level1 || "",
                subCategory: formState.level2 || "",
                drawingNo: formState.level3 || "",
                createdBy: userId,
                vendorCode: vendorCode,
                plantId: plantId,
                details: items.map(item => {
                    const modeValue = (item.mode || formState.entryMode || "single").toLowerCase();
                    const isR = modeValue === 'range';
                    const isS = modeValue === 'single';
                    
                    // Extract numeric values strictly based on mode
                    const fNo = isR ? (parseInt(item.fromNo || formState.fromNo) || 0) : null;
                    const tNo = isR ? (parseInt(item.toNo || formState.toNo) || 0) : null;
                    const bNo = isS ? (parseInt(item.benchNo || item.singleNo || formState.singleNo) || 0) : null;
                    const mCount = parseInt(item.moulds || formState.numMouldsPerItem) || 0;

                    // Only use editingDetailId for non-turnout records where we conceptually have one detail
                    const detail = {
                        id: (isTurnout ? item.dbId : (item.dbId || formState.editingDetailId)) || 0,
                        sleeperCode: item.sleeperCode || "",
                        sleeperDrawingNo: item.sleeperDrawingNo || item.drawingNo || formState.level4 || "",
                        declarationMode: modeValue.toUpperCase(),
                        // Stress Bench fields: numeric only for STRESS and correct mode
                        benchFrom: !isLongLine ? fNo : null,
                        benchTo: !isLongLine ? tNo : null,
                        benchNumber: !isLongLine ? bNo : null,
                        // Longline fields: numeric only for LONG_LINE and correct mode
                        gangFrom: isLongLine ? fNo : 0, 
                        gangTo: isLongLine ? tNo : 0,
                        gangNumber: isLongLine ? bNo : 0,
                        noOfMoulds: mCount
                    };

                    console.log('Constructed Payload Segment:', detail);
                    return detail;
                })
            };

            if (formState.isEditing && formState.editingId) {
                await apiService.updateBenchMouldStressLongline(formState.editingId, payload);
            } else {
                await apiService.saveBenchMouldStressLongline(payload);
            }
            
            // Refresh grid data
            await fetchAllBMData();

            // Success feedback and reset
            if (items.length === 1 || formState.isEditing) {
                setFormState(prev => ({ 
                    ...prev, 
                    isEditing: false, 
                    singleNo: '', 
                    fromNo: '', 
                    toNo: '', 
                    numMouldsPerItem: '',
                    editingId: null,
                    editingDetailId: null 
                }));
            }
            alert(formState.isEditing ? 'Entry modified successfully' : 'Selection added successfully via Professional Dynamic API');
        } catch (error) {
            console.error('Professional API Error:', error);
            alert('Integration error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bench-mould-container">
            {loading && <div className="loading-overlay"><div className="spinner"></div></div>}

            <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>Bench / Mould Master Declaration</h3>

            <div className="summary-grid">
                <div className="summary-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="label">Plant Type</div>
                        <div style={{ background: 'rgba(33, 128, 141, 0.1)', padding: '8px', borderRadius: '10px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#21808d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                        </div>
                    </div>
                    <select className="plant-type-select" value={activeTabId} onChange={(e) => setActiveTabId(e.target.value)}>
                        {dynamicTabs.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                </div>
                <div className="summary-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="label">Benches / Gangs Declared</div>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                        </div>
                    </div>
                    <div className="value">{totalItems}</div>
                </div>
                <div className="summary-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="label">Total Moulds</div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                        </div>
                    </div>
                    <div className="value">{totalMoulds}</div>
                </div>
            </div>

            <div className="form-section-card" ref={formRef}>
                <h4 className="form-title-h4">
                    {formState.isEditing ? 'Modify Existing Entry' : `New ${activeTabId === 'line-1' ? 'Gang' : 'Bench'} Declaration`}
                </h4>

                {/* Step 1 */}
                <div className="step-indicator-wrapper">
                    <div className="step-circle green">1</div>
                    <div className="step-text">Select sleeper type</div>
                </div>

                <div className="row-grid-3">
                    <div>
                        <label className="input-label">Category</label>
                        <div className="select-wrapper">
                            <select className="image-style-select" value={formState.level1} onChange={(e) => setFormState(prev => ({ ...prev, level1: e.target.value }))}>
                                <option value="">Select Category</option>
                                {Object.keys(CATEGORY_HIERARCHY)
                                    .filter(k => activeTabId !== 'line-1' || k === "Normal PSC Sleepers")
                                    .map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Sub-category</label>
                        <div className="select-wrapper">
                            <select className="image-style-select" value={formState.level2} onChange={(e) => setFormState(prev => ({ ...prev, level2: e.target.value }))}>
                                <option value="">Select Sub-category</option>
                                {Object.keys(CATEGORY_HIERARCHY[formState.level1] || {})
                                    .filter(k => k !== "Others")
                                    .map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Drawing No.</label>
                        <div className="select-wrapper">
                            <select className="image-style-select" value={formState.level3} onChange={(e) => setFormState(prev => ({ ...prev, level3: e.target.value }))}>
                                <option value="">Select Drawing No.</option>
                                {(CATEGORY_HIERARCHY[formState.level1]?.[formState.level2] || []).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="section-divider"></div>

                {/* Step 2 */}
                <div className="step-indicator-wrapper">
                    <div className="step-circle blue">2</div>
                    <div className="step-text">
                        {turnoutRows.length > 0 ? `Level 4 - declare bench against each sleeper type` : `Level 4 - confirm drawing & declare ${activeTabId === 'line-1' ? 'gang' : 'bench'}`}
                    </div>
                </div>

                {turnoutRows.length > 0 ? (
                    <div className="turnout-declaration-area">
                        <div className="turnout-info-bar">
                            {formState.level3.split(':')[1]?.trim()} — {turnoutRows.length} sleeper types.
                        </div>

                        <div className="turnout-table-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Sleeper code</th>
                                        <th>Drawing no.</th>
                                        <th>Declaration Mode</th>
                                        <th>Bench no(s).</th>
                                        <th>No. of Moulds</th>
                                        <th style={{ textAlign: 'center' }}>ADD</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {turnoutRows.map((row, idx) => (
                                        <tr key={row.id}>
                                            <td>{idx + 1}</td>
                                            <td style={{ fontWeight: '600' }}>{row.sleeperCode}</td>
                                            <td>{row.drawingNo}</td>
                                            <td>
                                                <div className="radio-group-table">
                                                    <label className="radio-item-table">
                                                        <input
                                                            type="radio"
                                                            checked={row.mode === 'single'}
                                                            onChange={() => handleTurnoutRowChange(row.id, 'mode', 'single')}
                                                        />
                                                        Single
                                                    </label>
                                                    <label className="radio-item-table">
                                                        <input
                                                            type="radio"
                                                            checked={row.mode === 'range'}
                                                            onChange={() => handleTurnoutRowChange(row.id, 'mode', 'range')}
                                                        />
                                                        Range
                                                    </label>
                                                </div>
                                            </td>
                                            <td>
                                                {row.mode === 'single' ? (
                                                    <input type="number" className="mini-input" value={row.benchNo} onChange={e => handleTurnoutRowChange(row.id, 'benchNo', e.target.value)} />
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <input type="number" className="mini-input" value={row.fromNo} onChange={e => handleTurnoutRowChange(row.id, 'fromNo', e.target.value)} />
                                                        <input type="number" className="mini-input" value={row.toNo} onChange={e => handleTurnoutRowChange(row.id, 'toNo', e.target.value)} />
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <input type="number" className="mini-input" value={row.moulds} onChange={e => handleTurnoutRowChange(row.id, 'moulds', e.target.value)} />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    className={`plus-toggle-btn ${row.checked ? 'active' : ''}`}
                                                    onClick={() => handleTurnoutRowChange(row.id, 'checked', !row.checked)}
                                                >
                                                    +
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button className="add-checked-master-btn" onClick={handleAddTurnoutToMaster} disabled={loading}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            {formState.isEditing ? 'Modify existing entry' : 'Add new entry'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="row-grid-mixed">
                            <div>
                                <label className="input-label">Drawing No.</label>
                                <div className="select-wrapper">
                                    <select
                                        className="image-style-select"
                                        disabled
                                        value={formState.level4}
                                        onChange={(e) => setFormState(prev => ({ ...prev, level4: e.target.value }))}
                                    >
                                        {(CATEGORY_HIERARCHY[formState.level1]?.[formState.level2] || []).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Declaration Mode</label>
                                <div className="radio-group">
                                    <label className="radio-item">
                                        <input type="radio" checked={formState.entryMode === 'single'} onChange={() => setFormState(prev => ({ ...prev, entryMode: 'single' }))} />
                                        Single
                                    </label>
                                    <label className="radio-item">
                                        <input type="radio" checked={formState.entryMode === 'range'} onChange={() => setFormState(prev => ({ ...prev, entryMode: 'range' }))} />
                                        Range
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="input-label">{activeTabId === 'line-1' ? 'Gang' : 'Bench'} Number</label>
                                {formState.entryMode === 'single' ? (
                                    <input type="number" className="image-style-input" value={formState.singleNo} onChange={(e) => setFormState(prev => ({ ...prev, singleNo: e.target.value }))} />
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="number" className="image-style-input" value={formState.fromNo} onChange={(e) => setFormState(prev => ({ ...prev, fromNo: e.target.value }))} />
                                        <input type="number" className="image-style-input" value={formState.toNo} onChange={(e) => setFormState(prev => ({ ...prev, toNo: e.target.value }))} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="input-label">No. of Moulds per {activeTabId === 'line-1' ? 'Gang' : 'Bench'}</label>
                                <input type="number" className="image-style-input" value={formState.numMouldsPerItem} onChange={(e) => setFormState(prev => ({ ...prev, numMouldsPerItem: e.target.value }))} />
                            </div>
                        </div>

                        <button className="add-master-btn" onClick={handleSave} disabled={loading}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            {formState.isEditing ? 'Modify existing entry' : 'Add new entry'}
                        </button>
                    </>
                )}

            </div>

            <div style={{ background: '#fff', padding: '32px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h4 className="form-title-h4" style={{ margin: 0 }}>
                        Master Declaration Grid
                    </h4>
                    <div style={{ background: '#f8fafc', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        {currentEntries.length} Entries Found
                    </div>
                </div>

                <div className="table-container" style={{ marginTop: 0 }}>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Plant Type</th>
                                <th>Category</th>
                                <th>drawingNo / sleeperCode / sleeperDrawingNo</th>
                                <th>Bench/Gang No(s).</th>
                                <th>No. of Moulds</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentEntries.length > 0 ? currentEntries.map((e, idx) => {
                                const { category, subCategory } = findHierarchy(e.drawingNo);
                                const isSpecial = category === 'Special Sleepers';

                                return (
                                    <tr key={`${e.id}-${idx}`} className={isSpecial ? 'special-sleeper-row' : ''}>
                                        <td>{idx + 1}</td>
                                        <td style={{ fontWeight: '500', color: '#64748b' }}>{e.plantType}</td>
                                        <td>{category}</td>
                                        <td style={{ fontWeight: '600' }}>
                                            {`${formatMasterDrawing(e.drawingNo)} / ${e.sleeperCode || 'N/A'} / ${e.sleeperDrawingNo || 'N/A'}`}
                                        </td>
                                        <td>{e.entryMode === 'range' ? `${e.fromNo}-${e.toNo}` : (e.singleNo || e.fromNo)}</td>
                                        <td>{e.numMouldsPerItem}</td>
                                        <td><span className={`status-badge ${e.status === STATUSES.LOCKED ? 'status-locked' : 'status-pending'}`}>{e.status}</span></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button 
                                                    className="btn-outline" 
                                                    style={{ padding: '6px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                    onClick={() => handleModify(e.masterId)}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                    Modify
                                                </button>
                                                <button
                                                    className="btn-delete-master"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '4px',
                                                        padding: '6px 12px', fontSize: '11px', color: '#ef4444',
                                                        border: '1px solid #fee2e2', background: '#fef2f2',
                                                        borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                    onClick={() => handleDelete(e.masterId, e.status)}
                                                    disabled={e.status === STATUSES.LOCKED}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                    </svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No entries found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BenchMouldMasterSection;
