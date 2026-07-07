/**
 * Status Mapper Utility
 * Maps API status values to display labels and determines available actions
 * 
 * This is a PRESENTATION LAYER utility - it does NOT modify the actual status
 * from the API response. It only maps status for display purposes.
 */

/**
 * API Status Constants (from workflow API)
 */
export const API_STATUS = {
  CALL_REGISTERED: 'CALL_REGISTERED',
  IE_SCHEDULED: 'IE_SCHEDULED',
  SCHEDULED: 'SCHEDULED',
  VERIFY_PO_DETAILS: 'VERIFY_PO_DETAILS',
  ENTER_SHIFT_DETAILS_AND_START_INSPECTION: 'ENTER_SHIFT_DETAILS_AND_START_INSPECTION',
  PAUSE_INSPECTION_RESUME_NEXT_DAY: 'PAUSE_INSPECTION_RESUME_NEXT_DAY',
  INSPECTION_PAUSED: 'INSPECTION_PAUSED',
  // Add more statuses as needed
};

/**
 * Display Status Labels
 */
export const DISPLAY_STATUS = {
  PENDING: 'Pending',
  SCHEDULED: 'Scheduled',
  UNDER_INSPECTION: 'Under Inspection',
  INSPECTION_PAUSED: 'Inspection Paused',
  // Add more display labels as needed
};

/**
 * Map API status to display label
 * @param {string} apiStatus - Status from API response
 * @returns {string} Display label for UI
 */
export const getDisplayStatus = (apiStatus) => {
  const statusMap = {
    [API_STATUS.CALL_REGISTERED]: DISPLAY_STATUS.PENDING,
    [API_STATUS.IE_SCHEDULED]: DISPLAY_STATUS.SCHEDULED,
    [API_STATUS.SCHEDULED]: DISPLAY_STATUS.SCHEDULED,
    [API_STATUS.VERIFY_PO_DETAILS]: DISPLAY_STATUS.PENDING,
    [API_STATUS.ENTER_SHIFT_DETAILS_AND_START_INSPECTION]: DISPLAY_STATUS.UNDER_INSPECTION,
    [API_STATUS.PAUSE_INSPECTION_RESUME_NEXT_DAY]: DISPLAY_STATUS.INSPECTION_PAUSED,
    [API_STATUS.INSPECTION_PAUSED]: DISPLAY_STATUS.INSPECTION_PAUSED,
  };

  const displayStatus = statusMap[apiStatus] || apiStatus;

  return displayStatus; // Fallback to original status if not mapped
};

/**
 * Get available actions for a given API status
 * @param {string} apiStatus - Status from API response
 * @returns {Array<string>} List of available actions
 */
export const getAvailableActions = (apiStatus) => {
  const actionMap = {
    [API_STATUS.CALL_REGISTERED]: ['schedule'],
    [API_STATUS.IE_SCHEDULED]: ['start', 'reschedule'],
    [API_STATUS.SCHEDULED]: ['start', 'reschedule'],
    [API_STATUS.VERIFY_PO_DETAILS]: ['resume', 'reschedule'],
    [API_STATUS.ENTER_SHIFT_DETAILS_AND_START_INSPECTION]: ['resume', 'reschedule'],
    [API_STATUS.PAUSE_INSPECTION_RESUME_NEXT_DAY]: ['enterShiftDetails'],
    [API_STATUS.INSPECTION_PAUSED]: ['enterShiftDetails'],
  };

  return actionMap[apiStatus] || [];
};

/**
 * Check if schedule date should be displayed for this status
 * @param {string} apiStatus - Status from API response
 * @returns {boolean} True if schedule date should be shown
 */
export const shouldShowScheduleDate = (apiStatus) => {
  // Show schedule date for IE_SCHEDULED, SCHEDULED, VERIFY_PO_DETAILS (Under Inspection)
  // PAUSE_INSPECTION_RESUME_NEXT_DAY (Paused inspection), and INSPECTION_PAUSED
  // because the call was scheduled before inspection started
  return apiStatus === API_STATUS.IE_SCHEDULED ||
         apiStatus === API_STATUS.SCHEDULED ||
         apiStatus === API_STATUS.VERIFY_PO_DETAILS ||
         apiStatus === API_STATUS.PAUSE_INSPECTION_RESUME_NEXT_DAY ||
         apiStatus === API_STATUS.INSPECTION_PAUSED;
};

