// PO Assigned Service
// Handles API calls for PO assigned data

import httpClient from './httpClient';

/**
 * PO Assigned Service
 * Provides methods to fetch PO data from backend API
 */
const poAssignedService = {
  /**
   * Get all PO assigned data
   * @param {number|null} vendorId - Optional vendor ID to filter POs
   * @returns {Promise} API response with PO data
   */
  getPoAssigned: async (vendorId = null) => {
    try {
      const endpoint = vendorId
        ? `/vendor/po-assigned?vendorId=${vendorId}`
        : '/vendor/po-assigned';

      const response = await httpClient.get(endpoint);
      return response; // Return full response object with success and data
    } catch (error) {
      console.error('Error fetching PO assigned data:', error);
      throw error;
    }
  },

  /**
   * Get PO count for a vendor
   * @param {number} vendorId - Vendor ID
   * @returns {Promise} API response with PO count
   */
  getPoCount: async (vendorId) => {
    try {
      const endpoint = `/vendor/po-assigned/count?vendorId=${vendorId}`;
      const response = await httpClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching PO count:', error);
      throw error;
    }
  }
};

export default poAssignedService;

