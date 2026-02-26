import React, { useState, useEffect } from 'react';

const STATUSES = {
    PENDING: 'Verification Pending',
    LOCKED: 'Verified & Locked',
    UNLOCKED: 'Unlocked for Modification'
};

const BenchMouldMasterSection = ({ profiles = [] }) => {
    // Generate dynamic tabs based on profiles — one tab per unique type
    const seenTypes = new Set();
    const dynamicTabs = [];

    profiles.forEach(profile => {
        if (profile.type === 'Stress Bench' && !seenTypes.has('Stress Bench')) {
            seenTypes.add('Stress Bench');
            dynamicTabs.push({
                id: 'shed-1',
                label: 'Stress Bench',
                type: 'conventional',
                defaultMoulds: 8
            });
        } else if (profile.type === 'Longline' && !seenTypes.has('Longline')) {
            seenTypes.add('Longline');
            dynamicTabs.push({
                id: 'line-1',
                label: 'Longline',
                type: 'longline',
                defaultMoulds: 8
            });
        }
    });

    const [activeTabId, setActiveTabId] = useState('');
    const [tabEntries, setTabEntries] = useState({
        'shed-1': [
            {
                id: 101,
                entryMode: 'range',
                fromNo: '1',
                toNo: '4',
                numItems: 4,
                numMouldsPerItem: 8,
                totalMoulds: 32,
                sleeperCategory: 'Wider Base',
                status: STATUSES.PENDING
            },
            {
                id: 102,
                entryMode: 'range',
                fromNo: '5',
                toNo: '8',
                numItems: 4,
                numMouldsPerItem: 8,
                totalMoulds: 32,
                sleeperCategory: 'Wider Base',
                status: STATUSES.LOCKED
            },
            {
                id: 103,
                entryMode: 'single',
                singleNo: '9',
                numItems: 1,
                numMouldsPerItem: 8,
                totalMoulds: 8,
                sleeperCategory: 'PnC',
                status: STATUSES.UNLOCKED
            }
        ]
    });

    // Form State
    const [formState, setFormState] = useState({
        entryMode: 'range', // 'range' or 'single'
        fromNo: '',
        toNo: '',
        singleNo: '',
        numItems: 0,
        numMouldsPerItem: '',
        sleeperCategory: 'Wider Base',
        rft: '',
        sleeperNames: [],
        isEditing: false,
        editingId: null,
        status: STATUSES.PENDING
    });

    useEffect(() => {
        if (!activeTabId && dynamicTabs.length > 0) {
            setActiveTabId(dynamicTabs[0].id);
        } else if (activeTabId && !dynamicTabs.find(t => t.id === activeTabId)) {
            setActiveTabId(dynamicTabs[0]?.id || '');
        }
    }, [dynamicTabs, activeTabId]);

    const activeTab = dynamicTabs.find(t => t.id === activeTabId);
    const isLongLine = activeTab?.type === 'longline';

    // Update auto-fill fields when form state changes
    useEffect(() => {
        let count = 0;
        if (formState.entryMode === 'range') {
            const f = parseInt(formState.fromNo);
            const t = parseInt(formState.toNo);
            if (!isNaN(f) && !isNaN(t) && t >= f) {
                count = t - f + 1;
            }
        } else {
            if (formState.singleNo) count = 1;
        }

        setFormState(prev => ({
            ...prev,
            numItems: count
        }));
    }, [formState.entryMode, formState.fromNo, formState.toNo, formState.singleNo]);

    // Handle initial mould count when tab changes (use activeTabId not activeTab object,
    // because dynamicTabs is rebuilt every render producing a new activeTab reference
    // which would otherwise fire this effect on every render and reset user selections)
    useEffect(() => {
        if (activeTab && !formState.isEditing) {
            setFormState(prev => ({
                ...prev,
                numMouldsPerItem: activeTab.defaultMoulds
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTabId, formState.isEditing]);

    // Enforce same sleeper category for Long Line if entries exist
    useEffect(() => {
        if (isLongLine && tabEntries[activeTabId]?.length > 0 && !formState.isEditing) {
            const existingCategory = tabEntries[activeTabId][0].sleeperCategory;
            setFormState(prev => ({ ...prev, sleeperCategory: existingCategory }));
        }
    }, [activeTabId, isLongLine, tabEntries, formState.isEditing]);

    const handleSave = () => {
        if (formState.numItems <= 0) {
            alert("Please enter valid Bench/Gang numbers.");
            return;
        }

        const newEntry = {
            id: formState.isEditing ? formState.editingId : Date.now(),
            entryMode: formState.entryMode,
            fromNo: formState.fromNo,
            toNo: formState.toNo,
            singleNo: formState.singleNo,
            numItems: formState.numItems,
            numMouldsPerItem: formState.numMouldsPerItem,
            totalMoulds: formState.numItems * formState.numMouldsPerItem,
            sleeperCategory: formState.sleeperCategory,
            rft: formState.sleeperCategory === 'PnC' ? formState.rft : '',
            sleeperNames: formState.sleeperCategory === 'PnC' ? formState.sleeperNames : [],
            status: formState.isEditing ? formState.status : STATUSES.PENDING
        };

        setTabEntries(prev => {
            const current = prev[activeTabId] || [];
            if (formState.isEditing) {
                return {
                    ...prev,
                    [activeTabId]: current.map(e => e.id === formState.editingId ? newEntry : e)
                };
            } else {
                return {
                    ...prev,
                    [activeTabId]: [...current, newEntry]
                };
            }
        });

        // Reset form
        setFormState({
            entryMode: 'range',
            fromNo: '',
            toNo: '',
            singleNo: '',
            numItems: 0,
            numMouldsPerItem: activeTab?.defaultMoulds || '',
            sleeperCategory: isLongLine && tabEntries[activeTabId]?.length > 0
                ? tabEntries[activeTabId][0].sleeperCategory
                : 'Wider Base',
            rft: '',
            sleeperNames: [],
            isEditing: false,
            editingId: null,
            status: STATUSES.PENDING
        });
    };

    const handleEdit = (entry) => {
        if (entry.status === STATUSES.LOCKED) {
            alert("Verified & Locked entries cannot be modified.");
            return;
        }
        setFormState({
            entryMode: entry.entryMode,
            fromNo: entry.fromNo,
            toNo: entry.toNo,
            singleNo: entry.singleNo,
            numItems: entry.numItems,
            numMouldsPerItem: entry.numMouldsPerItem,
            sleeperCategory: entry.sleeperCategory,
            rft: entry.rft || '',
            sleeperNames: entry.sleeperNames || [],
            isEditing: true,
            editingId: entry.id,
            status: entry.status
        });
    };

    const handleDelete = (id, status) => {
        if (status === STATUSES.LOCKED) {
            alert("Verified & Locked entries cannot be deleted.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this entry?")) {
            setTabEntries(prev => ({
                ...prev,
                [activeTabId]: prev[activeTabId].filter(e => e.id !== id)
            }));
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case STATUSES.LOCKED: return { color: '#059669', background: '#ecfdf5', border: '1px solid #10b981' };
            case STATUSES.UNLOCKED: return { color: '#b45309', background: '#fffbeb', border: '1px solid #f59e0b' };
            default: return { color: '#2563eb', background: '#eff6ff', border: '1px solid #3b82f6' };
        }
    };

    // Calculate Summary
    const currentEntries = tabEntries[activeTabId] || [];
    const totalItems = currentEntries.reduce((acc, curr) => acc + (parseInt(curr.numItems) || 0), 0);
    const totalMoulds = currentEntries.reduce((acc, curr) => acc + (parseInt(curr.totalMoulds) || 0), 0);
    const uniqueSleeperTypes = [...new Set(currentEntries.map(e => e.sleeperCategory))];
    const mouldsBySleeper = currentEntries.reduce((acc, curr) => {
        acc[curr.sleeperCategory] = (acc[curr.sleeperCategory] || 0) + (parseInt(curr.totalMoulds) || 0);
        return acc;
    }, {});

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#1e293b', marginBottom: '16px' }}>Bench / Mould Master Declaration</h3>

                {/* Dynamic Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    padding: '4px 0',
                    marginBottom: '16px'
                }}>
                    {dynamicTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTabId(tab.id);
                                // Reset form when switching tabs
                                setFormState({
                                    entryMode: 'range',
                                    fromNo: '',
                                    toNo: '',
                                    singleNo: '',
                                    numItems: 0,
                                    numMouldsPerItem: tab.defaultMoulds,
                                    sleeperCategory: 'Wider Base',
                                    rft: '',
                                    sleeperNames: [],
                                    isEditing: false,
                                    editingId: null,
                                    status: STATUSES.PENDING
                                });
                            }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: activeTabId === tab.id ? '2px solid #42818c' : '1px solid #e2e8f0',
                                fontSize: '13px',
                                fontWeight: '600',
                                background: activeTabId === tab.id ? '#f0f9fa' : '#fff',
                                color: activeTabId === tab.id ? '#42818c' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                                boxShadow: activeTabId === tab.id ? '0 2px 4px rgba(66, 129, 140, 0.1)' : 'none'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {dynamicTabs.length === 0 && (
                    <div style={{ padding: '20px', background: '#fff9eb', border: '1px solid #ffeeba', borderRadius: '8px', color: '#856404', fontSize: '14px' }}>
                        ⚠️ Please add a <strong>Stress Bench</strong> or <strong>Longline</strong> profile in the <strong>Plant Profile</strong> section first to configure Bench/Mould Master.
                    </div>
                )}
            </div>

            {activeTab && (
                <>
                    {/* Summary Section */}
                    <div style={{
                        background: '#fff',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '24px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '16px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Total {isLongLine ? 'Lines' : 'Benches'}
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#42818c' }}>{totalItems}</div>
                        </div>
                        <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Sleeper Types
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#42818c' }}>{uniqueSleeperTypes.length}</div>
                        </div>
                        <div style={{ textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Total Moulds
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#42818c' }}>{totalMoulds}</div>
                        </div>
                        <div style={{ textAlign: 'left', paddingLeft: '8px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Moulds / Type
                            </div>
                            <div style={{ maxHeight: '40px', overflowY: 'auto' }}>
                                {uniqueSleeperTypes.length === 0 ? (
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>No data</span>
                                ) : (
                                    uniqueSleeperTypes.map(type => (
                                        <div key={type} style={{ fontSize: '11px', color: '#1e293b', fontWeight: '600' }}>
                                            {type}: {mouldsBySleeper[type]}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ color: '#42818c', margin: 0, fontSize: '16px' }}>
                                {isLongLine ? 'Longline Entry Form' : 'Stress Bench Entry Form'}
                            </h4>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                    <input
                                        type="radio"
                                        checked={formState.entryMode === 'range'}
                                        onChange={() => setFormState(prev => ({ ...prev, entryMode: 'range' }))}
                                    /> Range
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                    <input
                                        type="radio"
                                        checked={formState.entryMode === 'single'}
                                        onChange={() => setFormState(prev => ({ ...prev, entryMode: 'single' }))}
                                    /> Single
                                </label>
                            </div>
                        </div>

                        {/* Row 1: Bench/Line number inputs + No. of Benches/Lines + Sleeper Category */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                            {formState.entryMode === 'range' ? (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                            {isLongLine ? 'Line No. From' : 'Bench No. From'}
                                        </label>
                                        <input
                                            type="number"
                                            value={formState.fromNo}
                                            onChange={(e) => setFormState(prev => ({ ...prev, fromNo: e.target.value }))}
                                            placeholder="Enter Start"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                            {isLongLine ? 'Line No. To' : 'Bench No. To'}
                                        </label>
                                        <input
                                            type="number"
                                            value={formState.toNo}
                                            onChange={(e) => setFormState(prev => ({ ...prev, toNo: e.target.value }))}
                                            placeholder="Enter End"
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                            {isLongLine ? 'Line No.' : 'Bench No.'}
                                        </label>
                                        <input
                                            type="number"
                                            value={formState.singleNo}
                                            onChange={(e) => setFormState(prev => ({ ...prev, singleNo: e.target.value }))}
                                            placeholder="Enter No."
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    {/* placeholder to keep grid alignment */}
                                    <div />
                                </>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                    No. of {isLongLine ? 'Lines' : 'Benches'}
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={formState.numItems}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Sleeper Category</label>
                                <select
                                    value={formState.sleeperCategory}
                                    onChange={(e) => setFormState(prev => ({ ...prev, sleeperCategory: e.target.value }))}
                                    disabled={isLongLine && currentEntries.length > 0 && !formState.isEditing}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: (isLongLine && currentEntries.length > 0 && !formState.isEditing) ? '#f8fafc' : '#fff',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="Wider Base">Wider Base</option>
                                    <option value="PnC">PnC</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Basic Properties */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: formState.sleeperCategory === 'PnC' ? '24px' : '0' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                    No. of Moulds {isLongLine ? '(per Line)' : '(per Bench)'}
                                </label>
                                {formState.sleeperCategory === 'Wider Base' ? (
                                    <select
                                        value={formState.numMouldsPerItem}
                                        onChange={(e) => setFormState(prev => ({ ...prev, numMouldsPerItem: e.target.value }))}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                    >
                                        <option value="">Select No. of Moulds</option>
                                        <option value="4">4</option>
                                        <option value="8">8</option>
                                    </select>
                                ) : (
                                    <input
                                        type="number"
                                        value={formState.numMouldsPerItem}
                                        onChange={(e) => setFormState(prev => ({ ...prev, numMouldsPerItem: e.target.value }))}
                                        placeholder="Enter integer"
                                        readOnly={!isLongLine && !formState.isEditing && formState.sleeperCategory !== 'PnC'}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: (!isLongLine && !formState.isEditing && formState.sleeperCategory !== 'PnC') ? '#f8fafc' : '#fff',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                )}
                            </div>

                            {formState.sleeperCategory === 'PnC' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>RFT (m)</label>
                                    <input
                                        type="number"
                                        value={formState.rft}
                                        onChange={(e) => setFormState(prev => ({ ...prev, rft: e.target.value }))}
                                        placeholder="Enter RFT"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}

                            {/* Spacer columns */}
                            <div />

                            {formState.sleeperCategory !== 'PnC' && (
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button
                                        onClick={handleSave}
                                        style={{
                                            width: '100%',
                                            background: '#42818c',
                                            color: 'white',
                                            border: 'none',
                                            padding: '11px 24px',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'opacity 0.2s'
                                        }}
                                    >
                                        {formState.isEditing ? 'Update Entry' : 'Add to List'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Row 3: PnC Sleeper Names Grid */}
                        {formState.sleeperCategory === 'PnC' && (
                            <div style={{
                                background: '#f8fafc',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '24px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h5 style={{ margin: 0, color: '#475569', fontSize: '13px', fontWeight: '700' }}>Sleeper Names Configuration</h5>
                                    <span style={{ fontSize: '11px', color: '#64748b', background: '#fff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                        Total Moulds: {formState.numMouldsPerItem || 0}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                    gap: '12px',
                                    maxHeight: '260px',
                                    overflowY: 'auto',
                                    padding: '4px'
                                }}>
                                    {Array.from({ length: parseInt(formState.numMouldsPerItem) || 0 }).map((_, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: '#fff',
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            transition: 'border-color 0.2s'
                                        }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                color: '#42818c',
                                                minWidth: '20px'
                                            }}>{idx + 1}.</span>
                                            <input
                                                type="text"
                                                value={formState.sleeperNames[idx] || ''}
                                                onChange={(e) => {
                                                    const newNames = [...formState.sleeperNames];
                                                    newNames[idx] = e.target.value;
                                                    setFormState(prev => ({ ...prev, sleeperNames: newNames }));
                                                }}
                                                placeholder="Sleeper Name"
                                                style={{
                                                    flex: 1,
                                                    padding: '6px 0',
                                                    border: 'none',
                                                    fontSize: '12px',
                                                    outline: 'none',
                                                    color: '#1e293b',
                                                    background: 'transparent'
                                                }}
                                            />
                                        </div>
                                    ))}
                                    {(!formState.numMouldsPerItem || parseInt(formState.numMouldsPerItem) <= 0) && (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                                            Enter Number of Moulds to configure sleeper names.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Row 4: PnC Action Button */}
                        {formState.sleeperCategory === 'PnC' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleSave}
                                    style={{
                                        background: '#42818c',
                                        color: 'white',
                                        border: 'none',
                                        padding: '11px 32px',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 2px 4px rgba(66, 129, 140, 0.2)'
                                    }}
                                >
                                    {formState.isEditing ? 'Update Entry' : 'Add to List'}
                                </button>
                            </div>
                        )}

                    </div>

                    {/* Entry List */}
                    {currentEntries.length > 0 && (
                        <div style={{ marginTop: '24px', background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ color: '#42818c', marginTop: 0, marginBottom: '20px', fontSize: '15px', fontWeight: '700' }}>Entered Data List</h4>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>Range/Single</th>
                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>Nos.</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>Count</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>Moulds/Item</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>Total Moulds</th>
                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>Category</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>Status</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentEntries.map((entry) => (
                                            <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px', color: '#1e293b', textTransform: 'capitalize' }}>{entry.entryMode}</td>
                                                <td style={{ padding: '12px', color: '#1e293b', fontWeight: '600' }}>
                                                    {entry.entryMode === 'range' ? `${entry.fromNo} - ${entry.toNo}` : entry.singleNo}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', color: '#1e293b' }}>{entry.numItems}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', color: '#1e293b' }}>{entry.numMouldsPerItem}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', color: '#1e293b', fontWeight: 'bold' }}>{entry.totalMoulds}</td>
                                                <td style={{ padding: '12px', color: '#1e293b' }}>
                                                    {entry.sleeperCategory}
                                                    {entry.sleeperCategory === 'PnC' && (
                                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                                            RFT: {entry.rft}m | {entry.sleeperNames?.filter(Boolean).length} Names
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        ...getStatusStyle(entry.status)
                                                    }}>
                                                        {entry.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleEdit(entry)}
                                                            disabled={entry.status === STATUSES.LOCKED}
                                                            style={{
                                                                padding: '6px 10px',
                                                                background: entry.status === STATUSES.LOCKED ? '#f8fafc' : '#f0f9fa',
                                                                color: entry.status === STATUSES.LOCKED ? '#cbd5e1' : '#42818c',
                                                                border: `1px solid ${entry.status === STATUSES.LOCKED ? '#e2e8f0' : '#42818c'}`,
                                                                borderRadius: '6px',
                                                                cursor: entry.status === STATUSES.LOCKED ? 'not-allowed' : 'pointer',
                                                                fontSize: '11px'
                                                            }}
                                                        >
                                                            Modify
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(entry.id, entry.status)}
                                                            disabled={entry.status === STATUSES.LOCKED}
                                                            style={{
                                                                padding: '6px 10px',
                                                                background: entry.status === STATUSES.LOCKED ? '#f8fafc' : '#fef2f2',
                                                                color: entry.status === STATUSES.LOCKED ? '#cbd5e1' : '#ef4444',
                                                                border: `1px solid ${entry.status === STATUSES.LOCKED ? '#fee2e2' : '#ef4444'}`,
                                                                borderRadius: '6px',
                                                                cursor: entry.status === STATUSES.LOCKED ? 'not-allowed' : 'pointer',
                                                                fontSize: '11px'
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BenchMouldMasterSection;
