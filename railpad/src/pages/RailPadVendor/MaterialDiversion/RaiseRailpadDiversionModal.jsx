/*
 * Rail Pad "Raise Material Diversion Request" form, laid out the same as the ERC form
 * (Vendor-Frontend src/components/diversion/RaiseDiversionRequestModal.jsx): same sections, dropdowns,
 * line table and styles. Data and APIs are Rail Pad's (railpad/src/services/diversionService.js).
 * Stages: PROCESS (RPP IC) / FINAL (RPF IC); lines are lots (Final) or batches (Process).
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import diversionService, { diversionErrorMessage } from '../../../services/diversionService';
import poAssignedService from '../../../services/poAssignedService';
import { API_BASE_URL } from '../../../services/config';
import './ercDiversionForm.css';

const authHeaders = () => {
  const token = localStorage.getItem('railpad_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatPoAndItem = (poNo, poSerialNo) => {
  if (!poNo && !poSerialNo) return '-';
  const cleanPo = String(poNo || '').trim();
  const rawSr = String(poSerialNo || '').trim();
  if (rawSr.includes('/')) {
    const parts = rawSr.split('/');
    return cleanPo ? `${cleanPo}/${parts[parts.length - 1]}` : rawSr;
  }
  if (cleanPo && rawSr) return `${cleanPo}/${rawSr}`;
  return cleanPo || rawSr;
};

const normalizeSerial = (sr) => {
  if (sr === null || sr === undefined) return '';
  const s = String(sr).trim();
  const last = s.includes('/') ? s.split('/').pop() : s;
  const parsed = parseInt(last, 10);
  return isNaN(parsed) ? last.toLowerCase() : String(parsed);
};

const useClickOutside = (ref, onOutside) => {
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onOutside(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
};

/* ---------- Dropdowns (same look and behaviour as ERC) ---------- */

