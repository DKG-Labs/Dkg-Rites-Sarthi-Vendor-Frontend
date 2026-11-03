import { jsPDF } from 'jspdf';

/**
 * Export helpers for the Rejection Basket (no extra libraries needed).
 * columns: [{ header: 'Date', value: row => row.date, align?: 'right' }]
 */

const escapeHtml = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const download = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Excel: an HTML table saved as .xls (opens directly in Excel) */
export const exportExcel = (fileName, title, columns, rows) => {
  const head = columns.map(c => `<th style="background:#0f766e;color:#fff;border:1px solid #ccc">${escapeHtml(c.header)}</th>`).join('');
  const body = rows.map(r => `<tr>${columns.map(c => `<td style="border:1px solid #ccc">${escapeHtml(c.value(r))}</td>`).join('')}</tr>`).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"></head><body>
<h3>${escapeHtml(title)}</h3>
<table>${`<thead><tr>${head}</tr></thead>`}<tbody>${body}</tbody></table>
</body></html>`;
  download(new Blob(['﻿', html], { type: 'application/vnd.ms-excel' }), `${fileName}.xls`);
};

/** PDF: landscape A4 table with header row repeated on every page */
export const exportPdf = (fileName, title, subtitle, columns, rows) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 30;
  const tableW = pageW - margin * 2;
  const colW = tableW / columns.length;
  const lineH = 10;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, margin, y + 4);
  y += 18;
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(subtitle, margin, y);
    doc.setTextColor(0);
    y += 14;
  }

  const drawHeader = () => {
    doc.setFillColor(15, 118, 110);
    doc.rect(margin, y, tableW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255);
    columns.forEach((c, i) => doc.text(doc.splitTextToSize(c.header, colW - 6)[0], margin + i * colW + 3, y + 12));
    doc.setTextColor(0);
    y += 18;
  };

  drawHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rows.forEach((r, idx) => {
    const cells = columns.map(c => doc.splitTextToSize(String(c.value(r) ?? ''), colW - 6));
    const rowH = Math.max(...cells.map(l => l.length)) * lineH + 6;
    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }
    if (idx % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, tableW, rowH, 'F');
    }
    cells.forEach((lines, i) => doc.text(lines, margin + i * colW + 3, y + 10));
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowH, margin + tableW, y + rowH);
    y += rowH;
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}  ·  Page ${p} of ${pages}`, margin, pageH - 12);
  }
  doc.save(`${fileName}.pdf`);
};
