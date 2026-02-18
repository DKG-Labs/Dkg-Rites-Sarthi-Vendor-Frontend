// src/components/AddSubPOForm.js
import React, { useState } from 'react';
import '../styles/forms.css';

const AddSubPOForm = ({ selectedPO, selectedItem, onSubmit, isLoading = false }) => {
  const [selectedItemId, setSelectedItemId] = useState(selectedItem?.id || '');
  const [formData, setFormData] = useState({
    raw_material_name: '',
    sub_po_number: '',
    sub_po_date: '',
    contractor: '',
    manufacturer: '',
    purchasing_authority: 'RITES Purchase Division',
    bill_paying_officer: '',
    consignee: '',
    sub_po_quantity: '',
    rate: '',
    vendor_remarks: ''
  });

  const [errors, setErrors] = useState({});

  // Get the currently selected item from PO
  // const getCurrentItem = () => {
  //   if (selectedItem) return selectedItem;
  //   if (selectedItemId && selectedPO?.items) {
  //     return selectedPO.items.find(item => item.id === parseInt(selectedItemId));
  //   }
  //   return null;
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedItemId) {
      newErrors.selectedItemId = 'Please select a PO item';
    }
    if (!formData.raw_material_name.trim()) {
      newErrors.raw_material_name = 'Raw Material Name is required';
    }
    if (!formData.sub_po_number.trim()) {
      newErrors.sub_po_number = 'Sub-PO Number is required';
    }
    if (!formData.sub_po_date) {
      newErrors.sub_po_date = 'Sub-PO Date is required';
    }
    if (!formData.contractor.trim()) {
      newErrors.contractor = 'Contractor is required';
    }
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    if (!formData.bill_paying_officer.trim()) {
      newErrors.bill_paying_officer = 'Bill Paying Officer is required';
    }
    if (!formData.sub_po_quantity || formData.sub_po_quantity <= 0) {
      newErrors.sub_po_quantity = 'Valid Sub-PO Quantity is required';
    }
    if (!formData.rate || formData.rate <= 0) {
      newErrors.rate = 'Valid Rate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // const currentItem = getCurrentItem(); // Removed unused variable
      const subPOData = {
        ...formData,
        po_id: selectedPO.id,
        po_no: selectedPO.po_no,
        po_item_id: parseInt(selectedItemId),
        approval_status: 'Pending Approval',
        submitted_date: new Date().toISOString().split('T')[0],
        call_quantity: 0,
        offered_quantity: 0
      };

      onSubmit(subPOData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ric-form">
      <div className="ric-form-section">
        <h4 className="ric-form-section-title">PO Information</h4>
        <div className="ric-form-grid">
          <div className="ric-form-field">
            <label className="ric-form-label">PO Number</label>
            <input
              type="text"
              className="ric-form-input ric-form-input--disabled"
              value={selectedPO?.po_no || ''}
              disabled
            />
          </div>
          <div className="ric-form-field">
            <label className="ric-form-label">
              Select PO Item <span className="ric-form-required">*</span>
            </label>
            <select
              className="ric-form-select"
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                if (errors.selectedItemId) {
                  setErrors(prev => ({ ...prev, selectedItemId: '' }));
                }
              }}
              disabled={!!selectedItem}
            >
              <option value="">-- Select Item --</option>
              {selectedPO?.items?.map(item => (
                <option key={item.id} value={item.id}>
                  {item.item_name} (Serial: {item.po_serial_no})
                </option>
              ))}
            </select>
            {errors.selectedItemId && (
              <span className="ric-form-error">{errors.selectedItemId}</span>
            )}
          </div>
        </div>
      </div>

      <div className="ric-form-section">
        <h4 className="ric-form-section-title">Sub-PO Details</h4>
        <div className="ric-form-grid">
          <div className="ric-form-field">
            <label className="ric-form-label">
              Raw Material Name <span className="ric-form-required">*</span>
            </label>
            <input
              type="text"
              name="raw_material_name"
              className="ric-form-input"
              value={formData.raw_material_name}
              onChange={handleChange}
              placeholder="Enter raw material name"
            />
            {errors.raw_material_name && (
              <span className="ric-form-error">{errors.raw_material_name}</span>
            )}
          </div>

          <div className="ric-form-field">
            <label className="ric-form-label">
              Sub-PO Number <span className="ric-form-required">*</span>
            </label>
            <input
              type="text"
              name="sub_po_number"
              className="ric-form-input"
              value={formData.sub_po_number}
              onChange={handleChange}
              placeholder="Enter Sub-PO number"
            />
            {errors.sub_po_number && (
              <span className="ric-form-error">{errors.sub_po_number}</span>
            )}
          </div>

          <div className="ric-form-field">
            <label className="ric-form-label">
              Sub-PO Date <span className="ric-form-required">*</span>
            </label>
            <input
              type="date"
              name="sub_po_date"
              className="ric-form-input"
              value={formData.sub_po_date}
              onChange={handleChange}
            />
            {errors.sub_po_date && (
              <span className="ric-form-error">{errors.sub_po_date}</span>
            )}
          </div>

          <div className="ric-form-field">
            <label className="ric-form-label">
              Contractor <span className="ric-form-required">*</span>
            </label>
            <input
              type="text"
              name="contractor"
              className="ric-form-input"
              value={formData.contractor}
              onChange={handleChange}
              placeholder="Enter contractor name"
            />
            {errors.contractor && (
              <span className="ric-form-error">{errors.contractor}</span>
            )}
          </div>

          <div className="ric-form-field">
            <label className="ric-form-label">
              Manufacturer <span className="ric-form-required">*</span>
            </label>
            <input
              type="text"
              name="manufacturer"
              className="ric-form-input"
              value={formData.manufacturer}
              onChange={handleChange}
              placeholder="Enter manufacturer name"
            />
            {errors.manufacturer && (
              <span className="ric-form-error">{errors.manufacturer}</span>
            )}
          </div>

          <div className="ric-form-field">
            <label className="ric-form-label">
              Purchasing Authority <span className="ric-form-required">*</span>
            </label>
            <input
              type="text"
              name="purchasing_authority"
              className="ric-form-input"
              value={formData.purchasing_authority}
              onChange={handleChange}
            />
          </div>

          <div className="ric-form-field">
            <label className="ric-form-label">
              Bill Paying Officer <span className="ric-form-required">*</span>
            </label>
            <input
              type="text"
              name="bill_paying_officer"
              className="ric-form-input"
              value={formData.bill_paying_officer}
              onChange={handleChange}
              placeholder="Enter BPO name"
            />
            {errors.bill_paying_officer && (
              <span className="ric-form-error">{errors.bill_paying_officer}</span>
            )}
          </div>

          <div className="ric-form-field">
            <label className="ric-form-label">
              Consignee <span className="ric-form-required">*</span>
            </label>
            <input
              type="text"
              name="consignee"
              className="ric-form-input"
              value={formData.consignee}
              onChange={handleChange}
            />
          </div>

          <div className="ric-form-field">
            <label className="ric-form-label">
              Sub-PO Quantity <span className="ric-form-required">*</span>
            </label>
            <input
              type="number"
              name="sub_po_quantity"
              className="ric-form-input"
              value={formData.sub_po_quantity}
              onChange={handleChange}
              placeholder="Enter quantity"
              min="1"
            />
            {errors.sub_po_quantity && (
              <span className="ric-form-error">{errors.sub_po_quantity}</span>
            )}
          </div>

          <div className="ric-form-field">
            <label className="ric-form-label">
              Rate (₹) <span className="ric-form-required">*</span>
            </label>
            <input
              type="number"
              name="rate"
              className="ric-form-input"
              value={formData.rate}
              onChange={handleChange}
              placeholder="Enter rate"
              step="0.01"
              min="0.01"
            />
            {errors.rate && (
              <span className="ric-form-error">{errors.rate}</span>
            )}
          </div>

          <div className="ric-form-field" style={{ gridColumn: '1 / -1' }}>
            <label className="ric-form-label">Vendor Remarks</label>
            <textarea
              name="vendor_remarks"
              className="ric-form-input"
              value={formData.vendor_remarks}
              onChange={handleChange}
              placeholder="Enter any remarks or notes"
              rows="3"
            />
          </div>
        </div>
      </div>

      <div className="ric-form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit for Approval'}
        </button>
      </div>
    </form>
  );
};

export default AddSubPOForm;

