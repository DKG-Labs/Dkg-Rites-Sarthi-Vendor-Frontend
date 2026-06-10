import React from 'react';
import './AnnexureHeader.css';

/**
 * AnnexureHeader - Compact header component matching reference image
 * Displays RITES logo, company info, and document details in a table format
 * Plus title and subtitle sections below header
 *
 * Props:
 * - docNo: Document number (default: "QA/WR/MECH")
 * - issueNo: Issue number
 * - pageNo: Page number (e.g., "14 of 18")
 * - effectiveDate: Effective date
 * - preparedBy: Prepared by (default: "KEM")
 * - checkedBy: Checked by (default: "CSR")
 * - approvedBy: Approved by (default: "GM(I)/WR")
 * - title: Main title (e.g., "Stage Inspection for Raw material")
 * - subtitle: Left subtitle (e.g., "Test Result- Chemical Analysis")
 * - annexureNumber: Annexure number (e.g., "Annexure-I")
 * - annexureCode: Annexure code (e.g., "IRST-31-2025")
 * - additionalInfo: Additional info line (optional, e.g., "Dimensions (in mm)")
 * - note: Note text (optional, e.g., "Note: Tolerance as per specified...")
 */
const AnnexureHeader = ({
  docNo = 'QA/WR/MECH',
  issueNo = '',
  pageNo = '1 of 18',
  effectiveDate = '',
  preparedBy = 'KEM',
  checkedBy = 'CSR',
  approvedBy = 'GM(I)/WR',
  title = '',
  subtitle = '',
  annexureNumber = '',
  annexureCode = '',
  additionalInfo = '',
  note = '',
  selectedCall = null,
  productName = '',
  callNo = '',
  extraInfo = null
}) => {
   return (
     <>
       {/* HEADER TABLE */}
       <table className="annexure-header-table">
         <tbody>
           <tr>
             {/* LEFT: Logo Cell */}
              <td className="header-logo-cell">
                <div className="header-logo-box">
                  <img src="/login-assets/riteslogo.png" alt="RITES" className="header-logo-img" />
                  <div className="header-company-info">
                    <div className="header-hindi-name">राइट्स लिमिटेड</div>
                    <div className="header-hindi-division">(गुणवत्ता आश्वासन प्रभाग)</div>
                    <div className="header-english-info">RITES LTD (QA DIVISION)</div>
                  </div>
                </div>
              </td>
 
             <td className="header-center-cell">
               <div className="header-title">INSPECTION & TEST PLAN</div>
               <div className="header-product">{productName || selectedCall?.product_type || 'ELASTIC RAIL CLIP MK-III/MK-V'}</div>
               
               {/* New Highlighted Info Box (Yellow part from requirement) */}
               {extraInfo && (
                 <div className="header-extra-highlight">
                   {Object.entries(extraInfo).map(([key, value]) => (
                     <div key={key} className="extra-item">
                        <span className="extra-key">{key}:</span>
                        <span className="extra-value">{value}</span>
                     </div>
                   ))}
                 </div>
               )}
             </td>
 
             {/* RIGHT: Document Details Cell */}
             <td className="header-info-cell">
               <div className="header-info-line">DOC. NO: {docNo}</div>
               <div className="header-info-line">ISSUE NO: {issueNo}</div>
               <div className="header-info-line">PAGE NO: {pageNo}</div>
               <div className="header-info-line">EFFECTIVE DATE: {effectiveDate}</div>
               <div className="header-info-line">APPROVED BY: {approvedBy}</div>
             </td>
           </tr>
         </tbody>
       </table>

      {/* TITLE SECTION (if provided) */}
      {title && (
        <div className="annexure-main-title-section">
          <h2 className="annexure-main-title">{title}</h2>
        </div>
      )}

      {/* SUBTITLE AND ANNEXURE INFO SECTION */}
      {(subtitle || annexureNumber || additionalInfo) && (
        <div className="annexure-subtitle-row">
          <div className="annexure-subtitle-left">
            {subtitle}
            {additionalInfo && <div className="annexure-additional-info">{additionalInfo}</div>}
          </div>
          <div className="annexure-subtitle-right">
            {annexureNumber && <div className="annexure-number">{annexureNumber}</div>}
            {annexureCode && <div className="annexure-code">{annexureCode}</div>}
          </div>
        </div>
      )}


      {/* NOTE SECTION (if provided) */}
      {note && (
        <div className="annexure-note-section">
          {note}
        </div>
      )}
    </>
  );
};

export default AnnexureHeader;

