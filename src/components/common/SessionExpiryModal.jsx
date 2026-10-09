import React, { useState, useEffect } from 'react';
import { RITES_LOGO_DATA_URI } from './ritesLogoData';
import './SessionExpiryModal.css';

/**
 * SessionExpiryModal
 * Enterprise modal displayed when JWT token expires (401 Unauthorized).
 * Displays official RITES branding and remains visible until user clicks Log Out.
 */
const SessionExpiryModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      const hasToken =
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('railpad_token') ||
        localStorage.getItem('sleeper_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('authToken');

      if (hasToken && !isOpen) {
        setIsOpen(true);
      }
    };

    window.addEventListener('sarthi:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('sarthi:session_expired', handleSessionExpired);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    try {
      // 1. Wipe all storage keys in current window
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Error clearing local storage on session expiry logout:', e);
    }

    // 2. Notify parent window if running inside an iframe / micro-frontend host
    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage('logout', '*');
        window.parent.postMessage({ type: 'LOGOUT' }, '*');
        window.parent.postMessage({ type: 'sarthi:logout' }, '*');
        try {
          window.parent.localStorage.clear();
          window.parent.sessionStorage.clear();
        } catch (err) {}
      }
    } catch (e) {}

    // 3. Force redirection of top window or current window to root / login
    setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.top && window.top.location) {
          window.top.location.href = '/';
          window.top.location.reload();
          return;
        }
      } catch (e) {}

      window.location.href = '/';
      window.location.reload();
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <div className="session-expiry-overlay" role="dialog" aria-modal="true">
      <div className="session-expiry-card">
        {/* Official RITES Branding Logo */}
        <div className="session-expiry-logo-container">
          <div className="session-expiry-logo-circle">
            <img
              src={RITES_LOGO_DATA_URI}
              alt="RITES Limited"
              className="session-expiry-rites-img"
            />
          </div>
        </div>

        {/* Text Content */}
        <div className="session-expiry-text-group">
          <div className="session-expiry-badge">
            <span className="session-expiry-badge-dot"></span>
            Security Timeout
          </div>
          <h2 className="session-expiry-title">Session Expired</h2>
          <p className="session-expiry-subtitle">
            Your secure session has timed out for protection. Please log out and sign in again to continue working safely.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          className="session-expiry-btn"
          onClick={handleLogout}
          autoFocus
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log Out &amp; Sign In</span>
        </button>
      </div>
    </div>
  );
};

export default SessionExpiryModal;
