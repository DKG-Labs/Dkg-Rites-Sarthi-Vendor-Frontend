import axios from 'axios';
import { API_CONFIG, API_BASE_URL } from './config';

const BASE_URL = API_CONFIG.RAIL_INSPECTION_CALL;

const inspectionCallService = {
    create: async (data) => {
        try {
            const response = await axios.post(`${BASE_URL}/create`, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data?.responseData;
        } catch (error) {
            console.error('Error creating inspection call:', error);
            throw error;
        }
    },

    getByVendor: async (vendorCode) => {
        try {
            const response = await axios.get(`${BASE_URL}/vendor/${vendorCode}`);
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching vendor inspection calls:', error);
            throw error;
        }
    },

    getPaginatedByVendor: async (vendorCode, page = 0, size = 5) => {
        try {
            const response = await axios.get(`${BASE_URL}/vendor-paginated`, {
                params: { vendorCode, page, size }
            });
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching paginated vendor inspection calls:', error);
            throw error;
        }
    },

    getByPlant: async (plantId) => {
        try {
            const response = await axios.get(`${BASE_URL}/plant/${plantId}`);
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching plant inspection calls:', error);
            throw error;
        }
    },

    getPaginatedByPlant: async (plantId, page = 0, size = 5, statusType = 'all') => {
        try {
            const response = await axios.get(`${BASE_URL}/plant-paginated`, {
                params: { plantId, page, size, statusType }
            });
            return response.data?.responseData;
        } catch (error) {
            console.error("Error fetching paginated inspection calls by plant:", error);
            throw error;
        }
    },

    getCompletedPaginatedByPlant: async (plantId, page = 0, size = 5) => {
        try {
            const response = await axios.get(`${BASE_URL}/plant-completed-paginated`, {
                params: { plantId, page, size }
            });
            return response.data?.responseData;
        } catch (error) {
            console.error("Error fetching completed paginated inspection calls by plant:", error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await axios.get(`${BASE_URL}/${id}`);
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching inspection call:', error);
            throw error;
        }
    },
    getProcessCallDetails: async (callNo) => {
        try {
            const response = await axios.get(`${BASE_URL}/process/${callNo}`);
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching process call details:', error);
            throw error;
        }
    },
    getWorkflowHistory: async (requestId) => {
        try {
            const response = await axios.get(`${API_CONFIG.RAILPAD_WORKFLOW}/WorkflowTransitionHistory`, {
                params: { requestId }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching workflow history:', error);
            throw error;
        }
    },
    getCancelledCallsForPayment: async (plantId, vendorCode) => {
        try {
            const response = await axios.get(`${API_CONFIG.RAILPAD_WORKFLOW}/cancelledCallsForPayment`, {
                params: { plantId, vendorCode }
            });
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching cancelled calls for payment:', error);
            throw error;
        }
    },
    getProcessCalls: async (railPadType, drawingNo, plantId, poNo, poSr) => {
        try {
            const response = await axios.get(`${BASE_URL}/process-calls`, {
                params: { railPadType, drawingNo, plantId, poNo, poSr }
            });
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching process calls:', error);
            throw error;
        }
    },
    getProcessInspectionResult: async (callNo) => {
        try {
            const response = await axios.get(`${BASE_URL}/process/inspect/${callNo}`);
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching process inspection result:', error);
            throw error;
        }
    },
    getAvailableFinalBatches: async (callNo, excludeCallNo = '') => {
        try {
            const params = excludeCallNo ? { excludeCallNo } : {};
            const response = await axios.get(`${BASE_URL}/process/available-final-batches/${callNo}`, { params });
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching available final batches:', error);
            throw error;
        }
    },
    modifyCall: async (data) => {
        try {
            const response = await axios.put(`${BASE_URL}/modify`, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data?.responseData;
        } catch (error) {
            console.error('Error modifying inspection call:', error);
            throw error;
        }
    },
    withdrawCall: async (data) => {
        try {
            const response = await axios.post(`${BASE_URL}/withdraw`, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data?.responseData;
        } catch (error) {
            console.error('Error withdrawing inspection call:', error);
            throw error;
        }
    },
    getCallLetterDetails: async (requestId) => {
        try {
            const response = await axios.get(`${API_CONFIG.RAIL_INSPECTION_CALL.replace('/rail-inspection-call', '')}/call-letter/details`, {
                params: { requestId }
            });
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching call letter details:', error);
            return null;
        }
    },
    getSummary: async (callNo) => {
        try {
            const response = await axios.get(`${BASE_URL}/summary/${callNo}`);
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching call summary:', error);
            return null;
        }
    },
    getSignedCertificate: async (icNumber) => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/certificate-storage/view`, {
                params: { icNumber },
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return response.data;
        } catch (error) {
            console.warn(`No signed certificate in Azure for ${icNumber}:`, error?.response?.status || error.message);
            return null;
        }
    },
    checkPlantPaymentBlock: async (plantId, vendorCode) => {
        try {
            const pId = plantId ? String(plantId).replace(/^:/, '').trim() : '';
            const vCode = vendorCode ? String(vendorCode).replace(/^:/, '').trim() : '';
            const response = await axios.get(`${API_CONFIG.RAILPAD_WORKFLOW}/checkPlantPaymentBlock`, {
                params: { plantId: pId, vendorCode: vCode }
            });
            return response.data?.responseData || response.data || { isBlocked: false };
        } catch (error) {
            console.error('Error checking plant payment block:', error);
            return { isBlocked: false };
        }
    },

    /**
     * Calls the backend proxy which in turn calls the IBS get-bill-details API.
     * @param {string} caseNo     IBS case number
     * @param {string} callDate   Call date in DD-MM-YYYY format
     * @param {number} ibsCallSno IBS call serial number
     * @returns {Promise<Object>} IBS response with resultFlag, bill_details, payment_details
     */
    verifyIbsPayment: async (caseNo, callDate, ibsCallSno) => {
        try {
            const response = await axios.post(`${API_CONFIG.RAILPAD_WORKFLOW}/verify-ibs-payment`, {
                caseNo,
                callDate,
                ibsCallSno: Number(ibsCallSno)
            });
            return response.data?.responseData || response.data;
        } catch (error) {
            console.error('Error verifying IBS payment:', error);
            throw error;
        }
    },

    /**
     * Marks a call's payment as "Approved by RITES Finance" in the backend.
     * This unblocks call raising for the plant/vendor.
     * @param {string} callNo The internal call number (e.g. RPF-082526001)
     */
    markPaymentApproved: async (callNo) => {
        try {
            const response = await axios.post(`${API_CONFIG.RAILPAD_WORKFLOW}/mark-payment-approved`, {
                callNo
            });
            return response.data?.responseData || response.data;
        } catch (error) {
            console.error('Error marking payment approved:', error);
            throw error;
        }
    }
};

export default inspectionCallService;

