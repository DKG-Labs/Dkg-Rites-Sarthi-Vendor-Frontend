import React from 'react';

const HeatCertificateItem = ({
  certificate,
  parentHeatNo,
  certIndex,
  heatIndex,
  onUpdate,
  onRemove,
  canRemove,
  totalCertificates
}) => {
  const handleChange = (field, value) => {
    onUpdate(heatIndex, certIndex, field, value);
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this certificate?')) {
      onRemove(heatIndex, certIndex);
    }
  };

  return (
    <div
      style={{
        padding: 'var(--space-12)',
        background: 'var(--color-gray-50)',
        borderRadius: 'var(--radius-base)',
        marginBottom: certIndex < totalCertificates - 1 ? 'var(--space-12)' : 0,
        border: '1px solid var(--color-gray-300)'
      }}
    >
      {/* Certificate Header with Remove Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-12)' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
          Test Certificate #{certIndex + 1}
        </span>
        {canRemove && totalCertificates > 0 && (
          <button
            className="btn btn-link"
            onClick={handleRemove}
            style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)', padding: 0 }}
          >
            Remove
          </button>
        )}
      </div>

      {/* Certificate Fields Grid */}
      <div className="input-grid">
        {/* Test Certificate No. */}
        <div>
          <label className="form-label">Test Certificate No. <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <input
            type="text"
            className="form-control"
            value={certificate.certificateNo}
            onChange={(e) => handleChange('certificateNo', e.target.value)}
            placeholder="e.g., TC-2025-001"
            required
          />
        </div>

        {/* Date of Certificate */}
        <div>
          <label className="form-label">Date of Certificate <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <input
            type="date"
            className="form-control"
            value={certificate.certificateDate}
            onChange={(e) => handleChange('certificateDate', e.target.value)}
            required
          />
        </div>

        {/* Heat Number (Auto-filled, Read-only) */}
        <div>
          <label className="form-label">Heat Number</label>
          <input
            type="text"
            className="form-control"
            value={parentHeatNo}
            disabled
            style={{ background: 'var(--color-gray-200)', cursor: 'not-allowed' }}
          />
          <small style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)', display: 'block' }}>
            Auto-filled from parent heat
          </small>
        </div>
      </div>
    </div>
  );
};

export default HeatCertificateItem;
