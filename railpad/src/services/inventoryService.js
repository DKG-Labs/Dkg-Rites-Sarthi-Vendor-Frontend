import { API_CONFIG } from './config';

export const inventoryService = {
    getAcceptedInventory: async (productionUnit, productType) => {
        try {
            const url = new URL(`${API_CONFIG.IE_PRODUCTION_VERIFICATION}/accepted-inventory`);
            url.searchParams.append('productionUnit', productionUnit);
            if (productType) url.searchParams.append('productType', productType);

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch accepted inventory');
            const data = await response.json();
            return data.responseData || [];
        } catch (error) {
            console.error('Error fetching inventory:', error);
            throw error;
        }
    }
};
