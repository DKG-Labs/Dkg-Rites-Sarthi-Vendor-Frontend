import { API_CONFIG } from './config';

export const productionDeclarationService = {
    getAllByPlant: async (plantId) => {
        const response = await fetch(`${API_CONFIG.PRODUCTION_DECLARATION}/plant?plantId=${encodeURIComponent(plantId)}`);
        if (!response.ok) throw new Error('Failed to fetch production logs');
        return await response.json();
    },

    getByPlantId: async (plantId) => {
        return productionDeclarationService.getAllByPlant(plantId);
    },

    getById: async (id) => {
        const response = await fetch(`${API_CONFIG.PRODUCTION_DECLARATION}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch production log');
        return await response.json();
    },

    create: async (data) => {
        const response = await fetch(API_CONFIG.PRODUCTION_DECLARATION, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create production log');
        return await response.json();
    },

    update: async (id, data) => {
        const response = await fetch(`${API_CONFIG.PRODUCTION_DECLARATION}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update production log');
        return await response.json();
    },

    delete: async (id) => {
        const response = await fetch(`${API_CONFIG.PRODUCTION_DECLARATION}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete production log');
        return await response.json();
    }
};
