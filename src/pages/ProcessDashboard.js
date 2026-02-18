import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import Tabs from '../components/Tabs';
import CalibrationModule from '../components/CalibrationModule';
import FormField from '../components/FormField';

const ProcessDashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('preInspection');
  const [selectedLine, setSelectedLine] = useState('Line-1');
  const [oilTankCounter, setOilTankCounter] = useState(45000);
  const [lotNumbers, setLotNumbers] = useState(['LOT-001']);
  const [newLotNo, setNewLotNo] = useState('');
  const [heatNumbersMap, setHeatNumbersMap] = useState({ 'LOT-001': 'H001' });
  const [shearingPress, setShearingPress] = useState(true);
  const [forgingPress, setForgingPress] = useState(true);
  const [reheatingFurnace, setReheatingFurnace] = useState(true);
  const [quenchingTime, setQuenchingTime] = useState(true);
  const [cleaningDone, setCleaningDone] = useState(false);
  const [shearingData] = useState(Array(8).fill(null).map((_, i) => ({ hour: i + 1, noProduction: false, lotNo: '', lengthCutBar: '', sharpEdges: false, acceptedQty: '', rejectedQty: '', remarks: '' })));
  const [turningData] = useState(Array(8).fill(null).map((_, i) => ({ hour: i + 1, noProduction: false, lotNo: '', straightLength: '', taperLength: '', dia: '', acceptedQty: '', rejectedQty: '', remarks: '' })));

  const addLotNumber = () => {
    if (newLotNo && !lotNumbers.includes(newLotNo)) {
      setLotNumbers([...lotNumbers, newLotNo]);
      setNewLotNo('');
    }
  };

  const updateHeatNumber = (lotNo, heatNo) => {
    setHeatNumbersMap({ ...heatNumbersMap, [lotNo]: heatNo });
  };


  const handleCleaningDone = (checked) => {
    if (checked && window.confirm('Are you sure the oil tank cleaning is complete? This will reset the counter to 0.')) {
      setCleaningDone(true);
      setOilTankCounter(0);
    } else {
      setCleaningDone(false);
    }
  };

  const tabs = [
    { id: 'calibration', label: 'Calibration & Documents' },
    { id: 'periodic', label: 'Static Periodic Check' },
    { id: 'oil', label: 'Oil Tank Counter' },
    { id: 'preInspection', label: 'Process Parameters - 8 Hour Grid' },
    { id: 'summary', label: 'Summary / Reports' },
  ];

  const manufacturingLines = ['Line-1', 'Line-2', 'Line-3'];

  // removed unused hourly data and validators to satisfy lint rules

  return (
    <div>
      <div className="breadcrumb">
        <div className="breadcrumb-item" onClick={onBack} style={{ cursor: 'pointer' }}>Landing Page</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item">Inspection Initiation</div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item breadcrumb-active">ERC Process</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)' }}>
        <h1>ERC Process Inspection</h1>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Process Initiation &amp; Traceability</h3>
        </div>
        <div className="input-grid">
          <FormField label="Raw Material IC Number(s)">
            <input type="text" className="form-control" value="IC-RM-2025-001, IC-RM-2025-002" disabled />
          </FormField>
          <FormField label="Manufacturing Line Number" required>
            <select className="form-control" value={selectedLine} onChange={(e) => setSelectedLine(e.target.value)}>
              {manufacturingLines.map(line => (
                <option key={line} value={line}>{line}</option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="alert alert-success" style={{ marginTop: 'var(--space-16)' }}>
          ✓ Qty Accepted in RM (50 bars) ≥ Qty Accepted in Process (42 bars)
        </div>
      </div>

      <div className="line-toggle">
        {manufacturingLines.map(line => (
          <button
            key={line}
            className={`line-toggle-btn ${selectedLine === line ? 'active' : ''}`}
            onClick={() => setSelectedLine(line)}
          >
            {line}
          </button>
        ))}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'preInspection' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pre-Inspection Data Entry - {selectedLine}</h3>
            <p className="card-subtitle">3 readings/hour</p>
          </div>
          <div style={{ marginBottom: 'var(--space-24)' }}>
            <h4 style={{ marginBottom: 'var(--space-16)' }}>Lot Number Entry</h4>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-12)' }}><strong>Multiple Lot Numbers can be added.</strong> Add all lot numbers for this inspection.</p>
            <div style={{ marginBottom: 'var(--space-16)' }}>
              <div className="input-grid">
                <FormField>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Lot No. (e.g., LOT-002)"
                    value={newLotNo}
                    onChange={(e) => setNewLotNo(e.target.value)}
                  />
                </FormField>
                <div style={{ alignSelf: 'end' }}>
                  <button className="btn btn-primary" onClick={addLotNumber}>+ Add Lot Number</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
              {lotNumbers.map(lot => (
                <span key={lot} className="status-badge valid">{lot}</span>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-24)' }}>
            <h4 style={{ marginBottom: 'var(--space-16)' }}>Heat Number Selection</h4>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-warning)', marginBottom: 'var(--space-12)', fontWeight: 'var(--font-weight-medium)' }}>⚠ <strong>CONSTRAINT:</strong> Heat No. has to be selected for Each Lot No.</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lot Number</th>
                    <th>Heat Number (from previous stage/RM IC)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lotNumbers.map(lot => (
                    <tr key={lot}>
                      <td><strong>{lot}</strong></td>
                      <td>
                        <select 
                          className="form-control" 
                          value={heatNumbersMap[lot] || ''}
                          onChange={(e) => updateHeatNumber(lot, e.target.value)}
                        >
                          <option value="">Select Heat Number</option>
                          <option value="H001">H001</option>
                          <option value="H002">H002</option>
                          <option value="H003">H003</option>
                          <option value="H004">H004</option>
                          <option value="H005">H005</option>
                        </select>
                      </td>
                      <td>
                        {heatNumbersMap[lot] ? <StatusBadge status="Valid" /> : <span style={{ color: 'var(--color-error)', fontWeight: 'var(--font-weight-medium)' }}>Required</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="alert alert-info" style={{ marginTop: 'var(--space-24)' }}>
            ℹ️ <strong>Info:</strong> 3 readings per hour are required for all process parameters
          </div>
        </div>
      )}

      {activeTab === 'calibration' && <CalibrationModule />}

      {activeTab === 'periodic' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Static Periodic Check - {selectedLine}</h3>
            <p className="card-subtitle">Required field - All checks must be completed</p>
          </div>
          <div className="checkbox-group" style={{ gridTemplateColumns: '1fr' }}>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="shearingPress"
                checked={shearingPress}
                onChange={(e) => setShearingPress(e.target.checked)}
              />
              <label htmlFor="shearingPress" style={{ fontWeight: 'var(--font-weight-medium)' }}>Is Shearing Press Capacity &gt;= 100MT? (Yes/No)</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="forgingPress"
                checked={forgingPress}
                onChange={(e) => setForgingPress(e.target.checked)}
              />
              <label htmlFor="forgingPress" style={{ fontWeight: 'var(--font-weight-medium)' }}>Is Forging Press Capacity &gt;= 150MT? (Yes/No)</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="reheatingFurnace"
                checked={reheatingFurnace}
                onChange={(e) => setReheatingFurnace(e.target.checked)}
              />
              <label htmlFor="reheatingFurnace" style={{ fontWeight: 'var(--font-weight-medium)' }}>Is type of Reheating Furnace Induction Type? (Yes/No)</label>
            </div>
            <div className="checkbox-item">
              <input 
                type="checkbox" 
                id="quenchingTime"
                checked={quenchingTime}
                onChange={(e) => setQuenchingTime(e.target.checked)}
              />
              <label htmlFor="quenchingTime" style={{ fontWeight: 'var(--font-weight-medium)' }}>Is Quenching Done within 20 seconds after completion of Forging? (Yes/No)</label>
            </div>
          </div>
          {shearingPress && forgingPress && reheatingFurnace && quenchingTime && (
            <div className="alert alert-success" style={{ marginTop: 'var(--space-24)' }}>
              ✓ All static periodic checks passed
            </div>
          )}
        </div>
      )}

      {activeTab === 'oil' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Oil Tank Counter Sub-Module - {selectedLine}</h3>
            <p className="card-subtitle">No. of ERC quenched since last Cleaning of Oil Tank</p>
          </div>
          <div style={{ padding: 'var(--space-24)', background: 'var(--color-bg-2)', borderRadius: 'var(--radius-base)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>Auto-Running Counter</div>
            <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-16)', color: oilTankCounter >= 99000 ? 'var(--color-error)' : oilTankCounter >= 90000 ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {oilTankCounter.toLocaleString()} ERCs
            </div>
            {oilTankCounter >= 90000 && oilTankCounter < 99000 && (
              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-16)' }}>
                ⚠ ALERT: Counter reached 90,000 - Oil tank cleaning recommended soon
              </div>
            )}
            {oilTankCounter >= 99000 && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-16)' }}>
                🔒 LOCKED: Counter at 99,000 - Quenching entry section is DISABLED. Oil tank cleaning must be completed and counter reset to continue.
              </div>
            )}
            <div style={{ marginTop: 'var(--space-24)', padding: 'var(--space-20)', background: 'var(--color-surface)', borderRadius: 'var(--radius-base)' }}>
              <div className="checkbox-item" style={{ justifyContent: 'center' }}>
                <input 
                  type="checkbox" 
                  id="cleaningDone"
                  checked={cleaningDone}
                  onChange={(e) => handleCleaningDone(e.target.checked)}
                  disabled={oilTankCounter === 0}
                />
                <label htmlFor="cleaningDone" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)' }}>Cleaning done in current shift?</label>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-12)' }}>When checked: Counter resets to 0 and starts counting from 0</p>
            </div>
          </div>
          {oilTankCounter >= 99000 && (
            <div style={{ marginTop: 'var(--space-24)', padding: 'var(--space-16)', background: 'rgba(var(--color-error-rgb), 0.1)', borderRadius: 'var(--radius-base)' }}>
              <h4 style={{ color: 'var(--color-error)', marginBottom: 'var(--space-12)' }}>Quenching Entry Section - LOCKED</h4>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>This section is disabled until oil tank cleaning is completed and counter is reset.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'summary' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Inspection Summary - Auto-Compiled from All Sub-Modules</h3>
              <p className="card-subtitle">Consolidated overview of all inspection and testing activities</p>
            </div>
            <div className="alert alert-success">
              ✓ Process inspection for {selectedLine} completed
            </div>
            <div style={{ marginBottom: 'var(--space-24)' }}>
              <h4 style={{ marginBottom: 'var(--space-12)' }}>Pre-Inspection Data:</h4>
              <p><strong>Lot Numbers:</strong> {lotNumbers.join(', ')}</p>
              <p><strong>Heat Numbers Mapped:</strong> {Object.entries(heatNumbersMap).map(([lot, heat]) => `${lot} → ${heat}`).join(', ')}</p>
            </div>
            <div style={{ marginBottom: 'var(--space-24)' }}>
              <h4 style={{ marginBottom: 'var(--space-12)' }}>Static Periodic Checks:</h4>
              <p>Shearing Press ≥ 100MT: {shearingPress ? '✓ Yes' : '✗ No'}</p>
              <p>Forging Press ≥ 150MT: {forgingPress ? '✓ Yes' : '✗ No'}</p>
              <p>Reheating Furnace Induction Type: {reheatingFurnace ? '✓ Yes' : '✗ No'}</p>
              <p>Quenching within 20 seconds: {quenchingTime ? '✓ Yes' : '✗ No'}</p>
            </div>
            <div style={{ marginBottom: 'var(--space-24)' }}>
              <h4 style={{ marginBottom: 'var(--space-12)' }}>Oil Tank Counter:</h4>
              <p>Current Count: {oilTankCounter.toLocaleString()} ERCs</p>
              <p>Status: {oilTankCounter >= 99000 ? '🔒 Locked' : oilTankCounter >= 90000 ? '⚠ Alert' : '✓ Normal'}</p>
            </div>
            <div style={{ marginBottom: 'var(--space-24)' }}>
              <h4 style={{ marginBottom: 'var(--space-12)' }}>Shearing Section - Accepted/Rejected Quantities:</h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Hour</th>
                      <th>Lot No.</th>
                      <th>Accepted</th>
                      <th>Rejected</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shearingData.filter(h => !h.noProduction && h.lotNo).map(h => (
                      <tr key={h.hour}>
                        <td>Hour {h.hour}</td>
                        <td>{h.lotNo}</td>
                        <td>{h.acceptedQty || 0}</td>
                        <td>{h.rejectedQty || 0}</td>
                        <td>{h.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginBottom: 'var(--space-24)' }}>
              <h4 style={{ marginBottom: 'var(--space-12)' }}>Turning Section - Accepted/Rejected Quantities:</h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Hour</th>
                      <th>Lot No.</th>
                      <th>Accepted</th>
                      <th>Rejected</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turningData.filter(h => !h.noProduction && h.lotNo).map(h => (
                      <tr key={h.hour}>
                        <td>Hour {h.hour}</td>
                        <td>{h.lotNo}</td>
                        <td>{h.acceptedQty || 0}</td>
                        <td>{h.rejectedQty || 0}</td>
                        <td>{h.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginBottom: 'var(--space-24)' }}>
              <h4 style={{ marginBottom: 'var(--space-12)' }}>Calibration Status:</h4>
              <p>All instruments are calibrated and within valid range</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Final Inspection Results (Auto-Populated)</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Heat No.</th>
                    <th>Accepted / Rejected</th>
                    <th>Weight of Material (Auto)</th>
                    <th>Remarks (Manual Entry, Required)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(heatNumbersMap).map(heat => (
                    <tr key={heat}>
                      <td><strong>{heat}</strong></td>
                      <td><StatusBadge status="Valid" /> Accepted</td>
                      <td>850 kg</td>
                      <td>
                        <input type="text" className="form-control" placeholder="Enter remarks..." />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">IE Final Review</h3>
            </div>
            <FormField label="IE Remarks / Notes" required>
              <textarea className="form-control" rows="4" placeholder="Enter your final remarks..."></textarea>
            </FormField>
            <div style={{ display: 'flex', gap: 'var(--space-16)', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline">Pause Inspection</button>
              <button className="btn btn-secondary" onClick={() => { if (window.confirm('Are you sure you want to reject this process?')) { alert('Process rejected'); } }}>Reject Process</button>
              <button className="btn btn-primary" onClick={() => { alert('Process accepted and inspection completed!'); onBack(); }}>Accept &amp; Complete</button>
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

export default ProcessDashboard;
