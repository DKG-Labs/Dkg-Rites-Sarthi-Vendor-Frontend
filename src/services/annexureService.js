import { getBaseUrl, getDefaultHeaders } from './apiConfig';

const API_BASE_URL = getBaseUrl();
const getAuthHeaders = () => getDefaultHeaders(localStorage.getItem('token'));
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
    }
    return response.json();
};

/**
 * Service for fetching Annexure-related data from the backend
 */
export const annexureService = {
    /**
     * Fetches Chemical Analysis data for a specific Inspection Call
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Object>} The chemical analysis report data
     */
    getChemicalAnalysis: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/chemical-analysis/${callNo}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error fetching Chemical Analysis for call ${callNo}:`, error);
            throw error;
        }
    },

    /**
     * Fetches Dimensional Check data for a specific Inspection Call
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Object>} The dimensional check report data
     */
    getDimensionalCheck: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/dimensional-check/${callNo}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error fetching Dimensional Check for call ${callNo}:`, error);
            throw error;
        }
    },

    /**
     * Fetches Final chemical Analysis data (Annexure-VI)
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Object>} The final chemical analysis data
     */
    getFinalChemicalAnalysis: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-chemical-analysis/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching final chemical analysis:', error);
            throw error;
        }
    },

    /**
     * Fetches Final Hardness Test data (Annexure-VIII)
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Object>} The final hardness test data
     */
    getFinalHardnessTest: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-hardness-test/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error fetching Final Hardness Test for call ${callNo}:`, error);
            throw error;
        }
    },

    /**
     * Fetches Final Toe Load Test data (Annexure-XI)
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Object>} The final toe load test data
     */
    getFinalToeLoadTest: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-toe-load-test/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error fetching Final Toe Load Test for call ${callNo}:`, error);
            throw error;
        }
    },

    getFinalWeightTest: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-weight-test/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error("Error fetching Final Weight Test data:", error);
            throw error;
        }
    },

    getFinalInclusion: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-inclusion/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error("Error fetching Final Inclusion Annexure data:", error);
            throw error;
        }
    },

    getFinalApplicationDeflection: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-application-deflection/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error("Error fetching Final Application & Deflection data:", error);
            throw error;
        }
    },

    getFinalDimensionalInspection: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/annexures/final-dimensional-inspection/${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error("Error fetching Final Dimensional Inspection data:", error);
            throw error;
        }
    },

    /**
     * Fetches Process Inspection Register data (Annexure)
     * @param {string} callNo - The inspection call number
     * @param {string} date - Date of inspection
     * @param {string} shift - Shift code
     * @returns {Promise<Array>} List of register data objects
     */
    getProcessInspectionRegister: async (callNo, date, shift) => {
        try {
            let url = `${API_BASE_URL}/api/process-annexure/register?callNo=${callNo}`;
            if (date) url += `&date=${date}`;
            if (shift) url += `&shift=${shift}`;
            
            const response = await fetch(url, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error("Error fetching Process Inspection Register:", error);
            throw error;
        }
    },

    /**
     * Fetches available Date/Shift/Lot entries for Process Inspection Register
     * @param {string} callNo - The inspection call number
     * @returns {Promise<Array>} List of available entry objects
     */
    getProcessAvailableEntries: async (callNo) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/process-annexure/available-entries?callNo=${callNo}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error("Error fetching available process entries:", error);
            throw error;
        }
    },

    /**
     * Updates remarks for a specific process inspection entry
     */
    updateProcessRemarks: async (params) => {
        try {
            const userId = localStorage.getItem('userId') || localStorage.getItem('userName') || 'testUser';
            const { callNo, shift, lineNo, lotNo, remarks } = params;
            
            const url = `${API_BASE_URL}/api/process-annexure/update-remarks?callNo=${callNo}&shift=${shift}&lineNo=${lineNo}&lotNo=${lotNo}&remarks=${encodeURIComponent(remarks)}&createdBy=${userId}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
        } catch (error) {
            console.error("Error updating process remarks:", error);
            throw error;
        }
    }
};
