import React from 'react';

const CertificateInlineFields = ({
  certificate,
  parentHeatNo,
  certIndex,
  heatIndex,
  onUpdate,
  onRemove,
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
    <div>
      {/* Certificate fields rendered inline - NO card, NO border, NO title */}
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

        {/* Remove Certificate Button - appears inline with fields */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            className="btn btn-link"
            onClick={handleRemove}
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-danger)',
              padding: 'var(--space-8) 0',
              textAlign: 'left'
            }}
          >
            Remove Certificate
          </button>
        </div>
      </div>

      {/* Spacing between certificates */}
      {certIndex < totalCertificates - 1 && (
        <div style={{ marginTop: 'var(--space-12)' }} />
      )}
    </div>
  );
};

export default CertificateInlineFields;
