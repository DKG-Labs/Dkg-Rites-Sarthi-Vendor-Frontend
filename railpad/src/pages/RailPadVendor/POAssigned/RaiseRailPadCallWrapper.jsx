import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import RaiseRailPadInspectionCallForm from './RaiseRailPadInspectionCallForm';
import RaiseRailPadProcessCallForm from './RaiseRailPadProcessCallForm';
import { Package, Plus } from 'lucide-react';

const RaiseRailPadCallWrapper = (props) => {
    const srKey = String(props.srItem?.itemSrNo || props.srItem?.srNo || '').trim();
    const isProcessBlocked = srKey ? props.activeProcessSrNos?.has(srKey) : false;
    const isFinalBlocked   = srKey ? props.activeFinalSrNos?.has(srKey)   : false;
    const wrapperKey = `railpad_draft_call_type_${String(props.poNo || 'PO').replace(/[^a-zA-Z0-9_-]/g, '_')}_${props.srItem?.itemSrNo || props.srItem?.srNo || '1'}`;
    const [callType, setCallType] = useState(() => {
        try {
            return localStorage.getItem(wrapperKey) || '';
        } catch (e) {
            return '';
        }
    });

    const handleCallTypeChange = (val) => {
        setCallType(val);
        try {
            if (val) {
                localStorage.setItem(wrapperKey, val);
            } else {
                localStorage.removeItem(wrapperKey);
            }
        } catch (e) {
            console.warn('Error persisting callType:', e);
        }
    };

    const overlayStyle = {
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '12px'
    };

    const modalStyle = {
        background: '#fff', width: '100%', maxWidth: '1100px', maxHeight: '98vh',
        borderRadius: '16px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden',
        border: '1px solid #e2e8f0'
    };

    return createPortal(
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* ── Header ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
                    padding: '10px 16px', flexShrink: 0,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px', textTransform: 'uppercase' }}>
                            {callType === 'PROCESS' ? 'RAISE PROCESS INSPECTION CALL' : 'RAISE FINAL INSPECTION CALL'}
                        </div>
                        <div style={{ color: '#fff', fontSize: '16px', fontWeight: 900, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={18} />
                            {props.poNo || 'PO'} — SR. No. {props.srItem?.itemSrNo || props.srItem?.srNo || '001'}
                        </div>
                    </div>
                    <button onClick={props.onClose} style={{
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                        width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></button>
                </div>

                {/* ── Dropdown Section ── */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Type of Call <span style={{ color: '#ef4444' }}>*</span></label>
                    <select 
                        value={callType} 
                        onChange={e => handleCallTypeChange(e.target.value)} 
                        style={{ width: '300px', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#1e293b', background: '#fff', fontSize: '14px', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    >
                        <option value="">Select Type of Call</option>
                        <option value="PROCESS">Process</option>
                        <option value="FINAL">Final</option>
                    </select>
                </div>

                {/* ── Inline block warning ── */}
                {callType === 'PROCESS' && isProcessBlocked && (
                    <div style={{ margin: '0 20px 4px', padding: '12px 16px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                        <div>
                            <div style={{ fontWeight: 700, color: '#92400e', fontSize: '13px' }}>Process Call Awaiting Verification / Scheduling</div>
                            <div style={{ color: '#78350f', fontSize: '12px', marginTop: '4px' }}>
                                A Process inspection call for SR No. {srKey} is currently under review or awaiting scheduling. You can raise a new Process call once the existing call proceeds to inspection, is cancelled, or withdrawn.
                            </div>
                        </div>
                    </div>
                )}
                {callType === 'FINAL' && isFinalBlocked && (
                    <div style={{ margin: '0 20px 4px', padding: '12px 16px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                        <div>
                            <div style={{ fontWeight: 700, color: '#92400e', fontSize: '13px' }}>Final Call Awaiting Verification / Scheduling</div>
                            <div style={{ color: '#78350f', fontSize: '12px', marginTop: '4px' }}>
                                A Final inspection call for SR No. {srKey} is currently under review or awaiting scheduling. You can raise a new Final call once the existing call proceeds to inspection, is cancelled, or withdrawn.
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Dynamic Content ── */}
                <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {callType === '' && (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                            <Package size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#334155' }}>Select a Call Type</h3>
                            <p style={{ margin: 0, fontSize: '13px' }}>Please select the type of call from the dropdown above to proceed.</p>
                        </div>
                    )}
                    {callType === 'PROCESS' && !isProcessBlocked && <RaiseRailPadProcessCallForm {...props} isWrapped />}
                    {callType === 'FINAL'   && !isFinalBlocked   && <RaiseRailPadInspectionCallForm {...props} isWrapped />}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default RaiseRailPadCallWrapper;
