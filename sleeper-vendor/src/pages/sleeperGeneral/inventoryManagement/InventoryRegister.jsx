import React, { useState, useMemo } from 'react';

const InventoryRegister = ({ material, procuredEntries = [], usedEntries = [] }) => {
    // Sub-types based on material
    const getSubTypes = (id) => {
        switch (id) {
            case 'hts-wire': return ['9.5mm', '4mm', '5mm'];
            case 'cement': return ['OPC 53', 'PPC', 'PSC'];
            case 'aggregates': return ['CA1', 'CA2', 'Fine Aggregate'];
            case 'sgci-insert': return ['RT-381', 'RT-2501'];
            case 'dowel': return ['Type A', 'Type B'];
            case 'admixture': return ['Type 1', 'Type 2'];
            default: return ['Default'];
        }
    };

    const subTypes = getSubTypes(material.id);
    const [selectedSubType, setSelectedSubType] = useState('All');

    // Helper to get subtype of a procured entry
    const getProcuredSubType = (entry) => {
        let typeVal = entry.gradeSpec || entry.gradeType || entry.details?.type || entry.details?.grade || '';
        
        // Match with available subTypes to standardise
        typeVal = String(typeVal).trim();
        const matched = subTypes.find(st => typeVal.toLowerCase().includes(st.toLowerCase()) || st.toLowerCase().includes(typeVal.toLowerCase()));
        return matched || typeVal || subTypes[0];
    };

    // Process ledger calculations
    const ledgerRows = useMemo(() => {
        // 1. Filter verified entries
        const verifiedProcured = procuredEntries.filter(entry => 
            entry.status === 'Completed' || entry.status === 'Locked' || entry.status === 'Verified'
        );
        
        const verifiedUsed = usedEntries.filter(entry => 
            entry.status === 'Completed' || entry.status === 'Locked' || entry.status === 'Verified'
        );

        // 2. Map into unified transaction format: { date, subType, procuredQty, usedQty, key }
        const transactions = [];

        verifiedProcured.forEach(entry => {
            const dateVal = entry.dateOfReceipt || entry.date;
            const sub = getProcuredSubType(entry);
            const qty = Number(entry.totalQtyReceived || entry.totalQuantity || entry.qty || 0);
            
            transactions.push({
                date: dateVal,
                subType: sub,
                procuredQty: qty,
                usedQty: 0,
                type: 'procured',
                refId: entry.id
            });
        });

        verifiedUsed.forEach(entry => {
            const dateVal = entry.date;
            const sub = entry.subType || subTypes[0];
            const qty = Number(entry.qty || 0);

            transactions.push({
                date: dateVal,
                subType: sub,
                procuredQty: 0,
                usedQty: qty,
                type: 'used',
                refId: entry.id
            });
        });

        // 3. Group by subtype and sort chronologically to calculate running balance
        const groups = {};
        transactions.forEach(tx => {
            if (!groups[tx.subType]) {
                groups[tx.subType] = [];
            }
            groups[tx.subType].push(tx);
        });

        const processedTransactions = [];

        Object.keys(groups).forEach(sub => {
            // Sort ascending by date for correct balance calculations
            const list = groups[sub].sort((a, b) => new Date(a.date) - new Date(b.date));
            let balance = 0;
            
            list.forEach(tx => {
                balance = balance + tx.procuredQty - tx.usedQty;
                tx.balance = balance;
                processedTransactions.push(tx);
            });
        });

        // 4. Filter by subtype selection
        let filtered = processedTransactions;
        if (selectedSubType !== 'All') {
            filtered = processedTransactions.filter(tx => tx.subType === selectedSubType);
        }

        // 5. Return sorted descending by date for display (latest at the top)
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    }, [procuredEntries, usedEntries, selectedSubType, material.id, subTypes]);

    const selectStyle = {
        padding: '10px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#1e293b',
        background: 'white',
        outline: 'none',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    };

    return (
        <div className="inventory-register fade-in" style={{ padding: '4px' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                        RM Inventory Ledger
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                        Date-wise official register of verified procurement & consumption
                    </p>
                </div>
                
                {/* Sub-type filter dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Filter Sub-Type:</span>
                    <select 
                        value={selectedSubType} 
                        onChange={(e) => setSelectedSubType(e.target.value)} 
                        style={selectStyle}
                    >
                        <option value="All">All Sub-Types</option>
                        {subTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* Ledger Table */}
            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Raw Material & Its Type</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Quantity Procured</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Quantity Used</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Running Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ledgerRows.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📖</div>
                                    No verified transactions found in the ledger.
                                </td>
                            </tr>
                        ) : (
                            ledgerRows.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: row.type === 'procured' ? '#fcfdfd' : '#fdfcfc' }}>
                                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                                        {row.date}
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#1e293b' }}>
                                        <span style={{ fontWeight: '600' }}>{material.name}</span>
                                        <span style={{ 
                                            background: '#f1f5f9', 
                                            color: '#475569', 
                                            padding: '2px 8px', 
                                            borderRadius: '6px', 
                                            fontSize: '11px', 
                                            fontWeight: '700',
                                            marginLeft: '8px'
                                        }}>
                                            {row.subType}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#047857', fontWeight: '700', textAlign: 'right' }}>
                                        {row.procuredQty > 0 ? `+ ${row.procuredQty.toLocaleString()} ${material.unit}` : '-'}
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#b91c1c', fontWeight: '700', textAlign: 'right' }}>
                                        {row.usedQty > 0 ? `- ${row.usedQty.toLocaleString()} ${material.unit}` : '-'}
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1e293b', fontWeight: '800', textAlign: 'right' }}>
                                        {row.balance.toLocaleString()} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{material.unit}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryRegister;
