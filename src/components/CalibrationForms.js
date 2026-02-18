// src/components/CalibrationForms.js
// Forms for Calibration & Approval module - Instruments, Approvals, and Gauges
// Designed for future backend/API integration

import React, { useState, useEffect } from 'react';
import Modal from './Modal';

// Initial form states for API integration
const getInitialInstrumentState = () => ({
  instrument_name: '',        // System (Admin-configured) - Dropdown
  capacity_range: '',         // System (Admin-configured)
  serial_number: '',          // Manual, required, String - Unique within vendor & category
  calibration_certificate_no: '', // Manual, required, String - Unique within vendor & category
  calibration_date: '',       // Manual, required, Date - ≤ Current Date
  calibration_due_date: '',   // Manual, required, Date - > Current Date
  certifying_lab_name: '',    // Manual, required, String
  accreditation_agency: '',   // Manual, required, Dropdown (NABL/NPL/Other)
  notification_days: ''       // Manual, required, Integer - No. of days for calibration notification
});

const getInitialApprovalState = () => ({
  approval_document_name: '', // System (Admin-configured)
  document_number: '',        // Manual, required, String
  approving_authority: '',    // Manual, required, String
  date_of_issue: '',          // Manual, required, Date
  valid_till: '',             // Manual, required, Date
  notification_days: ''       // Manual, required, Integer - No. of days for calibration notification
});

const getInitialGaugeState = () => ({
  gauge_description: '',      // System (Admin-configured)
  product_name: '',           // Manual, required, Dropdown
  gauge_sr_no: '',            // Manual, required, String
  calibration_certificate_no: '', // Manual, required, String
  calibration_date: '',       // Manual, required, Date
  calibration_due_date: '',   // Manual, required, Date
  certifying_lab_name: '',    // Manual, required, String
  accreditation_agency: '',   // Manual, required, Dropdown (NABL/NPL/Other)
  notification_days: ''       // Manual, required, Integer - No. of days for calibration notification
});

// Accreditation Agency options
const ACCREDITATION_AGENCIES = [
  { value: '', label: 'Select Accreditation Agency' },
  { value: 'NABL', label: 'NABL' },
  { value: 'NPL', label: 'NPL' },
  { value: 'Other', label: 'Other' }
];

