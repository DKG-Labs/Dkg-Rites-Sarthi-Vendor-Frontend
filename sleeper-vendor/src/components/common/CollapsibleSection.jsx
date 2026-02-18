import React, { useState } from 'react';

/**
 * CollapsibleSection Component
 * A reusable container for sections that can be toggled by the user.
 */
const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="collapsible-section" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '1.5rem', overflow: 'hidden', background: '#fff' }}>
            <div
                className="section-header"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '1rem 1.5rem',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isOpen ? '1px solid var(--border-color)' : 'none'
                }}
            >
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{title}</span>
                <span style={{ fontSize: '0.8rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
            </div>
            {isOpen && (
                <div className="section-content" style={{ padding: '1.5rem' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSection;
