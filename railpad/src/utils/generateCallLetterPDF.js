import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import inspectionCallService from '../services/inspectionCallService';

/**
 * Generates the official Online Inspection Call Letter PDF matching RITES format.
 * 
 * @param {Object} call - The inspection call object or summary object
 */
export const generateRailpadCallLetterPDF = async (call, shouldDownload = true) => {
    if (!call) return;

    // Attempt to fetch full call/PO details if available
    let fullDetails = null;
    let summaryData = null;
    const callNo = call.callNo || call.call_no || call.requestId;

    try {
        if (call.id) {
            fullDetails = await inspectionCallService.getById(call.id);
        }
    } catch (e) {
        console.warn('Could not fetch call by ID:', e);
    }

    try {
        if (callNo) {
            summaryData = await inspectionCallService.getSummary ? await inspectionCallService.getSummary(callNo) : null;
        }
    } catch (e) {
        console.warn('Could not fetch call summary:', e);
    }

    // Merge data from call, fullDetails, and summaryData
    const merged = { ...call, ...(fullDetails || {}), ...(summaryData || {}) };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth(); // 210
    const margin = 12;
    const tableW = pageW - margin * 2; // 186
    const lightBlueBorder = [186, 214, 251]; // #bad6fb
    const darkText = [15, 23, 42];

    // Helper formatting functions
    const val = (v, fallback = '-') => (v !== null && v !== undefined && v !== '' ? String(v) : fallback);

    const callTypeUpper = (merged.callType || merged.typeOfCall || 'PROCESS').toUpperCase();
    const stageText = `STAGE CALL(${callTypeUpper})`;

    // Vendor / From details
    const vendorName = merged.vendorName || merged.companyName || merged.firmDetails || merged.vendor_name || '';
    const vendorAddress = merged.unitAddress || merged.placeOfInspection || merged.vendorAddress || merged.location || '';

    // RIO To address resolution
    const getRioDetails = (rioCode) => {
        const code = String(rioCode || '').trim().toUpperCase();
        if (code === 'CRIO' || code === 'CR' || code.includes('CENTRAL')) {
            return {
                region: 'Central Region',
                address: '50, EXPANSION BUIDING,BHILAI STEEL PLANT AREA\nBHILAI -490001'
            };
        } else if (code === 'ERIO' || code === 'ER' || (code.includes('ER') && !code.includes('SERVER'))) {
            return {
                region: 'Eastern Region',
                address: 'OJAS BHAWAN, 7TH FLOOR, PLOT NO. DJ/20, STREET NO.326,\nACTION AREA 1D, NEW TOWN, KOLKATA - 700 156'
            };
        } else if (code === 'NRIO' || code === 'NR' || (code.includes('NR') && code !== 'NWR')) {
            return {
                region: 'Northern Region',
                address: '12TH FLOOR, CORE-2, SCOPE MINAR,\nLAXMI NAGAR, DELHI-110092'
            };
        } else if (code === 'WRIO' || code === 'WR' || code === 'SWR' || code === 'WCR' || (code.endsWith('WR') && code !== 'NWR')) {
            return {
                region: 'Western Region',
                address: '5TH FLOOR, REGENT CHAMBER, ABOVE STATUS RESTAURANT,\nNARIMAN POINT, MUMBAI - 400021'
            };
        } else if (code === 'SRIO' || code === 'SR' || code.includes('SOUTHERN')) {
            return {
                region: 'Southern Region',
                address: 'CTS BUILDING - 2ND FLOOR, BSNL COMPLEX, NO. 16,\nGREAMS ROAD CHENNAI - 600006'
            };
        }
        // Default CRIO or Central Region
        return {
            region: 'Central Region',
            address: '50, EXPANSION BUIDING,BHILAI STEEL PLANT AREA\nBHILAI -490001'
        };
    };

    // Mapping of Railway SCR codes to RITES RIO regions
    // Used as fallback when rio/rioCode is not returned by backend API
    const scrCodeToRio = {
        'ECR': 'ERIO', 'ER': 'ERIO', 'SER': 'ERIO', 'ECOR': 'ERIO',
        'NR':  'NRIO', 'NWR': 'NRIO', 'NFR': 'NRIO', 'NER': 'NRIO',
        'NCR': 'CRIO', 'CR': 'CRIO', 'WCR': 'CRIO',
        'WR':  'WRIO', 'SWR': 'WRIO',
        'SR':  'SRIO', 'SCR': 'SRIO',
    };

    const rawScrCode = String(merged.scrCode || merged.rlyShortName || '').trim().toUpperCase();
    const rioFromScr = rawScrCode ? (scrCodeToRio[rawScrCode] || null) : null;

    const rawRioCode = merged.rio || merged.rioCode || merged.rioName || rioFromScr || merged.region;
    const rio = getRioDetails(rawRioCode);

    // Call Serial & Date
    const rawCallDate = merged.inspectionDate || merged.created_at || merged.callDate || new Date().toLocaleDateString('en-GB');
    const formattedCallDate = typeof rawCallDate === 'string' && rawCallDate.includes('T') ? rawCallDate.split('T')[0] : String(rawCallDate);

    // Contact info
    const contactName = merged.contactPersonName || merged.contactPerson || merged.vendorName || merged.companyName || '';
    const contactPhone = merged.contactMobile || merged.mobile || merged.phone || '';
    const contactEmail = merged.contactEmail || merged.email || '';
    const ieName = merged.ieAssignedName || merged.assignedIeName || merged.ieName || merged.assignedIE || '';

    // PO & Case details
    const poNo = merged.poNo || merged.rlyPoSr || merged.poNumber || merged.rlyPoNo || '';
    const poDate = merged.poDate || '';
    const poFullNo = poNo ? (poDate ? `${poNo} Dated:${poDate}` : poNo) : '';
    const purchaser = merged.purchaserDetail || merged.purchaser || merged.purchasingAuthority || '';
    const caseNo = merged.caseNo || merged.callNo || merged.call_no || '';

    // Item details / Description of stores
    let itemDescStr = merged.itemDesc || merged.itemDescription || (merged.drawingNo ? `COMPOSITE GROOVED RUBBER SOLE PLATES 10 MM THICK FOR WIDER PSC SLEEPERS TO USE WITH 60KG (UIC) & 52KG RAILS TO RDSO DRG NO ${merged.drawingNo}, WITH LATEST ALTERATION IF ANY, SPECIFICATION: IRS T 55-2025 WITH LATEST ALTERATIONS.` : '');

    const consigneeVal = merged.consigneeDetail || merged.consignee || '';

    // Determine UOM and Quantities:
    // Process Call (RPP) -> always "Nos."
    // Final Call (RPF) -> UOM from PO Item (e.g. "Set", "Sets", "Nos.") and Set quantities if offered in sets
    const isProcessCall = (merged.callType || '').toUpperCase() === 'PROCESS' || String(callNo || '').startsWith('RPP-');
    let effectiveUom = 'Nos.';
    let effectiveOfferedQty = merged.totalOfferedQty || merged.totalQty || merged.qtyOffered || merged.quantityNowOffered || '';
    let effectiveOrderQty = merged.poSrQty || merged.poQty || merged.orderQty || merged.qtyOnOrder || merged.totalQty || '';

    if (isProcessCall) {
        effectiveUom = 'Nos.';
        effectiveOfferedQty = merged.totalQty || merged.totalOfferedQty || merged.qtyOffered || '';
    } else {
        const rawUom = merged.uom || merged.poUom || '';
        if (rawUom) {
            effectiveUom = rawUom.trim();
        } else if (merged.noOfSets && Number(merged.noOfSets) > 0) {
            effectiveUom = 'Set';
        } else {
            effectiveUom = 'Nos.';
        }

        // For NCRGRSP or calls with sets, if UoM is 'Set' / 'Sets' (or noOfSets is present during raising call)
        if (effectiveUom.toUpperCase().includes('SET')) {
            if (merged.noOfSets && Number(merged.noOfSets) > 0) {
                effectiveOfferedQty = merged.noOfSets;
            } else if (merged.totalSets && Number(merged.totalSets) > 0) {
                effectiveOfferedQty = merged.totalSets;
            }
        }
    }

    const formatQtyWithUom = (q) => {
        if (!q && q !== 0) return '-';
        const num = Number(q);
        return isNaN(num) ? `${q} ${effectiveUom}` : `${num.toLocaleString()} ${effectiveUom}`;
    };

    const dpPeriod = merged.deliveryDate || merged.origDp || merged.dpDate || merged.extDp || '';
    const billPayOfficer = merged.billPayOffDesc || merged.billPayingOfficer || merged.billPayingAuthority || '';

    // Build Annexure-1 rows
    const lots = merged.lots || [];
    let annexureRows = [];

    if (lots.length > 0) {
        annexureRows = lots.map((lot, idx) => [
            String(idx + 1),
            lot.consignee || consigneeVal,
            lot.description || itemDescStr,
            formatQtyWithUom(lot.orderQty || lot.totalQty || effectiveOrderQty),
            String(lot.passedQty || '&'),
            formatQtyWithUom(lot.offeredQty || (effectiveUom.toUpperCase().includes('SET') && lot.noOfSets ? lot.noOfSets : lot.offeredQty) || effectiveOfferedQty),
            lot.deliveryPeriod || dpPeriod,
            lot.bpo || billPayOfficer,
            ''
        ]);
    } else {
        annexureRows = [
            [
                '1',
                consigneeVal,
                itemDescStr,
                formatQtyWithUom(effectiveOrderQty),
                '&',
                formatQtyWithUom(effectiveOfferedQty),
                dpPeriod,
                billPayOfficer,
                ''
            ]
        ];
    }

    // ─────────────────────────────────────────────────────────────────
    // TABLE 1: HEADER BOX (ONLINE INSPECTION CALL / FROM / TO / DATES)
    // ─────────────────────────────────────────────────────────────────

    const headerBody = [
        [{ content: 'ONLINE INSPECTION CALL', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fontSize: 10.5 } }],
        [{ content: stageText, colSpan: 2, styles: { fontStyle: 'bold', fontSize: 9.5 } }],
        [{
            content: `From.\n${vendorName}\n${vendorAddress}`,
            colSpan: 2,
            styles: { fontSize: 8.5 }
        }],
        [{ content: 'Ref No.', colSpan: 2, styles: { fontStyle: 'bold', fontSize: 8.5 } }],
        [
            { content: `Date: ${formattedCallDate}`, styles: { fontSize: 8.5 } },
            { content: `Call Marked to: ${ieName}`, styles: { fontSize: 8.5 } }
        ],
        [
            {
                content: `To\n\nGroup General Manager (Inspection)\nRITES LTD.,\n${rio.region}\n${rio.address}`,
                styles: { fontSize: 8.5 }
            },
            {
                content: `CALL DATED: ${formattedCallDate} CALL SNO. ${callNo}\nCASE NO. ${caseNo} (PO SOURCE: VENDOR)`,
                styles: { fontSize: 8.5 }
            }
        ]
    ];

    autoTable(doc, {
        startY: margin,
        margin: { left: margin, right: margin },
        tableWidth: tableW,
        body: headerBody,
        theme: 'plain',
        styles: {
            textColor: darkText,
            cellPadding: 2.5,
            lineWidth: 0.2,
            lineColor: lightBlueBorder,
            font: 'helvetica'
        },
        columnStyles: {
            0: { cellWidth: tableW / 2 },
            1: { cellWidth: tableW / 2 }
        }
    });

    let currentY = doc.lastAutoTable.finalY + 3;

    // ─────────────────────────────────────────────────────────────────
    // INTRO TEXT
    // ─────────────────────────────────────────────────────────────────
    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        tableWidth: tableW,
        body: [
            [{ content: 'Dear Sir,', styles: { fontStyle: 'bold', fontSize: 9 } }],
            [{ content: 'Please arrange to inspect following goods lying ready with us. It is certified that the stores offered have been inspected by us and found to conform to the governing specifications.', styles: { fontSize: 8.5 } }]
        ],
        theme: 'plain',
        styles: {
            textColor: darkText,
            cellPadding: 1.5,
            lineWidth: 0.2,
            lineColor: lightBlueBorder,
            font: 'helvetica'
        }
    });

    currentY = doc.lastAutoTable.finalY + 1;

    // ─────────────────────────────────────────────────────────────────
    // TABLE 2: NUMBERED PARAMETERS TABLE (Items 1 - 17)
    // ─────────────────────────────────────────────────────────────────

    const paramRows = [
        ['1. Purchase Order No. and Date', poFullNo],
        ['2. Purchaser', purchaser],
        ['3. Consignee', 'As Per Annexure-1'],
        ['4. Manufacturer\'s Name', vendorName],
        ['5. Place of Inspection with address', vendorAddress],
        ['6. Person to be contacted, Phone No. with E-mail id', `${contactName}, ${contactPhone}, ${contactEmail}`],
        ['7. Description of Stores', 'As Per Annexure-1'],
        ['8. State whether the items is on RDSO Vendor Directory', 'Yes'],
        ['9. If Yes, whether the vendor is RDSO Aprroved. Indicate validity of approval', 'Yes, From: TO:'],
        ['10. Quantity on Order', 'As Per Annexure-1'],
        ['11. Quantity Now Offered', 'As Per Annexure-1'],
        ['12. Installment Number', String(merged.offeredInstallmentNo || merged.installmentNo || '1')],
        ['13. Quantity already inspected and passed', 'As Per Annexure-1'],
        ['14. Delivery period as per P.O./Amendment', 'As Per Annexure-1'],
        ['   a. Does PO specified staggered DP:', 'NO'],
        ['   b. If yes, details of lot size and staggered DP', '1. Lot Size & DP:\n2. Lot Size & DP2:'],
        ['15. Bill Paying authority', 'As Per Annexure-1'],
        ['16. IRFC Funded Project', 'No'],
        ['17. Inspection Fee Payment details for cases', ''],
        ['Where advance inspection fee is to be paid', ''],
        [{ content: 'I hereby accept all the Terms and Conditions.', colSpan: 2, styles: { fontStyle: 'normal', fontSize: 8.5 } }],
        [{ content: 'Thanking you,\nYours Faithfully,', colSpan: 2, styles: { fontStyle: 'normal', fontSize: 8.5 } }]
    ];

    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        tableWidth: tableW,
        body: paramRows,
        theme: 'plain',
        styles: {
            textColor: darkText,
            cellPadding: 2,
            lineWidth: 0.2,
            lineColor: lightBlueBorder,
            font: 'helvetica',
            fontSize: 8.5
        },
        columnStyles: {
            0: { cellWidth: 90, fontStyle: 'normal' },
            1: { cellWidth: tableW - 90, fontStyle: 'normal' }
        }
    });

    currentY = doc.lastAutoTable.finalY + 1;

    // ─────────────────────────────────────────────────────────────────
    // SIGNATORY INFORMATION TABLE
    // ─────────────────────────────────────────────────────────────────

    const signRows = [
        ['Name', contactName],
        ['Mobile', contactPhone],
        ['Vendor Email', contactEmail],
        ['Designation', merged.contactDesignation || ''],
        ['Authorised Signatory', '']
    ];

    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        tableWidth: tableW,
        body: signRows,
        theme: 'plain',
        styles: {
            textColor: darkText,
            cellPadding: 2,
            lineWidth: 0.2,
            lineColor: lightBlueBorder,
            font: 'helvetica',
            fontSize: 8.5
        },
        columnStyles: {
            0: { cellWidth: 90, fontStyle: 'normal' },
            1: { cellWidth: tableW - 90, fontStyle: 'normal' }
        }
    });

    currentY = doc.lastAutoTable.finalY + 14;

    // ─────────────────────────────────────────────────────────────────
    // ANNEXURE-1 SECTION HEADER
    // ─────────────────────────────────────────────────────────────────
    
    // Check page space for Annexure header and table
    if (currentY + 60 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        currentY = margin + 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...darkText);
    doc.text('Annexure-1 (INSPECTION CALL ITEM DETAILS)', pageW / 2, currentY, { align: 'center' });

    currentY += 8;

    // ─────────────────────────────────────────────────────────────────
    // ANNEXURE-1 ITEM DETAILS TABLE
    // ─────────────────────────────────────────────────────────────────

    const annexureHeaders = [[
        'Sr. No.',
        'Consignee',
        'Description of Stores',
        'Quantity on Order',
        'Quantity already inspected and passed',
        'Quantity Now Offered',
        'Delivery period as per P.O./Amendment',
        'Bill Paying authority',
        'Master Item Checksheet'
    ]];

    const annexureTableBody = [
        ...annexureRows,
        [{ content: 'REMARKS:', colSpan: 9, styles: { fontStyle: 'bold', fontSize: 8.5, halign: 'left' } }]
    ];

    autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        tableWidth: tableW,
        head: annexureHeaders,
        body: annexureTableBody,
        theme: 'plain',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [100, 116, 139],
            fontStyle: 'normal',
            fontSize: 7.5,
            lineWidth: 0.2,
            lineColor: lightBlueBorder,
            halign: 'left',
            valign: 'top'
        },
        styles: {
            textColor: darkText,
            cellPadding: 2,
            lineWidth: 0.2,
            lineColor: lightBlueBorder,
            font: 'helvetica',
            fontSize: 8,
            valign: 'top'
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 26 },
            2: { cellWidth: 42 },
            3: { cellWidth: 18 },
            4: { cellWidth: 18 },
            5: { cellWidth: 18 },
            6: { cellWidth: 22 },
            7: { cellWidth: 22 },
            8: { cellWidth: 10 }
        }
    });

    // Save PDF
    if (shouldDownload) {
        const cleanCallNo = String(callNo || 'CALL_LETTER').replace(/[^a-zA-Z0-9-_]/g, '_');
        doc.save(`Call_Letter_${cleanCallNo}.pdf`);
    }
    return doc;
};
