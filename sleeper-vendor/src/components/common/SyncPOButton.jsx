import React, { useState } from 'react';
import SyncPOModal from './SyncPOModal';

/**
 * SyncPOButton Component
 * 
 * A reusable trigger button that opens the SyncPOModal.
 */
const SyncPOButton = ({ onSuccess, onError }) => {
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
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        outline: 'none',
        whiteSpace: 'nowrap',
        height: '44px'
    };

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)} 
                style={buttonStyle}
                title="Sync new PO from IMMS server"
            >
                <span style={{ fontSize: '18px' }}>🔄</span>
                <span>Sync PO from IMMS</span>
            </button>

            <SyncPOModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={handleSyncSuccess}
            />

            <style>
                {`
                    button:hover {
                        transform: translateY(-2px);
                        filter: brightness(1.1);
                        box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
                    }
                    button:active {
                        transform: translateY(0);
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .fade-in {
                        animation: fadeIn 0.3s ease-out forwards;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </>
    );
};

export default SyncPOButton;
