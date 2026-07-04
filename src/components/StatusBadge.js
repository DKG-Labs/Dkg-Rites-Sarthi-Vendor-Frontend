import React from 'react';

const StatusBadge = ({ status, text }) => {
  const safeStatus = (status || '').toLowerCase().replace(/\s+/g, '-');
  const className = `status-badge ${safeStatus}`;
  return <span className={className}>{text || status}</span>;
};

export default StatusBadge;
