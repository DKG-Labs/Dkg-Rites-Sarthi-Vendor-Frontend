// src/components/PaymentForm.js
// Payment Details Updating Module Form
// Designed for future backend integration

import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Calculate GST (18% default)
const calculateGST = (baseAmount, gstRate = 18) => {
  return Math.round((baseAmount * gstRate) / 100);
};

// Initial form state generator
const getInitialFormState = (editData = null, selectedCall = null) => {
  if (editData) {
    return { ...editData };
  }

  // If a call is selected, auto-fill related fields
  if (selectedCall) {
    const baseAmount = selectedCall.base_payable_amount || 0;
    const gst = calculateGST(baseAmount);
    return {
      inspection_call_number: selectedCall.call_no || '',
      charge_type: selectedCall.charge_type || 'Inspection',
      bank_account_details: selectedCall.bank_account_details || '',
      base_payable_amount: baseAmount,
      gst: gst,
      total_payable_amount: baseAmount + gst,
      payment_mode: '',
      transaction_reference_number: '',
      payment_date: '',
      payment_proof_file: null,
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
    payment_date: '',
    payment_proof_file: null,
    payment_proof_filename: '',
    remarks: ''
  };
};

export const PaymentForm = ({
  isOpen,
  onClose,
  onSubmit,
  masterData = {},
  editData = null,
  selectedCall = null, // For auto-fetching call details
  isLoading = false
}) => {
  const [formData, setFormData] = useState(() => getInitialFormState(editData, selectedCall));
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or editData changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState(editData, selectedCall));
      setErrors({});
    }
  }, [isOpen, editData, selectedCall]);

  // Auto-calculate total when base amount changes
  useEffect(() => {
    const base = parseFloat(formData.base_payable_amount) || 0;
    const gst = calculateGST(base);
    setFormData(prev => ({
      ...prev,
      gst: gst,
      total_payable_amount: base + gst
    }));
  }, [formData.base_payable_amount]);

  // Payment mode options
  const paymentModeOptions = useMemo(() => {
    return masterData.payment_modes || [
      { value: '', label: 'Select Payment Mode' },
      { value: 'NEFT', label: 'NEFT' },
      { value: 'RTGS', label: 'RTGS' },
      { value: 'IMPS', label: 'IMPS' },
      { value: 'UPI', label: 'UPI' },
      { value: 'Bank Deposit', label: 'Bank Deposit' }
    ];
  }, [masterData.payment_modes]);

  // Charge type options
  const chargeTypeOptions = useMemo(() => {
    return masterData.charge_types || [
      { value: '', label: 'Select Charge Type' },
      { value: 'Inspection', label: 'Inspection' },
      { value: 'Cancellation', label: 'Cancellation' },
      { value: 'Rejected', label: 'Rejected' },
      { value: 'Advance', label: 'Advance' }
    ];
  }, [masterData.charge_types]);

  // Inspection calls for dropdown (auto-fetch list)
  const inspectionCallOptions = useMemo(() => {
    return masterData.inspection_calls || [
      { value: '', label: 'Select Inspection Call' }
    ];
  }, [masterData.inspection_calls]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, payment_proof_file: 'Only PDF and JPG files allowed' }));
        return;
      }
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, payment_proof_file: 'File size must be less than 5MB' }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        payment_proof_file: file,
        payment_proof_filename: file.name
      }));
      setErrors(prev => ({ ...prev, payment_proof_file: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const today = getTodayDate();

    if (!formData.inspection_call_number) {
      newErrors.inspection_call_number = 'Inspection Call Number is required';
    }
    if (!formData.payment_mode) {
      newErrors.payment_mode = 'Payment Mode is required';
    }
    if (!formData.transaction_reference_number?.trim()) {
      newErrors.transaction_reference_number = 'Transaction Reference Number is required';
    }
    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment Date is required';
    } else if (formData.payment_date > today) {
      newErrors.payment_date = 'Future dates are not allowed';
    }
    if (!formData.payment_proof_file && !editData?.payment_proof_filename) {
      newErrors.payment_proof_file = 'Payment proof is required for verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  // Form field component for consistency
  const FormField = ({ label, name, required, hint, children }) => (
    <div className="vendor-form-group">
      <label className="vendor-form-label">
        {label} {required && <span>*</span>}
      </label>
      {children}
      {hint && <span className="vendor-form-hint">{hint}</span>}
      {errors[name] && <span className="form-error">{errors[name]}</span>}
    </div>
  );

  const isEditMode = !!editData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Payment Details' : 'Add Payment Details'}
      footer={
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : (isEditMode ? 'Update' : 'Submit')}
          </button>
        </div>
      }
    >
      <div className="vendor-form-grid">
        {/* Inspection Call Number - Auto Fetch */}
        <FormField label="Inspection Call Number" name="inspection_call_number" required hint="Fetched from list item selected">
          <select
            name="inspection_call_number"
            value={formData.inspection_call_number}
            onChange={handleChange}
            className="vendor-form-select"
          >
            {inspectionCallOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* Charge Type - Auto Fetch */}
        <FormField label="Charge Type" name="charge_type" hint="Cancellation/Rejected/Advance - Auto Fetch">
          <select
            name="charge_type"
            value={formData.charge_type}
            onChange={handleChange}
            className="vendor-form-select"
          >
            {chargeTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* Bank Account Details - Auto Filled */}
        <FormField label="Bank Account Details" name="bank_account_details" hint="Auto-filled based on RIO">
          <input
            type="text"
            name="bank_account_details"
            value={formData.bank_account_details}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Auto-filled from RIO data"
            disabled
          />
        </FormField>

        {/* Base Payable Amount - Auto Calculate */}
        <FormField label="Base Payable Amount (₹)" name="base_payable_amount" hint="Computed from tariff rules">
          <input
            type="number"
            name="base_payable_amount"
            value={formData.base_payable_amount}
            className="vendor-form-input"
            disabled
          />
        </FormField>

        {/* GST - Auto Calculate */}
        <FormField label="GST (18%)" name="gst" hint="Auto-calculated">
          <input
            type="number"
            name="gst"
            value={formData.gst}
            className="vendor-form-input"
            disabled
          />
        </FormField>

        {/* Total Payable Amount - Auto Calculate */}
        <FormField label="Total Payable Amount (₹)" name="total_payable_amount" hint="Base + GST">
          <input
            type="number"
            name="total_payable_amount"
            value={formData.total_payable_amount}
            className="vendor-form-input"
            disabled
            style={{ fontWeight: 'bold', backgroundColor: '#f0fdf4' }}
          />
        </FormField>

        {/* Payment Mode - Dropdown */}
        <FormField label="Payment Mode" name="payment_mode" required hint="NEFT, RTGS, IMPS, UPI, Bank Deposit">
          <select
            name="payment_mode"
            value={formData.payment_mode}
            onChange={handleChange}
            className="vendor-form-select"
          >
            {paymentModeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* Transaction Reference Number - Manual, Required */}
        <FormField label="Transaction Reference Number" name="transaction_reference_number" required>
          <input
            type="text"
            name="transaction_reference_number"
            value={formData.transaction_reference_number}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter transaction reference"
          />
        </FormField>

        {/* Payment Date - Required, <= Current Date */}
        <FormField label="Payment Date" name="payment_date" required hint="Future dates not allowed">
          <input
            type="date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleChange}
            className="vendor-form-input"
            max={getTodayDate()}
          />
        </FormField>

        {/* Payment Proof Upload - File, PDF/JPG */}
        <FormField label="Payment Proof Upload" name="payment_proof_file" required hint="PDF/JPG; Max 5MB">
          <input
            type="file"
            name="payment_proof_file"
            onChange={handleFileChange}
            className="vendor-form-input"
            accept=".pdf,.jpg,.jpeg"
          />
          {formData.payment_proof_filename && (
            <span className="vendor-form-hint" style={{ color: '#16a34a' }}>
              Selected: {formData.payment_proof_filename}
            </span>
          )}
        </FormField>

        {/* Remarks - String */}
        <FormField label="Remarks" name="remarks">
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            className="vendor-form-input"
            rows={3}
            placeholder="Enter any additional remarks"
            style={{ resize: 'vertical' }}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default PaymentForm;
