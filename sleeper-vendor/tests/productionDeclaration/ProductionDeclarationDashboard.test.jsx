import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';

// ── Mocks: API layer and the (large) shift form ───────────────────────────────
vi.mock('../../src/services/api', () => ({
    apiService: {
        getProductionDeclarationsByRange: vi.fn(),
        getProductionDeclarationById: vi.fn(),
        saveProductionDeclaration: vi.fn(),
        deleteProductionDeclaration: vi.fn(),
    },
}));

const formProps = { current: null };
vi.mock('../../src/pages/sleeperGeneral/sections/ShiftProductionForm', () => ({
    default: (props) => {
        formProps.current = props;
        return <div data-testid="shift-form">{props.isReadOnly ? 'read-only' : 'editable'}</div>;
    },
}));

import { apiService } from '../../src/services/api';
import { clearSWRCache } from '../../src/hooks/useSWRCache';
import ProductionDeclarationDashboard from '../../src/pages/sleeperGeneral/ProductionDeclarationDashboard';

// Today = 17 Nov 2026 → base window from 18 Sep, default 30-day view from 18 Oct
const rows = () => ([
    { id: 1, plantId: 'P1', castingDate: '25/09/2026', shift: 'ShiftA', productionUnit: 'Shed 1', batchNumber: 'B-OLD', totalCastedSleepers: 4, plantType: 'STRESS', status: 'Pending' },
    { id: 2, plantId: 'P1', castingDate: '31/10/2026', shift: 'ShiftA', productionUnit: 'Shed 1', batchNumber: '120', totalCastedSleepers: 8, plantType: 'STRESS', status: 'Pending' },
    { id: 3, plantId: 'P1', castingDate: '10/11/2026', shift: 'ShiftB', productionUnit: 'Shed 2', batchNumber: '121', totalCastedSleepers: 12, plantType: 'LONGLINE', status: 'Completed' },
    { id: 4, plantId: 'P1', castingDate: '15/11/2026', shift: 'ShiftB', productionUnit: 'Shed 2', batchNumber: '122', totalCastedSleepers: 5, plantType: 'STRESS', status: 'Created' },
    { id: 5, plantId: 'P2', castingDate: '15/11/2026', shift: 'ShiftA', productionUnit: 'Shed 9', batchNumber: 'OTHER-PLANT', totalCastedSleepers: 99, plantType: 'STRESS', status: 'Pending' },
]);

const deferred = () => {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
};

const table = () => screen.getByRole('table');
const tabCount = (name) => screen.getByRole('button', { name: new RegExp(name) }).textContent.match(/(\d+|…)$/)[1];
const waitForRows = () => screen.findByText('120');
const typeSearch = async (text) => {
    fireEvent.change(screen.getByLabelText('Search declarations'), { target: { value: text } });
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); }); // debounce
};

beforeEach(() => {
    clearSWRCache();
    formProps.current = null;
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 17, 12, 0));
    localStorage.setItem('selectedPlant', JSON.stringify({ plantId: 'P1' }));
    apiService.getProductionDeclarationsByRange.mockResolvedValue(rows());
    apiService.getProductionDeclarationById.mockImplementation(async (id) => ({ ...rows().find((r) => r.id === id), full: true }));
    apiService.saveProductionDeclaration.mockResolvedValue({});
    apiService.deleteProductionDeclaration.mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.useRealTimers());

