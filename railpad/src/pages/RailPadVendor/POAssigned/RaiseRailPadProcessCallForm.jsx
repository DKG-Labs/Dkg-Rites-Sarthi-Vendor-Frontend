import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import inspectionCallService from '../../../services/inspectionCallService';
import {
    Calendar, Package, ClipboardList, CheckCircle2,
    AlertCircle, Plus, Search, ChevronDown, Check, X, Layers, Sparkles
} from 'lucide-react';

// ─── Constants & Master Drawing Catalog ────────────────────────────────────────
const RAIL_PAD_TYPES = [
    '6.00mm GRSP',
    '10.00mm GRSP',
    '6.20mm CGRSP',
    '10.00mm CGRSP',
    '6.00mm NCRGRSP',
    '10.00mm NCRGRSP'
];

// Unified Master NCRGRSP Main Drawings (Merged 6mm & 10mm from Official Main Drawing Specifications)
const UNIFIED_NCRGRSP_DRAWINGS = [
    { code: "RT-6154", label: "RT-6154 (1 in 12 TWB Switch for 60 Kg)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-6155", label: "RT-6155 (1 in 12 60kg TWS Drg. No. T-6155)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-8779", label: "RT-8779 (60 kg 1 in 12 Turnout per Set Alt-3)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-9774", label: "RT-9774 (TWS 60 Kg 1 in 8.5 Alt-2)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-4218", label: "RT-4218 (60 kg 1 in 12 Turnout Alt.6)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-4865 Alt-8", label: "RT-4865 Alt-8 (6 mm 1 in 8.5 Turnout with 60E1 rail Alt-8)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-4865 Alt-9", label: "RT-4865 Alt-9 (6 mm Thick Pocket Type 1 in 8.5 Alt-09)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-4220", label: "RT-4220 (6 mm Turnout)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-4967", label: "RT-4967 (6 mm Turnout)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-6068", label: "RT-6068 (6 mm Derailing Switch 1 in 8.5)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-8893 to RT-8905", label: "RT-8893 to RT-8905 (Turnout Series)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-8886 to RT-8889", label: "RT-8886 to RT-8889 (Turnout Series)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-4734", label: "RT-4734 (1 in 12 CMS x-ing B.G. for 52 Kg)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-4733", label: "RT-4733 (1 in 12 O.R. T/out for 52 Kg)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-4867", label: "RT-4867 (1 in 8.5 T/out for 52 Kg)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-5691", label: "RT-5691 (6 mm Thick 1 in 16 Turnout ORS)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-5693", label: "RT-5693 (6 mm Thick CMS Crossing 1 in 16)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-10241", label: "RT-10241 (6 mm Thick TWS 1 in 16 Turnout, 60 kg)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-10243", label: "RT-10243 (6 mm Thick CMS Crossing 1 in 16, 60 kg)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-8822", label: "RT-8822 (10 mm Thick for TWSEJ)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-9790", label: "RT-9790 (Pocket Type 1 in 12 Turnout for 25T Axle Load)", category: "6mm & 10mm", is6mm: true, is10mm: true },
    { code: "RT-4732", label: "RT-4732 (6 mm Turnout)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-9841", label: "RT-9841 (10 mm 1 in 8.5 60E1 Turnout)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-5836", label: "RT-5836 (6 mm Thick NCR GRSP Turnout)", category: "6mm", is6mm: true, is10mm: false },
    { code: "RT-10070", label: "RT-10070 (10 mm Thick 1 in 16 Turnout)", category: "10mm", is6mm: false, is10mm: true },
    { code: "T-9842 to T-9843", label: "T-9842 to T-9843 (10 mm Turnout Series)", category: "10mm", is6mm: false, is10mm: true }
];

