import React, { useEffect } from 'react';
import { logoutUser } from '../services/authService';

const RailpadHost = () => {
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
    // In development, it's likely localhost:5174
    // In production, it should be in a subfolder /railpad/
    const isDevelopment = process.env.NODE_ENV === 'development';
    const railpadUrl = isDevelopment
        ? 'http://localhost:5174/railpad/?bypassAuth=true'
        : '/railpad/index.html?bypassAuth=true';

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden', border: 'none' }}>
            <iframe
                src={railpadUrl}
                title="Railpad Dashboard"
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="fullscreen"
            />
        </div>
    );
};

export default RailpadHost;
