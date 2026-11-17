// Small stale-while-revalidate cache (no external dependency).
//
//   age < freshMs             -> serve cache, no request
//   freshMs <= age < expireMs -> serve cache, refresh in the background (isValidating)
//   age >= expireMs / missing -> no usable data: isLoading (skeleton) while fetching
//
// Entries live in a module-level Map shared by every component, mirrored to sessionStorage
// so a reload paints instantly. Concurrent requests for one key are de-duplicated, and a
// request is aborted when no mounted component needs its key any more.
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

const STORAGE_PREFIX = 'swr:';
const EMPTY = Object.freeze({ data: undefined, error: null, fetchedAt: 0, isFetching: false, expired: false, keepVisible: false });

const entries = new Map();   // key -> snapshot (replaced, never mutated)
const listeners = new Map(); // key -> Set<fn>
const inflight = new Map();  // key -> { promise, controller, timedOut }
const retainCount = new Map();

const storage = () => {
    try { return typeof window !== 'undefined' ? window.sessionStorage : null; } catch { return null; }
};

const readStored = (key) => {
    try {
        const raw = storage()?.getItem(STORAGE_PREFIX + key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && 'data' in parsed && typeof parsed.fetchedAt === 'number' ? parsed : null;
    } catch { return null; }
};

const writeStored = (key, data, fetchedAt) => {
    try { storage()?.setItem(STORAGE_PREFIX + key, JSON.stringify({ data, fetchedAt })); } catch { /* full or blocked */ }
};

const removeStored = (key) => {
    try { storage()?.removeItem(STORAGE_PREFIX + key); } catch { /* ignore */ }
};

const getEntry = (key, expireMs) => {
    if (!key) return EMPTY;
    let entry = entries.get(key);
    if (!entry) {
        const stored = readStored(key);
        entry = stored ? { ...EMPTY, data: stored.data, fetchedAt: stored.fetchedAt } : EMPTY;
        if (stored) entries.set(key, entry);
    }
    // Past the hard expiry: flag it right away so expired data is never painted, even for
    // one frame. Replacing the snapshot without notifying is safe: every reader sees the
    // same object from here on.
    if (expireMs && entry.data !== undefined && !entry.expired && !entry.keepVisible && !entry.isFetching
        && Date.now() - entry.fetchedAt >= expireMs) {
        entry = { ...entry, expired: true };
        entries.set(key, entry);
    }
    return entry;
};

const setEntry = (key, patch) => {
    entries.set(key, { ...getEntry(key), ...patch });
    (listeners.get(key) || []).forEach((fn) => fn());
};

const subscribeKey = (key, fn) => {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);
    return () => listeners.get(key)?.delete(fn);
};

const startFetch = (key, fetcher, timeoutMs) => {
    const running = inflight.get(key);
    if (running) return running.promise;

    const controller = new AbortController();
    const record = { controller, timedOut: false, promise: null };
    const timer = setTimeout(() => { record.timedOut = true; controller.abort(); }, timeoutMs);

    setEntry(key, { isFetching: true, error: null });
    // Start the request synchronously so it is in flight before this call returns
    let request;
    try { request = Promise.resolve(fetcher({ signal: controller.signal })); } catch (err) { request = Promise.reject(err); }
    record.promise = request
        .then((data) => {
            const fetchedAt = Date.now();
            writeStored(key, data, fetchedAt);
            setEntry(key, { data, fetchedAt, error: null, isFetching: false, expired: false, keepVisible: false });
            return data;
        })
        .catch((err) => {
            const releasedByUnmount = controller.signal.aborted && !record.timedOut;
            const error = releasedByUnmount ? null
                : record.timedOut ? new Error('Request timed out. Please try again.')
                : err instanceof Error ? err : new Error(String(err));
            setEntry(key, { isFetching: false, error });
            return undefined;
        })
        .finally(() => {
            clearTimeout(timer);
            if (inflight.get(key) === record) inflight.delete(key);
        });
    inflight.set(key, record);
    return record.promise;
};

