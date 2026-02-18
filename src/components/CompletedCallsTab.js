import React, { useState, useMemo } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import Notification from './Notification';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';
import CallsFilterSection from './common/CallsFilterSection';
import { createStageValidationHandler } from '../utils/stageValidation';

const CompletedCallsTab = ({ calls }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Call Number');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectionError, setSelectionError] = useState('');
  const [filters, setFilters] = useState({
    productTypes: [],
    vendors: [],
    dateFrom: '',
    dateTo: '',
    poNumbers: [],
    stage: '',
    callNumbers: []
  });

  const completedCalls = calls.filter(c => c.status === 'Completed');

  // Apply filters to data
  const filteredCalls = useMemo(() => {
    let result = [...completedCalls];

    if (filters.productTypes.length > 0) {
      result = result.filter(call => filters.productTypes.includes(call.product_type));
    }
    if (filters.vendors.length > 0) {
      result = result.filter(call => filters.vendors.includes(call.vendor_name));
    }
    if (filters.dateFrom) {
      result = result.filter(call => new Date(call.requested_date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      result = result.filter(call => new Date(call.requested_date) <= new Date(filters.dateTo));
    }
    if (filters.poNumbers.length > 0) {
      result = result.filter(call => filters.poNumbers.includes(call.po_no));
    }
    if (filters.stage) {
      result = result.filter(call => call.stage === filters.stage);
    }
    if (filters.callNumbers.length > 0) {
      result = result.filter(call => filters.callNumbers.includes(call.call_no));
    }

    return result;
  }, [completedCalls, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectToggle = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      productTypes: [],
      vendors: [],
      dateFrom: '',
      dateTo: '',
      poNumbers: [],
      stage: '',
      callNumbers: []
    });
  };

  const columns = [
    { key: 'call_no', label: 'Call No.' },
    { key: 'po_no', label: 'PO No.' },
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'product_type', label: 'Product Type', render: (val) => getProductTypeDisplayName(val) },
    { key: 'requested_date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  const selectedCompletedCalls = filteredCalls.filter(call => selectedRows.includes(call.id));

  // Handler to validate and update selection - prevents selecting calls from different stages
  const handleSelectionChange = createStageValidationHandler(
    filteredCalls,
    selectedRows,
    setSelectedRows,
    setSelectionError
  );

  const handleBulkViewPO = () => {
    console.log('View POs for:', selectedCompletedCalls.map(call => call.po_no));
  };

  const handleBulkDownloadPO = () => {
    console.log('Download POs for:', selectedCompletedCalls.map(call => call.po_no));
  };

  const actions = selectedRows.length === 1 ? (row) => (
    selectedRows.includes(row.id) ? (
      <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
        <button className="btn btn-sm btn-primary" onClick={() => console.log('View PO:', row.po_no)}>
          View PO
        </button>
        <button className="btn btn-sm btn-outline" onClick={() => console.log('Download PO:', row.po_no)}>
          Download PO
        </button>
      </div>
    ) : null
  ) : null;

  return (
    <div>
      <CallsFilterSection
        allCalls={completedCalls}
        filteredCalls={filteredCalls}
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filterSearch={filterSearch}
        setFilterSearch={setFilterSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        clearAllFilters={clearAllFilters}
        handleFilterChange={handleFilterChange}
        handleMultiSelectToggle={handleMultiSelectToggle}
        summaryLabel="completed calls"
      />

      {/* Selection Error Message */}
      <Notification
        message={selectionError}
        type="error"
        autoClose={true}
        autoCloseDelay={5000}
        onClose={() => setSelectionError('')}
      />

      {selectedRows.length > 1 && (
        <div className="pending-calls-bulk-actions" style={{
          marginBottom: 'var(--space-16)',
          padding: 'var(--space-16)',
          background: 'var(--color-bg-1)',
          borderRadius: 'var(--radius-base)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
            {selectedRows.length} completed calls selected
          </div>
          <div className="pending-calls-bulk-actions-buttons" style={{ display: 'flex', gap: 'var(--space-12)' }}>
            <button className="btn btn-secondary" onClick={handleBulkViewPO} style={{ minHeight: '44px' }}>
              VIEW SELECTED PO
            </button>
            <button className="btn btn-primary" onClick={handleBulkDownloadPO} style={{ minHeight: '44px' }}>
              DOWNLOAD SELECTED PO
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredCalls}
        actions={actions}
        selectable
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
};

export default CompletedCallsTab;
