import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getSleeperBasket, getSleeperLedger } from '../../services/sleeperScrapService';
import SleeperScrapLedgerTable from './SleeperScrapLedgerTable';
import { exportExcel, exportPdf } from './basketExport';
import './RejectionScrapping.css';

const normPlant = (v) => String(v || '').trim().replace(/^:+/, '');

/**
 * Vendor view of Sleeper Rejection & Disposal (SRS: View Rejection Basket, Rejection History and Scrap Ledger,
 * own plant only). Same layout as the IE / ERC screen, read-only: scrap verifications are recorded by the IE.
 */
export default function VendorRejectionDisposal() {
  const [plants, setPlants] = useState([]);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [plantsError, setPlantsError] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    setPlantsLoading(true);
    setPlantsError('');
    getSleeperBasket()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setPlants(list);
        // Prefer the plant the vendor is working on in the dashboard
        const current = normPlant(sessionStorage.getItem('plantId') || localStorage.getItem('plantId'));
        if (current && list.some(p => p.plantId === current)) setSelectedPlant(current);
        else if (list.length === 1) setSelectedPlant(list[0].plantId);
      })
      .catch(e => {
        setPlants([]);
        setPlantsError(e.message || 'Could not load plants');
        showToast(`Could not load plants — ${e.message || 'please try again'}`, 'error');
      })
      .finally(() => setPlantsLoading(false));
  }, [showToast]);

  // The ledger response also carries the pending sleepers, so one request loads the whole screen
  const loadPlantData = useCallback((plant) => {
    if (!plant) return;
    setLedgerLoading(true);
    setLedgerError('');
    getSleeperLedger(plant)
      .then(setLedger)
      .catch(e => {
        setLedger(null);
        setLedgerError(e.message || 'Could not load the ledger');
        showToast(e.message || 'Could not load the ledger', 'error');
      })
      .finally(() => setLedgerLoading(false));
  }, [showToast]);

  useEffect(() => {
    if (selectedPlant) loadPlantData(selectedPlant);
    else { setLedger(null); setLedgerError(''); }
  }, [selectedPlant, loadPlantData]);

  const pending = ledger?.pendingSleepers || null;
  const unidentified = ledger?.unidentifiedDefects || 0;
  const plantObj = useMemo(() => plants.find(p => p.plantId === selectedPlant), [plants, selectedPlant]);
  const plantLabel = plantObj
    ? `${plantObj.manufacturer || plantObj.plantId}${plantObj.placeOfInspection ? ` — ${plantObj.placeOfInspection}` : ''}`
    : selectedPlant;

  const handleExport = (kind) => {
    const rows = (ledger?.rows || []).filter(r => !(r.rowType === 'REJECTION' && !r.rejectedQty));
    if (!rows.length) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const title = `Sleeper Rejection & Disposal Ledger - ${plantLabel}`;
    const subtitle = `Total Rejected: ${ledger?.totalRejected ?? 0} | Total Disposed: ${ledger?.totalScrapped ?? 0} | Pending Balance: ${ledger?.pendingBalance ?? 0}`;
    const cols = [
      { header: 'Date', value: r => r.entryDate || '-' },
      { header: 'Transaction', value: r => r.transactionType || (r.rowType === 'REJECTION' ? 'Rejection' : 'Scrap Verification') },
      { header: 'Batch & Ref.', value: r => [r.batchNo && `Batch ${r.batchNo}`, r.rowType === 'SCRAP' ? r.scrapVerificationId : null].filter(Boolean).join(' / ') || '-' },
      { header: 'Sleeper IDs Involved', value: r => (r.sleeperIds || []).join(', ') || '-' },
      { header: 'Rejected (+)', value: r => (r.rowType === 'REJECTION' ? r.rejectedQty : '-') },
      { header: 'Scrapped (-)', value: r => (r.rowType === 'SCRAP' ? r.scrappedQty : '-') },
      { header: 'Running Pending Balance', value: r => r.pendingBalance ?? '-' },
      { header: 'Shift', value: r => r.shift || '-' },
      { header: 'Engineer', value: r => r.ieName || '-' },
    ];
    const file = `Sleeper_Disposal_${selectedPlant.replace(/[^A-Za-z0-9]+/g, '_')}_${stamp}`;
    if (kind === 'pdf') exportPdf(file, title, subtitle, cols, rows);
    else exportExcel(file, title, cols, rows);
  };

  return (
    <div className="rs-wrapper rs-wrapper-embedded">

      {/* Top bar */}
      <div className="rs-topbar">
        <div className="rs-title-block">
          <h2 className="rs-title">
            <span className="rs-title-icon">🗑️</span>
            Rejection &amp; Disposal
          </h2>
          <p className="rs-subtitle">Vendor — Rejected sleepers, pending scrap basket and scrap ledger (view only)</p>
        </div>
        <div className="rs-top-actions">
          {ledger && (ledger.rows || []).length > 0 && (
            <>
              <button type="button" className="rs-export-btn" onClick={() => handleExport('excel')} title="Export ledger to Excel">📊 Excel</button>
              <button type="button" className="rs-export-btn" onClick={() => handleExport('pdf')} title="Export ledger to PDF">📄 PDF</button>
            </>
          )}
        </div>
      </div>

      {/* Controls panel */}
      <div className="rs-controls-panel">
        <div className="rs-controls">
          <div className="rs-plant-block">
            <span className="rs-label">Plant</span>
            {plantsLoading ? (
              <div className="rs-skeleton-select" />
            ) : plantsError ? (
              <div className="rs-no-plants">⚠️ Unable to load plants — {plantsError}</div>
            ) : plants.length === 0 ? (
              <div className="rs-no-plants">⚠️ No plants registered for this vendor</div>
            ) : plants.length === 1 ? (
              <div className="rs-plant-chip">
                <span className="rs-plant-chip-name">
                  {plants[0].manufacturer || plants[0].plantId}
                  {plants[0].placeOfInspection ? ` — ${plants[0].placeOfInspection}` : ''}
                </span>
                <span className="rs-plant-chip-code">{plants[0].plantId}</span>
              </div>
            ) : (
              <select className="rs-select" value={selectedPlant} onChange={e => setSelectedPlant(e.target.value)}>
                <option value="">— Select Plant —</option>
                {plants.map(p => (
                  <option key={p.plantId} value={p.plantId}>
                    {p.placeOfInspection ? `${p.placeOfInspection} (${p.plantId})` : p.plantId}
                  </option>
                ))}
              </select>
            )}
          </div>

          {ledger && (
            <div className="rs-kpi-row">
              <div className="rs-kpi">
                <div className="rs-kpi-label">Total Rejected</div>
                <div className={`rs-kpi-value ${ledger.totalRejected > 0 ? 'red' : 'green'}`}>{ledger.totalRejected ?? 0}</div>
              </div>
              <div className="rs-kpi">
                <div className="rs-kpi-label">Total Disposed</div>
                <div className="rs-kpi-value green">{ledger.totalScrapped ?? 0}</div>
              </div>
              <div className="rs-kpi">
                <div className="rs-kpi-label">Pending Balance</div>
                <div className={`rs-kpi-value ${ledger.pendingBalance > 0 ? 'orange' : 'green'}`}>{ledger.pendingBalance ?? 0}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {unidentified > 0 && (
        <div className="rs-warn-box">
          <span>⚠️</span>
          <span>
            {unidentified} demoulding defect record{unidentified === 1 ? '' : 's'} for this plant
            {unidentified === 1 ? ' has' : ' have'} no bench number, so the sleeper ID cannot be identified and
            {unidentified === 1 ? ' it is' : ' they are'} not shown in the basket. Please contact the IE.
          </span>
        </div>
      )}

      {/* Ledger card */}
      <div className="rs-card">
        {!selectedPlant ? (
          <div className="rs-prompt">
            <span className="rs-prompt-icon">🏭</span>
            <span className="rs-prompt-text">Select a plant above to view the rejection &amp; disposal ledger</span>
          </div>
        ) : ledgerError && !ledgerLoading ? (
          <div className="rs-prompt">
            <span className="rs-prompt-icon">⚠️</span>
            <span className="rs-prompt-text">Unable to load the ledger — {ledgerError}</span>
            <button type="button" className="rs-btn rs-btn-ghost rs-btn-xs" onClick={() => loadPlantData(selectedPlant)}>Retry</button>
          </div>
        ) : (
          <SleeperScrapLedgerTable
            rows={ledger?.rows}
            loading={ledgerLoading}
            readOnly
            onRefresh={() => loadPlantData(selectedPlant)}
            onToast={showToast}
            pendingSleepers={pending}
            pendingLoading={ledgerLoading}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rs-toast ${toast.type}`}>
          <span className="rs-toast-icon">{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.msg}</span>
          <button className="rs-toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
