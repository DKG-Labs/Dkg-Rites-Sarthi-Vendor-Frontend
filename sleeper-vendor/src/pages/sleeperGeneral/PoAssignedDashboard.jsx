import React, { useState, useEffect, useMemo } from 'react';
import RaiseInspectionCallForm from './RaiseInspectionCallForm';
import { apiService } from '../../services/api';
import SyncPOButton from '../../components/common/SyncPOButton';


// ─── Date & SR Formatter Helpers ─────────────────────────────────────────────
const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return 'N/A';
    const str = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const [year, month, day] = str.split('T')[0].split('-');
        return `${day}-${month}-${year}`;
    }
    try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        }
    } catch (e) {}
    return str;
};

const getSrDisplay = (item, idx) => {
    const raw = item.itemSrNo || item.srNo || (item.poSerialNo ? String(item.poSerialNo).split('/').pop() : '');
    if (!raw) return String(idx + 1).padStart(3, '0');
    const str = String(raw).trim();
    if (/^\d+$/.test(str)) {
        return str.padStart(3, '0');
    }
    return str;
};

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
const SrItemRow = ({ item, poNo, isLast, onSubmitInspectionCall, idx = 0, isCaseNoMissing = false }) => {
    const [showForm, setShowForm] = useState(false);
    const dueColor = item.due === 0 ? '#16a34a' : '#0f172a';
    const shouldDisableRaiseCall = item.due === 0 || isCaseNoMissing;

    return (
        <>
            <tr style={{
                borderBottom: isLast ? 'none' : '1px solid #f0f9fa',
                background: '#fff',
                transition: 'background 0.15s'
            }}>
                {/* SR No. */}
                <td style={{ padding: '10px 12px', width: 65 }}>
                    <div style={{
                        minWidth: 32, height: 28, borderRadius: 14,
                        background: '#f0f9fa', border: '1.5px solid #a7d8dc',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 11, color: '#21808d', padding: '0 6px'
                    }}>{getSrDisplay(item, idx)}</div>
                </td>
                <td style={{ padding: '10px 12px', maxWidth: 260 }}>
                    <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 500, lineHeight: 1.4 }}>
                        {item.poDes || item.description || 'N/A'}
                    </div>
                </td>
                {/* Consignee */}
                <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
                        {item.conigness || item.consignee || '—'}
                    </div>
                </td>
                {/* Ordered */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                        {(item.orderedQty || item.ordered || 0).toLocaleString()}
                    </span>
                </td>
                {/* Offered */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#7c3aed' }}>
                        {(item.offeredTillNow || 0).toLocaleString()}
                    </span>
                </td>
                {/* Accepted */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#16a34a' }}>
                        {(item.acceptedTillNow || 0).toLocaleString()}
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
                        {(item.due || 0).toLocaleString()}
                    </span>
                </td>
                {/* Action */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div
                        title={isCaseNoMissing && item.due > 0 ? "Case No. is not available for this PO. Please contact RITES Administrator to update the Case No." : ""}
                        onClick={() => {
                            if (isCaseNoMissing && item.due > 0) {
                                alert(`Cannot Raise Inspection Request:\nCase No. is not available for PO No. ${poNo || ''}.\n\nPlease contact RITES Administrator to update the Case No.`);
                            }
                        }}
                        style={{ position: 'relative', display: 'inline-block', cursor: shouldDisableRaiseCall ? 'not-allowed' : 'default' }}
                    >
                        <button
                            disabled={shouldDisableRaiseCall}
                            onClick={(e) => {
                                if (isCaseNoMissing) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return;
                                }
                                setShowForm(true);
                            }}
                            style={{
                                padding: '6px 13px', borderRadius: 20, fontSize: 11,
                                fontWeight: 700, border: 'none', cursor: shouldDisableRaiseCall ? 'not-allowed' : 'pointer',
                                background: shouldDisableRaiseCall
                                    ? '#f1f5f9'
                                    : 'linear-gradient(135deg, #21808d, #0d3b3f)',
                                color: shouldDisableRaiseCall ? '#94a3b8' : '#fff',
                                transition: 'all 0.2s', whiteSpace: 'nowrap',
                                boxShadow: shouldDisableRaiseCall ? 'none' : '0 2px 8px rgba(33,128,141,0.3)'
                            }}
                        >
                            {item.due === 0 ? 'All Dispatched' : (isCaseNoMissing ? 'Raise Call (Disabled)' : 'Raise Inspection Call')}
                        </button>
                        {isCaseNoMissing && item.due > 0 && (
                            <div style={{ fontSize: 9, color: '#dc2626', marginTop: 3, fontWeight: 600 }}>
                                ⚠️ Case No. Missing
                            </div>
                        )}
                    </div>
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

    // Sort items by their embedded SR No / Serial suffix
    const items = [...(po.poItem || po.srItems || [])].sort((a, b) => {
        const getNum = (obj) => {
            if (obj.itemSrNo) return parseInt(obj.itemSrNo, 10) || 0;
            if (obj.srNo) return parseInt(obj.srNo, 10) || 0;
            if (obj.poSerialNo) {
                const parts = obj.poSerialNo.split('/');
                return parseInt(parts[parts.length - 1], 10) || 0;
            }
            return 0;
        };
        return getNum(a) - getNum(b);
    });
    const activeSrCount = items.filter(s => s.due > 0).length;
    // Total ordered quantity = sum of all SR ordered quantities
    const totalPoQty = po.qty || items.reduce((acc, s) => acc + (s.orderedQty || s.ordered || 0), 0);
    const caseNoValue = po.caseNo || po.case_no || '';
    const isCaseNoMissing = !caseNoValue || caseNoValue === 'N/A' || caseNoValue.trim() === '' || caseNoValue === '-';

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
                    <div 
                        onClick={(e) => {
                            if (po.pdfPath) {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.href = po.pdfPath;
                                link.target = '_blank';
                                link.download = `PO_${po.poNo}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }
                        }}
                        style={{ 
                            fontWeight: 800, 
                            color: po.pdfPath ? '#21808d' : '#0f172a', 
                            fontSize: 13,
                            textDecoration: po.pdfPath ? 'underline' : 'none',
                            cursor: po.pdfPath ? 'pointer' : 'default'
                        }}
                    >
                        {po.poNo}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        Dated: {formatDateDDMMYYYY(po.poDate)}
                    </div>
                </td>
                {/* Purchasing Authority */}
                <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{po.rlyShortName || po.purchasingAuthority || 'N/A'}</div>
                </td>
                {/* Item Category */}
                <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontSize: 12, color: '#334155' }}>{po.itemCategory || po.poDes || 'N/A'}</div>
                </td>
                {/* Case No. */}
                <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontSize: 12, color: isCaseNoMissing ? '#dc2626' : '#334155', fontWeight: 700 }}>
                        {caseNoValue || 'N/A'}
                    </div>
                </td>
                {/* PO Quantity */}
                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        {(totalPoQty || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{po.unit || po.uom || 'Nos.'}</div>
                </td>
                {/* Total Value */}
                <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        ₹{((po.totalValue || 0) / 100000).toFixed(2)}L
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        {items.length} SR Item{items.length > 1 ? 's' : ''}
                    </div>
                </td>
                {/* Status */}
                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                    <StatusBadge status={po.status || 'Active'} />
                    {activeSrCount > 0 && (
                        <div style={{ fontSize: 10, color: '#21808d', fontWeight: 600, marginTop: 4 }}>
                            {activeSrCount} pending for verification SR{activeSrCount > 1 ? 's' : ''}
                        </div>
                    )}
                </td>
            </tr>

            {/* Expanded Sub-Table */}
            {expanded && (
                <tr style={{ borderBottom: isLast ? 'none' : '1px solid #e2e8f0' }}>
                    <td colSpan={8} style={{ padding: 0 }}>
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
                                    {items.length} items
                                </span>
                            </div>

                            {/* Inner scrollable table */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                                    <thead>
                                        <tr style={{ background: '#fdf8e6' }}>
                                            <th style={thStyle}>SR.</th>
                                            <th style={thStyle}>Description of Stores</th>
                                            <th style={thStyle}>Consignee</th>
                                            <th style={{ ...thStyle, textAlign: 'center' }}>Qty on Order</th>
                                            <th style={{ ...thStyle, textAlign: 'center', color: '#7c3aed' }}>Offered Till Now</th>
                                            <th style={{ ...thStyle, textAlign: 'center', color: '#16a34a' }}>Accepted Till Now</th>
                                            <th style={{ ...thStyle, textAlign: 'center' }}>Qty Due</th>
                                            <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <SrItemRow
                                                key={item.itemSrNo || item.srNo || idx}
                                                item={item}
                                                poNo={po.poNo}
                                                isLast={idx === items.length - 1}
                                                onSubmitInspectionCall={onSubmitInspectionCall}
                                                idx={idx}
                                                isCaseNoMissing={isCaseNoMissing}
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

    const [poDataList, setPoDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchPos = async () => {
            setLoading(true);
            try {
                const data = await apiService.getVendorPOs();
                setPoDataList(data);
            } catch(e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchPos();
    }, []);



    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return poDataList.filter(po =>
            (po.poNo && po.poNo.toLowerCase().includes(q)) ||
            (po.rlyShortName && po.rlyShortName.toLowerCase().includes(q)) ||
            (po.purchasingAuthority && po.purchasingAuthority.toLowerCase().includes(q)) ||
            (po.itemCategory && po.itemCategory.toLowerCase().includes(q)) ||
            (po.poDes && po.poDes.toLowerCase().includes(q))
        );
    }, [search, poDataList]);

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    return (
        <div className="fade-in">
            {/* ── Page Header ── */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <SyncPOButton 
                    poList={poDataList} 
                    onSuccess={(res) => alert(`Successfully synced ${res.successCount} of ${res.totalCount} POs`)}
                    onError={(err) => alert('Sync failed: ' + err.message)}
                />
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
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
                                        Loading PO Data...
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
                                        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                                        No POs found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((po, idx) => (
                                    <PoRow
                                        key={po.poNo || idx}
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
