// src/components/diversion/RaiseDiversionRequestModal.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import diversionService from '../../services/diversionService';
import poiMappingService from '../../services/poiMappingService';
import poAssignedService from '../../services/poAssignedService';
import '../../styles/materialDiversion.css';

// Helper to format PO and Item Sr cleanly, e.g. 26255133103381/003
const formatPoAndItem = (poNo, poSerialNo) => {
  if (!poNo && !poSerialNo) return '-';
  const cleanPo = String(poNo || '').trim();
  const rawSr = String(poSerialNo || '').trim();

  if (rawSr.includes('/')) {
    const parts = rawSr.split('/');
    const lastPart = parts[parts.length - 1];
    return cleanPo ? `${cleanPo}/${lastPart}` : rawSr;
  }

  if (cleanPo && rawSr) {
    return `${cleanPo}/${rawSr}`;
  }
  return cleanPo || rawSr;
};

// Helper to normalize and compare serial numbers safely
const normalizeSerial = (sr) => {
  if (sr === null || sr === undefined) return '';
  const s = String(sr).trim();
  if (s.includes('/')) {
    const parts = s.split('/');
    const lastPart = parts[parts.length - 1];
    const parsed = parseInt(lastPart, 10);
    return isNaN(parsed) ? lastPart.toLowerCase() : String(parsed);
  }
  const parsed = parseInt(s, 10);
  return isNaN(parsed) ? s.toLowerCase() : String(parsed);
};

