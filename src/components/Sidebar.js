import React from 'react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav>
        <ul className="sidebar-nav">
          <li className="sidebar-item active">Dashboard</li>
          <li className="sidebar-item">Inspections</li>
          <li className="sidebar-item">Settings</li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
