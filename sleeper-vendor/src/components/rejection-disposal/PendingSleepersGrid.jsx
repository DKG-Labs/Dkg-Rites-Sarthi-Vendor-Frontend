import React, { useEffect, useMemo, useState } from 'react';
import { sleeperRefKey } from './sleeperRef';
import './RejectionScrapping.css';

const PAGE_SIZES = [10, 20, 50, 100];
const STAGE_CLASS = { DEMOULDING: 'demoulding', FINAL: 'final', TESTING: 'testing' };

const uniq = (list) => [...new Set(list.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

/**
 * Detail view of the Rejection Basket: every pending sleeper with the SRS filters
 * (Batch / Sleeper ID search, Sleeper Type, Inspection Stage, Rejection Reason, Date Range).
 * With `selectable`, rows get checkboxes for Scrap Verification.
 */
export default function PendingSleepersGrid({ sleepers, loading, selectable = false, selectedKeys, onToggle, onToggleMany }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [stage, setStage] = useState('');
  const [reason, setReason] = useState('');
  const [shift, setShift] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pageSize, setPageSize] = useState(selectable ? 20 : 10);
  const [page, setPage] = useState(1);

  const all = useMemo(() => sleepers || [], [sleepers]);
  const types = useMemo(() => uniq(all.map(s => s.sleeperType)), [all]);
  const stages = useMemo(() => uniq(all.map(s => s.stageLabel || s.stage)), [all]);
  const reasons = useMemo(() => uniq(all.map(s => s.reason)), [all]);
  const shifts = useMemo(() => uniq(all.map(s => s.shift)), [all]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return all.filter(s => {
      if (q && !`${s.sleeperNo || ''} ${s.batchNo || ''}`.toUpperCase().includes(q)) return false;
      if (type && s.sleeperType !== type) return false;
      if (stage && (s.stageLabel || s.stage) !== stage) return false;
      if (reason && s.reason !== reason) return false;
      if (shift && s.shift !== shift) return false;
      if (from && (!s.rejectionDate || s.rejectionDate < from)) return false;
      if (to && (!s.rejectionDate || s.rejectionDate > to)) return false;
      return true;
    });
  }, [all, search, type, stage, reason, shift, from, to]);

  useEffect(() => { setPage(1); }, [search, type, stage, reason, shift, from, to, pageSize, sleepers]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const filteredKeys = filtered.map(sleeperRefKey);
  const selectedInFilter = selectable ? filteredKeys.filter(k => selectedKeys?.has(k)).length : 0;
  const allFilteredSelected = filtered.length > 0 && selectedInFilter === filtered.length;
  const hasFilters = search || type || stage || reason || shift || from || to;

  const clearFilters = () => { setSearch(''); setType(''); setStage(''); setReason(''); setShift(''); setFrom(''); setTo(''); };
  const colCount = selectable ? 9 : 8;

  return (
    <>
      <div className="rs-grid-filters">
        <input
          className="rs-input rs-filter-search"
          placeholder="Search Sleeper ID / Batch No."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="rs-input" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All sleeper types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="rs-input" value={stage} onChange={e => setStage(e.target.value)}>
          <option value="">All stages</option>
          {stages.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="rs-input" value={reason} onChange={e => setReason(e.target.value)}>
          <option value="">All reasons</option>
          {reasons.map(t => <option key={t} value={t}>{t.length > 60 ? `${t.slice(0, 57)}…` : t}</option>)}
        </select>
        <select className="rs-input" value={shift} onChange={e => setShift(e.target.value)}>
          <option value="">All shifts</option>
          {shifts.map(t => <option key={t} value={t}>{t === 'General' ? 'General' : `Shift ${t}`}</option>)}
        </select>
        <input className="rs-input rs-filter-date" type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} title="Rejected from" />
        <input className="rs-input rs-filter-date" type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} title="Rejected to" />
        {hasFilters && (
          <button type="button" className="rs-btn rs-btn-ghost rs-btn-xs" onClick={clearFilters}>Clear</button>
        )}
      </div>

      {selectable && (
        <div className="rs-select-bar">
          <span>
            <strong>{selectedKeys?.size || 0}</strong> sleeper{(selectedKeys?.size || 0) === 1 ? '' : 's'} selected
            {hasFilters && <span className="rs-select-bar-muted"> · {filtered.length} shown</span>}
          </span>
          {filtered.length > 0 && (
            <button
              type="button"
              className="rs-btn rs-btn-ghost rs-btn-xs"
              onClick={() => onToggleMany(filtered, !allFilteredSelected)}
            >
              {allFilteredSelected ? 'Clear shown' : `Select all ${filtered.length} shown`}
            </button>
          )}
        </div>
      )}

      <div className="rs-table-wrap">
        <table className="rs-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    className="rs-check"
                    checked={allFilteredSelected}
                    disabled={filtered.length === 0}
                    onChange={() => onToggleMany(filtered, !allFilteredSelected)}
                    title="Select all shown"
                  />
                </th>
              )}
              <th>Date of Rejection</th>
              <th>Shift</th>
              <th>Batch No.</th>
              <th>Sleeper ID</th>
              <th>Sleeper Type</th>
              <th>Inspection Stage</th>
              <th>Reason for Rejection</th>
              <th>Added By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <tr key={i} className="rs-skel-row">
                  {Array.from({ length: colCount }).map((_, j) => (
                    <td key={j}><div className="rs-skeleton" style={{ width: j === 0 ? 40 : 70 }} /></td>
                  ))}
                </tr>
              ))
            ) : all.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <div className="rs-empty">
                    <div className="rs-empty-icon">✅</div>
                    <p className="rs-empty-title">No sleepers pending for scrapping</p>
                    <p className="rs-empty-sub">Every rejected sleeper of this plant has been scrapped</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <div className="rs-empty">
                    <div className="rs-empty-icon">🔍</div>
                    <p className="rs-empty-title">No pending sleepers match the filters</p>
                    <p className="rs-empty-sub">Try changing or clearing the filters above</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map(s => {
                const key = sleeperRefKey(s);
                const checked = selectable && selectedKeys?.has(key);
                return (
                  <tr
                    key={key}
                    className={`${selectable ? 'rs-row-selectable' : ''}${checked ? ' rs-row-selected' : ''}`}
                    onClick={selectable ? () => onToggle(s) : undefined}
                  >
                    {selectable && (
                      <td onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="rs-check" checked={!!checked} onChange={() => onToggle(s)} />
                      </td>
                    )}
                    <td style={{ whiteSpace: 'nowrap' }}>{s.rejectionDate || '—'}</td>
                    <td>{s.shift || '—'}</td>
                    <td>{s.batchNo || '—'}</td>
                    <td><span className="rs-sleeper-chip">{s.sleeperNo}</span></td>
                    <td>{s.sleeperType || '—'}</td>
                    <td>
                      <span className={`rs-stage-tag ${STAGE_CLASS[s.stage] || ''}`}>{s.stageLabel || s.stage || '—'}</span>
                    </td>
                    <td className="rs-reason-cell" title={s.reason || ''}>{s.reason || '—'}</td>
                    <td>{s.addedBy || '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="rs-pagination">
          <div className="rs-pagination-info">
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} sleepers
          </div>
          <div className="rs-pagination-controls">
            <span className="rs-pagination-label">Rows per page:</span>
            <select className="rs-page-size-select" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="rs-pagination-nav">
              <button type="button" className="rs-page-btn" onClick={() => setPage(1)} disabled={safePage === 1} title="First page">«</button>
              <button type="button" className="rs-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} title="Previous page">‹</button>
              <span className="rs-page-indicator">{safePage} / {totalPages}</span>
              <button type="button" className="rs-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} title="Next page">›</button>
              <button type="button" className="rs-page-btn" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} title="Last page">»</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
