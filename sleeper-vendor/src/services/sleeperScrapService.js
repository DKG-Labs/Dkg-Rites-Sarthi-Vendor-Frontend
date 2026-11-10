import { useEffect, useState, createElement } from 'react';
import { BASE_URL, getAuthHeaders, getAuthToken } from './api';

// Sleeper Rejection Basket / Scrap Ledger for the vendor (read-only, own plants only; backend: /api/sleeper-scrap)
const base = () => `${BASE_URL}/sleeper-scrap`;

const toQuery = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? `?${new URLSearchParams(clean).toString()}` : '';
};

/** Reads the backend's error message (plain or wrapped in responseStatus) */
const handle = async (res) => {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    throw new Error(data?.responseStatus?.message || data?.message || data?.error || `Request failed (HTTP ${res.status})`);
  }
  return data?.responseData !== undefined && data?.responseStatus ? data.responseData : data;
};

/**
 * One network call per identical GET while it is in flight. React StrictMode (dev) mounts every component
 * twice, which would otherwise fire each on-mount request twice; callers share the same promise instead.
 */
const inflight = new Map();
const getOnce = (url) => {
  if (inflight.has(url)) return inflight.get(url);
  const p = fetch(url, { headers: getAuthHeaders() }).then(handle).finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
};

export const getSleeperBasket = () => getOnce(`${base()}/basket`);

export const getPendingSleepers = (plantId) => getOnce(`${base()}/pending${toQuery({ plantId })}`);

export const getSleeperLedger = (plantId) => getOnce(`${base()}/ledger${toQuery({ plantId })}`);

export const getSleeperScrapVerification = (id) => getOnce(`${base()}/verification/${id}`);

// Read-only here: scrap verifications are recorded by the IE (the backend rejects them for vendors too)
export const deleteSleeperScrapVerification = () =>
  Promise.reject(new Error('Scrap verifications can only be changed by the IE.'));

/** Scrap photos are in a private container: load them through the backend proxy with the login token */
const fetchScrapPhoto = async (url) => {
  // Token only: an Accept: application/json header would make the image endpoint answer 406
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE_URL}/scrap-entry/image-proxy${toQuery({ url })}`, { headers });
  if (!res.ok) throw new Error('Photo could not be loaded');
  return URL.createObjectURL(await res.blob());
};

/** <img> that loads a private scrap photo (or shows a local base64 / blob preview directly) */
export function AuthedImg({ src, alt, ...props }) {
  const [blobSrc, setBlobSrc] = useState(null);
  const isLocal = !!src && (src.startsWith('data:') || src.startsWith('blob:'));

  useEffect(() => {
    if (!src || isLocal) return undefined;
    let alive = true;
    let objectUrl;
    fetchScrapPhoto(src)
      .then(u => {
        objectUrl = u;
        if (alive) setBlobSrc(u);
        else URL.revokeObjectURL(u);
      })
      .catch(() => alive && setBlobSrc(null));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, isLocal]);

  const shown = isLocal ? src : blobSrc;
  if (!shown) return null;
  return createElement('img', { src: shown, alt, ...props });
}
