import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Standard utility to capture a DOM element and convert it to a PDF blob.
 * Optimized for pixel-perfect matching with the frontend widescreen view.
 * 
 * @param {HTMLElement} element - The DOM element to capture
 * @param {Object} options - { orientation, unit, format }
 * @returns {Promise<Blob>}
 */
/**
 * Internal helper to capture a single element and add it to a PDF instance.
 * Shared between single-page and multi-page capture logic.
 */
const addElementToPdf = async (element, pdf, options) => {
  const { scale = 2.5 } = options;

  const isItpPage = element.classList.contains('itp-page');
  const isPortrait = element.classList.contains('portrait') || isItpPage || options.orientation === 'portrait';
  const captureWidth = isItpPage ? 720 : (isPortrait ? 950 : 1600);
  const windowWidth = isItpPage ? 800 : (isPortrait ? 1000 : 1700);

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: captureWidth, 
    windowWidth: windowWidth,
    onclone: (clonedDoc) => {
      // Expand stage
      clonedDoc.body.style.width = `${windowWidth}px`;
      clonedDoc.body.style.overflow = 'visible';

      // Hide elements marked as no-print explicitly for the canvas capture
      const noPrintElements = clonedDoc.querySelectorAll('.no-print');
      noPrintElements.forEach(el => {
        el.style.display = 'none';
      });

      // Select ALL layouts to ensure consistency across pages
      const layouts = clonedDoc.querySelectorAll('.annexure-layout, .annexure-template, .itp-page');
      layouts.forEach(layout => {
        const isLayoutItp = layout.classList.contains('itp-page');
        const isLayoutPortrait = layout.classList.contains('portrait') || isLayoutItp || options.orientation === 'portrait';
        const layoutCaptureWidth = isLayoutItp ? 720 : (isLayoutPortrait ? 950 : 1600);

        layout.style.width = `${layoutCaptureWidth}px`;
        layout.style.minWidth = `${layoutCaptureWidth}px`;
        layout.style.padding = isLayoutItp ? '30px 22px' : (isLayoutPortrait ? '20px' : '40px');
        layout.style.margin = '0';
        layout.style.background = '#ffffff';
        layout.style.backgroundColor = '#ffffff';

        // Stabilize Table within this layout
        const table = layout.querySelector('table');
        if (table) {
          const isLayoutItp = layout.classList.contains('itp-page');
          if (!isLayoutItp) {
            table.style.width = '100%';
            table.style.tableLayout = 'fixed';
            table.style.borderCollapse = 'collapse';

            // Enforce padding and alignment in PDF
            const cells = table.querySelectorAll('th, td');
            cells.forEach(cell => {
              // Skip detail/sub-description rows — they have their own tight layout
              if (cell.classList.contains('pi-horizontal-detail')) {
                cell.style.padding = '2px 6px';
                cell.style.verticalAlign = 'top';
                cell.style.textAlign = 'left';
                cell.style.lineHeight = '1.2';
                cell.style.whiteSpace = 'normal';
                cell.style.overflow = 'visible';
                cell.style.height = 'auto';
                cell.style.minHeight = '14px';
                cell.style.boxSizing = 'border-box';
                return;
              }
              cell.style.padding = '10px 5px';
              cell.style.verticalAlign = 'middle';
              cell.style.textAlign = 'center';
              cell.style.lineHeight = '1.4';
            });

            // Snapshot each row's actual rendered height from the ORIGINAL document
            // and apply it to the CLONED document to prevent collapse.
            const originalTable = element.querySelector('table');
            if (originalTable) {
              const originalRows = originalTable.querySelectorAll('tr');
              const clonedRows = table.querySelectorAll('tr');
              
              originalRows.forEach((origRow, idx) => {
                if (clonedRows[idx]) {
                  let h = origRow.getBoundingClientRect().height;
                  // Add a small safety buffer for detail rows to prevent line overlap
                  if (origRow.classList.contains('detail-row')) {
                    h += 2; 
                  }
                  if (h > 0) {
                    clonedRows[idx].style.height = h + 'px';
                    clonedRows[idx].style.minHeight = h + 'px';
                  }
                }
              });
            }

            // Keep fixed layout for stable column widths
            table.style.tableLayout = 'fixed';
          }
        }

        // Stabilize Rotated Headers
        const rotatedHeaders = layout.querySelectorAll('.annexure-th.rotated-header');
        rotatedHeaders.forEach(th => {
          th.style.width = '45px';
          th.style.minWidth = '45px';
          th.style.height = '140px';
          th.style.position = 'relative';

          const span = th.querySelector('.rotated-text');
          if (span) {
            span.style.display = 'block';
            span.style.width = '140px';
            span.style.whiteSpace = 'nowrap';
            span.style.position = 'absolute';
            span.style.left = '50%';
            span.style.top = '50%';
            span.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
            span.style.transformOrigin = 'center center';
            span.style.writingMode = 'horizontal-tb';
            span.style.textAlign = 'left';
            span.style.paddingLeft = '5px';
            span.style.fontWeight = 'bold';
          }
        });
      });
    }
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight > pdfHeight) {
    const scaledWidth = (canvas.width * pdfHeight) / canvas.height;
    pdf.addImage(imgData, "JPEG", (pdfWidth - scaledWidth) / 2, 0, scaledWidth, pdfHeight, undefined, "FAST");
  } else {
    pdf.addImage(imgData, "JPEG", 0, (pdfHeight - imgHeight) / 2, imgWidth, imgHeight, undefined, "FAST");
  }
};

/**
 * Standard utility to capture a DOM element and convert it to a PDF blob.
 * Optimized for pixel-perfect matching and supports Multi-Page generation.
 * 
 * @param {HTMLElement} element - The root container to capture
 * @param {Object} options - { orientation, unit, format }
 * @returns {Promise<Blob>}
 */
export const captureElementToPdfBlob = async (element, options = {}) => {
  const {
    orientation = 'landscape',
    unit = 'mm',
    format = 'a4'
  } = options;

  console.log(`[PDF Utility] Executing Smart Multi-Page Capture...`);

  try {
    // Check if we have multiple individual layouts (Multi-Annexure report)
    const layouts = Array.from(element.querySelectorAll('.annexure-layout, .annexure-template, .itp-page'));

    let pdf;

    if (layouts.length > 0) {
      console.log(`[PDF Utility] Detected ${layouts.length} individual layouts. Generating multi-page PDF...`);

      const firstLayoutPortrait = layouts[0].classList.contains('portrait') || layouts[0].classList.contains('itp-page') || orientation === 'portrait';
      pdf = new jsPDF(firstLayoutPortrait ? 'portrait' : 'landscape', unit, format);

      for (let i = 0; i < layouts.length; i++) {
        const isLayoutPortrait = layouts[i].classList.contains('portrait') || layouts[i].classList.contains('itp-page') || orientation === 'portrait';
        const pageOrientation = isLayoutPortrait ? 'portrait' : 'landscape';

        if (i > 0) {
          pdf.addPage(format, pageOrientation);
        }
        await addElementToPdf(layouts[i], pdf, { ...options, orientation: pageOrientation });
      }
    } else {
      // Fallback to legacy single-element capture for standard reports
      console.log(`[PDF Utility] No individual layouts found. Defaulting to single-element capture.`);
      pdf = new jsPDF(orientation, unit, format);
      await addElementToPdf(element, pdf, options);
    }

    console.log('[PDF Utility] Smart conversion complete.');
    return pdf.output('blob');
  } catch (error) {
    console.error('[PDF Utility] Capture error:', error);
    throw error;
  }
};
