import React, { useState, useEffect, useMemo } from 'react';
import RaiseRailPadCallWrapper from './RaiseRailPadCallWrapper';
import poAssignedService from '../../../services/poAssignedService';
import inspectionCallService from '../../../services/inspectionCallService';
import SyncPOButton from '../../../components/common/SyncPOButton';

// ─── Date & SR Formatter Helpers ─────────────────────────────────────────────
const parseDateToDateObject = (dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    if (!str || str.toLowerCase() === 'null' || str.toUpperCase() === 'N/A') return null;

    // Format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD HH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const [year, month, day] = str.split('T')[0].split(' ')[0].split('-');
        return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    }

    // Format: DD/MM/YYYY or DD/MM/YYYY HH:mm
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
        const [datePart] = str.split(' ');
        const [day, month, year] = datePart.split('/');
        return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    }

    // Format: DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}/.test(str)) {
        const [datePart] = str.split(' ');
        const [day, month, year] = datePart.split('-');
        return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return null;
};

const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return 'N/A';
    const str = String(dateStr).trim();
    if (!str || str.toLowerCase() === 'null' || str.toUpperCase() === 'N/A') return 'N/A';
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const [year, month, day] = str.split('T')[0].split(' ')[0].split('-');
        return `${day}-${month}-${year}`;
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
        const [datePart] = str.split(' ');
        const [day, month, year] = datePart.split('/');
        return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    }
    if (/^\d{1,2}-\d{1,2}-\d{4}/.test(str)) {
        const [datePart] = str.split(' ');
        const [day, month, year] = datePart.split('-');
        return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
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

// ─── DP Date Status Helper ───────────────────────────────────────────────────
const checkDpDateStatus = (item) => {
    const dpStr = item.deliveryDate || item.delivery_date || item.deliveryPeriod;
    const extDpStr = item.extendedDeliveryDate || item.extended_delivery_date;

    const hasExtDp = Boolean(
        extDpStr && 
        String(extDpStr).trim() !== '' && 
        String(extDpStr).trim().toUpperCase() !== 'N/A' && 
        String(extDpStr).trim().toLowerCase() !== 'null'
    );
    const hasDp = Boolean(
        dpStr && 
        String(dpStr).trim() !== '' && 
        String(dpStr).trim().toUpperCase() !== 'N/A' && 
        String(dpStr).trim().toLowerCase() !== 'null'
    );

    const targetStr = hasExtDp ? extDpStr : (hasDp ? dpStr : null);
    
    if (!targetStr) {
        return {
            isDisabled: false,
            dpDisplay: '—',
            reason: '',
            targetStr: null,
            hasExtDp: false,
            hasDp: false
        };
    }

    let isDisabled = false;
    let reason = '';

    try {
        const targetDay = parseDateToDateObject(targetStr);
        if (targetDay) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            targetDay.setHours(0, 0, 0, 0);

            // Rule:
            // If DP Date >= Current Date (today) -> Vendor CAN raise call (isDisabled = false)
            // If DP Date < Current Date (today)  -> Vendor CANNOT raise call (isDisabled = true)
            if (targetDay < today) {
                isDisabled = true;
                reason = hasExtDp 
                    ? `Ext. DP Date Expired (${formatDateDDMMYYYY(extDpStr)})` 
                    : `DP Date Expired (${formatDateDDMMYYYY(dpStr)})`;
            }
        }
    } catch (e) {}

    const formattedDp = formatDateDDMMYYYY(dpStr);
    const formattedExtDp = hasExtDp ? formatDateDDMMYYYY(extDpStr) : null;

    let dpDisplay = '—';
    if (hasDp && hasExtDp) {
        dpDisplay = (
            <div style={{ fontSize: 11, lineHeight: 1.3 }}>
                <span style={{ color: '#475569', display: 'block' }}>DP: {formattedDp}</span>
                <span style={{ color: '#0284c7', fontWeight: 700, display: 'block' }}>Ext: {formattedExtDp}</span>
            </div>
        );
    } else if (hasExtDp) {
        dpDisplay = (
            <span style={{ color: '#0284c7', fontWeight: 700, fontSize: 11 }}>Ext: {formattedExtDp}</span>
        );
    } else if (hasDp) {
        dpDisplay = (
            <span style={{ color: '#334155', fontWeight: 600, fontSize: 11 }}>{formattedDp}</span>
        );
    }

    return {
        isDisabled,
        reason,
        dpDisplay,
        hasExtDp,
        hasDp,
        formattedDp,
        formattedExtDp
    };
};

