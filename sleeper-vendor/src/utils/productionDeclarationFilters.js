// Pure list logic for the Production Declaration dashboard: status helpers, date-range
// filtering and global search. Status rules are the same ones the dashboard already used.
import { normalizeToISO, isWithinRange } from './dateRange';

const VERIFIED_STATUSES = ['Verified & Locked', 'Locked', 'Completed'];

export const isVerifiedStatus = (status) => VERIFIED_STATUSES.includes(status);

export const getStatusLabel = (status) => {
    if (!status || status === 'Created' || status === 'Pending') return 'Pending for verification';
    if (status === 'Completed' || status === 'Locked') return 'Verified & Locked';
    return status;
};

/**
 * Rows whose casting date is inside the range. Rows with an unreadable casting date are
 * kept, so a bad date never hides a declaration.
 */
export const filterByDateRange = (rows, { fromDate, toDate } = {}) =>
    (rows || []).filter((row) => {
        const iso = normalizeToISO(row?.castingDate);
        return iso === null || isWithinRange(iso, fromDate, toDate);
    });

const SEARCH_FIELDS = [
    (r) => r.batchNumber,
    (r) => r.productionUnit,
    (r) => r.shift,
    (r) => r.plantType,
    (r) => r.castingDate,
    (r) => r.totalCastedSleepers,
    (r) => getStatusLabel(r.status),
];

/** Case-insensitive match of the term against the columns shown in the table */
export const matchesSearch = (row, term) => {
    const q = (term || '').trim().toLowerCase();
    if (!q) return true;
    return SEARCH_FIELDS.some((get) => {
        const v = get(row);
        return v !== null && v !== undefined && String(v).toLowerCase().includes(q);
    });
};

export const searchRows = (rows, term) => (rows || []).filter((r) => matchesSearch(r, term));

/** Newest first (highest id), without mutating the input */
export const sortNewestFirst = (rows) => [...(rows || [])].sort((a, b) => (b.id || 0) - (a.id || 0));

/** Splits rows into pending / verified, newest first */
export const splitByStatus = (rows) => {
    const sorted = sortNewestFirst(rows);
    return {
        pending: sorted.filter((d) => !isVerifiedStatus(d.status)),
        verified: sorted.filter((d) => isVerifiedStatus(d.status)),
    };
};

/** Pending rows (from the loaded window) whose casting date falls outside the range */
export const countPendingOutsideRange = (rows, { fromDate, toDate } = {}) =>
    (rows || []).filter((row) => {
        if (isVerifiedStatus(row?.status)) return false;
        const iso = normalizeToISO(row?.castingDate);
        return iso !== null && !isWithinRange(iso, fromDate, toDate);
    }).length;

/** Stat-card figures for the selected range (same formulas as before) */
export const computeStats = (rows) => {
    const list = rows || [];
    const totalCasted = list.reduce((acc, d) => acc + (d.totalCastedSleepers || 0), 0);
    const totalRejected = list.reduce((acc, d) => acc + (d.totalRejectedSleepers || 0), 0);
    const avgRejectionRate = totalCasted > 0 && totalRejected > 0
        ? ((totalRejected / totalCasted) * 100).toFixed(1)
        : 'N/A';
    const latest = list.reduce((best, d) => (!best || (d.id || 0) > (best.id || 0) ? d : best), null);
    return { totalCasted, avgRejectionRate, latest };
};
