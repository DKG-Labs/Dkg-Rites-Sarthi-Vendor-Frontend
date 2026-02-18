import React, { useState } from 'react';
import { MOCK_PO_DATA } from '../data/mockData';
import { formatDate } from '../utils/helpers';
import { getProductTypeDisplayName } from '../utils/helpers';
import MobileResponsiveSelect from './MobileResponsiveSelect';

// Responsive styles for mobile form elements
const responsiveFormStyles = `
  @media (max-width: 768px) {
    .inspection-form-container .form-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    .inspection-form-container .form-group {
      width: 100% !important;
    }
    .inspection-form-container .form-input,
    .inspection-form-container select.form-input,
    .inspection-form-container input.form-input,
    .inspection-form-container textarea.form-textarea {
      font-size: 16px !important;
      min-height: 48px !important;
      padding: 12px 14px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      -webkit-appearance: none !important;
      appearance: none !important;
      border-radius: 8px !important;
    }
    .inspection-form-container select.form-input {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 14px center !important;
      padding-right: 40px !important;
    }
    .inspection-form-container .form-label {
      font-size: 14px !important;
      margin-bottom: 8px !important;
    }
    .inspection-form-container .card-header {
      flex-wrap: wrap !important;
      gap: 12px !important;
    }
    .inspection-form-container .card-header h3 {
      font-size: 16px !important;
      flex: 1 !important;
      min-width: 200px !important;
    }
    .inspection-form-container .card-header button {
      min-width: 44px !important;
      min-height: 44px !important;
    }
    .inspection-form-container .checkbox-item {
      padding: 12px 0 !important;
    }
    .inspection-form-container .checkbox-item input[type="checkbox"] {
      width: 22px !important;
      height: 22px !important;
      min-width: 22px !important;
    }
    .inspection-form-container .checkbox-item label {
      font-size: 14px !important;
      line-height: 1.4 !important;
    }
    .inspection-form-container .data-table {
      font-size: 13px !important;
    }
    .inspection-form-container .data-table th,
    .inspection-form-container .data-table td {
      padding: 10px 8px !important;
    }
    .inspection-form-container .data-table input,
    .inspection-form-container .data-table select {
      font-size: 14px !important;
      min-height: 40px !important;
      padding: 8px !important;
    }
  }

  @media (max-width: 480px) {
    .inspection-form-container .form-input,
    .inspection-form-container select.form-input,
    .inspection-form-container input.form-input {
      font-size: 16px !important;
      min-height: 52px !important;
      padding: 14px 16px !important;
    }
    .inspection-form-container select.form-input {
      padding-right: 44px !important;
    }
    .inspection-form-container .card-header h3 {
      font-size: 15px !important;
    }
  }
`;

