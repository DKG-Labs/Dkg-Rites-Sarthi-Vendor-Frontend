import React, { useState } from 'react';
import { useVersionCheck } from '../../hooks/useVersionCheck';
import { setAcknowledgedVersion } from '../../config/version';
import { isLocalDevelopment } from '../../services/versionService';
import '../annexures/AnnexureLoader.css';

/**
 * VersionUpdateModal - Enterprise Centered Update Screen for Sarthi Vendor.
 * Uses the RITES Annexure Loader style with clear, user-friendly messaging.
 */
const VersionUpdateBanner = () => {
  const { updateAvailable, latestVersion, currentVersion, dismissUpdate } = useVersionCheck();
  const [isUpdating, setIsUpdating] = useState(false);

  if (isLocalDevelopment() || !updateAvailable) {
    return null;
  }

  const handleUpdate = () => {
    setIsUpdating(true);
    
    if (latestVersion) {
      setAcknowledgedVersion(latestVersion);
    }

    // Clean any cached assets and reload
    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        }).catch(() => {});
      }
    } catch (e) {}

    // Smooth reload transition
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const formattedCurrent = String(currentVersion || '1.2.20').replace(/^v/i, '');
  const formattedLatest = String(latestVersion || '1.2.21').replace(/^v/i, '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-update-title"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out forwards',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          borderRadius: '24px',
          padding: '36px 32px',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          boxSizing: 'border-box'
        }}
      >
        {/* RITES Logo with Spinning Progress Ring */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3.5px solid transparent',
              borderTop: '3.5px solid #0284c7',
              borderRight: '3.5px solid #10b981',
              animation: 'spinRing 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
            }}
          />
          <img
            src="/login-assets/riteslogo.png"
            alt="RITES Logo"
            onError={(e) => {
              e.target.src = '/sarthi-logo.png';
            }}
            style={{
              width: '58px',
              height: 'auto',
              zIndex: 2,
              animation: 'logoPulse 2s ease-in-out infinite'
            }}
          />
        </div>

        {/* Text Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
          <h2
            id="version-update-title"
            style={{
              fontSize: '21px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.3px',
              margin: 0
            }}
          >
            {isUpdating ? 'Refreshing SARTHI Vendor...' : 'New Sarthi Vendor Version Available'}
          </h2>

          {/* Version Comparison Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#15803d',
              margin: '4px 0'
            }}
          >
            <span style={{ color: '#64748b' }}>v{formattedCurrent}</span>
            <span style={{ color: '#94a3b8' }}>➔</span>
            <span style={{ color: '#047857', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>
              v{formattedLatest}
            </span>
          </div>

          <p
            style={{
              fontSize: '13.5px',
              color: '#475569',
              lineHeight: 1.5,
              margin: '4px 0 0',
              padding: '0 8px'
            }}
          >
            {isUpdating
              ? 'Loading newest vendor features and syncing latest system updates...'
              : 'A new version of SARTHI Vendor Portal has been deployed. Please update now to ensure uninterrupted inspection sync and latest features.'}
          </p>
        </div>

        {/* Action Buttons */}
        {!isUpdating ? (
          <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
            <button
              type="button"
              onClick={dismissUpdate}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              Remind Later
            </button>

            <button
              type="button"
              onClick={handleUpdate}
              style={{
                flex: 1.4,
                padding: '12px 18px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(2, 132, 199, 0.35)';
              }}
            >
              <span>⚡</span> Update & Refresh
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontSize: '13.5px', fontWeight: 600, marginTop: '8px' }}>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span>Reloading Workspace...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionUpdateBanner;
