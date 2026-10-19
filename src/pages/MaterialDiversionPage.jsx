// src/pages/MaterialDiversionPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import diversionService from '../services/diversionService';
import { getStoredUser } from '../services/authService';
import RaiseDiversionRequestModal from '../components/diversion/RaiseDiversionRequestModal';
import '../styles/materialDiversion.css';

const STATUS_CONFIG = {
  DRAFT:                    { label: 'Draft',            color: '#64748b', bg: '#f1f5f9' },
  SUBMIT_DIVERSION_REQUEST: { label: 'Under CM Review',  color: '#b45309', bg: '#fef9c3' },
  PENDING_CM_APPROVAL:      { label: 'Under CM Review',  color: '#b45309', bg: '#fef9c3' },
  CM_RETURN_DIVERSION:      { label: 'Returned',         color: '#dc2626', bg: '#fee2e2' },
  RETURNED_TO_VENDOR:       { label: 'Returned',         color: '#dc2626', bg: '#fee2e2' },
  PENDING_SBU_APPROVAL:     { label: 'Under SBU Review', color: '#7c3aed', bg: '#ede9fe' },
  SENT_TO_SBU_HEAD:         { label: 'Under SBU Review', color: '#7c3aed', bg: '#ede9fe' },
  CM_APPROVE_DIVERSION:     { label: 'Under SBU Review', color: '#7c3aed', bg: '#ede9fe' },
  SBU_HEAD_RETURN_DIVERSION:{ label: 'Returned by SBU',  color: '#dc2626', bg: '#fee2e2' },
  SBU_HEAD_APPROVE_DIVERSION:{ label: 'SBU Approved',   color: '#059669', bg: '#d1fae5' },
  BASKET_CREATED:           { label: 'Basket Created',   color: '#0369a1', bg: '#e0f2fe' },
  COMPLETED:                { label: 'Completed',        color: '#0369a1', bg: '#e0f2fe' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700', letterSpacing: '0.3px',
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}22`,
      whiteSpace: 'nowrap'
    }}>{cfg.label}</span>
  );
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{value || '—'}</span>
  </div>
);

export const MaterialDiversionPage = () => {
  const [activeTab, setActiveTab] = useState('REQUESTS');
  const [requests, setRequests] = useState([]);
  const [basketItems, setBasketItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
  }, []);

  const loadRequests = useCallback(async () => {
    if (!user?.vendorCode && !user?.userName) return;
    setLoading(true);
    try {
      const raw = user.vendorCode || user.userName || '';
      const vendorId = raw.replace(/^:+/, '');
      const res = await diversionService.getVendorRequests(vendorId);
      if (res && res.data) setRequests(res.data);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadBasket = useCallback(async () => {
    if (!user?.vendorCode && !user?.userName) return;
    setLoading(true);
    try {
      const raw = user.vendorCode || user.userName || '';
      const vendorId = raw.replace(/^:+/, '');
      const res = await diversionService.getAvailableBasketItems(vendorId, 'RAW_MATERIAL', '', '');
      if (res && res.data) setBasketItems(res.data);
    } catch (err) {
      console.error('Error fetching basket items:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'REQUESTS') loadRequests();
    else loadBasket();
  }, [activeTab, loadRequests, loadBasket]);

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (statusFilter !== 'ALL') {
      const cfg = STATUS_CONFIG[statusFilter];
      list = list.filter(r => {
        if (!cfg) return r.status === statusFilter;
        return STATUS_CONFIG[r.status]?.label === cfg.label;
      });
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(r =>
        (r.requestNo || '').toLowerCase().includes(term) ||
        (r.sourceIcNo || '').toLowerCase().includes(term) ||
        (r.sourcePoNo || '').toLowerCase().includes(term) ||
        (r.targetPoNo || '').toLowerCase().includes(term) ||
        (r.railwayPermissionNo || '').toLowerCase().includes(term)
      );
    }
    return list;
  }, [requests, search, statusFilter]);

  const statusOptions = useMemo(() => {
    const seen = new Set();
    const opts = [{ value: 'ALL', label: 'All Statuses' }];
    requests.forEach(r => {
      const cfg = STATUS_CONFIG[r.status];
      if (cfg && !seen.has(cfg.label)) {
        seen.add(cfg.label);
        opts.push({ value: r.status, label: cfg.label });
      }
    });
    return opts;
  }, [requests]);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
        borderRadius: '16px', padding: '28px 32px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(15,23,42,0.18)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⇄</div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#fff' }}>ERC Material Diversion & PO Reallocation</h2>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginLeft: '52px' }}>
            Transfer inspected & accepted material from original PO to target PO without duplicate testing
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '11px 22px', background: '#fff', color: '#1e40af',
            border: 'none', borderRadius: '10px', cursor: 'pointer',
            fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', whiteSpace: 'nowrap'
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Raise Diversion Request
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Requests', value: requests.length, color: '#0284c7', bg: '#e0f2fe' },
          { label: 'Under Review', value: requests.filter(r => ['PENDING_CM_APPROVAL','SUBMIT_DIVERSION_REQUEST','PENDING_SBU_APPROVAL','SENT_TO_SBU_HEAD','CM_APPROVE_DIVERSION'].includes(r.status)).length, color: '#b45309', bg: '#fef9c3' },
          { label: 'Returned', value: requests.filter(r => ['CM_RETURN_DIVERSION','RETURNED_TO_VENDOR','SBU_HEAD_RETURN_DIVERSION'].includes(r.status)).length, color: '#dc2626', bg: '#fee2e2' },
          { label: 'Approved / Basket', value: requests.filter(r => ['SBU_HEAD_APPROVE_DIVERSION','BASKET_CREATED','COMPLETED'].includes(r.status)).length, color: '#059669', bg: '#d1fae5' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: '#fff', borderRadius: '12px', padding: '16px 20px',
            border: `1px solid ${s.bg}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', gap: '14px'
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#f1f5f9', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'REQUESTS', label: `Diversion Requests (${requests.length})` },
          { key: 'BASKET', label: `Material Basket (${basketItems.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600',
            background: activeTab === t.key ? '#fff' : 'transparent',
            color: activeTab === t.key ? '#1e40af' : '#64748b',
            boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Requests Tab */}
      {activeTab === 'REQUESTS' && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

          {/* Search & Filter bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}>🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by request no., IC, PO, permission no..."
                style={{
                  width: '100%', padding: '9px 12px 9px 34px', border: '1px solid #e2e8f0',
                  borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                  background: '#f8fafc', color: '#1e293b'
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#f8fafc', color: '#1e293b', cursor: 'pointer', outline: 'none' }}
            >
              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              {filteredRequests.length} of {requests.length} records
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>Loading diversion requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                {requests.length === 0 ? 'No diversion requests raised yet' : 'No results match your search'}
              </div>
              {requests.length === 0 && <div style={{ fontSize: '13px' }}>Click <strong>+ Raise Diversion Request</strong> to create one.</div>}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Request No.', 'Stage', 'Source IC / Call', 'Source PO / Sr.', 'Target PO / Sr.', 'Total Qty', 'Rly. Permission No.', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req, idx) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbfc'}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e40af', whiteSpace: 'nowrap' }}>{req.requestNo}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{req.stage}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#0284c7', fontWeight: '600', whiteSpace: 'nowrap' }}>{req.sourceIcNo || req.sourceCallNo || '—'}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: '600' }}>{req.sourcePoNo}/{req.sourcePoSrNo}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: '600' }}>{req.targetPoNo}/{req.targetPoSrNo}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>{req.totalDiversionQty} <span style={{ fontSize: '11px', color: '#64748b' }}>{req.unitOfMeasurement}</span></td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{req.railwayPermissionNo || '—'}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={req.status} /></td>
                      <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{req.createdDate ? new Date(req.createdDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedRequest(req)}
                            style={{ padding: '5px 12px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}
                          >Details</button>
                          {req.railwayPermissionDocUrl && (
                            <a href={req.railwayPermissionDocUrl} target="_blank" rel="noopener noreferrer"
                              style={{ padding: '5px 12px', background: '#059669', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}
                            >📄 Doc</a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Basket Tab */}
      {activeTab === 'BASKET' && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>Available Diverted Material Basket</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Material cleared by SBU Head — ready for new target PO inspection calls</div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading basket ledger...</div>
          ) : basketItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🧺</div>
              <div style={{ fontWeight: '600' }}>No items in the diverted material basket currently.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Target PO / Sr.', 'Stage', 'Heat No.', 'TC / Lot No.', 'Source IC', 'Approved Qty', 'Locked in Calls', 'Available Balance'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {basketItems.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '12px 14px', fontWeight: '700' }}>{item.targetPoNo} / {item.targetPoSrNo}</td>
                      <td style={{ padding: '12px 14px' }}><span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{item.stage}</span></td>
                      <td style={{ padding: '12px 14px', fontWeight: '600' }}>{item.heatNo || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>{item.tcNo || item.lotNo || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#0284c7' }}>{item.sourceIcNo}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '600' }}>{item.approvedDivertedQty}</td>
                      <td style={{ padding: '12px 14px', color: '#b45309', fontWeight: '600' }}>{item.allocatedCallQty}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#059669' }}>{item.availableBalanceQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '720px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Diversion Request</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{selectedRequest.requestNo}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <StatusBadge status={selectedRequest.status} />
                <button onClick={() => setSelectedRequest(null)} style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', fontSize: '16px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            <div style={{ padding: '20px 28px' }}>
              {/* Section: Material Details */}
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Material Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <InfoRow label="Stage" value={selectedRequest.stage} />
                <InfoRow label="Diversion Type" value={selectedRequest.diversionType} />
                <InfoRow label="Total Diversion Qty" value={`${selectedRequest.totalDiversionQty || '—'} ${selectedRequest.unitOfMeasurement || ''}`} />
                <InfoRow label="Source IC No." value={selectedRequest.sourceIcNo || selectedRequest.sourceCallNo} />
                <InfoRow label="Source PO / Sr." value={`${selectedRequest.sourcePoNo || '—'}/${selectedRequest.sourcePoSrNo || '—'}`} />
                <InfoRow label="Target PO / Sr." value={`${selectedRequest.targetPoNo || '—'}/${selectedRequest.targetPoSrNo || '—'}`} />
              </div>

              {/* Section: Reason & Permission */}
              <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 16px' }} />
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Reason & Permission</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <InfoRow label="Reason Code" value={selectedRequest.reasonCode} />
                <InfoRow label="Railway Permission No." value={selectedRequest.railwayPermissionNo} />
                <InfoRow label="Railway Permission Date" value={selectedRequest.railwayPermissionDate ? new Date(selectedRequest.railwayPermissionDate).toLocaleDateString('en-IN') : null} />
                <div style={{ gridColumn: '1 / -1' }}><InfoRow label="Reason Remarks" value={selectedRequest.reasonRemarks} /></div>
                <div style={{ gridColumn: '1 / -1' }}><InfoRow label="Vendor Remarks" value={selectedRequest.vendorRemarks} /></div>
              </div>

              {/* Section: Workflow */}
              <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 16px' }} />
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Workflow</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <InfoRow label="CM / Controlling Manager" value={selectedRequest.cmUserName || selectedRequest.cmUserId} />
                <InfoRow label="Created Date" value={selectedRequest.createdDate ? new Date(selectedRequest.createdDate).toLocaleDateString('en-IN') : null} />
              </div>

              {/* View Doc button */}
              {selectedRequest.railwayPermissionDocUrl && (
                <a href={selectedRequest.railwayPermissionDocUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#059669', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', marginBottom: '20px' }}
                >📄 View Railway Permission Document</a>
              )}

              {/* Items table */}
              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <>
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 16px' }} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                    Diversion Items ({selectedRequest.items.length})
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#', 'Heat No.', 'TC / Lot No.', 'Diversion Qty'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: '600' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 12px', fontWeight: '600' }}>{item.heatNo || '—'}</td>
                          <td style={{ padding: '8px 12px' }}>{item.tcNo || item.lotNo || '—'}</td>
                          <td style={{ padding: '8px 12px', fontWeight: '700', color: '#0284c7' }}>{item.diversionQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <RaiseDiversionRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { loadRequests(); }}
        vendorUser={user}
      />
    </div>
  );
};

export default MaterialDiversionPage;