/** Fetches when the entry is missing, stale or invalidated; marks expired data as unusable */
const revalidateIfNeeded = (key, fetcher, { freshMs, expireMs, timeoutMs }) => {
    const entry = getEntry(key);
    const hasData = entry.data !== undefined;
    const age = hasData ? Date.now() - entry.fetchedAt : Infinity;
    if (hasData && age < freshMs && !entry.keepVisible) return;
    if (hasData && age >= expireMs && !entry.keepVisible && !entry.expired) setEntry(key, { expired: true });
    startFetch(key, fetcher, timeoutMs);
};

const retain = (key) => retainCount.set(key, (retainCount.get(key) || 0) + 1);

const release = (key) => {
    const left = (retainCount.get(key) || 1) - 1;
    if (left > 0) { retainCount.set(key, left); return; }
    retainCount.delete(key);
    const running = inflight.get(key);
    if (running) { running.controller.abort(); inflight.delete(key); }
};

/** Replace cached data for a key (e.g. optimistic delete). updater receives the current data. */
export const mutateCache = (key, updater) => {
    const current = getEntry(key);
    if (current.data === undefined) return;
    const data = typeof updater === 'function' ? updater(current.data) : updater;
    writeStored(key, data, current.fetchedAt);
    setEntry(key, { data });
};

/**
 * Marks every key starting with prefix as needing a refresh. Cached data stays visible, so
 * the next revalidation happens in the background instead of showing a skeleton.
 */
export const invalidate = (prefix) => {
    [...entries.keys()].filter((k) => k.startsWith(prefix))
        .forEach((k) => setEntry(k, { keepVisible: true, fetchedAt: 0 }));
    try {
        const s = storage();
        if (!s) return;
        const stale = [];
        for (let i = 0; i < s.length; i++) {
            const k = s.key(i);
            if (k && k.startsWith(STORAGE_PREFIX + prefix) && !entries.has(k.slice(STORAGE_PREFIX.length))) stale.push(k);
        }
        stale.forEach((k) => s.removeItem(k));
    } catch { /* ignore */ }
};

/** Drops all cached entries (used by tests and on logout-style resets) */
export const clearSWRCache = () => {
    inflight.forEach((r) => r.controller.abort());
    [...entries.keys()].forEach(removeStored);
    entries.clear(); inflight.clear(); retainCount.clear();
};

/**
 * @param {string|null} key      cache key; null/'' or enabled=false disables the hook
 * @param {(ctx:{signal:AbortSignal}) => Promise<any>} fetcher
 * @param {{enabled?:boolean, freshMs:number, expireMs:number, timeoutMs:number}} options
 */
export const useSWRCache = (key, fetcher, { enabled = true, freshMs, expireMs, timeoutMs } = {}) => {
    const active = Boolean(enabled && key);
    const fetcherRef = useRef(fetcher);
    useEffect(() => { fetcherRef.current = fetcher; });

    const subscribe = useCallback((fn) => (active ? subscribeKey(key, fn) : () => {}), [active, key]);
    const getSnapshot = useCallback(() => (active ? getEntry(key, expireMs) : EMPTY), [active, key, expireMs]);
    const entry = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    useEffect(() => {
        if (!active) return undefined;
        const opts = { freshMs, expireMs, timeoutMs };
        const run = () => revalidateIfNeeded(key, (ctx) => fetcherRef.current(ctx), opts);
        retain(key);
        run();
        const onVisible = () => {
            if (typeof document === 'undefined' || document.visibilityState === 'visible') run();
        };
        window.addEventListener('focus', onVisible);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.removeEventListener('focus', onVisible);
            document.removeEventListener('visibilitychange', onVisible);
            release(key);
        };
    }, [active, key, freshMs, expireMs, timeoutMs]);

    /** Force a refresh now (keeps current data visible while it runs) */
    const revalidate = useCallback(() => {
        if (!active) return Promise.resolve(undefined);
        return startFetch(key, (ctx) => fetcherRef.current(ctx), timeoutMs);
    }, [active, key, timeoutMs]);

    const mutate = useCallback((updater) => { if (active) mutateCache(key, updater); }, [active, key]);

    const usable = entry.data !== undefined && !entry.expired;
    return {
        data: usable ? entry.data : undefined,
        error: entry.error,
        isLoading: active && !usable && !entry.error,
        isValidating: active && usable && entry.isFetching,
        revalidate,
        mutate,
    };
};
