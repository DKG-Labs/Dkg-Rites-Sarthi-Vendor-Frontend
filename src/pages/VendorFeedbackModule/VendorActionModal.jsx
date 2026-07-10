import React, { useState } from 'react';
import axios from 'axios';
import Modal from '../../components/Modal';
import { getBaseUrl } from '../../services/apiConfig';

const VendorActionModal = ({ discrepancy, actionType, onClose, onSuccess, showNotification }) => {
  const [rectificationData, setRectificationData] = useState({
    dateOfRectification: new Date().toISOString().split('T')[0],
    correctiveAction: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = localStorage.getItem('userId');

  const dNo = discrepancy?.feedbackId || discrepancy?.discrepancyNo;
  const wId = discrepancy?.feedbackWorkflowTransitionId || discrepancy?.workflowTransitionId || discrepancy?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rectificationData.correctiveAction) {
      showNotification('Corrective Action is mandatory.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        dateOfRectification: rectificationData.dateOfRectification,
        correctiveAction: rectificationData.correctiveAction
      };

      await axios.post(`${getBaseUrl()}/feedback-workflow/vendor-rectification/${dNo}?actionBy=${userId || 0}`, payload);
      
      // Also initiate the workflow transition logic
      const currentStatus = discrepancy?.nextStatus || discrepancy?.status || '';
      const workflowAction = (currentStatus === 'STILL_PENDING_RECTIFICATION' || currentStatus === 'RESEND_FOR_RECTIFICATION' || currentStatus === 'RESUBMIT_RECTIFICATION') 
        ? 'RESUBMIT_RECTIFICATION' 
        : 'SUBMIT_RECTIFICATION';

      const actionData = {
        workflowTransitionId: wId || 0,
        feedbackId: dNo,
        action: workflowAction,
        remarks: 'Rectification Submitted',
        actionBy: userId || 0
      };

      await axios.post(`${getBaseUrl()}/feedback-workflow/performTransitionAction`, actionData);
      
      onSuccess();
    } catch (error) {
      console.error('Error submitting rectification:', error);
      showNotification(error.response?.data?.message || 'Failed to submit rectification', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (actionType === 'view') {
    return (
      <Modal isOpen={true} onClose={onClose} title={`View Discrepancy: ${dNo}`}>
        <div style={{ padding: '15px' }}>
          <p style={{ marginBottom: '8px' }}><strong>PO Number:</strong> {discrepancy.poNumber || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Product Type:</strong> {discrepancy.productType || discrepancy.product_type}</p>
          <p style={{ marginBottom: '8px' }}><strong>Category:</strong> {discrepancy.category || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Sub Category:</strong> {discrepancy.subCategory || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Urgency:</strong> {discrepancy.urgency || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Description:</strong> {discrepancy.description || 'N/A'}</p>
          <p style={{ marginBottom: '8px' }}><strong>Status:</strong> {discrepancy.nextStatus || discrepancy.status}</p>
          <p style={{ marginBottom: '8px' }}><strong>Remarks History:</strong> {discrepancy.remarks || 'No remarks'}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Submit Rectification"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Action'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label className="form-label required">Date of Rectification</label>
          <input 
            type="date" 
            className="form-control" 
            value={rectificationData.dateOfRectification}
            onChange={(e) => setRectificationData({...rectificationData, dateOfRectification: e.target.value})}
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label required">Corrective Action</label>
          <textarea 
            className="form-control" 
            rows="3" 
            value={rectificationData.correctiveAction} 
            onChange={(e) => setRectificationData({...rectificationData, correctiveAction: e.target.value})}
            placeholder="Enter the corrective action taken..."
            required
          ></textarea>
        </div>
      </form>
    </Modal>
  );
};

export default VendorActionModal;
