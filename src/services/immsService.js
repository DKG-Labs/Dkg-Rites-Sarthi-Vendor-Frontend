import { getBaseUrl } from './apiConfig';

const getAuthToken = () => {
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') || 
           sessionStorage.getItem('token') || 
           localStorage.getItem('railpad_token') || 
           sessionStorage.getItem('authToken') || '';
};

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
            const token = getAuthToken();

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
            const token = getAuthToken();

            let finalPayload = { ...payload };
            if (!finalPayload.poDate && finalPayload.poNo) {
                try {
                    const poDateRes = await immsService.getPoDateByPoNo(finalPayload.poNo);
                    const rawPoDate = poDateRes?.poDate || poDateRes?.data?.poDate || poDateRes?.responseData?.poDate || poDateRes?.po_date || poDateRes?.poHeader?.poDate || (typeof poDateRes === 'string' ? poDateRes : null);
                    if (rawPoDate) {
                        let dateStr = String(rawPoDate).trim();
                        if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
                        if (!dateStr.includes('/') && dateStr.includes('-')) {
                            const p = dateStr.split('-');
                            if (p.length === 3) {
                                if (p[0].length === 4) dateStr = `${p[2].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[0]}`;
                                else if (p[2].length === 4) dateStr = `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}`;
                            }
                        }
                        finalPayload.poDate = dateStr;
                    }
                } catch (e) {
                    console.warn('Could not auto-fetch poDate in getIMMSPOData:', e);
                }
            }

            console.log('Calling /Vendorsync/fetch-po with payload:', finalPayload);
            const response = await fetch(`${baseUrl}/Vendorsync/fetch-po`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to fetch PO details via Proxy');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('IMMS Fetch Error:', error);
            throw error;
        }
    },

    /**
     * Fetch MA Data from CRIS/IMMS via Sarthi Backend Proxy
     */
    getIMMSMAData: async (payload) => {
        try {
            const baseUrl = getBaseUrl();
            const token = getAuthToken();

            let finalPayload = { ...payload };
            if (!finalPayload.poDate && finalPayload.poNo) {
                try {
                    const poDateRes = await immsService.getPoDateByPoNo(finalPayload.poNo);
                    const rawPoDate = poDateRes?.poDate || poDateRes?.data?.poDate || poDateRes?.responseData?.poDate || poDateRes?.po_date || poDateRes?.poHeader?.poDate || (typeof poDateRes === 'string' ? poDateRes : null);
                    if (rawPoDate) {
                        let dateStr = String(rawPoDate).trim();
                        if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
                        if (!dateStr.includes('/') && dateStr.includes('-')) {
                            const p = dateStr.split('-');
                            if (p.length === 3) {
                                if (p[0].length === 4) dateStr = `${p[2].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[0]}`;
                                else if (p[2].length === 4) dateStr = `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}`;
                            }
                        }
                        finalPayload.poDate = dateStr;
                    }
                } catch (e) {
                    console.warn('Could not auto-fetch poDate in getIMMSMAData:', e);
                }
            }

            console.log('Calling /Vendorsync/fetch-po (MA) with payload:', finalPayload);
            const response = await fetch(`${baseUrl}/Vendorsync/fetch-po`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to fetch MA details via Proxy');
            }

            return await response.json();
        } catch (error) {
            console.error('IMMS Fetch Error (MA):', error);
            throw error;
        }
    },

    /**
     * Fetch exact PO date from local database
     */
    getPoDateByPoNo: async (poNo) => {
        try {
            const baseUrl = getBaseUrl();
            const token = getAuthToken();
            
            const response = await fetch(`${baseUrl}/Vendorsync/po-date?poNo=${encodeURIComponent(poNo)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching PO Date:', error);
            return null;
        }
    },

    /**
     * Save fetched PO data to the local Sarthi backend
     */
    savePOToSarthi: async (payload) => {
        try {
            const baseUrl = getBaseUrl();
            const token = getAuthToken();
            
            // Note: The new uat-sarthi backend uses /Vendorsync/save for this
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
            const token = getAuthToken();
            
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
            const token = getAuthToken();
            
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
            const token = getAuthToken();
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
    },

    getPoAssigned: async (vendorCode, vendorType = 'Elastic Rail Clips') => {
        try {
            const baseUrl = getBaseUrl();
            const token = getAuthToken();
            const endpoint = `${baseUrl}/vendor/po-data?vendorCode=${encodeURIComponent(vendorCode)}&vendorType=${encodeURIComponent(vendorType)}`;
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch PO data');
            const data = await response.json();
            return data.responseData || data;
        } catch (error) {
            console.error('Error fetching PO data:', error);
            throw error;
        }
    },

    getIbsCaseNo: async (payload) => {
        try {
            const baseUrl = getBaseUrl();
            const token = getAuthToken();
            const response = await fetch(`${baseUrl}/ibs/get-case-no`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            return data.responseData || data;
        } catch (error) {
            console.error('Error fetching IBS Case Number:', error);
            throw error;
        }
    },

    saveIbsCaseNo: async (payload) => {
        try {
            const baseUrl = getBaseUrl();
            const token = getAuthToken();
            const response = await fetch(`${baseUrl}/ibs/save-case-no`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            return data.responseData || data;
        } catch (error) {
            console.error('Error saving IBS Case Number:', error);
            throw error;
        }
    }
};
