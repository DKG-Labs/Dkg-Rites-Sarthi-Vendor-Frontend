import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangeFilter from '../../src/components/common/DateRangeFilter';

const TODAY = '2026-11-17';
const PRESETS = [7, 30, 60, 90];

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 17, 12, 0));
});
afterEach(() => vi.useRealTimers());

const setup = (value = { preset: 30, fromDate: '2026-10-18', toDate: null }, presets = PRESETS) => {
    const onChange = vi.fn();
    const utils = render(<DateRangeFilter value={value} onChange={onChange} presets={presets} maxDate={TODAY} />);
    return { onChange, ...utils };
};

describe('DateRangeFilter', () => {
    it('renders one chip per configured preset plus Custom', () => {
        setup(undefined, [15, 45]);
        expect(screen.getByRole('button', { name: 'Last 15 days' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Last 45 days' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Last 30 days' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Custom' })).toBeTruthy();
    });

    it('marks the active preset as pressed', () => {
        setup();
        expect(screen.getByRole('button', { name: 'Last 30 days' }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: 'Last 7 days' }).getAttribute('aria-pressed')).toBe('false');
    });

    it('emits an open-ended range computed from today when a preset is clicked', () => {
        const { onChange } = setup();
        fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
        expect(onChange).toHaveBeenCalledWith({ preset: 7, fromDate: '2026-11-10', toDate: null });
    });

    it('shows the active range label', () => {
        setup();
        expect(screen.getByTestId('range-label').textContent).toContain('18 Oct 2026 – Today');
    });

    it('opens custom inputs shown as dd-mm-yyyy, with the calendar capped at today', () => {
        setup();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        const from = screen.getByLabelText('From date');
        const to = screen.getByLabelText('To date');
        expect(from.value).toBe('18-10-2026');
        expect(to.value).toBe('17-11-2026');
        expect(from.getAttribute('placeholder')).toBe('dd-mm-yyyy');
        expect(screen.getByTestId('To date-picker').getAttribute('max')).toBe(TODAY);
        expect(screen.getByTestId('From date-picker').getAttribute('max')).toBe(TODAY);
    });

    it('limits the From calendar to the chosen To date and vice versa', () => {
        setup();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '30-06-2026' } });
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '01-06-2026' } });
        expect(screen.getByTestId('From date-picker').getAttribute('max')).toBe('2026-06-30');
        expect(screen.getByTestId('To date-picker').getAttribute('min')).toBe('2026-06-01');
    });

    it('picking a date in the calendar fills the box as dd-mm-yyyy', () => {
        const { onChange } = setup();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        fireEvent.change(screen.getByTestId('From date-picker'), { target: { value: '2026-08-19' } });
        expect(screen.getByLabelText('From date').value).toBe('19-08-2026');
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onChange).toHaveBeenCalledWith({ preset: 'custom', fromDate: '2026-08-19', toDate: TODAY });
    });

    it('the calendar button opens the native picker', () => {
        setup();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        const picker = screen.getByTestId('From date-picker');
        picker.showPicker = vi.fn();
        fireEvent.click(screen.getByRole('button', { name: 'Open from date calendar' }));
        expect(picker.showPicker).toHaveBeenCalled();
    });

    it('rejects incomplete or impossible typed dates', () => {
        const { onChange } = setup();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '19-08-20' } });
        expect(screen.getByRole('button', { name: 'Apply' }).disabled).toBe(true);
        expect(screen.getByRole('alert').textContent).toMatch(/valid/i);
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '31-02-2026' } });
        expect(screen.getByRole('button', { name: 'Apply' }).disabled).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('does not accept the browser order mm-dd-yyyy', () => {
        setup();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '08-19-2026' } }); // month 19
        expect(screen.getByRole('button', { name: 'Apply' }).disabled).toBe(true);
    });

    it('uses the configured format when one is passed', () => {
        const onChange = vi.fn();
        render(<DateRangeFilter value={{ preset: 'custom', fromDate: '2026-01-05', toDate: '2026-01-31' }}
            onChange={onChange} presets={PRESETS} maxDate={TODAY} dateFormat="dd/mm/yyyy" />);
        expect(screen.getByLabelText('From date').value).toBe('05/01/2026');
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '06/01/2026' } });
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onChange).toHaveBeenCalledWith({ preset: 'custom', fromDate: '2026-01-06', toDate: '2026-01-31' });
    });

    it('applies a valid custom range', () => {
        const { onChange } = setup();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '01-06-2026' } });
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '30-06-2026' } });
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onChange).toHaveBeenCalledWith({ preset: 'custom', fromDate: '2026-06-01', toDate: '2026-06-30' });
    });

    it('blocks From after To with an inline error', () => {
        const { onChange } = setup();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '10-11-2026' } });
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '01-11-2026' } });
        const apply = screen.getByRole('button', { name: 'Apply' });
        expect(apply.disabled).toBe(true);
        expect(screen.getByRole('alert').textContent).toMatch(/on or before/i);
        fireEvent.click(apply);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('blocks a future To date', () => {
        setup();
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '01-12-2026' } });
        expect(screen.getByRole('button', { name: 'Apply' }).disabled).toBe(true);
        expect(screen.getByRole('alert').textContent).toMatch(/future/i);
    });

    it('starts with custom inputs open when the value is custom', () => {
        setup({ preset: 'custom', fromDate: '2026-01-01', toDate: '2026-01-31' });
        expect(screen.getByLabelText('From date').value).toBe('01-01-2026');
        expect(screen.getByTestId('range-label').textContent).toContain('01 Jan 2026 – 31 Jan 2026');
    });
});
