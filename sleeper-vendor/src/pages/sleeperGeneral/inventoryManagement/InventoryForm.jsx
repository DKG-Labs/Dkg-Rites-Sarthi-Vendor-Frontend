import React, { useState, useEffect } from 'react';

const InventoryForm = ({ material, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        qty: '',
        details: {}
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: initialData.date,
                qty: initialData.qty,
                details: initialData.details || {}
            });
        }
    }, [initialData]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalDetails = { ...formData.details };
        if (material.id === 'cement') {
            finalDetails.age = calculateAge(formData.date, formData.details.mfgWeek, formData.details.mfgYear);
        }

        onSubmit({
            id: initialData?.id || `INV-${material.id.toUpperCase().substring(0, 3)}-${Math.floor(Math.random() * 10000)}`,
            status: initialData?.status || 'Unverified',
            ...formData,
            details: finalDetails
        });
    };

    const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' };
    const groupStyle = { marginBottom: '16px' };
    const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

    const renderFields = () => {
        switch (material.id) {
            case 'cement':
                return (
                    <div style={gridStyle}>
                        <div style={groupStyle}><label style={labelStyle}>Consignment Number</label><input type="text" value={formData.details.consignmentNo || ''} onChange={(e) => handleChange(e, 'consignmentNo', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Cement Type</label><select value={formData.details.cementType || 'OPC 53'} onChange={(e) => handleChange(e, 'cementType', true)} style={inputStyle}><option>OPC 53</option><option>PPC</option></select></div>
                        <div style={groupStyle}><label style={labelStyle}>Applicable Specification</label><input type="text" value={formData.details.spec || ''} onChange={(e) => handleChange(e, 'spec', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Manufacturer Name</label><input type="text" value={formData.details.manufacturer || ''} onChange={(e) => handleChange(e, 'manufacturer', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Manufacturing Week</label><input type="number" value={formData.details.mfgWeek || ''} onChange={(e) => handleChange(e, 'mfgWeek', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Manufacturing Year</label><input type="number" value={formData.details.mfgYear || ''} onChange={(e) => handleChange(e, 'mfgYear', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Lot No.</label><input type="text" value={formData.details.lotNo || ''} onChange={(e) => handleChange(e, 'lotNo', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>No. of Bags</label><input type="number" value={formData.details.noOfBags || ''} onChange={(e) => handleChange(e, 'noOfBags', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Weight of Each Bag (Kg)</label><input type="number" value={formData.details.bagWeight || ''} onChange={(e) => handleChange(e, 'bagWeight', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Week</label><input type="number" value={formData.details.week || ''} onChange={(e) => handleChange(e, 'week', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>MTC No.</label><input type="text" value={formData.details.mtcNo || ''} onChange={(e) => handleChange(e, 'mtcNo', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Batch No.</label><input type="text" value={formData.details.batchNo || ''} onChange={(e) => handleChange(e, 'batchNo', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Sub PO Number</label><input type="text" value={formData.details.poNo || ''} onChange={(e) => handleChange(e, 'poNo', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Sub PO Date</label><input type="date" value={formData.details.poDate || ''} onChange={(e) => handleChange(e, 'poDate', true)} style={inputStyle} /></div>
                        <div style={{ ...groupStyle, gridColumn: 'span 2' }}>
                            <label style={{ ...labelStyle, color: '#42818c' }}>Total Qty Received (MT)</label>
                            <input type="number" value={formData.qty} onChange={(e) => handleChange(e, 'qty')} required style={{ ...inputStyle, borderColor: '#42818c' }} />
                        </div>
                    </div>
                );
            case 'hts-wire':
                return (
                    <div style={gridStyle}>
                        <div style={groupStyle}><label style={labelStyle}>Grade / Spec</label><input type="text" value={formData.details.grade || ''} onChange={(e) => handleChange(e, 'grade', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Manufacturer Name</label><input type="text" value={formData.details.manufacturer || ''} onChange={(e) => handleChange(e, 'manufacturer', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>No. of Coils</label><input type="number" value={formData.details.noOfCoils || ''} onChange={(e) => handleChange(e, 'noOfCoils', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Serial Number of Each Coil</label><input type="text" value={formData.details.serialNumbers || ''} onChange={(e) => handleChange(e, 'serialNumbers', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Coil Weight (MT)</label><input type="number" value={formData.details.coilWeight || ''} onChange={(e) => handleChange(e, 'coilWeight', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Coil Length (m)</label><input type="number" value={formData.details.coilLength || ''} onChange={(e) => handleChange(e, 'coilLength', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>RITES IC No.</label><input type="text" value={formData.details.icNo || ''} onChange={(e) => handleChange(e, 'icNo', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Book No.</label><input type="text" value={formData.details.bookNo || ''} onChange={(e) => handleChange(e, 'bookNo', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Set No.</label><input type="text" value={formData.details.setNo || ''} onChange={(e) => handleChange(e, 'setNo', true)} style={inputStyle} /></div>
                        <div style={groupStyle}>
                            <label style={labelStyle}>Relaxation Test (Y/N)</label>
                            <select value={formData.details.relaxationTest || 'Y'} onChange={(e) => handleChange(e, 'relaxationTest', true)} style={inputStyle}>
                                <option value="Y">Yes</option>
                                <option value="N">No</option>
                            </select>
                        </div>
                        <div style={groupStyle}><label style={labelStyle}>Relaxation Test Pass Date</label><input type="date" value={formData.details.relaxationDate || ''} onChange={(e) => handleChange(e, 'relaxationDate', true)} style={inputStyle} /></div>
                        <div style={groupStyle}>
                            <label style={{ ...labelStyle, color: '#42818c' }}>Total Qty Received (MT)</label>
                            <input type="number" value={formData.qty} onChange={(e) => handleChange(e, 'qty')} required style={{ ...inputStyle, borderColor: '#42818c' }} />
                        </div>
                    </div>
                );
            case 'aggregates':
                return (
                    <div style={gridStyle}>
                        <div style={groupStyle}><label style={labelStyle}>Type of Aggregate</label><select value={formData.details.type || 'CA1'} onChange={(e) => handleChange(e, 'type', true)} style={inputStyle}><option>CA1</option><option>CA2</option><option>Fine Aggregate</option></select></div>
                        <div style={groupStyle}><label style={labelStyle}>Source</label><input type="text" value={formData.details.source || ''} onChange={(e) => handleChange(e, 'source', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Truck No.</label><input type="text" value={formData.details.truckNo || ''} onChange={(e) => handleChange(e, 'truckNo', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}>
                            <label style={{ ...labelStyle, color: '#42818c' }}>Quantity Received (MT)</label>
                            <input type="number" value={formData.qty} onChange={(e) => handleChange(e, 'qty')} required style={{ ...inputStyle, borderColor: '#42818c' }} />
                        </div>
                    </div>
                );
            case 'sgci-insert':
            case 'dowel':
                return (
                    <div style={gridStyle}>
                        <div style={groupStyle}><label style={labelStyle}>Grade / Spec</label><input type="text" value={formData.details.grade || ''} onChange={(e) => handleChange(e, 'grade', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Manufacturer Name</label><input type="text" value={formData.details.manufacturer || ''} onChange={(e) => handleChange(e, 'manufacturer', true)} required style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>RITES IC No.</label><input type="text" value={formData.details.icNo || ''} onChange={(e) => handleChange(e, 'icNo', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Book No.</label><input type="text" value={formData.details.bookNo || ''} onChange={(e) => handleChange(e, 'bookNo', true)} style={inputStyle} /></div>
                        <div style={groupStyle}><label style={labelStyle}>Set No.</label><input type="text" value={formData.details.setNo || ''} onChange={(e) => handleChange(e, 'setNo', true)} style={inputStyle} /></div>
                        <div style={groupStyle}>
                            <label style={{ ...labelStyle, color: '#42818c' }}>Total Qty Received (Nos.)</label>
                            <input type="number" value={formData.qty} onChange={(e) => handleChange(e, 'qty')} required style={{ ...inputStyle, borderColor: '#42818c' }} />
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

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
            <div className="fade-in" style={{
                background: 'white', borderRadius: '32px', width: '100%', maxWidth: '750px',
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex', flexDirection: 'column'
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
                        <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#42818c', color: 'white', fontWeight: '700', boxShadow: '0 10px 15px -3px rgba(66, 129, 140, 0.2)' }}>
                            {initialData ? 'Update Inventory' : 'Save Inventory'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryForm;
