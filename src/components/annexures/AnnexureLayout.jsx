import React from 'react';
import './AnnexureLayout.css';

/**
 * AnnexureLayout - Reusable base layout component for all annexures
 * Provides consistent structure and styling
 * 
 * Usage:
 * <AnnexureLayout>
 *   <AnnexureHeader pageNo="1 of 18" />
 *   <h3 className="center-text">Your Title</h3>
 *   <div className="annexure-info">...</div>
 *   <AnnexureTable>...</AnnexureTable>
 *   <AnnexureFooter />
 * </AnnexureLayout>
 */
const AnnexureLayout = ({ children, className = '' }) => {
  return (
    <div className={`annexure-layout ${className}`}>
      {children}
    </div>
  );
};

export default AnnexureLayout;

