import AnnexureLayout from "../../components/annexures/AnnexureLayout";
import AnnexureHeader from "../../components/annexures/AnnexureHeader";
import AnnexureTable from "../../components/annexures/AnnexureTable";
import AnnexureFooter from "../../components/annexures/AnnexureFooter";

const toeLoadHeaderRows = [
  [
    { label: "S. No", rowSpan: 2 },
    { label: "Cast Heat No.", rowSpan: 2 },
    { label: "Lot No.", rowSpan: 2 },
    { label: "Colour Code", rowSpan: 2 },
    { label: "Qty. (Nos.)", rowSpan: 2 },
    { label: "Sample size", rowSpan: 2 },
    {
      label:
        "Toe Load test (ERC MK-III: 850–110 kgs) (ERC MK-V: 1200–1500 kgs)",
      colSpan: 10,
    },
    { label: "No. of defectives", rowSpan: 2 },
    { label: "Cumulative No. of defectives", rowSpan: 2 },
    { label: "Accepted / Not accepted", rowSpan: 2 },
  ],
  [
    { label: "1" }, { label: "2" }, { label: "3" }, { label: "4" },
    { label: "5" }, { label: "6" }, { label: "7" }, { label: "8" },
    { label: "9" }, { label: "10" },
  ],
];

const toeLoadSampleData = [
  {
    heatNo: "H-1301",
    lotNo: "LOT-01",
    colour: "Red",
    qty: 500,
    sampleSize: 10,
    toeLoad: [980, 995, 1005, 990, 985, 1000, 995, 990, 1002, 998],
    defectives: 0,

    result: "Accepted",
  },
  {
    heatNo: "H-1302",
    lotNo: "LOT-02",
    colour: "Blue",
    qty: 450,
    sampleSize: 10,
    toeLoad: [970, 980, 990, 985, 975, 980, 988, 982, 990, 978],
    defectives: 0,
   
    result: "Accepted",
  }
];
const cumulativeDefectives = toeLoadSampleData.reduce(
  (sum, row) => sum + Number(row.defectives || 0),
  0
);

const ToeLoadTestAnnexure = () => {
  return (
    <AnnexureLayout>

      <AnnexureHeader pageNo="17 of 18" />

      <h3 className="center-text">Final Inspection Report</h3>

      <div className="annexure-info">
        <div>Test results – Toe load test</div>
        <div className="right-text">
          Annexure-XI <br />
          IRST-31-2025
        </div>
      </div>

      <AnnexureTable headerRows={toeLoadHeaderRows}>
  {toeLoadSampleData.map((row, batchIndex) =>
    row.toeLoad.map((value, i) => (
      <tr key={`${batchIndex}-${i}`}>

        
        {i === 0 && (
          <>
            <td rowSpan={row.sampleSize}>{batchIndex + 1}</td>
            <td rowSpan={row.sampleSize}>{row.heatNo}</td>
            <td rowSpan={row.sampleSize}>{row.lotNo}</td>
            <td rowSpan={row.sampleSize}>{row.colour}</td>
            <td rowSpan={row.sampleSize}>{row.qty}</td>
            <td rowSpan={row.sampleSize}>{row.sampleSize}</td>
          </>
        )}

      
        {row.toeLoad.map((v, idx) => (
            <td key={idx}>{v}</td>
        ))}

       
        {i === 0 && (
          <>
            <td rowSpan={row.sampleSize}>{row.defectives}</td>
                <td rowSpan={row.sampleSize}>
                    {row.defectives}
            </td>


            <td rowSpan={row.sampleSize}>{row.result}</td>
          </>
        )}

      </tr>
    ))
  )}
</AnnexureTable>


      <AnnexureFooter />

    </AnnexureLayout>
  );
};

export default ToeLoadTestAnnexure;
