import React from 'react';

const StatusBadge = ({ label, color, bgColor, borderColor }) => {
    const style = {
        color: color,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        display: 'inline-block',
    };

    return <span style={style}>{label}</span>;
};

export default StatusBadge;
