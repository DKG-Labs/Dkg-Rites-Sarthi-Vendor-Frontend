import React, { useEffect, useState } from 'react';
import { deleteScrapVerification, fetchScrapPhoto, getScrapVerification } from '../../services/railpadScrapService';

export const fmtDate = (s) => {
  if (!s) return '-';
  const d = new Date(`${String(s).slice(0, 10)}T00:00:00`);
  return isNaN(d) ? s : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (s) => {
  if (!s) return '-';
  const d = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(s) ? s : `${s}+05:30`);
  return isNaN(d) ? s : d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

/** Loads a photo from the private container with the login token */
const AuthedPhoto = ({ url, alt, onOpen }) => {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let objectUrl = null;
    let alive = true;
    fetchScrapPhoto(url)
      .then(u => { objectUrl = u; if (alive) setSrc(u); else URL.revokeObjectURL(u); })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url]);
  return (
    <div className="rb-photo">
      {src ? <img src={src} alt={alt} onClick={() => onOpen(src)} />
        : <div style={{ fontSize: 11, padding: 8, color: '#64748b' }}>{failed ? 'Not available' : 'Loading…'}</div>}
    </div>
  );
};

/**
 * Details of a ledger entry.
 * Scrap rows: full verification (photos, declaration, audit trail) with Edit / Delete inside the 1-hour window.
 * Rejection rows: the rejection as recorded in inspection.
 */
