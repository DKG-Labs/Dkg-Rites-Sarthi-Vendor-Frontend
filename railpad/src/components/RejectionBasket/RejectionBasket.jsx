import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getRejectionBasket, getRejectionHistory, getScrapLedger } from '../../services/railpadScrapService';
import ScrapVerificationModal from './ScrapVerificationModal';
import ScrapDetailModal, { fmtDate } from './ScrapDetailModal';
import { exportExcel, exportPdf } from './basketExport';
import './RejectionBasket.css';

const n = (v) => Number(v || 0).toLocaleString('en-IN');
const rowKey = (r) => `${r.plantId}|${r.productType}`;
const fileStamp = () => new Date().toISOString().slice(0, 10);
const PAGE_SIZES = [10, 15, 25, 50];

const StagePill = ({ stage }) => (
  <span className={`rb-pill ${stage === 'FINAL' ? 'rb-pill--final' : 'rb-pill--process'}`}>
    {stage === 'FINAL' ? 'Final' : 'Process'}
  </span>
);

const Icon = {
  rejected: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  done: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clock: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chart: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <path d="M3 17h14M5 14V9M9 14V5M13 14v-7M17 14v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  calendar: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 2v4M13 2v4M3 8h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  plant: (s = 28) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="10" width="4" height="12" rx="1" fill="currentColor" opacity=".7" />
      <rect x="8" y="6" width="4" height="16" rx="1" fill="currentColor" />
      <rect x="14" y="8" width="4" height="14" rx="1" fill="currentColor" opacity=".7" />
      <rect x="20" y="12" width="2" height="10" rx="1" fill="currentColor" opacity=".5" />
      <line x1="2" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const SortTh = ({ col, label, sort, onSort, num }) => (
  <th className={`rb-sortable ${num ? 'rb-num' : ''} ${sort.col === col ? 'rb-sorted' : ''}`} onClick={() => onSort(col)}>
    {label}
    <span className="rb-sort-icon">{sort.col === col ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}</span>
  </th>
);

const SkeletonRows = ({ cols, rows = 6 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="rb-skel-row">
        {Array.from({ length: cols }).map((__, j) => (
          <td key={j}><div className="rb-skeleton" style={{ width: `${45 + ((i * 7 + j * 13) % 45)}%` }} /></td>
        ))}
      </tr>
    ))}
  </>
);

const Empty = ({ cols, title, sub }) => (
  <tr>
    <td colSpan={cols}>
      <div className="rb-empty">
        <div className="rb-empty-icon">📋</div>
        <p className="rb-empty-title">{title}</p>
        {sub && <p className="rb-empty-sub">{sub}</p>}
      </div>
    </td>
  </tr>
);

/** Pager in the same style as the ERC Rejection & Disposal screen. */
const Pager = ({ page, setPage, pageSize, setPageSize, total, unit }) => {
  if (!total) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="rb-pagination">
      <div className="rb-pg-info">
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total} {unit}
      </div>
      <div className="rb-pg-controls">
        <span className="rb-pg-label">Rows per page:</span>
        <select className="rb-pg-size" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="rb-pg-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
        <button className="rb-pg-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
        <span className="rb-pg-current">Page {page} / {totalPages}</span>
        <button className="rb-pg-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>›</button>
        <button className="rb-pg-btn" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>»</button>
      </div>
    </div>
  );
};

/** Client-side page state that jumps back to page 1 whenever `resetKey` changes. */
const usePaging = (items, resetKey, initialSize = 15) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  useEffect(() => { setPage(1); }, [resetKey, pageSize]);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  return {
    page: safePage, setPage, pageSize, setPageSize,
    offset: (safePage - 1) * pageSize,
    pageItems: items.slice((safePage - 1) * pageSize, safePage * pageSize),
  };
};

/**
 * Rail Pad Rejection Basket (SRS): plant-wise pending scrap, rejection history, scrap ledger.
 * The backend decides which plants the user sees and whether they may record scrap verifications
 * (only a Process IE mapped to the plant). readOnly hides every change action regardless.
 */
