import React, { useEffect, useState } from 'react';
import { AuthedImg, getSleeperScrapVerification } from '../../services/sleeperScrapService';
import './RejectionScrapping.css';

const fmtTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
};

const FIELD_LABELS = {
  sleepers: 'Sleepers', scrapping_date: 'Disposal date', shift: 'Shift', remarks: 'Remarks',
  before_photos: 'Before photos', after_photos: 'After photos', status: 'Status',
};

const SleepersTable = ({ sleepers }) => (
  <div className="rs-table-wrap rs-detail-table">
    <table className="rs-table">
      <thead>
        <tr>
          <th>#</th><th>Batch No.</th><th>Sleeper ID</th><th>Sleeper Type</th><th>Stage</th><th>Reason</th><th>Rejected On</th><th>Shift</th>
        </tr>
      </thead>
      <tbody>
        {(sleepers || []).map((s, i) => (
          <tr key={`${s.batchNo}-${s.sleeperNo}-${i}`}>
            <td style={{ color: '#94a3b8' }}>{i + 1}</td>
            <td>{s.batchNo || '—'}</td>
            <td><span className="rs-sleeper-chip">{s.sleeperNo}</span></td>
            <td>{s.sleeperType || '—'}</td>
            <td>{s.stageLabel || s.stage || '—'}</td>
            <td className="rs-reason-cell" title={s.reason || ''}>{s.reason || '—'}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{s.rejectionDate || '—'}</td>
            <td>{s.shift || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PhotoStrip = ({ title, urls, onOpen }) => (
  <div className="rs-field">
    <span className="rs-field-label">{title}</span>
    {urls && urls.length ? (
      <div className="rs-thumbs">
        {urls.map((u, i) => (
          <div key={u} className="rs-thumb" style={{ cursor: 'zoom-in' }} onClick={() => onOpen(urls)}>
            <AuthedImg src={u} alt={`${title} ${i + 1}`} />
          </div>
        ))}
      </div>
    ) : <span className="rs-muted">No photos</span>}
  </div>
);

/** Drill-down of one ledger transaction: the rejection's sleepers, or the full scrap verification record */
export default function SleeperEntryDetailModal({ row, onClose }) {
  const isScrap = row.rowType === 'SCRAP';
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(isScrap);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!isScrap || !row.verificationId) return;
    setLoading(true);
    getSleeperScrapVerification(row.verificationId)
      .then(setDetail)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [isScrap, row.verificationId]);

  const sleepers = isScrap ? (detail?.sleepers || row.sleepers) : row.sleepers;

  return (
    <div className="rs-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rs-modal rs-modal-lg">
        <div className="rs-modal-header">
          <div className="rs-modal-title">
            {isScrap
              ? <><span>✓</span> Scrap Verification {row.scrapVerificationId}</>
              : <><span>✕</span> Rejection — {row.stageOfInspection}</>}
          </div>
          <button className="rs-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="rs-modal-body">
          {error && <div className="rs-error-box"><span>⚠️</span>{error}</div>}

          <div className="rs-detail-grid">
            <div><span className="rs-field-label">Date</span><div>{row.entryDate || '—'}</div></div>
            <div><span className="rs-field-label">Shift</span><div>{row.shift || '—'}</div></div>
            <div><span className="rs-field-label">{isScrap ? 'Plant' : 'Line / Shed / Call'}</span><div>{row.unitLineShedNo || '—'}</div></div>
            <div><span className="rs-field-label">Batch</span><div>{row.batchNo || '—'}</div></div>
            <div><span className="rs-field-label">{isScrap ? 'Sleepers Scrapped' : 'Sleepers Rejected'}</span>
              <div className={isScrap ? 'rs-detail-num green' : 'rs-detail-num red'}>{isScrap ? row.scrappedQty : row.rejectedQty}</div>
            </div>
            <div><span className="rs-field-label">Engineer</span><div>{row.ieName || '—'}</div></div>
            {isScrap && detail && (
              <div>
                <span className="rs-field-label">Status</span>
                <div>{detail.editable ? `Editable until ${fmtTime(detail.lockedAt)}` : '🔒 Locked'}</div>
              </div>
            )}
          </div>

          {!isScrap && (row.reasonBreakup || []).length > 0 && (
            <div className="rs-field" style={{ marginTop: 16 }}>
              <span className="rs-field-label">
                Reason-wise Rejection — {row.entryDate || '—'} · Shift {row.shift || '—'} · {row.stageOfInspection}
              </span>
              <div className="rs-table-wrap rs-detail-table">
                <table className="rs-table">
                  <thead><tr><th>Reason for Rejection</th><th style={{ width: 110 }}>Sleepers</th><th style={{ width: 90 }}>Share</th></tr></thead>
                  <tbody>
                    {row.reasonBreakup.map(b => (
                      <tr key={b.reason}>
                        <td>{b.reason}</td>
                        <td style={{ color: '#dc2626', fontWeight: 700 }}>{b.count}</td>
                        <td style={{ color: '#64748b' }}>
                          {row.rejectedQty ? `${Math.round((b.count / row.rejectedQty) * 100)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!isScrap && !(row.reasonBreakup || []).length && row.remarks && (
            <div className="rs-detail-note"><strong>Reason:</strong> {row.remarks}</div>
          )}

          <div className="rs-field" style={{ margin: '16px 0' }}>
            <span className="rs-field-label">Sleeper IDs Involved ({(sleepers || []).length})</span>
            {loading ? <div className="rs-skeleton" style={{ width: '100%', height: 60 }} /> : <SleepersTable sleepers={sleepers} />}
          </div>

          {isScrap && detail && (
            <>
              <div className="rs-form-grid" style={{ marginBottom: 16 }}>
                <PhotoStrip title="Before Scrapping" urls={detail.beforePhotos} onOpen={setLightbox} />
                <PhotoStrip title="After Scrapping" urls={detail.afterPhotos} onOpen={setLightbox} />
              </div>
              {detail.remarks && <div className="rs-detail-note"><strong>Remarks:</strong> {detail.remarks}</div>}
              <div className="rs-declaration" style={{ marginTop: 12 }}>
                <label style={{ cursor: 'default' }}>
                  <input type="checkbox" checked={!!detail.declarationAccepted} readOnly />
                  {detail.declarationText}
                </label>
              </div>
              <div className="rs-detail-meta">Recorded {fmtTime(detail.createdAt)} by {detail.engineer || '—'}</div>

              {detail.auditTrail && detail.auditTrail.length > 0 && (
                <div className="rs-field" style={{ marginTop: 16 }}>
                  <span className="rs-field-label">Audit Trail</span>
                  <div className="rs-table-wrap rs-detail-table">
                    <table className="rs-table">
                      <thead><tr><th>When</th><th>Action</th><th>Field</th><th>Old</th><th>New</th><th>Reason</th></tr></thead>
                      <tbody>
                        {detail.auditTrail.map((a, i) => (
                          <tr key={i}>
                            <td style={{ whiteSpace: 'nowrap' }}>{fmtTime(a.actionAt)}</td>
                            <td>{a.action}</td>
                            <td>{FIELD_LABELS[a.field] || a.field}</td>
                            <td className="rs-reason-cell" title={a.oldValue || ''}>{a.oldValue || '—'}</td>
                            <td className="rs-reason-cell" title={a.newValue || ''}>{a.newValue || '—'}</td>
                            <td className="rs-reason-cell" title={a.reason || ''}>{a.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rs-modal-footer">
          <button className="rs-btn rs-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>

      {lightbox && (
        <div className="rs-lightbox" onClick={() => setLightbox(null)}>
          <button className="rs-lightbox-close" onClick={() => setLightbox(null)} title="Close">✕</button>
          {lightbox.map((url, i) => (
            <AuthedImg key={i} src={url} alt={`${i + 1} of ${lightbox.length}`} onClick={e => e.stopPropagation()} />
          ))}
        </div>
      )}
    </div>
  );
}
