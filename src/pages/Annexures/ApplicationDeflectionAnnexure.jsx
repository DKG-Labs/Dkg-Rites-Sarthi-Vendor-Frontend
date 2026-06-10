import AnnexureLayout from "../../components/annexures/AnnexureLayout";
import AnnexureHeader from "../../components/annexures/AnnexureHeader";
import AnnexureTable from "../../components/annexures/AnnexureTable";
import AnnexureFooter from "../../components/annexures/AnnexureFooter";

const applicationHeaderRows = [
  [
    { label: "S. No", rowSpan: 2 },
    { label: "Cast Heat No.", rowSpan: 2 },
    { label: "Colour Code", rowSpan: 2 },
    { label: "Lot No.", rowSpan: 2 },
    { label: "Quantity (in nos.)", rowSpan: 2 },
    { label: "Sample size", rowSpan: 2 },
    { label: "Application & Deflection test", rowSpan: 2 },
    { label: "No. of defectives", rowSpan: 2 },
    { label: "Cumulative No. of defectives", rowSpan: 2 },
    { label: "Accepted / Not accepted", rowSpan: 2 }
  ]
];

const applicationSampleData = [
  {
    heatNo: "H-1201",
    colour: "Red",
    lotNo: "LOT-01",
    qty: 500,
    sampleSize: 10,
    testResult: "Satisfactory",
    defectives: 0,
    result: "Accepted"
  },
  {
    heatNo: "H-1202",
    colour: "Blue",
    lotNo: "LOT-02",
    qty: 450,
    sampleSize: 10,
    testResult: "Satisfactory",
    defectives: 0,
    result: "Accepted"
  },
  {
    heatNo: "H-1203",
    colour: "Green",
    lotNo: "LOT-03",
    qty: 600,
    sampleSize: 10,
    testResult: "Satisfactory",
    defectives: 0,
    result: "Accepted"
  },
  {
    heatNo: "H-1204",
    colour: "Yellow",
    lotNo: "LOT-04",
    qty: 520,
    sampleSize: 10,
    testResult: "Satisfactory",
    defectives: 0,
    result: "Accepted"
  },
  {
    heatNo: "H-1205",
    colour: "White",
    lotNo: "LOT-05",
    qty: 480,
    sampleSize: 10,
    testResult: "Satisfactory",
    defectives: 0,
    result: "Accepted"
  }
];

const ApplicationDeflectionAnnexure = () => {
  return (
    <AnnexureLayout>

      <AnnexureHeader
        pageNo="16 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Final Inspection Report"
        subtitle="Test results- Application & Deflection test"
        annexureNumber="Annexure-X"
        annexureCode="IRST-31-2025"
      />

      <AnnexureTable headerRows={applicationHeaderRows}>
        {applicationSampleData.map((row, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{row.heatNo}</td>
            <td>{row.colour}</td>
            <td>{row.lotNo}</td>
            <td>{row.qty}</td>
            <td>{row.sampleSize}</td>
            <td>{row.testResult}</td>
            <td>{row.defectives}</td>

            {/* CUMULATIVE ->SINGLE MERGED CELL */}
            {index === 0 && (
              <td rowSpan={applicationSampleData.length}>
                {row.cumulativeDefectives}
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

export default ApplicationDeflectionAnnexure;
