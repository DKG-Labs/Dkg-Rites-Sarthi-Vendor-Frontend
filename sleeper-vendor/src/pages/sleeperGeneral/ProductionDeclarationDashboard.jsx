import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { apiService } from '../../services/api';
import PaginationBar, { usePagination } from '../../components/common/PaginationBar';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import GlobalSearchBar from '../../components/common/GlobalSearchBar';
import { useSWRCache, invalidate } from '../../hooks/useSWRCache';
import { PD_CONFIG } from '../../config/productionDeclarationConfig';
import { presetRange, isoDaysAgo, todayISO, validateRange, formatRangeLabel } from '../../utils/dateRange';
import {
    isVerifiedStatus, getStatusLabel, filterByDateRange, searchRows, splitByStatus,
    countPendingOutsideRange, computeStats,
} from '../../utils/productionDeclarationFilters';

// The shift form is large; load it only when it is opened (prefetched on hover/focus)
const loadShiftProductionForm = () => import('./sections/ShiftProductionForm');
const ShiftProductionForm = lazy(loadShiftProductionForm);

const CACHE_OPTIONS = {
    freshMs: PD_CONFIG.cacheFreshMs,
    expireMs: PD_CONFIG.cacheExpireMs,
    timeoutMs: PD_CONFIG.requestTimeoutMs,
};

const getSelectedPlantId = () => {
    try {
        const selectedPlant = JSON.parse(localStorage.getItem('selectedPlant'));
        return selectedPlant ? selectedPlant.plantId : null;
    } catch {
        return null;
    }
};

// Same client-side plant filter the dashboard has always applied to the response
const keepPlant = (rows, plantId) =>
    plantId ? (rows || []).filter((d) => String(d.plantId) === String(plantId)) : (rows || []);

// Restores the vendor's last range for this session; presets are recomputed from today
const loadSavedRange = () => {
    try {
        const saved = JSON.parse(sessionStorage.getItem(PD_CONFIG.rangeStorageKey));
        if (saved?.preset === 'custom' && !validateRange(saved.fromDate, saved.toDate, todayISO())) {
            return { preset: 'custom', fromDate: saved.fromDate, toDate: saved.toDate };
        }
        if (PD_CONFIG.presetDays.includes(saved?.preset)) return presetRange(saved.preset);
    } catch { /* fall through to the default */ }
    return presetRange(PD_CONFIG.defaultPresetDays);
};

const saveRange = (range) => {
    try { sessionStorage.setItem(PD_CONFIG.rangeStorageKey, JSON.stringify(range)); } catch { /* ignore */ }
};

const pulse = {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonPulse 1.4s ease-in-out infinite',
    borderRadius: '6px',
};

// ── Skeleton row shown while data is loading ──────────────────────────────────
const SkeletonRow = () => (
    <tr data-testid="skeleton-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
        {[140, 90, 80, 80, 80, 110, 100].map((w, i) => (
            <td key={i} style={{ padding: '18px 20px' }}>
                <div style={{ ...pulse, height: '14px', width: `${w}px` }} />
            </td>
        ))}
    </tr>
);

const StatCardSkeleton = () => (
    <div data-testid="stat-skeleton" style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
        <div style={{ ...pulse, height: '11px', width: '140px', marginBottom: '10px' }} />
        <div style={{ ...pulse, height: '10px', width: '90px', marginBottom: '14px' }} />
        <div style={{ ...pulse, height: '28px', width: '120px' }} />
    </div>
);

const FormSkeleton = () => (
    <div data-testid="form-skeleton" style={{ display: 'grid', gap: '16px' }}>
        <div style={{ ...pulse, height: '28px', width: '260px' }} />
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', display: 'grid', gap: '12px' }}>
                <div style={{ ...pulse, height: '14px', width: '180px' }} />
                <div style={{ ...pulse, height: '36px', width: '100%' }} />
            </div>
        ))}
    </div>
);

