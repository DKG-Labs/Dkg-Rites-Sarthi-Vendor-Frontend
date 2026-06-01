// src/components/CalibrationForms.js
// Forms for Calibration & Approval module - Parent-Child Unified Form for Instruments, Approvals, and Gauges

import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import vendorCalibrationService from '../services/vendorCalibrationService';

// Category-specific master options for names
const NAME_OPTIONS = {
  Instrument: [
    { value: '', label: 'Select Instrument/Machine' },
    { value: 'spectrometer', label: 'spectrometer' },
    { value: 'rockwellHardnessTester', label: 'rockwellHardnessTester' },
    { value: 'toeLoadTester', label: 'toeLoadTester' },
    { value: 'provingRing', label: 'provingRing' },
    { value: 'microscope', label: 'microscope' },
    { value: 'surfacePlate', label: 'surfacePlate' },
    { value: 'vernierHeightGauge', label: 'vernierHeightGauge' },
    { value: 'bevelProtector', label: 'bevelProtector' },
    { value: 'vernier', label: 'vernier' },
    { value: 'digitalVernier', label: 'digitalVernier' },
    { value: 'digitalTemperatureControllerWithThermocoupleInHeatingFurnace', label: 'digitalTemperatureControllerWithThermocoupleInHeatingFurnace' },
    { value: 'digitalTemperatureIndicatorWithThermocoupleInQuenchingTank', label: 'digitalTemperatureIndicatorWithThermocoupleInQuenchingTank' },
    { value: 'digitalTemperatureIndicatorAtTemperingFurnace', label: 'digitalTemperatureIndicatorAtTemperingFurnace' },
    { value: 'applicationAndDeflectionFixture', label: 'applicationAndDeflectionFixture' }
  ],
  Document: [
    { value: '', label: 'Select Document Type' },
    { value: 'rdsoApproval', label: 'rdsoApproval' },
    { value: 'qap', label: 'qap' }
  ],
  Gauge: [
    { value: '', label: 'Select Gauge Type' },
    { value: 'dimensionGauge', label: 'dimensionGauge' },
    { value: 'templateForDieRepairing', label: 'templateForDieRepairing' }
  ]
};

// Accreditation Agency options
const ACCREDITATION_AGENCIES = [
  { value: '', label: 'Select Accreditation Agency' },
  { value: 'NABL', label: 'NABL' },
  { value: 'NPL', label: 'NPL' },
  { value: 'Other', label: 'Other' }
];

// Used For options (Inspection Stages)
const USED_FOR_OPTIONS = [
  { value: 'RM Inspection', label: 'RM Inspection' },
  { value: 'Process Inspection', label: 'Process Inspection' },
  { value: 'Final Inspection', label: 'Final Inspection' }
];

