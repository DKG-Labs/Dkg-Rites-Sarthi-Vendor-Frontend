import React, { useState, useMemo } from 'react';

const EnhancedDataTable = ({
  columns,
  data,
  title,
  onRowClick,
  selectable = true,
  emptyMessage = "No records found"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage]);

  const totalPages = Math.ceil(filteredData.length / perPage) || 1;

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map((_, idx) => idx));
    }
  };

  const toggleRowSelect = (idx) => {
    if (selectedRows.includes(idx)) {
      setSelectedRows(selectedRows.filter(i => i !== idx));
    } else {
      setSelectedRows([...selectedRows, idx]);
    }
  };

  return (
    <div className="enhanced-table-container">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            className="per-page-select"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      <div className="table-outer-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="checkbox-cell">
                  <input type="checkbox" onChange={toggleSelectAll} checked={selectedRows.length === paginatedData.length && paginatedData.length > 0} />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? paginatedData.map((row, idx) => (
              <tr key={idx} onClick={() => onRowClick && onRowClick(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                {selectable && (
                  <td className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedRows.includes(idx)} onChange={() => toggleRowSelect(idx)} />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} data-label={col.label}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ textAlign: 'center', padding: '40px', color: '#98a2b3' }}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-footer">
        <div className="desktop-only" style={{ display: 'none' }}>
          Showing {Math.min(filteredData.length, (currentPage - 1) * perPage + 1)} to {Math.min(filteredData.length, currentPage * perPage)} of {filteredData.length} entries
        </div>
        <div className="mobile-only" style={{ display: 'block' }}>
          Page {currentPage} of {totalPages}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            className="btn-action"
            style={{ padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', color: '#475467' }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(v => v - 1)}
          >
            Previous
          </button>
          <button
            className="btn-action"
            style={{ padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', color: '#475467', marginLeft: '8px' }}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(v => v + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDataTable;
