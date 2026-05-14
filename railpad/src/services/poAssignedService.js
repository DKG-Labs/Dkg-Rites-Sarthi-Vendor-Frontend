import { API_CONFIG } from './config.js';

const poAssignedService = {
  getPoAssigned: async (vendorCode, vendorType = 'Rail Pads') => {
    try {
      if (!vendorCode) throw new Error('Vendor code is required');
      
      const endpoint = `${API_CONFIG.PO_DATA}?vendorCode=${encodeURIComponent(vendorCode)}&vendorType=${encodeURIComponent(vendorType)}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch PO data');
      const data = await response.json();
      return data.responseData || data;
    } catch (error) {
      console.error('Error fetching PO data:', error);
      throw error;
    }
  },

  getPoCount: async (vendorCode, vendorType = 'Rail Pads') => {
    try {
      const data = await poAssignedService.getPoAssigned(vendorCode, vendorType);
      const list = Array.isArray(data) ? data : (data.responseData || []);
      return list.length;
    } catch (error) {
      console.error('Error fetching PO count:', error);
      return 0;
    }
  }
};

export default poAssignedService;