export default function ScrapDetailModal({ row, onClose, onEdit, onDeleted, readOnly }) {
  const isScrap = row.rowType === 'SCRAP';
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(isScrap);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isScrap) return;
    getScrapVerification(row.verificationId)
      .then(setDetail)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [isScrap, row.verificationId]);

  const doDelete = async () => {
    if (reason.trim().length < 5) { setError('Please give a reason (at least 5 characters) for deleting.'); return; }
    setBusy(true);
    setError('');
    try {
      await deleteScrapVerification(detail.id, reason.trim());
      onDeleted();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rb-overlay" onClick={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="rb-modal" role="dialog" aria-modal="true">
        <div className="rb-modal-head">
          <h3>{isScrap ? `Scrap Verification ${row.reference || ''}` : row.transactionType}</h3>
          <button className="rb-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="rb-modal-body">
          {error && <div className="rb-error" style={{ margin: 0 }}>{error}</div>}

          {!isScrap && (
            <dl className="rb-kv">
              <dt>Date</dt><dd>{fmtDate(row.date)}</dd>
              <dt>Stage of inspection</dt><dd>{row.stage === 'FINAL' ? 'Final' : 'Process'}</dd>
              <dt>{row.stage === 'FINAL' ? 'Lot' : 'Batch'}</dt><dd>{row.reference || '-'}</dd>
              <dt>{row.stage === 'FINAL' ? 'Inspection call' : 'Shift / declaration'}</dt><dd>{row.callOrShift || '-'}</dd>
              <dt>Defect reason</dt><dd>{row.defectReason || '-'}</dd>
              <dt>Rejected quantity</dt><dd><strong>{Number(row.rejectedQty || 0).toLocaleString('en-IN')}</strong> pieces</dd>
              <dt>Pending after this entry</dt><dd>{Number(row.pendingBalance || 0).toLocaleString('en-IN')}</dd>
              <dt>Inspecting engineer</dt><dd>{row.engineer || '-'}</dd>
            </dl>
          )}

          {isScrap && loading && <div className="rb-empty">Loading…</div>}

          {isScrap && detail && (
            <>
              <dl className="rb-kv">
                <dt>Verification no.</dt><dd>{detail.verificationNo}</dd>
                <dt>Plant</dt><dd>{detail.manufacturer || '-'} · {detail.placeOfInspection || detail.plantId}</dd>
                <dt>Product type</dt><dd>{detail.productType}</dd>
                <dt>Scrapping date / shift</dt><dd>{fmtDate(detail.scrappingDate)}{detail.shift ? ` · Shift ${detail.shift}` : ''}</dd>
                <dt>Pending before scrapping</dt><dd>{Number(detail.availablePendingQty || 0).toLocaleString('en-IN')}</dd>
                <dt>Quantity scrapped</dt><dd><strong>{Number(detail.qtyScrapped || 0).toLocaleString('en-IN')}</strong> pieces</dd>
                <dt>Witnessed by</dt><dd>{detail.engineer || '-'}</dd>
                <dt>Recorded at</dt><dd>{fmtDateTime(detail.createdAt)}</dd>
                <dt>Remarks</dt><dd>{detail.remarks || '-'}</dd>
              </dl>

              <div className="rb-declaration" style={{ fontWeight: 500 }}>
                <span>{detail.declarationAccepted ? '☑' : '☐'}</span><span>{detail.declarationText}</span>
              </div>

              <div>
                <div className="rb-field"><label>Before scrapping</label></div>
                <div className="rb-photos" style={{ marginTop: 6 }}>
                  {detail.beforePhotos?.length ? detail.beforePhotos.map(u => <AuthedPhoto key={u} url={u} alt="Before scrapping" onOpen={setZoom} />)
                    : <span style={{ color: '#64748b' }}>No photos</span>}
                </div>
              </div>
              <div>
                <div className="rb-field"><label>After scrapping</label></div>
                <div className="rb-photos" style={{ marginTop: 6 }}>
                  {detail.afterPhotos?.length ? detail.afterPhotos.map(u => <AuthedPhoto key={u} url={u} alt="After scrapping" onOpen={setZoom} />)
                    : <span style={{ color: '#64748b' }}>No photos</span>}
                </div>
              </div>

              {detail.auditTrail?.length > 0 && (
                <div>
                  <div className="rb-field"><label>Audit trail</label></div>
                  <div className="rb-table-wrap" style={{ marginTop: 6 }}>
                    <table className="rb-table" style={{ minWidth: 560 }}>
                      <thead><tr><th>When</th><th>Action</th><th>Field</th><th>Old → New</th><th>Reason</th></tr></thead>
                      <tbody>
                        {detail.auditTrail.map((a, i) => (
                          <tr key={i}>
                            <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(a.actionAt)}</td>
                            <td>{a.action}</td>
                            <td>{a.field || '-'}</td>
                            <td>{a.oldValue ?? '-'} → {a.newValue ?? '-'}</td>
                            <td>{a.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!detail.editable && (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  🔒 Locked{detail.lockedAt ? ` since ${fmtDateTime(detail.lockedAt)}` : ''}: scrap verifications can only be changed within 1 hour, by the engineer who recorded them.
                </div>
              )}

              {deleting && (
                <div className="rb-field" style={{ minWidth: 0 }}>
                  <label>Reason for deleting * (recorded in the audit trail)</label>
                  <textarea className="rb-textarea" value={reason} onChange={e => setReason(e.target.value)} disabled={busy} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="rb-modal-foot">
          {isScrap && detail?.editable && !readOnly && !deleting && (
            <>
              <button className="rb-btn rb-btn--danger" onClick={() => { setDeleting(true); setError(''); }}>Delete</button>
              <button className="rb-btn" onClick={() => onEdit(detail)}>Edit</button>
            </>
          )}
          {deleting && (
            <>
              <button className="rb-btn" onClick={() => setDeleting(false)} disabled={busy}>Cancel</button>
              <button className="rb-btn rb-btn--danger" onClick={doDelete} disabled={busy}>{busy ? 'Deleting…' : 'Confirm Delete'}</button>
            </>
          )}
          {!deleting && <button className="rb-btn rb-btn--primary" onClick={onClose}>Close</button>}
        </div>
      </div>
      {zoom && <div className="rb-lightbox" onClick={() => setZoom(null)}><img src={zoom} alt="Photo" /></div>}
    </div>
  );
}