const SearchableIcDropdown = ({ options = [], value = '', onChange, placeholder, loading = false, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  useClickOutside(containerRef, () => setIsOpen(false));

  const selectedOption = useMemo(() => options.find((o) => o.certificateNo === value), [options, value]);
  const filteredOptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return options;
    return options.filter((o) =>
      [o.certificateNo, o.poNo, o.poSerialNo, o.callNo, o.availableBalanceQty].some((v) => String(v ?? '').toLowerCase().includes(term)));
  }, [options, searchTerm]);

  const toggle = () => {
    if (disabled) return;
    if (!isOpen) { setSearchTerm(''); setTimeout(() => inputRef.current?.focus(), 60); }
    setIsOpen(!isOpen);
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div className={`searchable-select-trigger ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`} onClick={toggle} tabIndex={disabled ? -1 : 0} role="button">
        <div className="searchable-select-trigger-content">
          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span className="searchable-select-ic-badge">{selectedOption.certificateNo}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>({formatPoAndItem(selectedOption.poNo, selectedOption.poSerialNo)})</span>
              </div>
              <span className="searchable-select-bal-badge">Bal: {selectedOption.availableBalanceQty} {selectedOption.unitOfMeasurement || 'Nos'}</span>
            </div>
          ) : value ? (
            <span className="searchable-select-ic-badge">{value}</span>
          ) : (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(selectedOption || value) && !disabled && (
            <button type="button" className="searchable-select-clear-btn" title="Clear selection" onClick={(e) => { e.stopPropagation(); onChange(''); }}>✕</button>
          )}
          <span className={`searchable-select-chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {isOpen && (
        <div className="searchable-select-menu">
          <div className="searchable-select-search-box">
            <span className="searchable-select-search-icon">🔍</span>
            <input ref={inputRef} type="text" className="searchable-select-search-input" placeholder="Search by IC No, PO No, Item Sr..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClick={(e) => e.stopPropagation()} />
            {searchTerm && <button type="button" className="searchable-select-clear-btn" onClick={() => setSearchTerm('')}>✕</button>}
          </div>
          <div className="searchable-select-options">
            {loading ? (
              <div className="searchable-select-empty">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Loading ICs...
                </span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">
                <span>No matching source ICs found</span>
                <small style={{ color: '#cbd5e1' }}>Only issued ICs with balance left can be diverted</small>
              </div>
            ) : (
              filteredOptions.map((ic) => (
                <div key={ic.certificateNo} className={`searchable-select-option ${ic.certificateNo === value ? 'selected' : ''}`}
                  onClick={() => { onChange(ic.certificateNo); setIsOpen(false); setSearchTerm(''); }}>
                  <div className="searchable-select-option-header">
                    <span className="searchable-select-ic-badge">{ic.certificateNo}</span>
                    <span className="searchable-select-bal-badge">Bal: {ic.availableBalanceQty} {ic.unitOfMeasurement || 'Nos'}</span>
                  </div>
                  <div className="searchable-select-option-sub">
                    <span>📄 PO / Item: <strong>{formatPoAndItem(ic.poNo, ic.poSerialNo)}</strong></span>
                    {ic.callNo && ic.callNo !== ic.certificateNo && <span>📞 Call: {ic.callNo}</span>}
                  </div>
                  {ic.ieName && (
                    <div className="searchable-select-option-sub" style={{ marginTop: '2px', gap: '12px' }}>
                      <span style={{ color: '#0f172a', fontSize: '11px' }}>👤 IE: <strong>{ic.ieName}</strong></span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/** Dropdown; shows a search box when it has more than 5 options (or searchable is set). */
const ModernSelect = ({ options = [], value = '', onChange, placeholder = '-- Select an option --', disabled = false, searchable, searchPlaceholder = 'Search...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  useClickOutside(containerRef, () => setIsOpen(false));
  const selectedOption = useMemo(() => options.find((o) => o.value === value) || null, [options, value]);
  const showSearch = searchable ?? options.length > 5;
  const visibleOptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!showSearch || !term) return options;
    return options.filter((o) => [o.label, o.subtext, o.value].some((v) => String(v || '').toLowerCase().includes(term)));
  }, [options, searchTerm, showSearch]);

  const toggle = () => {
    if (disabled) return;
    if (!isOpen) { setSearchTerm(''); if (showSearch) setTimeout(() => inputRef.current?.focus(), 60); }
    setIsOpen(!isOpen);
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div className={`searchable-select-trigger ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`} onClick={toggle} tabIndex={disabled ? -1 : 0} role="button">
        <div className="searchable-select-trigger-content">
          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedOption.icon && <span className="modern-select-icon">{selectedOption.icon}</span>}
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedOption.label}</span>
            </div>
          ) : (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {selectedOption && !disabled && (
            <button type="button" className="searchable-select-clear-btn" title="Clear selection" onClick={(e) => { e.stopPropagation(); onChange(''); }}>✕</button>
          )}
          <span className={`searchable-select-chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>
      {isOpen && !disabled && (
        <div className="searchable-select-menu">
          {showSearch && (
            <div className="searchable-select-search-box">
              <span className="searchable-select-search-icon">🔍</span>
              <input ref={inputRef} type="text" className="searchable-select-search-input" placeholder={searchPlaceholder}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClick={(e) => e.stopPropagation()} />
              {searchTerm && <button type="button" className="searchable-select-clear-btn" onClick={() => setSearchTerm('')}>✕</button>}
            </div>
          )}
          <div className="searchable-select-options">
            {visibleOptions.length === 0 ? (
              <div className="searchable-select-empty">
                <span>{options.length === 0 ? 'No options available' : 'No matches found'}</span>
                {options.length > 0 && <small style={{ color: '#cbd5e1' }}>Try a different search</small>}
              </div>
            ) : visibleOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div key={opt.value} className={`modern-select-item ${isSelected ? 'selected' : ''}`} onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}>
                  {opt.icon && <span className="modern-select-icon">{opt.icon}</span>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: isSelected ? 600 : 400 }}>{opt.label}</div>
                    {opt.subtext && <div style={{ fontSize: '11px', color: '#64748b' }}>{opt.subtext}</div>}
                  </div>
                  {isSelected && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchablePoDropdown = ({ options = [], value = '', onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  useClickOutside(containerRef, () => setIsOpen(false));

  const selectedOption = useMemo(() => options.find((o) => o.poNo === value), [options, value]);
  const filteredOptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return options;
    return options.filter((o) => [o.poNo, o.rlyShortName, o.poDes].some((v) => String(v || '').toLowerCase().includes(term)));
  }, [options, searchTerm]);

  const toggle = () => {
    if (!isOpen) { setSearchTerm(''); setTimeout(() => inputRef.current?.focus(), 60); }
    setIsOpen(!isOpen);
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div className={`searchable-select-trigger ${isOpen ? 'active' : ''}`} onClick={toggle} tabIndex={0} role="button">
        <div className="searchable-select-trigger-content">
          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span className="searchable-select-ic-badge" style={{ color: '#0f172a' }}>{selectedOption.poNo}</span>
                {selectedOption.rlyShortName && (
                  <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{selectedOption.rlyShortName}</span>
                )}
              </div>
              {selectedOption.qty ? (
                <span className="searchable-select-bal-badge" style={{ background: '#f0f9ff', color: '#0369a1' }}>Qty: {selectedOption.qty} {selectedOption.unit || 'NOS'}</span>
              ) : null}
            </div>
          ) : value ? (
            <span className="searchable-select-ic-badge" style={{ color: '#0f172a' }}>{value}</span>
          ) : (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selectedOption && (
            <button type="button" className="searchable-select-clear-btn" title="Clear selection" onClick={(e) => { e.stopPropagation(); onChange(''); }}>✕</button>
          )}
          <span className={`searchable-select-chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>
      {isOpen && (
        <div className="searchable-select-menu">
          <div className="searchable-select-search-box">
            <span className="searchable-select-search-icon">🔍</span>
            <input ref={inputRef} type="text" className="searchable-select-search-input" placeholder="Search by PO number, zone, description..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClick={(e) => e.stopPropagation()} />
            {searchTerm && <button type="button" className="searchable-select-clear-btn" onClick={() => setSearchTerm('')}>✕</button>}
          </div>
          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty"><span>No matching POs found</span><small style={{ color: '#cbd5e1' }}>Try searching with a different term</small></div>
            ) : filteredOptions.map((po) => (
              <div key={po.poNo} className={`searchable-select-option ${po.poNo === value ? 'selected' : ''}`} onClick={() => { onChange(po.poNo); setIsOpen(false); setSearchTerm(''); }}>
                <div className="searchable-select-option-header">
                  <span className="searchable-select-ic-badge" style={{ color: '#0f172a' }}>{po.poNo}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {po.rlyShortName && <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{po.rlyShortName}</span>}
                    {po.qty ? <span className="searchable-select-bal-badge" style={{ background: '#f0f9ff', color: '#0369a1' }}>{po.qty} {po.unit || 'NOS'}</span> : null}
                  </div>
                </div>
                {po.poDes && <div style={{ fontSize: '11.5px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{po.poDes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchablePoItemDropdown = ({ options = [], value = '', onChange, placeholder, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  useClickOutside(containerRef, () => setIsOpen(false));
  const selectedOption = useMemo(() => options.find((o) => String(o.poSerialNo) === String(value)), [options, value]);

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div className={`searchable-select-trigger ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`} onClick={() => !disabled && setIsOpen(!isOpen)} tabIndex={disabled ? -1 : 0} role="button">
        <div className="searchable-select-trigger-content">
          {selectedOption || value ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>🔢</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOption ? selectedOption.poSerialNo : value}</span>
              {selectedOption?.poDes && (
                <span style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>({selectedOption.poDes})</span>
              )}
            </div>
          ) : (
            <span style={{ color: '#94a3b8' }}>{disabled ? 'Select Target PO first' : placeholder}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selectedOption && !disabled && (
            <button type="button" className="searchable-select-clear-btn" title="Clear selection" onClick={(e) => { e.stopPropagation(); onChange(''); }}>✕</button>
          )}
          <span className={`searchable-select-chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>
      {isOpen && !disabled && (
        <div className="searchable-select-menu">
          <div className="searchable-select-options">
            {options.length === 0 ? (
              <div className="searchable-select-empty"><span>No available item serial numbers</span><small style={{ color: '#94a3b8' }}>Same source PO & Item Sr is excluded from target</small></div>
            ) : options.map((opt) => {
              const isSelected = String(opt.poSerialNo) === String(value);
              return (
                <div key={opt.poSerialNo} className={`modern-select-item ${isSelected ? 'selected' : ''}`} onClick={() => { onChange(opt.poSerialNo); setIsOpen(false); }}>
                  <span style={{ fontSize: '14px' }}>🔢</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>Item Sr: {opt.poSerialNo}</div>
                    {opt.poDes && <div style={{ fontSize: '11px', color: '#64748b' }}>{opt.poDes}</div>}
                  </div>
                  {opt.orderedQty ? <span className="searchable-select-bal-badge" style={{ background: '#f8fafc', color: '#475569' }}>Qty: {opt.orderedQty}</span> : null}
                  {isSelected && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Form ---------- */

const STAGE_OPTIONS = [
  { value: 'PROCESS', label: 'Process Inspection', icon: '⚙️', subtext: 'RPP IC: in-process rail pad batches' },
  { value: 'FINAL', label: 'Final Inspection', icon: '🏷️', subtext: 'RPF IC: finished rail pad lots' },
];
const REASON_OPTIONS = [
  { value: 'PO_CANCELLATION', label: 'PO Cancellation', icon: '🔄' },
  { value: 'PO_QUANTITY_REVISION', label: 'PO Quantity Revision', icon: '🔄' },
];
const UNIT_OPTIONS = [
  { value: 'Nos', label: 'Nos', icon: '🔢', subtext: 'Numbers' },
  { value: 'Sets', label: 'Sets', icon: '📦', subtext: 'NCRGRSP sets' },
];
const lineKey = (l) => `${l.lotNo || ''}|${l.batchNo || ''}`;
const num = (v) => Number(v || 0);

/**
 * Props (same as the old inline form): initial (request to edit, or null), plantId, vendorCode,
 * onClose, onSaved, showToast(msg, type).
 */
const RaiseRailpadDiversionModal = ({ initial, plantId, vendorCode, onClose, onSaved, showToast }) => {
  const isEditMode = Boolean(initial?.id);
  const [stage, setStage] = useState(initial?.stage || 'FINAL');
  const [cmUserId, setCmUserId] = useState(initial?.cmUserId ? String(initial.cmUserId) : '');
  const [unitOfMeasurement, setUnitOfMeasurement] = useState(initial?.unitOfMeasurement || 'Nos');
  const [selectedIcNo, setSelectedIcNo] = useState(initial?.sourceIcNo || '');
  const [targetPoNo, setTargetPoNo] = useState(initial?.targetPoNo || '');
  const [targetPoSrNo, setTargetPoSrNo] = useState(initial?.targetPoSrNo || '');
  const [diversionType, setDiversionType] = useState(initial?.diversionType || 'PARTIAL');
  const [reasonCode, setReasonCode] = useState(initial?.reasonCode || '');
  const [reasonRemarks, setReasonRemarks] = useState(initial?.reasonRemarks || '');
  const [railwayPermissionNo, setRailwayPermissionNo] = useState(initial?.railwayPermissionNo || '');
  const [railwayPermissionDate, setRailwayPermissionDate] = useState(initial?.railwayPermissionDate ? String(initial.railwayPermissionDate).slice(0, 10) : '');
  const [railwayPermissionDocUrl, setRailwayPermissionDocUrl] = useState(initial?.railwayPermissionDocUrl || '');
  const [railwayDocFileName, setRailwayDocFileName] = useState(initial?.railwayPermissionDocUrl ? 'Already uploaded' : '');
  const [railwayDocUploading, setRailwayDocUploading] = useState(false);
  const [vendorRemarks, setVendorRemarks] = useState(initial?.vendorRemarks || '');

  const [eligibleIcs, setEligibleIcs] = useState([]);
  const [loadingIcs, setLoadingIcs] = useState(false);
  const [lineItems, setLineItems] = useState([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [vendorPos, setVendorPos] = useState([]);
  const [cmList, setCmList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Vendor POs and controlling managers
  useEffect(() => {
    poAssignedService.getPoAssigned(vendorCode)
      .then((res) => setVendorPos(Array.isArray(res) ? res : (res?.data || [])))
      .catch(() => setVendorPos([]));
    fetch(`${API_BASE_URL}/auth/api/controlling-managers`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => setCmList(j?.responseData || j?.data || (Array.isArray(j) ? j : [])))
      .catch(() => setCmList([]));
  }, [vendorCode]);

  // Issued ICs with balance, for the stage and plant
  useEffect(() => {
    setLoadingIcs(true);
    diversionService.getEligibleSourceIcs(plantId, stage)
      .then((list) => setEligibleIcs((list || []).map((i) => ({
        ...i,
        certificateNo: i.icNo || i.callNo,
        poSerialNo: i.poSrNo,
        availableBalanceQty: i.availableQty,
        unitOfMeasurement: i.unitOfMeasurement || unitOfMeasurement,
      }))))
      .catch((e) => { setEligibleIcs([]); showToast(diversionErrorMessage(e), 'error'); })
      .finally(() => setLoadingIcs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, plantId]);

  // Lot / batch lines of the chosen IC
  useEffect(() => {
    if (!selectedIcNo) { setLineItems([]); return; }
    setLoadingLines(true);
    diversionService.getSourceIcLines(selectedIcNo, stage, initial?.id || undefined)
      .then((lines) => {
        const pre = {};
        (initial?.items || []).forEach((it) => { pre[lineKey(it)] = num(it.diversionQty); });
        setLineItems((lines || []).map((l) => {
          const avail = num(l.availableQty);
          // Partial: the vendor types the qty (box starts empty); Complete: the full available balance
          const qty = diversionType === 'COMPLETE' ? avail : (pre[lineKey(l)] ?? '');
          return { ...l, availableBalanceQty: avail, diversionQty: qty, remainingBalanceQty: avail - num(qty) };
        }));
      })
      .catch((e) => { setLineItems([]); showToast(diversionErrorMessage(e), 'error'); })
      .finally(() => setLoadingLines(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIcNo, stage]);

  const selectedIcDetails = useMemo(() => eligibleIcs.find((i) => i.certificateNo === selectedIcNo) || null, [eligibleIcs, selectedIcNo]);

  const poOptions = useMemo(() => vendorPos.map((p) => {
    const items = p.poItem || p.srItems || [];
    return {
      poNo: p.poNo,
      rlyShortName: p.rlyShortName || p.zoneName || '',
      qty: p.qty || p.totalQty || items.reduce((s, it) => s + num(it.qty || it.orderedQty), 0) || '',
      unit: p.unit || 'NOS',
      poDes: p.poDes || p.description || '',
      items,
    };
  }), [vendorPos]);

  const availableTargetPoItems = useMemo(() => {
    const po = poOptions.find((p) => p.poNo === targetPoNo);
    if (!po) return [];
    return po.items.map((it) => ({
      poSerialNo: String(it.itemSrNo || it.srNo || (it.poSerialNo ? String(it.poSerialNo).split('/').pop() : '')).trim(),
      poDes: it.itemDesc || it.description || it.poDes || '',
      orderedQty: it.qty || it.orderedQty || '',
    })).filter((it) => it.poSerialNo)
      // the source PO serial itself cannot be the target
      .filter((it) => !(selectedIcDetails && targetPoNo === selectedIcDetails.poNo
        && normalizeSerial(it.poSerialNo) === normalizeSerial(selectedIcDetails.poSerialNo)));
  }, [poOptions, targetPoNo, selectedIcDetails]);

  const cmOptions = useMemo(() => cmList.map((cm) => ({
    value: String(cm.userId),
    label: cm.fullName || cm.username || `CM #${cm.userId}`,
    icon: '👤',
    subtext: cm.employeeCode ? `${cm.employeeCode} · ${cm.rio || ''}` : (cm.rio || ''),
  })), [cmList]);

  const calculateTotalDiversion = () => lineItems.reduce((s, i) => s + num(i.diversionQty), 0);

  const handleIcChange = (icNo) => { setSelectedIcNo(icNo); setLineItems([]); };

  const handleQtyChange = (idx, raw) => {
    setLineItems((items) => items.map((it, i) => {
      if (i !== idx) return it;
      const v = raw === '' ? '' : Math.max(0, Math.floor(num(raw)));
      return { ...it, diversionQty: v, remainingBalanceQty: it.availableBalanceQty - num(v) };
    }));
  };

  const setType = (type) => {
    setDiversionType(type);
    setLineItems((items) => items.map((i) => (type === 'COMPLETE'
      ? { ...i, diversionQty: i.availableBalanceQty, remainingBalanceQty: 0 }
      : { ...i, diversionQty: '', remainingBalanceQty: i.availableBalanceQty })));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) { showToast('Upload the railway permission letter as a PDF', 'error'); e.target.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { showToast('The PDF must be 5 MB or smaller', 'error'); e.target.value = ''; return; }
    setRailwayDocUploading(true);
    setRailwayDocFileName(file.name);
    try {
      const res = await diversionService.uploadRailwayDoc(file);
      setRailwayPermissionDocUrl(res?.url || '');
    } catch (err) {
      setRailwayPermissionDocUrl('');
      setRailwayDocFileName('');
      showToast(diversionErrorMessage(err), 'error');
    } finally {
      setRailwayDocUploading(false);
    }
  };

  const viewIcCertificate = async () => {
    const token = selectedIcDetails?.certificateNo || selectedIcNo;
    if (!token) { showToast('Select a source IC first', 'error'); return; }
    try {
      const res = await axios.get(`${API_BASE_URL}/certificate-storage/view`, { params: { icNumber: token }, headers: authHeaders() });
      const cert = res?.data?.responseData || res?.data;
      if (cert?.signedData) {
        const b64 = String(cert.signedData).replace(/^data:application\/pdf;base64,/, '').trim();
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        window.open(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), '_blank');
      } else if (cert?.url) {
        window.open(cert.url, '_blank');
      } else {
        showToast('The IC certificate is not available in storage', 'error');
      }
    } catch {
      showToast('Could not open the IC certificate', 'error');
    }
  };

  const handleSubmit = async () => {
    const missing = [];
    if (!cmUserId) missing.push('Controlling Manager');
    if (!selectedIcNo) missing.push('Source IC');
    if (!targetPoNo || !targetPoSrNo) missing.push('Target PO and Item Sr.');
    if (!reasonCode) missing.push('Reason');
    if (!railwayPermissionNo || !railwayPermissionDate) missing.push('Railway approval letter no. and date');
    if (!railwayPermissionDocUrl) missing.push('Railway permission PDF');
    if (missing.length) { showToast(`Fill in: ${missing.join(', ')}`, 'error'); return; }
    const over = lineItems.find((i) => num(i.diversionQty) > num(i.availableBalanceQty));
    if (over) { showToast(`Qty for ${over.lotNo ? `lot ${over.lotNo}` : `batch ${over.batchNo}`} is more than available ${over.availableBalanceQty}`, 'error'); return; }
    if (calculateTotalDiversion() <= 0) { showToast('Enter a diversion quantity for at least one lot / batch', 'error'); return; }

    setIsLoading(true);
    try {
      const dto = {
        id: initial?.id || null,
        stage, diversionType, plantId, cmUserId, sourceIcNo: selectedIcNo,
        targetPoNo, targetPoSrNo, unitOfMeasurement, reasonCode, reasonRemarks,
        railwayPermissionNo, railwayPermissionDate, railwayPermissionDocUrl, vendorRemarks,
        items: lineItems
          .map((l) => ({ lotNo: l.lotNo, batchNo: l.batchNo, diversionQty: num(l.diversionQty) }))
          .filter((i) => i.diversionQty > 0),
      };
      if (isEditMode) await diversionService.update(initial.id, dto);
      else await diversionService.submit(dto);
      showToast(isEditMode ? 'Diversion request updated' : 'Diversion request submitted to the Controlling Manager', 'success');
      onSaved();
    } catch (e) {
      showToast(diversionErrorMessage(e), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const lotLabel = stage === 'PROCESS' ? 'Batch No.' : 'Lot No.';
  const unit = unitOfMeasurement || 'Nos';

  return (
    <div className="diversion-modal-overlay">
      <div className="diversion-modal-content rp-div-form">
        <div className="diversion-modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
              {isEditMode ? 'Modify Diversion Request' : 'Raise Material Diversion Request'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Transfer inspected & accepted rail pads to a target PO without repeating testing
            </p>
          </div>
          <button type="button" className="diversion-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Section 1: Stage & Authority */}
        <div className="diversion-card">
          <div className="diversion-card-title">1. Stage & Controlling Authority</div>
          <div className="rp-div-grid-2">
            <div className="diversion-form-group">
              <label className="diversion-form-label">Inspection Stage</label>
              <ModernSelect options={STAGE_OPTIONS} value={stage} placeholder="-- Select Inspection Stage --" disabled={isEditMode}
                onChange={(val) => { setStage(val || 'FINAL'); setSelectedIcNo(''); setLineItems([]); }} />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Manufacturing Plant</label>
              <div className="diversion-readonly-field">
                <span style={{ fontSize: '15px' }}>🏭</span>
                <span className="diversion-readonly-tag">{plantId || '—'}</span>
                <span className="rp-div-hint">{plantId ? 'Selected plant' : 'Choose a plant on the dashboard'}</span>
              </div>
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Unit of Measurement</label>
              <ModernSelect options={UNIT_OPTIONS} value={unitOfMeasurement} placeholder="-- Select Unit --" onChange={(v) => setUnitOfMeasurement(v || 'Nos')} />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Controlling Manager *</label>
              <ModernSelect options={cmOptions} value={cmUserId} placeholder="-- Select Controlling Manager --" onChange={setCmUserId}
                searchable searchPlaceholder="Search by name, employee code, RIO..." />
            </div>
          </div>
        </div>

        {/* Section 2: Source IC & Target PO */}
        <div className="diversion-card">
          <div className="diversion-card-title">2. Source IC & Target PO Selection</div>
          <div className="rp-div-grid-2">
            <div className="diversion-form-group diversion-grid-span-2">
              <label className="diversion-form-label">Source IC Number *</label>
              <SearchableIcDropdown options={eligibleIcs} value={selectedIcNo} onChange={handleIcChange} loading={loadingIcs} disabled={isEditMode}
                placeholder={`-- Search & Select Issued ${stage === 'PROCESS' ? 'RPP' : 'RPF'} IC --`} />
            </div>
            <div className="diversion-form-group diversion-grid-span-2">
              <label className="diversion-form-label">Source PO & Item Sr.</label>
              <div className="diversion-readonly-field">
                <span style={{ fontSize: '14px' }}>📄</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {selectedIcDetails ? formatPoAndItem(selectedIcDetails.poNo, selectedIcDetails.poSerialNo)
                    : (isEditMode && initial?.sourcePoNo ? formatPoAndItem(initial.sourcePoNo, initial.sourcePoSrNo) : 'Auto-filled on IC selection')}
                </span>
              </div>
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Target PO Number *</label>
              <SearchablePoDropdown options={poOptions} value={targetPoNo} placeholder="-- Search & Select Target PO --"
                onChange={(v) => { setTargetPoNo(v); setTargetPoSrNo(''); }} />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Target PO Item Sr. *</label>
              <SearchablePoItemDropdown options={availableTargetPoItems} value={targetPoSrNo} onChange={setTargetPoSrNo}
                placeholder="-- Select Target Item Sr --" disabled={!targetPoNo} />
            </div>
          </div>
        </div>

        {/* Section 3: Material Line Quantities */}
        {selectedIcNo && (
          <div className="diversion-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <div className="diversion-card-title" style={{ margin: 0 }}>3. Material Line Quantities</div>
              <div className="rp-div-type">
                <label>
                  <input type="radio" name="rpDiversionType" checked={diversionType === 'PARTIAL'} onChange={() => setType('PARTIAL')} /> Partial Diversion
                </label>
                <label>
                  <input type="radio" name="rpDiversionType" checked={diversionType === 'COMPLETE'} onChange={() => setType('COMPLETE')} /> Complete Diversion
                </label>
              </div>
            </div>

            {selectedIcNo && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', padding: '10px 16px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', borderRadius: '10px', border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(59,130,246,0.08)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                  {selectedIcDetails?.ieName ? (
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Certificate Generated By</div>
                      <div style={{ fontSize: '13px', color: '#1e40af', fontWeight: 700, marginTop: '1px' }}>{selectedIcDetails.ieName}</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 500 }}>Source IC Selected</span>
                  )}
                </div>
                <button type="button" onClick={viewIcCertificate}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fff', background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', border: 'none', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(2,132,199,0.3)', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                  View IC Certificate
                </button>
              </div>
            )}

            {loadingLines ? (
              <div className="searchable-select-empty" style={{ padding: '24px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Loading {stage === 'PROCESS' ? 'batches' : 'lots'} of {selectedIcNo}...
                </span>
              </div>
            ) : lineItems.length === 0 ? (
              <div className="searchable-select-empty" style={{ padding: '24px' }}>
                <span>No {stage === 'PROCESS' ? 'batches' : 'lots'} with balance left on this IC</span>
                <small style={{ color: '#94a3b8' }}>Everything on it has already been used or diverted</small>
              </div>
            ) : (<>
            <div className="diversion-table-wrapper" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <table className="diversion-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '640px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {[
                      lotLabel,
                      `Total Accepted (${unit})`,
                      ...(diversionType === 'PARTIAL' ? [stage === 'PROCESS' ? 'Used in Final Calls' : 'Already Diverted'] : []),
                      'Available Balance',
                      'Diversion Qty Intended *',
                      ...(diversionType === 'PARTIAL' ? ['Remaining Source Balance'] : []),
                    ].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={lineKey(item)} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1e293b', verticalAlign: 'middle' }}>{item.lotNo || item.batchNo || '-'}</td>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#334155', verticalAlign: 'middle' }}>{item.acceptedQty}</td>
                      {diversionType === 'PARTIAL' && (
                        <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: '500', verticalAlign: 'middle' }}>
                          {stage === 'PROCESS' ? (item.downstreamConsumedQty ?? 0) : (item.alreadyDivertedQty ?? 0)}
                        </td>
                      )}
                      <td style={{ padding: '14px 16px', color: '#0284c7', fontWeight: '700', fontSize: '13.5px', verticalAlign: 'middle' }}>{item.availableBalanceQty}</td>
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <input type="number" step="1" min="0" max={item.availableBalanceQty} className="diversion-input"
                          style={{ width: '100%', maxWidth: '135px', padding: '7px 12px', fontSize: '13px', fontWeight: '600', borderRadius: '7px', background: diversionType === 'COMPLETE' ? '#f8fafc' : '#ffffff', border: '1px solid #cbd5e1' }}
                          value={item.diversionQty} disabled={diversionType === 'COMPLETE'} onChange={(e) => handleQtyChange(idx, e.target.value)} />
                      </td>
                      {diversionType === 'PARTIAL' && (
                        <td style={{ padding: '14px 16px', fontWeight: '600', color: '#475569', verticalAlign: 'middle' }}>{item.remainingBalanceQty ?? item.availableBalanceQty}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '14px', padding: '10px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '600' }}>Total Diversion Quantity:</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0284c7' }}>{calculateTotalDiversion().toLocaleString('en-IN')} {unit}</span>
            </div>
            </>)}
          </div>
        )}

        {/* Section 4: Railway Permission & Reason */}
        <div className="diversion-card">
          <div className="diversion-card-title">4. Railway Permission & Reason</div>
          <div className="rp-div-grid-2">
            <div className="diversion-form-group">
              <label className="diversion-form-label">Reason for Diversion *</label>
              <ModernSelect options={REASON_OPTIONS} value={reasonCode} placeholder="-- Select Reason for Diversion --" onChange={setReasonCode} />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Railway Approval Letter No. *</label>
              <input className="diversion-input" placeholder="Letter Ref No." maxLength={100} value={railwayPermissionNo} onChange={(e) => setRailwayPermissionNo(e.target.value)} />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Approval Date *</label>
              <input type="date" className="diversion-input" max={new Date().toISOString().slice(0, 10)} value={railwayPermissionDate} onChange={(e) => setRailwayPermissionDate(e.target.value)} />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label" htmlFor="rp-div-railway-doc">Railway Permission Letter (PDF) *</label>
              {/* Styled upload box (same height as the other fields); the native file input is hidden behind it */}
              <label htmlFor="rp-div-railway-doc" className={`rp-div-upload ${railwayDocUploading ? 'busy' : ''} ${railwayPermissionDocUrl && !railwayDocUploading ? 'done' : ''}`}>
                <span className="rp-div-upload-btn">{railwayPermissionDocUrl ? 'Change' : 'Choose PDF'}</span>
                <span className="rp-div-upload-name">
                  {railwayDocUploading ? `Uploading ${railwayDocFileName}…`
                    : railwayPermissionDocUrl ? `✓ ${railwayDocFileName || 'Uploaded'}`
                      : 'No file chosen'}
                </span>
              </label>
              <input id="rp-div-railway-doc" type="file" accept="application/pdf,.pdf" className="rp-div-file-hidden"
                onChange={(e) => { handleFileUpload(e); e.target.value = ''; }} disabled={railwayDocUploading} />
              <span className="rp-div-help">PDF only, max 5 MB · uploads as soon as you choose it</span>
            </div>
          </div>
          <div className="diversion-form-group" style={{ marginTop: '16px' }}>
            <label className="diversion-form-label">Reason Details</label>
            <input className="diversion-input" placeholder="Short reason details" maxLength={500} value={reasonRemarks} onChange={(e) => setReasonRemarks(e.target.value)} />
          </div>
          <div className="diversion-form-group" style={{ marginTop: '16px' }}>
            <label className="diversion-form-label">Remarks / Justification</label>
            <textarea className="diversion-textarea" rows="2" maxLength={1000} placeholder="Enter detailed justification..." value={vendorRemarks} onChange={(e) => setVendorRemarks(e.target.value)} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button type="button" className="diversion-tab-btn" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button type="button" className="diversion-btn-primary" style={{ background: '#0284c7', color: '#ffffff' }} onClick={handleSubmit} disabled={isLoading || railwayDocUploading}>
            {railwayDocUploading ? 'Uploading document…' : isLoading ? 'Submitting...' : isEditMode ? 'Update Request' : 'Submit to Controlling Manager'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaiseRailpadDiversionModal;
