import { API_CONFIG } from './config';

const BASE_URL = API_CONFIG.APPROVED_ASH_SG;

export const approvedAshSGService = {
    getAll: async () => {
        const response = await fetch(`${BASE_URL}/all`);
        if (!response.ok) throw new Error('Failed to fetch entries');
        return response.json();
    },

    getByVendor: async (vendorCode) => {
        const response = await fetch(`${BASE_URL}/vendor/${vendorCode}`);
        if (!response.ok) throw new Error('Failed to fetch vendor entries');
        return response.json();
    },

    getByPlantId: async (plantId) => {
        const response = await fetch(`${BASE_URL}/plant?plantId=${encodeURIComponent(plantId)}`);
        if (!response.ok) throw new Error('Failed to fetch entries by plant ID');
        return response.json();
    },

    create: async (data) => {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create entry');
        return response.json();
    },

    update: async (id, data) => {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update entry');
        return response.json();
    },

    delete: async (id) => {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete entry');
        return true;
    }
};
