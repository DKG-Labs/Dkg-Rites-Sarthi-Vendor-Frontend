/**
 * Correction Slip Service for Sleeper Vendor Frontend
 * Handles download of Merged IC & Correction Slips and related documents
 */

const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

const API_BASE_URL = isLocal
  ? 'http://localhost:8080/sarthi-backend'
  : 'https://sarthibackendservice-bfe2eag3byfkbsa6.canadacentral-01.azurewebsites.net/sarthi-backend';

const getToken = () => {
  if (typeof window === 'undefined') return '';
  return (
    sessionStorage.getItem('token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('railpad_token') ||
    localStorage.getItem('sleeper_token') ||
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('jwtToken') ||
    ''
  );
};

const getAuthHeaders = () => {
  const token = getToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return headers;
};

const endpoint = `${API_BASE_URL}/api/correction-slip`;

/**
 * Fetch all stored Correction Slip PDFs metadata for a call number.
 * @param {string} callNo
 * @returns {Promise<Array>}
 */
export const fetchCorrectionSlipDocuments = async (callNo) => {
  if (!callNo) return [];
  const cleanCallNo = String(callNo).replace(/^:+/, '').trim();

  try {
    const response = await fetch(`${endpoint}/documents?callNo=${encodeURIComponent(cleanCallNo)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Could not fetch correction slip documents list:', e.message);
    return [];
  }
};

/**
 * Download merged original IC and all correction slips for a call number into a single PDF.
 * If no correction slips exist, calls callbacks.onNotFound with "No correction slip has been found this call".
 * @param {string} callNo
 * @param {Object} callbacks - { onNotFound, onSuccess, onError }
 * @returns {Promise<boolean>}
 */
export const downloadMergedIcAndCorrectionSlip = async (callNo, callbacks = {}) => {
  if (!callNo) throw new Error('Call number is required.');
  const cleanCallNo = String(callNo).replace(/^:+/, '').trim();
  const token = getToken();
  const url = `${endpoint}/download-merged-ic?callNo=${encodeURIComponent(cleanCallNo)}`;

  const headers = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await fetch(url, { method: 'GET', headers });

  if (response.status === 404 || response.status === 204) {
    const data = await response.json().catch(() => ({}));
    const msg = data.message || 'No correction slip has been found this call';
    if (typeof callbacks.onNotFound === 'function') {
      callbacks.onNotFound(msg);
      return false;
    }
    throw new Error(msg);
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error || errData.message || `Failed to download merged PDF (HTTP ${response.status})`;
    if (errMsg.includes('No correction slip') && typeof callbacks.onNotFound === 'function') {
      callbacks.onNotFound(errMsg);
      return false;
    }
    throw new Error(errMsg);
  }

  const blob = await response.blob();
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(pdfBlob);

  const safeCall = cleanCallNo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Merged_IC_${safeCall}.pdf`;

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);

  if (typeof callbacks.onSuccess === 'function') {
    callbacks.onSuccess();
  }
  return true;
};

const correctionSlipService = {
  fetchCorrectionSlipDocuments,
  downloadMergedIcAndCorrectionSlip,
};

export default correctionSlipService;
