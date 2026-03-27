import React, { useState } from 'react';
import PlantSetup from './PlantSetup';
import RawMaterialSource from './RawMaterialSource';
import ProductRecipe from './ProductRecipe';
import ApprovedAshSG from './ApprovedAshSG';
import ApprovedQAP from './ApprovedQAP';

const PlantDeclarationDashboard = () => {
    const [selectedTab, setSelectedTab] = useState(() => {
        return localStorage.getItem('railpad_plant_selectedTab') || 'plant-setup';
    });

    React.useEffect(() => {
        localStorage.setItem('railpad_plant_selectedTab', selectedTab);
    }, [selectedTab]);

    // Lifted states for persistence across tabs
    const [plantEntries, setPlantEntries] = useState([
        {
            id: 1,
            manufacturer: "ABC Industries (VEND001)",
            unitName: "Unit A - Mumbai",
            address: "Plot 123, MIDC, Mumbai, MH",
            numLines: 2,
            capacity: "50,000 Pcs/Month",
            status: "Verified & Locked"
        },
        {
            id: 2,
            manufacturer: "ABC Industries (VEND001)",
            unitName: "Unit B - Pune",
            address: "Sector 45, Bhosari, Pune, MH",
            numLines: 3,
            capacity: "75,000 Pcs/Month",
            status: "Unlocked for Modification"
        }
    ]);

    const [materialEntries, setMaterialEntries] = useState([
        {
            id: 1,
            materialName: "Virgin Material (RSS1)",
            supplier: "Global Rubber Exports",
            docRef: "INV/2024/0045",
            status: "Verified & Locked"
        },
        {
            id: 2,
            materialName: "Carbon Black (N-765)",
            supplier: "B-Chem Solutions",
            docRef: "BC/TX/9932",
            status: "Pending Verification"
        },
        {
            id: 3,
            materialName: "Silica (Fine Grade)",
            supplier: "Indo Silica Ltd",
            docRef: "ISL/QT/552",
            status: "Unlocked for Modification"
        }
    ]);

    const [recipeEntries, setRecipeEntries] = useState([
        {
            id: 1,
            recipeId: "Batch-A-6mm-NCRGRSP",
            padType: "6.00mm NCRGRSP",
            composition: "Virgin: 52%, Carbon: 20%...",
            status: "Verified & Locked"
        }
    ]);

    const [ashEntries, setAshEntries] = useState([
        {
            id: 1,
            padType: "6.00mm GRSP",
            ash: "24.5%",
            sg: "1.21",
            refNo: "RDSO/QA/88/12",
            date: "2024-01-15",
            status: "Verified & Locked"
        }
    ]);

    const [qapEntries, setQapEntries] = useState([
        {
            id: 1,
            qapNo: "QAP/RDSO/2024/001",
            qapApprovalDate: "2024-01-15",
            qapEffectiveDate: "2024-02-01",
            qapApprovingAuthority: "RDSO",
            qapValidityDate: "2025-01-14",
            selectedPadTypes: ["6.00mm GRSP", "10.00mm GRSP"],
            productParams: {
                "6.00mm GRSP": {
                    minMixTime: "10", maxMixTime: "15",
                    minMixTemp: "80", maxMixTemp: "90",
                    mixWeight: "25",
                    minCureTime: "20", maxCureTime: "25",
                    minCureTemp: "150", maxCureTemp: "160",
                    minCurePress: "120", maxCurePress: "130"
                },
                "10.00mm GRSP": {
                    minMixTime: "12", maxMixTime: "18",
                    minMixTemp: "85", maxMixTemp: "95",
                    mixWeight: "30",
                    minCureTime: "22", maxCureTime: "28",
                    minCureTemp: "155", maxCureTemp: "165",
                    minCurePress: "125", maxCurePress: "135"
                }
            },
            status: "Verified & Locked"
        }
    ]);

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
                return <PlantSetup entries={plantEntries} setEntries={setPlantEntries} />;
            case 'raw-material':
                return <RawMaterialSource entries={materialEntries} setEntries={setMaterialEntries} />;
            case 'product-recipe':
                return <ProductRecipe entries={recipeEntries} setEntries={setRecipeEntries} />;
            case 'approved-ash':
                return <ApprovedAshSG entries={ashEntries} setEntries={setAshEntries} />;
            case 'approved-qap':
                return <ApprovedQAP entries={qapEntries} setEntries={setQapEntries} />;
            default:
                return null;
        }
    };

    return (
        <div className="fade-in">
            <div className="ie-tab-row" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '10px',
                marginBottom: '32px'
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
