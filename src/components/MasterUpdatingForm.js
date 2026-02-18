// src/components/MasterUpdatingForm.js
// Master Updating Form - For adding/updating master data (Company, Unit, Role information)
// Designed for future backend integration

import React, { useState } from 'react';
import { MASTER_ROLE_OPTIONS, PRODUCT_OPTIONS, SUB_PRODUCT_OPTIONS } from '../data/vendorMockData';

// Initial form state
const getInitialFormState = () => ({
  company_name: '',
  cin: '',
  unit_name: '',
  pincode: '',
  city: '',
  district: '',
  state: '',
  address: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  master_role: '',
  product: '',
  sub_product: '',
  is_active: true
});

export const MasterUpdatingForm = ({
  editData = null,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState(() =>
    editData ? { ...getInitialFormState(), ...editData } : getInitialFormState()
  );
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.company_name?.trim()) newErrors.company_name = 'Company Name is required';
    if (!formData.cin?.trim()) newErrors.cin = 'CIN is required';
    if (!formData.unit_name?.trim()) newErrors.unit_name = 'Unit Name is required';
    if (!formData.pincode?.trim()) newErrors.pincode = 'Pincode is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.district?.trim()) newErrors.district = 'District is required';
    if (!formData.state?.trim()) newErrors.state = 'State is required';
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    if (!formData.contact_person?.trim()) newErrors.contact_person = 'Contact Person is required';
    if (!formData.contact_phone?.trim()) newErrors.contact_phone = 'Contact Phone is required';
    if (!formData.master_role?.trim()) newErrors.master_role = 'Master Role is required';
    if (!formData.product?.trim()) newErrors.product = 'Product is required';
    if (!formData.sub_product?.trim()) newErrors.sub_product = 'Sub Product is required';

    // Email validation (optional but must be valid if provided)
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleReset = () => {
    setFormData(getInitialFormState());
    setErrors({});
  };

  // Form field component for consistency
  const FormField = ({ label, name, required, hint, children, fullWidth = false }) => (
    <div className={`vendor-form-group ${fullWidth ? 'full-width' : ''}`}>
      <label className="vendor-form-label">
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
      {hint && <span className="vendor-form-hint">{hint}</span>}
      {errors[name] && <span className="form-error">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="master-updating-form">
      <div className="vendor-form-grid">
        {/* Company Name */}
        <FormField label="Company Name" name="company_name" required>
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter company name"
          />
        </FormField>

        {/* CIN */}
        <FormField label="CIN" name="cin" required>
          <input
            type="text"
            name="cin"
            value={formData.cin}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter CIN"
          />
        </FormField>

        {/* Unit Name */}
        <FormField label="Unit Name" name="unit_name" required>
          <input
            type="text"
            name="unit_name"
            value={formData.unit_name}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter unit name"
          />
        </FormField>

        {/* Pincode */}
        <FormField label="Pincode" name="pincode" required hint="Integer">
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter pincode"
          />
        </FormField>

        {/* City */}
        <FormField label="City" name="city" required>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter city"
          />
        </FormField>

        {/* District */}
        <FormField label="District" name="district" required hint="Auto-fetched based upon the pincode value">
          <input
            type="text"
            name="district"
            value={formData.district}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter district"
          />
        </FormField>

        {/* State */}
        <FormField label="State" name="state" required>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter state"
          />
        </FormField>

        {/* Address - Full width */}
        <FormField label="Address" name="address" required fullWidth>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="vendor-form-input"
            rows={3}
            placeholder="Enter full address"
            style={{ resize: 'vertical' }}
          />
        </FormField>

        {/* Contact Person */}
        <FormField label="Contact Person" name="contact_person" required>
          <input
            type="text"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter contact person name"
          />
        </FormField>

        {/* Contact Phone Number */}
        <FormField label="Contact Phone Number" name="contact_phone" required>
          <input
            type="tel"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter phone number"
          />
        </FormField>

        {/* Contact Email */}
        <FormField label="Contact Email" name="contact_email" hint="Optional">
          <input
            type="email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            className="vendor-form-input"
            placeholder="Enter email address"
          />
        </FormField>

        {/* Master Role Dropdown */}
        <FormField label="Master Role" name="master_role" required>
          <select
            name="master_role"
            value={formData.master_role}
            onChange={handleChange}
            className="vendor-form-select"
          >
            {MASTER_ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* Product Dropdown */}
        <FormField label="Product" name="product" required>
          <select
            name="product"
            value={formData.product}
            onChange={handleChange}
            className="vendor-form-select"
          >
            {PRODUCT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        {/* Sub Product Dropdown */}
        <FormField label="Sub Product" name="sub_product" required>
          <select
            name="sub_product"
            value={formData.sub_product}
            onChange={handleChange}
            className="vendor-form-select"
            disabled={!formData.product}
          >
            {formData.product && SUB_PRODUCT_OPTIONS[formData.product]
              ? SUB_PRODUCT_OPTIONS[formData.product].map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))
              : [<option key="" value="">Select Product first</option>]
            }
          </select>
        </FormField>

        {/* Note about admin approval */}
        <div style={{
          gridColumn: '1 / -1',
          padding: '12px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#92400e'
        }}>
          <strong>Note:</strong> New role/unit requests will be sent to admin for approval before appearing in system dropdowns.
        </div>

        {/* Is Active */}
        <FormField label="Active Status" name="is_active">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              id="is_active_checkbox"
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor="is_active_checkbox" style={{ cursor: 'pointer' }}>
              {formData.is_active ? 'Active' : 'Inactive'}
            </label>
          </div>
        </FormField>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-start' }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : editData ? 'Update Master Entry' : 'Save Master Entry'}
        </button>
        <button
          className="btn btn-outline"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset Form
        </button>
      </div>
    </div>
  );
};

export default MasterUpdatingForm;

