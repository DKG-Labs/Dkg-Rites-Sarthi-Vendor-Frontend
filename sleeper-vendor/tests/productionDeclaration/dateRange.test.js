import { describe, it, expect } from 'vitest';
import {
    toISO, normalizeToISO, parseISO, todayISO, isoDaysAgo, presetRange, customRange,
    isWithinRange, validateRange, formatRangeLabel, formatISOAs, parseAsPattern,
} from '../../src/utils/dateRange';

// Local-time reference date: 17 Nov 2026, late evening (catches UTC/IST off-by-one bugs)
const NOW = new Date(2026, 10, 17, 23, 30);

describe('toISO / todayISO', () => {
    it('formats a local date as yyyy-MM-dd with zero padding', () => {
        expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('uses the local calendar day, not UTC', () => {
        expect(todayISO(NOW)).toBe('2026-11-17');
    });
});

describe('normalizeToISO', () => {
    it.each([
        ['31/10/2026', '2026-10-31'],
        ['1/2/2026', '2026-02-01'],
        ['31-10-2026', '2026-10-31'],
        ['2026-10-31', '2026-10-31'],
        ['2026-10-31T10:15:00', '2026-10-31'],
        ['  05/11/2026 ', '2026-11-05'],
    ])('reads %s as %s', (input, expected) => {
        expect(normalizeToISO(input)).toBe(expected);
    });

    it.each([null, undefined, '', 'N/A', '31/02/2026', '2026-13-01', '10/31', 42])(
        'returns null for unreadable value %s', (input) => {
            expect(normalizeToISO(input)).toBeNull();
        });
});

describe('parseISO', () => {
    it('returns a local midnight Date', () => {
        const d = parseISO('2026-11-17');
        expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 10, 17, 0]);
    });

    it('returns null for bad input', () => {
        expect(parseISO('bad')).toBeNull();
    });
});

describe('isoDaysAgo / presetRange', () => {
    it('subtracts calendar days across month boundaries', () => {
        expect(isoDaysAgo(30, NOW)).toBe('2026-10-18');
        expect(isoDaysAgo(60, NOW)).toBe('2026-09-18');
        expect(isoDaysAgo(0, NOW)).toBe('2026-11-17');
    });

    it('builds an open-ended preset range', () => {
        expect(presetRange(7, NOW)).toEqual({ preset: 7, fromDate: '2026-11-10', toDate: null });
    });

    it('builds a custom range with both dates', () => {
        expect(customRange('2026-01-01', '2026-01-31')).toEqual({ preset: 'custom', fromDate: '2026-01-01', toDate: '2026-01-31' });
    });
});

describe('isWithinRange', () => {
    it('includes both bounds', () => {
        expect(isWithinRange('2026-10-01', '2026-10-01', '2026-10-31')).toBe(true);
        expect(isWithinRange('2026-10-31', '2026-10-01', '2026-10-31')).toBe(true);
    });

    it('excludes dates outside the bounds', () => {
        expect(isWithinRange('2026-09-30', '2026-10-01', '2026-10-31')).toBe(false);
        expect(isWithinRange('2026-11-01', '2026-10-01', '2026-10-31')).toBe(false);
    });

    it('treats a null bound as open', () => {
        expect(isWithinRange('2030-01-01', '2026-10-01', null)).toBe(true);
        expect(isWithinRange('2000-01-01', null, '2026-10-31')).toBe(true);
    });

    it('returns false for a missing date', () => {
        expect(isWithinRange(null, '2026-10-01', null)).toBe(false);
    });
});

describe('validateRange', () => {
    const today = '2026-11-17';

    it('accepts a valid range, including a single day', () => {
        expect(validateRange('2026-10-01', '2026-10-31', today)).toBeNull();
        expect(validateRange('2026-11-17', '2026-11-17', today)).toBeNull();
    });

    it('requires both dates', () => {
        expect(validateRange('', '2026-10-31', today)).toMatch(/both/i);
        expect(validateRange('2026-10-01', '', today)).toMatch(/both/i);
    });

    it('rejects From after To', () => {
        expect(validateRange('2026-11-01', '2026-10-01', today)).toMatch(/on or before/i);
    });

    it('rejects a To date in the future', () => {
        expect(validateRange('2026-11-01', '2026-11-18', today)).toMatch(/future/i);
    });

    it('rejects unreadable dates', () => {
        expect(validateRange('2026-02-31', '2026-03-01', today)).toMatch(/valid/i);
    });
});

describe('formatRangeLabel', () => {
    it('shows both dates for a closed range', () => {
        expect(formatRangeLabel('2026-10-18', '2026-11-17')).toBe('18 Oct 2026 – 17 Nov 2026');
    });

    it('shows Today for an open-ended range', () => {
        expect(formatRangeLabel('2026-10-18', null)).toBe('18 Oct 2026 – Today');
    });

    it('handles a missing from date', () => {
        expect(formatRangeLabel(null, null)).toBe('All dates');
    });
});

describe('formatISOAs (custom date box display)', () => {
    it('formats ISO as dd-mm-yyyy', () => {
        expect(formatISOAs('2026-08-19', 'dd-mm-yyyy')).toBe('19-08-2026');
    });

    it('supports other separators and orders', () => {
        expect(formatISOAs('2026-01-05', 'dd/mm/yyyy')).toBe('05/01/2026');
        expect(formatISOAs('2026-01-05', 'yyyy.mm.dd')).toBe('2026.01.05');
    });

    it('returns empty text for missing or bad input', () => {
        expect(formatISOAs('', 'dd-mm-yyyy')).toBe('');
        expect(formatISOAs('bad', 'dd-mm-yyyy')).toBe('');
        expect(formatISOAs('2026-08-19', '')).toBe('');
    });
});

describe('parseAsPattern (custom date box typing)', () => {
    it.each([
        ['19-08-2026', '2026-08-19'],
        ['1-8-2026', '2026-08-01'],
        [' 19-08-2026 ', '2026-08-19'],
        ['29-02-2028', '2028-02-29'],
    ])('reads %s as %s', (text, iso) => {
        expect(parseAsPattern(text, 'dd-mm-yyyy')).toBe(iso);
    });

    it.each(['', '19-08-20', '19/08/2026', '2026-08-19', '31-02-2026', '29-02-2026', '19-13-2026', 'ab-cd-efgh', '19-08-2026x'])(
        'rejects %s for dd-mm-yyyy', (text) => {
            expect(parseAsPattern(text, 'dd-mm-yyyy')).toBeNull();
        });

    it('follows the pattern order and separator', () => {
        expect(parseAsPattern('05/01/2026', 'dd/mm/yyyy')).toBe('2026-01-05');
        expect(parseAsPattern('2026.01.05', 'yyyy.mm.dd')).toBe('2026-01-05');
    });

    it('round-trips with formatISOAs', () => {
        expect(parseAsPattern(formatISOAs('2026-11-17', 'dd-mm-yyyy'), 'dd-mm-yyyy')).toBe('2026-11-17');
    });
});
