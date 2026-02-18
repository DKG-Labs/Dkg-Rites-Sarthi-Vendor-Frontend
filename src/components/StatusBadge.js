import React from 'react';

const StatusBadge = ({ status }) => {
  const className = `status-badge ${status.toLowerCase()}`;
  return <span className={className}>{status}</span>;
};

export default StatusBadge;
