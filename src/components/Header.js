import React from 'react';
import { getStoredUser, getActiveRole } from '../services/authService';
import LogoutIcon from '@mui/icons-material/Logout';


const Header = ({
  setIsSidebarOpen,
  userEmail = 'ie@sarthi.com'
}) => {
  const user = getStoredUser();
  const activeRole = getActiveRole();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const isVendor = activeRole?.includes('Vendor') || (user?.roleName && (Array.isArray(user.roleName) ? user.roleName.some(r => r.includes('Vendor')) : user.roleName.includes('Vendor')));

  let displayName = 'Inspection Engineer';
  let displayRole = activeRole || 'Inspection Engineer';
  if (isVendor) {
    displayRole = activeRole === 'Vendor' ? 'ERC Vendor' : (activeRole === 'Rail Vendor' ? 'Railpad Vendor' : (activeRole || 'Vendor'));
    if (user?.vendorName) {
      displayName = user.vendorName;
    } else {
      displayName = displayRole;
    }
  }

  const displayEmail = isVendor ? (user?.userName || userEmail) : userEmail;
  const avatarText = isVendor ? (user?.vendorName ? user.vendorName.substring(0, 2).toUpperCase() : 'V') : 'IE';
  const isSleeperOrRailpad = activeRole === 'Sleeper Vendor' || activeRole === 'Rail Vendor';
  const idLabel = isSleeperOrRailpad ? 'Plant ID' : 'ID';


  return (
    <header className="app-header">
      {/* LEFT */}
      <div className="header-left">
        <div className="brand-block">
          <img
            src="/sarthi-logo.png"
            alt="SARTHI Logo"
            className="brand-logo"
          />

          <div className="brand-text">
            <div className="brand-title">SARTHI</div>
            <div className="brand-subtitle">
              System for Automated Review, Tracking & Holistic Inspection
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="header-right">
        {/* Sidebar Toggle */}



        {/* User */}
        <div className="user-info">
          <div className="user-avatar" style={{ background: '#0f172a', boxShadow: 'none' }}>{avatarText}</div>
          <div className="user-meta">
            <div className="user-role" title={displayName}>
              {displayName}
            </div>
            <div className="user-email">{isVendor ? `${displayRole} • ${idLabel}: ${displayEmail}` : `IE • ID: ${displayEmail}`}</div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0', margin: '0 4px' }}></div>

        {/* Logout */}
        <button
          className="btn btn-sm btn-outline logout-btn"
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <LogoutIcon style={{ fontSize: '18px', color: '#475569' }} /> Logout
        </button>

        <button
          className="icon-btn"
          onClick={() => setIsSidebarOpen(prev => !prev)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

      </div>
    </header>
  );
};

export default Header;

// import React from 'react';

// const Header = () => {
//   return (
//     <header className="app-header">
//       <div className="header-left">
//         <div className="app-logo">SARTHI</div>
//       </div>
//       <div className="header-right">
//         <div className="user-info">
//           <span>IE (Inspection Engineer)</span>
//           <div className="user-avatar">IE</div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;
/* <header className="app-header">
        <div className="header-left">
          <div className="app-logo">SARTHI</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Inspection Engineer Dashboard
          </div>
        </div>

        <div className="header-right">
          <button
            className="btn btn-sm btn-outline hamburger-btn"
            onClick={() => setIsSidebarOpen(open => !open)}
            aria-label="Toggle menu"
            style={{ marginRight: '8px' }}
          >
            ☰
          </button>

          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {new Date('2025-11-14T17:00:00').toLocaleString()}
          </div>

          <div className="user-info">
            <div className="user-avatar">IE</div>
            <div>
              <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>
                Vendor Dashboard
              </div>
              <div>{userEmail}</div>
            </div>
          </div>

          <button className="btn btn-sm btn-outline">Logout</button>
        </div>
      </header> */