const DRAWING_MAPPING = {
    "6.00mm GRSP": [
        { code: "RDSO/T-3703", label: "RDSO/T-3703", category: "6.00mm GRSP", is6mm: true, is10mm: false },
        { code: "RDSO/T-3711", label: "RDSO/T-3711", category: "6.00mm GRSP", is6mm: true, is10mm: false }
    ],
    "10.00mm GRSP": [],
    "6.20mm CGRSP": [
        { code: "RT-6618", label: "RT-6618", category: "6.20mm CGRSP", is6mm: true, is10mm: false },
        { code: "RT-8327", label: "RT-8327", category: "6.20mm CGRSP", is6mm: true, is10mm: false }
    ],
    "10.00mm CGRSP": [
        { code: "RT-8528", label: "RT-8528", category: "10.00mm CGRSP", is6mm: false, is10mm: true },
        { code: "RT-8694", label: "RT-8694", category: "10.00mm CGRSP", is6mm: false, is10mm: true },
        { code: "RT-8747", label: "RT-8747", category: "10.00mm CGRSP", is6mm: false, is10mm: true },
        { code: "RT-8998", label: "RT-8998", category: "10.00mm CGRSP", is6mm: false, is10mm: true }
    ],
    // Both 6mm and 10mm NCRGRSP show the unified full NCRGRSP main drawings list
    "6.00mm NCRGRSP": UNIFIED_NCRGRSP_DRAWINGS,
    "10.00mm NCRGRSP": UNIFIED_NCRGRSP_DRAWINGS
};

