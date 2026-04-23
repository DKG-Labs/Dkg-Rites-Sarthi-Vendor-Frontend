import { getBaseUrl } from './apiConfig';

/**
 * Service to handle IMMS PO Synchronization (CRIS Integration)
 * Standardized across Sleeper and ERC modules.
 * Using Sarthi Backend Proxy for reliability and security.
 */
export const immsService = {
    /**
     * Authenticate with CRIS/IMMS via Sarthi Backend Proxy
     */
    authenticateIMMS: async () => {
        try {
            const baseUrl = getBaseUrl();
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${baseUrl}/Vendorsync/authenticate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`IMMS Proxy Auth Failed: ${errorText}`);
            }

            const data = await response.json();
            const immsToken = data.token;
            
            if (immsToken) {
                localStorage.setItem('imms_token', immsToken);
                return immsToken;
            }
            throw new Error('No token received from IMMS Proxy');
        } catch (error) {
            console.error('IMMS Auth Error:', error);
            throw error;
        }
    },

    /**
     * Fetch PO Data from CRIS/IMMS via Sarthi Backend Proxy
     */
    getIMMSPOData: async (payload) => {
        try {
            const baseUrl = getBaseUrl();
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${baseUrl}/Vendorsync/fetch-po`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to fetch PO details via Proxy');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('IMMS Fetch Error:', error);
            throw error;
        }
    },

    /**
     * Save fetched PO data to the local Sarthi backend
     */
    savePOToSarthi: async (payload) => {
        try {
            const baseUrl = getBaseUrl();
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`${baseUrl}/Vendorsync/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Sarthi Save Error:', error);
            throw error;
        }
    },

    /**
     * Save fetched PO MA data to the local Sarthi backend
     */
    savePoMaToSarthi: async (payload) => {
        try {
            const baseUrl = getBaseUrl();
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`${baseUrl}/Vendorsync/savePoMa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Sarthi Save MA Error:', error);
            throw error;
        }
    },

    /**
     * Save fetched PO CA data to the local Sarthi backend
     */
    savePoCaToSarthi: async (payload) => {
        try {
            const baseUrl = getBaseUrl();
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`${baseUrl}/Vendorsync/savePoCa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Sarthi Save CA Error:', error);
            throw error;
        }
    },

    getRlyList: async () => {
        try {
            const baseUrl = getBaseUrl();
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${baseUrl}/vendor-plant/Rlylist`, {
                method: 'GET',
                headers: { 
                    'accept': '*/*',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch Railway list');
            const data = await response.json();
            return data.responseData || [];
        } catch (error) {
            console.error('API Error (getRlyList):', error);
            return [];
        }
    }
};
