import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BASE_URL, getAuthHeaders, apiService } from '../services/api';

// Helper for formatting date as DD.MM.YYYY
export const formatIcDate = (val) => {
    if (!val) return '-';
    const s = String(val).trim();
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s.replace(/\//g, '.');
    try {
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}.${month}.${year}`;
        }
    } catch (_) {}
    return s.split('T')[0] || s;
};

export const cleanDrawingNo = (val) => {
    if (!val) return '-';
    return String(val).trim() || '-';
};

export const mapDefectToAbbr = (defectStr, defaultAbbr = 'SD') => {
    if (!defectStr) return defaultAbbr;
    const s = String(defectStr).toUpperCase().trim();

    if (/^[A-Z]{2,4}$/.test(s)) return s;

    const pMatch = s.match(/\(([A-Z]{2,4})\)/);
    if (pMatch) return pMatch[1].trim();

    if (s.includes('OUTER') && s.includes('GAUGE') && (s.includes('LOOSE') || s.includes('+'))) return 'OGL';
    if (s.includes('OUTER') && s.includes('GAUGE') && (s.includes('TIGHT') || s.includes('-'))) return 'OGT';

    if (s.includes('TIGHT') && s.includes('SEAT')) return 'RST';
    if (s.includes('LOOSE') && s.includes('SEAT')) return 'RSL';
    if (s.includes('SEAT') && (s.includes('DEFECT') || s.includes('DAMAGE'))) return 'RSD';

    if (s.includes('TOE') && s.includes('GAP') && (s.includes('LOOSE') || s.includes('+'))) return 'TGL';
    if (s.includes('TOE') && s.includes('GAP') && (s.includes('TIGHT') || s.includes('-'))) return 'TGT';

    if (s.includes('INSERT') && s.includes('TILT')) return 'IT';
    if (s.includes('INSERT') && (s.includes('OUT') || s.includes('MISSING'))) return 'IO';
    if (s.includes('INSERT') && s.includes('SINK')) return 'IS';

    if (s.includes('END') && (s.includes('BROKEN') || s.includes('BREAK'))) return 'EB';
    if (s.includes('END') && (s.includes('DAMAGE') || s.includes('DAMAGED'))) return 'ED';

    if (s.includes('FTC') || s.includes('TRACK CIRCUIT') || s.includes('NFTC')) return 'NFTC';

    if (s.includes('END') && s.includes('HONEY')) return 'EHC';
    if (s.includes('SURFACE') && s.includes('HONEY')) return 'SHC';
    if (s.includes('HONEY')) return 'SHC';

    if (s.includes('SURFACE') || s.includes('VISUAL') || s.includes('SD')) return 'SD';
    if (s.includes('CRACK') || s.includes('RC')) return 'RC';
    if (s.includes('DEMOULD') || s.includes('RD') || s.includes('DAMAGE')) return 'RD';
    if (s.includes('FAILURE') || s.includes('MF') || s.includes('MOR') || s.includes('STATIC BEND') || s.includes('SBT') || s.includes('MOMENT OF')) return 'MF';
    if (s.includes('GAUGE') || s.includes('DIMENSION') || s.includes('DIM') || s.includes('CRITICAL') || s.includes('NON-CRITICAL')) return 'RSD';
    if (s.includes('EPOXY') || s.includes('ET')) return 'ET';

    return defaultAbbr;
};

export const classifyRejection = (defectStr, abbr = '') => {
    const a = (abbr || mapDefectToAbbr(defectStr, '')).toUpperCase().trim();
    const s = String(defectStr || '').toUpperCase().trim();

    if (['MF', 'SBT'].includes(a) || s.includes('MOR') || s.includes('STATIC BEND') || s.includes('SBT') || s.includes('MOMENT OF') || s.includes('FAILURE')) {
        return 'sbt';
    }
    if (['OGL', 'OGT', 'RSD', 'RSL', 'RST', 'TGL', 'TGT', 'RG'].includes(a) ||
        s.includes('DIMENSION') || s.includes('GAUGE') || s.includes('RAIL SEAT') || s.includes('TOE GAP') || s.includes('OUTER GAUGE') || s.includes('CRITICAL DIM')) {
        return 'dim';
    }
    if (['SD', 'SHC', 'EHC', 'RC', 'RD'].includes(a) ||
        s.includes('SURFACE') || s.includes('VISUAL') || s.includes('HONEY') || s.includes('CRACK') || s.includes('DEMOULD') || s.includes('DAMAGE')) {
        return 'surf';
    }
    return 'oth';
};

export const formatRejectionSleeper = (item) => {
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

export const extractAnnexure1Data = (call) => {
    if (!call) return null;

    const mfrName = (call.manufacturerName || call.vendorName || call.companyName || call.plantName || call.unitName || '').trim();
    const displayMfr = mfrName ? mfrName.toUpperCase() : '';

    const consigneeVal = call.consignee || call.consigneeDetail || call.conigness || '-';
    const cleanConsignee = consigneeVal.includes('~') ? consigneeVal.split('~')[0].trim() : consigneeVal;

    let rawBatches = call.batchesSelected || [];
    if ((!rawBatches || rawBatches.length === 0) && Array.isArray(call.heatDetails) && call.heatDetails.length > 0) {
        rawBatches = call.heatDetails.map(h => ({
            batchNo: h.heatNo,
            castDate: formatIcDate(h.castDate),
            totalCasted: h.totalCasted !== undefined ? h.totalCasted : (parseInt(h.qtyOffered) || 0),
            previouslyOffered: h.previouslyOffered || 0,
            goodSleepers: h.goodSleepers || h.goodCount || parseInt(h.qtyOffered) || 0,
            badSleepers: h.badSleepers || h.badCount || 0,
            etNo: h.etNo || '',
            rejNo: h.rejNo || '',
            mfNo: h.mfNo || '',
            normAccepted: h.normAccepted || 0,
            etAccepted: h.etAccepted || 0,
            mftAccepted: h.mftAccepted || 0,
            rejSurf: h.rejSurf || 0,
            rejDim: h.rejDim || 0,
            rejOth: h.rejOth !== undefined ? h.rejOth : (Array.isArray(h.badSleepers) ? h.badSleepers.length : (h.badCount || 0)),
            rejSbt: h.rejSbt || 0,
            notOffered: h.notOffered || 0
        }));
    }

    let batchRange = '-';
    if (rawBatches.length > 0) {
        const first = rawBatches[0].batchNo || rawBatches[0];
        const last = rawBatches[rawBatches.length - 1].batchNo || rawBatches[rawBatches.length - 1];
        batchRange = first === last ? `${first}` : `${first} To ${last}`;
    }

    const rawBookNo = call.bookNo || call.book_no;
    const rawSetNo = call.setNo || call.set_no;
    const rawIcNo = call.certificateNo || call.certificate_no || call.icNo || call.ic_no || call.callNo || call.callNumber || call.requestId;
    const rawIcDate = call.certificateDate || call.icDate || call.date || call.callDate || call.submissionDate || call.desiredInspectionDate;

    const header = {
        mfrName: displayMfr,
        poNo: call.poNo || call.poNumber || call.rlyPoSrNo || '-',
        poDate: formatIcDate(call.poDate),
        consignee: cleanConsignee,
        bookNo: (rawBookNo && String(rawBookNo).trim()) ? String(rawBookNo).trim() : '-',
        drawingNo: cleanDrawingNo(call.drawingNo || call.sleeperType || call.product_type || call.productType),
        setNo: (rawSetNo && String(rawSetNo).trim()) ? String(rawSetNo).trim() : '-',
        shed1BatchNo: call.shed1BatchNo || batchRange,
        shed2BatchNo: call.shed2BatchNo || '-',
        icNo: (rawIcNo && String(rawIcNo).trim()) ? String(rawIcNo).trim() : '-',
        icDate: formatIcDate(rawIcDate)
    };

    let tableRows = [];
    const allRejectionsGrouped = {};

    if (rawBatches.length > 0) {
        tableRows = rawBatches.map((batch, index) => {
            const rawBatchNo = batch.batchNo || batch.name || `Batch ${index + 1}`;
            const batchNo = String(rawBatchNo).startsWith('Batch ') ? String(rawBatchNo) : `Batch ${rawBatchNo}`;
            const castDate = formatIcDate(batch.castDate || batch.castingDate || batch.date || call.callDate);
            
            const goodCount = Array.isArray(batch.goodSleepers) 
                ? batch.goodSleepers.length 
                : (typeof batch.goodSleepers === 'number' ? batch.goodSleepers : (batch.qtyOffered || batch.totalOffered || call.qtyOffered || 0));
                
            const badCount = Array.isArray(batch.badSleepers)
                ? batch.badSleepers.length 
                : (typeof batch.badSleepers === 'number' ? batch.badSleepers : (batch.totalRejected || (typeof batch.badSleepersCount === 'number' ? batch.badSleepersCount : 0)));

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
                normAccepted.toString(),
                etAccepted.toString(),
                mftAccepted.toString(),
                surfRej.toString(),
                dimRej.toString(),
                othRej.toString(),
                sbtRej.toString(),
                notOffrd.toString(),
                etNoStr,
                rejNoStr,
                mfNoStr
            ];
        });
    } else {
        const totalQty = call.qtyOffered || call.totalOffered || call.offeredQty || 0;
        tableRows = [[
            '01',
            call.batchNo || (batchRange !== '-' ? batchRange : 'Batch-1'),
            formatIcDate(call.callDate),
            totalQty.toString(),
            '0',
            totalQty.toString(),
            (call.status === 'Accepted' || call.status === 'COMPLETED' ? totalQty : 0).toString(),
            '0', '0',
            '0', '0', (call.totalRejected || 0).toString(), '0',
            '0',
            '', '', ''
        ]];
    }

    const sumCol = (colIdx) => tableRows.reduce((acc, row) => acc + (parseInt(row[colIdx]) || 0), 0);
    const totals = {
        totalCast: sumCol(3),
        prevOffrd: sumCol(4),
        nowOffrd: sumCol(5),
        normAccepted: sumCol(6),
        etAccepted: sumCol(7),
        mftAccepted: sumCol(8),
        surfRej: sumCol(9),
        dimRej: sumCol(10),
        othRej: sumCol(11),
        sbtRej: sumCol(12),
        notOffrd: sumCol(13)
    };

    const rejEntries = Object.entries(allRejectionsGrouped).map(([abbr, set]) => `${abbr}: ${Array.from(set).join(', ')}`);
    const rejSummaryText = rejEntries.length > 0 ? rejEntries.join(' | ') : 'Nil';
    const ieName = call.assignedIeName || call.ieName || call.assignedIE || 'Mukesh Kumar';

    return {
        header,
        tableRows,
        totals,
        rawBatches,
        allRejectionsGrouped,
        rejSummaryText,
        ieName
    };
};

export const buildAnnexure1Doc = (call, customHeading = 'ANNEXURE 1 TO IC') => {
    if (!call) return null;

    const data = extractAnnexure1Data(call);
    if (!data) return null;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const RED = [220, 0, 0];
    const BLACK = [0, 0, 0];

    const setBold = () => doc.setFont('helvetica', 'bold');
    const setTextColor = (color) => doc.setTextColor(color[0], color[1], color[2]);
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setDrawColor(0, 0, 0);

    // 1. Header: Heading Title "ANNEXURE 1 TO IC"
    doc.setLineWidth(0.4);
    doc.rect(10, 7, pageWidth - 20, 12);

    doc.setFontSize(14);
    setBold();
    setTextColor(BLACK);
    doc.text(customHeading, pageWidth / 2, 14.5, { align: 'center' });

    doc.setFontSize(9);

    // 2. Information Section
    const boxTop = 22;
    const startY = boxTop + 4;
    const rowH = 5.17;
    const col1 = 12;
    const col2 = 48;
    const col3 = 115;
    const col4 = 135;

    const drawRow = (label, value, rowIdx, vCol = col2) => {
        const y = startY + (rowIdx * rowH);
        setTextColor(BLACK); setBold(); doc.text(label, col1, y);
        const cleanVal = String(value || '-').startsWith(':') ? value : `: ${value || '-'}`;
        setTextColor(RED); setBold(); doc.text(cleanVal, vCol, y);
    };

    const drawRowRight = (label, value, rowIdx) => {
        const y = startY + (rowIdx * rowH);
        setTextColor(BLACK); setBold(); doc.text(label, col3, y);
        const cleanVal = String(value || '-').startsWith(':') ? value : `: ${value || '-'}`;
        setTextColor(RED); setBold(); doc.text(cleanVal, col4, y);
    };

    drawRow('Purchase Order No.', data.header.poNo, 0);
    drawRow('PO Date', data.header.poDate, 1);
    drawRow('Consignee', data.header.consignee, 2);
    drawRowRight('BOOK NO.', data.header.bookNo, 2);
    drawRow('Drawing No.', data.header.drawingNo, 3);
    drawRowRight('SET NO.', data.header.setNo, 3);
    drawRow('Shed-1 Batch No.', data.header.shed1BatchNo, 4);
    drawRowRight('IC NO.', data.header.icNo, 4);
    drawRow('Shed-2 Batch No.', data.header.shed2BatchNo, 5);
    drawRowRight('IC DATE.', data.header.icDate, 5);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(10, boxTop, pageWidth - 20, 31);

    doc.setLineWidth(0.2);
    for (let i = 1; i <= 5; i++) {
        const lineY = boxTop + (i * 5.17);
        doc.line(10, lineY, pageWidth - 10, lineY);
    }
    doc.line(110, boxTop, 110, boxTop + 31);

    // 3. Prepare table with Total Row
    const tableBody = [...data.tableRows];
    const totalRow = [
        'Total', '', '',
        data.totals.totalCast.toString(),
        data.totals.prevOffrd.toString(),
        data.totals.nowOffrd.toString(),
        data.totals.normAccepted.toString(),
        data.totals.etAccepted.toString(),
        data.totals.mftAccepted.toString(),
        data.totals.surfRej.toString(),
        data.totals.dimRej.toString(),
        data.totals.othRej.toString(),
        data.totals.sbtRej.toString(),
        data.totals.notOffrd.toString(),
        '', '', ''
    ];
    tableBody.push(totalRow);

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
        body: tableBody,
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
            15: { cellWidth: 27, fontSize: 5.2 },
            16: { cellWidth: 13 },
        },
        didParseCell: function(dataCell) {
            if (dataCell.section === 'head' && dataCell.row.index === 0) {
                if (dataCell.column.index === 6) dataCell.cell.colSpan = 3;
                if (dataCell.column.index === 9) dataCell.cell.colSpan = 4;
                if (dataCell.column.index === 14) dataCell.cell.colSpan = 3;
                
                if ([7, 8, 10, 11, 12, 15, 16].includes(dataCell.column.index)) {
                    dataCell.cell.styles.fontSize = 0;
                    dataCell.cell.content = '';
                }
            }
            if (dataCell.section === 'body' && dataCell.row.index === tableBody.length - 1) {
                dataCell.cell.styles.textColor = BLACK;
                dataCell.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 10, right: 10 }
    });

    // 4. Footer with border
    const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 180) + 4;
    const footerWidth = pageWidth - 20;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(10, finalY, footerWidth, 42);

    doc.setLineWidth(0.3);
    doc.line(10, finalY + 22, pageWidth - 10, finalY + 22);
    doc.line(10, finalY + 32, pageWidth - 10, finalY + 32);

    // Abbreviation Legend
    doc.setFontSize(6.8);
    setTextColor(BLACK);
    setBold(); doc.text('Abbreviation:', 12, finalY + 4);
    const abbrev = '-ET= Epoxy Treated, MF= Moment of Failure, RD= Reject by Damage, RC=Reject By Crack, RG=Reject By Gauge, SD- Surface Defect, RSL- Rail Seat loose, RST- Rail Seat Tight, RSD- Rail Seat Defect, TGL- Toe Gap Loose, TGT- Toe Gap Tight, IT- Insert Tilt, IO- Insert Out, IS-Insert Sink, OGL- Outer Gauge Loose, OGT- Outer Gauge Tight, EB- End Broken, ED- End Damage, NFTC- Not Fit For Track Circuit, SHC- Surface Honey Combe, EHC- End Honey Comb.';
    const splitAbbrev = doc.splitTextToSize(abbrev, footerWidth - 6);
    setBold();
    doc.text(splitAbbrev, 12, finalY + 7.5);

    // Rejection Details
    doc.setFontSize(7.2);
    setTextColor(BLACK); setBold(); doc.text('Rejection Sleepers:', 12, finalY + 18);
    setTextColor(RED); setBold(); doc.text(data.rejSummaryText, 38, finalY + 18);

    // Remarks
    const remarksY = finalY + 28;
    setTextColor(BLACK); setBold(); doc.text('Remarks :', 12, remarksY);
    setTextColor(RED); setBold(); doc.text('Stores offered conforms to governing specification.', 26, remarksY);

    // Inspecting Engineer
    const ieY = finalY + 38;
    setTextColor(BLACK); setBold(); doc.text('Inspecting Engineer:', 12, ieY);
    setTextColor(RED); setBold(); doc.text(data.ieName, 42, ieY);

    const safeCallNo = (call.callNo || call.callNumber || call.requestId || 'Call').replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `Annexure_1_to_IC_${safeCallNo}.pdf`;

    return { doc, filename, data };
};

/**
 * Enriches call data and downloads Sleeper Annexures (Uploaded PDF or generated Annexure 1 PDF)
 */
export const generateSleeperAnnexuresPDF = async (call, autoDownload = true) => {
    if (!call) return null;
    const callId = call.call_no || call.callNo || call.callNumber || call.requestId || call.id;

    // 0. Check official API: GET /case-letter/info/{callNo}
    try {
        const headers = getAuthHeaders('application/json');
        const candidateKeys = Array.from(new Set([callId, call.callNo, call.call_no, call.requestId].filter(Boolean)));
        const baseUrls = [BASE_URL, 'https://api.ritesqasarthi.com/sarthi-backend/api'];
        for (const bUrl of baseUrls) {
            for (const k of candidateKeys) {
                try {
                    const infoRes = await fetch(`${bUrl}/case-letter/info/${encodeURIComponent(k)}`, { headers });
                    if (infoRes.ok) {
                        const infoJson = await infoRes.json();
                        if (infoJson && infoJson.exists && infoJson.data) {
                            const targetAnnex = infoJson.data;
                            const dlUrl = `${bUrl}/case-letter/download/${encodeURIComponent(k)}`;
                            const resp = await fetch(dlUrl, { headers });
                            if (resp.ok) {
                                const blob = await resp.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                if (autoDownload) {
                                    const a = document.createElement('a');
                                    a.href = blobUrl;
                                    a.download = targetAnnex.originalFileName || `Annexures_SLEEPER_${k}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);
                                }
                                return { blobUrl, fileName: targetAnnex.originalFileName || `Annexures_SLEEPER_${k}.pdf` };
                            }
                            if (targetAnnex.blobUrl) {
                                if (autoDownload) {
                                    const a = document.createElement('a');
                                    a.href = targetAnnex.blobUrl;
                                    a.download = targetAnnex.originalFileName || `Annexures_SLEEPER_${k}.pdf`;
                                    a.target = '_blank';
                                    a.rel = 'noopener noreferrer';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }
                                return { blobUrl: targetAnnex.blobUrl, fileName: targetAnnex.originalFileName || `Annexures_SLEEPER_${k}.pdf` };
                            }
                        }
                    }
                } catch (_) {}
            }
        }
    } catch (e) {
        console.warn('Case letter lookup error in sleeper:', e);
    }

    // 1. Check if backend has uploaded Annexures
    try {
        const headers = getAuthHeaders('application/json');
        const listRes = await fetch(`${BASE_URL}/ic-annexures/list?callNo=${encodeURIComponent(callId)}&moduleType=SLEEPER`, { headers });
        if (listRes.ok) {
            const listData = await listRes.json();
            const annexList = listData?.responseData || listData || [];
            if (Array.isArray(annexList) && annexList.length > 0) {
                const targetAnnex = annexList[0];
                const downloadUrl = targetAnnex.fileUrl || `${BASE_URL}/ic-annexures/download/${targetAnnex.id}`;
                const resp = await fetch(downloadUrl, { headers });
                if (resp.ok) {
                    const blob = await resp.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    if (autoDownload) {
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = targetAnnex.fileName || `Annexures_SLEEPER_${callId}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);
                    }
                    return { blobUrl, fileName: targetAnnex.fileName || `Annexures_SLEEPER_${callId}.pdf` };
                }
            }
        }
    } catch (e) {
        console.warn('Could not check uploaded IC Annexures, falling back to generated Annexure 1:', e);
    }

    // 2. Enrich call with call letter details and IC details if needed
    let enriched = { ...call };
    try {
        if (callId && (!enriched.batchesSelected || enriched.batchesSelected.length === 0)) {
            const letterRes = await apiService.getCallLetterDetails(callId);
            if (letterRes) {
                enriched = { ...letterRes, ...enriched };
                if (letterRes.batchesSelected) enriched.batchesSelected = letterRes.batchesSelected;
                if (letterRes.heatDetails) enriched.heatDetails = letterRes.heatDetails;
            }
        }
    } catch (_) {}

    // 3. Generate official Annexure 1 PDF
    const built = buildAnnexure1Doc(enriched);
    if (!built) throw new Error("Failed to generate Sleeper Annexure PDF");

    if (autoDownload) {
        built.doc.save(built.filename);
    }
    const blobUrl = built.doc.output('bloburl');
    return { blobUrl, fileName: built.filename, doc: built.doc };
};

