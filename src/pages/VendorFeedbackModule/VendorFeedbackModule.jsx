import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Notification from '../../components/Notification';
import VendorActionModal from './VendorActionModal';
import { getBaseUrl } from '../../services/apiConfig';

const VendorFeedbackModule = ({ productType = 'ERC' }) => {
  const [activeSubTab, setActiveSubTab] = useState('open'); 
  const [openDiscrepancies, setOpenDiscrepancies] = useState([]);
  const [closedDiscrepancies, setClosedDiscrepancies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [notification, setNotification] = useState({ message: '', type: 'error' });
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'view', 'rectify'

  const userId = localStorage.getItem('userId');
  const userRoleId = localStorage.getItem('roleId') || 1;
  const vendorCode = localStorage.getItem('vendorCode') || localStorage.getItem('userName');

  const fetchDiscrepancies = async () => {
    setIsLoading(true);
    try {
      // Vendor usually has a different role ID (e.g. 1) but we use dynamic.
      const roleId = userRoleId;
      const baseUrl = getBaseUrl();
      
      const [pendingRes, completedRes] = await Promise.all([
        axios.get(`${baseUrl}/feedback-workflow/pending?roleId=${roleId}&productType=${productType}`),
        axios.get(`${baseUrl}/feedback-workflow/feedbacks/completed?productType=${productType}`)
      ]);

      if (pendingRes.data?.responseData) {
        // Vendors see discrepancies matching their vendor code
        const filteredOpen = pendingRes.data.responseData.filter(item => {
          return item.vendorCode === vendorCode || 
                 item.vendorCode === `:${vendorCode}` || 
                 item.assignedToUser === parseInt(userId, 10);
        });
        setOpenDiscrepancies(filteredOpen);
      }
      
      if (completedRes.data?.responseData) {
        const filteredClosed = completedRes.data.responseData.filter(item => {
          return item.vendorCode === vendorCode || 
                 item.vendorCode === `:${vendorCode}` || 
                 item.assignedToUser === parseInt(userId, 10);
        });
        setClosedDiscrepancies(filteredClosed.map(item => item.discrepancy));
      }
    } catch (error) {
      console.error("Error fetching discrepancies", error);
      showNotification("Failed to fetch discrepancies", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscrepancies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleAction = (discrepancy, type) => {
    setSelectedDiscrepancy(discrepancy);
    setActionType(type);
    setShowActionModal(true);
  };

  const calculateAge = (dateOfRaising) => {
    if (!dateOfRaising) return 'N/A';
    const start = new Date(dateOfRaising);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays} days`;
  };

  return (
    <div style={{ 
      marginTop: '20px', 
      background: '#ffffff', 
      borderRadius: '8px', 
      padding: '20px',
      border: '1px solid #e2e8f0'
    }}>
      <style>{`
        .feedback-module-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .feedback-module-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        .premium-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid #dee2e6;
        }
        .premium-tab {
          background: none;
          border: none;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #6c757d;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        .premium-tab:hover {
          color: #495057;
        }
        .premium-tab.active {
          color: #0d6efd;
          border-bottom-color: #0d6efd;
        }
        .premium-table-container {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
        }
        .premium-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .premium-table th {
          background-color: #f8f9fa;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 700;
          color: #495057;
          text-transform: uppercase;
          border-bottom: 1px solid #dee2e6;
        }
        .premium-table td {
          padding: 12px 16px;
          font-size: 13px;
          color: #212529;
          border-bottom: 1px solid #dee2e6;
          vertical-align: middle;
          background-color: #f8fbff; /* Match screenshot light blue tint */
        }
        .premium-table tbody tr:nth-child(even) td {
          background-color: #ffffff;
        }
        .premium-table tbody tr:hover td {
          background-color: #f1f5f9;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
          border: 1px solid transparent;
        }
        .status-warning {
          background-color: #fff3cd;
          color: #856404;
          border-color: #ffeeba;
        }
        .status-success {
          background-color: #d1e7dd;
          color: #0f5132;
          border-color: #badbcc;
        }
        .action-btn {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
          margin-right: 6px;
        }
        .btn-view {
          background-color: #0d6efd;
          color: white;
          border-color: #0d6efd;
        }
        .btn-view:hover {
          background-color: #0b5ed7;
        }
        .btn-primary-action {
          background-color: #198754;
          color: white;
          border-color: #198754;
        }
        .btn-primary-action:hover {
          background-color: #157347;
        }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        autoClose={true}
        autoCloseDelay={5000}
        onClose={() => setNotification({ message: '', type: 'error' })}
      />

      <div className="feedback-module-header">
        <h3 className="feedback-module-title">Process Inspection Discrepancies</h3>
      </div>

      <div className="premium-tabs">
        <button 
          className={`premium-tab ${activeSubTab === 'open' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('open')}
        >
          Open ({openDiscrepancies.length})
        </button>
        <button 
          className={`premium-tab ${activeSubTab === 'closed' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('closed')}
        >
          Closed ({closedDiscrepancies.length})
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block', border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', width: '24px', height: '24px', marginBottom: '8px' }}></div>
          <div>Loading discrepancies...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div className="premium-table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Discrepancy No</th>
                <th>Product</th>
                <th>PO Number</th>
                <th>Category</th>
                <th>Date Raised</th>
                <th>Age</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeSubTab === 'open' ? openDiscrepancies : closedDiscrepancies).map((item, idx) => {
                const d = item.feedbackMaster || item; 
                const dNo = item.feedbackId || d.discrepancyNo || 'N/A';
                const pType = item.productType || d.productType || 'N/A';
                const poNo = d.poNumber || 'N/A'; 
                const cat = d.category || 'N/A';
                const dateRaised = d.dateOfRaising || item.createdDate || 'N/A';
                const status = item.nextStatus || d.status || 'N/A';
                
                const badgeClass = status.includes('PENDING') ? 'status-warning' : 'status-success';

                return (
                  <tr key={idx}>
                    <td><span style={{ color: '#495057' }}>{dNo}</span></td>
                    <td>{pType}</td>
                    <td>{poNo}</td>
                    <td>{cat}</td>
                    <td>{dateRaised}</td>
                    <td><span style={{ color: '#495057' }}>{calculateAge(dateRaised)}</span></td>
                    <td><span className={`status-badge ${badgeClass}`}>{status.replace(/_/g, ' ')}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="action-btn btn-view" onClick={() => handleAction(item, 'view')}>View</button>
                      
                      {activeSubTab === 'open' && (
                        <>
                          {(status === 'PENDING_RECTIFICATION' || status === 'STILL_PENDING_RECTIFICATION' || status === 'RESEND_FOR_RECTIFICATION' || status === 'RESUBMIT_RECTIFICATION' || status === 'PENDING_IE_VERIFICATION') && (
                            <button className="action-btn btn-primary-action" onClick={() => handleAction(item, 'rectify')}>
                              Submit Rectification
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(activeSubTab === 'open' ? openDiscrepancies : closedDiscrepancies).length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                    No discrepancies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showActionModal && (
        <VendorActionModal 
          discrepancy={selectedDiscrepancy}
          actionType={actionType}
          onClose={() => setShowActionModal(false)}
          onSuccess={() => {
            setShowActionModal(false);
            fetchDiscrepancies();
            showNotification(`Discrepancy rectified successfully!`, "success");
          }}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

export default VendorFeedbackModule;
