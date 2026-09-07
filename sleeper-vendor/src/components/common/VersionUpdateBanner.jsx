import React, { useState } from 'react';
import { useVersionCheck } from '../../hooks/useVersionCheck';
import { isLocalDevelopment } from '../../services/versionService';

const VersionUpdateBanner = () => {
  const { updateAvailable, latestVersion, currentVersion, dismissUpdate } = useVersionCheck();
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
    }, 600);
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
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px',
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
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '32px' }}>🚀</span>
        </div>

        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            New Update Available
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
            A newer version of SARTHI Vendor Sleeper has been deployed. Please reload to apply the latest features and fixes.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#f8fafc', padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Current</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>v{formattedCurrent}</div>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '18px' }}>&rarr;</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600', textTransform: 'uppercase' }}>New</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>v{formattedLatest}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            onClick={dismissUpdate}
            disabled={isUpdating}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: '700',
              fontSize: '14px',
              cursor: isUpdating ? 'not-allowed' : 'pointer'
            }}
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '14px',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            {isUpdating ? 'Updating...' : 'Update & Reload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionUpdateBanner;
