import React, { useState, useMemo } from 'react';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import Notification from './Notification';
import { getProductTypeDisplayName, formatDate } from '../utils/helpers';
import CallsFilterSection from './common/CallsFilterSection';
import { createStageValidationHandler } from '../utils/stageValidation';

const IssuanceOfICTab = ({ calls }) => {
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

  // Filter calls that are completed and ready for IC issuance
  const icCalls = calls.filter(c => c.status === 'Completed');

  // Apply filters to data
  const filteredCalls = useMemo(() => {
    let result = [...icCalls];

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
  }, [icCalls, filters]);

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
    { key: 'requested_date', label: 'Inspection Date', render: (val) => formatDate(val) },
    { key: 'stage', label: 'Stage' },
    { key: 'status', label: 'IC Status', render: () => <StatusBadge status="Ready for IC" /> },
  ];

  const selectedICCalls = filteredCalls.filter(call => selectedRows.includes(call.id));

  // Handler to validate and update selection - prevents selecting calls from different stages
  const handleSelectionChange = createStageValidationHandler(
    filteredCalls,
    selectedRows,
    setSelectedRows,
    setSelectionError
  );

  const handleBulkIssue = () => {
    console.log('Issue IC for selected:', selectedICCalls.map(call => call.call_no));
    setSelectedRows([]);
  };

  const handleBulkView = () => {
    console.log('View selected IC calls:', selectedICCalls.map(call => call.call_no));
  };

  const actions = selectedRows.length === 1 ? (row) => (
    selectedRows.includes(row.id) ? (
      <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
        <button className="btn btn-sm btn-primary" onClick={() => console.log('Issue IC for:', row.call_no)}>
          Issue IC
        </button>
        <button className="btn btn-sm btn-outline" onClick={() => console.log('View Details:', row.call_no)}>
          View
        </button>
      </div>
    ) : null
  ) : null;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Issuance of Inspection Certificate</h3>
          <p className="card-subtitle">Manage and issue inspection certificates for completed inspections</p>
        </div>
      </div>

      <CallsFilterSection
        allCalls={icCalls}
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
        summaryLabel="IC-ready calls"
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
            {selectedRows.length} inspection calls selected
          </div>
          <div className="pending-calls-bulk-actions-buttons" style={{ display: 'flex', gap: 'var(--space-12)' }}>
            <button className="btn btn-secondary" onClick={handleBulkView} style={{ minHeight: '44px' }}>
              VIEW SELECTED
            </button>
            <button className="btn btn-primary" onClick={handleBulkIssue} style={{ minHeight: '44px' }}>
              ISSUE IC FOR ALL
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

export default IssuanceOfICTab;