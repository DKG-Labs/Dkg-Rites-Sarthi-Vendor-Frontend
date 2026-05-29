/**
 * Online Inspection Call Letter PDF Generator
 * Generates a properly formatted PDF matching the official call letter format.
 * Uses jsPDF for PDF generation.
 */

import jsPDF from 'jspdf';

/**
 * Helper: safely get a value or fallback string
 */
const val = (v, fallback = '-') => (v !== null && v !== undefined && v !== '' ? String(v) : fallback);

/**
 * Main function to generate and download the Call Letter PDF
 * @param {object} call - Call data object from the dashboard
 */
export const generateCallLetterPDF = (call) => {
    if (!call) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const tableWidth = pageW - margin * 2;
    const col1W = 70;
    const col2W = tableWidth - col1W;

    // ─── Colour palette ───────────────────────────────────────────────
    const BLACK = [0, 0, 0];
    const RED = [180, 0, 0];
    const DARK = [30, 30, 30];
    const GRAY_BG = [245, 245, 245];
    const BORDER = [180, 180, 180];

    let y = margin; // current Y cursor

    // ─── Utility helpers ─────────────────────────────────────────────

    const setFont = (style = 'normal', size = 9, color = BLACK) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
    };

    /**
     * Draw a two-column table row
     * @param {string} label     - left column text
     * @param {string|Array} value  - right column text(s). Pass array for multicolour segments [{text, color}]
     * @param {object} opts
     */
    const drawRow = (label, value, opts = {}) => {
        const labelLines = doc.splitTextToSize(label, col1W - 4);
        
        let valLinesCount = 1;
        const textVal = typeof value === 'object' && !Array.isArray(value) ? (value?.text || '') : val(value);
        if (textVal && !opts.valueFn) {
            valLinesCount = doc.splitTextToSize(textVal, col2W - 4).length;
        }

        const maxLines = Math.max(labelLines.length, valLinesCount);
        const calculatedH = maxLines * 4.5 + 4.5;
        const rowH = Math.max(opts.rowH || 9, calculatedH);

        const labelBold = opts.labelBold || false;
        const valueFn = opts.valueFn || null; // custom render fn

        // Row background
        if (opts.bg) {
            doc.setFillColor(...opts.bg);
            doc.rect(margin, y, tableWidth, rowH, 'F');
        }

        // Draw cell borders
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.rect(margin, y, col1W, rowH); // label cell
        doc.rect(margin + col1W, y, col2W, rowH); // value cell

        // Label text - split to fit within label column
        setFont(labelBold ? 'bold' : 'normal', 9, DARK);
        const labelLineH = 4.5;
        const labelBlockH = labelLines.length * labelLineH;
        const labelStartY = y + (rowH - labelBlockH) / 2 + 3.0;
        labelLines.forEach((line, i) => {
            doc.text(line, margin + 2, labelStartY + i * labelLineH);
        });

        // Value text
        if (valueFn) {
            valueFn(margin + col1W + 2, y + rowH / 2 + 1.5);
        } else if (Array.isArray(value)) {
            // Segments with different colours
            let xOff = margin + col1W + 2;
            value.forEach(seg => {
                setFont('normal', 9, seg.color || RED);
                doc.text(seg.text, xOff, y + rowH / 2 + 1.5);
                xOff += doc.getTextWidth(seg.text) + 1;
            });
        } else {
            setFont('normal', 9, typeof value === 'object' && value?.color ? value.color : RED);
            // Clip long text within cell
            const maxW = col2W - 4;
            const lines = doc.splitTextToSize(textVal, maxW);
            const lineH = 4.5;
            const valBlockH = lines.length * lineH;
            const valStartY = y + (rowH - valBlockH) / 2 + 3.0;
            lines.forEach((line, i) => {
                doc.text(line, margin + col1W + 2, valStartY + i * lineH);
            });
        }

        y += rowH;
    };

    /**
     * Draw a full-width row spanning both columns (used for body text)
     */
    const drawFullRow = (text, opts = {}) => {
        const rowH = opts.rowH || 10;
        if (opts.bg) {
            doc.setFillColor(...opts.bg);
            doc.rect(margin, y, tableWidth, rowH, 'F');
        }
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.rect(margin, y, tableWidth, rowH);
        setFont(opts.bold ? 'bold' : 'normal', opts.size || 9, opts.color || DARK);
        const lines = doc.splitTextToSize(text, tableWidth - 4);
        let ty = y + 3.5;
        lines.forEach(line => {
            doc.text(line, margin + 2, ty);
            ty += 4.5;
        });
        y += rowH;
    };

    /**
     * Draw a bold centered title row
     */
    const drawTitleRow = (text) => {
        const rowH = 11;
        doc.setFillColor(...GRAY_BG);
        doc.rect(margin, y, tableWidth, rowH, 'F');
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.2);
        doc.rect(margin, y, tableWidth, rowH);
        setFont('bold', 11, BLACK);
        doc.text(text, pageW / 2, y + rowH / 2 + 1.5, { align: 'center' });
        y += rowH;
    };

    /**
     * Check remaining page space and add new page if needed
     */
    const checkPageBreak = (needed = 20) => {
        if (y + needed > pageH - margin) {
            doc.addPage();
            y = margin;
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // HEADER SECTION
    // ═══════════════════════════════════════════════════════════════════

    // Current date/time
    const printDateTime = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Header info line (Generated on | Call No | System)
    setFont('normal', 7.5, [100, 100, 100]);
    doc.text(
        `Generated on: ${printDateTime}  |  Call No: ${val(call.callNumber)}  |  System: RITES Sarthi`,
        pageW / 2,
        y + 5,
        { align: 'center' }
    );
    y += 8;

    // Title row
    drawTitleRow('Online Inspection Call Letter');

    // Empty spacer row
    y += 2;

    // FROM row
    const fromValue = [
        val(call.vendor?.name),
        call.vendor?.location ? ` + ${call.vendor.location}` : '',
        call.vendor?.address ? ` + ${call.vendor.address}` : ''
    ].join('');
    drawRow('From', fromValue, { rowH: 9 });

    // DATE row
    const callRaisedDate = call.submissionDateTime
        ? new Date(call.submissionDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-';
    drawRow('Date', callRaisedDate, { rowH: 9 });

    // TO row – multi-line needs extra height
    const toValue = [
        `SBU Head Designation`,
        `RIO Name: ${val(call.rio)}`,
        `RIO Address: ${val(call.rio)} Regional Inspection Office`
    ].join('\n');
    drawRow('To', toValue);

    // ─── Body text block ─────────────────────────────────────────────
    y += 1;
    const bodyText =
        'Dear Sir,\nPlease arrange to inspect following goods lying ready with us. It is certified that the stores offered conform to governing specifications.';
    const bodyRowH = 14;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, tableWidth, bodyRowH);
    setFont('normal', 9, DARK);
    const bodyLines = doc.splitTextToSize(bodyText, tableWidth - 4);
    bodyLines.forEach((line, i) => {
        doc.text(line, margin + 2, y + 4 + i * 4.5);
    });
    y += bodyRowH;

    // ═══════════════════════════════════════════════════════════════════
    // INSPECTION CALL DETAILS TABLE
    // ═══════════════════════════════════════════════════════════════════

    // Inspection Call Number
    drawRow('Inspection Call Number', val(call.callNumber), { rowH: 9 });

    // IE (empty until verified)
    const ieValue = call.assignedIeName
        ? `${call.assignedIeName}${call.assignedIeMobile ? ' - ' + call.assignedIeMobile : ''}`
        : 'Will remain empty till the call is verified by Call Desk';
    drawRow('IE', ieValue, { rowH: 9 });

    // Stage of Inspection
    const stageDisplay = call.stage || call.productStage || 'Raw Material Inspection';
    drawRow('Stage of Inspection', { text: stageDisplay, color: BLACK }, { rowH: 9 });

    checkPageBreak(50);

    // PO Number & Date
    // Use the raw composite string from backend (e.g. "WR / 26255265205057 / 012") as primary source.
    // Fall back to assembling from parts only if rlyPoSr is unavailable.
    let poBase;
    if (call.rlyPoSr && call.rlyPoSr !== '-') {
        poBase = call.rlyPoSr;
    } else {
        const parts = [
            call.rlyShortName && call.rlyShortName !== '-' ? call.rlyShortName : null,
            call.poNumber && call.poNumber !== '-' ? call.poNumber : null,
            call.poSerialNo && call.poSerialNo !== '-' ? call.poSerialNo : null
        ].filter(Boolean);
        poBase = parts.join(' / ') || '-';
    }
    const poValue = [
        poBase,
        call.poDate ? `Date of PO: ${call.poDate}` : '',
        (call.itemDesc || call.itemDescription || call.itemCatDescr) ? `${call.itemDesc || call.itemDescription || call.itemCatDescr}` : ''
    ].filter(Boolean).join('\n');
    drawRow('PO Number & Date', poValue);

    // PO Sr. No Item Description - uses itemDesc from CallLetterDetailsDto
    const itemDescText = val(call.itemDesc || call.itemDescription || call.itemCatDescr);
    drawRow('PO Sr. No Item Description', itemDescText);

    checkPageBreak(60);

    // ─── Product & Quantity details ──────────────────────────────────
    drawRow('Product Selected By Vendor', val(call.product), { rowH: 9 });

    // PO Sr. No. Qty — uses poQty + uom from CallLetterDetailsDto
    const poSrNoQty = call.poQty
        ? `${call.poQty}${call.uom ? ' ' + call.uom : ''}`
        : (call.quantity ? `${call.quantity} MT` : '-');
    drawRow('PO Sr. No. Qty', poSrNoQty, { rowH: 9 });

    // Call Qty — uses callQty + callUnit from CallLetterDetailsDto
    const callQtyStr = call.callQty
        ? `${call.callQty}${call.callUnit ? ' ' + call.callUnit : ''}`
        : (call.subPoQuantity ? `${call.subPoQuantity} MT` : '-');
    drawRow('Call Qty', callQtyStr, { rowH: 9 });

    // DP Dates — uses deliveryDate / extendedDeliveryDate from CallLetterDetailsDto (pre-formatted dd.MM.yyyy by backend)
    drawRow('Orignal DP Date', val(call.deliveryDate || call.originalDeliveryDate || call.dpDate), { rowH: 9 });
    drawRow('Ext DP Date', val(call.extendedDeliveryDate || call.extDpDate), { rowH: 9 });
    drawRow('Desired Date of Inspection', val(call.desiredInspectionDate), { rowH: 9 });
    // Purchaser / Consignee / Bill Paying Authority — from CallLetterDetailsDto
    const formatTildeStr = (str) => {
        if (!str) return '-';
        return str.includes('~')
            ? str.split('~').map(s => s.trim()).filter(s => s && s !== '#').join(', ')
            : str;
    };
    drawRow('Purchaser', formatTildeStr(call.purchaserDetail || call.purchasingAuthority), { rowH: 9 });
    drawRow('Consginee', formatTildeStr(call.consigneeDetail || call.consigneeName || call.billPayingOfficer), { rowH: 9 });
    drawRow('Bill Paying Authority', formatTildeStr(call.billPayOffDesc || call.billPayingOfficer), { rowH: 9 });
    // Manufacturer — uses manufacturerName from CallLetterDetailsDto
    drawRow("Manufacturer's Name", val(call.manufacturerName || call.vendor?.name || call.manufacturerOfMaterial), { rowH: 9 });
    drawRow('Place of Inspection', val(call.placeOfInspection), { rowH: 9 });
    drawRow('Offered Installment Number', val(call.submissionCount || '1'), { rowH: 9 });

    checkPageBreak(50);

    drawRow('Raw Material Qty Already Passed for this PO Sr. No.', val(call.rawMaterialQtyPassed), { rowH: 12 });
    drawRow('Final Accepted Qty of this PO Sr. No.', val(call.finalAcceptedQty), { rowH: 12 });
    drawRow('Total PO Quantity', val(call.poQuantity), { rowH: 9 });
    drawRow('Total PO Value', val(call.poValue), { rowH: 9 });

    // Raw Material Details to be offered
    checkPageBreak(30);
    const heatDetails = call.heatDetails && call.heatDetails.length > 0
        ? call.heatDetails.map(h =>
            `Heat No.: ${val(h.heatNo)}, TC No. - ${val(h.tcNo)}, Qty Offered: ${val(h.qtyOffered)} MT`
        ).join('\n') +
        `\n\nTotal Qty Offered - ${call.subPoQuantity || call.quantity || '-'} MT`
        : call.tcNumber
            ? `Heat No.: -, TC No. - ${val(call.tcNumber)}, Qty Offered: ${val(call.subPoQuantity || call.quantity)} MT\n\nTotal Qty Offered - ${val(call.subPoQuantity || call.quantity)} MT`
            : '-';
    drawRow('Raw Material Details to be offered', heatDetails);

    // ─── Terms & Closing ─────────────────────────────────────────────
    checkPageBreak(40);

    drawFullRow('I hereby accept all the Terms and Conditions.', { rowH: 8, bold: false });

    y += 3; // small gap

    drawFullRow('Thanking you,', { rowH: 7 });
    drawFullRow('Yours Faithfully,', { rowH: 7 });

    drawRow('Name', val(call.contactPersonName || call.vendor?.name), { rowH: 9 });
    drawRow('Mobile', val(call.contactMobile || call.vendor?.contact), { rowH: 9 });
    drawRow('Vendor Email', val(call.contactEmail || call.vendor?.email), { rowH: 9 });

    // ─── Save the PDF ─────────────────────────────────────────────────
    const filename = `Call_Letter_${val(call.callNumber, 'UNKNOWN').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    doc.save(filename);
};
