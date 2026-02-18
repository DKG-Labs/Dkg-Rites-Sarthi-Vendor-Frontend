import React, { useState } from 'react';
import Tabs from '../components/Tabs';
import FormField from '../components/FormField';

const FinalProductDashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dimensional');
  const [lotSize, setLotSize] = useState(1000);

  // Simplified AQL calculation (IS 2500 simulation)
  const calculateAQL = (lot) => {
    if (lot <= 500) return { sampleSize: 50, bags: 5, acceptance: 2, rejection: 3 };
    if (lot <= 1200) return { sampleSize: 80, bags: 8, acceptance: 3, rejection: 4 };
    if (lot <= 3200) return { sampleSize: 125, bags: 13, acceptance: 5, rejection: 6 };
    return { sampleSize: 200, bags: 20, acceptance: 7, rejection: 8 };
  };

  const aqlResults = calculateAQL(lotSize);

  const tabs = [
    { id: 'dimensional', label: 'Dimensional &amp; Chemical Check' },
    { id: 'physical', label: 'Physical &amp; Mechanical Tests' },
    { id: 'visual', label: 'Visual Inspection &amp; Surface Defects' },
    { id: 'summary', label: 'Summary' },
  ];

  return (
    <div>
      <div className="breadcrumb">
        <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item">Inspection Initiation</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item breadcrumb-active">ERC Final Product</div>
      </div>

      <h1 style={{ marginBottom: 'var(--space-24)' }}>ERC Final Product Inspection</h1>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Final Product Traceability</h3>
        </div>
        <div className="input-grid">
          <FormField label="Raw Material IC Number(s)">
            <input type="text" className="form-control" value="IC-RM-2025-001, IC-RM-2025-002" disabled />
          </FormField>
          <FormField label="Process Inspection IC Number(s)">
            <input type="text" className="form-control" value="IC-PR-2025-001, IC-PR-2025-002" disabled />
          </FormField>
        </div>

        <div style={{ marginTop: 'var(--space-24)' }}>
          <h4 style={{ marginBottom: 'var(--space-16)' }}>AQL Calculation (IS 2500)</h4>
          <FormField label="Lot Size (No. of Pieces)" required>
            <input 
              type="number" 
              className="form-control" 
              value={lotSize}
              onChange={(e) => setLotSize(Number(e.target.value))}
            />
          </FormField>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Sample Size</div>
              <div className="stat-value">{aqlResults.sampleSize}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">No. of Bags</div>
              <div className="stat-value">{aqlResults.bags}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Acceptance Number</div>
              <div className="stat-value">{aqlResults.acceptance}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Rejection Number</div>
              <div className="stat-value">{aqlResults.rejection}</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'dimensional' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Dimensional &amp; Chemical Check - Final Product</h3>
            <p className="card-subtitle">Grid form for {aqlResults.sampleSize} samples as per AQL calculation</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sample No.</th>
                  <th>Length (mm)</th>
                  <th>Width (mm)</th>
                  <th>Diameter (mm)</th>
                  <th>Weight (grams)</th>
                  <th>Chemical Composition</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td><strong>{i}</strong></td>
                    <td><input type="number" className="form-control" step="0.1" placeholder="150.0" /></td>
                    <td><input type="number" className="form-control" step="0.1" placeholder="25.0" /></td>
                    <td><input type="number" className="form-control" step="0.1" placeholder="25.0" /></td>
                    <td><input type="number" className="form-control" step="0.1" placeholder="580.0" /></td>
                    <td><input type="text" className="form-control" placeholder="C: 0.55%" /></td>
                    <td>
                      <select className="form-control">
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </td>
                    <td><input type="text" className="form-control" placeholder="Remarks" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-12)' }}>Showing 5 of {aqlResults.sampleSize} samples</p>
        </div>
      )}

      {activeTab === 'physical' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Physical &amp; Mechanical Tests - Final Product</h3>
            <p className="card-subtitle">Grid form for mechanical testing of samples</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sample No.</th>
                  <th>Tensile Strength (MPa)</th>
                  <th>Yield Strength (MPa)</th>
                  <th>Elongation (%)</th>
                  <th>Hardness (HRC)</th>
                  <th>Impact Strength (J)</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td><strong>{i}</strong></td>
                    <td><input type="number" className="form-control" step="0.1" defaultValue="850" /></td>
                    <td><input type="number" className="form-control" step="0.1" defaultValue="650" /></td>
                    <td><input type="number" className="form-control" step="0.1" defaultValue="12" /></td>
                    <td><input type="number" className="form-control" step="0.1" defaultValue="48" /></td>
                    <td><input type="number" className="form-control" step="0.1" defaultValue="45" /></td>
                    <td>
                      <select className="form-control">
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </td>
                    <td><input type="text" className="form-control" placeholder="Remarks" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-12)' }}>Perform mechanical tests on selected samples from lot</p>
        </div>
      )}

      {activeTab === 'visual' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Visual Inspection &amp; Surface Defects - Final Product</h3>
            <p className="card-subtitle">Grid form for visual checks on samples</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sample No.</th>
                  <th>Surface Finish</th>
                  <th>Defects</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td><strong>{i}</strong></td>
                    <td>
                      <select className="form-control">
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
                        <div className="checkbox-item">
                          <input type="checkbox" id={`rust-${i}`} />
                          <label htmlFor={`rust-${i}`} style={{ fontSize: 'var(--font-size-xs)' }}>Rust</label>
                        </div>
                        <div className="checkbox-item">
                          <input type="checkbox" id={`scratch-${i}`} />
                          <label htmlFor={`scratch-${i}`} style={{ fontSize: 'var(--font-size-xs)' }}>Scratch</label>
                        </div>
                        <div className="checkbox-item">
                          <input type="checkbox" id={`dent-${i}`} />
                          <label htmlFor={`dent-${i}`} style={{ fontSize: 'var(--font-size-xs)' }}>Dent</label>
                        </div>
                        <div className="checkbox-item">
                          <input type="checkbox" id={`crack-${i}`} />
                          <label htmlFor={`crack-${i}`} style={{ fontSize: 'var(--font-size-xs)' }}>Crack</label>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select className="form-control">
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </td>
                    <td><input type="text" className="form-control" placeholder="Remarks" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 'var(--space-24)' }}>
            <h4 style={{ marginBottom: 'var(--space-12)' }}>Complete Defects Checklist</h4>
            <div className="checkbox-group">
              <div className="checkbox-item">
                <input type="checkbox" id="rust" />
                <label htmlFor="rust">Rust/Corrosion</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="scratches" />
                <label htmlFor="scratches">Scratches</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="dents" />
                <label htmlFor="dents">Dents</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="discoloration" />
                <label htmlFor="discoloration">Discoloration</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="cracks" />
                <label htmlFor="cracks">Cracks</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="pitting" />
                <label htmlFor="pitting">Pitting</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="misalignment" />
                <label htmlFor="misalignment">Misalignment</label>
              </div>
              <div className="checkbox-item">
                <input type="checkbox" id="surface" />
                <label htmlFor="surface">Surface Imperfection</label>
              </div>
            </div>
          </div>
          <div className="alert alert-success" style={{ marginTop: 'var(--space-16)' }}>
            ✓ No critical defects found in sampled products
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Final Product Summary - Auto-Compiled</h3>
              <p className="card-subtitle">Consolidated results from all Final Product inspection modules</p>
            </div>
            <div className="alert alert-success">
              ✓ Final product inspection completed successfully
            </div>
            <div style={{ marginBottom: 'var(--space-20)' }}>
              <h4 style={{ marginBottom: 'var(--space-12)' }}>AQL Calculation Summary (IS 2500):</h4>
              <div className="input-grid">
                <div><strong>Lot Size:</strong> {lotSize} pieces</div>
                <div><strong>Sample Size:</strong> {aqlResults.sampleSize} samples</div>
                <div><strong>Bags for Sampling:</strong> {aqlResults.bags} bags</div>
                <div><strong>Acceptance Number:</strong> {aqlResults.acceptance}</div>
                <div><strong>Rejection Number:</strong> {aqlResults.rejection}</div>
                <div><strong>Defects Found:</strong> 0</div>
              </div>
              <p style={{ marginTop: 'var(--space-12)' }}>Result: <strong style={{ color: 'var(--color-success)' }}>ACCEPTED</strong> (Defects (0) &lt; Acceptance Number ({aqlResults.acceptance}))</p>
            </div>
            <div style={{ marginBottom: 'var(--space-20)' }}>
              <h4 style={{ marginBottom: 'var(--space-12)' }}>Dimensional &amp; Chemical Check Results:</h4>
              <p><strong>Samples Tested:</strong> {aqlResults.sampleSize}</p>
              <p><strong>Passed:</strong> {aqlResults.sampleSize}</p>
              <p><strong>Failed:</strong> 0</p>
              <p>All dimensional parameters and chemical composition within specification</p>
            </div>
            <div style={{ marginBottom: 'var(--space-20)' }}>
              <h4 style={{ marginBottom: 'var(--space-12)' }}>Physical &amp; Mechanical Test Results:</h4>
              <p><strong>Average Values:</strong></p>
              <ul style={{ marginLeft: 'var(--space-20)' }}>
                <li>Tensile Strength: 850 MPa</li>
                <li>Yield Strength: 650 MPa</li>
                <li>Elongation: 12%</li>
                <li>Hardness: 48 HRC</li>
                <li>Impact Strength: 45 J</li>
              </ul>
              <p>All mechanical properties meet specifications</p>
            </div>
            <div style={{ marginBottom: 'var(--space-20)' }}>
              <h4 style={{ marginBottom: 'var(--space-12)' }}>Visual Inspection &amp; Surface Defects Results:</h4>
              <p><strong>Total Defects:</strong> 0 critical defects</p>
              <p><strong>Surface Finish:</strong> Good on all samples</p>
              <p>No rust, corrosion, cracks, or other critical defects found</p>
            </div>
          </div>
          <div className="card" style={{ marginTop: 'var(--space-24)' }}>
            <div className="card-header">
              <h3 className="card-title">Final Results - Final Product (Auto-Populated)</h3>
            </div>
            <div className="input-grid">
              <FormField label="Lot No.">
                <input type="text" className="form-control" value="LOT-FP-001" disabled style={{ background: 'var(--color-gray-200)' }} />
              </FormField>
              <FormField label="Sample Count">
                <input type="text" className="form-control" value={aqlResults.sampleSize} disabled style={{ background: 'var(--color-gray-200)' }} />
              </FormField>
              <FormField label="Status (Auto from AQL)">
                <input type="text" className="form-control" value="Accepted" disabled style={{ background: 'rgba(var(--color-success-rgb), 0.1)', color: 'var(--color-success)', fontWeight: 'var(--font-weight-bold)' }} />
              </FormField>
              <FormField label="Pass Count">
                <input type="text" className="form-control" value={aqlResults.sampleSize} disabled style={{ background: 'var(--color-gray-200)' }} />
              </FormField>
              <FormField label="Fail Count">
                <input type="text" className="form-control" value="0" disabled style={{ background: 'var(--color-gray-200)' }} />
              </FormField>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Remarks (Manual Entry, Required)" required>
                  <textarea className="form-control" rows="3" placeholder="Enter final remarks for this final product inspection..."></textarea>
                </FormField>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: 'var(--space-24)' }}>
            <div className="card-header">
              <h3 className="card-title">Accept/Reject Decision</h3>
            </div>
            <div className="input-grid">
              <FormField label="Product Status">
                <select className="form-control">
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </FormField>
              <FormField label="No. of Samples Tested">
                <input type="text" className="form-control" value={aqlResults.sampleSize} disabled style={{ background: 'var(--color-gray-200)' }} />
              </FormField>
              <FormField label="No. of Samples Passed">
                <input type="text" className="form-control" value={aqlResults.sampleSize} disabled style={{ background: 'var(--color-gray-200)' }} />
              </FormField>
              <FormField label="No. of Samples Failed">
                <input type="text" className="form-control" value="0" disabled style={{ background: 'var(--color-gray-200)' }} />
              </FormField>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Overall Remarks (IE Manual Entry)" required>
                  <textarea className="form-control" rows="4" placeholder="Enter overall remarks for final product inspection certificate..."></textarea>
                </FormField>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-16)', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline">Save Draft</button>
              <button className="btn btn-secondary" onClick={() => { if (window.confirm('Are you sure you want to reject this lot?')) { alert('Final Product lot rejected'); } }}>Reject Lot</button>
              <button className="btn btn-primary" onClick={() => { alert('Final Product accepted! Inspection Certificate generated successfully!'); onBack(); }}>Accept &amp; Generate Certificate</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-24)' }}>
        <button className="btn btn-secondary" onClick={onBack}>Return to Landing Page</button>
      </div>
    </div>
  );
};

export default FinalProductDashboard;
