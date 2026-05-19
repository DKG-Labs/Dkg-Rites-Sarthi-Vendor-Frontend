import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { apiService } from '../../../services/api';

const InventoryForm = ({ material, onClose, onSubmit, initialData }) => {
    const formatDateForBackend = (dateStr) => {
        if (!dateStr) return null;
        // Handle yyyy-MM-dd from input
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 4) {
                const [year, month, day] = parts;
                return `${day}/${month}/${year}`;
            }
            // Handle dd-MM-yyyy
            const [day, month, year] = parts;
            return `${day}/${month}/${year}`;
        }
        // If already has slashes, ensure it's dd/MM/yyyy
        return dateStr.replace(/-/g, '/');
    };

    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) return dateStr;

        // Handle dd/MM/yyyy or dd-MM-yyyy
        const separator = dateStr.includes('/') ? '/' : '-';
        const parts = dateStr.split(separator);
        if (parts.length === 3) {
            const [day, month, year] = parts;
            // Check if it's dd-MM-yyyy or dd/MM/yyyy
            if (day.length === 2 && year.length === 4) {
                return `${year}-${month}-${day}`;
            }
        }
        return dateStr;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(() => {
        if (initialData) {
            const base = {
                date: formatDateForInput(initialData.dateOfReceipt || initialData.date),
                qty: initialData.totalQtyReceived || initialData.totalQuantity || initialData.qty,
                details: { ...initialData.details }
            };

            // Map backend fields back to form details context
            if (material.id === 'hts-wire') {
                base.details = {
                    ...base.details,
                    grade: initialData.gradeSpec || base.details.grade,
                    manufacturer: initialData.manufacturer || base.details.manufacturer,
                    invoiceNo: initialData.invoiceNumber || base.details.invoiceNo,
                    invoiceDate: formatDateForInput(initialData.invoiceDate),
                    icNo: initialData.ritesIcNumber || base.details.icNo,
                    icDate: formatDateForInput(initialData.ritesIcDate),
                    relaxationTest: initialData.relaxationTest === 'Yes' ? 'Y' : (initialData.relaxationTest === 'No' ? 'N' : base.details.relaxationTest),
                    relaxationDate: formatDateForInput(initialData.relaxationTestDate),
                    coilEntries: initialData.coilDetails?.map(c => ({
                        type: c.entryType?.toLowerCase(),
                        coilFrom: c.coilFrom,
                        coilTo: c.coilTo,
                        coilNo: c.coilNo,
                        lotNo: c.lotNo,
                        qty: c.qtyKg
                    })) || base.details.coilEntries || []
                };
            } else if (material.id === 'cement') {
                base.details = {
                    ...base.details,
                    grade: initialData.gradeSpec || base.details.grade,
                    manufacturer: initialData.manufacturer || base.details.manufacturer,
                    ewayBillNo: initialData.invoiceNumber || base.details.ewayBillNo,
                    ewayDate: formatDateForInput(initialData.invoiceDate),
                    batches: initialData.batchDetails?.map(b => ({
                        week: b.weekNo,
                        year: b.yearNo,
                        mtcNo: b.mtcNo,
                        quantity: b.quantityKg
                    })) || base.details.batches || []
                };
            } else if (material.id === 'dowel') {
                base.details = {
                    ...base.details,
                    grade: initialData.gradeType || base.details.grade,
                    manufacturer: initialData.manufacturer || base.details.manufacturer,
                    ewayBillNo: initialData.invoiceNumber || base.details.ewayBillNo,
                    ewayDate: formatDateForInput(initialData.invoiceDate),
                    icNo: initialData.ritesIcNumber || base.details.icNo,
                    icDate: formatDateForInput(initialData.ritesIcDate)
                };
            } else if (material.id === 'aggregates') {
                base.details = {
                    ...base.details,
                    type: initialData.gradeSpec || base.details.type,
                    source: initialData.source || base.details.source,
                    challanNo: initialData.challanNumber || base.details.challanNo,
                    challanDate: formatDateForInput(initialData.challanDate)
                };
            } else if (material.id === 'admixture') {
                base.details = {
                    ...base.details,
                    grade: initialData.gradeSpec || base.details.grade,
                    manufacturer: initialData.manufacturer || base.details.manufacturer,
                    ewayBillNo: initialData.invoiceNumber || base.details.ewayBillNo,
                    ewayDate: formatDateForInput(initialData.invoiceDate),
                    lotNo: initialData.lotNo || base.details.lotNo,
                    mtcNo: initialData.mtcNo || base.details.mtcNo
                };
            } else if (material.id === 'sgci-insert') {
                base.details = {
                    ...base.details,
                    grade: initialData.gradeType || base.details.grade,
                    manufacturer: initialData.manufacturer || base.details.manufacturer,
                    ewayBillNo: initialData.invoiceNumber || base.details.ewayBillNo,
                    ewayDate: formatDateForInput(initialData.invoiceDate),
                    icNo: initialData.ritesIcNumber || base.details.icNo,
                    icDate: formatDateForInput(initialData.ritesIcDate)
                };
            }
            return base;
        }

        const base = {
            date: new Date().toISOString().split('T')[0],
            qty: '',
            details: {}
        };

        switch (material.id) {
            case 'hts-wire':
                base.details = {
                    grade: '3ply 3mm',
                    manufacturer: 'Tata Steel',
                    invoiceNo: '',
                    invoiceDate: '',
                    relaxationTest: 'Y',
                    // coilEntries: array of { type: 'range'|'single', coilFrom, coilTo, coilNo, lotNo, qty }
                    coilEntries: [],
                    // temporary input state
                    _inputMode: 'range',
                    _rangeFrom: '',
                    _rangeTo: '',
                    _singleCoil: '',
                    _lotNo: '',
                    _qty: ''
                };
                break;
            case 'cement':
                base.details = {
                    grade: 'OPC 53',
                    manufacturer: '',
                    ewayBillNo: '',
                    ewayDate: '',
                    batches: [{ week: '', year: new Date().getFullYear(), mtcNo: '', quantity: '' }]
                };
                break;
            case 'aggregates':
                base.details = {
                    type: 'CA1',
                    source: '',
                    challanNo: '',
                    challanDate: new Date().toISOString().split('T')[0]
                };
                break;
            case 'admixture':
                base.details = {
                    manufacturer: '',
                    grade: 'Type 1',
                    ewayBillNo: '',
                    ewayDate: new Date().toISOString().split('T')[0],
                    lotNo: '',
                    mtcNo: ''
                };
                break;
            case 'sgci-insert':
                base.details = {
                    grade: 'T-6901',
                    manufacturer: 'Adianth',
                    ewayBillNo: '',
                    ewayDate: new Date().toISOString().split('T')[0],
                    icNo: '',
                    icDate: new Date().toISOString().split('T')[0]
                };
                break;
            case 'dowel':
                base.details = {
                    grade: 'Type A',
                    manufacturer: 'Manufacturer 1',
                    ewayBillNo: '',
                    ewayDate: new Date().toISOString().split('T')[0],
                    icNo: '',
                    icDate: new Date().toISOString().split('T')[0]
                };
                break;
            default:
                break;
        }
        return base;
    });

    useEffect(() => {
        if (initialData) {
            const base = {
                date: formatDateForInput(initialData.dateOfReceipt || initialData.date),
                qty: initialData.totalQtyReceived || initialData.totalQuantity || initialData.qty,
                details: { ...initialData.details }
            };

            if (material.id === 'hts-wire') {
                base.details = {
                    ...base.details,
                    grade: initialData.gradeSpec,
                    manufacturer: initialData.manufacturer,
                    invoiceNo: initialData.invoiceNumber,
                    invoiceDate: formatDateForInput(initialData.invoiceDate),
                    icNo: initialData.ritesIcNumber,
                    icDate: formatDateForInput(initialData.ritesIcDate),
                    relaxationTest: initialData.relaxationTest === 'Yes' ? 'Y' : 'N',
                    relaxationDate: formatDateForInput(initialData.relaxationTestDate),
                    coilEntries: initialData.coilDetails?.map(c => ({
                        type: c.entryType?.toLowerCase(),
                        coilFrom: c.coilFrom,
                        coilTo: c.coilTo,
                        coilNo: c.coilNo,
                        lotNo: c.lotNo,
                        qty: c.qtyKg
                    })) || []
                };
            } else if (material.id === 'cement') {
                base.details = {
                    ...base.details,
                    grade: initialData.gradeSpec,
                    manufacturer: initialData.manufacturer,
                    ewayBillNo: initialData.invoiceNumber,
                    ewayDate: formatDateForInput(initialData.invoiceDate),
                    batches: initialData.batchDetails?.map(b => ({
                        week: b.weekNo,
                        year: b.yearNo,
                        mtcNo: b.mtcNo,
                        quantity: b.quantityKg
                    })) || []
                };
            } else if (material.id === 'dowel') {
                base.details = {
                    ...base.details,
                    grade: initialData.gradeType,
                    manufacturer: initialData.manufacturer,
                    ewayBillNo: initialData.invoiceNumber,
                    ewayDate: formatDateForInput(initialData.invoiceDate),
                    icNo: initialData.ritesIcNumber,
                    icDate: formatDateForInput(initialData.ritesIcDate)
                };
            } else if (material.id === 'aggregates') {
                base.details = {
                    ...base.details,
                    type: initialData.gradeSpec,
                    source: initialData.source,
                    challanNo: initialData.challanNumber,
                    challanDate: formatDateForInput(initialData.challanDate)
                };
            } else if (material.id === 'admixture') {
                base.details = {
                    ...base.details,
                    grade: initialData.gradeSpec,
                    manufacturer: initialData.manufacturer,
                    ewayBillNo: initialData.invoiceNumber,
                    ewayDate: formatDateForInput(initialData.invoiceDate),
                    lotNo: initialData.lotNo,
                    mtcNo: initialData.mtcNo
                };
            } else if (material.id === 'sgci-insert') {
                base.details = {
                    ...base.details,
                    grade: initialData.gradeType,
                    manufacturer: initialData.manufacturer,
                    ewayBillNo: initialData.invoiceNumber,
                    ewayDate: formatDateForInput(initialData.invoiceDate),
                    icNo: initialData.ritesIcNumber,
                    icDate: formatDateForInput(initialData.ritesIcDate)
                };
            }
            setFormData(base);
        }
    }, [initialData, material.id]);

    const handleChange = (e, field, isDetail = false) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        if (isDetail) {
            setFormData({
                ...formData,
                details: { ...formData.details, [field]: value }
            });
        } else {
            setFormData({ ...formData, [field]: value });
        }
    };

    const calculateAge = (receiptDateStr, mfgWeek, mfgYear) => {
        if (!mfgWeek || !mfgYear || !receiptDateStr) return '0';
        try {
            const receiptDate = new Date(receiptDateStr);
            const mfgDate = new Date(mfgYear, 0, 1 + (mfgWeek - 1) * 7);
            const diffTime = Math.abs(receiptDate - mfgDate);
            const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
            if (mfgDate > receiptDate) return '0.0';
            return diffMonths.toFixed(1);
        } catch (e) {
            return '0';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        const userId = sessionStorage.getItem('userId') || 0;
        const vendorCode = sessionStorage.getItem('vendorCode');
        const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
        const plantId = selectedPlant ? selectedPlant.plantId : '';

        const finalDetails = { ...formData.details };

        try {
            if (material.id === 'hts-wire') {
                // Auto-include pending coil entry if fields are filled but not "Added"
                let currentCoilEntries = [...(finalDetails.coilEntries || [])];
                const rangeFrom = finalDetails._rangeFrom;
                const rangeTo = finalDetails._rangeTo;
                const singleCoil = finalDetails._singleCoil;
                const entryLotNo = finalDetails._lotNo;
                const entryQty = finalDetails._qty;
                const inputMode = finalDetails._inputMode || 'range';

                const canAddPending = inputMode === 'range'
                    ? (rangeFrom && rangeTo && parseInt(rangeTo) >= parseInt(rangeFrom) && entryLotNo && entryQty)
                    : (singleCoil && entryLotNo && entryQty);

                if (canAddPending) {
                    const pendingEntry = inputMode === 'range'
                        ? { type: 'range', coilFrom: rangeFrom, coilTo: rangeTo, lotNo: entryLotNo, qty: entryQty }
                        : { type: 'single', coilNo: singleCoil, lotNo: entryLotNo, qty: entryQty };
                    currentCoilEntries.push(pendingEntry);
                }

                const payload = {
                    id: initialData?.id,
                    dateOfReceipt: formatDateForBackend(formData.date),
                    gradeSpec: finalDetails.grade,
                    manufacturer: finalDetails.manufacturer,
                    invoiceNumber: finalDetails.invoiceNo,
                    invoiceDate: formatDateForBackend(finalDetails.invoiceDate),
                    ritesIcNumber: finalDetails.icNo,
                    ritesIcDate: formatDateForBackend(finalDetails.icDate),
                    relaxationTest: finalDetails.relaxationTest === 'Y' ? 'Yes' : 'No',
                    relaxationTestDate: formatDateForBackend(finalDetails.relaxationDate),
                    vendorId: userId,
                    vendorCode: vendorCode,
                    createdBy: userId,
                    updatedBy: userId,
                    plantId: plantId,
                    coilDetails: currentCoilEntries.map(c => ({
                        coilFrom: c.coilFrom || null,
                        coilTo: c.coilTo || null,
                        coilNo: c.coilNo || null,
                        lotNo: c.lotNo,
                        qtyKg: parseFloat(c.qty),
                        entryType: c.type?.toUpperCase() || 'SINGLE'
                    }))
                };
                await apiService.saveHtsWire(payload);
            } else if (material.id === 'cement') {
                const payload = {
                    id: initialData?.id,
                    dateOfReceipt: formatDateForBackend(formData.date),
                    gradeSpec: finalDetails.grade,
                    manufacturer: finalDetails.manufacturer,
                    invoiceNumber: finalDetails.ewayBillNo,
                    invoiceDate: formatDateForBackend(finalDetails.ewayDate),
                    vendorId: userId,
                    vendorCode: vendorCode,
                    createdBy: userId,
                    updatedBy: userId,
                    plantId: plantId,
                    batchDetails: finalDetails.batches?.map(b => ({
                        weekNo: parseInt(b.week),
                        yearNo: parseInt(b.year),
                        mtcNo: b.mtcNo,
                        quantityKg: parseFloat(b.quantity)
                    })) || []
                };
                await apiService.saveCement(payload);
            } else if (material.id === 'dowel') {
                const payload = {
                    id: initialData?.id,
                    dateOfReceipt: formatDateForBackend(formData.date),
                    gradeType: finalDetails.grade,
                    manufacturer: finalDetails.manufacturer,
                    invoiceNumber: finalDetails.ewayBillNo,
                    invoiceDate: formatDateForBackend(finalDetails.ewayDate),
                    ritesIcNumber: finalDetails.icNo,
                    ritesIcDate: formatDateForBackend(finalDetails.icDate),
                    totalQtyReceived: parseInt(formData.qty),
                    vendorId: userId,
                    vendorCode: vendorCode,
                    createdBy: userId,
                    updatedBy: userId,
                    plantId: plantId
                };
                await apiService.saveDowel(payload);
            } else if (material.id === 'aggregates') {
                const payload = {
                    id: initialData?.id,
                    dateOfReceipt: formatDateForBackend(formData.date),
                    gradeSpec: finalDetails.type,
                    source: finalDetails.source,
                    challanNumber: finalDetails.challanNo,
                    challanDate: formatDateForBackend(finalDetails.challanDate),
                    totalQtyReceived: parseFloat(formData.qty),
                    vendorId: userId,
                    vendorCode: vendorCode,
                    createdBy: userId,
                    updatedBy: userId,
                    plantId: plantId
                };
                await apiService.saveAggregate(payload);
            } else if (material.id === 'admixture') {
                const payload = {
                    id: initialData?.id,
                    dateOfReceipt: formatDateForBackend(formData.date),
                    manufacturer: finalDetails.manufacturer,
                    gradeSpec: finalDetails.grade,
                    invoiceNumber: finalDetails.ewayBillNo,
                    invoiceDate: formatDateForBackend(finalDetails.ewayDate),
                    lotNo: finalDetails.lotNo,
                    mtcNo: finalDetails.mtcNo,
                    totalQuantity: parseFloat(formData.qty),
                    vendorId: userId,
                    vendorCode: vendorCode,
                    createdBy: userId,
                    updatedBy: userId,
                    plantId: plantId
                };
                await apiService.saveAdmixture(payload);
            } else if (material.id === 'sgci-insert') {
                const payload = {
                    id: initialData?.id,
                    dateOfReceipt: formatDateForBackend(formData.date),
                    gradeType: finalDetails.grade,
                    manufacturer: finalDetails.manufacturer,
                    invoiceNumber: finalDetails.ewayBillNo,
                    invoiceDate: formatDateForBackend(finalDetails.ewayDate),
                    ritesIcNumber: finalDetails.icNo,
                    ritesIcDate: formatDateForBackend(finalDetails.icDate),
                    totalQtyReceived: parseInt(formData.qty),
                    vendorId: userId,
                    vendorCode: vendorCode,
                    createdBy: userId,
                    updatedBy: userId,
                    plantId: plantId
                };
                await apiService.saveSgciInsert(payload);
            } else {
                // Mock behavior for others
                onSubmit({
                    id: initialData?.id || `INV-${material.id.toUpperCase().substring(0, 3)}-${Math.floor(Math.random() * 10000)}`,
                    status: initialData?.status || 'Pending for verification',
                    ...formData,
                    details: {
                        ...finalDetails,
                        ewayDate: formatDateForBackend(finalDetails.ewayDate),
                        icDate: formatDateForBackend(finalDetails.icDate),
                        challanDate: formatDateForBackend(finalDetails.challanDate)
                    }
                });
                return;
            }
            onSubmit(); // Trigger refresh in parent
        } catch (error) {
            alert('Error saving inventory: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' };
    const groupStyle = { marginBottom: '16px' };
    const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

    const renderFields = () => {
        switch (material.id) {
            case 'cement':
                const batches = formData.details.batches || [{ week: '', year: new Date().getFullYear(), mtcNo: '', quantity: '' }];
                const handleBatchChange = (index, field, value) => {
                    const newBatches = [...batches];
                    newBatches[index] = { ...newBatches[index], [field]: value };
                    const totalQty = newBatches.reduce((sum, b) => sum + (parseFloat(b.quantity) || 0), 0);
                    setFormData({
                        ...formData,
                        qty: totalQty,
                        details: { ...formData.details, batches: newBatches }
                    });
                };
                const addBatch = () => {
                    const newBatches = [...batches, { week: '', year: new Date().getFullYear(), mtcNo: '', quantity: '' }];
                    setFormData({ ...formData, details: { ...formData.details, batches: newBatches } });
                };
                const removeBatch = (index) => {
                    const newBatches = batches.filter((_, i) => i !== index);
                    const totalQty = newBatches.reduce((sum, b) => sum + (parseFloat(b.quantity) || 0), 0);
                    setFormData({
                        ...formData,
                        qty: totalQty,
                        details: { ...formData.details, batches: newBatches }
                    });
                };

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={gridStyle}>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Grade / Spec</label>
                                <select value={formData.details.grade || 'OPC 53'} onChange={(e) => handleChange(e, 'grade', true)} required style={inputStyle}>
                                    <option value="OPC 53">OPC 53</option>
                                </select>
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Manufacturer</label>
                                <select value={formData.details.manufacturer || ''} onChange={(e) => handleChange(e, 'manufacturer', true)} required style={inputStyle}>
                                    <option value="">Select Manufacturer</option>
                                    <option value="ACC Limited, Wadi">ACC Limited, Wadi</option>
                                    <option value="Ultratech Cement">Ultratech Cement</option>
                                    <option value="Ambuja Cement">Ambuja Cement</option>
                                </select>
                            </div>
                            <div style={groupStyle}><label style={labelStyle}>Invoice Number</label><input type="text" value={formData.details.ewayBillNo || ''} onChange={(e) => handleChange(e, 'ewayBillNo', true)} required style={inputStyle} /></div>
                            <div style={groupStyle}><label style={labelStyle}>Invoice Date</label><input type="date" value={formData.details.ewayDate || ''} onChange={(e) => handleChange(e, 'ewayDate', true)} required style={inputStyle} /></div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Batch Details</h3>
                                <button type="button" onClick={addBatch} style={{ background: '#42818c', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Add Batch</button>
                            </div>
                            {batches.map((batch, index) => (
                                <div key={index} style={{ marginBottom: index === batches.length - 1 ? 0 : '16px', paddingBottom: index === batches.length - 1 ? 0 : '16px', borderBottom: index === batches.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1.5fr 40px', gap: '12px', alignItems: 'end' }}>
                                        <div><label style={{ ...labelStyle, fontSize: '11px' }}>Week</label><input type="number" min="1" max="53" value={batch.week} onChange={(e) => handleBatchChange(index, 'week', e.target.value)} required style={inputStyle} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: '11px' }}>Year</label><input type="number" value={batch.year} onChange={(e) => handleBatchChange(index, 'year', e.target.value)} required style={inputStyle} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: '11px' }}>MTC No.</label><input type="text" value={batch.mtcNo} onChange={(e) => handleBatchChange(index, 'mtcNo', e.target.value)} required style={inputStyle} /></div>
                                        <div><label style={{ ...labelStyle, fontSize: '11px' }}>Quantity (Kg)</label><input type="number" step="0.001" value={batch.quantity} onChange={(e) => handleBatchChange(index, 'quantity', e.target.value)} required style={inputStyle} /></div>
                                        <button type="button" onClick={() => removeBatch(index)} style={{ padding: '10px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} disabled={batches.length === 1}>×</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={groupStyle}>
                            <label style={{ ...labelStyle, color: '#42818c' }}>Total Qty Received (Kg) - Auto Calculated</label>
                            <input type="number" value={formData.qty} readOnly style={{ ...inputStyle, borderColor: '#42818c', background: '#f0fdfa' }} />
                        </div>
                    </div>
                );
            case 'hts-wire': {
                const coilEntries = formData.details.coilEntries || [];
                const inputMode = formData.details._inputMode || 'range';
                const rangeFrom = formData.details._rangeFrom || '';
                const rangeTo = formData.details._rangeTo || '';
                const singleCoil = formData.details._singleCoil || '';
                const entryLotNo = formData.details._lotNo || '';
                const entryQty = formData.details._qty || '';

                const setHtsDetail = (patch) => {
                    setFormData(prev => ({ ...prev, details: { ...prev.details, ...patch } }));
                };

                const recalcTotal = (entries) => {
                    return entries.reduce((sum, e) => sum + (parseFloat(e.qty) || 0), 0);
                };

                const addCoilEntry = () => {
                    if (inputMode === 'range') {
                        const f = parseInt(rangeFrom), t = parseInt(rangeTo);
                        if (isNaN(f) || isNaN(t) || t < f) return;
                        if (!entryLotNo || !entryQty) return;
                        const newEntry = { type: 'range', coilFrom: rangeFrom, coilTo: rangeTo, lotNo: entryLotNo, qty: entryQty };
                        const newEntries = [...coilEntries, newEntry];
                        setFormData(prev => ({
                            ...prev,
                            qty: recalcTotal(newEntries),
                            details: { ...prev.details, coilEntries: newEntries, _rangeFrom: '', _rangeTo: '', _lotNo: '', _qty: '' }
                        }));
                    } else {
                        if (!singleCoil || !entryLotNo || !entryQty) return;
                        const newEntry = { type: 'single', coilNo: singleCoil, lotNo: entryLotNo, qty: entryQty };
                        const newEntries = [...coilEntries, newEntry];
                        setFormData(prev => ({
                            ...prev,
                            qty: recalcTotal(newEntries),
                            details: { ...prev.details, coilEntries: newEntries, _singleCoil: '', _lotNo: '', _qty: '' }
                        }));
                    }
                };

                const removeCoilEntry = (idx) => {
                    const newEntries = coilEntries.filter((_, i) => i !== idx);
                    setFormData(prev => ({
                        ...prev,
                        qty: recalcTotal(newEntries),
                        details: { ...prev.details, coilEntries: newEntries }
                    }));
                };

                const updateCoilEntry = (idx, field, value) => {
                    const newEntries = coilEntries.map((e, i) => i === idx ? { ...e, [field]: value } : e);
                    setFormData(prev => ({
                        ...prev,
                        qty: recalcTotal(newEntries),
                        details: { ...prev.details, coilEntries: newEntries }
                    }));
                };

                // Compute coil count for a range entry
                const rangeCount = (entry) => {
                    const f = parseInt(entry.coilFrom), t = parseInt(entry.coilTo);
                    if (!isNaN(f) && !isNaN(t) && t >= f) return t - f + 1;
                    return 0;
                };

                const canAdd = inputMode === 'range'
                    ? (rangeFrom && rangeTo && parseInt(rangeTo) >= parseInt(rangeFrom) && entryLotNo && entryQty)
                    : (singleCoil && entryLotNo && entryQty);

                const btnAddStyle = {
                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                    background: canAdd ? '#42818c' : '#cbd5e1', color: 'white',
                    fontWeight: '700', fontSize: '13px', cursor: canAdd ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap'
                };

                const tagStyle = {
                    display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                    fontSize: '11px', fontWeight: '700', background: '#e0f2fe', color: '#0369a1'
                };

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Top fields */}
                        <div style={gridStyle}>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Grade / Spec</label>
                                <select value={formData.details.grade || ''} onChange={(e) => handleChange(e, 'grade', true)} required style={inputStyle}>
                                    <option value="">Select Grade</option>
                                    <option value="3ply 3mm">3ply 3mm</option>
                                </select>
                            </div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Manufacturer</label>
                                <select value={formData.details.manufacturer || ''} onChange={(e) => handleChange(e, 'manufacturer', true)} required style={inputStyle}>
                                    <option value="">Select Manufacturer</option>
                                    <option value="Tata Steel">Tata Steel</option>
                                    <option value="JSPL">JSPL</option>
                                </select>
                            </div>
                            <div style={groupStyle}><label style={labelStyle}>Invoice Number</label><input type="text" value={formData.details.invoiceNo || ''} onChange={(e) => handleChange(e, 'invoiceNo', true)} required style={inputStyle} /></div>
                            <div style={groupStyle}><label style={labelStyle}>Invoice Date</label><input type="date" value={formData.details.invoiceDate || ''} onChange={(e) => handleChange(e, 'invoiceDate', true)} required style={inputStyle} /></div>
                            <div style={groupStyle}><label style={labelStyle}>RITES IC Number</label><input type="text" value={formData.details.icNo || ''} onChange={(e) => handleChange(e, 'icNo', true)} required style={inputStyle} /></div>
                            <div style={groupStyle}><label style={labelStyle}>RITES IC Date</label><input type="date" value={formData.details.icDate || ''} onChange={(e) => handleChange(e, 'icDate', true)} required style={inputStyle} /></div>
                            <div style={groupStyle}>
                                <label style={labelStyle}>Relaxation Test (Y/N)</label>
                                <select value={formData.details.relaxationTest || ''} onChange={(e) => handleChange(e, 'relaxationTest', true)} style={inputStyle}>
                                    <option value="Y">Yes</option>
                                    <option value="N">No</option>
                                </select>
                            </div>
                            {formData.details.relaxationTest !== 'N' && (
                                <div style={groupStyle}><label style={labelStyle}>Relaxation Test Date</label><input type="date" value={formData.details.relaxationDate || ''} onChange={(e) => handleChange(e, 'relaxationDate', true)} style={inputStyle} /></div>
                            )}
                        </div>

                        {/* Coil Entry Panel */}
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Coil Details</h4>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: inputMode === 'range' ? '#42818c' : '#475569' }}>
                                        <input type="radio" checked={inputMode === 'range'} onChange={() => setHtsDetail({ _inputMode: 'range', _rangeFrom: '', _rangeTo: '', _singleCoil: '', _lotNo: '', _qty: '' })} />
                                        Range
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: inputMode === 'single' ? '#42818c' : '#475569' }}>
                                        <input type="radio" checked={inputMode === 'single'} onChange={() => setHtsDetail({ _inputMode: 'single', _rangeFrom: '', _rangeTo: '', _singleCoil: '', _lotNo: '', _qty: '' })} />
                                        Single
                                    </label>
                                </div>
                            </div>

                            {/* Input row */}
                            {inputMode === 'range' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr 1.4fr auto', gap: '10px', alignItems: 'end', marginBottom: '16px' }}>
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: '11px' }}>Coil From</label>
                                        <input type="number" min="1" value={rangeFrom} onChange={(e) => setHtsDetail({ _rangeFrom: e.target.value })} placeholder="Start" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: '11px' }}>Coil To</label>
                                        <input type="number" min="1" value={rangeTo} onChange={(e) => setHtsDetail({ _rangeTo: e.target.value })} placeholder="End" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: '11px' }}>Lot No.</label>
                                        <input type="text" value={entryLotNo} onChange={(e) => setHtsDetail({ _lotNo: e.target.value })} placeholder="Lot No." style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: '11px' }}>Total Qty (Kg)</label>
                                        <input type="number" step="0.001" min="0" value={entryQty} onChange={(e) => setHtsDetail({ _qty: e.target.value })} placeholder="Qty in Kg" style={inputStyle} />
                                    </div>
                                    <button type="button" onClick={addCoilEntry} style={btnAddStyle} disabled={!canAdd}>+ Add</button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.4fr 1.4fr auto', gap: '10px', alignItems: 'end', marginBottom: '16px' }}>
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: '11px' }}>Coil No.</label>
                                        <input type="text" value={singleCoil} onChange={(e) => setHtsDetail({ _singleCoil: e.target.value })} placeholder="e.g. C-42" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: '11px' }}>Lot No.</label>
                                        <input type="text" value={entryLotNo} onChange={(e) => setHtsDetail({ _lotNo: e.target.value })} placeholder="Lot No." style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ ...labelStyle, fontSize: '11px' }}>Qty (Kg)</label>
                                        <input type="number" step="0.001" min="0" value={entryQty} onChange={(e) => setHtsDetail({ _qty: e.target.value })} placeholder="Qty in Kg" style={inputStyle} />
                                    </div>
                                    <button type="button" onClick={addCoilEntry} style={btnAddStyle} disabled={!canAdd}>+ Add</button>
                                </div>
                            )}

                            {/* Added entries list */}
                            {coilEntries.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {/* Header */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2.5fr 1.5fr 1.5fr 32px',
                                        gap: '8px',
                                        padding: '8px 10px',
                                        background: '#e2e8f0',
                                        borderRadius: '10px 10px 0 0',
                                        marginBottom: '2px'
                                    }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Coil</span>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Lot No.</span>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Qty (Kg)</span>
                                        <span></span>
                                    </div>
                                    {coilEntries.map((entry, idx) => (
                                        <div key={idx} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '2.5fr 1.5fr 1.5fr 32px',
                                            gap: '8px',
                                            alignItems: 'center',
                                            padding: '8px 10px',
                                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                            borderBottom: '1px solid #e2e8f0'
                                        }}>
                                            {/* Coil label */}
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1' }}>
                                                {entry.type === 'range' ? (
                                                    <span>
                                                        <span style={tagStyle}>C-{entry.coilFrom}</span>
                                                        <span style={{ color: '#64748b', margin: '0 6px' }}>–</span>
                                                        <span style={tagStyle}>C-{entry.coilTo}</span>
                                                        <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '8px' }}>({rangeCount(entry)} coils)</span>
                                                    </span>
                                                ) : (
                                                    <span style={tagStyle}>{entry.coilNo}</span>
                                                )}
                                            </div>
                                            {/* Lot No. read-only */}
                                            <input
                                                type="text"
                                                value={entry.lotNo}
                                                readOnly
                                                style={{ ...inputStyle, fontSize: '13px', padding: '7px 10px', background: '#f8fafc' }}
                                            />
                                            {/* Qty read-only */}
                                            <input
                                                type="number" step="0.001" min="0"
                                                value={entry.qty}
                                                readOnly
                                                style={{ ...inputStyle, fontSize: '13px', padding: '7px 10px', background: '#f8fafc' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeCoilEntry(idx)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '18px', cursor: 'pointer', padding: '0', lineHeight: 1 }}
                                            >×</button>
                                        </div>
                                    ))}
                                    {/* Footer total */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2.5fr 1.5fr 1.5fr 32px',
                                        gap: '8px',
                                        padding: '8px 10px',
                                        background: '#f0fdfa',
                                        borderRadius: '0 0 10px 10px',
                                        borderTop: '2px solid #42818c'
                                    }}>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#42818c' }}>Total</span>
                                        <span></span>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#42818c' }}>{parseFloat(formData.qty || 0).toFixed(3)} Kg</span>
                                        <span></span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px', background: '#fff', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                                    No coil entries added yet. Fill the fields above and click <b>+ Add</b>.
                                </div>
                            )}
                        </div>

                        <div style={groupStyle}>
                            <label style={{ ...labelStyle, color: '#42818c' }}>Total Qty Received (Kg) - Auto Calculated</label>
                            <input type="number" value={formData.qty} readOnly style={{ ...inputStyle, borderColor: '#42818c', background: '#f0fdfa' }} />
                        </div>
                    </div>
                );
            }
            case 'aggregates':
                return (
                    <div style={gridStyle}>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Grade / Spec</label>
                            <select value={formData.details.type || 'CA1'} onChange={(e) => handleChange(e, 'type', true)} required style={inputStyle}>
                                <option value="CA1">CA1</option>
                                <option value="CA2">CA2</option>
                                <option value="FA">FA</option>
                            </select>
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Source</label>
                            <select value={formData.details.source || ''} onChange={(e) => handleChange(e, 'source', true)} required style={inputStyle}>
                                <option value="">Select Source</option>
                                <option value="Approved Source A">Approved Source A</option>
                                <option value="Global Aggregates">Global Aggregates</option>
                                <option value="Standard Quarries">Standard Quarries</option>
                            </select>
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Challan Number</label>
                            <input type="text" value={formData.details.challanNo || ''} onChange={(e) => handleChange(e, 'challanNo', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Challan Date</label>
                            <input type="date" value={formData.details.challanDate || ''} onChange={(e) => handleChange(e, 'challanDate', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={{ ...labelStyle, color: '#42818c' }}>Total Qty Received (Kg)</label>
                            <input type="number" step="0.001" value={formData.qty} onChange={(e) => handleChange(e, 'qty')} required style={{ ...inputStyle, borderColor: '#42818c' }} />
                        </div>
                    </div>
                );
            case 'admixture':
                return (
                    <div style={gridStyle}>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Manufacturer</label>
                            <select value={formData.details.manufacturer || ''} onChange={(e) => handleChange(e, 'manufacturer', true)} required style={inputStyle}>
                                <option value="">Select Manufacturer</option>
                                <option value="FOSROC">FOSROC</option>
                                <option value="BASF">BASF</option>
                                <option value="Sika">Sika</option>
                            </select>
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Grade / Spec</label>
                            <select value={formData.details.grade || 'Type 1'} onChange={(e) => handleChange(e, 'grade', true)} required style={inputStyle}>
                                <option value="Type 1">Type 1</option>
                                <option value="Type 2">Type 2</option>
                            </select>
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Invoice Number</label>
                            <input type="text" value={formData.details.ewayBillNo || ''} onChange={(e) => handleChange(e, 'ewayBillNo', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Invoice Date</label>
                            <input type="date" value={formData.details.ewayDate || ''} onChange={(e) => handleChange(e, 'ewayDate', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Lot No.</label>
                            <input type="text" value={formData.details.lotNo || ''} onChange={(e) => handleChange(e, 'lotNo', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>MTC No.</label>
                            <input type="text" value={formData.details.mtcNo || ''} onChange={(e) => handleChange(e, 'mtcNo', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={{ ...labelStyle, color: '#42818c' }}>Total Quantity (Kg)</label>
                            <input type="number" step="0.001" value={formData.qty} onChange={(e) => handleChange(e, 'qty')} required style={{ ...inputStyle, borderColor: '#42818c' }} />
                        </div>
                    </div>
                );
            case 'sgci-insert':
                return (
                    <div style={gridStyle}>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Type of Insert</label>
                            <select value={formData.details.grade || 'T-6901'} onChange={(e) => handleChange(e, 'grade', true)} required style={inputStyle}>
                                <option value="T-6901">T-6901</option>
                                <option value="T-3815">T-3815</option>
                                <option value="T-3705">T-3705</option>
                            </select>
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Manufacturer</label>
                            <select value={formData.details.manufacturer || 'Adianth'} onChange={(e) => handleChange(e, 'manufacturer', true)} required style={inputStyle}>
                                <option value="Adianth">Adianth</option>
                            </select>
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Invoice Number</label>
                            <input type="text" value={formData.details.ewayBillNo || ''} onChange={(e) => handleChange(e, 'ewayBillNo', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Invoice Date</label>
                            <input type="date" value={formData.details.ewayDate || ''} onChange={(e) => handleChange(e, 'ewayDate', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>RITES IC Number</label>
                            <input type="text" value={formData.details.icNo || ''} onChange={(e) => handleChange(e, 'icNo', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>RITES IC Date</label>
                            <input type="date" value={formData.details.icDate || ''} onChange={(e) => handleChange(e, 'icDate', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={{ ...labelStyle, color: '#42818c' }}>Total Qty Received (Nos.)</label>
                            <input type="number" step="1" value={formData.qty} onChange={(e) => handleChange(e, 'qty')} required style={{ ...inputStyle, borderColor: '#42818c' }} />
                        </div>
                    </div>
                );
            case 'dowel':
                return (
                    <div style={gridStyle}>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Grade / Type</label>
                            <select value={formData.details.grade || 'Type A'} onChange={(e) => handleChange(e, 'grade', true)} required style={inputStyle}>
                                <option value="Type A">Type A</option>
                                <option value="Type B">Type B</option>
                            </select>
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Manufacturer</label>
                            <select value={formData.details.manufacturer || 'Manufacturer 1'} onChange={(e) => handleChange(e, 'manufacturer', true)} required style={inputStyle}>
                                <option value="Manufacturer 1">Manufacturer 1</option>
                                <option value="Manufacturer 2">Manufacturer 2</option>
                            </select>
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Invoice Number</label>
                            <input type="text" value={formData.details.ewayBillNo || ''} onChange={(e) => handleChange(e, 'ewayBillNo', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Invoice Date</label>
                            <input type="date" value={formData.details.ewayDate || ''} onChange={(e) => handleChange(e, 'ewayDate', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>RITES IC Number</label>
                            <input type="text" value={formData.details.icNo || ''} onChange={(e) => handleChange(e, 'icNo', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>RITES IC Date</label>
                            <input type="date" value={formData.details.icDate || ''} onChange={(e) => handleChange(e, 'icDate', true)} required style={inputStyle} />
                        </div>
                        <div style={groupStyle}>
                            <label style={{ ...labelStyle, color: '#42818c' }}>Total Qty Received (Nos.)</label>
                            <input type="number" step="1" value={formData.qty} onChange={(e) => handleChange(e, 'qty')} required style={{ ...inputStyle, borderColor: '#42818c' }} />
                        </div>
                    </div>
                );
            default:
                return (
                    <div style={groupStyle}>
                        <label style={labelStyle}>Quantity Received</label>
                        <input type="number" value={formData.qty} onChange={(e) => handleChange(e, 'qty')} required style={inputStyle} />
                    </div>
                );
        }
    };

    return createPortal(
        <div style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', 
            backdropFilter: 'blur(4px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000, 
            padding: '20px'
        }}>
            <div style={{
                background: 'white', 
                borderRadius: '32px', 
                width: '100%', 
                maxWidth: '750px',
                maxHeight: '90vh', 
                overflowY: 'auto', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex', 
                flexDirection: 'column',
                animation: 'modalFadeIn 0.3s ease-out'
            }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
                        {initialData ? 'Edit' : 'Add New'} {material.name}
                    </h2>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
                    <div style={groupStyle}>
                        <label style={labelStyle}>Date of Receipt</label>
                        <input type="date" value={formData.date} onChange={(e) => handleChange(e, 'date')} required style={{ ...inputStyle, padding: '12px', border: '2px solid #f1f5f9' }} />
                    </div>
                    {renderFields()}
                    <div style={{ marginTop: '32px', display: 'flex', gap: '12px', background: 'white', pt: '16px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', color: '#64748b' }}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: isSubmitting ? '#94a3b8' : '#42818c', color: 'white', fontWeight: '700', boxShadow: isSubmitting ? 'none' : '0 10px 15px -3px rgba(66, 129, 140, 0.2)', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                            {isSubmitting ? 'Saving...' : (initialData ? 'Update Inventory' : 'Save Inventory')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default InventoryForm;
