const BASE_URL = 'http://localhost:5000/api'; // Replace with your actual backend URL

export const apiService = {
    // SCADA Feed
    getScadaRecords: async (page, size, batch) => {
        try {
            const response = await fetch(`${BASE_URL}/scada?page=${page}&size=${size}&batch=${batch}`);
            if (!response.ok) throw new Error('Failed to fetch SCADA data');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Fallback for demo purposes if backend isn't ready
            return null;
        }
    },

    // Initial Declaration
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

    // Witnessed / Manual Entry
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
