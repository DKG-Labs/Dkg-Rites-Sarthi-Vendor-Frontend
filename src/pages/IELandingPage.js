import React, { useState } from 'react';
import { MOCK_INSPECTION_CALLS } from '../data/mockData';
import Tabs from '../components/Tabs';
import PendingCallsTab from '../components/PendingCallsTab';
import CompletedCallsTab from '../components/CompletedCallsTab';
import IssuanceOfICTab from '../components/IssuanceOfICTab';
import PerformanceDashboard from '../components/PerformanceDashboard';
import Modal from '../components/Modal';

const IELandingPage = ({ onStartInspection, onStartMultipleInspections }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [selectedCalls, setSelectedCalls] = useState([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isBulkSchedule, setIsBulkSchedule] = useState(false);

  const pendingCount = MOCK_INSPECTION_CALLS.filter(call => call.status === 'Pending').length;
  const completedCount = MOCK_INSPECTION_CALLS.filter(call => call.status === 'Completed').length;

  const tabs = [
    { id: 'pending', label: 'List of Calls Pending', description: `${pendingCount} pending` },
    { id: 'certificates', label: 'Issuance of IC', description: `${completedCount} ready for IC` },
    { id: 'completed', label: 'Calls Completed', description: `${completedCount} completed` },
    { id: 'performance', label: 'Performance', description: 'KPI overview' },
  ];

  const handleSchedule = (call) => {
    setSelectedCall(call);
    setSelectedCalls([call]);
    setIsBulkSchedule(false);
    setShowScheduleModal(true);
  };

  const handleBulkSchedule = (calls) => {
    setSelectedCalls(calls);
    setIsBulkSchedule(true);
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = () => {
    if (isBulkSchedule) {
      console.log('Scheduling calls:', selectedCalls.map(c => c.call_no), 'Date:', scheduleDate, 'Remarks:', remarks);
    } else {
      console.log('Scheduling call:', selectedCall?.call_no, 'Date:', scheduleDate, 'Remarks:', remarks);
    }
    setShowScheduleModal(false);
    setScheduleDate('');
    setRemarks('');
    setSelectedCall(null);
    setSelectedCalls([]);
    setIsBulkSchedule(false);
  };

  const handleStart = (call) => {
    onStartInspection(call);
  };

  const handleBulkStart = (calls) => {
    onStartMultipleInspections(calls);
  };

  return (
    <div>
      <div className="breadcrumb">
        <div className="breadcrumb-item breadcrumb-active">Landing Page</div>
      </div>

      <h1 style={{ marginBottom: 'var(--space-24)' }}>IE Landing Page</h1>
      
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      
      {/* 1. List of Calls Pending - First */}
      {activeTab === 'pending' && (
        <PendingCallsTab
          calls={MOCK_INSPECTION_CALLS}
          onSchedule={handleSchedule}
          onStart={handleStart}
          onBulkSchedule={handleBulkSchedule}
          onBulkStart={handleBulkStart}
        />
      )}

      {/* 2. Issuance of IC - Second */}
      {activeTab === 'certificates' && (
        <IssuanceOfICTab calls={MOCK_INSPECTION_CALLS} />
      )}

      {/* 3. Calls Completed - Third */}
      {activeTab === 'completed' && (
        <CompletedCallsTab calls={MOCK_INSPECTION_CALLS} />
      )}

      {/* 4. Performance - Fourth (Last) */}
      {activeTab === 'performance' && (
        <PerformanceDashboard />
      )}

      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title={isBulkSchedule ? `Schedule ${selectedCalls.length} Inspection Calls` : "Schedule / Reschedule Inspection"}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleScheduleSubmit}>Confirm</button>
          </>
        }
      >
        {isBulkSchedule && (
          <div style={{ marginBottom: 'var(--space-16)', padding: 'var(--space-12)', background: 'var(--color-bg-1)', borderRadius: 'var(--radius-base)' }}>
            <strong>Selected Calls:</strong> {selectedCalls.map(c => c.call_no).join(', ')}
          </div>
        )}
        <div className="form-group">
          <label className="form-label required">Schedule Date</label>
          <input
            type="date"
            className="form-control"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            min="2025-11-14"
            max="2025-11-24"
          />
          <small style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Must be within 10 days from vendor request
          </small>
        </div>
        <div className="form-group">
          <label className="form-label required">Remarks</label>
          <textarea
            className="form-control"
            rows="3"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter remarks for scheduling..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default IELandingPage;
