import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2 } from 'lucide-react';

const calculateGST = (baseAmount, gstRate = 18) => {
    return Math.round((baseAmount * gstRate) / 100);
};

const getInitialFormState = (editData = null, selectedCall = null) => {
    if (editData) {
        const base = parseFloat(editData.base_payable_amount || editData.basePayableAmount) || 0;
        const gst = calculateGST(base);
        return {
            inspection_call_number: editData.call_no || editData.callNo || editData.inspection_call_number || '',
            charge_type: editData.charge_type || editData.chargeType || editData.payment_reason || editData.paymentReason || 'Inspection',
            bank_account_details: editData.bank_account_details || editData.bankAccountDetails || '',
            base_payable_amount: base,
            gst: gst,
            total_payable_amount: editData.total_payable_amount || editData.totalPayableAmount || (base + gst),
            payment_mode: editData.payment_mode || editData.paymentMode || '',
            transaction_reference_number: editData.transaction_reference_number || editData.transactionReferenceNumber || '',
            payment_date: editData.payment_date || editData.paymentDate || new Date().toISOString().split('T')[0],
            payment_proof_filename: editData.payment_proof_filename || editData.paymentProofFilename || '',
            remarks: editData.remarks || ''
        };
    }

    if (selectedCall) {
        const base = parseFloat(selectedCall.base_payable_amount || selectedCall.basePayableAmount) || 0;
        const gst = calculateGST(base);
        return {
            inspection_call_number: selectedCall.call_no || selectedCall.callNo || '',
            charge_type: selectedCall.charge_type || selectedCall.chargeType || selectedCall.payment_reason || selectedCall.paymentReason || 'Cancellation',
            bank_account_details: selectedCall.bank_account_details || selectedCall.bankAccountDetails || '',
            base_payable_amount: base,
            gst: gst,
            total_payable_amount: selectedCall.total_payable_amount || selectedCall.totalPayableAmount || (base + gst),
            payment_mode: '',
            transaction_reference_number: '',
            payment_date: new Date().toISOString().split('T')[0],
            payment_proof_filename: '',
            remarks: ''
        };
    }

    return {
        inspection_call_number: '',
        charge_type: '',
        bank_account_details: '',
        base_payable_amount: 0,
        gst: 0,
        total_payable_amount: 0,
        payment_mode: '',
        transaction_reference_number: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_proof_filename: '',
        remarks: ''
    };
};

const PaymentFormModal = ({ isOpen, onClose, onSubmit, editData = null, selectedCall = null }) => {
    const [formData, setFormData] = useState(() => getInitialFormState(editData, selectedCall));
    const [errors, setErrors] = useState({});
    const [fileUploadName, setFileUploadName] = useState('');

    useEffect(() => {
        if (isOpen) {
            const initial = getInitialFormState(editData, selectedCall);
            setFormData(initial);
            setFileUploadName(initial.payment_proof_filename || '');
            setErrors({});
        }
    }, [isOpen, editData, selectedCall]);

    useEffect(() => {
        const base = parseFloat(formData.base_payable_amount) || 0;
        const gst = calculateGST(base);
        setFormData(prev => ({
            ...prev,
            gst,
            total_payable_amount: base + gst
        }));
    }, [formData.base_payable_amount]);

    const paymentModes = [
        { value: '', label: 'Select Payment Mode' },
        { value: 'NEFT', label: 'NEFT' },
        { value: 'RTGS', label: 'RTGS' },
        { value: 'IMPS', label: 'IMPS' },
        { value: 'UPI', label: 'UPI' },
        { value: 'Bank Deposit', label: 'Bank Deposit' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileUploadName(file.name);
            setFormData(prev => ({ ...prev, payment_proof_filename: file.name }));
            if (errors.payment_proof_filename) {
                setErrors(prev => ({ ...prev, payment_proof_filename: null }));
            }
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.payment_mode) newErrors.payment_mode = 'Please select a payment mode';
        if (!formData.transaction_reference_number) newErrors.transaction_reference_number = 'Transaction reference / UTR number is required';
        if (!formData.payment_date) newErrors.payment_date = 'Payment date is required';
        if (!formData.payment_proof_filename && !fileUploadName) newErrors.payment_proof_filename = 'Please upload payment proof document';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '650px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e2e8f0'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                            {editData ? 'Update Payment Details' : 'Enter Payment Details'}
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                            Provide transaction details and payment proof for cancellation charges.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    {/* Readonly Call Details Banner */}
                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px'
                    }}>
                        <div>
                            <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Call No</span>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#14532d' }}>{formData.inspection_call_number || 'N/A'}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Charge Type</span>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#14532d' }}>{formData.charge_type || 'Cancellation'}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Total Payable (incl 18% GST)</span>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d' }}>
                                ₹{formData.total_payable_amount ? Number(formData.total_payable_amount).toLocaleString('en-IN') : '0'}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        {/* Payment Mode */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Payment Mode <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <select
                                name="payment_mode"
                                value={formData.payment_mode}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: errors.payment_mode ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    outline: 'none',
                                    background: '#fff'
                                }}
                            >
                                {paymentModes.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            {errors.payment_mode && (
                                <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>{errors.payment_mode}</span>
                            )}
                        </div>

                        {/* Transaction Reference / UTR */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Transaction Ref / UTR No <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="transaction_reference_number"
                                value={formData.transaction_reference_number}
                                onChange={handleChange}
                                placeholder="e.g. UTR1234567890"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: errors.transaction_reference_number ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {errors.transaction_reference_number && (
                                <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>{errors.transaction_reference_number}</span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        {/* Payment Date */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Payment Date <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                type="date"
                                name="payment_date"
                                value={formData.payment_date}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: errors.payment_date ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {errors.payment_date && (
                                <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>{errors.payment_date}</span>
                            )}
                        </div>

                        {/* Payment Proof File Upload */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Upload Payment Proof (PDF/Image) <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <input
                                    type="file"
                                    id="payment_proof_file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <label
                                    htmlFor="payment_proof_file"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: errors.payment_proof_filename ? '1px dashed #dc2626' : '1px dashed #cbd5e1',
                                        background: '#f8fafc',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '13px',
                                        color: fileUploadName ? '#0f172a' : '#64748b',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {fileUploadName ? (
                                        <>
                                            <CheckCircle2 size={16} color="#16a34a" />
                                            <span>{fileUploadName}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} color="#64748b" />
                                            <span>Choose File...</span>
                                        </>
                                    )}
                                </label>
                            </div>
                            {errors.payment_proof_filename && (
                                <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>{errors.payment_proof_filename}</span>
                            )}
                        </div>
                    </div>

                    {/* Remarks */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            Remarks (Optional)
                        </label>
                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Enter any additional payment remarks..."
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#fff',
                                color: '#475569',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                            }}
                        >
                            Submit Payment Details
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentFormModal;
