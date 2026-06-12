// ============================================================
// VENDOR CALIBRATION SERVICE
// ============================================================
// Description: API service for managing vendor instrument calibration records
// Handles parent-child CRUD operations for calibration lists
// ============================================================

import httpClient from './httpClient';
import { getStoredUser } from '../services/authService';
import { getBaseUrl } from './apiConfig';

const vendorCalibrationService = {

  /**
   * Save or update a calibration group (parent header with child details)
   * @param {Object} calibrationData - Parent-child data from the form
   * @returns {Promise<Object>} - API response
   */
  createOrUpdateCalibration: async (calibrationData) => {
    const user = getStoredUser();
    try {
      console.log('📥 Calibration data received:', calibrationData);

      const transformedData = {
        id: calibrationData.id || null,
        vendorCode: calibrationData.vendorCode || user.userName,
        category: calibrationData.category,
        certificateFilePath: calibrationData.certificateFilePath || '',
        certificateFileBase64: calibrationData.certificateFileBase64 || '',
        details: (calibrationData.details || []).map(detail => ({
          id: detail.id || null,
          instrumentName: detail.instrumentName || detail.instrument_name || '',
          capacity: detail.capacity || detail.capacity_range || '',
          description: detail.description || '',
          usedFor: Array.isArray(detail.usedFor) ? detail.usedFor.join(', ') : (detail.usedFor || detail.used_for || ''),
          serialNumber: detail.serialNumber || detail.serial_number || '',
          calibrationCertificateNo: detail.calibrationCertificateNo || detail.calibration_certificate_no || '',
          calibrationDate: detail.calibrationDate || detail.calibration_date || null,
          calibrationDueDate: detail.calibrationDueDate || detail.calibration_due_date || null,
          certifyingLabName: detail.certifyingLabName || detail.certifying_lab_name || '',
          accreditationAgency: detail.accreditationAgency || detail.accreditation_agency || '',
          notificationDays: detail.notificationDays !== undefined ? parseInt(detail.notificationDays, 10) : (detail.notification_days !== undefined ? parseInt(detail.notification_days, 10) : 30),
          calibrationStatus: detail.calibrationStatus || detail.calibration_status || 'Valid'
        }))
      };

      console.log('📤 Sending transformed calibration data to backend:', transformedData);

      const response = await httpClient.post('/vendor/calibration', transformedData);

      console.log('✅ Backend calibration response:', response);

      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Calibration records saved successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }

    } catch (error) {
      console.error('❌ Error saving calibration records:', error);
      return {
        success: false,
        error: error.message || 'Failed to save calibration records',
        details: error.response?.data || error
      };
    }
  },

  /**
   * Get all calibration records for a vendor
   * @param {String} vendorCode - Vendor code
   * @returns {Promise<Object>} - API response
   */
  getCalibrationsByVendor: async (vendorCode) => {
    try {
      console.log('📥 Fetching calibration records for vendor:', vendorCode);
      const response = await httpClient.get(`/vendor/calibration/vendor/${vendorCode}`);
      console.log('✅ Backend calibration list response:', response);

      if (response && response.success) {
        return {
          success: true,
          data: response.data || [],
          message: 'Calibration records fetched successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }
    } catch (error) {
      console.error('❌ Error fetching calibration records:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch calibration records',
        details: error.response?.data || error,
        data: []
      };
    }
  },

  /**
   * Delete a calibration group (parent and all child details cascaded)
   * @param {Number} id - Parent group ID
   * @returns {Promise<Object>} - API response
   */
  deleteCalibrationGroup: async (id) => {
    try {
      console.log('📥 Deleting calibration group ID:', id);
      const response = await httpClient.delete(`/vendor/calibration/${id}`);
      console.log('✅ Backend delete group response:', response);

      if (response && response.success) {
        return {
          success: true,
          message: 'Calibration group deleted successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }
    } catch (error) {
      console.error('❌ Error deleting calibration group:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete calibration group',
        details: error.response?.data || error
      };
    }
  },

  /**
   * Delete an individual child detail record
   * @param {Number} detailId - Child record ID
   * @returns {Promise<Object>} - API response
   */
  deleteCalibrationDetail: async (detailId) => {
    try {
      console.log('📥 Deleting calibration detail ID:', detailId);
      const response = await httpClient.delete(`/vendor/calibration/detail/${detailId}`);
      console.log('✅ Backend delete detail response:', response);

      if (response && response.success) {
        return {
          success: true,
          message: 'Calibration record deleted successfully'
        };
      } else {
        throw new Error('Unexpected response format from backend');
      }
    } catch (error) {
      console.error('❌ Error deleting calibration detail:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete calibration detail',
        details: error.response?.data || error
      };
    }
  },

  /**
   * Get full URL for a certificate file
   * @param {String} filePath - Relative file path (e.g. uploads/calibration_certificates/file.pdf)
   * @returns {String} - Full URL to access the file
   */
  getFileUrl: (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('data:')) {
      return filePath;
    }
    const apiUrl = getBaseUrl();
    const baseUrl = apiUrl.replace(/\/api$/, '');
    return `${baseUrl}/${filePath}`;
  },

  /**
   * Submit bulk initial calibration registration (18 mandatory items + combined PDF)
   * @param {Object} payload - { isBulkInitialRegistration: true, fileData, items }
   * @returns {Promise<Object>} API response
   */
  submitBulkRegistration: async (payload) => {
    try {
      console.log('📤 Submitting bulk calibration registration:', payload);
      const response = await httpClient.post('/vendor/calibration/bulk', payload);
      console.log('✅ Bulk registration response:', response);
      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Bulk registration completed successfully'
        };
      }
      throw new Error(response?.message || 'Unexpected response from bulk registration');
    } catch (error) {
      console.error('❌ Bulk registration error:', error);
      return {
        success: false,
        error: error.message || 'Bulk registration failed',
        details: error.response?.data || error
      };
    }
  }
};

export default vendorCalibrationService;