// ─── SR. No. Sub-Table Row ────────────────────────────────────────────────────
const SrItemRow = ({ item, poNo, isLast, onSubmitInspectionCall, idx = 0, plantId, vendorCode, isCaseNoMissing = false, onRefreshData, isPlantBlocked = false }) => {
    const [showForm, setShowForm] = useState(false);
    const dueColor = item.due === 0 ? '#16a34a' : '#0f172a';
    const dpInfo = checkDpDateStatus(item);

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
                {/* DP Date / Ext DP Date */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {dpInfo.dpDisplay}
                </td>
                {/* Action */}
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button
                        onClick={() => {
                            if (isPlantBlocked) {
                                alert("⚠️ Call raising is blocked for this plant due to pending cancellation charges. Please clear payment details in the Payment Details Updating Module.");
                                return;
                            }
                            setShowForm(true);
                        }}
                        disabled={isPlantBlocked}
                        title={isPlantBlocked ? 'Call raising is blocked due to pending cancellation charges' : ''}
                        style={{
                            padding: '6px 13px', borderRadius: 20, fontSize: 11,
                            fontWeight: 700, border: 'none',
                            cursor: isPlantBlocked ? 'not-allowed' : 'pointer',
                            background: isPlantBlocked ? '#94a3b8' : 'linear-gradient(135deg, #21808d, #0d3b3f)',
                            color: '#fff',
                            opacity: isPlantBlocked ? 0.6 : 1,
                            transition: 'all 0.2s', whiteSpace: 'nowrap',
                            boxShadow: isPlantBlocked ? 'none' : '0 2px 8px rgba(33,128,141,0.3)'
                        }}
                    >
                        Raise Inspection Call
                    </button>
                </td>
            </tr>
            {showForm && !isPlantBlocked && (
                <RaiseRailPadCallWrapper
                    srItem={item}
                    poNo={poNo}
                    plantId={plantId}
                    vendorCode={vendorCode}
                    onClose={() => {
                        setShowForm(false);
                        if (onRefreshData) onRefreshData();
                    }}
                    onSubmitInspectionCall={onSubmitInspectionCall}
                />
            )}
        </>
    );
};

