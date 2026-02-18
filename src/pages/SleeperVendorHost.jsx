import React, { useEffect } from 'react';
import { logoutUser } from '../services/authService';

const SleeperVendorHost = () => {
    // Listen for logout messages from the iframe
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'logout') {
                logoutUser();
                window.location.reload();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Determine the URL based on the environment
    // In development, it's likely localhost:5173
    // In production, it should be in a subfolder /sleeper-vendor/
    const isDevelopment = process.env.NODE_ENV === 'development';
    const sleeperVendorUrl = isDevelopment
        ? 'http://localhost:5173/sleeper-vendor/?bypassAuth=true'
        : '/sleeper-vendor/index.html?bypassAuth=true';

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden', border: 'none' }}>
            <iframe
                src={sleeperVendorUrl}
                title="Sleeper Vendor Dashboard"
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="fullscreen"
            />
        </div>
    );
};

export default SleeperVendorHost;
