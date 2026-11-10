import React, { useEffect, useMemo, useState } from 'react';
import PendingSleepersGrid from './PendingSleepersGrid';
import SleeperEntryDetailModal from './SleeperEntryDetailModal';
import { AuthedImg, deleteSleeperScrapVerification } from '../../services/sleeperScrapService';
import './RejectionScrapping.css';

const ALL_COLUMNS   = ['Type', 'Date', 'Shift', 'Unit / Line / Shed', 'Stage', 'Batch', 'Sleeper IDs', 'Rejected', 'Disposed', 'Balance', 'IE Name', 'SV ID', 'Photos', 'Actions'];
const DISPOSAL_COLS = ['Type', 'Date', 'Shift', 'Unit / Line / Shed', 'Batch', 'Sleeper IDs', 'Disposed', 'Balance', 'IE Name', 'SV ID', 'Photos', 'Actions'];
const PAGE_SIZES = [10, 20, 30];
const MAX_CHIPS = 3;

const RowTypeBadge = ({ type, onClick }) => (
  <button
    type="button"
    className={`rs-badge rs-badge-btn ${type === 'REJECTION' ? 'rejection' : 'scrap'}`}
    onClick={onClick}
    title="View complete details"
  >
    {type === 'REJECTION' ? '✕ Rejection' : '✓ Disposal'}
  </button>
);

const SkeletonRows = ({ colCount }) => (
  <>
    {[1, 2, 3, 4].map(i => (
      <tr key={i} className="rs-skel-row">
        {Array.from({ length: colCount }).map((_, j) => (
          <td key={j}><div className="rs-skeleton" style={{ width: j === 0 ? 80 : j === 7 ? 120 : 60 }} /></td>
        ))}
      </tr>
    ))}
  </>
);

/**
 * Scrap Ledger (running passbook), same look as the ERC Rejection & Disposal ledger, with the sleeper IDs of
 * every transaction. Clicking a Type badge opens its complete details.
 */
