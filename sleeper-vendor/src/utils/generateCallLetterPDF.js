/**
 * Online Inspection Call Letter PDF Generator for Sleeper Vendor
 * Generates a properly formatted PDF matching the official RITES call letter format (same format as ERC).
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
 * @param {boolean} shouldDownload - Whether to trigger browser download immediately
 */
export const generateCallLetterPDF = (call, shouldDownload = true) => {
    if (!call) return null;

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

    const callNumberStr = val(call.callNumber || call.callNo || call.requestId);

    // Header info line (Generated on | Call No | System)
    setFont('normal', 7.5, [100, 100, 100]);
    doc.text(
        `Generated on: ${printDateTime}  |  Call No: ${callNumberStr}  |  System: RITES Sarthi`,
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
    const vendorNameStr = call.vendorName || call.vendor?.name || '-';
    const fromValue = [
        vendorNameStr !== '-' ? vendorNameStr : null,
        call.vendor?.location ? ` + ${call.vendor.location}` : null,
        call.vendor?.address ? ` + ${call.vendor.address}` : null
    ].filter(Boolean).join('');
    drawRow('From', fromValue || '-', { rowH: 9 });

    // DATE row
    const submissionDateStr = call.submissionDateTime || call.callDate || call.submissionDate || call.created_at || call.createdAt || call.desiredInspectionDate;
    const callRaisedDate = submissionDateStr
        ? (submissionDateStr.includes('/') ? submissionDateStr : (new Date(submissionDateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })))
        : '-';
    drawRow('Date', callRaisedDate !== 'Invalid Date' ? callRaisedDate : String(submissionDateStr).split('T')[0], { rowH: 9 });

    // TO row – multi-line needs extra height
    const getRioAddress = () => {
        let rioName = call.rio;
        switch (String(rioName).toUpperCase()) {
            case 'ERIO':
                return [
                    '(SBU Head, ERIO)',
                    'Eastern Region Inspection Office',
                    'RITES LTD. (A Govt. of India Enterprise)',
                    'OJAS BHAWAN, 7TH FLOOR, PLOT NO. DJ/20, STREET NO.326,',
                    'ACTION AREA 1D, NEW TOWN, KOLKATA - 700 156',
                    '033-22348912, sbu.einsp@rites.com'
                ].join('\n');
            case 'NRIO':
                return [
                    '(SBU Head/NRIO)',
                    'NORTHERN REGION INSPECTION OFFICE',
                    'RITES LTD. (A Govt. of India Enterprise)',
                    '12TH FLOOR, CORE-2, SCOPE MINAR,',
                    'LAXMI NAGAR, DELHI-110092',
                    '011-22402502, sbu.ninsp@rites.com'
                ].join('\n');
            case 'WRIO':
                return [
                    '(SBU Head/WRIO)',
                    'WESTERN REGION INSPECTION OFFICE',
                    'RITES LTD. (A Govt. of India Enterprise)',
                    '5TH FLOOR, REGENT CHAMBER, ABOVE STATUS',
                    'RESTAURANT, NARIMAN POINT, MUMBAI -400021',
                    '+91-22-68943400/68943445',
                    'wrinspn@rites.com'
                ].join('\n');
            case 'CRIO':
                return [
                    '(SBU Head/CRIO)',
                    'CENTRAL REGION INSPECTION OFFICE',
                    '50, EXPANSION BUILDING, BHILAI STEEL PLANT AREA',
                    'BHILAI -490001',
                    '+91-788-2227304/2226457, +91-788-2227305',
                    'crinspn@rites.com'
                ].join('\n');
            case 'SRIO':
                return [
                    '(SBU Head/SRIO)',
                    'SOUTHERN REGION INSPECTION OFFICE',
                    'RITES LTD. (A Govt. of India Enterprise)',
                    'CTS BUILDING - 2ND FLOOR, BSNL COMPLEX, NO. 16,',
                    'GREAMS ROAD CHENNAI-600006',
                    '+91-44-28290356, 28292807, 28292817',
                    '+91-44-28290359'
                ].join('\n');
            default:
                return [
                    `SBU Head Designation`,
                    `RIO Name: ${val(rioName)}`,
                    `RIO Address: ${val(rioName)} Regional Inspection Office`
                ].join('\n');
        }
    };
    const toValue = getRioAddress();
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
    drawRow('Inspection Call Number', callNumberStr, { rowH: 9 });

    // Case Number
    drawRow('Case No.', val(call.caseNo || call.case_no), { rowH: 9 });

    // IE (empty until verified)
    const assignedIeStr = call.assignedIeName || call.ieName || call.assignedIE;
    const isIeAssigned = assignedIeStr && assignedIeStr !== 'Not Assigned' && assignedIeStr !== '-';

    const ieMobile = call.assignedIeMobile || call.ieMobile;
    const ieValue = isIeAssigned
        ? `${assignedIeStr}${ieMobile ? ' - ' + ieMobile : ''}`
        : ' ';
    drawRow('IE', ieValue, { rowH: 9 });

    // Stage of Inspection
    let stageDisplay = call.stage || call.productStage || call.typeOfCall || call.productType || '';
    const icNoStr = callNumberStr.toUpperCase();
    if (icNoStr.startsWith('EP') || icNoStr.startsWith('RPP') || icNoStr.includes('-EP') || String(stageDisplay).toLowerCase().includes('process')) {
        stageDisplay = 'Process Inspection';
    } else if (icNoStr.startsWith('EF') || icNoStr.startsWith('RPF') || icNoStr.startsWith('SF') || icNoStr.includes('-EF') || String(stageDisplay).toLowerCase().includes('final')) {
        stageDisplay = 'Final Inspection';
    } else if (icNoStr.startsWith('ER') || icNoStr.startsWith('RMC') || icNoStr.includes('-ER') || String(stageDisplay).toLowerCase().includes('raw')) {
        stageDisplay = 'Raw Material Inspection';
    } else if (!stageDisplay || stageDisplay === '-') {
        stageDisplay = 'Final Inspection';
    }
    drawRow('Stage of Inspection', { text: stageDisplay, color: BLACK }, { rowH: 9 });

    checkPageBreak(50);

    // PO Number & Date
    let poBase;
    if (call.rlyPoSr && call.rlyPoSr !== '-') {
        poBase = call.rlyPoSr;
    } else {
        const parts = [
            call.rlyShortName && call.rlyShortName !== '-' ? call.rlyShortName : null,
            (call.poNumber || call.poNo) && (call.poNumber || call.poNo) !== '-' ? (call.poNumber || call.poNo) : null,
            (call.poSerialNo || call.srNo) && (call.poSerialNo || call.srNo) !== '-' ? (call.poSerialNo || call.srNo) : null
        ].filter(Boolean);
        poBase = parts.join(' / ') || '-';
    }
    const poValue = [
        poBase,
        call.poDate ? `Date of PO: ${call.poDate}` : ''
    ].filter(Boolean).join('\n');
    drawRow('PO Number & Date', poValue);

    // PO Sr. No Item Description
    const itemDescText = val(call.itemDesc || call.itemDescription || call.itemCatDescr || call.poDes);
    drawRow('PO Sr. No Item Description', itemDescText);

    checkPageBreak(60);

    // ─── Product & Quantity details ──────────────────────────────────
    const prodName = call.product || call.sleeperType || call.productType || 'Prestressed Concrete Sleepers';
    drawRow('Product Selected By Vendor', val(prodName), { rowH: 9 });

    // PO Sr. No. Qty
    const poSrNoQty = call.poQty
        ? `${call.poQty}${call.uom ? ' ' + call.uom : ''}`
        : (call.orderedQty ? `${call.orderedQty} Nos.` : (call.quantity ? `${call.quantity} MT` : '-'));
    drawRow('PO Sr. No. Qty', poSrNoQty, { rowH: 9 });

    // Call Qty
    const callQtyStr = call.callQty
        ? `${call.callQty}${call.callUnit ? ' ' + call.callUnit : ''}`
        : (call.totalOffered || call.qtyOffered ? `${call.totalOffered || call.qtyOffered} Nos.` : '-');
    drawRow('Call Qty', callQtyStr, { rowH: 9 });

    // DP Dates
    drawRow('Orignal DP Date', val(call.deliveryDate || call.originalDeliveryDate || call.dpDate), { rowH: 9 });
    drawRow('Ext DP Date', val(call.extendedDeliveryDate || call.extDpDate), { rowH: 9 });
    drawRow('Desired Date of Inspection', val(call.desiredInspectionDate || call.callDate), { rowH: 9 });

    // Purchaser / Consignee / Bill Paying Authority
    const formatTildeStr = (str) => {
        if (!str) return '-';
        return str.includes('~')
            ? str.split('~').map(s => s.trim()).filter(s => s && s !== '#').join(', ')
            : str;
    };
    drawRow('Purchaser', formatTildeStr(call.purchaserDetail || call.purchasingAuthority), { rowH: 9 });
    drawRow('Consginee', formatTildeStr(call.consigneeDetail || call.conigness || call.consigneeName || call.billPayingOfficer), { rowH: 9 });
    drawRow('Bill Paying Authority', formatTildeStr(call.billPayOffDesc || call.billPayingOfficer), { rowH: 9 });

    // Manufacturer
    drawRow("Manufacturer's Name", val(call.manufacturerName || call.vendor?.name || call.vendorName || call.manufacturerOfMaterial), { rowH: 9 });

    const formatPoi = (str) => {
        if (!str) return '-';
        const parts = str.split(',').map(s => s.trim());
        const uniqueParts = [];
        parts.forEach(p => {
            if (p && !uniqueParts.includes(p)) {
                uniqueParts.push(p);
            }
        });
        return uniqueParts.join(', ');
    };
    drawRow('Place of Inspection', formatPoi(call.placeOfInspection || call.plantId), { rowH: 9 });
    drawRow('Offered Installment Number', val(call.submissionCount || call.offeredInstallmentNo || '1'), { rowH: 9 });

    checkPageBreak(50);

    drawRow('Raw Material Qty Already Passed for this PO Sr. No.', val(call.rawMaterialQtyPassed, 'N/A'), { rowH: 12 });
    drawRow('Final Accepted Qty of this PO Sr. No.', val(call.finalAcceptedQty || (call.acceptedTillNow ? `${call.acceptedTillNow} Nos.` : '0 Nos.')), { rowH: 12 });
    drawRow('Total PO Quantity', val(call.poQuantity || call.poQty || '-'), { rowH: 9 });
    drawRow('Total PO Value', val(call.poValue || (call.totalValue ? `₹${call.totalValue}` : '-')), { rowH: 9 });

    // Raw Material / Batch Details to be offered
    checkPageBreak(30);
    let batchDisplay = '-';
    if (call.heatDetails && call.heatDetails.length > 0) {
        batchDisplay = call.heatDetails.map(h =>
            `${h.heatNo || 'Batch'}: ${val(h.tcNo)}, Qty: ${val(h.qtyOffered)} Nos.`
        ).join('\n');
    } else if (call.batchesSelected && call.batchesSelected.length > 0) {
        batchDisplay = call.batchesSelected.map(b =>
            `Batch ${b.batchNo}: Good: ${b.goodSleepers ? b.goodSleepers.length : 0}${b.badSleepers && b.badSleepers.length > 0 ? ' | Rejected: ' + b.badSleepers.length : ''}`
        ).join('\n');
    } else if (call.batches) {
        batchDisplay = `Total Batches Offered: ${call.batches} | Total Sleepers: ${call.qtyOffered || call.totalOffered || '-'}`;
    }
    drawRow('Batches / Stores Details to be offered', batchDisplay);

    // Remarks
    drawRow('Remarks', val(call.remarks || call.remark), { rowH: 9 });

    // ─── Terms & Closing ─────────────────────────────────────────────
    checkPageBreak(40);

    drawFullRow('I hereby accept all the Terms and Conditions.', { rowH: 8, bold: false });

    y += 3; // small gap

    drawFullRow('Thanking you,', { rowH: 7 });
    drawFullRow('Yours Faithfully,', { rowH: 7 });

    drawRow('Name', val(call.contactPersonName || call.vendor?.name || call.vendorName), { rowH: 9 });
    drawRow('Mobile', val(call.contactMobile || call.vendor?.contact), { rowH: 9 });
    drawRow('Vendor Email', val(call.contactEmail || call.vendor?.email), { rowH: 9 });

    // ─── Save the PDF ─────────────────────────────────────────────────
    if (shouldDownload) {
        const filename = `Call_Letter_${callNumberStr.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
        doc.save(filename);
    }
    return doc;
};
