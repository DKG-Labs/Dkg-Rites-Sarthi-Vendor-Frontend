import { API_BASE_URL } from './config';

// Rail Pad Rejection Basket (read-only for vendors; backend limits it to the vendor's own plants)
const base = () => `${API_BASE_URL}/railpad-scrap`;

const authHeaders = (json = true) => {
  const token = localStorage.getItem('railpad_token') || sessionStorage.getItem('railpad_token');
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token.replace(/^Bearer\s+/i, '')}` } : {}),
  };
};

const toQuery = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? `?${new URLSearchParams(clean).toString()}` : '';
};

const handle = async (res) => {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    throw new Error(data?.responseStatus?.message || data?.message || data?.error || `Request failed (HTTP ${res.status})`);
  }
  return data?.responseData !== undefined && data?.responseStatus ? data.responseData : data;
};

export const getRejectionBasket = (filters = {}) =>
  fetch(`${base()}/basket${toQuery(filters)}`, { headers: authHeaders() }).then(handle);

export const getRejectionHistory = (params) =>
  fetch(`${base()}/history${toQuery(params)}`, { headers: authHeaders() }).then(handle);

export const getScrapLedger = (params) =>
  fetch(`${base()}/ledger${toQuery(params)}`, { headers: authHeaders() }).then(handle);

export const getPendingScrap = (plantId, productType) =>
  fetch(`${base()}/pending${toQuery({ plantId, productType })}`, { headers: authHeaders() }).then(handle);

export const getScrapVerification = (id) =>
  fetch(`${base()}/verification/${id}`, { headers: authHeaders() }).then(handle);

// Vendors cannot change scrap verifications; kept so the shared components import cleanly
const notAllowed = () => Promise.reject(new Error('Scrap verifications can only be recorded by the Process IE.'));
export const addScrapVerification = notAllowed;
export const updateScrapVerification = notAllowed;
export const deleteScrapVerification = notAllowed;

export const fetchScrapPhoto = async (url) => {
  const res = await fetch(`${API_BASE_URL}/scrap-entry/image-proxy?url=${encodeURIComponent(url)}`, { headers: authHeaders(false) });
  if (!res.ok) throw new Error('Photo could not be loaded');
  return URL.createObjectURL(await res.blob());
};
