import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSWRCache, invalidate, mutateCache, clearSWRCache } from '../../src/hooks/useSWRCache';

const OPTS = { freshMs: 30_000, expireMs: 45_000, timeoutMs: 20_000 };
const T0 = new Date(2026, 10, 17, 10, 0, 0).getTime();

const deferred = () => {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
};

beforeEach(() => {
    clearSWRCache();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(T0);
});

afterEach(() => {
    vi.useRealTimers();
});

const mount = (key, fetcher, opts = OPTS) => renderHook(({ k }) => useSWRCache(k, fetcher, opts), { initialProps: { k: key } });

describe('useSWRCache: first load', () => {
    it('reports isLoading, then data', async () => {
        const fetcher = vi.fn().mockResolvedValue(['a']);
        const { result } = mount('k1', fetcher);
        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
        await waitFor(() => expect(result.current.data).toEqual(['a']));
        expect(result.current.isLoading).toBe(false);
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(fetcher.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal);
    });

    it('does not fetch when disabled or key is empty', () => {
        const fetcher = vi.fn().mockResolvedValue([]);
        const a = renderHook(() => useSWRCache('k', fetcher, { ...OPTS, enabled: false }));
        const b = renderHook(() => useSWRCache(null, fetcher, OPTS));
        expect(fetcher).not.toHaveBeenCalled();
        expect(a.result.current.isLoading).toBe(false);
        expect(b.result.current.isLoading).toBe(false);
    });
});

