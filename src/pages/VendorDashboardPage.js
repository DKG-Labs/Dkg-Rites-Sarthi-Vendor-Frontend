// src/pages/VendorDashboardPage.js
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Tabs from '../components/Tabs';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { InstrumentForm } from '../components/CalibrationForms';
import { getDetailedStatus } from '../utils/statusMapper';
import InitialCalibrationRegistration from '../components/InitialCalibrationRegistration';
import { PaymentForm } from '../components/PaymentForm';
import RaiseInspectionCallForm from '../components/RaiseInspectionCallForm';
import { MasterUpdatingForm } from '../components/MasterUpdatingForm';
import NewInventoryEntryForm from '../components/NewInventoryEntryForm';
import AddSubPOForm from '../components/AddSubPOForm';
import ViewInventoryEntryModal from '../components/ViewInventoryEntryModal';
import Modal from '../components/Modal';
import ViewMasterEntryModal from '../components/ViewMasterEntryModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Notification from '../components/Notification';
import SyncPOModal from '../components/common/SyncPOModal';
import VendorFeedbackModule from './VendorFeedbackModule/VendorFeedbackModule';
import {
  VENDOR_PO_LIST,
  VENDOR_REQUESTED_CALLS,
  VENDOR_COMPLETED_CALLS,
  VENDOR_CALIBRATION_ITEMS,
  VENDOR_APPROVAL_ITEMS,
  VENDOR_GAUGE_ITEMS,
  VENDOR_PAYMENT_ITEMS,
  VENDOR_MASTER_ITEMS,
  VENDOR_RAISE_CALL_PO,
  // VENDOR_INVENTORY_ENTRIES,
  CALIBRATION_MASTER_DATA,
  PAYMENT_MASTER_DATA,
  CALIBRATION_REQUIREMENTS,
  VENDOR_PRODUCT_TYPE,
  VENDOR_SUB_PO_LIST
} from '../data/vendorMockData';
import { formatDate } from '../utils/helpers';
import { generateCallLetterPDF } from '../utils/generateCallLetterPDF';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { getBaseUrl } from '../services/apiConfig';
import useVendorWorkflow from '../hooks/useVendorWorkflow';
import inspectionCallService from '../services/inspectionCallService';
import poAssignedService from '../services/poAssignedService';
import inventoryService from '../services/inventoryService';
import httpClient from '../services/httpClient';
import vendorCalibrationService from '../services/vendorCalibrationService';
import '../styles/vendorDashboard.css';
import { getStoredUser } from '../services/authService';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AnnexurePage from './AnnexurePage';
import AnnexureLoader from '../components/annexures/AnnexureLoader';

// Set worker source for pdfjs-dist locally
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const viewSignedCertificate = async (icNumber) => {
  try {
    console.log('🔍 Fetching signed certificate from Azure for IC:', icNumber);
    const encodedIcNumber = encodeURIComponent(icNumber);
    // Uses the API_ENDPOINTS.CERTIFICATES logic but with getBaseUrl()
    const baseUrl = getBaseUrl();
    const token = localStorage.getItem('token');

    // Fallback to dynamic URL structure
    const url = `${baseUrl}/certificate-storage/view?icNumber=${encodedIcNumber}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No signed certificate found for this IC.');
      }
      const errorText = await response.text();
      throw new Error(errorText || `Failed to fetch certificate: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetching signed certificate:', error);
    throw error;
  }
};


const ALLOWED_ACTION_STATUSES = ['VERIFY_PO_DETAILS', 'Created', 'CALL_REGISTERED', 'IE_SCHEDULED', 'Call Withheld', 'RETURNED', 'Returned by Call Desk'];

const cleanSerialNo = (serial) => {
  if (!serial) return '';
  const parts = String(serial).split('/');
  return parts[parts.length - 1].trim();
};