const FormField = ({ label, required, hint, children }) => (
  <div className="vendor-form-group">
    <label className="vendor-form-label">
      {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
    </label>
    {children}
    {hint && <div className="vendor-form-hint">{hint}</div>}
  </div>
);

// Modern premium custom dropdown selector
const CustomDropdown = ({ label, value, onChange, options, disabled, placeholder, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="custom-dropdown-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className={`custom-dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''} ${error ? 'has-error' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          borderRadius: '8px',
          border: error ? '1px solid #dc2626' : '1px solid #d1d5db',
          backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          minHeight: '40px',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
          borderColor: isOpen ? '#2563eb' : (error ? '#dc2626' : '#d1d5db')
        }}
      >
        <span style={{ color: selectedOption && selectedOption.value ? '#1e293b' : '#94a3b8' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="dropdown-arrow" style={{ 
          fontSize: '10px', 
          color: '#64748b', 
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </div>
      {isOpen && (
        <div 
          className="custom-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px'
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`custom-dropdown-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                color: value === opt.value ? '#ffffff' : '#334155',
                backgroundColor: value === opt.value ? '#2563eb' : 'transparent',
                transition: 'background-color 0.15s ease',
                fontWeight: value === opt.value ? '600' : 'normal'
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Unified calibration group editor form
export const CalibrationGroupForm = ({
  isOpen,
  onClose,
  onSubmit,
  editData = null, // Can be parent header object
  plants = [],
  isLoading = false,
  categoryPreset = 'Instrument' // Fallback preset
}) => {
  const [parentData, setParentData] = useState({
    category: '',
    certificateFilePath: '',
    certificateFileBase64: '',
    certificateFileName: ''
  });

  const [detailsList, setDetailsList] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setParentData({
          id: editData.id || null,
          category: editData.category || '',
          certificateFilePath: editData.certificateFilePath || '',
          certificateFileBase64: '',
          certificateFileName: editData.certificateFilePath 
            ? (editData.certificateFilePath.startsWith('data:') ? 'Uploaded Certificate' : editData.certificateFilePath.split('/').pop()) 
            : ''
        });

        // Map child details
        const mappedDetails = (editData.details || []).map(d => ({
          id: d.id || null,
          instrumentName: d.instrumentName || d.instrument_name || '',
          capacity: d.capacity || d.capacity_range || '',
          description: d.description || '',
          usedFor: Array.isArray(d.usedFor) ? d.usedFor : (d.usedFor || d.used_for ? (d.usedFor || d.used_for).split(', ') : []),
          serialNumber: d.serialNumber || d.serial_number || '',
          calibrationCertificateNo: d.calibrationCertificateNo || d.calibration_certificate_no || '',
          calibrationDate: d.calibrationDate || d.calibration_date || '',
          calibrationDueDate: d.calibrationDueDate || d.calibration_due_date || '',
          certifyingLabName: d.certifyingLabName || d.certifying_lab_name || '',
          accreditationAgency: d.accreditationAgency || d.accreditation_agency || '',
          notificationDays: d.notificationDays || d.notification_days || 30
        }));

        setDetailsList(mappedDetails.length > 0 ? mappedDetails : [getInitialDetailState()]);
      } else {
        setParentData({
          category: '',
          certificateFilePath: '',
          certificateFileBase64: '',
          certificateFileName: ''
        });
        setDetailsList([getInitialDetailState()]);
      }
      setErrors({});
    }
  }, [isOpen, editData, categoryPreset]);

  function getInitialDetailState() {
    return {
      instrumentName: '',
      capacity: '',
      description: '',
      usedFor: [],
      serialNumber: '',
      calibrationCertificateNo: '',
      calibrationDate: '',
      calibrationDueDate: '',
      certifyingLabName: '',
      accreditationAgency: '',
      notificationDays: 30
    };
  }

  const handleParentChange = (field, value) => {
    setParentData(prev => {
      const updated = { ...prev, [field]: value };
      // Reset details name when category changes to align name options
      if (field === 'category') {
        setDetailsList(details => details.map(d => ({ ...d, instrumentName: '' })));
      }
      return updated;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDetailChange = (index, field, value) => {
    setDetailsList(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));

    // Clear error
    const errKey = `detail_${index}_${field}`;
    if (errors[errKey]) {
      setErrors(prev => ({ ...prev, [errKey]: '' }));
    }
  };

  const handleUsedForToggle = (index, value) => {
    setDetailsList(prev => prev.map((item, idx) => {
      if (idx === index) {
        const currentList = item.usedFor || [];
        const newList = currentList.includes(value)
          ? currentList.filter(v => v !== value)
          : [...currentList, value];
        return { ...item, usedFor: newList };
      }
      return item;
    }));

    const errKey = `detail_${index}_usedFor`;
    if (errors[errKey]) {
      setErrors(prev => ({ ...prev, [errKey]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('📁 File selected:', file ? file.name : 'none');
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('📁 FileReader successfully converted file to base64. Length:', reader.result ? reader.result.length : 0);
        setParentData(prev => ({
          ...prev,
          certificateFileBase64: reader.result,
          certificateFileName: file.name
        }));
      };
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewCertificate = (e) => {
    e.preventDefault();
    const filePath = parentData.certificateFilePath || parentData.certificateFileBase64;
    if (!filePath) return;
    
    if (filePath.startsWith('data:')) {
      try {
        const parts = filePath.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (err) {
        console.error('Error opening base64 document:', err);
        window.open(filePath, '_blank');
      }
    } else {
      const url = vendorCalibrationService.getFileUrl(filePath);
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  const handleAddRow = () => {
    setDetailsList(prev => [...prev, getInitialDetailState()]);
  };

  const handleRemoveRow = (index) => {
    if (detailsList.length === 1) return; // Keep at least one row
    setDetailsList(prev => prev.filter((_, idx) => idx !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!parentData.category) newErrors.category = 'Category is required';

    detailsList.forEach((detail, index) => {
      if (!detail.instrumentName) {
        newErrors[`detail_${index}_instrumentName`] = 'Name is required';
      }
      if (!detail.serialNumber) {
        newErrors[`detail_${index}_serialNumber`] = 'Serial number is required';
      }
      if (!detail.calibrationCertificateNo) {
        newErrors[`detail_${index}_calibrationCertificateNo`] = 'Certificate number is required';
      }
      if (!detail.calibrationDate) {
        newErrors[`detail_${index}_calibrationDate`] = 'Calibration date is required';
      } else if (detail.calibrationDate > today) {
        newErrors[`detail_${index}_calibrationDate`] = 'Must be ≤ today';
      }
      if (!detail.calibrationDueDate) {
        newErrors[`detail_${index}_calibrationDueDate`] = 'Due date is required';
      } else if (detail.calibrationDueDate <= today) {
        newErrors[`detail_${index}_calibrationDueDate`] = 'Must be > today';
      }
      if (!detail.certifyingLabName) {
        newErrors[`detail_${index}_certifyingLabName`] = 'Certifying lab is required';
      }
      if (!detail.accreditationAgency) {
        newErrors[`detail_${index}_accreditationAgency`] = 'Accreditation agency is required';
      }
      if (!detail.usedFor || detail.usedFor.length === 0) {
        newErrors[`detail_${index}_usedFor`] = 'Select at least one inspection stage';
      }
      if (!detail.notificationDays || detail.notificationDays < 1) {
        newErrors[`detail_${index}_notificationDays`] = 'Required (min 1)';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = () => {
    console.log('💾 handleFormSubmit clicked. Current parentData:', parentData);
    if (validateForm()) {
      const payload = {
        ...parentData,
        details: detailsList
      };
      console.log('💾 Submitting payload from CalibrationGroupForm:', payload);
      onSubmit(payload);
    }
  };

  // Names dropdown options based on selected category
  const currentNameOptions = NAME_OPTIONS[parentData.category] || [{ value: '', label: 'Select Category first' }];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? `Edit Calibration Group (${parentData.category})` : 'Register Calibration Records'}
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleFormSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : (editData ? 'Update Records' : 'Save Records')}
          </button>
        </div>
      }
    >
      <div className="vendor-form-grid" style={{ marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
        <FormField label="Category / Type" required>
          <CustomDropdown
            value={parentData.category}
            onChange={(val) => handleParentChange('category', val)}
            disabled={editData !== null}
            placeholder="Select Category"
            error={errors.category}
            options={[
              { value: 'Instrument', label: 'Instrument' },
              { value: 'Document', label: 'Document (Approvals)' },
              { value: 'Gauge', label: 'Gauge' }
            ]}
          />
          {errors.category && <span className="form-error">{errors.category}</span>}
        </FormField>


        <FormField label="Calibration Certificate File Upload" hint="Upload a single PDF file containing certificate proofs">
          <input
            type="file"
            className="vendor-form-input"
            accept=".pdf,image/*"
            onChange={handleFileChange}
          />
          {parentData.certificateFileName && (
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Selected File: {parentData.certificateFileName}</span>
              {(parentData.certificateFilePath || parentData.certificateFileBase64) && (
                <button
                  type="button"
                  onClick={handleViewCertificate}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: '600',
                    padding: '0',
                    fontSize: '12px'
                  }}
                  title="Open certificate document in a new window"
                >
                  (View / Download)
                </button>
              )}
            </div>
          )}
        </FormField>
      </div>

      <div className="details-list-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a5f', margin: 0 }}>
            List of Instruments / Certificates
          </h4>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={handleAddRow}
            style={{ borderColor: '#3b82f6', color: '#2563eb' }}
          >
            + Add Row / Item
          </button>
        </div>

        {detailsList.map((detail, index) => (
          <div
            key={index}
            className="detail-item-card"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              position: 'relative'
            }}
          >
            {detailsList.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveRow(index)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#fee2e2',
                  border: 'none',
                  color: '#ef4444',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
                title="Remove Item"
              >
                ×
              </button>
            )}

            <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
              Item #{index + 1}
            </div>

            <div className="vendor-form-grid">
              <FormField label={parentData.category === 'Document' ? 'Document Type Name' : (parentData.category === 'Gauge' ? 'Gauge Description' : 'Instrument/Machine Name')} required>
                <CustomDropdown
                  value={detail.instrumentName}
                  onChange={(val) => handleDetailChange(index, 'instrumentName', val)}
                  placeholder={parentData.category === 'Document' ? 'Select Document Type' : (parentData.category === 'Gauge' ? 'Select Gauge Type' : 'Select Instrument/Machine')}
                  error={errors[`detail_${index}_instrumentName`]}
                  options={currentNameOptions}
                />
                {errors[`detail_${index}_instrumentName`] && <span className="form-error">{errors[`detail_${index}_instrumentName`]}</span>}
              </FormField>

              {parentData.category !== 'Document' && (
                <FormField label={parentData.category === 'Gauge' ? 'Product Name' : 'Capacity / Range'}>
                  <input
                    type="text"
                    className="vendor-form-input"
                    value={detail.capacity}
                    onChange={(e) => handleDetailChange(index, 'capacity', e.target.value)}
                    placeholder={parentData.category === 'Gauge' ? 'e.g. ERC' : 'e.g. 0-150mm'}
                  />
                </FormField>
              )}

              <FormField label="Description / Details">
                <input
                  type="text"
                  className="vendor-form-input"
                  value={detail.description}
                  onChange={(e) => handleDetailChange(index, 'description', e.target.value)}
                  placeholder="e.g. Calibration details, tags"
                />
              </FormField>

              <FormField label="Serial / Document No." required>
                <input
                  type="text"
                  className="vendor-form-input"
                  value={detail.serialNumber}
                  onChange={(e) => handleDetailChange(index, 'serialNumber', e.target.value)}
                  placeholder="Enter serial number"
                />
                {errors[`detail_${index}_serialNumber`] && <span className="form-error">{errors[`detail_${index}_serialNumber`]}</span>}
              </FormField>

              <FormField label="Certificate Number" required>
                <input
                  type="text"
                  className="vendor-form-input"
                  value={detail.calibrationCertificateNo}
                  onChange={(e) => handleDetailChange(index, 'calibrationCertificateNo', e.target.value)}
                  placeholder="Enter certificate number"
                />
                {errors[`detail_${index}_calibrationCertificateNo`] && <span className="form-error">{errors[`detail_${index}_calibrationCertificateNo`]}</span>}
              </FormField>

              <FormField label={parentData.category === 'Document' ? 'Issue Date' : 'Calibration Date'} required>
                <input
                  type="date"
                  className="vendor-form-input"
                  value={detail.calibrationDate}
                  onChange={(e) => handleDetailChange(index, 'calibrationDate', e.target.value)}
                />
                {errors[`detail_${index}_calibrationDate`] && <span className="form-error">{errors[`detail_${index}_calibrationDate`]}</span>}
              </FormField>

              <FormField label={parentData.category === 'Document' ? 'Valid Till Date' : 'Calibration Due Date'} required>
                <input
                  type="date"
                  className="vendor-form-input"
                  value={detail.calibrationDueDate}
                  onChange={(e) => handleDetailChange(index, 'calibrationDueDate', e.target.value)}
                />
                {errors[`detail_${index}_calibrationDueDate`] && <span className="form-error">{errors[`detail_${index}_calibrationDueDate`]}</span>}
              </FormField>

              <FormField label={parentData.category === 'Document' ? 'Approving Authority' : 'Certifying Lab Name'} required>
                <input
                  type="text"
                  className="vendor-form-input"
                  value={detail.certifyingLabName}
                  onChange={(e) => handleDetailChange(index, 'certifyingLabName', e.target.value)}
                  placeholder="Enter authority / lab name"
                />
                {errors[`detail_${index}_certifyingLabName`] && <span className="form-error">{errors[`detail_${index}_certifyingLabName`]}</span>}
              </FormField>

              {parentData.category !== 'Document' && (
                <FormField label="Accreditation Agency" required>
                  <CustomDropdown
                    value={detail.accreditationAgency}
                    onChange={(val) => handleDetailChange(index, 'accreditationAgency', val)}
                    placeholder="Select Accreditation Agency"
                    error={errors[`detail_${index}_accreditationAgency`]}
                    options={ACCREDITATION_AGENCIES.filter(opt => opt.value !== '')}
                  />
                  {errors[`detail_${index}_accreditationAgency`] && <span className="form-error">{errors[`detail_${index}_accreditationAgency`]}</span>}
                </FormField>
              )}

              <FormField label="Notification Reminder Days" required>
                <input
                  type="number"
                  className="vendor-form-input"
                  value={detail.notificationDays}
                  onChange={(e) => handleDetailChange(index, 'notificationDays', parseInt(e.target.value, 10))}
                  min="1"
                  placeholder="e.g. 30"
                />
                {errors[`detail_${index}_notificationDays`] && <span className="form-error">{errors[`detail_${index}_notificationDays`]}</span>}
              </FormField>

              <div style={{ gridColumn: 'span 2' }}>
                <FormField label="Used for (Inspection Stages)" required>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {USED_FOR_OPTIONS.map(opt => (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500', color: '#475569' }}>
                        <input
                          type="checkbox"
                          checked={detail.usedFor?.includes(opt.value)}
                          onChange={() => handleUsedForToggle(index, opt.value)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {errors[`detail_${index}_usedFor`] && <span className="form-error" style={{ display: 'block', marginTop: '4px' }}>{errors[`detail_${index}_usedFor`]}</span>}
                </FormField>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

// Wrapper configurations for compatibility with dashboard
export const InstrumentForm = ({ isOpen, onClose, onSubmit, masterData, editData, plants, isLoading }) => {
  return (
    <CalibrationGroupForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      editData={editData}
      plants={plants}
      isLoading={isLoading}
      categoryPreset="Instrument"
    />
  );
};

export const ApprovalForm = ({ isOpen, onClose, onSubmit, masterData, editData, plants, isLoading }) => {
  return (
    <CalibrationGroupForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      editData={editData}
      plants={plants}
      isLoading={isLoading}
      categoryPreset="Document"
    />
  );
};

export const GaugeForm = ({ isOpen, onClose, onSubmit, masterData, editData, plants, isLoading }) => {
  return (
    <CalibrationGroupForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      editData={editData}
      plants={plants}
      isLoading={isLoading}
      categoryPreset="Gauge"
    />
  );
};

const CalibrationForms = {
  InstrumentForm,
  ApprovalForm,
  GaugeForm,
  CalibrationGroupForm
};

export default CalibrationForms;
