import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MOCK_PO_DATA } from '../data/mockData';
import { formatDate } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import HeatNumberDetails from '../components/HeatNumberDetails';
import MobileResponsiveSelect from '../components/MobileResponsiveSelect';

// Responsive styles for Raw Material Dashboard
const responsiveStyles = `
  /* 3-column grid layout for desktop */
  .rm-form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }

  .rm-form-group {
    display: flex;
    flex-direction: column;
  }

  .rm-form-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .rm-form-label.required::after {
    content: ' *';
    color: #ef4444;
  }

  .rm-form-input {
    width: 100%;
    min-height: 44px;
    padding: 10px 14px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background-color: #ffffff;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .rm-form-input:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
  }

  .rm-form-input:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }

  .rm-form-hint {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }

  .rm-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .rm-page-header h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .rm-back-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 44px;
  }

  .rm-back-button:hover {
    background-color: #e5e7eb;
  }

  /* Tablet: 2 columns */
  @media (max-width: 1024px) {
    .rm-form-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
  }

  /* Mobile: 1 column */
  @media (max-width: 768px) {
    .rm-form-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .rm-form-input {
      font-size: 16px;
      min-height: 48px;
      padding: 12px 14px;
    }

    .rm-page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .rm-page-header h1 {
      font-size: 20px;
    }

    .rm-back-button {
      width: 100%;
      justify-content: center;
    }

    .rm-card-header {
      flex-direction: column;
      gap: 8px;
    }

    .rm-card-title {
      font-size: 16px !important;
    }

    .rm-action-buttons {
      flex-direction: column !important;
      gap: 12px !important;
    }

    .rm-action-buttons button {
      width: 100% !important;
      justify-content: center;
    }

    /* Make tables scrollable */
    .data-table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
  }

  /* Small mobile */
  @media (max-width: 480px) {
    .rm-form-input {
      font-size: 16px;
      min-height: 52px;
      padding: 14px 16px;
    }

    .rm-form-label {
      font-size: 13px;
    }

    .rm-page-header h1 {
      font-size: 18px;
    }
  }

  /* Sub Module Session Styles */
  .submodule-session {
    padding: 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    margin-top: 24px;
  }

  .submodule-session-header {
    text-align: center;
    margin-bottom: 24px;
  }

  .submodule-session-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
  }

  .submodule-session-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  .submodule-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .submodule-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 120px;
  }

  .submodule-btn:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  .submodule-btn-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }

  .submodule-btn-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    text-align: center;
    margin: 0;
  }

  .submodule-btn-desc {
    font-size: 12px;
    color: #64748b;
    text-align: center;
    margin-top: 4px;
  }

  /* Submodule Page Styles */
  .submodule-page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e2e8f0;
  }

  .submodule-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #3b82f6;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .submodule-back-btn:hover {
    background: #dbeafe;
    border-color: #93c5fd;
  }

  .submodule-page-title {
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  @media (max-width: 768px) {
    .submodule-buttons {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .submodule-btn {
      padding: 20px 16px;
      min-height: 100px;
    }

    .submodule-btn-icon {
      font-size: 28px;
    }

    .submodule-btn-title {
      font-size: 15px;
    }

    .submodule-page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .submodule-back-btn {
      width: 100%;
      justify-content: center;
    }

    .submodule-page-title {
      font-size: 18px;
    }
  }

  @media (max-width: 1024px) and (min-width: 769px) {
    .submodule-buttons {
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
  }
`;

