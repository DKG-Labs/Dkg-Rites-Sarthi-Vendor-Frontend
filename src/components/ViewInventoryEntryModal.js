import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import inventoryService from '../services/inventoryService';
import './ViewInventoryEntryModal.css';

/**
 * ViewInventoryEntryModal Component
 * 
 * Displays all details of an inventory entry in read-only format
 * Shows conditional Edit/Delete buttons only for FRESH_PO status entries
 * 
 * @param {Boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal
 * @param {Number} entryId - ID of the inventory entry to view
 * @param {Function} onEdit - Callback when Edit button is clicked
 * @param {Function} onDelete - Callback when Delete button is clicked
 * @param {Function} onRefresh - Callback to refresh the inventory list after delete
 */
const ViewInventoryEntryModal = ({ isOpen, onClose, entryId, onEdit, onDelete, onRefresh }) => {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEntryDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await inventoryService.getInventoryEntryById(entryId);

      if (response.success) {
        setEntry(response.data);
      } else {
        setError(response.error || 'Failed to fetch entry details');
      }
    } catch (err) {
      setError('An error occurred while fetching entry details');
      console.error('Error fetching entry:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch entry details when modal opens
  useEffect(() => {
    if (isOpen && entryId) {
      fetchEntryDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entryId]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (value) => {
    if (!value) return '₹0.00';
    return `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleEdit = () => {
    if (onEdit && entry) {
      onEdit(entry);
    }
  };

  const handleDelete = () => {
    if (onDelete && entry) {
      onDelete(entry);
    }
  };

  // Check if entry can be modified (only FRESH_PO status)
  const canModify = entry && (entry.status === 'FRESH_PO' || entry.status === 'Fresh');

  const modalFooter = (
    <div className="view-modal-footer">
      {canModify && (
        <>
          <button className="btn btn-primary" onClick={handleEdit}>
            ✏️ Modify
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            🗑️ Delete
          </button>
        </>
      )}
      <button className="btn btn-outline" onClick={onClose}>
        Close
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inventory Entry Details"
      footer={modalFooter}
    >
      <div className="view-inventory-modal-content">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading entry details...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p className="error-message">❌ {error}</p>
            <button className="btn btn-sm btn-primary" onClick={fetchEntryDetails}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && entry && (
          <div className="entry-details">
            {/* Status Badge */}
            <div className="detail-section">
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <StatusBadge status={entry.status} />
              </div>
              {!canModify && (
                <div className="info-message">
                  ℹ️ This entry cannot be modified or deleted because it has status: {entry.status}
                </div>
              )}
            </div>

            {/* Vendor & Company Information */}
            <div className="detail-section">
              <h4 className="section-title">Vendor & Company Information</h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Vendor Code:</span>
                  <span className="detail-value">{entry.vendorCode || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Vendor Name:</span>
                  <span className="detail-value">{entry.vendorName || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Company:</span>
                  <span className="detail-value">{entry.companyName || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Unit:</span>
                  <span className="detail-value">{entry.unitName || '-'}</span>
                </div>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="detail-section">
              <h4 className="section-title">Supplier Information</h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Supplier Name:</span>
                  <span className="detail-value">{entry.supplierName || '-'}</span>
                </div>
                <div className="detail-row full-width">
                  <span className="detail-label">Supplier Address:</span>
                  <span className="detail-value">{entry.supplierAddress || '-'}</span>
                </div>
              </div>
            </div>

            {/* Material Information */}
            <div className="detail-section">
              <h4 className="section-title">Material Information</h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Raw Material:</span>
                  <span className="detail-value">{entry.rawMaterial || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Grade/Specification:</span>
                  <span className="detail-value">{entry.gradeSpecification || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Length of Bars:</span>
                  <span className="detail-value">{entry.lengthOfBars ? `${entry.lengthOfBars} mm` : '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Unit of Measurement:</span>
                  <span className="detail-value">{entry.unitOfMeasurement || '-'}</span>
                </div>
              </div>
            </div>

            {/* Heat/Batch Information */}
            <div className="detail-section">
              <h4 className="section-title">Heat/Batch Information</h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Heat Number:</span>
                  <span className="detail-value highlight">{entry.heatNumber || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">TC Number:</span>
                  <span className="detail-value highlight">{entry.tcNumber || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">TC Date:</span>
                  <span className="detail-value">{formatDate(entry.tcDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">TC Quantity:</span>
                  <span className="detail-value highlight">{entry.tcQuantity || entry.declaredQuantity} {entry.unitOfMeasurement}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Qty Offered for Inspection:</span>
                  <span className="detail-value" style={{ color: '#059669', fontWeight: 600 }}>
                    {entry.qtyOfferedForInspection || 0} {entry.unitOfMeasurement}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Qty Left for Inspection:</span>
                  <span className="detail-value" style={{ color: (entry.qtyLeftForInspection || 0) > 0 ? '#dc2626' : '#6b7280', fontWeight: 600 }}>
                    {entry.qtyLeftForInspection || entry.tcQuantity || entry.declaredQuantity} {entry.unitOfMeasurement}
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice Information */}
            <div className="detail-section">
              <h4 className="section-title">Invoice Information</h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Invoice Number:</span>
                  <span className="detail-value">{entry.invoiceNumber || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Invoice Date:</span>
                  <span className="detail-value">{formatDate(entry.invoiceDate)}</span>
                </div>
              </div>
            </div>

            {/* Sub PO Information */}
            <div className="detail-section">
              <h4 className="section-title">Sub PO Information</h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Sub PO Number:</span>
                  <span className="detail-value">{entry.subPoNumber || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Sub PO Date:</span>
                  <span className="detail-value">{formatDate(entry.subPoDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Sub PO Quantity:</span>
                  <span className="detail-value">{entry.subPoQty} {entry.unitOfMeasurement}</span>
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="detail-section">
              <h4 className="section-title">Pricing Information</h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Rate of Material:</span>
                  <span className="detail-value">{formatCurrency(entry.rateOfMaterial)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">GST Rate:</span>
                  <span className="detail-value">{entry.rateOfGst}%</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Base Value (PO):</span>
                  <span className="detail-value">{formatCurrency(entry.baseValuePo)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total PO Value:</span>
                  <span className="detail-value highlight">{formatCurrency(entry.totalPo)}</span>
                </div>
              </div>
            </div>

            {/* Audit Information */}
            <div className="detail-section">
              <h4 className="section-title">Audit Information</h4>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Created At:</span>
                  <span className="detail-value">{formatDate(entry.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Updated At:</span>
                  <span className="detail-value">{formatDate(entry.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ViewInventoryEntryModal;