/**
 * Get status badge color/variant for UI
 * @param {string} apiStatus - Status from API response
 * @returns {string} Color variant for badge/chip
 */
export const getStatusVariant = (apiStatus) => {
  const variantMap = {
    [API_STATUS.CALL_REGISTERED]: 'warning', // Yellow/Orange for pending
    [API_STATUS.IE_SCHEDULED]: 'info',       // Blue for scheduled
    [API_STATUS.SCHEDULED]: 'info',          // Blue for scheduled
    [API_STATUS.VERIFY_PO_DETAILS]: 'info',  // Blue for scheduled
    [API_STATUS.ENTER_SHIFT_DETAILS_AND_START_INSPECTION]: 'success', // Green for under inspection
    [API_STATUS.PAUSE_INSPECTION_RESUME_NEXT_DAY]: 'warning', // Orange for paused
    [API_STATUS.INSPECTION_PAUSED]: 'warning', // Orange for paused
  };

  return variantMap[apiStatus] || 'default';
};

/**
 * Get detailed Main Status and Sub Status based on System Status (API Status)
 * @param {string} systemStatus - Status from API response
 * @returns {Object} { mainStatus: string, subStatus: string }
 */
export const getDetailedStatus = (systemStatus) => {
  const statusLower = (systemStatus || '').toUpperCase();
  
  const mapping = {
    'CREATED': { mainStatus: 'Pending', subStatus: 'Call Raised' },
    'VERIFIED': { mainStatus: 'Pending', subStatus: 'Call Registered' },
    'RETURNED': { mainStatus: 'Pending', subStatus: 'Returned to Vendor' },
    'CALL_REGISTERED': { mainStatus: 'Pending', subStatus: 'Call Registered' },
    'IE_SCHEDULED': { mainStatus: 'Pending', subStatus: 'Call Scheduled' },
    'SCHEDULED': { mainStatus: 'Pending', subStatus: 'Call Scheduled' }, // Fallback for some frontend statuses
    'INITIATE_INSPECTION': { mainStatus: 'Pending', subStatus: 'Call Scheduled' },
    'VERIFY_PO_DETAILS': { mainStatus: 'Pending', subStatus: 'Call Scheduled' },
    'PAUSE_INSPECTION_RESUME_NEXT_DAY': { mainStatus: 'Under Inspection', subStatus: 'Paused for Next Schedule' },
    'INSPECTION_PAUSED': { mainStatus: 'Under Inspection', subStatus: 'Paused for Next Schedule' }, // Alias
    'ENTER_SHIFT_DETAILS_AND_START_INSPECTION': { mainStatus: 'Under Inspection', subStatus: 'Under inspection' },
    'INSPECTION_COMPLETE_CONFIRM': { mainStatus: 'Completed', subStatus: 'IC Issuance Pending' },
    'GENERATE_IC': { mainStatus: 'Completed', subStatus: 'IC Issued' },
    'DSC_SIGN_IC': { mainStatus: 'Completed', subStatus: 'E-Signed' },
    'CANCELLED': { mainStatus: 'Completed', subStatus: 'cancelled' },
    'WITHHELD': { mainStatus: 'Under Inspection', subStatus: 'withheld' },
    'IC_PENDING': { mainStatus: 'Completed', subStatus: 'IC Pending' }
  };

  const result = mapping[statusLower] || { mainStatus: statusLower || '-', subStatus: '-' };
  
  if (!result.subStatus || result.subStatus === '-' || result.subStatus.toLowerCase() === 'none') {
    result.combinedText = result.mainStatus;
  } else if (result.mainStatus.toLowerCase() === result.subStatus.toLowerCase()) {
    result.combinedText = result.mainStatus;
  } else {
    result.combinedText = `${result.mainStatus} - ${result.subStatus}`;
  }

  return result;
};
