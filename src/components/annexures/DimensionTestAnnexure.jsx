import React from "react";
import AnnexureHeader from "./AnnexureHeader";
import AnnexureFooter from "./AnnexureFooter";
import AnnexureEmptyState from "./AnnexureEmptyState";
import '../AnnexureTemplate.css';

const DimensionTestAnnexure = ({ data, selectedCall }) => {
  // Dimension data structure has pages (each page is a sampling round)
  const reportData = data?.responseData || data || {};
  const pages = reportData.pages || [];

  if (pages.length === 0) {
    return (
      <AnnexureEmptyState 
        title="No Dimensional Test Data" 
        message="Dimensional inspection results have not been recorded for this inspection call. Please ensure the test data is submitted."
      />
    );
  }

  // Helper to format integer status to raw value or "-"
  const formatStatus = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val;
  };

  // Helper to calculate sample size according to IS 2500 if zero / missing
  const getCalculatedSampleSize = (sizeVal, qtyVal) => {
    if (sizeVal && Number(sizeVal) > 0) return Number(sizeVal);
    const q = parseInt(qtyVal, 10) || 0;
    if (q <= 0) return 0;
    if (q <= 8) return 2;
    if (q <= 15) return 3;
    if (q <= 25) return 5;
    if (q <= 50) return 8;
    if (q <= 90) return 13;
    if (q <= 150) return 20;
    if (q <= 280) return 20;
    if (q <= 500) return 32;
    if (q <= 1200) return 50;
    if (q <= 3200) return 80;
    if (q <= 10000) return 125;
    if (q <= 35000) return 200;
    if (q <= 150000) return 315;
    if (q <= 500000) return 500;
    return 500;
  };

  const getMainGaugeAcceptance = (row) => {
    if (row.mainGaugeAcceptance !== undefined && row.mainGaugeAcceptance !== null) {
      return (row.mainGaugeAcceptance === 'Yes' || row.mainGaugeAcceptance === true) ? 'Yes' : 'No';
    }
    const goDefects = Number(row.mainBoxGo) || 0;
    const noGoDefects = Number(row.mainBoxNoGo) || 0;
    if (row.status === 'Rejected' || row.status === 'NOT OK' || goDefects > 0 || noGoDefects > 0) {
      return 'No';
    }
    return 'Yes';
  };

  return (
    <div className="annexure-template dimensional-test-annexure">
      {pages.map((page, pageIdx) => (
        <div key={pageIdx} className="annexure-page-wrapper">
          <AnnexureHeader
            pageNo={`${pageIdx + 1} of ${pages.length}`}
            preparedBy="KJM"
            checkedBy="CSR"
            approvedBy="GM(I)/WR"
            title="Final Inspection Report"
            subtitle="Test results- Dimension test"
            annexureNumber="Annexure-IX"
            annexureCode="IRST-31-2025"
            selectedCall={selectedCall}
            manufacturer={reportData.manufacturer}
            vendor={reportData.vendor}
            firmName={reportData.vendor}
            productName={reportData.productName}
            dateOfInspection={reportData.dateOfInspection}
          />

          <div className="annexure-table-container">
            <table className="annexure-table">
              <thead>
                <tr>
                  <th rowSpan={2} className="annexure-th">S. No</th>
                  <th rowSpan={2} className="annexure-th">Cast / Heat No.</th>
                  <th rowSpan={2} className="annexure-th">Colour Code</th>
                  <th rowSpan={2} className="annexure-th">Lot No.</th>
                  <th rowSpan={2} className="annexure-th">Qty. (Nos.)</th>
                  <th rowSpan={2} className="annexure-th">Sample size</th>
                  <th rowSpan={2} className="annexure-th">Main Gauge Acceptance (Yes/No)</th>
                  <th colSpan={2} className="annexure-th">Falling in Gauges</th>
                  <th rowSpan={2} className="annexure-th">Flat Bearing Length</th>
                  <th rowSpan={2} className="annexure-th">No. of defectives</th>
                  <th rowSpan={2} className="annexure-th">Cumulative No. of defectives</th>
                  <th rowSpan={2} className="annexure-th">Accepted / Not accepted</th>
                </tr>
                <tr>
                  <th className="annexure-th">Go Dim.</th>
                  <th className="annexure-th">No Go</th>
                </tr>
              </thead>
              <tbody>
                {page.rows?.map((row, index) => {
                  const qtyVal = row.qty || row.quantity || 0;
                  const sampleSize = getCalculatedSampleSize(row.sampleSize, qtyVal);
                  const colourCode = (!row.colourCode || row.colourCode === '-' || row.colourCode === 'null' || row.colourCode.trim() === '') ? 'N/A' : row.colourCode;
                  const flatBearingTotal = (Number(row.flatBearingGo) || 0) + (Number(row.flatBearingNoGo) || 0);

                  return (
                    <tr key={index}>
                      <td className="annexure-td">{index + 1}</td>
                      <td className="annexure-td data-cell">{row.heatNo || '-'}</td>
                      <td className="annexure-td data-cell">{colourCode}</td>
                      <td className="annexure-td data-cell">{row.lotNo || '-'}</td>
                      <td className="annexure-td data-cell">{qtyVal}</td>
                      <td className="annexure-td data-cell">{sampleSize}</td>
                      
                      {/* Main Gauge Acceptance */}
                      <td className="annexure-td data-cell">{getMainGaugeAcceptance(row)}</td>
                      
                      {/* Falling in Gauges */}
                      <td className="annexure-td data-cell">{formatStatus(row.fallingGo ?? row.fallingInGauge ?? 0)}</td>
                      <td className="annexure-td data-cell">{formatStatus(row.fallingNoGo ?? row.gapAtBackArch ?? 0)}</td>
                      
                      {/* Flat Bearing (summed) */}
                      <td className="annexure-td data-cell">{flatBearingTotal}</td>
                      
                      <td className="annexure-td data-cell">{row.defectives || 0}</td>
                      <td className="annexure-td data-cell">{row.cumulativeDefectives || 0}</td>
                      <td className="annexure-td data-cell status-cell">
                        <span className={`status-badge ${row.status === 'Accepted' ? 'status-ok' : 'status-not-ok'}`}>
                          {row.status || 'Accepted'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <AnnexureFooter />
          {pageIdx < pages.length - 1 && <div className="page-break" />}
        </div>
      ))}
    </div>
  );
};

export default DimensionTestAnnexure;
