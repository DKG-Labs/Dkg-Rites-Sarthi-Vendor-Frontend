import React from 'react';
import '../AnnexureTemplate.css';
import './FinalChemicalAnalysisAnnexure.css';
import AnnexureHeader from './AnnexureHeader';

/**
 * Final Inspection Report - Chemical Analysis Annexure
 * Annexure-VI for final chemical analysis inspection
 */

const FinalChemicalAnalysisAnnexure = ({ data = [], selectedCall }) => {

  // Ensure data is an array - handle both flat array and DTO with rows
  const processedData = Array.isArray(data) ? data : (data?.rows || []);
  
  // Sample data rows - use real data if available, otherwise fallback to placeholders
  const sampleRows = processedData.length > 0 ? processedData : [
    { sNo: 1, castHeatNo: '', colourCode: '', lotNo: '', quantityEa: '', sampleSize: '', c: '', mn: '', si: '', s: '', p: '', remark: '', acceptedOrRejected: '', signOfSupervisor: '' },
    { sNo: 2, castHeatNo: '', colourCode: '', lotNo: '', quantityEa: '', sampleSize: '', c: '', mn: '', si: '', s: '', p: '', remark: '', acceptedOrRejected: '', signOfSupervisor: '' },
    { sNo: 3, castHeatNo: '', colourCode: '', lotNo: '', quantityEa: '', sampleSize: '', c: '', mn: '', si: '', s: '', p: '', remark: '', acceptedOrRejected: '', signOfSupervisor: '' }
  ];

  return (
    <div className="annexure-template final-chemical-analysis-annexure">
      {/* HEADER SECTION */}
      <AnnexureHeader
        selectedCall={selectedCall}
        pageNo="12 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Final Inspection Report"
        subtitle="Test Result- Chemical Analysis"
        annexureNumber="Annexure-VI"
        annexureCode="IRST-31-2025"
      />

      {/* CHEMICAL ANALYSIS TABLE */}
      <div className="annexure-table-wrapper">
        <table className="annexure-table final-chemical-table">
          <thead>
            {/* Row 1: Main headers and Chemical Element Names */}
            <tr>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">S. No.</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Cast / Heat No.</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Colour Code</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Lot No.</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Quantity (in nos.)</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Sample size</div></th>
              <th className="annexure-th spec-label-cell">Parameter</th>
              <th className="annexure-th sub-header">% C</th>
              <th className="annexure-th sub-header">% Mn</th>
              <th className="annexure-th sub-header">% Si</th>
              <th className="annexure-th sub-header">% S</th>
              <th className="annexure-th sub-header">% P</th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Remark</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Accepted or Rejected</div></th>
              <th rowSpan="3" className="annexure-th rotated-header"><div className="rotated-text">Sign of Lab. Supervisor</div></th>
            </tr>
            {/* Row 2: Ladle Analysis specifications */}
            <tr>
              <th className="annexure-th spec-label-cell">Ladle analysis</th>
              <th className="annexure-th spec-value">0.5 to 0.6</th>
              <th className="annexure-th spec-value">0.8 to 1.0</th>
              <th className="annexure-th spec-value">1.5 to 2.00</th>
              <th className="annexure-th spec-value">0.03 max</th>
              <th className="annexure-th spec-value">0.03 max</th>
            </tr>
            {/* Row 3: Tolerance specifications */}
            <tr>
              <th className="annexure-th spec-label-cell">Permissible range over<br/>ladle sample analysis</th>
              <th className="annexure-th spec-value">± 0.03</th>
              <th className="annexure-th spec-value">± 0.04</th>
              <th className="annexure-th spec-value">± 0.05</th>
              <th className="annexure-th spec-value">± 0.005</th>
              <th className="annexure-th spec-value">± 0.005</th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, index) => (
              <tr key={index}>
                <td className="annexure-td">{index + 1}</td>
                <td className="annexure-td data-cell">{row.heatNo || ''}</td>
                <td className="annexure-td data-cell">{row.colourCode || ''}</td>
                <td className="annexure-td data-cell">{row.lotNo || ''}</td>
                <td className="annexure-td data-cell">{row.qtyNo || row.quantity || row.quantityEa || ''}</td>
                <td className="annexure-td data-cell">{row.sampleSize || ''}</td>
                <td className="annexure-td empty-cell"></td>
                <td className="annexure-td data-cell">{row.carbonPercent || ''}</td>
                <td className="annexure-td data-cell">{row.manganesePercent || ''}</td>
                <td className="annexure-td data-cell">{row.siliconPercent || ''}</td>
                <td className="annexure-td data-cell">{row.sulphurPercent || ''}</td>
                <td className="annexure-td data-cell">{row.phosphorusPercent || ''}</td>
                <td className="annexure-td data-cell">{row.remarks || ''}</td>
                <td className="annexure-td data-cell">{row.acceptedOrRejected || ''}</td>
                <td className="annexure-td data-cell">{row.signOfSupervisor || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER SECTION */}
      <div className="annexure-footer">
        <div className="annexure-signature-section">
          <div className="annexure-signature-right">
            <div className="annexure-signature-label">Name & signature of IE</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalChemicalAnalysisAnnexure;

