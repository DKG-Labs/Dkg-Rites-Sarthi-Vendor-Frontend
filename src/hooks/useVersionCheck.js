import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchVersionStatus, isLocalDevelopment } from '../services/versionService';

const DEFAULT_POLL_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * Enterprise React hook for detecting frontend version deployments across tab lifecycle events.
 *
 * @param {Object} options
 * @param {number} [options.intervalMs] - Polling interval in ms (default: 1 minute)
 * @param {boolean} [options.enabled] - Whether auto-polling is enabled (default: true)
 * @returns {{
 *   updateAvailable: boolean,
 *   latestVersion: string|null,
 *   currentVersion: string,
 *   latestCommit: string|null,
 *   currentCommit: string,
 *   dismissed: boolean,
 *   checkForUpdate: () => Promise<void>,
 *   dismissUpdate: () => void
 * }}
 */
export const useVersionCheck = ({
  intervalMs = DEFAULT_POLL_INTERVAL_MS,
  enabled = true
} = {}) => {
  const isLocal = isLocalDevelopment();
  const shouldEnable = enabled && !isLocal;

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestCommit, setLatestCommit] = useState(null);
  const [currentCommit, setCurrentCommit] = useState('');
  const [dismissedKey, setDismissedKey] = useState(null);

  const isCheckingRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (isLocal) return;

    // Concurrency lock: only 1 check active at a time
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const status = await fetchVersionStatus();
      setCurrentVersion(status.currentVersion);
      setCurrentCommit(status.currentGitCommit || '');

      if (status.updateAvailable) {
        setLatestVersion(status.serverVersion);
        setLatestCommit(status.serverGitCommit || status.gitCommit || null);
        setUpdateAvailable(true);
      } else {
        setUpdateAvailable(false);
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [isLocal]);

  const currentKey = `${latestVersion || ''}_${latestCommit || ''}`;

  const dismissUpdate = useCallback(() => {
    if (currentKey) {
      setDismissedKey(currentKey);
    }
  }, [currentKey]);

  useEffect(() => {
    if (!shouldEnable) return;

    // 1. Initial startup check
    checkForUpdate();

    // 2. Periodic background interval (1 min)
    const intervalId = setInterval(() => {
      checkForUpdate();
    }, intervalMs);

    // 3. Tab focus / visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    // 4. Network reconnection handler
    const handleOnline = () => {
      checkForUpdate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [shouldEnable, intervalMs, checkForUpdate]);

  const isDismissed = Boolean(dismissedKey && currentKey && dismissedKey === currentKey);

  return {
    updateAvailable: updateAvailable && !isDismissed,
    latestVersion,
    currentVersion,
    latestCommit,
    currentCommit,
    dismissed: isDismissed,
    checkForUpdate,
    dismissUpdate
  };
};
