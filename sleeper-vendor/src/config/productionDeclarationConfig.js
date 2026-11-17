// Tunables for the Production Declaration dashboard (date filter, search, caching).
// Every value can be overridden per environment through a Vite env variable, e.g.
// VITE_PD_CACHE_FRESH_MS=30000 in .env, so nothing has to be edited in code.

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

const positiveNumber = (raw, fallback) => {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

const numberList = (raw, fallback) => {
    if (!raw) return fallback;
    const list = String(raw)
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
    return list.length ? [...new Set(list)].sort((a, b) => a - b) : fallback;
};

// Display/typing format for the custom From/To dates. Must contain dd, mm and yyyy once
// each (any separators), e.g. 'dd-mm-yyyy' or 'dd/mm/yyyy'; anything else uses the default.
const dateFormat = (raw, fallback) => {
    if (!raw) return fallback;
    const f = String(raw).trim().toLowerCase();
    const once = (t) => f.split(t).length === 2;
    const leftover = f.replace(/yyyy|dd|mm/g, '');
    return once('dd') && once('mm') && once('yyyy') && !/[a-z0-9]/.test(leftover) ? f : fallback;
};

const cacheFreshMs = positiveNumber(env.VITE_PD_CACHE_FRESH_MS, 30_000);
const presetDays = numberList(env.VITE_PD_PRESET_DAYS, [7, 30, 60, 90]);
const defaultPresetDays = positiveNumber(env.VITE_PD_DEFAULT_DAYS, 30);

export const PD_CONFIG = Object.freeze({
    // Data younger than this is served from cache with no request
    cacheFreshMs,
    // Between fresh and expire: show cached data and refresh in the background.
    // Older than expire: show the skeleton and fetch. Never shorter than the fresh window.
    cacheExpireMs: Math.max(cacheFreshMs, positiveNumber(env.VITE_PD_CACHE_EXPIRE_MS, 45_000)),
    requestTimeoutMs: positiveNumber(env.VITE_PD_REQUEST_TIMEOUT_MS, 20_000),
    // Window the dashboard has always loaded; the shift form's duplicate-bench check and
    // batch suggestion keep using exactly this window
    baseWindowDays: positiveNumber(env.VITE_PD_BASE_WINDOW_DAYS, 60),
    presetDays,
    defaultPresetDays: presetDays.includes(defaultPresetDays) ? defaultPresetDays : presetDays[0],
    searchDebounceMs: positiveNumber(env.VITE_PD_SEARCH_DEBOUNCE_MS, 250),
    dateInputFormat: dateFormat(env.VITE_PD_DATE_INPUT_FORMAT, 'dd-mm-yyyy'),
    cacheKeyPrefix: 'pd:',
    rangeStorageKey: 'pd_date_range',
    // Cache key used by the dashboard before this change; cleared once so it doesn't linger
    legacyCacheKey: 'pd_declarations_cache',
});
