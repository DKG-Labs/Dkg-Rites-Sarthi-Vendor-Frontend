import React, { useState, useEffect } from 'react';
import './PlantSelectionModal.css';
import { apiService } from '../../services/api';

/**
 * PlantSelectionModal Component
 * Fetches plants for a vendor and allows selection.
 */
const PlantSelectionModal = ({ vendorCode, onSelect }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vendorData, setVendorData] = useState(null);

    useEffect(() => {
        const fetchPlants = async () => {
            if (!vendorCode) {
                setError('No vendor code provided');
                setLoading(false);
                return;
            }

            try {
                const data = await apiService.getVendorPlants(vendorCode);
                setVendorData(data);
            } catch (err) {
                console.error('Error fetching plants:', err);
                setError('Unable to fetch plant information. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchPlants();
    }, [vendorCode]);

    if (loading) {
        return (
            <div className="plant-modal-overlay">
                <div className="plant-modal-container loading">
                    <div className="spinner"></div>
                    <p>Fetching your plants...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="plant-modal-overlay">
                <div className="plant-modal-container">
                    <div className="plant-modal-header error">
                        <h3>Configuration Error</h3>
                    </div>
                    <div className="plant-modal-body">
                        <p>{error}</p>
                        <button className="retry-btn" onClick={() => window.location.reload()}>Retry Login</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="plant-modal-overlay">
            <div className="plant-modal-container">
                <div className="plant-modal-header">
                    <div className="header-icon">🏭</div>
                    <div className="header-text">
                        <h3>Select Production Plant</h3>
                        <p>{vendorData?.companyName || 'Vendor Workspace'}</p>
                    </div>
                </div>
                <div className="plant-modal-body">
                    <p className="selection-hint">Please select the plant you are currently working from:</p>
                    <div className="plants-list">
                        {vendorData?.plants?.map((plant) => (
                            <button 
                                key={plant.plantId} 
                                className="plant-option-card"
                                onClick={() => onSelect(plant)}
                            >
                                <div className="plant-info">
                                    <span className="plant-name">{plant.plantName}</span>
                                    <span className="plant-id">{plant.plantId}</span>
                                </div>
                                <div className="select-arrow">→</div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="plant-modal-footer">
                    <p>Selection will be remembered for your current session.</p>
                </div>
            </div>
        </div>
    );
};

export default PlantSelectionModal;
