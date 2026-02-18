import React from 'react';

const responsiveStyles = `
  @media (max-width: 768px) {
    .pending-calls-dashboard-cards {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
    }
    .pending-calls-dashboard-card {
      min-width: unset !important;
      padding: 12px 8px !important;
    }
    .pending-calls-dashboard-card .card-icon {
      font-size: 24px !important;
    }
    .pending-calls-dashboard-card .card-number {
      font-size: 22px !important;
    }
    .pending-calls-dashboard-card .card-label {
      font-size: 10px !important;
    }
    .pending-calls-filter-chips {
      padding: 10px 12px !important;
    }
    .pending-calls-filter-chips-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }
    .pending-calls-filter-chip {
      padding: 5px 8px !important;
      font-size: 11px !important;
    }
    .pending-calls-filter-modal {
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      border-radius: 0 !important;
      top: 0 !important;
      left: 0 !important;
      transform: none !important;
    }
    .pending-calls-filter-modal-content {
      flex-direction: column !important;
    }
    .pending-calls-filter-modal-sidebar {
      width: 100% !important;
      border-right: none !important;
      border-bottom: 1px solid #e5e7eb !important;
      display: flex !important;
      flex-wrap: wrap !important;
      padding: 8px !important;
      gap: 6px !important;
    }
    .pending-calls-filter-modal-sidebar > div {
      padding: 8px 12px !important;
      border-radius: 20px !important;
      border: 1px solid #e5e7eb !important;
      border-left: none !important;
      white-space: nowrap !important;
    }
    .pending-calls-filter-modal-options {
      padding: 12px 16px !important;
    }
    .pending-calls-table-container {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    .pending-calls-bulk-actions {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 12px !important;
      padding: 12px !important;
    }
    .pending-calls-bulk-actions-buttons {
      flex-direction: column !important;
      gap: 8px !important;
    }
    .pending-calls-bulk-actions-buttons button {
      width: 100% !important;
      min-height: 44px !important;
    }
    .pending-calls-filter-toggle {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }
  }

  @media (max-width: 480px) {
    .pending-calls-dashboard-cards {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .pending-calls-dashboard-card {
      padding: 10px 6px !important;
    }
    .pending-calls-dashboard-card .card-icon {
      font-size: 20px !important;
    }
    .pending-calls-dashboard-card .card-number {
      font-size: 18px !important;
    }
    .pending-calls-dashboard-card .card-label {
      font-size: 9px !important;
    }
  }
`;

const CANONICAL_STAGES = ['Raw Material', 'Process Material', 'Final'];

const stageMapping = {
  'Raw Material': 'RM',
  'Process Material': 'Process Inspection',
  'Final': 'Final'
};

const stageReverseMapping = {
  'RM': 'Raw Material',
  'Process Inspection': 'Process Material',
  'Final': 'Final'
};

