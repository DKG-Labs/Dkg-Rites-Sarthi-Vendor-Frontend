import React from 'react';
import '../AnnexureTemplate.css';
import './DimensionAnnexure.css';
import AnnexureHeader from './AnnexureHeader';
import AnnexureEmptyState from './AnnexureEmptyState';

const DimensionAnnexure = ({ data, selectedCall }) => {
  // If data is the full response object, extract info and rows
  const response = data || {};
  const reportRows = response.rows || [];

  if (reportRows.length === 0) {
    return (
      <AnnexureEmptyState 
        title="No Dimension Data" 
        message="Dimensional inspection results for raw material have not been recorded."
      />
    );
  }

  // Group metadata for header
  const reportInfo = {
    title: 'Stage Inspection for Raw material',
    subtitle: 'Test Result- Dimension',
    code: 'Annexure-II',
    docNo: 'QA/WR/MECH',
    pageNo: '10 of 18',
    manufacturer: response.manufacturer || 'N/A',
    certNo: response.certificateNo || 'N/A',
    callNo: response.inspectionCallNo || selectedCall?.call_no || 'N/A',
    dateOfInspection: response.dateOfInspection || 'N/A',
    colorCode: response.colorCode || 'N/A',
    quantity: response.quantity || 'N/A',
    source: response.sourceOfRawMaterial || 'N/A'
  };

  // Transform live rows (each with 20 samples) into the 5-sub-row grid structure
  const transformedHeats = reportRows.map((heat, hIdx) => {
    const samples = Array.from({ length: 5 }, (_, i) => ({
      sampleNo: i + 1,
      dia1: heat.sampleDiameters?.[i] || '',
      dia2: heat.sampleDiameters?.[i + 5] || '',
      dia3: heat.sampleDiameters?.[i + 10] || '',
      dia4: heat.sampleDiameters?.[i + 15] || ''
    }));

    return {
      sNo: hIdx + 1,
      date: reportInfo.dateOfInspection,
      source: reportInfo.source,
      certNo: reportInfo.certNo,
      heatNo: heat.heatNo,
      coilCode: reportInfo.colorCode,
      quantity: reportInfo.quantity,
      samples: samples,
      accepted: heat.status || 'PENDING',
      sign: ''
    };
  });

  const sampleRows = transformedHeats.length > 0 ? transformedHeats : [];

  return (
    <div className="annexure-template dimension-annexure">
      {/* HEADER SECTION */}
      <AnnexureHeader
        selectedCall={selectedCall}
        headerTitle="REPORT ON RAW MATERIAL"
        pageNo={reportInfo.pageNo}
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title={reportInfo.title}
        subtitle={reportInfo.subtitle}
        annexureNumber={reportInfo.code}
        annexureCode="IRST-31-2025"
        dateOfInspection={reportInfo.dateOfInspection}
        callNo={reportInfo.callNo}
        vendorName={reportInfo.manufacturer}
        certificateNo={reportInfo.certNo}
        productName={selectedCall?.product_type}
        note="Note: Tolerance as per specified in the Specification."
      />

      {/* DIMENSION TABLE */}
      <div className="annexure-table-wrapper">
        <table className="annexure-table dimension-table">
          <thead>
            {/* Header Row */}
            <tr>
              <th rowSpan="2" className="annexure-th">S. No.</th>
              <th rowSpan="2" className="annexure-th">Date</th>
              <th rowSpan="2" className="annexure-th rotated-header">
                <div className="rotated-text">Source of Raw material name & trademark</div>
              </th>
              <th rowSpan="2" className="annexure-th">Certificate No.</th>
              <th rowSpan="2" className="annexure-th">Cast/ Heat No.</th>
              <th rowSpan="2" className="annexure-th">Colour code</th>
              <th rowSpan="2" className="annexure-th">Quantity</th>
              <th rowSpan="2" className="annexure-th">Sample no.</th>
              <th rowSpan="2" className="annexure-th">Dia (mm)</th>
              <th rowSpan="2" className="annexure-th">Sample no.</th>
              <th rowSpan="2" className="annexure-th">Dia (mm)</th>
              <th rowSpan="2" className="annexure-th">Sample no.</th>
              <th rowSpan="2" className="annexure-th">Dia (mm)</th>
              <th rowSpan="2" className="annexure-th">Sample no.</th>
              <th rowSpan="2" className="annexure-th">Dia (mm)</th>
              <th rowSpan="2" className="annexure-th rotated-header">
                <div className="rotated-text">Accepted or Not Accepted</div>
              </th>
              <th rowSpan="2" className="annexure-th rotated-header">
                <div className="rotated-text">Sign of Lab. Supervisor</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {row.samples.map((sample, sampleIndex) => (
                  <tr key={`${rowIndex}-${sampleIndex}`}>
                    {sampleIndex === 0 && (
                      <>
                        <td rowSpan="5" className="annexure-td">{row.sNo}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.date}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.source}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.certNo}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.heatNo}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.coilCode}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.quantity}</td>
                      </>
                    )}
                    <td className="annexure-td">{sample.sampleNo}</td>
                    <td className="annexure-td data-cell">{sample.dia1}</td>
                    <td className="annexure-td">{sample.sampleNo + 5}</td>
                    <td className="annexure-td data-cell">{sample.dia2}</td>
                    <td className="annexure-td">{sample.sampleNo + 10}</td>
                    <td className="annexure-td data-cell">{sample.dia3}</td>
                    <td className="annexure-td">{sample.sampleNo + 15}</td>
                    <td className="annexure-td data-cell">{sample.dia4}</td>
                    {sampleIndex === 0 && (
                      <>
                        <td rowSpan="5" className="annexure-td data-cell">{row.accepted}</td>
                        <td rowSpan="5" className="annexure-td data-cell">{row.sign}</td>
                      </>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* NOTE SECTION */}
      <div className="dimension-note">
        Note: Tolerance as per specified in the Specification.
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

export default DimensionAnnexure;

