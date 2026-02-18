import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Tabs from '../components/Tabs';

// Responsive styles for the page
const pageStyles = `
  :root {
    --defect-gap-matching: 8px;
    --defect-gap-non-matching: 28px;
  }

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

  /* 3-column grid layout */
  .vm-form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }

  .vm-form-group {
    display: flex;
    flex-direction: column;
  }

  .vm-form-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  .vm-form-input {
    width: 100%;
    min-height: 44px;
    padding: 10px 14px;
    font-size: 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background-color: #ffffff;
    box-sizing: border-box;
  }

  .vm-form-input:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
  }

  .vm-form-hint {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }

  .dimensional-samples-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-top: 12px;
  }

  .dimensional-sample-card {
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .dimensional-sample-card .vm-form-input {
    min-height: 36px;
    font-size: 13px;
    padding: 8px 10px;
  }

  .visual-defect-row {
    display: flex;
    align-items: center;
    gap: var(--defect-gap-non-matching);
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: #ffffff;
    transition: gap 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;
  }

  .visual-defect-row.matching {
    gap: var(--defect-gap-matching);
    border-color: #d1fae5;
    background: #f0fdf4;
  }

  .visual-defect-row input[type="checkbox"] {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .visual-defect-row label {
    flex: 1 1 auto;
    font-weight: 500;
    color: #1f2937;
  }

  @media (max-width: 1024px) {
    .vm-form-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .dimensional-samples-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
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

    .visual-defect-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      width: 100%;
    }

    :root {
      --defect-gap-matching: 6px;
      --defect-gap-non-matching: 20px;
    }

    .submodule-back-btn {
      width: 100%;
      justify-content: center;
    }

    .submodule-page-title {
      font-size: 20px;
    }

    .vm-form-grid {
      grid-template-columns: 1fr;
    }

    .vm-form-input {
      font-size: 16px;
      min-height: 48px;
    }

    .dimensional-samples-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 480px) {
    .submodule-page-title {
      font-size: 18px;
    }

    .dimensional-samples-grid {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }
`;

