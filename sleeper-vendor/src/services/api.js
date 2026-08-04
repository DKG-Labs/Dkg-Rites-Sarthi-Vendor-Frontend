export const BASE_URL = 'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/api';
//export const BASE_URL = "http://localhost:8080/sarthi-backend/api";
//export const BASE_URL = "https://api.ritesqasarthi.com/sarthi-backend/api";
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

    // Production Declaration APIs
    getProductionDeclarations: async () => {
        try {
            const response = await fetch(`${BASE_URL}/production-declaration/getAll`);
            if (!response.ok) throw new Error('Failed to fetch production declarations');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getProductionDeclarationById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/production-declaration/${id}`);
            if (!response.ok) throw new Error(`Failed to fetch production declaration with id ${id}`);
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    saveProductionDeclaration: async (pdData) => {
        try {
            const isUpdate = pdData.id && !isNaN(pdData.id);
            const url = isUpdate ? `${BASE_URL}/production-declaration/update/${pdData.id}` : `${BASE_URL}/production-declaration/create`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(pdData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save production declaration');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteProductionDeclaration: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/production-declaration/delete/${id}`, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete production declaration');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Plant Profile APIs
    getPlantProfiles: async () => {
        try {
            const response = await fetch(`${BASE_URL}/plant-profile`);
            if (!response.ok) throw new Error('Failed to fetch plant profiles');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    savePlantProfile: async (plantData) => {
        try {
            const isUpdate = plantData.id && !isNaN(plantData.id);
            const url = isUpdate ? `${BASE_URL}/plant-profile/${plantData.id}` : `${BASE_URL}/plant-profile`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(plantData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save plant profile');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deletePlantProfile: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/plant-profile/${id}`, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete plant profile');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getPlantDetails: async (vendorCode) => {
        try {
            const url = `${BASE_URL}/plant-profile/plant-details?vendorCode=${encodeURIComponent(vendorCode)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to fetch plant details');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    // Mix Design APIs
    getMixDesigns: async () => {
        try {
            const response = await fetch(`${BASE_URL}/mix-design`);
            if (!response.ok) throw new Error('Failed to fetch mix designs');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    saveMixDesign: async (mixData) => {
        try {
            const isUpdate = mixData.id && !isNaN(mixData.id);
            const url = isUpdate ? `${BASE_URL}/mix-design/${mixData.id}` : `${BASE_URL}/mix-design`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(mixData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save mix design');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteMixDesign: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/mix-design/${id}`, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete mix design');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Raw Material Source APIs
    getRawMaterialSources: async () => {
        try {
            const response = await fetch(`${BASE_URL}/raw-material-source`);
            if (!response.ok) throw new Error('Failed to fetch raw material sources');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    saveRawMaterialSource: async (rmData) => {
        try {
            const isUpdate = rmData.id && !isNaN(rmData.id);
            const url = isUpdate ? `${BASE_URL}/raw-material-source/${rmData.id}` : `${BASE_URL}/raw-material-source`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(rmData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save raw material source');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteRawMaterialSource: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/raw-material-source/${id}`, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete raw material source');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Stress Bench Master APIs (Uses different base path without /api)
    getStressBenches: async () => {
        try {
            const url = `${BASE_URL}/stress-bench/getAll`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch stress benches');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    saveStressBench: async (benchData) => {
        try {
            const isUpdate = benchData.id && !isNaN(benchData.id);
            const path = isUpdate ? `/stress-bench/update/${benchData.id}` : '/stress-bench/create';
            const url = `${BASE_URL}${path}`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(benchData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save stress bench');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteStressBench: async (id) => {
        try {
            const url = `${BASE_URL}/stress-bench/delete/${id}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete stress bench');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Longline Bench APIs
    getLongLines: async () => {
        try {
            const url = `${BASE_URL}/longLine-bench/all`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch longlines');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    saveLongLine: async (longlineData) => {
        try {
            const isUpdate = longlineData.id && !isNaN(longlineData.id);
            const path = isUpdate ? `/longLine-bench/update/${longlineData.id}` : '/longLine-bench/create';
            const url = `${BASE_URL}${path}`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(longlineData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Failed to save longline');
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteLongLine: async (id) => {
        try {
            const url = `${BASE_URL}/longLine-bench/delete/${id}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete longline');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteBenchMouldStressLongline: async (id) => {
        try {
            const url = `${BASE_URL}/bench-mould-stress-longline/delete/${id}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to delete bench mould data');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getAllBenchMouldStressLongline: async () => {
        try {
            const response = await fetch(`${BASE_URL}/bench-mould-stress-longline/getAll`, {
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to fetch bench mould data');
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getBenchMouldStressLonglineById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/bench-mould-stress-longline/get/${id}`, {
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error(`Failed to fetch bench mould data with id ${id}`);
            const data = await response.json();
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    updateBenchMouldStressLongline: async (id, payload) => {
        try {
            const response = await fetch(`${BASE_URL}/bench-mould-stress-longline/update/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Update Error');
            return data;
        } catch (error) {
            console.error('Unified API Error:', error);
            throw error;
        }
    },

    saveBenchMouldStressLongline: async (payload) => {
        try {
            const response = await fetch(`${BASE_URL}/bench-mould-stress-longline/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.responseStatus?.message || 'Integration Error');
            return data;
        } catch (error) {
            console.error('Unified API Error:', error);
            throw error;
        }
    },
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

    submitSleeperInspectionCall: async (payload) => {
        try {
            const response = await fetch(`${BASE_URL}/FinalInspectionController/submit-inspection-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to submit inspection call');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getVendorPlants: async (vendorCode) => {
        try {
            const url = `${BASE_URL}/vendor-plant/vendor/${encodeURIComponent(vendorCode)}/plants`;
            const response = await fetch(url, {
                headers: { 'accept': '*/*' }
            });
            if (!response.ok) throw new Error('Failed to fetch plants');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getVendorInspectionCalls: async (userId = 118) => {
        try {
            const response = await fetch(`${BASE_URL}/FinalInspectionController/inspection-calls?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch inspection calls');
            const data = await response.json();
            return data.responseData || [];
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getCompletedBatches: async (sleeperType, userId) => {
        try {
            const finalUserId = userId || sessionStorage.getItem('vendorCode') || ':41647';
            const response = await fetch(`${BASE_URL}/FinalInspectionController/completed-batches?sleeperType=${encodeURIComponent(sleeperType)}&userId=${encodeURIComponent(finalUserId)}`);
            if (!response.ok) throw new Error('Failed to fetch completed batches');
            const data = await response.json();
            return data.responseData || [];
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getDistinctSleeperTypes: async (userId) => {
        try {
            const finalUserId = userId || sessionStorage.getItem('vendorCode') || ':41647';
            const response = await fetch(`${BASE_URL}/FinalInspectionController/distinct-sleeper-types?userId=${encodeURIComponent(finalUserId)}`);
            if (!response.ok) throw new Error('Failed to fetch distinct sleeper types');
            const data = await response.json();
            return data.responseData || [];
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getVendorPOs: async (vendorCode) => {
        try {
            const finalCode = vendorCode || sessionStorage.getItem('vendorCode') || ':41647';
            const response = await fetch(`${BASE_URL}/vendor/poData?vendorCode=${encodeURIComponent(finalCode)}&vendorType=Sleeper`);
            if (!response.ok) throw new Error('Failed to fetch POs');
            const data = await response.json();
            return data.responseData || [];
        } catch (error) {
            console.error('API Error:', error);
            return [];
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
    },

    // Workflow APIs
    getAllPendingWorkflowTransitions: async (roleName = 'IE') => {
        try {
            const response = await fetch(`${BASE_URL}/sleeper-workflow/allPendingWorkflowTransition?roleName=${roleName}`);
            if (!response.ok) throw new Error('Failed to fetch pending transitions');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    performTransitionAction: async (actionData) => {
        try {
            const response = await fetch(`${BASE_URL}/sleeper-workflow/performTransitionAction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(actionData)
            });
            if (!response.ok) throw new Error('Failed to perform transition action');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getWorkflowHistory: async (requestId) => {
        try {
            const response = await fetch(`${BASE_URL}/sleeper-workflow/WorkflowTransitionHistory?requestId=${requestId}`);
            if (!response.ok) throw new Error('Failed to fetch workflow history');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Module Specific Getters for Edit Flow
    getPlantProfileById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/plant-profile/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getBenchMouldMasterById: async (id) => {
        try {
            const url = `${BASE_URL}/stress-bench/${id}`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getRawMaterialSourceById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/raw-material-source/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getMixDesignById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/mix-design/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getHtsWireRecordById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/hts-wire/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getCementRecordById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/cement/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getAdmixtureRecordById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/admixture/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getAggregateRecordById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/aggregates/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getSgciRecordById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/sgci-insert/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getDowelRecordById: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/dowel/${id}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    updateCementInventory: async (id, data) => {
        try {
            const response = await fetch(`${BASE_URL}/cement/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update cement inventory');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // IMMS Sync APIs
    authenticateIMMS: async () => {
        try {
            const sarthiToken = sessionStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/Vendorsync/authenticate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sarthiToken}`
                }
            });

            // Handle non-JSON responses (usually proxy errors)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                if (text.trim().startsWith('<!DOCTYPE html>')) {
                    throw new Error('Proxy Server Connection Failed: Received HTML instead of JSON.');
                }
                throw new Error('IMMS server returned non-JSON response.');
            }

            const data = await response.json();
            const token = data.token || data.jwt || data.accessToken || data.Jwt;

            if (token) {
                sessionStorage.setItem('imms_token', token);
                return token;
            }
            throw new Error('Failed to authenticate with IMMS - No token received');
        } catch (error) {
            console.error('IMMS Auth Error:', error);
            throw error;
        }
    },

    getIMMSPOData: async (payload) => {
        try {
            const token = sessionStorage.getItem('token');

            const response = await fetch(`${BASE_URL}/Vendorsync/fetch-po`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to fetch PO details via Proxy');
            }
            return await response.json();
        } catch (error) {
            console.error('IMMS Get PO Data Error:', error);
            throw error;
        }
    },

    getIMMSMAData: async (payload) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/Vendorsync/fetch-po`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to fetch MA details via Proxy');
            }
            return await response.json();
        } catch (error) {
            console.error('IMMS Get MA Data Error:', error);
            throw error;
        }
    },

    getPoDateByPoNo: async (poNo) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/Vendorsync/po-date?poNo=${encodeURIComponent(poNo)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to fetch PO Date');
            }
            return await response.json();
        } catch (error) {
            console.error('Get PO Date Error:', error);
            throw error;
        }
    },

    savePOData: async (payload) => {
        try {
            const response = await fetch(`${BASE_URL}/Vendorsync/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Save PO Sync Error:', error);
            throw error;
        }
    },

    savePoMaData: async (payload) => {
        try {
            const response = await fetch(`${BASE_URL}/Vendorsync/savePoMa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Save PO MA Sync Error:', error);
            throw error;
        }
    },

    getRlyList: async () => {
        try {
            const response = await fetch(`${BASE_URL}/vendor-plant/Rlylist`, {
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
    },

    // RM Consumption APIs
    getRmConsumptions: async (plantId) => {
        try {
            const response = await fetch(`${BASE_URL}/rm-consumption/plant/${plantId}`);
            if (!response.ok) throw new Error('Failed to fetch RM consumptions');
            const data = await response.json();
            return data.responseData || [];
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getRmConsumptionsByMaterial: async (plantId, material, statuses = [], page = 0, size = 10) => {
        try {
            let url = `${BASE_URL}/rm-consumption/by-plant-material?plantId=${encodeURIComponent(plantId)}&material=${encodeURIComponent(material)}&page=${page}&size=${size}`;
            if (statuses && statuses.length > 0) {
                url += `&statuses=${statuses.join(',')}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch RM consumptions by material');
            const data = await response.json();
            return data || { responseData: [], totalPages: 0, totalItems: 0 };
        } catch (error) {
            console.error('API Error:', error);
            return { responseData: [], totalPages: 0, totalItems: 0 };
        }
    },

    getAllVerifiedRmConsumptions: async (plantId, material) => {
        try {
            const response = await fetch(`${BASE_URL}/rm-consumption/by-plant-material/all-verified?plantId=${encodeURIComponent(plantId)}&material=${encodeURIComponent(material)}`);
            if (!response.ok) throw new Error('Failed to fetch all verified RM consumptions');
            const data = await response.json();
            return data.responseData || [];
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    deleteRmConsumption: async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/rm-consumption/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete RM consumption');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },


    saveRmConsumption: async (consumptionData) => {
        try {
            const isUpdate = consumptionData.numericId != null;
            const url = isUpdate ? `${BASE_URL}/rm-consumption/${consumptionData.numericId}` : `${BASE_URL}/rm-consumption`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
                body: JSON.stringify(consumptionData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to save RM consumption');
            return data.responseData;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

};
