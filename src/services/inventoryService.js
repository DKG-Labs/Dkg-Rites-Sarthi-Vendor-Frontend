// ============================================================
// INVENTORY SERVICE
// ============================================================
// Description: API service for managing inventory entries
// Handles CRUD operations for vendor inventory management
// ============================================================

import httpClient from './httpClient';
import { getStoredUser } from '../services/authService';
import { getBaseUrl } from './apiConfig';


/**
 * Inventory Service
 * Provides methods for creating and fetching inventory entries
 */
const inventoryService = {

  /**
   * Create a new inventory entry
   * @param {Object} inventoryData - Inventory entry data from form
   * @returns {Promise<Object>} - API response with created inventory entry
   */
  createInventoryEntry: async (inventoryData) => {
    const user = getStoredUser();
    try {
      console.log('📥 Inventory data received:', inventoryData);

      // Transform frontend data structure to match backend DTO
      const transformedData = {
        vendorCode: inventoryData.vendorCode || user.userName, // Default vendor code
        vendorName: inventoryData.vendorName || 'Default Vendor',
        companyId: inventoryData.companyId ? parseInt(inventoryData.companyId) : null,
        companyName: inventoryData.companyName || '',
        supplierName: inventoryData.supplierName,
        unitName: inventoryData.unitName,
        supplierAddress: inventoryData.supplierAddress || '',
        rawMaterial: inventoryData.rawMaterial,
        gradeSpecification: inventoryData.gradeSpecification,
        lengthOfBars: inventoryData.lengthOfBars ? parseFloat(inventoryData.lengthOfBars) : null,
        heatNumber: inventoryData.heatNumber,
        tcNumber: inventoryData.tcNumber,
        tcDate: inventoryData.tcDate, // Format: yyyy-MM-dd
        tcQuantity: (inventoryData.tcQuantity || inventoryData.declaredQuantity) ? parseFloat(inventoryData.tcQuantity || inventoryData.declaredQuantity) : 0,
        subPoNumber: inventoryData.subPoNumber,
        subPoDate: inventoryData.subPoDate, // Format: yyyy-MM-dd
        subPoQty: (inventoryData.subPoQty || inventoryData.subPoQuantity) ? parseFloat(inventoryData.subPoQty || inventoryData.subPoQuantity) : 0,
        invoiceNumber: inventoryData.invoiceNumber,
        invoiceDate: inventoryData.invoiceDate, // Format: yyyy-MM-dd
        unitOfMeasurement: inventoryData.unitOfMeasurement,
        rateOfMaterial: inventoryData.rateOfMaterial ? parseFloat(inventoryData.rateOfMaterial) : 0,
        rateOfGst: inventoryData.rateOfGst ? parseFloat(inventoryData.rateOfGst) : 0,
        baseValuePo: (inventoryData.baseValuePo || inventoryData.baseValuePO) ? parseFloat(inventoryData.baseValuePo || inventoryData.baseValuePO) : 0,
        totalPo: (inventoryData.totalPo || inventoryData.totalPO) ? parseFloat(inventoryData.totalPo || inventoryData.totalPO) : 0,
        numberOfBundles: inventoryData.numberOfBundles ? parseInt(inventoryData.numberOfBundles) : null,
        tcFileBase64: inventoryData.tcFileBase64 || null,
        tcFileName: inventoryData.tcFileName || null
      };

      console.log('📤 Transformed data for backend:', transformedData);

      // Make API call to backend
      const response = await httpClient.post('/vendor/inventory/entries', transformedData);

      console.log('✅ Backend response:', response);

      // Check if response has the expected structure
      // Backend returns statusCode: 0 for success
      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Inventory entry created successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error creating inventory entry:', error);
      return {
        success: false,
        error: error.message || 'Failed to create inventory entry',
        details: error.response?.data || error
      };
    }
  },

  /**
   * Create multiple inventory entries (Bulk)
   * @param {Object} bulkData - Bulk inventory data
   * @returns {Promise<Object>} - API response
   */
  createBulkInventoryEntries: async (bulkData) => {
    try {
      console.log('📥 Bulk Inventory data received:', bulkData);

      // Make API call to backend
      const response = await httpClient.post('/vendor/inventory/bulk-entries', bulkData);

      console.log('✅ Backend bulk response:', response);

      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Bulk inventory entries created successfully'
        };
      } else {
        throw new Error(response.message || 'Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error creating bulk inventory entries:', error);
      return {
        success: false,
        error: error.message || 'Failed to create bulk inventory entries',
        details: error.response?.data || error
      };
    }
  },

  /**
   * Get all inventory entries for a vendor
   * @param {String} vendorCode - Vendor code to fetch entries for
   * @returns {Promise<Object>} - API response with list of inventory entries
   */
  getInventoryEntries: async (vendorCode) => {
    try {
      console.log('📥 Fetching inventory entries for vendor:', vendorCode);

      // Make API call to backend
      const response = await httpClient.get(`/vendor/inventory/entries/${vendorCode}`);

      console.log('✅ Backend response:', response);

      // Check if response has the expected structure
      // Backend returns statusCode: 0 for success
      if (response && response.success) {
        return {
          success: true,
          data: response.data || [],
          message: 'Inventory entries fetched successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error fetching inventory entries:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch inventory entries',
        details: error.response?.data || error,
        data: [] // Return empty array on error
      };
    }
  },

  /**
   * Get inventory entry by ID
   * @param {Number} id - Inventory entry ID
   * @returns {Promise<Object>} - API response with inventory entry details
   */
  getInventoryEntryById: async (id) => {
    try {
      console.log('📥 Fetching inventory entry by ID:', id);

      const response = await httpClient.get(`/vendor/inventory/entries/detail/${id}`);

      // Backend returns statusCode: 0 for success
      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Inventory entry fetched successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error fetching inventory entry:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch inventory entry',
        details: error.response?.data || error
      };
    }
  },

  /**
   * Get history of an inventory entry by ID
   * @param {Number} id - Inventory entry ID
   * @returns {Promise<Object>} - API response with inventory history
   */
  getInventoryHistory: async (id) => {
    try {
      console.log('📥 Fetching inventory history by ID:', id);

      const response = await httpClient.get(`/vendor/inventory/entries/${id}/history`);

      // Backend returns success: true for success
      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Inventory history fetched successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error fetching inventory history:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch inventory history',
        details: error.response?.data || error
      };
    }
  },

  /**
   * Get available heat numbers for a vendor (for dropdown in Raw Material Raising Call)
   * This endpoint returns only heat numbers with:
   * - Remaining quantity > 0
   * - Status = FRESH_PO
   *
   * EXHAUSTED entries are filtered out but remain in database for audit trail.
   *
   * @param {String} vendorCode - Vendor code to fetch available heat numbers for
   * @returns {Promise<Object>} - API response with list of available heat numbers
   */
  getAvailableHeatNumbers: async (vendorCode) => {
    try {
      console.log('📥 Fetching available heat numbers for vendor:', vendorCode);

      // Make API call to backend
      const response = await httpClient.get(`/vendor/available-heat-numbers/${vendorCode}`);

      console.log('✅ Backend response (available heat numbers):', response);

      // Check if response has the expected structure
      // Backend returns statusCode: 0 for success
      if (response && response.success) {
        return {
          success: true,
          data: response.data || [],
          message: 'Available heat numbers fetched successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error fetching available heat numbers:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch available heat numbers',
        details: error.response?.data || error,
        data: [] // Return empty array on error
      };
    }
  },

  /**
   * Update an existing inventory entry
   * Note: Only entries with status = FRESH_PO can be updated
   * @param {Number} id - Inventory entry ID
   * @param {Object} inventoryData - Updated inventory entry data
   * @returns {Promise<Object>} - API response with updated inventory entry
   */
  updateInventoryEntry: async (id, inventoryData) => {
    const user = getStoredUser();
    try {
      console.log('📥 Updating inventory entry ID:', id, 'with data:', inventoryData);

      // Transform frontend data structure to match backend DTO
      const transformedData = {
        vendorCode: inventoryData.vendorCode || user.userName,
        vendorName: inventoryData.vendorName || 'Default Vendor',
        companyId: inventoryData.companyId ? parseInt(inventoryData.companyId) : null,
        companyName: inventoryData.companyName || '',
        supplierName: inventoryData.supplierName,
        unitName: inventoryData.unitName,
        supplierAddress: inventoryData.supplierAddress || '',
        rawMaterial: inventoryData.rawMaterial,
        gradeSpecification: inventoryData.gradeSpecification,
        lengthOfBars: inventoryData.lengthOfBars ? parseFloat(inventoryData.lengthOfBars) : null,
        heatNumber: inventoryData.heatNumber,
        tcNumber: inventoryData.tcNumber,
        tcDate: inventoryData.tcDate,
        tcQuantity: (inventoryData.tcQuantity || inventoryData.declaredQuantity) ? parseFloat(inventoryData.tcQuantity || inventoryData.declaredQuantity) : 0,
        subPoNumber: inventoryData.subPoNumber,
        subPoDate: inventoryData.subPoDate,
        subPoQty: (inventoryData.subPoQty || inventoryData.subPoQuantity) ? parseFloat(inventoryData.subPoQty || inventoryData.subPoQuantity) : 0,
        invoiceNumber: inventoryData.invoiceNumber,
        invoiceDate: inventoryData.invoiceDate,
        unitOfMeasurement: inventoryData.unitOfMeasurement,
        rateOfMaterial: inventoryData.rateOfMaterial ? parseFloat(inventoryData.rateOfMaterial) : 0,
        rateOfGst: inventoryData.rateOfGst ? parseFloat(inventoryData.rateOfGst) : 0,
        baseValuePo: (inventoryData.baseValuePo || inventoryData.baseValuePO) ? parseFloat(inventoryData.baseValuePo || inventoryData.baseValuePO) : 0,
        totalPo: (inventoryData.totalPo || inventoryData.totalPO) ? parseFloat(inventoryData.totalPo || inventoryData.totalPO) : 0,
        numberOfBundles: inventoryData.numberOfBundles ? parseInt(inventoryData.numberOfBundles) : null,
        tcFileBase64: inventoryData.tcFileBase64 || null,
        tcFileName: inventoryData.tcFileName || null
      };

      console.log('📤 Transformed data for backend:', transformedData);

      // Make API call to backend
      const response = await httpClient.put(`/vendor/inventory/entries/${id}`, transformedData);

      console.log('✅ Backend response:', response);

      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Inventory entry updated successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error updating inventory entry:', error);
      return {
        success: false,
        error: error.message || 'Failed to update inventory entry',
        details: error.response?.data || error
      };
    }
  },

  /**
   * Delete an inventory entry
   * Note: Only entries with status = FRESH_PO can be deleted
   * @param {Number} id - Inventory entry ID
   * @returns {Promise<Object>} - API response
   */
  deleteInventoryEntry: async (id) => {
    try {
      console.log('📥 Deleting inventory entry ID:', id);

      // Make API call to backend
      const response = await httpClient.delete(`/vendor/inventory/entries/${id}`);

      console.log('✅ Backend response:', response);

      if (response && response.success) {
        return {
          success: true,
          message: 'Inventory entry deleted successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error deleting inventory entry:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete inventory entry',
        details: error.response?.data || error
      };
    }
  },

  /**
   * Get suppliers by raw material/product
   * @param {String} product - Raw material name
   * @returns {Promise<Object>} - API response with list of supplier names
   */
  getSuppliersByProduct: async (product) => {
    try {
      console.log('📥 Fetching suppliers for product:', product);

      // Make API call to backend
      const response = await httpClient.get(`/suppliers/by-product/${encodeURIComponent(product)}`);

      console.log('✅ Backend response (suppliers):', response);

      if (response && response.success) {
        return {
          success: true,
          data: response.data || [],
          message: 'Suppliers fetched successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error fetching suppliers:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch suppliers',
        details: error.response?.data || error,
        data: []
      };
    }
  },

  /**
   * Get units and addresses by company name
   * @param {String} companyName - Company name
   * @returns {Promise<Object>} - API response with list of units and addresses
   */
  getUnitsByCompany: async (companyName) => {
    try {
      console.log('📥 Fetching units for company:', companyName);

      // Make API call to backend
      const response = await httpClient.get(`/suppliers/by-company?companyName=${encodeURIComponent(companyName)}`);

      console.log('✅ Backend response (units):', response);

      if (response && response.success) {
        return {
          success: true,
          data: response.data || [],
          message: 'Units fetched successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error fetching units:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch units',
        details: error.response?.data || error,
        data: []
      };
    }
  },
  /**
   * Check if a TC number already exists in inventory for a vendor
   * @param {String} tcNumber - TC number to check
   * @param {String} vendorCode - Vendor code
   * @returns {Promise<Object>} - API response with boolean (true if exists, false if unique)
   */
  checkTcUniqueness: async (tcNumber, vendorCode) => {
    try {
      const response = await httpClient.get(`/vendor/inventory/check-tc-uniqueness?tcNumber=${encodeURIComponent(tcNumber)}&vendorCode=${encodeURIComponent(vendorCode)}`);
      if (response && response.success) {
        return {
          success: true,
          exists: response.data === true
        };
      }
      return { success: false, exists: false };
    } catch (error) {
      console.error('❌ Error checking TC uniqueness:', error);
      return { success: false, exists: false };
    }
  },

  /**
   * Get URL for viewing a TC file via the backend proxy endpoint
   * Works for both legacy local paths and new Azure Blob URLs.
   * The backend fetches the file from Azure and streams it back as PDF.
   * @param {String} tcNumber  - TC number (used to look up the file on backend)
   * @param {String} vendorCode - Vendor code
   * @returns {String} - Backend proxy URL to open the TC PDF
   */
  getTcFileUrl: (tcNumber, vendorCode) => {
    if (!tcNumber || !vendorCode) return null;
    const apiUrl = getBaseUrl(); // e.g. "https://api.ritesqasarthi.com/sarthi-backend/api"
    const baseApiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    return `${baseApiUrl}/vendor/inventory/tc-file?tcNumber=${encodeURIComponent(tcNumber)}&vendorCode=${encodeURIComponent(vendorCode)}`;
  },

  /**
   * @deprecated Use getTcFileUrl instead.
   * Legacy helper that constructed URL from a local file path — kept for compatibility.
   */
  getFileUrl: (filePath) => {
    if (!filePath) return null;
    const apiUrl = getBaseUrl();
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}/${filePath}`;
  }

};

export default inventoryService;

