import React from 'react';

const Sidebar = ({ activeItem, onItemClick, isOpen, expanded, onMouseEnter, onMouseLeave, onClick }) => {
    const menuSections = [
        {
            label: 'Sleeper-Vendor',
            items: [
                { id: 'Vendor', label: 'Dashboard', icon: 'VR' },
            ]
        }
    ];

    return (
        <aside
            className={`sidebar-root ${isOpen ? 'open' : ''} ${expanded ? 'expanded' : ''}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
        >
            <div className="sidebar-header">
                <h2 className="sidebar-logo">SARTHI</h2>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px', display: 'block' }}>Rites Ltd.</span>
            </div>

            <nav className="sidebar-nav">
                {menuSections.map((section, sidx) => (
                    <div key={sidx} className="menu-section">
                        <div className="menu-section-label">{section.label}</div>
                        {section.items.map((item) => (
                            <div
                                key={item.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onItemClick(item.id);
                                }}
                                className={`menu-item ${activeItem === item.id ? 'active' : ''}`}
                                style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                            >
                                <span className="menu-icon" style={{
                                    fontSize: '0.6rem',
                                    minWidth: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: activeItem === item.id ? '#338691' : '#f1f5f9',
                                    color: activeItem === item.id ? 'white' : '#64748b',
                                    borderRadius: '6px',
                                    fontWeight: '700',
                                    border: `1px solid ${activeItem === item.id ? '#338691' : '#e2e8f0'}`
                                }}>
                                    {item.icon}
                                </span>
                                <span className="menu-label">{item.label}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </nav>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', fontSize: 'var(--fs-xxs)', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {expanded ? 'v1.2.0' : 'v1.2'}
            </div>
        </aside>
    );
};

export default Sidebar;
