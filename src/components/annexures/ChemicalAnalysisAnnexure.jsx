import React from 'react';
import AnnexureTemplate from '../AnnexureTemplate';

/**
 * Chemical Analysis Annexure - Annexure-I
 * Stage Inspection for Raw material - Test Result: Chemical Analysis
 */

const ChemicalAnalysisAnnexure = ({ data = [], selectedCall }) => {
  // Handle API response structure vs legacy array structure
  const isApiData = !Array.isArray(data) && data?.rows;
  const apiRows = isApiData ? data.rows : [];
  const headerMeta = isApiData ? data : {};
  
  // Header configuration
  const headerData = {
    logoText: 'RITES',
    companyName: 'RITES LTD',
    division: '(QA DIVISION)',
    mainTitle: 'INSPECTION & TEST PLAN',
    productName: selectedCall?.product_type || 'ELASTIC RAIL CLIP MK-III/MK-V',
    docNo: 'QA/WR/MECH',
    issueNo: '',
    pageNo: '9 of 18',
    effectiveDate: '',
    preparedBy: 'KJM',
    checkedBy: 'CSR',
    approvedBy: 'GM(I)/WR',
    // New fields for title and subtitle sections
    title: 'Stage Inspection for Raw material',
    subtitle: 'Test Result- Chemical Analysis',
    annexureNumber: 'Annexure-I',
    annexureCode: 'IRST-31-2025',
    vendorName: headerMeta.manufacturer || selectedCall?.vendor_name,
    callNo: headerMeta.inspectionCallNo || selectedCall?.call_no,
    certificateNo: headerMeta.certificateNo,
    dateOfInspection: headerMeta.dateOfInspection
  };

  // Complex table headers with multi-row structure
  const tableHeaders = [
    { label: 'S. No.', rowSpan: 3, style: { width: '40px' } },
    { label: 'Date', rowSpan: 3, style: { width: '80px' } },
    { label: 'Source of Raw material name & trademark', rowSpan: 3, style: { width: '100px' } },
    { label: 'Certificate No.', rowSpan: 3, style: { width: '80px' } },
    { label: 'Cast / Heat No.', rowSpan: 3, style: { width: '80px' } },
    { label: 'Coil or code (bar Nos)', rowSpan: 3, style: { width: '80px' } },
    { label: 'Sample no.', rowSpan: 3, style: { width: '70px' } },
    
    // Chemical Analysis report - complex nested headers
    { label: 'Chemical Analysis report', colSpan: 6, style: { borderBottom: '1px solid #000' } },
    
    { label: 'Grain Size No (or finer)', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Inclusion Rating (thin) Finish 2.0 max.', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Hardness BRINELL/HV', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Depth of Decarb (d) 0.00 or 0.5 mm', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Freedom from Defects', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Accepted or Not Accepted', rotated: true, rowSpan: 3, style: { width: '35px' } },
    { label: 'Sign of Lab Supervisor', rotated: true, rowSpan: 3, style: { width: '35px' } }
  ];

  // Generate table data rows
  const tableData = [];

  // Map data to table rows
  const displayRows = isApiData ? apiRows : (Array.isArray(data) && data.length > 0 ? data : []);

  if (displayRows.length === 0 && !isApiData) {
    // Generate empty rows only if it's completely empty data
    for (let i = 1; i <= 4; i++) {
        tableData.push({
          cells: Array(19).fill({ value: '', isData: true })
        });
    }
  } else {
    displayRows.forEach((row) => {
        tableData.push({
          cells: [
            { value: row.sNo, isData: false },
            { value: row.date || headerMeta.dateOfInspection, isData: true },
            { value: row.source || headerMeta.manufacturer, isData: true },
            { value: row.certNo || headerMeta.certificateNo, isData: true },
            { value: row.heatNo, isData: true },
            { value: row.coilCode || '', isData: true },
            { value: row.sampleNo, isData: true },
            { value: row.carbon || row.c, isData: true },
            { value: row.manganese || row.mn, isData: true },
            { value: row.silicon || row.si, isData: true },
            { value: row.sulphur || row.s, isData: true },
            { value: row.phosphorus || row.p, isData: true },
            { value: row.grainSize, isData: true },
            { value: row.inclusion, isData: true },
            { value: row.hardness, isData: true },
            { value: row.decarb, isData: true },
            { value: row.freedomFromDefects || row.freedom, isData: true },
            { value: row.acceptedOrNot || row.accepted, isData: true },
            { value: row.sign || '', isData: true }
          ]
        });
    });
  }

  // Footer data
  const footerData = {
    stampText: 'STAMP',
    ieName: 'Dharm Singh Fartyal',
    ieDesignation: 'Sr. Manager (Mech.)',
    ieLocation: 'RITES Ltd. / W.R. MUMBAI - 21'
  };

  return (
    <AnnexureTemplate
      headerData={headerData}
      title="Stage Inspection for Raw material"
      subtitle="Test Result- Chemical Analysis"
      annexureNumber="Annexure-I"
      annexureCode="IRST-31 - 2025"
      tableHeaders={tableHeaders}
      tableData={tableData}
      footerData={footerData}
      selectedCall={selectedCall}
    />
  );
};

export default ChemicalAnalysisAnnexure;
