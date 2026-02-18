import React from 'react';

// Responsive styles for the page
const pageStyles = `
  .submodule-page-container {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

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
    padding: 12px 20px;
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
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  @media (max-width: 768px) {
    .submodule-page-container {
      padding: 16px;
    }

    .submodule-page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .submodule-back-btn {
      width: 100%;
      justify-content: center;
    }

    .submodule-page-title {
      font-size: 20px;
    }
  }
`;

const SummaryReportsPage = ({ onBack }) => {
  return (
    <div className="submodule-page-container">
      <style>{pageStyles}</style>
      
      <div className="submodule-page-header">
        <button className="submodule-back-btn" onClick={onBack}>
          ← Back to Sub Module Session
        </button>
        <h1 className="submodule-page-title">📊 Summary and Reports</h1>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Raw Material Inspection Summary - Auto-Compiled</h3>
          <p className="card-subtitle">Consolidated results from all RM inspection modules</p>
        </div>
        <div className="alert alert-success">
          ✓ Raw Material inspection completed successfully
        </div>
        <div style={{ marginBottom: 'var(--space-20)' }}>
          <h4 style={{ marginBottom: 'var(--space-12)' }}>Calibration Module Results:</h4>
          <p>All instruments calibrated and valid. 1 instrument expiring soon (Dimensional Gauge - Nov 10)</p>
        </div>
        <div style={{ marginBottom: 'var(--space-20)' }}>
          <h4 style={{ marginBottom: 'var(--space-12)' }}>Visual &amp; Dimensional Check Results:</h4>
          <p><strong>Samples Inspected:</strong> 20 samples per heat</p>
          <p><strong>Defects Found:</strong> 2 minor defects (Kink, Pit)</p>
          <p><strong>Dimensional Measurements:</strong> All within tolerance</p>
        </div>
        <div style={{ marginBottom: 'var(--space-20)' }}>
          <h4 style={{ marginBottom: 'var(--space-12)' }}>Material Testing Results:</h4>
          <p><strong>Chemical Analysis:</strong></p>
          <ul style={{ marginLeft: 'var(--space-20)' }}>
            <li>Carbon %: 0.55 (Valid - Range: 0.50-0.60)</li>
            <li>Grain Size: 5</li>
          </ul>
          <p><strong>Mechanical Properties:</strong></p>
          <ul style={{ marginLeft: 'var(--space-20)' }}>
            <li>Hardness: 48 HRC (Valid - Range: 45-55)</li>
            <li>Depth of Decarb: 0.2mm</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SummaryReportsPage;