// Form Field Component for consistency
const FormField = ({ label, required, hint, children }) => (
  <div className="vendor-form-group">
    <label className="vendor-form-label">
      {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
    </label>
    {children}
    {hint && <div className="vendor-form-hint">{hint}</div>}
  </div>
);

// ============ INSTRUMENT FORM ============
export const InstrumentForm = ({
  isOpen,
  onClose,
  onSubmit,
  masterData = {},  // For future API - will contain instrument_names, etc.
  editData = null,  // For edit mode
  isLoading = false
}) => {
  const [formData, setFormData] = useState(getInitialInstrumentState());
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or editData changes
  useEffect(() => {
    if (isOpen) {
      setFormData(editData || getInitialInstrumentState());
      setErrors({});
    }
  }, [isOpen, editData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!formData.instrument_name) newErrors.instrument_name = 'Instrument name is required';
    if (!formData.serial_number) newErrors.serial_number = 'Serial number is required';
    if (!formData.calibration_certificate_no) newErrors.calibration_certificate_no = 'Certificate number is required';
    if (!formData.calibration_date) {
      newErrors.calibration_date = 'Calibration date is required';
    } else if (formData.calibration_date > today) {
      newErrors.calibration_date = 'Calibration date must be ≤ current date';
    }
    if (!formData.calibration_due_date) {
      newErrors.calibration_due_date = 'Due date is required';
    } else if (formData.calibration_due_date <= today) {
      newErrors.calibration_due_date = 'Due date must be > current date';
    }
    if (!formData.certifying_lab_name) newErrors.certifying_lab_name = 'Certifying lab name is required';
    if (!formData.accreditation_agency) newErrors.accreditation_agency = 'Accreditation agency is required';
    if (!formData.notification_days || formData.notification_days < 1) {
      newErrors.notification_days = 'Notification days is required (min 1)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Prepare data for API submission
      const submitData = {
        ...formData,
        notification_days: parseInt(formData.notification_days, 10),
        // Add any computed fields
        calibration_status: new Date(formData.calibration_due_date) > new Date() ? 'Valid' : 'Expired'
      };
      onSubmit(submitData);
    }
  };

  // Get instrument options from master data or use defaults
  const instrumentOptions = masterData.instruments || [
    { value: '', label: 'Select Instrument/Machine' },
    { value: 'Vernier Caliper', label: 'Vernier Caliper' },
    { value: 'Micrometer', label: 'Micrometer' },
    { value: 'Height Gauge', label: 'Height Gauge' },
    { value: 'Dial Gauge', label: 'Dial Gauge' },
    { value: 'Hardness Tester', label: 'Hardness Tester' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Instrument' : 'Add New Instrument'}
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : (editData ? 'Update' : 'Add Instrument')}
          </button>
        </div>
      }
    >
      <div className="vendor-form-grid">
        <FormField label="Instrument/Machine Name" required hint="System (Admin-configured)">
          <select
            className="vendor-form-select"
            value={formData.instrument_name}
            onChange={(e) => handleChange('instrument_name', e.target.value)}
          >
            {instrumentOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.instrument_name && <span className="form-error">{errors.instrument_name}</span>}
        </FormField>

        <FormField label="Capacity / Range" hint="System (Admin-configured)">
          <input
            type="text"
            className="vendor-form-input"
            value={formData.capacity_range}
            onChange={(e) => handleChange('capacity_range', e.target.value)}
            placeholder="e.g., 0-150mm"
          />
        </FormField>

        <FormField label="Serial Number" required hint="Unique within vendor & category">
          <input
            type="text"
            className="vendor-form-input"
            value={formData.serial_number}
            onChange={(e) => handleChange('serial_number', e.target.value)}
            placeholder="Enter serial number"
          />
          {errors.serial_number && <span className="form-error">{errors.serial_number}</span>}
        </FormField>

        <FormField label="Calibration Certificate Number" required hint="Unique within vendor & category">
          <input
            type="text"
            className="vendor-form-input"
            value={formData.calibration_certificate_no}
            onChange={(e) => handleChange('calibration_certificate_no', e.target.value)}
            placeholder="Enter certificate number"
          />
          {errors.calibration_certificate_no && <span className="form-error">{errors.calibration_certificate_no}</span>}
        </FormField>

        <FormField label="Calibration Date" required hint="Must be ≤ current date">
          <input
            type="date"
            className="vendor-form-input"
            value={formData.calibration_date}
            onChange={(e) => handleChange('calibration_date', e.target.value)}
          />
          {errors.calibration_date && <span className="form-error">{errors.calibration_date}</span>}
        </FormField>

        <FormField label="Calibration Due Date" required hint="Must be > current date. If expired → Non-Compliant">
          <input
            type="date"
            className="vendor-form-input"
            value={formData.calibration_due_date}
            onChange={(e) => handleChange('calibration_due_date', e.target.value)}
          />
          {errors.calibration_due_date && <span className="form-error">{errors.calibration_due_date}</span>}
        </FormField>

        <FormField label="Certifying Lab Name" required>
          <input
            type="text"
            className="vendor-form-input"
            value={formData.certifying_lab_name}
            onChange={(e) => handleChange('certifying_lab_name', e.target.value)}
            placeholder="Enter certifying lab name"
          />
          {errors.certifying_lab_name && <span className="form-error">{errors.certifying_lab_name}</span>}
        </FormField>

        <FormField label="Accreditation Agency" required hint="NABL/NPL/Other">
          <select
            className="vendor-form-select"
            value={formData.accreditation_agency}
            onChange={(e) => handleChange('accreditation_agency', e.target.value)}
          >
            {ACCREDITATION_AGENCIES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.accreditation_agency && <span className="form-error">{errors.accreditation_agency}</span>}
        </FormField>

        <FormField label="No. of Days for Calibration Notification" required>
          <input
            type="number"
            className="vendor-form-input"
            value={formData.notification_days}
            onChange={(e) => handleChange('notification_days', e.target.value)}
            min="1"
            placeholder="e.g., 30"
          />
          {errors.notification_days && <span className="form-error">{errors.notification_days}</span>}
        </FormField>
      </div>
    </Modal>
  );
};

