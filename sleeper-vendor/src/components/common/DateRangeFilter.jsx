import React, { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import {
    presetRange, customRange, validateRange, formatRangeLabel, formatISOAs, parseAsPattern, normalizeToISO,
} from '../../utils/dateRange';
import { PD_CONFIG } from '../../config/productionDeclarationConfig';

// Marks typed text that isn't a complete valid date, so validation shows "Enter valid dates"
const INVALID_DATE = 'invalid';

const chipStyle = (active) => ({
    padding: '6px 12px',
    borderRadius: '8px',
    border: `1px solid ${active ? '#42818c' : '#e2e8f0'}`,
    background: active ? '#42818c' : 'white',
    color: active ? 'white' : '#475569',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
});

const inputStyle = {
    padding: '6px 8px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    color: '#334155',
};

const isoOrUndefined = (v) => normalizeToISO(v) || undefined;

/**
 * Date box shown and typed in `format` (e.g. dd-mm-yyyy) regardless of browser locale.
 * The calendar button opens the browser's native picker. Reports ISO yyyy-MM-dd, '' when
 * empty, or INVALID_DATE while the text is incomplete. Reset from outside by changing `key`.
 */
const FormattedDateInput = ({ label, value, onChange, min, max, format }) => {
    const [text, setText] = useState(value && value !== INVALID_DATE ? formatISOAs(value, format) : '');
    const pickerRef = useRef(null);

    const onType = (e) => {
        const t = e.target.value;
        setText(t);
        onChange(t.trim() ? parseAsPattern(t, format) || INVALID_DATE : '');
    };

    const onPick = (e) => {
        const iso = e.target.value;
        setText(iso ? formatISOAs(iso, format) : '');
        onChange(iso || '');
    };

    const openPicker = () => {
        const el = pickerRef.current;
        if (!el) return;
        try {
            if (typeof el.showPicker === 'function') el.showPicker();
            else el.click();
        } catch { el.focus(); }
    };

    return (
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <input
                type="text"
                inputMode="numeric"
                aria-label={label}
                placeholder={format}
                maxLength={format.length}
                value={text}
                onChange={onType}
                style={{ ...inputStyle, width: `${format.length + 4}ch`, paddingRight: '28px' }}
            />
            <button type="button" aria-label={`Open ${label.toLowerCase()} calendar`} onClick={openPicker}
                style={{ position: 'absolute', right: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', display: 'flex', padding: '2px' }}>
                <CalendarDays size={14} aria-hidden="true" />
            </button>
            <input
                ref={pickerRef}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                data-testid={`${label}-picker`}
                value={isoOrUndefined(value) || ''}
                min={isoOrUndefined(min)}
                max={isoOrUndefined(max)}
                onChange={onPick}
                style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 0, opacity: 0, border: 0, padding: 0, pointerEvents: 'none' }}
            />
        </span>
    );
};

/**
 * Preset chips (Last N days) plus a Custom From/To range applied with a button.
 *
 * @param {{preset:number|'custom', fromDate:string, toDate:string|null}} value
 * @param {(range) => void} onChange
 * @param {number[]} presets   days for each preset chip
 * @param {string}   maxDate   ISO date; custom To can't be later (normally today)
 * @param {string}   dateFormat display/typing format for custom dates (from config by default)
 */
const DateRangeFilter = ({ value, onChange, presets, maxDate, dateFormat = PD_CONFIG.dateInputFormat }) => {
    const [customOpen, setCustomOpen] = useState(value?.preset === 'custom');
    const [draftFrom, setDraftFrom] = useState(value?.fromDate || '');
    const [draftTo, setDraftTo] = useState(value?.toDate || maxDate || '');
    const [inputsKey, setInputsKey] = useState(0);

    const draftError = validateRange(draftFrom, draftTo, maxDate);
    const isCustom = value?.preset === 'custom';

    const openCustom = () => {
        setDraftFrom(value?.fromDate || '');
        setDraftTo(value?.toDate || maxDate || '');
        setInputsKey((k) => k + 1); // re-seed the text boxes from the drafts
        setCustomOpen(true);
    };

    const applyCustom = () => {
        if (draftError) return;
        onChange(customRange(draftFrom, draftTo));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div role="group" aria-label="Date range" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end' }}>
                {presets.map((days) => (
                    <button
                        key={days}
                        type="button"
                        aria-pressed={value?.preset === days}
                        style={chipStyle(value?.preset === days)}
                        onClick={() => { setCustomOpen(false); onChange(presetRange(days)); }}
                    >
                        Last {days} days
                    </button>
                ))}
                <button type="button" aria-pressed={isCustom} style={chipStyle(isCustom || customOpen)} onClick={openCustom}>
                    Custom
                </button>
            </div>

            {customOpen && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                        From{' '}
                        <FormattedDateInput key={`from-${inputsKey}`} label="From date" format={dateFormat}
                            value={draftFrom} max={isoOrUndefined(draftTo) || maxDate} onChange={setDraftFrom} />
                    </label>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                        To{' '}
                        <FormattedDateInput key={`to-${inputsKey}`} label="To date" format={dateFormat}
                            value={draftTo} min={draftFrom} max={maxDate} onChange={setDraftTo} />
                    </label>
                    <button type="button" onClick={applyCustom} disabled={Boolean(draftError)}
                        style={{ ...chipStyle(!draftError), cursor: draftError ? 'not-allowed' : 'pointer', opacity: draftError ? 0.6 : 1 }}>
                        Apply
                    </button>
                </div>
            )}
            {customOpen && draftError && (draftFrom || draftTo) && (
                <span role="alert" style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>{draftError}</span>
            )}

            <span data-testid="range-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                <CalendarDays size={13} aria-hidden="true" />
                {formatRangeLabel(value?.fromDate, value?.toDate)}
            </span>
        </div>
    );
};

export default DateRangeFilter;
