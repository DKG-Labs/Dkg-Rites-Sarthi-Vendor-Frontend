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
  const [dismissedVersion, setDismissedVersion] = useState(null);

  const isCheckingRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (isLocal) return;
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const status = await fetchVersionStatus();
      setCurrentVersion(status.currentVersion);

      if (status.updateAvailable && status.serverVersion) {
        setLatestVersion(status.serverVersion);
        setUpdateAvailable(true);
      } else {
        setUpdateAvailable(false);
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [isLocal]);

  const dismissUpdate = useCallback(() => {
    if (latestVersion) {
      setDismissedVersion(latestVersion);
    }
  }, [latestVersion]);

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

  const isDismissed = Boolean(dismissedVersion && latestVersion && dismissedVersion === latestVersion);

  return {
    updateAvailable: updateAvailable && !isDismissed,
    latestVersion,
    currentVersion,
    dismissUpdate,
    checkForUpdate
  };
};
