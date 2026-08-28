import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, CheckCircle2 } from 'lucide-react';

const calculateGST = (baseAmount, gstRate = 18) => {
    return Math.round((baseAmount * gstRate) / 100);
};

const getInitialFormState = (editData = null, selectedCall = null) => {
    if (editData) {
        const base = parseFloat(editData.base_payable_amount) || 0;
        const gst = calculateGST(base);
        return {
            inspection_call_number: editData.call_no || editData.inspection_call_number || '',
            charge_type: editData.charge_type || editData.payment_reason || 'Inspection',
            bank_account_details: editData.bank_account_details || '',
            base_payable_amount: base,
            gst: gst,
            total_payable_amount: editData.total_payable_amount || (base + gst),
            payment_mode: editData.payment_mode || '',
            transaction_reference_number: editData.transaction_reference_number || '',
            payment_date: editData.payment_date || new Date().toISOString().split('T')[0],
            payment_proof_filename: editData.payment_proof_filename || '',
            remarks: editData.remarks || ''
        };
    }

    if (selectedCall) {
        const base = parseFloat(selectedCall.base_payable_amount) || 0;
        const gst = calculateGST(base);
        return {
            inspection_call_number: selectedCall.call_no || '',
            charge_type: selectedCall.charge_type || selectedCall.payment_reason || 'Cancellation',
            bank_account_details: selectedCall.bank_account_details || '',
            base_payable_amount: base,
            gst: gst,
            total_payable_amount: selectedCall.total_payable_amount || (base + gst),
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
        const file = e.target.files?.[0];
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
        if (!formData.transaction_reference_number?.trim()) newErrors.transaction_reference_number = 'Transaction reference number is required';
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
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
            <div style={{
                background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '720px',
                maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #e2e8f0'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#f8fafc', borderTopLeftRadius: '20px', borderTopRightRadius: '20px'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                            {editData ? 'Update Payment Details' : 'Enter Payment Details'}
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                            Call No: <span style={{ fontWeight: 700, color: '#2563eb' }}>{formData.inspection_call_number || selectedCall?.call_no}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            padding: '8px', borderRadius: '50%', color: '#64748b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    {/* Amount Breakdown Banner */}
                    <div style={{
                        background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px',
                        padding: '16px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px', textAlign: 'center'
                    }}>
                        <div>
                            <span style={{ fontSize: '11px', color: '#0369a1', textTransform: 'uppercase', fontWeight: 700 }}>Base Amount</span>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                                ₹{Number(formData.base_payable_amount || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', color: '#0369a1', textTransform: 'uppercase', fontWeight: 700 }}>GST (18%)</span>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                                ₹{Number(formData.gst || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', color: '#0369a1', textTransform: 'uppercase', fontWeight: 700 }}>Total Payable</span>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                                ₹{Number(formData.total_payable_amount || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                        {/* Charge Type */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Charge Type
                            </label>
                            <input
                                type="text"
                                name="charge_type"
                                value={formData.charge_type}
                                readOnly
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#475569',
                                    fontSize: '13px', fontWeight: 600
                                }}
                            />
                        </div>

                        {/* Bank Details */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Beneficiary Bank Details
                            </label>
                            <input
                                type="text"
                                name="bank_account_details"
                                placeholder="Bank / Account details"
                                value={formData.bank_account_details}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a',
                                    fontSize: '12px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
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
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: errors.payment_mode ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                    fontSize: '13px', outline: 'none'
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

                        {/* Transaction Reference Number */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Transaction Reference No. / UTR <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="transaction_reference_number"
                                placeholder="e.g. UTR1234567890 / NEFT..."
                                value={formData.transaction_reference_number}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: errors.transaction_reference_number ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                    fontSize: '13px', outline: 'none'
                                }}
                            />
                            {errors.transaction_reference_number && (
                                <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>{errors.transaction_reference_number}</span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
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
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: errors.payment_date ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                    fontSize: '13px', outline: 'none'
                                }}
                            />
                            {errors.payment_date && (
                                <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>{errors.payment_date}</span>
                            )}
                        </div>

                        {/* Payment Proof Upload */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Payment Proof (PDF/Image) <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <div style={{
                                border: errors.payment_proof_filename ? '1.5px dashed #dc2626' : '1.5px dashed #cbd5e1',
                                borderRadius: '8px', padding: '10px 12px', textAlign: 'center', background: '#f8fafc',
                                position: 'relative', cursor: 'pointer'
                            }}>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    style={{
                                        position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%'
                                    }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                                    <Upload size={16} color="#3b82f6" />
                                    <span style={{ fontWeight: 600, color: '#2563eb' }}>
                                        {fileUploadName || 'Click to Upload Document'}
                                    </span>
                                </div>
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
                            rows={3}
                            placeholder="Enter any additional payment notes or reference..."
                            value={formData.remarks}
                            onChange={handleChange}
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '8px',
                                border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', resize: 'vertical'
                            }}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px',
                        paddingTop: '16px', borderTop: '1px solid #e2e8f0'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                background: '#fff', color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 24px', borderRadius: '8px', border: 'none',
                                background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                            }}
                        >
                            <CheckCircle2 size={16} /> Submit Payment Details
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentFormModal;
