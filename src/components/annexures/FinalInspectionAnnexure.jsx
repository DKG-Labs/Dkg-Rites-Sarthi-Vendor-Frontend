import React from 'react';
import '../AnnexureTemplate.css';
import './FinalInspectionAnnexure.css';
import AnnexureHeader from './AnnexureHeader';

/**
 * Final Inspection Report Annexure
 * Dimensions inspection with specified parameters
 */

const FinalInspectionAnnexure = ({ data = [], selectedCall }) => {

  // Sample data rows
  const sampleRows = data.length > 0 ? data : [
    { sNo: 1, parameter: 'Length', mkIII: '107.5', mkV: '110', samplesPassed: '', samplesFailed: '' },
    { sNo: 2, parameter: 'Dimension', mkIII: '54', mkV: '54', samplesPassed: '', samplesFailed: '' },
    { sNo: 3, parameter: 'Dimension', mkIII: '15', mkV: '15', samplesPassed: '', samplesFailed: '' },
    { sNo: 4, parameter: 'Dimension', mkIII: '42.5', mkV: '42.5', samplesPassed: '', samplesFailed: '' },
    { sNo: 5, parameter: 'Dimension', mkIII: '39.5', mkV: '41.8', samplesPassed: '', samplesFailed: '' },
    { sNo: 6, parameter: 'Width', mkIII: '33.5/48.7', mkV: '34.7/48.7', samplesPassed: '', samplesFailed: '' },
    { sNo: 7, parameter: 'Height 1', mkIII: '68', mkV: '68', samplesPassed: '', samplesFailed: '' },
    { sNo: 8, parameter: 'Height 2', mkIII: '48', mkV: '50.5', samplesPassed: '', samplesFailed: '' },
    { sNo: 9, parameter: 'Height 3', mkIII: '21.2', mkV: '21.2', samplesPassed: '', samplesFailed: '' },
    { sNo: 10, parameter: 'Gap', mkIII: '4.9', mkV: '4.9', samplesPassed: '', samplesFailed: '' },
    { sNo: 11, parameter: 'Straight length', mkIII: '75', mkV: '82', samplesPassed: '', samplesFailed: '' },
    { sNo: 12, parameter: 'Pressing size', mkIII: '35 ± 2*\n12 (-1/-2)*', mkV: '35 ± 2*\n12 (-1/-2)*', samplesPassed: '', samplesFailed: '' },
    { sNo: 13, parameter: 'Diameter', mkIII: '20.64 (+0.2/-0.17)*', mkV: '23(-0.23/-0.19)*\n20.64 (+0.2/-0.15)*', samplesPassed: '', samplesFailed: '' }
  ];

  return (
    <div className="annexure-template final-inspection-annexure">
      {/* HEADER SECTION */}
      <AnnexureHeader
        selectedCall={selectedCall}
        pageNo="11 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Final Inspection Report"
        subtitle="Dimensions (in mm)"
        additionalInfo="(All dimension to be checked with RDSO approved gauges/calibrated instruments & details as per Annexure IX to be maintained)"
        annexureNumber="Lot No.:-"
      />

      {/* FINAL INSPECTION TABLE */}
      <div className="annexure-table-wrapper">
        <table className="annexure-table final-inspection-table">
          <thead>
            {/* Header Row 1 */}
            <tr>
              <th rowSpan="2" className="annexure-th">S. No.</th>
              <th rowSpan="2" className="annexure-th">Parameter</th>
              <th colSpan="2" className="annexure-th">Specified (mm)</th>
              <th colSpan="2" className="annexure-th">Observation</th>
            </tr>
            {/* Header Row 2 */}
            <tr>
              <th className="annexure-th sub-header">MK-III<br/>Drg. No.<br/>(T-3701)</th>
              <th className="annexure-th sub-header">MK-V<br/>Drg. No.<br/>(T-5919)</th>
              <th className="annexure-th sub-header">No. of<br/>samples passed</th>
              <th className="annexure-th sub-header">No. of samples<br/>failed</th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, index) => (
              <tr key={index}>
                <td className="annexure-td">{row.sNo}</td>
                <td className="annexure-td">{row.parameter}</td>
                <td className="annexure-td data-cell" style={{ whiteSpace: 'pre-line' }}>{row.mkIII}</td>
                <td className="annexure-td data-cell" style={{ whiteSpace: 'pre-line' }}>{row.mkV}</td>
                <td className="annexure-td data-cell">{row.samplesPassed}</td>
                <td className="annexure-td data-cell">{row.samplesFailed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinalInspectionAnnexure;

