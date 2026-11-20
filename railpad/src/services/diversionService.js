import axios from 'axios';
import { API_BASE_URL } from './config';

// Rail Pad Material Diversion (Process / Final). Vendor identity comes from the login token.
const BASE = `${API_BASE_URL}/railpad/diversion`;

const authHeaders = () => {
  const token = localStorage.getItem('railpad_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const unwrap = (res) => res?.data?.responseData;

/** Backend error message (validation text) for toasts. */
export const diversionErrorMessage = (err) =>
  err?.response?.data?.responseStatus?.message || err?.message || 'Something went wrong';

const get = async (path, params) => unwrap(await axios.get(`${BASE}${path}`, { params, headers: authHeaders() }));
const post = async (path, body) => unwrap(await axios.post(`${BASE}${path}`, body, { headers: authHeaders() }));

const diversionService = {
  getEligibleSourceIcs: (plantId, stage) => get('/eligible-source-ics', { plantId, stage }),
  getSourceIcLines: (icNo, stage, excludeRequestId) => get('/source-ic-details', { icNo, stage, excludeRequestId }),
  uploadRailwayDoc: async (file) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap(await axios.post(`${BASE}/upload-railway-doc`, form, { headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } }));
  },
  /** Railway permission letter as a blob URL (the storage is private, so it is streamed with the token). */
  openRailwayDoc: async (id) => {
    const res = await axios.get(`${BASE}/doc/${id}`, { headers: authHeaders(), responseType: 'blob' });
    return URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  },
  submit: (dto) => post('/submit', dto),
  update: async (id, dto) => unwrap(await axios.put(`${BASE}/request/${id}`, dto, { headers: authHeaders() })),
  resubmit: (id) => post(`/request/${id}/resubmit`, {}),
  remove: async (id) => unwrap(await axios.delete(`${BASE}/request/${id}`, { headers: authHeaders() })),
  getRequest: (id) => get(`/request/${id}`),
  getVendorRequests: () => get('/vendor/requests'),
  getVendorBasket: () => get('/basket/vendor'),
  getCompleteSourceSrNos: () => get('/complete-source-sr-nos'),
  /** Diverted Process ICs on a target PO serial with remaining balance (for a DIVERTED Final call). */
  getDivertedIcs: (poNo, poSrNo, stage = 'PROCESS') => get('/diverted-ics', { poNo, poSrNo, stage }),
  getHistory: (id) => get(`/history/${id}`),
};

export default diversionService;
