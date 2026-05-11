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
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Capture existing session data from main app to pass to sub-app
    const vendorCode = localStorage.getItem('vendorCode') || '';
    const vendorName = localStorage.getItem('vendorName') || '';
    const userId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('authToken') || '';

    const buildParams = () => {
        const p = new URLSearchParams();
        p.set('bypassAuth', 'true');
        if (vendorCode) p.set('vendorCode', vendorCode);
        if (vendorName) p.set('vendorName', vendorName);
        if (userId)     p.set('userId', userId);
        if (token)      p.set('token', token);

        const plantStr = localStorage.getItem('selectedRailPlant');
        if (plantStr) p.set('selectedRailPlant', plantStr);

        return p.toString();
    };

    const railpadUrl = isDevelopment
        ? `http://localhost:5174/railpad/?${buildParams()}`
        : `/railpad/index.html?${buildParams()}`;

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