// Modern Searchable & Scrollable Dropdown for IC Selection
const SearchableIcDropdown = ({ options = [], value = '', onChange, placeholder = '-- Select Completed Source IC --' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = useMemo(() => {
    return options.find(opt => opt.certificateNo === value);
  }, [options, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter(opt =>
      (opt.certificateNo && opt.certificateNo.toLowerCase().includes(term)) ||
      (opt.poNo && String(opt.poNo).toLowerCase().includes(term)) ||
      (opt.poSerialNo && String(opt.poSerialNo).toLowerCase().includes(term)) ||
      (opt.availableBalanceQty !== undefined && String(opt.availableBalanceQty).includes(term))
    );
  }, [options, searchTerm]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (certNo) => {
    onChange(certNo);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div
        className={`searchable-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        tabIndex={0}
        role="button"
      >
        <div className="searchable-select-trigger-content">
          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span className="searchable-select-ic-badge">{selectedOption.certificateNo}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  ({formatPoAndItem(selectedOption.poNo, selectedOption.poSerialNo)})
                </span>
              </div>
              <span className="searchable-select-bal-badge">
                Bal: {selectedOption.availableBalanceQty} {selectedOption.unitOfMeasurement || 'MT'}
              </span>
            </div>
          ) : (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selectedOption && (
            <button
              type="button"
              className="searchable-select-clear-btn"
              title="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              ✕
            </button>
          )}
          <span className={`searchable-select-chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {isOpen && (
        <div className="searchable-select-menu">
          <div className="searchable-select-search-box">
            <span className="searchable-select-search-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              className="searchable-select-search-input"
              placeholder="Search by IC No, PO No, Item Sr..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                className="searchable-select-clear-btn"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">
                <span>No matching source ICs found</span>
                <small style={{ color: '#cbd5e1' }}>Try searching with a different term</small>
              </div>
            ) : (
              filteredOptions.map((ic) => {
                const isSelected = ic.certificateNo === value;
                return (
                  <div
                    key={ic.certificateNo}
                    className={`searchable-select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(ic.certificateNo)}
                  >
                    <div className="searchable-select-option-header">
                      <span className="searchable-select-ic-badge">{ic.certificateNo}</span>
                      <span className="searchable-select-bal-badge">
                        Bal: {ic.availableBalanceQty} {ic.unitOfMeasurement || 'MT'}
                      </span>
                    </div>
                    <div className="searchable-select-option-sub">
                      <span>📄 PO / Item: <strong>{formatPoAndItem(ic.poNo, ic.poSerialNo)}</strong></span>
                      {ic.callNo && <span>📞 Call: {ic.callNo}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Generic Modern Select Dropdown
const ModernSelect = ({ options = [], value = '', onChange, placeholder = '-- Select an option --' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value === value) || null;
  }, [options, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div
        className={`searchable-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        role="button"
      >
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
          {selectedOption && (
            <button
              type="button"
              className="searchable-select-clear-btn"
              title="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              ✕
            </button>
          )}
          <span className={`searchable-select-chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {isOpen && (
        <div className="searchable-select-menu">
          <div className="searchable-select-options">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  className={`modern-select-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
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

// Searchable Manufacturing Plant Dropdown with Address Display
const SearchablePlantDropdown = ({ options = [], value = '', address = '', poiCode = '', onChange, placeholder = '-- Select Manufacturing Plant --' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const getPlantName = (opt) => (typeof opt === 'string' ? opt : (opt.unitName || opt.unit_name || opt.name || ''));
  const getPlantAddress = (opt) => (typeof opt === 'string' ? '' : (opt.address || ''));
  const getPoiCode = (opt) => (typeof opt === 'string' ? '' : (opt.poiCode || opt.poi_code || ''));

  const selectedOption = useMemo(() => {
    return options.find(opt => getPlantName(opt) === value);
  }, [options, value]);

  const displayAddress = address || (selectedOption ? getPlantAddress(selectedOption) : '');
  const displayPoiCode = poiCode || (selectedOption ? getPoiCode(selectedOption) : '');

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter(opt => {
      const pName = getPlantName(opt).toLowerCase();
      const pAddr = getPlantAddress(opt).toLowerCase();
      const pPoi = getPoiCode(opt).toLowerCase();
      return pName.includes(term) || pAddr.includes(term) || pPoi.includes(term);
    });
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div
        className={`searchable-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        tabIndex={0}
        role="button"
        style={{ minHeight: '44px' }}
      >
        <div className="searchable-select-trigger-content">
          {value ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🏭</span>
                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{value}</span>
                {displayPoiCode && (
                  <span style={{ fontSize: '10.5px', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {displayPoiCode}
                  </span>
                )}
              </div>
              {displayAddress && (
                <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📍 {displayAddress}
                </div>
              )}
            </div>
          ) : (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          )}
        </div>
        <span className={`searchable-select-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="searchable-select-menu">
          {options.length > 3 && (
            <div className="searchable-select-search-box">
              <span className="searchable-select-search-icon">🔍</span>
              <input
                ref={inputRef}
                type="text"
                className="searchable-select-search-input"
                placeholder="Search plant name, address, POI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">
                <span>No plants found</span>
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const pName = getPlantName(opt);
                const pAddr = getPlantAddress(opt);
                const pPoi = getPoiCode(opt);
                const isSelected = pName === value;

                return (
                  <div
                    key={pName || idx}
                    className={`searchable-select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(pName, opt);
                      setIsOpen(false);
                    }}
                  >
                    <div className="searchable-select-option-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px' }}>🏭</span>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{pName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {pPoi && (
                          <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {pPoi}
                          </span>
                        )}
                        {isSelected && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
                      </div>
                    </div>
                    {pAddr && (
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                        📍 {pAddr}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Modern Searchable & Scrollable Dropdown for Target PO Selection
const SearchablePoDropdown = ({ options = [], value = '', onChange, placeholder = '-- Search & Select Target PO --' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = useMemo(() => {
    return options.find(opt => (opt.poNo === value || opt.po_no === value));
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter(opt => {
      const pNo = String(opt.poNo || opt.po_no || '').toLowerCase();
      const pDes = String(opt.poDes || opt.description || '').toLowerCase();
      const pZone = String(opt.rlyShortName || opt.zone_name || '').toLowerCase();
      return pNo.includes(term) || pDes.includes(term) || pZone.includes(term);
    });
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (poObj) => {
    const pNo = poObj.poNo || poObj.po_no || '';
    onChange(pNo, poObj);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div
        className={`searchable-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        tabIndex={0}
        role="button"
      >
        <div className="searchable-select-trigger-content">
          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span className="searchable-select-ic-badge" style={{ color: '#0f172a' }}>
                  {selectedOption.poNo || selectedOption.po_no}
                </span>
                {(selectedOption.rlyShortName || selectedOption.zone_name) && (
                  <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {selectedOption.rlyShortName || selectedOption.zone_name}
                  </span>
                )}
              </div>
              {(selectedOption.qty || selectedOption.quantity) && (
                <span className="searchable-select-bal-badge" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                  Qty: {selectedOption.qty || selectedOption.quantity} {selectedOption.unit || 'NOS'}
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selectedOption && (
            <button
              type="button"
              className="searchable-select-clear-btn"
              title="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                onChange('', null);
              }}
            >
              ✕
            </button>
          )}
          <span className={`searchable-select-chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {isOpen && (
        <div className="searchable-select-menu">
          <div className="searchable-select-search-box">
            <span className="searchable-select-search-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              className="searchable-select-search-input"
              placeholder="Search by PO number, zone, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                className="searchable-select-clear-btn"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">
                <span>No matching POs found</span>
                <small style={{ color: '#cbd5e1' }}>Try searching with a different term</small>
              </div>
            ) : (
              filteredOptions.map((po, idx) => {
                const pNo = po.poNo || po.po_no || '';
                const isSelected = pNo === value;
                const pZone = po.rlyShortName || po.zone_name;
                const pQty = po.qty || po.quantity;
                const pUnit = po.unit || 'NOS';
                const pDes = po.poDes || po.description;

                return (
                  <div
                    key={pNo || idx}
                    className={`searchable-select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(po)}
                  >
                    <div className="searchable-select-option-header">
                      <span className="searchable-select-ic-badge" style={{ color: '#0f172a' }}>{pNo}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {pZone && (
                          <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {pZone}
                          </span>
                        )}
                        {pQty && (
                          <span className="searchable-select-bal-badge" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                            {pQty} {pUnit}
                          </span>
                        )}
                      </div>
                    </div>
                    {pDes && (
                      <div style={{ fontSize: '11.5px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pDes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Modern Dropdown for Target PO Item Sr Selection
const SearchablePoItemDropdown = ({ options = [], value = '', onChange, placeholder = '-- Select Item Sr --', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const getSrDisplay = (opt) => {
    if (!opt) return '';
    if (typeof opt === 'string') return opt;
    return opt.poSerialNo || opt.po_serial_no || opt.value || opt.label || '';
  };

  const selectedOption = useMemo(() => {
    return options.find(opt => String(getSrDisplay(opt)) === String(value));
  }, [options, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div
        className={`searchable-select-trigger ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        role="button"
      >
        <div className="searchable-select-trigger-content">
          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>🔢</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{getSrDisplay(selectedOption)}</span>
              {(selectedOption.poDes || selectedOption.item_name) && (
                <span style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ({selectedOption.poDes || selectedOption.item_name})
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: '#94a3b8' }}>{disabled ? 'Select Target PO first' : placeholder}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selectedOption && !disabled && (
            <button
              type="button"
              className="searchable-select-clear-btn"
              title="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              ✕
            </button>
          )}
          <span className={`searchable-select-chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="searchable-select-menu">
          <div className="searchable-select-options">
            {options.length === 0 ? (
              <div className="searchable-select-empty">
                <span>No available item serial numbers</span>
                <small style={{ color: '#94a3b8' }}>Same source PO & Item Sr is excluded from target</small>
              </div>
            ) : (
              options.map((opt, idx) => {
                const srVal = getSrDisplay(opt);
                const isSelected = String(srVal) === String(value);
                const desc = opt.poDes || opt.item_name || opt.description;
                const qty = opt.orderedQty || opt.item_qty || opt.quantity;

                return (
                  <div
                    key={srVal || idx}
                    className={`modern-select-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(srVal);
                      setIsOpen(false);
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>🔢</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>Item Sr: {srVal}</div>
                      {desc && <div style={{ fontSize: '11px', color: '#64748b' }}>{desc}</div>}
                    </div>
                    {qty && (
                      <span className="searchable-select-bal-badge" style={{ background: '#f8fafc', color: '#475569' }}>
                        Qty: {qty}
                      </span>
                    )}
                    {isSelected && <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const RaiseDiversionRequestModal = ({ isOpen, onClose, onSuccess, vendorUser, isEditMode = false, initialData = null }) => {
  const [stage, setStage] = useState('');
  const [diversionType, setDiversionType] = useState('PARTIAL');
  const [plantId, setPlantId] = useState('');
  const [plantName, setPlantName] = useState('');
  const [plantAddress, setPlantAddress] = useState('');
  const [rioId] = useState('NR');
  const [cmUserId, setCmUserId] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [poiCode, setPoiCode] = useState('');

  // Dropdown lists
  const [plants, setPlants] = useState([]);
  const [eligibleIcs, setEligibleIcs] = useState([]);
  const [selectedIcNo, setSelectedIcNo] = useState('');
  const [selectedIcDetails, setSelectedIcDetails] = useState(null);
  const [lineItems, setLineItems] = useState([]);

  // Target PO
  const [vendorPos, setVendorPos] = useState([]);
  const [targetPoItems, setTargetPoItems] = useState([]);
  const [targetPoNo, setTargetPoNo] = useState('');
  const [targetPoSrNo, setTargetPoSrNo] = useState('');

  // Reason & Permission
  const [reasonCode, setReasonCode] = useState('');
  const [railwayPermissionNo, setRailwayPermissionNo] = useState('');
  const [railwayPermissionDate, setRailwayPermissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [railwayPermissionDocUrl, setRailwayPermissionDocUrl] = useState('');
  const [vendorRemarks, setVendorRemarks] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch Unit Details (Address, POI Code) on plant selection
  const handlePlantSelect = useCallback(async (selectedUnit, plantObj = null) => {
    setPlantName(selectedUnit);
    setPlantId(selectedUnit);

    let matched = plantObj;
    if (!matched && plants && plants.length > 0) {
      matched = plants.find(p => (typeof p === 'object' && (p.unitName === selectedUnit || p.unit_name === selectedUnit)));
    }

    if (matched && (matched.address || matched.poiCode)) {
      setPlantAddress(matched.address || '');
      setPoiCode(matched.poiCode || '');
      if (matched.companyName) {
        setCompanyName(matched.companyName);
      }
      return;
    }

    if (!selectedUnit) {
      setPlantAddress('');
      setPoiCode('');
      return;
    }

    try {
      const res = await poiMappingService.getUnitDetails(companyName || '', selectedUnit);
      if (res && res.data) {
        setPlantAddress(res.data.address || '');
        setPoiCode(res.data.poiCode || '');
      }
    } catch (err) {
      console.error('Error fetching unit details:', err);
    }
  }, [plants, companyName]);

  const rawVendorCode = vendorUser?.userName || vendorUser?.vendorCode || vendorUser?.id || sessionStorage.getItem('vendorCode') || localStorage.getItem('vendorCode') || '';
  const vendorCode = rawVendorCode.replace(/^:+/, '');

  // 2. Fetch Plants with Address & Assigned POs on mount when modal is open
  useEffect(() => {
    if (!isOpen || !vendorCode) return;

    // Fetch vendor units with address and POI code
    poiMappingService.getVendorUnits(vendorCode)
      .then(res => {
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (list.length > 0) {
          setPlants(list);
          if (list[0].companyName) {
            setCompanyName(list[0].companyName);
          }
        } else {
          // Fallback to getCompanies if vendor units is empty
          poiMappingService.getCompanies(vendorCode).then(cRes => {
            const cList = cRes?.data || (Array.isArray(cRes) ? cRes : []);
            if (cList.length > 0) {
              const comp = typeof cList[0] === 'string' ? cList[0] : (cList[0].company_name || cList[0].name || '');
              setCompanyName(comp);
              poiMappingService.getUnitsByCompany(comp).then(uRes => {
                const uList = uRes?.data || (Array.isArray(uRes) ? uRes : []);
                setPlants(uList);
              });
            }
          });
        }
      })
      .catch(err => console.error('Error fetching vendor units:', err));

    // Fetch Assigned POs for Target PO Selection
    poAssignedService.getPoAssigned(vendorCode)
      .then(res => {
        const poList = res?.data || (Array.isArray(res) ? res : []);
        setVendorPos(poList);
      })
      .catch(err => console.error('Error fetching vendor POs:', err));
  }, [isOpen, vendorCode]);

  // 3. Handle Target PO selection
  const handleTargetPoChange = useCallback((poNumber, poObject) => {
    setTargetPoNo(poNumber);
    if (!poObject && poNumber) {
      poObject = vendorPos.find(p => (p.poNo === poNumber || p.po_no === poNumber));
    }
    const items = poObject?.poItem || poObject?.items || [];
    setTargetPoItems(items);
    setTargetPoSrNo('');
  }, [vendorPos]);

  // Filter out source item serial number if target PO is identical to source PO and sort ascending
  const availableTargetPoItems = useMemo(() => {
    if (!targetPoItems || targetPoItems.length === 0) return [];

    let items = targetPoItems;
    const sourcePo = selectedIcDetails?.poNo || '';
    const sourceSr = selectedIcDetails?.poSerialNo || '';

    if (sourcePo && targetPoNo && String(sourcePo).trim() === String(targetPoNo).trim()) {
      const normSourceSr = normalizeSerial(sourceSr);
      items = targetPoItems.filter(item => {
        const itemSr = item.poSerialNo || item.po_serial_no || item.value || item.label || '';
        return normalizeSerial(itemSr) !== normSourceSr;
      });
    }

    return [...items].sort((a, b) => {
      const srA = String(a.poSerialNo || a.po_serial_no || a.value || a.label || '');
      const srB = String(b.poSerialNo || b.po_serial_no || b.value || b.label || '');
      return srA.localeCompare(srB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [targetPoItems, targetPoNo, selectedIcDetails]);

  // 4. Fetch eligible ICs only when stage is selected and modal is open
  useEffect(() => {
    if (!isOpen || !vendorCode || !stage) {
      setEligibleIcs([]);
      return;
    }

    diversionService.getEligibleSourceIcs(vendorCode, plantId || null, stage)
      .then(res => {
        if (res && res.data) {
          setEligibleIcs(res.data);
        }
      })
      .catch(err => console.error('Error fetching eligible ICs:', err));
  }, [isOpen, vendorCode, plantId, stage]);

  // Handle IC selection
  const handleIcChange = async (icNo) => {
    setSelectedIcNo(icNo);
    const icObj = eligibleIcs.find(i => i.certificateNo === icNo);
    setSelectedIcDetails(icObj);
    setTargetPoSrNo('');

    if (icNo) {
      try {
        const res = await diversionService.getSourceIcLineItems(icNo, stage);
        if (res && res.data) {
          const items = res.data.map(i => ({
            ...i,
            diversionQty: diversionType === 'COMPLETE' ? i.availableBalanceQty : ''
          }));
          setLineItems(items);
        }
      } catch (err) {
        console.error('Error fetching line items:', err);
      }
    } else {
      setLineItems([]);
    }
  };

  const handleQtyChange = (index, val) => {
    const numericVal = parseFloat(val) || 0;
    const updated = [...lineItems];
    const available = updated[index].availableBalanceQty || 0;

    if (numericVal > available) {
      const itemLabel = stage === 'RAW_MATERIAL'
        ? `Heat ${updated[index].heatNo || ''}`
        : `Lot ${updated[index].lotNo || ''}${updated[index].heatNo ? ` (Heat: ${updated[index].heatNo})` : ''}`;
      setError(`Diversion quantity cannot exceed available balance (${available}) for ${itemLabel}`);
    } else {
      setError('');
    }

    updated[index].diversionQty = val;
    updated[index].remainingBalanceQty = Math.max(0, available - numericVal);
    setLineItems(updated);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRailwayPermissionDocUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotalDiversion = () => {
    return lineItems.reduce((acc, curr) => acc + (parseFloat(curr.diversionQty) || 0), 0);
  };

  const handleSubmit = async (isDraft = false) => {
    setError('');

    if (!stage) {
      setError('Please select an Inspection Stage.');
      return;
    }
    if (!plantName) {
      setError('Please select a Manufacturing Plant.');
      return;
    }
    if (!cmUserId) {
      setError('Please select a Controlling Manager.');
      return;
    }
    if (!selectedIcNo) {
      setError('Please select a Source IC Number.');
      return;
    }
    if (!targetPoNo) {
      setError('Please select a Target PO Number.');
      return;
    }
    if (!targetPoSrNo) {
      setError('Please select a Target PO Item Serial Number.');
      return;
    }

    const totalQty = calculateTotalDiversion();
    if (totalQty <= 0) {
      setError('Total diversion quantity must be greater than zero.');
      return;
    }
    if (!reasonCode) {
      setError('Please select a Reason for Diversion.');
      return;
    }
    if (!isDraft && (!railwayPermissionNo || !railwayPermissionDocUrl)) {
      setError('Railway permission number and document upload are mandatory.');
      return;
    }

    const payload = {
      vendorCode: vendorUser?.userName || vendorUser?.vendorCode || sessionStorage.getItem('vendorCode') || '',
      companyName: companyName || vendorUser?.companyName || 'Vendor Company',
      plantId: plantId || plantName || 1,
      plantName: plantName || 'Main Plant',
      plantAddress: plantAddress,
      poiCode: poiCode,
      rioId: rioId,
      cmUserId: cmUserId,
      stage: stage,
      diversionType: diversionType,
      sourcePoNo: selectedIcDetails?.poNo || '',
      sourcePoSrNo: selectedIcDetails?.poSerialNo || '',
      sourceIcNo: selectedIcNo,
      sourceCallNo: selectedIcDetails?.callNo || '',
      sourceIcDate: selectedIcDetails?.icDate,
      targetPoNo: targetPoNo,
      targetPoSrNo: targetPoSrNo,
      totalDiversionQty: totalQty,
      unitOfMeasurement: stage === 'RAW_MATERIAL' ? 'MT' : 'NOS',
      reasonCode: reasonCode,
      reasonRemarks: vendorRemarks,
      railwayPermissionNo: railwayPermissionNo,
      railwayPermissionDate: railwayPermissionDate,
      railwayPermissionDocUrl: railwayPermissionDocUrl,
      vendorRemarks: vendorRemarks,
      items: lineItems.map(item => ({
        heatNo: item.heatNo,
        tcNo: item.tcNo,
        lotNo: item.lotNo,
        acceptedQty: item.acceptedQty,
        downstreamConsumedQty: item.downstreamConsumedQty || 0,
        availableBalanceQty: item.availableBalanceQty,
        diversionQty: parseFloat(item.diversionQty) || 0,
        remainingBalanceQty: (item.availableBalanceQty || 0) - (parseFloat(item.diversionQty) || 0)
      }))
    };

    setIsLoading(true);
    try {
      if (isDraft) {
        await diversionService.saveDraft(payload);
      } else {
        await diversionService.submitRequest(payload);
      }
      setIsLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setIsLoading(false);
      setError(err?.response?.data?.message || err.message || 'Error processing request');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="diversion-modal-overlay">
      <div className="diversion-modal-content">
        <div className="diversion-modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
              {isEditMode ? 'Modify Diversion Request' : 'Raise Material Diversion Request'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Transfer inspected & accepted material to a target PO without repeating testing
            </p>
          </div>
          <button className="diversion-modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', color: '#b91c1c', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Section 1: Stage & Authority */}
        <div className="diversion-card">
          <div className="diversion-card-title">1. Stage & Controlling Authority</div>
          <div className="diversion-grid">
            <div className="diversion-form-group">
              <label className="diversion-form-label">Inspection Stage</label>
              <ModernSelect
                options={[
                  { value: 'RAW_MATERIAL', label: 'Raw Material (Spring Steel)', icon: '🔩', subtext: 'Raw material heat TCs' },
                  { value: 'PROCESS', label: 'Process Inspection', icon: '⚙️', subtext: 'In-process ERC lot batches' },
                  { value: 'FINAL', label: 'Final Inspection', icon: '🏷️', subtext: 'Finished ERC clips' }
                ]}
                value={stage}
                placeholder="-- Select Inspection Stage --"
                onChange={val => {
                  setStage(val);
                  setSelectedIcNo('');
                  setLineItems([]);
                }}
              />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Manufacturing Plant</label>
              <SearchablePlantDropdown
                options={plants}
                value={plantName}
                address={plantAddress}
                poiCode={poiCode}
                onChange={handlePlantSelect}
                placeholder="-- Select Manufacturing Plant --"
              />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Regional Office (RIO)</label>
              <div className="diversion-readonly-field">
                <span style={{ fontSize: '15px' }}>🏛️</span>
                <span className="diversion-readonly-tag">{rioId || 'NR'}</span>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>Inspection Region</span>
              </div>
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Controlling Manager (ERC)</label>
              <ModernSelect
                options={[
                  { value: 'CM_ERC_01', label: 'Controlling Manager - ERC Northern Region', icon: '👤', subtext: 'Northern Region (NR) HQ' },
                  { value: 'CM_ERC_02', label: 'Controlling Manager - ERC Eastern Region', icon: '👤', subtext: 'Eastern Region (ER) HQ' }
                ]}
                value={cmUserId}
                placeholder="-- Select Controlling Manager --"
                onChange={setCmUserId}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Source IC & Target PO */}
        <div className="diversion-card">
          <div className="diversion-card-title">2. Source IC & Target PO Selection</div>
          <div className="diversion-grid">
            <div className="diversion-form-group diversion-grid-span-2">
              <label className="diversion-form-label">Source IC Number *</label>
              <SearchableIcDropdown
                options={eligibleIcs}
                value={selectedIcNo}
                onChange={handleIcChange}
                placeholder="-- Search & Select Completed Source IC --"
              />
            </div>
            <div className="diversion-form-group diversion-grid-span-2">
              <label className="diversion-form-label">Source PO & Item Sr.</label>
              <div className="diversion-readonly-field">
                <span style={{ fontSize: '14px' }}>📄</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {selectedIcDetails ? formatPoAndItem(selectedIcDetails.poNo, selectedIcDetails.poSerialNo) : 'Auto-filled on IC selection'}
                </span>
              </div>
            </div>
            <div className="diversion-form-group diversion-grid-span-2">
              <label className="diversion-form-label">Target PO Number *</label>
              <SearchablePoDropdown
                options={vendorPos}
                value={targetPoNo}
                onChange={handleTargetPoChange}
                placeholder="-- Search & Select Target PO --"
              />
            </div>
            <div className="diversion-form-group diversion-grid-span-2">
              <label className="diversion-form-label">Target PO Item Sr. *</label>
              <SearchablePoItemDropdown
                options={availableTargetPoItems}
                value={targetPoSrNo}
                onChange={setTargetPoSrNo}
                placeholder="-- Select Target Item Sr --"
                disabled={!targetPoNo}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Material Line Grid */}
        {lineItems.length > 0 && (
          <div className="diversion-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="diversion-card-title" style={{ margin: 0 }}>3. Material Line Quantities</div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="radio" checked={diversionType === 'PARTIAL'} onChange={() => setDiversionType('PARTIAL')} /> Partial Diversion
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="radio" checked={diversionType === 'COMPLETE'} onChange={() => {
                    setDiversionType('COMPLETE');
                    const updated = lineItems.map(i => ({ ...i, diversionQty: i.availableBalanceQty, remainingBalanceQty: 0 }));
                    setLineItems(updated);
                  }} /> Complete Diversion
                </label>
              </div>
            </div>

            <div className="diversion-table-wrapper">
              <table className="diversion-table">
                <thead>
                  <tr>
                    <th>{stage === 'RAW_MATERIAL' ? 'Heat No.' : 'Lot No.'}</th>
                    <th>{stage === 'RAW_MATERIAL' ? 'TC No.' : 'Heat No.'}</th>
                    <th>Total Accepted ({stage === 'RAW_MATERIAL' ? 'MT' : 'Nos'})</th>
                    <th>Available Balance</th>
                    <th>Diversion Qty Intended *</th>
                    <th>Remaining Source Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600' }}>
                        {stage === 'RAW_MATERIAL' ? (item.heatNo || '-') : (item.lotNo || '-')}
                      </td>
                      <td>
                        {stage === 'RAW_MATERIAL' ? (item.tcNo || '-') : (item.heatNo || '-')}
                      </td>
                      <td>{item.acceptedQty}</td>
                      <td style={{ color: '#0369a1', fontWeight: '600' }}>{item.availableBalanceQty}</td>
                      <td>
                        <input
                          type="number"
                          step={stage === 'RAW_MATERIAL' ? '0.001' : '1'}
                          className="diversion-input"
                          style={{ width: '130px', padding: '6px 10px' }}
                          value={item.diversionQty}
                          disabled={diversionType === 'COMPLETE'}
                          onChange={e => handleQtyChange(idx, e.target.value)}
                        />
                      </td>
                      <td style={{ fontWeight: '600', color: '#475569' }}>
                        {item.remainingBalanceQty !== undefined ? item.remainingBalanceQty : item.availableBalanceQty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
              Total Diversion Quantity: {stage === 'RAW_MATERIAL' ? calculateTotalDiversion().toFixed(3) : calculateTotalDiversion()} {stage === 'RAW_MATERIAL' ? 'MT' : 'Nos'}
            </div>
          </div>
        )}

        {/* Section 4: Railway Permission & Reason */}
        <div className="diversion-card">
          <div className="diversion-card-title">4. Railway Permission & Reason</div>
          <div className="diversion-grid">
            <div className="diversion-form-group">
              <label className="diversion-form-label">Reason for Diversion</label>
              <ModernSelect
                options={[
                  { value: 'RAILWAY_DIRECTIVE', label: 'Railway Directive / Urgent Requirement', icon: '📋' },
                  { value: 'PO_QUANTITY_REVISION', label: 'PO Quantity Revision', icon: '🔄' },
                  { value: 'FACTORY_STOCK_REALLOCATION', label: 'Plant Stock Reallocation', icon: '🏭' }
                ]}
                value={reasonCode}
                placeholder="-- Select Reason for Diversion --"
                onChange={setReasonCode}
              />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Railway Approval Letter No. *</label>
              <input className="diversion-input" placeholder="Letter Ref No." value={railwayPermissionNo} onChange={e => setRailwayPermissionNo(e.target.value)} />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Approval Date *</label>
              <input type="date" className="diversion-input" value={railwayPermissionDate} onChange={e => setRailwayPermissionDate(e.target.value)} />
            </div>
            <div className="diversion-form-group">
              <label className="diversion-form-label">Upload Railway Permission Doc (PDF) *</label>
              <input type="file" accept=".pdf" className="diversion-input" onChange={handleFileUpload} />
            </div>
          </div>
          <div className="diversion-form-group" style={{ marginTop: '16px' }}>
            <label className="diversion-form-label">Remarks / Justification</label>
            <textarea className="diversion-textarea" rows="2" placeholder="Enter detailed justification..." value={vendorRemarks} onChange={e => setVendorRemarks(e.target.value)} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button type="button" className="diversion-tab-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="diversion-btn-primary" style={{ background: '#f1f5f9', color: '#334155' }} onClick={() => handleSubmit(true)} disabled={isLoading}>
            Save as Draft
          </button>
          <button type="button" className="diversion-btn-primary" style={{ background: '#0284c7', color: '#ffffff' }} onClick={() => handleSubmit(false)} disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit to Controlling Manager'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaiseDiversionRequestModal;
