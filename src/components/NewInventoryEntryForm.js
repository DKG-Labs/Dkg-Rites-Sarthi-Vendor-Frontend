// src/components/NewInventoryEntryForm.js
import { useState, useEffect, useMemo } from 'react';
import '../styles/forms.css';
import { RAW_MATERIAL_GRADE_MAPPING } from '../data/vendorMockData';
import inventoryService from '../services/inventoryService';
import { getStoredUser } from '../services/authService';
import Notification from './Notification';

const initialHeatRow = {
  heatNumber: '',
  tcQuantity: '',
  numberOfBundles: '',
  subPoNumber: '',
  subPoDate: '',
  subPoQty: '',
  invoiceNumber: '',
  invoiceDate: ''
};

const getInitialFormState = () => ({
  rawMaterial: 'Spring Steel Rounds',
  gradeSpecification: '',
  lengthOfBars: '',
  supplierName: '',
  supplierAddress: '',
  unitId: '',
  unitName: '',
  tcNumber: '',
  tcDate: '',
  unitOfMeasurement: 'MT',
  repeatPO: 'no',
  repeatInvoice: 'no',
  heats: [{ ...initialHeatRow }]
});

const NewInventoryEntryForm = ({ masterData = {}, inventoryEntries = [], onSubmit, onCancel, editData = null, isLoading = false }) => {

  const [formData, setFormData] = useState(getInitialFormState);
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [units, setUnits] = useState([]);
  const [isCheckingTC, setIsCheckingTC] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // TC file upload state
  const [tcFileBase64, setTcFileBase64] = useState('');
  const [tcFileName, setTcFileName] = useState('');

  // Debounced TC Number uniqueness check
  useEffect(() => {
    const checkUniqueness = async () => {
      // If we are editing and the TC number is same as original, it's not a duplicate
      if (editData && formData.tcNumber === editData.tcNumber) {
        return;
      }

      // Only check if it's not empty and at least 3 chars to avoid too many calls
      if (formData.tcNumber && formData.tcNumber.length >= 3) {
        setIsCheckingTC(true);
        try {
          const user = getStoredUser();
          const vendorCode = user?.userName;

          if (vendorCode) {
            const response = await inventoryService.checkTcUniqueness(formData.tcNumber, vendorCode);
            if (response.success && response.exists) {
              setErrors(prev => ({
                ...prev,
                tcNumber: 'This TC Number already exists in your inventory.'
              }));
            }
          }
        } catch (error) {
          console.error('Error checking TC uniqueness:', error);
        } finally {
          setIsCheckingTC(false);
        }
      }
    };

    const timer = setTimeout(() => {
      checkUniqueness();
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.tcNumber, editData]);

  // Populating form data when editData changes
  useEffect(() => {
    if (editData) {
      console.log('📝 Editing inventory entry:', editData);

      // Format dates to YYYY-MM-DD for input[type="date"]
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      };

      setFormData({
        rawMaterial: editData.rawMaterial || 'Spring Steel Rounds',
        gradeSpecification: editData.gradeSpecification || '',
        lengthOfBars: editData.lengthOfBars || '',
        supplierName: editData.supplierName || '',
        supplierAddress: editData.supplierAddress || '',
        unitId: editData.unitId || editData.unitName || '',
        unitName: editData.unitName || '',
        tcNumber: editData.tcNumber || '',
        tcDate: formatDateForInput(editData.tcDate),
        unitOfMeasurement: editData.unitOfMeasurement || 'MT',
        repeatPO: 'no',
        repeatInvoice: 'no',
        heats: [{
          heatNumber: editData.heatNumber || '',
          tcQuantity: editData.declaredQuantity || editData.tcQuantity || '',
          numberOfBundles: editData.numberOfBundles || '',
          subPoNumber: editData.subPoNumber || '',
          subPoDate: formatDateForInput(editData.subPoDate),
          subPoQty: editData.subPoQty || '',
          invoiceNumber: editData.invoiceNumber || '',
          invoiceDate: formatDateForInput(editData.invoiceDate),
          rateOfMaterial: editData.rateOfMaterial || '',
          rateOfGst: editData.rateOfGst || ''
        }]
      });
    } else {
      setFormData(getInitialFormState());
      setTcFileBase64('');
      setTcFileName('');
    }
  }, [editData]);

  // Fetch suppliers when raw material is selected
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!formData.rawMaterial) {
        setSuppliers([]);
        return;
      }

      setLoadingSuppliers(true);
      try {
        const response = await inventoryService.getSuppliersByProduct(formData.rawMaterial);
        if (response.success) {
          setSuppliers(response.data || []);
        } else {
          console.error('Failed to fetch suppliers:', response.error);
          setSuppliers([]);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, [formData.rawMaterial]);

  // Fetch units when supplier is selected
  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.supplierName) {
        setUnits([]);
        return;
      }

      setLoadingUnits(true);
      try {
        const response = await inventoryService.getUnitsByCompany(formData.supplierName);
        if (response.success) {
          setUnits(response.data || []);
          // Auto-fill supplier address if not already set (e.g. during initial edit load)
          if (response.data && response.data.length > 0 && response.data[0].address) {
            setFormData(prev => ({
              ...prev,
              supplierAddress: prev.supplierAddress || response.data[0].address
            }));
          }
        } else {
          console.error('Failed to fetch units:', response.error);
          setUnits([]);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
        setUnits([]);
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [formData.supplierName]);

  // Get available grades based on selected raw material
  const availableGrades = useMemo(() => {
    if (!formData.rawMaterial) return [];
    return RAW_MATERIAL_GRADE_MAPPING[formData.rawMaterial] || [];
  }, [formData.rawMaterial]);

  // Dynamic field label for Heat Number based on material
  const getHeatNumberLabel = () => {
    const material = formData.rawMaterial?.toLowerCase() || '';
    if (material.includes('steel') || material.includes('round')) return 'Heat Number';
    if (material.includes('cement') || material.includes('rubber') || material.includes('chemical')) return 'Batch Number';
    if (material.includes('aggregate') || material.includes('sleeper')) return 'Lot Number';
    return 'Heat Number / Batch Number / Lot Number';
  };






  // COMMENTED OUT - Auto-calculation for pricing fields
  // useEffect(() => {
  //   const qty = Number(formData.subPoQty);
  //   const rate = Number(formData.rateOfMaterial);
  //   const gst = Number(formData.rateOfGst);

  //   if (qty > 0 && rate > 0 && !isNaN(qty) && !isNaN(rate)) {
  //     const baseValue = qty * rate;
  //     const totalValue = baseValue + (baseValue * gst) / 100;

  //     setFormData(prev => ({
  //       ...prev,
  //       baseValuePO: baseValue.toFixed(2),
  //       totalPO: totalValue.toFixed(2)
  //     }));
  //   } else {
  //     setFormData(prev => ({
  //       ...prev,
  //       baseValuePO: '',
  //       totalPO: ''
  //     }));
  //   }
  // }, [formData.subPoQty, formData.rateOfMaterial, formData.rateOfGst]);

  // Handle company selection - cascading effect (COMMENTED OUT - No longer needed)
  // const handleCompanyChange = (e) => {
  //   const companyId = e.target.value;
  //   const company = COMPANY_UNIT_MASTER.find(c => c.id === parseInt(companyId));

  //   setFormData(prev => ({
  //     ...prev,
  //     companyId: companyId,
  //     companyName: company?.companyName || '',
  //     // Reset unit fields when company changes
  //     unitId: '',
  //     unitName: ''
  //   }));

  //   // Clear company and unit errors
  //   if (errors.companyId) {
  //     setErrors(prev => ({ ...prev, companyId: '', unitId: '' }));
  //   }
  // };

  // Handle unit selection
  const handleUnitChange = (e) => {
    const unitName = e.target.value;

    // Find the selected unit from the units array
    const selectedUnit = units.find(u => u.unitName === unitName);

    setFormData(prev => ({
      ...prev,
      unitId: unitName, // Using unitName as the ID for now
      unitName: unitName,
      supplierAddress: selectedUnit?.address || prev.supplierAddress
    }));

    // Clear unit error
    if (errors.unitId) {
      setErrors(prev => ({ ...prev, unitId: '' }));
    }
  };

  const handleHeatChange = (index, e) => {
    const { name, value } = e.target;
    const updatedHeats = formData.heats.map((heat, i) => {
      let newHeat = { ...heat };
      if (i === index) {
        newHeat[name] = value;
      }
      return newHeat;
    });

    // Apply repeat logic if enabled
    if (index === 0) {
      if (formData.repeatPO === 'yes') {
        if (['subPoNumber', 'subPoDate', 'subPoQty'].includes(name)) {
          updatedHeats.forEach((heat, i) => {
            if (i > 0) heat[name] = value;
          });
        }
      }
      if (formData.repeatInvoice === 'yes') {
        if (['invoiceNumber', 'invoiceDate'].includes(name)) {
          updatedHeats.forEach((heat, i) => {
            if (i > 0) heat[name] = value;
          });
        }
      }
    }

    setFormData(prev => ({ ...prev, heats: updatedHeats }));

    // Clear heat-related errors
    if (errors[`heats_${index}_${name}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`heats_${index}_${name}`];
        return newErrors;
      });
    }
  };

  const addHeatRow = () => {
    const firstHeat = formData.heats[0];
    const newRow = { ...initialHeatRow };

    // If repeat is ON, pre-fill from first row
    if (formData.repeatPO === 'yes') {
      newRow.subPoNumber = firstHeat.subPoNumber;
      newRow.subPoDate = firstHeat.subPoDate;
      newRow.subPoQty = firstHeat.subPoQty;
    }
    if (formData.repeatInvoice === 'yes') {
      newRow.invoiceNumber = firstHeat.invoiceNumber;
      newRow.invoiceDate = firstHeat.invoiceDate;
    }

    setFormData(prev => ({
      ...prev,
      heats: [...prev.heats, newRow]
    }));
  };

  const removeHeatRow = (index) => {
    if (formData.heats.length > 1) {
      const updatedHeats = formData.heats.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, heats: updatedHeats }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'rawMaterial') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        gradeSpecification: '',
        supplierName: '',
        unitId: '',
        unitName: '',
        supplierAddress: ''
      }));
    } else if (name === 'supplierName') {
      setFormData(prev => ({
        ...prev,
        supplierName: value,
        unitId: '',
        unitName: '',
        supplierAddress: ''
      }));
      if (errors.supplierName) {
        setErrors(prev => ({ ...prev, supplierName: '' }));
      }
    } else if (name === 'repeatPO' || name === 'repeatInvoice') {
      setFormData(prev => {
        const newState = { ...prev, [name]: value };
        if (value === 'yes' && prev.heats.length > 1) {
          const firstHeat = prev.heats[0];
          const updatedHeats = prev.heats.map((heat, i) => {
            if (i === 0) return heat;
            const newHeat = { ...heat };
            if (name === 'repeatPO') {
              newHeat.subPoNumber = firstHeat.subPoNumber;
              newHeat.subPoDate = firstHeat.subPoDate;
              newHeat.subPoQty = firstHeat.subPoQty;
            } else {
              newHeat.invoiceNumber = firstHeat.invoiceNumber;
              newHeat.invoiceDate = firstHeat.invoiceDate;
            }
            return newHeat;
          });
          newState.heats = updatedHeats;
        }
        return newState;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  // const validateForm = () => {
  //   const newErrors = {};
  //   const requiredFields = [
  //     'unitId', // Removed 'companyId' as it's now derived from supplier
  //     'rawMaterial', 'supplierName', 'gradeSpecification', 'heatNumber',
  //     'tcNumber', 'tcDate', 'invoiceNumber', 'invoiceDate',
  //     'subPoNumber', 'subPoDate', 'subPoQty', 'rateOfMaterial',
  //     'rateOfGst', 'declaredQuantity', 'unitOfMeasurement'
  //   ];

  //   requiredFields.forEach(field => {
  //     if (!formData[field]) {
  //       newErrors[field] = 'This field is required';
  //     }
  //   });

  //   // Validate numeric fields
  //   ['subPoQty', 'rateOfMaterial', 'rateOfGst', 'declaredQuantity'].forEach(field => {
  //     if (formData[field] && isNaN(parseFloat(formData[field]))) {
  //       newErrors[field] = 'Must be a valid number';
  //     }
  //   });

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };
  const validateForm = () => {
    const newErrors = {};

    /* SECTION 1 & 2 VALIDATION */
    const section12Fields = [
      'rawMaterial', 'gradeSpecification', 'lengthOfBars', 'supplierName',
      'unitId', 'tcNumber', 'tcDate', 'unitOfMeasurement'
    ];

    section12Fields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    /* SECTION 3 VALIDATION (Heats) */
    formData.heats.forEach((heat, index) => {
      const heatFields = [
        'heatNumber', 'tcQuantity', 'numberOfBundles',
        'subPoNumber', 'subPoDate', 'subPoQty',
        'invoiceNumber', 'invoiceDate'
      ];

      heatFields.forEach(field => {
        if (!heat[field]) {
          newErrors[`heats_${index}_${field}`] = 'Required';
        }
      });

      // Numeric validations
      if (heat.tcQuantity && (isNaN(Number(heat.tcQuantity)) || Number(heat.tcQuantity) <= 0)) {
        newErrors[`heats_${index}_tcQuantity`] = 'Invalid Qty';
      }
      if (heat.numberOfBundles && (isNaN(Number(heat.numberOfBundles)) || Number(heat.numberOfBundles) <= 0)) {
        newErrors[`heats_${index}_numberOfBundles`] = 'Invalid';
      }

      // Business Rules
      if (heat.tcQuantity && heat.subPoQty && Number(heat.subPoQty) < Number(heat.tcQuantity)) {
        newErrors[`heats_${index}_subPoQty`] = 'Sub PO Qty < TC Qty';
      }
    });

    /* TC Uniqueness Check */
    if (errors.tcNumber && errors.tcNumber.includes('already exists')) {
      newErrors.tcNumber = errors.tcNumber;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isCheckingTC) {
      setNotification({ message: 'Please wait while we verify the TC Number uniqueness...', type: 'warning' });
      return;
    }

    if (validateForm()) {
      const user = getStoredUser();
      const vendorCode = user?.userName || '';
      const vendorName = user?.name || '';

      if (editData && editData.id) {
        // UPDATE MODE: Update single entry
        const heat = formData.heats[0];
        const updateData = {
          vendorCode,
          vendorName,
          companyId: editData.companyId || 1,
          companyName: editData.companyName || 'DKG',
          supplierName: formData.supplierName,
          unitName: formData.unitName,
          supplierAddress: formData.supplierAddress,
          rawMaterial: formData.rawMaterial,
          gradeSpecification: formData.gradeSpecification,
          lengthOfBars: Number(formData.lengthOfBars),
          tcNumber: formData.tcNumber,
          tcDate: formData.tcDate,
          unitOfMeasurement: formData.unitOfMeasurement,
          // Single entry fields
          heatNumber: heat.heatNumber,
          declaredQuantity: heat.tcQuantity ? Number(heat.tcQuantity) : 0,
          numberOfBundles: heat.numberOfBundles ? parseInt(heat.numberOfBundles) : null,
          subPoNumber: heat.subPoNumber,
          subPoDate: heat.subPoDate,
          subPoQty: Number(heat.subPoQty),
          invoiceNumber: heat.invoiceNumber,
          invoiceDate: heat.invoiceDate,
          rateOfMaterial: Number(heat.rateOfMaterial),
          rateOfGst: Number(heat.rateOfGst),
          baseValuePO: (Number(heat.tcQuantity) * Number(heat.rateOfMaterial)) || 0,
          totalPO: ((Number(heat.tcQuantity) * Number(heat.rateOfMaterial)) * (1 + (Number(heat.rateOfGst) / 100))) || 0,
          tcFileBase64: tcFileBase64 || null,
          tcFileName: tcFileName || null
        };

        const response = await inventoryService.updateInventoryEntry(editData.id, updateData);

        if (response.success) {
          setNotification({ message: 'Inventory entry updated successfully!', type: 'success' });
          if (onSubmit) {
            setTimeout(() => onSubmit(response.data), 1000);
          }
          handleReset();
        } else {
          setNotification({ message: 'Failed to update entry: ' + (response.error || 'Unknown error'), type: 'error' });
        }
      } else {
        // CREATE BULK MODE
        const bulkData = {
          vendorCode,
          vendorName,
          companyId: 1,
          companyName: 'DKG',
          supplierName: formData.supplierName,
          unitName: formData.unitName,
          supplierAddress: formData.supplierAddress,
          rawMaterial: formData.rawMaterial,
          gradeSpecification: formData.gradeSpecification,
          lengthOfBars: Number(formData.lengthOfBars),
          tcNumber: formData.tcNumber,
          tcDate: formData.tcDate,
          unitOfMeasurement: formData.unitOfMeasurement,
          tcFileBase64: tcFileBase64 || null,
          tcFileName: tcFileName || null,
          heatEntries: formData.heats.map(heat => ({
            heatNumber: heat.heatNumber,
            tcQuantity: Number(heat.tcQuantity),
            numberOfBundles: parseInt(heat.numberOfBundles),
            subPoNumber: heat.subPoNumber,
            subPoDate: heat.subPoDate,
            subPoQty: Number(heat.subPoQty),
            invoiceNumber: heat.invoiceNumber,
            invoiceDate: heat.invoiceDate,
            rateOfMaterial: Number(heat.rateOfMaterial),
            rateOfGst: Number(heat.rateOfGst)
          }))
        };

        const response = await inventoryService.createBulkInventoryEntries(bulkData);

        if (response.success) {
          setNotification({ message: 'Inventory entries created successfully!', type: 'success' });
          if (onSubmit) {
            setTimeout(() => onSubmit(response.data), 1000);
          }
          handleReset();
        } else {
          const errorMsg = response.error || 'Unknown error occurred while creating entries';
          setNotification({ message: 'Failed to create inventory entries: ' + errorMsg, type: 'error' });
        }
      }
    }
  };

  const handleReset = () => {
    setFormData(getInitialFormState());
    setErrors({});
    setTcFileBase64('');
    setTcFileName('');
  };

  // Handle TC file selection — read as base64
  const handleTcFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setNotification({ message: 'File too large. Maximum 15 MB allowed.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setTcFileBase64(reader.result);
      setTcFileName(file.name);
      setNotification({ message: `File "${file.name}" selected.`, type: 'success' });
    };
    reader.onerror = () => setNotification({ message: 'Failed to read file.', type: 'error' });
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };


  return (
    <div className="inventory-entry-form-container">
      <form onSubmit={handleSubmit} className="premium-form">

        {/* Section 1: Autopopulated & Basic Details */}
        <div className="form-section ivory-section">
          <div className="section-header">
            <span className="section-number">1</span>
            <h4 className="section-title">Basic Material & Supplier Info</h4>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Name of Raw Material</label>
              <input type="text" value={formData.rawMaterial} disabled className="input-disabled" />
            </div>
            <div className="form-group">
              <label>Grade / Specification <span className="required">*</span></label>
              <select
                name="gradeSpecification"
                value={formData.gradeSpecification}
                onChange={handleChange}
                className={errors.gradeSpecification ? 'error' : ''}
              >
                <option value="">-- Select Grade --</option>
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.gradeSpecification && <span className="error-msg">{errors.gradeSpecification}</span>}
            </div>
            <div className="form-group">
              <label>Length of Bars <span className="required">*</span></label>
              <select name="lengthOfBars" value={formData.lengthOfBars} onChange={handleChange}>
                <option value="">-- Select Length --</option>
                <option value="6">6 m</option>
                <option value="12">12 m</option>
              </select>
              {errors.lengthOfBars && <span className="error-msg">{errors.lengthOfBars}</span>}
            </div>
            <div className="form-group">
              <label>Supplier Name <span className="required">*</span></label>
              <select name="supplierName" value={formData.supplierName} onChange={handleChange} disabled={loadingSuppliers}>
                <option value="">{loadingSuppliers ? 'Loading...' : '-- Select Supplier --'}</option>
                {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.supplierName && <span className="error-msg">{errors.supplierName}</span>}
            </div>
            <div className="form-group">
              <label>Unit Name <span className="required">*</span></label>
              <select name="unitId" value={formData.unitId} onChange={handleUnitChange} disabled={!formData.supplierName || loadingUnits}>
                <option value="">{loadingUnits ? 'Loading...' : '-- Select Unit --'}</option>
                {units.map(u => <option key={u.unitName} value={u.unitName}>{u.unitName}</option>)}
              </select>
              {errors.unitId && <span className="error-msg">{errors.unitId}</span>}
            </div>
            <div className="form-group full-width">
              <label>Unit Address</label>
              <input type="text" value={formData.supplierAddress} disabled className="input-disabled" />
            </div>
          </div>
        </div>

        {/* Section 2: TC Details & Repetition Options */}
        <div className="form-section ivory-section">
          <div className="section-header">
            <span className="section-number">2</span>
            <h4 className="section-title">Test Certificate & Repeat Options</h4>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>TC Number <span className="required">*</span></label>
              <div className="input-with-loader">
                <input
                  type="text"
                  name="tcNumber"
                  value={formData.tcNumber}
                  onChange={handleChange}
                  className={errors.tcNumber ? 'error' : ''}
                />
                {isCheckingTC && <div className="loader-mini"></div>}
              </div>
              {errors.tcNumber && <span className="error-msg">{errors.tcNumber}</span>}
            </div>
            <div className="form-group">
              <label>TC Date <span className="required">*</span></label>
              <input type="date" name="tcDate" value={formData.tcDate} onChange={handleChange} />
              {errors.tcDate && <span className="error-msg">{errors.tcDate}</span>}
            </div>
            <div className="form-group">
              <label>UOM (Unit of Measurement)</label>
              <input type="text" value={formData.unitOfMeasurement} disabled className="input-disabled" />
            </div>

            {/* TC Document Upload */}
            <div className="form-group full-width">
              <label style={{ fontWeight: 600 }}>Upload TC Document (Combined PDF for all Heats)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                <label htmlFor="tcFileInput" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', background: '#3b82f6', color: '#fff',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500
                }}>
                  📎 {tcFileName ? 'Change File' : 'Browse PDF'}
                </label>
                <input
                  id="tcFileInput"
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={handleTcFileUpload}
                />
                {tcFileName ? (
                  <span style={{ fontSize: '13px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ✅ <strong>{tcFileName}</strong>
                    <button type="button" onClick={() => { setTcFileBase64(''); setTcFileName(''); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                      title="Remove file">✕</button>
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Max 15 MB · PDF only</span>
                )}
                {/* Show existing TC file link when editing */}
                {editData?.tcFilePath && !tcFileName && (
                  <a href="#view-tc" style={{ fontSize: '12px', color: '#3b82f6', marginLeft: '8px' }}
                    onClick={(e) => {
                      e.preventDefault();
                      const user = getStoredUser();
                      const url = inventoryService.getTcFileUrl(formData.tcNumber, user?.userName || '');
                      if (url) window.open(url, '_blank');
                    }}
                  >📄 View Existing TC</a>
                )}
              </div>
            </div>

            <div className="form-group repeat-options">
              <label>Repeat PO for all Heats?</label>
              <div className="radio-group">
                <label><input type="radio" name="repeatPO" value="yes" checked={formData.repeatPO === 'yes'} onChange={handleChange} /> Yes</label>
                <label><input type="radio" name="repeatPO" value="no" checked={formData.repeatPO === 'no'} onChange={handleChange} /> No</label>
              </div>
            </div>
            <div className="form-group repeat-options">
              <label>Repeat Invoice for all Heats?</label>
              <div className="radio-group">
                <label><input type="radio" name="repeatInvoice" value="yes" checked={formData.repeatInvoice === 'yes'} onChange={handleChange} /> Yes</label>
                <label><input type="radio" name="repeatInvoice" value="no" checked={formData.repeatInvoice === 'no'} onChange={handleChange} /> No</label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Dynamic Heat Rows */}
        <div className="form-section heat-section">
          <div className="section-header">
            <span className="section-number">3</span>
            <h4 className="section-title">Heat-wise Details</h4>
            {!editData && (
              <button type="button" className="btn-add-heat" onClick={addHeatRow}>
                + Add Another Heat
              </button>
            )}
          </div>

          <div className="heats-container">
            {formData.heats.map((heat, index) => (
              <div key={index} className="heat-row-card">
                <div className="heat-row-header">
                  <h5>Heat #{index + 1}</h5>
                  {formData.heats.length > 1 && (
                    <button type="button" className="btn-remove-row" onClick={() => removeHeatRow(index)}>Remove</button>
                  )}
                </div>
                <div className="form-grid-mini">
                  <div className="form-group">
                    <label>{getHeatNumberLabel()}</label>
                    <input type="text" name="heatNumber" value={heat.heatNumber} onChange={(e) => handleHeatChange(index, e)} />
                    {errors[`heats_${index}_heatNumber`] && <span className="error-msg">{errors[`heats_${index}_heatNumber`]}</span>}
                  </div>
                  <div className="form-group">
                    <label>Qty in TC (MT)</label>
                    <input type="number" step="0.001" name="tcQuantity" value={heat.tcQuantity} onChange={(e) => handleHeatChange(index, e)} />
                    {errors[`heats_${index}_tcQuantity`] && <span className="error-msg">{errors[`heats_${index}_tcQuantity`]}</span>}
                  </div>
                  <div className="form-group">
                    <label>No. of Bundles</label>
                    <input type="number" name="numberOfBundles" value={heat.numberOfBundles} onChange={(e) => handleHeatChange(index, e)} />
                    {errors[`heats_${index}_numberOfBundles`] && <span className="error-msg">{errors[`heats_${index}_numberOfBundles`]}</span>}
                  </div>
                  <div className="form-group">
                    <label>PO Number</label>
                    <input type="text" name="subPoNumber" value={heat.subPoNumber} onChange={(e) => handleHeatChange(index, e)}
                      disabled={index > 0 && formData.repeatPO === 'yes'} />
                    {errors[`heats_${index}_subPoNumber`] && <span className="error-msg">{errors[`heats_${index}_subPoNumber`]}</span>}
                  </div>
                  <div className="form-group">
                    <label>PO Date</label>
                    <input type="date" name="subPoDate" value={heat.subPoDate} onChange={(e) => handleHeatChange(index, e)}
                      disabled={index > 0 && formData.repeatPO === 'yes'} />
                    {errors[`heats_${index}_subPoDate`] && <span className="error-msg">{errors[`heats_${index}_subPoDate`]}</span>}
                  </div>
                  <div className="form-group">
                    <label>PO Qty (MT)</label>
                    <input type="number" step="0.001" name="subPoQty" value={heat.subPoQty} onChange={(e) => handleHeatChange(index, e)}
                      disabled={index > 0 && formData.repeatPO === 'yes'} />
                    {errors[`heats_${index}_subPoQty`] && <span className="error-msg">{errors[`heats_${index}_subPoQty`]}</span>}
                  </div>
                  <div className="form-group">
                    <label>Invoice No.</label>
                    <input type="text" name="invoiceNumber" value={heat.invoiceNumber} onChange={(e) => handleHeatChange(index, e)}
                      disabled={index > 0 && formData.repeatInvoice === 'yes'} />
                    {errors[`heats_${index}_invoiceNumber`] && <span className="error-msg">{errors[`heats_${index}_invoiceNumber`]}</span>}
                  </div>
                  <div className="form-group">
                    <label>Invoice Date</label>
                    <input type="date" name="invoiceDate" value={heat.invoiceDate} onChange={(e) => handleHeatChange(index, e)}
                      disabled={index > 0 && formData.repeatInvoice === 'yes'} />
                    {errors[`heats_${index}_invoiceDate`] && <span className="error-msg">{errors[`heats_${index}_invoiceDate`]}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Submitting...' : editData ? 'Update Inventory Entry' : 'Submit Inventory Entry'}
          </button>
        </div>
      </form>

      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          autoClose={true}
          autoCloseDelay={5000}
          onClose={() => setNotification({ message: '', type: 'success' })}
        />
      )}
    </div>
  );
};

export default NewInventoryEntryForm;

