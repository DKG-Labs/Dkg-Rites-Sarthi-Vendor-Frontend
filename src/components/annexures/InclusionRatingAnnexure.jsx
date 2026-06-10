import React from 'react';
import AnnexureLayout from "./AnnexureLayout";
import AnnexureHeader from "./AnnexureHeader";
import AnnexureTable from "./AnnexureTable";
import AnnexureFooter from "./AnnexureFooter";
import './InclusionRatingAnnexure.css';

/**
 * Final Inspection Report - Inclusion Rating, Depth of Decarb Annexure
 * Annexure-VII for inclusion rating and depth of decarb inspection
 */

const inclusionHeaderRows = [
  [
    { label: "S. No.", rowSpan: 3 },
    { label: "Cast / Heat No.", rowSpan: 3 },
    { label: "Colour Code", rowSpan: 3 },
    { label: "Lot No.", rowSpan: 3 },
    { label: "Quantity (in nos.)", rowSpan: 3 },
    { label: "Sample Size", rowSpan: 3 },
    { label: "Sample (Nos.)", rowSpan: 3 },
    { label: "Inclusion Rating (thin)(thick)\n2.0 max", colSpan: 8 },
    { label: "Depth of Decarb\n(d/100 OR 0.25 mm max)", rowSpan: 3 },
    { label: "Micro-structure\n(Fully tempered martensite structure)", rowSpan: 3 },
    { label: "Freedom from defects", rowSpan: 3 },
    { label: "Remarks / Accepted - Rejected", rowSpan: 3 },
    { label: "Sign. Of Supervisor", rowSpan: 3 }
  ],
  [
    { label: "A", colSpan: 2 },
    { label: "B", colSpan: 2 },
    { label: "C", colSpan: 2 },
    { label: "D", colSpan: 2 }
  ],
  [
    { label: "Thin" }, { label: "Thick" },
    { label: "Thin" }, { label: "Thick" },
    { label: "Thin" }, { label: "Thick" },
    { label: "Thin" }, { label: "Thick" }
  ]
];

const InclusionRatingAnnexure = ({ data, selectedCall }) => {
  const reportData = data?.pages ? data : { pages: [] };
  const pages = reportData.pages;

  if (!pages || pages.length === 0) {
    return (
      <div className="annexure-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No Inclusion Rating & Decarb data available for this call.</p>
      </div>
    );
  }

  return (
    <div className="multi-annexure-container">
      {pages.map((page, pageIdx) => (
        <AnnexureLayout key={pageIdx}>
          <AnnexureHeader
            selectedCall={selectedCall}
            pageNo={`${pageIdx + 1} of ${pages.length}`}
            docNo="QA/WR/MECH/604"
            issueNo="02"
            effectiveDate="14.10.2025"
            preparedBy="KJM"
            checkedBy="CSR"
            approvedBy="GGM-I/WR"
            title="Final Inspection Report"
            subtitle="Test Result: Inclusion Rating, Depth of Decarb"
            annexureNumber="Annexure-VII"
            annexureCode="IRST-31-2025"
            vendorName={reportData.vendor}
            firmName={reportData.vendor}
            productName={reportData.productName || selectedCall?.product_type}
            callNo={reportData.inspectionCallNo}
            certificateNo={reportData.certificateNo}
            dateOfInspection={reportData.dateOfInspection}
          />

          <AnnexureTable headerRows={inclusionHeaderRows}>
            {page.rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {rowIdx === 0 && (
                  <>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle' }}>{pageIdx + 1}</td>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle' }}>{page.heatNo || '-'}</td>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle' }}>{page.colourCode || '-'}</td>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle' }}>{page.lotNo || '-'}</td>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle' }}>{page.quantity || '-'}</td>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle' }}>{page.sampleSize || '-'}</td>
                  </>
                )}
                
                <td className="annexure-td data-cell">{row.sampleNo || '-'}</td>

                <td className="annexure-td data-cell">{row.inclusionAThin || '-'}</td>
                <td className="annexure-td data-cell">{row.inclusionAThick || '-'}</td>
                <td className="annexure-td data-cell">{row.inclusionBThin || '-'}</td>
                <td className="annexure-td data-cell">{row.inclusionBThick || '-'}</td>
                <td className="annexure-td data-cell">{row.inclusionCThin || '-'}</td>
                <td className="annexure-td data-cell">{row.inclusionCThick || '-'}</td>
                <td className="annexure-td data-cell">{row.inclusionDThin || '-'}</td>
                <td className="annexure-td data-cell">{row.inclusionDThick || '-'}</td>

                {rowIdx === 0 && (
                  <>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle', whiteSpace: 'pre-line' }}>{row.decarbResult || '-'}</td>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle' }}>{row.microstructureResult || '-'}</td>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle' }}>{row.freedomResult || '-'}</td>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle' }}>{page.overallStatus || '-'}</td>
                    <td className="annexure-td data-cell" rowSpan={page.rows.length} style={{ verticalAlign: 'middle' }}></td>
                  </>
                )}
              </tr>
            ))}
          </AnnexureTable>

          <AnnexureFooter />
        </AnnexureLayout>
      ))}
    </div>
  );
};

export default InclusionRatingAnnexure;

