import React from "react";
import AnnexureLayout from "../../components/annexures/AnnexureLayout";
import AnnexureHeader from "../../components/annexures/AnnexureHeader";
import AnnexureTable from "../../components/annexures/AnnexureTable";
import AnnexureFooter from "../../components/annexures/AnnexureFooter";
const dimensionHeaderRows = [
  [
    { label: "S. No", rowSpan: 2 },
    { label: "Cast / Heat No.", rowSpan: 2 },
    { label: "Colour Code", rowSpan: 2 },
    { label: "Lot No.", rowSpan: 2 },
    { label: "Qty. (Nos.)", rowSpan: 2 },
    { label: "Sample size", rowSpan: 2 },
    { label: "Main gauge acceptance Yes/No", rowSpan: 2 },
    { label: "Falling in Gauges", colSpan: 2 },
    { label: "Flat bearing length", rowSpan: 2 },
    { label: "No. of defectives", rowSpan: 2 },
    { label: "Cumulative No. of defectives", rowSpan: 2 },
    { label: "Accepted / Not accepted", rowSpan: 2 }
  ],
  [
    { label: "Go Dimension" },
    { label: "No Go Dimension" }
  ]
];

const dimensionData = [
  {
    heatNo: "H-1101",
    colour: "Red",
    lotNo: "LOT-01",
    qty: 500,
    sampleSize: 10,
    mainGauge: "Yes",
    goDim: "OK",
    noGoDim: "OK",
    flatLength: "92 mm",
    defectives: 0,
    
    result: "Accepted"
  },
  {
    heatNo: "H-1102",
    colour: "Blue",
    lotNo: "LOT-02",
    qty: 450,
    sampleSize: 10,
    mainGauge: "Yes",
    goDim: "OK",
    noGoDim: "OK",
    flatLength: "91.8 mm",
    defectives: 0,
   
    result: "Accepted"
  },
  {
    heatNo: "H-1103",
    colour: "Green",
    lotNo: "LOT-03",
    qty: 600,
    sampleSize: 10,
    mainGauge: "Yes",
    goDim: "OK",
    noGoDim: "OK",
    flatLength: "92.1 mm",
    defectives: 0,
  
    result: "Accepted"
  },
  {
    heatNo: "H-1104",
    colour: "Yellow",
    lotNo: "LOT-04",
    qty: 520,
    sampleSize: 10,
    mainGauge: "Yes",
    goDim: "OK",
    noGoDim: "OK",
    flatLength: "92 mm",
    defectives: 0,
   
    result: "Accepted"
  },
  {
    heatNo: "H-1105",
    colour: "White",
    lotNo: "LOT-05",
    qty: 480,
    sampleSize: 10,
    mainGauge: "Yes",
    goDim: "OK",
    noGoDim: "OK",
    flatLength: "91.9 mm",
    defectives: 0,
    
    result: "Accepted"
  }
];


const DimensionTestAnnexure = () => {
  return (
    <AnnexureLayout>

      <AnnexureHeader
        pageNo="15 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Final Inspection Report"
        subtitle="Test results- Dimension test"
        annexureNumber="Annexure-IX"
        annexureCode="IRST-31-2025"
      />

      <AnnexureTable headerRows={dimensionHeaderRows}>
        {dimensionData.map((row, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{row.heatNo}</td>
            <td>{row.colour}</td>
            <td>{row.lotNo}</td>
            <td>{row.qty}</td>
            <td>{row.sampleSize}</td>
            <td>{row.mainGauge}</td>
            <td>{row.goDim}</td>
            <td>{row.noGoDim}</td>
            <td>{row.flatLength}</td>
            <td>{row.defectives}</td>
             {index === 0 && (
        <td rowSpan={dimensionData.length}>
          {row.cumulative}
        </td>
      )}
            <td>{row.result}</td>
          </tr>
        ))}
      </AnnexureTable>

      <AnnexureFooter />

    </AnnexureLayout>
  );
};

export default DimensionTestAnnexure;
