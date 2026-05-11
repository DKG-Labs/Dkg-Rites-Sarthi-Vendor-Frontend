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

const PlantDeclarationDashboard = () => {
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
            const plantId = localStorage.getItem('railpad_selectedPlantId');
            if (!plantId) return;
            
            const [plantRes, rmRes, recipeRes, ashRes, qapRes] = await Promise.all([
                plantSetupService.getByPlantId(plantId),
                rawMaterialService.getByPlantId(plantId),
                productRecipeService.getByPlantId(plantId),
                approvedAshSGService.getByPlantId(plantId),
                approvedQAPService.getByPlantId(plantId)
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
    }, []);

    const tabs = [
        { id: 'plant-setup', title: 'Plant Set Up', subtitle: 'General information' },
        { id: 'raw-material', title: 'Raw Material Source', subtitle: 'Supplier details' },
        { id: 'product-recipe', title: 'Product Recipe', subtitle: 'Chemical composition' },
        { id: 'approved-ash', title: 'Approved Ash & S.G.', subtitle: 'Baseline parameters' },
        { id: 'approved-qap', title: 'Approved QAP Values', subtitle: 'Mixing & moulding limits' }
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
            <div className="ie-tab-row" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`ie-tab-card ${selectedTab === tab.id ? 'active' : ''}`}
                        onClick={() => setSelectedTab(tab.id)}
                    >
                        <h3>{tab.title}</h3>
                        <p>{tab.subtitle}</p>
                    </div>
                ))}
            </div>

            <div className="ie-content-area fade-in">
                {renderContent()}
            </div>
        </div>
    );
};

export default PlantDeclarationDashboard;
