import React, { useEffect, useState } from 'react';

const Notification = ({ message, type, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!message) return;
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, 3000); // 3 seconds before sliding out
        return () => clearTimeout(timer);
    }, [message, onClose]);

    if (!message) return null;

    const backgroundColor = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6';
    const borderColor = type === 'error' ? '#b91c1c' : type === 'success' ? '#047857' : '#2563eb';

    return (
        <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: backgroundColor,
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            borderLeft: `6px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            zIndex: 9999,
            fontWeight: '600',
            fontSize: '15px',
            transform: visible ? 'translateX(0)' : 'translateX(120%)',
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease',
            opacity: visible ? 1 : 0
        }}>
            <div>
                {type === 'error' && <span style={{ marginRight: '8px', fontSize: '18px' }}>⚠️</span>}
                {type === 'success' && <span style={{ marginRight: '8px', fontSize: '18px' }}>✅</span>}
                {message}
            </div>
            <button 
                onClick={() => { setVisible(false); if(onClose) onClose(); }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '18px',
                    opacity: 0.7,
                    padding: '0 4px'
                }}
            >
                &times;
            </button>
        </div>
    );
};

export default Notification;
