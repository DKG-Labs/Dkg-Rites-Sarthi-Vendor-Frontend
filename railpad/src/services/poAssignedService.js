import { API_CONFIG, API_BASE_URL } from './config.js';

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
  },

  syncPurchaseOrders: async (date) => {
    try {
      const response = await fetch(`${API_CONFIG.SYNC}/po?date=${encodeURIComponent(date)}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to trigger PO sync');
      return await response.text();
    } catch (error) {
      console.error('Error syncing POs:', error);
      throw error;
    }
  },

  authenticateIMMS: async () => {
    try {
      const response = await fetch('/immsapi/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: "rites-sarthi",
          password: "sarTHI@@speri26"
        })
      });

      const data = await response.json();
      const token = data.token || data.jwt || data.accessToken || data.Jwt;

      if (token) {
        sessionStorage.setItem('imms_token', token);
        return token;
      }
      throw new Error('Failed to authenticate with IMMS');
    } catch (error) {
      console.error('IMMS Auth Error:', error);
      throw error;
    }
  },

  getIMMSPOData: async (payload) => {
    try {
      const token = await poAssignedService.authenticateIMMS();
      const response = await fetch('/immsapi/purchase/getPOData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error) {
      console.error('IMMS Get PO Data Error:', error);
      throw error;
    }
  },

  savePOData: async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/Vendorsync/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error) {
      console.error('Save PO Sync Error:', error);
      throw error;
    }
  },

  getRlyList: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor-plant/Rlylist`);
      if (!response.ok) throw new Error('Failed to fetch Railway list');
      const data = await response.json();
      return data.responseData || [];
    } catch (error) {
      console.error('API Error (getRlyList):', error);
      return [];
    }
  }
};

export default poAssignedService;
