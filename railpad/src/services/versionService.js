/**
 * Version Management Service for Vendor Railpad
 */

export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.2.21';

export const compareVersions = (local, remote) => {
  if (!local || !remote) return 0;
  if (local === remote) return 0;

  const cleanLocal = String(local).trim().replace(/^v/i, '');
  const cleanRemote = String(remote).trim().replace(/^v/i, '');

  if (cleanLocal === cleanRemote) return 0;

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

    const localTag = cleanLocal.includes('-') ? cleanLocal.substring(cleanLocal.indexOf('-') + 1) : '';
    const remoteTag = cleanRemote.includes('-') ? cleanRemote.substring(cleanRemote.indexOf('-') + 1) : '';
    if (remoteTag && localTag && remoteTag !== localTag) {
      return 1;
    }
    return 0;
  }

  return cleanRemote !== cleanLocal ? 1 : 0;
};

export const isLocalDevelopment = () => {
  if (import.meta.env.DEV) return true;
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

export const fetchVersionStatus = async (timeoutMs = 10000) => {
  const currentVersion = APP_VERSION;

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
    const cacheBuster = `_t=${Date.now()}&_r=${Math.random().toString(36).substring(2, 8)}`;
    const url = `/version.json?${cacheBuster}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { updateAvailable: false, serverVersion: null, currentVersion };
    }

    const data = await response.json();
    const serverVersion = data.version ? String(data.version).trim() : null;

    if (!serverVersion) {
      return { updateAvailable: false, serverVersion: null, currentVersion };
    }

    const isNewer = compareVersions(currentVersion, serverVersion) > 0;

    return {
      updateAvailable: isNewer,
      serverVersion,
      currentVersion,
      buildTime: data.buildTime,
      gitCommit: data.gitCommit
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return { updateAvailable: false, serverVersion: null, currentVersion };
  }
};