const InspectionInitiationFormContent = ({ call, formData, onFormDataChange, showSectionA = true, showSectionB = true }) => {
  const poData = MOCK_PO_DATA[call.po_no] || {};
  const [sectionAExpanded, setSectionAExpanded] = useState(true);
  const [sectionBExpanded, setSectionBExpanded] = useState(true);
  const [sectionCExpanded, setSectionCExpanded] = useState(true);
  const [sectionDExpanded, setSectionDExpanded] = useState(true);

  const getOfferedQtyStatus = () => {
    if (formData.offeredQty < call.call_qty) return { type: 'error', message: 'Not allowed - Offered Qty cannot be less than Call Qty' };
    if (formData.offeredQty === call.call_qty) return { type: 'success', message: 'Allowed - Quantities match' };
    if (formData.offeredQty > call.call_qty) return { type: 'warning', message: 'Requires CM approval - Offered Qty exceeds Call Qty' };
  };

  const offeredQtyStatus = getOfferedQtyStatus();

  const addProductionLine = () => {
    onFormDataChange({
      productionLines: [...formData.productionLines, {
        lineNumber: formData.productionLines.length + 1,
        icNumber: '',
        poNumber: '',
        rawMaterialIC: '',
        productType: ''
      }]
    });
  };

  const updateProductionLine = (index, field, value) => {
    const updated = [...formData.productionLines];
    updated[index][field] = value;
    onFormDataChange({ productionLines: updated });
  };

  return (
    <div className="form-container inspection-form-container">
      {/* Inject responsive form styles */}
      <style>{responsiveFormStyles}</style>

      {/* SECTION A: Main PO Information */}
      {showSectionA && (
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">SECTION A: Main PO Information (Auto-Fetched)</h3>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSectionAExpanded(!sectionAExpanded)}
            style={{ padding: 'var(--space-8) var(--space-16)', fontSize: 'var(--font-size-xl)' }}
          >
            {sectionAExpanded ? '-' : '+'}
          </button>
        </div>
        {sectionAExpanded && (
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">PO Number</label>
            <input type="text" className="form-input" value={poData.po_no || call.po_no} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">PO Date</label>
            <input type="text" className="form-input" value={formatDate(poData.po_date || call.po_date)} disabled />
            <small style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)' }}>✓ PO Date ≤ Today</small>
          </div>
          <div className="form-group">
            <label className="form-label">PO Ammd. No./Numbers</label>
            <input type="text" className="form-input" value={poData.po_amend_no || 'N/A'} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">PO Ammd. Dates</label>
            <input type="text" className="form-input" value={poData.po_amend_dates || 'N/A'} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input type="text" className="form-input" value={poData.product_name || 'ERC Components'} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">PL No.</label>
            <input type="text" className="form-input" value={poData.pl_no || 'N/A'} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Vendor Name</label>
            <input type="text" className="form-input" value={poData.vendor_name || call.vendor_name} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Purchasing Authority</label>
            <input type="text" className="form-input" value={poData.purchasing_authority || 'Manager, Procurement'} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">BPO (Bill Paying Officer)</label>
            <input type="text" className="form-input" value={poData.bpo || 'BPO-001'} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">PO Quantity</label>
            <input type="text" className="form-input" value={poData.po_qty || call.po_qty} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">DP (Delivery Period)</label>
            <input type="text" className="form-input" value={poData.delivery_period || call.delivery_period || 'N/A'} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Place of Inspection</label>
            <input type="text" className="form-input" value={poData.place_of_inspection || call.place_of_inspection || 'N/A'} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Inspection Fees Payment Details (in Advance)</label>
            <input type="text" className="form-input" value={poData.inspection_fees_payment || 'N/A'} disabled />
          </div>

          {/* Section A Verification Checkbox */}
          <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-16)', padding: 'var(--space-16)', background: 'var(--color-gray-100)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-gray-300)' }}>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id={`sectionA-verify-${call.id}`}
                checked={formData.sectionAVerified || false}
                onChange={(e) => onFormDataChange({ sectionAVerified: e.target.checked })}
              />
              <label htmlFor={`sectionA-verify-${call.id}`} style={{ fontWeight: 'var(--font-weight-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                {formData.sectionAVerified && <span style={{ color: 'var(--color-success)', fontSize: '18px' }}>✓</span>}
                I verify that all information in this section has been reviewed and is correct
              </label>
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {/* SECTION B: Inspection Call Details */}
      {showSectionB && (
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">SECTION B: Inspection Call Details</h3>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSectionBExpanded(!sectionBExpanded)}
            style={{ padding: 'var(--space-8) var(--space-16)', fontSize: 'var(--font-size-xxl)' }}
          >
            {sectionBExpanded ? '-' : '+'}
          </button>
        </div>
        {sectionBExpanded && (
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label required">Shift of Inspection</label>
            <MobileResponsiveSelect
              value={formData.shiftOfInspection || ''}
              onChange={(e) => onFormDataChange({ shiftOfInspection: e.target.value })}
              options={[
                { value: '', label: 'Select Shift' },
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' },
                { value: 'C', label: 'C' },
                { value: 'General', label: 'General' }
              ]}
              required={true}
            />
          </div>
          <div className="form-group">
            <label className="form-label required">Date of Inspection</label>
            {formData.shiftOfInspection === 'C' ? (
              <MobileResponsiveSelect
                value={formData.dateOfInspection || ''}
                onChange={(e) => onFormDataChange({ dateOfInspection: e.target.value })}
                options={[
                  {
                    value: new Date().toISOString().split('T')[0],
                    label: `${formatDate(new Date().toISOString())} (Today)`
                  },
                  {
                    value: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                    label: `${formatDate(new Date(Date.now() - 86400000).toISOString())} (Yesterday)`
                  }
                ]}
                required={true}
              />
            ) : (
              <input
                type="text"
                className="form-input"
                value={formData.dateOfInspection ? formatDate(formData.dateOfInspection) : ''}
                disabled
              />
            )}
            <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
              {formData.shiftOfInspection === 'C' ? 'Stage C: Manual entry (today or yesterday)' : 'Auto-fetched (read-only for shifts A, B, General)'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Inspection Call No.</label>
            <input type="text" className="form-input" value={call.call_no} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Inspection Call Date</label>
            <input type="text" className="form-input" value={formatDate(call.requested_date)} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">PO Item / Sr.No.</label>
            <input type="text" className="form-input" value="1" disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input type="text" className="form-input" value={poData.product_name || 'ERC Components'} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Product Type</label>
            <input type="text" className="form-input" value={getProductTypeDisplayName(call.product_type)} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">PO Qty</label>
            <input type="text" className="form-input" value={poData.po_qty || call.po_qty} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Call Qty</label>
            <input type="text" className="form-input" value={call.call_qty} disabled />
          </div>
          <div className="form-group">
            <label className="form-label required">Offered Qty</label>
            <input
              type="number"
              className={`form-input ${offeredQtyStatus.type === 'error' ? 'error' : ''}`}
              value={formData.offeredQty}
              onChange={(e) => onFormDataChange({ offeredQty: Number(e.target.value) })}
            />
            <div className={`form-${offeredQtyStatus.type === 'success' ? 'success' : offeredQtyStatus.type === 'error' ? 'error' : 'warning'}`} style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-4)', color: offeredQtyStatus.type === 'success' ? 'var(--color-success)' : offeredQtyStatus.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)' }}>
              {offeredQtyStatus.type === 'success' ? '✓' : offeredQtyStatus.type === 'error' ? '✗' : '⚠'} {offeredQtyStatus.message}
            </div>
          </div>
          {formData.offeredQty > call.call_qty && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id={`cmApproval-${call.id}`}
                  checked={formData.cmApproval}
                  onChange={(e) => onFormDataChange({ cmApproval: e.target.checked })}
                />
                <label htmlFor={`cmApproval-${call.id}`} style={{ fontWeight: 'var(--font-weight-medium)' }}>Approval received from CM (Controlling Manager)</label>
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Delivery Completion Period</label>
            <input type="text" className="form-input" value={call.delivery_period} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Rate</label>
            <input type="text" className="form-input" value={`₹${call.rate}`} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Place of Inspection</label>
            <input type="text" className="form-input" value={call.place_of_inspection} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Stage of Inspection</label>
            <input type="text" className="form-input" value={call.stage} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">IC Number of Previous Stages</label>
            <input type="text" className="form-input" value="RM-IC-001, RM-IC-002" disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Remarks for Inspection Call by Vendor</label>
            <textarea className="form-textarea" rows="2" value="Urgent inspection required for production schedule" disabled />
          </div>

          {/* Section B Verification Checkbox */}
          <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-16)', padding: 'var(--space-16)', background: 'var(--color-gray-100)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-gray-300)' }}>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id={`sectionB-verify-${call.id}`}
                checked={formData.sectionBVerified || false}
                onChange={(e) => onFormDataChange({ sectionBVerified: e.target.checked })}
              />
              <label htmlFor={`sectionB-verify-${call.id}`} style={{ fontWeight: 'var(--font-weight-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                {formData.sectionBVerified && <span style={{ color: 'var(--color-success)', fontSize: '18px' }}>✓</span>}
                I verify that all information in this section has been reviewed and is correct
              </label>
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {/* SECTION C: Sub PO Details (if applicable) */}
      {(call.product_type === 'Raw Material' || call.product_type.includes('Process')) && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">SECTION C: Details of Sub PO in case inspection call is requested for Raw Material / process</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSectionCExpanded(!sectionCExpanded)}
              style={{ padding: 'var(--space-8) var(--space-16)', fontSize: 'var(--font-size-xl)' }}
            >
              {sectionCExpanded ? '-' : '+'}
            </button>
          </div>
          {sectionCExpanded && (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Raw Material Name</label>
              <input type="text" className="form-input" value="Steel Bars Grade 45C8" disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Sub PO Number</label>
              <input type="text" className="form-input" value="SUB-PO-2025-001" disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Sub PO Date</label>
              <input type="text" className="form-input" value="2025-10-18" disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Contractor</label>
              <input type="text" className="form-input" value="Premium Materials Inc" disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Manufacturer</label>
              <input type="text" className="form-input" value="Steel Works Ltd" disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Place of Inspection</label>
              <input type="text" className="form-input" value="Vendor Site" disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Bill Paying Officer</label>
              <input type="text" className="form-input" value="BPO-002" disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Consignee</label>
              <input type="text" className="form-input" value="Central Warehouse" disabled />
            </div>

            {/* Section C Verification Checkbox */}
            <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-16)', padding: 'var(--space-16)', background: 'var(--color-gray-100)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-gray-300)' }}>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id={`sectionC-verify-${call.id}`}
                  checked={formData.sectionCVerified || false}
                  onChange={(e) => onFormDataChange({ sectionCVerified: e.target.checked })}
                />
                <label htmlFor={`sectionC-verify-${call.id}`} style={{ fontWeight: 'var(--font-weight-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                  {formData.sectionCVerified && <span style={{ color: 'var(--color-success)', fontSize: '18px' }}>✓</span>}
                  I verify that all information in this section has been reviewed and is correct
                </label>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* SECTION D: Multiple Production Lines */}
      {call.product_type.includes('Process') && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">SECTION D: Multiple Production Lines (if applicable)</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSectionDExpanded(!sectionDExpanded)}
              style={{ padding: 'var(--space-8) var(--space-16)', fontSize: 'var(--font-size-xl)' }}
            >
              {sectionDExpanded ? '-' : '+'}
            </button>
          </div>
        {sectionDExpanded && (
        <>
        <div className="checkbox-item" style={{ marginBottom: 'var(--space-16)' }}>
          <input
            type="checkbox"
            id={`multipleLinesActive-${call.id}`}
            checked={formData.multipleLinesActive}
            onChange={(e) => onFormDataChange({ multipleLinesActive: e.target.checked })}
          />
          <label htmlFor={`multipleLinesActive-${call.id}`} style={{ fontWeight: 'var(--font-weight-medium)' }}>Multiple production lines operating?</label>
        </div>
        {formData.multipleLinesActive && (
          <div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-16)' }}>All data points must be collected for each line number separately.</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Line Number</th>
                    <th>Inspection Call Number</th>
                    <th>PO Number</th>
                    <th>Raw Material IC Number(s)</th>
                    <th>Product Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.productionLines.map((line, idx) => (
                    <tr key={idx}>
                      <td><input type="number" className="form-input" value={line.lineNumber} onChange={(e) => updateProductionLine(idx, 'lineNumber', e.target.value)} /></td>
                      <td><input type="text" className="form-input" value={line.icNumber} onChange={(e) => updateProductionLine(idx, 'icNumber', e.target.value)} placeholder="IC-2025-xxx" /></td>
                      <td><input type="text" className="form-input" value={line.poNumber} onChange={(e) => updateProductionLine(idx, 'poNumber', e.target.value)} disabled /></td>
                      <td><input type="text" className="form-input" value={line.rawMaterialIC} onChange={(e) => updateProductionLine(idx, 'rawMaterialIC', e.target.value)} placeholder="RM-IC-001, RM-IC-002" /></td>
                      <td>
                        <MobileResponsiveSelect
                          value={line.productType}
                          onChange={(e) => updateProductionLine(idx, 'productType', e.target.value)}
                          options={[
                            { value: '', label: 'Select' },
                            { value: 'ERC Process', label: 'ERC-PROCESS MATERIAL' },
                            { value: 'Raw Material', label: 'ERC-RAW MATERIAL' },
                            { value: 'Final Product', label: 'ERC-FINAL' }
                          ]}
                        />
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => onFormDataChange({ productionLines: formData.productionLines.filter((_, i) => i !== idx) })}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={addProductionLine} style={{ marginTop: 'var(--space-16)' }}>+ Add Production Line</button>
          </div>
        )}

        {/* Section D Verification Checkbox */}
        <div style={{ marginTop: 'var(--space-16)', padding: 'var(--space-16)', background: 'var(--color-gray-100)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-gray-300)' }}>
          <div className="checkbox-item">
            <input
              type="checkbox"
              id={`sectionD-verify-${call.id}`}
              checked={formData.sectionDVerified || false}
              onChange={(e) => onFormDataChange({ sectionDVerified: e.target.checked })}
            />
            <label htmlFor={`sectionD-verify-${call.id}`} style={{ fontWeight: 'var(--font-weight-medium)', display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
              {formData.sectionDVerified && <span style={{ color: 'var(--color-success)', fontSize: '18px' }}>✓</span>}
              I verify that all information in this section has been reviewed and is correct
            </label>
          </div>
        </div>
        </>
        )}
      </div>
      )}
    </div>
  );
};

export default InspectionInitiationFormContent;
