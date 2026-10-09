// src/pages/MaterialDiversionPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import diversionService from '../services/diversionService';
import { getStoredUser } from '../services/authService';
import RaiseDiversionRequestModal from '../components/diversion/RaiseDiversionRequestModal';
import '../styles/materialDiversion.css';

export const MaterialDiversionPage = () => {
  const [activeTab, setActiveTab] = useState('REQUESTS'); // REQUESTS, BASKET
  const [requests, setRequests] = useState([]);
  const [basketItems, setBasketItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
  }, []);

  const loadRequests = useCallback(async () => {
    if (!user?.userName) return;
    setLoading(true);
    try {
      const res = await diversionService.getVendorRequests(user.userName);
      if (res && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadBasket = useCallback(async () => {
    if (!user?.userName) return;
    setLoading(true);
    try {
      const res = await diversionService.getAvailableBasketItems(user.userName, 'RAW_MATERIAL', '', '');
      if (res && res.data) {
        setBasketItems(res.data);
      }
    } catch (err) {
      console.error('Error fetching basket items:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'REQUESTS') {
      loadRequests();
    } else {
      loadBasket();
    }
  }, [activeTab, loadRequests, loadBasket]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <span className="badge badge-draft">Draft</span>;
      case 'SUBMITTED_TO_CM': return <span className="badge badge-cm-pending">Under CM Review</span>;
      case 'RETURNED_BY_CM': return <span className="badge badge-cm-returned">Returned by CM</span>;
      case 'APPROVED_BY_CM': return <span className="badge badge-sbu-pending">Under SBU Review</span>;
      case 'RETURNED_BY_SBU': return <span className="badge badge-sbu-returned">Returned by SBU</span>;
      case 'APPROVED_BY_SBU': return <span className="badge badge-approved">SBU Approved</span>;
      case 'BASKET_CREATED': return <span className="badge badge-basket">Basket Created</span>;
      default: return <span className="badge badge-draft">{status}</span>;
    }
  };

  return (
    <div className="diversion-container">
      {/* Header Banner */}
      <div className="diversion-header-card">
        <div>
          <h2 className="diversion-title">ERC Material Diversion & PO Reallocation</h2>
          <p className="diversion-subtitle">
            Transfer inspected & accepted material from original PO to target PO without duplicate testing
          </p>
        </div>
        <button className="diversion-btn-primary" onClick={() => setIsModalOpen(true)}>
          <span>+</span> Raise Diversion Request
        </button>
      </div>

      {/* Tabs */}
      <div className="diversion-tabs">
        <button
          className={`diversion-tab-btn ${activeTab === 'REQUESTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('REQUESTS')}
        >
          Diversion Requests Register ({requests.length})
        </button>
        <button
          className={`diversion-tab-btn ${activeTab === 'BASKET' ? 'active' : ''}`}
          onClick={() => setActiveTab('BASKET')}
        >
          Diverted & Passed Material Basket ({basketItems.length})
        </button>
      </div>

      {/* Tab 1: Requests Register */}
      {activeTab === 'REQUESTS' && (
        <div className="diversion-card">
          <div className="diversion-card-title">All Diversion Requests</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading diversion requests...</div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No diversion requests raised yet. Click <strong>+ Raise Diversion Request</strong> to create one.
            </div>
          ) : (
            <div className="diversion-table-wrapper">
              <table className="diversion-table">
                <thead>
                  <tr>
                    <th>Request No.</th>
                    <th>Stage</th>
                    <th>Source IC / Call</th>
                    <th>Source PO / Sr.</th>
                    <th>Target PO / Sr.</th>
                    <th>Total Qty</th>
                    <th>Status</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: '700', color: '#0284c7' }}>{req.requestNo}</td>
                      <td>{req.stage}</td>
                      <td>{req.sourceIcNo}</td>
                      <td>{req.sourcePoNo} / {req.sourcePoSrNo}</td>
                      <td>{req.targetPoNo} / {req.targetPoSrNo}</td>
                      <td style={{ fontWeight: '600' }}>{req.totalDiversionQty} {req.unitOfMeasurement}</td>
                      <td>{getStatusBadge(req.status)}</td>
                      <td>{req.createdDate ? new Date(req.createdDate).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Diverted Basket */}
      {activeTab === 'BASKET' && (
        <div className="diversion-card">
          <div className="diversion-card-title">Available Diverted Material Basket</div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-8px', marginBottom: '16px' }}>
            Material listed below has been cleared by SBU Head and is ready to be offered in new target PO inspection calls.
          </p>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading basket ledger...</div>
          ) : basketItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No items in the diverted material basket currently.
            </div>
          ) : (
            <div className="diversion-table-wrapper">
              <table className="diversion-table">
                <thead>
                  <tr>
                    <th>Target PO / Sr.</th>
                    <th>Stage</th>
                    <th>Heat No.</th>
                    <th>TC / Lot No.</th>
                    <th>Source IC</th>
                    <th>Approved Qty</th>
                    <th>Locked in Calls</th>
                    <th>Available Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {basketItems.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '700', color: '#0f172a' }}>{item.targetPoNo} / {item.targetPoSrNo}</td>
                      <td>{item.stage}</td>
                      <td style={{ fontWeight: '600' }}>{item.heatNo || '-'}</td>
                      <td>{item.tcNo || item.lotNo || '-'}</td>
                      <td style={{ color: '#64748b' }}>{item.sourceIcNo}</td>
                      <td>{item.approvedDivertedQty}</td>
                      <td style={{ color: '#b45309' }}>{item.allocatedCallQty}</td>
                      <td style={{ fontWeight: '700', color: '#0284c7' }}>{item.availableBalanceQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <RaiseDiversionRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadRequests();
        }}
        vendorUser={user}
      />
    </div>
  );
};

export default MaterialDiversionPage;
