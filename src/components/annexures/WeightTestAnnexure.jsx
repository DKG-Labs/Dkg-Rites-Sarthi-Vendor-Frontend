import React from "react";
import AnnexureHeader from "./AnnexureHeader";
import AnnexureFooter from "./AnnexureFooter";
import AnnexureEmptyState from "./AnnexureEmptyState";
import '../AnnexureTemplate.css';

const WeightTestAnnexure = ({ data, selectedCall }) => {
  // Each sampling round gets its own page
  const reportData = data?.responseData || data || {};
  const pages = reportData.pages || [];

  if (pages.length === 0) {
    return (
      <AnnexureEmptyState 
        title="No Weight Test Data" 
        message="Weight inspection results have not been recorded for this inspection call."
      />
    );
  }

  return (
    <div className="annexure-template weight-test-annexure">
      {pages.map((page, pageIdx) => (
        <div key={pageIdx} className="annexure-page-wrapper">
          <AnnexureHeader
            pageNo={`${pageIdx + 1} of ${pages.length}`}
            preparedBy="KJM"
            checkedBy="CSR"
            approvedBy="GM(I)/WR"
            title="FINAL INSPECTION REPORT"
            subtitle="(Weight Test)"
            annexureNumber="Annexure-XV"
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
                  <th rowSpan={2} className="annexure-th">Cast Heat No.</th>
                  <th rowSpan={2} className="annexure-th">Lot No</th>
                  <th rowSpan={2} className="annexure-th">Colour code</th>
                  <th rowSpan={2} className="annexure-th">Quantity (in nos.)</th>
                  <th rowSpan={2} className="annexure-th">Sample Size.</th>
                  <th colSpan={10} className="annexure-th">Weight (kg) ERC MK-III: 0.920 + 0.017 / - 0.016(g) ERC MK-V: 1.088 + 0.020 / - 0.020(g)</th>
                  <th rowSpan={2} className="annexure-th">No of Defectives</th>
                  <th rowSpan={2} className="annexure-th">Cumulative No.of Defectives</th>
                  <th rowSpan={2} className="annexure-th">Remarks</th>
                </tr>
                <tr>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <th key={n} className="annexure-th">{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {page.rows?.map((batch, batchIdx) => {
                  const readings = batch.readings || [[]];
                  const rowSpan = readings.length || 1;

                  return readings.map((readingRow, rowIndex) => (
                    <tr key={`${batchIdx}-${rowIndex}`}>
                      {rowIndex === 0 && (
                        <>
                          <td rowSpan={rowSpan} className="annexure-td">{batchIdx + 1}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.heatNo || '-'}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.lotNo || '-'}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.colourCode || 'N/A'}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.qty || 0}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.sampleSize || 0}</td>
                        </>
                      )}

                      {[...Array(10)].map((_, i) => (
                        <td key={i} className="annexure-td data-cell reading-cell">
                          {readingRow[i] !== undefined ? readingRow[i].toString() : ""}
                        </td>
                      ))}

                      {rowIndex === 0 && (
                        <>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.defectives || 0}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.cumulativeDefectives || 0}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell status-cell">
                            <span className={`status-badge ${batch.status === 'Accepted' ? 'status-ok' : 'status-not-ok'}`}>
                              {batch.status || 'Accepted'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ));
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

export default WeightTestAnnexure;

