import React from 'react';
import '../AnnexureTemplate.css';
import './ChemicalAnalysisAnnexure.css';
import AnnexureHeader from './AnnexureHeader';

/**
 * Chemical Analysis Annexure - Advanced version with live data support
 */

const ChemicalAnalysisAnnexureAdvanced = ({ data = [], selectedCall }) => {
  // Handle API response structure vs legacy array structure
  const isApiData = !Array.isArray(data) && data?.rows;
  const apiRows = isApiData ? data.rows : [];
  const headerMeta = isApiData ? data : {};

  // Header configuration resolution
  const reportInfo = {
    title: 'Stage Inspection for Raw material',
    subtitle: 'Test Result- Chemical Analysis',
    annexureNumber: 'Annexure-I',
    annexureCode: 'IRST-31-2025',
    vendorName: headerMeta.manufacturer || selectedCall?.vendor_name,
    callNo: headerMeta.inspectionCallNo || selectedCall?.call_no,
    certificateNo: headerMeta.certificateNo,
    dateOfInspection: headerMeta.dateOfInspection,
    productName: selectedCall?.product_type || 'ELASTIC RAIL CLIP MK-III/MK-V'
  };

  // Resolve display rows
  const displayRows = isApiData ? apiRows : (Array.isArray(data) && data.length > 0 ? data : []);

  // Fallback for empty table
  const finalRows = displayRows.length > 0 ? displayRows : [
    { sNo: 1, isEmpty: true },
    { sNo: 2, isEmpty: true },
    { sNo: 3, isEmpty: true },
    { sNo: 4, isEmpty: true }
  ];

  return (
    <div className="annexure-template chemical-analysis-annexure">
      {/* HEADER SECTION */}
      <AnnexureHeader
        pageNo="9 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title={reportInfo.title}
        subtitle={reportInfo.subtitle}
        annexureNumber={reportInfo.annexureNumber}
        annexureCode={reportInfo.annexureCode}
        vendorName={reportInfo.vendorName}
        callNo={reportInfo.callNo}
        productName={reportInfo.productName}
        certificateNo={reportInfo.certificateNo}
        dateOfInspection={reportInfo.dateOfInspection}
      />

      {/* COMPLEX TABLE */}
      <div className="annexure-table-wrapper">
        <table className="annexure-table chemical-table">
          <thead>
            {/* Row 1: Main headers */}
            <tr>
              <th rowSpan="4" className="annexure-th">S. No.</th>
              <th rowSpan="4" className="annexure-th">Date</th>
              <th rowSpan="4" className="annexure-th">Source of Raw material name & trademark</th>
              <th rowSpan="4" className="annexure-th">Certificate No.</th>
              <th rowSpan="4" className="annexure-th">Cast / Heat No.</th>
              <th rowSpan="4" className="annexure-th">Colour code (Heat Wise)</th>
              <th rowSpan="4" className="annexure-th">Quantity</th>
              <th rowSpan="4" className="annexure-th">Sample no.</th>
              <th colSpan="6" rowSpan="1" className="annexure-th">Chemical Analysis report</th>
              <th rowSpan="4" className="annexure-th rotated-header"><div className="rotated-text">Grain Size (6.0 or finer)</div></th>
              <th rowSpan="4" className="annexure-th rotated-header"><div className="rotated-text">Inclusion Rating (thin) (thick) 2.0 max</div></th>
              <th rowSpan="4" className="annexure-th rotated-header"><div className="rotated-text">Hardness 270 HBW/HRC/HV</div></th>
              <th rowSpan="4" className="annexure-th rotated-header"><div className="rotated-text">Depth of Decarb (d/100 or 0.15 mm max)</div></th>
              <th rowSpan="4" className="annexure-th rotated-header"><div className="rotated-text">Freedom from Defects</div></th>
              <th rowSpan="4" className="annexure-th rotated-header"><div className="rotated-text">Accepted or Not Accepted</div></th>
              <th rowSpan="4" className="annexure-th rotated-header"><div className="rotated-text">Sign of Lab Supervisor</div></th>
            </tr>
            {/* Row 2: Chemical elements and Label areas */}
            <tr>
              <th rowSpan="1" className="annexure-th"></th>
              <th rowSpan="1" className="annexure-th sub-element">%C</th>
              <th rowSpan="1" className="annexure-th sub-element">%Mn</th>
              <th rowSpan="1" className="annexure-th sub-element">%Si</th>
              <th rowSpan="1" className="annexure-th sub-element">%S</th>
              <th rowSpan="1" className="annexure-th sub-element">%P</th>
            </tr>
            {/* Row 3: Ladle analysis specifications */}
            <tr>
              <th className="annexure-th sub-header" style={{ textAlign: 'left' }}>Ladle analysis</th>
              <th className="annexure-th sub-header">0.50-0.60</th>
              <th className="annexure-th sub-header">0.80-1.00</th>
              <th className="annexure-th sub-header">1.50-2.00</th>
              <th className="annexure-th sub-header">0.03 max.</th>
              <th className="annexure-th sub-header">0.03 max.</th>
            </tr>
            {/* Row 4: Permissible range specifications */}
            <tr>
              <th className="annexure-th sub-header" style={{ textAlign: 'left' }}>Permissible range over ladle sample analysis</th>
              <th className="annexure-th sub-header">±0.03</th>
              <th className="annexure-th sub-header">±0.04</th>
              <th className="annexure-th sub-header">±0.05</th>
              <th className="annexure-th sub-header">±0.005</th>
              <th className="annexure-th sub-header">±0.005</th>
            </tr>
          </thead>
          <tbody>
            {finalRows.map((row, index) => (
              <tr key={index}>
                <td className="annexure-td">{row.sNo || row.sno || (index + 1)}</td>
                <td className="annexure-td data-cell">{row.date || (row.isEmpty ? '' : headerMeta.dateOfInspection)}</td>
                <td className="annexure-td data-cell">{row.source || (row.isEmpty ? '' : headerMeta.manufacturer)}</td>
                <td className="annexure-td data-cell">{row.certNo || (row.isEmpty ? '' : headerMeta.certificateNo)}</td>
                <td className="annexure-td data-cell">{row.heatNo || ''}</td>
                <td className="annexure-td data-cell">{row.coilCode || ''}</td>
                <td className="annexure-td data-cell">{row.quantity || (row.isEmpty ? '' : headerMeta.quantity)}</td>
                <td className="annexure-td data-cell">{row.sampleNo || ''}</td>
                {/* Reference / Empty Label cell for data rows */}
                <td className="annexure-td data-cell"></td>
                {/* Chemical Percentages */}
                <td className="annexure-td data-cell">{row.carbon || row.c || ''}</td>
                <td className="annexure-td data-cell">{row.manganese || row.mn || ''}</td>
                <td className="annexure-td data-cell">{row.silicon || row.si || ''}</td>
                <td className="annexure-td data-cell">{row.sulphur || row.s || ''}</td>
                <td className="annexure-td data-cell">{row.phosphorus || row.p || ''}</td>
                {/* Metallurgical Properties */}
                <td className="annexure-td data-cell">{row.grainSize || ''}</td>
                <td className="annexure-td data-cell">{row.inclusion || ''}</td>
                <td className="annexure-td data-cell">{row.hardness || ''}</td>
                <td className="annexure-td data-cell">{row.decarb || ''}</td>
                <td className="annexure-td data-cell">{row.freedomFromDefects || row.freedom || ''}</td>
                <td className="annexure-td data-cell">{row.acceptedOrNot || row.accepted || ''}</td>
                <td className="annexure-td data-cell">{row.sign || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="annexure-footer">
        <div className="annexure-signature-section">
          <div className="annexure-signature-label">Name & signature of IE</div>
        </div>
      </div>
    </div>
  );
};

export default ChemicalAnalysisAnnexureAdvanced;
