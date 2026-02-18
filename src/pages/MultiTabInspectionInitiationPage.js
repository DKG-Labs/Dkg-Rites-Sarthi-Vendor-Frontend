import React, { useState } from 'react';
import InspectionInitiationFormContent from '../components/InspectionInitiationFormContent';

// Responsive styles for mobile
const responsiveStyles = `
  @media (max-width: 768px) {
    .multi-inspection-header h1 {
      font-size: 18px !important;
    }
    .multi-inspection-action-buttons {
      flex-direction: column !important;
      gap: 12px !important;
    }
    .multi-inspection-action-buttons > button,
    .multi-inspection-action-buttons > div {
      width: 100% !important;
    }
    .multi-inspection-action-buttons > div {
      flex-direction: column !important;
      gap: 8px !important;
    }
    .multi-inspection-action-buttons button {
      width: 100% !important;
      min-height: 48px !important;
      font-size: 14px !important;
      padding: 12px 16px !important;
      white-space: normal !important;
      text-align: center !important;
    }
    .multi-inspection-tabs {
      gap: 4px !important;
    }
    .multi-inspection-tabs > div {
      padding: 10px 12px !important;
      font-size: 13px !important;
    }
  }
`;

const MultiTabInspectionInitiationPage = ({ calls, onProceed, onBack }) => {
  const [activeCallIndex, setActiveCallIndex] = useState(0);
  const [formDataByCall, setFormDataByCall] = useState(() => {
    // Initialize form data for each call
    const initialData = {};
    const today = new Date().toISOString().split('T')[0];
    calls.forEach(call => {
      initialData[call.id] = {
        shiftOfInspection: '',
        offeredQty: call.call_qty,
        cmApproval: false,
        dateOfInspection: today,
        multipleLinesActive: false,
        productionLines: [{ lineNumber: 1, icNumber: '', poNumber: '', rawMaterialIC: '', productType: '' }],
        sectionAVerified: false,
        sectionBVerified: false,
        sectionCVerified: false,
        sectionDVerified: false,
      };
    });
    return initialData;
  });

  const currentCall = calls[activeCallIndex];
  const currentFormData = formDataByCall[currentCall.id];

  const updateFormData = (callId, updates) => {
    setFormDataByCall(prev => ({
      ...prev,
      [callId]: { ...prev[callId], ...updates }
    }));
  };

  const handleTabChange = (index) => {
    setActiveCallIndex(index);
  };

  const handleProceedAll = () => {
    // Validate all forms before proceeding
    const allValid = calls.every(call => {
      const data = formDataByCall[call.id];
      const sectionsVerified = data.sectionAVerified && data.sectionBVerified && data.sectionCVerified &&
        (call.product_type.includes('Process') ? data.sectionDVerified : true);
      return data.shiftOfInspection && (data.offeredQty === call.call_qty || (data.offeredQty > call.call_qty && data.cmApproval)) && sectionsVerified;
    });

    if (allValid) {
      onProceed(calls[0].product_type);
    } else {
      alert('Please complete all required fields and verify all sections for all inspection calls before proceeding.');
    }
  };

  return (
    <div>
      {/* Inject responsive styles */}
      <style>{responsiveStyles}</style>

      <div className="breadcrumb">
        <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item breadcrumb-active">Inspection Initiation (Multiple Calls)</div>
      </div>

      <div className="multi-inspection-header" style={{ marginBottom: 'var(--space-24)' }}>
        <h1>Inspection Initiation - Multiple Calls</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-8)' }}>
          Fill out inspection details for {calls.length} inspection calls. Switch between tabs to enter data for each call.
        </p>
      </div>

      {/* Call Tabs */}
      <div className="multi-inspection-tabs" style={{
        display: 'flex',
        gap: 'var(--space-8)',
        marginBottom: 'var(--space-24)',
        borderBottom: '2px solid var(--color-border)',
        overflowX: 'auto',
        flexWrap: 'wrap',
        WebkitOverflowScrolling: 'touch'
      }}>
        {calls.map((call, index) => {
          const isValid = formDataByCall[call.id].shiftOfInspection &&
            (formDataByCall[call.id].offeredQty === call.call_qty ||
             (formDataByCall[call.id].offeredQty > call.call_qty && formDataByCall[call.id].cmApproval));

          return (
            <div
              key={call.id}
              onClick={() => handleTabChange(index)}
              style={{
                padding: 'var(--space-12) var(--space-16)',
                cursor: 'pointer',
                borderBottom: activeCallIndex === index ? '3px solid var(--color-primary)' : '3px solid transparent',
                fontWeight: activeCallIndex === index ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                color: activeCallIndex === index ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-8)',
                whiteSpace: 'nowrap',
                minHeight: '44px'
              }}
            >
              <span>{call.call_no}</span>
              {isValid && <span style={{ color: 'var(--color-success)' }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Render the form for the active call */}
      <InspectionInitiationFormContent
        call={currentCall}
        formData={currentFormData}
        onFormDataChange={(updates) => updateFormData(currentCall.id, updates)}
      />

      <div className="multi-inspection-action-buttons" style={{ marginTop: 'var(--space-24)', display: 'flex', gap: 'var(--space-16)', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ minHeight: '48px' }}>Back to Landing Page</button>
        <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
          {activeCallIndex > 0 && (
            <button className="btn btn-outline" onClick={() => setActiveCallIndex(activeCallIndex - 1)} style={{ minHeight: '48px' }}>
              ← Previous Call
            </button>
          )}
          {activeCallIndex < calls.length - 1 && (
            <button className="btn btn-outline" onClick={() => setActiveCallIndex(activeCallIndex + 1)} style={{ minHeight: '48px' }}>
              Next Call →
            </button>
          )}
          {/* Only show "Proceed with All Calls" button on the last tab */}
          {activeCallIndex === calls.length - 1 && (
            <button
              className="btn btn-primary"
              onClick={handleProceedAll}
              style={{ minHeight: '48px' }}
            >
              Proceed with All Calls
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiTabInspectionInitiationPage;
