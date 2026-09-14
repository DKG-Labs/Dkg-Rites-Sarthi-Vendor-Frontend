import { 
  APP_VERSION as CONFIG_APP_VERSION, 
  GIT_COMMIT as CONFIG_GIT_COMMIT, 
  BUILD_TIME as CONFIG_BUILD_TIME,
  getActiveAppVersion,
  getActiveGitCommit,
  getActiveBuildTime 
} from '../config/version.js';

export const APP_VERSION = (typeof getActiveAppVersion === 'function' ? getActiveAppVersion() : CONFIG_APP_VERSION) || import.meta.env.VITE_APP_VERSION || '1.2.25';
export const GIT_COMMIT = (typeof getActiveGitCommit === 'function' ? getActiveGitCommit() : CONFIG_GIT_COMMIT) || import.meta.env.VITE_GIT_COMMIT || '';
export const BUILD_TIME = (typeof getActiveBuildTime === 'function' ? getActiveBuildTime() : CONFIG_BUILD_TIME) || '';

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
  const currentGitCommit = GIT_COMMIT;
  const currentBuildTime = BUILD_TIME;

  if (isLocalDevelopment()) {
    return {
      updateAvailable: false,
      serverVersion: null,
      currentVersion,
      currentGitCommit,
      isLocal: true
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const cacheBuster = `_t=${Date.now()}&_r=${Math.random().toString(36).substring(2, 8)}`;
    const url = `/version.json?${cacheBuster}`;

    let response = null;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        signal: controller.signal,
      });
    } catch (_) {}

    if (!response || !response.ok) {
      const baseUrl = import.meta.env?.BASE_URL || './';
      const fallbackUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}version.json?${cacheBuster}`;
      try {
        response = await fetch(fallbackUrl, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          signal: controller.signal,
        });
      } catch (_) {}
    }

    clearTimeout(timeoutId);

    if (!response || !response.ok) {
      return { updateAvailable: false, serverVersion: null, currentVersion, currentGitCommit };
    }

    const data = await response.json();
    const serverVersion = data.version ? String(data.version).trim() : null;
    const serverGitCommit = data.gitCommit ? String(data.gitCommit).trim() : null;
    const serverBuildTime = data.buildTime ? String(data.buildTime).trim() : null;

    if (!serverVersion) {
      return { updateAvailable: false, serverVersion: null, currentVersion, currentGitCommit };
    }

    const isSemverNewer = compareVersions(currentVersion, serverVersion) > 0;
    const isCommitChanged = Boolean(
      serverGitCommit &&
      currentGitCommit &&
      serverGitCommit !== 'dev' &&
      currentGitCommit !== 'dev' &&
      serverGitCommit.toLowerCase() !== currentGitCommit.toLowerCase()
    );
    const isBuildTimeNewer = Boolean(
      serverBuildTime &&
      currentBuildTime &&
      new Date(serverBuildTime).getTime() > new Date(currentBuildTime).getTime()
    );

    const updateAvailable = isSemverNewer || isCommitChanged || isBuildTimeNewer;

    return {
      updateAvailable,
      serverVersion,
      currentVersion,
      serverGitCommit,
      currentGitCommit,
      buildTime: serverBuildTime,
      gitCommit: serverGitCommit
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return { updateAvailable: false, serverVersion: null, currentVersion, currentGitCommit };
  }
};
