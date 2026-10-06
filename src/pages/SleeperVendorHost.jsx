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
    const isDevelopment = process.env.NODE_ENV === 'development';
    const vendorCode = localStorage.getItem('vendorCode') || sessionStorage.getItem('vendorCode') || '';
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('authToken') || sessionStorage.getItem('token') || '';
    const vendorName = localStorage.getItem('vendorName') || sessionStorage.getItem('vendorName') || '';
    const plantId = localStorage.getItem('plantId') || sessionStorage.getItem('plantId') || '';
    const selectedPlant = localStorage.getItem('selectedPlant') || '';

    const buildParams = () => {
        const p = new URLSearchParams();
        p.set('bypassAuth', 'true');
        if (vendorCode) p.set('vendorCode', vendorCode);
        if (userId) p.set('userId', userId);
        if (token) p.set('token', token);
        if (vendorName) p.set('vendorName', vendorName);
        if (plantId) p.set('plantId', plantId);
        if (selectedPlant) p.set('selectedPlant', selectedPlant);
        return p.toString();
    };

    const host = window.location.hostname || 'localhost';
    const sleeperVendorUrl = isDevelopment
        ? `http://${host}:5173/sleeper-vendor/?${buildParams()}`
        : `/sleeper-vendor/?${buildParams()}`;

    const handleIframeLoad = (e) => {
        try {
            const iframe = e.target;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'SARTHI_AUTH_SYNC',
                    payload: {
                        vendorCode,
                        userId,
                        token,
                        vendorName,
                        plantId,
                        selectedPlant
                    }
                }, '*');
            }
        } catch (err) {
            console.error('Failed to sync auth with sleeper-vendor iframe:', err);
        }
    };

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden', border: 'none' }}>
            <iframe
                src={sleeperVendorUrl}
                title="Sleeper Vendor Dashboard"
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="fullscreen"
                onLoad={handleIframeLoad}
            />
        </div>
    );
};

export default SleeperVendorHost;