const CallsFilterSection = ({
  allCalls = [],
  filteredCalls = [],
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  filterSearch,
  setFilterSearch,
  selectedCategory,
  setSelectedCategory,
  clearAllFilters,
  handleFilterChange,
  handleMultiSelectToggle,
  summaryLabel = 'results'
}) => {
  const effectiveCalls = Array.isArray(allCalls) ? allCalls : [];

  const safeSetFilter = (key, value) => {
    if (typeof handleFilterChange === 'function') {
      handleFilterChange(key, value);
    } else if (typeof setFilters === 'function') {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const safeToggleMulti = (field, value) => {
    if (typeof handleMultiSelectToggle === 'function') {
      handleMultiSelectToggle(field, value);
    } else if (typeof setFilters === 'function') {
      setFilters(prev => {
        const arr = Array.isArray(prev[field]) ? prev[field] : [];
        const exists = arr.includes(value);
        return { ...prev, [field]: exists ? arr.filter(x => x !== value) : [...arr, value] };
      });
    }
  };

  const productTypesList = [...new Set(effectiveCalls.map(c => c.product_type).filter(Boolean))];
  const vendorsList = [...new Set(effectiveCalls.map(c => c.vendor_name).filter(Boolean))].sort();
  const poSuggestions = [...new Set(effectiveCalls.map(c => c.po_no || c.poNumber).filter(Boolean))].sort();
  const callNumbersList = [...new Set(effectiveCalls.map(c => c.call_no).filter(Boolean))].sort();

  const activeFilters = [];

  if (filters?.stage) {
    const stageColors = { 'RM': '#f59e0b', 'Process Inspection': '#3b82f6', 'Final': '#9333ea' };
    activeFilters.push({
      key: 'stage',
      label: 'Stage',
      value: stageReverseMapping[filters.stage] || filters.stage,
      color: stageColors[filters.stage] || '#6b7280',
      onRemove: () => safeSetFilter('stage', '')
    });
  }

  (filters?.productTypes || []).forEach(pt => {
    activeFilters.push({
      key: `productType-${pt}`,
      label: 'Product Type',
      value: 'ERC',
      color: '#10b981',
      onRemove: () => safeToggleMulti('productTypes', pt)
    });
  });

  (filters?.vendors || []).forEach(vendor => {
    activeFilters.push({
      key: `vendor-${vendor}`,
      label: 'Vendor',
      value: vendor,
      color: '#0ea5e9',
      onRemove: () => safeToggleMulti('vendors', vendor)
    });
  });

  (filters?.callNumbers || []).forEach(callNo => {
    activeFilters.push({
      key: `callNumber-${callNo}`,
      label: 'Call No',
      value: callNo,
      color: '#8b5cf6',
      onRemove: () => safeToggleMulti('callNumbers', callNo)
    });
  });

  (filters?.poNumbers || []).forEach(poNo => {
    activeFilters.push({
      key: `poNumber-${poNo}`,
      label: 'PO No',
      value: poNo,
      color: '#ec4899',
      onRemove: () => safeToggleMulti('poNumbers', poNo)
    });
  });

  if (filters?.dateFrom || filters?.dateTo) {
    const fromDate = filters.dateFrom || 'Start';
    const toDate = filters.dateTo || 'End';
    activeFilters.push({
      key: 'dateRange',
      label: 'Date',
      value: `${fromDate} to ${toDate}`,
      color: '#f97316',
      onRemove: () => {
        safeSetFilter('dateFrom', '');
        safeSetFilter('dateTo', '');
      }
    });
  }

  return (
    <>
      <style>{responsiveStyles}</style>

      {activeFilters.length > 0 && (
        <div className="pending-calls-filter-chips" style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div className="pending-calls-filter-chips-header" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              Active Filters ({activeFilters.length})
            </span>
            <button
              onClick={clearAllFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '4px',
                transition: 'background 0.2s',
                minHeight: '36px'
              }}
              onMouseOver={(e) => e.target.style.background = '#fef2f2'}
              onMouseOut={(e) => e.target.style.background = 'none'}
            >
              Clear All ×
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeFilters.map(filter => (
              <div
                className="pending-calls-filter-chip"
                key={filter.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  backgroundColor: 'white',
                  border: `1px solid ${filter.color}40`,
                  borderRadius: '20px',
                  fontSize: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: filter.color,
                  flexShrink: 0
                }} />
                <span style={{ color: '#6b7280', fontWeight: '500', whiteSpace: 'nowrap' }}>{filter.label}:</span>
                <span style={{ color: '#1f2937', fontWeight: '600', wordBreak: 'break-word' }}>{filter.value}</span>
                <button
                  onClick={filter.onRemove}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '0 2px',
                    fontSize: '14px',
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    minWidth: '22px',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#fee2e2';
                    e.target.style.color = '#dc2626';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'none';
                    e.target.style.color = '#9ca3af';
                  }}
                  title={`Remove ${filter.label} filter`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 'var(--space-16)' }}>
        <div className="pending-calls-filter-toggle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-12)' }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-8)', minHeight: '44px' }}
          >
            <span style={{ transform: showFilters ? 'rotate(180deg)' : 'none' }}>▾</span>
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Showing {filteredCalls.length} of {effectiveCalls.length} {summaryLabel}
          </div>
        </div>
      </div>

      {showFilters && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => setShowFilters(false)}
          />

          <div className="pending-calls-filter-modal" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '85vh',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937'
              }}>Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >×</button>
            </div>

            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '18px'
                }}>🔍</span>
                <input
                  type="search"
                  placeholder="Search across filters..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            <div className="pending-calls-filter-modal-content" style={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
              minHeight: 0
            }}>
              <div className="pending-calls-filter-modal-sidebar" style={{
                width: '140px',
                borderRight: '1px solid #e5e7eb',
                overflowY: 'auto',
                backgroundColor: '#f9fafb'
              }}>
                {['Product Type', 'Vendor', 'Stage', 'Call Number', 'PO Number', 'Date Range'].map(cat => (
                  <div
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: selectedCategory === cat ? '600' : '400',
                      color: selectedCategory === cat ? '#16a34a' : '#4b5563',
                      backgroundColor: selectedCategory === cat ? '#f0fdf4' : 'transparent',
                      borderLeft: selectedCategory === cat ? '3px solid #16a34a' : '3px solid transparent',
                      transition: 'all 0.2s',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== cat) {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== cat) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {cat}
                  </div>
                ))}
              </div>

              <div className="pending-calls-filter-modal-options" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 24px'
              }}>
                {selectedCategory === 'Product Type' && (
                  <div>
                    {(() => {
                      if (filterSearch && !'erc'.includes(filterSearch.toLowerCase())) {
                        return (
                          <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '14px'
                          }}>
                            No results found for "{filterSearch}"
                          </div>
                        );
                      }

                      const isERCSelected = (filters?.productTypes || []).length > 0;

                      const handleERCToggle = () => {
                        if (isERCSelected) {
                          setFilters(prev => ({ ...prev, productTypes: [] }));
                        } else {
                          setFilters(prev => ({ ...prev, productTypes: [...productTypesList] }));
                        }
                      };

                      return (
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            marginRight: '12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px'
                          }}>📦</div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>ERC</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isERCSelected}
                            onChange={handleERCToggle}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              accentColor: '#16a34a'
                            }}
                          />
                        </label>
                      );
                    })()}
                  </div>
                )}

                {selectedCategory === 'Vendor' && (
                  <div>
                    {vendorsList
                      .filter(vendor => {
                        if (!filterSearch) return true;
                        return vendor.toLowerCase().includes(filterSearch.toLowerCase());
                      })
                      .map(vendor => {
                        const checked = (filters?.vendors || []).includes(vendor);
                        return (
                          <label
                            key={vendor}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 0',
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              marginRight: '12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }}>🏢</div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>{vendor}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => safeToggleMulti('vendors', vendor)}
                              style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: '#16a34a'
                              }}
                            />
                          </label>
                        );
                      })}
                  </div>
                )}

                {selectedCategory === 'Stage' && (
                  <div>
                    {CANONICAL_STAGES
                      .filter(stage => {
                        if (!filterSearch) return true;
                        return stage.toLowerCase().includes(filterSearch.toLowerCase());
                      })
                      .map(stage => {
                        const stageValue = stageMapping[stage];
                        const checked = filters?.stage === stageValue;
                        return (
                          <label
                            key={stage}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 0',
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              marginRight: '12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }}>⚙️</div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>{stage}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => safeSetFilter('stage', checked ? '' : stageValue)}
                              style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: '#16a34a'
                              }}
                            />
                          </label>
                        );
                      })}
                  </div>
                )}

                {selectedCategory === 'Call Number' && (
                  <div>
                    {callNumbersList
                      .filter(callNo => {
                        if (!filterSearch) return true;
                        return callNo.toLowerCase().includes(filterSearch.toLowerCase());
                      })
                      .map(callNo => {
                        const checked = (filters?.callNumbers || []).includes(callNo);
                        return (
                          <label
                            key={callNo}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 0',
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              marginRight: '12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }}>📞</div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>{callNo}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => safeToggleMulti('callNumbers', callNo)}
                              style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: '#16a34a'
                              }}
                            />
                          </label>
                        );
                      })}
                  </div>
                )}

                {selectedCategory === 'PO Number' && (
                  <div>
                    {poSuggestions
                      .filter(poNo => {
                        if (!filterSearch) return true;
                        return poNo.toLowerCase().includes(filterSearch.toLowerCase());
                      })
                      .map(poNo => {
                        const checked = (filters?.poNumbers || []).includes(poNo);
                        return (
                          <label
                            key={poNo}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 0',
                              borderBottom: '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              marginRight: '12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }}>📄</div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#1f2937'
                              }}>{poNo}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => safeToggleMulti('poNumbers', poNo)}
                              style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: '#16a34a'
                              }}
                            />
                          </label>
                        );
                      })}
                  </div>
                )}

                {selectedCategory === 'Date Range' && (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '8px',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          fontSize: '18px',
                          marginRight: '8px'
                        }}>📅</span>
                        From Date
                      </label>
                      <input
                        type="date"
                        value={filters?.dateFrom || ''}
                        onChange={(e) => safeSetFilter('dateFrom', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '8px',
                        fontWeight: '500'
                      }}>
                        <span style={{
                          fontSize: '18px',
                          marginRight: '8px'
                        }}>📅</span>
                        To Date
                      </label>
                      <input
                        type="date"
                        value={filters?.dateTo || ''}
                        onChange={(e) => safeSetFilter('dateTo', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  if (typeof clearAllFilters === 'function') {
                    clearAllFilters();
                  } else if (typeof setFilters === 'function') {
                    setFilters({
                      productTypes: [],
                      vendors: [],
                      dateFrom: '',
                      dateTo: '',
                      poNumbers: [],
                      statuses: [],
                      stage: '',
                      callNumbers: []
                    });
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e5e7eb';
                }}
              >
                Clear Filter
              </button>
              <button
                onClick={() => {
                  setShowFilters(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#16a34a',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#15803d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#16a34a'}
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CallsFilterSection;

