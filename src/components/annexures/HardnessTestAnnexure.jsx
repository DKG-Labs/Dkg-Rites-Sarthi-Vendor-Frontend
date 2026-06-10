import React from "react";
import AnnexureLayout from "./AnnexureLayout";
import AnnexureHeader from "./AnnexureHeader";
import AnnexureTable from "./AnnexureTable";
import AnnexureFooter from "./AnnexureFooter";


const hardnessHeaderRows = [
  [
    { label: "S. No", rowSpan: 2 },
    { label: "Cast Heat No.", rowSpan: 2 },
    { label: "Colour Code", rowSpan: 2 },
    { label: "Lot No.", rowSpan: 2 },
    { label: "Qty. (Nos.)", rowSpan: 2 },
    { label: "Sample size", rowSpan: 2 },
    { label: "Hardness value (40–44 HRC)", colSpan: 10 },
    { label: "No. of defectives", rowSpan: 2 },
    { label: "Cumulative No. of defectives", rowSpan: 2 },
    { label: "Accepted / Not accepted", rowSpan: 2 }
  ],
  [
    { label: "1" }, { label: "2" }, { label: "3" }, { label: "4" },
    { label: "5" }, { label: "6" }, { label: "7" }, { label: "8" },
    { label: "9" }, { label: "10" }
  ]
];





const HardnessTestAnnexure = ({ data, selectedCall }) => {
  // Handle data structure (can be a flat array or the new DTO structure)
  const reportData = data?.pages || (Array.isArray(data) ? data : []);

  if (reportData.length === 0) {
    return (
      <div className="annexure-no-data">
        <p>No hardness test data available for this call.</p>
      </div>
    );
  }

  return (
    <div className="multi-annexure-container">
      {reportData.map((page, pageIdx) => (
        <AnnexureLayout key={pageIdx}>
          <AnnexureHeader
            pageNo={`${pageIdx + 1} of ${reportData.length}`}
            preparedBy="KJM"
            checkedBy="CSR"
            approvedBy="GM(I)/WR"
            title="Final Inspection Report"
            subtitle="Test results- Hardness Test"
            annexureNumber="Annexure-VIII"
            annexureCode="IRST-31-2025"
            vendorName={data?.vendorName}
            firmName={data?.vendorName}
            productName={data?.productName || selectedCall?.product_type || "ELASTIC RAIL CLIP"}
          />

          <AnnexureTable headerRows={hardnessHeaderRows}>
            {page.rows && page.rows.map((batch, batchIndex) => {
              // batch.readings is a List<List<BigDecimal>>
              const rowSpan = batch.readings?.length || 1;

              return batch.readings?.map((sample, sampleIndex) => (
                <tr key={`${batchIndex}-${sampleIndex}`}>
                  {/* LEFT MERGED COLUMNS */}
                  {sampleIndex === 0 && (
                    <>
                      <td rowSpan={rowSpan}>{batchIndex + 1}</td>
                      <td rowSpan={rowSpan}>{batch.heatNo || page.heatNo}</td>
                      <td rowSpan={rowSpan}>{batch.colourCode || "N/A"}</td>
                      <td rowSpan={rowSpan}>{batch.lotNo || page.lotNo}</td>
                      <td rowSpan={rowSpan}>{batch.qty || page.qtyNo}</td>
                      <td rowSpan={rowSpan}>{batch.sampleSize}</td>
                    </>
                  )}

                  {/* 10 COLUMNS FOR READINGS */}
                  {[...Array(10)].map((_, i) => (
                    <td key={i}>{sample[i] !== undefined ? sample[i] : "-"}</td>
                  ))}

                  {sampleIndex === 0 && (
                    <>
                      <td rowSpan={rowSpan}>{batch.defectives}</td>
                      <td rowSpan={rowSpan}>{batch.cumulativeDefectives}</td>
                      <td rowSpan={rowSpan}>{batch.status}</td>
                    </>
                  )}
                </tr>
              )) || (
                <tr key={batchIndex}>
                   <td colSpan={20}>No readings available for this heat</td>
                </tr>
              );
            })}
          </AnnexureTable>

          <AnnexureFooter />
        </AnnexureLayout>
      ))}
    </div>
  );
};

export default HardnessTestAnnexure;

