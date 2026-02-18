// POI Mapping Service
// Handles API calls for Place of Inspection (POI) mapping data

import httpClient from './httpClient';

/**
 * POI Mapping Service
 * Provides methods to fetch company, unit, and POI code data from backend API
 */
const poiMappingService = {
  /**
   * Get all companies for POI dropdown
   * @returns {Promise} API response with list of company names
   */
  getCompanies: async (vendorCode) => {
    try {
      const response = await httpClient.get(`/poiMapping/companies?vendorCode=${vendorCode}`);
      return response; // Return full response object with success and data
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  /**
   * Get units for a specific company
   * @param {string} companyName - Company name to fetch units for
   * @returns {Promise} API response with list of unit names
   */
  getUnitsByCompany: async (companyName) => {
    try {
      // URL encode the company name to handle special characters
      const encodedCompanyName = encodeURIComponent(companyName);
      const response = await httpClient.get(`/poiMapping/companies/${encodedCompanyName}/units`);
      return response; // Return full response object with success and data
    } catch (error) {
      console.error(`Error fetching units for company ${companyName}:`, error);
      throw error;
    }
  },

  /**
   * Get unit details (address and POI code) for a specific company and unit
   * @param {string} companyName - Company name
   * @param {string} unitName - Unit name
   * @returns {Promise} API response with unit details (address and poiCode)
   */
  getUnitDetails: async (companyName, unitName) => {
    try {
      // URL encode both parameters to handle special characters
      const encodedCompanyName = encodeURIComponent(companyName);
      const encodedUnitName = encodeURIComponent(unitName);
      const response = await httpClient.get(
        `/poiMapping/companies/${encodedCompanyName}/units/${encodedUnitName}`
      );
      return response; // Return full response object with success and data
    } catch (error) {
      console.error(`Error fetching unit details for ${companyName} - ${unitName}:`, error);
      throw error;
    }
  }
};

export default poiMappingService;