// ============ APPROVAL FORM ============
export const ApprovalForm = ({
  isOpen,
  onClose,
  onSubmit,
  masterData = {},
  editData = null,
  isLoading = false
}) => {
  const [formData, setFormData] = useState(getInitialApprovalState());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(editData || getInitialApprovalState());
      setErrors({});
    }
  }, [isOpen, editData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.approval_document_name) newErrors.approval_document_name = 'Document name is required';
    if (!formData.document_number) newErrors.document_number = 'Document number is required';
    if (!formData.approving_authority) newErrors.approving_authority = 'Approving authority is required';
    if (!formData.date_of_issue) newErrors.date_of_issue = 'Date of issue is required';
    if (!formData.valid_till) newErrors.valid_till = 'Valid till date is required';
    if (!formData.notification_days || formData.notification_days < 1) {
      newErrors.notification_days = 'Notification days is required (min 1)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const submitData = {
        ...formData,
        notification_days: parseInt(formData.notification_days, 10),
        status: new Date(formData.valid_till) > new Date() ? 'Valid' : 'Expired'
      };
      onSubmit(submitData);
    }
  };

  const approvalDocOptions = masterData.approval_documents || [
    { value: '', label: 'Select Approval Document' },
    { value: 'ISO 9001 Certificate', label: 'ISO 9001 Certificate' },
    { value: 'RDSO Vendor Approval', label: 'RDSO Vendor Approval' },
    { value: 'BIS Certificate', label: 'BIS Certificate' },
    { value: 'Quality Certificate', label: 'Quality Certificate' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Approval Document' : 'Add New Approval Document'}
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : (editData ? 'Update' : 'Add Approval')}
          </button>
        </div>
      }
    >
      <div className="vendor-form-grid">
        <FormField label="Name of Approval Document" required hint="System (Admin-configured)">
          <select
            className="vendor-form-select"
            value={formData.approval_document_name}
            onChange={(e) => handleChange('approval_document_name', e.target.value)}
          >
            {approvalDocOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.approval_document_name && <span className="form-error">{errors.approval_document_name}</span>}
        </FormField>

        <FormField label="Document Number" required>
          <input
            type="text"
            className="vendor-form-input"
            value={formData.document_number}
            onChange={(e) => handleChange('document_number', e.target.value)}
            placeholder="Enter document number"
          />
          {errors.document_number && <span className="form-error">{errors.document_number}</span>}
        </FormField>

        <FormField label="Approving Authority" required>
          <input
            type="text"
            className="vendor-form-input"
            value={formData.approving_authority}
            onChange={(e) => handleChange('approving_authority', e.target.value)}
            placeholder="Enter approving authority"
          />
          {errors.approving_authority && <span className="form-error">{errors.approving_authority}</span>}
        </FormField>

        <FormField label="Date of Issue" required>
          <input
            type="date"
            className="vendor-form-input"
            value={formData.date_of_issue}
            onChange={(e) => handleChange('date_of_issue', e.target.value)}
          />
          {errors.date_of_issue && <span className="form-error">{errors.date_of_issue}</span>}
        </FormField>

        <FormField label="Valid Till" required>
          <input
            type="date"
            className="vendor-form-input"
            value={formData.valid_till}
            onChange={(e) => handleChange('valid_till', e.target.value)}
          />
          {errors.valid_till && <span className="form-error">{errors.valid_till}</span>}
        </FormField>

        <FormField label="No. of Days for Notification" required>
          <input
            type="number"
            className="vendor-form-input"
            value={formData.notification_days}
            onChange={(e) => handleChange('notification_days', e.target.value)}
            min="1"
            placeholder="e.g., 30"
          />
          {errors.notification_days && <span className="form-error">{errors.notification_days}</span>}
        </FormField>
      </div>
    </Modal>
  );
};

