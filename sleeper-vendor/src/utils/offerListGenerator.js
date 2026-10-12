import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper for mapping defect/rejection reason to standard abbreviation
const mapDefectToAbbr = (defectStr, defaultAbbr = 'SD') => {
    if (!defectStr) return defaultAbbr;
    const s = String(defectStr).toUpperCase().trim();

    // Check direct 2-4 letter abbreviation codes
    if (/^[A-Z]{2,4}$/.test(s)) return s;

    // Check if bracketed abbreviation already exists like "(OGL)" or "(SD)"
    const pMatch = s.match(/\(([A-Z]{2,4})\)/);
    if (pMatch) return pMatch[1].trim();

    // Outer Gauge check (+ / - / loose / tight)
    if (s.includes('OUTER') && s.includes('GAUGE') && (s.includes('LOOSE') || s.includes('+'))) return 'OGL';
    if (s.includes('OUTER') && s.includes('GAUGE') && (s.includes('TIGHT') || s.includes('-'))) return 'OGT';

    // Rail seat checks
    if (s.includes('TIGHT') && s.includes('SEAT')) return 'RST';
    if (s.includes('LOOSE') && s.includes('SEAT')) return 'RSL';
    if (s.includes('SEAT') && (s.includes('DEFECT') || s.includes('DAMAGE'))) return 'RSD';

    // Toe gap checks
    if (s.includes('TOE') && s.includes('GAP') && (s.includes('LOOSE') || s.includes('+'))) return 'TGL';
    if (s.includes('TOE') && s.includes('GAP') && (s.includes('TIGHT') || s.includes('-'))) return 'TGT';

    // Inserts
    if (s.includes('INSERT') && s.includes('TILT')) return 'IT';
    if (s.includes('INSERT') && (s.includes('OUT') || s.includes('MISSING'))) return 'IO';
    if (s.includes('INSERT') && s.includes('SINK')) return 'IS';

    // End damage / broken
    if (s.includes('END') && (s.includes('BROKEN') || s.includes('BREAK'))) return 'EB';
    if (s.includes('END') && (s.includes('DAMAGE') || s.includes('DAMAGED'))) return 'ED';

    // Track circuit
    if (s.includes('FTC') || s.includes('TRACK CIRCUIT') || s.includes('NFTC')) return 'NFTC';

    // Honeycombing
    if (s.includes('END') && s.includes('HONEY')) return 'EHC';
    if (s.includes('SURFACE') && s.includes('HONEY')) return 'SHC';
    if (s.includes('HONEY')) return 'SHC';

    // Cracks & Demoulding
    if (s.includes('CRACK') || s.includes('RC')) return 'RC';
    if (s.includes('DAMAGE') || s.includes('DEMOULD') || s.includes('RD')) return 'RD';

    // MOR / Static Bending Test / Moment of Failure
    if (s.includes('FAILURE') || s.includes('MF') || s.includes('MOR') || s.includes('STATIC BEND') || s.includes('SBT') || s.includes('MOMENT OF')) return 'MF';

    // General Dimension
    if (s.includes('GAUGE') || s.includes('DIMENSION') || s.includes('DIM') || s.includes('CRITICAL') || s.includes('NON-CRITICAL')) return 'RSD';

    // General Surface
    if (s.includes('SURFACE') || s.includes('VISUAL') || s.includes('SD')) return 'SD';

    // Epoxy
    if (s.includes('EPOXY') || s.includes('ET')) return 'ET';

    return defaultAbbr;
};

