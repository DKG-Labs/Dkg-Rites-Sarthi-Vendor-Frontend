import React, { useState, useEffect } from 'react';
import './InitialCalibrationRegistration.css';

const REQUIRED_ITEMS = [
  // Documents (5)
  { id: 'rdsoApprovalFirmErc', category: 'Document', name: 'RDSO Approval of the Firm for ERC Mfg', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },
  { id: 'rdsoApprovalSourceSpringSteel', category: 'Document', name: 'RDSO Approved Source of Manufacturer of Spring Steel Rounds for ERC Mfg', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },
  { id: 'rdsoApprovalGaugesMk3', category: 'Document', name: 'RDSO Approval of Gauges RDSO / T-3746 alt-1 for MK-III', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'rdsoApprovalGaugesMk5', category: 'Document', name: 'RDSO Approval of Gauges RDSO / T-5920 alt-1 for MK-V', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'qapErc', category: 'Document', name: 'RDSO Approved QAP of Firm for ERC mfg', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },

  // Instruments (25)
  { id: 'spectrometer', category: 'Instrument', name: 'Optical emission spectrometer', defaultUsedFor: 'RM Inspection, Final Inspection' },
  { id: 'rockwellHardnessTester1', category: 'Instrument', name: 'Rockwell hardness testing machines (No-1)', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },
  { id: 'rockwellHardnessTester2', category: 'Instrument', name: 'Rockwell hardness testing machines (No-2)', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },
  { id: 'provingRing1', category: 'Instrument', name: 'Proving ring (No-1)', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'provingRing2', category: 'Instrument', name: 'Proving ring (No-2)', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'toeLoadTester', category: 'Instrument', name: 'Toe load testing arrangement', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'applicationDeflectionFixture1', category: 'Instrument', name: 'Application & deflection test fixture (No-1)', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'applicationDeflectionFixture2', category: 'Instrument', name: 'Application & deflection test fixture (No-2)', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'angleCheckingFixture', category: 'Instrument', name: 'Angle checking fixture', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'microscope', category: 'Instrument', name: 'Microscope 100x, 500x, 1000x magnification', defaultUsedFor: 'RM Inspection, Final Inspection' },
  { id: 'utm', category: 'Instrument', name: 'Universal Testing Machine UTM', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'bevelProtector', category: 'Instrument', name: 'Bevel protector', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },
  { id: 'digitalVernier', category: 'Instrument', name: 'Digital Vernier caliper (of 0.02mm accuracy)', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },
  { id: 'triSquare', category: 'Instrument', name: 'Tri-square', defaultUsedFor: 'RM Inspection' },
  { id: 'fillerGauges', category: 'Instrument', name: 'Set of filler gauges', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'lengthCheckingGauge', category: 'Instrument', name: 'Length checking gauge (One Go-No Go gauge for checking of length of cut pieces)', defaultUsedFor: 'RM Inspection' },
  { id: 'surfacePlate18', category: 'Instrument', name: 'Surface plate (18"x18" Min)', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },
  { id: 'surfacePlate12', category: 'Instrument', name: 'Surface plate (12"x12" Min)', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },
  { id: 'heightGaugeVernier', category: 'Instrument', name: 'Height gauge fitted with vernier', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'vernier1', category: 'Instrument', name: 'Vernier calipers (No-1)', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },
  { id: 'vernier2', category: 'Instrument', name: 'Vernier calipers (No-2)', defaultUsedFor: 'RM Inspection, Process Inspection, Final Inspection' },
  { id: 'magneticParticleCrackDetector', category: 'Instrument', name: 'Magnetic particle crack detector', defaultUsedFor: 'RM Inspection' },
  { id: 'heatingFurnacePyrometer', category: 'Instrument', name: 'Heating Furnace- Radiation Pyrometer-', defaultUsedFor: 'Process Inspection' },
  { id: 'quenchingTankThermocouples', category: 'Instrument', name: 'Oil quenching tank: Thermo- couples', defaultUsedFor: 'Process Inspection' },
  { id: 'temperingFurnaceThermocouples', category: 'Instrument', name: 'Tempering furnace: thermo- couples-03 Nos', defaultUsedFor: 'Process Inspection' },

  // Gauges (5)
  { id: 'dimensionGaugeSet1', category: 'Gauge', name: 'Inspection gauges for dimension checking - set No-1', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'dimensionGaugeSet2', category: 'Gauge', name: 'Inspection gauges for dimension checking- Set No-2', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'workingGaugeSet1', category: 'Gauge', name: 'working gauges for dimension checking Set No-1', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'workingGaugeSet2', category: 'Gauge', name: 'working gauges for dimension checking Set No-2', defaultUsedFor: 'Process Inspection, Final Inspection' },
  { id: 'cutBarsGauge', category: 'Gauge', name: 'Gauge for checking length of cut bars', defaultUsedFor: 'RM Inspection' }
];