describe('loading & caching', () => {
    it('shows skeletons on first load, then the data', async () => {
        render(<ProductionDeclarationDashboard />);
        expect(screen.getAllByTestId('skeleton-row').length).toBe(5);
        expect(screen.getAllByTestId('stat-skeleton').length).toBe(3);
        await waitForRows();
        expect(screen.queryByTestId('skeleton-row')).toBeNull();
    });

    it('fetches the 60-day base window once, open-ended, like before', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        expect(apiService.getProductionDeclarationsByRange).toHaveBeenCalledTimes(1);
        const args = apiService.getProductionDeclarationsByRange.mock.calls[0][0];
        expect(args.fromDate).toBe('2026-09-18');
        expect(args.toDate).toBeUndefined();
        expect(args.signal).toBeInstanceOf(AbortSignal);
    });

    it('keeps the client-side plant filter (other plants never shown)', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        expect(screen.queryByText('OTHER-PLANT')).toBeNull();
    });

    it('serves a remount within 30 s from cache with no request and no skeleton', async () => {
        const first = render(<ProductionDeclarationDashboard />);
        await waitForRows();
        first.unmount();
        vi.setSystemTime(new Date(2026, 10, 17, 12, 0, 20));
        render(<ProductionDeclarationDashboard />);
        expect(screen.queryByTestId('skeleton-row')).toBeNull();
        expect(within(table()).getByText('120')).toBeTruthy();
        expect(apiService.getProductionDeclarationsByRange).toHaveBeenCalledTimes(1);
    });

    it('between 30 and 45 s shows cached rows and refreshes in the background', async () => {
        const first = render(<ProductionDeclarationDashboard />);
        await waitForRows();
        first.unmount();
        vi.setSystemTime(new Date(2026, 10, 17, 12, 0, 40));
        const d = deferred();
        apiService.getProductionDeclarationsByRange.mockReturnValueOnce(d.promise);
        render(<ProductionDeclarationDashboard />);
        expect(within(table()).getByText('120')).toBeTruthy();
        expect(screen.getByText('Refreshing…')).toBeTruthy();
        await act(async () => { d.resolve(rows()); });
        await waitFor(() => expect(screen.queryByText('Refreshing…')).toBeNull());
        expect(apiService.getProductionDeclarationsByRange).toHaveBeenCalledTimes(2);
    });

    it('after 45 s shows the skeleton again and refetches', async () => {
        const first = render(<ProductionDeclarationDashboard />);
        await waitForRows();
        first.unmount();
        vi.setSystemTime(new Date(2026, 10, 17, 12, 0, 50));
        render(<ProductionDeclarationDashboard />);
        expect(screen.getAllByTestId('skeleton-row').length).toBe(5);
        await waitForRows();
        expect(apiService.getProductionDeclarationsByRange).toHaveBeenCalledTimes(2);
    });

    it('shows an error with Retry when the load fails', async () => {
        apiService.getProductionDeclarationsByRange.mockRejectedValueOnce(new Error('network'));
        render(<ProductionDeclarationDashboard />);
        expect(await screen.findByText('Failed to load production declarations.')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        await waitForRows();
    });

    it('removes the old dashboard cache key', async () => {
        sessionStorage.setItem('pd_declarations_cache', '[]');
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        expect(sessionStorage.getItem('pd_declarations_cache')).toBeNull();
    });
});

describe('date filter (both tabs)', () => {
    it('defaults to the last 30 days', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        expect(screen.getByRole('button', { name: 'Last 30 days' }).getAttribute('aria-pressed')).toBe('true');
        expect(within(table()).queryByText('B-OLD')).toBeNull();     // 25 Sep: outside
        expect(within(table()).getByText('122')).toBeTruthy();
        expect(tabCount('Pending Declaration')).toBe('2');
        expect(tabCount('Verified Production')).toBe('1');
    });

    it('stat cards follow the selected range', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        const totalCast = () => screen.getByText('Total Sleepers Cast').parentElement.querySelector('h2').textContent;
        const lastBatch = () => screen.getByText('Last Batch Declared').parentElement.querySelector('h2').textContent;
        expect(totalCast()).toBe('25');                              // 8 + 12 + 5
        expect(lastBatch()).toContain('122');                        // newest in range
        expect(screen.getByText('18 Oct 2026 – Today', { selector: 'p' })).toBeTruthy(); // subtitle label
        fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
        expect(totalCast()).toBe('17');                              // 12 + 5
    });

    it('warns about pending entries outside the range and Show widens it', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        expect(screen.getByRole('status').textContent).toMatch(/1 pending entry is outside the selected range/);
        fireEvent.click(screen.getByRole('button', { name: 'Show' }));
        expect(within(table()).getByText('B-OLD')).toBeTruthy();
        expect(screen.queryByRole('status')).toBeNull();
        expect(apiService.getProductionDeclarationsByRange).toHaveBeenCalledTimes(1); // no extra request
    });

    it('filters presets inside the base window without a new request', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
        expect(within(table()).queryByText('120')).toBeNull();
        expect(within(table()).getByText('122')).toBeTruthy();
        expect(tabCount('Pending Declaration')).toBe('1');
        fireEvent.click(screen.getByRole('button', { name: /Verified Production/ }));
        expect(within(table()).getByText('121')).toBeTruthy();
        expect(apiService.getProductionDeclarationsByRange).toHaveBeenCalledTimes(1);
    });

    it('fetches from the server for ranges older than the base window, with a table skeleton', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        const d = deferred();
        apiService.getProductionDeclarationsByRange.mockReturnValueOnce(d.promise);
        fireEvent.click(screen.getByRole('button', { name: 'Last 90 days' }));
        expect(screen.getAllByTestId('skeleton-row').length).toBe(5);
        expect(screen.getByLabelText('Search declarations')).toBeTruthy(); // header stays usable
        const args = apiService.getProductionDeclarationsByRange.mock.calls[1][0];
        expect(args.fromDate).toBe('2026-08-19');
        expect(args.toDate).toBeNull(); // open-ended: the API omits it from the URL
        await act(async () => {
            d.resolve([{ id: 9, plantId: 'P1', castingDate: '20/08/2026', batchNumber: 'AUG-1', shift: 'A', status: 'Pending' }]);
        });
        expect(within(table()).getByText('AUG-1')).toBeTruthy();
    });

    it('sends a custom range to the server when it starts before the base window', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '01-06-2026' } });
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '30-06-2026' } });
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        await waitFor(() => expect(apiService.getProductionDeclarationsByRange).toHaveBeenCalledTimes(2));
        const args = apiService.getProductionDeclarationsByRange.mock.calls[1][0];
        expect([args.fromDate, args.toDate]).toEqual(['2026-06-01', '2026-06-30']);
    });

    it('filters a custom range inside the base window locally', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '30-10-2026' } });
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '01-11-2026' } });
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(within(table()).getByText('120')).toBeTruthy();
        expect(within(table()).queryByText('122')).toBeNull();
        expect(apiService.getProductionDeclarationsByRange).toHaveBeenCalledTimes(1);
    });

    it('remembers the chosen range for the session', async () => {
        const first = render(<ProductionDeclarationDashboard />);
        await waitForRows();
        fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
        first.unmount();
        render(<ProductionDeclarationDashboard />);
        expect(screen.getByRole('button', { name: 'Last 7 days' }).getAttribute('aria-pressed')).toBe('true');
    });
});

describe('global search', () => {
    it('filters both tabs and updates both counts', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        await typeSearch('shed 2');
        expect(tabCount('Pending Declaration')).toBe('1');
        expect(tabCount('Verified Production')).toBe('1');
        expect(within(table()).getByText('122')).toBeTruthy();
        expect(within(table()).queryByText('120')).toBeNull();
    });

    it('matches status labels and types', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        await typeSearch('longline');
        expect(tabCount('Pending Declaration')).toBe('0');
        expect(tabCount('Verified Production')).toBe('1');
    });

    it('only searches inside the selected range', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        await typeSearch('B-OLD');
        expect(screen.getByText(/No results for “B-OLD” in the selected range/)).toBeTruthy();
    });

    it('Clear search restores the list', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        await typeSearch('zzz');
        fireEvent.click(screen.getByText('Clear search', { selector: 'button' })); // empty-state link
        expect(within(table()).getByText('120')).toBeTruthy();
        expect(screen.getByLabelText('Search declarations').value).toBe('');
    });
});

