import React, { useState } from 'react';
import { useVersionCheck } from '../../hooks/useVersionCheck';
import { isLocalDevelopment } from '../../services/versionService';

/**
 * VersionUpdateBanner for Vendor App - Ultra-modern enterprise update modal with SARTHI branding.
 */
const VersionUpdateBanner = () => {
  const { updateAvailable, latestVersion, currentVersion } = useVersionCheck();
  const [isUpdating, setIsUpdating] = useState(false);

  if (isLocalDevelopment() || !updateAvailable) {
    return null;
  }

  const handleUpdate = () => {
    setIsUpdating(true);

    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        }).catch(() => {});
      }
    } catch (e) {}

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const formattedCurrent = String(currentVersion || '1.0.0').replace(/^v/i, '');
  const formattedLatest = String(latestVersion || '1.0.1').replace(/^v/i, '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999999,
        padding: '20px',
        boxSizing: 'border-box',
        animation: 'sarthiFadeIn 0.3s ease-out forwards'
      }}
    >
      <style>{`
        @keyframes sarthiFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sarthiSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sarthiSpinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sarthiPulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.88; transform: scale(1.02); }
        }
      `}</style>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '36px 32px',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          boxSizing: 'border-box',
          animation: 'sarthiSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Sarthi Logo with Modern Rotating Ring */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '50%',
            boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.15)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTop: '3px solid #2563eb',
              borderRight: '3px solid #059669',
              animation: 'sarthiSpinRing 1.8s linear infinite'
            }}
          />
          <img
            src="/logo-sarthi.png"
            alt="SARTHI"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = './logo-sarthi.png';
            }}
            style={{
              width: '54px',
              height: 'auto',
              maxHeight: '46px',
              objectFit: 'contain',
              zIndex: 2,
              animation: 'sarthiPulseGlow 3s ease-in-out infinite'
            }}
          />
        </div>

        {/* Live Status Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ecfdf5',
            color: '#047857',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.3px',
            border: '1px solid #a7f3d0'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          Update Available
        </div>

        {/* Title and Message */}
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
            New Version Available
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', lineHeight: '1.55', fontWeight: 500 }}>
            A newer version of SARTHI Vendor Portal has been deployed. Please reload to apply the latest features and fixes.
          </p>
        </div>

        {/* Version Transformation Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            padding: '12px 20px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginTop: '2px' }}>v{formattedCurrent}</div>
          </div>
          
          <div style={{ color: '#2563eb', fontSize: '20px', fontWeight: 'bold' }}>&rarr;</div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10.5px', color: '#2563eb', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Version</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb', marginTop: '2px' }}>v{formattedLatest}</div>
          </div>
        </div>

        {/* Single Primary Action Button */}
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '15px',
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isUpdating ? 'Refreshing Application...' : '⚡ Update & Reload'}
        </button>
      </div>
    </div>
  );
};

export default VersionUpdateBanner;