// Categorize defect into 'sbt', 'dim', 'surf', or 'oth'
const classifyRejection = (defectStr, abbr = '') => {
    const a = (abbr || mapDefectToAbbr(defectStr, '')).toUpperCase().trim();
    const s = String(defectStr || '').toUpperCase().trim();

    // 1. SBT (Moment of Resistance / Static Bending Test / Moment of Failure)
    if (['MF', 'SBT'].includes(a) || s.includes('MOR') || s.includes('STATIC BEND') || s.includes('SBT') || s.includes('MOMENT OF') || s.includes('FAILURE')) {
        return 'sbt';
    }

    // 2. Dim (Dimensional Rejection)
    if (['OGL', 'OGT', 'RSD', 'RSL', 'RST', 'TGL', 'TGT', 'RG'].includes(a) ||
        s.includes('DIMENSION') || s.includes('GAUGE') || s.includes('RAIL SEAT') || s.includes('TOE GAP') || s.includes('OUTER GAUGE') || s.includes('CRITICAL DIM')) {
        return 'dim';
    }

    // 3. Surf (Surface Defect Rejection)
    if (['SD', 'SHC', 'EHC', 'RC', 'RD'].includes(a) ||
        s.includes('SURFACE') || s.includes('VISUAL') || s.includes('HONEY') || s.includes('CRACK') || s.includes('DEMOULD') || s.includes('DAMAGE')) {
        return 'surf';
    }

    // 4. Oth (Other: Insert tilt/sink/out, broken end, track circuit, epoxy, etc.)
    return 'oth';
};

// Format sleeper rejection entry as sleeperNo (ABBR)
const formatRejectionSleeper = (item) => {
    if (!item) return '';
    if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed.includes('(') && trimmed.includes(')')) return trimmed;
        const parts = trimmed.split(/\s+/);
        if (parts.length > 1) {
            const sleeperNo = parts[0];
            const reasonStr = parts.slice(1).join(' ');
            return `${sleeperNo} (${mapDefectToAbbr(reasonStr)})`;
        }
        return `${trimmed} (SD)`;
    }
    if (typeof item === 'object') {
        const sleeperNo = item.sleeperNo || item.id || item.displayNo || '';
        const reason = item.rejectionReason || item.reason || item.defect || item.subReason || item.defectType || '';
        const fallbackAbbr = item.moduleId === 6 ? 'MF' : (item.moduleId === 2 || item.moduleId === 3 ? 'RSD' : (item.moduleId === 4 ? 'RD' : 'SD'));
        const abbr = mapDefectToAbbr(reason, fallbackAbbr);
        return `${sleeperNo} (${abbr})`;
    }
    return String(item);
};

