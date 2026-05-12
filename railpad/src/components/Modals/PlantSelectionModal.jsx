import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { plantMappingService } from '../../services/plantMappingService.js';

const PlantSelectionModal = ({ onSelect, vendorCode, initialVendorName }) => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vendorName, setVendorName] = useState(initialVendorName || 'RailPad Vendor');

    useEffect(() => {
        const fetchPlants = async () => {
            if (!vendorCode) {
                setLoading(false);
                return;
            }
            const url = `${plantMappingService.getUrl ? plantMappingService.getUrl(vendorCode) : '...'}`;
            console.log('Modal: Fetching plants from:', url);
            try {
                const response = await plantMappingService.getVendorPlants(vendorCode);
                if (response && response.plants) {
                    setPlants(response.plants);
                    if (response.companyName) setVendorName(response.companyName);
                }
            } catch (err) {
                console.error('Modal Fetch Error:', err);
                setError(`Failed to load plants for ${vendorCode}. ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchPlants();
    }, [vendorCode]);

    return createPortal(
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                background: '#ffffff',
                width: '100%',
                maxWidth: '500px',
                borderRadius: '32px',
                padding: '40px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#f0f9fa',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    margin: '0 auto 24px'
                }}>
                    🏗️
                </div>
                
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                    Select Production Plant
                </h2>
                <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px' }}>
                    Welcome back, <span style={{ fontWeight: '700', color: '#21808d' }}>{vendorName}</span>. 
                    Please choose a plant to manage its operations.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <div className="modal-spinner" style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid #f3f4f6',
                                borderTop: '4px solid #21808d',
                                borderRadius: '50%',
                                margin: '0 auto 16px',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Fetching linked plants...</p>
                        </div>
                    ) : plants.length > 0 ? (
                        plants.map((plant) => (
                            <button
                                key={plant.plantId}
                                onClick={() => onSelect(plant)}
                                style={{
                                    padding: '20px',
                                    borderRadius: '16px',
                                    border: '2.5px solid #f1f5f9',
                                    background: '#f8fafc',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    width: '100%'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#21808d';
                                    e.currentTarget.style.background = '#f0f9fa';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(33, 128, 141, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#f1f5f9';
                                    e.currentTarget.style.background = '#f8fafc';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: '#fff',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    📍
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px' }}>{plant.plantName}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>ID: {plant.plantId}</div>
                                </div>
                                <div style={{ color: '#21808d', fontSize: '20px' }}>→</div>
                            </button>
                        ))
                    ) : (
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
                                {error || 'No plants linked to this vendor profile.'}
                            </div>
                            <button 
                                onClick={() => {
                                    localStorage.clear();
                                    // Notify host application to logout
                                    window.top.postMessage('logout', '*');
                                    // Fallback for standalone mode
                                    window.location.reload();
                                }}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Logout & Retry Login
                            </button>
                        </div>
                    )}
                </div>

                <style>{`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>,
        document.body
    );
};

export default PlantSelectionModal;
