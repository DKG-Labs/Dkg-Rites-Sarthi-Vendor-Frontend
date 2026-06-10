import React from "react";
import AnnexureHeader from "../../components/annexures/AnnexureHeader";
import AnnexureFooter from "../../components/annexures/AnnexureFooter";
import AnnexureEmptyState from "../../components/annexures/AnnexureEmptyState";
import '../../components/annexures/AnnexureTemplate.css';

const HardnessTestAnnexure = ({ data, selectedCall }) => {
  // Hardness data structure usually has pages
  const pages = data?.pages || (Array.isArray(data) ? data : []);

  if (pages.length === 0) {
    return (
      <AnnexureEmptyState 
        title="No Hardness Test Data" 
        message="Hardness inspection results (HRC) have not been recorded for this inspection call."
      />
    );
  }

  return (
    <div className="annexure-template hardness-test-annexure">
      <AnnexureHeader
        pageNo="14 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Final Inspection Report"
        subtitle="Test results- Hardness Test"
        annexureNumber="Annexure-VIII"
        annexureCode="IRST-31-2025"
        selectedCall={selectedCall}
      />

      <div className="annexure-table-container">
        <table className="annexure-table">
          <thead>
            <tr>
              <th rowSpan={2} className="annexure-th">S. No</th>
              <th rowSpan={2} className="annexure-th">Cast Heat No.</th>
              <th rowSpan={2} className="annexure-th">Colour Code</th>
              <th rowSpan={2} className="annexure-th">Lot No.</th>
              <th rowSpan={2} className="annexure-th">Qty. (Nos.)</th>
              <th rowSpan={2} className="annexure-th">Sample size</th>
              <th colSpan={10} className="annexure-th">Hardness value (40–44 HRC)</th>
              <th rowSpan={2} className="annexure-th">No. of defectives</th>
              <th rowSpan={2} className="annexure-th">Cumulative No. of defectives</th>
              <th rowSpan={2} className="annexure-th">Accepted / Not accepted</th>
            </tr>
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <th key={n} className="annexure-th">{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pages.map((page, pageIdx) => (
              <React.Fragment key={pageIdx}>
                {page.rows?.map((batch, batchIdx) => {
                  const readings = batch.readings || [];
                  const rowSpan = readings.length || 1;

                  return (readings.length > 0 ? readings : [[]]).map((sample, sampleIdx) => (
                    <tr key={`${pageIdx}-${batchIdx}-${sampleIdx}`}>
                      {sampleIdx === 0 && (
                        <>
                          <td rowSpan={rowSpan} className="annexure-td">{batchIdx + 1}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.heatNo}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.colourCode || batch.colour || '-'}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.lotNo}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.qty || batch.quantity}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.sampleSize}</td>
                        </>
                      )}

                      {/* 10 Reading Columns */}
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                        <td key={i} className="annexure-td data-cell reading-cell">
                          {sample && sample[i] !== undefined ? sample[i] : '-'}
                        </td>
                      ))}

                      {sampleIdx === 0 && (
                        <>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.noOfDefectives || batch.defectives || 0}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell">{batch.cumulativeNoOfDefectives || batch.cumulative || 0}</td>
                          <td rowSpan={rowSpan} className="annexure-td data-cell status-cell">{batch.acceptedOrRejected || batch.result || 'Accepted'}</td>
                        </>
                      )}
                    </tr>
                  ));
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <AnnexureFooter />
    </div>
  );
};



     
      <AnnexureFooter />
    </AnnexureLayout>
  );
};

export default HardnessTestAnnexure;
