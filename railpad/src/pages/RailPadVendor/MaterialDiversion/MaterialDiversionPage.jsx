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

const MaterialDiversionPage = ({ plantId, vendorCode }) => {
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [basket, setBasket] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formFor, setFormFor] = useState(null); // null = closed, {} = new, request = edit
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
                      <button type="button" className="md-link" onClick={() => openLetter(r.id)}>Letter</button>
                      {EDITABLE.includes(r.status) && <button type="button" className="md-link" disabled={busyId === r.id} onClick={() => setFormFor(r)}>Edit</button>}
                      {RETURNED.includes(r.status) && <button type="button" className="md-link" disabled={busyId === r.id} onClick={() => act(r.id, () => diversionService.resubmit(r.id), 'Resubmitted to CM')}>Resubmit</button>}
                      {EDITABLE.includes(r.status) && <button type="button" className="md-link danger" disabled={busyId === r.id} onClick={() => act(r.id, () => diversionService.remove(r.id), 'Request deleted')}>Delete</button>}
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
      <Toast toast={toast} />
    </div>
  );
};

export default MaterialDiversionPage;
