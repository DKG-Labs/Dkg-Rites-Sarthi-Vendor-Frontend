import { getBaseUrl } from './apiConfig';

/**
 * Service to handle IMMS PO Synchronization (CRIS Integration)
 * Standardized across Sleeper and ERC modules.
 */
export const immsService = {
    /**
     * Authenticate with CRIS/IMMS to get a JWT token
     */
    authenticateIMMS: async () => {
        try {
            const response = await fetch('/immsapi/authenticate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'accept': '*/*'
                },
                body: JSON.stringify({
                    username: "rites-sarthi",
                    password: "sarTHI@@speri26"
                })
            });

            // Handle non-JSON responses (usually proxy errors)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                if (text.trim().startsWith('<!DOCTYPE html>')) {
                    throw new Error('Proxy Server Connection Failed: Received HTML instead of JSON. Please ensure "http-proxy-middleware" is working.');
                }
                throw new Error('IMMS server returned non-JSON response.');
            }

            const data = await response.json();
            const token = data.token || data.jwt || data.accessToken || data.Jwt;
            
            if (token) {
                // ERC uses localStorage by default in authService.js
                localStorage.setItem('imms_token', token);
                return token;
            }
            throw new Error('Failed to authenticate with IMMS - No token received');
        } catch (error) {
            console.error('IMMS Auth Error:', error);
            throw error;
        }
    },

    /**
     * Fetch PO Data from IMMS using the provided rly, poNo, poDate, vcode
     */
    getIMMSPOData: async (payload) => {
        try {
            // Always authenticate first to ensure token freshness (as per Sleeper logic)
            const token = await immsService.authenticateIMMS();

            // Using relative path for Vercel rewrites and local proxy to bypass CORS
            const response = await fetch('/immsapi/purchase/getPOData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

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

    getRlyList: async () => {
        try {
            const baseUrl = getBaseUrl();
            const response = await fetch(`${baseUrl}/vendor-plant/Rlylist`, {
                method: 'GET',
                headers: { 'accept': '*/*' }
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
