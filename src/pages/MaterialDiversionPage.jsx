// src/pages/MaterialDiversionPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import diversionService from '../services/diversionService';
import httpClient from '../services/httpClient';
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
  CM_APPROVE_DIVERSION:     { label: 'CM Approved',      color: '#059669', bg: '#d1fae5' },
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

// eslint-disable-next-line no-unused-vars
const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{value || '—'}</span>
  </div>
);

const EDITABLE_STATUSES = ['PENDING_CM_APPROVAL', 'CM_RETURN_DIVERSION', 'SBU_HEAD_RETURN_DIVERSION'];

export const MaterialDiversionPage = () => {
  const [activeTab, setActiveTab] = useState('REQUESTS');
  const [requests, setRequests] = useState([]);
  const [basketItems, setBasketItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRequest, setEditRequest] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // request to confirm delete
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
  }, []);

  const handleViewIcCertificate = async (token) => {
    if (!token) {
      alert('Source IC Number is not available.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await httpClient.get(`/api/certificate-storage/view?icNumber=${encodeURIComponent(token)}`);
      const certData = res?.data || res;
      if (certData && certData.signedData) {
        const cleanBase64 = String(certData.signedData).replace(/^data:application\/pdf;base64,/, '').trim();
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new Blob([byteArray], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, '_blank');
        return;
      }
      const targetUrl = certData?.url;
      if (targetUrl) {
        window.open(targetUrl, '_blank');
      } else {
        alert('Certificate document is not available in storage.');
      }
    } catch (e) {
      console.error('Error fetching IC Certificate:', e);
      alert('Could not retrieve certificate document from storage.');
    } finally {
      setActionLoading(false);
    }
  };

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

  const handleDelete = async (req) => {
    setActionLoading(true);
    try {
      await diversionService.deleteRequest(req.id);
      setDeleteConfirm(null);
      loadRequests();
    } catch (err) {
      alert('Failed to delete: ' + (err?.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

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
          onClick={() => { setEditRequest(null); setIsModalOpen(true); }}
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
          { label: 'Under Review', value: requests.filter(r => ['PENDING_CM_APPROVAL','SUBMIT_DIVERSION_REQUEST','PENDING_SBU_APPROVAL','SENT_TO_SBU_HEAD'].includes(r.status)).length, color: '#b45309', bg: '#fef9c3' },
          { label: 'Returned', value: requests.filter(r => ['CM_RETURN_DIVERSION','RETURNED_TO_VENDOR','SBU_HEAD_RETURN_DIVERSION'].includes(r.status)).length, color: '#dc2626', bg: '#fee2e2' },
          { label: 'Approved / Basket', value: requests.filter(r => ['CM_APPROVE_DIVERSION','SBU_HEAD_APPROVE_DIVERSION','BASKET_CREATED','COMPLETED'].includes(r.status)).length, color: '#059669', bg: '#d1fae5' },
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
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: '600' }}>{req.sourcePoSrNo || req.sourcePoNo || '—'}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: '600' }}>{req.targetPoSrNo || req.targetPoNo || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>{req.totalDiversionQty} <span style={{ fontSize: '11px', color: '#64748b' }}>{req.unitOfMeasurement}</span></td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{req.railwayPermissionNo || '—'}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={req.status} /></td>
                      <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{req.createdDate ? new Date(req.createdDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          onClick={() => setSelectedRequest(req)}
                          style={{ padding: '6px 16px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}
                        >View Details</button>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '760px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>

            {/* Gradient Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)', borderRadius: '20px 20px 0 0', padding: '24px 28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>Diversion Request</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>{selectedRequest.requestNo}</div>
                <div style={{ marginTop: '10px' }}><StatusBadge status={selectedRequest.status} /></div>
              </div>
              <button onClick={() => setSelectedRequest(null)} style={{ width: '34px', height: '34px', border: 'none', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>

            {/* Scrollable Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '24px 28px' }}>

              {/* Section: Material Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '4px', height: '16px', background: '#1e40af', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '1px' }}>Material Details</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Stage', value: selectedRequest.stage },
                  { label: 'Diversion Type', value: selectedRequest.diversionType },
                  { label: 'Total Diversion Qty', value: `${selectedRequest.totalDiversionQty || '—'} ${selectedRequest.unitOfMeasurement || ''}` },
                  { label: 'Source IC No.', value: selectedRequest.sourceIcNo || selectedRequest.sourceCallNo },
                  { label: 'Source PO / Sr.', value: selectedRequest.sourcePoSrNo || selectedRequest.sourcePoNo || '—' },
                  { label: 'Target PO / Sr.', value: selectedRequest.targetPoSrNo || selectedRequest.targetPoNo || '—' },
                ].map(f => (
                  <div key={f.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{f.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Certificate Generated By & View IC Certificate */}
              {(selectedRequest.sourceIeName || selectedRequest.sourceIcNo || selectedRequest.sourceCallNo) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', padding: '10px 16px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', borderRadius: '10px', border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(59,130,246,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    {selectedRequest.sourceIeName ? (
                      <div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Certificate Generated By</div>
                        <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: 700, marginTop: '1px' }}>{selectedRequest.sourceIeName}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 500 }}>Source IC: {selectedRequest.sourceIcNo || selectedRequest.sourceCallNo}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewIcCertificate(selectedRequest.sourceCallNo || selectedRequest.sourceIcNo)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fff', background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', border: 'none', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(2,132,199,0.3)', flexShrink: 0 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    View IC Certificate
                  </button>
                </div>
              )}

              {/* Section: Reason & Permission */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '4px', height: '16px', background: '#7c3aed', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '1px' }}>Reason & Permission</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Reason Code', value: selectedRequest.reasonCode },
                  { label: 'Railway Permission No.', value: selectedRequest.railwayPermissionNo },
                  { label: 'Railway Permission Date', value: selectedRequest.railwayPermissionDate ? new Date(selectedRequest.railwayPermissionDate).toLocaleDateString('en-IN') : null },
                ].map(f => (
                  <div key={f.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{f.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{f.value || '—'}</div>
                  </div>
                ))}
                {selectedRequest.reasonRemarks && (
                  <div style={{ gridColumn: '1 / -1', background: '#fefce8', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Reason Remarks</div>
                    <div style={{ fontSize: '13px', color: '#78350f' }}>{selectedRequest.reasonRemarks}</div>
                  </div>
                )}
                {selectedRequest.vendorRemarks && (
                  <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', borderRadius: '10px', padding: '12px 14px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Vendor Remarks</div>
                    <div style={{ fontSize: '13px', color: '#14532d' }}>{selectedRequest.vendorRemarks}</div>
                  </div>
                )}
              </div>

              {/* Section: Workflow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '4px', height: '16px', background: '#059669', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '1px' }}>Workflow</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'CM / Controlling Manager', value: selectedRequest.cmUserName ? `${selectedRequest.cmUserName}${selectedRequest.cmEmployeeCode ? ` (${selectedRequest.cmEmployeeCode})` : ''}` : selectedRequest.cmUserId },
                  { label: 'Created Date', value: selectedRequest.createdDate ? new Date(selectedRequest.createdDate).toLocaleDateString('en-IN') : null },
                ].map(f => (
                  <div key={f.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{f.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Items table */}
              {selectedRequest.items && selectedRequest.items.length > 0 && (<>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ width: '4px', height: '16px', background: '#0284c7', borderRadius: '2px' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px' }}>Diversion Items ({selectedRequest.items.length})</span>
                </div>
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        {['#', 'Heat No.', 'TC / Lot No.', 'Diversion Qty'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                          <td style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: '600' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 14px', fontWeight: '600', color: '#0f172a' }}>{item.heatNo || '—'}</td>
                          <td style={{ padding: '10px 14px', color: '#475569' }}>{item.tcNo || item.lotNo || '—'}</td>
                          <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0284c7' }}>{item.diversionQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>)}
            </div>

            {/* Sticky Footer with Actions */}
            <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 28px', display: 'flex', gap: '10px', flexWrap: 'wrap', background: '#fff', borderRadius: '0 0 20px 20px' }}>
              {selectedRequest.railwayPermissionNo && (
                <button
                  disabled={actionLoading}
                  onClick={async () => {
                    try {
                      setActionLoading(true);
                      const docData = await diversionService.getDocUrl(selectedRequest.id);
                      if (docData && docData.signedData) {
                        const cleanBase64 = String(docData.signedData).replace(/^data:application\/pdf;base64,/, '').trim();
                        const byteCharacters = atob(cleanBase64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                        const byteArray = new Uint8Array(byteNumbers);
                        const file = new Blob([byteArray], { type: 'application/pdf' });
                        const fileURL = URL.createObjectURL(file);
                        window.open(fileURL, '_blank');
                        return;
                      }
                      const url = docData?.viewUrl || docData?.railwayPermissionDocUrl || selectedRequest.railwayPermissionDocUrl;
                      if (url) {
                        const { getBaseUrl } = await import('../services/apiConfig');
                        const fullUrl = url.startsWith('http') ? url : `${getBaseUrl().replace(/\/api$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
                        window.open(fullUrl, '_blank');
                      } else {
                        alert('Document not available.');
                      }
                    } catch (e) {
                      console.error('Error opening document:', e);
                      alert('Unable to open document.');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '7px', opacity: actionLoading ? 0.5 : 1 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  View Document
                </button>
              )}
              {EDITABLE_STATUSES.includes(selectedRequest.status) && (<>
                <button
                  disabled={actionLoading}
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      const res = await diversionService.getRequestById(selectedRequest.id);
                      const full = res?.data || res?.responseData || res || selectedRequest;
                      setEditRequest(full);
                    } catch {
                      setEditRequest(selectedRequest);
                    } finally {
                      setActionLoading(false);
                    }
                    setSelectedRequest(null);
                    setIsModalOpen(true);
                  }}
                  style={{ padding: '10px 20px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '10px', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '7px', opacity: actionLoading ? 0.7 : 1 }}
                >
                  {actionLoading ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  )}
                  {actionLoading ? 'Loading...' : 'Edit Request'}
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => { setDeleteConfirm(selectedRequest); setSelectedRequest(null); }}
                  style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '7px', opacity: actionLoading ? 0.5 : 1 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  Delete Request
                </button>
              </>)}
              <button disabled={actionLoading} onClick={() => setSelectedRequest(null)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', marginLeft: 'auto', opacity: actionLoading ? 0.5 : 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <RaiseDiversionRequestModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditRequest(null); }}
        onSuccess={() => { loadRequests(); setEditRequest(null); }}
        vendorUser={user}
        isEditMode={!!editRequest}
        initialData={editRequest}
      />

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '32px 28px', width: '420px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Delete Diversion Request?</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
              This will permanently delete <strong>{deleteConfirm.requestNo}</strong>. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={actionLoading}
                style={{ padding: '9px 22px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading}
                style={{ padding: '9px 22px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >{actionLoading ? 'Deleting...' : 'Yes, Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialDiversionPage;
