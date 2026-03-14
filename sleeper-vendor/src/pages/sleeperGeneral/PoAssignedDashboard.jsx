import React, { useState, useMemo } from 'react';
import RaiseInspectionCallForm from './RaiseInspectionCallForm';

// ─── Mock IREPS PO Master Data ────────────────────────────────────────────────
const MOCK_PO_DATA = [
    {
        id: 1,
        poNo: 'PO/RDSO/SLP/2025/001',
        poDate: '15/01/2025',
        purchasingAuthority: 'DRM/SER/KGP',
        itemCategory: 'Prestressed Concrete Sleepers',
        uom: 'Nos.',
        totalValue: 42500000,
        status: 'Active',
        srItems: [
            {
                srNo: '1',
                description: 'Manufacture and supply of prestressed concrete sleepers RT-8746 (BG) as per RDSO drg.',
                ordered: 10000,
                offeredTillNow: 3200,
                acceptedTillNow: 3000,
                rejectedTillNow: 120,
                due: 7000
            },
            {
                srNo: '2',
                description: 'Supply of elastic rail clips ERC MK-III complete with fittings',
                ordered: 50000,
                offeredTillNow: 15000,
                acceptedTillNow: 14500,
                rejectedTillNow: 300,
                due: 35500
            }
        ]
    },
    {
        id: 2,
        poNo: 'PO/SER/KGP/2025/045',
        poDate: '01/02/2025',
        purchasingAuthority: 'DRM/SER/ADI',
        itemCategory: 'Monoblock Concrete Sleepers',
        uom: 'Nos.',
        totalValue: 18750000,
        status: 'Active',
        srItems: [
            {
                srNo: '1',
                description: 'Manufacture & supply of pre-stressed monoblock concrete sleepers PSC 60Kg (T-2828)',
                ordered: 5000,
                offeredTillNow: 5000,
                acceptedTillNow: 4980,
                rejectedTillNow: 20,
                due: 0
            }
        ]
    },
    {
        id: 3,
        poNo: 'PO/ECoR/BBS/2024/112',
        poDate: '20/11/2024',
        purchasingAuthority: 'DRM/ECoR/BBS',
        itemCategory: 'CST-9 Sleepers & Fittings',
        uom: 'Nos.',
        totalValue: 31200000,
        status: 'Active',
        srItems: [
            {
                srNo: '1',
                description: 'Supply of CST-9 Sleepers with fittings for track renewal works',
                ordered: 8000,
                offeredTillNow: 2500,
                acceptedTillNow: 2400,
                rejectedTillNow: 60,
                due: 5600
            },
            {
                srNo: '2',
                description: 'Supply of GFN Liners and MS Liners for P.Way works',
                ordered: 120000,
                offeredTillNow: 40000,
                acceptedTillNow: 39500,
                rejectedTillNow: 200,
                due: 80500
            },
            {
                srNo: '3',
                description: 'Manufacture and supply of prestressed concrete sleepers RT-8746 (BG)',
                ordered: 15000,
                offeredTillNow: 0,
                acceptedTillNow: 0,
                rejectedTillNow: 0,
                due: 15000
            }
        ]
    }
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        'Active': { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
        'Closed': { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
        'Partially Supplied': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    };
    const s = map[status] || map['Active'];
    return (
        <span style={{
            background: s.bg, color: s.color,
            border: `1px solid ${s.border}`,
            padding: '3px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap'
        }}>
            {status}
        </span>
    );
};

// ─── SR. No. Sub-Table Row ────────────────────────────────────────────────────
const SrItemRow = ({ item, poNo, isLast, onSubmitInspectionCall }) => {
    const [showForm, setShowForm] = useState(false);
    const dueColor = item.due === 0 ? '#16a34a' : '#0f172a';

    return (
        <>
            <tr style={{
                borderBottom: isLast ? 'none' : '1px solid #f0f9fa',
                background: '#fff',
                transition: 'background 0.15s'
            }}>
                {/* SR No. */}
                <td style={{ padding: '10px 12px', width: 55 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: '#f0f9fa', border: '1.5px solid #a7d8dc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 12, color: '#21808d'
                    }}>{item.srNo}</div>
                </td>
                {/* Description */}
                <td style={{ padding: '10px 12px', maxWidth: 260 }}>
                    <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 500, lineHeight: 1.4 }}>
                        {item.description}
                    </div>
                </td>
                {/* Ordered */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                        {item.ordered.toLocaleString()}
                    </span>
                </td>
                {/* Offered */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#7c3aed' }}>
                        {item.offeredTillNow.toLocaleString()}
                    </span>
                </td>
                {/* Accepted */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#16a34a' }}>
                        {item.acceptedTillNow.toLocaleString()}
                    </span>
                </td>
                {/* Due */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{
                        fontWeight: 800, fontSize: 13,
                        color: dueColor,
                        background: item.due === 0 ? '#f0fdf4' : '#fefce8',
                        padding: '2px 8px', borderRadius: 6
                    }}>
                        {item.due.toLocaleString()}
                    </span>
                </td>
                {/* Action */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button
                        disabled={item.due === 0}
                        onClick={() => setShowForm(true)}
                        style={{
                            padding: '6px 13px', borderRadius: 20, fontSize: 11,
                            fontWeight: 700, border: 'none', cursor: item.due === 0 ? 'not-allowed' : 'pointer',
                            background: item.due === 0
                                ? '#f1f5f9'
                                : 'linear-gradient(135deg, #21808d, #0d3b3f)',
                            color: item.due === 0 ? '#94a3b8' : '#fff',
                            transition: 'all 0.2s', whiteSpace: 'nowrap',
                            boxShadow: item.due === 0 ? 'none' : '0 2px 8px rgba(33,128,141,0.3)'
                        }}
                    >
                        {item.due === 0 ? 'All Dispatched' : 'Raise Inspection Call'}
                    </button>
                </td>
            </tr>
            {showForm && (
                <RaiseInspectionCallForm
                    srItem={item}
                    poNo={poNo}
                    onClose={() => setShowForm(false)}
                    onSubmitInspectionCall={onSubmitInspectionCall}
                />
            )}
        </>
    );
};

// ─── PO Row (with Expandable accordion) ──────────────────────────────────────
const PoRow = ({ po, index, isLast, onSubmitInspectionCall }) => {
    const [expanded, setExpanded] = useState(false);

    const activeSrCount = po.srItems.filter(s => s.due > 0).length;
    // Total ordered quantity = sum of all SR ordered quantities
    const totalPoQty = po.srItems.reduce((acc, s) => acc + s.ordered, 0);

    return (
        <>
            {/* Main PO Row */}
            <tr
                onClick={() => setExpanded(p => !p)}
                style={{
                    borderBottom: (!expanded && !isLast) ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    background: expanded ? '#f0f9fa' : (index % 2 === 0 ? '#fff' : '#fafcff'),
                    transition: 'background 0.2s'
                }}
            >
                {/* Expand toggle */}
                <td style={{ padding: '16px 14px', width: 44 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: expanded ? '#21808d' : '#f1f5f9',
                        border: expanded ? 'none' : '1.5px solid #cbd5e1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: expanded ? '#fff' : '#475569',
                        fontSize: 14, fontWeight: 800, transition: 'all 0.2s',
                        flexShrink: 0
                    }}>
                        {expanded ? '−' : '+'}
                    </div>
                </td>
                {/* PO No. & Date */}
                <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{po.poNo}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Dated: {po.poDate}</div>
                </td>
                {/* Purchasing Authority */}
                <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{po.purchasingAuthority}</div>
                </td>
                {/* Item Category */}
                <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontSize: 12, color: '#334155' }}>{po.itemCategory}</div>
                </td>
                {/* PO Quantity */}
                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        {totalPoQty.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{po.uom}</div>
                </td>
                {/* Total Value */}
                <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        ₹{(po.totalValue / 100000).toFixed(2)}L
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        {po.srItems.length} SR Item{po.srItems.length > 1 ? 's' : ''}
                    </div>
                </td>
                {/* Status */}
                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                    <StatusBadge status={po.status} />
                    {activeSrCount > 0 && (
                        <div style={{ fontSize: 10, color: '#21808d', fontWeight: 600, marginTop: 4 }}>
                            {activeSrCount} pending SR{activeSrCount > 1 ? 's' : ''}
                        </div>
                    )}
                </td>
            </tr>

            {/* Expanded Sub-Table */}
            {expanded && (
                <tr style={{ borderBottom: isLast ? 'none' : '1px solid #e2e8f0' }}>
                    <td colSpan={7} style={{ padding: 0 }}>
                        <div style={{
                            margin: '0 0 12px 44px',
                            border: '1.5px solid #a7d8dc',
                            borderRadius: '0 0 12px 12px',
                            overflow: 'hidden',
                            background: '#fff',
                            boxShadow: '0 4px 16px rgba(33,128,141,0.1)'
                        }}>
                            {/* Sub-table header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #0d3b3f, #21808d)',
                                padding: '10px 12px',
                                display: 'flex', alignItems: 'center', gap: 10
                            }}>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>
                                    PO Sr. No. Items — {po.poNo}
                                </span>
                                <span style={{
                                    background: 'rgba(255,255,255,0.2)', color: '#fff',
                                    padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700
                                }}>
                                    {po.srItems.length} items
                                </span>
                            </div>

                            {/* Inner scrollable table */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                                    <thead>
                                        <tr style={{ background: '#fdf8e6' }}>
                                            <th style={thStyle}>SR.</th>
                                            <th style={thStyle}>Description of Stores</th>
                                            <th style={{ ...thStyle, textAlign: 'center' }}>Qty on Order</th>
                                            <th style={{ ...thStyle, textAlign: 'center', color: '#7c3aed' }}>Offered Till Now</th>
                                            <th style={{ ...thStyle, textAlign: 'center', color: '#16a34a' }}>Accepted Till Now</th>
                                            <th style={{ ...thStyle, textAlign: 'center' }}>Sleepers Due</th>
                                            <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {po.srItems.map((item, idx) => (
                                            <SrItemRow
                                                key={item.srNo}
                                                item={item}
                                                poNo={po.poNo}
                                                isLast={idx === po.srItems.length - 1}
                                                onSubmitInspectionCall={onSubmitInspectionCall}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const thStyle = {
    padding: '10px 12px',
    fontSize: 10, fontWeight: 700,
    color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap'
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const PoAssignedDashboard = ({ onSubmitInspectionCall }) => {
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [page, setPage] = useState(1);

    // Summary stats
    const activePOs = MOCK_PO_DATA.filter(p => p.status === 'Active').length;
    const pendingCalls = MOCK_PO_DATA.reduce((acc, po) =>
        acc + po.srItems.filter(s => s.due > 0).length, 0);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return MOCK_PO_DATA.filter(po =>
            po.poNo.toLowerCase().includes(q) ||
            po.purchasingAuthority.toLowerCase().includes(q) ||
            po.itemCategory.toLowerCase().includes(q)
        );
    }, [search]);

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    return (
        <div className="fade-in">
            {/* ── Page Header ── */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: 22, fontWeight: 800 }}>
                            PO Assigned to Vendor
                        </h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                            List of all POs assigned along with status (Fresh PO, Inspection under Process, Partially Supplied, Order Executed). Click <strong>+</strong> to expand PO and view items.
                        </p>
                    </div>
                    {/* Summary badges */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{
                            background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                            borderRadius: 12, padding: '8px 16px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{activePOs}</div>
                            <div style={{ fontSize: 10, color: '#166534', fontWeight: 600, marginTop: 2 }}>ACTIVE POs</div>
                        </div>
                        <div style={{
                            background: '#fef9ec', border: '1.5px solid #fde68a',
                            borderRadius: 12, padding: '8px 16px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{pendingCalls}</div>
                            <div style={{ fontSize: 10, color: '#92400e', fontWeight: 600, marginTop: 2 }}>PENDING CALLS</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 16, gap: 12, flexWrap: 'wrap'
            }}>
                <div style={{ position: 'relative', flex: '0 0 300px' }}>
                    <span style={{
                        position: 'absolute', left: 12, top: '50%',
                        transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14
                    }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search PO No., Authority, Item Category..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        style={{
                            width: '100%', height: 38, padding: '0 12px 0 36px',
                            border: '1.5px solid #e2e8f0', borderRadius: 8,
                            fontSize: 13, color: '#0f172a', background: '#fff'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
                    <span>Show</span>
                    <select
                        value={perPage}
                        onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                        style={{
                            height: 34, padding: '0 8px', border: '1.5px solid #e2e8f0',
                            borderRadius: 8, fontSize: 12, color: '#0f172a', background: '#fff', cursor: 'pointer'
                        }}
                    >
                        {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
                    </select>
                </div>
            </div>

            {/* ── Main Table ── */}
            <div style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid #e2e8f0', overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                        <thead>
                            <tr style={{ background: '#fdf8e6', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={thStyle}></th>
                                <th style={thStyle}>PO No. &amp; Date</th>
                                <th style={thStyle}>Purchasing Authority</th>
                                <th style={thStyle}>Item Category</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>PO Quantity</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Total PO Value</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
                                        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                                        No POs found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((po, idx) => (
                                    <PoRow
                                        key={po.id}
                                        po={po}
                                        index={idx}
                                        isLast={idx === paginated.length - 1}
                                        onSubmitInspectionCall={onSubmitInspectionCall}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                <div style={{
                    padding: '12px 20px', background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 12, color: '#64748b', flexWrap: 'wrap', gap: 8
                }}>
                    <span>
                        Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1} to{' '}
                        {Math.min(page * perPage, filtered.length)} of {filtered.length} PO{filtered.length !== 1 ? 's' : ''}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{
                                padding: '4px 12px', borderRadius: 6,
                                border: '1px solid #e2e8f0', background: '#fff',
                                color: page === 1 ? '#cbd5e1' : '#475569',
                                cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600
                            }}
                        >← Previous</button>
                        <span style={{
                            padding: '4px 12px', borderRadius: 6,
                            border: '1px solid #e2e8f0', background: '#fff',
                            color: '#0f172a', fontWeight: 700, fontSize: 12
                        }}>
                            Page {page} of {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            style={{
                                padding: '4px 12px', borderRadius: 6,
                                border: '1px solid #e2e8f0', background: '#fff',
                                color: page >= totalPages ? '#cbd5e1' : '#475569',
                                cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600
                            }}
                        >Next →</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoAssignedDashboard;
