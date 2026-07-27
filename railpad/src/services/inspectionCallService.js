import axios from 'axios';
import { API_CONFIG } from './config';

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
    getAvailableFinalBatches: async (callNo) => {
        try {
            const response = await axios.get(`${BASE_URL}/process/available-final-batches/${callNo}`);
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching available final batches:', error);
            throw error;
        }
    }
};

export default inspectionCallService;
