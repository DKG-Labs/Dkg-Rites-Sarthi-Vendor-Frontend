/**
 * Sarthi Vendor Application Version Configuration
 * Represents the version of the currently running frontend bundle.
 */

export const APP_VERSION = process.env.REACT_APP_VERSION || '1.2.20';
export const BUILD_TIME = process.env.REACT_APP_BUILD_TIME || null;
export const GIT_COMMIT = process.env.REACT_APP_GIT_COMMIT || 'dev';

export const getActiveAppVersion = () => {
  return APP_VERSION;
};

export const setAcknowledgedVersion = (version) => {
  try {
    if (version) {
      sessionStorage.setItem('sarthi_vendor_acknowledged_version', String(version).trim());
    }
  } catch (e) {
    // Ignore storage issues
  }
};
