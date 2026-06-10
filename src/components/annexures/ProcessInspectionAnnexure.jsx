import React, { useState, useEffect } from 'react';
import AnnexureLayout from './AnnexureLayout';
import './ProcessInspectionAnnexure.css';
import { annexureService } from '../../services/annexureService';

const ProcessInspectionAnnexure = ({ data = [], selectedCall }) => {
  const [remarksState, setRemarksState] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loadingRemarks, setLoadingRemarks] = useState(false);

  // Initialize remarks from data
  useEffect(() => {
    if (data && data.length > 0) {
      const initialRemarks = {};
      data.forEach((entry, index) => {
        initialRemarks[index] = entry.remarks || '';
      });
      setRemarksState(initialRemarks);
    }
  }, [data]);

  const handleSaveRemark = async (index, entry) => {
    setLoadingRemarks(true);
    try {
      await annexureService.updateProcessRemarks({
        callNo: selectedCall?.call_no || entry.caseNoIbs,
        shift: entry.shift,
        lineNo: entry.lineNo,
        lotNo: entry.lotNo,
        remarks: remarksState[index]
      });
      setEditingId(null);
    } catch (error) {
      console.error("Failed to save remarks:", error);
      alert("Failed to save remarks. Please try again.");
    } finally {
      setLoadingRemarks(false);
    }
  };
  
  // Custom Header matching the reference image perfectly
  const ProcessHeader = () => (
    <table className="pi-header-custom-table">
      <tbody>
        <tr>
          <td className="pi-h-col-1">
            <div className="pi-h-logo-box">
              <img src="/login-assets/riteslogo.png" alt="RITES" className="pi-h-logo" />
              <div className="pi-h-company-info">
                <div className="pi-h-hindi">राइट्स लिमिटेड</div>
                <div className="pi-h-hindi-sub">(गुणवत्ता आश्वासन विभाग)</div>
                <div className="pi-h-english">RITES LTD (QA DIVISION)</div>
              </div>
            </div>
          </td>
          <td className="pi-h-col-2">
            <div className="pi-h-title-hindi">निरीक्षण एवं जाँच योजना <b>INSPECTION & TEST PLAN</b></div>
            <div className="pi-h-sub-title"><b>ELASTIC RAIL CLIP</b></div>
            <div className="pi-h-reg-title"><b><u>PROCESS INSPECTION REGISTER</u></b></div>
            <div className="pi-h-ref-text">
              <b><u>(Ref.: RB letter No. 2024/RS(G)/779/12 (E3482675) dated. 06.01.25 & RB letter No.<br />2024/RS(G)/779/12 (E3482675) dated 27.01.25 )</u></b>
            </div>
          </td>
          <td className="pi-h-col-3">
            <div className="pi-h-format-box">
              <div className="pi-h-format-label">Format No.</div>
              <div className="pi-h-format-value">F/ERC-01</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );

  // Helper to split reading string (e.g. "R1, R2, R3") into individual values
  const getReadingValue = (readingStr, index) => {
    if (!readingStr || readingStr === '-') return '-';
    const values = readingStr.split(',').map(v => v.trim());
    return values[index] || '-';
  };

  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="no-data-alert">No inspection data available for the selected shift.</div>;
  }

  return (
    <div className="process-inspection-annexure">
      {data.map((entry, index) => (
        <AnnexureLayout key={index} className="itp-page portrait">
          <ProcessHeader />

          <div className="pi-info-container">
            <table className="pi-info-main-table">
              <tbody>
                <tr className="pi-row-1">
                  <td className="pi-r1-c1">Date</td>
                  <td className="pi-r1-c2">{entry.date || ''}</td>
                  <td className="pi-row-center-label">Shift:</td>
                  <td className="pi-row-center-value">{entry.shift}</td>
                  <td className="pi-row-center-label">Line No:</td>
                  <td className="pi-row-center-value">{entry.lineNo || '-'}</td>
                  <td className="pi-r1-c4">Lot No.</td>
                  <td className="pi-r1-c5">{entry.lotNo || ''}</td>
                </tr>
                <tr className="pi-row-2">
                  <td className="pi-r2-c1" colSpan={2}>PO No. & Date</td>
                  <td className="pi-r2-c2" colSpan={2}>{entry.poNoAndDate || ''}</td>
                  <td className="pi-row-center-label">Heat No:</td>
                  <td className="pi-row-center-value">{entry.heatNo || ' - '}</td>
                  <td className="pi-r2-c3">Nos. of ERC produced during the shift</td>
                  <td className="pi-r2-c4">{entry.ercProducedDuringShift || ''}</td>
                </tr>
                <tr className="pi-row-3">
                  <td className="pi-r2-c1" colSpan={2}>Call No. (SARTHI) & Date</td>
                  <td className="pi-r2-c2" colSpan={2}>{entry.callNoAndDate || ''}</td>
                  <td className="pi-row-center-label">Mfg Name:</td>
                  <td className="pi-row-center-value">{(entry.mfgName || ' - ').replace(/~/g, ', ')}</td>
                  <td className="pi-r2-c3">Name of Inspecting Engineer</td>
                  <td className="pi-r2-c4">{entry.inspectingEngineerName || ''}</td>
                </tr>
              </tbody>
            </table>
            <table className="pi-info-row-table pi-r4">
              <tbody>
                <tr>
                  <td className="pi-r4-c1" colSpan={2}>Raw material (Stage) IC No. & date</td>
                  <td className="pi-r4-c2" colSpan={4}>{entry.rawMaterialIcNoAndDate || ''}</td>
                  <td className="pi-r4-c3">ERC Type</td>
                  <td className="pi-r4-c4">{entry.ercType || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <table className="pi-register-table">
            <thead>
              <tr className="pi-header-row">
                <th className="pi-sr-col" rowSpan="2">Sr.<br />No.</th>
                <th className="pi-activity-col">Time</th>
                {entry.hourLabels.map((h, i) => (
                  <th key={i} className="pi-time-col">
                    {h}
                  </th>
                ))}
                <th className="pi-remarks-col" rowSpan="2">Remarks Accepted <u>OR</u> Not-accepted</th>
              </tr>
              <tr className="pi-header-row">
                <th className="pi-activity-col">Activities</th>
                {entry.hourLabels.map((_, i) => <th key={i}></th>)}
              </tr>
            </thead>
            <tbody>
              {entry.rows.map((row, rowIdx) => {
                let subRowsCount = 1;
                if (row.activity.includes("(3 bars/Hr.)")) subRowsCount = 3;
                else if (row.activity.includes("(2 ERCs/Hr.)")) subRowsCount = 2;
                
                const totalRowSpan = subRowsCount;

                return (
                  <React.Fragment key={rowIdx}>
                    {/* Primary Row / First Data Sub-Row */}
                    <tr className="pi-data-row">
                      <td rowSpan={totalRowSpan}>{row.srNo}.</td>
                      <td className="pi-activity-col" rowSpan={totalRowSpan}>
                        <div className="pi-activity-text">{row.activity}</div>
                      </td>
                      
                      {row.srNo === 13 ? (
                        <>
                          {row.hourlyData.map((val, hIdx) => {
                            return (
                              <td key={hIdx} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>
                                {val}
                              </td>
                            );
                          })}
                        </>
                      ) : row.srNo === 5 ? (
                        <td colSpan={entry.hourLabels.length} style={{ textAlign: 'center', fontWeight: 'bold', letterSpacing: '2px' }}>
                          NOT APPLICABLE
                        </td>
                      ) : (
                        <>
                          {entry.hourLabels.map((_, hIdx) => (
                            <td key={hIdx}>{getReadingValue(row.hourlyData[hIdx], 0)}</td>
                          ))}
                        </>
                      )}
                      
                      {row.remarks !== 'N/A' && (
                        <td className="pi-remarks-col" rowSpan={totalRowSpan}>
                          <span className={row.remarks === 'Not-accepted' ? 'text-rejected' : 'text-accepted'}>
                            {row.remarks}
                          </span>
                        </td>
                      )}
                    </tr>

                    {/* Additional Data Sub-Rows */}
                    {subRowsCount > 1 && Array.from({ length: subRowsCount - 1 }).map((_, subIdx) => (
                      <tr key={`sub-${subIdx}`} className="pi-data-row sub-row">
                        {entry.hourLabels.map((_, hIdx) => (
                          <td key={hIdx}>{getReadingValue(row.hourlyData[hIdx], subIdx + 1)}</td>
                        ))}
                      </tr>
                    ))}

                    {/* Special Row 6: Checking of Die sub-description */}
                    {row.srNo === 6 && (
                      <tr className="pi-data-row detail-row">
                        <td></td>
                        <td colSpan={1 + entry.hourLabels.length + 1} className="pi-horizontal-detail">
                          At the start of shift. (if Production per shift is more than 4000 ERCs, additional <strong>check in the middle of the shift</strong>)
                        </td>
                      </tr>
                    )}

                    {/* Special Row 7: Quenching sub-description */}
                    {row.srNo === 7 && (
                      <tr className="pi-data-row detail-row">
                        <td></td>
                        <td colSpan={1 + entry.hourLabels.length + 1} className="pi-horizontal-detail">
                          (Temp. to be checked every hour. Duration to be checked at <strong>the start of the shift</strong>)
                        </td>
                      </tr>
                    )}

                    {/* Special Row 9: Tempering sub-description */}
                    {row.srNo === 9 && (
                      <tr className="pi-data-row detail-row">
                        <td></td>
                        <td colSpan={1 + entry.hourLabels.length + 1} className="pi-horizontal-detail">
                          (Temp. to be checked every hour. Duration to be checked at <strong>the start of the shift</strong>)
                        </td>
                      </tr>
                    )}

                    {/* Special Row 14: Documentation */}
                    {row.srNo === 14 && (
                       <tr className="pi-data-row detail-row">
                        <td style={{ borderTop: '1px solid #000' }}></td>
                        <td colSpan={1 + entry.hourLabels.length + 1} className="pi-horizontal-detail" style={{ borderTop: '1px solid #000' }}>
                           Specific details/results of all the checks should be recorded
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          <div className="pi-note-section">
            (NOTE: &nbsp;&nbsp; In case of any discrepancy observed, the same shall be immediately informed to Quality in-charge/Shift in-charge verbally and also to be communicated the same through E-mail)
          </div>

          <div className="pi-bottom-remarks">
            <div className="pi-remark-header">
              <div className="pi-remark-title">Remark-</div>
              {editingId !== index ? (
                <button 
                  className="btn-edit-remarks no-print" 
                  onClick={() => setEditingId(index)}
                  disabled={loadingRemarks}
                >
                  Edit Remark
                </button>
              ) : (
                <span className="editing-badge no-print">Editing Mode</span>
              )}
            </div>
            
            {editingId === index ? (
              <div className="pi-remarks-edit-box no-print">
                <textarea
                  className="pi-remarks-textarea"
                  value={remarksState[index] || ''}
                  onChange={(e) => setRemarksState({...remarksState, [index]: e.target.value})}
                  placeholder="Enter manual remarks here..."
                  rows={4}
                />
                <div className="pi-remarks-actions">
                  <button 
                    className="btn-save-remark" 
                    onClick={() => handleSaveRemark(index, entry)}
                    disabled={loadingRemarks}
                  >
                    {loadingRemarks ? 'Saving...' : 'Save Remark'}
                  </button>
                  <button 
                    className="btn-cancel-remark" 
                    onClick={() => setEditingId(null)}
                    disabled={loadingRemarks}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="pi-remarks-display-box">
                {remarksState[index] && (
                  <div className="pi-remark-content">{remarksState[index]}</div>
                )}
              </div>
            )}
          </div>

          <div className="pi-signature-block">
            <u>(Signature of RITES Engineer)</u>
          </div>
        </AnnexureLayout>
      ))}
    </div>
  );
};

export default ProcessInspectionAnnexure;
