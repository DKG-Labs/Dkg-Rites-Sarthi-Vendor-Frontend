import React, { useState } from 'react';
import VirginMaterial from './VirginMaterial';
import CarbonBlack from './CarbonBlack';
import Silica from './Silica';
import NylonCord from './NylonCord';
import ChemicalIngredients from './ChemicalIngredients';
import { APPROVED_SUPPLIERS } from './inventoryUtils';



const MATERIAL_TABS = [
    { id: 'virgin', title: 'Virgin Material – Rubber', subtitle: 'Natural & synthetic rubber' },
    { id: 'carbon', title: 'Carbon Black', subtitle: 'Reinforcing filler grades' },
    { id: 'silica', title: 'Silica', subtitle: 'Particle-size validated' },
    { id: 'nylon', title: 'Nylon Cord', subtitle: 'Denier-validated cord' },
    { id: 'chemical', title: 'Other Chemical Ingredients', subtitle: 'Activators, accelerators & more' },
];

const InventoryManagementDashboard = () => {
    const [selectedTab, setSelectedTab] = useState(() => {
        return localStorage.getItem('railpad_inventory_selectedTab') || 'virgin';
    });

    React.useEffect(() => {
        localStorage.setItem('railpad_inventory_selectedTab', selectedTab);
    }, [selectedTab]);

    // ── Per-material inventory state ─────────────────────────────────────────
    const [virginEntries, setVirginEntries] = useState([]);
    const [carbonEntries, setCarbonEntries] = useState([]);
    const [silicaEntries, setSilicaEntries] = useState([]);
    const [nylonEntries, setNylonEntries] = useState([]);
    const [chemicalEntries, setChemicalEntries] = useState([]);

    const entriesMap = {
        virgin: virginEntries,
        carbon: carbonEntries,
        silica: silicaEntries,
        nylon: nylonEntries,
        chemical: chemicalEntries,
    };

    const settersMap = {
        virgin: setVirginEntries,
        carbon: setCarbonEntries,
        silica: setSilicaEntries,
        nylon: setNylonEntries,
        chemical: setChemicalEntries,
    };

    const getKpis = (entries) => {
        const procured = entries
            .filter(e => e.status !== 'Deleted')
            .reduce((s, e) => s + (parseFloat(e.quantity) || 0), 0);
        const used = entries
            .filter(e => e.status !== 'Deleted')
            .reduce((s, e) => s + (parseFloat(e.used) || 0), 0);
        return { procured, used, balance: procured - used };
    };

    const kpis = getKpis(entriesMap[selectedTab]);

    const renderContent = () => {
        const commonProps = {
            entries: entriesMap[selectedTab],
            setEntries: settersMap[selectedTab],
            approvedSuppliers: APPROVED_SUPPLIERS,
            allInvoices: [
                ...virginEntries, ...carbonEntries, ...silicaEntries,
                ...nylonEntries, ...chemicalEntries,
            ],
        };
        switch (selectedTab) {
            case 'virgin': return <VirginMaterial      {...commonProps} />;
            case 'carbon': return <CarbonBlack         {...commonProps} />;
            case 'silica': return <Silica              {...commonProps} />;
            case 'nylon': return <NylonCord           {...commonProps} />;
            case 'chemical': return <ChemicalIngredients {...commonProps} />;
            default: return null;
        }
    };

    return (
        <div className="fade-in">
            {/* ── Tab Cards — identical pattern to Plant Declaration ── */}
            <div className="ie-tab-row" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '10px',
                marginBottom: '24px'
            }}>
                {MATERIAL_TABS.map(tab => (
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

            {/* ── KPI Strip for selected material ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '28px',
            }}>
                {[
                    { label: 'Material Procured', value: kpis.procured, color: '#059669', bg: '#f0fdf4', border: '#d1fae5' },
                    { label: 'Material Used', value: kpis.used, color: '#d97706', bg: '#fffbeb', border: '#fef3c7' },
                    { label: 'Material Balance', value: kpis.balance, color: kpis.balance < 0 ? '#dc2626' : '#2563eb', bg: kpis.balance < 0 ? '#fef2f2' : '#f0f7ff', border: kpis.balance < 0 ? '#fee2e2' : '#dbeafe' },
                ].map(kpi => (
                    <div key={kpi.label} style={{
                        background: kpi.bg,
                        border: `1px solid ${kpi.border}`,
                        borderRadius: '12px',
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {kpi.label}
                        </span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: kpi.color, fontFamily: 'var(--font-secondary)', lineHeight: 1 }}>
                            {kpi.value.toFixed(2)}
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginLeft: '6px', textTransform: 'none' }}>Kgs</span>
                        </span>
                    </div>
                ))}
            </div>

            {/* ── Content Area — same wrapper as Plant Declaration ── */}
            <div className="ie-content-area fade-in">
                {renderContent()}
            </div>

        </div>
    );
};

export default InventoryManagementDashboard;
