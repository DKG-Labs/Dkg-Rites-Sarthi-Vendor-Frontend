import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchVersionStatus, isLocalDevelopment } from '../services/versionService';

const DEFAULT_POLL_INTERVAL_MS = 60 * 1000; // 1 minute

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

    checkForUpdate();

    const intervalId = setInterval(() => {
      checkForUpdate();
    }, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

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
    dismissUpdate,
    checkForUpdate
  };
};