export default function SleeperScrapLedgerTable({
  rows, loading, readOnly = false, onRefresh, onEdit, onToast,
  pendingSleepers, pendingLoading,
}) {
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL | REJECTION | SCRAP | PENDING
  const [batchQ, setBatchQ] = useState('');
  const [sleeperQ, setSleeperQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [detailRow, setDetailRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [lightboxUrls, setLightboxUrls] = useState(null);

  const isPending = typeFilter === 'PENDING';
  const isDisposalOnly = typeFilter === 'SCRAP';
  const baseCols = isDisposalOnly ? DISPOSAL_COLS : ALL_COLUMNS;
  const COLUMNS = readOnly ? baseCols.filter(c => c !== 'Actions') : baseCols;

  const all = useMemo(() => rows || [], [rows]);
  const filteredRows = useMemo(() => {
    const bq = batchQ.trim().toUpperCase();
    const sq = sleeperQ.trim().toUpperCase();
    return all.filter(r => {
      if (r.rowType === 'REJECTION' && !r.rejectedQty) return false;
      if (typeFilter === 'REJECTION' && r.rowType !== 'REJECTION') return false;
      if (typeFilter === 'SCRAP' && r.rowType !== 'SCRAP') return false;
      if (bq && !String(r.batchNo || '').toUpperCase().includes(bq)) return false;
      if (sq && !(r.sleeperIds || []).some(id => String(id).toUpperCase().includes(sq))) return false;
      if (from && (!r.entryDate || r.entryDate < from)) return false;
      if (to && (!r.entryDate || r.entryDate > to)) return false;
      return true;
    });
  }, [all, typeFilter, batchQ, sleeperQ, from, to]);

  useEffect(() => { setPage(1); }, [rows, pageSize, typeFilter, batchQ, sleeperQ, from, to]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const rejectionCount = all.filter(r => r.rowType === 'REJECTION' && r.rejectedQty).length;
  const scrapCount = all.filter(r => r.rowType === 'SCRAP').length;
  const hasLedgerFilters = batchQ || sleeperQ || from || to;

  const handleDelete = async () => {
    if (deleteReason.trim().length < 5 || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteSleeperScrapVerification(deleteTarget.verificationId, deleteReason.trim());
      onToast?.(`Disposal entry ${deleteTarget.scrapVerificationId} deleted — ${deleteTarget.scrappedQty} sleeper(s) returned to the pending basket.`);
      setDeleteTarget(null);
      setDeleteReason('');
      onRefresh();
    } catch (e) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const renderSleeperIds = (row) => {
    const ids = row.sleeperIds || [];
    if (!ids.length) return <span style={{ color: '#cbd5e1' }}>—</span>;
    return (
      <div className="rs-chip-row" onClick={() => setDetailRow(row)} title={ids.join(', ')}>
        {ids.slice(0, MAX_CHIPS).map((id, i) => <span key={`${id}-${i}`} className="rs-sleeper-chip">{id}</span>)}
        {ids.length > MAX_CHIPS && <span className="rs-sleeper-chip more">+{ids.length - MAX_CHIPS}</span>}
      </div>
    );
  };

  return (
    <>
      {/* Type filter */}
      {!loading && (all.length > 0 || (pendingSleepers || []).length > 0) && (
        <div className="rs-type-filter">
          {[
            { key: 'ALL', label: 'All', count: rejectionCount + scrapCount },
            { key: 'REJECTION', label: 'Rejection', count: rejectionCount },
            { key: 'SCRAP', label: 'Disposal', count: scrapCount },
            { key: 'PENDING', label: 'Pending Sleepers', count: pendingLoading ? '…' : (pendingSleepers || []).length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              className={`rs-filter-pill${typeFilter === key ? ' active' : ''} ${key.toLowerCase()}`}
              onClick={() => setTypeFilter(key)}
            >
              {label} <span className="rs-filter-count">{count}</span>
            </button>
          ))}
        </div>
      )}

      {isPending ? (
        <div style={{ paddingTop: 4 }}>
          <PendingSleepersGrid sleepers={pendingSleepers} loading={pendingLoading} />
        </div>
      ) : (
        <>
          {!loading && all.length > 0 && (
            <div className="rs-grid-filters">
              <input className="rs-input rs-filter-search" placeholder="Batch No." value={batchQ} onChange={e => setBatchQ(e.target.value)} />
              <input className="rs-input rs-filter-search" placeholder="Sleeper ID" value={sleeperQ} onChange={e => setSleeperQ(e.target.value)} />
              <input className="rs-input rs-filter-date" type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} title="From date" />
              <input className="rs-input rs-filter-date" type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} title="To date" />
              {hasLedgerFilters && (
                <button type="button" className="rs-btn rs-btn-ghost rs-btn-xs" onClick={() => { setBatchQ(''); setSleeperQ(''); setFrom(''); setTo(''); }}>Clear</button>
              )}
            </div>
          )}

          <div className="rs-table-wrap">
            <table className="rs-table">
              <thead>
                <tr>{COLUMNS.map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows colCount={COLUMNS.length} />
                ) : all.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <div className="rs-empty">
                        <div className="rs-empty-icon">📋</div>
                        <p className="rs-empty-title">No entries for this plant yet</p>
                        <p className="rs-empty-sub">Rejected sleepers and disposal records will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <div className="rs-empty">
                        <div className="rs-empty-icon">🔍</div>
                        <p className="rs-empty-title">
                          No {typeFilter === 'REJECTION' ? 'rejection' : typeFilter === 'SCRAP' ? 'disposal' : ''} entries found
                        </p>
                        <p className="rs-empty-sub">Try switching or clearing the filters above</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, idx) => (
                    <tr key={`${row.rowType}-${row.entryId}-${idx}`}>
                      <td><RowTypeBadge type={row.rowType} onClick={() => setDetailRow(row)} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{row.entryDate || '—'}</td>
                      <td>{row.shift || '—'}</td>
                      <td>{row.unitLineShedNo || '—'}</td>
                      {!isDisposalOnly && <td>{row.rowType === 'REJECTION' ? (row.stageOfInspection || '—') : '—'}</td>}
                      <td>{row.batchNo || '—'}</td>
                      <td>{renderSleeperIds(row)}</td>
                      {!isDisposalOnly && (
                        <td style={{ color: row.rejectedQty > 0 ? '#dc2626' : '#94a3b8', fontWeight: row.rejectedQty > 0 ? 600 : 400 }}>
                          {row.rowType === 'REJECTION' ? (row.rejectedQty ?? '—') : <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                      )}
                      <td style={{ color: row.scrappedQty > 0 ? '#16a34a' : '#94a3b8', fontWeight: row.scrappedQty > 0 ? 600 : 400 }}>
                        {row.rowType === 'SCRAP' ? (row.scrappedQty ?? '—') : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td>
                        <span className={row.pendingBalance > 0 ? 'rs-balance-high' : 'rs-balance-ok'}>
                          {row.pendingBalance ?? '—'}
                        </span>
                      </td>
                      <td>{row.ieName || '—'}</td>
                      <td style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                        {row.scrapVerificationId || '—'}
                      </td>
                      <td>
                        {row.imageUrls && row.imageUrls.length > 0 ? (
                          <button type="button" className="rs-photo-btn" onClick={() => setLightboxUrls(row.imageUrls)}>
                            📷 {row.imageUrls.length}
                          </button>
                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      {!readOnly && (
                        <td>
                          {row.rowType === 'SCRAP' && (
                            row.editable ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button type="button" className="rs-icon-btn edit" onClick={() => onEdit?.(row)} title="Edit within 1 hour">✏️</button>
                                <button type="button" className="rs-icon-btn del" onClick={() => { setDeleteTarget(row); setDeleteReason(''); setDeleteError(''); }} title="Delete within 1 hour">🗑️</button>
                              </div>
                            ) : (
                              <span className="rs-lock-icon" title="Locked — edit window expired (1 hour)">🔒</span>
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {!loading && totalRows > 0 && (
            <div className="rs-pagination">
              <div className="rs-pagination-info">
                Showing {Math.min((safePage - 1) * pageSize + 1, totalRows)}–{Math.min(safePage * pageSize, totalRows)} of {totalRows} entries
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
      )}

      {/* Drill-down */}
      {detailRow && <SleeperEntryDetailModal row={detailRow} onClose={() => setDetailRow(null)} />}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="rs-overlay" onClick={e => e.target === e.currentTarget && !deleting && setDeleteTarget(null)}>
          <div className="rs-modal rs-modal-sm">
            <div className="rs-modal-header">
              <div className="rs-modal-title" style={{ color: '#dc2626' }}>
                <span>🗑️</span> Confirm Delete
              </div>
              <button className="rs-modal-close" onClick={() => setDeleteTarget(null)} disabled={deleting}>✕</button>
            </div>
            <div className="rs-modal-body">
              {deleteError && <div className="rs-error-box"><span>⚠️</span>{deleteError}</div>}
              <div className="rs-sv-chip" style={{ marginBottom: 14 }}>
                <span>🔖</span> {deleteTarget.scrapVerificationId}
                <span style={{ color: '#64748b', fontWeight: 400 }}>— {deleteTarget.scrappedQty} sleepers on {deleteTarget.entryDate}</span>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#64748b' }}>
                The sleepers of this entry go back to the pending scrap basket. This action is audited.
              </p>
              <div className="rs-field">
                <label className="rs-reason-label">Reason for deletion * (min. 5 chars — audited)</label>
                <textarea
                  className="rs-input"
                  rows={3}
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Mandatory — this reason will be permanently recorded"
                />
              </div>
            </div>
            <div className="rs-modal-footer">
              <button className="rs-btn rs-btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button
                className="rs-btn rs-btn-danger"
                onClick={handleDelete}
                disabled={deleteReason.trim().length < 5 || deleting}
              >
                {deleting ? '⏳ Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrls && (
        <div className="rs-lightbox" onClick={() => setLightboxUrls(null)}>
          <button className="rs-lightbox-close" onClick={() => setLightboxUrls(null)} title="Close">✕</button>
          {lightboxUrls.map((url, i) => (
            <AuthedImg key={i} src={url} alt={`${i + 1} of ${lightboxUrls.length}`} onClick={e => e.stopPropagation()} />
          ))}
        </div>
      )}
    </>
  );
}
