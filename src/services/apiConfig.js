// API Configuration
// Base URL configuration for different environments

const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging'
};

// Get current environment - defaults to development
const getCurrentEnvironment = () => {
  return process.env.REACT_APP_ENV || ENV.DEVELOPMENT;
};

// Base URLs for different environments
const BASE_URLS = {
  [ENV.DEVELOPMENT]: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/sarthi-backend/api',
  [ENV.STAGING]: process.env.REACT_APP_API_STAGING_URL || 'https://staging-api.yourserver.com/api',
  [ENV.PRODUCTION]: process.env.REACT_APP_API_PROD_URL || 'https://api.yourserver.com/api'
};

// Get the base URL for the current environment
export const getBaseUrl = () => {
  const env = getCurrentEnvironment();
  return BASE_URLS[env] || BASE_URLS[ENV.DEVELOPMENT];
};

// API Endpoints configuration
export const API_ENDPOINTS = {
  // Vendor Workflow APIs - COMMENTED OUT (created by mistake)
  // VENDOR_WORKFLOW: {
  //   INITIATE_WORKFLOW: '/initiateWorkflow',
  //   PERFORM_TRANSITION_ACTION: '/performTransitionAction',
  //   WORKFLOW_TRANSITION_HISTORY: '/workflowTransitionHistory',
  //   WORKFLOW_TRANSITIONS_PAYMENT_BLOCKED: '/workflowTransitionsPaymentBlocked',
  //   ALL_PENDING_WORKFLOW_TRANSITION: '/allPendingWorkflowtrasition'
  // },

  // Inspection Call APIs
  INSPECTION_CALLS: {
    // Raw Material Inspection
    CREATE_RM: '/inspection-calls/raw-material',
    GET_RM_ALL: '/inspection-calls/raw-material',
    GET_RM_APPROVED: '/inspection-calls/raw-material/approved',
    GET_RM_BY_IC_NUMBER: '/inspection-calls/raw-material/:icNumber',
    GET_RM_HEAT_NUMBERS: '/inspection-calls/raw-material/:icNumber/heat-numbers',

    // Process Inspection
    CREATE_PROCESS: '/inspection-calls/process',
    GET_PROCESS_ALL: '/inspection-calls/process',
    GET_PROCESS_APPROVED: '/inspection-calls/process/approved',
    GET_PROCESS_BY_IC_NUMBER: '/inspection-calls/process/:icNumber',
    GET_PROCESS_LOT_NUMBERS: '/inspection-calls/process/:icNumber/lot-numbers',

    // Final Inspection
    CREATE_FINAL: '/inspection-calls/final',
    GET_FINAL_ALL: '/inspection-calls/final',
    GET_FINAL_BY_IC_NUMBER: '/inspection-calls/final/:icNumber',
    GET_FINAL_AVAILABLE_LOTS: '/inspection-calls/final/available-lots',

    // Common
    GET_BY_ID: '/inspection-calls/:id',
    UPDATE_STATUS: '/inspection-calls/:icNumber/status',
    GET_VENDOR_ICS: '/inspection-calls/vendor'
  },

  // Legacy Inspection APIs (kept for backward compatibility)
  INSPECTION: {
    CREATE: '/inspection/create',
    GET_BY_ID: '/inspection',
    UPDATE: '/inspection/update',
    DELETE: '/inspection/delete'
  },

  CALIBRATION: {
    GET_ALL: '/calibration/all',
    CREATE: '/calibration/create',
    UPDATE: '/calibration/update'
  },

  PAYMENT: {
    GET_ALL: '/payment/all',
    CREATE: '/payment/create',
    UPDATE: '/payment/update'
  },

  // PO Assigned APIs
  PO_ASSIGNED: {
    GET_ALL: '/vendor/po-assigned',
    GET_BY_VENDOR: '/vendor/po-assigned',
    GET_COUNT: '/vendor/po-assigned/count'
  }
};

// HTTP request timeout in milliseconds
export const REQUEST_TIMEOUT = 60000;

// Default headers for API requests
export const getDefaultHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// export default {
//   getBaseUrl,
//   API_ENDPOINTS,
//   REQUEST_TIMEOUT,
//   getDefaultHeaders
// };