export default function RejectionBasket({ readOnly = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fManufacturer, setFManufacturer] = useState('');
  const [fPlant, setFPlant] = useState('');
  const [fProduct, setFProduct] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [sort, setSort] = useState({ col: 'pendingScrapQty', dir: 'desc' });

  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('history');

  const [history, setHistory] = useState([]);
  const [hFilter, setHFilter] = useState({ fromDate: '', toDate: '', stage: '' });
  const [ledger, setLedger] = useState(null);
  const [lFilter, setLFilter] = useState({ fromDate: '', toDate: '', txnType: '' });
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [openRow, setOpenRow] = useState(null);

  const loadBasket = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRejectionBasket();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Could not load the rejection basket.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBasket(); }, [loadBasket]);

  const loadDetail = useCallback(async () => {
    if (!selected) return;
    setDetailLoading(true);
    setDetailError('');
    const base = { plantId: selected.plantId, productType: selected.productType };
    try {
      if (tab === 'history') {
        setHistory(await getRejectionHistory({ ...base, ...hFilter }) || []);
      } else {
        setLedger(await getScrapLedger({ ...base, ...lFilter }));
      }
    } catch (e) {
      setDetailError(e.message || 'Could not load details.');
    } finally {
      setDetailLoading(false);
    }
  }, [selected, tab, hFilter, lFilter]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  // Keep the selected row's numbers in sync after a refresh
  useEffect(() => {
    if (selected) {
      const fresh = rows.find(r => rowKey(r) === rowKey(selected));
      if (fresh && fresh !== selected) setSelected(fresh);
    }
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const manufacturers = useMemo(() => [...new Set(rows.map(r => r.manufacturer).filter(Boolean))].sort(), [rows]);
  const plants = useMemo(() => [...new Map(rows
    .filter(r => !fManufacturer || r.manufacturer === fManufacturer)
    .map(r => [r.plantId, r.placeOfInspection || r.plantId])).entries()], [rows, fManufacturer]);
  const products = useMemo(() => [...new Set(rows.map(r => r.productType).filter(Boolean))].sort(), [rows]);

  const visible = useMemo(() => {
    const filtered = rows.filter(r =>
      (!fManufacturer || r.manufacturer === fManufacturer)
      && (!fPlant || r.plantId === fPlant)
      && (!fProduct || r.productType === fProduct)
      && (!fStatus || (fStatus === 'PENDING' ? r.pendingScrapQty > 0 : !r.pendingScrapQty)));
    const dir = sort.dir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      const av = a[sort.col] ?? '';
      const bv = b[sort.col] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, fManufacturer, fPlant, fProduct, fStatus, sort]);

  const onSort = (col) => setSort(s => (s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'desc' }));

  const basketPg = usePaging(visible, `${fManufacturer}|${fPlant}|${fProduct}|${fStatus}|${sort.col}|${sort.dir}`);
  const historyPg = usePaging(history, `${rowKey(selected || {})}|${JSON.stringify(hFilter)}`);
  const ledgerRows = ledger?.rows || [];
  const ledgerPg = usePaging(ledgerRows, `${rowKey(selected || {})}|${JSON.stringify(lFilter)}`);

  const totals = visible.reduce((t, r) => ({
    rejected: t.rejected + (r.totalRejected || 0),
    scrapped: t.scrapped + (r.totalScrapped || 0),
    pending: t.pending + (r.pendingScrapQty || 0),
    rejected30: t.rejected30 + (r.rejectedLast30Days || 0),
  }), { rejected: 0, scrapped: 0, pending: 0, rejected30: 0 });

  const canScrapSelected = !readOnly && selected?.canScrap;

  const openDetail = (r) => {
    setSelected(r);
    setTab('history');
    setHistory([]);
    setLedger(null);
  };
  const closeDetail = () => {
    setSelected(null);
    setHistory([]);
    setLedger(null);
  };

  const afterSave = (msg) => {
    setShowAdd(false);
    setEditEntry(null);
    setOpenRow(null);
    setNotice(msg);
    setTimeout(() => setNotice(''), 5000);
    loadBasket();
    setTab('ledger');
    loadDetail();
  };

  // ---------- Exports ----------
  const basketCols = [
    { header: 'Manufacturer', value: r => r.manufacturer || '-' },
    { header: 'Place of Inspection', value: r => r.placeOfInspection || r.plantId },
    { header: 'Product Type', value: r => r.productType },
    { header: 'Production (30 days)', value: r => r.productionLast30Days },
    { header: 'Rejected (30 days)', value: r => r.rejectedLast30Days },
    { header: 'Total Rejected', value: r => r.totalRejected },
    { header: 'Total Scrapped', value: r => r.totalScrapped },
    { header: 'Pending Scrap (pcs)', value: r => r.pendingScrapQty },
    { header: 'Last Scrap Verification', value: r => (r.lastScrapDate ? fmtDate(r.lastScrapDate) : '-') },
  ];
  const historyCols = [
    { header: 'Date', value: r => fmtDate(r.date) },
    { header: 'Batch / Lot', value: r => r.reference },
    { header: 'Product Type', value: r => r.productType },
    { header: 'Stage', value: r => (r.stage === 'FINAL' ? 'Final' : 'Process') },
    { header: 'Defect Reason', value: r => r.defectReason || '-' },
    { header: 'Rejected Qty', value: r => r.rejectedQty },
    { header: 'Added By', value: r => r.addedBy || '-' },
  ];
  const ledgerCols = [
    { header: 'Date', value: r => fmtDate(r.date) },
    { header: 'Transaction', value: r => r.transactionType },
    { header: 'Reference', value: r => r.reference || '-' },
    { header: 'Rejected (+)', value: r => (r.rejectedQty != null ? `+${r.rejectedQty}` : '-') },
    { header: 'Scrapped (-)', value: r => (r.scrappedQty != null ? `-${r.scrappedQty}` : '-') },
    { header: 'Pending for Scrapping', value: r => r.pendingBalance },
    { header: 'Engineer', value: r => r.engineer || '-' },
  ];
  const selName = selected ? `${selected.manufacturer || ''} ${selected.placeOfInspection || selected.plantId} - ${selected.productType}` : '';

  const doExport = (kind, what) => {
    const sets = {
      basket: ['Rail Pad Rejection Basket', 'All plants in view', basketCols, visible, `RejectionBasket_${fileStamp()}`],
      history: [`Rejection History - ${selName}`, 'Process and final rejections', historyCols, history, `RejectionHistory_${fileStamp()}`],
      ledger: [`Scrap Ledger - ${selName}`, `Pending for scrapping: ${n(ledger?.pendingScrapQty)}`, ledgerCols, ledgerRows, `ScrapLedger_${fileStamp()}`],
    };
    const [title, subtitle, cols, data, file] = sets[what];
    if (kind === 'pdf') exportPdf(file, title, subtitle, cols, data);
    else exportExcel(file, title, cols, data);
  };

  const avatar = (name) => (name ? name.trim()[0].toUpperCase() : '?');

  const modals = (
    <>
      {showAdd && selected && (
        <ScrapVerificationModal
          mode="add"
          basketRow={selected}
          onClose={() => setShowAdd(false)}
          onSaved={(s) => afterSave(`Scrap verification ${s?.verificationNo || ''} recorded. Pending quantity updated.`)}
        />
      )}
      {editEntry && selected && (
        <ScrapVerificationModal
          mode="edit"
          basketRow={selected}
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={(s) => afterSave(`Scrap verification ${s?.verificationNo || ''} updated.`)}
        />
      )}
      {openRow && (
        <ScrapDetailModal
          row={openRow}
          readOnly={readOnly}
          onClose={() => setOpenRow(null)}
          onEdit={(detail) => { setOpenRow(null); setEditEntry(detail); }}
          onDeleted={() => afterSave('Scrap verification deleted. Pending quantity restored.')}
        />
      )}
    </>
  );

  // ================= Detail page =================
  if (selected) {
    const pending = selected.pendingScrapQty > 0;
    return (
      <div className="rb-wrap">
        {notice && <div className="rb-ok">{notice}</div>}

        <div className="rb-hero">
          <div className="rb-hero-top">
            <button className="rb-back-btn" onClick={closeDetail}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <nav className="rb-breadcrumb">
              <span className="rb-bc-root">Rejection Basket</span>
              <span className="rb-bc-sep">›</span>
              <span className="rb-bc-current">{selected.manufacturer || selected.plantId} — {selected.productType}</span>
            </nav>
          </div>

          <div className="rb-hero-body">
            <div className="rb-hero-plant">
              <div className="rb-hero-plant-icon">{Icon.plant()}</div>
              <div>
                <div className="rb-hero-company">{selected.manufacturer || selected.plantId}</div>
                <div className="rb-hero-unit">{selected.placeOfInspection || selected.plantId}</div>
              </div>
            </div>
            <div className="rb-hero-right">
              <span className="rb-hero-badge">{selected.productType}</span>
              {canScrapSelected && (
                <button className="rb-btn rb-btn--primary" disabled={!pending} onClick={() => setShowAdd(true)}
                  title={pending ? '' : 'Nothing pending for scrapping'}>
                  + Add Scrap Verification
                </button>
              )}
            </div>
          </div>

          <div className="rb-stat-row">
            <div className="rb-stat rb-stat--rejected">
              <div className="rb-stat-icon">{Icon.rejected(20)}</div>
              <div className="rb-stat-body">
                <div className="rb-stat-label">Total Rejected</div>
                <div className="rb-stat-value">{n(selected.totalRejected)}</div>
                <div className="rb-stat-unit">pieces · {n(selected.rejectedLast30Days)} in last 30 days</div>
              </div>
            </div>
            <div className="rb-stat rb-stat--scrapped">
              <div className="rb-stat-icon">{Icon.done(20)}</div>
              <div className="rb-stat-body">
                <div className="rb-stat-label">Total Scrapped</div>
                <div className="rb-stat-value">{n(selected.totalScrapped)}</div>
                <div className="rb-stat-unit">pieces witnessed</div>
              </div>
            </div>
            <div className={`rb-stat ${pending ? 'rb-stat--pending' : 'rb-stat--clear'}`}>
              <div className="rb-stat-icon">{pending ? Icon.clock(20) : Icon.done(20)}</div>
              <div className="rb-stat-body">
                <div className="rb-stat-label">Pending for Scrapping</div>
                <div className="rb-stat-value">{n(selected.pendingScrapQty)}</div>
                <div className="rb-stat-unit">{pending ? 'awaiting destruction' : 'fully scrapped'}</div>
              </div>
            </div>
            <div className="rb-stat rb-stat--date">
              <div className="rb-stat-icon">{Icon.calendar(20)}</div>
              <div className="rb-stat-body">
                <div className="rb-stat-label">Last Scrap Verification</div>
                <div className="rb-stat-value rb-stat-value--date">{selected.lastScrapDate ? fmtDate(selected.lastScrapDate) : '—'}</div>
                <div className="rb-stat-unit">production (30 d): {n(selected.productionLast30Days)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rb-section">
          <div className="rb-section-head">
            <div className="rb-tabs">
              <button className={`rb-tab ${tab === 'history' ? 'rb-tab--active' : ''}`} onClick={() => setTab('history')}>Rejection History</button>
              <button className={`rb-tab ${tab === 'ledger' ? 'rb-tab--active' : ''}`} onClick={() => setTab('ledger')}>Scrap Ledger</button>
            </div>
            <div className="rb-actions">
              <button className="rb-btn rb-btn--sm" onClick={() => doExport('excel', tab)}>Excel</button>
              <button className="rb-btn rb-btn--sm" onClick={() => doExport('pdf', tab)}>PDF</button>
            </div>
          </div>

          {tab === 'history' ? (
            <div className="rb-filters">
              <div className="rb-field"><label>From</label><input type="date" value={hFilter.fromDate} onChange={e => setHFilter(f => ({ ...f, fromDate: e.target.value }))} /></div>
              <div className="rb-field"><label>To</label><input type="date" value={hFilter.toDate} onChange={e => setHFilter(f => ({ ...f, toDate: e.target.value }))} /></div>
              <div className="rb-field">
                <label>Inspection Stage</label>
                <select value={hFilter.stage} onChange={e => setHFilter(f => ({ ...f, stage: e.target.value }))}>
                  <option value="">All stages</option><option value="PROCESS">Process</option><option value="FINAL">Final</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="rb-filters">
              <div className="rb-field"><label>From</label><input type="date" value={lFilter.fromDate} onChange={e => setLFilter(f => ({ ...f, fromDate: e.target.value }))} /></div>
              <div className="rb-field"><label>To</label><input type="date" value={lFilter.toDate} onChange={e => setLFilter(f => ({ ...f, toDate: e.target.value }))} /></div>
              <div className="rb-field">
                <label>Transaction Type</label>
                <select value={lFilter.txnType} onChange={e => setLFilter(f => ({ ...f, txnType: e.target.value }))}>
                  <option value="">All</option><option value="REJECTION">Rejections</option><option value="SCRAP">Scrap Verifications</option>
                </select>
              </div>
            </div>
          )}

          {detailError && <div className="rb-error">{detailError}</div>}

          <div className="rb-table-wrap rb-table-wrap--flat">
            {tab === 'history' ? (
              <table className="rb-table">
                <thead>
                  <tr><th style={{ width: 48 }}>S.No</th><th>Date</th><th>Batch / Lot No.</th><th>Product Type</th><th>Stage</th><th>Defect Reason</th><th className="rb-num">Rejected Qty</th><th>Added By</th></tr>
                </thead>
                <tbody>
                  {detailLoading ? <SkeletonRows cols={8} />
                    : !history.length ? <Empty cols={8} title="No rejections found" sub="No rejections match these filters" />
                      : historyPg.pageItems.map((h, i) => (
                        <tr key={i}>
                          <td className="rb-sr">{historyPg.offset + i + 1}</td>
                          <td className="rb-nowrap">{fmtDate(h.date)}</td>
                          <td><div className="rb-strong">{h.reference}</div><div className="rb-muted">{h.callOrShift}</div></td>
                          <td>{h.productType}</td>
                          <td><StagePill stage={h.stage} /></td>
                          <td className="rb-wrap-text">{h.defectReason || '-'}</td>
                          <td className="rb-num rb-plus">{n(h.rejectedQty)}</td>
                          <td>{h.addedBy || '-'}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            ) : (
              <table className="rb-table">
                <thead>
                  <tr><th style={{ width: 48 }}>S.No</th><th>Date</th><th>Transaction Type</th><th>Reference (Batch / Lot)</th><th className="rb-num">Rejected (+)</th><th className="rb-num">Scrapped (−)</th><th className="rb-num">Pending for Scrapping</th><th>Engineer</th></tr>
                </thead>
                <tbody>
                  {detailLoading ? <SkeletonRows cols={8} />
                    : !ledgerRows.length ? <Empty cols={8} title="No transactions found" sub="No ledger entries match these filters" />
                      : ledgerPg.pageItems.map((r, i) => (
                        <tr key={i} className="rb-click" onClick={() => setOpenRow(r)} title="Click for full details">
                          <td className="rb-sr">{ledgerPg.offset + i + 1}</td>
                          <td className="rb-nowrap">{fmtDate(r.date)}</td>
                          <td>
                            {r.rowType === 'SCRAP'
                              ? <span className="rb-pill rb-pill--scrap">Scrap Verification</span>
                              : <StagePill stage={r.stage} />}
                            {r.rowType === 'SCRAP' && r.editable && <span className="rb-editable">editable</span>}
                          </td>
                          <td>{r.reference || '-'}</td>
                          <td className="rb-num rb-plus">{r.rejectedQty != null ? `+${n(r.rejectedQty)}` : '-'}</td>
                          <td className="rb-num rb-minus">{r.scrappedQty != null ? `−${n(r.scrappedQty)}` : '-'}</td>
                          <td className="rb-num"><strong>{n(r.pendingBalance)}</strong></td>
                          <td>{r.engineer || '-'}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rb-section-foot">
            {tab === 'history'
              ? !detailLoading && <Pager {...historyPg} total={history.length} unit="rejections" />
              : !detailLoading && <Pager {...ledgerPg} total={ledgerRows.length} unit="transactions" />}
          </div>
        </div>

        {modals}
      </div>
    );
  }

  // ================= Basket list =================
  return (
    <div className="rb-wrap">
      <div className="rb-head">
        <div>
          <h2 className="rb-title">Rejection Basket</h2>
          <p className="rb-sub">Rail Pad — rejected pads (process &amp; final) awaiting witnessed destruction, as per IRS T-55 Clause 12.1 &amp; 17.0</p>
        </div>
        <div className="rb-actions">
          <button className="rb-btn" onClick={loadBasket} disabled={loading}>{loading ? 'Refreshing…' : '⟳ Refresh'}</button>
          <button className="rb-btn" onClick={() => doExport('excel', 'basket')} disabled={!visible.length}>Excel</button>
          <button className="rb-btn" onClick={() => doExport('pdf', 'basket')} disabled={!visible.length}>PDF</button>
        </div>
      </div>

      {notice && <div className="rb-ok">{notice}</div>}

      <div className="rb-topbar">
        {!loading && visible.length > 0 && (
          <div className="rb-kpi-strip">
            <div className="rb-kpi-card">
              <div className="rb-kpi-icon red">{Icon.rejected()}</div>
              <div><div className="rb-kpi-val">{n(totals.rejected)}</div><div className="rb-kpi-lbl">Total Rejected</div></div>
            </div>
            <div className="rb-kpi-card">
              <div className="rb-kpi-icon green">{Icon.done()}</div>
              <div><div className="rb-kpi-val">{n(totals.scrapped)}</div><div className="rb-kpi-lbl">Total Scrapped</div></div>
            </div>
            <div className="rb-kpi-card">
              <div className="rb-kpi-icon orange">{Icon.clock()}</div>
              <div><div className="rb-kpi-val">{n(totals.pending)}</div><div className="rb-kpi-lbl">Pending Scrap</div></div>
            </div>
            <div className="rb-kpi-card">
              <div className="rb-kpi-icon blue">{Icon.chart()}</div>
              <div><div className="rb-kpi-val">{n(totals.rejected30)}</div><div className="rb-kpi-lbl">Rejected (30 d)</div></div>
            </div>
          </div>
        )}

        <div className="rb-filters rb-filters--bar">
          <div className="rb-field">
            <label>Manufacturer</label>
            <select value={fManufacturer} onChange={e => { setFManufacturer(e.target.value); setFPlant(''); }}>
              <option value="">All manufacturers</option>
              {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="rb-field">
            <label>Plant</label>
            <select value={fPlant} onChange={e => setFPlant(e.target.value)}>
              <option value="">All plants</option>
              {plants.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
          <div className="rb-field">
            <label>Product Type</label>
            <select value={fProduct} onChange={e => setFProduct(e.target.value)}>
              <option value="">All product types</option>
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="rb-field">
            <label>Status</label>
            <select value={fStatus} onChange={e => setFStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CLEARED">Cleared</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="rb-error">{error}</div>}

      <div className="rb-table-wrap">
        <table className="rb-table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>S.No</th>
              <SortTh col="manufacturer" label="Manufacturer & Plant" sort={sort} onSort={onSort} />
              <SortTh col="productType" label="Product Type" sort={sort} onSort={onSort} />
              <SortTh col="productionLast30Days" label="Production (30 d)" sort={sort} onSort={onSort} num />
              <SortTh col="rejectedLast30Days" label="Rejected (30 d)" sort={sort} onSort={onSort} num />
              <SortTh col="pendingScrapQty" label="Pending Scrap" sort={sort} onSort={onSort} num />
              <SortTh col="lastScrapDate" label="Last Scrap Verification" sort={sort} onSort={onSort} />
              <th>Status</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && !rows.length ? <SkeletonRows cols={9} />
              : !visible.length ? (!error && <Empty cols={9} title="No data found" sub="No rejected Rail Pads match the current filters" />)
                : basketPg.pageItems.map((r, i) => {
                  const pending = r.pendingScrapQty > 0;
                  return (
                    <tr key={rowKey(r)} className={`rb-row ${pending ? 'rb-row--pending' : 'rb-row--done'}`} onClick={() => openDetail(r)}>
                      <td className="rb-sr">{basketPg.offset + i + 1}</td>
                      <td>
                        <div className="rb-co-cell">
                          <div className="rb-co-avatar">{avatar(r.manufacturer)}</div>
                          <div className="rb-co-info">
                            <span className="rb-co-name" title={r.manufacturer}>{r.manufacturer || '—'}</span>
                            <span className="rb-co-unit" title={r.placeOfInspection}>{r.placeOfInspection || r.plantId}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="rb-type-chip">{r.productType}</span></td>
                      <td className="rb-num">
                        <div className="rb-num-val">{n(r.productionLast30Days)}</div>
                        <div className="rb-num-label">pcs</div>
                      </td>
                      <td className="rb-num">
                        <div className="rb-num-val rb-c-red">{n(r.rejectedLast30Days)}</div>
                        <div className="rb-num-label">pcs</div>
                      </td>
                      <td className="rb-num">
                        <div className={`rb-num-val ${pending ? 'rb-c-orange' : 'rb-c-green'}`}>{n(r.pendingScrapQty)}</div>
                        <div className="rb-num-label">
                          {r.balanceMismatch
                            ? <span className="rb-pill rb-pill--warn" title="More scrapped than currently rejected: a rejection was reduced after scrapping">check</span>
                            : pending ? 'pending' : 'cleared'}
                        </div>
                      </td>
                      <td className="rb-date">{r.lastScrapDate ? fmtDate(r.lastScrapDate) : '—'}</td>
                      <td>
                        <span className={`rb-status ${pending ? 'rb-status--pending' : 'rb-status--done'}`}>{pending ? 'Pending' : 'Cleared'}</span>
                        {!readOnly && r.canScrap && pending && (
                          <button className="rb-btn rb-btn--sm rb-btn--primary rb-row-action"
                            onClick={(e) => { e.stopPropagation(); openDetail(r); setShowAdd(true); }}>
                            + Scrap
                          </button>
                        )}
                      </td>
                      <td><span className="rb-row-arrow">›</span></td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {!loading && <Pager {...basketPg} total={visible.length} unit="rows" />}

      {modals}
    </div>
  );
}