// ─── Modern Searchable Drawing Select Component ───────────────────────────────
// ─── Modern Searchable Combobox Component ─────────────────────────────────────
const ModernSearchableDrawingSelect = ({ options = [], value, onChange, placeholder = "Type to search or select Drawing No...", isNcrgrsp = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = useMemo(() => {
        if (!value) return null;
        return options.find(opt => (typeof opt === 'string' ? opt : opt.code) === value) || { code: value, label: value };
    }, [options, value]);

    // Normalize search query
    const cleanSearch = searchTerm.replace(/^(RDSO\/|RDSO-|RT-|T-)/i, '').trim().toLowerCase();

    // Filter options
    const filteredOptions = useMemo(() => {
        return options.filter(opt => {
            const code = typeof opt === 'string' ? opt : opt.code || '';
            const label = typeof opt === 'string' ? opt : opt.label || opt.code || '';
            const is6mm = typeof opt === 'object' ? opt.is6mm : true;
            const is10mm = typeof opt === 'object' ? opt.is10mm : true;
            const category = typeof opt === 'object' ? opt.category : '';

            // Filter Tab check (only active for NCRGRSP)
            if (isNcrgrsp) {
                if (activeFilter === '6MM' && !is6mm) return false;
                if (activeFilter === '10MM' && !is10mm) return false;
                if (activeFilter === 'BOTH' && category !== '6mm & 10mm') return false;
            }

            if (!cleanSearch) return true;

            const cleanCode = code.replace(/^(RDSO\/|RDSO-|RT-|T-)/i, '').toLowerCase();
            return cleanCode.includes(cleanSearch) || 
                   code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   label.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [options, searchTerm, cleanSearch, activeFilter, isNcrgrsp]);

    const handleSelect = (code) => {
        onChange(code);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
        if (inputRef.current) inputRef.current.focus();
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            {/* ── Main Input Box ── */}
            <div
                onClick={() => {
                    setIsOpen(true);
                    if (inputRef.current) inputRef.current.focus();
                }}
                style={{
                    height: '38px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: isOpen ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isOpen ? '0 0 0 3px rgba(14, 165, 233, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                    cursor: 'text'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                    <Search size={15} style={{ color: isOpen ? '#0ea5e9' : '#94a3b8', flexShrink: 0 }} />
                    
                    {isOpen ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={value ? `Current: ${value} (Type to search...)` : placeholder}
                            style={{
                                border: 'none',
                                outline: 'none',
                                width: '100%',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#0f172a',
                                background: 'transparent'
                            }}
                            autoFocus
                        />
                    ) : (
                        selectedOption ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                                    {selectedOption.code || value}
                                </span>
                                {isNcrgrsp && selectedOption.category && (
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: 800,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: selectedOption.category === '6mm & 10mm' ? '#ecfdf5' : (selectedOption.category === '6mm' ? '#eff6ff' : '#fef3c7'),
                                        color: selectedOption.category === '6mm & 10mm' ? '#059669' : (selectedOption.category === '6mm' ? '#2563eb' : '#d97706'),
                                        border: `1px solid ${selectedOption.category === '6mm & 10mm' ? '#a7f3d0' : (selectedOption.category === '6mm' ? '#bfdbfe' : '#fde68a')}`
                                    }}>
                                        {selectedOption.category}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>{placeholder}</span>
                        )
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            title="Clear selection"
                            style={{
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#64748b',
                                transition: 'all 0.15s'
                            }}
                        >
                            <X size={11} />
                        </button>
                    )}
                    <ChevronDown
                        size={15}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                            if (!isOpen && inputRef.current) setTimeout(() => inputRef.current.focus(), 50);
                        }}
                        style={{ color: '#64748b', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', cursor: 'pointer' }}
                    />
                </div>
            </div>

            {/* ── Dropdown Menu Popover ── */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        zIndex: 99999,
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '340px'
                    }}
                >
                    {/* Filter Tabs (Only shown for NCRGRSP) */}
                    {isNcrgrsp && (
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
                                {[
                                    { id: 'ALL', label: `All (${options.length})` },
                                    { id: 'BOTH', label: '6mm & 10mm (11)' },
                                    { id: '6MM', label: '6mm Only (11)' },
                                    { id: '10MM', label: '10mm Only (2)' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFilter(tab.id);
                                        }}
                                        style={{
                                            border: 'none',
                                            fontSize: '10.5px',
                                            fontWeight: 800,
                                            padding: '4px 9px',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            background: activeFilter === tab.id ? '#0ea5e9' : '#e2e8f0',
                                            color: activeFilter === tab.id ? '#fff' : '#475569',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Options List */}
                    <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{ padding: '20px 12px', textAlign: 'center', color: '#64748b' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>No drawings matched "{searchTerm}"</div>
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(searchTerm.trim())}
                                        style={{
                                            marginTop: '6px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            color: '#0ea5e9',
                                            background: '#e0f2fe',
                                            border: '1px solid #bae6fd',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Use custom drawing "{searchTerm.trim()}"
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredOptions.map((opt, idx) => {
                                const code = typeof opt === 'string' ? opt : opt.code;
                                const label = typeof opt === 'string' ? opt : opt.label || opt.code;
                                const isSelected = value === code;
                                const category = typeof opt === 'object' ? opt.category : null;

                                return (
                                    <div
                                        key={`${code}-${idx}`}
                                        onClick={() => handleSelect(code)}
                                        style={{
                                            padding: '7px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            background: isSelected ? '#f0f9ff' : 'transparent',
                                            borderLeft: isSelected ? '3px solid #0ea5e9' : '3px solid transparent',
                                            transition: 'background 0.1s'
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    fontWeight: isSelected ? 900 : 700,
                                                    color: isSelected ? '#0284c7' : '#1e293b'
                                                }}>
                                                    {code}
                                                </span>
                                                {isNcrgrsp && category && (
                                                    <span style={{
                                                        fontSize: '8.5px',
                                                        fontWeight: 800,
                                                        padding: '1px 5px',
                                                        borderRadius: '3px',
                                                        background: category === '6mm & 10mm' ? '#ecfdf5' : (category === '6mm' ? '#eff6ff' : '#fef3c7'),
                                                        color: category === '6mm & 10mm' ? '#059669' : (category === '6mm' ? '#2563eb' : '#d97706'),
                                                        border: `1px solid ${category === '6mm & 10mm' ? '#a7f3d0' : (category === '6mm' ? '#bfdbfe' : '#fde68a')}`
                                                    }}>
                                                        {category}
                                                    </span>
                                                )}
                                            </div>
                                            {label !== code && (
                                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {label}
                                                </span>
                                            )}
                                        </div>

                                        {isSelected && <Check size={14} style={{ color: '#0ea5e9', flexShrink: 0 }} />}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer Info */}
                    <div style={{
                        padding: '6px 10px',
                        background: '#f8fafc',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '9.5px',
                        color: '#64748b',
                        fontWeight: 700
                    }}>
                        <span>Showing {filteredOptions.length} of {options.length} {isNcrgrsp ? 'Main Drawings' : 'Drawings'}</span>
                        {isNcrgrsp && <span style={{ color: '#0ea5e9' }}>Unified NCRGRSP Catalog</span>}
                    </div>
                </div>
            )}
        </div>
    );
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
    const storageKey = useMemo(() => {
        const po = poNo ? String(poNo).replace(/[^a-zA-Z0-9_-]/g, '_') : 'PO';
        const sr = srItem?.itemSrNo || srItem?.srNo || '1';
        return `railpad_draft_process_${po}_${sr}`;
    }, [poNo, srItem?.itemSrNo, srItem?.srNo]);

    const savedDraft = useMemo(() => {
        try {
            const item = localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            return null;
        }
    }, [storageKey]);

    // Form State (Restores from draft if available, otherwise defaults)
    const [railPadType, setRailPadType] = useState(savedDraft?.railPadType || srItem?.railPadType || '');
    const [drawingNo, setDrawingNo] = useState(savedDraft?.drawingNo || srItem?.drawingNo || '');
    const [desiredQty, setDesiredQty] = useState(savedDraft?.desiredQty || '');
    const [productionDate, setProductionDate] = useState(savedDraft?.productionDate || new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState(null);

    // Persist draft to localStorage
    useEffect(() => {
        try {
            const draftData = {
                railPadType,
                drawingNo,
                desiredQty,
                productionDate
            };
            localStorage.setItem(storageKey, JSON.stringify(draftData));
        } catch (e) {
            console.warn('Error saving process call draft:', e);
        }
    }, [storageKey, railPadType, drawingNo, desiredQty, productionDate]);

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

    // Available drawings for currently selected type
    const availableDrawings = useMemo(() => {
        if (!railPadType) return [];
        return DRAWING_MAPPING[railPadType] || [];
    }, [railPadType]);

    // Handlers
    const handleRailPadChange = (e) => {
        const val = e.target.value;
        setRailPadType(val);
        setDrawingNo('');
        const drawings = DRAWING_MAPPING[val] || [];
        if (drawings.length === 1) {
            setDrawingNo(typeof drawings[0] === 'string' ? drawings[0] : drawings[0].code);
        }
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

            let result;
            if (onSubmitInspectionCall) {
                result = await onSubmitInspectionCall(payload);
            } else {
                result = await inspectionCallService.create(payload);
            }

            // Clear draft on successful submit only!
            try {
                localStorage.removeItem(storageKey);
                const wrapperKey = `railpad_draft_call_type_${String(poNo || 'PO').replace(/[^a-zA-Z0-9_-]/g, '_')}_${srItem?.itemSrNo || srItem?.srNo || '1'}`;
                localStorage.removeItem(wrapperKey);
            } catch (e) {
                console.warn('Error clearing process call draft:', e);
            }

            const callNo = result?.callNo || result?.responseData?.callNo || result?.data?.callNo || result;
            showNotification(`✅ Process Inspection Call raised successfully!\nCall No: ${callNo}`, 'success');
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
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '20px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Type of Rail Pad <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={railPadType}
                                        onChange={handleRailPadChange}
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                            padding: '0 10px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            background: '#fff',
                                            fontSize: '13px',
                                            outline: 'none',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                        }}
                                    >
                                        <option value="" disabled>Select Type</option>
                                        {RAIL_PAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Drawing No. <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    {railPadType && railPadType.includes('NCRGRSP') && (
                                        <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Sparkles size={11} /> Merged 6mm & 10mm Catalog ({UNIFIED_NCRGRSP_DRAWINGS.length})
                                        </span>
                                    )}
                                </div>

                                <ModernSearchableDrawingSelect
                                    options={availableDrawings}
                                    value={drawingNo}
                                    onChange={val => setDrawingNo(val)}
                                    placeholder={railPadType ? "Search or select Drawing No..." : "Select Type of Rail Pad first..."}
                                    isNcrgrsp={Boolean(railPadType && railPadType.includes('NCRGRSP'))}
                                />
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
