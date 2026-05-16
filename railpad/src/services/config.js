// const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// export const API_BASE_URL = isLocal
//    ? 'http://localhost:8080/sarthi-backend/api'
//    : 'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/api';

// For Deployment:
 export const API_BASE_URL = "https://api.ritesqasarthi.com/sarthi-backend/api";
// export const API_BASE_URL =  "https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend/api";

export const API_CONFIG = {
    PRODUCTION_DECLARATION: `${API_BASE_URL}/rail-production-declaration`,
    PRODUCT_RECIPE: `${API_BASE_URL}/rail-product-recipe`,
    PLANT_SETUP: `${API_BASE_URL}/rail-plant-setup`,
    RAW_MATERIAL: `${API_BASE_URL}/rail-raw-material-source`,
    PLANT_MAPPING: `${API_BASE_URL}/railpad-vendor-plant`,
    APPROVED_ASH_SG: `${API_BASE_URL}/rail-approved-ash-sg`,
    APPROVED_QAP: `${API_BASE_URL}/rail-approved-qap`,
    AUTH: `${API_BASE_URL}/auth`,
    PO_ASSIGNED: `${API_BASE_URL}/vendor/po-assigned`,
    PO_DATA: `${API_BASE_URL}/vendor/poData`,
    RAILPAD_WORKFLOW: `${API_BASE_URL}/railpad-workflow`,
    IE_PRODUCTION_VERIFICATION: `${API_BASE_URL}/ie-production-verification`,
    RAIL_INSPECTION_CALL: `${API_BASE_URL}/rail-inspection-call`,
    SYNC: `${API_BASE_URL}/sync`
};
