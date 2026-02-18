import React, { useState, useEffect } from 'react';
import InspectionInitiationFormContent from '../components/InspectionInitiationFormContent';

// Responsive styles for mobile
const responsiveStyles = `
  @media (max-width: 768px) {
    .inspection-page-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }
    .inspection-page-header h1 {
      font-size: 18px !important;
    }
    .inspection-action-buttons {
      flex-direction: column !important;
      gap: 12px !important;
    }
    .inspection-action-buttons button {
      width: 100% !important;
      min-height: 48px !important;
      font-size: 14px !important;
      padding: 12px 16px !important;
      white-space: normal !important;
      text-align: center !important;
    }
  }
`;

const InspectionInitiationPage = ({ call, onProceed, onBack }) => {
  const [shiftOfInspection, setShiftOfInspection] = useState('');
  const [offeredQty, setOfferedQty] = useState(call.call_qty);
  const [cmApproval, setCmApproval] = useState(false);
  const [dateOfInspection, setDateOfInspection] = useState(new Date().toISOString().split('T')[0]);
  const [multipleLinesActive, setMultipleLinesActive] = useState(false);
  const [productionLines, setProductionLines] = useState([{ lineNumber: 1, icNumber: '', poNumber: '', rawMaterialIC: '', productType: '' }]);
  const [sectionAVerified, setSectionAVerified] = useState(false);
  const [sectionBVerified, setSectionBVerified] = useState(false);
  const [sectionCVerified, setSectionCVerified] = useState(false);
  const [sectionDVerified, setSectionDVerified] = useState(false);
  const [showSectionA] = useState(true);
  const [showSectionB] = useState(true);
  const currentDateTime = new Date('2025-11-14T17:00:00').toLocaleString();

  // scroll to top when page mounts so navigation positions at the start
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (e) {
      // ignore when not running in a browser
    }
  }, []);

  // Check if all required sections are verified
  const allSectionsVerified = sectionAVerified && sectionBVerified && sectionCVerified &&
    (call.product_type.includes('Process') ? sectionDVerified : true);

  const canProceed = shiftOfInspection && (offeredQty === call.call_qty || (offeredQty > call.call_qty && cmApproval)) && allSectionsVerified;

  // production line helpers removed (currently unused)

  const formData = {
    shiftOfInspection,
    offeredQty,
    cmApproval,
    dateOfInspection,
    multipleLinesActive,
    productionLines,
    sectionAVerified,
    sectionBVerified,
    sectionCVerified,
    sectionDVerified,
  };

  const onFormDataChange = (updates) => {
    if (updates.shiftOfInspection !== undefined) setShiftOfInspection(updates.shiftOfInspection);
    if (updates.offeredQty !== undefined) setOfferedQty(updates.offeredQty);
    if (updates.cmApproval !== undefined) setCmApproval(updates.cmApproval);
    if (updates.dateOfInspection !== undefined) setDateOfInspection(updates.dateOfInspection);
    if (updates.multipleLinesActive !== undefined) setMultipleLinesActive(updates.multipleLinesActive);
    if (updates.productionLines !== undefined) setProductionLines(updates.productionLines);
    if (updates.sectionAVerified !== undefined) setSectionAVerified(updates.sectionAVerified);
    if (updates.sectionBVerified !== undefined) setSectionBVerified(updates.sectionBVerified);
    if (updates.sectionCVerified !== undefined) setSectionCVerified(updates.sectionCVerified);
    if (updates.sectionDVerified !== undefined) setSectionDVerified(updates.sectionDVerified);
  };

  return (
    <div>
        {/* Inject responsive styles */}
        <style>{responsiveStyles}</style>

        <div className="breadcrumb">
            <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
            <span className="breadcrumb-separator">/</span>
            <div className="breadcrumb-item breadcrumb-active">Inspection Initiation</div>
        </div>

        <div className="inspection-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)' }}>
            <h1>Inspection Initiation for {call.call_no}</h1>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {currentDateTime}
            </div>
        </div>

        {/* Section Toggle Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-12)', marginBottom: 'var(--space-24)' }}>
          {/* <button
            className={showSectionA ? 'btn btn-primary' : 'btn btn-outline'}
            onClick={() => setShowSectionA(!showSectionA)}
            style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-8) var(--space-16)' }}
          >
            {showSectionA ? '▼' : '▶'} Section A
          </button>
          <button
            className={showSectionB ? 'btn btn-primary' : 'btn btn-outline'}
            onClick={() => setShowSectionB(!showSectionB)}
            style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-8) var(--space-16)' }}
          >
            {showSectionB ? '▼' : '▶'} Section B
          </button> */}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
            <InspectionInitiationFormContent
              call={call}
              formData={formData}
              onFormDataChange={onFormDataChange}
              showSectionA={showSectionA}
              showSectionB={showSectionB}
            />
        </div>

        <div className="inspection-action-buttons" style={{ marginTop: 'var(--space-24)', display: 'flex', justifyContent: 'space-between', gap: 'var(--space-16)' }}>
            <button className="btn btn-secondary" onClick={onBack} style={{ minHeight: '48px' }}>Back to Landing Page</button>
            <button
            className="btn btn-primary"
            disabled={!canProceed}
            onClick={() => onProceed(call.product_type)}
            style={{ minHeight: '48px' }}
            >
            {canProceed ? 'Proceed to Inspection' : 'Complete All Sections to Proceed'}
            </button>
        </div>
    </div>
  );
};

export default InspectionInitiationPage;