describe('workflow is unchanged', () => {
    it('the form always gets the full 60-day list and the same batch suggestion, whatever the filter/search', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
        await typeSearch('122');
        fireEvent.click(screen.getByRole('button', { name: /Add New Shift Production/ }));
        await screen.findByTestId('shift-form');
        expect(formProps.current.currentDeclarations.map((r) => r.id)).toEqual([1, 2, 3, 4]); // server order, plant-filtered
        expect(formProps.current.lastBatchNumber).toBe('B-OLD');                              // same expression as before
        expect(formProps.current.initialData).toBeNull();
        expect(formProps.current.isReadOnly).toBe(false);
    });

    it('Modify loads full details into an editable form', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        const row = within(table()).getByText('120').closest('tr');
        fireEvent.click(within(row).getByRole('button', { name: 'Modify' }));
        expect(await screen.findByText('editable')).toBeTruthy();
        expect(apiService.getProductionDeclarationById).toHaveBeenCalledWith(2);
        expect(formProps.current.initialData).toMatchObject({ id: 2, full: true });
    });

    it('View Details opens a read-only form', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        fireEvent.click(screen.getByRole('button', { name: /Verified Production/ }));
        fireEvent.click(screen.getByRole('button', { name: 'View Details' }));
        expect(await screen.findByText('read-only')).toBeTruthy();
        expect(apiService.getProductionDeclarationById).toHaveBeenCalledWith(3);
    });

    it('save calls the same API, closes the form and refreshes the list', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        fireEvent.click(screen.getByRole('button', { name: /Add New Shift Production/ }));
        await screen.findByTestId('shift-form');
        const payload = { batchNumber: '123' };
        await act(async () => { await formProps.current.onSave(payload); });
        expect(apiService.saveProductionDeclaration).toHaveBeenCalledWith(payload);
        expect(screen.queryByTestId('shift-form')).toBeNull();
        await waitFor(() => expect(apiService.getProductionDeclarationsByRange).toHaveBeenCalledTimes(2));
    });

    it('save failure keeps the form open and alerts', async () => {
        apiService.saveProductionDeclaration.mockRejectedValueOnce(new Error('bad data'));
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        fireEvent.click(screen.getByRole('button', { name: /Add New Shift Production/ }));
        await screen.findByTestId('shift-form');
        await act(async () => { await formProps.current.onSave({}); });
        expect(window.alert).toHaveBeenCalledWith('Failed to save declaration: bad data');
        expect(screen.getByTestId('shift-form')).toBeTruthy();
    });

    it('delete removes the row immediately and calls the API', async () => {
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        const row = within(table()).getByText('120').closest('tr');
        fireEvent.click(within(row).getByRole('button', { name: 'Delete' }));
        expect(within(table()).queryByText('120')).toBeNull();
        await waitFor(() => expect(apiService.deleteProductionDeclaration).toHaveBeenCalledWith(2));
    });

    it('delete is skipped when not confirmed', async () => {
        window.confirm.mockReturnValue(false);
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        const row = within(table()).getByText('120').closest('tr');
        fireEvent.click(within(row).getByRole('button', { name: 'Delete' }));
        expect(within(table()).getByText('120')).toBeTruthy();
        expect(apiService.deleteProductionDeclaration).not.toHaveBeenCalled();
    });

    it('failed delete alerts and refetches (rollback)', async () => {
        apiService.deleteProductionDeclaration.mockRejectedValueOnce(new Error('nope'));
        render(<ProductionDeclarationDashboard />);
        await waitForRows();
        const row = within(table()).getByText('120').closest('tr');
        fireEvent.click(within(row).getByRole('button', { name: 'Delete' }));
        await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Delete failed. Refreshing list...'));
        await waitFor(() => expect(within(table()).getByText('120')).toBeTruthy());
        expect(apiService.getProductionDeclarationsByRange).toHaveBeenCalledTimes(2);
    });
});
