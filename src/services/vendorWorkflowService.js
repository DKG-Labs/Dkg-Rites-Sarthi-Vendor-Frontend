// Vendor Workflow API Service
// Handles all workflow-related API calls for Vendor module
// NOTE: VENDOR_WORKFLOW endpoints are currently commented out in apiConfig.js
// This service is disabled until backend endpoints are implemented

import { ApiError } from './httpClient';

/**
 * Vendor Workflow Service
 * Contains all workflow API methods as per the Vendor workflow specification
 */
const vendorWorkflowService = {
  /**
   * 1. Initiate Workflow
   * Called after saving inspection call data to initiate the Inspection workflow
   * DISABLED: Returns mock response until backend is implemented
   */
  initiateWorkflow: async (inspectionCallData) => {
    console.warn('Vendor workflow service is disabled - returning mock response');
    return {
      success: true,
      message: 'Workflow initiation disabled',
      data: { icId: inspectionCallData.icId }
    };
  },

  /**
   * 2. Perform Transition Action
   * DISABLED: Returns mock response until backend is implemented
   */
  performTransitionAction: async (actionData) => {
    console.warn('Vendor workflow service is disabled - returning mock response');
    return {
      success: true,
      message: 'Transition action disabled',
      data: { icId: actionData.icId, action: actionData.action }
    };
  },

  /**
   * 3. Workflow Transition History
   * DISABLED: Returns mock response until backend is implemented
   */
  // eslint-disable-next-line no-unused-vars
  getWorkflowTransitionHistory: async (icId) => {
    console.warn('Vendor workflow service is disabled - returning mock response');
    return {
      success: true,
      data: [],
      message: 'Workflow history disabled'
    };
  },

  /**
   * 4. Workflow Transitions Payment Blocked
   * DISABLED: Returns mock response until backend is implemented
   */
  // eslint-disable-next-line no-unused-vars
  getPaymentBlockedTransitions: async (filters = {}) => {
    console.warn('Vendor workflow service is disabled - returning mock response');
    return {
      success: true,
      data: [],
      message: 'Payment blocked transitions disabled'
    };
  },

  /**
   * 5. All Pending Workflow Transitions
   * DISABLED: Returns mock response until backend is implemented
   */
  // eslint-disable-next-line no-unused-vars
  getAllPendingWorkflowTransitions: async (roleName, userId = null) => {
    console.warn('Vendor workflow service is disabled - returning mock response');
    return {
      success: true,
      data: [],
      message: 'Pending workflow transitions disabled'
    };
  }
};

// Action types for performTransitionAction
export const WORKFLOW_ACTIONS = {
  VERIFY: 'VERIFY',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  HOLD: 'HOLD',
  CANCEL: 'CANCEL',
  RECTIFY: 'RECTIFY'
};

// Export ApiError for error handling in components
export { ApiError };

export default vendorWorkflowService;

