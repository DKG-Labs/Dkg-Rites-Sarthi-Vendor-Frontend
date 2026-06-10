import React from 'react';
import './AnnexureFooter.css';

/**
 * AnnexureFooter - Reusable footer component for all annexures
 * Displays stamp and signature section
 * 
 * Props:
 * - stampText: Stamp text (default: "STAMP")
 * - signatureLabel: Signature label (default: "Name & signature of IE")
 * - signatureName: Name (default: "Dharm Singh Fartyal")
 * - signatureDesignation: Designation (default: "Sr. Manager (Mech.)")
 * - signatureLocation: Location (default: "RITES Ltd. / W.R. MUMBAI - 21")
 */
const AnnexureFooter = ({
  // stampText = 'STAMP',
  signatureLabel = 'Name & signature of IE',
  signatureName = 'Dharm Singh Fartyal',
  signatureDesignation = 'Sr. Manager (Mech.)',
  signatureLocation = 'RITES Ltd. / W.R. MUMBAI - 21'
}) => {
  return (
    <div className="annexure-footer">
      <div className="annexure-stamp-section">
        {/* <div className="annexure-stamp-placeholder">{stampText}</div> */}
      </div>
      <div className="annexure-signature-section">
        <div className="annexure-signature-label">{signatureLabel}</div>
        {/* <div className="annexure-signature-name">{signatureName}</div>
        <div className="annexure-signature-designation">{signatureDesignation}</div>
        <div className="annexure-signature-location">{signatureLocation}</div> */}
      </div>
    </div>
  );
};

export default AnnexureFooter;