describe('useSWRCache: freshness windows', () => {
    const primeCache = async (key, data) => {
        const fetcher = vi.fn().mockResolvedValue(data);
        const h = mount(key, fetcher);
        await waitFor(() => expect(h.result.current.data).toEqual(data));
        h.unmount();
        return fetcher;
    };

    it('< 30 s: serves cache with no request', async () => {
        await primeCache('fresh', [1]);
        vi.setSystemTime(T0 + 29_000);
        const fetcher = vi.fn().mockResolvedValue([2]);
        const { result } = mount('fresh', fetcher);
        expect(result.current.data).toEqual([1]);
        expect(result.current.isLoading).toBe(false);
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('30–45 s: serves stale data immediately and revalidates in background', async () => {
        await primeCache('stale', [1]);
        vi.setSystemTime(T0 + 35_000);
        const d = deferred();
        const fetcher = vi.fn().mockReturnValue(d.promise);
        const { result } = mount('stale', fetcher);
        expect(result.current.data).toEqual([1]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isValidating).toBe(true);
        expect(fetcher).toHaveBeenCalledTimes(1);
        await act(async () => { d.resolve([2]); });
        expect(result.current.data).toEqual([2]);
        expect(result.current.isValidating).toBe(false);
    });

    it('>= 45 s: hides expired data (skeleton) and fetches', async () => {
        await primeCache('expired', [1]);
        vi.setSystemTime(T0 + 46_000);
        const d = deferred();
        const fetcher = vi.fn().mockReturnValue(d.promise);
        const { result } = mount('expired', fetcher);
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
        await act(async () => { d.resolve([3]); });
        expect(result.current.data).toEqual([3]);
    });

    it('hydrates from sessionStorage after a reload', async () => {
        sessionStorage.setItem('swr:stored', JSON.stringify({ data: ['saved'], fetchedAt: T0 - 5_000 }));
        const fetcher = vi.fn().mockResolvedValue(['net']);
        const { result } = mount('stored', fetcher);
        expect(result.current.data).toEqual(['saved']);
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('ignores corrupt sessionStorage entries', async () => {
        sessionStorage.setItem('swr:bad', '{not json');
        const fetcher = vi.fn().mockResolvedValue(['net']);
        const { result } = mount('bad', fetcher);
        await waitFor(() => expect(result.current.data).toEqual(['net']));
    });

    it('revalidates on window focus once data is older than the fresh window', async () => {
        const fetcher = vi.fn().mockResolvedValue([1]);
        const { result } = mount('focus', fetcher);
        await waitFor(() => expect(result.current.data).toEqual([1]));
        act(() => { window.dispatchEvent(new Event('focus')); });
        expect(fetcher).toHaveBeenCalledTimes(1); // still fresh
        vi.setSystemTime(T0 + 31_000);
        act(() => { window.dispatchEvent(new Event('focus')); });
        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    });
});

describe('useSWRCache: request handling', () => {
    it('de-duplicates concurrent requests for the same key', async () => {
        const d = deferred();
        const fetcher = vi.fn().mockReturnValue(d.promise);
        const a = mount('dup', fetcher);
        const b = mount('dup', fetcher);
        expect(fetcher).toHaveBeenCalledTimes(1);
        await act(async () => { d.resolve(['x']); });
        expect(a.result.current.data).toEqual(['x']);
        expect(b.result.current.data).toEqual(['x']);
    });

    it('aborts the request when the last user unmounts', () => {
        let signal;
        const fetcher = vi.fn(({ signal: s }) => { signal = s; return new Promise(() => {}); });
        const { unmount } = mount('abort', fetcher);
        unmount();
        expect(signal.aborted).toBe(true);
    });

    it('aborts the old request when the key changes', async () => {
        const signals = {};
        const fetcher = vi.fn(({ signal }) => new Promise(() => {}).finally(() => signal));
        const tracking = (key) => (ctx) => { signals[key] = ctx.signal; return fetcher(ctx); };
        let k = 'r1';
        const { rerender } = renderHook(({ key }) => useSWRCache(key, tracking(key), OPTS), { initialProps: { key: k } });
        k = 'r2';
        rerender({ key: k });
        expect(signals.r1.aborted).toBe(true);
        expect(signals.r2.aborted).toBe(false);
    });

    it('surfaces fetch errors', async () => {
        const fetcher = vi.fn().mockRejectedValue(new Error('boom'));
        const { result } = mount('err', fetcher);
        await waitFor(() => expect(result.current.error?.message).toBe('boom'));
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
    });

    it('times out slow requests with a friendly message', async () => {
        vi.useRealTimers();
        const fetcher = vi.fn(({ signal }) => new Promise((_, reject) => {
            signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }));
        const { result } = mount('slow', fetcher, { ...OPTS, timeoutMs: 30 });
        await waitFor(() => expect(result.current.error?.message).toMatch(/timed out/i));
    });

    it('revalidate() refetches while keeping data visible', async () => {
        const fetcher = vi.fn().mockResolvedValueOnce([1]).mockResolvedValueOnce([2]);
        const { result } = mount('manual', fetcher);
        await waitFor(() => expect(result.current.data).toEqual([1]));
        await act(async () => { await result.current.revalidate(); });
        expect(result.current.data).toEqual([2]);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });
});

describe('useSWRCache: mutate / invalidate', () => {
    it('mutate updates data for every subscriber and storage', async () => {
        const fetcher = vi.fn().mockResolvedValue([1, 2, 3]);
        const { result } = mount('mut', fetcher);
        await waitFor(() => expect(result.current.data).toEqual([1, 2, 3]));
        act(() => result.current.mutate((rows) => rows.filter((n) => n !== 2)));
        expect(result.current.data).toEqual([1, 3]);
        expect(JSON.parse(sessionStorage.getItem('swr:mut')).data).toEqual([1, 3]);
    });

    it('mutateCache is a no-op when nothing is cached', () => {
        expect(() => mutateCache('none', () => [1])).not.toThrow();
    });

    it('invalidate keeps data visible and forces the next mount to revalidate silently', async () => {
        const fetcher = vi.fn().mockResolvedValue(['v1']);
        const h = mount('pd:inv', fetcher);
        await waitFor(() => expect(h.result.current.data).toEqual(['v1']));
        h.unmount();

        act(() => invalidate('pd:'));
        const d = deferred();
        const fetcher2 = vi.fn().mockReturnValue(d.promise);
        const { result } = mount('pd:inv', fetcher2);
        expect(result.current.data).toEqual(['v1']);   // no skeleton
        expect(result.current.isValidating).toBe(true);
        expect(fetcher2).toHaveBeenCalledTimes(1);     // even though < 30 s old
        await act(async () => { d.resolve(['v2']); });
        expect(result.current.data).toEqual(['v2']);
    });

    it('invalidate only touches keys with the prefix and clears matching storage', async () => {
        sessionStorage.setItem('swr:pd:orphan', JSON.stringify({ data: [1], fetchedAt: T0 }));
        sessionStorage.setItem('swr:other:keep', JSON.stringify({ data: [1], fetchedAt: T0 }));
        invalidate('pd:');
        expect(sessionStorage.getItem('swr:pd:orphan')).toBeNull();
        expect(sessionStorage.getItem('swr:other:keep')).not.toBeNull();
    });
});
