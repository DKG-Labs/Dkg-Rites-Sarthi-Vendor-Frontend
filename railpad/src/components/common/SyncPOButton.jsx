import React, { useState } from 'react';
import SyncPOModal from './SyncPOModal';

/**
 * SyncPOButton Component for Rail Pad
 * 
 * Reusable trigger button that opens the SyncPOModal.
 */
const SyncPOButton = ({ onSuccess, onError, vendorCode, plantId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSyncSuccess = (result) => {
        if (onSuccess) onSuccess(result);
    };

    const buttonStyle = {
        padding: '10px 20px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '700',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(33, 128, 141, 0.3)',
        background: 'linear-gradient(135deg, #21808d, #0d3b3f)',
        outline: 'none',
        whiteSpace: 'nowrap',
        height: '40px'
    };

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)} 
                style={buttonStyle}
                title="sync PO"
            >
                <span style={{ fontSize: '18px' }}>🔄</span>
                <span style={{ whiteSpace: 'nowrap' }}>SYNC PO</span>
            </button>

            <SyncPOModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={handleSyncSuccess}
                vendorCode={vendorCode}
                plantId={plantId}
            />

            <style>
                {`
                    .sync-btn:hover {
                        transform: translateY(-2px);
                        filter: brightness(1.1);
                        box-shadow: 0 6px 16px rgba(33, 128, 141, 0.4);
                    }
                    .sync-btn:active {
                        transform: translateY(0);
                    }
                `}
            </style>
        </>
    );
};

export default SyncPOButton;
