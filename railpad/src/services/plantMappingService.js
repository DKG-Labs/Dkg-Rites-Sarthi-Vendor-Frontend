import { API_CONFIG } from './config.js';

export const plantMappingService = {
    getUrl: (vendorCode) => `${API_CONFIG.PLANT_MAPPING}/vendor/${vendorCode}/plants`,
    getVendorPlants: async (vendorCode) => {
        try {
            const response = await fetch(`${API_CONFIG.PLANT_MAPPING}/vendor/${vendorCode}/plants`);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching vendor plants:', error);
            throw error;
        }
    }
};
