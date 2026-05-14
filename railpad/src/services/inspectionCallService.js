import axios from 'axios';
import { API_CONFIG } from './config';

const BASE_URL = API_CONFIG.RAIL_INSPECTION_CALL;

const inspectionCallService = {
    create: async (data) => {
        try {
            const response = await axios.post(`${BASE_URL}/create`, data);
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

    getById: async (id) => {
        try {
            const response = await axios.get(`${BASE_URL}/${id}`);
            return response.data?.responseData;
        } catch (error) {
            console.error('Error fetching inspection call:', error);
            throw error;
        }
    }
};

export default inspectionCallService;
