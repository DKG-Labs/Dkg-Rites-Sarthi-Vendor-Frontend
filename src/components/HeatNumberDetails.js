import React, { useState, useCallback } from 'react';

// Responsive styles for Heat Number Details
const heatResponsiveStyles = `
  /* 3-column grid layout for desktop */
  .heat-form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 16px;
  }

  .heat-form-group {
    display: flex;
    flex-direction: column;
  }

  .heat-form-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .heat-form-label .required {
    color: #ef4444;
  }

  .heat-form-input {
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

  .heat-form-input:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
  }

  .heat-form-input:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }

  .heat-form-hint {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }

  .heat-card {
    padding: 20px;
    background: #fefce8;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid #fef08a;
  }

  .heat-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .heat-card-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .heat-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .heat-section-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .heat-add-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    background-color: #16a34a;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    min-height: 44px;
  }

  .heat-add-btn:hover {
    background-color: #15803d;
  }

  .heat-remove-btn {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 36px;
  }

  .heat-remove-btn:hover {
    background-color: #fee2e2;
    border-color: #fca5a5;
    color: #dc2626;
  }

  /* Tablet: 2 columns */
  @media (max-width: 1024px) {
    .heat-form-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
  }

  /* Mobile: 1 column */
  @media (max-width: 768px) {
    .heat-form-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .heat-form-input {
      font-size: 16px;
      min-height: 48px;
      padding: 12px 14px;
    }

    .heat-section-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .heat-add-btn {
      width: 100%;
      justify-content: center;
    }

    .heat-card-header {
      flex-direction: row;
    }

    .heat-card {
      padding: 16px;
    }
  }

  /* Small mobile */
  @media (max-width: 480px) {
    .heat-form-input {
      font-size: 16px;
      min-height: 52px;
      padding: 14px 16px;
    }

    .heat-form-label {
      font-size: 13px;
    }

    .heat-section-title {
      font-size: 16px;
    }
  }
`;

const HeatNumberDetails = () => {
  const [heats, setHeats] = useState([
    {
      id: 1,
      heatNo: 'H001',
      weight: '2.5',
      colorCode: 'RED',
      certificate: {
        certificateNo: 'TC-2025-001',
        certificateDate: '2025-11-10',
        heatNumber: 'H001'
      }
    },
    {
      id: 2,
      heatNo: 'H002',
      weight: '3.0',
      colorCode: 'BLUE',
      certificate: {
        certificateNo: '',
        certificateDate: '',
        heatNumber: 'H002'
      }
    }
  ]);

  const [nextHeatId, setNextHeatId] = useState(3);

  const addHeat = useCallback(() => {
    const newHeat = {
      id: nextHeatId,
      heatNo: '',
      weight: '',
      colorCode: '',
      certificate: {
        certificateNo: '',
        certificateDate: '',
        heatNumber: ''
      }
    };
    setHeats(prev => [...prev, newHeat]);
    setNextHeatId(prev => prev + 1);
  }, [nextHeatId]);

  const removeHeat = useCallback((heatIndex) => {
    if (heats.length > 1) {
      setHeats(prev => prev.filter((_, i) => i !== heatIndex));
    }
  }, [heats.length]);

  const updateHeat = useCallback((heatIndex, field, value) => {
    setHeats(prev => {
      const updated = [...prev];
      updated[heatIndex][field] = value;
      
      // Update certificate's heatNumber when heat's heatNo changes
      if (field === 'heatNo') {
        updated[heatIndex].certificate.heatNumber = value;
      }
      
      return updated;
    });
  }, []);

  const updateCertificate = useCallback((heatIndex, field, value) => {
    setHeats(prev => {
      const updated = [...prev];
      updated[heatIndex].certificate[field] = value;
      return updated;
    });
  }, []);

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Inject responsive styles */}
      <style>{heatResponsiveStyles}</style>

      <div className="heat-section-header">
        <h4 className="heat-section-title">Heat Number Details</h4>
        <button className="heat-add-btn" onClick={addHeat}>
          + Add Heat
        </button>
      </div>

      {heats.map((heat, heatIndex) => (
        <div key={heat.id} className="heat-card">
          {/* Heat Header */}
          <div className="heat-card-header">
            <span className="heat-card-title">Heat #{heatIndex + 1}</span>
            {heats.length > 1 && (
              <button
                className="heat-remove-btn"
                onClick={() => removeHeat(heatIndex)}
              >
                Remove
              </button>
            )}
          </div>

          {/* Heat Fields + Certificate Fields - ALL in ONE continuous 3-column grid */}
          <div className="heat-form-grid">
            {/* Heat Fields */}
            <div className="heat-form-group">
              <label className="heat-form-label">Heat No. <span className="required">*</span></label>
              <input
                type="text"
                className="heat-form-input"
                value={heat.heatNo}
                onChange={(e) => updateHeat(heatIndex, 'heatNo', e.target.value)}
                placeholder="e.g., H001"
                required
              />
            </div>
            <div className="heat-form-group">
              <label className="heat-form-label">Wt. of Material (MT) <span className="required">*</span></label>
              <input
                type="number"
                step="0.01"
                className="heat-form-input"
                value={heat.weight}
                onChange={(e) => updateHeat(heatIndex, 'weight', e.target.value)}
                placeholder="e.g., 2.5"
                required
              />
            </div>
            <div className="heat-form-group">
              <label className="heat-form-label">Color Code <span className="required">*</span></label>
              <input
                type="text"
                className="heat-form-input"
                value={heat.colorCode}
                onChange={(e) => updateHeat(heatIndex, 'colorCode', e.target.value)}
                placeholder="e.g., RED"
                required
              />
            </div>

            {/* Certificate Fields - rendered inline, NO separation, NO title */}
            <div className="heat-form-group">
              <label className="heat-form-label">Test Certificate No. <span className="required">*</span></label>
              <input
                type="text"
                className="heat-form-input"
                value={heat.certificate.certificateNo}
                onChange={(e) => updateCertificate(heatIndex, 'certificateNo', e.target.value)}
                placeholder="e.g., TC-2025-001"
                required
              />
            </div>
            <div className="heat-form-group">
              <label className="heat-form-label">Date of Certificate <span className="required">*</span></label>
              <input
                type="date"
                className="heat-form-input"
                value={heat.certificate.certificateDate}
                onChange={(e) => updateCertificate(heatIndex, 'certificateDate', e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HeatNumberDetails;
