import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate Offer List PDF with actual inspection call data
 * @param {object} call - Inspection call object
 */
export const generateOfferListPDF = (call) => {
    if (!call) return;

    const doc = new jsPDF({
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
    doc.setLineWidth(0.4);
    doc.rect(10, 6, pageWidth - 20, 10);
    
    doc.setFontSize(14);
    setBold();
    setTextColor(BLACK);
    doc.text('OFFER LIST', pageWidth / 2, 13, { align: 'center' });
    
    doc.setFontSize(9);
    
    // 2. Information Section
    const startY = 20; 
    const rowH = 5.17;
    const col1 = 12;
    const col2 = 48;
    const col3 = 115; 
    const col4 = 135;
    
    const drawRow = (label, value, rowIdx, vCol = col2) => {
        const y = startY + (rowIdx * rowH);
        setTextColor(BLACK); setBold(); doc.text(label, col1, y);
        setTextColor(RED); setBold(); doc.text(`${value || '-'}`, vCol, y);
    };

    const drawRowRight = (label, value, rowIdx) => {
        const y = startY + (rowIdx * rowH);
        setTextColor(BLACK); setBold(); doc.text(label, col3, y);
        setTextColor(RED); setBold(); doc.text(`${value || '-'}`, col4, y);
    };

    const consigneeVal = call.consignee || call.consigneeDetail || call.conigness || '-';
    const cleanConsignee = consigneeVal.includes('~') ? consigneeVal.split('~')[0].trim() : consigneeVal;

    drawRow('Purchase Order No.', `: ${call.poNo || call.poNumber || '-'}`, 0);
    drawRow('PO Date:', `: ${call.poDate || '-'}`, 1);
    
    drawRow('Consignee:', `: ${cleanConsignee}`, 2);
    drawRowRight('BOOK NO.', `: ${call.bookNo || '-'}`, 2);
    
    drawRow('Drawing No:', `: ${call.drawingNo || call.sleeperType || '-'}`, 3);
    drawRowRight('SET NO.', `: ${call.setNo || '-'}`, 3);
    
    let rawBatches = call.batchesSelected || [];
    let batchRange = '-';
    if (rawBatches.length > 0) {
        const first = rawBatches[0].batchNo || rawBatches[0];
        const last = rawBatches[rawBatches.length - 1].batchNo || rawBatches[rawBatches.length - 1];
        batchRange = first === last ? `${first}` : `${first} To ${last}`;
    }

    drawRow('Shed-2 Batch No.', `: ${call.shed2BatchNo || batchRange}`, 4);
    drawRowRight('IC NO.', `: ${call.callNo || call.callNumber || call.requestId || '-'}`, 4);
    
    drawRow('Shed-1 Batch No.', `: ${call.shed1BatchNo || '-'}`, 5);
    drawRowRight('IC DATE.', `: ${call.callDate || call.submissionDate || call.desiredInspectionDate || '-'}`, 5);

    // Draw border around header section
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    
    const boxTop = 16; 
    doc.rect(10, boxTop, pageWidth - 20, 31); 
    
    // Horizontal lines
    doc.setLineWidth(0.2);
    for (let i = 1; i <= 5; i++) {
        const lineY = boxTop + (i * 5.17);
        doc.line(10, lineY, pageWidth - 10, lineY);
    }
    
    // Vertical line
    doc.line(110, boxTop, 110, boxTop + 31);

    // 3. Table Data Preparation from REAL batches
    let tableData = [];

    if (rawBatches.length > 0) {
        tableData = rawBatches.map((batch, index) => {
            const batchNo = batch.batchNo || batch.name || `Batch ${index + 1}`;
            const castDate = batch.castDate || batch.castingDate || batch.date || call.callDate || '-';
            
            const goodCount = Array.isArray(batch.goodSleepers) 
                ? batch.goodSleepers.length 
                : (typeof batch.goodSleepers === 'number' ? batch.goodSleepers : (batch.qtyOffered || batch.totalOffered || call.qtyOffered || 0));
                
            const badCount = Array.isArray(batch.badSleepers)
                ? batch.badSleepers.length
                : (typeof batch.badSleepers === 'number' ? batch.badSleepers : (batch.totalRejected || 0));

            const totalCast = batch.totalCasted || (goodCount + badCount) || goodCount;
            const prevOffrd = batch.previouslyOffered || 0;
            const nowOffrd = goodCount;

            const normAccepted = batch.acceptedNorm || batch.norm || (call.status === 'Accepted' || call.status === 'Completed' ? goodCount : 0);
            const etAccepted = batch.acceptedEt || 0;
            const mftAccepted = batch.acceptedMft || 0;

            const surfRej = batch.rejSurf || 0;
            const dimRej = batch.rejDim || 0;
            const othRej = batch.rejOth || badCount;
            const sbtRej = batch.rejSbt || 0;

            const notOffrd = batch.notOffered || (totalCast - nowOffrd - prevOffrd > 0 ? totalCast - nowOffrd - prevOffrd : 0);

            return [
                (index + 1).toString().padStart(2, '0'),
                batchNo,
                castDate,
                totalCast.toString(),
                prevOffrd.toString(),
                nowOffrd.toString(),
                // Accepted Sleepers (Norm, E.T., M.F.T)
                normAccepted.toString(),
                etAccepted.toString(),
                mftAccepted.toString(),
                // Rejection (Surf, Dim, Oth, SBT)
                surfRej.toString(),
                dimRej.toString(),
                othRej.toString(),
                sbtRej.toString(),
                // Not Offrd
                notOffrd.toString(),
                // REMARKS (ET No, Rej No, MF No)
                batch.etNo || '',
                batch.rejNo || '',
                batch.mfNo || ''
            ];
        });
    } else {
        // Single row with overall call quantities if individual batch array not present
        const totalQty = call.qtyOffered || call.totalOffered || 0;
        tableData = [[
            '01',
            call.batchNo || batchRange !== '-' ? batchRange : 'Batch-1',
            call.callDate || '-',
            totalQty.toString(),
            '0',
            totalQty.toString(),
            (call.status === 'Accepted' || call.status === 'Completed' ? totalQty : 0).toString(),
            '0', '0',
            '0', '0', (call.totalRejected || 0).toString(), '0',
            '0',
            '', '', ''
        ]];
    }

    // Calculate dynamic totals from actual data
    const sumCol = (colIdx) => tableData.reduce((acc, row) => acc + (parseInt(row[colIdx]) || 0), 0);

    const totalRow = [
        'Total', '', '', 
        sumCol(3).toString(), 
        sumCol(4).toString(), 
        sumCol(5).toString(), 
        sumCol(6).toString(), 
        sumCol(7).toString(), 
        sumCol(8).toString(), 
        sumCol(9).toString(), 
        sumCol(10).toString(), 
        sumCol(11).toString(), 
        sumCol(12).toString(), 
        sumCol(13).toString(), 
        '', '', ''
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
            minCellHeight: 7
        },
        headStyles: { fillColor: [255, 255, 255], textColor: BLACK, fontStyle: 'bold', lineWidth: 0.3, lineColor: [0, 0, 0] },
        columnStyles: {
            0: { cellWidth: 8, textColor: BLACK },
            1: { cellWidth: 16 },
            2: { cellWidth: 19 },
            3: { cellWidth: 10 },
            4: { cellWidth: 10 },
            5: { cellWidth: 10 },
            6: { cellWidth: 9 },
            7: { cellWidth: 9 },
            8: { cellWidth: 9 },
            9: { cellWidth: 8 },
            10: { cellWidth: 8 },
            11: { cellWidth: 8 },
            12: { cellWidth: 8 },
            13: { cellWidth: 10 },
            14: { cellWidth: 16 },
            15: { cellWidth: 16 },
            16: { cellWidth: 16 },
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
    doc.rect(10, finalY, footerWidth, 38);
    
    doc.setLineWidth(0.3);
    // Line after abbreviations
    doc.line(10, finalY + 18, pageWidth - 10, finalY + 18);
    // Line after remarks
    doc.line(10, finalY + 28, pageWidth - 10, finalY + 28);

    doc.setFontSize(7);
    setTextColor(BLACK);
    setBold(); doc.text('Abbreviation:', 12, finalY + 4);
    const abbrev = '-ET= Epoxy Treated, MF= Moment of Failure, RD= Reject by Damage, RC=Reject By Crack, RG=Reject By Gauge, SD- Surface Defect, RSL- Rail Seat loose, RST- Rail Seat Tight, RSD- Rail Seat Defect, TGL- Toe Gap Loose, TGT- Toe Gap Tight, IT- Insert Tilt, IO- Insert Out, IS-Insert Sink, OGL- Outer Gauge Loose, OGT- Outer Gauge Tight, EB- End Broken, ED- End Damage, NFTC- Not Fit For Track Circuit, SHC- Surface Honey Combe, EHC- End Honey Comb,';
    const splitAbbrev = doc.splitTextToSize(abbrev, footerWidth - 10);
    setBold();
    doc.text(splitAbbrev, 12, finalY + 8);

    const remarksY = finalY + 24;
    setBold(); doc.text('Remarks :', 12, remarksY);
    setTextColor(RED); setBold(); doc.text(call.remarks || 'Stores offered conform to governing specifications and are ready for inspection.', 28, remarksY);

    const ieY = finalY + 34;
    setTextColor(BLACK); setBold(); doc.text('Inspecting Engineer:', 12, ieY);
    const ieNameVal = call.assignedIeName || call.ieName || call.assignedIE || 'Awaiting IE Assignment';
    setTextColor(RED); setBold(); doc.text(ieNameVal, 44, ieY);

    // 6. Save PDF
    const safeCallNo = (call.callNo || call.callNumber || call.requestId || 'Call').replace(/[^a-zA-Z0-9-_]/g, '_');
    doc.save(`Offer_List_${safeCallNo}.pdf`);
};
