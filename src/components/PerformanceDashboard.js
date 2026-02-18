import React from 'react';
import { PERFORMANCE_METRICS } from '../data/mockData';

const cardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const helperStyle = {
  fontSize: 'var(--font-size-xs)',
  color: 'var(--color-text-secondary)'
};

const PerformanceDashboard = ({ metrics = PERFORMANCE_METRICS }) => {
  const kpiCards = [
    {
      label: 'Acceptance / Rejection %',
      value: `${metrics.acceptance_percentage}% / ${metrics.rejection_percentage}%`,
      helper: 'Closed lots accepted vs rejected'
    },
    {
      label: 'Response Time to Inspection Calls',
      value: `${metrics.response_time_hours} hrs`,
      helper: 'Avg. acknowledgement time'
    },
    {
      label: 'Scheduling Delay (Days)',
      value: `${metrics.scheduling_delay_days}`,
      helper: 'Avg. delay from call to schedule'
    },
    {
      label: 'Call Cancellation',
      value: metrics.call_cancellations,
      helper: 'Cancelled inspections this month'
    },
    {
      label: 'Delay in IC Issuance',
      value: `${metrics.ic_delay_days} days`,
      helper: 'Avg. delay post inspection'
    }
  ];

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {kpiCards.map(card => (
          <div className="stat-card" key={card.label} style={cardStyle}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
            {card.helper && <div style={helperStyle}>{card.helper}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
