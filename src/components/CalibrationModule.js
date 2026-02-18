import React from 'react';
import { CALIBRATION_DATA } from '../data/mockData';
import { calculateDaysLeft, formatDate } from '../utils/helpers';
import StatusBadge from './StatusBadge';

const CalibrationModule = ({ instruments = CALIBRATION_DATA }) => (
  <div className="card">
    <div className="card-header">
      <h3 className="card-title">Calibration Status</h3>
    </div>
    {instruments.map((item, idx) => {
      const daysLeft = calculateDaysLeft(item.due_date);
      return (
        <div key={idx} className="calibration-item">
          <div className="calibration-info">
            <div className="calibration-name">{item.instrument}</div>
            <div className="calibration-date">Due: {formatDate(item.due_date)}</div>
          </div>
          <div className="calibration-countdown">
            <StatusBadge status={daysLeft > 0 ? 'Valid' : 'Expired'} />
            <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-4)' }}>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default CalibrationModule;
