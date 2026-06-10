import React from 'react';
import AnnexureLayout from "./AnnexureLayout";
import AnnexureHeader from "./AnnexureHeader";
import AnnexureTable from "./AnnexureTable";
import AnnexureFooter from "./AnnexureFooter";
import './InclusionRatingAnnexure.css'; // Reusing common table styles

/**
 * Final Inspection Report - Application & Deflection Annexure
 */

const appDeflectionHeaderRows = [
  [
    { label: "S. No.", rowSpan: 1 },
    { label: "Cast / Heat No.", rowSpan: 1 },
    { label: "Colour Code", rowSpan: 1 },
    { label: "Lot No.", rowSpan: 1 },
    { label: "Quantity (in nos.)", rowSpan: 1 },
    { label: "Sample Size", rowSpan: 1 },
    { label: "No. of Defectives", rowSpan: 1 },
    { label: "Application & Deflection Test", rowSpan: 1 },
    { label: "Remarks / Accepted - Rejected", rowSpan: 1 },
    { label: "Sign. Of Supervisor", rowSpan: 1 }
  ]
];

const ApplicationDeflectionAnnexure = ({ data, selectedCall }) => {
  // Support both new 'pages' structure and legacy 'rows' fallback
  const pages = data?.pages || (data?.rows ? data.rows.map(r => ({ ...r })) : []);

  if (!pages || pages.length === 0) {
    return (
      <div className="annexure-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No Application & Deflection data available for this call.</p>
      </div>
    );
  }

  return (
    <div className="multi-annexure-container">
      {pages.map((page, index) => (
        <AnnexureLayout key={index}>
          <AnnexureHeader
            selectedCall={selectedCall}
            pageNo={`${index + 1} of ${pages.length}`}
            docNo="QA/WR/MECH/610"
            issueNo="01"
            effectiveDate="14.10.2025"
            preparedBy="KJM"
            checkedBy="CSR"
            approvedBy="GGM-I/WR"
            title="Final Inspection Report"
            subtitle="Test results- Application & Deflection test"
            annexureNumber="Annexure-X"
            annexureCode="IRST-31-2025"
            vendorName={data.vendor}
            productName={data.productName || selectedCall?.product_type}
            callNo={data.inspectionCallNo}
            dateOfInspection={data.dateOfInspection}
          />

          <AnnexureTable headerRows={appDeflectionHeaderRows}>
            <tr>
              <td className="annexure-td data-cell">1</td>
              <td className="annexure-td data-cell">{page.heatNo || '-'}</td>
              <td className="annexure-td data-cell">{page.colourCode || '-'}</td>
              <td className="annexure-td data-cell">{page.lotNo || '-'}</td>
              <td className="annexure-td data-cell">{page.quantity || '-'}</td>
              <td className="annexure-td data-cell">{page.sampleSize || '-'}</td>
              <td className="annexure-td data-cell">{page.noOfDefectives}</td>
              <td className="annexure-td data-cell">{page.testResult}</td>
              <td className="annexure-td data-cell" style={{ fontWeight: 'bold' }}>{page.status}</td>
              <td className="annexure-td data-cell"></td>
            </tr>
          </AnnexureTable>

          <AnnexureFooter />
        </AnnexureLayout>
      ))}
    </div>
  );
};

export default ApplicationDeflectionAnnexure;
