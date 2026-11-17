import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GlobalSearchBar from '../../src/components/common/GlobalSearchBar';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const setup = (props = {}) => {
    const onSearch = vi.fn();
    render(<GlobalSearchBar onSearch={onSearch} debounceMs={250} placeholder="Search here" {...props} />);
    onSearch.mockClear(); // ignore the initial '' report
    act(() => { vi.runOnlyPendingTimers(); });
    onSearch.mockClear();
    return { onSearch, input: screen.getByLabelText('Search declarations') };
};

describe('GlobalSearchBar', () => {
    it('renders the placeholder', () => {
        const { input } = setup();
        expect(input.getAttribute('placeholder')).toBe('Search here');
    });

    it('debounces typing and reports the trimmed term once', () => {
        const { onSearch, input } = setup();
        fireEvent.change(input, { target: { value: 'sh' } });
        act(() => { vi.advanceTimersByTime(100); });
        fireEvent.change(input, { target: { value: ' shed 1 ' } });
        act(() => { vi.advanceTimersByTime(249); });
        expect(onSearch).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(1); });
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('shed 1');
    });

    it('respects a custom debounce delay', () => {
        const onSearch = vi.fn();
        render(<GlobalSearchBar onSearch={onSearch} debounceMs={1000} />);
        act(() => { vi.runOnlyPendingTimers(); });
        onSearch.mockClear();
        fireEvent.change(screen.getByLabelText('Search declarations'), { target: { value: 'x' } });
        act(() => { vi.advanceTimersByTime(999); });
        expect(onSearch).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(1); });
        expect(onSearch).toHaveBeenCalledWith('x');
    });

    it('shows a clear button only when there is text, and clearing reports "" immediately', () => {
        const { onSearch, input } = setup();
        expect(screen.queryByLabelText('Clear search')).toBeNull();
        fireEvent.change(input, { target: { value: 'abc' } });
        fireEvent.click(screen.getByLabelText('Clear search'));
        expect(onSearch).toHaveBeenCalledWith('');
        expect(input.value).toBe('');
        expect(screen.queryByLabelText('Clear search')).toBeNull();
    });

    it('clears on Escape', () => {
        const { onSearch, input } = setup();
        fireEvent.change(input, { target: { value: 'abc' } });
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(input.value).toBe('');
        expect(onSearch).toHaveBeenCalledWith('');
    });
});
