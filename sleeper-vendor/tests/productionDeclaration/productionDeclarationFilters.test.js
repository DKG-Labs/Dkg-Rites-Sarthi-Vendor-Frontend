import { describe, it, expect } from 'vitest';
import {
    isVerifiedStatus, getStatusLabel, filterByDateRange, matchesSearch, searchRows,
    sortNewestFirst, splitByStatus, countPendingOutsideRange, computeStats,
} from '../../src/utils/productionDeclarationFilters';

const row = (over) => ({
    id: 1, castingDate: '01/11/2026', shift: 'ShiftA', productionUnit: 'Shed 1', batchNumber: '120',
    totalCastedSleepers: 8, plantType: 'STRESS', status: 'Pending', ...over,
});

describe('status helpers (same rules as before)', () => {
    it.each(['Verified & Locked', 'Locked', 'Completed'])('%s counts as verified', (s) => {
        expect(isVerifiedStatus(s)).toBe(true);
    });

    it.each([undefined, null, '', 'Created', 'Pending', 'Returned'])('%s counts as pending', (s) => {
        expect(isVerifiedStatus(s)).toBe(false);
    });

    it('labels statuses for display', () => {
        expect(getStatusLabel(undefined)).toBe('Pending for verification');
        expect(getStatusLabel('Created')).toBe('Pending for verification');
        expect(getStatusLabel('Pending')).toBe('Pending for verification');
        expect(getStatusLabel('Completed')).toBe('Verified & Locked');
        expect(getStatusLabel('Locked')).toBe('Verified & Locked');
        expect(getStatusLabel('Returned')).toBe('Returned');
    });
});

describe('filterByDateRange', () => {
    const rows = [
        row({ id: 1, castingDate: '30/09/2026' }),
        row({ id: 2, castingDate: '01/10/2026' }),
        row({ id: 3, castingDate: '31/10/2026' }),
        row({ id: 4, castingDate: '01/11/2026' }),
    ];

    it('keeps rows inside an inclusive closed range', () => {
        const ids = filterByDateRange(rows, { fromDate: '2026-10-01', toDate: '2026-10-31' }).map((r) => r.id);
        expect(ids).toEqual([2, 3]);
    });

    it('supports an open-ended range', () => {
        const ids = filterByDateRange(rows, { fromDate: '2026-10-31', toDate: null }).map((r) => r.id);
        expect(ids).toEqual([3, 4]);
    });

    it('never hides rows with an unreadable casting date', () => {
        const out = filterByDateRange([row({ id: 9, castingDate: null }), row({ id: 10, castingDate: 'N/A' })], { fromDate: '2026-10-01' });
        expect(out.map((r) => r.id)).toEqual([9, 10]);
    });

    it('handles null input', () => {
        expect(filterByDateRange(null, { fromDate: '2026-10-01' })).toEqual([]);
    });
});

describe('matchesSearch / searchRows', () => {
    const r = row({});

    it('matches every displayed column, case-insensitively', () => {
        expect(matchesSearch(r, '120')).toBe(true);           // batch
        expect(matchesSearch(r, 'shed 1')).toBe(true);        // line/shed
        expect(matchesSearch(r, 'shifta')).toBe(true);        // shift
        expect(matchesSearch(r, 'stress')).toBe(true);        // type
        expect(matchesSearch(r, '01/11')).toBe(true);         // date
        expect(matchesSearch(r, '8')).toBe(true);             // total casted
        expect(matchesSearch(r, 'pending for')).toBe(true);   // status label
    });

    it('returns false when nothing matches', () => {
        expect(matchesSearch(r, 'longline')).toBe(false);
    });

    it('treats empty/blank terms as match-all', () => {
        expect(matchesSearch(r, '')).toBe(true);
        expect(matchesSearch(r, '   ')).toBe(true);
        expect(matchesSearch(r, undefined)).toBe(true);
    });

    it('trims the term', () => {
        expect(matchesSearch(r, '  STRESS  ')).toBe(true);
    });

    it('ignores null fields without throwing', () => {
        expect(matchesSearch(row({ batchNumber: null, plantType: undefined }), 'x')).toBe(false);
    });

    it('filters a list', () => {
        const list = [row({ id: 1, batchNumber: 'A1' }), row({ id: 2, batchNumber: 'B2' })];
        expect(searchRows(list, 'b2').map((x) => x.id)).toEqual([2]);
    });
});

describe('sortNewestFirst / splitByStatus', () => {
    it('sorts by id desc without mutating input', () => {
        const input = [row({ id: 1 }), row({ id: 3 }), row({ id: 2 })];
        expect(sortNewestFirst(input).map((r) => r.id)).toEqual([3, 2, 1]);
        expect(input.map((r) => r.id)).toEqual([1, 3, 2]);
    });

    it('splits into pending and verified, newest first', () => {
        const { pending, verified } = splitByStatus([
            row({ id: 1, status: 'Pending' }),
            row({ id: 2, status: 'Completed' }),
            row({ id: 3, status: 'Created' }),
            row({ id: 4, status: 'Locked' }),
        ]);
        expect(pending.map((r) => r.id)).toEqual([3, 1]);
        expect(verified.map((r) => r.id)).toEqual([4, 2]);
    });
});

describe('countPendingOutsideRange', () => {
    const rows = [
        row({ id: 1, castingDate: '01/09/2026', status: 'Pending' }),   // before range
        row({ id: 2, castingDate: '01/09/2026', status: 'Completed' }), // verified: ignored
        row({ id: 3, castingDate: '01/11/2026', status: 'Pending' }),   // inside
        row({ id: 4, castingDate: '30/11/2026', status: 'Created' }),   // after closed range
        row({ id: 5, castingDate: null, status: 'Pending' }),           // unreadable: shown, not counted
    ];

    it('counts pending rows before or after the range', () => {
        expect(countPendingOutsideRange(rows, { fromDate: '2026-10-18', toDate: '2026-11-17' })).toBe(2);
    });

    it('open-ended range only counts older rows', () => {
        expect(countPendingOutsideRange(rows, { fromDate: '2026-10-18', toDate: null })).toBe(1);
    });
});

describe('computeStats', () => {
    it('sums casted sleepers and picks the newest batch', () => {
        const stats = computeStats([
            row({ id: 1, totalCastedSleepers: 10, batchNumber: 'OLD' }),
            row({ id: 7, totalCastedSleepers: 5, batchNumber: 'NEW', castingDate: '10/11/2026' }),
        ]);
        expect(stats.totalCasted).toBe(15);
        expect(stats.latest.batchNumber).toBe('NEW');
        expect(stats.avgRejectionRate).toBe('N/A');
    });

    it('computes the rejection rate when rejected counts exist', () => {
        const stats = computeStats([row({ totalCastedSleepers: 200, totalRejectedSleepers: 5 })]);
        expect(stats.avgRejectionRate).toBe('2.5');
    });

    it('handles an empty list', () => {
        expect(computeStats([])).toEqual({ totalCasted: 0, avgRejectionRate: 'N/A', latest: null });
    });
});
