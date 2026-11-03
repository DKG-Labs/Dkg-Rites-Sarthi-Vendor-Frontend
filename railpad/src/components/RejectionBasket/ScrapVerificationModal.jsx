import React, { useEffect, useRef, useState } from 'react';
import { addScrapVerification, getPendingScrap, updateScrapVerification } from '../../services/railpadScrapService';

export const DECLARATION_TEXT =
  'I certify that the rejected rail pads have been cut into pieces and made unusable as per IRS T-55 specifications.';
const SHIFTS = ['A', 'B', 'C', 'General'];
const MAX_PHOTOS = 5;
const MAX_INPUT_MB = 15;

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Resize to max 2400px and re-encode as JPEG so phone photos upload quickly */
const compressImage = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error(`${file.name} is not an image`));
  if (file.size > MAX_INPUT_MB * 1024 * 1024) return reject(new Error(`${file.name} is larger than ${MAX_INPUT_MB} MB`));
  const reader = new FileReader();
  reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error(`Could not open ${file.name}`));
    img.onload = () => {
      const scale = Math.min(1, 2400 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ fileName: file.name.replace(/\.[^.]+$/, '') + '.jpg', base64Data: dataUrl, preview: dataUrl });
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const PhotoPicker = ({ label, hint, photos, setPhotos, onError, disabled }) => {
  const inputRef = useRef(null);
  const [zoom, setZoom] = useState(null);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (photos.length + files.length > MAX_PHOTOS) {
      onError(`A maximum of ${MAX_PHOTOS} photos is allowed for "${label}".`);
      return;
    }
    try {
      const done = await Promise.all(files.map(compressImage));
      setPhotos(prev => [...prev, ...done]);
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <div>
      <div className="rb-field" style={{ marginBottom: 6 }}>
        <label>{label} *</label>
      </div>
      {hint && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{hint}</div>}
      <div className="rb-photos">
        {photos.map((p, i) => (
          <div className="rb-photo" key={i}>
            <img src={p.preview} alt={`${label} ${i + 1}`} onClick={() => setZoom(p.preview)} />
            {!disabled && (
              <button type="button" className="rb-photo-x" aria-label="Remove photo"
                onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}>×</button>
            )}
          </div>
        ))}
        {!disabled && photos.length < MAX_PHOTOS && (
          <button type="button" className="rb-photo-add" onClick={() => inputRef.current?.click()}>
            <span style={{ fontSize: 22 }}>📷</span>Add photo
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={onPick} />
      {zoom && (
        <div className="rb-lightbox" onClick={() => setZoom(null)}><img src={zoom} alt="Preview" /></div>
      )}
    </div>
  );
};

/**
 * Add a scrap verification, or edit one within its 1-hour window.
 * Props: mode ('add' | 'edit'), basketRow ({plantId, manufacturer, placeOfInspection, productType}),
 *        entry (existing record when editing), onClose(), onSaved(record)
 */
export default function ScrapVerificationModal({ mode = 'add', basketRow, entry, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const [pending, setPending] = useState(null);
  const [loadingPending, setLoadingPending] = useState(!isEdit);
  const [scrappingDate, setScrappingDate] = useState(entry?.scrappingDate || todayIso());
  const [shift, setShift] = useState(entry?.shift || '');
  const [qty, setQty] = useState(entry?.qtyScrapped ? String(entry.qtyScrapped) : '');
  const [before, setBefore] = useState([]);
  const [after, setAfter] = useState([]);
  const [declaration, setDeclaration] = useState(isEdit);
  const [remarks, setRemarks] = useState(entry?.remarks || '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getPendingScrap(basketRow.plantId, basketRow.productType)
      .then(d => { if (alive) setPending(d?.pendingScrapQty ?? 0); })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoadingPending(false); });
    return () => { alive = false; };
  }, [basketRow.plantId, basketRow.productType]);

  // When editing, this entry's own quantity counts as available again
  const available = pending == null ? null : pending + (isEdit ? (entry?.qtyScrapped || 0) : 0);

  const validate = () => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n <= 0) return 'Quantity witnessed for scrapping must be a whole number greater than zero.';
    if (available != null && n > available) return `Quantity cannot exceed the available pending scrap quantity (${available}).`;
    if (!scrappingDate) return 'Please select the scrapping date.';
    if (scrappingDate > todayIso()) return 'Scrapping date cannot be in the future.';
    if (!isEdit) {
      if (before.length === 0) return 'Please add at least one photo before scrapping.';
      if (after.length === 0) return 'Please add at least one photo after scrapping showing the pads cut into pieces.';
      if (!declaration) return 'Please accept the declaration.';
    }
    if (isEdit && reason.trim().length < 5) return 'Please give a reason (at least 5 characters) for this change.';
    return '';
  };

  const submit = async () => {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError('');
    setSaving(true);
    const strip = (list) => list.map(({ fileName, base64Data }) => ({ fileName, base64Data }));
    try {
      const payload = {
        plantId: basketRow.plantId,
        productType: basketRow.productType,
        scrappingDate,
        shift: shift || null,
        qtyScrapped: Number(qty),
        remarks,
        beforePhotos: before.length ? strip(before) : null,
        afterPhotos: after.length ? strip(after) : null,
      };
      const saved = isEdit
        ? await updateScrapVerification(entry.id, { ...payload, reason: reason.trim() })
        : await addScrapVerification({ ...payload, declarationAccepted: true });
      onSaved(saved);
    } catch (e) {
      setError(e.message || 'Could not save the scrap verification.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rb-overlay" onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="rb-modal" role="dialog" aria-modal="true">
        <div className="rb-modal-head">
          <h3>{isEdit ? `Edit Scrap Verification ${entry?.verificationNo || ''}` : 'Add Scrap Verification'}</h3>
          <button className="rb-close" onClick={onClose} disabled={saving} aria-label="Close">×</button>
        </div>

        <div className="rb-modal-body">
          <div className="rb-info">
            <div style={{ fontWeight: 800 }}>{basketRow.manufacturer || '-'} · {basketRow.placeOfInspection || basketRow.plantId}</div>
            <div style={{ marginTop: 4 }}>Product type: <strong>{basketRow.productType}</strong></div>
            <div style={{ marginTop: 4 }}>
              Available pending scrap quantity:{' '}
              <strong style={{ fontSize: 16 }}>
                {loadingPending ? 'Loading…' : (available ?? '-').toLocaleString('en-IN')}
              </strong> pieces
            </div>
          </div>

          {error && <div className="rb-error" style={{ margin: 0 }}>{error}</div>}

          <div className="rb-grid2">
            <div className="rb-field">
              <label>Quantity witnessed for scrapping (pieces) *</label>
              <input type="number" inputMode="numeric" min="1" step="1" value={qty}
                onChange={e => setQty(e.target.value.replace(/[^\d]/g, ''))} disabled={saving} />
            </div>
            <div className="rb-field">
              <label>Scrapping date *</label>
              <input type="date" value={scrappingDate} max={todayIso()}
                onChange={e => setScrappingDate(e.target.value)} disabled={saving} />
            </div>
            <div className="rb-field">
              <label>Shift</label>
              <select value={shift} onChange={e => setShift(e.target.value)} disabled={saving}>
                <option value="">Select shift</option>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <PhotoPicker
            label={isEdit ? 'Replace before-scrapping photos (optional)' : 'Before scrapping photographs'}
            hint="Rejected pads stacked for destruction."
            photos={before} setPhotos={setBefore} onError={setError} disabled={saving} />
          <PhotoPicker
            label={isEdit ? 'Replace after-scrapping photos (optional)' : 'After scrapping photographs'}
            hint="Must clearly show the pads cut into pieces."
            photos={after} setPhotos={setAfter} onError={setError} disabled={saving} />

          <div className="rb-field" style={{ minWidth: 0 }}>
            <label>Remarks</label>
            <textarea className="rb-textarea" value={remarks} onChange={e => setRemarks(e.target.value)} disabled={saving} />
          </div>

          {isEdit ? (
            <div className="rb-field" style={{ minWidth: 0 }}>
              <label>Reason for change * (recorded in the audit trail)</label>
              <textarea className="rb-textarea" value={reason} onChange={e => setReason(e.target.value)} disabled={saving} />
            </div>
          ) : (
            <label className="rb-declaration">
              <input type="checkbox" checked={declaration} onChange={e => setDeclaration(e.target.checked)} disabled={saving} />
              <span>{DECLARATION_TEXT}</span>
            </label>
          )}
        </div>

        <div className="rb-modal-foot">
          <button className="rb-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rb-btn rb-btn--primary" onClick={submit} disabled={saving || loadingPending}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit Scrap Verification'}
          </button>
        </div>
      </div>
    </div>
  );
}