const TABLE_HEADERS = ['Date & Shift', 'Line/Shed No.', 'Batch No.', 'Total Casted', 'Type', 'Status', 'Actions'];
const thStyle = (h) => ({ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b', ...(h === 'Actions' ? { textAlign: 'center' } : {}) });

const getStatusStyle = (status) => (isVerifiedStatus(status)
    ? { background: '#f0fdf4', color: '#166534' }
    : { background: '#fef3c7', color: '#92400e' });

const ProductionDeclarationDashboard = () => {
    const [showForm, setShowForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [openingItem, setOpeningItem] = useState(false);

    const [plantId] = useState(getSelectedPlantId);
    const [today] = useState(() => todayISO());
    const [baseFrom] = useState(() => isoDaysAgo(PD_CONFIG.baseWindowDays));
    const [range, setRange] = useState(loadSavedRange);
    const [search, setSearch] = useState('');
    const [searchResetKey, setSearchResetKey] = useState(0);

    const plantKey = `${PD_CONFIG.cacheKeyPrefix}${plantId ?? 'all'}`;

    // ── Base window (same rows the dashboard always loaded, server order id ASC) ─
    // Also feeds the shift form, so its duplicate-bench check and batch suggestion are
    // unaffected by the date filter or search.
    const base = useSWRCache(
        `${plantKey}:base:${baseFrom}`,
        async ({ signal }) => keepPlant(
            await apiService.getProductionDeclarationsByRange({ fromDate: baseFrom, signal }), plantId),
        CACHE_OPTIONS,
    );

    // ── Ranges reaching further back than the base window are fetched from the server ─
    const needsRangeQuery = Boolean(range.fromDate && range.fromDate < baseFrom);
    const rangeQuery = useSWRCache(
        `${plantKey}:${range.fromDate}:${range.toDate ?? 'open'}`,
        async ({ signal }) => keepPlant(
            await apiService.getProductionDeclarationsByRange({ fromDate: range.fromDate, toDate: range.toDate, signal }), plantId),
        { ...CACHE_OPTIONS, enabled: needsRangeQuery },
    );

    // Drop the cache key the dashboard used before this change
    useEffect(() => {
        try { sessionStorage.removeItem(PD_CONFIG.legacyCacheKey); } catch { /* ignore */ }
    }, []);

    const baseRows = useMemo(() => base.data || [], [base.data]);
    const rangeRows = useMemo(
        () => (needsRangeQuery ? rangeQuery.data || [] : filterByDateRange(baseRows, range)),
        [needsRangeQuery, rangeQuery.data, baseRows, range],
    );

    const pageLoading = base.isLoading;
    const tableLoading = needsRangeQuery && rangeQuery.isLoading;
    const tableError = needsRangeQuery ? rangeQuery.error : null;
    const refreshing = openingItem || base.isValidating || (needsRangeQuery && rangeQuery.isValidating);

    const { pendingDeclarations, verifiedDeclarations } = useMemo(() => {
        const { pending, verified } = splitByStatus(searchRows(rangeRows, search));
        return { pendingDeclarations: pending, verifiedDeclarations: verified };
    }, [rangeRows, search]);

    const stats = useMemo(() => computeStats(rangeRows), [rangeRows]);
    const pendingOutside = useMemo(() => countPendingOutsideRange(baseRows, range), [baseRows, range]);
    const rangeLabel = formatRangeLabel(range.fromDate, range.toDate);

    // Each tab's table shows one page at a time; the stats above use the whole range
    const pendingPagination = usePagination(pendingDeclarations);
    const verifiedPagination = usePagination(verifiedDeclarations);

    const changeRange = useCallback((next) => {
        setRange(next);
        saveRange(next);
    }, []);

    const revalidateAll = useCallback(() => {
        invalidate(PD_CONFIG.cacheKeyPrefix);
        base.revalidate();
        if (needsRangeQuery) rangeQuery.revalidate();
    }, [base, rangeQuery, needsRangeQuery]);

    const clearSearch = useCallback(() => {
        setSearch('');
        setSearchResetKey((k) => k + 1);
    }, []);

    const handleSaveProduction = async (pdData) => {
        try {
            await apiService.saveProductionDeclaration(pdData);
            revalidateAll();
            setShowForm(false);
        } catch (err) {
            console.error('Failed to save declaration:', err);
            alert('Failed to save declaration: ' + (err.message || 'Unknown error'));
        }
    };

    // ── Optimistic delete: remove from UI immediately, call API in background ─
    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('Are you sure you want to delete this declaration?')) return;

        const removeRow = (rows) => (rows || []).filter((d) => d.id !== id);
        base.mutate(removeRow);
        if (needsRangeQuery) rangeQuery.mutate(removeRow);

        try {
            await apiService.deleteProductionDeclaration(id);
        } catch (err) {
            console.error('Failed to delete declaration:', err);
            alert('Delete failed. Refreshing list...');
            revalidateAll(); // rollback via re-fetch
        }
    }, [base, rangeQuery, needsRangeQuery, revalidateAll]);

    const openItem = useCallback(async (item, readOnly) => {
        try {
            setOpeningItem(true);
            const fullDetails = await apiService.getProductionDeclarationById(item.id);
            setSelectedItem(fullDetails || item);
        } catch (err) {
            console.error(`Failed to fetch full details for ${readOnly ? 'viewing' : 'editing'}:`, err);
            setSelectedItem(item);
        } finally {
            setIsReadOnly(readOnly);
            setShowForm(true);
            setOpeningItem(false);
        }
    }, []);

    const handleEdit = useCallback((item) => openItem(item, false), [openItem]);
    const handleView = useCallback((item) => openItem(item, true), [openItem]);

    const handleAddNew = useCallback(() => {
        setSelectedItem(null);
        setIsReadOnly(false);
        setShowForm(true);
    }, []);

    const prefetchForm = useCallback(() => { loadShiftProductionForm().catch(() => {}); }, []);

    const skeletonStyles = (
        <style>{`
            @keyframes skeletonPulse {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `}</style>
    );

    if (showForm) {
        return (
            <>
                {skeletonStyles}
                <Suspense fallback={<FormSkeleton />}>
                    <ShiftProductionForm
                        onBack={() => setShowForm(false)}
                        onSave={handleSaveProduction}
                        lastBatchNumber={baseRows.length > 0 ? (baseRows[0].batchNumber || '100') : '100'}
                        initialData={selectedItem}
                        isReadOnly={isReadOnly}
                        currentDeclarations={baseRows}
                    />
                </Suspense>
            </>
        );
    }

    const renderEmpty = (icon, message) => (
        <tr>
            <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{search ? '🔍' : icon}</div>
                {search ? (
                    <>
                        No results for “{search}” in the selected range.{' '}
                        <button type="button" onClick={clearSearch}
                            style={{ border: 'none', background: 'none', color: '#42818c', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                            Clear search
                        </button>
                    </>
                ) : message}
            </td>
        </tr>
    );

    const renderTableBody = (pagination, list, emptyIcon, emptyMessage, renderActions) => {
        if (tableLoading) return Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />);
        if (tableError) {
            return (
                <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '16px' }}>Failed to load production declarations for this range.</p>
                        <button type="button" onClick={() => rangeQuery.revalidate()}
                            style={{ background: '#42818c', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                            Retry
                        </button>
                    </td>
                </tr>
            );
        }
        if (list.length === 0) return renderEmpty(emptyIcon, emptyMessage);
        return pagination.pageItems.map((item, index) => (
            <tr key={item.id || index} style={{ borderBottom: index === pagination.pageItems.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155' }}>
                    <div style={{ fontWeight: '600' }}>{item.castingDate}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{item.shift}</div>
                </td>
                <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155' }}>{item.productionUnit}</td>
                <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155', fontWeight: '700' }}>{item.batchNumber}</td>
                <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155', fontWeight: '600' }}>{item.totalCastedSleepers}</td>
                <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569' }}>{item.plantType}</td>
                <td style={{ padding: '16px 20px', fontSize: '14px' }}>
                    <span style={{
                        ...getStatusStyle(item.status),
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700'
                    }}>
                        {getStatusLabel(item.status).toUpperCase()}
                    </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>{renderActions(item)}</div>
                </td>
            </tr>
        ));
    };

    const renderTable = (pagination, list, emptyIcon, emptyMessage, renderActions) => (
        <div className="fade-in">
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>{TABLE_HEADERS.map((h) => <th key={h} style={thStyle(h)}>{h}</th>)}</tr>
                    </thead>
                    <tbody>{renderTableBody(pagination, list, emptyIcon, emptyMessage, renderActions)}</tbody>
                </table>
                {!tableLoading && !tableError && (
                    <div style={{ padding: '4px 20px 12px' }}><PaginationBar pagination={pagination} /></div>
                )}
            </div>
        </div>
    );

    const tabButton = (tab, label, dotColor, count) => (
        <button
            onClick={() => setActiveTab(tab)}
            style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? '#42818c' : '#64748b',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === tab ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}
        >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, opacity: activeTab === tab ? 1 : 0.6 }}></span>
            {label}
            <span style={{
                background: activeTab === tab ? '#f0fdfa' : '#e2e8f0',
                color: activeTab === tab ? '#42818c' : '#475569',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                marginLeft: '4px'
            }}>
                {tableLoading ? '…' : count}
            </span>
        </button>
    );

    const statCard = (style, icon, title, titleColor, subtitle, value) => (
        <div style={{ padding: '24px', borderRadius: '20px', position: 'relative', overflow: 'hidden', ...style }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '60px', opacity: 0.05, transform: 'rotate(-15deg)' }}>{icon}</div>
            <p style={{ margin: '0 0 8px 0', color: titleColor, fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</p>
            <p style={{ margin: '0 0 4px 0', color: '#94a3b8', fontSize: '10px', fontWeight: '600' }}>{subtitle}</p>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '900' }}>{value}</h2>
        </div>
    );

    return (
        <div className="fade-in">
            {skeletonStyles}

            {/* Statistical Summary Bar (selected date range) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {pageLoading || tableLoading ? (
                    <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
                ) : (
                    <>
                        {statCard(
                            { background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
                            '🏗️', 'Total Sleepers Cast', '#64748b', rangeLabel, stats.totalCasted.toLocaleString(),
                        )}
                        {statCard(
                            { background: 'linear-gradient(135deg, #ffffff 0%, #f0f9fa 100%)', border: '1px solid #42818c33', boxShadow: '0 10px 15px -3px rgba(66, 129, 140, 0.05)' },
                            '🔢', 'Last Batch Declared', '#42818c', 'Batch No. & Date',
                            <>{stats.latest?.batchNumber || 'N/A'} <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>({stats.latest?.castingDate || 'N/A'})</span></>,
                        )}
                        {statCard(
                            { background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)', border: '1px solid #fecdd3', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
                            '📉', 'Avg. Rejection Rate', '#e11d48', 'Quality Matrix (%)',
                            <>{stats.avgRejectionRate}{stats.avgRejectionRate !== 'N/A' ? '%' : ''}</>,
                        )}
                    </>
                )}
            </div>

            {/* Header: title + refreshing indicator | search + add button */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontWeight: '700' }}>Production Declaration Dashboard</h3>
                    {refreshing && !pageLoading && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: '#f0f9fa', color: '#42818c',
                            border: '1px solid #42818c33',
                            padding: '4px 10px', borderRadius: '20px',
                            fontSize: '11px', fontWeight: '600'
                        }}>
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#42818c', animation: 'skeletonPulse 1s ease-in-out infinite' }} />
                            Refreshing…
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                    <GlobalSearchBar
                        key={searchResetKey}
                        onSearch={setSearch}
                        debounceMs={PD_CONFIG.searchDebounceMs}
                        placeholder="Search batch, shed, shift, type…"
                    />
                    <button
                        onClick={handleAddNew}
                        onMouseEnter={prefetchForm}
                        onFocus={prefetchForm}
                        style={{
                            background: '#42818c',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px -1px rgba(66, 129, 140, 0.2)'
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>+</span> Add New Shift Production
                    </button>
                </div>
            </div>

            {/* Skeleton / Error / Content */}
            {pageLoading ? (
                <div style={{ display: 'grid', gap: '24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                        {/* Tab switcher skeleton */}
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '14px', width: 'fit-content', gap: '4px' }}>
                            {['Pending Declaration', 'Verified Production'].map(label => (
                                <div key={label} style={{ padding: '10px 24px', borderRadius: '10px', background: '#e2e8f0', color: 'transparent', fontSize: '14px', fontWeight: '700' }}>{label}</div>
                            ))}
                        </div>
                        <DateRangeFilter value={range} onChange={changeRange} presets={PD_CONFIG.presetDays} maxDate={today} />
                    </div>
                    {/* Skeleton table */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>{TABLE_HEADERS.map(h => (
                                    <th key={h} style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b', textAlign: 'left' }}>{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : base.error && !base.data ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                    <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '16px' }}>
                        {base.error.message?.includes('timed out') ? base.error.message : 'Failed to load production declarations.'}
                    </p>
                    <button
                        onClick={() => base.revalidate()}
                        style={{ background: '#42818c', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '24px' }}>

                    {/* Tab switcher | date range filter */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
                        <div style={{
                            display: 'flex',
                            background: '#f1f5f9',
                            padding: '6px',
                            borderRadius: '14px',
                            width: 'fit-content',
                            boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.02)'
                        }}>
                            {tabButton('pending', 'Pending Declaration', '#f59e0b', pendingDeclarations.length)}
                            {tabButton('verified', 'Verified Production', '#10b981', verifiedDeclarations.length)}
                        </div>
                        <DateRangeFilter value={range} onChange={changeRange} presets={PD_CONFIG.presetDays} maxDate={today} />
                    </div>

                    {pendingOutside > 0 && (
                        <div role="status" style={{
                            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                            background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e',
                            padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600
                        }}>
                            <span>
                                {pendingOutside} pending {pendingOutside === 1 ? 'entry is' : 'entries are'} outside the selected range.
                            </span>
                            <button type="button" onClick={() => changeRange(presetRange(PD_CONFIG.baseWindowDays))}
                                style={{ border: '1px solid #f59e0b', background: 'white', color: '#92400e', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                Show
                            </button>
                        </div>
                    )}

                    {activeTab === 'pending' && renderTable(
                        pendingPagination, pendingDeclarations, '📝', 'No pending production declarations found.',
                        (item) => (
                            <>
                                <button onClick={() => handleEdit(item)} onMouseEnter={prefetchForm} onFocus={prefetchForm} style={{ border: 'none', background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'transform 0.1s' }}>Modify</button>
                                <button onClick={() => handleDelete(item.id)} style={{ border: 'none', background: '#fee2e2', color: '#b91c1c', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Delete</button>
                            </>
                        ),
                    )}

                    {activeTab === 'verified' && renderTable(
                        verifiedPagination, verifiedDeclarations, '✅', 'No verified production declarations found.',
                        (item) => (
                            <button onClick={() => handleView(item)} onMouseEnter={prefetchForm} onFocus={prefetchForm} style={{ border: 'none', background: '#f1f5f9', color: '#475569', padding: '6px 15px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>View Details</button>
                        ),
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductionDeclarationDashboard;
