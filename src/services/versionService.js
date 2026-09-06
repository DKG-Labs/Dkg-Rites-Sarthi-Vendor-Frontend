import { getActiveAppVersion } from '../config/version.js';

/**
 * Parses and compares two semantic version strings or date-based deployment IDs.
 * Returns:
 *   1 if remote > local (update available)
 *   0 if remote === local
 *  -1 if remote < local
 *
 * @param {string} local - Currently running client version
 * @param {string} remote - Latest deployed version on server
 * @returns {number}
 */
export const compareVersions = (local, remote) => {
  if (!local || !remote) return 0;
  if (local === remote) return 0;

  // Clean strings
  const cleanLocal = String(local).trim().replace(/^v/i, '');
  const cleanRemote = String(remote).trim().replace(/^v/i, '');

  if (cleanLocal === cleanRemote) return 0;

  // Try standard SemVer numeric comparison (e.g. 1.2.20 vs 1.2.21)
  const semverRegex = /^\d+(\.\d+)*$/;
  const localBase = cleanLocal.split('-')[0];
  const remoteBase = cleanRemote.split('-')[0];

  if (semverRegex.test(localBase) && semverRegex.test(remoteBase)) {
    const localParts = localBase.split('.').map(num => parseInt(num, 10));
    const remoteParts = remoteBase.split('.').map(num => parseInt(num, 10));
    const maxLen = Math.max(localParts.length, remoteParts.length);

    for (let i = 0; i < maxLen; i++) {
      const l = localParts[i] || 0;
      const r = remoteParts[i] || 0;
      if (r > l) return 1;
      if (r < l) return -1;
    }

    // Base versions are equal, compare pre-release / commit hash if present
    const localTag = cleanLocal.includes('-') ? cleanLocal.substring(cleanLocal.indexOf('-') + 1) : '';
    const remoteTag = cleanRemote.includes('-') ? cleanRemote.substring(cleanRemote.indexOf('-') + 1) : '';
    if (remoteTag && localTag && remoteTag !== localTag) {
      return 1;
    }
    return 0;
  }

  // Fallback: If different string representations, treat as newer
  return cleanRemote !== cleanLocal ? 1 : 0;
};

/**
 * Detects if the application is running in a local development environment.
 * In local development (localhost, 127.0.0.1, development mode), automatic update modals are suppressed.
 *
 * @returns {boolean}
 */
export const isLocalDevelopment = () => {
  if (process.env.NODE_ENV === 'development') return true;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    );
  }
  return false;
};

/**
 * Fetches the version manifest from the server with strict cache-busting and timeout protection.
 *
 * @param {number} timeoutMs - Request timeout in milliseconds (default: 10000ms)
 * @returns {Promise<{updateAvailable: boolean, serverVersion: string|null, currentVersion: string, buildTime?: string, gitCommit?: string}>}
 */
export const fetchVersionStatus = async (timeoutMs = 10000) => {
  const currentVersion = getActiveAppVersion();

  // Suppress version checks and update alerts on local development environments
  if (isLocalDevelopment()) {
    return {
      updateAvailable: false,
      serverVersion: null,
      currentVersion,
      isLocal: true
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { updateAvailable: false, serverVersion: null, currentVersion };
    }

    const data = await response.json();
    if (!data || typeof data.version !== 'string') {
      return { updateAvailable: false, serverVersion: null, currentVersion };
    }

    const serverVersion = data.version.trim();
    const isNewer = compareVersions(currentVersion, serverVersion) > 0;

    return {
      updateAvailable: isNewer,
      serverVersion,
      currentVersion,
      buildTime: data.buildTime || null,
      gitCommit: data.gitCommit || null
    };
  } catch (error) {
    clearTimeout(timeoutId);
    // Graceful silent return on abort/network offline
    return { updateAvailable: false, serverVersion: null, currentVersion };
  }
};
