import React, { useState, useEffect } from 'react';
import { plantSetupService } from '../../../services/plantSetupService';
import { rawMaterialService } from '../../../services/rawMaterialService';
import { productRecipeService } from '../../../services/productRecipeService';
import { approvedAshSGService } from '../../../services/approvedAshSGService';
import { approvedQAPService } from '../../../services/approvedQAPService';
import PlantSetup from './PlantSetup';
import RawMaterialSource from './RawMaterialSource';
import ProductRecipe from './ProductRecipe';
import ApprovedAshSG from './ApprovedAshSG';
import ApprovedQAP from './ApprovedQAP';

const PlantDeclarationDashboard = ({ plantId }) => {
    const [selectedTab, setSelectedTab] = useState(() => {
        return localStorage.getItem('railpad_plant_selectedTab') || 'plant-setup';
    });

    useEffect(() => {
        localStorage.setItem('railpad_plant_selectedTab', selectedTab);
    }, [selectedTab]);

    // Lifted states for persistence across tabs
    const [plantEntries, setPlantEntries] = useState([]);
    const [materialEntries, setMaterialEntries] = useState([]);
    const [recipeEntries, setRecipeEntries] = useState([]);
    const [ashEntries, setAshEntries] = useState([]);
    const [qapEntries, setQapEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAllData = async () => {
        try {
            setIsLoading(true);
            const actualPlantId = plantId || localStorage.getItem('railpad_selectedPlantId');
            if (!actualPlantId || actualPlantId === "1") return;
            
            const [plantRes, rmRes, recipeRes, ashRes, qapRes] = await Promise.all([
                plantSetupService.getByPlantId(actualPlantId),
                rawMaterialService.getByPlantId(actualPlantId),
                productRecipeService.getByPlantId(actualPlantId),
                approvedAshSGService.getByPlantId(actualPlantId),
                approvedQAPService.getByPlantId(actualPlantId)
            ]);
            
            // Note: The backend returns List<ResponseDto>, so we use them directly
            setPlantEntries(plantRes || []);
            setMaterialEntries(rmRes || []);
            setRecipeEntries(recipeRes || []);
            setAshEntries(ashRes || []);
            setQapEntries(qapRes || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [plantId]);

    const tabs = [
        { id: 'plant-setup', title: 'Plant Set Up', subtitle: 'General information' },
        { id: 'raw-material', title: 'Raw Material Source', subtitle: 'Supplier details', underDevelopment: true },
        { id: 'product-recipe', title: 'Product Recipe', subtitle: 'Chemical composition', underDevelopment: true },
        { id: 'approved-ash', title: 'Approved Ash & S.G.', subtitle: 'Baseline parameters', underDevelopment: true },
        { id: 'approved-qap', title: 'Approved QAP Values', subtitle: 'Mixing & moulding limits', underDevelopment: true }
    ];

    const renderContent = () => {
        switch (selectedTab) {
            case 'plant-setup':
                return <PlantSetup entries={plantEntries} setEntries={setPlantEntries} onRefresh={fetchAllData} isLoading={isLoading} />;
            case 'raw-material':
                return <RawMaterialSource entries={materialEntries} setEntries={setMaterialEntries} onRefresh={fetchAllData} isLoading={isLoading} />;
            case 'product-recipe':
                return <ProductRecipe entries={recipeEntries} setEntries={setRecipeEntries} onRefresh={fetchAllData} isLoading={isLoading} />;
            case 'approved-ash':
                return <ApprovedAshSG entries={ashEntries} setEntries={setAshEntries} onRefresh={fetchAllData} isLoading={isLoading} />;
            case 'approved-qap':
                return <ApprovedQAP entries={qapEntries} setEntries={setQapEntries} onRefresh={fetchAllData} isLoading={isLoading} />;
            default:
                return null;
        }
    };

    return (
        <div className="fade-in">
            <div style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                marginBottom: '24px'
            }}>
                <div className="ie-tab-row" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '16px'
                }}>
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`ie-tab-card ${selectedTab === tab.id ? 'active' : ''}`}
                        onClick={() => setSelectedTab(tab.id)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                        }}
                    >
                        <h3>{tab.title}</h3>
                        <p>{tab.subtitle}</p>
                        {tab.underDevelopment && (
                            <span style={{
                                background: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                borderRadius: '4px',
                                fontSize: '8.5px',
                                fontWeight: '800',
                                padding: '2px 6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                lineHeight: '1',
                                marginTop: '2px'
                            }}>
                                <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: '#b45309' }}></span>
                                Under Construction
                            </span>
                        )}
                    </div>
                ))}
                </div>
            </div>

            <div className="ie-content-area fade-in">
                {renderContent()}
            </div>
        </div>
    );
};

export default PlantDeclarationDashboard;
