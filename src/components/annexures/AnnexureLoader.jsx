import React from 'react';
import './AnnexureLoader.css';

/**
 * AnnexureLoader - A premium, high-end loading component for report operations.
 * Features glassmorphism, pulsing branding, and shimmering text.
 * 
 * @param {string} title - Main loading title
 * @param {string} subtitle - Shimmering status subtext
 * @param {boolean} fullScreen - Whether to show as a full-screen overlay
 */
const AnnexureLoader = ({ 
  title = "Processing...", 
  subtitle = "Fetching secure report data...", 
  fullScreen = true 
}) => {
  return (
    <div className={`annexure-loader-overlay ${!fullScreen ? 'loader-contained' : ''}`}>
      <div className="annexure-loader-card">
        <div className="loader-logo-container">
          <div className="loader-spinner-ring"></div>
          <img 
            src="/login-assets/riteslogo.png" 
            alt="RITES Logo" 
            className="loader-rites-logo" 
          />
        </div>
        
        <div className="loader-text-group">
          <h2 className="loader-main-text">{title}</h2>
          <p className="loader-sub-text">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default AnnexureLoader;
