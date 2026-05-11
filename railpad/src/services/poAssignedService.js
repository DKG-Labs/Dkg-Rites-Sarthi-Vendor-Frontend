import { API_CONFIG } from './config.js';

const poAssignedService = {
  getPoAssigned: async (vendorId = null, vendorType = 'RAILPAD') => {
    try {
      const endpoint = vendorId
        ? `${API_CONFIG.PO_ASSIGNED}?vendorId=${vendorId}&vendorType=${vendorType}`
        : `${API_CONFIG.PO_ASSIGNED}?vendorType=${vendorType}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch PO assigned data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching PO assigned data:', error);
      throw error;
    }
  },

  getPoCount: async (vendorId, vendorType = 'RAILPAD') => {
    try {
      const endpoint = `${API_CONFIG.PO_ASSIGNED}/count?vendorId=${vendorId}&vendorType=${vendorType}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch PO count');
      const data = await response.json();
      return data.responseData;
    } catch (error) {
      console.error('Error fetching PO count:', error);
      throw error;
    }
  }
};

export default poAssignedService;
