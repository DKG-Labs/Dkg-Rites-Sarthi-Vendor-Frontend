import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import inspectionCallService from '../../../services/inspectionCallService';
import {
    Calendar, Package, ClipboardList, CheckCircle2,
    AlertCircle, Plus
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const RAIL_PAD_TYPES = [
    '6.00mm GRSP',
    '10.00mm GRSP',
    '6.20mm CGRSP',
    '10.00mm CGRSP',
    '6.00mm NCRGRSP',
    '10.00mm NCRGRSP'
];

const DRAWING_MAPPING = {
    "6.00mm GRSP": ["RDSO/T-3703", "RDSO/T-3711"],
    "10.00mm GRSP": [], 
    "6.20mm CGRSP": ["RDSO/T-6618", "RDSO/T-8327"],
    "10.00mm CGRSP": ["RDSO/T-8528", "RDSO/T-8747"],
    "6.00mm NCRGRSP": ["1 in 12 RDSO/T-8779", "1 in 8.5 RDSO/T-9774", "1 in 12 RDSO/T-4218", "1 in 8.5 RDSO/T-4865", "RDSO/T-4220", "RDSO/T-4967", "RDSO/T-6068", "RDSO/T-8893 to RDSO/T-8905", "RDSO/T-8886 to RDSO/T-8889"],
    "10.00mm NCRGRSP": ["1 in 12 RDSO- 9790", "1 in 16 RDSO -10070"]
};

// ─── Sub-Components ───────────────────────────────────────────────────────────
const SectionHeader = ({ label, step, color = '#21808d' }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 10, paddingBottom: 6,
        borderBottom: `1px solid #f1f5f9`
    }}>
        <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 11, flexShrink: 0,
            boxShadow: `0 2px 6px ${color}33`
        }}>{step}</div>
        <span style={{ fontWeight: 800, fontSize: 13, color: '#1e293b', letterSpacing: '0.01em' }}>
            {label}
        </span>
    </div>
);

const StatBox = ({ label, value, highlight, color, Icon, suffix }) => (
    <div style={{
        background: highlight ? 'linear-gradient(135deg, #fefce8, #fef9c3)' : '#fff',
        border: `1px solid ${highlight ? '#fde047' : '#e2e8f0'}`,
        borderRadius: 6, padding: '6px 10px', minWidth: 100, flex: 1,
        boxShadow: highlight ? '0 1px 4px rgba(234,179,8,0.03)' : '0 1px 2px rgba(0,0,0,0.01)',
        display: 'flex', alignItems: 'center', gap: '6px'
    }}>
        {Icon && <div style={{ color: color || '#21808d', opacity: 0.8, display: 'flex', alignItems: 'center' }}><Icon size={14} /></div>}
        <div>
            <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 700, marginBottom: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{
                fontSize: '13px', fontWeight: 900,
                color: color || (highlight ? '#dc2626' : '#1e293b'), lineHeight: 1.1,
                display: 'flex', alignItems: 'baseline', gap: '1px'
            }}>
                {value} {suffix && <span style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8' }}>{suffix}</span>}
            </div>
        </div>
    </div>
);

