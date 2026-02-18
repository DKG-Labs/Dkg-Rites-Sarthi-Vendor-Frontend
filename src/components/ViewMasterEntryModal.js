// src/components/ViewMasterEntryModal.js
// Modal for viewing master entry details in read-only format

import React from 'react';

export const ViewMasterEntryModal = ({ isOpen, entry, onClose }) => {
  if (!isOpen || !entry) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Master Entry Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="view-details-grid">
            {/* Company Information */}
            <div className="detail-section">
              <h3 className="detail-section-title">Company Information</h3>
              <div className="detail-row">
                <span className="detail-label">Company Name:</span>
                <span className="detail-value">{entry.company_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">CIN:</span>
                <span className="detail-value">{entry.cin}</span>
              </div>
            </div>

            {/* Unit Information */}
            <div className="detail-section">
              <h3 className="detail-section-title">Unit Information</h3>
              <div className="detail-row">
                <span className="detail-label">Unit Name:</span>
                <span className="detail-value">{entry.unit_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Pincode:</span>
                <span className="detail-value">{entry.pincode}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">City:</span>
                <span className="detail-value">{entry.city}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">District:</span>
                <span className="detail-value">{entry.district}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">State:</span>
                <span className="detail-value">{entry.state}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{entry.address}</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="detail-section">
              <h3 className="detail-section-title">Contact Information</h3>
              <div className="detail-row">
                <span className="detail-label">Contact Person:</span>
                <span className="detail-value">{entry.contact_person}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{entry.contact_phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{entry.contact_email || 'N/A'}</span>
              </div>
            </div>

            {/* Role Information */}
            <div className="detail-section">
              <h3 className="detail-section-title">Role Information</h3>
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">{entry.role}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Master Role:</span>
                <span className="detail-value">{entry.master_role || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Product:</span>
                <span className="detail-value">{entry.product || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Sub Product:</span>
                <span className="detail-value">{entry.sub_product || 'N/A'}</span>
              </div>
            </div>

            {/* Status */}
            <div className="detail-section">
              <h3 className="detail-section-title">Status</h3>
              <div className="detail-row">
                <span className="detail-label">Active:</span>
                <span className="detail-value">{entry.is_active ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ViewMasterEntryModal;

