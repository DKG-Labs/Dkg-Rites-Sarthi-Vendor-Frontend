import React from 'react';
import Modal from './Modal';
import './DeleteConfirmationModal.css';

/**
 * DeleteConfirmationModal Component
 * 
 * Displays a confirmation dialog before deleting an inventory entry
 * 
 * @param {Boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal
 * @param {Function} onConfirm - Callback when delete is confirmed
 * @param {Object} entry - The inventory entry to delete
 * @param {Boolean} isDeleting - Whether deletion is in progress
 */
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, entry, isDeleting }) => {
  const modalFooter = (
    <div className="delete-modal-footer">
      <button 
        className="btn btn-outline" 
        onClick={onClose}
        disabled={isDeleting}
      >
        Cancel
      </button>
      <button 
        className="btn btn-danger" 
        onClick={onConfirm}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <>
            <span className="spinner-small"></span>
            Deleting...
          </>
        ) : (
          <>🗑️ Delete</>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete"
      footer={modalFooter}
    >
      <div className="delete-confirmation-content">
        <div className="warning-icon">⚠️</div>
        <h4 className="warning-title">Are you sure you want to delete this inventory entry?</h4>
        
        {entry && (
          <div className="entry-summary">
            <div className="summary-row">
              <span className="summary-label">Heat Number:</span>
              <span className="summary-value">{entry.heatNumber}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">TC Number:</span>
              <span className="summary-value">{entry.tcNumber}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Raw Material:</span>
              <span className="summary-value">{entry.rawMaterial}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Supplier:</span>
              <span className="summary-value">{entry.supplierName}</span>
            </div>
          </div>
        )}

        <div className="warning-message">
          <p>⚠️ This action cannot be undone. The inventory entry will be permanently deleted from the system.</p>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;

