// Custom Hook for Vendor Workflow API integration
// Provides state management and API methods for workflow operations

import { useState, useCallback } from 'react';
import vendorWorkflowService, { WORKFLOW_ACTIONS, ApiError } from '../services/vendorWorkflowService';

/**
 * Custom hook for Vendor Workflow operations
 * Provides methods and state for all 5 workflow APIs
 */
const useVendorWorkflow = () => {
  // Loading states for each API
  const [loading, setLoading] = useState({
    initiateWorkflow: false,
    performAction: false,
    transitionHistory: false,
    paymentBlocked: false,
    pendingTransitions: false
  });

  // Error states
  const [errors, setErrors] = useState({
    initiateWorkflow: null,
    performAction: null,
    transitionHistory: null,
    paymentBlocked: null,
    pendingTransitions: null
  });

  // Data states
  const [transitionHistory, setTransitionHistory] = useState([]);
  const [paymentBlockedRecords, setPaymentBlockedRecords] = useState([]);
  const [pendingTransitions, setPendingTransitions] = useState([]);

  // Helper to set loading state
  const setLoadingState = (key, value) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  // Helper to set error state
  const setErrorState = (key, error) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  // Helper to clear error
  const clearError = (key) => {
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  /**
   * 1. Initiate Workflow after saving inspection call
   */
  const initiateWorkflow = useCallback(async (inspectionCallData) => {
    setLoadingState('initiateWorkflow', true);
    clearError('initiateWorkflow');

    try {
      const response = await vendorWorkflowService.initiateWorkflow(inspectionCallData);
      setLoadingState('initiateWorkflow', false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to initiate workflow';
      setErrorState('initiateWorkflow', errorMessage);
      setLoadingState('initiateWorkflow', false);
      throw error;
    }
  }, []);

  /**
   * 2. Perform Transition Action (verify, approve, reject)
   */
  const performTransitionAction = useCallback(async (actionData) => {
    setLoadingState('performAction', true);
    clearError('performAction');

    try {
      const response = await vendorWorkflowService.performTransitionAction(actionData);
      setLoadingState('performAction', false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to perform action';
      setErrorState('performAction', errorMessage);
      setLoadingState('performAction', false);
      throw error;
    }
  }, []);

  /**
   * 3. Get Workflow Transition History for an IC
   */
  const fetchTransitionHistory = useCallback(async (icId) => {
    setLoadingState('transitionHistory', true);
    clearError('transitionHistory');

    try {
      const response = await vendorWorkflowService.getWorkflowTransitionHistory(icId);
      setTransitionHistory(response.data || []);
      setLoadingState('transitionHistory', false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to fetch transition history';
      setErrorState('transitionHistory', errorMessage);
      setLoadingState('transitionHistory', false);
      throw error;
    }
  }, []);

  /**
   * 4. Get Payment Blocked Transitions
   */
  const fetchPaymentBlockedTransitions = useCallback(async (filters = {}) => {
    setLoadingState('paymentBlocked', true);
    clearError('paymentBlocked');

    try {
      const response = await vendorWorkflowService.getPaymentBlockedTransitions(filters);
      setPaymentBlockedRecords(response.data || []);
      setLoadingState('paymentBlocked', false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to fetch payment blocked records';
      setErrorState('paymentBlocked', errorMessage);
      setLoadingState('paymentBlocked', false);
      throw error;
    }
  }, []);

  /**
   * 5. Get All Pending Workflow Transitions by Role
   */
  const fetchPendingTransitions = useCallback(async (roleName, userId = null) => {
    setLoadingState('pendingTransitions', true);
    clearError('pendingTransitions');

    try {
      const response = await vendorWorkflowService.getAllPendingWorkflowTransitions(
        roleName, 
        userId
      );
      setPendingTransitions(response.data || []);
      setLoadingState('pendingTransitions', false);
      return response;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to fetch pending transitions';
      setErrorState('pendingTransitions', errorMessage);
      setLoadingState('pendingTransitions', false);
      throw error;
    }
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({
      initiateWorkflow: null,
      performAction: null,
      transitionHistory: null,
      paymentBlocked: null,
      pendingTransitions: null
    });
  }, []);

  return {
    // Loading states
    loading,
    isAnyLoading: Object.values(loading).some(Boolean),
    
    // Error states
    errors,
    clearError,
    clearAllErrors,
    
    // Data
    transitionHistory,
    paymentBlockedRecords,
    pendingTransitions,
    
    // Methods
    initiateWorkflow,
    performTransitionAction,
    fetchTransitionHistory,
    fetchPaymentBlockedTransitions,
    fetchPendingTransitions,
    
    // Constants
    WORKFLOW_ACTIONS
  };
};

export default useVendorWorkflow;

