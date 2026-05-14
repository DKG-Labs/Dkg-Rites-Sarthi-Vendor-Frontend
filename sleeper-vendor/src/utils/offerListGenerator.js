import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateOfferListPDF = (call) => {
    if (!call) return;

    const doc = jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Helper colors
    const RED = [220, 0, 0];
    const BLACK = [0, 0, 0];
    
    // Helper for text formatting
    const setBold = () => doc.setFont('helvetica', 'bold');
    const setNormal = () => doc.setFont('helvetica', 'normal');
    const setTextColor = (color) => doc.setTextColor(color[0], color[1], color[2]);
    
    // 1. Header: OFFER LIST with border
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4); // Darker border
    doc.rect(10, 6, pageWidth - 20, 10); // Title box
    
    doc.setFontSize(14);
    setBold();
    setTextColor(BLACK);
    doc.text('OFFER LIST', pageWidth / 2, 13, { align: 'center' });
    
    doc.setFontSize(9);
    
    // 2. Information Section
    const startY = 20; 
    const rowH = 5.17;
    const col1 = 12;
    const col2 = 45;
    const col3 = 115; 
    const col4 = 135;
    
    const drawRow = (label, value, rowIdx, vCol = col2) => {
        const y = startY + (rowIdx * rowH);
        setTextColor(BLACK); setBold(); doc.text(label, col1, y);
        setTextColor(RED); setBold(); doc.text(`${value}`, vCol, y);
    };

    const drawRowRight = (label, value, rowIdx) => {
        const y = startY + (rowIdx * rowH);
        setTextColor(BLACK); setBold(); doc.text(label, col3, y);
        setTextColor(RED); setBold(); doc.text(`${value}`, col4, y);
    };
    
    drawRow('Purchase Order No.', `: ${call.poNo || '06255012201348'}`, 0);
    drawRow('PO Date:', `: ${call.poDate || '24/10/2025'}`, 1);
    
    drawRow('Consignee:', `: ${call.consignee || 'SSE/P.WAY/DSD/R'}`, 2);
    drawRowRight('BOOK NO.', `: ${call.bookNo || '047'}`, 2);
    
    drawRow('Drawing No:', `: ${call.sleeperType || 'RT-8746'}`, 3);
    drawRowRight('SET NO.', `: ${call.setNo || '002'}`, 3);
    
    const batchRange = call.batchesSelected && call.batchesSelected.length > 0 
        ? `${call.batchesSelected[0].batchNo} To ${call.batchesSelected[call.batchesSelected.length - 1].batchNo}`
        : 'NB-279 To NB-293';
    drawRow('Shed-2 Batch No.', `: ${batchRange}`, 4);
    drawRowRight('IC NO.', `: ${call.callNo || 'SF-07050001'}`, 4);
    
    drawRow('Shed-1 Batch No.', `: ${call.shed1BatchNo || '1404 TO 1434'}`, 5);
    drawRowRight('IC DATE.', `: ${call.callDate || '07/05/2026'}`, 5);

    // Draw border around header section
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4); // Darker border
    
    // Outer Box (Starts at 16, exactly where title box ends)
    const boxTop = 16; 
    doc.rect(10, boxTop, pageWidth - 20, 31); 
    
    // Horizontal lines
    doc.setLineWidth(0.2); // Inner lines slightly thinner but darker than before
    for (let i = 1; i <= 5; i++) {
        const lineY = boxTop + (i * 5.17);
        doc.line(10, lineY, pageWidth - 10, lineY);
    }
    
    // Vertical line
    doc.line(110, boxTop, 110, boxTop + 31);

    // 3. Table Data Preparation
    let rawBatches = call.batchesSelected || [];
    
    // For demonstration purposes, if few/no batches, add demo ones as requested
    if (rawBatches.length < 5) {
        const demoBatches = [
            { batchNo: 'NB-279', castDate: '23-01-2026', totalCasted: 304, previouslyOffered: 0, goodSleepers: 304 },
            { batchNo: 'NB-280', castDate: '24-01-2026', totalCasted: 320, previouslyOffered: 0, goodSleepers: 320 },
            { batchNo: 'NB-281', castDate: '25-01-2026', totalCasted: 280, previouslyOffered: 0, goodSleepers: 280 },
            { batchNo: 'NB-282', castDate: '27-01-2026', totalCasted: 320, previouslyOffered: 0, goodSleepers: 320 },
            { batchNo: 'NB-283', castDate: '28-01-2026', totalCasted: 288, previouslyOffered: 0, goodSleepers: 288 },
            { batchNo: 'NB-284', castDate: '30-01-2026', totalCasted: 312, previouslyOffered: 0, goodSleepers: 312 },
            { batchNo: 'NB-285', castDate: '31-01-2026', totalCasted: 248, previouslyOffered: 0, goodSleepers: 248 },
        ];
        // Combine real with demo or just demo if real is 0
        rawBatches = rawBatches.length > 0 ? rawBatches : demoBatches;
    }

    const tableData = rawBatches.map((batch, index) => [
        (index + 1).toString().padStart(2, '0'),
        batch.batchNo || 'N/A',
        batch.castDate || 'N/A',
        batch.totalCasted || '0',
        batch.previouslyOffered || '0',
        (batch.goodSleepers?.length || batch.goodSleepers || 0).toString(),
        // Accepted Sleepers (Normal, ET, MFT)
        '0', '0', '0', 
        // Rejection (Surface, Dim, Others, SBT)
        '0', '0', '0', '0',
        // Not Offered
        '0',
        // REMARKS
        '', '', ''
    ]);

    // Totals
    const totals = {
        cast: tableData.reduce((acc, row) => acc + parseInt(row[3] || 0), 0),
        prev: tableData.reduce((acc, row) => acc + parseInt(row[4] || 0), 0),
        now: tableData.reduce((acc, row) => acc + parseInt(row[5] || 0), 0),
    };
    
    const totalRow = [
        'Total', '', '', 
        totals.cast || '10356', 
        totals.prev || '0', 
        totals.now || '10356', 
        '10215', '39', '4', '0', '1', '3', '0', '0', '', '', ''
    ];
    tableData.push(totalRow);

    // 4. Render Table
    autoTable(doc, {
        startY: startY + 30,
        head: [[
            'Sl. No.', 'Batch No.', 'Date of Casting', 'Nos. Cast', 'Prev- offrd', 'Now offrd', 
            'Accepted Sleepers', '', '', 
            'Rejection', '', '', '', 
            'Not Offrd', 
            'REMARKS', '', ''
        ], [
            '', '', '', '', '', '', 
            'Norm', 'E.T.', 'M.F.T', 
            'Surf', 'Dim', 'Oth', 'SBT', 
            '', 
            'ET No', 'Rej No', 'MF No'
        ]],
        body: tableData,
        theme: 'grid',
        styles: { 
            fontSize: 6, 
            halign: 'center', 
            valign: 'middle', 
            textColor: RED, 
            fontStyle: 'bold', 
            lineWidth: 0.3, 
            cellPadding: 0.8, 
            lineColor: [0, 0, 0],
            minCellHeight: 8
        },
        headStyles: { fillColor: [255, 255, 255], textColor: BLACK, fontStyle: 'bold', lineWidth: 0.3, lineColor: [0, 0, 0] },
        columnStyles: {
            0: { cellWidth: 8, textColor: BLACK }, // Sl No
            1: { cellWidth: 15 }, // Batch No
            2: { cellWidth: 20 }, // Date
            3: { cellWidth: 10 }, // Nos Cast
            4: { cellWidth: 10 }, // Prev
            5: { cellWidth: 10 }, // Now
            6: { cellWidth: 9 }, // Norm
            7: { cellWidth: 9 }, // ET
            8: { cellWidth: 9 }, // MFT
            9: { cellWidth: 8 }, // Surf
            10: { cellWidth: 8 }, // Dim
            11: { cellWidth: 8 }, // Oth
            12: { cellWidth: 8 }, // SBT
            13: { cellWidth: 10 }, // Not Offrd
            14: { cellWidth: 16 }, // ET No
            15: { cellWidth: 16 }, // Rej No
            16: { cellWidth: 16 }, // MF No
        },
        didParseCell: function(data) {
            // Spanning headers
            if (data.section === 'head' && data.row.index === 0) {
                if (data.column.index === 6) data.cell.colSpan = 3;
                if (data.column.index === 9) data.cell.colSpan = 4;
                if (data.column.index === 14) data.cell.colSpan = 3;
                
                if ([7, 8, 10, 11, 12, 15, 16].includes(data.column.index)) {
                    data.cell.styles.fontSize = 0;
                    data.cell.content = '';
                }
            }
            // Totals row styling
            if (data.section === 'body' && data.row.index === tableData.length - 1) {
                data.cell.styles.textColor = BLACK;
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 10, right: 10 }
    });

    // 5. Footer with border
    const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 180) + 5;
    const footerWidth = pageWidth - 20;
    
    // Draw Footer Border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(10, finalY, footerWidth, 42); // Slightly taller for portrait
    
    doc.setLineWidth(0.4); // Darker internal lines
    // Line after abbreviations
    doc.line(10, finalY + 20, pageWidth - 10, finalY + 20);
    // Line after remarks
    doc.line(10, finalY + 31, pageWidth - 10, finalY + 31);

    doc.setFontSize(7);
    setTextColor(BLACK);
    setBold(); doc.text('Abbreviation:', 12, finalY + 4);
    // setNormal(); // Keep bold as requested
    const abbrev = '-ET= Epoxy Treated, MF= Moment of Failure, RD= Reject by Damage, RC=Reject By Crack, RG=Reject By Gauge, SD- Surface Defect, RSL- Rail Seat loose, RST- Rail Seat Tight, RSD- Rail Seat Defect, TGL- Toe Gap Loose, TGT- Toe Gap Tight, IT- Insert Tilt, IO- Insert Out, IS-Insert Sink, OGL- Outer Gauge Loose, OGT- Outer Gauge Tight, EB- End Broken, ED- End Damage, NFTC- Not Fit For Track Circuit, SHC- Surface Honey Combe, EHC- End Honey Comb,';
    const splitAbbrev = doc.splitTextToSize(abbrev, footerWidth - 10);
    setBold(); // Make entire abbreviation bold
    doc.text(splitAbbrev, 12, finalY + 8);

    const remarksY = finalY + 26;
    setBold(); doc.text('Remarks :', 12, remarksY);
    setTextColor(RED); setBold(); doc.text(call.remarks || '04 (Four) Nos. Sleepers are consumed in Moment of Failure Testing (M.F.T).', 28, remarksY);

    const ieY = remarksY + 10;
    setTextColor(BLACK); setBold(); doc.text('Inspecting Engineer:', 12, ieY);
    setTextColor(RED); setBold(); doc.text(call.ieName || 'P. GOPAL RAO', 44, ieY);

    // 6. Save PDF
    doc.save(`Offer_List_${call.callNo || 'Call'}.pdf`);
};
