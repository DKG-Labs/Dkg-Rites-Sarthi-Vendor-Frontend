// src/pages/VendorDashboardPage.js
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Tabs from '../components/Tabs';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { InstrumentForm, ApprovalForm, GaugeForm } from '../components/CalibrationForms';
import { PaymentForm } from '../components/PaymentForm';
import RaiseInspectionCallForm from '../components/RaiseInspectionCallForm';
import { MasterUpdatingForm } from '../components/MasterUpdatingForm';
import NewInventoryEntryForm from '../components/NewInventoryEntryForm';
import AddSubPOForm from '../components/AddSubPOForm';
import ViewInventoryEntryModal from '../components/ViewInventoryEntryModal';
import ViewMasterEntryModal from '../components/ViewMasterEntryModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import Notification from '../components/Notification';
import SyncPOModal from '../components/common/SyncPOModal';
import {
  // VENDOR_PO_LIST,
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
import { getBaseUrl } from '../services/apiConfig';
import useVendorWorkflow from '../hooks/useVendorWorkflow';
import inspectionCallService from '../services/inspectionCallService';
import poAssignedService from '../services/poAssignedService';
import inventoryService from '../services/inventoryService';
import '../styles/vendorDashboard.css';
import { getStoredUser } from '../services/authService';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
// import VendorFeedback from '../components/Feedback/VendorFeedback';

const ALLOWED_ACTION_STATUSES = ['VERIFY_PO_DETAILS', 'Created', 'CALL_REGISTERED', 'IE_SCHEDULED', 'Call Withheld', 'RETURNED', 'Returned by Call Desk'];

const cleanSerialNo = (serial) => {
  if (!serial) return '';
  const parts = String(serial).split('/');
  return parts[parts.length - 1].trim();
};

const VendorDashboardPage = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('po-assigned');
  const [viewingPdfUrl, setViewingPdfUrl] = useState(null);

  useEffect(() => {
    setViewingPdfUrl(null);
  }, [activeTab]);

  // Modal states for Calibration forms
  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isGaugeModalOpen, setIsGaugeModalOpen] = useState(false);

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

  // State for approved RM ICs per PO
  const [approvedRMICsByPO, setApprovedRMICsByPO] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [loadingRMICs, setLoadingRMICs] = useState({});

  // Expanded Inspection Call rows state (for Requested Calls tab)
  // eslint-disable-next-line no-unused-vars
  const [expandedCallRows, setExpandedCallRows] = useState({});

  // Modals for Inspection Call Details and Rectification
  const [isCallDetailsModalOpen, setIsCallDetailsModalOpen] = useState(false);
  const [isRectificationModalOpen, setIsRectificationModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);

  // Expanded Completed Call rows state
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

  // Payment filter state
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [showOldApproved, setShowOldApproved] = useState(false);
  const [selectedPaymentCall, setSelectedPaymentCall] = useState(null);

  // Data state (for future API integration - currently using mock data)
  const [instrumentItems, setInstrumentItems] = useState(VENDOR_CALIBRATION_ITEMS);
  const [approvalItems, setApprovalItems] = useState(VENDOR_APPROVAL_ITEMS);
  const [gaugeItems, setGaugeItems] = useState(VENDOR_GAUGE_ITEMS);
  const [paymentItems, setPaymentItems] = useState(VENDOR_PAYMENT_ITEMS);
  const [subPOList, setSubPOList] = useState(VENDOR_SUB_PO_LIST);
  // const [inventoryEntries, setInventoryEntries] = useState(VENDOR_INVENTORY_ENTRIES);
  const [inventoryEntries, setInventoryEntries] = useState([]);
  const [availableHeatNumbers] = useState([]); // Used in RaiseInspectionCallForm props

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

  // Requested Calls data state - using real API
  const [requestedCalls, setRequestedCalls] = useState([]);
  const [loadingRequestedCalls, setLoadingRequestedCalls] = useState(false);
  const [requestedCallsError, setRequestedCallsError] = useState(null);

  // Completed Calls data state - also derived from the same API
  const [completedCalls, setCompletedCalls] = useState([]);
  const [loadingCompletedCalls, setLoadingCompletedCalls] = useState(false);
  const [completedCallsError, setCompletedCallsError] = useState(null);

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
        setPoAssignedList([]);
      }
    } catch (error) {
      console.error('Error fetching PO assigned data:', error);
      setPoDataError(error.message || 'Error fetching PO data');
      // Fallback to mock data
      setPoAssignedList([]);
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
          // FIX: Use nullish coalescing (??) instead of || to handle 0 correctly
          // When qtyLeftForInspection is 0 (exhausted), it should display 0, not fall back to tcQuantity
          qtyLeftForInspection: entry.qtyLeftForInspection !== null && entry.qtyLeftForInspection !== undefined ? entry.qtyLeftForInspection : entry.tcQuantity,
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
          quantity_accepted: (call.workflowStatus === 'WITHDRAW' ? 0 : call.quantityOffered) || 0,
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

        // Dynamically categorize calls based on workflowStatus
        // workflowStatus === 'WITHDRAW' or 'INSPECTION_COMPLETE_CONFIRM' -> Completed
        const active = transformedCalls.filter(call =>
          call.workflowStatus !== 'WITHDRAW' &&
          call.workflowStatus !== 'INSPECTION_COMPLETE_CONFIRM'
        );

        const completed = transformedCalls.filter(call =>
          call.workflowStatus === 'WITHDRAW' ||
          call.workflowStatus === 'INSPECTION_COMPLETE_CONFIRM'
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

    // Calculate instrument compliance per category
    const instrumentCompliance = productRequirements.instruments.map(req => {
      const matchingItems = instrumentItems.filter(i => i.instrument_name === req.category);
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
      const matchingItems = approvalItems.filter(a => a.approval_document_name === req.category);
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
      const matchingItems = gaugeItems.filter(g => g.gauge_description === req.category);
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
    const totalExpired = allCategories.reduce((sum, c) => sum + c.expiredCount, 0);
    const totalExpiring = allCategories.reduce((sum, c) => sum + c.expiringCount, 0);

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
  }, [complianceStatus]);

  // Edit state (null means add new, object means edit existing)
  const [editingInstrument, setEditingInstrument] = useState(null);
  const [editingApproval, setEditingApproval] = useState(null);
  const [editingGauge, setEditingGauge] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

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

  const handleSubmitInstrument = async (data) => {
    setIsLoading(true);
    try {
      // TODO: Replace with API call
      // await api.createInstrument(data) or await api.updateInstrument(data.id, data)

      if (editingInstrument) {
        // Update existing
        setInstrumentItems(prev =>
          prev.map(item => item.id === editingInstrument.id ? { ...data, id: item.id } : item)
        );
      } else {
        // Add new
        const newId = Math.max(...instrumentItems.map(i => i.id), 0) + 1;
        setInstrumentItems(prev => [...prev, { ...data, id: newId }]);
      }
      handleCloseInstrumentModal();
    } catch (error) {
      console.error('Error saving instrument:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  // ============ APPROVAL HANDLERS ============
  const handleOpenApprovalModal = (approval = null) => {
    setEditingApproval(approval);
    setIsApprovalModalOpen(true);
  };

  const handleCloseApprovalModal = () => {
    setIsApprovalModalOpen(false);
    setEditingApproval(null);
  };

  const handleSubmitApproval = async (data) => {
    setIsLoading(true);
    try {
      // TODO: Replace with API call
      if (editingApproval) {
        setApprovalItems(prev =>
          prev.map(item => item.id === editingApproval.id ? { ...data, id: item.id } : item)
        );
      } else {
        const newId = Math.max(...approvalItems.map(i => i.id), 0) + 1;
        setApprovalItems(prev => [...prev, { ...data, id: newId }]);
      }
      handleCloseApprovalModal();
    } catch (error) {
      console.error('Error saving approval:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ GAUGE HANDLERS ============
  const handleOpenGaugeModal = (gauge = null) => {
    setEditingGauge(gauge);
    setIsGaugeModalOpen(true);
  };

  const handleCloseGaugeModal = () => {
    setIsGaugeModalOpen(false);
    setEditingGauge(null);
  };

  const handleSubmitGauge = async (data) => {
    setIsLoading(true);
    try {
      // TODO: Replace with API call
      if (editingGauge) {
        setGaugeItems(prev =>
          prev.map(item => item.id === editingGauge.id ? { ...data, id: item.id } : item)
        );
      } else {
        const newId = Math.max(...gaugeItems.map(i => i.id), 0) + 1;
        setGaugeItems(prev => [...prev, { ...data, id: newId }]);
      }
      handleCloseGaugeModal();
    } catch (error) {
      console.error('Error saving gauge:', error);
    } finally {
      setIsLoading(false);
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

    // Fetch approved RM ICs when expanding a PO
    if (isExpanding) {
      const po = poAssignedList.find(p => p.id === poId);
      if (po && !approvedRMICsByPO[po.po_no]) {
        setLoadingRMICs(prev => ({ ...prev, [po.po_no]: true }));
        try {
          const response = await inspectionCallService.getApprovedRMICsWithHeatDetails(po.po_no);
          if (response.success) {
            const data = Array.isArray(response.data) ? response.data : [];
            setApprovedRMICsByPO(prev => ({
              ...prev,
              [po.po_no]: data
            }));
          } else {
            setApprovedRMICsByPO(prev => ({
              ...prev,
              [po.po_no]: []
            }));
          }
        } catch (error) {
          console.error('Error fetching approved RM ICs:', error);
          setApprovedRMICsByPO(prev => ({
            ...prev,
            [po.po_no]: []
          }));
        } finally {
          setLoadingRMICs(prev => ({ ...prev, [po.po_no]: false }));
        }
      }
    }
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
      }

      // Show user-friendly error message
      setNotification({
        message: `❌ Failed to raise inspection call\n\n${errorMessage}${errorDetails}`,
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

        const rmFields = {
          totalOfferedQtyMt: parseFloat(data.rm_total_offered_qty_mt) || null,
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
      setNotification({
        message: `❌ Failed to modify inspection call: ${error.message || 'Unknown error'}`,
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

    // Scroll to the inventory form section
    setTimeout(() => {
      const formSection = document.querySelector('.inventory-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
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
  const handleOpenInspectionSummaryModal = (call) => {
    setSelectedCompletedCall(call);
    setIsInspectionSummaryModalOpen(true);
  };

  const handleCloseInspectionSummaryModal = () => {
    setIsInspectionSummaryModalOpen(false);
    setSelectedCompletedCall(null);
  };

  // Download IC handler
  const handleDownloadIC = (call) => {
    console.log('Downloading IC for:', call.ic_number);
    showNotification(`Downloading Inspection Certificate: ${call.ic_number}\nFor Call: ${call.call_no}`, 'info');
  };

  // Download Call Letter handler
  const handleDownloadCallLetter = async (call) => {
    if (!call?.call_no) {
      showNotification('Call ID not found. Cannot generate PDF.', 'error');
      return;
    }
    showNotification('Fetching call letter details...', 'info');
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
      
      generateCallLetterPDF(enrichedCall);
      showNotification('Call Letter PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to generate Call Letter PDF:', err);
      showNotification('Failed to fetch call letter details. Please try again.', 'error');
    }
  };

  // Download Inspection Documents handler
  const handleDownloadInspectionDocuments = (call) => {
    console.log('Downloading inspection documents for:', call.call_no);
    showNotification(`Downloading Inspection Documents for ${call.call_no}:\n- ${call.documents?.join('\n- ') || 'No documents available'}`, 'info');
  };

  // Request IC Correction modal handlers
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
    }
    // {
    //   id: 'feedback-system',
    //   label: 'Feedback',
    //   description: 'Send feedback to Railway Board'
    // }
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

  // eslint-disable-next-line no-unused-vars
  const handleModifyCall = async (call) => {
    // Fetch full IC details to pre-fill the form
    showNotification(`Fetching details for Call: ${call.call_no}...`, 'info');
    try {
      let prefilledData = null;
      const matchingPO = poAssignedList.find(p => p.po_no === (call.po_no || call.poNo));
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
      const matchingPO = poAssignedList.find(p => p.po_no === (call.po_no || call.poNo));
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
    { key: 'description', label: 'Vendor Name', width: '220px' },
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
      label: 'PO/ Sr. No.',
      width: '190px',
      render: (_, row) => `${row.rlyShortName} / ${row.po_no} / ${cleanSerialNo(row.poSerialNo)}`
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
      render: (val, row) => (
        <div>
          <StatusBadge status={val} />
          {val === 'SCHEDULED' && row.scheduledDate && (
            <div style={{ fontSize: '11px', marginTop: '4px', color: '#666' }}>
              Scheduled: {formatDate(row.scheduledDate)}
            </div>
          )}
        </div>
      )
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
    { key: 'po_no', label: 'PO No.', width: '150px' },
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
      render: (value) => <StatusBadge status={value} />
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
      const searchLower = requestedCallsSearchTerm.toLowerCase();
      result = result.filter(call => {
        return (
          (call.call_no && call.call_no.toLowerCase().includes(searchLower)) ||
          (call.po_no && call.po_no.toLowerCase().includes(searchLower)) ||
          (call.item_name && call.item_name.toLowerCase().includes(searchLower)) ||
          (call.stage && call.stage.toLowerCase().includes(searchLower)) ||
          (call.quantity_offered && String(call.quantity_offered).toLowerCase().includes(searchLower)) ||
          (call.location && call.location.toLowerCase().includes(searchLower)) ||
          (call.status && call.status.toLowerCase().includes(searchLower))
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
      const searchLower = completedCallsSearchTerm.toLowerCase();
      result = result.filter(call => {
        return (
          (call.call_no && call.call_no.toLowerCase().includes(searchLower)) ||
          (call.po_no && call.po_no.toLowerCase().includes(searchLower)) ||
          (call.item_name && call.item_name.toLowerCase().includes(searchLower)) ||
          (call.stage && call.stage.toLowerCase().includes(searchLower)) ||
          (call.quantity_offered && String(call.quantity_offered).toLowerCase().includes(searchLower)) ||
          (call.status && call.status.toLowerCase().includes(searchLower)) ||
          (call.ic_number && call.ic_number.toLowerCase().includes(searchLower)) ||
          (call.completion_date && call.completion_date.toLowerCase().includes(searchLower))
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

    const sortColumn = poItemsSortColumn[poId];
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

  // Updated column definitions with expiry highlighting
  const calibrationInstrumentColumns = [
    { key: 'instrument_name', label: 'Instrument / Machine Name' },
    { key: 'capacity_range', label: 'Capacity / Range' },
    { key: 'serial_number', label: 'Serial No.' },
    { key: 'calibration_certificate_no', label: 'Certificate No.' },
    {
      key: 'calibration_date',
      label: 'Calibration Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'calibration_due_date',
      label: 'Due Date',
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
    { key: 'certifying_lab_name', label: 'Certifying Lab' },
    { key: 'accreditation_agency', label: 'Agency' },
    {
      key: 'calibration_status',
      label: 'Status',
      render: (_, row) => {
        const computedStatus = getCalibrationStatus(row.calibration_due_date, row.notification_days || 30);
        return <StatusBadge status={computedStatus} />;
      }
    }
  ];

  const approvalsColumns = [
    { key: 'approval_document_name', label: 'Document Name' },
    { key: 'document_number', label: 'Document No.' },
    { key: 'approving_authority', label: 'Approving Authority' },
    {
      key: 'date_of_issue',
      label: 'Issue Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'valid_till',
      label: 'Valid Till',
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
    { key: 'notification_days', label: 'Notification Days' },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const computedStatus = getCalibrationStatus(row.valid_till, row.notification_days || 30);
        return <StatusBadge status={computedStatus} />;
      }
    }
  ];

  const gaugesColumns = [
    { key: 'gauge_description', label: 'Gauge Description' },
    { key: 'product_name', label: 'Product' },
    { key: 'gauge_sr_no', label: 'Gauge Sr. No.' },
    { key: 'calibration_certificate_no', label: 'Certificate No.' },
    {
      key: 'calibration_date',
      label: 'Calibration Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'calibration_due_date',
      label: 'Due Date',
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
    { key: 'certifying_lab_name', label: 'Certifying Lab' },
    { key: 'accreditation_agency', label: 'Agency' },
    {
      key: 'calibration_status',
      label: 'Status',
      render: (_, row) => {
        const computedStatus = getCalibrationStatus(row.calibration_due_date, row.notification_days || 30);
        return <StatusBadge status={computedStatus} />;
      }
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
          {row.tcFilePath && (
            <button
              className="btn btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                const url = inventoryService.getFileUrl(row.tcFilePath);
                if (url) window.open(url, '_blank');
              }}
              title="View TC Document"
              style={{
                backgroundColor: '#10b981',
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
              <span role="img" aria-label="pdf">📄</span>
              TC PDF
            </button>
          )}
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

  return (
    <div className="page-container vendor-page">
      {/* Breadcrumb */}
      <div className="vendor-breadcrumb">
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item breadcrumb-active">Vendor Dashboard</span>
      </div>

      {/* Header */}
      <div className="vendor-page-header">
        <div>
          <div className="vendor-page-title">Vendor Dashboard</div>
          <div className="vendor-page-subtitle">
            All vendor-facing actions as per Vendor Module sheet (POs, Calls, Calibration, Payments, Masters).
          </div>
        </div>
        {onBack && (
          <button className="rm-back-button" onClick={onBack}>
            ← Back to Landing Page
          </button>
        )}
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
                    src={viewingPdfUrl}
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
                    sync PO
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
                          {sortedPOAssigned.length === 0 ? (
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
                                                style={{ cursor: 'pointer', userSelect: 'none' }}
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
                                                      <td>{item.item_name}</td>
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
                      {filteredAndSortedRequestedCalls.length === 0 ? (
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
                      {paginatedCompletedCalls.length === 0 ? (
                        <tr>
                          <td colSpan={completedColumns.length} style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                            No completed inspection calls found.
                          </td>
                        </tr>
                      ) : (
                        paginatedCompletedCalls.map((call) => (
                          <React.Fragment key={call.id}>
                            {/* Completed Call Row */}
                            <tr
                              className={`completed-call-row ${expandedCompletedRows[call.id] ? 'expanded' : ''}`}
                              onClick={() => toggleCompletedRow(call.id)}
                              style={{ cursor: 'pointer' }}
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
                            {/* Expanded Actions Row */}
                            {expandedCompletedRows[call.id] && (
                              <tr className="completed-actions-row">
                                <td colSpan={completedColumns.length}>
                                  <div className="completed-actions-container">
                                    <button
                                      className="btn btn-sm btn-outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenInspectionSummaryModal(call);
                                      }}
                                    >
                                      View Full Inspection Summary
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadCallLetter(call);
                                      }}
                                    >
                                      Download Call Letter
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadIC(call);
                                      }}
                                    >
                                      Download Inspection Certificate (IC)
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadInspectionDocuments(call);
                                      }}
                                    >
                                      Download Inspection Documents
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenICCorrectionModal(call);
                                      }}
                                    >
                                      Request IC Correction
                                    </button>
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
            <>
              <div className="vendor-section-header">
                <div>
                  <h3 className="vendor-section-header-title">
                    Calibration &amp; Approval Records Management
                  </h3>
                  {/* <p className="vendor-section-header-desc">
                    Manage calibration and approval documents for {VENDOR_PRODUCT_TYPE}. Compliance status controls inspection call eligibility.
                  </p> */}
                </div>
              </div>

              {/* Full Calibration View with All Items */}
              <>
                {/* Overall Compliance Status Banner */}
                {/* <div className={`compliance-banner compliance-${overallCompliance.status.toLowerCase().replace(' ', '-')}`}>
                    <div className="compliance-banner-content">
                      <div className="compliance-status-icon">
                        {overallCompliance.status === 'Compliant' && '✓'}
                        {overallCompliance.status === 'Partially Compliant' && '⚠'}
                        {overallCompliance.status === 'Non-Compliant' && '✗'}
                      </div>
                      <div className="compliance-status-info">
                        <h4 className="compliance-status-title">
                          Inspection Call Eligibility: {overallCompliance.canRaiseInspectionCall ? 'Eligible' : 'Blocked'}
                        </h4>
                        <p className="compliance-status-message">{overallCompliance.message}</p>
                      </div>
                    </div>
                    <div className="compliance-stats">
                      {overallCompliance.totalExpired > 0 && (
                        <span className="compliance-stat expired">
                          {overallCompliance.totalExpired} Expired
                        </span>
                      )}
                      {overallCompliance.totalExpiring > 0 && (
                        <span className="compliance-stat expiring">
                          {overallCompliance.totalExpiring} Expiring Soon
                        </span>
                      )}
                    </div>
                  </div> */}

                {/* Expiry Reminders Section */}
                {overallCompliance.totalExpiring > 0 && (
                  <div className="expiry-reminders-section">
                    <h4 className="expiry-reminders-title">⏰ Upcoming Expiry Reminders</h4>
                    <div className="expiry-reminders-list">
                      {[
                        ...instrumentItems.filter(i => {
                          const days = getDaysUntilExpiry(i.calibration_due_date);
                          return days >= 0 && days <= (i.notification_days || 30);
                        }).map(i => ({ type: 'Instrument', name: i.instrument_name, serial: i.serial_number, dueDate: i.calibration_due_date })),
                        ...approvalItems.filter(a => {
                          const days = getDaysUntilExpiry(a.valid_till);
                          return days >= 0 && days <= (a.notification_days || 30);
                        }).map(a => ({ type: 'Approval', name: a.approval_document_name, serial: a.document_number, dueDate: a.valid_till })),
                        ...gaugeItems.filter(g => {
                          const days = getDaysUntilExpiry(g.calibration_due_date);
                          return days >= 0 && days <= (g.notification_days || 30);
                        }).map(g => ({ type: 'Gauge', name: g.gauge_description, serial: g.gauge_sr_no, dueDate: g.calibration_due_date }))
                      ].map((item, idx) => (
                        <div key={idx} className="expiry-reminder-item">
                          <span className="expiry-reminder-type">{item.type}</span>
                          <span className="expiry-reminder-name">{item.name} ({item.serial})</span>
                          <span className="expiry-reminder-days">
                            {getDaysUntilExpiry(item.dueDate)} days left
                          </span>
                          <span className="expiry-reminder-date">Due: {formatDate(item.dueDate)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Title */}
                <div className="calibration-section-title">
                  {/* <h4>Required Documents & Equipment for {VENDOR_PRODUCT_TYPE}</h4> */}
                  <p>All instruments, approvals, and gauges with calibration and validity details</p>
                </div>

                {/* ========== INSTRUMENTS SECTION ========== */}
                <div className="calibration-full-section">
                  <div className="calibration-section-header">
                    <div className="calibration-section-header-left">
                      <h4 className="calibration-section-heading">📏 Calibration – Instruments</h4>
                      <p className="calibration-section-subtitle">Instrument / Machine calibration details with validity tracking</p>
                    </div>
                    <div className="calibration-section-header-right">
                      <span className="section-record-count">{instrumentItems.length} Total Records</span>
                      <button className="btn btn-sm btn-primary" onClick={() => handleOpenInstrumentModal()}>
                        + Add Instrument
                      </button>
                    </div>
                  </div>

                  {/* Requirements Summary */}
                  <div className="requirements-summary-row">
                    {complianceStatus.instruments.map((cat, idx) => (
                      <div key={idx} className={`requirement-chip ${cat.status.toLowerCase().replace(' ', '-')}`}>
                        <span className="requirement-chip-name">
                          {cat.category}{cat.mandatory && <span className="mandatory-badge">*</span>}
                        </span>
                        <span className="requirement-chip-count">{cat.validCount}/{cat.minRequired}</span>
                      </div>
                    ))}
                  </div>

                  {/* Full Items Table */}
                  <DataTable
                    columns={calibrationInstrumentColumns}
                    data={instrumentItems}
                    onRowClick={(row) => handleOpenInstrumentModal(row)}
                    selectable={false}
                    selectedRows={[]}
                    onSelectionChange={() => { }}
                  />
                </div>

                {/* ========== APPROVALS SECTION ========== */}
                <div className="calibration-full-section">
                  <div className="calibration-section-header">
                    <div className="calibration-section-header-left">
                      <h4 className="calibration-section-heading">📄 Calibration – Approvals</h4>
                      <p className="calibration-section-subtitle">RDSO Approval, ISO Certificate & other mandatory documents</p>
                    </div>
                    <div className="calibration-section-header-right">
                      <span className="section-record-count">{approvalItems.length} Total Records</span>
                      <button className="btn btn-sm btn-primary" onClick={() => handleOpenApprovalModal()}>
                        + Add Approval
                      </button>
                    </div>
                  </div>

                  {/* Requirements Summary */}
                  <div className="requirements-summary-row">
                    {complianceStatus.approvals.map((cat, idx) => (
                      <div key={idx} className={`requirement-chip ${cat.status.toLowerCase().replace(' ', '-')}`}>
                        <span className="requirement-chip-name">
                          {cat.category}{cat.mandatory && <span className="mandatory-badge">*</span>}
                        </span>
                        <span className="requirement-chip-count">{cat.validCount}/{cat.minRequired}</span>
                      </div>
                    ))}
                  </div>

                  {/* Full Items Table */}
                  <DataTable
                    columns={approvalsColumns}
                    data={approvalItems}
                    onRowClick={(row) => handleOpenApprovalModal(row)}
                    selectable={false}
                    selectedRows={[]}
                    onSelectionChange={() => { }}
                  />
                </div>

                {/* ========== GAUGES SECTION ========== */}
                {complianceStatus.gauges.length > 0 && (
                  <div className="calibration-full-section">
                    <div className="calibration-section-header">
                      <div className="calibration-section-header-left">
                        <h4 className="calibration-section-heading">🔧 Calibration – Gauges</h4>
                        <p className="calibration-section-subtitle">Go/No-Go Gauges, Profile Gauges & calibration status</p>
                      </div>
                      <div className="calibration-section-header-right">
                        <span className="section-record-count">{gaugeItems.length} Total Records</span>
                        <button className="btn btn-sm btn-primary" onClick={() => handleOpenGaugeModal()}>
                          + Add Gauge
                        </button>
                      </div>
                    </div>

                    {/* Requirements Summary */}
                    <div className="requirements-summary-row">
                      {complianceStatus.gauges.map((cat, idx) => (
                        <div key={idx} className={`requirement-chip ${cat.status.toLowerCase().replace(' ', '-')}`}>
                          <span className="requirement-chip-name">
                            {cat.category}{cat.mandatory && <span className="mandatory-badge">*</span>}
                          </span>
                          <span className="requirement-chip-count">{cat.validCount}/{cat.minRequired}</span>
                        </div>
                      ))}
                    </div>

                    {/* Full Items Table */}
                    <DataTable
                      columns={gaugesColumns}
                      data={gaugeItems}
                      onRowClick={(row) => handleOpenGaugeModal(row)}
                      selectable={false}
                      selectedRows={[]}
                      onSelectionChange={() => { }}
                    />
                  </div>
                )}

                <p className="mandatory-note">
                  <span className="mandatory-badge">*</span> Mandatory categories must be complete with valid certificates to raise inspection calls.
                </p>
              </>
            </>
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
              <div className="vendor-section-header">
                <div>
                  <h3 className="vendor-section-header-title">Inventory - List of Entries</h3>
                  <p className="vendor-section-header-desc">
                    Data entered during form with Quantity Offered for Inspection and Quantity left for inspection.
                    Status: Fresh, Inspection Requested, Under Inspection, Partially Inspected, Exhausted.
                  </p>
                </div>
              </div>

              <DataTable
                columns={inventoryColumns}
                data={inventoryEntries}
                onRowClick={handleRowClick}
                selectable={false}
                selectedRows={[]}
                onSelectionChange={() => { }}
              />

              {/* New Entry Form Section */}
              <div className="inventory-form-section">
                <div className="inventory-form-header">
                  <h4 className="inventory-form-title">
                    {editingInventoryEntry ? 'Edit Inventory Entry' : 'Add New Inventory Entry'}
                  </h4>
                  <p className="inventory-form-subtitle">
                    {editingInventoryEntry
                      ? `Updating entry for Heat Number: ${editingInventoryEntry.heatNumber}`
                      : 'Fill in the details below to add a new material entry'
                    }
                  </p>
                </div>

                <NewInventoryEntryForm
                  inventoryEntries={inventoryEntries}
                  editData={editingInventoryEntry}
                  onCancel={() => setEditingInventoryEntry(null)}
                  onSubmit={handleInventorySubmit}
                  isLoading={isLoading}
                />
              </div>
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
          {/* {activeTab === 'feedback-system' && (
            <div className="feedback-module-wrapper">
              <div className="vendor-section-header">
                <div>
                  <h3 className="vendor-section-header-title">Feedback System</h3>

                </div>
              </div>
              <VendorFeedback currentUser={user} productContext="ERC Vendor" />
            </div>
          )} */}
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
        isLoading={isLoading}
      />

      {/* Approval Form Modal */}
      <ApprovalForm
        isOpen={isApprovalModalOpen}
        onClose={handleCloseApprovalModal}
        onSubmit={handleSubmitApproval}
        masterData={CALIBRATION_MASTER_DATA}
        editData={editingApproval}
        isLoading={isLoading}
      />

      {/* Gauge Form Modal */}
      <GaugeForm
        isOpen={isGaugeModalOpen}
        onClose={handleCloseGaugeModal}
        onSubmit={handleSubmitGauge}
        masterData={CALIBRATION_MASTER_DATA}
        editData={editingGauge}
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

      {/* ============ RAISE / MODIFY INSPECTION REQUEST MODAL ============ */}
      {isInspectionModalOpen && (
        <div className="modal-overlay" onClick={handleCloseInspectionModal}>
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
                    /* onClick={() => {
                      setIsActionsModalOpen(false);
                      setSelectedCallForActions(null);
                      if (needsWorkflow) {
                        showNotification(`Workflow Required: Modifying call ${row.call_no} requires approval.`, 'info');
                      }
                      handleModifyCall(row);
                    }} */
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
                    disabled={!isAllowed}
                    onClick={() => {
                      setIsActionsModalOpen(false);
                      setSelectedCallForActions(null);
                      if (needsWorkflow) {
                        showNotification(`Workflow Required: Withdrawing call ${row.call_no} requires approval.`, 'info');
                      }
                      handleWithdrawCall(row);
                    }}
                    title={!isAllowed ? `Action Restricted: Withdraw is not allowed for status "${row.status}"` : (needsWorkflow ? "Withdraw Call (Requires Workflow Approval)" : "Withdraw Call")}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: isAllowed ? '#ffffff' : '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderLeft: isAllowed ? '4px solid #ef4444' : '4px solid #cbd5e1',
                      borderRadius: '12px',
                      textAlign: 'left',
                      cursor: isAllowed ? 'pointer' : 'not-allowed',
                      opacity: isAllowed ? 1 : 0.65,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      if (isAllowed) {
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(239, 68, 68, 0.08)';
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
                      background: isAllowed ? '#fef2f2' : '#f1f5f9',
                      color: isAllowed ? '#dc2626' : '#94a3b8',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '650', color: isAllowed ? '#dc2626' : '#94a3b8' }}>
                        Withdraw Call
                        {!isAllowed && (
                          <svg style={{ width: '12px', height: '12px', marginLeft: '6px', color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {!isAllowed ? "Restricted for current status" : "Cancel inspection request"}
                      </div>
                    </div>
                  </button>
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
    </div>
  );
};

export default VendorDashboardPage;