// ─── PO Row (with Expandable accordion) ──────────────────────────────────────
const PoRow = ({ po, index, isLast, onSubmitInspectionCall, plantId, vendorCode, setViewingPdfUrl, onRefreshData, isPlantBlocked = false }) => {
    const [expanded, setExpanded] = useState(false);

    // Sort items numerically by SR No / poSerialNo
    const items = [...(po.poItem || po.srItems || [])].sort((a, b) => {
        const getNum = (obj) => {
            const val = obj.itemSrNo || obj.srNo || obj.poSerialNo;
            if (!val) return 0;
            const str = String(val).trim();
            const parts = str.split('/');
            const lastPart = parts[parts.length - 1];
            return parseInt(lastPart, 10) || 0;
        };
        return getNum(a) - getNum(b);
    });
    const activeSrCount = items.filter(s => s.due > 0).length;
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
                <td style={{ padding: '16px 14px', width: 44, verticalAlign: 'top' }}>
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
                <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                    <div 
                        onClick={(e) => {
                            if (po.pdfPath) {
                                e.stopPropagation();
                                setViewingPdfUrl(po.pdfPath);
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
                <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{po.rlyShortName || po.purchasingAuthority || 'N/A'}</div>
                </td>
                {/* Item Category */}
                <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: 12, color: '#334155' }}>{po.itemCategory || po.poDes || 'N/A'}</div>
                </td>
                {/* Case No. */}
                <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: 12, color: isCaseNoMissing ? '#dc2626' : '#334155', fontWeight: 700 }}>
                        {caseNoValue || 'N/A'}
                    </div>
                </td>
                {/* PO Quantity */}
                <td style={{ padding: '16px 8px', textAlign: 'center', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        {(totalPoQty || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{po.unit || po.uom || 'Nos.'}</div>
                </td>
                {/* Total Value */}
                <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        ₹{((po.totalValue || 0) / 100000).toFixed(2)}L
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        {items.length} SR Item{items.length > 1 ? 's' : ''}
                    </div>
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
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 850 }}>
                                    <thead>
                                        <tr style={{ background: '#fdf8e6' }}>
                                            <th style={thStyle}>SR.</th>
                                            <th style={thStyle}>Description of Stores</th>
                                            <th style={thStyle}>Consignee</th>
                                            <th style={{ ...thStyle, textAlign: 'center' }}>Qty on Order</th>
                                            <th style={{ ...thStyle, textAlign: 'center', color: '#7c3aed' }}>Offered Till Now</th>
                                            <th style={{ ...thStyle, textAlign: 'center', color: '#16a34a' }}>Accepted Till Now</th>
                                            <th style={{ ...thStyle, textAlign: 'center' }}>Qty Due</th>
                                            <th style={{ ...thStyle, textAlign: 'center', color: '#0369a1' }}>DP Date / Ext DP Date</th>
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
                                                plantId={plantId}
                                                vendorCode={vendorCode}
                                                isCaseNoMissing={isCaseNoMissing}
                                                onRefreshData={onRefreshData}
                                                isPlantBlocked={isPlantBlocked}
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
const PoAssignedDashboard = ({ vendorCode, plantId }) => {
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [page, setPage] = useState(1);
    const [viewingPdfUrl, setViewingPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [poDataList, setPoDataList] = useState([]);
    const [notification, setNotification] = useState(null);
    const [isPlantBlocked, setIsPlantBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    const fetchPoData = async () => {
        try {
            setLoading(true);
            const data = await poAssignedService.getPoAssigned(vendorCode);
            setPoDataList(Array.isArray(data) ? data : (data.responseData || []));
        } catch (error) {
            console.error('Error fetching PO data:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkPlantBlock = async () => {
        if (plantId) {
            try {
                const res = await inspectionCallService.checkPlantPaymentBlock(plantId, vendorCode);
                setIsPlantBlocked(Boolean(res?.isBlocked));
                setBlockReason(res?.message || 'Call raising is blocked for this plant due to pending cancellation charges.');
            } catch (err) {
                console.error("Error checking plant payment block:", err);
            }
        }
    };

    useEffect(() => {
        if (vendorCode) {
            fetchPoData();
            checkPlantBlock();
        }
    }, [vendorCode, plantId]);

    const activePOs = poDataList.filter(p => (p.status || 'Active') === 'Active').length;
    const pendingCalls = poDataList.reduce((acc, po) =>
        acc + (po.poItem || po.srItems || []).filter(s => (s.due || 0) > 0).length, 0);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return poDataList.filter(po =>
            (po.poNo && String(po.poNo).toLowerCase().includes(q)) ||
            (po.rlyShortName && String(po.rlyShortName).toLowerCase().includes(q)) ||
            (po.purchasingAuthority && String(po.purchasingAuthority).toLowerCase().includes(q)) ||
            (po.itemCategory && String(po.itemCategory).toLowerCase().includes(q))
        );
    }, [search, poDataList]);

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const onSubmitInspectionCall = async (payload) => {
        try {
            const res = await inspectionCallService.create(payload);
            const callNo = res?.callNo || res?.responseData?.callNo || res?.data?.callNo || 'RPF-SUCCESS';
            showNotification(`✅ Inspection Call Raised Successfully! Call No: ${callNo}`, 'success');
            
            // Immediate and delayed re-fetches so backend DB update completes and reflects automatically
            fetchPoData();
            setTimeout(() => {
                fetchPoData();
            }, 1200);
            setTimeout(() => {
                fetchPoData();
            }, 2500);

            return res;
        } catch (err) {
            console.error("Error creating inspection call:", err);
            showNotification(err?.response?.data?.message || err?.message || 'Failed to raise inspection call', 'error');
            throw err;
        }
    };

    if (viewingPdfUrl) {
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '80vh', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        onClick={() => setViewingPdfUrl(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 16px',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        ← Back to Dashboard
                    </button>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>PO Document Viewer</span>
                </div>
                {viewingPdfUrl.includes('ireps.gov.in') ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 24px',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                        textAlign: 'center',
                        margin: '20px auto',
                        maxWidth: '650px',
                        width: '100%'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: '#eff6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.15)'
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e3a8a', marginBottom: '12px', fontFamily: 'inherit' }}>
                            Indian Railways Portal (IREPS) Document
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: '#475569', maxWidth: '480px', lineHeight: '1.6', marginBottom: '24px', fontFamily: 'inherit' }}>
                            Due to strict security protocols enforced by the Indian Railways portal (<code style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#334155' }}>ireps.gov.in</code>), direct embedding is restricted. Please click the button below to view the official document.
                        </p>
                        <a
                            href={viewingPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 28px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: '#ffffff',
                                fontSize: '1rem',
                                fontWeight: '600',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(37, 99, 236, 0.25)',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                border: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 236, 0.35)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 236, 0.25)';
                            }}
                        >
                            <span>Open PO Document</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                    </div>
                ) : (
                    <iframe
                        src={viewingPdfUrl}
                        title="PO PDF"
                        style={{
                            width: '100%',
                            height: '100%',
                            border: '1px solid #cbd5e1',
                            borderRadius: 12,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="fade-in">
            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
            
            {/* ── Toast Notification ── */}
            {notification && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    background: notification.type === 'success' ? '#10b981' : '#ef4444',
                    color: '#fff', padding: '12px 24px', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600, fontSize: '14px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    animation: 'pulse 0.3s ease-out' // Using existing pulse animation for simplicity
                }}>
                    {notification.message}
                </div>
            )}
            
            {/* ── Page Header & Filter Bar Container ── */}
            <div style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                marginBottom: '24px'
            }}>
                {/* ── Page Header ── */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: 22, fontWeight: 800 }}>
                                PO Assigned to Vendor
                            </h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                                List of all active Rail Pad Purchase Orders. Expand PO to view item details and raise inspection calls.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                            <SyncPOButton 
                                vendorCode={vendorCode}
                                plantId={plantId}
                                onSuccess={() => fetchPoData()}
                                onError={(err) => showNotification('Sync failed: ' + err.message, 'error')}
                            />
                        </div>

                    </div>
                </div>

                {/* ── Filter Bar ── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 12, flexWrap: 'wrap'
                }}>
                    <div style={{ position: 'relative', flex: '0 0 300px' }}>
                        <span style={{
                            position: 'absolute', left: 12, top: '50%',
                            transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14
                        }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search PO No., Authority..."
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
            </div>

            {/* ── Plant Payment Block Alert Banner ── */}
            {isPlantBlocked && (
                <div style={{
                    background: '#fef2f2',
                    border: '1.5px solid #f87171',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)'
                }}>
                    <span style={{ fontSize: '26px' }}>⚠️</span>
                    <div>
                        <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '14px' }}>
                            Call Raising is Blocked for this Plant
                        </div>
                        <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '2px', lineHeight: 1.4 }}>
                            {blockReason || 'This plant has pending cancellation charges due to a cancelled call. Call raising functionality is blocked until payment details are submitted and approved.'}
                        </div>
                    </div>
                </div>
            )}

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
                                <th style={thStyle}>Case No.</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>PO Quantity</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Total PO Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
                                        <td style={{ padding: '20px 12px' }}><div style={{ width: 28, height: 28, background: '#f1f5f9', borderRadius: 8 }}></div></td>
                                        <td style={{ padding: '20px 8px' }}>
                                            <div style={{ width: 120, height: 14, background: '#f1f5f9', borderRadius: 4, marginBottom: 4 }}></div>
                                            <div style={{ width: 80, height: 10, background: '#f1f5f9', borderRadius: 4 }}></div>
                                        </td>
                                        <td style={{ padding: '20px 8px' }}><div style={{ width: 150, height: 12, background: '#f1f5f9', borderRadius: 4 }}></div></td>
                                        <td style={{ padding: '20px 8px' }}><div style={{ width: 180, height: 12, background: '#f1f5f9', borderRadius: 4 }}></div></td>
                                        <td style={{ padding: '20px 8px' }}><div style={{ width: 110, height: 12, background: '#f1f5f9', borderRadius: 4 }}></div></td>
                                        <td style={{ padding: '20px 8px' }}><div style={{ width: 60, height: 14, background: '#f1f5f9', borderRadius: 4, margin: '0 auto' }}></div></td>
                                        <td style={{ padding: '20px 8px' }}><div style={{ width: 80, height: 14, background: '#f1f5f9', borderRadius: 4, marginLeft: 'auto' }}></div></td>
                                    </tr>
                                ))
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
                                        plantId={plantId}
                                        vendorCode={vendorCode}
                                        setViewingPdfUrl={setViewingPdfUrl}
                                        onRefreshData={fetchPoData}
                                        isPlantBlocked={isPlantBlocked}
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
