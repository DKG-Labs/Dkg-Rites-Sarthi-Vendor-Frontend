import React from 'react';
import CalibrationSubModule from '../components/CalibrationSubModule';

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

const CalibrationDocumentsPage = ({ onBack, heats }) => {
  return (
    <div className="submodule-page-container">
      <style>{pageStyles}</style>
      
      <div className="submodule-page-header">
        <button className="submodule-back-btn" onClick={onBack}>
          ← Back to Sub Module Session
        </button>
        <h1 className="submodule-page-title">📄 Calibration & Documents</h1>
      </div>

      <CalibrationSubModule
        preInspectionHeats={heats}
        onSave={(data) => {
          console.log('Calibration data saved:', data);
        }}
      />
    </div>
  );
};

export default CalibrationDocumentsPage;

