import React from 'react';

/**
 * StatCard component
 * Displays a statistic within a card.
 */
const StatCard = ({ label, value, icon, trend, subLabel }) => {
    return (
        <div className="stat-card" style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>{label}</span>
                {icon && <div style={{
                    width: '32px',
                    height: '32px',
                    background: '#f1f5f9',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>{icon}</div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>{value}</span>
                {trend && (
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: trend.type === 'up' ? '#10b981' : '#ef4444',
                        background: trend.type === 'up' ? '#ecfdf5' : '#fef2f2',
                        padding: '2px 6px',
                        borderRadius: '4px'
                    }}>
                        {trend.type === 'up' ? '↑' : '↓'} {trend.value}
                    </span>
                )}
            </div>

            {subLabel && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{subLabel}</span>}
        </div>
    );
};

export default StatCard;
