const BASE_URL = 'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/api';

export const apiService = {
    // HTS Wire APIs
    getHtsWires: async () => {
        try {
            const response = await fetch(`${BASE_URL}/hts-wire`);
            if (!response.ok) throw new Error('Failed to fetch HTS wires');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getHtsWireById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/hts-wire/${id}`);
            if (!response.ok) throw new Error(`Failed to fetch HTS wire with id ${id}`);
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    saveHtsWire: async (htsData) => {
        try {
            const isUpdate = htsData.id && !isNaN(htsData.id);
            const url = isUpdate ? `${BASE_URL}/hts-wire/${htsData.id}` : `${BASE_URL}/hts-wire`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(htsData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save HTS wire');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteHtsWire: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/hts-wire/${id}`, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete HTS wire');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Cement Receipt APIs
    getCements: async () => {
        try {
            const response = await fetch(`${BASE_URL}/cement`);
            if (!response.ok) throw new Error('Failed to fetch cement records');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getCementById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/cement/${id}`);
            if (!response.ok) throw new Error(`Failed to fetch cement with id ${id}`);
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    saveCement: async (cementData) => {
        try {
            const isUpdate = cementData.id && !isNaN(cementData.id);
            const url = isUpdate ? `${BASE_URL}/cement/${cementData.id}` : `${BASE_URL}/cement`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(cementData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save cement');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteCement: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/cement/${id}`, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete cement record');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Dowel APIs
    getDowels: async () => {
        try {
            const response = await fetch(`${BASE_URL}/dowel`);
            if (!response.ok) throw new Error('Failed to fetch dowel records');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getDowelById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/dowel/${id}`);
            if (!response.ok) throw new Error(`Failed to fetch dowel with id ${id}`);
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    saveDowel: async (dowelData) => {
        try {
            const isUpdate = dowelData.id && !isNaN(dowelData.id);
            const url = isUpdate ? `${BASE_URL}/dowel/${dowelData.id}` : `${BASE_URL}/dowel`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(dowelData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save dowel');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteDowel: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/dowel/${id}`, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete dowel record');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Aggregates APIs
    getAggregates: async () => {
        try {
            const response = await fetch(`${BASE_URL}/aggregates`);
            if (!response.ok) throw new Error('Failed to fetch aggregate records');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getAggregateById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/aggregates/${id}`);
            if (!response.ok) throw new Error(`Failed to fetch aggregate with id ${id}`);
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    saveAggregate: async (aggregateData) => {
        try {
            const isUpdate = aggregateData.id && !isNaN(aggregateData.id);
            const url = isUpdate ? `${BASE_URL}/aggregates/${aggregateData.id}` : `${BASE_URL}/aggregates`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(aggregateData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save aggregate');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteAggregate: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/aggregates/${id}`, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete aggregate record');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Admixture APIs
    getAdmixtures: async () => {
        try {
            const response = await fetch(`${BASE_URL}/admixture`);
            if (!response.ok) throw new Error('Failed to fetch admixture records');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getAdmixtureById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/admixture/${id}`);
            if (!response.ok) throw new Error(`Failed to fetch admixture with id ${id}`);
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    saveAdmixture: async (admixtureData) => {
        try {
            const isUpdate = admixtureData.id && !isNaN(admixtureData.id);
            const url = isUpdate ? `${BASE_URL}/admixture/${admixtureData.id}` : `${BASE_URL}/admixture`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(admixtureData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save admixture');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteAdmixture: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/admixture/${id}`, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete admixture record');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // SGCI Insert APIs
    getSgciInserts: async () => {
        try {
            const response = await fetch(`${BASE_URL}/sgci-insert`);
            if (!response.ok) throw new Error('Failed to fetch SGCI insert records');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getSgciInsertById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/sgci-insert/${id}`);
            if (!response.ok) throw new Error(`Failed to fetch SGCI insert with id ${id}`);
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    saveSgciInsert: async (sgciData) => {
        try {
            const isUpdate = sgciData.id && !isNaN(sgciData.id);
            const url = isUpdate ? `${BASE_URL}/sgci-insert/${sgciData.id}` : `${BASE_URL}/sgci-insert`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(sgciData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save SGCI insert');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteSgciInsert: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/sgci-insert/${id}`, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete SGCI insert record');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Existing / Legacy APIs
    getScadaRecords: async (page, size, batch) => {
        try {
            const response = await fetch(`${BASE_URL}/scada?page=${page}&size=${size}&batch=${batch}`);
            if (!response.ok) throw new Error('Failed to fetch SCADA data');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    saveDeclaration: async (declarationData) => {
        try {
            const response = await fetch(`${BASE_URL}/declaration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(declarationData)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    saveWitnessRecord: async (record) => {
        try {
            const response = await fetch(`${BASE_URL}/witnessed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getWitnessedRecords: async () => {
        try {
            const response = await fetch(`${BASE_URL}/witnessed`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getTensionRecords: async (page, size, batch) => {
        try {
            const response = await fetch(`${BASE_URL}/tension?page=${page}&size=${size}&batch=${batch}`);
            if (!response.ok) throw new Error('Failed to fetch Tension data');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
};
