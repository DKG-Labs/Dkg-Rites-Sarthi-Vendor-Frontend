import React, { useCallback, useEffect, useMemo, useState } from 'react';
import diversionService, { diversionErrorMessage } from '../../../services/diversionService';
import RaiseRailpadDiversionModal from './RaiseRailpadDiversionModal';
import './MaterialDiversion.css';

/*
 * Rail Pad Material Diversion (Process / Final): divert passed material of an issued IC from one PO serial to another.
 * Flow: vendor raises → CM approves / returns / forwards to SBU Head → diverted IC issued on the target PO → IBS.
 */

const STATUS_LABEL = {
  PENDING_CM_APPROVAL: ['Pending with CM', 'warn'],
  CM_RETURN_DIVERSION: ['Returned by CM', 'bad'],
  SENT_TO_SBU_HEAD: ['With SBU Head', 'warn'],
  PENDING_SBU_APPROVAL: ['With SBU Head', 'warn'],
  SBU_HEAD_RETURN_DIVERSION: ['Returned by SBU Head', 'bad'],
  CM_APPROVE_DIVERSION: ['Approved (CM)', 'ok'],
  SBU_HEAD_APPROVE_DIVERSION: ['Approved (SBU Head)', 'ok'],
  BASKET_CREATED: ['Approved', 'ok'],
  COMPLETED: ['Completed', 'ok'],
  DRAFT: ['Draft', 'idle'],
};
const EDITABLE = ['PENDING_CM_APPROVAL', 'CM_RETURN_DIVERSION', 'SBU_HEAD_RETURN_DIVERSION', 'DRAFT'];
const RETURNED = ['CM_RETURN_DIVERSION', 'SBU_HEAD_RETURN_DIVERSION'];

const fmtQty = (v) => (v == null ? '-' : Number(v).toLocaleString('en-IN'));
const fmtDate = (d) => (d ? String(d).slice(0, 10).split('-').reverse().join('-') : '-');

const Toast = ({ toast }) => (toast ? <div className={`md-toast ${toast.type}`}>{toast.msg}</div> : null);

