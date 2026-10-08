import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ClipboardList, X, Search, CheckCircle2, Layers,
  Info, Sparkles, Filter, Hash, Package
} from 'lucide-react';
import { NCRGRSP_CATALOG, resolveNcrgrspCatalogKey, normalizeDwg } from './ncrgrspCatalog';

const thStyle = {
  padding: '10px 12px',
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#475569'
};

const tdStyle = {
  padding: '10px 12px',
  fontSize: 13,
  color: '#1e293b'
};

const NCRGRSPSubDrawingsModal = ({
  isOpen,
  onClose,
  drawingNo,
  railPadType = '10.00mm NCRGRSP',
  desiredQty = '',
  uom = 'Set',
  poNo = '',
  srNo = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPortionFilter, setSelectedPortionFilter] = useState('ALL');

  // Resolved catalog key from selected drawing
  const resolvedKey = useMemo(() => {
    if (!drawingNo) return '';
    return resolveNcrgrspCatalogKey(drawingNo);
  }, [drawingNo]);

  // Sub-drawings list from master catalog
  const subDrawingsList = useMemo(() => {
    if (!drawingNo) return [];
    return NCRGRSP_CATALOG[drawingNo] || (resolvedKey && NCRGRSP_CATALOG[resolvedKey]) || [];
  }, [drawingNo, resolvedKey]);

  // Total quantity of pads per set
  const totalQtyPerSet = useMemo(() => {
    return subDrawingsList.reduce((acc, item) => acc + (item.qtyPerSet || 0), 0);
  }, [subDrawingsList]);

  // Portion categories present in this drawing
  const portions = useMemo(() => {
    const set = new Set();
    subDrawingsList.forEach(item => {
      if (item.description) set.add(item.description.trim());
    });
    return Array.from(set);
  }, [subDrawingsList]);

  // Filtered rows based on search and portion
  const filteredData = useMemo(() => {
    return subDrawingsList.filter(item => {
      if (selectedPortionFilter !== 'ALL' && item.description !== selectedPortionFilter) {
        return false;
      }
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase().trim();
      const code = (item.drawingNo || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return code.includes(term) || desc.includes(term);
    });
  }, [subDrawingsList, searchTerm, selectedPortionFilter]);

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(6px)',
    zIndex: 10050,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  };

  const modalContainerStyle = {
    background: '#ffffff',
    width: '100%',
    maxWidth: '960px',
    maxHeight: '92vh',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    animation: 'fadeInModal 0.2s ease-out'
  };

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={modalContainerStyle}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* ── Top Header Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0d3b3f 0%, #17545e 50%, #21808d 100%)',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2)'
            }}>
              <Layers size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{
                fontSize: '10px',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.75)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                NCRGRSP Master Configuration • Process Inspection Call
              </div>
              <h2
                id="modal-title"
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: 900,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Sub Drawings Breakdown — {drawingNo || resolvedKey}
                {resolvedKey && resolvedKey !== drawingNo && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.2)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    Mapped to {resolvedKey}
                  </span>
                )}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close sub drawings modal"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              outline: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Metadata Strip ── */}
        <div style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Rail Pad Type:</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{railPadType}</span>
            </div>
            <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Drawing No:</span>
              <span style={{ fontWeight: 900, color: '#0284c7' }}>{drawingNo}</span>
            </div>
            {poNo && (
              <>
                <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>PO:</span>
                  <span style={{ fontWeight: 700, color: '#334155' }}>{poNo} {srNo ? `(SR: ${srNo})` : ''}</span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              padding: '2px 10px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '11px'
            }}>
              {subDrawingsList.length} Sub-Drawings
            </span>
            <span style={{
              background: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              padding: '2px 10px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '11px'
            }}>
              {totalQtyPerSet} Pads/Set
            </span>
          </div>
        </div>

        {/* ── Scrollable Body: Drawing Requirement Summary (Section D style) ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          background: '#f8fafc'
        }}>
          {/* Main Card replicating Section D */}
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            padding: '20px'
          }}>
            {/* Section Header & Summary Badges (Identical to Section D) */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} style={{ color: '#1677ff' }} />
                <span style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#1e293b',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  Drawing Requirement Summary
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  background: '#e6f4ff',
                  color: '#0958d9',
                  fontWeight: 800,
                  fontSize: 12,
                  padding: '4px 14px',
                  borderRadius: 20,
                  border: '1px solid #91caff',
                  boxShadow: '0 1px 2px rgba(9, 88, 217, 0.08)'
                }}>
                  Total Quantity / Set: {totalQtyPerSet} Nos.
                </span>
              </div>
            </div>

            {/* Explanatory / Context Notice */}
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1' }}>
                <Info size={16} style={{ flexShrink: 0 }} />
                <span>
                  Below is the official RDSO sub-drawings list and quantity per set for <strong>{drawingNo}</strong>.
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {/* Search Box */}
              <div style={{
                position: 'relative',
                flex: 1,
                minWidth: '220px',
                maxWidth: '360px'
              }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filter by sub-drawing number or portion..."
                  style={{
                    width: '100%',
                    height: '34px',
                    padding: '0 10px 0 32px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    color: '#1e293b',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Portion filter tabs if multiple portions exist */}
              {portions.length > 1 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPortionFilter('ALL')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: selectedPortionFilter === 'ALL' ? '1px solid #0284c7' : '1px solid #e2e8f0',
                      background: selectedPortionFilter === 'ALL' ? '#0284c7' : '#ffffff',
                      color: selectedPortionFilter === 'ALL' ? '#ffffff' : '#64748b',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    All ({subDrawingsList.length})
                  </button>
                  {portions.map(p => {
                    const count = subDrawingsList.filter(item => item.description === p).length;
                    const isSelected = selectedPortionFilter === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedPortionFilter(p)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                          background: isSelected ? '#0284c7' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#64748b',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {p} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Table (Only Sr. No., Drawing No., Description, Quantity / Set) ── */}
            <div style={{
              overflowX: 'auto',
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ ...thStyle, width: '70px', textAlign: 'center' }}>Sr. No.</th>
                    <th style={{ ...thStyle, width: '200px' }}>Drawing No.</th>
                    <th style={thStyle}>Description</th>
                    <th style={{ ...thStyle, width: '160px', textAlign: 'center' }}>Quantity / Set</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: 13 }}>
                        {subDrawingsList.length === 0
                          ? `No official sub-drawings configured for "${drawingNo}" in the master catalog.`
                          : `No sub-drawings matched "${searchTerm}".`}
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr
                        key={`${row.drawingNo}-${idx}`}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}
                      >
                        {/* Sr. No. */}
                        <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                          {idx + 1}
                        </td>

                        {/* Drawing No. */}
                        <td style={{ ...tdStyle, fontWeight: 800, color: '#1677ff' }}>
                          {row.drawingNo}
                        </td>

                        {/* Description */}
                        <td style={{ ...tdStyle, color: '#334155', fontWeight: 500 }}>
                          {row.description ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #e2e8f0',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              {row.description}
                            </span>
                          ) : (
                            <span style={{ color: '#64748b' }}>Nylon Cord Reinforced GRSP</span>
                          )}
                        </td>

                        {/* Quantity / Set */}
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                          {row.qtyPerSet}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Table Footer with Totals */}
                {filteredData.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 800 }}>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>Σ</td>
                      <td style={{ ...tdStyle, color: '#1e293b' }}>
                        Total ({filteredData.length} Drawings)
                      </td>
                      <td style={tdStyle} />
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#0958d9', fontSize: '15px', fontWeight: 900 }}>
                        {totalQtyPerSet.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div style={{
          padding: '12px 20px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            Official NCRGRSP drawing breakdown per RDSO specifications
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 22px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NCRGRSPSubDrawingsModal;