// ============ GAUGE FORM ============
export const GaugeForm = ({
  isOpen,
  onClose,
  onSubmit,
  masterData = {},
  editData = null,
  isLoading = false
}) => {
  const [formData, setFormData] = useState(getInitialGaugeState());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(editData || getInitialGaugeState());
      setErrors({});
    }
  }, [isOpen, editData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!formData.gauge_description) newErrors.gauge_description = 'Gauge description is required';
    if (!formData.product_name) newErrors.product_name = 'Product name is required';
    if (!formData.gauge_sr_no) newErrors.gauge_sr_no = 'Gauge serial number is required';
    if (!formData.calibration_certificate_no) newErrors.calibration_certificate_no = 'Certificate number is required';
    if (!formData.calibration_date) {
      newErrors.calibration_date = 'Calibration date is required';
    } else if (formData.calibration_date > today) {
      newErrors.calibration_date = 'Calibration date must be ≤ current date';
    }
    if (!formData.calibration_due_date) {
      newErrors.calibration_due_date = 'Due date is required';
    } else if (formData.calibration_due_date <= today) {
      newErrors.calibration_due_date = 'Due date must be > current date';
    }
    if (!formData.certifying_lab_name) newErrors.certifying_lab_name = 'Certifying lab name is required';
    if (!formData.accreditation_agency) newErrors.accreditation_agency = 'Accreditation agency is required';
    if (!formData.notification_days || formData.notification_days < 1) {
      newErrors.notification_days = 'Notification days is required (min 1)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const submitData = {
        ...formData,
        notification_days: parseInt(formData.notification_days, 10),
        calibration_status: new Date(formData.calibration_due_date) > new Date() ? 'Valid' : 'Expired'
      };
      onSubmit(submitData);
    }
  };

  const gaugeOptions = masterData.gauges || [
    { value: '', label: 'Select Gauge Description' },
    { value: 'Go / No-Go Gauge – ERC', label: 'Go / No-Go Gauge – ERC' },
    { value: 'Profile Gauge', label: 'Profile Gauge' },
    { value: 'Ring Gauge', label: 'Ring Gauge' },
    { value: 'Snap Gauge', label: 'Snap Gauge' }
  ];

  const productOptions = masterData.products || [
    { value: '', label: 'Select Product' },
    { value: 'ERC', label: 'ERC' },
    { value: 'Rail', label: 'Rail' },
    { value: 'Sleeper', label: 'Sleeper' },
    { value: 'Fastener', label: 'Fastener' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Gauge' : 'Add New Gauge'}
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : (editData ? 'Update' : 'Add Gauge')}
          </button>
        </div>
      }
    >
      <div className="vendor-form-grid">
        <FormField label="Gauge Description" required hint="System (Admin-configured)">
          <select
            className="vendor-form-select"
            value={formData.gauge_description}
            onChange={(e) => handleChange('gauge_description', e.target.value)}
          >
            {gaugeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.gauge_description && <span className="form-error">{errors.gauge_description}</span>}
        </FormField>

        <FormField label="Product Name" required>
          <select
            className="vendor-form-select"
            value={formData.product_name}
            onChange={(e) => handleChange('product_name', e.target.value)}
          >
            {productOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.product_name && <span className="form-error">{errors.product_name}</span>}
        </FormField>

        <FormField label="Gauge Sr. No." required>
          <input
            type="text"
            className="vendor-form-input"
            value={formData.gauge_sr_no}
            onChange={(e) => handleChange('gauge_sr_no', e.target.value)}
            placeholder="Enter gauge serial number"
          />
          {errors.gauge_sr_no && <span className="form-error">{errors.gauge_sr_no}</span>}
        </FormField>

        <FormField label="Calibration Certificate Number" required>
          <input
            type="text"
            className="vendor-form-input"
            value={formData.calibration_certificate_no}
            onChange={(e) => handleChange('calibration_certificate_no', e.target.value)}
            placeholder="Enter certificate number"
          />
          {errors.calibration_certificate_no && <span className="form-error">{errors.calibration_certificate_no}</span>}
        </FormField>

        <FormField label="Calibration Date" required hint="Must be ≤ current date">
          <input
            type="date"
            className="vendor-form-input"
            value={formData.calibration_date}
            onChange={(e) => handleChange('calibration_date', e.target.value)}
          />
          {errors.calibration_date && <span className="form-error">{errors.calibration_date}</span>}
        </FormField>

        <FormField label="Calibration Due Date" required hint="Must be > current date">
          <input
            type="date"
            className="vendor-form-input"
            value={formData.calibration_due_date}
            onChange={(e) => handleChange('calibration_due_date', e.target.value)}
          />
          {errors.calibration_due_date && <span className="form-error">{errors.calibration_due_date}</span>}
        </FormField>

        <FormField label="Certifying Lab Name" required>
          <input
            type="text"
            className="vendor-form-input"
            value={formData.certifying_lab_name}
            onChange={(e) => handleChange('certifying_lab_name', e.target.value)}
            placeholder="Enter certifying lab name"
          />
          {errors.certifying_lab_name && <span className="form-error">{errors.certifying_lab_name}</span>}
        </FormField>

        <FormField label="Accreditation Agency" required hint="NABL/NPL/Other">
          <select
            className="vendor-form-select"
            value={formData.accreditation_agency}
            onChange={(e) => handleChange('accreditation_agency', e.target.value)}
          >
            {ACCREDITATION_AGENCIES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.accreditation_agency && <span className="form-error">{errors.accreditation_agency}</span>}
        </FormField>

        <FormField label="No. of Days for Calibration Notification" required>
          <input
            type="number"
            className="vendor-form-input"
            value={formData.notification_days}
            onChange={(e) => handleChange('notification_days', e.target.value)}
            min="1"
            placeholder="e.g., 30"
          />
          {errors.notification_days && <span className="form-error">{errors.notification_days}</span>}
        </FormField>
      </div>
    </Modal>
  );
};

const CalibrationForms = { 
  InstrumentForm, 
  ApprovalForm, 
  GaugeForm 
};

export default CalibrationForms;


// export default { InstrumentForm, ApprovalForm, GaugeForm };
