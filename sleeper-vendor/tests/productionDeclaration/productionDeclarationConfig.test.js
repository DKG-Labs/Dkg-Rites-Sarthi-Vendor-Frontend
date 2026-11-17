import { describe, it, expect, vi, afterEach } from 'vitest';

const loadConfig = async () => {
    vi.resetModules();
    return (await import('../../src/config/productionDeclarationConfig')).PD_CONFIG;
};

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('PD_CONFIG defaults', () => {
    it('uses a 30 s fresh window and 45 s hard expiry', async () => {
        const c = await loadConfig();
        expect(c.cacheFreshMs).toBe(30_000);
        expect(c.cacheExpireMs).toBe(45_000);
    });

    it('defaults to a 30-day view, 60-day base window and 7/30/60/90 presets', async () => {
        const c = await loadConfig();
        expect(c.defaultPresetDays).toBe(30);
        expect(c.baseWindowDays).toBe(60);
        expect(c.presetDays).toEqual([7, 30, 60, 90]);
    });

    it('is frozen', async () => {
        const c = await loadConfig();
        expect(Object.isFrozen(c)).toBe(true);
    });
});

describe('PD_CONFIG env overrides (no code edits needed)', () => {
    it('reads cache timings and presets from env', async () => {
        vi.stubEnv('VITE_PD_CACHE_FRESH_MS', '10000');
        vi.stubEnv('VITE_PD_CACHE_EXPIRE_MS', '20000');
        vi.stubEnv('VITE_PD_PRESET_DAYS', '90, 15,15, 45');
        vi.stubEnv('VITE_PD_DEFAULT_DAYS', '45');
        const c = await loadConfig();
        expect(c.cacheFreshMs).toBe(10_000);
        expect(c.cacheExpireMs).toBe(20_000);
        expect(c.presetDays).toEqual([15, 45, 90]);
        expect(c.defaultPresetDays).toBe(45);
    });

    it('never lets expiry be shorter than the fresh window', async () => {
        vi.stubEnv('VITE_PD_CACHE_FRESH_MS', '50000');
        vi.stubEnv('VITE_PD_CACHE_EXPIRE_MS', '1000');
        const c = await loadConfig();
        expect(c.cacheExpireMs).toBe(50_000);
    });

    it('falls back to defaults for invalid values', async () => {
        vi.stubEnv('VITE_PD_CACHE_FRESH_MS', 'abc');
        vi.stubEnv('VITE_PD_PRESET_DAYS', 'x,-3');
        vi.stubEnv('VITE_PD_DEFAULT_DAYS', '999');
        const c = await loadConfig();
        expect(c.cacheFreshMs).toBe(30_000);
        expect(c.presetDays).toEqual([7, 30, 60, 90]);
        expect(c.defaultPresetDays).toBe(7); // not a preset -> first preset
    });
});

describe('PD_CONFIG date input format', () => {
    it('defaults to dd-mm-yyyy', async () => {
        const c = await loadConfig();
        expect(c.dateInputFormat).toBe('dd-mm-yyyy');
    });

    it('accepts a valid override from env', async () => {
        vi.stubEnv('VITE_PD_DATE_INPUT_FORMAT', 'DD/MM/YYYY');
        const c = await loadConfig();
        expect(c.dateInputFormat).toBe('dd/mm/yyyy');
    });

    it.each(['dd-mm', 'dd-dd-yyyy', 'mm-yyyy', 'dd-mm-yyyy-x', 'dd1mm1yyyy'])('falls back to default for invalid format %s', async (f) => {
        vi.stubEnv('VITE_PD_DATE_INPUT_FORMAT', f);
        const c = await loadConfig();
        expect(c.dateInputFormat).toBe('dd-mm-yyyy');
    });
});
