import React, { useState } from 'react';
import PlantProfileSection from './sections/PlantProfileSection';
import BenchMouldMasterSection from './sections/BenchMouldMasterSection';
import RawMaterialSourceSection from './sections/RawMaterialSourceSection';
import MixDesignSection from './sections/MixDesignSection';

const PlantDeclarationDashboard = () => {
    const [selectedTab, setSelectedTab] = useState('plant-profile');

    const tabs = [
        { id: 'plant-profile', title: 'Plant Profile', subtitle: 'General information' },
        { id: 'bench-mould', title: 'Bench / Mould Master', subtitle: 'Asset declaration' },
        { id: 'raw-material', title: 'Raw Material Source', subtitle: 'Supplier details' },
        { id: 'mix-design', title: 'Mix Design', subtitle: 'Concrete specifications' }
    ];

    const renderContent = () => {
        switch (selectedTab) {
            case 'plant-profile':
                return <PlantProfileSection />;
            case 'bench-mould':
                return <BenchMouldMasterSection />;
            case 'raw-material':
                return <RawMaterialSourceSection />;
            case 'mix-design':
                return <MixDesignSection />;
            default:
                return (
                    <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⚙️</div>
                        <h3>{tabs.find(t => t.id === selectedTab)?.title}</h3>
                        <p>This module is currently under development.</p>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-container">
            <div className="ie-tab-row" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`ie-tab-card ${selectedTab === tab.id ? 'active' : ''}`}
                        onClick={() => setSelectedTab(tab.id)}
                        style={{
                            background: selectedTab === tab.id ? '#f0f9fa' : 'white',
                            border: `2px solid ${selectedTab === tab.id ? '#42818c' : '#e2e8f0'}`,
                            borderRadius: '32px',
                            padding: '24px 20px',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            textAlign: 'center',
                            boxShadow: selectedTab === tab.id ? '0 10px 15px -3px rgba(66, 129, 140, 0.05)' : 'none',
                            transform: selectedTab === tab.id ? 'translateY(-2px)' : 'none'
                        }}
                    >
                        <span style={{
                            fontWeight: '800',
                            fontSize: 'var(--fs-md)',
                            color: '#42818c',
                            letterSpacing: '-0.01em'
                        }}>
                            {tab.title}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{tab.subtitle}</span>
                    </div>
                ))}
            </div>

            <div className="ie-content-area">
                {renderContent()}
            </div>
        </div>
    );
};

export default PlantDeclarationDashboard;