const VisualMaterialTestingPage = ({ onBack, heats = [], productModel = 'ERC-12' }) => {
  const [activeTab, setActiveTab] = useState('visual');
  const [activeHeatTab, setActiveHeatTab] = useState(0);

  const tabs = [
    { id: 'visual', label: 'Visual & Dimensional Check' },
    { id: 'material', label: 'Material Testing' },
  ];

  // Visual Defects List
  const defectList = useMemo(() => ([
    'No Defect', 'Distortion', 'Twist', 'Kink', 'Not Straight', 'Fold',
    'Lap', 'Crack', 'Pit', 'Groove', 'Excessive Scaling', 'Internal Defect (Piping, Segregation)'
  ]), []);

  // Per-heat Visual & Dimensional state
  const [heatVisualData, setHeatVisualData] = useState(() => (
    heats.map(() => ({
      selectedDefects: defectList.reduce((acc, d) => { acc[d] = false; return acc; }, {}),
      defectCounts: defectList.reduce((acc, d) => { acc[d] = ''; return acc; }, {}),
      dimSamples: Array.from({ length: 20 }).map(() => ({ diameter: '' })),
    }))
  ));

  // Keep heatVisualData in sync when heats change
  useEffect(() => {
    setHeatVisualData(prev => {
      const next = heats.map((_, idx) => prev[idx] || {
        selectedDefects: defectList.reduce((acc, d) => { acc[d] = false; return acc; }, {}),
        defectCounts: defectList.reduce((acc, d) => { acc[d] = ''; return acc; }, {}),
        dimSamples: Array.from({ length: 20 }).map(() => ({ diameter: '' })),
      });
      if (activeHeatTab >= heats.length) setActiveHeatTab(Math.max(0, heats.length - 1));
      return next;
    });
  }, [heats, defectList, activeHeatTab]);

  // Defect handlers
  const handleDefectToggle = useCallback((defectName) => {
    setHeatVisualData(prev => {
      const next = [...prev];
      const hv = { ...next[activeHeatTab] };
      const sel = { ...hv.selectedDefects };
      const counts = { ...hv.defectCounts };
      if (defectName === 'No Defect') {
        // Toggle No Defect - if already selected, deselect it
        if (sel['No Defect']) {
          sel['No Defect'] = false;
        } else {
          // Selecting No Defect clears all other defects
          Object.keys(sel).forEach(k => { sel[k] = false; counts[k] = ''; });
          sel['No Defect'] = true;
        }
      } else {
        sel[defectName] = !sel[defectName];
        if (!sel[defectName]) counts[defectName] = '';
        if (sel['No Defect']) sel['No Defect'] = false;
      }
      hv.selectedDefects = sel;
      hv.defectCounts = counts;
      next[activeHeatTab] = hv;
      return next;
    });
  }, [activeHeatTab]);

  const handleDefectCountChange = useCallback((defectName, value) => {
    setHeatVisualData(prev => {
      const next = [...prev];
      const hv = { ...next[activeHeatTab] };
      hv.defectCounts = { ...hv.defectCounts, [defectName]: value };
      next[activeHeatTab] = hv;
      return next;
    });
  }, [activeHeatTab]);

  const handleDimSampleChange = useCallback((idx, value) => {
    setHeatVisualData(prev => {
      const next = [...prev];
      const hv = { ...next[activeHeatTab] };
      const samples = [...hv.dimSamples];
      samples[idx] = { ...samples[idx], diameter: value };
      hv.dimSamples = samples;
      next[activeHeatTab] = hv;
      return next;
    });
  }, [activeHeatTab]);

  // Standard diameter derived from product model
  const standardDiameter = useMemo(() => {
    const modelNum = productModel.match(/\d+/)?.[0];
    const parsed = modelNum ? parseFloat(modelNum) : NaN;
    return Number.isNaN(parsed) ? '' : parsed;
  }, [productModel]);

  // Material testing state
  const [materialData, setMaterialData] = useState(() => heats.map(() => ({
    samples: [
      { c: '', si: '', mn: '', p: '', s: '', grainSize: '', inclA: '', inclB: '', inclC: '', inclD: '', hardness: '', decarb: '', remarks: '' },
      { c: '', si: '', mn: '', p: '', s: '', grainSize: '', inclA: '', inclB: '', inclC: '', inclD: '', hardness: '', decarb: '', remarks: '' }
    ]
  })));

  const updateMaterialField = (heatIndex, sampleIndex, field, value) => {
    setMaterialData(prev => {
      const next = [...prev];
      next[heatIndex] = { ...next[heatIndex], samples: [...next[heatIndex].samples] };
      next[heatIndex].samples[sampleIndex] = { ...next[heatIndex].samples[sampleIndex], [field]: value };
      return next;
    });
  };

  return (
    <div className="submodule-page-container">
      <style>{pageStyles}</style>

      <div className="submodule-page-header">
        <button className="submodule-back-btn" onClick={onBack}>
          ← Back to Sub Module Session
        </button>
        <h1 className="submodule-page-title">🔬 Visual & Material Testing</h1>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'visual' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Visual &amp; Dimensional Check (20 samples per Heat)</h3>
            <p className="card-subtitle">Raw Material Specific - Check for material defects and dimensional accuracy</p>
          </div>

          {/* Heat selector buttons */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {heats.map((h, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={idx === activeHeatTab ? 'btn btn-primary' : 'btn btn-outline'}
                  onClick={() => setActiveHeatTab(idx)}
                >
                  {`Heat ${h.heatNo || `#${idx + 1}`}`}
                </button>
              ))}
            </div>

            {/* Visual Defects Checklist */}
            <h4 style={{ marginBottom: '12px' }}>Visual Defects Checklist</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {(() => {
                const hv = heatVisualData[activeHeatTab] || {};
                const selected = hv.selectedDefects || {};
                const counts = hv.defectCounts || {};
                return defectList.map((d) => {
                  const isNoDefect = d === 'No Defect';
                  const checked = selected[d];
                  const disabled = isNoDefect ? false : selected['No Defect'];
                  const isMatchingDefectType = !!checked;
                  const rowClassName = [
                    'checkbox-item',
                    'visual-defect-row',
                    isMatchingDefectType ? 'matching' : 'non-matching'
                  ].join(' ');
                  return (
                    <div key={d} className={rowClassName}>
                      <input
                        type="checkbox"
                        id={`defect-${d}`}
                        checked={!!checked}
                        onChange={() => handleDefectToggle(d)}
                        disabled={disabled}
                      />
                      <label htmlFor={`defect-${d}`}>{d}</label>
                      {!isNoDefect && selected[d] && (
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '140px' }}
                          value={counts[d]}
                          onChange={(e) => handleDefectCountChange(d, e.target.value)}
                          placeholder={`${d} Count`}
                          min="0"
                        />
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Dimensional Check - 3 column grid */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '16px' }}>Standard Diameter</h4>
            <div className="vm-form-grid">
              <div className="vm-form-group">
                <label className="vm-form-label">Product Model</label>
                <input type="text" className="vm-form-input" value={productModel} disabled />
              </div>
              <div className="vm-form-group">
                <label className="vm-form-label">Standard Rod Diameter (mm)</label>
                <input type="text" className="vm-form-input" value={standardDiameter || 'NA'} disabled />
              </div>
            </div>
          </div>

          {/* Dimensional Samples Grid */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '16px' }}>Dimensional Check (20 samples)</h4>
            <div className="dimensional-samples-grid">
              {(() => {
                const hv = heatVisualData[activeHeatTab] || {};
                const samples = hv.dimSamples || [];
                return samples.map((s, idx) => (
                  <div key={idx} className="vm-form-group dimensional-sample-card">
                    <label className="vm-form-label" style={{ marginBottom: '8px' }}>
                      Sample {idx + 1}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="vm-form-input"
                      value={s.diameter}
                      onChange={(e) => handleDimSampleChange(idx, e.target.value)}
                      placeholder="Bar Diameter (mm)"
                    />
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'material' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Material Testing (2 samples per Heat)</h3>
            <p className="card-subtitle">Chemical Analysis &amp; Mechanical Properties - Raw Material Specific</p>
          </div>
          <div className="alert alert-info" style={{ marginBottom: '24px' }}>
            ℹ️ Calibration status of testing instruments is verified and valid
          </div>

          {heats.map((heat, heatIndex) => (
              <div key={heatIndex} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4>Heat: {heat.heatNo || `#${heatIndex + 1}`} — Material Testing (2 samples)</h4>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Sample</th>
                        <th>%C</th>
                        <th>%Si</th>
                        <th>%Mn</th>
                        <th>%P</th>
                        <th>%S</th>
                        <th>Grain Size</th>
                        <th>Incl A</th>
                        <th>Incl B</th>
                        <th>Incl C</th>
                        <th>Incl D</th>
                        <th>Hardness</th>
                        <th>Decarb</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0, 1].map(sampleIndex => {
                        const sample = materialData[heatIndex]?.samples[sampleIndex] || {};
                        return (
                          <tr key={sampleIndex}>
                            <td><strong>{sampleIndex + 1}</strong></td>
                            <td>
                              <input type="number" step="0.01" className="form-control" style={{ width: '70px' }}
                                value={sample.c} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'c', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="0.01" className="form-control" style={{ width: '70px' }}
                                value={sample.si} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'si', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="0.01" className="form-control" style={{ width: '70px' }}
                                value={sample.mn} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'mn', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="0.01" className="form-control" style={{ width: '70px' }}
                                value={sample.p} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'p', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="0.01" className="form-control" style={{ width: '70px' }}
                                value={sample.s} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 's', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="1" className="form-control" style={{ width: '70px' }}
                                value={sample.grainSize} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'grainSize', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="0.1" className="form-control" style={{ width: '60px' }}
                                value={sample.inclA} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclA', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="0.1" className="form-control" style={{ width: '60px' }}
                                value={sample.inclB} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclB', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="0.1" className="form-control" style={{ width: '60px' }}
                                value={sample.inclC} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclC', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="0.1" className="form-control" style={{ width: '60px' }}
                                value={sample.inclD} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'inclD', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="1" className="form-control" style={{ width: '70px' }}
                                value={sample.hardness} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'hardness', e.target.value)} />
                            </td>
                            <td>
                              <input type="number" step="0.01" className="form-control" style={{ width: '70px' }}
                                value={sample.decarb} onChange={(e) => updateMaterialField(heatIndex, sampleIndex, 'decarb', e.target.value)} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default VisualMaterialTestingPage;

