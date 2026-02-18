import React from 'react';

const responsiveStyles = `
  .notification-wrapper {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    width: calc(100% - 40px);
    pointer-events: none;
  }

  .notification-container {
    padding: 16px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), pulse 2s ease-in-out infinite;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
    border-left-width: 4px;
    border-left-style: solid;
    pointer-events: auto;
    backdrop-filter: blur(10px);
  }

  .notification-container.error {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 2px solid #fecaca;
    border-left-color: #dc2626;
    color: #991b1b;
    box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3), 0 0 0 1px rgba(220, 38, 38, 0.1);
    position: relative;
    overflow: hidden;
  }

  .notification-container.error::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  .notification-container.success {
    background: #f0fdf4;
    border: 2px solid #bbf7d0;
    border-left-color: #16a34a;
    color: #15803d;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
  }

  .notification-container.warning {
    background: #fffbeb;
    border: 2px solid #fde68a;
    border-left-color: #d97706;
    color: #b45309;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
  }

  .notification-container.info {
    background: #eff6ff;
    border: 2px solid #bfdbfe;
    border-left-color: #2563eb;
    color: #1e40af;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }

  .notification-icon {
    font-size: 22px;
    flex-shrink: 0;
    animation: shake 0.5s ease-in-out;
  }

  .notification-content {
    flex: 1;
    word-wrap: break-word;
    overflow-wrap: break-word;
    font-size: 14px;
  }

  .notification-close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    opacity: 0.7;
    transition: opacity 0.2s;
    border-radius: 4px;
  }

  .notification-close:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.05);
  }

  .notification-container.error .notification-close:hover {
    background: rgba(220, 38, 38, 0.1);
  }


  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3), 0 0 0 1px rgba(220, 38, 38, 0.1);
    }
    50% {
      box-shadow: 0 10px 28px rgba(220, 38, 38, 0.4), 0 0 0 1px rgba(220, 38, 38, 0.15);
    }
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
  }

  /* Mobile Responsive Styles */
  @media (max-width: 768px) {
    .notification-wrapper {
      top: 16px;
      right: 16px;
      left: 16px;
      max-width: none;
      width: auto;
    }

    .notification-container {
      padding: 14px 16px;
      gap: 10px;
      font-size: 13px;
    }

    .notification-icon {
      font-size: 20px;
    }

    .notification-content {
      font-size: 13px;
    }

    .notification-close {
      width: 26px;
      height: 26px;
      font-size: 18px;
    }
  }

  @media (max-width: 480px) {
    .notification-wrapper {
      top: 12px;
      right: 12px;
      left: 12px;
    }

    .notification-container {
      padding: 12px 14px;
      gap: 8px;
      font-size: 12px;
      border-left-width: 3px;
    }

    .notification-icon {
      font-size: 18px;
    }

    .notification-content {
      font-size: 12px;
    }

    .notification-close {
      width: 24px;
      height: 24px;
      font-size: 16px;
    }
  }
`;

const Notification = ({ 
  message, 
  type = 'error', 
  onClose, 
  autoClose = false, 
  autoCloseDelay = 5000 
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  // Reset visibility when message changes
  React.useEffect(() => {
    if (message) {
      setIsVisible(true);
    }
  }, [message]);

  React.useEffect(() => {
    if (autoClose && isVisible && message) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) {
          onClose();
        }
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, isVisible, onClose, message]);

  if (!isVisible || !message) {
    return null;
  }

  const icons = {
    error: '⚠️',
    success: '✓',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <style>{responsiveStyles}</style>
      <div className="notification-wrapper">
        <div className={`notification-container ${type}`}>
          <span className="notification-icon">{icons[type] || icons.error}</span>
          <div className="notification-content">{message}</div>
          {onClose && (
            <button 
              className="notification-close" 
              onClick={handleClose}
              aria-label="Close notification"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Notification;