const RawMaterialDashboard = ({ onBack, onNavigateToSubModule, onHeatsChange, onProductModelChange }) => {

  // Pre-Inspection Data Entry State
  const [sourceOfRawMaterial, setSourceOfRawMaterial] = useState('');
  const [heats] = useState([
    { heatNo: 'H001', weight: '2.5', colorCode: 'RED' },
    { heatNo: 'H002', weight: '3.0', colorCode: 'BLUE' }
  ]);
  const [numberOfBundles, setNumberOfBundles] = useState('10');
  const [testCertificates] = useState([
    { certificateNo: 'TC-2025-001', heatNo: 'H001', certificateDate: '2025-11-10' }
  ]);



  // Get PO data for header (move up so memo hooks can reference it)
  const poData = MOCK_PO_DATA["PO-2025-1001"];

  // Determine product model/type from PO data — fall back to MK-III
  const productModel = useMemo(() => {
    const name = (poData.product_name || '').toString();
    if (/MK-III/i.test(name) || /MK III/i.test(name)) return 'MK-III';
    if (/MK-V/i.test(name) || /MK V/i.test(name)) return 'MK-V';
    // if mock data or PO doesn't contain model, check other fields
    if (poData.model && /MK-III/i.test(poData.model)) return 'MK-III';
    if (poData.model && /MK-V/i.test(poData.model)) return 'MK-V';
    return 'MK-III';
  }, [poData]);

  // Sync heats and productModel to parent for submodule pages
  useEffect(() => {
    if (onHeatsChange) onHeatsChange(heats);
  }, [heats, onHeatsChange]);

  useEffect(() => {
    if (onProductModelChange) onProductModelChange(productModel);
  }, [productModel, onProductModelChange]);

  // Auto-calculated values
  const totalQuantity = useMemo(() => {
    return heats.reduce((sum, heat) => sum + (parseFloat(heat.weight) || 0), 0).toFixed(2);
  }, [heats]);

  const numberOfHeats = useMemo(() => {
    return heats.length;
  }, [heats]);

  const numberOfERC = useMemo(() => {
    // Assuming 1 ERC per 0.5 MT of material
    return Math.ceil(parseFloat(totalQuantity) / 0.5);
  }, [totalQuantity]);

  // (defect lists and counts handled in visual module state)

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [sourceOfRawMaterial, heats, numberOfBundles, testCertificates]);

  const heatNumbers = useMemo(() => heats.map(h => h.heatNo).filter(Boolean), [heats]);

  return (
    <div className="rm-dashboard-container">
      {/* Inject responsive styles */}
      <style>{responsiveStyles}</style>

      <div className="breadcrumb">
        <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item">Inspection Initiation</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item breadcrumb-active">ERC Raw Material</div>
      </div>

      <div className="rm-page-header">
        <h1>ERC Raw Material Inspection</h1>
        <button className="rm-back-button" onClick={onBack}>
          ← Back to Landing Page
        </button>
      </div>

      {/* Header with Static Data */}
      <div className="card" style={{ background: 'var(--color-gray-100)', marginBottom: 'var(--space-24)' }}>
        <div className="card-header rm-card-header">
          <h3 className="card-title rm-card-title">Inspection Details (Static Data)</h3>
          <p className="card-subtitle">Auto-fetched from PO/Sub PO information</p>
        </div>
        <div className="rm-form-grid">
          <div className="rm-form-group">
            <label className="rm-form-label">PO / Sub PO Number</label>
            <input type="text" className="rm-form-input" value={poData.sub_po_no || poData.po_no} disabled />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label">PO / Sub PO Date</label>
            <input type="text" className="rm-form-input" value={formatDate(poData.sub_po_date || poData.po_date)} disabled />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label">Contractor Name</label>
            <input type="text" className="rm-form-input" value={poData.contractor} disabled />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label">Manufacturer</label>
            <input type="text" className="rm-form-input" value={poData.manufacturer} disabled />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label">Place of Inspection</label>
            <input type="text" className="rm-form-input" value={poData.place_of_inspection} disabled />
          </div>
          <div className="rm-form-group">
            <label className="rm-form-label">Stage of Inspection</label>
            <input type="text" className="rm-form-input" value="Raw Material Inspection" disabled />
          </div>
        </div>
      </div>

      {/* Pre-Inspection Data Entry */}
      <div className="card" style={{ marginBottom: 'var(--space-24)' }}>
        <div className="card-header rm-card-header">
          <h3 className="card-title rm-card-title">Pre-Inspection Data Entry</h3>
          <p className="card-subtitle">Enter raw material details before starting inspection</p>
        </div>

        <div className="rm-form-grid">
          <div className="rm-form-group">
            <label className="rm-form-label required">Source of Raw Material</label>
            <MobileResponsiveSelect
              value={sourceOfRawMaterial}
              onChange={(e) => setSourceOfRawMaterial(e.target.value)}
              options={[
                { value: '', label: 'Select Source' },
                { value: 'domestic', label: 'Domestic' },
                { value: 'imported', label: 'Imported' }
              ]}
              required={true}
            />
          </div>

          <div className="rm-form-group">
            <label className="rm-form-label required">No. of Bundles</label>
            <input
              type="number"
              className="rm-form-input"
              value={numberOfBundles}
              onChange={(e) => setNumberOfBundles(e.target.value)}
              required
            />
          </div>

          <div className="rm-form-group">
            <label className="rm-form-label">Total Quantity of Raw Material (MT)</label>
            <input
              type="text"
              className="rm-form-input"
              value={totalQuantity}
              disabled
            />
            <span className="rm-form-hint">Auto-calculated from heat weights</span>
          </div>

          <div className="rm-form-group">
            <label className="rm-form-label">No. of Heats</label>
            <input
              type="text"
              className="rm-form-input"
              value={numberOfHeats}
              disabled
            />
            <span className="rm-form-hint">Auto-calculated from heat entries</span>
          </div>

          <div className="rm-form-group">
            <label className="rm-form-label">No. of ERC (to be inspected)</label>
            <input
              type="text"
              className="rm-form-input"
              value={numberOfERC}
              disabled
            />
            <span className="rm-form-hint">Auto-calculated (1 ERC per 0.5 MT)</span>
          </div>
        </div>

        {/* Heat Number Details with nested Test Certificates */}
        <HeatNumberDetails />
      </div>

      {/* Sub Module Session */}
      <div className="submodule-session">
        <div className="submodule-session-header">
          <h3 className="submodule-session-title">📋 Sub Module Session</h3>
          <p className="submodule-session-subtitle">Select a module to proceed with inspection</p>
        </div>
        <div className="submodule-buttons">
          <button className="submodule-btn" onClick={() => onNavigateToSubModule('calibration-documents')}>
            <span className="submodule-btn-icon">📄</span>
            <p className="submodule-btn-title">Calibration & Documents</p>
            <p className="submodule-btn-desc">Verify instrument calibration</p>
          </button>
          <button className="submodule-btn" onClick={() => onNavigateToSubModule('visual-material-testing')}>
            <span className="submodule-btn-icon">🔬</span>
            <p className="submodule-btn-title">Visual & Material Testing</p>
            <p className="submodule-btn-desc">Inspect samples & test materials</p>
          </button>
          <button className="submodule-btn" onClick={() => onNavigateToSubModule('summary-reports')}>
            <span className="submodule-btn-icon">📊</span>
            <p className="submodule-btn-title">Summary and Reports</p>
            <p className="submodule-btn-desc">View consolidated results</p>
          </button>
        </div>
      </div>

      {/* Post Inspection Session - Always visible at bottom of page */}
      <div className="card" style={{ marginTop: '32px', borderTop: '4px solid var(--color-primary)' }}>
        <div className="card-header rm-card-header" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
          <h3 className="card-title rm-card-title" style={{ fontSize: '20px', color: '#0369a1' }}>🔍 Post Inspection Session</h3>
          <p className="card-subtitle" style={{ color: '#0284c7' }}>Final results and decision for the inspection</p>
        </div>

        {/* Final Results Table */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Final Results - Raw Material (Auto-Populated)</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Heat No.</th>
                  <th>Status</th>
                  <th>Weight of Material (Tons)</th>
                  <th>Remarks (Required)</th>
                </tr>
              </thead>
              <tbody>
                {heatNumbers.map(heat => (
                  <tr key={heat}>
                    <td><strong>{heat}</strong></td>
                    <td><StatusBadge status="Valid" /> Accepted</td>
                    <td>2.75 tons</td>
                    <td>
                      <input type="text" className="rm-form-input" placeholder="Enter remarks..." required style={{ minWidth: '200px' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accept/Reject Decision */}
        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Accept/Reject Decision</h4>
          <div className="rm-form-grid">
            <div className="rm-form-group">
              <label className="rm-form-label">Material Lot Status</label>
              <MobileResponsiveSelect
                value="accepted"
                onChange={() => {}}
                options={[
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'rejected', label: 'Rejected' }
                ]}
              />
            </div>
            <div className="rm-form-group">
              <label className="rm-form-label">Reason for Rejection (if rejected)</label>
              <input type="text" className="rm-form-input" placeholder="Enter reason..." />
            </div>
            <div className="rm-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="rm-form-label required">Overall IE Remarks</label>
              <textarea className="rm-form-input" rows="3" placeholder="Enter your overall remarks..." style={{ minHeight: '80px', resize: 'vertical' }}></textarea>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="rm-action-buttons" style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '24px' }}>
          <button className="btn btn-outline" style={{ minHeight: '44px', padding: '10px 20px' }}>Save Draft</button>
          <button className="btn btn-secondary" style={{ minHeight: '44px', padding: '10px 20px' }} onClick={() => { if (window.confirm('Are you sure you want to reject this lot?')) { alert('Raw Material lot rejected'); } }}>Reject Lot</button>
          <button className="btn btn-primary" style={{ minHeight: '44px', padding: '10px 20px' }} onClick={() => { alert('Raw Material lot accepted and inspection completed!'); onBack(); }}>Accept Lot &amp; Complete Inspection</button>
        </div>
      </div>

      <div className="rm-action-buttons" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
        <button className="rm-back-button" onClick={onBack} style={{ maxWidth: '300px' }}>
          ← Return to Landing Page
        </button>
      </div>
    </div>
  );
};

export default RawMaterialDashboard;