const fmtDateTime = (d) => {
  if (!d) return '-';
  const t = new Date(d);
  return isNaN(t.getTime()) ? String(d) : t.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const REASON_LABEL = { PO_QUANTITY_REVISION: 'PO quantity revision' };

/**
 * Request details (same layout as the ERC diversion screen): material, reason & railway permission, workflow.
 * Edit / Resubmit / Delete are offered here, by status.
 */
const RequestDetailsModal = ({ request, onClose, onEdit, onResubmit, onDelete, onLetter, busy }) => {
  const [full, setFull] = useState(request);
  const [history, setHistory] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [r, h] = await Promise.all([
          diversionService.getRequest(request.id).catch(() => request),
          diversionService.getHistory(request.id).catch(() => []),
        ]);
        if (alive) { setFull(r || request); setHistory(Array.isArray(h) ? h : []); }
      } finally {
        if (alive) setLoadingDetails(false);
      }
    })();
    return () => { alive = false; };
  }, [request]);

  const r = full || request;
  const [label, cls] = STATUS_LABEL[r.status] || [r.status, 'idle'];
  const items = Array.isArray(r.items) ? r.items : [];

  return (
    <div className="md-overlay" role="dialog" aria-modal="true">
      <div className="md-modal">
        <div className="md-modal-head">
          <div>
            <h3>Diversion Request {r.requestNo}</h3>
            <div className="md-sub">Diversion No. {r.diversionNo || '—'} · Raised {fmtDate(r.createdDate)} · <span className={`md-badge ${cls}`}>{label}</span></div>
          </div>
          <button type="button" className="md-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="md-modal-body">
          <section className="md-section">
            <h4>Material Details</h4>
            <div className="md-kv">
              <div><span>Stage</span><strong>{r.stage === 'PROCESS' ? 'Process' : 'Final'}</strong></div>
              <div><span>Diversion Type</span><strong>{r.diversionType === 'COMPLETE' ? 'Complete' : 'Partial'}</strong></div>
              <div><span>Source IC</span><strong>{r.sourceIcNo || '—'}</strong></div>
              <div><span>Source Call</span><strong>{r.sourceCallNo || '—'}</strong></div>
              <div><span>Source PO / Sr.</span><strong>{r.sourcePoNo} / {r.sourcePoSrNo}</strong></div>
              <div><span>Target PO / Sr.</span><strong>{r.targetPoNo} / {r.targetPoSrNo}</strong></div>
              <div><span>Total Diversion Qty</span><strong>{fmtQty(r.totalDiversionQty)} {r.unitOfMeasurement}</strong></div>
              <div><span>Diverted Call</span><strong>{r.divertedCallNo || '—'}</strong></div>
              <div><span>Source IC Date</span><strong>{fmtDate(r.sourceIcDate)}</strong></div>
              <div><span>Plant</span><strong>{r.plantId || '—'}</strong></div>
            </div>
            {items.length > 0 && (
              <div className="md-table-wrap">
                <table className="md-table">
                  <thead><tr><th>Lot / Batch</th><th className="num">Accepted</th><th className="num">Used</th><th className="num">Available</th><th className="num">Diverted</th><th className="num">Balance</th></tr></thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={it.id || i}>
                        <td className="md-strong">{it.lotNo || it.batchNo || '—'}</td>
                        <td className="num">{fmtQty(it.acceptedQty)}</td>
                        <td className="num">{fmtQty(it.downstreamConsumedQty)}</td>
                        <td className="num">{fmtQty(it.availableBalanceQty)}</td>
                        <td className="num md-strong">{fmtQty(it.diversionQty)}</td>
                        <td className="num">{fmtQty(it.remainingBalanceQty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="md-section">
            <h4>Reason &amp; Permission</h4>
            <div className="md-kv">
              <div><span>Reason</span><strong>{REASON_LABEL[r.reasonCode] || r.reasonCode || '—'}</strong></div>
              <div><span>Railway Permission No.</span><strong>{r.railwayPermissionNo || '—'}</strong></div>
              <div><span>Permission Date</span><strong>{fmtDate(r.railwayPermissionDate)}</strong></div>
              <div><span>Permission Letter</span><strong><button type="button" className="md-link" onClick={() => onLetter(r.id)}>View Letter</button></strong></div>
            </div>
            {r.reasonRemarks && <p className="md-note"><strong>Reason remarks:</strong> {r.reasonRemarks}</p>}
            {r.vendorRemarks && <p className="md-note"><strong>Vendor remarks:</strong> {r.vendorRemarks}</p>}
          </section>

          <section className="md-section">
            <h4>Workflow</h4>
            {loadingDetails ? (
              <p className="md-note">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="md-note">No actions yet.</p>
            ) : (
              <ol className="md-timeline">
                {history.map((h, i) => (
                  <li key={h.id || i}>
                    <div className="md-strong">{(h.action || '').replace(/_/g, ' ')} <span className="md-sub">by {h.actionUserName || h.actionUserId || h.actionRole || '—'} ({h.actionRole || '—'})</span></div>
                    <div className="md-sub">{fmtDateTime(h.createdDate)}{h.toStatus ? ` · ${(STATUS_LABEL[h.toStatus] || [h.toStatus])[0]}` : ''}</div>
                    {h.remarks && <div className="md-note">{h.remarks}</div>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
        <div className="md-modal-foot">
          {RETURNED.includes(r.status) && <button type="button" className="md-btn primary" disabled={busy} onClick={() => onResubmit(r)}>Resubmit to CM</button>}
          {EDITABLE.includes(r.status) && <button type="button" className="md-btn light" disabled={busy} onClick={() => onEdit(r)}>Edit Request</button>}
          {EDITABLE.includes(r.status) && <button type="button" className="md-btn danger" disabled={busy} onClick={() => onDelete(r)}>Delete Request</button>}
          <button type="button" className="md-btn light" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const MaterialDiversionPage = ({ plantId, vendorCode }) => {
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [basket, setBasket] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formFor, setFormFor] = useState(null); // null = closed, {} = new, request = edit
  const [detailFor, setDetailFor] = useState(null); // request shown in the details panel
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([diversionService.getVendorRequests(), diversionService.getVendorBasket()]);
      setRequests(r || []);
      setBasket(b || []);
    } catch (e) {
      showToast(diversionErrorMessage(e), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, fn, okMsg) => {
    setBusyId(id);
    try { await fn(); showToast(okMsg, 'success'); load(); } catch (e) { showToast(diversionErrorMessage(e), 'error'); } finally { setBusyId(null); }
  };

  const openLetter = async (id) => {
    try { window.open(await diversionService.openRailwayDoc(id), '_blank'); } catch (e) { showToast(diversionErrorMessage(e), 'error'); }
  };

  const counts = useMemo(() => ({
    pending: requests.filter((r) => ['PENDING_CM_APPROVAL', 'SENT_TO_SBU_HEAD', 'PENDING_SBU_APPROVAL'].includes(r.status)).length,
    returned: requests.filter((r) => RETURNED.includes(r.status)).length,
    approved: requests.filter((r) => ['CM_APPROVE_DIVERSION', 'SBU_HEAD_APPROVE_DIVERSION', 'BASKET_CREATED', 'COMPLETED'].includes(r.status)).length,
  }), [requests]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const statusOptions = useMemo(() => {
    const seen = Array.from(new Set(requests.map((r) => r.status)));
    return [{ value: 'ALL', label: 'All statuses' }, ...seen.map((s) => ({ value: s, label: (STATUS_LABEL[s] || [s])[0] }))];
  }, [requests]);
  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => (statusFilter === 'ALL' || r.status === statusFilter)
      && (!q || [r.requestNo, r.sourceIcNo, r.sourcePoNo, r.targetPoNo, r.railwayPermissionNo, r.divertedCallNo]
        .some((v) => String(v || '').toLowerCase().includes(q))));
  }, [requests, search, statusFilter]);

  const stats = [
    { label: 'Total Requests', value: requests.length, tone: 'blue' },
    { label: 'Under Review', value: counts.pending, tone: 'amber' },
    { label: 'Returned', value: counts.returned, tone: 'red' },
    { label: 'Approved / Basket', value: counts.approved, tone: 'green' },
  ];

  return (
    <div className="md-page">
      {/* Header */}
      <div className="md-hero">
        <div className="md-hero-text">
          <div className="md-hero-title">
            <span className="md-hero-icon" aria-hidden="true">⇄</span>
            <h2>Rail Pad Material Diversion &amp; PO Reallocation</h2>
          </div>
          <p>Transfer inspected &amp; accepted material from the original PO to a target PO without duplicate testing</p>
        </div>
        <button type="button" className="md-hero-btn" onClick={() => setFormFor({})}>
          <span aria-hidden="true">+</span> Raise Diversion Request
        </button>
      </div>

      {/* Stats */}
      <div className="md-stats">
        {stats.map((s) => (
          <div key={s.label} className={`md-stat ${s.tone}`}>
            <span className="md-stat-num">{loading ? '–' : s.value}</span>
            <span className="md-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="md-pilltabs" role="tablist">
        <button type="button" className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}>Diversion Requests ({requests.length})</button>
        <button type="button" className={tab === 'basket' ? 'active' : ''} onClick={() => setTab('basket')}>Material Basket ({basket.length})</button>
      </div>

      {tab === 'requests' && (
        <div className="md-card">
          <div className="md-toolbar">
            <div className="md-search">
              <span aria-hidden="true">🔍</span>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by request no., IC, PO, permission no..." />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="md-count">{filteredRequests.length} of {requests.length} records</span>
          </div>
          {loading ? (
            <div className="md-empty-state"><div className="md-empty-icon">⏳</div>Loading diversion requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="md-empty-state">
              <div className="md-empty-icon">📋</div>
              <strong>{requests.length === 0 ? 'No diversion requests raised yet' : 'No results match your search'}</strong>
              {requests.length === 0 && <div>Click <strong>+ Raise Diversion Request</strong> to create one.</div>}
            </div>
          ) : (
        <div className="md-table-wrap">
          <table className="md-table">
            <thead><tr><th>Request No.</th><th>Stage</th><th>Source IC</th><th>Source PO / Sr.</th><th>Target PO / Sr.</th><th className="num">Total Qty</th><th>Type</th><th>Status</th><th>Diverted Call</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredRequests.map((r) => {
                const [label, cls] = STATUS_LABEL[r.status] || [r.status, 'idle'];
                return (
                  <tr key={r.id}>
                    <td><span className="md-reqno">{r.requestNo}</span><div className="md-sub">{fmtDate(r.createdDate)}</div></td>
                    <td><span className="md-chip">{r.stage === 'PROCESS' ? 'PROCESS' : 'FINAL'}</span></td>
                    <td className="md-ic">{r.sourceIcNo}</td>
                    <td className="md-strong">{r.sourcePoNo} / {r.sourcePoSrNo}</td>
                    <td className="md-strong">{r.targetPoNo} / {r.targetPoSrNo}</td>
                    <td className="num md-strong">{fmtQty(r.totalDiversionQty)} <span className="md-unit">{r.unitOfMeasurement}</span></td>
                    <td>{r.diversionType === 'COMPLETE' ? 'Complete' : 'Partial'}</td>
                    <td><span className={`md-badge ${cls}`}>{label}</span></td>
                    <td className="md-ic">{r.divertedCallNo || '—'}</td>
                    <td className="md-actions">
                      {/* Same as ERC: one button; Edit / Resubmit / Delete / Letter are inside the details */}
                      <button type="button" className="md-link" onClick={() => setDetailFor(r)}>View Details</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
          )}
        </div>
      )}

      {tab === 'basket' && (
        <div className="md-card">
          <div className="md-card-head">
            <strong>Available Diverted Material Basket</strong>
            <span>Material approved by CM / SBU Head — ready for Diverted calls on the target PO · Quantities in Nos. (Sets for NCRGRSP)</span>
          </div>
          {loading ? (
            <div className="md-empty-state">Loading basket ledger...</div>
          ) : basket.length === 0 ? (
            <div className="md-empty-state"><div className="md-empty-icon">🧺</div><strong>No items in the diverted material basket currently.</strong></div>
          ) : (
        <div className="md-table-wrap">
          <table className="md-table">
            <thead><tr><th>Target PO / Sr.</th><th>Diverted Call / Source IC</th><th>Stage</th><th>Lot / Batch</th><th className="num">Approved</th><th className="num">In Calls</th><th className="num">Used in IC</th><th className="num">Available</th><th>Status</th></tr></thead>
            <tbody>
              {basket.map((b) => (
                <tr key={b.id}>
                  <td><span className="md-strong">{b.targetPoNo}</span><div className="md-sub">Sr. {b.targetPoSrNo || '—'}</div></td>
                  <td><span className="md-reqno">{b.divertedCallNo || '—'}</span><div className="md-sub">IC: {b.sourceIcNo || '—'}</div></td>
                  <td><span className="md-chip indigo">{b.stage === 'PROCESS' ? 'PROCESS' : 'FINAL'}</span></td>
                  <td className="md-strong">{b.lotNo || b.batchNo || '—'}</td>
                  <td className="num md-strong">{fmtQty(b.approvedDivertedQty)}</td>
                  <td className="num">{fmtQty(b.allocatedCallQty)}</td>
                  <td className="num">{fmtQty(b.consumedIcQty)}</td>
                  <td className="num md-strong">{fmtQty(b.availableBalanceQty)}</td>
                  <td><span className={`md-badge ${b.status === 'AVAILABLE' ? 'ok' : b.status === 'LOCKED' ? 'warn' : 'idle'}`}>{b.status === 'AVAILABLE' ? 'Available' : b.status === 'LOCKED' ? 'In calls' : 'Used up'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          )}
          <p className="md-note">A diverted Process IC can be used for Diverted Final calls on its target PO until its balance is used up. Withdrawn or cancelled calls give their quantity back.</p>
        </div>
      )}

      {formFor && (
        <RaiseRailpadDiversionModal
          initial={formFor.id ? formFor : null}
          plantId={plantId}
          vendorCode={vendorCode}
          showToast={showToast}
          onClose={() => setFormFor(null)}
          onSaved={() => { setFormFor(null); load(); }}
        />
      )}
      {detailFor && (
        <RequestDetailsModal
          request={detailFor}
          busy={busyId === detailFor.id}
          onClose={() => setDetailFor(null)}
          onLetter={openLetter}
          onEdit={(r) => { setDetailFor(null); setFormFor(r); }}
          onResubmit={(r) => { setDetailFor(null); act(r.id, () => diversionService.resubmit(r.id), 'Resubmitted to CM'); }}
          onDelete={(r) => { setDetailFor(null); setConfirmDelete(r); }}
        />
      )}
      {confirmDelete && (
        <div className="md-overlay" role="dialog" aria-modal="true">
          <div className="md-modal md-confirm">
            <div className="md-modal-head"><h3>Delete Diversion Request?</h3></div>
            <div className="md-modal-body"><p className="md-note">Request <strong>{confirmDelete.requestNo}</strong> will be deleted. This cannot be undone.</p></div>
            <div className="md-modal-foot">
              <button type="button" className="md-btn light" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button type="button" className="md-btn danger" onClick={() => { const r = confirmDelete; setConfirmDelete(null); act(r.id, () => diversionService.remove(r.id), 'Request deleted'); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  );
};

export default MaterialDiversionPage;
