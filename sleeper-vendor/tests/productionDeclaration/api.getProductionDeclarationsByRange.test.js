import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService, BASE_URL } from '../../src/services/api';

const okResponse = (body) => ({ ok: true, json: async () => body });

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ responseData: [{ id: 1 }] })));
});

describe('apiService.getProductionDeclarationsByRange', () => {
    it('calls getAllLite with plant and both dates', async () => {
        localStorage.setItem('selectedPlant', JSON.stringify({ plantId: 'PL:01' }));
        const controller = new AbortController();
        const data = await apiService.getProductionDeclarationsByRange({ fromDate: '2026-10-01', toDate: '2026-10-31', signal: controller.signal });
        expect(data).toEqual([{ id: 1 }]);
        const [url, init] = fetch.mock.calls[0];
        expect(url).toBe(`${BASE_URL}/production-declaration/getAllLite?plantId=PL%3A01&fromDate=2026-10-01&toDate=2026-10-31`);
        expect(init.signal).toBe(controller.signal);
    });

    it('omits missing params (open-ended range, no plant selected)', async () => {
        await apiService.getProductionDeclarationsByRange({ fromDate: '2026-09-18' });
        expect(fetch.mock.calls[0][0]).toBe(`${BASE_URL}/production-declaration/getAllLite?fromDate=2026-09-18`);
    });

    it('works with no arguments at all', async () => {
        await apiService.getProductionDeclarationsByRange();
        expect(fetch.mock.calls[0][0]).toBe(`${BASE_URL}/production-declaration/getAllLite`);
    });

    it('ignores a corrupt selectedPlant value', async () => {
        localStorage.setItem('selectedPlant', '{oops');
        await apiService.getProductionDeclarationsByRange({ fromDate: '2026-09-18' });
        expect(fetch.mock.calls[0][0]).not.toContain('plantId');
    });

    it('returns [] when responseData is missing', async () => {
        fetch.mockResolvedValueOnce(okResponse({}));
        expect(await apiService.getProductionDeclarationsByRange({})).toEqual([]);
    });

    it('throws on an HTTP error instead of returning an empty list', async () => {
        fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
        await expect(apiService.getProductionDeclarationsByRange({})).rejects.toThrow('Failed to fetch production declarations');
    });

    it('propagates aborts', async () => {
        fetch.mockRejectedValueOnce(new DOMException('aborted', 'AbortError'));
        await expect(apiService.getProductionDeclarationsByRange({})).rejects.toThrow('aborted');
    });
});