// Cleans compound MF sample representations like "Shed 2 + 22 + A" into standard sleeper format "22A"
export const cleanMfSleeperNo = (s) => {
    if (!s) return '';
    const trimmed = String(s).trim();
    if (trimmed.includes('+')) {
        const parts = trimmed.split('+').map(p => p.trim());
        let bench = '';
        let mould = '';
        for (const p of parts) {
            if (/^shed/i.test(p)) continue;
            if (/^\d+$/.test(p)) bench = p;
            else if (/^[a-zA-Z]$/.test(p)) mould = p.toUpperCase();
            else if (/^\d+[a-zA-Z]+$/.test(p)) return p.toUpperCase();
        }
        if (bench || mould) return `${bench}${mould}`;
    }
    return trimmed;
};

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
    
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setDrawColor(0, 0, 0);

    // 1. Header: Manufacturer / CSP Name and OFFER LIST with border
    const mfrName = (call.manufacturerName || call.vendorName || call.companyName || call.plantName || call.unitName || '').trim();
    const displayMfr = mfrName ? mfrName.toUpperCase() : '';

    doc.setLineWidth(0.4);
    doc.rect(10, 6, pageWidth - 20, 14);
    
    // Manufacturer / CSP Name at the top (without prefix)
    doc.setFontSize(10.5);
    setBold();
    setTextColor(BLACK);
    if (displayMfr) {
        doc.text(displayMfr, pageWidth / 2, 10.5, { align: 'center' });
    }
    
    // Separator line
    doc.setLineWidth(0.2);
    doc.line(10, 13, pageWidth - 10, 13);
    
    // OFFER LIST Title
    doc.setFontSize(13);
    setBold();
    setTextColor(BLACK);
    doc.text('OFFER LIST', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(9);
    
    // 2. Information Section
    const boxTop = 22; 
    const startY = boxTop + 4; 
    const rowH = 5.17;
    const col1 = 12;
    const col2 = 48;
    
    const drawRow = (label, value, rowIdx, vCol = col2) => {
        const y = startY + (rowIdx * rowH);
        setTextColor(BLACK); setBold(); doc.text(label, col1, y);
        setTextColor(RED); setBold(); doc.text(`${value || '-'}`, vCol, y);
    };

    const consigneeVal = call.consignee || call.consigneeDetail || call.conigness || '-';
    const cleanConsignee = consigneeVal.includes('~') ? consigneeVal.split('~')[0].trim() : consigneeVal;

    drawRow('Purchase Order No.', `: ${call.poNo || call.poNumber || '-'}`, 0);
    drawRow('PO Date:', `: ${call.poDate || '-'}`, 1);
    drawRow('Consignee:', `: ${cleanConsignee}`, 2);
    drawRow('Drawing No:', `: ${call.drawingNo || call.sleeperType || '-'}`, 3);
    
    let rawBatches = call.batchesSelected || [];
    let batchRange = '-';
    if (rawBatches.length > 0) {
        const first = rawBatches[0].batchNo || rawBatches[0];
        const last = rawBatches[rawBatches.length - 1].batchNo || rawBatches[rawBatches.length - 1];
        batchRange = first === last ? `${first}` : `${first} To ${last}`;
    }

    drawRow('Shed-1 Batch No.', `: ${call.shed1BatchNo || batchRange}`, 4);
    drawRow('Shed-2 Batch No.', `: ${call.shed2BatchNo || '-'}`, 5);

    // Draw border around header section
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(10, boxTop, pageWidth - 20, 31); 
    
    // Horizontal lines
    doc.setLineWidth(0.2);
    for (let i = 1; i <= 5; i++) {
        const lineY = boxTop + (i * 5.17);
        doc.line(10, lineY, pageWidth - 10, lineY);
    }

    // 3. Table Data Preparation from REAL batches
    let tableData = [];
    const allRejectionsGrouped = {};

    if (rawBatches.length > 0) {
        tableData = rawBatches.map((batch, index) => {
            const rawBatchNo = batch.batchNo || batch.name || `Batch ${index + 1}`;
            const batchNo = String(rawBatchNo).startsWith('Batch ') ? String(rawBatchNo) : `Batch ${rawBatchNo}`;
            const castDate = batch.castDate || batch.castingDate || batch.date || call.callDate || '-';
            
            const goodCount = Array.isArray(batch.goodSleepers) 
                ? batch.goodSleepers.length 
                : (typeof batch.goodSleepers === 'number' ? batch.goodSleepers : (batch.qtyOffered || batch.totalOffered || call.qtyOffered || 0));
                
            const badCount = Array.isArray(batch.badSleepers)
                ? batch.badSleepers.length 
                : (typeof batch.badSleepers === 'number' ? batch.badSleepers : (batch.totalRejected || (typeof batch.badSleepersCount === 'number' ? batch.badSleepersCount : 0)));

            // Nos. Cast = total sleeper present in that batch
            const totalCast = batch.totalCasted !== undefined && batch.totalCasted !== null && Number(batch.totalCasted) > 0
                ? Number(batch.totalCasted)
                : ((goodCount + badCount) || goodCount);

            const prevOffrd = Number(batch.previouslyOffered) || 0;
            const nowOffrd = goodCount + badCount;

            const etAccepted = Number(batch.etAccepted) >= 0 ? Number(batch.etAccepted) : (batch.acceptedEt || (Array.isArray(batch.etSleepers) ? new Set(batch.etSleepers).size : 0));
            const mftAccepted = Number(batch.mftAccepted) >= 0 ? Number(batch.mftAccepted) : (batch.acceptedMft || (Array.isArray(batch.mfSleepers) ? new Set(batch.mfSleepers).size : (batch.mfNo ? batch.mfNo.split(',').filter(Boolean).length : 0)));
            const normAccepted = Number(batch.normAccepted) >= 0 
                ? Number(batch.normAccepted) 
                : Math.max(0, goodCount - etAccepted - mftAccepted);

            // Remarks columns with deduplication
            let etList = [];
            if (batch.etNo && typeof batch.etNo === 'string') {
                etList = batch.etNo.split(',').map(s => s.trim()).filter(Boolean);
            } else if (Array.isArray(batch.etSleepers)) {
                etList = batch.etSleepers.map(s => String(s).trim()).filter(Boolean);
            }
            const etNoStr = Array.from(new Set(etList)).join(', ');

            let rejList = [];
            if (batch.rejNo && typeof batch.rejNo === 'string') {
                rejList = batch.rejNo.split(',').map(s => formatRejectionSleeper(s)).filter(Boolean);
            } else if (Array.isArray(batch.badSleepersList)) {
                rejList = batch.badSleepersList.map(s => formatRejectionSleeper(s)).filter(Boolean);
            } else if (Array.isArray(batch.badSleepers)) {
                rejList = batch.badSleepers.map(s => formatRejectionSleeper(s)).filter(Boolean);
            }
            const distinctRejList = Array.from(new Set(rejList));
            const rejNoStr = distinctRejList.join(', ');

            // Dynamic rejection categorization: Surf, Dim, Oth, SBT
            let surfRej = 0;
            let dimRej = 0;
            let othRej = 0;
            let sbtRej = 0;

            const badItems = Array.isArray(batch.badSleepers) && batch.badSleepers.length > 0 && typeof batch.badSleepers[0] === 'object'
                ? batch.badSleepers
                : distinctRejList;

            if (badItems.length > 0) {
                badItems.forEach(item => {
                    let reasonStr = '';
                    let abbrStr = '';
                    if (typeof item === 'string') {
                        reasonStr = item;
                        const m = item.match(/\(([^)]+)\)/);
                        if (m) abbrStr = m[1].trim();
                    } else if (typeof item === 'object') {
                        reasonStr = item.rejectionReason || item.reason || item.defect || item.subReason || item.defectType || '';
                        if (item.moduleId === 6) abbrStr = 'MF';
                        else if (item.moduleId === 2 || item.moduleId === 3) abbrStr = 'RSD';
                        else if (item.moduleId === 1) abbrStr = 'SD';
                        else if (item.moduleId === 4) abbrStr = 'RD';
                    }
                    const cat = classifyRejection(reasonStr, abbrStr);
                    if (cat === 'sbt') sbtRej++;
                    else if (cat === 'dim') dimRej++;
                    else if (cat === 'surf') surfRej++;
                    else othRej++;
                });
            } else if (batch.rejSurf !== undefined || batch.rejDim !== undefined || batch.rejSbt !== undefined) {
                surfRej = Number(batch.rejSurf) || 0;
                dimRej = Number(batch.rejDim) || 0;
                sbtRej = Number(batch.rejSbt) || 0;
                othRej = batch.rejOth !== undefined ? Number(batch.rejOth) : Math.max(0, badCount - surfRej - dimRej - sbtRej);
            }

            // Balance total count with badCount if needed
            const totalClassified = surfRej + dimRej + othRej + sbtRej;
            if (badCount > 0 && totalClassified < badCount) {
                othRej += (badCount - totalClassified);
            }

            const notOffrd = batch.notOffered !== undefined 
                ? Number(batch.notOffered) 
                : Math.max(0, totalCast - nowOffrd - prevOffrd);

            let mfList = [];
            if (batch.mfNo && typeof batch.mfNo === 'string') {
                mfList = batch.mfNo.split(',').map(s => cleanMfSleeperNo(s.trim())).filter(Boolean);
            } else if (Array.isArray(batch.mfSleepers)) {
                mfList = batch.mfSleepers.map(s => cleanMfSleeperNo(String(s).trim())).filter(Boolean);
            }
            const mfNoStr = Array.from(new Set(mfList)).join(', ');

            // Collect for footer abbreviation summary
            distinctRejList.forEach(item => {
                const trimmed = String(item).trim();
                const match = trimmed.match(/^([^(]+)\s*\(([^)]+)\)$/);
                if (match) {
                    const sNo = match[1].trim();
                    const abbr = match[2].trim();
                    if (!allRejectionsGrouped[abbr]) allRejectionsGrouped[abbr] = new Set();
                    allRejectionsGrouped[abbr].add(sNo);
                } else if (trimmed) {
                    if (!allRejectionsGrouped['SD']) allRejectionsGrouped['SD'] = new Set();
                    allRejectionsGrouped['SD'].add(trimmed);
                }
            });

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
                etNoStr,
                rejNoStr,
                mfNoStr
            ];
        });
    } else {
        // Single row with overall call quantities if individual batch array not present
        const totalQty = call.qtyOffered || call.totalOffered || 0;
        tableData = [[
            '01',
            call.batchNo || (batchRange !== '-' ? batchRange : 'Batch-1'),
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

    // 4. Render Table with widened Rej No column (27mm) and compact font for clean professional look
    autoTable(doc, {
        startY: boxTop + 34,
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
            cellPadding: 0.6, 
            lineColor: [0, 0, 0],
            minCellHeight: 6
        },
        headStyles: { fillColor: [255, 255, 255], textColor: BLACK, fontStyle: 'bold', lineWidth: 0.3, lineColor: [0, 0, 0] },
        columnStyles: {
            0: { cellWidth: 8, textColor: BLACK },
            1: { cellWidth: 18 },
            2: { cellWidth: 18 },
            3: { cellWidth: 9 },
            4: { cellWidth: 9 },
            5: { cellWidth: 9 },
            6: { cellWidth: 8 },
            7: { cellWidth: 8 },
            8: { cellWidth: 8 },
            9: { cellWidth: 7 },
            10: { cellWidth: 7 },
            11: { cellWidth: 7 },
            12: { cellWidth: 7 },
            13: { cellWidth: 9 },
            14: { cellWidth: 14 },
            15: { cellWidth: 27, fontSize: 5.2 }, // Widened for clean multi-sleeper display
            16: { cellWidth: 13 },
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
    const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 180) + 4;
    const footerWidth = pageWidth - 20;
    
    // Draw Footer Border (height: 42mm)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(10, finalY, footerWidth, 42);
    
    doc.setLineWidth(0.3);
    // Line after abbreviations & rejection details
    doc.line(10, finalY + 22, pageWidth - 10, finalY + 22);
    // Line after remarks
    doc.line(10, finalY + 32, pageWidth - 10, finalY + 32);

    // Abbreviation Legend
    doc.setFontSize(6.8);
    setTextColor(BLACK);
    setBold(); doc.text('Abbreviation:', 12, finalY + 4);
    const abbrev = '-ET= Epoxy Treated, MF= Moment of Failure, RD= Reject by Damage, RC=Reject By Crack, RG=Reject By Gauge, SD- Surface Defect, RSL- Rail Seat loose, RST- Rail Seat Tight, RSD- Rail Seat Defect, TGL- Toe Gap Loose, TGT- Toe Gap Tight, IT- Insert Tilt, IO- Insert Out, IS-Insert Sink, OGL- Outer Gauge Loose, OGT- Outer Gauge Tight, EB- End Broken, ED- End Damage, NFTC- Not Fit For Track Circuit, SHC- Surface Honey Combe, EHC- End Honey Comb.';
    const splitAbbrev = doc.splitTextToSize(abbrev, footerWidth - 6);
    setBold();
    doc.text(splitAbbrev, 12, finalY + 7.5);

    // Rejection Details by Abbreviation in Footer
    const rejEntries = Object.entries(allRejectionsGrouped).map(([abbr, set]) => `${abbr}: ${Array.from(set).join(', ')}`);
    const rejSummaryText = rejEntries.length > 0 ? rejEntries.join(' | ') : 'Nil';
    
    doc.setFontSize(7.2);
    setTextColor(BLACK); setBold(); doc.text('Rejection Sleepers:', 12, finalY + 18);
    setTextColor(RED); setBold(); doc.text(rejSummaryText, 38, finalY + 18);

    // Remarks
    const remarksY = finalY + 28;
    setTextColor(BLACK); setBold(); doc.text('Remarks :', 12, remarksY);
    setTextColor(RED); setBold(); doc.text('Stores offered conforms to governing specification.', 26, remarksY);

    // Inspecting Engineer
    const ieY = finalY + 38;
    setTextColor(BLACK); setBold(); doc.text('Inspecting Engineer:', 12, ieY);
    const ieNameVal = call.assignedIeName || call.ieName || call.assignedIE || 'Awaiting IE Assignment';
    setTextColor(RED); setBold(); doc.text(ieNameVal, 42, ieY);

    // 6. Save PDF
    const safeCallNo = (call.callNo || call.callNumber || call.requestId || 'Call').replace(/[^a-zA-Z0-9-_]/g, '_');
    doc.save(`Offer_List_${safeCallNo}.pdf`);
};