const VendorDashboardPage = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('vendorActiveTab') || 'po-assigned';
  });
  const [viewingPdfUrl, setViewingPdfUrl] = useState(null);

  useEffect(() => {
    setViewingPdfUrl(null);
    localStorage.setItem('vendorActiveTab', activeTab);
  }, [activeTab]);

  // Modal states for Calibration forms
  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false);

  // Modal state for Payment form
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Modal state for Raise Inspection Request form
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedPOItem, setSelectedPOItem] = useState(null);
  // Modify mode state
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const [modifyingCall, setModifyingCall] = useState(null);

  // Modal state for Add Sub PO form
  const [isAddSubPOModalOpen, setIsAddSubPOModalOpen] = useState(false);
  const [selectedSubPOItem, setSelectedSubPOItem] = useState(null);

  // State to track selected Sub PO for each item
  // const [selectedSubPOsByItem, setSelectedSubPOsByItem] = useState({});

  // Expanded PO rows state
  const [expandedPORows, setExpandedPORows] = useState({});


  // Expanded Inspection Call rows state (for Requested Calls tab)
  // eslint-disable-next-line no-unused-vars
  const [expandedCallRows, setExpandedCallRows] = useState({});

  // Modals for Inspection Call Details and Rectification
  const [isCallDetailsModalOpen, setIsCallDetailsModalOpen] = useState(false);
  const [isRectificationModalOpen, setIsRectificationModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);

  // Expanded Completed Call rows state
  // eslint-disable-next-line no-unused-vars
  const [expandedCompletedRows, setExpandedCompletedRows] = useState({});

  // Modals for Completed Calls - Inspection Summary and IC Correction
  const [isInspectionSummaryModalOpen, setIsInspectionSummaryModalOpen] = useState(false);
  const [isICCorrectionModalOpen, setIsICCorrectionModalOpen] = useState(false);
  const [selectedCompletedCall, setSelectedCompletedCall] = useState(null);

  // Withdrawal states
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawRemarks, setWithdrawRemarks] = useState('');
  const [selectedCallForWithdraw, setSelectedCallForWithdraw] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // Actions popup modal states
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [selectedCallForActions, setSelectedCallForActions] = useState(null);
  const [selectedCallForAnnexure, setSelectedCallForAnnexure] = useState(null);

  // Completed calls actions popup modal states
  const [isCompletedActionsModalOpen, setIsCompletedActionsModalOpen] = useState(false);
  const [selectedCompletedCallForActions, setSelectedCompletedCallForActions] = useState(null);

  // States for Heat Details modal
  const [isPoItemHeatDetailsModalOpen, setIsPoItemHeatDetailsModalOpen] = useState(false);
  const [poItemHeatDetailsData, setPoItemHeatDetailsData] = useState([]);
  const [selectedPoSrNoForHeatDetails, setSelectedPoSrNoForHeatDetails] = useState('');
  const [isHeatDetailsModalOpen, setIsHeatDetailsModalOpen] = useState(false);
  const [heatDetailsData, setHeatDetailsData] = useState([]);
  const [isFetchingHeatDetails, setIsFetchingHeatDetails] = useState(false);


  // Payment filter state
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [showOldApproved, setShowOldApproved] = useState(false);
  const [selectedPaymentCall, setSelectedPaymentCall] = useState(null);
  const [isCalibrationLoading, setIsCalibrationLoading] = useState(true);

  // Data state (for future API integration - currently using mock data)
  const [instrumentItems, setInstrumentItems] = useState(VENDOR_CALIBRATION_ITEMS);
  const [approvalItems, setApprovalItems] = useState(VENDOR_APPROVAL_ITEMS);
  const [gaugeItems, setGaugeItems] = useState(VENDOR_GAUGE_ITEMS);
  const [paymentItems, setPaymentItems] = useState(VENDOR_PAYMENT_ITEMS);
  const [subPOList, setSubPOList] = useState(VENDOR_SUB_PO_LIST);
  // const [inventoryEntries, setInventoryEntries] = useState(VENDOR_INVENTORY_ENTRIES);
  const [inventoryEntries, setInventoryEntries] = useState([]);
  const [availableHeatNumbers] = useState([]); // Used in RaiseInspectionCallForm props
  const [vendorPlants, setVendorPlants] = useState([]);

  const allCalibrationItems = useMemo(() => {
    return [...instrumentItems, ...approvalItems, ...gaugeItems];
  }, [instrumentItems, approvalItems, gaugeItems]);

  // Master Entries state
  const [masterItems, setMasterItems] = useState(VENDOR_MASTER_ITEMS);
  const [isViewMasterModalOpen, setIsViewMasterModalOpen] = useState(false);
  const [selectedMasterEntry, setSelectedMasterEntry] = useState(null);
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [isDeleteMasterConfirmOpen, setIsDeleteMasterConfirmOpen] = useState(false);
  const [masterToDelete, setMasterToDelete] = useState(null);

  // Inventory Entry Modal states
  const [isViewInventoryModalOpen, setIsViewInventoryModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [selectedInventoryEntry, setSelectedInventoryEntry] = useState(null);
  const [editingInventoryEntry, setEditingInventoryEntry] = useState(null);
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({ message: '', type: 'error' });

  const showNotification = useCallback((message, type = 'error') => {
    setNotification({ message, type });
  }, []);


  // PO Assigned data state - using real API
  const [poAssignedList, setPoAssignedList] = useState([]);
  const [loadingPOData, setLoadingPOData] = useState(false);
  const [poDataError, setPoDataError] = useState(null);
  const [isSyncPOModalOpen, setIsSyncPOModalOpen] = useState(false);

  // Helper to find matching PO using a robust normalized comparison
  const findMatchingPO = useCallback((poNo) => {
    if (!poNo) return null;
    const cleanTarget = String(poNo).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return poAssignedList.find(po => {
      const pPo = po.po_no || po.poNo || '';
      if (!pPo) return false;
      const cleanP = String(pPo).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return cleanTarget === cleanP || cleanTarget.includes(cleanP) || cleanP.includes(cleanTarget);
    });
  }, [poAssignedList]);

  // Helper state to generate annexures in the background for bulk download
  const [autoGenerateAnnexuresCall, setAutoGenerateAnnexuresCall] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfGeneratingText, setPdfGeneratingText] = useState({ 
    title: 'Generating PDF', 
    subtitle: 'Preparing high-quality certificate export...' 
  });

  // Requested Calls data state - using real API
  const [requestedCalls, setRequestedCalls] = useState([]);
  const [loadingRequestedCalls, setLoadingRequestedCalls] = useState(false);
  const [requestedCallsError, setRequestedCallsError] = useState(null);

  // Completed Calls data state - also derived from the same API
  const [completedCalls, setCompletedCalls] = useState([]);
  const [loadingCompletedCalls, setLoadingCompletedCalls] = useState(false);
  const [completedCallsError, setCompletedCallsError] = useState(null);

  const renderTableSkeleton = (colCount) => {
    return Array.from({ length: 5 }).map((_, rIdx) => (
      <tr key={`skeleton-row-${rIdx}`} className="skeleton-row">
        {Array.from({ length: colCount }).map((_, cIdx) => (
          <td key={`skeleton-col-${cIdx}`} style={{ padding: '16px' }}>
            <span className="skeleton-shimmer-line" style={{
              width: cIdx % 3 === 0 ? '60%' : (cIdx % 3 === 1 ? '85%' : '70%')
            }}></span>
          </td>
        ))}
      </tr>
    ));
  };

  // Pagination and sorting state for PO Assigned table
  const [poAssignedCurrentPage, setPoAssignedCurrentPage] = useState(1);
  const [poAssignedSortColumn, setPoAssignedSortColumn] = useState(null);
  const [poAssignedSortDirection, setPoAssignedSortDirection] = useState('asc');
  const [poAssignedSearchTerm, setPoAssignedSearchTerm] = useState('');
  const [poAssignedPageSize, setPoAssignedPageSize] = useState(10);

  // Sorting state for PO Items table (nested table)
  const [poItemsSortColumn, setPoItemsSortColumn] = useState({});
  const [poItemsSortDirection, setPoItemsSortDirection] = useState({});

  // Search state for Requested Inspection Call Status table
  const [requestedCallsSearchTerm, setRequestedCallsSearchTerm] = useState('');

  // Pagination and sorting state for Requested Inspection Call Status table
  const [requestedCallsPageSize, setRequestedCallsPageSize] = useState(10);
  const [requestedCallsCurrentPage, setRequestedCallsCurrentPage] = useState(1);
  const [requestedCallsSortColumn, setRequestedCallsSortColumn] = useState(null);
  const [requestedCallsSortDirection, setRequestedCallsSortDirection] = useState('asc');

  // Search state for Completed Calls table
  const [completedCallsSearchTerm, setCompletedCallsSearchTerm] = useState('');

  // Pagination and sorting state for Completed Calls table
  const [completedCallsPageSize, setCompletedCallsPageSize] = useState(10);
  const [completedCallsCurrentPage, setCompletedCallsCurrentPage] = useState(1);
  const [completedCallsSortColumn, setCompletedCallsSortColumn] = useState(null);
  const [completedCallsSortDirection, setCompletedCallsSortDirection] = useState('asc');

  const user = useMemo(() => getStoredUser(), []);
  const isFetchingRef = useRef(false);

  // ============ VENDOR WORKFLOW API INTEGRATION ============
  // Initialize the workflow hook for API calls
  const {
    loading: workflowLoading,
    errors: workflowErrors,
    transitionHistory,
    // paymentBlockedRecords,
    // pendingTransitions,
    initiateWorkflow,
    // performTransitionAction,
    fetchTransitionHistory,
    // fetchPaymentBlockedTransitions,
    // fetchPendingTransitions, // Commented out - backend endpoint not yet implemented
    clearError,
    // WORKFLOW_ACTIONS
  } = useVendorWorkflow();

  // State for workflow transition history modal
  const [isTransitionHistoryModalOpen, setIsTransitionHistoryModalOpen] = useState(false);
  const [selectedIcForHistory, setSelectedIcForHistory] = useState(null);

  // Current user context (would be from auth context in production)
  const currentUser = useMemo(() => ({
    id: user.userName,
    role: 'VENDOR',
    email: 'vendor@example.com'
  }), [user.userName]);

  // ============ FETCH PO ASSIGNED DATA ============
  const fetchPOAssignedData = useCallback(async () => {
    setLoadingPOData(true);
    setPoDataError(null);
    try {
      // TODO: Replace ':13101' with actual vendor code from auth context
      // For testing, using vendor code ':13101' from database
      const response = await poAssignedService.getPoAssigned(user.userName);

      if (response.success && response.data) {
        // Transform API data to match frontend structure
        // Backend returns VendorPoHeaderResponseDto with: poNo, poDate, poDes, qty, unit, poItem[]
        const transformedData = response.data.map((item, index) => ({
          id: index + 1, // Generate ID since backend doesn't return it
          po_no: item.poNo || '',
          po_date: item.poDate || '',
          description: item.poDes || '',
          zone_name: item.rlyShortName || item.rly_short_name || item.rlyCd || 'N/A',
          quantity: item.qty || 0,
          unit: item.unit || '',
          status: 'Fresh PO', // Backend doesn't return status, using default
          pdfPath: item.pdfPath || '',
          amendment_no: '',
          amendment_date: '',
          items: (item.poItem || []).map((poItem, itemIndex) => ({
            id: itemIndex + 1,
            item_name: poItem.poDes || '',
            item_qty: poItem.orderedQty || 0,
            item_unit: item.unit || '',
            item_status: 'Fresh PO',
            po_serial_no: poItem.poSerialNo || '',
            consignee: poItem.conigness || '',
            delivery_period: poItem.deliveryPeriod || '',
            item_code: '',
            unit_price: 0,
            total_price: 0
          }))
        }));

        setPoAssignedList(transformedData);
      } else {
        setPoDataError('Failed to fetch PO data');
        // Fallback to mock data
        setPoAssignedList(VENDOR_PO_LIST);
      }
    } catch (error) {
      console.error('Error fetching PO assigned data:', error);
      setPoDataError(error.message || 'Error fetching PO data');
      // Fallback to mock data
      setPoAssignedList(VENDOR_PO_LIST);
    } finally {
      setLoadingPOData(false);
    }
  }, [user.userName]);

  useEffect(() => {
    fetchPOAssignedData();
  }, [fetchPOAssignedData]);

  // ============ FETCH INVENTORY ENTRIES DATA ============
  const fetchInventoryEntries = useCallback(async () => {
    try {
      // TODO: Replace '13104' with actual vendor code from auth context
      const response = await inventoryService.getInventoryEntries(user.userName);

      if (response.success && response.data) {
        // Transform backend data to match frontend structure
        const transformedEntries = response.data.map(entry => ({
          id: entry.id,
          rawMaterial: entry.rawMaterial,
          supplierName: entry.supplierName,
          supplierAddress: entry.supplierAddress,
          gradeSpecification: entry.gradeSpecification,
          heatNumber: entry.heatNumber,
          tcNumber: entry.tcNumber,
          tcDate: entry.tcDate,
          invoiceNumber: entry.invoiceNumber,
          invoiceDate: entry.invoiceDate,
          subPoNumber: entry.subPoNumber,
          subPoDate: entry.subPoDate,
          subPoQty: entry.subPoQty,
          rateOfMaterial: entry.rateOfMaterial,
          rateOfGst: entry.rateOfGst,
          tcQuantity: entry.tcQuantity,
          offeredQuantity: entry.offeredQuantity || 0,
          // FIX: Handle case where backend incorrectly sends 0 for fresh entries
          qtyLeftForInspection: (() => {
            let qty = entry.qtyLeftForInspection !== null && entry.qtyLeftForInspection !== undefined ? entry.qtyLeftForInspection : entry.tcQuantity;
            const offered = entry.offeredQuantity || 0;
            if (qty === 0 && offered === 0 && entry.tcQuantity > 0) {
              return entry.tcQuantity;
            }
            return qty;
          })(),
          unitOfMeasurement: entry.unitOfMeasurement,
          baseValuePO: entry.baseValuePo,
          totalPO: entry.totalPo,
          lengthOfBars: entry.lengthOfBars,
          status: entry.status === 'FRESH_PO' ? 'Fresh' : entry.status,
          companyId: entry.companyId,
          companyName: entry.companyName,
          unitName: entry.unitName,
          tcFilePath: entry.tcFilePath,
          createdAt: entry.createdAt
        }));

        setInventoryEntries(transformedEntries);
        console.log('✅ Loaded inventory entries from database:', transformedEntries.length);
      } else {
        console.warn('⚠️ Failed to fetch inventory entries, using empty list');
        setInventoryEntries([]);
      }
    } catch (error) {
      console.error('❌ Error fetching inventory entries:', error);
      // Keep existing entries or use empty array
      setInventoryEntries([]);
    }
  }, [user.userName]);

  useEffect(() => {
    fetchInventoryEntries();
  }, [fetchInventoryEntries]);

  // ============ FETCH CALIBRATION RECORDS AND PLANTS ============
  const fetchCalibrationRecords = useCallback(async () => {
    setIsCalibrationLoading(true);
    try {
      const response = await vendorCalibrationService.getCalibrationsByVendor(user.userName);
      if (response.success && response.data) {
        const allHeaders = response.data;
        const instruments = [];
        const approvals = [];
        const gauges = [];

        allHeaders.forEach(header => {
          const parentInfo = {
            headerId: header.id,
            category: header.category,
            certificateFilePath: header.certificateFilePath,
            parentHeader: header
          };

          (header.details || []).forEach(detail => {
            const mapped = {
              ...detail,
              ...parentInfo,
              // Compatibility mappings:
              instrument_name: detail.instrumentName,
              capacity_range: detail.capacity,
              serial_number: detail.serialNumber,
              calibration_certificate_no: detail.calibrationCertificateNo,
              calibration_date: detail.calibrationDate,
              calibration_due_date: detail.calibrationDueDate,
              certifying_lab_name: detail.certifyingLabName,
              accreditation_agency: detail.accreditationAgency,
              make_model: detail.makeModel,
              master_equip_no_cert_validity: detail.masterEquipNoCertValidity,
              master_equip_nabl_details: detail.masterEquipNablDetails,
              notification_days: detail.notificationDays,
              calibration_status: detail.calibrationStatus,

              // For Document approvals:
              approval_document_name: detail.instrumentName,
              document_number: detail.serialNumber,
              approving_authority: detail.certifyingLabName,
              date_of_issue: detail.calibrationDate,
              valid_till: detail.calibrationDueDate,
              status: detail.calibrationStatus,

              // For Gauges:
              gauge_description: detail.instrumentName,
              product_name: detail.capacity,
              gauge_sr_no: detail.serialNumber
            };

            if (header.category === 'Instrument') {
              instruments.push(mapped);
            } else if (header.category === 'Document') {
              approvals.push(mapped);
            } else if (header.category === 'Gauge') {
              gauges.push(mapped);
            }
          });
        });

        setInstrumentItems(instruments);
        setApprovalItems(approvals);
        setGaugeItems(gauges);
      }
    } catch (error) {
      console.error('Error fetching calibration records:', error);
    } finally {
      setIsCalibrationLoading(false);
    }
  }, [user.userName]);

  const fetchVendorPlants = useCallback(async () => {
    // ERC vendors (role === 'Vendor') do not have plant assignments — skip this API
    const activeRole = localStorage.getItem('activeRole');
    if (!activeRole || activeRole === 'Vendor') return;

    try {
      const response = await httpClient.get(`/vendor-plant/vendor/${user.userName}/plants`);
      if (response.success && response.data) {
        setVendorPlants(response.data.plants || []);
      }
    } catch (error) {
      console.error('Error fetching vendor plants:', error);
    }
  }, [user.userName]);

  useEffect(() => {
    fetchCalibrationRecords();
    fetchVendorPlants();
  }, [fetchCalibrationRecords, fetchVendorPlants]);

  // ============ FETCH REQUESTED CALLS DATA ============
  const fetchRequestedCalls = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoadingRequestedCalls(true);
    setLoadingCompletedCalls(true);
    setRequestedCallsError(null);
    setCompletedCallsError(null);
    try {
      // Use actual vendor ID from currentUser context
      const response = await inspectionCallService.getVendorInspectionCallsWithStatus(user.userName);

      if (response.success && response.data) {
        // Transform API data to match frontend structure
        const transformedCalls = response.data.map((call, index) => ({
          id: index + 1,
          call_no: call.icNumber || '',
          po_no: call.poNo || '',
          item_name: call.itemName || 'N/A',
          stage: call.typeOfCall || '',
          call_date: call.desiredInspectionDate || '',
          quantity_offered: call.quantityOffered || 0,
          location: call.placeOfInspection || '',
          status: call.workflowStatus || call.jobStatus || 'Pending',
          // Additional fields for expanded view
          rlyShortName: call.rlyShortName || call.rly_short_name || call.rlyCd || 'N/A',
          ercType: call.ercType || 'N/A',
          noOfHeatsRM: call.noOfHeatsRM,
          lotNoProcess: call.lotNoProcess,
          lotNoFinal: call.lotNoFinal,
          ieName: call.ieName || 'Not Assigned',
          uom: call.uom || '',
          scheduledDate: call.scheduledDate,
          unitName: call.unitName || call.placeOfInspection || 'N/A',
          poSerialNo: call.poSerialNo || 'N/A',
          inspection_details: {
            inspector_name: call.ieName || 'N/A',
            inspection_date: call.desiredInspectionDate || '',
            remarks: call.nextRoleName ? `Next: ${call.nextRoleName}` : '',
            documents: []
          },
          rectification_details: null,
          // Workflow information
          workflowStatus: call.workflowStatus,
          currentRoleName: call.currentRoleName,
          nextRoleName: call.nextRoleName,
          jobStatus: call.jobStatus,
          // Fields for completed calls view
          completion_date: call.updatedAt || call.desiredInspectionDate || '',
          quantity_accepted: call.workflowStatus === 'WITHDRAW' ? 0 : (call.acceptedQty ?? call.quantityOffered ?? 0),
          quantity_rejected: 0,
          ic_number: call.icNumber || '',
          workflowTransitionId: call.workflowTransitionId,
          inspection_summary: {
            inspector_name: call.ieName || 'N/A',
            inspection_date: call.updatedAt || '',
            ie_remarks: call.nextRoleName ? `Last state: ${call.nextRoleName}` : '',
            acceptance_criteria: 'N/A',
            test_results: 'N/A',
            final_decision: call.workflowStatus || 'N/A'
          },
          documents: []
        }));

        // workflowStatus === 'WITHDRAW', 'INSPECTION_COMPLETE_CONFIRM', 'DSC_SIGN_IC', or 'GENERATE_IC' -> Completed
        const active = transformedCalls.filter(call =>
          call.workflowStatus !== 'WITHDRAW' &&
          call.workflowStatus !== 'INSPECTION_COMPLETE_CONFIRM' &&
          call.workflowStatus !== 'DSC_SIGN_IC' &&
          call.workflowStatus !== 'GENERATE_IC'
        );

        const completed = transformedCalls.filter(call =>
          call.workflowStatus === 'WITHDRAW' ||
          call.workflowStatus === 'INSPECTION_COMPLETE_CONFIRM' ||
          call.workflowStatus === 'DSC_SIGN_IC' ||
          call.workflowStatus === 'GENERATE_IC'
        );

        setRequestedCalls(active);
        setCompletedCalls(completed);

        console.log('✅ Loaded data from database:', {
          requestedCount: active.length,
          completedCount: completed.length
        });
      } else {
        console.warn('⚠️ Failed to fetch requested calls, using mock data');
        setRequestedCalls(VENDOR_REQUESTED_CALLS);
        setCompletedCalls(VENDOR_COMPLETED_CALLS);
      }
    } catch (error) {
      console.error('❌ Error fetching requested calls:', error);
      const errMsg = error.message || 'Error fetching requested calls';
      setRequestedCallsError(errMsg);
      setCompletedCallsError(errMsg);
      // Fallback to mock data
      setRequestedCalls(VENDOR_REQUESTED_CALLS);
      setCompletedCalls(VENDOR_COMPLETED_CALLS);
    } finally {
      setLoadingRequestedCalls(false);
      setLoadingCompletedCalls(false);
      isFetchingRef.current = false;
    }
  }, [user.userName]);

  useEffect(() => {
    fetchRequestedCalls();
  }, [fetchRequestedCalls]);

  // Filtered payment items based on status and date
  const filteredPaymentItems = useMemo(() => {
    // Start with existing payment items
    let items = [...paymentItems];

    // Add cancelled calls from requestedCalls that need payment
    const cancelledCallsForPayment = requestedCalls.filter(
      c => c.status === 'Call cancelled & payment Pending'
    ).map(c => ({
      id: `cancelled-${c.id}`,
      call_no: c.call_no,
      po_no: c.po_no,
      inspection_type: c.stage,
      payment_status: 'Payment Pending',
      total_payable_amount: 0,
      call_date: c.call_date
    }));

    items = [...items, ...cancelledCallsForPayment];

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return items.filter(item => {
      // Status filter
      if (paymentStatusFilter !== 'all' && item.payment_status !== paymentStatusFilter) {
        return false;
      }
      // Hide approved items older than 30 days unless showOldApproved is true
      if (item.payment_status === 'Approved by RITES Finance' && !showOldApproved) {
        const approvedDate = item.approved_date ? new Date(item.approved_date) : new Date(item.call_date);
        if (approvedDate < thirtyDaysAgo) return false;
      }
      return true;
    });
  }, [paymentItems, requestedCalls, paymentStatusFilter, showOldApproved]);

  // ============ COMPLIANCE STATUS CALCULATION ============
  // Get requirements for current vendor's product type
  const productRequirements = useMemo(() => {
    return CALIBRATION_REQUIREMENTS[VENDOR_PRODUCT_TYPE] || CALIBRATION_REQUIREMENTS['default'];
  }, []);

  // Calculate days until expiry
  const getDaysUntilExpiry = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  // Get calibration status based on due date
  const getCalibrationStatus = (dueDate, notificationDays = 30) => {
    const daysLeft = getDaysUntilExpiry(dueDate);
    if (daysLeft < 0) return 'Expired';
    if (daysLeft <= notificationDays) return 'Expiring Soon';
    return 'Valid';
  };

  // Calculate compliance for each category
  const complianceStatus = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalizeName = (name) => {
      if (!name) return '';
      return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    const isCategoryMatch = (itemName, category) => {
      const normName = normalizeName(itemName);
      const normCat = normalizeName(category);
      
      if (normCat === 'digitalvernier') {
        return normName.includes('digital') && normName.includes('vernier');
      }
      if (normCat === 'vernier') {
        return normName.includes('vernier') && !normName.includes('digital');
      }
      if (normCat === 'rockwellhardnesstester') {
        return normName.includes('rockwell') || normName.includes('hardness');
      }
      if (normCat === 'rdsoapproval') {
        return normName.includes('rdso');
      }
      if (normCat === 'qap') {
        return normName.includes('qap');
      }
      if (normCat === 'dimensiongauge') {
        return normName.includes('dimension') && normName.includes('gauge');
      }
      
      return normName.includes(normCat) || normCat.includes(normName);
    };

    // Calculate instrument compliance per category
    const instrumentCompliance = productRequirements.instruments.map(req => {
      const matchingItems = instrumentItems.filter(i => isCategoryMatch(i.instrument_name, req.category));
      const validItems = matchingItems.filter(i => {
        const dueDate = new Date(i.calibration_due_date);
        return dueDate >= today;
      });
      const expiringItems = matchingItems.filter(i => {
        const daysLeft = getDaysUntilExpiry(i.calibration_due_date);
        return daysLeft >= 0 && daysLeft <= (i.notification_days || 30);
      });
      const expiredItems = matchingItems.filter(i => {
        const dueDate = new Date(i.calibration_due_date);
        return dueDate < today;
      });

      let status = 'Non-Compliant';
      if (validItems.length >= req.minRequired && expiredItems.length === 0) {
        status = expiringItems.length > 0 ? 'Partially Compliant' : 'Compliant';
      } else if (validItems.length >= req.minRequired) {
        status = 'Partially Compliant';
      }

      return {
        ...req,
        currentCount: matchingItems.length,
        validCount: validItems.length,
        expiringCount: expiringItems.length,
        expiredCount: expiredItems.length,
        status,
        items: matchingItems
      };
    });

    // Calculate approval compliance per category
    const approvalCompliance = productRequirements.approvals.map(req => {
      const matchingItems = approvalItems.filter(a => isCategoryMatch(a.approval_document_name, req.category));
      const validItems = matchingItems.filter(a => {
        const validTill = new Date(a.valid_till);
        return validTill >= today;
      });
      const expiringItems = matchingItems.filter(a => {
        const daysLeft = getDaysUntilExpiry(a.valid_till);
        return daysLeft >= 0 && daysLeft <= (a.notification_days || 30);
      });
      const expiredItems = matchingItems.filter(a => {
        const validTill = new Date(a.valid_till);
        return validTill < today;
      });

      let status = 'Non-Compliant';
      if (validItems.length >= req.minRequired && expiredItems.length === 0) {
        status = expiringItems.length > 0 ? 'Partially Compliant' : 'Compliant';
      } else if (validItems.length >= req.minRequired) {
        status = 'Partially Compliant';
      }

      return {
        ...req,
        currentCount: matchingItems.length,
        validCount: validItems.length,
        expiringCount: expiringItems.length,
        expiredCount: expiredItems.length,
        status,
        items: matchingItems
      };
    });

    // Calculate gauge compliance per category
    const gaugeCompliance = productRequirements.gauges.map(req => {
      const matchingItems = gaugeItems.filter(g => isCategoryMatch(g.gauge_description, req.category));
      const validItems = matchingItems.filter(g => {
        const dueDate = new Date(g.calibration_due_date);
        return dueDate >= today;
      });
      const expiringItems = matchingItems.filter(g => {
        const daysLeft = getDaysUntilExpiry(g.calibration_due_date);
        return daysLeft >= 0 && daysLeft <= (g.notification_days || 30);
      });
      const expiredItems = matchingItems.filter(g => {
        const dueDate = new Date(g.calibration_due_date);
        return dueDate < today;
      });

      let status = 'Non-Compliant';
      if (validItems.length >= req.minRequired && expiredItems.length === 0) {
        status = expiringItems.length > 0 ? 'Partially Compliant' : 'Compliant';
      } else if (validItems.length >= req.minRequired) {
        status = 'Partially Compliant';
      }

      return {
        ...req,
        currentCount: matchingItems.length,
        validCount: validItems.length,
        expiringCount: expiringItems.length,
        expiredCount: expiredItems.length,
        status,
        items: matchingItems
      };
    });

    return {
      instruments: instrumentCompliance,
      approvals: approvalCompliance,
      gauges: gaugeCompliance
    };
  }, [instrumentItems, approvalItems, gaugeItems, productRequirements]);

  // Calculate overall compliance status
  const overallCompliance = useMemo(() => {
    const allCategories = [
      ...complianceStatus.instruments,
      ...complianceStatus.approvals,
      ...complianceStatus.gauges
    ];

    const mandatoryCategories = allCategories.filter(c => c.mandatory);
    const nonCompliantMandatory = mandatoryCategories.filter(c => c.status === 'Non-Compliant');
    const partiallyCompliantMandatory = mandatoryCategories.filter(c => c.status === 'Partially Compliant');
    
    // Calculate total expired/expiring items directly from arrays to avoid name mapping gaps
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const actualExpired = [
      ...instrumentItems.filter(i => i.calibration_due_date && new Date(i.calibration_due_date) < today),
      ...approvalItems.filter(a => a.valid_till && new Date(a.valid_till) < today),
      ...gaugeItems.filter(g => g.calibration_due_date && new Date(g.calibration_due_date) < today)
    ].length;
    
    const actualExpiring = [
      ...instrumentItems.filter(i => {
        const days = getDaysUntilExpiry(i.calibration_due_date);
        return days >= 0 && days <= (i.notification_days || i.notificationDays || 30);
      }),
      ...approvalItems.filter(a => {
        const days = getDaysUntilExpiry(a.valid_till);
        return days >= 0 && days <= (a.notification_days || a.notificationDays || 30);
      }),
      ...gaugeItems.filter(g => {
        const days = getDaysUntilExpiry(g.calibration_due_date);
        return days >= 0 && days <= (g.notification_days || g.notificationDays || 30);
      })
    ].length;

    const totalExpired = actualExpired;
    const totalExpiring = actualExpiring;

    // Check inspection call eligibility
    const canRaiseInspectionCall = nonCompliantMandatory.length === 0 && totalExpired === 0;

    let status = 'Compliant';
    let message = 'All calibration and approval records are valid. You can raise inspection calls.';

    if (nonCompliantMandatory.length > 0 || totalExpired > 0) {
      status = 'Non-Compliant';
      const issues = [];
      if (nonCompliantMandatory.length > 0) {
        issues.push(`${nonCompliantMandatory.length} mandatory category(s) incomplete`);
      }
      if (totalExpired > 0) {
        issues.push(`${totalExpired} expired certificate(s)`);
      }
      message = `Cannot raise inspection calls: ${issues.join(', ')}.`;
    } else if (partiallyCompliantMandatory.length > 0 || totalExpiring > 0) {
      status = 'Partially Compliant';
      message = `${totalExpiring} certificate(s) expiring soon. Renew before expiry to maintain eligibility.`;
    }

    return {
      status,
      message,
      canRaiseInspectionCall,
      nonCompliantCount: nonCompliantMandatory.length,
      partiallyCompliantCount: partiallyCompliantMandatory.length,
      totalExpired,
      totalExpiring
    };
  }, [complianceStatus, instrumentItems, approvalItems, gaugeItems]);

  // Edit state (null means add new, object means edit existing)
  const [editingInstrument, setEditingInstrument] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  // States for Upcoming Expiry Reminders details popup
  const [selectedExpiryItem, setSelectedExpiryItem] = useState(null);
  const [isExpiryDetailModalOpen, setIsExpiryDetailModalOpen] = useState(false);

  // Handlers for Upcoming Expiry Reminders details popup
  const handleOpenExpiryDetailModal = (item) => {
    setSelectedExpiryItem(item);
    setIsExpiryDetailModalOpen(true);
  };

  const handleCloseExpiryDetailModal = () => {
    setSelectedExpiryItem(null);
    setIsExpiryDetailModalOpen(false);
  };

  // Loading state for future API calls
  const [isLoading, setIsLoading] = useState(false);

  // ============ INSTRUMENT HANDLERS ============
  const handleOpenInstrumentModal = (instrument = null) => {
    setEditingInstrument(instrument);
    setIsInstrumentModalOpen(true);
  };

  const handleCloseInstrumentModal = () => {
    setIsInstrumentModalOpen(false);
    setEditingInstrument(null);
  };



  const handleSubmitCalibration = async (data) => {
    setIsLoading(true);
    try {
      if (editingInstrument && editingInstrument.id) {
        // Find the specific updated instrument
        const updatedDetail = data.details.find(d => d.id === editingInstrument.id) || data.details[0];
        
        if (updatedDetail) {
          const response = await vendorCalibrationService.updateCalibrationDetail(editingInstrument.id, updatedDetail);
          if (response.success) {
            showNotification('Calibration instrument updated successfully', 'success');
            await fetchCalibrationRecords();
            handleCloseInstrumentModal();
          } else {
            showNotification(response.error || 'Failed to update calibration instrument', 'error');
          }
          return;
        }
      }

      const payload = {
        id: data.id || null,
        vendorCode: user.userName,
        category: data.category,
        certificateFileBase64: data.certificateFileBase64 || '',
        certificateFilePath: data.certificateFilePath || '',
        details: data.details
      };

      const response = await vendorCalibrationService.createOrUpdateCalibration(payload);
      if (response.success) {
        showNotification('Calibration records saved successfully', 'success');
        await fetchCalibrationRecords();
        handleCloseInstrumentModal();
      } else {
        showNotification(response.error || 'Failed to save calibration records', 'error');
      }
    } catch (error) {
      console.error('Error saving calibration records:', error);
      showNotification(error.message || 'Error saving calibration records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitInstrument = handleSubmitCalibration;

  const handleDeleteCalibrationGroup = async (headerId) => {
    if (window.confirm("Are you sure you want to delete this calibration/approval registry group? All detail items under it will also be deleted.")) {
      setIsLoading(true);
      try {
        const response = await vendorCalibrationService.deleteCalibrationGroup(headerId);
        if (response.success) {
          showNotification('Calibration record deleted successfully', 'success');
          await fetchCalibrationRecords();
        } else {
          showNotification(response.error || 'Failed to delete calibration record', 'error');
        }
      } catch (error) {
        console.error('Error deleting calibration record:', error);
        showNotification(error.message || 'Error deleting calibration record', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ============ PAYMENT HANDLERS ============
  const handleOpenPaymentModal = (payment = null) => {
    setEditingPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setEditingPayment(null);
  };

  const handleSubmitPayment = async (data) => {
    setIsLoading(true);
    try {
      // TODO: Replace with API call
      // For file upload, would need to use FormData and multipart/form-data
      if (editingPayment) {
        setPaymentItems(prev =>
          prev.map(item => item.id === editingPayment.id ? { ...data, id: item.id } : item)
        );
      } else {
        const newId = Math.max(...paymentItems.map(i => i.id), 0) + 1;
        setPaymentItems(prev => [...prev, { ...data, id: newId, payment_status: 'Pending' }]);
      }
      handleClosePaymentModal();
    } catch (error) {
      console.error('Error saving payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ EXPANDABLE PO ROW HANDLERS ============
  const togglePORow = async (poId) => {
    const isExpanding = !expandedPORows[poId];

    setExpandedPORows(prev => ({
      ...prev,
      [poId]: isExpanding
    }));

  };

  // ============ RAISE INSPECTION REQUEST HANDLERS ============
  const handleOpenInspectionModal = (po, item, subPO = null) => {
    // Calculate already inspected quantities from requestedCalls for this PO Serial
    const poSerialNo = item.po_serial_no || item.poSerialNo;

    // Filter for completed calls matching the PO serial
    const completedCalls = requestedCalls.filter(call => {
      const matchPo = call.poSerialNo === poSerialNo || call.po_serial_no === poSerialNo;
      // Consider calls that have completed their workflow successfully
      const isCompleted = [call.status, call.workflowStatus, call.jobStatus].some(s =>
        s && (s.toUpperCase().includes('APPROVE') || s.toUpperCase().includes('COMPLET') || s.toUpperCase().includes('CERTIFICATE'))
      );
      return matchPo && isCompleted;
    });

    const qty_rm = completedCalls
      .filter(c => c.stage === 'Raw Material')
      .reduce((sum, c) => sum + (parseFloat(c.quantity_offered) || 0), 0);

    const qty_process = completedCalls
      .filter(c => c.stage === 'Process')
      .reduce((sum, c) => sum + (parseFloat(c.quantity_offered) || 0), 0);

    const qty_final = completedCalls
      .filter(c => c.stage === 'Final')
      .reduce((sum, c) => sum + (parseFloat(c.quantity_offered) || 0), 0);

    const enhancedItem = {
      ...item,
      qty_already_inspected_rm: qty_rm,
      qty_already_inspected_process: qty_process,
      qty_already_inspected_final: qty_final
    };

    setSelectedPOItem({ po, item: enhancedItem, subPO });
    setIsInspectionModalOpen(true);
  };

  const handleCloseInspectionModal = () => {
    setIsInspectionModalOpen(false);
    setSelectedPOItem(null);
    // Reset modify and view mode
    setIsModifyMode(false);
    setIsViewOnlyMode(false);
    setModifyingCall(null);
  };

  const handleSubmitInspectionRequest = async (data) => {
    setIsLoading(true);
    try {
      // Step 1: Save inspection call data to DATABASE
      console.log('💾 Saving inspection call to database...', data);

      let savedInspectionCall;

      // Call appropriate API based on inspection type
      let response;

      if (data.type_of_call === 'Raw Material') {
        response = await inspectionCallService.createRMInspectionCall(data);
      } else if (data.type_of_call === 'Process') {
        // Transform Process IC data to match new backend API structure
        console.log('🔍 DEBUG: data.type_of_erc =', data.type_of_erc);
        console.log('🔍 DEBUG: Full data object =', data);

        const processData = {
          inspectionCall: {
            icNumber: `PROC-IC-${Date.now()}`, // Temporary - backend will generate proper IC number
            poNo: data.po_no,
            poSerialNo: data.po_serial_no,
            typeOfCall: 'Process',
            ercType: data.type_of_erc || '',
            status: 'Pending',
            vendorId: user.userName,
            desiredInspectionDate: data.desired_inspection_date,
            actualInspectionDate: null,
            placeOfInspection: data.placeOfInspection, // POI code from API
            companyId: data.company_id,
            companyName: data.company_name,
            unitId: data.unit_id,
            unitName: data.unit_name,
            unitAddress: data.unit_address,
            remarks: data.remarks,
            createdBy: parseInt(user.userId) || user.userId, // Use logged-in userId
            updatedBy: parseInt(user.userId) || user.userId  // Use logged-in userId
          },
          processInspectionDetails: data.process_lot_heat_mapping.map(lotHeat => ({
            // Send ALL selected RM IC numbers as comma-separated string per lot row
            rmIcNumber: data.process_rm_ic_numbers && data.process_rm_ic_numbers.length > 0
              ? data.process_rm_ic_numbers.join(',')
              : null,
            lotNumber: lotHeat.lotNumber,
            heatNumber: lotHeat.heatNumber,
            manufacturer: lotHeat.manufacturer,
            manufacturerHeat: lotHeat.manufacturerHeat,
            offeredQty: parseInt(lotHeat.offeredQty) || 0,
            totalAcceptedQtyRm: parseInt(lotHeat.totalAcceptedQtyRm) || 0,
            declaredLotSize: parseInt(lotHeat.declaredLotSize) || 0,
            tentativeStartDate: lotHeat.tentativeStartDate || null,
            companyId: data.company_id,
            companyName: data.company_name,
            unitId: data.unit_id,
            unitName: data.unit_name,
            unitAddress: data.unit_address
          }))
        };

        console.log('📦 Transformed Process IC data:', processData);
        console.log('📦 Transformed Process IC data (JSON):', JSON.stringify(processData, null, 2));

        // Validate required fields before sending
        const missingFields = [];
        if (!processData.inspectionCall.poNo) missingFields.push('po_no');
        if (!processData.inspectionCall.poSerialNo) missingFields.push('po_serial_no');
        if (!processData.inspectionCall.desiredInspectionDate) missingFields.push('desired_inspection_date');
        // company_id and unit_id are now nullable - using POI API instead
        // if (!processData.inspectionCall.companyId) missingFields.push('company_id');
        // if (!processData.inspectionCall.unitId) missingFields.push('unit_id');

        if (missingFields.length > 0) {
          console.error('❌ Missing required fields:', missingFields);
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        response = await inspectionCallService.createProcessInspectionCall(processData);
      } else if (data.type_of_call === 'Final') {
        // Transform Final IC data to match new backend API structure
        const finalData = {
          inspectionCall: {
            icNumber: `FINAL-IC-${Date.now()}`, // Temporary - backend will generate proper IC number
            poNo: data.po_no,
            poSerialNo: data.po_serial_no,
            typeOfCall: 'Final',
            ercType: data.type_of_erc || '',
            status: 'Pending',
            vendorId: user.userName,
            desiredInspectionDate: data.desired_inspection_date,
            actualInspectionDate: null,
            placeOfInspection: data.placeOfInspection, // POI code from form
            companyId: parseInt(data.company_id) || null,
            companyName: data.company_name,
            unitId: parseInt(data.unit_id) || null,
            unitName: data.unit_name,
            unitAddress: data.unit_address,
            remarks: data.remarks || '',
            createdBy: parseInt(user.userId) || user.userId, // Use logged-in userId
            updatedBy: parseInt(user.userId) || user.userId  // Use logged-in userId
          },
          finalInspectionDetails: {
            // ---- Send ALL selected RM IC and Process IC numbers (new multi-select fields) ----
            rmIcNumbers: data.final_rm_ic_numbers || [],
            processIcNumbers: data.final_process_ic_numbers || [],
            // ---- Legacy single-value fields (backward compat) - first of each list ----
            rmIcNumber: data.final_rm_ic_numbers && data.final_rm_ic_numbers.length > 0
              ? data.final_rm_ic_numbers[0]
              : null,
            processIcNumber: data.final_process_ic_numbers && data.final_process_ic_numbers.length > 0
              ? data.final_process_ic_numbers[0]
              : null,
            companyId: parseInt(data.company_id) || null,
            companyName: data.company_name,
            unitId: parseInt(data.unit_id) || null,
            unitName: data.unit_name,
            unitAddress: data.unit_address,
            totalLots: data.final_lot_numbers ? data.final_lot_numbers.length : 0,
            totalOfferedQty: parseInt(data.final_total_qty) || 0
          },
          finalLotDetails: data.final_lots_data ? data.final_lots_data.map(lot => ({
            lotNumber: lot.lotNumber,
            heatNumber: lot.heatNo || '',
            manufacturer: '',
            manufacturerHeat: lot.heatNo || '',
            offeredQty: parseInt(lot.offeredQty) || 0,
            noOfBags: parseInt(lot.noOfBags) || 0,
            // Store all selected process IC numbers as comma-separated per lot
            processIcNumber: data.final_process_ic_numbers && data.final_process_ic_numbers.length > 0
              ? data.final_process_ic_numbers.join(',')
              : null
          })) : []
        };

        console.log('📦 Transformed Final IC data:', finalData);
        response = await inspectionCallService.createFinalInspectionCall(finalData);
      } else {
        throw new Error('Invalid inspection call type');
      }

      if (response.success) {
        // Handle different response formats:
        // - RM/Process IC returns: InspectionCall entity with camelCase properties { id, icNumber }
        // - Final IC returns: Custom response object with snake_case { inspection_call_id, ic_number }
        // Priority: Check camelCase first (RM/Process), then snake_case (Final)
        const icId = response.data.id || response.data.inspection_call_id;
        const icNumber = response.data.icNumber || response.data.ic_number;

        console.log('🔍 DEBUG: Response data structure:', response.data);
        console.log('🔍 DEBUG: Extracted IC ID:', icId);
        console.log('🔍 DEBUG: Extracted IC Number:', icNumber);

        savedInspectionCall = {
          ...data,
          icId: icId,
          icNumber: icNumber,
          vendorId: currentUser.id,
          createdBy: currentUser.id,
          createdAt: new Date().toISOString()
        };

        console.log('✅ Inspection call saved to database:', savedInspectionCall);

        // Step 2: Call initiateWorkflow API (optional - for workflow management)
        try {
          const workflowResponse = await initiateWorkflow({
            icId: savedInspectionCall.icNumber,
            poNo: data.po_no,
            poSerialNo: data.po_serial_no,
            vendorId: currentUser.id,
            stage: data.type_of_call,
            callDetails: {
              desiredInspectionDate: data.desired_inspection_date,
              offeredQty: data.rm_offered_qty_mt || data.process_offered_qty || data.final_total_erc_qty,
              companyId: data.company_id,
              unitId: data.unit_id,
              remarks: data.rm_remarks || data.process_remarks || data.final_remarks
            }
          });

          console.log('✅ Workflow initiated:', workflowResponse);
          setNotification({
            message: `✅ ${data.type_of_call} Inspection Request saved successfully!\n\nIC Number: ${savedInspectionCall.icNumber}\n\nData has been saved to the database.`,
            type: 'success'
          });
        } catch (workflowError) {
          // If workflow initiation fails, still show success for the save
          console.warn('⚠️ Workflow initiation failed (optional):', workflowError);
          setNotification({
            message: `✅ ${data.type_of_call} Inspection Request saved successfully!\n\nIC Number: ${savedInspectionCall.icNumber}\n\nNote: Workflow initiation pending.`,
            type: 'success'
          });
        }

        // Step 3: Refresh all data to reflect changes
        console.log('🔄 Refreshing dashboard data after successful call...');
        fetchRequestedCalls();
        fetchPOAssignedData();
        fetchInventoryEntries();

        // Show the new entry by switching to the "Requested Calls" tab
        setActiveTab('requested-calls');

      } else {
        throw new Error('Failed to save inspection call');
      }

      handleCloseInspectionModal();
    } catch (error) {
      console.error('❌ Error submitting inspection request:', error);

      // Extract detailed error message from backend response
      let errorMessage = error.message || 'Unknown error occurred';
      let errorDetails = '';

      // Check if error has response data (from backend API)
      if (error.response?.data) {
        const backendError = error.response.data;
        errorMessage = backendError.message || backendError.error || errorMessage;

        // Check for validation errors
        if (backendError.validationErrors) {
          errorDetails = '\n\nValidation Errors:\n' +
            Object.entries(backendError.validationErrors)
              .map(([field, msg]) => `• ${field}: ${msg}`)
              .join('\n');
        }

        // Check for inventory validation errors
        if (errorMessage.includes('Inventory validation failed') ||
          errorMessage.includes('exceeds available quantity')) {
          errorDetails += '\n\n⚠️ Inventory Issue:\nThe offered quantity exceeds the available quantity in inventory.\nPlease check the heat numbers and reduce the offered quantities.';
        }

        // Mask SQL and internal exceptions with a user-friendly message
        if (errorMessage.includes('could not execute statement') || errorMessage.includes('SQL') || errorMessage.includes('Exception')) {
          errorMessage = 'Please contact admin or support team.';
        }
      } else if (errorMessage.includes('Network Error') || errorMessage.includes('could not execute statement') || errorMessage.includes('SQL')) {
        errorMessage = 'Please contact admin or support team.';
      }

      // Show user-friendly error message
      setNotification({
        message: `❌ Failed to raise inspection call. ${errorMessage}${errorDetails}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============ MODIFY INSPECTION CALL HANDLER ============
  const handleSubmitModifyRequest = async (data) => {
    if (!modifyingCall) return;
    setIsLoading(true);
    try {
      const icNumber = modifyingCall.call_no;
      const updatedBy = String(user.userId);

      if (data.type_of_call === 'Raw Material') {
        // Build only the modified fields for InspectionCallRequestDto
        const icFields = {
          desiredInspectionDate: data.desired_inspection_date || null,
          placeOfInspection: data.placeOfInspection || null,
          remarks: data.remarks || null,
          ercType: data.type_of_erc || null,
          updatedBy
        };

        // Build only the modified fields for RmInspectionDetailsRequestDto
        const heatQuantities = (data.rm_heat_tc_mapping || []).map(heat => ({
          heatNumber: heat.heatNumber || null,
          manufacturer: heat.manufacturer || null,
          offeredQty: parseFloat(heat.offeredQty) || null,
          tcNumber: heat.tcNumber || null,
          tcDate: heat.tcDate || null,
          tcQuantity: parseFloat(heat.tcQty) || null,
          qtyLeft: null,
          qtyAccepted: null,
          qtyRejected: null,
          rejectionReason: null
        }));

        const chemicalAnalysis = (data.rm_heat_tc_mapping || []).map(heat => ({
          heatNumber: heat.heatNumber || null,
          carbon: parseFloat(heat.chemical_carbon) || null,
          manganese: parseFloat(heat.chemical_manganese) || null,
          silicon: parseFloat(heat.chemical_silicon) || null,
          sulphur: parseFloat(heat.chemical_sulphur) || null,
          phosphorus: parseFloat(heat.chemical_phosphorus) || null,
          chromium: parseFloat(heat.chemical_chromium) || null
        }));

        // Calculate the total offered quantity dynamically from the individual heat mappings
        const calculatedTotalQtyMt = heatQuantities.reduce((sum, h) => sum + (h.offeredQty || 0), 0);

        const rmFields = {
          totalOfferedQtyMt: calculatedTotalQtyMt || parseFloat(data.rm_total_offered_qty_mt) || null,
          offeredQtyErc: parseInt(data.rm_offered_qty_erc) || null,
          heatNumbers: heatQuantities.map(h => h.heatNumber).filter(Boolean).join(',') || null,
          tcNumber: heatQuantities[0]?.tcNumber || null,
          tcDate: heatQuantities[0]?.tcDate || null,
          tcQuantity: heatQuantities[0]?.tcQuantity || null,
          manufacturer: heatQuantities[0]?.manufacturer || null,
          heatQuantities: heatQuantities.length > 0 ? heatQuantities : null,
          chemicalAnalysis: chemicalAnalysis.length > 0 ? chemicalAnalysis : null
        };

        // Remove null values from top-level rmFields (only send non-null to backend)
        const filteredRmFields = Object.fromEntries(
          Object.entries(rmFields).filter(([, v]) => v !== null && v !== undefined)
        );
        const filteredIcFields = Object.fromEntries(
          Object.entries(icFields).filter(([, v]) => v !== null && v !== undefined && v !== '')
        );

        const response = await inspectionCallService.modifyRMInspectionCall(
          icNumber,
          filteredIcFields,
          filteredRmFields
        );

        if (response && response.success !== false) {
          setNotification({
            message: `✅ Inspection Call ${icNumber} modified successfully!`,
            type: 'success'
          });
          handleCloseInspectionModal();
          fetchRequestedCalls();
        } else {
          throw new Error('Modification failed on the server');
        }
      } else if (data.type_of_call === 'Process') {
        const icFields = {
          desiredInspectionDate: data.desired_inspection_date || null,
          placeOfInspection: data.placeOfInspection || null,
          remarks: data.remarks || null,
          ercType: data.type_of_erc || null,
          updatedBy
        };

        const processDetails = (data.process_lot_heat_mapping || []).map(lotHeat => ({
          rmIcNumber: data.process_rm_ic_numbers && data.process_rm_ic_numbers.length > 0
            ? data.process_rm_ic_numbers.join(',')
            : null,
          lotNumber: lotHeat.lotNumber || null,
          heatNumber: lotHeat.heatNumber || null,
          manufacturer: lotHeat.manufacturer || null,
          manufacturerHeat: lotHeat.manufacturerHeat || null,
          offeredQty: parseInt(lotHeat.offeredQty) || null,
          totalAcceptedQtyRm: parseInt(lotHeat.totalAcceptedQtyRm) || null,
          declaredLotSize: parseInt(lotHeat.declaredLotSize) || null,
          tentativeStartDate: lotHeat.tentativeStartDate || null,
          companyId: data.company_id || null,
          companyName: data.company_name || null,
          unitId: data.unit_id || null,
          unitName: data.unit_name || null,
          unitAddress: data.unit_address || null
        }));

        const filteredIcFields = Object.fromEntries(
          Object.entries(icFields).filter(([, v]) => v !== null && v !== undefined && v !== '')
        );

        const response = await inspectionCallService.modifyProcessInspectionCall(
          icNumber,
          filteredIcFields,
          processDetails
        );

        if (response && response.success !== false) {
          setNotification({
            message: `✅ Process Inspection Call ${icNumber} modified successfully!`,
            type: 'success'
          });
          handleCloseInspectionModal();
          fetchRequestedCalls();
        } else {
          throw new Error('Modification failed on the server');
        }
      } else if (data.type_of_call === 'Final') {
        const icFields = {
          desiredInspectionDate: data.desired_inspection_date || null,
          placeOfInspection: data.placeOfInspection || null,
          remarks: data.remarks || null,
          ercType: data.type_of_erc || null,
          updatedBy
        };

        const finalDetails = {
          rmIcNumbers: data.final_rm_ic_numbers || [],
          processIcNumbers: data.final_process_ic_numbers || [],
          rmIcNumber: data.final_rm_ic_numbers && data.final_rm_ic_numbers.length > 0
            ? data.final_rm_ic_numbers[0]
            : null,
          processIcNumber: data.final_process_ic_numbers && data.final_process_ic_numbers.length > 0
            ? data.final_process_ic_numbers[0]
            : null,
          companyId: parseInt(data.company_id) || null,
          companyName: data.company_name || null,
          unitId: parseInt(data.unit_id) || null,
          unitName: data.unit_name || null,
          unitAddress: data.unit_address || null,
          totalLots: data.final_lot_numbers ? data.final_lot_numbers.length : 0,
          totalOfferedQty: parseInt(data.final_total_qty) || 0
        };

        const lotDetails = (data.final_lots_data || []).map(lot => ({
          lotNumber: lot.lotNumber || null,
          heatNumber: lot.heatNo || '',
          manufacturer: '',
          manufacturerHeat: lot.heatNo || '',
          offeredQty: parseInt(lot.offeredQty) || null,
          noOfBags: parseInt(lot.noOfBags) || null,
          processIcNumber: data.final_process_ic_numbers && data.final_process_ic_numbers.length > 0
            ? data.final_process_ic_numbers.join(',')
            : null
        }));

        const filteredIcFields = Object.fromEntries(
          Object.entries(icFields).filter(([, v]) => v !== null && v !== undefined && v !== '')
        );
        const filteredFinalDetails = Object.fromEntries(
          Object.entries(finalDetails).filter(([, v]) => v !== null && v !== undefined)
        );

        const response = await inspectionCallService.modifyFinalInspectionCall(
          icNumber,
          filteredIcFields,
          filteredFinalDetails,
          lotDetails
        );

        if (response && response.success !== false) {
          setNotification({
            message: `✅ Final Inspection Call ${icNumber} modified successfully!`,
            type: 'success'
          });
          handleCloseInspectionModal();
          fetchRequestedCalls();
        } else {
          throw new Error('Modification failed on the server');
        }
      } else {
        setNotification({
          message: `⚠️ Unknown call type: ${data.type_of_call}`,
          type: 'warning'
        });
        handleCloseInspectionModal();
      }
    } catch (error) {
      console.error('❌ Error modifying inspection call:', error);
      
      let errorMessage = error.message || 'Unknown error';
      if (error.response?.data?.responseStatus?.message) {
        errorMessage = error.response.data.responseStatus.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      if (errorMessage.includes('could not execute statement') || errorMessage.includes('SQL') || errorMessage.includes('Exception') || errorMessage.includes('Network Error')) {
        errorMessage = 'Please contact admin or support team.';
      }
      
      setNotification({
        message: `❌ Failed to modify inspection call. ${errorMessage}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============ ADD SUB PO HANDLERS ============
  // const handleOpenAddSubPOModal = (po, item) => {
  //   setSelectedSubPOItem({ po, item });
  //   setIsAddSubPOModalOpen(true);
  // };

  const handleCloseAddSubPOModal = () => {
    setIsAddSubPOModalOpen(false);
    setSelectedSubPOItem(null);
  };

  // ============ INVENTORY ENTRY HANDLERS ============
  const handleInventorySubmit = async (data) => {
    console.log('Inventory entry submitted:', data);
    setIsLoading(true);

    // If data already has an ID, it means it's already saved in the backend (e.g. from bulk create or an update handled by the form itself)
    if (Array.isArray(data) || (data && data.id)) {
      const savedEntries = Array.isArray(data) ? data : [data];

      // Transform backend response to match frontend structure
      const formattedEntries = savedEntries.map(entry => ({
        id: entry.id,
        rawMaterial: entry.rawMaterial,
        supplierName: entry.supplierName,
        supplierAddress: entry.supplierAddress,
        gradeSpecification: entry.gradeSpecification,
        heatNumber: entry.heatNumber,
        tcNumber: entry.tcNumber,
        tcDate: entry.tcDate,
        invoiceNumber: entry.invoiceNumber,
        invoiceDate: entry.invoiceDate,
        subPoNumber: entry.subPoNumber,
        subPoDate: entry.subPoDate,
        subPoQty: entry.subPoQty,
        rateOfMaterial: entry.rateOfMaterial,
        rateOfGst: entry.rateOfGst,
        tcQuantity: entry.tcQuantity,
        offeredQuantity: entry.offeredQuantity || 0,
        qtyLeftForInspection: entry.qtyLeftForInspection !== undefined ? entry.qtyLeftForInspection : entry.tcQuantity,
        unitOfMeasurement: entry.unitOfMeasurement,
        baseValuePO: entry.baseValuePo,
        totalPO: entry.totalPo,
        lengthOfBars: entry.lengthOfBars,
        status: entry.status === 'FRESH_PO' ? 'Fresh' : entry.status,
        companyId: entry.companyId,
        companyName: entry.companyName,
        unitId: entry.unitId,
        unitName: entry.unitName,
        tcFilePath: entry.tcFilePath,
        createdAt: entry.createdAt
      }));

      if (editingInventoryEntry) {
        // Update handling for edit mode: find and replace in state
        const updatedEntry = formattedEntries[0];
        setInventoryEntries(prev => prev.map(entry => entry.id === editingInventoryEntry.id ? updatedEntry : entry));
        setEditingInventoryEntry(null);
        setNotification({
          message: `✅ Inventory entry updated successfully!`,
          type: 'success'
        });
      } else {
        // Add new entries to state
        setInventoryEntries(prev => [...formattedEntries, ...prev]);
      }

      setIsLoading(false);
      return true;
    }

    try {
      // Add vendor code to the data (currently hardcoded as 13104)
      const inventoryData = {
        ...data,
        vendorCode: user.userName,
        vendorName: 'Vendor Name'
      };

      // Call backend API to save inventory entry
      const response = editingInventoryEntry
        ? await inventoryService.updateInventoryEntry(editingInventoryEntry.id, inventoryData)
        : await inventoryService.createInventoryEntry(inventoryData);

      if (response.success) {
        console.log(`✅ Inventory entry ${editingInventoryEntry ? 'updated' : 'saved'} in database:`, response.data);

        // Transform backend response to match frontend structure
        const savedEntry = {
          id: response.data.id,
          rawMaterial: response.data.rawMaterial,
          supplierName: response.data.supplierName,
          supplierAddress: response.data.supplierAddress,
          gradeSpecification: response.data.gradeSpecification,
          heatNumber: response.data.heatNumber,
          tcNumber: response.data.tcNumber,
          tcDate: response.data.tcDate,
          invoiceNumber: response.data.invoiceNumber,
          invoiceDate: response.data.invoiceDate,
          subPoNumber: response.data.subPoNumber,
          subPoDate: response.data.subPoDate,
          subPoQty: response.data.subPoQty,
          rateOfMaterial: response.data.rateOfMaterial,
          rateOfGst: response.data.rateOfGst,
          tcQuantity: response.data.tcQuantity,
          offeredQuantity: response.data.offeredQuantity || 0,
          qtyLeftForInspection: response.data.qtyLeftForInspection !== undefined ? response.data.qtyLeftForInspection : response.data.tcQuantity,
          unitOfMeasurement: response.data.unitOfMeasurement,
          baseValuePO: response.data.baseValuePo,
          totalPO: response.data.totalPo,
          lengthOfBars: response.data.lengthOfBars,
          status: response.data.status === 'FRESH_PO' ? 'Fresh' : response.data.status,
          companyId: response.data.companyId,
          companyName: response.data.companyName,
          unitId: data.unitId || response.data.unitName,
          unitName: response.data.unitName,
          tcFilePath: response.data.tcFilePath,
          createdAt: response.data.createdAt
        };

        if (editingInventoryEntry) {
          // Update in local state
          setInventoryEntries(prev => prev.map(entry => entry.id === editingInventoryEntry.id ? savedEntry : entry));
          setEditingInventoryEntry(null);
          setNotification({
            message: `✅ Inventory entry updated successfully!\n\nMaterial: ${data.rawMaterial}\nHeat Number: ${data.heatNumber}`,
            type: 'success'
          });
        } else {
          // Add to inventory entries state
          setInventoryEntries(prev => [savedEntry, ...prev]);
          // Show success message
          setNotification({
            message: `✅ Inventory entry saved successfully!\n\nMaterial: ${data.rawMaterial}\nSupplier: ${data.supplierName}\nQuantity: ${data.declaredQuantity} ${data.unitOfMeasurement}`,
            type: 'success'
          });
        }

        // Return true to signal form to reset
        return true;
      } else {
        throw new Error(response.error || `Failed to ${editingInventoryEntry ? 'update' : 'save'} inventory entry`);
      }

    } catch (error) {
      console.error('❌ Error saving inventory entry:', error);
      setNotification({
        message: `❌ Failed to save inventory entry.\n\nError: ${error.message}`,
        type: 'error'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ============ INVENTORY ENTRY VIEW/EDIT/DELETE HANDLERS ============
  const handleViewInventoryEntry = (entry) => {
    setSelectedInventoryEntry(entry);
    setIsViewInventoryModalOpen(true);
  };

  const handleCloseViewInventoryModal = () => {
    setIsViewInventoryModalOpen(false);
    setSelectedInventoryEntry(null);
  };

  const handleEditInventoryEntry = (entry) => {
    // Close view modal if it's open
    setIsViewInventoryModalOpen(false);

    // Set the entry to be edited
    setEditingInventoryEntry(entry);

    // Open the inventory form modal
    setIsInventoryModalOpen(true);
  };

  const handleDeleteInventoryEntry = (entry) => {
    // Close view modal and open delete confirmation
    setIsViewInventoryModalOpen(false);
    setSelectedInventoryEntry(entry);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
    setSelectedInventoryEntry(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedInventoryEntry) return;

    setIsDeletingEntry(true);

    try {
      const response = await inventoryService.deleteInventoryEntry(selectedInventoryEntry.id);

      if (response.success) {
        // Remove from local state
        setInventoryEntries(prev => prev.filter(entry => entry.id !== selectedInventoryEntry.id));

        // Close modal and show notification
        setIsDeleteConfirmModalOpen(false);
        setSelectedInventoryEntry(null);
        showNotification(`✅ Inventory entry deleted successfully!\n\nHeat Number: ${selectedInventoryEntry.heatNumber}\nTC Number: ${selectedInventoryEntry.tcNumber}`, 'success');

        // Refresh inventory list
        fetchInventoryEntries();

        console.log('✅ Entry deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('❌ Error deleting entry:', error);
      showNotification(`❌ Failed to delete inventory entry:\n\n${error.message || 'Unknown error occurred'}`, 'error');
    } finally {
      setIsDeletingEntry(false);
    }
  };

  const handleSubmitSubPO = async (subPOData) => {
    setIsLoading(true);
    try {
      // Generate new Sub PO ID
      const newSubPO = {
        ...subPOData,
        id: subPOList.length + 1,
        submitted_date: new Date().toISOString().split('T')[0]
      };

      // Add to Sub PO list
      setSubPOList(prev => [...prev, newSubPO]);

      showNotification(`Sub PO ${subPOData.sub_po_number} submitted for approval successfully!`, 'success');
      handleCloseAddSubPOModal();
    } catch (error) {
      console.error('Error submitting Sub PO:', error);
      showNotification('Failed to submit Sub PO. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get approved Sub POs for a specific PO (all items)
  const getApprovedSubPOsForPO = (po) => {
    const poItemIds = po.items?.map(item => item.id) || [];
    return subPOList.filter(
      subPO => poItemIds.includes(subPO.po_item_id) && subPO.approval_status === 'Approved'
    );
  };

  // ============ INSPECTION CALL ROW HANDLERS ============
  // eslint-disable-next-line no-unused-vars
  const toggleCallRow = (callId) => {
    setExpandedCallRows(prev => ({
      ...prev,
      [callId]: !prev[callId]
    }));
  };

  // View Full Inspection Call Details modal handlers
  // eslint-disable-next-line no-unused-vars
  const handleOpenCallDetailsModal = (call) => {
    setSelectedCall(call);
    setIsCallDetailsModalOpen(true);
  };

  const handleCloseCallDetailsModal = () => {
    setIsCallDetailsModalOpen(false);
    setSelectedCall(null);
  };

  // Update Rectification Details modal handlers
  // eslint-disable-next-line no-unused-vars
  const handleOpenRectificationModal = (call) => {
    setSelectedCall(call);
    setIsRectificationModalOpen(true);
  };

  const handleCloseRectificationModal = () => {
    setIsRectificationModalOpen(false);
    setSelectedCall(null);
  };

  // Download Acknowledged Documents handler
  // eslint-disable-next-line no-unused-vars
  const handleDownloadDocuments = (call) => {
    console.log('Downloading documents for:', call.call_no);
    showNotification(`Downloading documents for ${call.call_no}:\n- ${call.inspection_details?.documents?.join('\n- ') || 'No documents available'}`, 'info');
  };

  // ============ COMPLETED CALLS ROW HANDLERS ============
  // eslint-disable-next-line no-unused-vars
  const toggleCompletedRow = (callId) => {
    setExpandedCompletedRows(prev => ({
      ...prev,
      [callId]: !prev[callId]
    }));
  };

  const handleCompletedCallsSort = (column) => {
    if (column === 'actions') return;
    if (completedCallsSortColumn === column) {
      setCompletedCallsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setCompletedCallsSortColumn(column);
      setCompletedCallsSortDirection('asc');
    }
  };

  // View Full Inspection Summary modal handlers
  // eslint-disable-next-line no-unused-vars
  const handleOpenInspectionSummaryModal = (call) => {
    setSelectedCompletedCall(call);
    setIsInspectionSummaryModalOpen(true);
  };

  const handleCloseInspectionSummaryModal = () => {
    setIsInspectionSummaryModalOpen(false);
    setSelectedCompletedCall(null);
  };

  // Download IC handler
  const handleDownloadIC = async (call) => {
    const icNum = call.ic_number || call.call_no;
    if (!icNum) {
      showNotification('IC Number not found.', 'error');
      return;
    }
    setPdfGeneratingText({
      title: 'Downloading Certificate',
      subtitle: `Fetching signed IC certificate for ${icNum}...`
    });
    setPdfGenerating(true);
    try {
      const response = await viewSignedCertificate(icNum);
      if (response && response.signedData) {
        // Base64 to blob and download
        const byteCharacters = atob(response.signedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.fileName || `Inspection_Certificate_${icNum}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Open automatically in new tab
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);

        showNotification('Inspection Certificate downloaded successfully!', 'success');
      } else {
        showNotification('No signed certificate data found.', 'warning');
      }
    } catch (error) {
      console.error('Failed to download IC:', error);
      showNotification(`Failed to download IC: ${error.message}`, 'error');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleOpenPoItemHeatDetails = async (poSrNo) => {
    setSelectedPoSrNoForHeatDetails(poSrNo);
    setIsFetchingHeatDetails(true);
    setPoItemHeatDetailsData([]);
    setIsPoItemHeatDetailsModalOpen(true);
    
    try {
      const response = await inspectionCallService.getHeatDetailsByPoSrNo(poSrNo);
      if (response && response.success) {
        const rawData = response.data || [];
        const grouped = rawData.reduce((acc, curr) => {
          const { callNo, heatNo, tcNo, offeredQty, acceptedQty, rejectedQty, weightAcceptedMt, weightRejectedMt } = curr;
          const cNo = callNo || 'N/A';
          const hNo = heatNo || 'N/A';
          const key = cNo + '_' + hNo;
          
          if (!acc[key]) {
            acc[key] = {
              callNo: cNo,
              heatNo: hNo,
              tcNos: tcNo ? [tcNo] : [],
              offeredQty: parseFloat(offeredQty || 0),
              acceptedQty: parseFloat(acceptedQty || 0),
              rejectedQty: parseFloat(rejectedQty || 0),
              weightAcceptedMt: parseFloat(weightAcceptedMt || 0),
              weightRejectedMt: parseFloat(weightRejectedMt || 0)
            };
          } else {
            if (tcNo && !acc[key].tcNos.includes(tcNo)) {
              acc[key].tcNos.push(tcNo);
            }
            acc[key].offeredQty += parseFloat(offeredQty || 0);
          }
          return acc;
        }, {});
        
        const groupedArray = Object.values(grouped).map(item => ({
          ...item,
          tcNo: item.tcNos.length > 0 ? item.tcNos.join(', ') : '-'
        }));
        
        // Sort by callNo descending
        groupedArray.sort((a, b) => b.callNo.localeCompare(a.callNo));
        
        setPoItemHeatDetailsData(groupedArray);
      } else {
        showNotification('Failed to fetch heat details for this PO Item.', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch heat details for this PO Item:', error);
      showNotification('Error fetching heat details.', 'error');
    } finally {
      setIsFetchingHeatDetails(false);
    }
  };

  const handleOpenHeatDetails = async (call) => {
    if (!call?.call_no) {
      showNotification('Call ID not found.', 'error');
      return;
    }
    setIsFetchingHeatDetails(true);
    setHeatDetailsData([]);
    setIsHeatDetailsModalOpen(true);
    
    try {
      const response = await inspectionCallService.getHeatDetails(call.call_no);
      if (response && response.success) {
        const rawData = response.data || [];
        const grouped = rawData.reduce((acc, curr) => {
          const { heatNo, tcNo, offeredQty, acceptedQty, rejectedQty, weightAcceptedMt, weightRejectedMt } = curr;
          const hNo = heatNo || 'N/A';
          if (!acc[hNo]) {
            acc[hNo] = {
              heatNo: hNo,
              tcNos: tcNo ? [tcNo] : [],
              offeredQty: parseFloat(offeredQty || 0),
              acceptedQty: parseFloat(acceptedQty || 0),
              rejectedQty: parseFloat(rejectedQty || 0),
              weightAcceptedMt: parseFloat(weightAcceptedMt || 0),
              weightRejectedMt: parseFloat(weightRejectedMt || 0)
            };
          } else {
            if (tcNo && !acc[hNo].tcNos.includes(tcNo)) {
              acc[hNo].tcNos.push(tcNo);
            }
            acc[hNo].offeredQty += parseFloat(offeredQty || 0);
          }
          return acc;
        }, {});
        
        const groupedArray = Object.values(grouped).map(item => ({
          ...item,
          tcNo: item.tcNos.length > 0 ? item.tcNos.join(', ') : 'N/A',
          offeredQty: Math.round(item.offeredQty * 1000) / 1000,
          acceptedQty: Math.round(item.acceptedQty * 1000) / 1000,
          rejectedQty: Math.round(item.rejectedQty * 1000) / 1000,
          weightAcceptedMt: Math.round(item.weightAcceptedMt * 1000) / 1000,
          weightRejectedMt: Math.round(item.weightRejectedMt * 1000) / 1000
        }));
        setHeatDetailsData(groupedArray);
      } else {
        showNotification('Failed to fetch heat details.', 'error');
      }
    } catch (error) {
      console.error('Error fetching heat details:', error);
      showNotification('Error fetching heat details.', 'error');
    } finally {
      setIsFetchingHeatDetails(false);
    }
  };

  // Download Call Letter handler
  const handleDownloadCallLetter = async (call) => {
    if (!call?.call_no) {
      showNotification('Call ID not found. Cannot generate PDF.', 'error');
      return;
    }
    setPdfGeneratingText({
      title: 'Generating Call Letter',
      subtitle: 'Fetching call details and generating PDF...'
    });
    setPdfGenerating(true);
    try {
      const url = `${getBaseUrl()}/call-letter/details?requestId=${encodeURIComponent(call.call_no)}`;
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      };
      const response = await fetch(url, { method: 'GET', headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch call letter details`);
      }
      const json = await response.json();
      const details = json.responseData ?? json.data ?? json;

      // Merge on top of existing call data
      const enrichedCall = {
        ...call,
        ...details,
        callNumber: call.call_no,
        poNumber: call.po_no
      };

      const doc = generateCallLetterPDF(enrichedCall, false); // generate without downloading internally
      const filename = `Call_Letter_${String(enrichedCall.callNumber || enrichedCall.call_no).replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
      
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Download automatically
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Open automatically in new tab
      window.open(pdfUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

      showNotification('Call Letter PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to generate Call Letter PDF:', err);
      showNotification('Failed to fetch call letter details. Please try again.', 'error');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Download Inspection Documents handler
  // eslint-disable-next-line no-unused-vars
  const handleDownloadInspectionDocuments = (call) => {
    console.log('Downloading inspection documents for:', call.call_no);
    showNotification(`Downloading Inspection Documents for ${call.call_no}:\n- ${call.documents?.join('\n- ') || 'No documents available'}`, 'info');
  };

  // PO PDF Document download helper
  const downloadPoDoc = (pdfPath, poNo) => {
    if (!pdfPath) {
      showNotification('PO document path not found.', 'warning');
      return;
    }
    if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in')) {
      window.open(pdfPath, '_blank');
    } else {
      const url = vendorCalibrationService.getFileUrl(pdfPath);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PO_${poNo}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Merging and Downloading logic once all buffers (including optional Annexures) are ready
  const proceedWithMergeAndDownload = async (call, annexuresBuf) => {
    // Force set worker source dynamically locally to prevent hot-reload caching of old URLs
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    
    setPdfGeneratingText({
      title: 'Merging Documents',
      subtitle: 'Compiling PO, Call Letter, and Reports into a single PDF...'
    });
    setPdfGenerating(true);
    console.log('[DownloadAllDocs] Starting merge for call:', call);
    
    try {
      const buffersToMerge = [];
      let externalPoUrl = null;

      // 1. Gather all documents in parallel
      const fetchPO = (async () => {
        const matchingPO = findMatchingPO(call.po_no || call.poNo);
        if (!matchingPO || !matchingPO.pdfPath) return null;
        
        const pdfPath = matchingPO.pdfPath;
        if (pdfPath.startsWith('http') || pdfPath.includes('ireps.gov.in')) {
          try {
            const proxyUrl = `${getBaseUrl()}/vendor/proxy-pdf?url=${encodeURIComponent(pdfPath)}`;
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const headers = {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            };
            const res = await fetch(proxyUrl, { headers });
            if (res.ok) {
              return await res.arrayBuffer();
            } else {
              externalPoUrl = pdfPath;
              return null;
            }
          } catch (e) {
            console.error('[DownloadAllDocs] Error fetching external PO via proxy:', e);
            externalPoUrl = pdfPath;
            return null;
          }
        } else {
          try {
            const url = vendorCalibrationService.getFileUrl(pdfPath);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const headers = {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            };
            const res = await fetch(url, { headers });
            if (res.ok) {
              return await res.arrayBuffer();
            }
            return null;
          } catch (e) {
            console.error('[DownloadAllDocs] Error fetching PO document:', e);
            return null;
          }
        }
      })();

      const fetchCallLetter = (async () => {
        if (!['INSPECTION_COMPLETE_CONFIRM', 'GENERATE_IC', 'DSC_SIGN_IC'].includes(call.workflowStatus)) {
          return null;
        }
        try {
          const url = `${getBaseUrl()}/call-letter/details?requestId=${encodeURIComponent(call.call_no)}`;
          const token = localStorage.getItem('authToken');
          const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          };
          const response = await fetch(url, { method: 'GET', headers });
          if (response.ok) {
            const json = await response.json();
            const details = json.responseData ?? json.data ?? json;
            const enrichedCall = {
              ...call,
              ...details,
              callNumber: call.call_no,
              poNumber: call.po_no
            };
            const callLetterDoc = generateCallLetterPDF(enrichedCall, false); // generate without downloading
            return callLetterDoc.output('arraybuffer');
          }
          return null;
        } catch (e) {
          console.error('[DownloadAllDocs] Error creating Call Letter PDF:', e);
          return null;
        }
      })();

      const fetchIC = (async () => {
        if (!['DSC_SIGN_IC'].includes(call.workflowStatus)) {
          return null;
        }
        try {
          const icNum = call.ic_number || call.call_no;
          const response = await viewSignedCertificate(icNum);
          if (response && response.signedData) {
            const byteCharacters = atob(response.signedData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            return byteArray.buffer;
          }
          return null;
        } catch (e) {
          console.error('[DownloadAllDocs] Error fetching IC document:', e);
          return null;
        }
      })();

      // Await all fetches in parallel
      const [poBuf, callLetterBuf, icBuf] = await Promise.all([fetchPO, fetchCallLetter, fetchIC]);

      if (poBuf) {
        buffersToMerge.push(poBuf);
        console.log('[DownloadAllDocs] PO PDF added to merge list. Size:', poBuf.byteLength);
      }
      if (annexuresBuf) {
        buffersToMerge.push(annexuresBuf);
        console.log('[DownloadAllDocs] Annexures PDF added to merge list. Size:', annexuresBuf.byteLength);
      }
      if (callLetterBuf) {
        buffersToMerge.push(callLetterBuf);
        console.log('[DownloadAllDocs] Call Letter PDF added to merge list. Size:', callLetterBuf.byteLength);
      }
      if (icBuf) {
        buffersToMerge.push(icBuf);
        console.log('[DownloadAllDocs] IC PDF added to merge list. Size:', icBuf.byteLength);
      }

      if (buffersToMerge.length === 0) {
        if (externalPoUrl) {
          showNotification('PO document is hosted on external IREPS portal. Opening PO document in a new tab.', 'info');
          window.open(externalPoUrl, '_blank');
        } else {
          showNotification('No local documents found to merge.', 'warning');
        }
        return;
      }

      // Create a combined PDF using jsPDF
      const combinedDoc = new jsPDF({ unit: 'pt' });
      let hasPagesAdded = false;

      // 2. Load and render pages in parallel for massive speedup!
      const docPromises = buffersToMerge.map(buffer => pdfjsLib.getDocument({ data: buffer }).promise);
      const pdfDocs = await Promise.all(docPromises);

      const pageInfoList = [];
      for (let docIdx = 0; docIdx < pdfDocs.length; docIdx++) {
        const pdfDoc = pdfDocs[docIdx];
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          pageInfoList.push({ pdfDoc, pageNum });
        }
      }

      // Render all pages concurrently
      const renderPage = async ({ pdfDoc, pageNum }) => {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const wPoints = viewport.width / 1.5;
        const hPoints = viewport.height / 1.5;
        
        return { imgData, wPoints, hPoints };
      };

      const renderedPages = await Promise.all(pageInfoList.map(renderPage));

      // Append pages in the correct order
      renderedPages.forEach(({ imgData, wPoints, hPoints }) => {
        combinedDoc.addPage([wPoints, hPoints], wPoints > hPoints ? 'l' : 'p');
        combinedDoc.addImage(imgData, 'JPEG', 0, 0, wPoints, hPoints, undefined, 'FAST');
        hasPagesAdded = true;
      });

      if (hasPagesAdded) {
        combinedDoc.deletePage(1); // delete initial blank page
        const outFilename = `Combined_Inspection_Docs_${call.call_no}.pdf`;
        
        const pdfBlob = combinedDoc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Download automatically
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = outFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Open automatically
        window.open(pdfUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
        
        if (externalPoUrl) {
          showNotification('Opened external PO document in a new tab, and downloaded other documents in a single combined PDF.', 'warning');
          window.open(externalPoUrl, '_blank');
        } else {
          showNotification('All documents merged and downloaded in a single PDF successfully!', 'success');
        }
      } else {
        showNotification('Failed to generate combined PDF.', 'error');
      }

    } catch (error) {
      console.error('Failed to merge documents:', error);
      showNotification(`Failed to merge and download documents: ${error.message}`, 'error');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Bulk download available completed inspection call documents in a single merged PDF
  const handleDownloadAllDocs = async (call) => {
    // If status has annexures, trigger auto generation first
    const hasAnnexures = ['INSPECTION_COMPLETE_CONFIRM', 'GENERATE_IC', 'DSC_SIGN_IC'].includes(call.workflowStatus);
    
    setPdfGeneratingText({
      title: 'Generating PDF',
      subtitle: 'Fetching details and preparing documents for download...'
    });
    setPdfGenerating(true);

    if (hasAnnexures) {
      showNotification('Fetching and generating Annexures PDF in background...', 'info');
      setAutoGenerateAnnexuresCall(call);
    } else {
      // Just proceed without annexures
      await proceedWithMergeAndDownload(call, null);
    }
  };

  // Request IC Correction modal handlers
  // eslint-disable-next-line no-unused-vars
  const handleOpenICCorrectionModal = (call) => {
    setSelectedCompletedCall(call);
    setIsICCorrectionModalOpen(true);
  };

  const handleCloseICCorrectionModal = () => {
    setIsICCorrectionModalOpen(false);
    setSelectedCompletedCall(null);
  };

  // ============ WORKFLOW API HANDLERS ============

  /**
   * Open transition history modal and fetch history for an IC
   * Uses workflowTransitionHistory API
   */
  const handleViewTransitionHistory = useCallback(async (call) => {
    setSelectedIcForHistory(call);
    setIsTransitionHistoryModalOpen(true);

    try {
      await fetchTransitionHistory(call.ic_number || call.call_no);
    } catch (error) {
      console.error('Failed to fetch transition history:', error);
    }
  }, [fetchTransitionHistory]);

  /**
   * Close transition history modal
   */
  const handleCloseTransitionHistoryModal = useCallback(() => {
    setIsTransitionHistoryModalOpen(false);
    setSelectedIcForHistory(null);
  }, []);

  /**
   * Perform workflow action (verify, approve, reject)
   * Uses performTransitionAction API
   */
  // const handlePerformWorkflowAction = useCallback(async (call, action, remarks = '') => {
  //   try {
  //     const response = await performTransitionAction({
  //       icId: call.ic_number || call.call_no,
  //       action: action,
  //       performedBy: currentUser.id,
  //       roleName: currentUser.role,
  //       remarks: remarks,
  //       timestamp: new Date().toISOString()
  //     });

  //     showNotification(`Action "${action}" performed successfully on ${call.call_no}`, 'success');
  //     return response;
  //   } catch (error) {
  //     console.error('Failed to perform action:', error);
  //     showNotification(`Failed to perform action: ${error.message || 'Unknown error'}`, 'error');
  //     throw error;
  //   }
  // }, [performTransitionAction, currentUser]);

  /**
   * Fetch payment blocked records
   * Uses workflowTransitionsPaymentBlocked API
   */
  // const handleFetchPaymentBlockedRecords = useCallback(async () => {
  //   try {
  //     await fetchPaymentBlockedTransitions({
  //       vendorId: currentUser.id
  //     });
  //   } catch (error) {
  //     console.error('Failed to fetch payment blocked records:', error);
  //   }
  // }, [fetchPaymentBlockedTransitions, currentUser.id]);

  /**
   * Fetch pending transitions for the current user's role
   * Uses allPendingWorkflowtrasition API
   * Note: API returns all for role, then filters by createdBy == userId
   * COMMENTED OUT: Backend endpoint not yet implemented
   */
  // const handleFetchPendingTransitions = useCallback(async () => {
  //   try {
  //     await fetchPendingTransitions(currentUser.role, currentUser.id);
  //   } catch (error) {
  //     console.error('Failed to fetch pending transitions:', error);
  //   }
  // }, [fetchPendingTransitions, currentUser]);

  // // Fetch pending transitions when requested calls tab is active
  // useEffect(() => {
  //   if (activeTab === 'requested-calls') {
  //     handleFetchPendingTransitions();
  //   }
  // }, [activeTab, handleFetchPendingTransitions]);

  // Summary numbers for tab badges
  const totalPOs = poAssignedList.length;

  const pendingRequests = requestedCalls.length;
  const completedCallsCount = completedCalls.length;

  // Primary tabs with counts (displayed in a box)
  const primaryTabs = [
    {
      id: 'po-assigned',
      label: 'PO Assigned',
      description: 'POs assigned to vendor with status',
      count: totalPOs
    },
    {
      id: 'requested-calls',
      label: 'Requested Calls',
      description: 'Request Inspection Call Status',
      count: pendingRequests
    },
    {
      id: 'completed-calls',
      label: 'Completed Calls',
      description: 'Inspection Calls & IC Download',
      count: completedCallsCount
    }
  ];

  // Secondary tabs (displayed below)
  const secondaryTabs = [
    {
      id: 'inventory-entry',
      label: 'New Inventory Entry',
      description: 'Inventory Management System'
    },
    {
      id: 'calibration-approval',
      label: 'Calibration & Approval',
      description: 'Instruments, Approvals & Gauges management'
    },
    // {
    //   id: 'raise-call',
    //   label: 'Raising Inspection Call',
    //   description: 'Auto-fetched PO Data & call details'
    // },
    {
      id: 'payment-module',
      label: 'Payment Details',
      description: 'Payment Details Updating Module'
    },
    {
      id: 'master-updating',
      label: 'Master Updating',
      description: 'Place / Factory / Contractor / Manufacturer'
    },
    {
      id: 'feedback-system',
      label: 'Feedback System',
      description: 'View and rectify discrepancies'
    }
  ];


  // ============ MASTER ENTRIES HANDLERS ============
  const handleViewMasterEntry = useCallback((entry) => {
    setSelectedMasterEntry(entry);
    setIsViewMasterModalOpen(true);
  }, []);

  const handleEditMasterEntry = useCallback((entry) => {
    setSelectedMasterEntry(entry);
    setIsEditingMaster(true);
  }, []);

  const handleDeleteMasterEntry = useCallback((entry) => {
    setMasterToDelete(entry);
    setIsDeleteMasterConfirmOpen(true);
  }, []);

  const handleConfirmDeleteMaster = useCallback(() => {
    if (masterToDelete) {
      setMasterItems(prev => prev.filter(item => item.id !== masterToDelete.id));
      setIsDeleteMasterConfirmOpen(false);
      setMasterToDelete(null);
      showNotification(`Master entry for ${masterToDelete.company_name} - ${masterToDelete.unit_name} deleted successfully`, 'success');
    }
  }, [masterToDelete, showNotification]);

  const handleCancelDeleteMaster = useCallback(() => {
    setIsDeleteMasterConfirmOpen(false);
    setMasterToDelete(null);
  }, []);

  const handleCloseMasterModal = useCallback(() => {
    setIsViewMasterModalOpen(false);
    setSelectedMasterEntry(null);
  }, []);

  const handleMasterFormSubmit = useCallback((formData) => {
    if (isEditingMaster && selectedMasterEntry) {
      // Update existing entry
      const updatedItems = masterItems.map(item =>
        item.id === selectedMasterEntry.id ? { ...item, ...formData } : item
      );
      setMasterItems(updatedItems);
      setIsViewMasterModalOpen(false);
      showNotification(`Master entry updated successfully!`, 'success');
    } else {
      // Add new entry
      const newEntry = {
        id: Math.max(...masterItems.map(m => m.id), 0) + 1,
        ...formData
      };
      setMasterItems(prev => [...prev, newEntry]);
      showNotification(`Master entry added successfully!`, 'success');
    }
    setIsEditingMaster(false);
    setSelectedMasterEntry(null);
  }, [isEditingMaster, selectedMasterEntry, masterItems, showNotification]);

  const handleCancelEditMaster = useCallback(() => {
    setIsEditingMaster(false);
    setSelectedMasterEntry(null);
  }, []);

  const handleModifyCall = async (call) => {
    // Fetch full IC details to pre-fill the form
    showNotification(`Fetching details for Call: ${call.call_no}...`, 'info');
    try {
      let prefilledData = null;
      const matchingPO = findMatchingPO(call.po_no || call.poNo);
      const poDateVal = matchingPO ? matchingPO.po_date : '';

      if (call.stage === 'Raw Material') {
        const response = await inspectionCallService.getICDetailsByNumber(call.call_no);
        if (response && response.data) {
          const ic = response.data;
          const rmDetails = ic.rmInspectionDetails || {};
          const heatQuantities = ic.rmHeatQuantities || rmDetails.rmHeatQuantities || [];

          // Map backend IC DTO fields back to form fields
          prefilledData = {
            // Common fields
            po_no: ic.poNo || call.po_no || '',
            po_serial_no: ic.poSerialNo || call.poSerialNo || '',
            po_date: poDateVal,
            po_description: rmDetails.itemDescription || '',
            po_qty: rmDetails.itemQuantity || 0,
            po_unit: rmDetails.unitOfMeasurement || '',
            type_of_call: ic.typeOfCall || call.stage || 'Raw Material',
            type_of_erc: ic.ercType || '',
            desired_inspection_date: ic.desiredInspectionDate || '',
            company_id: ic.companyId ? String(ic.companyId) : '',
            company_name: ic.companyName || '',
            unit_id: ic.unitId ? String(ic.unitId) : '',
            unit_name: ic.unitName || '',
            unit_address: ic.unitAddress || '',
            remarks: ic.remarks || '',
            placeOfInspection: ic.placeOfInspection || '',
            // Heat TC mapping from rmInspectionDetails
            rm_heat_tc_mapping: (heatQuantities && heatQuantities.length > 0)
              ? heatQuantities.map((h, idx) => {
                const chem = h.chemicalAnalyses?.[0] || {};
                return {
                  id: Date.now() + idx,
                  heatNumber: h.heatNumber || '',
                  supplierName: h.manufacturer || '',
                  compositeKey: `${h.heatNumber}|${h.manufacturer}`,
                  tcNumber: h.tcNumber || '',
                  tcDate: h.tcDate || '',
                  manufacturer: h.manufacturer || '',
                  invoiceNo: rmDetails.invoiceNumber || '',
                  invoiceDate: rmDetails.invoiceDate || '',
                  subPoNumber: rmDetails.subPoNumber || '',
                  subPoDate: rmDetails.subPoDate || '',
                  subPoQty: rmDetails.subPoQty != null ? `${rmDetails.subPoQty}` : '',
                  subPoTotalValue: '',
                  tcQty: h.tcQuantity != null ? `${h.tcQuantity}` : '',
                  tcQtyRemaining: h.qtyLeft != null && h.qtyLeft !== 'null' ? `${h.qtyLeft}` : '',
                  offeredQty: h.offeredQty != null ? h.offeredQty : '',
                  maxQty: h.qtyLeft != null && h.qtyLeft !== 'null' ? parseFloat(h.qtyLeft) + (parseFloat(h.offeredQty) || 0) : '',
                  unit: rmDetails.unitOfMeasurement || '',
                  isLoading: false,
                  isLoadingChemical: false,
                  chemicalAutoFetched: !!h.chemicalAnalyses?.length,
                  chemicalReadOnly: false,
                  // Chemical analysis - per heat (mapped from chemicalAnalyses array)
                  chemical_carbon: chem.carbon || '',
                  chemical_manganese: chem.manganese || '',
                  chemical_silicon: chem.silicon || '',
                  chemical_sulphur: chem.sulphur || '',
                  chemical_phosphorus: chem.phosphorus || ''
                };
              })
              : [{
                id: Date.now(),
                heatNumber: rmDetails.heatNumbers || '',
                supplierName: rmDetails.manufacturer || '',
                compositeKey: `${rmDetails.heatNumbers}|${rmDetails.manufacturer}`,
                tcNumber: rmDetails.tcNumber || '',
                tcDate: rmDetails.tcDate || '',
                manufacturer: rmDetails.manufacturer || '',
                invoiceNo: rmDetails.invoiceNumber || '',
                invoiceDate: rmDetails.invoiceDate || '',
                subPoNumber: rmDetails.subPoNumber || '',
                subPoDate: rmDetails.subPoDate || '',
                subPoQty: rmDetails.subPoQty != null ? `${rmDetails.subPoQty}` : '',
                subPoTotalValue: '',
                tcQty: rmDetails.tcQuantity != null ? `${rmDetails.tcQuantity}` : '',
                tcQtyRemaining: '',
                offeredQty: rmDetails.totalOfferedQtyMt != null ? rmDetails.totalOfferedQtyMt : '',
                maxQty: '',
                unit: rmDetails.unitOfMeasurement || '',
                isLoading: false,
                isLoadingChemical: false,
                chemicalAutoFetched: false,
                chemicalReadOnly: false,
                chemical_carbon: '',
                chemical_manganese: '',
                chemical_silicon: '',
                chemical_sulphur: '',
                chemical_phosphorus: ''
              }],
            rm_total_offered_qty_mt: rmDetails.totalOfferedQtyMt || 0,
            rm_offered_qty_erc: rmDetails.offeredQtyErc || 0,
            // Process & Final defaults
            process_rm_ic_numbers: [],
            process_book_set_nos: [],
            process_lot_heat_mapping: [{
              id: Date.now(),
              lotNumber: '', heatNumber: '', manufacturer: '',
              manufacturerHeat: '', offeredQty: '', totalAcceptedQtyRm: '',
              declaredLotSize: '', tentativeStartDate: ''
            }],
            final_rm_ic_numbers: [],
            final_process_ic_numbers: [],
            final_lots_data: [],
            final_lot_numbers: [],
            final_manufacturer_heat: '',
            final_erc_qty: '',
            final_total_qty: '',
            final_hdpe_bags: '',
            final_total_erc_qty: '',
            qty_already_inspected_rm: 0,
            qty_already_inspected_process: 0,
            qty_already_inspected_final: 0,
            zone_name: call.rlyShortName || '',
            amendment_no: '',
            amendment_date: '',
            vendor_contact_name: '',
            vendor_contact_phone: ''
          };
        }
      } else if (call.stage === 'Process') {
        const response = await inspectionCallService.getProcessICDetailsByNumber(call.call_no);
        if (response && response.data) {
          const data = response.data;
          const ic = data.inspectionCall || {};
          const detailsList = data.processInspectionDetails || [];
          const mappings = data.processRmIcMappings || [];

          prefilledData = {
            // Common fields
            po_no: ic.poNo || call.po_no || '',
            po_serial_no: ic.poSerialNo || call.poSerialNo || '',
            po_date: poDateVal || data.poData?.poDate || '',
            po_description: '',
            po_qty: call.quantity_offered || 0,
            po_unit: '',
            type_of_call: ic.typeOfCall || call.stage || 'Process',
            type_of_erc: ic.ercType || '',
            desired_inspection_date: ic.desiredInspectionDate || '',
            company_id: ic.companyId ? String(ic.companyId) : '',
            company_name: ic.companyName || '',
            unit_id: ic.unitId ? String(ic.unitId) : '',
            unit_name: ic.unitName || '',
            unit_address: ic.unitAddress || '',
            remarks: ic.remarks || '',
            placeOfInspection: ic.placeOfInspection || '',

            // Process fields – derive RM IC numbers from mappings; fall back to
            // detail rows when the mapping table is empty (older records)
            process_rm_ic_numbers: (() => {
              const fromMappings = mappings.map(m => m.rmIcNumber).filter(Boolean);
              if (fromMappings.length > 0) return fromMappings;
              // Fallback: collect unique rmIcNumber values from detail rows
              const fromDetails = [...new Set(
                detailsList.map(d => d.rmIcNumber).filter(Boolean)
              )];
              return fromDetails;
            })(),
            process_lot_heat_mapping: detailsList.map((d, idx) => ({
              id: Date.now() + idx,
              lotNumber: d.lotNumber || '',
              heatNumber: d.heatNumber || '',
              manufacturer: d.manufacturer || '',
              manufacturerHeat: d.manufacturerHeat || `${d.manufacturer || ''} - ${d.heatNumber || ''}`,
              compositeKey: `${d.heatNumber}|${d.manufacturer}`,
              offeredQty: d.offeredQty || '',
              totalAcceptedQtyRm: d.totalAcceptedQtyRm || '',
              declaredLotSize: d.declaredLotSize || '',
              tentativeStartDate: d.tentativeStartDate || ''
            })),

            // Raw Material and Final fields defaults
            rm_heat_tc_mapping: [{
              id: Date.now(), heatNumber: '', supplierName: '', compositeKey: '',
              tcNumber: '', tcDate: '', manufacturer: '', invoiceNo: '', invoiceDate: '',
              subPoNumber: '', subPoDate: '', subPoQty: '', subPoTotalValue: '',
              tcQty: '', tcQtyRemaining: '', offeredQty: '', maxQty: '', unit: '',
              isLoading: false, isLoadingChemical: false, chemicalAutoFetched: false,
              chemicalReadOnly: false, chemical_carbon: '', chemical_manganese: '',
              chemical_silicon: '', chemical_sulphur: '', chemical_phosphorus: ''
            }],
            rm_total_offered_qty_mt: 0,
            rm_offered_qty_erc: 0,
            final_rm_ic_numbers: [],
            final_process_ic_numbers: [],
            final_lots_data: [],
            final_lot_numbers: [],
            final_manufacturer_heat: '',
            final_erc_qty: '',
            final_total_qty: '',
            final_hdpe_bags: '',
            final_total_erc_qty: '',
            qty_already_inspected_rm: 0,
            qty_already_inspected_process: 0,
            qty_already_inspected_final: 0,
            zone_name: call.rlyShortName || '',
            amendment_no: '',
            amendment_date: '',
            vendor_contact_name: '',
            vendor_contact_phone: ''
          };
        }
      } else if (call.stage === 'Final') {
        const response = await inspectionCallService.getFinalICDetailsByNumber(call.call_no);
        if (response && response.data) {
          const data = response.data;
          const ic = data.inspectionCall || {};
          const finalDetails = data.finalInspectionDetails || {};
          const lotDetails = data.finalLotDetails || [];

          const rmIcList = finalDetails.rmIcNumber ? finalDetails.rmIcNumber.split(',').filter(Boolean) : [];
          const processIcList = finalDetails.processIcNumber ? finalDetails.processIcNumber.split(',').filter(Boolean) : [];
          const lotNumbers = lotDetails.map(d => d.lotNumber).filter(Boolean);

          prefilledData = {
            // Common fields
            po_no: ic.poNo || call.po_no || '',
            po_serial_no: ic.poSerialNo || call.poSerialNo || '',
            po_date: poDateVal,
            po_description: '',
            po_qty: call.quantity_offered || 0,
            po_unit: '',
            type_of_call: ic.typeOfCall || call.stage || 'Final',
            type_of_erc: ic.ercType || '',
            desired_inspection_date: ic.desiredInspectionDate || '',
            company_id: ic.companyId ? String(ic.companyId) : '',
            company_name: ic.companyName || '',
            unit_id: ic.unitId ? String(ic.unitId) : '',
            unit_name: ic.unitName || '',
            unit_address: ic.unitAddress || '',
            remarks: ic.remarks || '',
            placeOfInspection: ic.placeOfInspection || '',

            // Final fields
            final_rm_ic_numbers: rmIcList,
            final_process_ic_numbers: processIcList,
            final_lot_numbers: lotNumbers,
            final_manufacturer_heat: lotDetails[0]?.manufacturerHeat || '',
            final_erc_qty: finalDetails.totalOfferedQty || '',
            final_total_qty: String(finalDetails.totalOfferedQty || ''),
            final_hdpe_bags: lotDetails.reduce((sum, d) => sum + (d.noOfBags || 0), 0) || '',
            final_lots_data: lotDetails.map(d => ({
              lotNumber: d.lotNumber || '',
              heatNo: d.heatNumber || '',
              acceptedQtyProcess: 0,
              offeredEarlier: 0,
              futureBalance: 0,
              offeredQty: d.offeredQty || '',
              noOfBags: d.noOfBags || ''
            })),

            // Raw Material and Process fields defaults
            rm_heat_tc_mapping: [{
              id: Date.now(), heatNumber: '', supplierName: '', compositeKey: '',
              tcNumber: '', tcDate: '', manufacturer: '', invoiceNo: '', invoiceDate: '',
              subPoNumber: '', subPoDate: '', subPoQty: '', subPoTotalValue: '',
              tcQty: '', tcQtyRemaining: '', offeredQty: '', maxQty: '', unit: '',
              isLoading: false, isLoadingChemical: false, chemicalAutoFetched: false,
              chemicalReadOnly: false, chemical_carbon: '', chemical_manganese: '',
              chemical_silicon: '', chemical_sulphur: '', chemical_phosphorus: ''
            }],
            rm_total_offered_qty_mt: 0,
            rm_offered_qty_erc: 0,
            process_rm_ic_numbers: [],
            process_lot_heat_mapping: [{
              id: Date.now(),
              lotNumber: '', heatNumber: '', manufacturer: '',
              manufacturerHeat: '', offeredQty: '', totalAcceptedQtyRm: '',
              declaredLotSize: '', tentativeStartDate: ''
            }],
            qty_already_inspected_rm: 0,
            qty_already_inspected_process: 0,
            qty_already_inspected_final: 0,
            zone_name: call.rlyShortName || '',
            amendment_no: '',
            amendment_date: '',
            vendor_contact_name: '',
            vendor_contact_phone: ''
          };
        }
      }

      // Build a minimal PO & item context for the form
      const poContext = {
        po_no: call.po_no || '',
        zone_name: call.rlyShortName || 'N/A',
        po_date: poDateVal,
        description: matchingPO?.description || '',
        quantity: call.quantity_offered || 0,
        unit: matchingPO?.unit || ''
      };
      const itemContext = {
        po_serial_no: call.poSerialNo || '',
        item_qty: call.quantity_offered || 0,
        item_unit: '',
        qty_already_inspected_rm: 0,
        qty_already_inspected_process: 0,
        qty_already_inspected_final: 0,
        ...prefilledData
      };

      setModifyingCall(call);
      setIsModifyMode(true);
      setSelectedPOItem({ po: poContext, item: itemContext, subPO: null });
      setIsInspectionModalOpen(true);
    } catch (error) {
      console.error('Error fetching IC details for modify:', error);
      showNotification(`Failed to load call details: ${error.message}`, 'error');
    }
  };

  const handleViewCallDetails = async (call) => {
    // Fetch full IC details to view the form
    showNotification(`Fetching details for Call: ${call.call_no}...`, 'info');
    try {
      let prefilledData = null;
      const matchingPO = findMatchingPO(call.po_no || call.poNo);
      const poDateVal = matchingPO ? matchingPO.po_date : '';

      if (call.stage === 'Raw Material') {
        const response = await inspectionCallService.getICDetailsByNumber(call.call_no);
        if (response && response.data) {
          const ic = response.data;
          const rmDetails = ic.rmInspectionDetails || {};
          const heatQuantities = ic.rmHeatQuantities || rmDetails.rmHeatQuantities || [];

          // Map backend IC DTO fields back to form fields
          prefilledData = {
            po_no: ic.poNo || call.po_no || '',
            po_serial_no: ic.poSerialNo || call.poSerialNo || '',
            po_date: poDateVal,
            po_description: rmDetails.itemDescription || '',
            po_qty: rmDetails.itemQuantity || 0,
            po_unit: rmDetails.unitOfMeasurement || '',
            type_of_call: ic.typeOfCall || call.stage || 'Raw Material',
            type_of_erc: ic.ercType || '',
            desired_inspection_date: ic.desiredInspectionDate || '',
            company_id: ic.companyId ? String(ic.companyId) : '',
            company_name: ic.companyName || '',
            unit_id: ic.unitId ? String(ic.unitId) : '',
            unit_name: ic.unitName || '',
            unit_address: ic.unitAddress || '',
            remarks: ic.remarks || '',
            placeOfInspection: ic.placeOfInspection || '',
            rm_heat_tc_mapping: (heatQuantities && heatQuantities.length > 0)
              ? heatQuantities.map((h, idx) => {
                const chem = h.chemicalAnalyses?.[0] || {};
                return {
                  id: Date.now() + idx,
                  heatNumber: h.heatNumber || '',
                  supplierName: h.manufacturer || '',
                  compositeKey: `${h.heatNumber}|${h.manufacturer}`,
                  tcNumber: h.tcNumber || '',
                  tcDate: h.tcDate || '',
                  manufacturer: h.manufacturer || '',
                  invoiceNo: rmDetails.invoiceNumber || '',
                  invoiceDate: rmDetails.invoiceDate || '',
                  subPoNumber: rmDetails.subPoNumber || '',
                  subPoDate: rmDetails.subPoDate || '',
                  subPoQty: rmDetails.subPoQty ? `${rmDetails.subPoQty}` : '',
                  subPoTotalValue: '',
                  tcQty: h.tcQuantity ? `${h.tcQuantity}` : '',
                  tcQtyRemaining: h.qtyLeft && h.qtyLeft !== 'null' ? `${h.qtyLeft}` : '',
                  offeredQty: h.offeredQty || '',
                  maxQty: h.qtyLeft && h.qtyLeft !== 'null' ? h.qtyLeft : '',
                  unit: rmDetails.unitOfMeasurement || '',
                  isLoading: false,
                  isLoadingChemical: false,
                  chemicalAutoFetched: !!h.chemicalAnalyses?.length,
                  chemicalReadOnly: false,
                  chemical_carbon: chem.carbon || '',
                  chemical_manganese: chem.manganese || '',
                  chemical_silicon: chem.silicon || '',
                  chemical_sulphur: chem.sulphur || '',
                  chemical_phosphorus: chem.phosphorus || ''
                };
              })
              : [{
                id: Date.now(),
                heatNumber: rmDetails.heatNumbers || '',
                supplierName: rmDetails.manufacturer || '',
                compositeKey: `${rmDetails.heatNumbers}|${rmDetails.manufacturer}`,
                tcNumber: rmDetails.tcNumber || '',
                tcDate: rmDetails.tcDate || '',
                manufacturer: rmDetails.manufacturer || '',
                invoiceNo: rmDetails.invoiceNumber || '',
                invoiceDate: rmDetails.invoiceDate || '',
                subPoNumber: rmDetails.subPoNumber || '',
                subPoDate: rmDetails.subPoDate || '',
                subPoQty: rmDetails.subPoQty ? `${rmDetails.subPoQty}` : '',
                subPoTotalValue: '',
                tcQty: rmDetails.tcQuantity ? `${rmDetails.tcQuantity}` : '',
                tcQtyRemaining: '',
                offeredQty: rmDetails.totalOfferedQtyMt || '',
                maxQty: '',
                unit: rmDetails.unitOfMeasurement || '',
                isLoading: false,
                isLoadingChemical: false,
                chemicalAutoFetched: false,
                chemicalReadOnly: false,
                chemical_carbon: '',
                chemical_manganese: '',
                chemical_silicon: '',
                chemical_sulphur: '',
                chemical_phosphorus: ''
              }],
            rm_total_offered_qty_mt: rmDetails.totalOfferedQtyMt || 0,
            rm_offered_qty_erc: rmDetails.offeredQtyErc || 0,
            process_rm_ic_numbers: [],
            process_book_set_nos: [],
            process_lot_heat_mapping: [{
              id: Date.now(),
              lotNumber: '', heatNumber: '', manufacturer: '',
              manufacturerHeat: '', offeredQty: '', totalAcceptedQtyRm: '',
              declaredLotSize: '', tentativeStartDate: ''
            }],
            final_rm_ic_numbers: [],
            final_process_ic_numbers: [],
            final_lots_data: [],
            final_lot_numbers: [],
            final_manufacturer_heat: '',
            final_erc_qty: '',
            final_total_qty: '',
            final_hdpe_bags: '',
            final_total_erc_qty: '',
            qty_already_inspected_rm: 0,
            qty_already_inspected_process: 0,
            qty_already_inspected_final: 0,
            zone_name: call.rlyShortName || '',
            amendment_no: '',
            amendment_date: '',
            vendor_contact_name: '',
            vendor_contact_phone: ''
          };
        }
      } else if (call.stage === 'Process') {
        const response = await inspectionCallService.getProcessICDetailsByNumber(call.call_no);
        if (response && response.data) {
          const data = response.data;
          const ic = data.inspectionCall || {};
          const detailsList = data.processInspectionDetails || [];
          const mappings = data.processRmIcMappings || [];

          prefilledData = {
            po_no: ic.poNo || call.po_no || '',
            po_serial_no: ic.poSerialNo || call.poSerialNo || '',
            po_date: poDateVal || data.poData?.poDate || '',
            po_description: '',
            po_qty: call.quantity_offered || 0,
            po_unit: '',
            type_of_call: ic.typeOfCall || call.stage || 'Process',
            type_of_erc: ic.ercType || '',
            desired_inspection_date: ic.desiredInspectionDate || '',
            company_id: ic.companyId ? String(ic.companyId) : '',
            company_name: ic.companyName || '',
            unit_id: ic.unitId ? String(ic.unitId) : '',
            unit_name: ic.unitName || '',
            unit_address: ic.unitAddress || '',
            remarks: ic.remarks || '',
            placeOfInspection: ic.placeOfInspection || '',
            process_rm_ic_numbers: (() => {
              const fromMappings = mappings.map(m => m.rmIcNumber).filter(Boolean);
              if (fromMappings.length > 0) return fromMappings;
              const fromDetails = [...new Set(
                detailsList.map(d => d.rmIcNumber).filter(Boolean)
              )];
              return fromDetails;
            })(),
            process_lot_heat_mapping: detailsList.map((d, idx) => ({
              id: Date.now() + idx,
              lotNumber: d.lotNumber || '',
              heatNumber: d.heatNumber || '',
              manufacturer: d.manufacturer || '',
              manufacturerHeat: d.manufacturerHeat || `${d.manufacturer || ''} - ${d.heatNumber || ''}`,
              compositeKey: `${d.heatNumber}|${d.manufacturer}`,
              offeredQty: d.offeredQty || '',
              totalAcceptedQtyRm: d.totalAcceptedQtyRm || '',
              declaredLotSize: d.declaredLotSize || '',
              tentativeStartDate: d.tentativeStartDate || ''
            })),
            rm_heat_tc_mapping: [{
              id: Date.now(), heatNumber: '', supplierName: '', compositeKey: '',
              tcNumber: '', tcDate: '', manufacturer: '', invoiceNo: '', invoiceDate: '',
              subPoNumber: '', subPoDate: '', subPoQty: '', subPoTotalValue: '',
              tcQty: '', tcQtyRemaining: '', offeredQty: '', maxQty: '', unit: '',
              isLoading: false, isLoadingChemical: false, chemicalAutoFetched: false,
              chemicalReadOnly: false, chemical_carbon: '', chemical_manganese: '',
              chemical_silicon: '', chemical_sulphur: '', chemical_phosphorus: ''
            }],
            rm_total_offered_qty_mt: 0,
            rm_offered_qty_erc: 0,
            final_rm_ic_numbers: [],
            final_process_ic_numbers: [],
            final_lots_data: [],
            final_lot_numbers: [],
            final_manufacturer_heat: '',
            final_erc_qty: '',
            final_total_qty: '',
            final_hdpe_bags: '',
            final_total_erc_qty: '',
            qty_already_inspected_rm: 0,
            qty_already_inspected_process: 0,
            qty_already_inspected_final: 0,
            zone_name: call.rlyShortName || '',
            amendment_no: '',
            amendment_date: '',
            vendor_contact_name: '',
            vendor_contact_phone: ''
          };
        }
      } else if (call.stage === 'Final') {
        const response = await inspectionCallService.getFinalICDetailsByNumber(call.call_no);
        if (response && response.data) {
          const data = response.data;
          const ic = data.inspectionCall || {};
          const finalDetails = data.finalInspectionDetails || {};
          const lotDetails = data.finalLotDetails || [];

          const rmIcList = finalDetails.rmIcNumber ? finalDetails.rmIcNumber.split(',').filter(Boolean) : [];
          const processIcList = finalDetails.processIcNumber ? finalDetails.processIcNumber.split(',').filter(Boolean) : [];
          const lotNumbers = lotDetails.map(d => d.lotNumber).filter(Boolean);

          prefilledData = {
            po_no: ic.poNo || call.po_no || '',
            po_serial_no: ic.poSerialNo || call.poSerialNo || '',
            po_date: poDateVal,
            po_description: '',
            po_qty: call.quantity_offered || 0,
            po_unit: '',
            type_of_call: ic.typeOfCall || call.stage || 'Final',
            type_of_erc: ic.ercType || '',
            desired_inspection_date: ic.desiredInspectionDate || '',
            company_id: ic.companyId ? String(ic.companyId) : '',
            company_name: ic.companyName || '',
            unit_id: ic.unitId ? String(ic.unitId) : '',
            unit_name: ic.unitName || '',
            unit_address: ic.unitAddress || '',
            remarks: ic.remarks || '',
            placeOfInspection: ic.placeOfInspection || '',
            final_rm_ic_numbers: rmIcList,
            final_process_ic_numbers: processIcList,
            final_lot_numbers: lotNumbers,
            final_manufacturer_heat: lotDetails[0]?.manufacturerHeat || '',
            final_erc_qty: finalDetails.totalOfferedQty || '',
            final_total_qty: String(finalDetails.totalOfferedQty || ''),
            final_hdpe_bags: lotDetails.reduce((sum, d) => sum + (d.noOfBags || 0), 0) || '',
            final_lots_data: lotDetails.map(d => ({
              lotNumber: d.lotNumber || '',
              heatNo: d.heatNumber || '',
              acceptedQtyProcess: 0,
              offeredEarlier: 0,
              futureBalance: 0,
              offeredQty: d.offeredQty || '',
              noOfBags: d.noOfBags || ''
            })),
            rm_heat_tc_mapping: [{
              id: Date.now(), heatNumber: '', supplierName: '', compositeKey: '',
              tcNumber: '', tcDate: '', manufacturer: '', invoiceNo: '', invoiceDate: '',
              subPoNumber: '', subPoDate: '', subPoQty: '', subPoTotalValue: '',
              tcQty: '', tcQtyRemaining: '', offeredQty: '', maxQty: '', unit: '',
              isLoading: false, isLoadingChemical: false, chemicalAutoFetched: false,
              chemicalReadOnly: false, chemical_carbon: '', chemical_manganese: '',
              chemical_silicon: '', chemical_sulphur: '', chemical_phosphorus: ''
            }],
            rm_total_offered_qty_mt: 0,
            rm_offered_qty_erc: 0,
            process_rm_ic_numbers: [],
            process_lot_heat_mapping: [{
              id: Date.now(),
              lotNumber: '', heatNumber: '', manufacturer: '',
              manufacturerHeat: '', offeredQty: '', totalAcceptedQtyRm: '',
              declaredLotSize: '', tentativeStartDate: ''
            }],
            qty_already_inspected_rm: 0,
            qty_already_inspected_process: 0,
            qty_already_inspected_final: 0,
            zone_name: call.rlyShortName || '',
            amendment_no: '',
            amendment_date: '',
            vendor_contact_name: '',
            vendor_contact_phone: ''
          };
        }
      }

      // Build a minimal PO & item context for the form
      const poContext = {
        po_no: call.po_no || '',
        zone_name: call.rlyShortName || 'N/A',
        po_date: poDateVal,
        description: matchingPO?.description || '',
        quantity: call.quantity_offered || 0,
        unit: matchingPO?.unit || ''
      };
      const itemContext = {
        po_serial_no: call.poSerialNo || '',
        item_qty: call.quantity_offered || 0,
        item_unit: '',
        qty_already_inspected_rm: 0,
        qty_already_inspected_process: 0,
        qty_already_inspected_final: 0,
        ...prefilledData
      };

      setModifyingCall(call);
      setIsModifyMode(false);
      setIsViewOnlyMode(true);
      setSelectedPOItem({ po: poContext, item: itemContext, subPO: null });
      setIsInspectionModalOpen(true);
    } catch (error) {
      console.error('Error fetching IC details for view:', error);
      showNotification(`Failed to load call details: ${error.message}`, 'error');
    }
  };

  const handleWithdrawCall = (call) => {
    setSelectedCallForWithdraw(call);
    setWithdrawRemarks('');
    setIsWithdrawModalOpen(true);
  };

  const handleCloseWithdrawModal = () => {
    setIsWithdrawModalOpen(false);
    setSelectedCallForWithdraw(null);
    setWithdrawRemarks('');
    setWithdrawing(false);
  };

  const handleWithdrawSubmit = async () => {
    if (!withdrawRemarks.trim()) {
      showNotification('Withdrawal remarks are mandatory.', 'error');
      return;
    }

    setWithdrawing(true);
    try {
      if (!selectedCallForWithdraw.workflowTransitionId) {
        console.error('Missing workflowTransitionId for call:', selectedCallForWithdraw);
        showNotification('Internal Error: Could not find the workflow transition ID for this call.', 'error');
        setWithdrawing(false);
        return;
      }

      await inspectionCallService.withdrawCall({
        workflowTransitionId: selectedCallForWithdraw.workflowTransitionId,
        requestId: selectedCallForWithdraw.call_no,
        remarks: withdrawRemarks,
        actionBy: user.userId
      });

      showNotification(`Inspection Call ${selectedCallForWithdraw.call_no} has been withdrawn successfully.`, 'success');
      handleCloseWithdrawModal();

      // Delay reload to allow notification to be seen
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error withdrawing call:', error);
      showNotification(`An error occurred while withdrawing the call: ${error.message}`, 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  // Column definitions for DataTable

  const poColumns = [
    {
      key: 'po_no',
      label: 'PO No.',
      width: '150px',
      render: (value, po) => {
        if (po.pdfPath) {
          return (
            <button
              onClick={() => setViewingPdfUrl(po.pdfPath)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit',
                textAlign: 'left',
                fontWeight: '600'
              }}
            >
              {value}
            </button>
          );
        }
        return value;
      }
    },
    {
      key: 'po_date',
      label: 'PO Date',
      width: '120px',
      render: (value) => formatDate(value)
    },
    { key: 'zone_name', label: 'Zone Name', width: '120px' },
    // { key: 'description', label: 'Vendor Name', width: '220px' },
    { key: 'quantity', label: 'Qty', width: '100px' },
    { key: 'unit', label: 'Unit', width: '80px' },
    // { key: 'location', label: 'Location' },
    {
      key: 'status',
      label: 'Status',
      width: '130px',
      render: (value) => <StatusBadge status={value} />
    }
  ];

  const requestedColumns = [
    { key: 'call_no', label: 'Call No.', width: '110px' },
    {
      key: 'poCombined',
      label: 'PO No.',
      width: '190px',
      render: (_, row) => `${row.rlyShortName || ''} / ${row.po_no || ''} / ${cleanSerialNo(row.poSerialNo)}`
    },
    {
      key: 'inspectionDetail',
      label: 'Detail of Inspection Call',
      width: '210px',
      render: (_, row) => {
        let details = `${row.ercType || ''} (${row.stage})`;
        if (row.stage === 'Raw Material' && row.noOfHeatsRM) details += ` - ${row.noOfHeatsRM} Heats`;
        if (row.stage === 'Process' && row.lotNoProcess) details += ` - Lot: ${row.lotNoProcess}`;
        if (row.stage === 'Final' && row.lotNoFinal) details += ` - Lot: ${row.lotNoFinal}`;
        return details;
      }
    },
    {
      key: 'quantity_offered',
      label: 'Qty Offered',
      width: '120px',
      render: (val, row) => `${val} ${row.uom || ''}`
    },
    {
      key: 'status',
      label: 'Status',
      width: '160px',
      render: (val, row) => {
        const { mainStatus, combinedText } = getDetailedStatus(val);
        return (
          <div>
            <StatusBadge status={mainStatus} text={combinedText} />
            {val === 'SCHEDULED' && row.scheduledDate && (
              <div style={{ fontSize: '11px', marginTop: '4px', color: '#666' }}>
                Scheduled: {formatDate(row.scheduledDate)}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Action',
      width: '130px',
      render: (_, row) => (
        <button
          className="master-action-btn master-action-view"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCallForActions(row);
            setIsActionsModalOpen(true);
          }}
          title="View Actions"
          style={{
            width: 'auto',
            minWidth: '105px',
            padding: '6px 12px',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: '500',
            borderRadius: '6px'
          }}
        >
          View Actions
        </button>
      )
    }
  ];

  const completedColumns = [
    { key: 'call_no', label: 'Call No.', width: '110px' },
    { 
      key: 'poCombined', 
      label: 'PO No.', 
      width: '200px',
      render: (_, row) => `${row.rlyShortName || ''} / ${row.po_no || ''} / ${cleanSerialNo(row.poSerialNo)}`
    },
    {
      key: 'completion_date',
      label: 'Completion Date',
      width: '140px',
      render: (value) => formatDate(value)
    },
    { key: 'quantity_offered', label: 'Qty Offered', width: '120px' },
    { key: 'quantity_accepted', label: 'Qty Accepted', width: '120px' },
    {
      key: 'status',
      label: 'Status',
      width: '160px',
      render: (value) => {
        const { mainStatus, combinedText } = getDetailedStatus(value);
        return <StatusBadge status={mainStatus} text={combinedText} />;
      }
    },
    {
      key: 'actions',
      label: 'Action',
      width: '130px',
      render: (_, row) => (
        <button
          className="master-action-btn master-action-view"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCompletedCallForActions(row);
            setIsCompletedActionsModalOpen(true);
          }}
          title="View Actions"
          style={{
            width: 'auto',
            minWidth: '105px',
            padding: '6px 12px',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: '500',
            borderRadius: '6px'
          }}
        >
          View Actions
        </button>
      )
    }
  ];

  // Sort and filter PO Assigned list
  const sortedPOAssigned = useMemo(() => {
    let result = [...poAssignedList];

    // Apply search filter
    if (poAssignedSearchTerm) {
      const searchLower = poAssignedSearchTerm.toLowerCase();
      result = result.filter(po =>
        Object.values(po).some(val =>
          String(val).toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply sorting
    if (poAssignedSortColumn) {
      result.sort((a, b) => {
        const aVal = a[poAssignedSortColumn];
        const bVal = b[poAssignedSortColumn];

        if (aVal < bVal) return poAssignedSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return poAssignedSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [poAssignedList, poAssignedSortColumn, poAssignedSortDirection, poAssignedSearchTerm]);

  // Paginate the sorted PO Assigned list
  const paginatedPOAssigned = useMemo(() => {
    const startIndex = (poAssignedCurrentPage - 1) * poAssignedPageSize;
    return sortedPOAssigned.slice(startIndex, startIndex + poAssignedPageSize);
  }, [sortedPOAssigned, poAssignedCurrentPage, poAssignedPageSize]);

  // Filter, sort, and paginate requested calls
  const filteredAndSortedRequestedCalls = useMemo(() => {
    let result = [...requestedCalls];

    // Apply search filter
    if (requestedCallsSearchTerm) {
      const searchLower = requestedCallsSearchTerm.toLowerCase().replace(/[\s-]/g, '');
      result = result.filter(call => {
        return (
          (call.call_no && call.call_no.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.po_no && call.po_no.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.item_name && call.item_name.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.stage && call.stage.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.ercType && call.ercType.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.quantity_offered && String(call.quantity_offered).toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.location && call.location.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.status && call.status.toLowerCase().replace(/_/g, ' ').replace(/[\s-]/g, '').includes(searchLower))
        );
      });
    }

    // Apply sorting
    if (requestedCallsSortColumn) {
      result.sort((a, b) => {
        const aVal = a[requestedCallsSortColumn];
        const bVal = b[requestedCallsSortColumn];

        if (aVal < bVal) return requestedCallsSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return requestedCallsSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [requestedCalls, requestedCallsSearchTerm, requestedCallsSortColumn, requestedCallsSortDirection]);

  // Paginate the filtered and sorted calls
  const paginatedRequestedCalls = useMemo(() => {
    const startIndex = (requestedCallsCurrentPage - 1) * requestedCallsPageSize;
    return filteredAndSortedRequestedCalls.slice(startIndex, startIndex + requestedCallsPageSize);
  }, [filteredAndSortedRequestedCalls, requestedCallsCurrentPage, requestedCallsPageSize]);

  // Filter, sort, and paginate completed calls
  const filteredAndSortedCompletedCalls = useMemo(() => {
    let result = [...completedCalls];

    // Apply search filter
    if (completedCallsSearchTerm) {
      const searchLower = completedCallsSearchTerm.toLowerCase().replace(/[\s-]/g, '');
      result = result.filter(call => {
        return (
          (call.call_no && call.call_no.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.po_no && call.po_no.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.item_name && call.item_name.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.stage && call.stage.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.ercType && call.ercType.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.quantity_offered && String(call.quantity_offered).toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.status && call.status.toLowerCase().replace(/_/g, ' ').replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.ic_number && call.ic_number.toLowerCase().replace(/[\s-]/g, '').includes(searchLower)) ||
          (call.completion_date && call.completion_date.toLowerCase().replace(/[\s-]/g, '').includes(searchLower))
        );
      });
    }

    // Apply sorting
    if (completedCallsSortColumn) {
      result.sort((a, b) => {
        const aVal = a[completedCallsSortColumn];
        const bVal = b[completedCallsSortColumn];

        if (aVal < bVal) return completedCallsSortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return completedCallsSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [completedCalls, completedCallsSearchTerm, completedCallsSortColumn, completedCallsSortDirection]);

  const completedCallsTotalPages = Math.ceil(filteredAndSortedCompletedCalls.length / completedCallsPageSize);

  // Paginate the filtered and sorted completed calls
  const paginatedCompletedCalls = useMemo(() => {
    const startIndex = (completedCallsCurrentPage - 1) * completedCallsPageSize;
    return filteredAndSortedCompletedCalls.slice(startIndex, startIndex + completedCallsPageSize);
  }, [filteredAndSortedCompletedCalls, completedCallsCurrentPage, completedCallsPageSize]);

  // Handle sorting for PO Assigned
  const handlePOAssignedSort = (columnKey) => {
    if (poAssignedSortColumn === columnKey) {
      setPoAssignedSortDirection(poAssignedSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setPoAssignedSortColumn(columnKey);
      setPoAssignedSortDirection('asc');
    }
    // Reset to first page when sorting
    setPoAssignedCurrentPage(1);
  };

  const requestedCallsTotalPages = Math.ceil(filteredAndSortedRequestedCalls.length / requestedCallsPageSize);

  // Handle sorting for requested calls
  const handleRequestedCallsSort = (columnKey) => {
    if (requestedCallsSortColumn === columnKey) {
      setRequestedCallsSortDirection(requestedCallsSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setRequestedCallsSortColumn(columnKey);
      setRequestedCallsSortDirection('asc');
    }
    // Reset to first page when sorting
    setRequestedCallsCurrentPage(1);
  };

  // Handle sorting for PO Items table (nested table)
  const handlePOItemsSort = (poId, columnKey) => {
    const currentSortColumn = poItemsSortColumn[poId];
    const currentSortDirection = poItemsSortDirection[poId] || 'asc';

    if (currentSortColumn === columnKey) {
      setPoItemsSortDirection({
        ...poItemsSortDirection,
        [poId]: currentSortDirection === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setPoItemsSortColumn({
        ...poItemsSortColumn,
        [poId]: columnKey
      });
      setPoItemsSortDirection({
        ...poItemsSortDirection,
        [poId]: 'asc'
      });
    }
  };

  // Sort PO items for a specific PO
  const getSortedPOItems = (poId, items) => {
    if (!items || items.length === 0) return items;

    const sortColumn = poItemsSortColumn[poId] || 'po_serial_no';
    const sortDirection = poItemsSortDirection[poId] || 'asc';

    if (!sortColumn) return items;

    const sortedItems = [...items].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedItems;
  };

  // Unified column definitions for single merged card
  const unifiedCalibrationColumns = [
    { key: 'category', label: 'Category' },
    { key: 'instrument_name', label: 'Name of Document / Instrument / Gauge' },
    { key: 'capacity_range', label: 'Capacity / Product' },
    { key: 'serial_number', label: 'Serial / Doc No.' },
    { key: 'calibration_certificate_no', label: 'Certificate No.' },
    {
      key: 'calibration_date',
      label: 'Calibration / Issue Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'calibration_due_date',
      label: 'Due / Expiry Date',
      render: (value, row) => {
        const daysLeft = getDaysUntilExpiry(value);
        const status = getCalibrationStatus(value, row.notification_days || 30);
        return (
          <span className={`due-date-cell ${status.toLowerCase().replace(' ', '-')}`}>
            {formatDate(value)}
            {status === 'Expired' && <span className="expiry-badge expired">Expired</span>}
            {status === 'Expiring Soon' && <span className="expiry-badge expiring">{daysLeft}d left</span>}
          </span>
        );
      }
    },
    { key: 'certifying_lab_name', label: 'Certifying Lab / Authority' },
    { key: 'accreditation_agency', label: 'Agency' },
    {
      key: 'calibration_status',
      label: 'Status',
      render: (_, row) => {
        const computedStatus = getCalibrationStatus(row.calibration_due_date, row.notification_days || 30);
        return <StatusBadge status={computedStatus} />;
      }
    },
    {
      key: 'actions',
      label: 'Action',
      width: '180px',
      render: (_, row) => (
        <div className="master-actions-container" style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'nowrap' }}>
          <button
            className="master-action-btn master-action-edit"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenInstrumentModal(row);
            }}
            title="Edit calibration entry"
          >
            Edit
          </button>
          <button
            className="master-action-btn master-action-delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCalibrationGroup(row.headerId);
            }}
            title="Delete calibration entry"
          >
            Delete
          </button>
        </div>
      )
    }
  ];



  // Payment columns as per requirement
  const paymentColumns = [
    { key: 'call_no', label: 'Call No.' },
    { key: 'call_date', label: 'Call Date', render: (v) => v ? formatDate(v) : '-' },
    { key: 'po_no', label: 'PO No.' },
    { key: 'po_item_no', label: 'Item No.' },
    { key: 'payment_reason', label: 'Reason' },
    { key: 'offered_qty', label: 'Offered Qty' },
    { key: 'total_payable_amount', label: 'Charges (₹)', render: (v) => v?.toLocaleString('en-IN') || '-' },
    { key: 'payment_status', label: 'Status', render: (v) => <StatusBadge status={v} /> }
  ];

  const masterColumns = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'unit_name', label: 'Unit Name' },
    { key: 'pincode', label: 'Pin Code' },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Address' },
    { key: 'role', label: 'Role' },
    {
      key: 'is_active',
      label: 'Active?',
      render: (value) => (value ? 'Yes' : 'No')
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <div className="master-actions-container">
          <button
            className="master-action-btn master-action-view"
            onClick={() => handleViewMasterEntry(row)}
            title="View entry details"
          >
            View
          </button>
          <button
            className="master-action-btn master-action-edit"
            onClick={() => handleEditMasterEntry(row)}
            title="Edit this entry"
          >
            Edit
          </button>
          <button
            className="master-action-btn master-action-delete"
            onClick={() => handleDeleteMasterEntry(row)}
            title="Delete this entry"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  // Inventory Entries Columns - List of Entries from Inventory Management System
  const inventoryColumns = [
    { key: 'rawMaterial', label: 'Raw Material' },
    { key: 'supplierName', label: 'Supplier' },
    { key: 'gradeSpecification', label: 'Grade/Spec' },
    { key: 'heatNumber', label: 'Heat/Batch/Lot No.' },
    {
      key: 'tcDetails',
      label: 'TC Details',
      render: (value, row) => {
        const tcNumber = row.tcNumber || '';
        const tcDate = row.tcDate ? formatDate(row.tcDate) : '';

        if (tcNumber && tcDate) {
          return `${tcNumber} (${tcDate})`;
        } else if (tcNumber) {
          return tcNumber;
        } else if (tcDate) {
          return tcDate;
        }
        return '-';
      }
    },
    {
      key: 'invoiceDetails',
      label: 'Invoice Details',
      render: (value, row) => {
        const invoiceNumber = row.invoiceNumber || '';
        const invoiceDate = row.invoiceDate ? formatDate(row.invoiceDate) : '';

        if (invoiceNumber && invoiceDate) {
          return `${invoiceNumber} (${invoiceDate})`;
        } else if (invoiceNumber) {
          return invoiceNumber;
        } else if (invoiceDate) {
          return invoiceDate;
        }
        return '-';
      }
    },
    { key: 'subPoNumber', label: 'Sub PO No.' },
    {
      key: 'tcQuantity',
      label: 'TC Qty',
      render: (value, row) => `${value} ${row.unitOfMeasurement}`
    },
    {
      key: 'offeredQuantity',
      label: 'Qty Offered',
      render: (value, row) => (
        <span style={{ color: '#059669', fontWeight: 500 }}>
          {value} {row.unitOfMeasurement}
        </span>
      )
    },
    {
      key: 'qtyLeftForInspection',
      label: 'Qty Left',
      render: (value, row) => (
        <span style={{ color: value > 0 ? '#dc2626' : '#6b7280', fontWeight: 500 }}>
          {value} {row.unitOfMeasurement}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
          <button
            className="btn btn-sm btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              handleViewInventoryEntry(row);
            }}
            title="View Details"
            style={{
              width: '90px',
              height: '32px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '13px'
            }}
          >
            <VisibilityIcon sx={{ fontSize: '16px' }} />
            View
          </button>


          {(row.status === 'Fresh' || row.status === 'FRESH_PO') && (
            <button
              className="btn btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditInventoryEntry(row);
              }}
              title="Edit Entry"
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                width: '90px',
                height: '32px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                border: 'none',
                fontSize: '13px'
              }}
            >
              <EditIcon sx={{ fontSize: '16px' }} />
              Edit
            </button>
          )}
        </div>
      )
    }
  ];

  const handleRowClick = (row) => {
    console.log('Row clicked:', row);
  };

  if (selectedCallForAnnexure) {
    return <AnnexurePage selectedCall={selectedCallForAnnexure} onBack={() => setSelectedCallForAnnexure(null)} />;
  }

  return (
    <div className="page-container vendor-page">
      {pdfGenerating && (
        <AnnexureLoader 
          title={pdfGeneratingText.title} 
          subtitle={pdfGeneratingText.subtitle} 
        />
      )}

      {/* Background Annexures PDF Generator for merge-download */}
      {autoGenerateAnnexuresCall && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1600px', zIndex: -100 }}>
          <AnnexurePage
            selectedCall={autoGenerateAnnexuresCall}
            hiddenMode={true}
            triggerAutoDownloadAll={true}
            onAllGenerated={async (pdfBlob) => {
              console.log('[DownloadAllDocs] Annexures auto-generated successfully!');
              try {
                const annexuresBuf = await pdfBlob.arrayBuffer();
                await proceedWithMergeAndDownload(autoGenerateAnnexuresCall, annexuresBuf);
              } catch (e) {
                console.error('[DownloadAllDocs] Error matching/reading annexures buffer:', e);
                showNotification('Error reading generated annexures PDF.', 'error');
                setPdfGenerating(false);
              } finally {
                setAutoGenerateAnnexuresCall(null);
              }
            }}
            onGenerationError={(err) => {
              console.error('[DownloadAllDocs] Error auto-generating annexures:', err);
              showNotification('Failed to generate Annexures PDF. Merging remaining documents...', 'warning');
              proceedWithMergeAndDownload(autoGenerateAnnexuresCall, null);
              setAutoGenerateAnnexuresCall(null);
            }}
          />
        </div>
      )}

      {/* Premium Header Card */}
      <div className="vendor-header-card">
        <div className="vendor-header-left">
          <div className="vendor-title-section-new">
            <h1 className="vendor-page-title-new">
              Vendor Dashboard <span className="vendor-badge-new">Vendor Portal</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Primary Tabs - Overview Stats in a Box */}
      <div className="primary-tabs-wrapper">
        <div className="primary-tabs-header">
          <h3 className="primary-tabs-title">Quick Overview</h3>
          <span className="primary-tabs-subtitle">Monitor your POs and inspection calls at a glance</span>
        </div>
        <Tabs tabs={primaryTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Secondary Tabs - Other Modules */}
      <div className="secondary-tabs-wrapper">
        <Tabs tabs={secondaryTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content */}
      <div className="card vendor-tab-card">
        <div className="card-body">
          {/* 1. PO Assigned */}
          {activeTab === 'po-assigned' && (
            viewingPdfUrl ? (
              <div className="pdf-viewer-container" style={{ display: 'flex', flexDirection: 'column', height: '80vh', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setViewingPdfUrl(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    ← Back to Dashboard
                  </button>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>PO Document Viewer</span>
                </div>
                {viewingPdfUrl.includes('ireps.gov.in') ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 24px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center',
                    margin: '20px auto',
                    maxWidth: '650px',
                    width: '100%'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                      boxShadow: '0 4px 10px rgba(59, 130, 246, 0.15)'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e3a8a', marginBottom: '12px' }}>
                      Indian Railways Portal (IREPS) Document
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: '#475569', maxWidth: '480px', lineHeight: '1.6', marginBottom: '24px' }}>
                      Due to strict security protocols enforced by the Indian Railways portal (<code style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#334155' }}>ireps.gov.in</code>), direct embedding is restricted. Please click the button below to view the official document.
                    </p>
                    <a
                      href={viewingPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: '600',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(37, 99, 236, 0.25)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 236, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 236, 0.25)';
                      }}
                    >
                      <span>Open PO Document</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={viewingPdfUrl ? (viewingPdfUrl.startsWith('http') || viewingPdfUrl.startsWith('data:') ? viewingPdfUrl : vendorCalibrationService.getFileUrl(viewingPdfUrl)) : ''}
                    title="PO PDF"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                  />
                )}
              </div>
            ) : (
              <>
                <div className="vendor-section-header">
                  <div>
                    <h3 className="vendor-section-header-title">PO Assigned to Vendor</h3>
                    <p className="vendor-section-header-desc">
                      List of all POs assigned along with status (Fresh PO, Inspection under Process,
                      Partially Supplied, Order Executed). Click + to expand PO and view items.
                    </p>
                  </div>
                  <div className="section-header-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => setIsSyncPOModalOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundImage: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        border: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🔄</span>
                      PO / MA sync
                    </button>
                  </div>
                </div>

                {/* Loading and Error States */}
                {loadingPOData && (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading PO data...</span>
                    </div>
                    <p className="mt-2">Loading PO data...</p>
                  </div>
                )}

                {poDataError && (
                  <div className="alert alert-warning" role="alert">
                    <strong>Warning:</strong> {poDataError}. Showing empty list.
                  </div>
                )}

                {/* Custom Expandable PO Table */}

                {!loadingPOData && (
                  <>
                    <div className="data-table-wrapper">
                      {/* Search Bar and Page Size Selector */}
                      <div className="table-controls">
                        <input
                          type="text"
                          className="form-control search-box"
                          placeholder="Search..."
                          value={poAssignedSearchTerm}
                          onChange={(e) => {
                            setPoAssignedSearchTerm(e.target.value);
                            setPoAssignedCurrentPage(1); // Reset to first page on search
                          }}
                        />
                        <select
                          className="form-control"
                          style={{ width: '120px' }}
                          value={poAssignedPageSize}
                          onChange={(e) => {
                            setPoAssignedPageSize(Number(e.target.value));
                            setPoAssignedCurrentPage(1); // Reset to first page on page size change
                          }}
                        >
                          <option value={10}>10 / page</option>
                          <option value={25}>25 / page</option>
                          <option value={50}>50 / page</option>
                          <option value={100}>100 / page</option>
                        </select>
                      </div>
                      <div className="data-table-container">
                        <table className="data-table expandable-po-table">
                          <thead>
                            <tr>
                              <th style={{ width: '50px' }}></th>
                              {poColumns.map(col => (
                                <th
                                  key={col.key}
                                  onClick={() => handlePOAssignedSort(col.key)}
                                  style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                  {col.label} {poAssignedSortColumn === col.key && (poAssignedSortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {loadingPOData ? (
                              renderTableSkeleton(poColumns.length + 1)
                            ) : sortedPOAssigned.length === 0 ? (
                              <tr>
                                <td colSpan={poColumns.length + 1} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                                  No PO data available
                                </td>
                              </tr>
                            ) : (
                              paginatedPOAssigned.map((po) => (
                                <React.Fragment key={po.id}>
                                  {/* PO Row */}
                                  <tr className={`po-row ${expandedPORows[po.id] ? 'expanded' : ''}`}>
                                    <td>
                                      <button
                                        className="po-expand-btn"
                                        onClick={() => togglePORow(po.id)}
                                        aria-label={expandedPORows[po.id] ? 'Collapse' : 'Expand'}
                                      >
                                        {expandedPORows[po.id] ? '−' : '+'}
                                      </button>
                                    </td>
                                    {poColumns.map(col => (
                                      <td key={col.key} data-label={col.label}>
                                        {col.render ? col.render(po[col.key], po) : po[col.key]}
                                      </td>
                                    ))}
                                  </tr>
                                  {/* Expanded Items Row */}
                                  {expandedPORows[po.id] && (
                                    <tr className="po-items-row">
                                      <td colSpan={poColumns.length + 1}>
                                        <div className="po-items-container">
                                          <div className="po-items-header">
                                            <span className="po-items-title">Items in {po.po_no}</span>
                                            {/* <button
                                      className="btn btn-sm btn-secondary"
                                      onClick={() => handleOpenAddSubPOModal(po, null)}
                                      style={{ whiteSpace: 'nowrap' }}
                                    >
                                      + Add Sub PO
                                    </button> */}
                                          </div>

                                          {/* Sub PO List Table */}
                                          {/* {(() => {
                                    const poSubPOs = subPOList.filter(subPO =>
                                      po.items?.some(item => item.id === subPO.po_item_id)
                                    );

                                    if (poSubPOs.length > 0) {
                                      return (
                                        <div className="sub-po-section">
                                          <h4 className="sub-po-section-title">Sub POs for this PO</h4>
                                          <table className="po-items-table sub-po-table">
                                            <thead>
                                              <tr>
                                                <th>Sub-PO Number</th>
                                                <th>Raw Material</th>
                                                <th>Contractor</th>
                                                <th>Manufacturer</th>
                                                <th>Sub-PO Qty</th>
                                                <th>Rate (₹)</th>
                                                <th>Status</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {poSubPOs.map(subPO => (
                                                <tr key={subPO.id}>
                                                  <td>{subPO.sub_po_number}</td>
                                                  <td>{subPO.raw_material_name}</td>
                                                  <td>{subPO.contractor}</td>
                                                  <td>{subPO.manufacturer}</td>
                                                  <td>{subPO.sub_po_quantity}</td>
                                                  <td>{subPO.rate}</td>
                                                  <td>
                                                    <span
                                                      className="status-badge"
                                                      style={{
                                                        backgroundColor:
                                                          subPO.approval_status === 'Approved' ? '#d1fae5' :
                                                          subPO.approval_status === 'Rejected' ? '#fee2e2' :
                                                          '#fef3c7',
                                                        color:
                                                          subPO.approval_status === 'Approved' ? '#065f46' :
                                                          subPO.approval_status === 'Rejected' ? '#991b1b' :
                                                          '#92400e'
                                                      }}
                                                    >
                                                      {subPO.approval_status}
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()} */}

                                          {/* PO Items Table */}
                                          <h4 className="po-items-section-title">PO Items</h4>
                                          <table className="po-items-table">
                                            <thead>
                                              <tr>
                                                <th
                                                  onClick={() => handlePOItemsSort(po.id, 'item_name')}
                                                  style={{ cursor: 'pointer', userSelect: 'none', minWidth: '260px' }}
                                                  className="po-item-desc-cell"
                                                >
                                                  Item Description {poItemsSortColumn[po.id] === 'item_name' && (poItemsSortDirection[po.id] === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th
                                                  onClick={() => handlePOItemsSort(po.id, 'po_serial_no')}
                                                  style={{ cursor: 'pointer', userSelect: 'none' }}
                                                >
                                                  PO Serial No. {poItemsSortColumn[po.id] === 'po_serial_no' && (poItemsSortDirection[po.id] === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th
                                                  onClick={() => handlePOItemsSort(po.id, 'consignee')}
                                                  style={{ cursor: 'pointer', userSelect: 'none' }}
                                                >
                                                  Consignee {poItemsSortColumn[po.id] === 'consignee' && (poItemsSortDirection[po.id] === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th
                                                  onClick={() => handlePOItemsSort(po.id, 'item_qty')}
                                                  style={{ cursor: 'pointer', userSelect: 'none' }}
                                                >
                                                  Ordered Quantity {poItemsSortColumn[po.id] === 'item_qty' && (poItemsSortDirection[po.id] === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th
                                                  onClick={() => handlePOItemsSort(po.id, 'delivery_period')}
                                                  style={{ cursor: 'pointer', userSelect: 'none' }}
                                                >
                                                  Delivery Period {poItemsSortColumn[po.id] === 'delivery_period' && (poItemsSortDirection[po.id] === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th
                                                  onClick={() => handlePOItemsSort(po.id, 'item_status')}
                                                  style={{ cursor: 'pointer', userSelect: 'none' }}
                                                >
                                                  Status {poItemsSortColumn[po.id] === 'item_status' && (poItemsSortDirection[po.id] === 'asc' ? '↑' : '↓')}
                                                </th>
                                                <th>Action</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {po.items && po.items.length > 0 ? (
                                                (() => {
                                                  // Get all approved Sub POs for this PO (shared across all items,  selectedSubPOsByItem[item.id] || )
                                                  const approvedSubPOs = getApprovedSubPOsForPO(po);

                                                  // Sort the items based on current sort state
                                                  const sortedItems = getSortedPOItems(po.id, po.items);

                                                  return sortedItems.map((item) => {
                                                    const selectedSubPO = '';

                                                    return (
                                                      <tr key={item.id}>
                                                        <td className="po-item-desc-cell">{item.item_name}</td>
                                                        <td>{item.po_serial_no}</td>
                                                        <td>{item.consignee}</td>
                                                        <td>{item.item_qty} {item.item_unit}</td>
                                                        <td>{formatDate(item.delivery_period)}</td>
                                                        <td>
                                                          <StatusBadge status={item.item_status} />
                                                        </td>
                                                        <td>
                                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {/* Sub PO Dropdown - Always show for all items */}
                                                            {/* <select
                                                      className="ric-form-select"
                                                      value={selectedSubPO}
                                                      onChange={(e) => {
                                                        setSelectedSubPOsByItem(prev => ({
                                                          ...prev,
                                                          [item.id]: e.target.value
                                                        }));
                                                      }}
                                                      style={{ fontSize: '12px', padding: '4px' }}
                                                    >
                                                      <option value="">Select Sub PO (Optional)</option>
                                                      {approvedSubPOs.map(subPO => (
                                                        <option key={subPO.id} value={subPO.id}>
                                                          {subPO.sub_po_number} - {subPO.raw_material_name}
                                                        </option>
                                                      ))}
                                                    </select> */}

                                                            {/* Raise Inspection Request Button */}
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                              <button
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => {
                                                                  const subPOData = selectedSubPO
                                                                    ? approvedSubPOs.find(sp => sp.id === parseInt(selectedSubPO))
                                                                    : null;
                                                                  handleOpenInspectionModal(po, item, subPOData);
                                                                }}
                                                                style={{ whiteSpace: 'nowrap' }}
                                                              >
                                                                Raise Inspection Request
                                                              </button>
                                                              <button
                                                                className="btn btn-sm btn-secondary"
                                                                onClick={() => handleOpenPoItemHeatDetails(item.po_serial_no)}
                                                                style={{ whiteSpace: 'nowrap', backgroundColor: '#f59e0b', color: 'white', border: 'none' }}
                                                              >
                                                                Heat Details
                                                              </button>
                                                            </div>
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    );
                                                  });
                                                })()
                                              ) : (
                                                <tr>
                                                  <td colSpan={7} style={{ textAlign: 'center', color: '#6b7280' }}>
                                                    No items found for this PO
                                                  </td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>

                                          {/* Approved RM Inspection Calls Section */}
                                          {/* <div className="approved-rm-ics-section" style={{ marginTop: '24px' }}>
                                    <h4 className="po-items-section-title">Approved Raw Material Inspection Calls</h4>
                                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                                      List of approved RM inspection calls for this PO. These can be used for Process Inspection.
                                    </p>
                                    <table className="po-items-table">
                                      <thead>
                                        <tr>
                                          <th>RM IC Number</th>
                                          <th>PO Serial No.</th>
                                          <th>Heat Numbers</th>
                                          <th>Offered Qty (MT)</th>
                                          <th>Offered Qty (ERCs)</th>
                                          <th>Manufacturer</th>
                                          <th>Inspection Date</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(() => {
                                          // Get approved RM ICs from state
                                          const rmICsData = approvedRMICsByPO[po.po_no];
                                          const approvedRMICs = Array.isArray(rmICsData) ? rmICsData : [];
                                          const isLoading = loadingRMICs[po.po_no];

                                          if (isLoading) {
                                            return (
                                              <tr>
                                                <td colSpan={7} style={{ textAlign: 'center', color: '#6b7280', padding: '16px' }}>
                                                  Loading approved RM inspection calls...
                                                </td>
                                              </tr>
                                            );
                                          }

                                          if (approvedRMICs.length === 0) {
                                            return (
                                              <tr>
                                                <td colSpan={7} style={{ textAlign: 'center', color: '#6b7280', padding: '16px' }}>
                                                  No approved RM inspection calls found for this PO
                                                </td>
                                              </tr>
                                            );
                                          }

                                          return approvedRMICs.map((rmIC) => (
                                            <tr key={rmIC.id}>
                                              <td style={{ fontWeight: '600', color: '#2563eb' }}>{rmIC.ic_number}</td>
                                              <td>{rmIC.po_serial_no}</td>
                                              <td>{rmIC.heat_numbers || 'N/A'}</td>
                                              <td>{rmIC.total_offered_qty_mt ? `${rmIC.total_offered_qty_mt} MT` : 'N/A'}</td>
                                              <td>{rmIC.offered_qty_erc ? rmIC.offered_qty_erc.toLocaleString('en-IN') : 'N/A'}</td>
                                              <td>{rmIC.manufacturer || 'N/A'}</td>
                                              <td>{formatDate(rmIC.actual_inspection_date || rmIC.desired_inspection_date)}</td>
                                            </tr>
                                          ));
                                        })()}
                                      </tbody>
                                    </table>
                                  </div> */}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pagination Controls */}
                    {sortedPOAssigned.length > 0 && (
                      <div className="pagination-controls" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          Showing {((poAssignedCurrentPage - 1) * poAssignedPageSize) + 1} to {Math.min(poAssignedCurrentPage * poAssignedPageSize, sortedPOAssigned.length)} of {sortedPOAssigned.length} POs
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setPoAssignedCurrentPage(Math.max(1, poAssignedCurrentPage - 1))}
                            disabled={poAssignedCurrentPage === 1}
                          >
                            ← Previous
                          </button>
                          <span style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                            Page {poAssignedCurrentPage} of {Math.ceil(sortedPOAssigned.length / poAssignedPageSize)}
                          </span>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setPoAssignedCurrentPage(Math.min(Math.ceil(sortedPOAssigned.length / poAssignedPageSize), poAssignedCurrentPage + 1))}
                            disabled={poAssignedCurrentPage === Math.ceil(sortedPOAssigned.length / poAssignedPageSize)}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ))}

          {/* 2. Requested Inspection Call Status */}
          {activeTab === 'requested-calls' && (
            <>
              <div className="vendor-section-header">
                <div>
                  <h3 className="vendor-section-header-title">Requested Inspection Call Status</h3>
                  <p className="vendor-section-header-desc">
                    List of inspection calls requested by vendor with their status (Pending, Scheduled,
                    Under Inspection, Rectification Requested, IC Pending). Click on a row to view actions.
                  </p>
                </div>
              </div>

              {/* Loading and Error States */}
              {loadingRequestedCalls && (
                <div className="loading-message">Loading requested calls...</div>
              )}
              {requestedCallsError && (
                <div className="error-message">
                  Error: {requestedCallsError}. Showing mock data as fallback.
                </div>
              )}

              {/* Search Bar and Pagination Controls */}
              <div className="table-controls" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-control search-box"
                  placeholder="Search..."
                  value={requestedCallsSearchTerm}
                  onChange={(e) => {
                    setRequestedCallsSearchTerm(e.target.value);
                    setRequestedCallsCurrentPage(1); // Reset to first page on search
                  }}
                  style={{ maxWidth: '400px' }}
                />
                <select
                  className="form-control"
                  style={{ width: '120px' }}
                  value={requestedCallsPageSize}
                  onChange={(e) => {
                    setRequestedCallsPageSize(Number(e.target.value));
                    setRequestedCallsCurrentPage(1); // Reset to first page on page size change
                  }}
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

              {/* Custom Expandable Inspection Calls Table */}
              <div className="data-table-wrapper">
                <div className="data-table-container">
                  <table className="data-table expandable-calls-table">
                    <thead>
                      <tr>
                        {requestedColumns.map(col => (
                          <th
                            key={col.key}
                            onClick={col.key !== 'actions' ? () => handleRequestedCallsSort(col.key) : undefined}
                            style={{
                              cursor: col.key !== 'actions' ? 'pointer' : 'default',
                              userSelect: 'none',
                              width: col.width || undefined,
                              minWidth: col.width || undefined
                            }}
                          >
                            {col.label} {col.key !== 'actions' && requestedCallsSortColumn === col.key && (requestedCallsSortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingRequestedCalls ? (
                        renderTableSkeleton(requestedColumns.length)
                      ) : filteredAndSortedRequestedCalls.length === 0 ? (
                        <tr>
                          <td colSpan={requestedColumns.length} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                            {requestedCallsSearchTerm
                              ? `No inspection calls found matching "${requestedCallsSearchTerm}"`
                              : 'No inspection calls found'}
                          </td>
                        </tr>
                      ) : (
                        paginatedRequestedCalls.map((call) => (
                          <tr key={call.id} className="call-row">
                            {requestedColumns.map(col => (
                              <td
                                key={col.key}
                                data-label={col.label}
                                style={{
                                  width: col.width || undefined,
                                  minWidth: col.width || undefined
                                }}
                              >
                                {col.render ? col.render(call[col.key], call) : call[col.key]}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Info and Controls */}
              {filteredAndSortedRequestedCalls.length > 0 && (
                <div className="table-pagination" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #e5e7eb' }}>
                  <div className="pagination-info" style={{ fontSize: '14px', color: '#6b7280' }}>
                    Showing {((requestedCallsCurrentPage - 1) * requestedCallsPageSize) + 1} to {Math.min(requestedCallsCurrentPage * requestedCallsPageSize, filteredAndSortedRequestedCalls.length)} of {filteredAndSortedRequestedCalls.length} entries
                  </div>
                  <div className="pagination-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      disabled={requestedCallsCurrentPage === 1}
                      onClick={() => setRequestedCallsCurrentPage(requestedCallsCurrentPage - 1)}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Page {requestedCallsCurrentPage} of {requestedCallsTotalPages}
                    </span>
                    <button
                      className="btn btn-sm btn-outline"
                      disabled={requestedCallsCurrentPage === requestedCallsTotalPages}
                      onClick={() => setRequestedCallsCurrentPage(requestedCallsCurrentPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 3. Completed Inspection Calls & IC Download */}
          {activeTab === 'completed-calls' && (
            <>
              <div className="vendor-section-header">
                <div>
                  <h3 className="vendor-section-header-title">
                    Completed Inspection Calls &amp; IC Download
                  </h3>
                  <p className="vendor-section-header-desc">
                    List of all inspection calls completed (Accepted, Partially Accepted,
                    Rejected or Cancelled) for Vendor. Click on a row to view actions.
                  </p>
                </div>
              </div>

              {/* Loading and Error States */}
              {loadingCompletedCalls && (
                <div className="loading-message">Loading completed calls...</div>
              )}
              {completedCallsError && (
                <div className="error-message">
                  Error: {completedCallsError}. Showing mock data as fallback.
                </div>
              )}

              {/* Search Bar and Pagination Controls */}
              <div className="table-controls" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-control search-box"
                  placeholder="Search completed calls..."
                  value={completedCallsSearchTerm}
                  onChange={(e) => {
                    setCompletedCallsSearchTerm(e.target.value);
                    setCompletedCallsCurrentPage(1); // Reset to first page on search
                  }}
                  style={{ maxWidth: '400px' }}
                />
                <select
                  className="form-control"
                  style={{ width: '120px' }}
                  value={completedCallsPageSize}
                  onChange={(e) => {
                    setCompletedCallsPageSize(Number(e.target.value));
                    setCompletedCallsCurrentPage(1); // Reset to first page on page size change
                  }}
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

              {/* Custom Expandable Completed Calls Table */}
              <div className="data-table-wrapper">
                <div className="data-table-container">
                  <table className="data-table expandable-completed-table">
                    <thead>
                      <tr>
                        {completedColumns.map(col => (
                          <th
                            key={col.key}
                            onClick={col.key !== 'actions' ? () => handleCompletedCallsSort(col.key) : undefined}
                            style={{
                              cursor: col.key !== 'actions' ? 'pointer' : 'default',
                              userSelect: 'none',
                              width: col.width || undefined,
                              minWidth: col.width || undefined
                            }}
                          >
                            {col.label} {col.key !== 'actions' && completedCallsSortColumn === col.key && (completedCallsSortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingCompletedCalls ? (
                        renderTableSkeleton(completedColumns.length)
                      ) : paginatedCompletedCalls.length === 0 ? (
                        <tr>
                          <td colSpan={completedColumns.length} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                            No completed inspection calls found.
                          </td>
                        </tr>
                      ) : (
                        paginatedCompletedCalls.map((call) => (
                          <tr
                            key={call.id}
                            className="completed-call-row"
                          >
                            {completedColumns.map(col => (
                              <td
                                key={col.key}
                                data-label={col.label}
                                style={{
                                  width: col.width || undefined,
                                  minWidth: col.width || undefined
                                }}
                              >
                                {col.render ? col.render(call[col.key], call) : call[col.key]}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {filteredAndSortedCompletedCalls.length > 0 && (
                <div className="table-pagination" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #e5e7eb' }}>
                  <div className="pagination-info" style={{ fontSize: '14px', color: '#6b7280' }}>
                    Showing {((completedCallsCurrentPage - 1) * completedCallsPageSize) + 1} to {Math.min(completedCallsCurrentPage * completedCallsPageSize, filteredAndSortedCompletedCalls.length)} of {filteredAndSortedCompletedCalls.length} entries
                  </div>
                  <div className="pagination-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      disabled={completedCallsCurrentPage === 1}
                      onClick={() => setCompletedCallsCurrentPage(completedCallsCurrentPage - 1)}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Page {completedCallsCurrentPage} of {completedCallsTotalPages}
                    </span>
                    <button
                      className="btn btn-sm btn-outline"
                      disabled={completedCallsCurrentPage === completedCallsTotalPages}
                      onClick={() => setCompletedCallsCurrentPage(completedCallsCurrentPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 4. Calibration & Approval (Combined) */}
          {activeTab === 'calibration-approval' && (
            isCalibrationLoading ? (
              <div className="loading-message">Loading calibration records...</div>
            ) : (
              <>
                {allCalibrationItems.length === 0 ? (
                  <InitialCalibrationRegistration 
                    vendorCode={user.userName}
                  onSubmit={async (payload) => {
                    setIsLoading(true);
                    try {
                      payload.vendorCode = user.userName;
                      const response = await vendorCalibrationService.submitBulkRegistration(payload);
                      if (response && response.success) {
                        // Refresh data from backend to populate lists
                        const freshData = await vendorCalibrationService.getCalibrationsByVendor(user.userName);
                        if (freshData && freshData.success) {
                          const items = freshData.data || [];
                          setInstrumentItems(items.filter(i => i.category === 'Instrument'));
                          setApprovalItems(items.filter(i => i.category === 'Document'));
                          setGaugeItems(items.filter(i => i.category === 'Gauge'));
                        } else {
                          // Fallback local mapping if fetch fails
                          const newItems = payload.items.map(item => ({
                            id: `bulk-${Math.random().toString(36).substr(2, 9)}`,
                            ...item,
                            valid_till: item.calibrationDueDate,
                            calibration_due_date: item.calibrationDueDate,
                            instrument_name: item.instrumentName,
                            serial_number: item.serialNumber,
                            calibration_certificate_no: item.calibrationCertificateNo,
                            calibration_date: item.calibrationDate,
                            certifying_lab_name: item.certifyingLabName,
                            accreditation_agency: item.accreditationAgency,
                            make_model: item.makeModel,
                            master_equip_no_cert_validity: item.masterEquipNoCertValidity,
                            master_equip_nabl_details: item.masterEquipNablDetails,
                            notification_days: item.notificationDays,
                            approval_document_name: item.instrumentName,
                            document_number: item.serialNumber,
                            gauge_description: item.instrumentName,
                            gauge_sr_no: item.serialNumber
                          }));
                          setInstrumentItems(prev => [...prev, ...newItems.filter(i => i.category === 'Instrument')]);
                          setApprovalItems(prev => [...prev, ...newItems.filter(i => i.category === 'Document')]);
                          setGaugeItems(prev => [...prev, ...newItems.filter(i => i.category === 'Gauge')]);
                        }
                        
                        // Clear localStorage and IndexedDB drafts
                        const vCode = user.userName;
                        localStorage.removeItem(`initialCalibrationDraft_${vCode}`);
                        localStorage.removeItem(`initialCalibrationDraft_fileName_${vCode}`);
                        localStorage.removeItem('initialCalibrationDraft');
                        localStorage.removeItem('initialCalibrationDraft_fileName');
                        localStorage.removeItem('initialCalibrationDraft_fileBase64');
                        
                        try {
                          const idbRequest = indexedDB.open('CalibrationDraftDB', 1);
                          idbRequest.onsuccess = (e) => {
                            const db = e.target.result;
                            if (db.objectStoreNames.contains('drafts')) {
                              const tx = db.transaction('drafts', 'readwrite');
                              const store = tx.objectStore('drafts');
                              store.delete(`initialCalibrationDraft_fileBase64_${vCode}`);
                            }
                          };
                        } catch (err) {
                          console.error('Failed to clear IndexedDB draft file:', err);
                        }
                        
                        showNotification('Initial calibration registration complete! Dashboard unlocked.', 'success');
                      } else {
                        showNotification(response.error || 'Failed to complete registration.', 'error');
                      }
                    } catch (error) {
                      console.error('Error submitting registration:', error);
                      showNotification(error.message || 'An error occurred during submission.', 'error');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  isLoading={isLoading}
                />
              ) : (
                <>
                  <div className="vendor-section-header">
                    <div>
                      <h3 className="vendor-section-header-title">
                        Calibration &amp; Approval Records Management
                      </h3>
                    </div>
                  </div>

                  {/* Expiry Reminders Section */}
                  {overallCompliance.totalExpiring > 0 && (
                    <div className="expiry-reminders-section-cards">
                      <h4 className="expiry-reminders-title-cards">⏰ Upcoming Expiry Reminders</h4>
                      <div className="expiry-reminders-grid">
                        {[
                          ...instrumentItems.filter(i => {
                            const days = getDaysUntilExpiry(i.calibration_due_date);
                            return days >= 0 && days <= (i.notification_days || 30);
                          }).map(i => ({
                            ...i,
                            type: 'Instrument',
                            name: i.instrument_name,
                            serial: i.serial_number,
                            dueDate: i.calibration_due_date
                          })),
                          ...approvalItems.filter(a => {
                            const days = getDaysUntilExpiry(a.valid_till);
                            return days >= 0 && days <= (a.notification_days || 30);
                          }).map(a => ({
                            ...a,
                            type: 'Approval',
                            name: a.approval_document_name,
                            serial: a.document_number,
                            dueDate: a.valid_till
                          })),
                          ...gaugeItems.filter(g => {
                            const days = getDaysUntilExpiry(g.calibration_due_date);
                            return days >= 0 && days <= (g.notification_days || 30);
                          }).map(g => ({
                            ...g,
                            type: 'Gauge',
                            name: g.gauge_description,
                            serial: g.gauge_sr_no,
                            dueDate: g.calibration_due_date
                          }))
                        ].map((item, idx) => {
                          const daysLeft = getDaysUntilExpiry(item.dueDate);
                          const daysLeftClass = daysLeft <= 7 ? 'days-critical' : (daysLeft <= 15 ? 'days-warning' : 'days-info');
                          return (
                            <div 
                              key={idx} 
                              className={`expiry-reminder-card type-${item.type.toLowerCase()}`}
                              onClick={() => handleOpenExpiryDetailModal(item)}
                              title={`${item.name} (${item.serial || 'No Serial'})`}
                            >
                              <div className="card-badge-header">
                                <span className={`card-badge-type ${item.type.toLowerCase()}`}>{item.type}</span>
                                <span className={`card-badge-days ${daysLeftClass}`}>{daysLeft}d left</span>
                              </div>
                              <h5 className="card-item-name">{item.name}</h5>
                              <div className="card-item-details">
                                <span className="card-detail-sn" title={`Serial/Doc No: ${item.serial || 'N/A'}`}>
                                  S/N: {item.serial || 'N/A'}
                                </span>
                                <span className="card-detail-due">
                                  Due: {formatDate(item.dueDate)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section Title */}
                  <div className="calibration-section-title">
                    <p>All instruments, approvals, and gauges with calibration and validity details</p>
                  </div>

                  {/* ========== UNIFIED CALIBRATION & APPROVALS SECTION ========== */}
                  <div className="calibration-full-section">
                    <div className="calibration-section-header">
                      <div className="calibration-section-header-left">
                        <h4 className="calibration-section-heading">📏 Calibration &amp; Approvals Registry</h4>
                        <p className="calibration-section-subtitle">Unified registry of all instruments, approvals, and gauges with validity tracking</p>
                      </div>
                      <div className="calibration-section-header-right">
                        <span className="section-record-count">{allCalibrationItems.length} Total Records</span>
                        <button className="btn btn-sm btn-primary" onClick={() => handleOpenInstrumentModal()}>
                          + Register Calibration / Doc
                        </button>
                      </div>
                    </div>

                    {/* Unified Items Table */}
                    <DataTable
                      columns={unifiedCalibrationColumns}
                      data={allCalibrationItems}
                      onRowClick={(row) => handleOpenInstrumentModal(row)}
                      selectable={false}
                      selectedRows={[]}
                      onSelectionChange={() => { }}
                    />
                  </div>

                  <p className="mandatory-note">
                    <span className="mandatory-badge">*</span> Mandatory categories must be complete with valid certificates to raise inspection calls.
                  </p>
                </>
              )}
            </>
          )
          )}

          {/* 7. Raising an Inspection Call */}
          {activeTab === 'raise-call' && (
            <>
              <div className="vendor-section-header">
                <div>
                  <h3 className="vendor-section-header-title">Raising an Inspection Call</h3>
                  <p className="vendor-section-header-desc">
                    Complete all required fields to raise an inspection call. PO Data is auto-fetched from IREPS.
                  </p>
                </div>
              </div>

              <RaiseInspectionCallForm
                selectedPO={VENDOR_RAISE_CALL_PO} // Default for testing if needed, or pass selectedPO
                inventoryEntries={inventoryEntries}
                availableHeatNumbers={availableHeatNumbers}
                vendorId={currentUser.id}
                onSubmit={handleSubmitInspectionRequest}
                isLoading={isLoading}
              />
            </>
          )}

          {/* 8. Payment Details Updating Module */}
          {activeTab === 'payment-module' && (
            <>
              <div className="vendor-section-header">
                <div>
                  <h3 className="vendor-section-header-title">Payment Details Updating Module</h3>
                  <p className="vendor-section-header-desc">
                    View and manage inspection calls requiring payment (Cancelled/Rejected/Advance Payment).
                  </p>
                </div>
              </div>

              {/* Payment Filters */}
              <div className="payment-filters">
                <div className="payment-filter-group">
                  <label className="payment-filter-label">Status Filter:</label>
                  <select
                    className="payment-filter-select"
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Payment Pending">Payment Pending</option>
                    <option value="Payment Pending for Approval">Pending for Approval</option>
                    <option value="Approved by RITES Finance">Approved by RITES</option>
                    <option value="Not Approved by RITES Finance">Not Approved</option>
                  </select>
                </div>
                <div className="payment-filter-group">
                  <label className="payment-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={showOldApproved}
                      onChange={(e) => setShowOldApproved(e.target.checked)}
                    />
                    Show approved calls older than 30 days
                  </label>
                </div>
              </div>

              {/* Payment Status Summary Cards */}
              <div className="payment-summary-cards">
                {[
                  { status: 'Payment Pending', label: 'Payment Pending', color: '#dc2626' },
                  { status: 'Payment Pending for Approval', label: 'Pending Approval', color: '#f59e0b' },
                  { status: 'Approved by RITES Finance', label: 'Approved', color: '#16a34a' },
                  { status: 'Not Approved by RITES Finance', label: 'Not Approved', color: '#7c3aed' }
                ].map(({ status, label, color }) => (
                  <div
                    key={status}
                    className={`payment-summary-card ${paymentStatusFilter === status ? 'active' : ''}`}
                    onClick={() => setPaymentStatusFilter(paymentStatusFilter === status ? 'all' : status)}
                    style={{ borderColor: color }}
                  >
                    <span className="payment-summary-count" style={{ color }}>
                      {paymentItems.filter(i => i.payment_status === status).length}
                    </span>
                    <span className="payment-summary-label">{label}</span>
                  </div>
                ))}
              </div>

              {/* Payment Table */}
              <DataTable
                columns={paymentColumns}
                data={filteredPaymentItems}
                onRowClick={(row) => {
                  setSelectedPaymentCall(row);
                  handleOpenPaymentModal(row);
                }}
                selectable={false}
                selectedRows={[]}
                onSelectionChange={() => { }}
              />

              {/* Selected Payment Details */}
              {selectedPaymentCall && (
                <div className="payment-details-card">
                  <div className="payment-details-header">
                    <h4>Payment Details - {selectedPaymentCall.call_no}</h4>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelectedPaymentCall(null)}>
                      Close
                    </button>
                  </div>
                  <div className="payment-details-grid">
                    <div className="payment-detail-item">
                      <span className="payment-detail-label">Charge Type</span>
                      <span className="payment-detail-value">{selectedPaymentCall.charge_type}</span>
                    </div>
                    <div className="payment-detail-item">
                      <span className="payment-detail-label">Base Amount</span>
                      <span className="payment-detail-value">₹{selectedPaymentCall.base_payable_amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="payment-detail-item">
                      <span className="payment-detail-label">GST (18%)</span>
                      <span className="payment-detail-value">₹{selectedPaymentCall.gst?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="payment-detail-item">
                      <span className="payment-detail-label">Total Payable</span>
                      <span className="payment-detail-value payment-total">₹{selectedPaymentCall.total_payable_amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="payment-detail-item full-width">
                      <span className="payment-detail-label">Bank Account Details</span>
                      <span className="payment-detail-value">{selectedPaymentCall.bank_account_details}</span>
                    </div>
                    {selectedPaymentCall.rejection_reason && (
                      <div className="payment-detail-item full-width rejection">
                        <span className="payment-detail-label">Rejection Reason</span>
                        <span className="payment-detail-value">{selectedPaymentCall.rejection_reason}</span>
                      </div>
                    )}
                  </div>
                  <div className="payment-details-actions">
                    {selectedPaymentCall.payment_status === 'Payment Pending' && (
                      <button className="btn btn-primary" onClick={() => handleOpenPaymentModal(selectedPaymentCall)}>
                        Enter Payment Details
                      </button>
                    )}
                    {selectedPaymentCall.payment_status === 'Not Approved by RITES Finance' && (
                      <button className="btn btn-primary" onClick={() => handleOpenPaymentModal(selectedPaymentCall)}>
                        Update Payment Details
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 9. New Inventory Entry */}
          {activeTab === 'inventory-entry' && (
            <>
              {/* List of Entries Section */}
              <div className="vendor-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 className="vendor-section-header-title">Inventory - List of Entries</h3>
                  <p className="vendor-section-header-desc" style={{ margin: 0 }}>
                    Data entered during form with Quantity Offered for Inspection and Quantity left for inspection.
                    Status: Fresh, Inspection Requested, Under Inspection, Partially Inspected, Exhausted.
                  </p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingInventoryEntry(null);
                    setIsInventoryModalOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 16px', whiteSpace: 'nowrap' }}
                >
                  + Add New Inventory Entry
                </button>
              </div>

              <DataTable
                columns={inventoryColumns}
                data={inventoryEntries}
                onRowClick={handleRowClick}
                selectable={false}
                selectedRows={[]}
                onSelectionChange={() => { }}
              />
            </>
          )}

          {/* 10. Master Updating */}
          {activeTab === 'master-updating' && (
            <>
              <div className="vendor-section-header">
                <div>
                  <h3 className="vendor-section-header-title">
                    {isEditingMaster ? 'Edit Master Entry' : 'Add New Master Entry'}
                  </h3>
                  <p className="vendor-section-header-desc">
                    {isEditingMaster
                      ? 'Update the master data for the selected entry'
                      : 'Add new master data for Companies, Units, and their roles'
                    }
                  </p>
                </div>
              </div>

              {isEditingMaster && (
                <div style={{ marginBottom: 16 }}>
                  <button
                    className="btn btn-outline"
                    onClick={handleCancelEditMaster}
                  >
                    ← Back to List
                  </button>
                </div>
              )}

              <MasterUpdatingForm
                editData={isEditingMaster ? selectedMasterEntry : null}
                onSubmit={handleMasterFormSubmit}
                isLoading={isLoading}
              />

              {!isEditingMaster && (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ marginBottom: 12, color: '#374151' }}>Existing Master Entries</h4>
                  <DataTable
                    columns={masterColumns}
                    data={masterItems}
                    onRowClick={handleRowClick}
                    selectable={false}
                    selectedRows={[]}
                    onSelectionChange={() => { }}
                  />
                </div>
              )}
            </>
          )}

          {/* 11. Feedback System */}
          {activeTab === 'feedback-system' && (
            <div className="feedback-module-wrapper">
              <div className="vendor-section-header">
                <div>
                  <h3 className="vendor-section-header-title">Feedback System</h3>
                </div>
              </div>
              <VendorFeedbackModule />
            </div>
          )}
        </div>
      </div>

      {/* ============ CALIBRATION FORM MODALS ============ */}

      {/* Instrument Form Modal */}
      <InstrumentForm
        isOpen={isInstrumentModalOpen}
        onClose={handleCloseInstrumentModal}
        onSubmit={handleSubmitInstrument}
        masterData={CALIBRATION_MASTER_DATA}
        editData={editingInstrument}
        plants={vendorPlants}
        isLoading={isLoading}
      />



      {/* ============ PAYMENT FORM MODAL ============ */}
      <PaymentForm
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        onSubmit={handleSubmitPayment}
        masterData={PAYMENT_MASTER_DATA}
        editData={editingPayment}
        isLoading={isLoading}
      />

      {/* ============ EXPIRY REMINDER DETAIL MODAL ============ */}
      {isExpiryDetailModalOpen && selectedExpiryItem && (
        <div className="modal-overlay" onClick={handleCloseExpiryDetailModal}>
          <div className="modal expiry-detail-modal" onClick={(e) => e.stopPropagation()}>
            <style>{`
              .expiry-detail-modal {
                max-width: 650px !important;
                border-radius: 16px !important;
                overflow: hidden !important;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                border: 1px solid #cbd5e1 !important;
                background-color: #f8fafc !important;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
              }
              .expiry-detail-modal .modal-header {
                background: linear-gradient(135deg, #1e3a5f, #0f172a) !important;
                padding: 16px 24px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
              }
              .expiry-detail-modal .modal-title {
                font-size: 16px !important;
                font-weight: 600 !important;
                color: #ffffff !important;
                margin: 0 !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
              }
              .expiry-detail-modal .modal-close {
                font-size: 24px !important;
                color: rgba(255, 255, 255, 0.7) !important;
                background: transparent !important;
                border: none !important;
                cursor: pointer !important;
                line-height: 1 !important;
                transition: color 0.2s !important;
              }
              .expiry-detail-modal .modal-close:hover {
                color: #ffffff !important;
              }
              .expiry-detail-modal .modal-body {
                padding: 24px !important;
                background-color: #f8fafc !important;
              }
              .expiry-detail-modal .detail-section {
                background: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 12px !important;
                padding: 20px !important;
                margin-bottom: 20px !important;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
              }
              .expiry-detail-modal .detail-section-title {
                font-size: 13px !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                color: #475569 !important;
                border-bottom: 1px solid #f1f5f9 !important;
                padding-bottom: 10px !important;
                margin-top: 0 !important;
                margin-bottom: 16px !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
              }
              .expiry-detail-modal .expiry-detail-grid {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 16px 24px !important;
              }
              .expiry-detail-modal .detail-row {
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-start !important;
                justify-content: flex-start !important;
                padding: 4px 0 !important;
                border-bottom: none !important;
                font-size: 13.5px !important;
              }
              .expiry-detail-modal .detail-row.full-width {
                grid-column: span 2 !important;
              }
              .expiry-detail-modal .detail-label {
                color: #64748b !important;
                font-weight: 500 !important;
                text-transform: none !important; /* Override global uppercase leak */
                letter-spacing: normal !important;
                font-size: 12.5px !important;
                margin-bottom: 4px !important;
                min-width: auto !important;
                text-align: left !important;
              }
              .expiry-detail-modal .detail-value {
                color: #1e293b !important;
                font-weight: 600 !important;
                text-align: left !important;
                flex: none !important;
                padding-left: 0 !important;
                font-size: 14px !important;
              }
              .expiry-detail-modal .modal-footer {
                background-color: #f1f5f9 !important;
                border-top: 1px solid #e2e8f0 !important;
                padding: 16px 24px !important;
                display: flex !important;
                justify-content: flex-end !important;
                gap: 12px !important;
              }
              .expiry-detail-modal .btn {
                height: 38px !important;
                padding: 0 18px !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                border-radius: 8px !important;
                cursor: pointer !important;
                transition: all 0.2s !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
              }
              .expiry-detail-modal .btn-primary {
                background: linear-gradient(135deg, #1e3a5f, #0f172a) !important;
                color: #ffffff !important;
                border: none !important;
              }
              .expiry-detail-modal .btn-primary:hover {
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
              }
              .expiry-detail-modal .btn-outline {
                background: #ffffff !important;
                color: #475569 !important;
                border: 1px solid #cbd5e1 !important;
              }
              .expiry-detail-modal .btn-outline:hover {
                background: #f8fafc !important;
                border-color: #94a3b8 !important;
                color: #1e293b !important;
              }
              .expiry-detail-modal::-webkit-scrollbar {
                width: 6px !important;
              }
              .expiry-detail-modal::-webkit-scrollbar-track {
                background: #f1f5f9 !important;
              }
              .expiry-detail-modal::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 3px !important;
              }
              .expiry-detail-modal::-webkit-scrollbar-thumb:hover {
                background: #94a3b8 !important;
              }
            `}</style>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedExpiryItem.type === 'Document' ? '📄 Document Approval Details' : (selectedExpiryItem.type === 'Gauge' ? '📐 Gauge Details' : '📏 Instrument Calibration Details')}
              </h3>
              <button className="modal-close" onClick={handleCloseExpiryDetailModal}>×</button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '24px' }}>
              <div className="view-details-grid">
                
                {/* General Information */}
                {/* General Information */}
                <div className="detail-section" style={{ borderLeft: '4px solid #dc2626', background: '#fef2f2' }}>
                  <h4 className="detail-section-title" style={{ color: '#991b1b', borderColor: '#fee2e2' }}>⚠️ Expiry & Validity Information</h4>
                  <div className="expiry-detail-grid">
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value" style={{ fontWeight: '700', color: '#dc2626' }}>
                        Expiring in {getDaysUntilExpiry(selectedExpiryItem.dueDate)} Days
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Expiry / Due Date:</span>
                      <span className="detail-value" style={{ fontWeight: '600', color: '#1f2937' }}>
                        {formatDate(selectedExpiryItem.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Registry Details */}
                <div className="detail-section">
                  <h4 className="detail-section-title">Record Details</h4>
                  <div className="expiry-detail-grid">
                    <div className="detail-row">
                      <span className="detail-label">
                        {selectedExpiryItem.type === 'Document' ? 'Document Type Name:' : (selectedExpiryItem.type === 'Gauge' ? 'Gauge Description:' : 'Instrument/Machine Name:')}
                      </span>
                      <span className="detail-value" style={{ fontWeight: '600', color: '#1e3a5f' }}>
                        {selectedExpiryItem.name}
                      </span>
                    </div>

                    {selectedExpiryItem.type !== 'Document' && (
                      <div className="detail-row">
                        <span className="detail-label">Make Model:</span>
                        <span className="detail-value">
                          {selectedExpiryItem.makeModel || selectedExpiryItem.make_model || 'N/A'}
                        </span>
                      </div>
                    )}

                    {selectedExpiryItem.type !== 'Document' && (
                      <div className="detail-row">
                        <span className="detail-label">
                          {selectedExpiryItem.type === 'Gauge' ? 'Product Name:' : 'Capacity / Range:'}
                        </span>
                        <span className="detail-value">
                          {selectedExpiryItem.capacity || selectedExpiryItem.capacity_range || 'N/A'}
                        </span>
                      </div>
                    )}

                    <div className="detail-row">
                      <span className="detail-label">
                        {selectedExpiryItem.type === 'Document' ? 'Document Number:' : (selectedExpiryItem.type === 'Gauge' ? 'Gauge Serial Number:' : 'Serial Number:')}
                      </span>
                      <span className="detail-value" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                        {selectedExpiryItem.serial || selectedExpiryItem.serialNumber || selectedExpiryItem.serial_number || 'N/A'}
                      </span>
                    </div>

                    <div className="detail-row full-width">
                      <span className="detail-label">Certificate / Document No:</span>
                      <span className="detail-value">
                        {selectedExpiryItem.calibrationCertificateNo || selectedExpiryItem.calibration_certificate_no || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accreditation & Lab */}
                <div className="detail-section">
                  <h4 className="detail-section-title">Calibration / Authority Info</h4>
                  <div className="expiry-detail-grid">
                    <div className="detail-row">
                      <span className="detail-label">
                        {selectedExpiryItem.type === 'Document' ? 'Issue Date:' : 'Calibration Date:'}
                      </span>
                      <span className="detail-value">
                        {formatDate(selectedExpiryItem.calibrationDate || selectedExpiryItem.calibration_date || selectedExpiryItem.date_of_issue)}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">
                        {selectedExpiryItem.type === 'Document' ? 'Approving Authority:' : 'Calibrated By Laboratory:'}
                      </span>
                      <span className="detail-value">
                        {selectedExpiryItem.certifyingLabName || selectedExpiryItem.certifying_lab_name || selectedExpiryItem.approving_authority || 'N/A'}
                      </span>
                    </div>

                    {selectedExpiryItem.type !== 'Document' && (
                      <div className="detail-row full-width">
                        <span className="detail-label">Master Equipment: NABL Details:</span>
                        <span className="detail-value">
                          {selectedExpiryItem.masterEquipNablDetails || selectedExpiryItem.master_equip_nabl_details || 'N/A'}
                        </span>
                      </div>
                    )}

                    {selectedExpiryItem.type !== 'Document' && (
                      <div className="detail-row full-width">
                        <span className="detail-label">Master Equipment: Description, Lab ID No. , Calibration Certificate No, Validity UP to:</span>
                        <span className="detail-value">
                          {selectedExpiryItem.masterEquipNoCertValidity || selectedExpiryItem.master_equip_no_cert_validity || 'N/A'}
                        </span>
                      </div>
                    )}

                    <div className="detail-row">
                      <span className="detail-label">Notification Days:</span>
                      <span className="detail-value">
                        {selectedExpiryItem.notificationDays || selectedExpiryItem.notification_days || 30} Days prior
                      </span>
                    </div>

                    {selectedExpiryItem.usedFor && (
                      <div className="detail-row">
                        <span className="detail-label">Inspection Stages Used For:</span>
                        <span className="detail-value">
                          {Array.isArray(selectedExpiryItem.usedFor) 
                            ? selectedExpiryItem.usedFor.join(', ') 
                            : String(selectedExpiryItem.usedFor).split(',').join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificate File */}
                {selectedExpiryItem.certificateFilePath && (
                  <div className="detail-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderLeft: '4px solid #2563eb' }}>
                    <div>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>📄 Calibration Certificate / File</h5>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>Click to view the uploaded proof document</span>
                    </div>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        const url = vendorCalibrationService.getFileUrl(selectedExpiryItem.certificateFilePath);
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      View Certificate
                    </button>
                  </div>
                )}

              </div>
            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  handleCloseExpiryDetailModal();
                  handleOpenInstrumentModal(selectedExpiryItem);
                }}
              >
                ✏️ Edit Record
              </button>
              <button className="btn btn-outline" onClick={handleCloseExpiryDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ RAISE / MODIFY INSPECTION REQUEST MODAL ============ */}
      {isInspectionModalOpen && (
        <div className="modal-overlay">
          <div className="modal raise-inspection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={isModifyMode ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)' } : (isViewOnlyMode ? { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' } : {})}>
              <h3 className="modal-title">
                {isViewOnlyMode ? `🔍 View Inspection Call Details — ${modifyingCall?.call_no}` : (isModifyMode ? `✏️ Modify Inspection Call — ${modifyingCall?.call_no}` : 'Raise Inspection Request')}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseInspectionModal}>×</button>
            </div>
            <div className="modal-body">
              {isModifyMode && modifyingCall && (
                <div className="inspection-modal-info" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', marginBottom: 16 }}>
                  <div className="inspection-info-row">
                    <span className="info-label">⚠️ Modify Mode:</span>
                    <span className="info-value" style={{ color: '#92400e', fontWeight: 600 }}>
                      You are editing Call No: {modifyingCall.call_no}. Only changed fields will be updated.
                    </span>
                  </div>
                  <div className="inspection-info-row">
                    <span className="info-label">Stage:</span>
                    <span className="info-value">{modifyingCall.stage}</span>
                  </div>
                  <div className="inspection-info-row">
                    <span className="info-label">PO Number:</span>
                    <span className="info-value">{modifyingCall.po_no}</span>
                  </div>
                  <div className="inspection-info-row">
                    <span className="info-label">Current Status:</span>
                    <span className="info-value">{modifyingCall.status}</span>
                  </div>
                </div>
              )}
              {isViewOnlyMode && modifyingCall && (
                <div className="inspection-modal-info" style={{ background: '#dbeafe', borderLeft: '4px solid #3b82f6', marginBottom: 16 }}>
                  <div className="inspection-info-row">
                    <span className="info-label">🔍 View Mode:</span>
                    <span className="info-value" style={{ color: '#1e3a8a', fontWeight: 600 }}>
                      You are viewing details of Call No: {modifyingCall.call_no}. Form is read-only.
                    </span>
                  </div>
                  <div className="inspection-info-row">
                    <span className="info-label">Stage:</span>
                    <span className="info-value">{modifyingCall.stage}</span>
                  </div>
                  <div className="inspection-info-row">
                    <span className="info-label">PO Number:</span>
                    <span className="info-value">{modifyingCall.po_no}</span>
                  </div>
                  <div className="inspection-info-row">
                    <span className="info-label">Current Status:</span>
                    <span className="info-value">{modifyingCall.status}</span>
                  </div>
                </div>
              )}
              {!isModifyMode && selectedPOItem && (
                <div className="inspection-modal-info">
                  <div className="inspection-info-row">
                    <span className="info-label">PO Number:</span>
                    <span className="info-value">{selectedPOItem.po?.po_no}</span>
                  </div>
                  <div className="inspection-info-row">
                    <span className="info-label">Item:</span>
                    <span className="info-value">{selectedPOItem.item?.item_name}</span>
                  </div>
                  <div className="inspection-info-row">
                    <span className="info-label">Quantity:</span>
                    <span className="info-value">{selectedPOItem.item?.item_qty} {selectedPOItem.item?.item_unit}</span>
                  </div>
                  {selectedPOItem.subPO && (
                    <div className="inspection-info-row">
                      <span className="info-label">Selected Sub PO:</span>
                      <span className="info-value">{selectedPOItem.subPO.sub_po_number} - {selectedPOItem.subPO.raw_material_name}</span>
                    </div>
                  )}
                </div>
              )}
              <RaiseInspectionCallForm
                selectedPO={selectedPOItem?.po}
                selectedItem={selectedPOItem?.item}
                selectedSubPO={selectedPOItem?.subPO}
                inventoryEntries={inventoryEntries}
                availableHeatNumbers={availableHeatNumbers}
                vendorId={currentUser.id}
                onSubmit={isViewOnlyMode ? handleCloseInspectionModal : (isModifyMode ? handleSubmitModifyRequest : handleSubmitInspectionRequest)}
                isLoading={isLoading}
                isModifyMode={isModifyMode}
                isViewMode={isViewOnlyMode}
              />
            </div>
          </div>
        </div>
      )}


      {/* ============ ADD SUB PO MODAL ============ */}
      {isAddSubPOModalOpen && (
        <div className="modal-overlay" onClick={handleCloseAddSubPOModal}>
          <div className="modal raise-inspection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Sub PO</h3>
              <button className="modal-close-btn" onClick={handleCloseAddSubPOModal}>×</button>
            </div>
            <div className="modal-body">
              <AddSubPOForm
                selectedPO={selectedSubPOItem?.po}
                selectedItem={selectedSubPOItem?.item}
                onSubmit={handleSubmitSubPO}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============ VIEW FULL INSPECTION CALL DETAILS MODAL ============ */}
      {isCallDetailsModalOpen && selectedCall && (
        <div className="modal-overlay" onClick={handleCloseCallDetailsModal}>
          <div className="modal call-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Full Inspection Call Details</h3>
              <button className="modal-close-btn" onClick={handleCloseCallDetailsModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="call-details-grid">
                <div className="call-detail-section">
                  <h4 className="call-detail-section-title">Call Information</h4>
                  <div className="call-detail-row">
                    <span className="detail-label">Call No:</span>
                    <span className="detail-value">{selectedCall.call_no}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">PO No:</span>
                    <span className="detail-value">{selectedCall.po_no}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Item Name:</span>
                    <span className="detail-value">{selectedCall.item_name}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Stage:</span>
                    <span className="detail-value">{selectedCall.stage}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Call Date:</span>
                    <span className="detail-value">{formatDate(selectedCall.call_date)}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Quantity Offered:</span>
                    <span className="detail-value">{selectedCall.quantity_offered}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{selectedCall.location}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value"><StatusBadge status={selectedCall.status} /></span>
                  </div>
                </div>

                {selectedCall.inspection_details && (
                  <div className="call-detail-section">
                    <h4 className="call-detail-section-title">Inspection Details</h4>
                    <div className="call-detail-row">
                      <span className="detail-label">Inspector Name:</span>
                      <span className="detail-value">{selectedCall.inspection_details.inspector_name}</span>
                    </div>
                    <div className="call-detail-row">
                      <span className="detail-label">Inspection Date:</span>
                      <span className="detail-value">{formatDate(selectedCall.inspection_details.inspection_date)}</span>
                    </div>
                    <div className="call-detail-row">
                      <span className="detail-label">Remarks:</span>
                      <span className="detail-value">{selectedCall.inspection_details.remarks}</span>
                    </div>
                    <div className="call-detail-row">
                      <span className="detail-label">Documents:</span>
                      <span className="detail-value">
                        {selectedCall.inspection_details.documents?.map((doc, idx) => (
                          <span key={idx} className="document-tag">{doc}</span>
                        ))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ UPDATE RECTIFICATION DETAILS MODAL ============ */}
      {isRectificationModalOpen && selectedCall && (
        <div className="modal-overlay" onClick={handleCloseRectificationModal}>
          <div className="modal rectification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Update Rectification Details</h3>
              <button className="modal-close-btn" onClick={handleCloseRectificationModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="inspection-modal-info" style={{ marginBottom: '20px' }}>
                <div className="inspection-info-row">
                  <span className="info-label">Call No:</span>
                  <span className="info-value">{selectedCall.call_no}</span>
                </div>
                <div className="inspection-info-row">
                  <span className="info-label">Item:</span>
                  <span className="info-value">{selectedCall.item_name}</span>
                </div>
                <div className="inspection-info-row">
                  <span className="info-label">Status:</span>
                  <span className="info-value"><StatusBadge status={selectedCall.status} /></span>
                </div>
              </div>

              {selectedCall.rectification_details ? (
                <div className="rectification-current">
                  <h4 className="rectification-section-title">Current Rectification Details</h4>
                  <div className="call-detail-row">
                    <span className="detail-label">Issue Description:</span>
                    <span className="detail-value">{selectedCall.rectification_details.issue_description}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Rectification Action:</span>
                    <span className="detail-value">{selectedCall.rectification_details.rectification_action}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Target Date:</span>
                    <span className="detail-value">{formatDate(selectedCall.rectification_details.target_date)}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value"><StatusBadge status={selectedCall.rectification_details.status} /></span>
                  </div>
                </div>
              ) : (
                <div className="no-rectification-info">
                  <p>No rectification has been requested for this inspection call.</p>
                </div>
              )}

              <form className="rectification-form">
                <h4 className="rectification-section-title">
                  {selectedCall.rectification_details ? 'Update Rectification' : 'Submit Rectification Response'}
                </h4>
                <div className="form-group">
                  <label className="form-label">Rectification Action Taken</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Describe the rectification action taken..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Completion Date</label>
                  <input type="date" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Supporting Documents</label>
                  <input type="file" className="form-control" multiple />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCloseRectificationModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      showNotification('Rectification details updated successfully!', 'success');
                      handleCloseRectificationModal();
                    }}
                  >
                    Submit Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============ VIEW FULL INSPECTION SUMMARY MODAL ============ */}
      {isInspectionSummaryModalOpen && selectedCompletedCall && (
        <div className="modal-overlay" onClick={handleCloseInspectionSummaryModal}>
          <div className="modal inspection-summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Full Inspection Summary</h3>
              <button className="modal-close-btn" onClick={handleCloseInspectionSummaryModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="call-details-grid">
                {/* Call Basic Information */}
                <div className="call-detail-section">
                  <h4 className="call-detail-section-title">Inspection Call Information</h4>
                  <div className="call-detail-row">
                    <span className="detail-label">Call No:</span>
                    <span className="detail-value">{selectedCompletedCall.call_no}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">PO No:</span>
                    <span className="detail-value">{selectedCompletedCall.po_no}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Item Name:</span>
                    <span className="detail-value">{selectedCompletedCall.item_name}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Stage:</span>
                    <span className="detail-value">{selectedCompletedCall.stage}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">Completion Date:</span>
                    <span className="detail-value">{formatDate(selectedCompletedCall.completion_date)}</span>
                  </div>
                  <div className="call-detail-row">
                    <span className="detail-label">IC Number:</span>
                    <span className="detail-value">{selectedCompletedCall.ic_number}</span>
                  </div>
                </div>

                {/* Quantity Details */}
                <div className="call-detail-section">
                  <h4 className="call-detail-section-title">Quantity Details</h4>
                  <div className="quantity-summary-grid">
                    <div className="quantity-card">
                      <span className="quantity-label">Qty Offered</span>
                      <span className="quantity-value">{selectedCompletedCall.quantity_offered}</span>
                    </div>
                    <div className="quantity-card accepted">
                      <span className="quantity-label">Qty Accepted</span>
                      <span className="quantity-value">{selectedCompletedCall.quantity_accepted}</span>
                    </div>
                    <div className="quantity-card rejected">
                      <span className="quantity-label">Qty Rejected</span>
                      <span className="quantity-value">{selectedCompletedCall.quantity_rejected || 0}</span>
                    </div>
                    <div className="quantity-card status">
                      <span className="quantity-label">Status</span>
                      <StatusBadge status={selectedCompletedCall.status} />
                    </div>
                  </div>
                </div>

                {/* Inspection Summary */}
                {selectedCompletedCall.inspection_summary && (
                  <div className="call-detail-section">
                    <h4 className="call-detail-section-title">Inspection Details</h4>
                    <div className="call-detail-row">
                      <span className="detail-label">Inspector Name:</span>
                      <span className="detail-value">{selectedCompletedCall.inspection_summary.inspector_name}</span>
                    </div>
                    <div className="call-detail-row">
                      <span className="detail-label">Inspection Date:</span>
                      <span className="detail-value">{formatDate(selectedCompletedCall.inspection_summary.inspection_date)}</span>
                    </div>
                    <div className="call-detail-row">
                      <span className="detail-label">Acceptance Criteria:</span>
                      <span className="detail-value">{selectedCompletedCall.inspection_summary.acceptance_criteria}</span>
                    </div>
                    <div className="call-detail-row">
                      <span className="detail-label">Test Results:</span>
                      <span className="detail-value">{selectedCompletedCall.inspection_summary.test_results}</span>
                    </div>
                    <div className="call-detail-row">
                      <span className="detail-label">IE Remarks:</span>
                      <span className="detail-value ie-remarks">{selectedCompletedCall.inspection_summary.ie_remarks}</span>
                    </div>
                    <div className="call-detail-row">
                      <span className="detail-label">Final Decision:</span>
                      <span className="detail-value final-decision">{selectedCompletedCall.inspection_summary.final_decision}</span>
                    </div>
                  </div>
                )}

                {/* Supporting Documents */}
                <div className="call-detail-section">
                  <h4 className="call-detail-section-title">Supporting Documents</h4>
                  <div className="documents-list">
                    {selectedCompletedCall.documents?.map((doc, idx) => (
                      <span key={idx} className="document-tag clickable">
                        📄 {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ REQUEST IC CORRECTION MODAL ============ */}
      {isICCorrectionModalOpen && selectedCompletedCall && (
        <div className="modal-overlay" onClick={handleCloseICCorrectionModal}>
          <div className="modal ic-correction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Request IC Correction</h3>
              <button className="modal-close-btn" onClick={handleCloseICCorrectionModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="inspection-modal-info" style={{ marginBottom: '20px' }}>
                <div className="inspection-info-row">
                  <span className="info-label">IC Number:</span>
                  <span className="info-value">{selectedCompletedCall.ic_number}</span>
                </div>
                <div className="inspection-info-row">
                  <span className="info-label">Call No:</span>
                  <span className="info-value">{selectedCompletedCall.call_no}</span>
                </div>
                <div className="inspection-info-row">
                  <span className="info-label">Item:</span>
                  <span className="info-value">{selectedCompletedCall.item_name}</span>
                </div>
                <div className="inspection-info-row">
                  <span className="info-label">Status:</span>
                  <span className="info-value"><StatusBadge status={selectedCompletedCall.status} /></span>
                </div>
              </div>

              <div className="ic-correction-note">
                <p>
                  <strong>Note:</strong> IC Correction requests are reviewed by the respective RIO.
                  Please provide accurate details about the error and the required correction.
                </p>
              </div>

              <form className="ic-correction-form">
                <div className="form-group">
                  <label className="form-label">Type of Error</label>
                  <select className="form-control">
                    <option value="">Select Error Type</option>
                    <option value="clerical">Clerical Error</option>
                    <option value="quantity">Quantity Mismatch</option>
                    <option value="date">Date Error</option>
                    <option value="spelling">Spelling/Name Error</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Error Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Describe the error in the IC..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Correct Information</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Provide the correct information that should appear in the IC..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Supporting Evidence (if any)</label>
                  <input type="file" className="form-control" multiple />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCloseICCorrectionModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`IC Correction request submitted for ${selectedCompletedCall.ic_number}. It will be reviewed by the RIO.`);
                      handleCloseICCorrectionModal();
                    }}
                  >
                    Submit Correction Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============ WORKFLOW TRANSITION HISTORY MODAL ============ */}
      {isTransitionHistoryModalOpen && selectedIcForHistory && (
        <div className="modal-overlay" onClick={handleCloseTransitionHistoryModal}>
          <div className="modal workflow-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Workflow Transition History</h3>
              <button className="modal-close-btn" onClick={handleCloseTransitionHistoryModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="inspection-modal-info" style={{ marginBottom: '20px' }}>
                <div className="inspection-info-row">
                  <span className="info-label">Call No:</span>
                  <span className="info-value">{selectedIcForHistory.call_no}</span>
                </div>
                <div className="inspection-info-row">
                  <span className="info-label">IC Number:</span>
                  <span className="info-value">{selectedIcForHistory.ic_number || 'Pending'}</span>
                </div>
                <div className="inspection-info-row">
                  <span className="info-label">Current Status:</span>
                  <span className="info-value">
                    <StatusBadge status={selectedIcForHistory.status} />
                  </span>
                </div>
              </div>

              {/* Loading State */}
              {workflowLoading.transitionHistory && (
                <div className="workflow-loading">
                  <p>Loading transition history...</p>
                </div>
              )}

              {/* Error State */}
              {workflowErrors.transitionHistory && (
                <div className="workflow-error">
                  <p>Error: {workflowErrors.transitionHistory}</p>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      clearError('transitionHistory');
                      handleViewTransitionHistory(selectedIcForHistory);
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Transition History Timeline */}
              {!workflowLoading.transitionHistory && !workflowErrors.transitionHistory && (
                <div className="workflow-timeline">
                  <h4 className="timeline-title">Transition Timeline</h4>
                  {transitionHistory.length > 0 ? (
                    <div className="timeline-container">
                      {transitionHistory.map((transition, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-marker"></div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="timeline-action">{transition.action}</span>
                              <span className="timeline-date">
                                {formatDate(transition.timestamp || transition.createdAt)}
                              </span>
                            </div>
                            <div className="timeline-details">
                              <span className="timeline-user">By: {transition.performedBy || transition.userName}</span>
                              <span className="timeline-role">Role: {transition.roleName}</span>
                            </div>
                            {transition.remarks && (
                              <div className="timeline-remarks">
                                <span>Remarks: {transition.remarks}</span>
                              </div>
                            )}
                            <div className="timeline-status-change">
                              <span className="from-status">{transition.fromStatus}</span>
                              <span className="status-arrow">→</span>
                              <span className="to-status">{transition.toStatus}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="timeline-empty">
                      <p>No transition history available yet.</p>
                      <p className="timeline-empty-hint">
                        Workflow history will appear here once actions are performed on this inspection call.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseTransitionHistoryModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ INSPECTION CALL ACTIONS POPUP MODAL ============ */}
      {isActionsModalOpen && selectedCallForActions && (() => {
        const row = selectedCallForActions;
        const workflowRequiredStatuses = [
          'Call assigned to IE',
          'Call Scheduled by IE',
          'Under Inspection',
          'Call Withheld',
          'Inspection Completed & Pending for IC Issuance'
        ];
        const needsWorkflow = workflowRequiredStatuses.includes(row.status);
        const isAllowed = ALLOWED_ACTION_STATUSES.includes(row.status);
        const isScheduled = row.status === 'IE_SCHEDULED' || row.status === 'VERIFY_PO_DETAILS' || row.status === 'Call Scheduled by IE' || (row.status && row.status.toLowerCase().includes('scheduled'));

        return (
          <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)' }} onClick={() => {
            setIsActionsModalOpen(false);
            setSelectedCallForActions(null);
          }}>
            <div className="modal actions-popup-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', borderRadius: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
              <div className="modal-header" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', borderLeft: '4px solid #3b82f6' }}>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '18px', fontWeight: '700', color: '#1e3a5f', margin: 0 }}>
                    Inspection Call Control Panel
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Quick actions and documentation utility for this inspection request.
                  </p>
                </div>
                <button className="modal-close-btn" style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => {
                  setIsActionsModalOpen(false);
                  setSelectedCallForActions(null);
                }}>
                  <svg style={{ width: '12px', height: '12px', color: '#64748b' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div className="modal-body" style={{ padding: '24px' }}>
                {/* Details section */}
                <div className="actions-modal-details-card" style={{
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px 20px'
                  }}>
                    {/* Call No */}
                    <div>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        <svg style={{ width: '12px', height: '12px', marginRight: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
                        Call No
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', wordBreak: 'break-all' }}>{row.call_no}</span>
                    </div>

                    {/* Desired Date */}
                    <div>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        <svg style={{ width: '12px', height: '12px', marginRight: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Desired Date
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{formatDate(row.desiredInspectionDate || row.call_date)}</span>
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        <svg style={{ width: '12px', height: '12px', marginRight: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Status
                      </span>
                      <div style={{ marginTop: '2px' }}>
                        <StatusBadge status={row.status} />
                      </div>
                    </div>

                    {/* Qty Offered */}
                    <div>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        <svg style={{ width: '12px', height: '12px', marginRight: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><polygon points="12 22.08 12 12 3 6.92 3 17 12 22.08"></polygon><polygon points="12 22.08 12 12 21 6.92 21 17 12 22.08"></polygon><polygon points="12 12 3 6.92 12 1.84 21 6.92 12 12"></polygon><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        Qty Offered
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                        {row.quantity_offered} {row.uom || row.unit || ''}
                      </span>
                    </div>

                    {/* IE Assigned */}
                    <div>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        <svg style={{ width: '12px', height: '12px', marginRight: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        IE Assigned
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{row.ieName || 'Not Assigned'}</span>
                    </div>

                    {/* Stage */}
                    <div>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        <svg style={{ width: '12px', height: '12px', marginRight: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        Stage
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{row.stage || 'N/A'}</span>
                    </div>

                    {/* Divider line spanning all columns */}
                    <div style={{ gridColumn: 'span 3', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />

                    {/* PO / SR. NO. */}
                    <div style={{ gridColumn: 'span 1' }}>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        <svg style={{ width: '12px', height: '12px', marginRight: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        PO / Sr. No.
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                        {row.rlyShortName || ''} / {row.po_no || ''} / {cleanSerialNo(row.poSerialNo)}
                      </span>
                    </div>

                    {/* IC No. (if present) */}
                    {row.ic_number ? (
                      <>
                        <div style={{ gridColumn: 'span 1' }}>
                          <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            <svg style={{ width: '12px', height: '12px', marginRight: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                            IC No.
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{row.ic_number}</span>
                        </div>
                        <div style={{ gridColumn: 'span 1' }}>
                          <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            <svg style={{ width: '12px', height: '12px', marginRight: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            Detail of Call
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                            {(() => {
                              let details = `${row.ercType || row.item_name || ''}`;
                              if (row.stage === 'Raw Material' && row.noOfHeatsRM) details += ` - ${row.noOfHeatsRM} Heats`;
                              if (row.stage === 'Process' && row.lotNoProcess) details += ` - Lot: ${row.lotNoProcess}`;
                              if (row.stage === 'Final' && row.lotNoFinal) details += ` - Lot: ${row.lotNoFinal}`;
                              return details;
                            })()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                          <svg style={{ width: '12px', height: '12px', marginRight: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                          Detail of Inspection Call
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                          {(() => {
                            let details = `${row.ercType || row.item_name || ''}`;
                            if (row.stage === 'Raw Material' && row.noOfHeatsRM) details += ` - ${row.noOfHeatsRM} Heats`;
                            if (row.stage === 'Process' && row.lotNoProcess) details += ` - Lot: ${row.lotNoProcess}`;
                            if (row.stage === 'Final' && row.lotNoFinal) details += ` - Lot: ${row.lotNoFinal}`;
                            return details;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions grid */}
                <h4 style={{ margin: '0 0 14px 0', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: '14px', height: '14px', marginRight: '6px', color: '#64748b' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  Available Operations
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  {/* Action 1: View details */}
                  <button
                    onClick={() => {
                      setIsActionsModalOpen(false);
                      setSelectedCallForActions(null);
                      handleViewCallDetails(row);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderLeft: '4px solid #3b82f6',
                      borderRadius: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      flexShrink: 0
                    }}>
                      <VisibilityIcon style={{ fontSize: '20px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '650', color: '#1e293b' }}>View Details</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Review submitted form details</div>
                    </div>
                  </button>

                  {/* Action 2: Download Call Letter */}
                  <button
                    onClick={() => {
                      setIsActionsModalOpen(false);
                      setSelectedCallForActions(null);
                      handleDownloadCallLetter(row);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderLeft: '4px solid #10b981',
                      borderRadius: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#10b981';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(16, 185, 129, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#ecfdf5',
                      color: '#059669',
                      flexShrink: 0
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '650', color: '#1e293b' }}>Call Letter</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Download official letter PDF</div>
                    </div>
                  </button>

                  {/* Action 3: Modify Call */}
                  <button
                    disabled={!isAllowed}
                    onClick={() => {
                      setIsActionsModalOpen(false);
                      setSelectedCallForActions(null);
                      if (needsWorkflow) {
                        showNotification(`Workflow Required: Modifying call ${row.call_no} requires approval.`, 'info');
                      }
                      handleModifyCall(row);
                    }}
                    title={!isAllowed ? `Action Restricted: Modify is not allowed for status "${row.status}"` : (needsWorkflow ? "Modify Call (Requires Workflow Approval)" : "Modify Call")}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: isAllowed ? '#ffffff' : '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderLeft: isAllowed ? '4px solid #f59e0b' : '4px solid #cbd5e1',
                      borderRadius: '12px',
                      textAlign: 'left',
                      cursor: isAllowed ? 'pointer' : 'not-allowed',
                      opacity: isAllowed ? 1 : 0.65,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      if (isAllowed) {
                        e.currentTarget.style.borderColor = '#f59e0b';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(245, 158, 11, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isAllowed) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: isAllowed ? '#fffbeb' : '#f1f5f9',
                      color: isAllowed ? '#d97706' : '#94a3b8',
                      flexShrink: 0
                    }}>
                      <EditIcon style={{ fontSize: '18px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '650', color: isAllowed ? '#1e293b' : '#94a3b8' }}>
                        Modify Call
                        {!isAllowed && (
                          <svg style={{ width: '12px', height: '12px', marginLeft: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {!isAllowed ? "Restricted for current status" : "Update inspection call parameters"}
                      </div>
                    </div>
                  </button>

                  {/* Action 4: Withdraw Call */}
                  <button
                    disabled={!isAllowed || isScheduled}
                    onClick={() => {
                      setIsActionsModalOpen(false);
                      setSelectedCallForActions(null);
                      if (needsWorkflow) {
                        showNotification(`Workflow Required: Withdrawing call ${row.call_no} requires approval.`, 'info');
                      }
                      handleWithdrawCall(row);
                    }}
                    title={isScheduled ? "Action Restricted: Withdraw is not allowed for scheduled calls" : (!isAllowed ? `Action Restricted: Withdraw is not allowed for status "${row.status}"` : (needsWorkflow ? "Withdraw Call (Requires Workflow Approval)" : "Withdraw Call"))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: (isAllowed && !isScheduled) ? '#ffffff' : '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderLeft: (isAllowed && !isScheduled) ? '4px solid #ef4444' : '4px solid #cbd5e1',
                      borderRadius: '12px',
                      textAlign: 'left',
                      cursor: (isAllowed && !isScheduled) ? 'pointer' : 'not-allowed',
                      opacity: (isAllowed && !isScheduled) ? 1 : 0.65,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      if (isAllowed && !isScheduled) {
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(239, 68, 68, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isAllowed && !isScheduled) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: (isAllowed && !isScheduled) ? '#fef2f2' : '#f1f5f9',
                      color: (isAllowed && !isScheduled) ? '#dc2626' : '#94a3b8',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '650', color: (isAllowed && !isScheduled) ? '#dc2626' : '#94a3b8' }}>
                        Withdraw Call
                        {(!isAllowed || isScheduled) && (
                          <svg style={{ width: '12px', height: '12px', marginLeft: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {isScheduled ? "Restricted for scheduled calls" : !isAllowed ? "Restricted for current status" : "Cancel inspection request"}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ COMPLETED INSPECTION CALL ACTIONS POPUP MODAL ============ */}
      {isCompletedActionsModalOpen && selectedCompletedCallForActions && (() => {
        const call = selectedCompletedCallForActions;
        const matchingPO = findMatchingPO(call.po_no || call.poNo);

        const ActionCard = ({ title, icon, onClick, colors }) => (
          <button
            onClick={onClick}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
              padding: '24px 16px', background: `linear-gradient(135deg, ${colors.bg1} 0%, ${colors.bg2} 100%)`,
              border: `1px solid ${colors.border}`, borderRadius: '16px',
              cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              flex: 1, minWidth: '100px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 10px 25px -5px ${colors.shadow1}, 0 8px 10px -6px ${colors.shadow2}`;
              e.currentTarget.style.background = `linear-gradient(135deg, ${colors.bg2} 0%, ${colors.border} 100%)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = `linear-gradient(135deg, ${colors.bg1} 0%, ${colors.bg2} 100%)`;
            }}
          >
            <div style={{
              background: 'white', padding: '12px', borderRadius: '50%',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: colors.iconColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {icon}
            </div>
            <span style={{ fontWeight: '700', color: colors.textColor, fontSize: '14px', textAlign: 'center' }}>
              {title}
            </span>
          </button>
        );

        return (
          <div className="modal-overlay" onClick={() => {
            setIsCompletedActionsModalOpen(false);
            setSelectedCompletedCallForActions(null);
          }} style={{ zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                maxWidth: '960px', 
                width: '95%', 
                borderRadius: '16px', 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                backgroundColor: '#ffffff'
              }}
            >
              <div className="modal-header" style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#0ea5e9' }}>📋</span> Inspection Call Details - <span style={{ color: '#334155' }}>{call.call_no || call.callNumber}</span>
                </h2>
                <button 
                  className="modal-close" 
                  onClick={() => {
                    setIsCompletedActionsModalOpen(false);
                    setSelectedCompletedCallForActions(null);
                  }}
                  style={{
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%',
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease', color: '#64748b', fontSize: '1.2rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >×</button>
              </div>

              <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto', padding: '32px 24px' }}>
                <div style={{ 
                  background: 'linear-gradient(to right, #ffffff, #f8fafc)', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  borderLeft: '4px solid #0ea5e9', 
                  marginBottom: '32px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Call Number</label>
                      <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{call.call_no || '-'}</div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>PO Number</label>
                      <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{call.po_no || '-'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Completion Date</label>
                      <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{formatDate(call.completion_date)}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Status</label>
                      <div style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                        {call.workflowStatus ? call.workflowStatus.replace(/_/g, ' ') : '-'}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700', marginBottom: '4px', display: 'block' }}>Qty Offered / Accepted</label>
                      <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{call.quantity_offered || '-'} / {call.quantity_accepted || '-'}</div>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#3b82f6' }}>⚡</span> Actions & Documents
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                  <ActionCard 
                    title="PO & MA"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                    colors={{ bg1: '#faf5ff', bg2: '#f3e8ff', border: '#e9d5ff', iconColor: '#a855f7', textColor: '#9333ea', shadow1: 'rgba(168, 85, 247, 0.2)', shadow2: 'rgba(168, 85, 247, 0.1)' }}
                    onClick={() => {
                      if (matchingPO && matchingPO.pdfPath) {
                        downloadPoDoc(matchingPO.pdfPath, call.po_no);
                      } else {
                        showNotification('PO document not found for this call.', 'warning');
                      }
                    }}
                  />
                  {call.stage === 'Raw Material' && (
                    <ActionCard 
                      title="Heat Details"
                      icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
                      colors={{ bg1: '#fffbeb', bg2: '#fef3c7', border: '#fde68a', iconColor: '#f59e0b', textColor: '#d97706', shadow1: 'rgba(245, 158, 11, 0.2)', shadow2: 'rgba(245, 158, 11, 0.1)' }}
                      onClick={() => handleOpenHeatDetails(call)}
                    />
                  )}
                  {['INSPECTION_COMPLETE_CONFIRM', 'GENERATE_IC'].includes(call.workflowStatus) && (
                    <>
                      <ActionCard 
                        title="Annexures"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                        colors={{ bg1: '#eef2ff', bg2: '#e0e7ff', border: '#c7d2fe', iconColor: '#6366f1', textColor: '#4f46e5', shadow1: 'rgba(99, 102, 241, 0.2)', shadow2: 'rgba(99, 102, 241, 0.1)' }}
                        onClick={() => {
                          setSelectedCallForAnnexure(call);
                          setIsCompletedActionsModalOpen(false);
                          setSelectedCompletedCallForActions(null);
                        }}
                      />
                      <ActionCard 
                        title="Call Letter"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
                        colors={{ bg1: '#ecfeff', bg2: '#cffafe', border: '#a5f3fc', iconColor: '#06b6d4', textColor: '#0891b2', shadow1: 'rgba(6, 182, 212, 0.2)', shadow2: 'rgba(6, 182, 212, 0.1)' }}
                        onClick={() => handleDownloadCallLetter(call)}
                      />
                    </>
                  )}
                  {call.workflowStatus === 'WITHDRAW' && (
                    <ActionCard 
                      title="Call Details"
                      icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
                      colors={{ bg1: '#fff1f2', bg2: '#ffe4e6', border: '#fecdd3', iconColor: '#f43f5e', textColor: '#e11d48', shadow1: 'rgba(244, 63, 94, 0.2)', shadow2: 'rgba(244, 63, 94, 0.1)' }}
                      onClick={() => {
                        setSelectedCallForActions(call);
                        setIsActionsModalOpen(true);
                        setIsCompletedActionsModalOpen(false);
                        setSelectedCompletedCallForActions(null);
                      }}
                    />
                  )}
                  {call.workflowStatus === 'DSC_SIGN_IC' && (
                    <>
                      <ActionCard 
                        title="Call Letter"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
                        colors={{ bg1: '#ecfeff', bg2: '#cffafe', border: '#a5f3fc', iconColor: '#06b6d4', textColor: '#0891b2', shadow1: 'rgba(6, 182, 212, 0.2)', shadow2: 'rgba(6, 182, 212, 0.1)' }}
                        onClick={() => handleDownloadCallLetter(call)}
                      />
                      <ActionCard 
                        title="IC"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                        colors={{ bg1: '#ecfdf5', bg2: '#d1fae5', border: '#a7f3d0', iconColor: '#10b981', textColor: '#059669', shadow1: 'rgba(16, 185, 129, 0.2)', shadow2: 'rgba(16, 185, 129, 0.1)' }}
                        onClick={() => handleDownloadIC(call)}
                      />
                      <ActionCard 
                        title="Annexure I"
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                        colors={{ bg1: '#eef2ff', bg2: '#e0e7ff', border: '#c7d2fe', iconColor: '#6366f1', textColor: '#4f46e5', shadow1: 'rgba(99, 102, 241, 0.2)', shadow2: 'rgba(99, 102, 241, 0.1)' }}
                        onClick={() => {
                          setSelectedCallForAnnexure(call);
                          setIsCompletedActionsModalOpen(false);
                          setSelectedCompletedCallForActions(null);
                        }}
                      />
                    </>
                  )}
                  <ActionCard 
                    title="Download All"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
                    colors={{ bg1: '#f0fdf4', bg2: '#dcfce7', border: '#bbf7d0', iconColor: '#22c55e', textColor: '#16a34a', shadow1: 'rgba(34, 197, 94, 0.2)', shadow2: 'rgba(34, 197, 94, 0.1)' }}
                    onClick={() => handleDownloadAllDocs(call)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* ============ WITHDRAW INSPECTION CALL MODAL ============ */}
      {isWithdrawModalOpen && selectedCallForWithdraw && (
        <div className="modal-overlay" onClick={handleCloseWithdrawModal}>
          <div className="modal withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Withdraw Inspection Call</h3>
              <button className="modal-close-btn" onClick={handleCloseWithdrawModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="inspection-modal-info" style={{ marginBottom: '20px' }}>
                <div className="inspection-info-row">
                  <span className="info-label">Call No:</span>
                  <span className="info-value">{selectedCallForWithdraw.call_no}</span>
                </div>
                <div className="inspection-info-row">
                  <span className="info-label">PO No:</span>
                  <span className="info-value">{selectedCallForWithdraw.po_no}</span>
                </div>
                <div className="inspection-info-row">
                  <span className="info-label">Item:</span>
                  <span className="info-value">{selectedCallForWithdraw.item_name}</span>
                </div>
                <div className="inspection-info-row">
                  <span className="info-label">Status:</span>
                  <span className="info-value"><StatusBadge status={selectedCallForWithdraw.status} /></span>
                </div>
              </div>

              <div className="alert alert-warning" style={{ marginBottom: '20px', fontSize: '14px' }}>
                <strong>Attention:</strong> Withdrawing this inspection call will cancel the request and restore any allocated inventory. This action cannot be undone.
              </div>

              <div className="form-group">
                <label className="form-label">Withdrawal Remarks <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={withdrawRemarks}
                  onChange={(e) => setWithdrawRemarks(e.target.value)}
                  placeholder="Please provide a reason for withdrawing this inspection call..."
                  required
                />
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseWithdrawModal}
                  disabled={withdrawing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleWithdrawSubmit}
                  disabled={withdrawing || !withdrawRemarks.trim()}
                  style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}
                >
                  {withdrawing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Withdrawing...
                    </>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Inventory Entry Modal */}
      <ViewInventoryEntryModal
        isOpen={isViewInventoryModalOpen}
        onClose={handleCloseViewInventoryModal}
        entryId={selectedInventoryEntry?.id}
        onEdit={handleEditInventoryEntry}
        onDelete={handleDeleteInventoryEntry}
        onRefresh={() => {
          // Refresh inventory list after successful operations
          console.log('Refreshing inventory list...');
        }}
      />

      {/* Add/Edit Inventory Entry Modal */}
      <div className="inventory-modal-wrapper">
        <Modal
          isOpen={isInventoryModalOpen}
          onClose={() => {
            setIsInventoryModalOpen(false);
            setEditingInventoryEntry(null);
          }}
          title={editingInventoryEntry ? 'Edit Inventory Entry' : 'Add New Inventory Entry'}
        >
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderLeft: '4px solid #3b82f6', borderRadius: '6px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#1e3a5f', fontWeight: 500 }}>
              {editingInventoryEntry
                ? `Updating entry for Heat Number: ${editingInventoryEntry.heatNumber}`
                : 'Fill in the details below to register a new raw material/inventory entry.'
              }
            </p>
          </div>
          <NewInventoryEntryForm
            inventoryEntries={inventoryEntries}
            editData={editingInventoryEntry}
            onCancel={() => {
              setIsInventoryModalOpen(false);
              setEditingInventoryEntry(null);
            }}
            onSubmit={async (data) => {
              const success = await handleInventorySubmit(data);
              if (success) {
                setIsInventoryModalOpen(false);
                setEditingInventoryEntry(null);
                fetchInventoryEntries(); // refresh inventory list from database
              }
            }}
            isLoading={isLoading}
          />
        </Modal>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={handleCloseDeleteConfirmModal}
        onConfirm={handleConfirmDelete}
        entry={selectedInventoryEntry}
        isDeleting={isDeletingEntry}
      />

      {/* ============ MASTER ENTRY MODALS ============ */}

      {/* View Master Entry Modal */}
      <ViewMasterEntryModal
        isOpen={isViewMasterModalOpen}
        entry={selectedMasterEntry}
        onClose={handleCloseMasterModal}
      />

      {/* Delete Master Entry Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteMasterConfirmOpen}
        onClose={handleCancelDeleteMaster}
        onConfirm={handleConfirmDeleteMaster}
        entry={masterToDelete}
        isDeleting={false}
        title="Delete Master Entry"
        message={`Are you sure you want to delete the master entry for ${masterToDelete?.company_name} - ${masterToDelete?.unit_name}?`}
      />

      {/* Global Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: 'error' })}
        autoClose={true}
        autoCloseDelay={5000}
      />

      {/* IMMS PO Sync Modal */}
      <SyncPOModal
        isOpen={isSyncPOModalOpen}
        onClose={() => setIsSyncPOModalOpen(false)}
        onSuccess={() => {
          showNotification('POs synchronized successfully!', 'success');
          fetchPOAssignedData(); // Refresh the PO list
        }}
      />
      {/* --- Heat Details Modal --- */}

      {isPoItemHeatDetailsModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px',
            width: '100%', maxWidth: '800px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#f8fafc', borderRadius: '16px 16px 0 0'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>PO Item Heat Details - {selectedPoSrNoForHeatDetails}</h3>
              </div>
              <button
                onClick={() => setIsPoItemHeatDetailsModalOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px', borderRadius: '50%', color: '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1 }}>&times;</span>
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {isFetchingHeatDetails ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  Loading heat details...
                </div>
              ) : poItemHeatDetailsData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  No heat details found for this PO item.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <table className="table table-hover mb-0" style={{ backgroundColor: '#ffffff', margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderTop: 'none' }}>Call No</th>
                        <th style={{ backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderTop: 'none' }}>Heat No</th>
                        <th style={{ backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderTop: 'none' }}>TC No</th>
                        <th style={{ backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', borderTop: 'none' }}>Offered Qty (MT)</th>
                        <th style={{ backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', borderTop: 'none' }}>Accepted Qty (MT)</th>
                        <th style={{ backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', borderTop: 'none' }}>Rejected Qty (MT)</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderTop: 'none' }}>
                      {poItemHeatDetailsData.map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', whiteSpace: 'nowrap' }}>{item.callNo || '-'}</td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>{item.heatNo || '-'}</td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>{item.tcNo || '-'}</td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', textAlign: 'right' }}>{item.offeredQty != null ? item.offeredQty.toFixed(4) : '0.0000'}</td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#10b981', textAlign: 'right' }}>{item.weightAcceptedMt != null ? item.weightAcceptedMt.toFixed(4) : (item.acceptedQty != null ? item.acceptedQty.toFixed(4) : '0.0000')}</td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#ef4444', textAlign: 'right' }}>{item.weightRejectedMt != null ? item.weightRejectedMt.toFixed(4) : (item.rejectedQty != null ? item.rejectedQty.toFixed(4) : '0.0000')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isHeatDetailsModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px',
            width: '100%', maxWidth: '800px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#f8fafc', borderRadius: '16px 16px 0 0'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Heat Details</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Quantities and results for each heat number</p>
              </div>
              <button
                onClick={() => setIsHeatDetailsModalOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px', borderRadius: '50%', color: '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {isFetchingHeatDetails ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>Fetching heat details...</p>
                </div>
              ) : heatDetailsData.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>No heat details found for this call.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>Heat No.</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>TC No.</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>Offered Qty(MT)</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>Accepted Qty(MT)</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>Rejected Qty(MT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatDetailsData.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '500' }}>{item.heatNo || 'N/A'}</td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{item.tcNo || 'N/A'}</td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{item.offeredQty || 0}</td>
                          <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: '500' }}>{item.weightAcceptedMt || 0}</td>
                          <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: '500' }}>{item.weightRejectedMt || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{
              padding: '16px 24px', borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end',
              borderRadius: '0 0 16px 16px'
            }}>
              <button
                onClick={() => setIsHeatDetailsModalOpen(false)}
                style={{
                  padding: '10px 20px', backgroundColor: '#e2e8f0', color: '#334155',
                  border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#cbd5e1'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboardPage;
