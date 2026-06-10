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
                  <th colSpan={2} className="annexure-th">Main gauge acceptance</th>
                  <th colSpan={2} className="annexure-th">Falling in Gauges</th>
                  <th colSpan={2} className="annexure-th">Flat bearing length</th>
                  <th rowSpan={2} className="annexure-th">No. of defectives</th>
                  <th rowSpan={2} className="annexure-th">Cumulative No. of defectives</th>
                  <th rowSpan={2} className="annexure-th">Accepted / Not accepted</th>
                </tr>
                <tr>
                  <th className="annexure-th">Go<br />Dimension</th>
                  <th className="annexure-th">No Go<br />Dimension</th>
                  <th className="annexure-th">Go<br />Dimension</th>
                  <th className="annexure-th">No Go<br />Dimension</th>
                  <th className="annexure-th">Go<br />Dimension</th>
                  <th className="annexure-th">No Go<br />Dimension</th>
                </tr>
              </thead>
              <tbody>
                {page.rows?.map((row, index) => (
                  <tr key={index}>
                    <td className="annexure-td">{index + 1}</td>
                    <td className="annexure-td data-cell">{row.heatNo || '-'}</td>
                    <td className="annexure-td data-cell">{row.colourCode || '-'}</td>
                    <td className="annexure-td data-cell">{row.lotNo || '-'}</td>
                    <td className="annexure-td data-cell">{row.qty || row.quantity || 0}</td>
                    <td className="annexure-td data-cell">{row.sampleSize || 0}</td>
                    {/* Main Gauge */}
                    <td className="annexure-td data-cell">{formatStatus(row.mainBoxGo)}</td>
                    <td className="annexure-td data-cell">{formatStatus(row.mainBoxNoGo)}</td>
                    {/* Falling in Gauges */}
                    <td className="annexure-td data-cell">{formatStatus(row.fallingGo)}</td>
                    <td className="annexure-td data-cell">{formatStatus(row.fallingNoGo)}</td>
                    {/* Flat Bearing */}
                    <td className="annexure-td data-cell">{formatStatus(row.flatBearingGo)}</td>
                    <td className="annexure-td data-cell">{formatStatus(row.flatBearingNoGo)}</td>
                    
                    <td className="annexure-td data-cell">{row.defectives || 0}</td>
                    <td className="annexure-td data-cell">{row.cumulativeDefectives || 0}</td>
                    <td className="annexure-td data-cell status-cell">
                      <span className={`status-badge ${row.status === 'Accepted' ? 'status-ok' : 'status-not-ok'}`}>
                        {row.status || 'Accepted'}
                      </span>
                    </td>
                  </tr>
                ))}
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