const ACCREDITATION_AGENCIES = [
  { value: '', label: 'Select Accreditation Agency' },
  { value: 'NABL', label: 'NABL' },
  { value: 'NPL', label: 'NPL' }
];

// IndexedDB Helper functions for storing large Base64 files
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CalibrationDraftDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts');
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

const saveToIndexedDB = async (key, val) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const request = store.put(val, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB save failed', error);
  }
};

const getFromIndexedDB = async (key) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const store = tx.objectStore('drafts');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB get failed', error);
    return null;
  }
};

const removeFromIndexedDB = async (key) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB delete failed', error);
  }
};

const InitialCalibrationRegistration = ({ vendorCode, onSubmit, isLoading }) => {
  const [itemsData, setItemsData] = useState({});
  const [activeItemId, setActiveItemId] = useState(null);
  const [modalErrors, setModalErrors] = useState({});
  const [notification, setNotification] = useState({ message: '', type: 'error' });

  // File upload state
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');

  // Modal form fields state
  const [formFields, setFormFields] = useState({
    serialNumber: '',
    capacity: '',
    description: '',
    usedFor: '',
    calibrationCertificateNo: '',
    calibrationDate: '',
    calibrationDueDate: '',
    certifyingLabName: '',
    accreditationAgency: '',
    notificationDays: 30
  });

  // Load from localStorage/IndexedDB on mount
  useEffect(() => {
    const loadDraft = async () => {
      if (!vendorCode) return;
      try {
        const draftKey = `initialCalibrationDraft_${vendorCode}`;
        const fileNameKey = `initialCalibrationDraft_fileName_${vendorCode}`;
        const fileBase64Key = `initialCalibrationDraft_fileBase64_${vendorCode}`;

        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          setItemsData(JSON.parse(savedDraft));
        }

        const savedFileName = localStorage.getItem(fileNameKey);
        const savedFileBase64 = await getFromIndexedDB(fileBase64Key);
        if (savedFileName && savedFileBase64) {
          setFileName(savedFileName);
          setFileBase64(savedFileBase64);
        }
      } catch (error) {
        console.error('Failed to load initial calibration draft', error);
      }
    };
    loadDraft();
  }, [vendorCode]);

  // Save draft to localStorage whenever itemsData or file details change
  const saveDraft = async (updatedItems, currentFileName = fileName, currentFileBase64 = fileBase64) => {
    if (!vendorCode) return;
    const draftKey = `initialCalibrationDraft_${vendorCode}`;
    const fileNameKey = `initialCalibrationDraft_fileName_${vendorCode}`;
    const fileBase64Key = `initialCalibrationDraft_fileBase64_${vendorCode}`;

    try {
      localStorage.setItem(draftKey, JSON.stringify(updatedItems));
    } catch (error) {
      console.warn('Failed to save items data draft to localStorage:', error);
    }

    if (currentFileName && currentFileBase64) {
      try {
        localStorage.setItem(fileNameKey, currentFileName);
        await saveToIndexedDB(fileBase64Key, currentFileBase64);
      } catch (error) {
        console.warn('Failed to save draft file details:', error);
      }
    } else {
      try {
        localStorage.removeItem(fileNameKey);
        await removeFromIndexedDB(fileBase64Key);
      } catch (error) {
        console.warn('Failed to clear draft file info:', error);
      }
    }
  };

  // Notification helper
  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: 'error' });
    }, 4000);
  };

  // Handle combined certificate file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('File size exceeds 10MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      setFileName(file.name);
      setFileBase64(base64Data);
      saveDraft(itemsData, file.name, base64Data);
      showNotification('Combined calibration certificate uploaded successfully.', 'success');
    };
    reader.onerror = () => {
      showNotification('Failed to read the file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Open modal for a specific row
  const handleRowClick = (item) => {
    setActiveItemId(item.id);
    const existing = itemsData[item.id] || {};
    setFormFields({
      serialNumber: existing.serialNumber || '',
      capacity: existing.capacity || '',
      description: existing.description || '',
      usedFor: existing.usedFor || item.defaultUsedFor || '',
      calibrationCertificateNo: existing.calibrationCertificateNo || '',
      calibrationDate: existing.calibrationDate || '',
      calibrationDueDate: existing.calibrationDueDate || '',
      certifyingLabName: existing.certifyingLabName || '',
      accreditationAgency: existing.accreditationAgency || '',
      notificationDays: existing.notificationDays !== undefined ? existing.notificationDays : 30
    });
    setModalErrors({});
  };

  // Handle modal input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields(prev => ({
      ...prev,
      [name]: value
    }));
    if (modalErrors[name]) {
      setModalErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle stage checkbox changes
  const handleStageChange = (stage, checked) => {
    let currentStages = formFields.usedFor ? formFields.usedFor.split(',').map(s => s.trim()) : [];
    if (checked) {
      if (!currentStages.includes(stage)) {
        currentStages.push(stage);
      }
    } else {
      currentStages = currentStages.filter(s => s !== stage);
    }
    const updatedUsedFor = currentStages.join(', ');
    setFormFields(prev => ({
      ...prev,
      usedFor: updatedUsedFor
    }));
    if (modalErrors.usedFor) {
      setModalErrors(prev => ({
        ...prev,
        usedFor: ''
      }));
    }
  };

  // Validate and save modal details
  const handleSaveModal = () => {
    const errors = {};
    const item = REQUIRED_ITEMS.find(i => i.id === activeItemId);

    if (!formFields.serialNumber.trim()) {
      errors.serialNumber = 'Serial number is required.';
    }
    if (!formFields.calibrationCertificateNo.trim()) {
      errors.calibrationCertificateNo = 'Certificate number is required.';
    }
    if (!formFields.calibrationDate) {
      errors.calibrationDate = 'Calibration date is required.';
    }
    if (!formFields.calibrationDueDate) {
      errors.calibrationDueDate = 'Calibration due date is required.';
    }

    if (formFields.calibrationDate && formFields.calibrationDueDate) {
      const start = new Date(formFields.calibrationDate);
      const end = new Date(formFields.calibrationDueDate);
      if (start > end) {
        errors.calibrationDueDate = 'Due date must be after calibration date.';
      }
    }

    // Accreditations agency is only required for Instruments & Gauges (non-Documents)
    if (item && item.category !== 'Document') {
      if (!formFields.accreditationAgency) {
        errors.accreditationAgency = 'Accreditation agency is required.';
      }
    }
    
    // Certifying Lab Name is required for everything!
    if (!formFields.certifyingLabName.trim()) {
      errors.certifyingLabName = 'Certifying lab name is required.';
    }

    if (!formFields.usedFor || formFields.usedFor.trim() === '') {
      errors.usedFor = 'At least one inspection stage must be selected.';
    }

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    const updated = {
      ...itemsData,
      [activeItemId]: {
        ...formFields,
        capacity: formFields.capacity,
        accreditationAgency: formFields.accreditationAgency,
        id: activeItemId,
        category: item.category,
        instrumentName: item.name,
        calibrationStatus: 'Valid'
      }
    };

    setItemsData(updated);
    saveDraft(updated);
    setActiveItemId(null);
    showNotification(`Details for ${item.name} saved successfully.`, 'success');
  };

  // Calculate completed count
  const completedCount = Object.keys(itemsData).length;
  const isSubmitDisabled = completedCount < REQUIRED_ITEMS.length || !fileBase64;

  const handleFinalSubmit = () => {
    if (isSubmitDisabled) {
      if (!fileBase64) {
        showNotification('Please upload the combined calibration certificates file.', 'error');
      } else {
        showNotification(`Please fill in calibration details for all ${REQUIRED_ITEMS.length} items.`, 'error');
      }
      return;
    }

    // Build API payload
    const payload = {
      isBulkInitialRegistration: true,
      fileData: fileBase64,
      fileName: fileName,
      items: Object.values(itemsData)
    };

    onSubmit(payload);
  };

  return (
    <div className="initial-calib-container">
      {/* Toast Notification */}
      {notification.message && (
        <div className={`initial-calib-toast toast-${notification.type}`}>
          <div className="toast-icon">
            {notification.type === 'success' ? '✓' : '⚠'}
          </div>
          <div className="toast-content">{notification.message}</div>
        </div>
      )}

      {/* Main Header */}
      <div className="initial-calib-header">
        <h2 className="initial-calib-title">Mandatory Calibration Setup</h2>
        <p className="initial-calib-subtitle">
          Welcome! Before you can raise inspection calls, you must register the required {REQUIRED_ITEMS.length} instruments, documents, and gauges. Upload a single document containing all certificates, then click on a row below to fill in its details.
        </p>
      </div>

      {/* Upload combined certificates card */}
      <div className="initial-calib-upload-card">
        <h3 className="upload-title">Upload Combined Calibration Certificates</h3>
        <p className="upload-subtitle">
          {fileName ? (
            <span className="file-uploaded-success">Uploaded: <strong>{fileName}</strong></span>
          ) : (
            'Please upload a single PDF or ZIP file containing the certificates for all required items.'
          )}
        </p>
        <div className="file-input-wrapper">
          <input
            type="file"
            id="combinedCertUpload"
            accept=".pdf,.zip"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="combinedCertUpload" className="btn btn-upload-outline">
            Browse Files
          </label>
        </div>
      </div>

      {/* Progress section */}
      <div className="initial-calib-progress-section">
        <div className="initial-calib-progress-bar-container">
          <div
            className="initial-calib-progress-bar"
            style={{ width: `${(completedCount / REQUIRED_ITEMS.length) * 100}%` }}
          />
        </div>
        <div className="initial-calib-progress-text">
          {completedCount} / {REQUIRED_ITEMS.length} Completed
        </div>
      </div>

      {/* Compact Table */}
      <div className="initial-calib-table-wrapper">
        <table className="initial-calib-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Category</th>
              <th>Name of Document / Instrument / Gauge</th>
              <th>Capacity</th>
              <th>Description</th>
              <th>Used for</th>
              <th>Serial Number</th>
              <th>Calibration Certificate Number</th>
              <th>Calibration Date</th>
              <th>Calibration Due Date</th>
              <th>Certifying Lab Name</th>
              <th>Accreditation Agency</th>
            </tr>
          </thead>
          <tbody>
            {REQUIRED_ITEMS.map((item) => {
              const data = itemsData[item.id] || {};
              const isCompleted = !!data.serialNumber;

              return (
                <tr
                  key={item.id}
                  className={`calib-row ${isCompleted ? 'row-completed' : 'row-pending'}`}
                  onClick={() => handleRowClick(item)}
                >
                  <td>
                    <div className="category-cell">
                      <span className={`category-dot ${isCompleted ? 'dot-completed' : `dot-${item.category.toLowerCase()}`}`} />
                      <span className="category-text">{item.category}</span>
                    </div>
                  </td>
                  <td className="item-name font-semibold">{item.name}</td>
                  <td>{data.capacity || '-'}</td>
                  <td>{data.description || '-'}</td>
                  <td>{data.usedFor || '-'}</td>
                  <td>{data.serialNumber || '-'}</td>
                  <td>{data.calibrationCertificateNo || '-'}</td>
                  <td>{data.calibrationDate || '-'}</td>
                  <td>{data.calibrationDueDate || '-'}</td>
                  <td>{data.certifyingLabName || '-'}</td>
                  <td>{data.accreditationAgency || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Submission Button */}
      <div className="submit-action-container">
        <button
          className="btn btn-premium btn-lg"
          disabled={isSubmitDisabled || isLoading}
          onClick={handleFinalSubmit}
        >
          {isLoading ? 'Submitting Registration...' : 'Complete Registration & Unlock Dashboard'}
        </button>
      </div>

      {/* Edit Details Modal */}
      {activeItemId && (() => {
        const activeItem = REQUIRED_ITEMS.find(i => i.id === activeItemId);
        const isDocument = activeItem?.category === 'Document';
        return (
          <div className="modal-backdrop">
            <div className="modal-content-wrapper">
              <div className="modal-header">
                <h3 className="modal-title">
                  Enter Details for: <span className="highlight-text">{activeItem?.name}</span>
                </h3>
                <button className="close-button" onClick={() => setActiveItemId(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  {/* Row 1: Capacity & Description */}
                  <div className="form-group">
                    <label className="form-label font-medium">Capacity</label>
                    <input
                      type="text"
                      name="capacity"
                      className="form-control"
                      placeholder="e.g. 0-150mm, or ERC"
                      value={formFields.capacity}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label font-medium">Description</label>
                    <input
                      type="text"
                      name="description"
                      className="form-control"
                      placeholder="e.g. Details, tags"
                      value={formFields.description}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Row 2: Serial Number & Certificate Number */}
                  <div className="form-group">
                    <label className="form-label font-medium">Serial Number *</label>
                    <input
                      type="text"
                      name="serialNumber"
                      className={`form-control ${modalErrors.serialNumber ? 'input-error' : ''}`}
                      placeholder="Enter serial number"
                      value={formFields.serialNumber}
                      onChange={handleInputChange}
                    />
                    {modalErrors.serialNumber && <div className="field-error">{modalErrors.serialNumber}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label font-medium">Calibration Certificate Number *</label>
                    <input
                      type="text"
                      name="calibrationCertificateNo"
                      className={`form-control ${modalErrors.calibrationCertificateNo ? 'input-error' : ''}`}
                      placeholder="Enter certificate number"
                      value={formFields.calibrationCertificateNo}
                      onChange={handleInputChange}
                    />
                    {modalErrors.calibrationCertificateNo && <div className="field-error">{modalErrors.calibrationCertificateNo}</div>}
                  </div>

                  {/* Row 3: Calibration Date & Calibration Due Date */}
                  <div className="form-group">
                    <label className="form-label font-medium">Calibration Date *</label>
                    <input
                      type="date"
                      name="calibrationDate"
                      className={`form-control ${modalErrors.calibrationDate ? 'input-error' : ''}`}
                      value={formFields.calibrationDate}
                      onChange={handleInputChange}
                    />
                    {modalErrors.calibrationDate && <div className="field-error">{modalErrors.calibrationDate}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label font-medium">Calibration Due Date *</label>
                    <input
                      type="date"
                      name="calibrationDueDate"
                      className={`form-control ${modalErrors.calibrationDueDate ? 'input-error' : ''}`}
                      value={formFields.calibrationDueDate}
                      onChange={handleInputChange}
                    />
                    {modalErrors.calibrationDueDate && <div className="field-error">{modalErrors.calibrationDueDate}</div>}
                  </div>

                  {/* Row 4: Certifying Lab Name & Accreditation Agency */}
                  <div className="form-group">
                    <label className="form-label font-medium">Certifying Lab Name *</label>
                    <input
                      type="text"
                      name="certifyingLabName"
                      className={`form-control ${modalErrors.certifyingLabName ? 'input-error' : ''}`}
                      placeholder="Enter certifying lab name"
                      value={formFields.certifyingLabName}
                      onChange={handleInputChange}
                    />
                    {modalErrors.certifyingLabName && <div className="field-error">{modalErrors.certifyingLabName}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label font-medium">
                      Accreditation Agency {!isDocument && '*'}
                    </label>
                    <select
                      name="accreditationAgency"
                      className={`form-control ${modalErrors.accreditationAgency ? 'input-error' : ''}`}
                      value={formFields.accreditationAgency}
                      onChange={handleInputChange}
                    >
                      {ACCREDITATION_AGENCIES.map(agency => (
                        <option key={agency.value} value={agency.value}>
                          {agency.label}
                        </option>
                      ))}
                    </select>
                    {modalErrors.accreditationAgency && <div className="field-error">{modalErrors.accreditationAgency}</div>}
                  </div>

                  {/* Used for Checkboxes */}
                  <div className="form-group full-width">
                    <label className="form-label font-medium">Used for (Inspection Stages) *</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formFields.usedFor?.includes('RM Inspection')}
                          onChange={(e) => handleStageChange('RM Inspection', e.target.checked)}
                        />
                        RM Inspection
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formFields.usedFor?.includes('Process Inspection')}
                          onChange={(e) => handleStageChange('Process Inspection', e.target.checked)}
                        />
                        Process Inspection
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formFields.usedFor?.includes('Final Inspection')}
                          onChange={(e) => handleStageChange('Final Inspection', e.target.checked)}
                        />
                        Final Inspection
                      </label>
                    </div>
                    {modalErrors.usedFor && <div className="field-error">{modalErrors.usedFor}</div>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setActiveItemId(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveModal}>Save Details</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default InitialCalibrationRegistration;