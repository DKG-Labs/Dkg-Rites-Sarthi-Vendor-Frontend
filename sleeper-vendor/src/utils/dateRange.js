// Date helpers for range filters. All ISO strings are local calendar dates (yyyy-MM-dd);
// Date#toISOString is avoided because it converts to UTC and shifts the day in IST.

const pad = (n) => String(n).padStart(2, '0');

/** Local Date -> 'yyyy-MM-dd' */
export const toISO = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const isRealDate = (y, m, d) => {
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

/**
 * Normalises a casting date from the API to 'yyyy-MM-dd'. Accepts 'dd/MM/yyyy', 'dd-MM-yyyy'
 * and 'yyyy-MM-dd' (with or without a time part). Returns null when it can't be read.
 */
export const normalizeToISO = (value) => {
    if (!value || typeof value !== 'string') return null;
    const s = value.trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) {
        const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
        return isRealDate(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
    }
    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (m) {
        const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
        return isRealDate(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
    }
    return null;
};

const TOKENS = /yyyy|dd|mm/g;

/** ISO 'yyyy-MM-dd' -> text in the given pattern (tokens dd, mm, yyyy), e.g. '19-08-2026' */
export const formatISOAs = (iso, pattern) => {
    const norm = normalizeToISO(iso);
    if (!norm || !pattern) return '';
    const [yyyy, mm, dd] = norm.split('-');
    const parts = { yyyy, mm, dd };
    return pattern.toLowerCase().replace(TOKENS, (t) => parts[t]);
};

/** Text typed in the given pattern -> ISO 'yyyy-MM-dd', or null when incomplete/invalid */
export const parseAsPattern = (text, pattern) => {
    if (!text || typeof text !== 'string' || !pattern) return null;
    const order = [];
    const source = pattern.toLowerCase()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(TOKENS, (t) => { order.push(t); return t === 'yyyy' ? '(\\d{4})' : '(\\d{1,2})'; });
    const m = text.trim().match(new RegExp(`^${source}$`));
    if (!m) return null;
    const v = {};
    order.forEach((t, i) => { v[t] = Number(m[i + 1]); });
    return isRealDate(v.yyyy, v.mm, v.dd) ? `${v.yyyy}-${pad(v.mm)}-${pad(v.dd)}` : null;
};

/** 'yyyy-MM-dd' -> local Date at midnight, or null */
export const parseISO = (iso) => {
    const norm = normalizeToISO(iso);
    if (!norm) return null;
    const [y, m, d] = norm.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const todayISO = (now = new Date()) => toISO(now);

/** ISO date `days` days before `now` (same rule the backend uses for its `days` window) */
export const isoDaysAgo = (days, now = new Date()) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - days);
    return toISO(d);
};

/**
 * Builds a range value. Presets are open-ended on the upper side (toDate null), matching
 * the backend's last-N-days behaviour; a custom range carries both dates.
 */
export const presetRange = (days, now = new Date()) => ({
    preset: days,
    fromDate: isoDaysAgo(days, now),
    toDate: null,
});

export const customRange = (fromDate, toDate) => ({ preset: 'custom', fromDate, toDate });

/** True when the ISO date falls inside [fromDate, toDate]; a null bound is open */
export const isWithinRange = (iso, fromDate, toDate) => {
    if (!iso) return false;
    if (fromDate && iso < fromDate) return false;
    if (toDate && iso > toDate) return false;
    return true;
};

/** Returns an error message for an invalid custom range, or null when it is valid */
export const validateRange = (fromDate, toDate, maxDate) => {
    if (!fromDate || !toDate) return 'Select both From and To dates.';
    const from = normalizeToISO(fromDate);
    const to = normalizeToISO(toDate);
    if (!from || !to) return 'Enter valid dates.';
    if (from > to) return 'From date must be on or before To date.';
    if (maxDate && to > maxDate) return 'To date cannot be in the future.';
    return null;
};

const displayDate = (iso) => {
    const d = parseISO(iso);
    return d
        ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';
};

/** Human label: '18 Oct 2026 – 17 Nov 2026', or '18 Oct 2026 – Today' for open-ended ranges */
export const formatRangeLabel = (fromDate, toDate) => {
    if (!fromDate) return 'All dates';
    return `${displayDate(fromDate)} – ${toDate ? displayDate(toDate) : 'Today'}`;
};
