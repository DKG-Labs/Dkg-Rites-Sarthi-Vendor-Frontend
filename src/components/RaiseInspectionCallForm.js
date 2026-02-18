// src/components/RaiseInspectionCallForm.js
// Raising an Inspection Call Form - ERC Raw Material, Process, Final stages
// Based on SARTHI specification for Indian Railways inspection management

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  // COMPANY_UNIT_MASTER, // Commented out - now using POI API instead of mock data
  // MANUFACTURER_MASTER,
  HEAT_TC_MAPPING,
  CHEMICAL_ANALYSIS_HISTORY,
  RM_INSPECTION_CALLS,
  // PROCESS_INSPECTION_CALLS, // Removed unused import
  // LOT_NUMBERS, // Removed unused import
  // ERC_CONVERSION_FACTORS, // Removed - using direct calculation instead
  PO_SERIAL_DETAILS,
  // VENDOR_INVENTORY_ENTRIES, // Import inventory data
  // VENDOR_PO_LIST
} from '../data/vendorMockData';
import inspectionCallService from '../services/inspectionCallService';
import poiMappingService from '../services/poiMappingService';
import HeatSummaryTable from './HeatSummaryTable';
import Notification from './Notification';
import '../styles/raiseInspectionCall.css';

// Multi-Select Dropdown Component
const MultiSelectDropdown = ({ options, selectedValues, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionClick = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} items selected`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.ric-multiselect-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="ric-multiselect-dropdown">
      <div className="ric-multiselect-trigger" onClick={toggleDropdown}>
        <span>{getDisplayText()}</span>
        <span className="ric-multiselect-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="ric-multiselect-options">
          {options.length === 0 ? (
            <div style={{ padding: '12px', color: '#6b7280', textAlign: 'center' }}>
              No options available
            </div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                className={`ric-multiselect-option ${selectedValues.includes(option.value) ? 'ric-multiselect-option--selected' : ''}`}
                onClick={() => handleOptionClick(option.value)}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => { }}
                  className="ric-multiselect-checkbox"
                />
                <span>{option.label}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// MOCK DATA FOR TESTING PROCESS IC (REMOVED - NOW USING REAL API)
// ============================================================
// Mock data removed as we're now fetching real data from the backend API

// Mock RM IC data
// const MOCK_RM_INSPECTION_CALLS = [
//   {
//     icNumber: 'RMIC-001',
//     poSerialNo: 'PO-SR-001',
//     heatNumber: 'H-101',
//     qtyAccepted: 12.5
//   },
//   {
//     icNumber: 'RMIC-002',
//     poSerialNo: 'PO-SR-001',
//     heatNumber: 'H-102',
//     qtyAccepted: 10.0
//   },
//   {
//     icNumber: 'RMIC-003',
//     poSerialNo: 'PO-SR-002',
//     heatNumber: 'H-201',
//     qtyAccepted: 8.75
//   },
//   {
//     icNumber: 'RMIC-004',
//     poSerialNo: 'PO-SR-001',
//     heatNumber: 'H-103',
//     qtyAccepted: 15.0
//   }
// ];


// Helper functions
// const getTodayDate = () => new Date().toISOString().split('T')[0];
const getMaxDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 6);
  return date.toISOString().split('T')[0];
};
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Inspection stage options
const INSPECTION_STAGES = [
  { value: '', label: 'Select Type of Call' },
  { value: 'Raw Material', label: ' Raw Material' },
  { value: 'Process', label: ' Process' },
  { value: 'Final', label: ' Final' }
];

// ERC type options
const ERC_TYPES = [
  { value: '', label: 'Select Type of ERC' },
  { value: 'MK-III', label: 'MK-III' },
  { value: 'MK-V', label: 'MK-V' },
  { value: 'J-Type', label: 'J-Type' }
];

// Form field component - MOVED OUTSIDE to prevent re-creation on every render
const FormField = ({ label, name, required, hint, children, fullWidth = false, errors = {} }) => {
  const hasError = errors[name];

  // Clone children and add error class if there's an error
  const childrenWithError = hasError && children?.props?.className
    ? {
      ...children,
      props: {
        ...children.props,
        className: `${children.props.className} error`
      }
    }
    : children;

  return (
    <div className={`ric-form-group ${fullWidth ? 'ric-form-group--full-width' : ''} ${hasError ? 'has-error' : ''}`}>
      <label className="ric-form-label">
        {label} {required && <span className="ric-required">*</span>}
      </label>
      {childrenWithError}
      {hint && !hasError && <span className="ric-form-hint">{hint}</span>}
      {hasError && <span className="ric-form-error">⚠️ {errors[name]}</span>}
    </div>
  );
};

// Section header component - MOVED OUTSIDE to prevent re-creation on every render
const SectionHeader = ({ title, subtitle }) => (
  <div className="ric-section-header">
    <h4 className="ric-section-title">{title}</h4>
    {subtitle && <p className="ric-section-subtitle">{subtitle}</p>}
  </div>
);

// Initial form state generator
const getInitialFormState = (selectedPO = null) => {
  // Find the first PO serial for the selected PO
  const poSerial = selectedPO ? PO_SERIAL_DETAILS.find(p => p.poNo === selectedPO.po_no) : null;

  return {
    // === COMMON SECTION (Auto Fetched from IREPS) ===
    po_no: selectedPO?.po_no || '',
    po_serial_no: '', // Will be set when user selects from dropdown
    po_date: selectedPO?.po_date || '',
    po_description: selectedPO?.description || '',
    po_qty: 0, // Will be set when user selects PO serial
    po_unit: selectedPO?.unit || '',
    amendment_no: '',
    amendment_date: '',
    vendor_contact_name: '',
    vendor_contact_phone: '',

    // === CALL TYPE ===
    type_of_call: '',
    type_of_erc: '',
    desired_inspection_date: '',

    // === QUANTITY TRACKING (Auto Calculated) ===
    qty_already_inspected_rm: poSerial?.qtyAlreadyInspected?.rm || 0,
    qty_already_inspected_process: poSerial?.qtyAlreadyInspected?.process || 0,
    qty_already_inspected_final: poSerial?.qtyAlreadyInspected?.final || 0,

    // === RAW MATERIAL STAGE FIELDS ===
    // NEW: Array of heat-TC mappings with auto-fetched details
    rm_heat_tc_mapping: [
      {
        id: Date.now(), // Unique ID for React key
        heatNumber: '',
        supplierName: '',
        compositeKey: '', // Composite key: "heatNumber|supplierName" to uniquely identify heat
        tcNumber: '',
        tcDate: '',
        manufacturer: '',
        invoiceNo: '',
        invoiceDate: '',
        subPoNumber: '',
        subPoDate: '',
        subPoQty: '',
        subPoTotalValue: '',
        tcQty: '',
        tcQtyRemaining: '',
        offeredQty: '',
        maxQty: '',
        unit: '',
        isLoading: false,
        isLoadingChemical: false, // Loading state for chemical analysis auto-fetch
        chemicalAutoFetched: false, // Flag to indicate if chemical data was auto-fetched
        chemicalReadOnly: false, // Flag to indicate if chemical data should be read-only
        // Chemical Analysis - Now per heat number
        chemical_carbon: '',
        chemical_manganese: '',
        chemical_silicon: '',
        chemical_sulphur: '',
        chemical_phosphorus: ''
      }
    ],
    rm_total_offered_qty_mt: 0, // Auto-calculated (sum of all heat quantities)
    rm_offered_qty_erc: 0, // Auto-calculated from total

    // === PROCESS STAGE FIELDS ===
    process_rm_ic_numbers: [], // Multi-select from completed RM ICs
    process_book_set_nos: [], // Auto-fetched based on selected RM ICs (array of {icNumber, bookSetNo})
    // NEW: Array of lot-heat mappings
    process_lot_heat_mapping: [
      {
        id: Date.now(),
        lotNumber: '',
        manufacturerHeat: '',
        heatNumber: '',
        manufacturer: '',
        compositeKey: '', // Composite key: "heatNumber|manufacturer" to uniquely identify heat
        offeredQty: '',
        totalAcceptedQtyRm: 0,
        tentativeStartDate: '', // Tentative date of start of production
        isLoading: false
      }
    ],
    process_total_accepted_qty_rm: 0, // Total accepted quantity from selected RM ICs

    // === FINAL STAGE FIELDS ===
    final_lot_numbers: [], // Multi-select dropdown - Lots from Process ICs
    final_selected_lot: '', // Currently selected lot in dropdown (before adding)
    final_manufacturer_heat: '', // Auto-fetched based on selected lots
    final_erc_qty: '', // Free text, integer - Quantity (No. of ERC)
    final_total_qty: '', // Auto-calculated: final_erc_qty * final_hdpe_bags
    final_hdpe_bags: '', // Free text, integer
    final_rm_ic_numbers: [], // Multi-select dropdown
    final_process_ic_numbers: [], // Multi-select dropdown
    final_total_accepted_qty_process: 0, // Total accepted quantity from selected Process ICs
    final_unit_id: '', // Auto-filled from Process IC
    final_unit_name: '', // Auto-filled from Process IC
    final_unit_address: '', // Auto-filled from Process IC
    final_lots_data: [], // Array of { lotNumber, heatNo, acceptedQtyProcess, offeredQty, noOfBags }

    // === PLACE OF INSPECTION ===
    company_id: '', // User selects from dropdown
    company_name: '', // Auto-filled based on company_id selection
    cin: '', // Auto-filled from master data
    unit_id: '',
    unit_name: '',
    unit_address: '',
    unit_gstin: '',
    unit_contact_person: '',
    unit_role: '',

    // === ADDITIONAL ===
    remarks: ''
  };
};

export const RaiseInspectionCallForm = ({
  inventoryEntries = [],
  availableHeatNumbers = [],
  selectedPO = null,
  selectedItem = null,
  selectedSubPO = null,
  vendorId = null,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState(() => getInitialFormState(selectedPO));
  const [errors, setErrors] = useState({});
  const [selectedPoSerial, setSelectedPoSerial] = useState(selectedItem?.po_serial_no || '');

  // State for approved RM ICs and heat numbers (for Process IC)
  // eslint-disable-next-line no-unused-vars
  const [approvedRMICsForProcess, setApprovedRMICsForProcess] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [processHeatNumbers, setProcessHeatNumbers] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loadingRMICs, setLoadingRMICs] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [loadingHeats, setLoadingHeats] = useState(false);

  // Final Inspection Call dropdown states
  const [processIcCertificates, setProcessIcCertificates] = useState([]);
  const [rmIcNumbersForFinal, setRmIcNumbersForFinal] = useState([]);
  const [lotNumbersForFinal, setLotNumbersForFinal] = useState([]);
  const [loadingProcessIcs, setLoadingProcessIcs] = useState(false);
  const [loadingRmIcsForFinal, setLoadingRmIcsForFinal] = useState(false);
  const [loadingLotsForFinal, setLoadingLotsForFinal] = useState(false);

  // State to store lot-heat mapping for Final Inspection
  const [lotHeatMapping, setLotHeatMapping] = useState({});

  // POI (Place of Inspection) states
  const [companies, setCompanies] = useState([]);
  const [units, setUnits] = useState([]);
  const [poiCode, setPoiCode] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingUnitDetails, setLoadingUnitDetails] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({ message: '', type: 'error' });

  // Heat Summary states
  const [heatSummaryData, setHeatSummaryData] = useState([]);
  const [loadingHeatSummary, setLoadingHeatSummary] = useState(false);

  // Handle PO Serial selection
  const handlePoSerialChange = useCallback((serialNo, itemData = null) => {
    const poSerial = PO_SERIAL_DETAILS.find(p => p.serialNo === serialNo);
    if (poSerial) {
      // Use mock data if found
      setSelectedPoSerial(serialNo);
      setFormData(prev => ({
        ...prev,
        po_serial_no: serialNo,
        po_no: poSerial.poNo,
        po_qty: poSerial.poQty,
        po_unit: poSerial.unit,
        amendment_no: poSerial.amendmentNo || '',
        amendment_date: poSerial.amendmentDate || '',
        qty_already_inspected_rm: poSerial.qtyAlreadyInspected.rm,
        qty_already_inspected_process: poSerial.qtyAlreadyInspected.process,
        qty_already_inspected_final: poSerial.qtyAlreadyInspected.final
      }));
    } else if (itemData) {
      // Use real data from API if mock data not found
      setSelectedPoSerial(serialNo);
      setFormData(prev => ({
        ...prev,
        po_serial_no: serialNo,
        po_qty: itemData.item_qty || 0,
        po_unit: itemData.item_unit || '',
        qty_already_inspected_rm: 0,
        qty_already_inspected_process: 0,
        qty_already_inspected_final: 0
      }));
    }
  }, []);

  // Reset form when PO or Item changes
  useEffect(() => {
    setFormData(getInitialFormState(selectedPO));
    setErrors({});

    // Auto-fill PO Serial Number if item is provided
    if (selectedItem?.po_serial_no) {
      setSelectedPoSerial(selectedItem.po_serial_no);
      handlePoSerialChange(selectedItem.po_serial_no, selectedItem);
    }
  }, [selectedPO, selectedItem, handlePoSerialChange]);

  // Get available PO serial numbers for dropdown
  const poSerialOptions = useMemo(() => {
    if (!selectedPO) return PO_SERIAL_DETAILS;
    return PO_SERIAL_DETAILS.filter(p => p.poNo === selectedPO.po_no);
  }, [selectedPO]);

  // Get available heat numbers from inventory
  // const availableHeatNumbers = useMemo(() => {
  //   return HEAT_TC_MAPPING.filter(h => h.qtyAvailable > 0);
  // }, []);

  // Fetch completed RM ICs (certificate numbers) when call type is Process
  useEffect(() => {
    const fetchCompletedRMICs = async () => {
      if (formData.type_of_call === 'Process') {
        setLoadingRMICs(true);

        try {
          console.log('🔍 Fetching completed RM ICs (certificate numbers) for PO Serial No:', formData.po_serial_no);
          const response = await inspectionCallService.getCompletedRmIcNumbers(formData.po_serial_no);
          console.log('📦 Completed certificate numbers response:', response);

          if (response && response.data) {
            // Response.data is an array of certificate numbers (e.g., "N/ER-01080001/RAJK")
            const certificateNumbers = Array.isArray(response.data) ? response.data : [];
            console.log('✅ Setting completed certificate numbers:', certificateNumbers);

            // Convert to the format expected by the dropdown
            // Extract call number from certificate number for API calls
            // Certificate format: "N/ER-01080001/RAJK" → Call number: "ER-01080001"
            const formattedData = certificateNumbers.map(certNo => {
              // Extract call number from certificate number
              // Pattern: N/{CALL_NO}/{SUFFIX} → extract {CALL_NO}
              const callNoMatch = certNo.match(/N\/([^/]+)\//);
              const callNo = callNoMatch ? callNoMatch[1] : certNo;

              return {
                certificate_no: certNo,  // Display value (e.g., "N/ER-01080001/RAJK")
                ic_number: callNo,       // API value (e.g., "ER-01080001")
                label: certNo            // Dropdown label (show certificate number)
              };
            });
            setApprovedRMICsForProcess(formattedData);
          } else {
            console.log('⚠️ Response not successful, setting empty array');
            setApprovedRMICsForProcess([]);
          }
        } catch (error) {
          console.error('❌ Error fetching completed certificate numbers:', error);
          setApprovedRMICsForProcess([]);
        } finally {
          setLoadingRMICs(false);
        }
      } else {
        // Reset when not Process type
        setApprovedRMICsForProcess([]);
      }
    };

    fetchCompletedRMICs();
  }, [formData.type_of_call, formData.po_serial_no]);

  // Fetch companies for POI dropdown on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!vendorId) {
        console.warn('⚠️ No vendorId provided, skipping company fetch');
        return;
      }
      setLoadingCompanies(true);
      try {
        console.log('🏢 Fetching companies for POI dropdown for vendor:', vendorId);
        const response = await poiMappingService.getCompanies(vendorId);
        console.log('📦 Companies response:', response);

        if (response && response.data) {
          const companyList = Array.isArray(response.data) ? response.data : [];
          console.log('✅ Setting companies:', companyList);
          setCompanies(companyList);
        } else {
          console.log('⚠️ Response not successful, setting empty array');
          setCompanies([]);
        }
      } catch (error) {
        console.error('❌ Error fetching companies:', error);
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [vendorId]); // Re-fetch if vendorId changes

  // Fetch units when company is selected
  useEffect(() => {
    const fetchUnits = async () => {
      if (formData.company_name) {
        setLoadingUnits(true);
        try {
          console.log('🏭 Fetching units for company:', formData.company_name);
          const response = await poiMappingService.getUnitsByCompany(formData.company_name);
          console.log('📦 Units response:', response);

          if (response && response.data) {
            const unitList = Array.isArray(response.data) ? response.data : [];
            console.log('✅ Setting units:', unitList);
            setUnits(unitList);
          } else {
            console.log('⚠️ Response not successful, setting empty array');
            setUnits([]);
          }
        } catch (error) {
          console.error('❌ Error fetching units:', error);
          setUnits([]);
        } finally {
          setLoadingUnits(false);
        }
      } else {
        // Reset units when no company selected
        setUnits([]);
      }
    };

    fetchUnits();
  }, [formData.company_name]);

  // Fetch unit details (address and POI code) when both company and unit are selected
  useEffect(() => {
    const fetchUnitDetails = async () => {
      if (formData.company_name && formData.unit_name) {
        setLoadingUnitDetails(true);
        try {
          console.log('📍 Fetching unit details for:', formData.company_name, '-', formData.unit_name);
          const response = await poiMappingService.getUnitDetails(
            formData.company_name,
            formData.unit_name
          );
          console.log('📦 Unit details response:', response);

          if (response && response.data) {
            const { address, poiCode: fetchedPoiCode } = response.data;
            console.log('✅ Setting unit address and POI code:', address, fetchedPoiCode);

            // Update form data with address
            setFormData(prev => ({
              ...prev,
              unit_address: address || ''
            }));

            // Store POI code in state
            setPoiCode(fetchedPoiCode || '');
          } else {
            console.log('⚠️ Response not successful');
            setFormData(prev => ({ ...prev, unit_address: '' }));
            setPoiCode('');
          }
        } catch (error) {
          console.error('❌ Error fetching unit details:', error);
          setFormData(prev => ({ ...prev, unit_address: '' }));
          setPoiCode('');
        } finally {
          setLoadingUnitDetails(false);
        }
      } else {
        // Reset address and POI code when company or unit not selected
        setFormData(prev => ({ ...prev, unit_address: '' }));
        setPoiCode('');
      }
    };

    fetchUnitDetails();
  }, [formData.company_name, formData.unit_name]);

  // Fetch heat numbers when certificate numbers are selected
  // Aggregates heat numbers from ALL selected RM IC numbers
  useEffect(() => {
    const fetchHeatNumbers = async () => {
      if (formData.type_of_call === 'Process' && formData.process_rm_ic_numbers && formData.process_rm_ic_numbers.length > 0) {
        setLoadingHeats(true);

        try {
          console.log(`🔍 Fetching heat numbers for ${formData.process_rm_ic_numbers.length} selected RM IC(s)`);

          // Fetch heat numbers from ALL selected RM ICs
          const allHeatNumbersPromises = formData.process_rm_ic_numbers.map(async (certificateNo) => {
            try {
              console.log(`  📋 Processing certificate: ${certificateNo}`);

              // Extract call number from certificate number for API call
              // Certificate format: "ANYPART/ER-01080001/ANYPART" → Call number: "ER-01080001"
              const callNoMatch = certificateNo.match(/[^/]+\/([^/]+)\//);
              const callNo = callNoMatch ? callNoMatch[1] : certificateNo;
              console.log(`  ✂️ Extracted call number: ${callNo}`);

              const response = await inspectionCallService.getHeatNumbersByRmIcNumber(callNo);

              if (response && response.data && Array.isArray(response.data)) {
                // Add source certificate info to each heat number
                const heatNumbersWithSource = response.data.map(heat => ({
                  ...heat,
                  sourceCertificateNo: certificateNo,
                  sourceCallNo: callNo
                }));
                console.log(`  ✅ Fetched ${heatNumbersWithSource.length} heat numbers from ${certificateNo}`);
                return heatNumbersWithSource;
              } else {
                console.log(`  ⚠️ No heat numbers found for ${certificateNo}`);
                return [];
              }
            } catch (error) {
              console.error(`  ❌ Error fetching heat numbers for ${certificateNo}:`, error);
              return [];
            }
          });

          // Wait for all API calls to complete
          const allHeatNumbersArrays = await Promise.all(allHeatNumbersPromises);

          // Flatten the array of arrays into a single array
          const allHeatNumbers = allHeatNumbersArrays.flat();

          // Remove duplicates based on heat number (keep first occurrence)
          const uniqueHeatNumbers = allHeatNumbers.reduce((acc, current) => {
            const existingHeat = acc.find(heat => heat.heatNumber === current.heatNumber);
            if (!existingHeat) {
              acc.push(current);
            } else {
              // If duplicate found, log it
              console.log(`  ℹ️ Duplicate heat number found: ${current.heatNumber} (from ${current.sourceCertificateNo})`);
            }
            return acc;
          }, []);

          console.log(`📦 Total unique heat numbers from all RM ICs: ${uniqueHeatNumbers.length}`);
          setProcessHeatNumbers(uniqueHeatNumbers);
        } catch (error) {
          console.error('❌ Error fetching heat numbers:', error);
          setProcessHeatNumbers([]);
        } finally {
          setLoadingHeats(false);
        }
      } else {
        setProcessHeatNumbers([]);
      }
    };

    fetchHeatNumbers();
  }, [formData.type_of_call, formData.process_rm_ic_numbers]);

  // Fetch company and unit details from the first selected RM IC for Process inspection
  useEffect(() => {
    const fetchCompanyAndUnitFromRmIc = async () => {
      if (formData.type_of_call === 'Process' &&
        formData.process_rm_ic_numbers &&
        formData.process_rm_ic_numbers.length > 0) {
        try {
          console.log('🏢 Fetching company and unit details from first RM IC');
          console.log('🏢 Selected RM IC certificates:', formData.process_rm_ic_numbers);

          // Get the first selected RM IC certificate number
          const firstCertificateNo = formData.process_rm_ic_numbers[0];
          console.log('🏢 First certificate:', firstCertificateNo);

          // Extract call number from certificate number
          // Certificate format: "ANYPART/ER-01080001/ANYPART" → Call number: "ER-01080001"
          const callNoMatch = firstCertificateNo.match(/[^/]+\/([^/]+)\//);
          const callNo = callNoMatch ? callNoMatch[1] : firstCertificateNo;

          console.log(`  📋 Extracted call number: ${callNo}`);
          console.log(`  📋 Fetching details for IC: ${callNo}`);

          // Fetch full RM IC details
          const response = await inspectionCallService.getRMInspectionCallByICNumber(callNo);

          console.log('  📦 Full RM IC response:', response);

          if (response && response.data) {
            const rmIcData = response.data;
            console.log('  ✅ RM IC data fetched:', rmIcData);
            console.log('  📍 Company ID from RM IC:', rmIcData.companyId, 'Type:', typeof rmIcData.companyId);
            console.log('  📍 Unit ID from RM IC:', rmIcData.unitId, 'Type:', typeof rmIcData.unitId);

            // Update form data with company and unit details from RM IC
            setFormData(prev => {
              const updated = {
                ...prev,
                company_id: rmIcData.companyId || null,
                company_name: rmIcData.companyName || '',
                unit_id: rmIcData.unitId || null,
                unit_name: rmIcData.unitName || '',
                unit_address: rmIcData.unitAddress || ''
              };
              console.log('  🔄 Updating formData with:', {
                company_id: updated.company_id,
                company_name: updated.company_name,
                unit_id: updated.unit_id,
                unit_name: updated.unit_name
              });
              return updated;
            });

            console.log('  ✅ Form update completed');
          } else {
            console.warn('  ⚠️ No data in RM IC response');
          }
        } catch (error) {
          console.error('❌ Error fetching RM IC details:', error);
          console.error('❌ Error stack:', error.stack);
        }
      } else {
        console.log('🏢 Skipping company/unit fetch - conditions not met:', {
          type_of_call: formData.type_of_call,
          has_rm_ic_numbers: formData.process_rm_ic_numbers && formData.process_rm_ic_numbers.length > 0
        });
      }
    };

    fetchCompanyAndUnitFromRmIc();
  }, [formData.type_of_call, formData.process_rm_ic_numbers]);

  // ==================== FINAL INSPECTION CALL DROPDOWN EFFECTS (NEW REVERSED FLOW) ====================

  // Step 1: Fetch RM IC certificates when Final inspection type is selected
  useEffect(() => {
    console.log('🔄 Final IC useEffect triggered - type_of_call:', formData.type_of_call, 'po_serial_no:', formData.po_serial_no);

    const fetchRmIcCertificates = async () => {
      if (formData.type_of_call === 'Final' && formData.po_serial_no) {
        setLoadingRmIcsForFinal(true);
        try {
          console.log('🔍 Fetching RM IC certificates for PO Serial No:', formData.po_serial_no);
          const response = await inspectionCallService.getRmIcCertificates(formData.po_serial_no);
          console.log('📦 RM IC certificates response:', response);

          if (response && response.data) {
            const certificates = Array.isArray(response.data) ? response.data : [];
            console.log('✅ Setting RM IC certificates:', certificates);
            setRmIcNumbersForFinal(certificates);
          } else {
            console.warn('⚠️ No RM IC certificates found');
            setRmIcNumbersForFinal([]);
          }
        } catch (error) {
          console.error('❌ Error fetching RM IC certificates:', error);
          setRmIcNumbersForFinal([]);
        } finally {
          setLoadingRmIcsForFinal(false);
        }
      } else {
        setRmIcNumbersForFinal([]);
      }
    };

    fetchRmIcCertificates();
  }, [formData.type_of_call, formData.po_serial_no]);

  // Step 2: Fetch Process IC certificates when RM IC certificate is selected
  useEffect(() => {
    const fetchProcessIcCertificates = async () => {
      if (formData.type_of_call === 'Final' && formData.final_rm_ic_numbers && formData.final_rm_ic_numbers.length > 0) {
        setLoadingProcessIcs(true);
        try {
          console.log('🔍 Fetching Process IC certificates for multiple RM certificates:', formData.final_rm_ic_numbers);

          // Get Process ICs for ALL selected RM IC certificates
          const response = await inspectionCallService.getProcessIcCertificatesByMultipleRmCertificates(formData.final_rm_ic_numbers);
          console.log('📦 Process IC certificates response:', response);

          if (response && response.data) {
            const certificates = Array.isArray(response.data) ? response.data : [];
            console.log('✅ Setting Process IC certificates:', certificates);
            setProcessIcCertificates(certificates);
          } else {
            console.warn('⚠️ No Process IC certificates found');
            setProcessIcCertificates([]);
          }
        } catch (error) {
          console.error('❌ Error fetching Process IC certificates:', error);
          setProcessIcCertificates([]);
        } finally {
          setLoadingProcessIcs(false);
        }
      } else {
        setProcessIcCertificates([]);
      }
    };

    fetchProcessIcCertificates();
  }, [formData.type_of_call, formData.final_rm_ic_numbers]);

  // Step 3: Fetch Lot numbers when both RM IC and Process IC are selected
  useEffect(() => {
    const fetchLotNumbers = async () => {
      if (formData.type_of_call === 'Final' &&
        formData.final_rm_ic_numbers && formData.final_rm_ic_numbers.length > 0 &&
        formData.final_process_ic_numbers && formData.final_process_ic_numbers.length > 0) {
        setLoadingLotsForFinal(true);
        try {
          // Get lots based on ALL selected RM IC and Process IC certificates (MULTI-SELECT)
          console.log('🔍 Fetching lot numbers for multiple RM certificates:', formData.final_rm_ic_numbers, 'and Process certificates:', formData.final_process_ic_numbers);

          const response = await inspectionCallService.getLotNumbersByMultipleCertificates(formData.final_rm_ic_numbers, formData.final_process_ic_numbers);
          console.log('📦 Lot numbers response:', response);

          if (response && response.data) {
            const lotNumbers = Array.isArray(response.data) ? response.data : [];
            console.log('✅ Setting lot numbers:', lotNumbers);
            setLotNumbersForFinal(lotNumbers);
          } else {
            console.warn('⚠️ No lot numbers found');
            setLotNumbersForFinal([]);
          }
        } catch (error) {
          console.error('❌ Error fetching lot numbers:', error);
          setLotNumbersForFinal([]);
        } finally {
          setLoadingLotsForFinal(false);
        }
      } else {
        setLotNumbersForFinal([]);
      }
    };

    fetchLotNumbers();
  }, [formData.type_of_call, formData.final_rm_ic_numbers, formData.final_process_ic_numbers]);

  // Step 4: Fetch heat numbers for each selected lot
  useEffect(() => {
    const fetchHeatNumbersForLots = async () => {
      if (formData.type_of_call === 'Final' &&
        formData.final_lot_numbers && formData.final_lot_numbers.length > 0 &&
        formData.final_rm_ic_numbers && formData.final_rm_ic_numbers.length > 0) {
        try {
          const newLotHeatMapping = {};

          // Fetch heat numbers for each lot with each selected RM IC (MULTI-SELECT)
          for (const lotNumber of formData.final_lot_numbers) {
            // Try to fetch heat numbers from the first RM IC that has data for this lot
            let heatNumberFound = false;

            for (const rmCertificate of formData.final_rm_ic_numbers) {
              console.log('🔍 Fetching heat numbers for lot:', lotNumber, 'with RM certificate:', rmCertificate);
              const response = await inspectionCallService.getHeatNumbersByLotNumber(lotNumber, rmCertificate);

              if (response && response.data) {
                const heatNumbers = Array.isArray(response.data) ? response.data : [];
                if (heatNumbers.length > 0) {
                  newLotHeatMapping[lotNumber] = heatNumbers[0]; // Take first heat number
                  console.log(`✅ Heat number for lot ${lotNumber}:`, newLotHeatMapping[lotNumber]);
                  heatNumberFound = true;
                  break; // Found heat number, move to next lot
                }
              }
            }

            if (!heatNumberFound) {
              newLotHeatMapping[lotNumber] = '';
            }
          }

          setLotHeatMapping(newLotHeatMapping);
        } catch (error) {
          console.error('❌ Error fetching heat numbers for lots:', error);
        }
      } else {
        setLotHeatMapping({});
      }
    };

    fetchHeatNumbersForLots();
  }, [formData.type_of_call, formData.final_lot_numbers, formData.final_rm_ic_numbers]);

  // Step 5: Sync final_lots_data and fetch acceptedProcessQty
  useEffect(() => {
    const syncFinalLotsData = async () => {
      if (formData.type_of_call === 'Final' &&
        formData.final_lot_numbers && formData.final_lot_numbers.length > 0 &&
        formData.final_process_ic_numbers && formData.final_process_ic_numbers.length > 0) {

        // Extract Request ID from the first Process IC number
        const processCert = formData.final_process_ic_numbers[0];
        const callNoMatch = processCert.match(/[^/]+\/([^/]+)\//);
        const requestId = callNoMatch ? callNoMatch[1] : processCert;

        const updatedLotsData = await Promise.all(formData.final_lot_numbers.map(async (lotNumber) => {
          const existing = formData.final_lots_data.find(l => l.lotNumber === lotNumber);
          const heatNo = lotHeatMapping[lotNumber] || '';

          let acceptedQtyProcess = existing?.acceptedQtyProcess || 0;

          // Fetch acceptedQtyProcess if heatNo is available and we don't have it yet or lot/heat changed
          if (heatNo && requestId) {
            try {
              const response = await inspectionCallService.getAcceptedQtyForLot(requestId, lotNumber, heatNo);
              if (response && response.success) {
                acceptedQtyProcess = response.data || 0;
              }
            } catch (error) {
              console.error(`Error fetching accepted qty for lot ${lotNumber}:`, error);
            }
          }

          return {
            lotNumber,
            heatNo,
            acceptedQtyProcess,
            offeredQty: existing?.offeredQty || '',
            noOfBags: existing?.noOfBags || ''
          };
        }));

        setFormData(prev => ({ ...prev, final_lots_data: updatedLotsData }));
      } else {
        setFormData(prev => ({ ...prev, final_lots_data: [] }));
      }
    };

    syncFinalLotsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type_of_call, formData.final_lot_numbers, formData.final_process_ic_numbers, lotHeatMapping]);

  // Get available RM ICs for Process stage
  // const availableRmIcs = useMemo(() => {
  //   return RM_INSPECTION_CALLS.filter(ic => ic.status === 'Completed');
  // }, []);

  // Get available Process ICs for Final stage
  // const availableProcessIcs = useMemo(() => {
  //   return PROCESS_INSPECTION_CALLS.filter(ic => ic.status === 'Completed');
  // }, []);

  // Get available lot numbers
  // const availableLots = useMemo(() => {
  //   return LOT_NUMBERS.filter(l => l.qtyAvailable > 0);
  // }, []);

  // Get units for selected company - COMMENTED OUT - now using POI API
  // const unitOptions = useMemo(() => {
  //   const company = COMPANY_UNIT_MASTER.find(c => c.id === parseInt(formData.company_id));
  //   return company?.units || [];
  // }, [formData.company_id]);

  // Calculate ERC quantity from MT (for Raw Material)
  const calculateErcFromMt = useCallback((mtQty, ercType) => {
    if (!mtQty || !ercType) return 0;

    const qty = parseFloat(mtQty);
    if (isNaN(qty) || qty <= 0) return 0;

    let maxErc = 0;
    if (ercType === 'MK-III') {
      // Formula: (mtQty * 1000) / 0.928426
      maxErc = (qty * 1000) / 0.928426;
    } else if (ercType === 'MK-V') {
      // Formula: (mtQty * 1000) / 1.15321
      maxErc = (qty * 1000) / 1.15321;
    } else if (ercType === 'J-Type') {
      // Formula: (mtQty * 1000) / 1.100
      maxErc = (qty * 1000) / 1.100;
    }

    return Math.floor(maxErc);
  }, []);

  // Calculate maximum ERC that can be manufactured from a specific heat-TC mapping
  const calculateMaxErcForHeat = useCallback((offeredQty, ercType) => {
    if (!offeredQty || !ercType) return 0;

    const qty = parseFloat(offeredQty);
    if (isNaN(qty) || qty <= 0) return 0;

    let maxErc = 0;
    if (ercType === 'MK-III') {
      // Formula: (offeredQty * 1000) / 0.928426
      maxErc = (qty * 1000) / 0.928426;
    } else if (ercType === 'MK-V') {
      // Formula: (offeredQty * 1000) / 1.15321
      maxErc = (qty * 1000) / 1.15321;
    } else if (ercType === 'J-Type') {
      // Use default conversion factor for J-Type
      maxErc = (qty * 1000) / 1.100;
    }

    return Math.floor(maxErc);
  }, []);

  // Format number with thousand separators
  const formatNumber = useCallback((num) => {
    if (!num || isNaN(num)) return '0';
    return num.toLocaleString('en-IN');
  }, []);

  // Calculate remaining quantity for each stage
  // eslint-disable-next-line no-unused-vars
  const remainingQty = useMemo(() => {
    const poSerial = PO_SERIAL_DETAILS.find(p => p.serialNo === formData.po_serial_no);
    if (!poSerial) return { rm: 0, process: 0, final: 0 };

    return {
      rm: poSerial.poQty - poSerial.qtyAlreadyInspected.rm,
      process: poSerial.qtyAlreadyInspected.rm - poSerial.qtyAlreadyInspected.process,
      final: poSerial.qtyAlreadyInspected.process - poSerial.qtyAlreadyInspected.final
    };
  }, [formData.po_serial_no]);

  // Auto-calculate total offered quantity and ERC when heat-TC mappings change
  useEffect(() => {
    if (formData.type_of_call === 'Raw Material' && formData.rm_heat_tc_mapping.length > 0) {
      const totalMt = formData.rm_heat_tc_mapping.reduce((sum, heat) => {
        return sum + (parseFloat(heat.offeredQty) || 0);
      }, 0);
      // Pass the type_of_erc to calculate correctly based on selected ERC type
      const ercQty = calculateErcFromMt(totalMt, formData.type_of_erc);
      setFormData(prev => ({
        ...prev,
        rm_total_offered_qty_mt: totalMt,
        rm_offered_qty_erc: ercQty
      }));
    } else if (formData.type_of_call === 'Raw Material' && formData.rm_heat_tc_mapping.length === 0) {
      setFormData(prev => ({
        ...prev,
        rm_total_offered_qty_mt: 0,
        rm_offered_qty_erc: 0
      }));
    }
  }, [formData.rm_heat_tc_mapping, formData.type_of_call, formData.type_of_erc, calculateErcFromMt]);

  // Use availableHeatNumbers from props (fetched from /api/vendor/available-heat-numbers/{vendorCode})
  // This endpoint returns only heat numbers with:
  // - Remaining quantity > 0
  // - Status != EXHAUSTED
  //
  // Note: UNDER_INSPECTION, ACCEPTED, and REJECTED entries are still available for selection.
  // Only EXHAUSTED entries are filtered out at the backend level.

  // If availableHeatNumbers prop is empty, fall back to filtering inventoryEntries (for backward compatibility)
  const heatNumbersForDropdown = useMemo(() => {
    // Helper function to filter by grade based on ERC type and Call type
    const filterByGrade = (entries) => {
      // Only apply grade filtering for Raw Material calls
      if (formData.type_of_call !== 'Raw Material') {
        return entries;
      }

      // Only apply filtering if both Type of ERC and Type of Call are selected
      if (!formData.type_of_erc || formData.type_of_erc === '') {
        return entries;
      }

      // Filter based on Type of ERC
      if (formData.type_of_erc === 'MK-III') {
        // MK-III + Raw Material: Only show grade "55Si7 20.64MM"
        const filtered = entries.filter(entry => {
          const grade = entry.gradeSpecification || '';
          const matches = grade.includes('55Si7') && grade.includes('20.64');
          if (!matches) {
            console.log(`🚫 Filtering out ${entry.heatNumber} - Grade: ${grade} (MK-III requires 55Si7 20.64MM)`);
          }
          return matches;
        });
        console.log(`🔍 MK-III + Raw Material filter: ${filtered.length} of ${entries.length} heat numbers match grade 55Si7 20.64MM`);
        return filtered;
      } else if (formData.type_of_erc === 'MK-V') {
        // MK-V + Raw Material: Only show grade "55Si7 23MM"
        const filtered = entries.filter(entry => {
          const grade = entry.gradeSpecification || '';
          const matches = grade.includes('55Si7') && grade.includes('23');
          if (!matches) {
            console.log(`🚫 Filtering out ${entry.heatNumber} - Grade: ${grade} (MK-V requires 55Si7 23MM)`);
          }
          return matches;
        });
        console.log(`🔍 MK-V + Raw Material filter: ${filtered.length} of ${entries.length} heat numbers match grade 55Si7 23MM`);
        return filtered;
      }

      // For other ERC types (J-Type), return all entries
      return entries;
    };

    if (availableHeatNumbers && availableHeatNumbers.length > 0) {
      console.log('✅ Using availableHeatNumbers from API:', availableHeatNumbers.length);
      console.log('📊 Available heat numbers:', availableHeatNumbers);

      // Apply grade filtering to API results
      const gradeFiltered = filterByGrade(availableHeatNumbers);
      return gradeFiltered;
    }

    // Fallback: filter from inventoryEntries
    // IMPORTANT: Only exclude EXHAUSTED entries. All other statuses are available.
    console.log('⚠️ Falling back to filtering inventoryEntries');
    console.warn('⚠️ API call may have failed - using fallback filtering logic');

    const filtered = inventoryEntries
      .filter(entry => {
        // Explicitly exclude EXHAUSTED status only
        if (entry.status === 'EXHAUSTED' || entry.status === 'Exhausted') {
          console.log(`🚫 Filtering out EXHAUSTED entry: ${entry.heatNumber}`);
          return false;
        }

        // Include all other statuses (FRESH_PO, UNDER_INSPECTION, ACCEPTED, REJECTED)
        // as long as there's remaining quantity
        const hasQuantity = entry.qtyLeftForInspection > 0;

        if (hasQuantity) {
          console.log(`✅ Including entry: ${entry.heatNumber} (Status: ${entry.status}, Qty: ${entry.qtyLeftForInspection})`);
        } else {
          console.log(`⚠️ Excluding entry (no quantity): ${entry.heatNumber} (Status: ${entry.status})`);
        }

        return hasQuantity;
      })
      .map(entry => ({
        heatNumber: entry.heatNumber,
        tcNumber: entry.tcNumber,
        rawMaterial: entry.rawMaterial,
        supplierName: entry.supplierName,
        gradeSpecification: entry.gradeSpecification, // Include grade for filtering
        qtyLeft: entry.qtyLeftForInspection,
        unit: entry.unitOfMeasurement,
        status: entry.status // Include status for debugging
      }));

    console.log(`📊 Fallback filtered ${filtered.length} available heat numbers from ${inventoryEntries.length} total entries`);
    console.log(`📋 Included statuses: FRESH_PO, UNDER_INSPECTION, ACCEPTED, REJECTED (excluding EXHAUSTED)`);

    // Apply grade filtering to fallback results
    const gradeFiltered = filterByGrade(filtered);
    return gradeFiltered;
  }, [availableHeatNumbers, inventoryEntries, formData.type_of_erc, formData.type_of_call]);

  // Get available heat numbers for a specific heat mapping dropdown
  // Shows ALL heat numbers (no filtering based on selection)
  // Deduplicates based on composite key (heatNumber + supplierName)
  const getAvailableHeatNumbersForDropdown = useCallback((currentHeatMappingId) => {
    // Deduplicate heat numbers based on composite key
    const seenCompositeKeys = new Set();
    const deduplicatedHeats = [];

    heatNumbersForDropdown.forEach(heat => {
      const compositeKey = `${heat.heatNumber}|${heat.supplierName}`;
      // Only add if we haven't seen this composite key before
      if (!seenCompositeKeys.has(compositeKey)) {
        seenCompositeKeys.add(compositeKey);
        deduplicatedHeats.push(heat);
      }
    });

    console.log(`📋 Heat numbers for dropdown ${currentHeatMappingId}:`, {
      total: heatNumbersForDropdown.length,
      deduplicated: deduplicatedHeats.length
    });

    return deduplicatedHeats;
  }, [heatNumbersForDropdown]);

  // Get available TC numbers for a specific heat number and supplier/manufacturer
  // Filters out TC numbers that are already selected in other heat sections
  const getAvailableTcNumbers = useCallback((heatNumber, supplierName = null, currentHeatMappingId = null) => {
    if (!heatNumber) return [];

    const tcList = [];
    // Find all inventory entries matching this heat number and supplier (if provided)
    // Filter out entries where TC Qty Remaining (qtyLeftForInspection) is 0 or less
    const matchingEntries = inventoryEntries.filter(entry => {
      const heatMatches = entry.heatNumber === heatNumber;
      const supplierMatches = !supplierName || entry.supplierName === supplierName;
      const hasRemainingQty = entry.qtyLeftForInspection > 0;
      return heatMatches && supplierMatches && hasRemainingQty;
    });

    matchingEntries.forEach(entry => {
      if (!tcList.find(tc => tc.tcNumber === entry.tcNumber)) {
        tcList.push({
          tcNumber: entry.tcNumber,
          heatNumber: entry.heatNumber,
          manufacturer: entry.supplierName,
          tcDate: entry.tcDate
        });
      }
    });

    // Fallback to old HEAT_TC_MAPPING if not found in inventory
    if (tcList.length === 0) {
      const heat = HEAT_TC_MAPPING.find(h => h.heatNumber === heatNumber && (!supplierName || h.manufacturer === supplierName));
      if (heat) {
        tcList.push({
          tcNumber: heat.tcNumber,
          heatNumber: heat.heatNumber,
          manufacturer: heat.manufacturer,
          tcDate: heat.tcDate
        });
      }
    }

    // Filter out TC numbers that are already selected in other heat sections
    const selectedTcNumbers = formData.rm_heat_tc_mapping
      .filter(heat => heat.id !== currentHeatMappingId && heat.tcNumber)
      .map(heat => heat.tcNumber);

    const filteredTcList = tcList.filter(tc => !selectedTcNumbers.includes(tc.tcNumber));

    console.log(`📋 TC numbers for heat ${heatNumber}:`, {
      total: tcList.length,
      filtered: filteredTcList.length,
      selectedInOtherSections: selectedTcNumbers.length,
      selectedTcNumbers,
      note: 'Excluded TC numbers with 0 remaining quantity'
    });

    return filteredTcList;
  }, [inventoryEntries, formData.rm_heat_tc_mapping]);

  // OLD CODE - Commented out as we now handle per heat-TC combination
  // const availableTcNumbers = useMemo(() => { ... }, [formData.rm_heat_numbers]);
  // useEffect(() => { ... }, [formData.rm_tc_number]);

  // Handle unit selection - COMMENTED OUT - now using POI API
  // const handleUnitChange = (unitId) => {
  //   const company = COMPANY_UNIT_MASTER.find(c => c.id === parseInt(formData.company_id));
  //   const unit = company?.units.find(u => u.id === parseInt(unitId));
  //   setFormData(prev => ({
  //     ...prev,
  //     unit_id: unitId,
  //     unit_name: unit?.unitName || '',
  //     unit_address: unit?.address || '',
  //     unit_gstin: unit?.gstin || '',
  //     unit_contact_person: unit?.contactPerson || '',
  //     unit_role: unit?.roleOfUnit || ''
  //   }));
  // };

  // Handle RM IC selection for Process stage
  const handleRmIcSelection = async (selectedIcNumbers) => {
    // Get book/set numbers for selected ICs
    const bookSetNos = selectedIcNumbers.map(icNumber => {
      const ic = RM_INSPECTION_CALLS.find(ic => ic.icNumber === icNumber);
      return { icNumber, bookSetNo: ic?.bookSetNo || '' };
    });

    // Calculate total accepted quantity from selected RM ICs
    const totalAccepted = selectedIcNumbers.reduce((sum, icNumber) => {
      const ic = RM_INSPECTION_CALLS.find(ic => ic.icNumber === icNumber);
      return sum + (ic?.qtyAccepted || 0);
    }, 0);

    // Fetch company_id and unit_id from the first selected RM IC
    let companyId = '';
    let unitId = '';
    let companyName = '';
    let unitName = '';
    let unitAddress = '';

    if (selectedIcNumbers.length > 0) {
      try {
        const certificateNo = selectedIcNumbers[0];
        console.log(`📋 Fetching company and unit details from first RM IC Certificate: ${certificateNo}`);

        // Use the certificate number to fetch RM IC details
        const rmIcDetails = await inspectionCallService.getRmIcDetailsByCertificateNo(certificateNo);

        console.log(`📊 Full API Response:`, rmIcDetails);

        if (rmIcDetails && rmIcDetails.data) {
          const details = rmIcDetails.data;
          console.log(`📋 Extracted details object:`, details);

          // Try both camelCase and snake_case field names
          companyId = details.companyId || details.company_id || '';
          unitId = details.unitId || details.unit_id || '';
          companyName = details.companyName || details.company_name || '';
          unitName = details.unitName || details.unit_name || '';
          unitAddress = details.unitAddress || details.unit_address || '';

          console.log(`✅ Fetched company and unit details:`, {
            companyId,
            unitId,
            companyName,
            unitName,
            unitAddress
          });

          // If company_id or unit_id is NULL, we need to look them up from company/unit master
          if (!companyId || !unitId) {
            console.warn(`⚠️ WARNING: companyId or unitId is NULL in RM IC record!`);
            console.warn(`   This RM IC uses POI code instead of company/unit IDs`);
            console.warn(`   Company Name: ${companyName}, Unit Name: ${unitName}`);
            console.log(`📍 Will fetch company/unit IDs from master table using company name and unit name`);
          }
        } else {
          console.error(`❌ No data in API response:`, rmIcDetails);
        }
      } catch (error) {
        console.error(`❌ Error fetching RM IC details:`, error);
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error status: ${error.status}`);
        console.error(`   Full error object:`, error);
        if (error.response) {
          console.error(`   Response status: ${error.response.status}`);
          console.error(`   Response data:`, error.response.data);
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      process_rm_ic_numbers: selectedIcNumbers,
      process_book_set_nos: bookSetNos,
      process_total_accepted_qty_rm: totalAccepted,
      company_id: companyId,
      unit_id: unitId,
      company_name: companyName,
      unit_name: unitName,
      unit_address: unitAddress
    }));

    // Fetch heat summary data for selected RM ICs
    if (selectedIcNumbers.length > 0) {
      await fetchHeatSummaryData(selectedIcNumbers);
    } else {
      setHeatSummaryData([]);
    }
  };

  // Fetch heat summary data for selected RM IC numbers
  const fetchHeatSummaryData = async (selectedRmIcNumbers) => {
    setLoadingHeatSummary(true);
    try {
      console.log('📊 Fetching heat summary for RM ICs:', selectedRmIcNumbers);

      const summaryData = [];

      // For each selected RM IC, fetch PO number and then heat summary
      for (const rmIcNumber of selectedRmIcNumbers) {
        try {
          // Step 1: Get PO number from RM IC
          console.log(`  📋 Getting PO number for RM IC: ${rmIcNumber}`);
          const poResponse = await inspectionCallService.getPoNumberByRmIc(rmIcNumber);

          if (poResponse && poResponse.data) {
            const poNo = poResponse.data;
            console.log(`  ✅ Got PO number: ${poNo}`);

            // Step 2: Get heat numbers from the selected RM IC
            // Extract call number from RM IC number for API call
            const callNoMatch = rmIcNumber.match(/[^/]+\/([^/]+)\//);
            const callNo = callNoMatch ? callNoMatch[1] : rmIcNumber;

            const heatResponse = await inspectionCallService.getHeatNumbersByRmIcNumber(callNo);

            if (heatResponse && heatResponse.data && Array.isArray(heatResponse.data)) {
              const heatNumbers = heatResponse.data;
              console.log(`  ✅ Got ${heatNumbers.length} heat numbers for RM IC: ${rmIcNumber}`);

              // Step 3: For each heat number, fetch the summary data
              for (const heat of heatNumbers) {
                try {
                  const heatNo = heat.heatNumber;
                  console.log(`    🔥 Fetching summary for Heat: ${heatNo}, PO: ${poNo}`);

                  const summaryResponse = await inspectionCallService.getHeatSummaryData(heatNo, poNo);

                  if (summaryResponse && summaryResponse.data) {
                    const heatData = summaryResponse.data;

                    // Get offeredEarlier from API response (now calculated by backend)
                    const offeredEarlier = heatData.offeredEarlier || 0;
                    console.log(`    📊 Offered Earlier for ${heatNo}: ${offeredEarlier}`);

                    // Calculate Future Balance = Max ERC - Offered Earlier
                    const futureBalance = (heatData.rmAcceptedQty || 0) - offeredEarlier;

                    // Determine status based on future balance
                    let status = 'Good';
                    if (futureBalance < 0) {
                      status = 'Critical';
                    } else if (futureBalance === 0) {
                      status = 'Exhausted';
                    }

                    summaryData.push({
                      heatNo: heatData.heatNo || heatNo,
                      acceptedMt: heatData.weightAcceptedMt || 0,
                      maxErc: heatData.rmAcceptedQty || 0,
                      manufactured: heatData.manufaturedQty || 0,
                      offeredEarlier: offeredEarlier,
                      offeredNow: 0, // Will be updated when user enters lot details
                      futureBalance: futureBalance,
                      status: status,
                      rmIcNumber: rmIcNumber,
                      poNo: poNo
                    });

                    console.log(`    ✅ Heat summary fetched:`, {
                      heatNo: heatData.heatNo || heatNo,
                      maxErc: heatData.rmAcceptedQty,
                      manufactured: heatData.manufaturedQty,
                      offeredEarlier: offeredEarlier,
                      futureBalance: futureBalance,
                      status: status
                    });
                  }
                } catch (error) {
                  console.error(`    ❌ Error fetching summary for heat ${heat.heatNumber}:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.error(`  ❌ Error processing RM IC ${rmIcNumber}:`, error);
        }
      }

      // Remove duplicates based on heat number
      const uniqueSummaryData = summaryData.reduce((acc, current) => {
        const exists = acc.find(item => item.heatNo === current.heatNo);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      console.log('📊 Final heat summary data:', uniqueSummaryData);
      setHeatSummaryData(uniqueSummaryData);
    } catch (error) {
      console.error('❌ Error fetching heat summary data:', error);
      setHeatSummaryData([]);
    } finally {
      setLoadingHeatSummary(false);
    }
  };

  // ========== PROCESS STAGE: LOT-HEAT MAPPING HANDLERS ==========

  // Add new lot-heat entry
  const handleAddProcessLotHeat = () => {
    setFormData(prev => ({
      ...prev,
      process_lot_heat_mapping: [
        ...prev.process_lot_heat_mapping,
        {
          id: Date.now(),
          lotNumber: '',
          manufacturerHeat: '',
          heatNumber: '',
          manufacturer: '',
          compositeKey: '',
          offeredQty: '',
          totalAcceptedQtyRm: 0,
          tentativeStartDate: '',
          isLoading: false
        }
      ]
    }));
  };

  // Remove lot-heat entry
  const handleRemoveProcessLotHeat = (id) => {
    setFormData(prev => ({
      ...prev,
      process_lot_heat_mapping: prev.process_lot_heat_mapping.filter(item => item.id !== id)
    }));
  };

  // Handle lot number change
  const handleProcessLotNumberChange = (id, lotNumber) => {
    setFormData(prev => ({
      ...prev,
      process_lot_heat_mapping: prev.process_lot_heat_mapping.map(item =>
        item.id === id ? { ...item, lotNumber } : item
      )
    }));
  };

  // Handle manufacturer-heat selection and auto-fetch details
  const handleProcessManufacturerHeatChange = (id, manufacturerHeat, heatNumber = null, manufacturer = null, maxQty = null, totalAcceptedQtyRm = null, compositeKey = null) => {
    // If heatNumber and manufacturer are not provided, parse from manufacturerHeat string
    if (!heatNumber || !manufacturer) {
      const parts = manufacturerHeat.split(' - ');
      manufacturer = parts[0] || '';
      heatNumber = parts[1] || '';
    }

    setFormData(prev => ({
      ...prev,
      process_lot_heat_mapping: prev.process_lot_heat_mapping.map(item =>
        item.id === id ? {
          ...item,
          manufacturerHeat,
          manufacturer,
          heatNumber,
          compositeKey: compositeKey || `${heatNumber}|${manufacturer}`,
          maxQty: maxQty || item.maxQty,
          totalAcceptedQtyRm: totalAcceptedQtyRm || item.totalAcceptedQtyRm
        } : item
      )
    }));
  };

  // Handle offered quantity change for process lot-heat
  const handleProcessOfferedQtyChange = (id, offeredQty) => {
    // Update form data with new offered quantity
    setFormData(prev => ({
      ...prev,
      process_lot_heat_mapping: prev.process_lot_heat_mapping.map(item =>
        item.id === id ? { ...item, offeredQty: parseInt(offeredQty) || 0 } : item
      )
    }));

    // Update heat summary data with new offered quantity
    // Find the lot-heat entry to get the heat number
    const lotHeatEntry = formData.process_lot_heat_mapping.find(item => item.id === id);
    if (lotHeatEntry && lotHeatEntry.heatNumber) {
      const newOfferedQty = parseInt(offeredQty) || 0;

      // Update the heat summary data
      setHeatSummaryData(prev =>
        prev.map(heat => {
          if (heat.heatNo === lotHeatEntry.heatNumber) {
            // Calculate total offered quantity for this heat across ALL lots (excluding current lot)
            const totalOfferedForHeat = formData.process_lot_heat_mapping
              .filter(lot => lot.heatNumber === lotHeatEntry.heatNumber && lot.id !== id)
              .reduce((sum, lot) => sum + (parseInt(lot.offeredQty) || 0), 0);

            // Add the new offered quantity for the current lot
            const totalOfferedIncludingCurrent = totalOfferedForHeat + newOfferedQty;

            // Calculate new future balance: Max ERC - Offered Earlier - Total Offered (all lots)
            const newFutureBalance = heat.maxErc - (heat.offeredEarlier || 0) - totalOfferedIncludingCurrent;

            // Determine new status based on future balance
            let newStatus = 'Good';
            if (newFutureBalance < 0) {
              newStatus = 'Critical';
            } else if (newFutureBalance === 0) {
              newStatus = 'Exhausted';
            }

            console.log(`📊 Updating heat summary for ${heat.heatNo}:`, {
              offeredNow: totalOfferedIncludingCurrent,
              futureBalance: newFutureBalance,
              status: newStatus,
              breakdown: {
                maxErc: heat.maxErc,
                manufactured: heat.manufactured,
                totalOfferedOtherLots: totalOfferedForHeat,
                currentLotOffered: newOfferedQty,
                totalOffered: totalOfferedIncludingCurrent
              }
            });

            return {
              ...heat,
              offeredNow: totalOfferedIncludingCurrent,
              futureBalance: newFutureBalance,
              status: newStatus
            };
          }
          return heat;
        })
      );
    }
  };

  // Handle tentative start date change
  const handleProcessTentativeStartDateChange = (id, tentativeStartDate) => {
    setFormData(prev => ({
      ...prev,
      process_lot_heat_mapping: prev.process_lot_heat_mapping.map(item =>
        item.id === id ? { ...item, tentativeStartDate } : item
      )
    }));
  };

  // ========== FINAL STAGE HANDLERS ==========

  // Note: handleFinalLotSelection and handleFinalProcessIcSelection were removed
  // as they were unused. The form directly updates formData in onChange handlers.

  // Auto-calculate Total Qty and Total Bags for Final stage
  useEffect(() => {
    if (formData.type_of_call === 'Final' && formData.final_lots_data.length > 0) {
      const totalQty = formData.final_lots_data.reduce((sum, lot) => sum + (parseInt(lot.offeredQty) || 0), 0);
      const totalBags = formData.final_lots_data.reduce((sum, lot) => sum + (parseInt(lot.noOfBags) || 0), 0);

      setFormData(prev => ({
        ...prev,
        final_erc_qty: totalQty,
        final_total_qty: totalQty.toString(),
        final_hdpe_bags: totalBags
      }));
    } else if (formData.type_of_call === 'Final') {
      setFormData(prev => ({
        ...prev,
        final_erc_qty: '',
        final_total_qty: '',
        final_hdpe_bags: ''
      }));
    }
  }, [formData.type_of_call, formData.final_lots_data]);

  // Handle final lot data change
  const handleFinalLotDataChange = (lotNumber, field, value) => {
    setFormData(prev => ({
      ...prev,
      final_lots_data: prev.final_lots_data.map(l => {
        if (l.lotNumber === lotNumber) {
          const updatedLot = { ...l, [field]: value };

          // Logic: No. of Bags >= (Qty of that Lot / 50)
          // Auto-calculate suggested bags when Qty is changed
          if (field === 'offeredQty') {
            const minBags = Math.ceil((value || 0) / 50);
            // If current bags are 0 or less than the new minimum, auto-update them
            if (!l.noOfBags || l.noOfBags < minBags) {
              updatedLot.noOfBags = minBags;
            }
          }
          return updatedLot;
        }
        return l;
      })
    }));
  };

  // === NEW: Heat-TC Mapping Handlers ===

  // Add new heat number section
  const handleAddHeatNumber = () => {
    setFormData(prev => ({
      ...prev,
      rm_heat_tc_mapping: [
        ...prev.rm_heat_tc_mapping,
        {
          id: Date.now(),
          heatNumber: '',
          supplierName: '',
          compositeKey: '',
          tcNumber: '',
          tcDate: '',
          manufacturer: '',
          invoiceNo: '',
          invoiceDate: '',
          subPoNumber: '',
          subPoDate: '',
          subPoQty: '',
          subPoTotalValue: '',
          tcQty: '',
          tcQtyRemaining: '',
          offeredQty: '',
          maxQty: '',
          unit: '',
          isLoading: false,
          isLoadingChemical: false,
          chemicalAutoFetched: false,
          chemicalReadOnly: false,
          // Chemical Analysis - Now per heat number
          chemical_carbon: '',
          chemical_manganese: '',
          chemical_silicon: '',
          chemical_sulphur: '',
          chemical_phosphorus: ''
        }
      ]
    }));
  };

  // Remove heat number section
  const handleRemoveHeatNumber = (id) => {
    setFormData(prev => ({
      ...prev,
      rm_heat_tc_mapping: prev.rm_heat_tc_mapping.filter(heat => heat.id !== id)
    }));
  };

  // Handle heat number selection for a specific section
  const handleHeatNumberChange = async (id, heatNumber, supplierName = '', compositeKey = '') => {
    // First, update the heat number and reset other fields
    setFormData(prev => ({
      ...prev,
      rm_heat_tc_mapping: prev.rm_heat_tc_mapping.map(heat =>
        heat.id === id
          ? {
            ...heat,
            heatNumber,
            supplierName,
            compositeKey,
            tcNumber: '',
            tcDate: '',
            manufacturer: '',
            invoiceNo: '',
            invoiceDate: '',
            subPoNumber: '',
            subPoDate: '',
            subPoQty: '',
            subPoTotalValue: '',
            tcQty: '',
            tcQtyRemaining: '',
            maxQty: '',
            unit: '',
            isLoadingChemical: heatNumber ? true : false,
            chemicalReadOnly: false // Default to editable
          }
          : heat
      )
    }));

    // Auto-fetch chemical analysis if heat number is provided
    if (heatNumber) {
      // 1. Check if this heat number already exists in ANOTHER row of the current form
      const existingEntry = formData.rm_heat_tc_mapping.find(
        h => h.id !== id && h.heatNumber === heatNumber && h.chemical_carbon !== ''
      );

      if (existingEntry) {
        console.log(`🔬 Found existing entry for heat ${heatNumber} in the current form. Auto-populating...`);
        setFormData(prev => ({
          ...prev,
          rm_heat_tc_mapping: prev.rm_heat_tc_mapping.map(heat =>
            heat.id === id
              ? {
                ...heat,
                chemical_carbon: existingEntry.chemical_carbon || '',
                chemical_manganese: existingEntry.chemical_manganese || '',
                chemical_silicon: existingEntry.chemical_silicon || '',
                chemical_sulphur: existingEntry.chemical_sulphur || '',
                chemical_phosphorus: existingEntry.chemical_phosphorus || '',
                isLoadingChemical: false,
                chemicalAutoFetched: true,
                chemicalReadOnly: false // Allow editing
              }
              : heat
          )
        }));
        return; // Skip API call
      }

      // 2. If not found in current form, fetch from backend
      try {
        console.log(`🔬 Auto-fetching chemical analysis from database for heat number: ${heatNumber}`);
        const response = await inspectionCallService.getChemicalAnalysisByHeatNumber(heatNumber);

        if (response && response.data) {
          const analysis = response.data;
          console.log('✅ Chemical analysis found in database:', analysis);

          // Update the specific heat mapping with fetched chemical analysis
          setFormData(prev => ({
            ...prev,
            rm_heat_tc_mapping: prev.rm_heat_tc_mapping.map(heat =>
              heat.id === id
                ? {
                  ...heat,
                  chemical_carbon: analysis.carbon || '',
                  chemical_manganese: analysis.manganese || '',
                  chemical_silicon: analysis.silicon || '',
                  chemical_sulphur: analysis.sulphur || '',
                  chemical_phosphorus: analysis.phosphorus || '',
                  isLoadingChemical: false,
                  chemicalAutoFetched: true,
                  chemicalReadOnly: false // Allow editing
                }
                : heat
            )
          }));
        } else {
          console.log('ℹ️ No previous chemical analysis found for this heat number');
          // Clear loading state
          setFormData(prev => ({
            ...prev,
            rm_heat_tc_mapping: prev.rm_heat_tc_mapping.map(heat =>
              heat.id === id ? { ...heat, isLoadingChemical: false, chemicalAutoFetched: false, chemicalReadOnly: false } : heat
            )
          }));
        }
      } catch (error) {
        console.error('❌ Error fetching chemical analysis:', error);
        // Clear loading state on error
        setFormData(prev => ({
          ...prev,
          rm_heat_tc_mapping: prev.rm_heat_tc_mapping.map(heat =>
            heat.id === id ? { ...heat, isLoadingChemical: false, chemicalAutoFetched: false, chemicalReadOnly: false } : heat
          )
        }));
      }
    }
  };

  // Handle TC number selection and auto-fetch details
  const handleTcNumberChange = (id, tcNumber) => {
    const heatMapping = formData.rm_heat_tc_mapping.find(h => h.id === id);
    if (!heatMapping) return;

    // Set loading state
    setFormData(prev => ({
      ...prev,
      rm_heat_tc_mapping: prev.rm_heat_tc_mapping.map(heat =>
        heat.id === id ? { ...heat, isLoading: true, tcNumber } : heat
      )
    }));

    // Find inventory entry matching heat number and TC number
    const inventoryEntry = inventoryEntries.find(
      entry => entry.heatNumber === heatMapping.heatNumber && entry.tcNumber === tcNumber
    );

    if (inventoryEntry) {
      // Calculate total value
      const totalValue = (
        inventoryEntry.subPoQty *
        inventoryEntry.rateOfMaterial *
        (1 + inventoryEntry.rateOfGst / 100)
      ).toFixed(2);

      // Auto-fetch chemical analysis if available
      const analysis = CHEMICAL_ANALYSIS_HISTORY.find(
        a => a.heatNumber === inventoryEntry.heatNumber && a.manufacturer === inventoryEntry.supplierName
      );

      // Update the specific heat mapping with fetched data
      setFormData(prev => ({
        ...prev,
        rm_heat_tc_mapping: prev.rm_heat_tc_mapping.map(heat =>
          heat.id === id
            ? {
              ...heat,
              tcNumber,
              tcDate: inventoryEntry.tcDate || '',
              manufacturer: inventoryEntry.supplierName || '',
              invoiceNo: inventoryEntry.invoiceNumber || '',
              invoiceDate: inventoryEntry.invoiceDate || '',
              subPoNumber: inventoryEntry.subPoNumber || '',
              subPoDate: inventoryEntry.subPoDate || '',
              subPoQty: `${inventoryEntry.subPoQty} ${inventoryEntry.unitOfMeasurement}`,
              subPoTotalValue: `₹${totalValue}`,
              tcQty: `${inventoryEntry.declaredQuantity} ${inventoryEntry.unitOfMeasurement}`,
              tcQtyRemaining: `${inventoryEntry.qtyLeftForInspection} ${inventoryEntry.unitOfMeasurement}`,
              maxQty: inventoryEntry.qtyLeftForInspection,
              unit: inventoryEntry.unitOfMeasurement,
              isLoading: false
            }
            : heat
        ),
        // Update chemical analysis if this is the first heat or if not already set
        rm_chemical_carbon: prev.rm_chemical_carbon || analysis?.carbon || '',
        rm_chemical_manganese: prev.rm_chemical_manganese || analysis?.manganese || '',
        rm_chemical_silicon: prev.rm_chemical_silicon || analysis?.silicon || '',
        rm_chemical_sulphur: prev.rm_chemical_sulphur || analysis?.sulphur || '',
        rm_chemical_phosphorus: prev.rm_chemical_phosphorus || analysis?.phosphorus || '',
        // rm_chemical_chromium: prev.rm_chemical_chromium || analysis?.chromium || ''
      }));
    } else {
      // No data found - clear loading state
      setFormData(prev => ({
        ...prev,
        rm_heat_tc_mapping: prev.rm_heat_tc_mapping.map(heat =>
          heat.id === id ? { ...heat, isLoading: false } : heat
        )
      }));
    }
  };

  // Handle offered quantity change for a specific heat
  const handleHeatOfferedQtyChange = (id, offeredQty) => {
    setFormData(prev => ({
      ...prev,
      rm_heat_tc_mapping: prev.rm_heat_tc_mapping.map(heat =>
        heat.id === id ? { ...heat, offeredQty } : heat
      )
    }));
  };

  // Handle chemical analysis change for a specific heat
  const handleHeatChemicalChange = (id, fieldName, value) => {
    const heatMapping = formData.rm_heat_tc_mapping.find(h => h.id === id);
    if (!heatMapping) return;

    const heatNumber = heatMapping.heatNumber;

    setFormData(prev => ({
      ...prev,
      rm_heat_tc_mapping: prev.rm_heat_tc_mapping.map(heat => {
        // Sync chemical data for all rows with the same heat number
        if (heat.id === id || (heatNumber && heat.heatNumber === heatNumber)) {
          return { ...heat, [fieldName]: value };
        }
        return heat;
      })
    }));

    // Find all indices for the same heat to update errors
    formData.rm_heat_tc_mapping.forEach((h, idx) => {
      if (h.heatNumber === heatNumber || h.id === id) {
        const errorKey = `heat_${idx}_${fieldName}`;

        // Check if value is out of range and set error immediately
        if (isChemistryOutOfRange(fieldName, value)) {
          setErrors(prev => ({
            ...prev,
            [errorKey]: 'Ladle Analysis of Heat should be in tolerance of the Grade Chemistry'
          }));
        } else {
          // Clear error if value is now in range
          if (errors[errorKey]) {
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[errorKey];
              return newErrors;
            });
          }
        }
      }
    });
  };

  // Helper function to check if chemistry value is out of range
  const isChemistryOutOfRange = (fieldName, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || value === '') return false;

    // Handle both rm_chemical_ and chemical_ prefixes
    const baseFieldName = fieldName.replace('rm_chemical_', '').replace('chemical_', '');

    switch (baseFieldName) {
      case 'carbon':
        return numValue < 0.5 || numValue > 0.6;
      case 'manganese':
        return numValue < 0.8 || numValue > 1.0;
      case 'silicon':
        return numValue < 1.5 || numValue > 2.0;
      case 'sulphur':
        return numValue > 0.03;
      case 'phosphorus':
        return numValue > 0.03;
      default:
        return false;
    }
  };

  // Generic change handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for heat numbers
    // if (name === 'rm_heat_numbers') {
    //   handleHeatNumbersChange(value);
    //   return;
    // }

    setFormData(prev => ({ ...prev, [name]: value }));

    // For chemistry fields, immediately show error if out of range
    if (name.startsWith('rm_chemical_')) {
      if (isChemistryOutOfRange(name, value)) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Ladle Analysis of Heat should be in tolerance of the Grade Chemistry'
        }));
      } else {
        // Clear error if value is now in range
        if (errors[name]) {
          setErrors(prev => ({ ...prev, [name]: '' }));
        }
      }
    } else {
      // Clear error for non-chemistry fields when user starts typing
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };



  const handleSubmit = () => {
    console.log('🚀 Submitting form data:', formData);
    console.log('📋 Validation starting...');

    const newErrors = {};
    // const today = getTodayDate();
    // const maxDate = getMaxDate();

    // Common validations
    if (!formData.po_serial_no) {
      newErrors.po_serial_no = 'PO Serial Number is required';
    }

    if (!formData.type_of_call) {
      newErrors.type_of_call = 'Type of Call is required';
    }

    if (!formData.type_of_erc) {
      newErrors.type_of_erc = 'Type of ERC is required';
    }

    if (!formData.desired_inspection_date) {
      newErrors.desired_inspection_date = 'Desired Inspection Date is required';
    } else if (formData.desired_inspection_date > getMaxDate()) {
      newErrors.desired_inspection_date = 'Desired Date of Inspection should not be more than 6 days from today';
    }

    if (!formData.company_name) {
      newErrors.company_name = 'Company is required';
    }

    // Check unit_name for all call types (Raw Material, Process, Final)
    if (!formData.unit_name) {
      newErrors.unit_name = 'Unit is required';
    }

    // Check if POI code is available
    if (!poiCode) {
      newErrors.unit_name = 'Please select a valid company and unit to get POI code';
    }

    // Raw Material stage validations
    if (formData.type_of_call === 'Raw Material') {
      // TEMPORARY: Make RM fields optional for testing without inventory data
      // TODO: Re-enable strict validation once inventory module is implemented

      // Only validate if user has started filling heat-TC mappings
      const hasHeatData = formData.rm_heat_tc_mapping.some(heat =>
        heat.heatNumber || heat.tcNumber || heat.offeredQty
      );

      if (hasHeatData) {
        // Check each heat-TC mapping
        formData.rm_heat_tc_mapping.forEach((heat, index) => {
          if (heat.heatNumber || heat.tcNumber || heat.offeredQty) {
            if (!heat.heatNumber) {
              newErrors[`heat_${index}_heatNumber`] = 'Heat Number is required';
            }
            if (!heat.tcNumber) {
              newErrors[`heat_${index}_tcNumber`] = 'TC Number is required';
            }
            if (!heat.offeredQty || parseFloat(heat.offeredQty) <= 0) {
              newErrors[`heat_${index}_offeredQty`] = 'Offered Quantity must be greater than 0';
            } else {
              // Check if offered quantity exceeds TC qty remaining
              const offeredQty = parseFloat(heat.offeredQty);
              const tcQtyRemaining = parseFloat(heat.maxQty) || parseFloat(heat.tcQtyRemaining);
              if (tcQtyRemaining && offeredQty > tcQtyRemaining) {
                newErrors[`heat_${index}_offeredQty`] = `Offered Qty cannot be more than TC Qty Remaining with Vendor (${tcQtyRemaining} ${heat.unit})`;
              }
            }
          }
        });

        // Validate total offered quantity only if heat data is provided
        if (!formData.rm_total_offered_qty_mt || parseFloat(formData.rm_total_offered_qty_mt) <= 0) {
          newErrors.rm_total_offered_qty_mt = 'Total Offered Quantity (MT) must be greater than 0';
        }

        // Chemical analysis validations per heat (now per-heat instead of global)
        formData.rm_heat_tc_mapping.forEach((heat, index) => {
          if (heat.heatNumber || heat.tcNumber || heat.offeredQty) {
            // Validate Carbon
            if (!heat.chemical_carbon) {
              newErrors[`heat_${index}_chemical_carbon`] = 'Carbon % is required';
            } else {
              const carbon = parseFloat(heat.chemical_carbon);
              if (carbon < 0.5 || carbon > 0.6) {
                newErrors[`heat_${index}_chemical_carbon`] = 'Ladle Analysis of Heat should be in tolerance of the Grade Chemistry';
              }
            }

            // Validate Manganese
            if (!heat.chemical_manganese) {
              newErrors[`heat_${index}_chemical_manganese`] = 'Manganese % is required';
            } else {
              const manganese = parseFloat(heat.chemical_manganese);
              if (manganese < 0.8 || manganese > 1.0) {
                newErrors[`heat_${index}_chemical_manganese`] = 'Ladle Analysis of Heat should be in tolerance of the Grade Chemistry';
              }
            }

            // Validate Silicon
            if (!heat.chemical_silicon) {
              newErrors[`heat_${index}_chemical_silicon`] = 'Silicon % is required';
            } else {
              const silicon = parseFloat(heat.chemical_silicon);
              if (silicon < 1.5 || silicon > 2.0) {
                newErrors[`heat_${index}_chemical_silicon`] = 'Ladle Analysis of Heat should be in tolerance of the Grade Chemistry';
              }
            }

            // Validate Sulphur
            if (!heat.chemical_sulphur) {
              newErrors[`heat_${index}_chemical_sulphur`] = 'Sulphur % is required';
            } else {
              const sulphur = parseFloat(heat.chemical_sulphur);
              if (sulphur > 0.03) {
                newErrors[`heat_${index}_chemical_sulphur`] = 'Ladle Analysis of Heat should be in tolerance of the Grade Chemistry';
              }
            }

            // Validate Phosphorus
            if (!heat.chemical_phosphorus) {
              newErrors[`heat_${index}_chemical_phosphorus`] = 'Phosphorus % is required';
            } else {
              const phosphorus = parseFloat(heat.chemical_phosphorus);
              if (phosphorus > 0.03) {
                newErrors[`heat_${index}_chemical_phosphorus`] = 'Ladle Analysis of Heat should be in tolerance of the Grade Chemistry';
              }
            }
          }
        });
      }
    }

    // Process stage validations
    if (formData.type_of_call === 'Process') {
      // Check if RM IC numbers are selected
      if (!formData.process_rm_ic_numbers || formData.process_rm_ic_numbers.length === 0) {
        newErrors.process_rm_ic_numbers = 'At least one RM IC Number (ER Number) is required';
      }

      // Note: company_id and unit_id can be NULL if the RM IC uses POI code instead
      // The database migration V8 made these fields nullable to support POI code-based lookups
      // So we don't validate these fields - they are optional
      if (formData.company_id) {
        console.log('✅ Company ID is populated:', formData.company_id);
      } else {
        console.log('ℹ️ Company ID is NULL - this RM IC uses POI code instead');
      }
      if (formData.unit_id) {
        console.log('✅ Unit ID is populated:', formData.unit_id);
      } else {
        console.log('ℹ️ Unit ID is NULL - this RM IC uses POI code instead');
      }

      // Check if lot-heat mappings are provided
      const hasLotHeatData = formData.process_lot_heat_mapping.some(item =>
        item.lotNumber || item.manufacturerHeat || item.offeredQty
      );

      if (hasLotHeatData) {
        // Validate each lot-heat mapping
        formData.process_lot_heat_mapping.forEach((item, index) => {
          if (item.lotNumber || item.manufacturerHeat || item.offeredQty || item.tentativeStartDate) {
            if (!item.lotNumber) {
              newErrors[`process_lot_${index}_lotNumber`] = `Lot Number is required for entry ${index + 1}`;
            }
            if (!item.manufacturerHeat) {
              newErrors[`process_lot_${index}_manufacturerHeat`] = `Manufacturer-Heat is required for entry ${index + 1}`;
            }
            if (!item.offeredQty || parseFloat(item.offeredQty) <= 0) {
              newErrors[`process_lot_${index}_offeredQty`] = `Offered Quantity must be greater than 0 for entry ${index + 1}`;
            }
            // Commented out as per requirement: open from minus infinite to infinite
            // if (!item.tentativeStartDate) {
            //   newErrors[`process_lot_${index}_tentativeStartDate`] = `Tentative Start Date is required for entry ${index + 1}`;
            // }

            // Validate that offered quantity doesn't exceed future balance
            if (item.offeredQty && item.heatNumber) {
              const offeredQty = parseInt(item.offeredQty) || 0;
              const heatSummary = heatSummaryData.find(h => h.heatNo === item.heatNumber);

              if (heatSummary) {
                // Calculate available balance for THIS lot
                // Available = Max ERC - Offered Earlier - (Total offered by OTHER lots using same heat)
                const otherLotsOffered = formData.process_lot_heat_mapping
                  .filter((lot, lotIndex) => lot.heatNumber === item.heatNumber && lotIndex !== index)
                  .reduce((sum, lot) => sum + (parseInt(lot.offeredQty) || 0), 0);

                const availableBalance = heatSummary.maxErc - (heatSummary.offeredEarlier || 0) - otherLotsOffered;

                if (offeredQty > availableBalance) {
                  newErrors[`process_lot_${index}_offeredQty`] =
                    `Offered Quantity (${offeredQty}) exceeds available Future Balance (${availableBalance}) for Heat ${item.heatNumber}`;
                }
              }
            }
          }
        });
      } else {
        newErrors.process_lot_heat_mapping = 'At least one Lot-Heat mapping is required';
      }
    }

    // Final stage validations
    if (formData.type_of_call === 'Final') {
      if (!formData.final_rm_ic_numbers || formData.final_rm_ic_numbers.length === 0) {
        newErrors.final_rm_ic_numbers = 'At least one RM IC Number is required';
      }
      if (!formData.final_process_ic_numbers || formData.final_process_ic_numbers.length === 0) {
        newErrors.final_process_ic_numbers = 'At least one Process IC Number is required';
      }
      if (!formData.final_lot_numbers || formData.final_lot_numbers.length === 0) {
        newErrors.final_lot_numbers = 'At least one Lot Number is required';
      }
      if (!formData.final_erc_qty) {
        newErrors.final_erc_qty = 'ERC Quantity is required';
      }
      if (!formData.final_hdpe_bags) {
        newErrors.final_hdpe_bags = 'HDPE Bags quantity is required';
      }
      if (!formData.final_total_qty) {
        newErrors.final_total_qty = 'Total Quantity is required';
      }
    }

    console.log('🔍 Validation errors:', newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Validation failed!', newErrors);
      setErrors(newErrors);

      // Scroll to the first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`) ||
        document.querySelector(`.ric-form-error`);

      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus on the field if it's an input
        if (errorElement.tagName === 'INPUT' || errorElement.tagName === 'SELECT' || errorElement.tagName === 'TEXTAREA') {
          setTimeout(() => errorElement.focus(), 300);
        }
      }

      // Show validation summary alert
      setNotification({
        message: `❌ Form Validation Failed\n\nPlease fix the errors highlighted below.`,
        type: 'error'
      });

      return;
    }

    console.log('✅ Validation passed!');
    setErrors({});

    console.log('🔍 DEBUG: formData.type_of_erc =', formData.type_of_erc);

    // Filter data based on inspection type - send only relevant fields
    // Convert company_id and unit_id to proper types (null or integer)
    const companyId = formData.company_id ? (typeof formData.company_id === 'number' ? formData.company_id : parseInt(formData.company_id)) : null;
    const unitId = formData.unit_id ? (typeof formData.unit_id === 'number' ? formData.unit_id : parseInt(formData.unit_id)) : null;

    console.log('🔍 Type conversion check:');
    console.log('  formData.company_id:', formData.company_id, 'Type:', typeof formData.company_id);
    console.log('  Converted companyId:', companyId, 'Type:', typeof companyId);
    console.log('  formData.unit_id:', formData.unit_id, 'Type:', typeof formData.unit_id);
    console.log('  Converted unitId:', unitId, 'Type:', typeof unitId);

    let filteredData = {
      // Common fields for all inspection types
      po_no: formData.po_no,
      po_serial_no: formData.po_serial_no,
      po_date: formData.po_date,
      po_description: formData.po_description,
      po_qty: formData.po_qty,
      po_unit: formData.po_unit,
      type_of_call: formData.type_of_call,
      type_of_erc: formData.type_of_erc,
      desired_inspection_date: formData.desired_inspection_date,
      company_id: companyId, // Use converted value (fetched from RM IC for Process)
      company_name: formData.company_name,
      unit_id: unitId, // Use converted value (fetched from RM IC for Process)
      unit_name: formData.unit_name,
      unit_address: formData.unit_address,
      placeOfInspection: poiCode, // POI code from API
      remarks: formData.remarks
    };

    // Add type-specific fields
    if (formData.type_of_call === 'Raw Material') {
      // Transform heat-tc mapping to include chemical analysis per heat
      const heatQuantities = formData.rm_heat_tc_mapping.map(heat => ({
        heatNumber: heat.heatNumber,
        manufacturer: heat.manufacturer,
        offeredQty: parseFloat(heat.offeredQty) || 0,
        tcNumber: heat.tcNumber,
        tcDate: heat.tcDate,
        tcQuantity: parseFloat(heat.tcQty) || 0,
        qtyLeft: parseFloat(heat.tcQtyRemaining) || 0
      }));

      const chemicalAnalysis = formData.rm_heat_tc_mapping.map(heat => ({
        heatNumber: heat.heatNumber,
        carbon: heat.chemical_carbon ? parseFloat(heat.chemical_carbon) : null,
        manganese: heat.chemical_manganese ? parseFloat(heat.chemical_manganese) : null,
        silicon: heat.chemical_silicon ? parseFloat(heat.chemical_silicon) : null,
        sulphur: heat.chemical_sulphur ? parseFloat(heat.chemical_sulphur) : null,
        phosphorus: heat.chemical_phosphorus ? parseFloat(heat.chemical_phosphorus) : null
      }));

      filteredData = {
        ...filteredData,
        rm_heat_tc_mapping: formData.rm_heat_tc_mapping,
        heatQuantities: heatQuantities,
        chemicalAnalysis: chemicalAnalysis,
        rm_total_offered_qty_mt: formData.rm_total_offered_qty_mt,
        rm_offered_qty_erc: formData.rm_offered_qty_erc,
        rm_remarks: formData.remarks
      };
    } else if (formData.type_of_call === 'Process') {
      filteredData = {
        ...filteredData,
        process_rm_ic_numbers: formData.process_rm_ic_numbers,
        process_book_set_nos: formData.process_book_set_nos,
        process_lot_heat_mapping: formData.process_lot_heat_mapping,
        process_total_accepted_qty_rm: formData.process_total_accepted_qty_rm
      };
    } else if (formData.type_of_call === 'Final') {
      filteredData = {
        ...filteredData,
        final_lot_numbers: formData.final_lot_numbers,
        final_manufacturer_heat: formData.final_manufacturer_heat,
        final_erc_qty: formData.final_erc_qty,
        final_total_qty: formData.final_total_qty,
        final_hdpe_bags: formData.final_hdpe_bags,
        final_rm_ic_numbers: formData.final_rm_ic_numbers,
        final_process_ic_numbers: formData.final_process_ic_numbers,
        final_total_accepted_qty_process: formData.final_total_accepted_qty_process,
        final_lots_data: formData.final_lots_data
        // Note: unit_id, unit_name, unit_address are already in filteredData from common fields
      };
    }

    console.log('📤 Calling onSubmit with filtered data:', filteredData);
    console.log('🏢 POI Code being sent:', poiCode);
    console.log('🏭 Company ID:', filteredData.company_id);
    console.log('🏭 Company Name:', filteredData.company_name);
    console.log('🏗️ Unit ID:', filteredData.unit_id);
    console.log('🏗️ Unit Name:', filteredData.unit_name);
    console.log('📍 Full formData.company_id:', formData.company_id);
    console.log('📍 Full formData.unit_id:', formData.unit_id);
    onSubmit(filteredData);
  };

  const handleReset = () => {
    setFormData(getInitialFormState(selectedPO));
    setSelectedPoSerial('');
    setErrors({});
  };

  return (
    <div className="ric-form">
      {/* ============ VALIDATION ERROR SUMMARY ============ */}
      {Object.keys(errors).length > 0 && (
        <div className="ric-validation-summary">
          <div className="ric-validation-summary__header">
            <span className="ric-validation-summary__icon">⚠️</span>
            <h4 className="ric-validation-summary__title">
              Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} before submitting
            </h4>
          </div>
          <ul className="ric-validation-summary__list">
            {Object.entries(errors).slice(0, 10).map(([field, message]) => (
              <li key={field} className="ric-validation-summary__item">
                <button
                  type="button"
                  className="ric-validation-summary__link"
                  onClick={() => {
                    const element = document.querySelector(`[name="${field}"]`) ||
                      document.querySelector(`.ric-form-error`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
                        setTimeout(() => element.focus(), 300);
                      }
                    }
                  }}
                >
                  {message}
                </button>
              </li>
            ))}
            {Object.keys(errors).length > 10 && (
              <li className="ric-validation-summary__item ric-validation-summary__item--more">
                ... and {Object.keys(errors).length - 10} more errors
              </li>
            )}
          </ul>
        </div>
      )}

      {/* ============ COMMON SECTION ============ */}
      <SectionHeader
        title="PO Data (Auto Fetched from IREPS)"
        subtitle="Select PO Serial Number to auto-populate PO details"
      />

      <div className="ric-form-grid">
        <FormField label="PO Serial Number" name="po_serial_no" required hint={selectedItem ? "Auto Fetched" : "Select to auto-fetch PO data"} errors={errors}>
          {selectedItem ? (
            <input
              type="text"
              className="ric-form-input ric-form-input--disabled"
              value={selectedPoSerial}
              disabled
            />
          ) : (
            <select
              className="ric-form-select"
              value={selectedPoSerial}
              onChange={(e) => handlePoSerialChange(e.target.value)}
            >
              <option value="">Select PO Serial Number</option>
              {poSerialOptions.map(po => (
                <option key={po.serialNo} value={po.serialNo}>
                  {po.serialNo} - {po.itemName}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label="PO Number" name="po_no" hint="Auto Fetched" errors={errors}>
          <input type="text" className="ric-form-input ric-form-input--disabled" value={formData.po_no} disabled />
        </FormField>

        <FormField label="PO Date" name="po_date" hint="Auto Fetched" errors={errors}>
          <input type="text" className="ric-form-input ric-form-input--disabled" value={formData.po_date ? formatDate(formData.po_date) : ''} disabled />
        </FormField>

        <FormField label="PO Quantity" name="po_qty" hint="Auto Fetched" errors={errors}>
          <input type="text" className="ric-form-input ric-form-input--disabled" value={`${formData.po_qty} ${formData.po_unit}`} disabled />
        </FormField>

        {formData.amendment_no && (
          <>
            <FormField label="Amendment No." name="amendment_no" hint="Auto Fetched" errors={errors}>
              <input type="text" className="ric-form-input ric-form-input--disabled" value={formData.amendment_no} disabled />
            </FormField>
            <FormField label="Amendment Date" name="amendment_date" hint="Auto Fetched" errors={errors}>
              <input type="text" className="ric-form-input ric-form-input--disabled" value={formatDate(formData.amendment_date)} disabled />
            </FormField>
          </>
        )}

        <FormField label="Type of ERC" name="type_of_erc" required hint="Select ERC type" errors={errors}>
          <select
            name="type_of_erc"
            className="ric-form-select"
            value={formData.type_of_erc}
            onChange={handleChange}
          >
            {ERC_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Desired Inspection Date" name="desired_inspection_date" required hint="Maximum 6 days from today" errors={errors}>
          <input
            type="date"
            name="desired_inspection_date"
            className="ric-form-input"
            value={formData.desired_inspection_date}
            onChange={handleChange}
            // min={getTodayDate()}
            max={getMaxDate()}
          />
        </FormField>


      </div>

      {/* Quantity Already Inspected Summary */}
      {formData.po_serial_no && (
        <div className="ric-qty-summary">
          <div className="ric-qty-summary__title">Quantity Accepted</div>
          <div className="ric-qty-summary__grid">
            <div className="ric-qty-card">
              <span className="ric-qty-card__label">Raw Material</span>
              <span className="ric-qty-card__value">{formData.qty_already_inspected_rm}</span>
            </div>
            <div className="ric-qty-card">
              <span className="ric-qty-card__label">Process</span>
              <span className="ric-qty-card__value">{formData.qty_already_inspected_process}</span>
            </div>
            <div className="ric-qty-card">
              <span className="ric-qty-card__label">Final</span>
              <span className="ric-qty-card__value">{formData.qty_already_inspected_final}</span>
            </div>
            {/* <div className="ric-qty-card ric-qty-card--remaining">
              <span className="ric-qty-card__label">Remaining (PO)</span>
              <span className="ric-qty-card__value">{formData.po_qty - formData.qty_already_inspected_final}</span>
            </div> */}
          </div>
        </div>
      )}

      {/* ============ SUB PO INFORMATION (if selected) ============ */}
      {selectedSubPO && (formData.type_of_call === 'Raw Material' || formData.type_of_call === 'Process') && (
        <>
          <SectionHeader title="Sub PO Information" subtitle="Details of selected Sub PO" />
          <div className="ric-form-grid">
            <FormField label="Sub-PO Number">
              <input
                type="text"
                className="ric-form-input ric-form-input--disabled"
                value={selectedSubPO.sub_po_number}
                disabled
              />
            </FormField>
            <FormField label="Raw Material Name">
              <input
                type="text"
                className="ric-form-input ric-form-input--disabled"
                value={selectedSubPO.raw_material_name}
                disabled
              />
            </FormField>
            <FormField label="Contractor">
              <input
                type="text"
                className="ric-form-input ric-form-input--disabled"
                value={selectedSubPO.contractor}
                disabled
              />
            </FormField>
            <FormField label="Manufacturer">
              <input
                type="text"
                className="ric-form-input ric-form-input--disabled"
                value={selectedSubPO.manufacturer}
                disabled
              />
            </FormField>
            <FormField label="Sub-PO Quantity">
              <input
                type="text"
                className="ric-form-input ric-form-input--disabled"
                value={selectedSubPO.sub_po_quantity}
                disabled
              />
            </FormField>
            <FormField label="Rate (₹)">
              <input
                type="text"
                className="ric-form-input ric-form-input--disabled"
                value={selectedSubPO.rate}
                disabled
              />
            </FormField>
          </div>
        </>
      )}

      {/* ============ CALL TYPE SELECTION ============ */}
      <SectionHeader title="Call Details" subtitle="Select type of inspection call" />

      <div className="ric-form-grid">
        <FormField label="Type of Call" name="type_of_call" required hint="Select inspection stage" errors={errors}>
          <select
            name="type_of_call"
            className="ric-form-select"
            value={formData.type_of_call}
            onChange={handleChange}
          >
            {INSPECTION_STAGES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* ============ SHOW REST OF FORM ONLY AFTER TYPE SELECTION ============ */}
      {formData.type_of_call && (
        <>
          <div className="ric-form-grid">
            {/* <FormField label="Desired Inspection Date" name="desired_inspection_date" required hint="" errors={errors}>
              <input
                type="date"
                name="desired_inspection_date"
                className="ric-form-input"
                value={formData.desired_inspection_date}
                onChange={handleChange}
                // min={getTodayDate()}
                // max={getMaxDate()}
              />
            </FormField> */}

            {/* <FormField label="Vendor Contact Name" name="vendor_contact_name">
              <input
                type="text"
                name="vendor_contact_name"
                className="ric-form-input"
                value={formData.vendor_contact_name}
                onChange={handleChange}
                placeholder="Enter contact person name"
              />
            </FormField> */}

            {/* <FormField label="Vendor Contact Phone" name="vendor_contact_phone">
              <input
                type="tel"
                name="vendor_contact_phone"
                className="ric-form-input"
                value={formData.vendor_contact_phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </FormField> */}
          </div>

          {/* ============ RAW MATERIAL STAGE FIELDS ============ */}
          {formData.type_of_call === 'Raw Material' && (
            <>
              <SectionHeader
                title="ERC Raw Material Details - Heat Numbers & TC Information"
                subtitle="Add multiple heat numbers and select TC for each. Details will be auto-fetched from inventory."
              />

              {/* Dynamic Heat-TC Mapping Sections */}
              {formData.rm_heat_tc_mapping.map((heatMapping, index) => (
                <div key={heatMapping.id} className="ric-heat-section">
                  <div className="ric-heat-section-header">
                    <h4 className="ric-heat-section-title">Heat Number {index + 1}</h4>
                    {formData.rm_heat_tc_mapping.length > 1 && (
                      <button
                        type="button"
                        className="ric-btn-remove-heat"
                        onClick={() => handleRemoveHeatNumber(heatMapping.id)}
                        title="Remove this heat number"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <div className="ric-form-grid">
                    {/* Heat Number - Dropdown from Inventory {heat.rawMaterial} - Qty Left: {heat.qtyLeft} {heat.unit}*/}
                    <FormField
                      label="Heat Number"
                      name={`heat_${index}_heatNumber`}
                      required
                      errors={errors}
                    >
                      <select
                        className="ric-form-select"
                        value={heatMapping.compositeKey || ''}
                        onChange={(e) => {
                          const compositeKey = e.target.value;
                          if (compositeKey) {
                            // Parse composite key: "heatNumber|supplierName"
                            const [heatNum, supplier] = compositeKey.split('|');
                            const selectedHeat = getAvailableHeatNumbersForDropdown(heatMapping.id).find(
                              h => h.heatNumber === heatNum && h.supplierName === supplier
                            );
                            if (selectedHeat) {
                              handleHeatNumberChange(heatMapping.id, selectedHeat.heatNumber, selectedHeat.supplierName, compositeKey);
                            }
                          } else {
                            handleHeatNumberChange(heatMapping.id, '', '', '');
                          }
                        }}
                      >
                        <option value="">-- Select Heat Number --</option>
                        {getAvailableHeatNumbersForDropdown(heatMapping.id).map(heat => {
                          const compositeKey = `${heat.heatNumber}|${heat.supplierName}`;
                          return (
                            <option key={compositeKey} value={compositeKey}>
                              {heat.heatNumber} -  ({heat.supplierName})
                            </option>
                          );
                        })}
                      </select>
                    </FormField>

                    {/* TC Number - Dropdown based on selected Heat Number */}
                    <FormField
                      label="TC (Test Certificate) Number"
                      name={`heat_${index}_tcNumber`}
                      required
                      hint="Auto-fetched from inventory"
                      errors={errors}
                    >
                      <select
                        className="ric-form-select"
                        value={heatMapping.tcNumber}
                        onChange={(e) => handleTcNumberChange(heatMapping.id, e.target.value)}
                        disabled={!heatMapping.heatNumber}
                      >
                        <option value="">Select TC Number</option>
                        {getAvailableTcNumbers(heatMapping.heatNumber, heatMapping.supplierName, heatMapping.id).map(tc => (
                          <option key={tc.tcNumber} value={tc.tcNumber}>
                            {tc.tcNumber} - {tc.manufacturer}
                          </option>
                        ))}
                      </select>
                      {heatMapping.isLoading && (
                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#2196f3' }}>
                          Loading details...
                        </div>
                      )}
                    </FormField>

                    {/* TC Date - Auto-fetched */}
                    <FormField label="TC Date" name={`heat_${index}_tcDate`} hint="Auto-fetched">
                      <input
                        type="text"
                        className="ric-form-input ric-form-input--disabled"
                        value={heatMapping.tcDate ? formatDate(heatMapping.tcDate) : ''}
                        disabled
                      />
                    </FormField>

                    {/* Manufacturer - Auto-fetched */}
                    <FormField label="Manufacturer Name" name={`heat_${index}_manufacturer`} hint="Auto-fetched">
                      <input
                        type="text"
                        className="ric-form-input ric-form-input--disabled"
                        value={heatMapping.manufacturer}
                        disabled
                      />
                    </FormField>

                    {/* Invoice Number - Auto-fetched */}
                    <FormField label="Invoice Number" name={`heat_${index}_invoiceNo`} hint="Auto-fetched">
                      <input
                        type="text"
                        className="ric-form-input ric-form-input--disabled"
                        value={heatMapping.invoiceNo}
                        disabled
                      />
                    </FormField>

                    {/* Invoice Date - Auto-fetched */}
                    <FormField label="Invoice Date" name={`heat_${index}_invoiceDate`} hint="Auto-fetched">
                      <input
                        type="text"
                        className="ric-form-input ric-form-input--disabled"
                        value={heatMapping.invoiceDate ? formatDate(heatMapping.invoiceDate) : ''}
                        disabled
                      />
                    </FormField>

                    {/* Sub PO Number & Date - Auto-fetched */}
                    <FormField label="Sub PO Number & Date" name={`heat_${index}_subPoNumber`} hint="Auto-fetched">
                      <input
                        type="text"
                        className="ric-form-input ric-form-input--disabled"
                        value={heatMapping.subPoNumber && heatMapping.subPoDate
                          ? `${heatMapping.subPoNumber} (${formatDate(heatMapping.subPoDate)})`
                          : ''}
                        disabled
                      />
                    </FormField>

                    {/* Sub PO Qty - Auto-fetched */}
                    <FormField label="Sub PO Qty" name={`heat_${index}_subPoQty`} hint="Auto-fetched">
                      <input
                        type="text"
                        className="ric-form-input ric-form-input--disabled"
                        value={heatMapping.subPoQty}
                        disabled
                      />
                    </FormField>

                    {/* Total Value of Sub PO - Auto-fetched */}
                    <FormField label="Total Value of Sub PO" name={`heat_${index}_subPoTotalValue`} hint="Auto-fetched">
                      <input
                        type="text"
                        className="ric-form-input ric-form-input--disabled"
                        value={heatMapping.subPoTotalValue}
                        disabled
                      />
                    </FormField>

                    {/* TC Qty - Auto-fetched */}
                    <FormField label="TC Qty" name={`heat_${index}_tcQty`} hint="Auto-fetched">
                      <input
                        type="text"
                        className="ric-form-input ric-form-input--disabled"
                        value={heatMapping.tcQty}
                        disabled
                      />
                    </FormField>

                    {/* TC Qty Remaining with Vendor - Auto-fetched */}
                    <FormField label="TC Qty Remaining with Vendor" name={`heat_${index}_tcQtyRemaining`} hint="Auto-fetched">
                      <input
                        type="text"
                        className="ric-form-input ric-form-input--disabled"
                        value={heatMapping.tcQtyRemaining}
                        disabled
                      />
                    </FormField>

                    {/* Offered Quantity for this Heat - Manual Input */}
                    <FormField
                      label="Offered Qty (MT)"
                      name={`heat_${index}_offeredQty`}
                      required
                      hint={heatMapping.tcQtyRemaining ? `Max: ${heatMapping.tcQtyRemaining} MT (TC Qty Remaining)` : heatMapping.maxQty ? `Max: ${heatMapping.maxQty} ${heatMapping.unit}` : ''}
                      errors={errors}
                    >
                      <input
                        type="number"
                        className="ric-form-input"
                        value={heatMapping.offeredQty}
                        onChange={(e) => handleHeatOfferedQtyChange(heatMapping.id, e.target.value)}
                        step="0.001"
                        min="0"
                        max={heatMapping.tcQtyRemaining || heatMapping.maxQty || undefined}
                        placeholder="Enter quantity in MT"
                        disabled={!heatMapping.tcNumber}
                      />
                    </FormField>

                    {/* Max ERC Calculation - Auto-calculated based on Offered Qty and ERC Type */}
                    <FormField
                      label="Max ERC can be manufactured from this Manufacturer - Heat No. combination for this PO Sr. No."
                      name={`heat_${index}_maxErc`}
                      hint={formData.type_of_erc ? `Formula: (Offered Qty MT × 1000) / Division Factor. ${formData.type_of_erc === 'MK-V' ? 'MK-V: 1.15321' : formData.type_of_erc === 'MK-III' ? 'MK-III: 0.928426' : 'J-Type: 1.100'}` : 'Select ERC type to calculate'}
                      fullWidth
                    >
                      <input
                        type="text"
                        className="ric-form-input ric-form-input--calculated"
                        value={
                          heatMapping.offeredQty && formData.type_of_erc
                            ? `${formatNumber(calculateMaxErcForHeat(heatMapping.offeredQty, formData.type_of_erc))} ERCs`
                            : '0 ERCs'
                        }
                        disabled
                        readOnly
                      />
                    </FormField>
                  </div>

                  {/* Chemical Analysis for this Heat Number */}
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
                    <SectionHeader
                      title={`Chemical Analysis of TC - Heat #${index + 1}`}
                      subtitle={`Enter chemical composition percentages for ${heatMapping.heatNumber || 'this heat'}`}
                    />

                    {/* Loading indicator for chemical analysis */}
                    {heatMapping.isLoadingChemical && (
                      <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: '#e3f2fd',
                        borderLeft: '4px solid #2196f3',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#1976d2'
                      }}>
                        🔬 Fetching chemical analysis from previous inspection calls...
                      </div>
                    )}

                    {/* Auto-fetched indicator */}
                    {heatMapping.chemicalAutoFetched && !heatMapping.isLoadingChemical && (
                      <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: '#e8f5e9',
                        borderLeft: '4px solid #4caf50',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#2e7d32',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>✅</span>
                        <span>
                          <strong>Auto-populated:</strong> Chemical analysis data has been automatically filled based on previous entries or database records for this heat number. You can edit these values if needed.
                        </span>
                      </div>
                    )}

                    <div className="ric-form-grid">
                      <FormField label="Carbon (C) %" name={`heat_${index}_chemical_carbon`} required hint="Range: 0.5 - 0.6" errors={errors}>
                        <input
                          type="number"
                          className="ric-form-input"
                          value={heatMapping.chemical_carbon}
                          onChange={(e) => handleHeatChemicalChange(heatMapping.id, 'chemical_carbon', e.target.value)}
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="e.g., 0.55"
                        />
                      </FormField>

                      <FormField label="Manganese (Mn) %" name={`heat_${index}_chemical_manganese`} required hint="Range: 0.8 - 1.0" errors={errors}>
                        <input
                          type="number"
                          className="ric-form-input"
                          value={heatMapping.chemical_manganese}
                          onChange={(e) => handleHeatChemicalChange(heatMapping.id, 'chemical_manganese', e.target.value)}
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="e.g., 0.9"
                        />
                      </FormField>

                      <FormField label="Silicon (Si) %" name={`heat_${index}_chemical_silicon`} required hint="Range: 1.5 - 2.0" errors={errors}>
                        <input
                          type="number"
                          className="ric-form-input"
                          value={heatMapping.chemical_silicon}
                          onChange={(e) => handleHeatChemicalChange(heatMapping.id, 'chemical_silicon', e.target.value)}
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="e.g., 1.75"
                        />
                      </FormField>

                      <FormField label="Sulphur (S) %" name={`heat_${index}_chemical_sulphur`} required hint="Max: 0.03" errors={errors}>
                        <input
                          type="number"
                          className="ric-form-input"
                          value={heatMapping.chemical_sulphur}
                          onChange={(e) => handleHeatChemicalChange(heatMapping.id, 'chemical_sulphur', e.target.value)}
                          step="0.001"
                          min="0"
                          max="100"
                          placeholder="e.g., 0.02"
                        />
                      </FormField>

                      <FormField label="Phosphorus (P) %" name={`heat_${index}_chemical_phosphorus`} required hint="Max: 0.03" errors={errors}>
                        <input
                          type="number"
                          className="ric-form-input"
                          value={heatMapping.chemical_phosphorus}
                          onChange={(e) => handleHeatChemicalChange(heatMapping.id, 'chemical_phosphorus', e.target.value)}
                          step="0.001"
                          min="0"
                          max="100"
                          placeholder="e.g., 0.02"
                        />
                      </FormField>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Heat Number Button */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  type="button"
                  className="ric-btn-add-heat"
                  onClick={handleAddHeatNumber}
                >
                  + Add Another Heat Number
                </button>
              </div>

              {/* Total Offered Quantity - Auto-calculated from all heats */}
              <SectionHeader
                title="Total Offered Quantity Summary"
                subtitle="Auto-calculated from all heat numbers"
              />
              <div className="ric-form-grid">
                <FormField
                  label="Total Offered Qty (MT)"
                  name="rm_total_offered_qty_mt"
                // hint={`Auto-calculated (Sum of all heats) | Max: ${remainingQty.rm} MT`}
                >
                  <input
                    type="text"
                    className="ric-form-input ric-form-input--calculated"
                    value={formData.rm_total_offered_qty_mt.toFixed(3)}
                    disabled
                  />
                </FormField>

                <FormField
                  label="Approx. No. of ERC to be Supplied"
                  name="rm_offered_qty_erc"
                  // hint="Auto-calculated from Total Qty (1.150 MT per 1000 ERCs)"
                  hint={`Formula: (Total Offered Qty MT × 1000) / Division Factor
                        MK-III: Division Factor = 0.928426
                        MK-V: Division Factor = 1.15321
                        J-Type: Division Factor = 1.100${formData.type_of_erc ? ` | Current: ${formData.type_of_erc}` : ''}`}
                >
                  <input
                    type="text"
                    className="ric-form-input ric-form-input--calculated"
                    value={formData.rm_offered_qty_erc.toLocaleString('en-IN')}
                    disabled
                  />
                </FormField>
              </div>
            </>
          )}

          {/* ============ PROCESS STAGE FIELDS ============ */}
          {formData.type_of_call === 'Process' && (
            <>
              <SectionHeader
                title="ERC Process Inspection Details"
                subtitle="Select RM ICs and enter lot details"
              />

              <div className="ric-form-grid">
                {/* RM IC Numbers - Dropdown with Multiple Selection - HARDCODED FOR TESTING { value: 'RM-IC-1767597604003', label: 'RM-IC-1767597604003 ' },
                      { value: 'RM-IC-1767603751862', label: 'RM-IC-1767603751862' },
                      { value: 'RM-IC-1767604183531', label: 'RM-IC-1767604183531' },  
                      { value: 'RM-IC-1767604882477', label: 'RM-IC-1767604882477' }*/}
                <FormField
                  label="RM IC Numbers"
                  name="process_rm_ic_numbers"
                  required
                  hint={loadingRMICs ? "Loading completed RM ICs..." : "Select certificate number for completed RM inspections"}
                  fullWidth
                >
                  <MultiSelectDropdown
                    options={approvedRMICsForProcess.map(ic => ({
                      value: ic.certificate_no,  // Store certificate number
                      label: ic.certificate_no   // Display certificate number
                    }))}
                    selectedValues={formData.process_rm_ic_numbers}
                    onChange={(selectedValues) => handleRmIcSelection(selectedValues)}
                    placeholder={loadingRMICs ? "Loading..." : "Select Certificate Numbers"}
                  />
                  {formData.process_rm_ic_numbers.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                      Selected: {formData.process_rm_ic_numbers.join(', ')}
                    </div>
                  )}
                </FormField>

                {/* Book No - Set No - Auto-fetched */}
                <FormField
                  label="Book No - Set No."
                  name="process_book_set_nos"
                  // hint="Auto-fetched for each RM IC Number added above"
                  fullWidth
                >
                  <div className="ric-form-input ric-form-input--disabled" style={{ minHeight: '60px', padding: '12px' }}>
                    {formData.process_book_set_nos.length > 0 ? (
                      formData.process_book_set_nos.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '4px' }}>
                          <strong>{item.icNumber}:</strong> {item.bookSetNo}
                        </div>
                      ))
                    ) : (
                      <span style={{ color: '#999' }}>Select RM IC Numbers to auto-fetch Book/Set Numbers</span>
                    )}
                  </div>
                </FormField>

                {/* Info Message for Multiple Lots */}
                {formData.process_lot_heat_mapping.length > 1 && (
                  <div className="ric-info-message" style={{ gridColumn: '1 / -1', padding: '12px', backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3', marginBottom: '16px' }}>
                    <strong>Note:</strong> If more than 1 lot no. is added - "Process IC for all the Lots will be provided once all the lots are manufactured and inspected during process inspection"
                  </div>
                )}
              </div>

              {/* ========== HEAT SUMMARY SECTION ========== */}
              {formData.process_rm_ic_numbers.length > 0 && (
                <div style={{ gridColumn: '1 / -1', marginTop: '24px' }}>
                  <HeatSummaryTable
                    data={heatSummaryData}
                    loading={loadingHeatSummary}
                    poSerialNo={formData.po_serial_no}
                  />
                </div>
              )}

              {/* ========== LOT-HEAT MAPPING SECTION ========== */}
              <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Lot Numbers & Heat Numbers
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddProcessLotHeat}
                    className="ric-btn-secondary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    + Add Lot & Heat
                  </button>
                </div>

                {/* Lot-Heat Entries */}
                {formData.process_lot_heat_mapping.map((lotHeat, index) => (
                  <div
                    key={lotHeat.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Entry #{index + 1}
                      </h5>
                      {formData.process_lot_heat_mapping.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProcessLotHeat(lotHeat.id)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="ric-form-grid">
                      {/* Lot Number */}
                      <FormField
                        label="Lot No."
                        name={`process_lot_no_${lotHeat.id}`}
                        required
                        hint="Manual Entry - String"
                      >
                        <input
                          type="text"
                          className="ric-form-input"
                          value={lotHeat.lotNumber}
                          onChange={(e) => handleProcessLotNumberChange(lotHeat.id, e.target.value)}
                          placeholder="Enter Lot Number (e.g., LOT-2025-001)"
                        />
                      </FormField>

                      {/* Heat Number */}
                      <FormField
                        label="Heat Number"
                        name={`process_heat_number_${lotHeat.id}`}
                        required
                        hint={loadingHeats ? "Loading heat numbers..." : "Select heat number from selected ER (linked to RM IC)"}
                      >
                        <select
                          className="ric-form-select"
                          value={lotHeat.compositeKey || ''}
                          onChange={(e) => {
                            const compositeKey = e.target.value;
                            if (compositeKey) {
                              // Parse composite key: "heatNumber|manufacturer"
                              const [heatNum, manufacturer] = compositeKey.split('|');
                              const selectedHeat = processHeatNumbers.find(
                                h => h.heatNumber === heatNum && h.manufacturer === manufacturer
                              );
                              if (selectedHeat) {
                                handleProcessManufacturerHeatChange(
                                  lotHeat.id,
                                  `${selectedHeat.manufacturer} - ${heatNum}`,
                                  heatNum,
                                  selectedHeat.manufacturer,
                                  selectedHeat.qtyAccepted || 0,
                                  selectedHeat.weightAcceptedMt || 0,
                                  compositeKey
                                );
                              }
                            } else {
                              handleProcessManufacturerHeatChange(lotHeat.id, '', '', '', 0, 0, '');
                            }
                          }}
                          disabled={loadingHeats || processHeatNumbers.length === 0}
                        >
                          <option value="">
                            {loadingHeats ? "Loading..." : processHeatNumbers.length === 0 ? "Select RM IC first" : "Select Heat Number"}
                          </option>
                          {processHeatNumbers.map((heat) => {
                            const compositeKey = `${heat.heatNumber}|${heat.manufacturer}`;
                            return (
                              <option key={compositeKey} value={compositeKey}>
                                {heat.heatNumber} - ({heat.manufacturer})
                              </option>
                            );
                          })}
                        </select>
                      </FormField>

                      {/* Offered Quantity */}
                      {(() => {
                        const heatSummary = lotHeat.heatNumber ? heatSummaryData.find(h => h.heatNo === lotHeat.heatNumber) : null;
                        const offeredQty = parseInt(lotHeat.offeredQty) || 0;

                        // Format accepted weight for display in label
                        const acceptedWeightDisplay = heatSummary ? `${parseFloat(heatSummary.acceptedMt).toFixed(2)} MT` : '';

                        // Calculate available balance for THIS lot
                        // Available = Max ERC - Offered Earlier - (Total offered by OTHER lots using same heat)
                        let availableBalance = 0;
                        if (heatSummary) {
                          // Calculate total offered by OTHER lots using the same heat number
                          const otherLotsOffered = formData.process_lot_heat_mapping
                            .filter(lot => lot.heatNumber === lotHeat.heatNumber && lot.id !== lotHeat.id)
                            .reduce((sum, lot) => sum + (parseInt(lot.offeredQty) || 0), 0);

                          availableBalance = heatSummary.maxErc - (heatSummary.offeredEarlier || 0) - otherLotsOffered;
                        }

                        const exceedsBalance = heatSummary && offeredQty > availableBalance;

                        return (
                          <FormField
                            label={`Decalred Quantity of Lot in Nos. ${acceptedWeightDisplay ? `(Accepted: ${acceptedWeightDisplay})` : ''}`}
                            name={`process_offered_qty_${lotHeat.id}`}
                            required
                            hint={heatSummary ? `Available Future Balance: ${availableBalance} ERCs` : "Select heat number first"}
                            errors={exceedsBalance ? { [`process_offered_qty_${lotHeat.id}`]: `Exceeds available balance by ${offeredQty - availableBalance} ERCs` } : {}}
                          >
                            <input
                              type="number"
                              className={`ric-form-input ${exceedsBalance ? 'ric-form-input--error' : ''}`}
                              value={lotHeat.offeredQty}
                              onChange={(e) => handleProcessOfferedQtyChange(lotHeat.id, e.target.value)}
                              min="0"
                              max={heatSummary ? availableBalance : (lotHeat.maxQty || undefined)}
                              placeholder="Enter quantity in Number"
                              disabled={!lotHeat.heatNumber}
                              style={exceedsBalance ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                            />
                          </FormField>
                        );
                      })()}

                      {/* Tentative Start Date */}
                      <FormField
                        label="Tentative Date of Start of Production"
                        name={`process_tentative_start_date_${lotHeat.id}`}
                        // required // Commented out to allow infinite range
                        hint="Expected date when production will start for this lot"
                      >
                        <input
                          type="date"
                          className="ric-form-input"
                          value={lotHeat.tentativeStartDate}
                          onChange={(e) => handleProcessTentativeStartDateChange(lotHeat.id, e.target.value)}
                        // min={new Date().toISOString().split('T')[0]} // Removed to allow infinite range
                        />
                      </FormField>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ric-form-grid">
              </div>
            </>
          )}

          {/* ============ FINAL STAGE FIELDS ============ */}
          {formData.type_of_call === 'Final' && (
            <>
              <SectionHeader
                title="ERC Final Inspection Details"
                subtitle="Select lots and enter final quantity details"
              />

              <div className="ric-form-grid">
                {/* STEP 1: RM IC Numbers - First Dropdown (Multi-Select) */}
                <FormField
                  label="RM IC Numbers"
                  name="final_rm_ic_numbers"
                  required
                  hint="Certificate numbers from completed RM ICs (ER prefix)"
                >
                  {loadingRmIcsForFinal ? (
                    <div style={{ padding: '12px', color: '#666', fontStyle: 'italic' }}>
                      Loading RM IC certificates...
                    </div>
                  ) : (
                    <MultiSelectDropdown
                      options={rmIcNumbersForFinal.map(cert => ({
                        value: cert,
                        label: cert
                      }))}
                      selectedValues={formData.final_rm_ic_numbers}
                      onChange={(selectedValues) => {
                        setFormData(prev => ({
                          ...prev,
                          final_rm_ic_numbers: selectedValues,
                          final_process_ic_numbers: [], // Reset downstream selections
                          final_lot_numbers: []
                        }));
                      }}
                      placeholder="Select RM IC Certificate Number"
                    />
                  )}
                  {formData.final_rm_ic_numbers.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                      Selected: {formData.final_rm_ic_numbers.join(', ')}
                    </div>
                  )}
                </FormField>

                {/* STEP 2: Process IC Numbers - Second Dropdown (Multi-Select) */}
                <FormField
                  label="Process IC Numbers"
                  name="final_process_ic_numbers"
                  required
                  hint="Certificate numbers from completed Process ICs (EP prefix)"
                >
                  {loadingProcessIcs ? (
                    <div style={{ padding: '12px', color: '#666', fontStyle: 'italic' }}>
                      Loading Process IC certificates...
                    </div>
                  ) : (
                    <MultiSelectDropdown
                      options={processIcCertificates.map(cert => ({
                        value: cert,
                        label: cert
                      }))}
                      selectedValues={formData.final_process_ic_numbers}
                      onChange={(selectedValues) => {
                        setFormData(prev => ({
                          ...prev,
                          final_process_ic_numbers: selectedValues,
                          final_lot_numbers: [] // Reset downstream selections
                        }));
                      }}
                      placeholder={formData.final_rm_ic_numbers.length === 0 ? "Select RM IC first" : "Select Process IC Certificate Number"}
                      disabled={formData.final_rm_ic_numbers.length === 0}
                    />
                  )}
                  {formData.final_process_ic_numbers.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                      Selected: {formData.final_process_ic_numbers.join(', ')}
                    </div>
                  )}
                </FormField>

                {/* STEP 3: Lot Numbers - Third Dropdown (Multi-Select) */}
                <FormField
                  label="Lot No."
                  name="final_lot_numbers"
                  required
                  hint="Lot numbers from selected RM IC and Process IC"
                  fullWidth
                >
                  {loadingLotsForFinal ? (
                    <div style={{ padding: '12px', color: '#666', fontStyle: 'italic' }}>
                      Loading lot numbers...
                    </div>
                  ) : (
                    <MultiSelectDropdown
                      options={lotNumbersForFinal.map(lot => ({
                        value: lot,
                        label: lot
                      }))}
                      selectedValues={formData.final_lot_numbers}
                      onChange={(selectedValues) => {
                        setFormData(prev => ({ ...prev, final_lot_numbers: selectedValues }));
                      }}
                      placeholder={
                        formData.final_rm_ic_numbers.length === 0
                          ? "Select RM IC first"
                          : formData.final_process_ic_numbers.length === 0
                            ? "Select Process IC first"
                            : "Select Lot Numbers"
                      }
                      disabled={formData.final_rm_ic_numbers.length === 0 || formData.final_process_ic_numbers.length === 0}
                    />
                  )}
                  {formData.final_lot_numbers.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                      Selected: {formData.final_lot_numbers.join(', ')}
                    </div>
                  )}
                </FormField>
              </div>

              {/* STEP 4: Lot Details Table */}
              {formData.final_lots_data.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: '#1f2937',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '8px'
                  }}>
                    Lot Details ({formData.final_lots_data.length} lot{formData.final_lots_data.length > 1 ? 's' : ''} selected)
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="ric-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                          <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Lot No.</th>
                          <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Heat No.</th>
                          <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Qty Accepted in Process (Auto)</th>
                          <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Qty Offered for Inspection</th>
                          <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'left' }}>No. of Bags</th>
                          <th style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.final_lots_data.map((lot) => {
                          const isQtyInvalid = lot.offeredQty > lot.acceptedQtyProcess;
                          const minBagsRequired = Math.ceil((lot.offeredQty || 0) / 50);
                          const isBagsInvalid = lot.noOfBags > 0 && lot.noOfBags < minBagsRequired;

                          return (
                            <tr key={lot.lotNumber}>
                              <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{lot.lotNumber}</td>
                              <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{lot.heatNo}</td>
                              <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>{lot.acceptedQtyProcess}</td>
                              <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                                <input
                                  type="number"
                                  className={`ric-form-input ${isQtyInvalid ? 'error' : ''}`}
                                  value={lot.offeredQty}
                                  onChange={(e) => handleFinalLotDataChange(lot.lotNumber, 'offeredQty', parseInt(e.target.value) || 0)}
                                  placeholder="Quantity"
                                  style={isQtyInvalid ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                                />
                                {isQtyInvalid && (
                                  <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                                    Cannot exceed accepted qty ({lot.acceptedQtyProcess})
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                                <input
                                  type="number"
                                  className={`ric-form-input ${isBagsInvalid ? 'error' : ''}`}
                                  value={lot.noOfBags}
                                  onChange={(e) => handleFinalLotDataChange(lot.lotNumber, 'noOfBags', parseInt(e.target.value) || 0)}
                                  placeholder="Bags"
                                  style={isBagsInvalid ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                                />
                                {isBagsInvalid && (
                                  <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                                    Min {minBagsRequired} bags required (Qty/50)
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newLots = formData.final_lot_numbers.filter(l => l !== lot.lotNumber);
                                    setFormData(prev => ({ ...prev, final_lot_numbers: newLots }));
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#fee2e2',
                                    color: '#ef4444',
                                    border: '1px solid #fecaca',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="ric-form-grid">
                <FormField
                  label="Qunantity (No. of ERC)"
                  name="final_erc_qty"
                  hint="Sum of offered quantity from all lots"
                >
                  <input
                    type="number"
                    name="final_erc_qty"
                    className="ric-form-input ric-form-input--disabled"
                    value={formData.final_erc_qty}
                    disabled
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                  />
                </FormField>

                <FormField
                  label="Total Qty"
                  name="final_total_qty"
                  hint="Auto-calculated from Lot Details"
                >
                  <input
                    type="text"
                    className="ric-form-input ric-form-input--disabled"
                    value={formData.final_total_qty}
                    disabled
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    placeholder="Auto-calculated"
                  />
                </FormField>

                <FormField
                  label="No of HDPE Bags"
                  name="final_hdpe_bags"
                  hint="Sum of bags from all lots"
                >
                  <input
                    type="number"
                    name="final_hdpe_bags"
                    className="ric-form-input ric-form-input--disabled"
                    value={formData.final_hdpe_bags}
                    disabled
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    placeholder="Auto-calculated"
                  />
                </FormField>
              </div>
            </>
          )}

          {/* ============ PLACE OF INSPECTION ============ */}
          <SectionHeader title="Place of Inspection" subtitle="Select unit for inspection" />

          <div className="ric-form-grid">
            {/* Company Name - Dropdown */}
            <FormField label="Place of Inspection - Company Name" name="company_name" required errors={errors}>
              <select
                className="ric-form-select"
                value={formData.company_name}
                onChange={(e) => {
                  const selectedCompanyName = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    company_name: selectedCompanyName,
                    unit_name: '',
                    unit_address: ''
                  }));
                  setPoiCode('');
                }}
                disabled={loadingCompanies}
              >
                <option value="">
                  {loadingCompanies ? 'Loading companies...' : '-- Select Company --'}
                </option>
                {companies.map((companyName, index) => (
                  <option key={index} value={companyName}>
                    {companyName}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Unit Name - Dropdown for all call types */}
            <FormField
              label="place of Inspection - Unit Name"
              name="unit_name"
              required
              hint="DropDown (based upon the selection of Company name)"
            >
              <select
                className="ric-form-select"
                value={formData.unit_name}
                onChange={(e) => {
                  const selectedUnitName = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    unit_name: selectedUnitName,
                    unit_address: ''
                  }));
                  setPoiCode('');
                }}
                disabled={loadingUnits || !formData.company_name}
              >
                <option value="">
                  {loadingUnits ? 'Loading units...' :
                    !formData.company_name ? 'Select company first' :
                      'Select Unit'}
                </option>
                {units.map((unitName, index) => (
                  <option key={index} value={unitName}>
                    {unitName}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Unit Address - Auto Fetch for all call types */}
            <FormField label="place of Inspection - Unit Address" name="unit_address" hint="Auto Fetch" fullWidth>
              <input
                type="text"
                className="ric-form-input ric-form-input--disabled"
                value={loadingUnitDetails ? 'Loading address...' : formData.unit_address}
                disabled
              />
            </FormField>
          </div>

          <SectionHeader title="Additional Information" />

          <div className="ric-form-grid">
            <FormField label="Remarks" name="remarks" fullWidth>
              <textarea
                name="remarks"
                className="ric-form-textarea"
                value={formData.remarks}
                onChange={handleChange}
                rows={3}
                placeholder="Enter any additional remarks..."
              />
            </FormField>
          </div>

          <div className="ric-form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset Form
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isLoading || !formData.type_of_call}
            >
              {isLoading ? 'Submitting...' : 'Submit Inspection Call'}
            </button>
          </div>
        </>
      )}

      {/* Global Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: 'error' })}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </div>
  );
};

export default RaiseInspectionCallForm;