// ─── Main Form Component ──────────────────────────────────────────────────────
const RaiseRailPadProcessCallForm = ({ srItem, poNo, plantId, vendorCode, onClose, onSubmitInspectionCall, isWrapped }) => {
    // Form State
    const [railPadType, setRailPadType] = useState('');
    const [drawingNo, setDrawingNo] = useState('');
    const [desiredQty, setDesiredQty] = useState('');
    const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        if (type === 'success') {
            setTimeout(() => {
                setNotification(null);
                onClose();
            }, 3000);
        } else {
            setTimeout(() => setNotification(null), 5000);
        }
    };

    // Derived Values
    const uom = srItem?.unit || srItem?.uom || 'Nos.';
    const qtyOnOrder = parseInt(srItem?.orderedQty || srItem?.ordered || 50000);
    const qtyAccepted = parseInt(srItem?.acceptedTillNow || 0); // System Generated from previously accepted Process Inspection Quantity
    const qtyOfferedNow = parseInt(desiredQty) || 0;
    const qtyDue = Math.max(0, qtyOnOrder - qtyAccepted - qtyOfferedNow);

    const isValid = railPadType && drawingNo && qtyOfferedNow > 0 && productionDate;

    // Handlers
    const handleRailPadChange = (e) => {
        const val = e.target.value;
        setRailPadType(val);
        const drawings = DRAWING_MAPPING[val] || [];
        setDrawingNo(drawings.length === 1 ? drawings[0] : '');
    };

    const handleSubmit = async () => {
        if (!isValid) {
            alert('Please fill out all required fields.');
            return;
        }
        if (qtyOfferedNow > (qtyOnOrder - qtyAccepted)) {
            alert('Quantity desired cannot exceed the pending quantity on order.');
            return;
        }

        try {
            setIsSubmitting(true);
            const userId = localStorage.getItem('railpad_userId');

            // Construct payload according to Process Call requirements
            const payload = {
                poNo: `${poNo}/${srItem?.itemSrNo || srItem?.srNo || '01'}`,
                vendorCode: vendorCode || srItem?.vendorCode || 'V001',
                plantId: plantId,
                callType: 'PROCESS',
                railPadType: railPadType,
                drawingNo: drawingNo,
                uom: uom,
                qtyOnOrder: qtyOnOrder,
                qtyAcceptedTillNow: qtyAccepted,
                qtyDesiredForFinal: qtyOfferedNow,
                qtyDue: qtyDue,
                productionInitiationDate: productionDate,
                totalQty: qtyOfferedNow,
                inspectionDate: productionDate,
                createdBy: userId,
                updatedBy: userId,
                // Process calls typically do not require 'lots' array, but passing empty if backend expects it
                lots: []
            };

            const result = await inspectionCallService.create(payload);

            if (onSubmitInspectionCall) {
                onSubmitInspectionCall({ ...payload, callNo: result });
            }

            showNotification(`✅ Process Inspection Call raised successfully!\nCall No: ${result}`, 'success');
        } catch (error) {
            console.error("[Submit Process Call] Error:", error);
            showNotification("❌ Failed to raise process inspection call.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };


    // ─── Styles ───────────────────────────────────────────────────────────────
    const overlayStyle = {
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '12px'
    };

    const modalStyle = {
        background: '#fff', width: '100%', maxWidth: '900px', maxHeight: '98vh',
        borderRadius: '16px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden',
        border: '1px solid #e2e8f0'
    };

    const content = (
        <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* ── Scrollable Body ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#f8fafc' }}>
                    
                    {notification && (
                        <div style={{
                            padding: '10px', marginBottom: '16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                            background: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: notification.type === 'success' ? '#166534' : '#991b1b',
                            border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                        }}>
                            {notification.message}
                        </div>
                    )}

                    {/* ════ SECTION A ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                        <SectionHeader step="A" label="Call Header & Basic Information" color="#0ea5e9" />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Type of Rail Pad <span style={{ color: '#ef4444' }}>*</span></label>
                                <select value={railPadType} onChange={handleRailPadChange} style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b', background: '#fff', fontSize: '13px', outline: 'none' }}>
                                    <option value="" disabled>Select Type</option>
                                    {RAIL_PAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Drawing No. <span style={{ color: '#ef4444' }}>*</span></label>
                                {DRAWING_MAPPING[railPadType] && DRAWING_MAPPING[railPadType].length > 0 ? (
                                    <select value={drawingNo} onChange={e => setDrawingNo(e.target.value)} style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b', background: '#fff', fontSize: '13px', outline: 'none' }}>
                                        <option value="" disabled>Select Drawing</option>
                                        {DRAWING_MAPPING[railPadType].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                ) : (
                                    <input type="text" value={drawingNo} onChange={e => setDrawingNo(e.target.value)} placeholder="Enter drawing no." style={{ width: '100%', height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b', fontSize: '13px', outline: 'none' }} />
                                )}
                            </div>
                        </div>

                    </div>

                    {/* ════ SECTION B ════ */}
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                        <SectionHeader step="B" label="Quantities & Schedules" color="#8b5cf6" />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Unit of Measurement</div>
                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '14px', marginTop: '4px' }}>{uom}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Quantity on Order</div>
                                <div style={{ fontWeight: 900, color: '#1e293b', fontSize: '14px', marginTop: '4px' }}>{qtyOnOrder.toLocaleString()}</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Qty Accepted Till Now</div>
                                <div style={{ fontWeight: 900, color: '#16a34a', fontSize: '14px', marginTop: '4px' }}>{qtyAccepted.toLocaleString()}</div>
                            </div>
                            <div style={{ background: '#fefce8', padding: '12px', borderRadius: '8px', border: '1px solid #fde047' }}>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Quantity Due</div>
                                <div style={{ fontWeight: 900, color: qtyDue > 0 ? '#1e293b' : '#16a34a', fontSize: '14px', marginTop: '4px' }}>{qtyDue.toLocaleString()}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Quantity Desired for Final Inspection <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    type="text"
                                    value={desiredQty}
                                    onChange={e => setDesiredQty(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="Enter quantity"
                                    style={{ width: '100%', height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '14px', color: '#0ea5e9', outline: 'none' }}
                                />
                                {qtyOfferedNow > (qtyOnOrder - qtyAccepted) && (
                                    <p style={{ color: '#ef4444', fontSize: '10px', marginTop: '4px', fontWeight: 700 }}>
                                        ⚠️ Exceeds pending quantity.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '3px', textTransform: 'uppercase' }}>Approx. Date of Production Initiation <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                    type="date"
                                    value={productionDate}
                                    onChange={e => setProductionDate(e.target.value)}
                                    style={{ width: '100%', height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b', fontSize: '13px', outline: 'none' }}
                                />
                            </div>
                        </div>

                    </div>

                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: '12px 16px', background: '#fff', borderTop: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                        All fields marked with <span style={{ color: '#ef4444' }}>*</span> are mandatory.
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                background: '#fff', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!isValid || isSubmitting}
                            style={{
                                padding: '8px 24px', borderRadius: '8px', border: 'none',
                                background: isValid && !isSubmitting ? 'linear-gradient(135deg, #0f172a, #1e293b)' : '#cbd5e1',
                                color: '#fff', fontSize: '13px', fontWeight: 700,
                                cursor: isValid && !isSubmitting ? 'pointer' : 'not-allowed',
                                boxShadow: isValid && !isSubmitting ? '0 4px 12px rgba(15,23,42,0.2)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Process Call'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    if (isWrapped) return content;

    return createPortal(
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    padding: '10px 16px', flexShrink: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px', textTransform: 'uppercase' }}>
                            RAISE PROCESS INSPECTION CALL
                        </div>
                        <div style={{ color: '#fff', fontSize: '16px', fontWeight: 900, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={18} />
                            {poNo || 'PO_NUMBER'} — SR. No. {srItem?.itemSrNo || srItem?.srNo || '001'}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                        width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></button>
                </div>
                {content}
            </div>
        </div>,
        document.body
    );
};

export default RaiseRailPadProcessCallForm;
