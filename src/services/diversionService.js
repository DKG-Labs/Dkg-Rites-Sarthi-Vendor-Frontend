// src/services/diversionService.js
// Service for ERC Material Diversion & PO Sr. No. Reallocation in Vendor Portal

import httpClient from './httpClient';

const diversionService = {
  /**
   * Get eligible source ICs for diversion selection
   * @param {string} vendorCode
   * @param {number} plantId
   * @param {string} stage - RAW_MATERIAL, PROCESS, FINAL
   */
  getEligibleSourceIcs: async (vendorCode, plantId, stage = 'RAW_MATERIAL') => {
    try {
      const params = new URLSearchParams();
      if (vendorCode) params.append('vendorCode', vendorCode);
      if (plantId) params.append('plantId', plantId);
      if (stage) params.append('stage', stage);

      const response = await httpClient.get(`/erc/diversion/eligible-source-ics?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching eligible source ICs:', error);
      throw error;
    }
  },

  /**
   * Get line item breakdown for a source IC
   * @param {string} icNo
   * @param {string} stage
   */
  getSourceIcLineItems: async (icNo, stage = 'RAW_MATERIAL') => {
    try {
      const response = await httpClient.get(`/erc/diversion/source-ic-details?icNo=${encodeURIComponent(icNo)}&stage=${stage}`);
      return response;
    } catch (error) {
      console.error('Error fetching source IC line items:', error);
      throw error;
    }
  },

  /**
   * Save diversion request as draft
   * @param {Object} requestData
   */
  saveDraft: async (requestData) => {
    try {
      const response = await httpClient.post('/erc/diversion/save-draft', requestData);
      return response;
    } catch (error) {
      console.error('Error saving draft diversion request:', error);
      throw error;
    }
  },

  /**
   * Submit diversion request
   * @param {Object} requestData
   */
  submitRequest: async (requestData) => {
    try {
      const response = await httpClient.post('/erc/diversion/submit', requestData);
      return response;
    } catch (error) {
      console.error('Error submitting diversion request:', error);
      throw error;
    }
  },

  /**
   * Get all diversion requests for a vendor
   * @param {string} vendorCode
   * @param {string} status (optional)
   */
  getVendorRequests: async (vendorCode, status = null) => {
    try {
      const params = new URLSearchParams();
      params.append('vendorCode', vendorCode);
      if (status) params.append('status', status);

      const response = await httpClient.get(`/erc/diversion/vendor/requests?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching vendor diversion requests:', error);
      throw error;
    }
  },

  /**
   * Get diversion request details by ID
   * @param {number} id
   */
  getRequestById: async (id) => {
    try {
      const response = await httpClient.get(`/erc/diversion/request/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching diversion request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Process workflow action (Resubmit by vendor)
   * @param {Object} actionData
   */
  processWorkflowAction: async (actionData) => {
    try {
      const response = await httpClient.post('/erc/diversion/workflow/action', actionData);
      return response;
    } catch (error) {
      console.error('Error processing diversion workflow action:', error);
      throw error;
    }
  },

  /**
   * Get available basket items for raising a diverted inspection call
   * @param {string} vendorCode
   * @param {string} stage
   * @param {string} targetPoNo
   * @param {string} targetPoSrNo
   */
  getAvailableBasketItems: async (vendorCode, stage, targetPoNo, targetPoSrNo) => {
    try {
      const params = new URLSearchParams({
        vendorCode,
        stage,
        targetPoNo,
        targetPoSrNo
      });
      const response = await httpClient.get(`/erc/diversion/basket/available?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching available basket items:', error);
      throw error;
    }
  }
};

export default diversionService;
