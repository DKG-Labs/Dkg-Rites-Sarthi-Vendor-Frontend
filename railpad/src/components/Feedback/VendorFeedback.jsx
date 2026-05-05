import React, { useState, useEffect, useCallback } from 'react';
import './VendorFeedback.css';
import { submitFeedback, getUserFeedback } from '../../services/feedbackService';

const VendorFeedback = ({ currentUser, productContext = 'Vendor' }) => {
    const [view, setView] = useState('submit');
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [feedbackInput, setFeedbackInput] = useState({
        subject: '',
        message: '',
        priority: 'Medium'
    });

    // Use the Vendor Code as the primary identifier. 
    // We strip the leading colon (e.g. ":41647" -> "41647") to avoid URL routing issues.
    const rawCode = currentUser?.vendorCode || currentUser?.userCode || currentUser?.userId || '';
    const effectiveUserId = rawCode.toString().startsWith(':') ? rawCode.toString().substring(1) : rawCode.toString();
    const displayCode = rawCode; 

    const fetchFeedbacks = useCallback(async () => {
        if (!effectiveUserId) return;
        setLoading(true);
        setErrorMsg('');
        try {
            const data = await getUserFeedback(effectiveUserId);
            if (Array.isArray(data)) {
                setFeedbacks(data);
            } else if (data?.responseData && Array.isArray(data.responseData)) {
                setFeedbacks(data.responseData);
            } else {
                setFeedbacks([]);
            }
        } catch (err) {
            console.error("Failed to load feedbacks", err);
            setErrorMsg("Could not load feedback history.");
            setFeedbacks([]);
        } finally {
            setLoading(false);
        }
    }, [effectiveUserId]);

    useEffect(() => {
        if (view === 'list') fetchFeedbacks();
    }, [view, fetchFeedbacks]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');
        try {
            const payload = {
                userId: effectiveUserId,      // Cleaned code e.g. "41647"
                userCode: displayCode,        // Original code e.g. ":41647"
                userName: currentUser?.userName || displayCode || 'RailPad Vendor',
                productType: productContext,
                roleName: currentUser?.roleName || 'Railpad Vendor',
                subject: feedbackInput.subject,
                message: feedbackInput.message,
                priority: feedbackInput.priority
            };
            const result = await submitFeedback(payload);
            const isSuccess =
                result?.responseStatus?.statusCode === 0 ||
                result?.id != null || result?.feedbackId != null ||
                result?.success === true ||
                (result && !result?.responseStatus);

            if (isSuccess) {
                setSuccessMsg("✓ Feedback submitted successfully!");
                setFeedbackInput({ subject: '', message: '', priority: 'Medium' });
                setTimeout(() => { setSuccessMsg(''); setView('list'); }, 2200);
            } else {
                setErrorMsg(result?.responseStatus?.message || "Submission failed. Please try again.");
            }
        } catch (err) {
            setErrorMsg("Network error. Please check your connection.");
        } finally {
            setSubmitting(false);
        }
    };

    const priorityStyle = (p) => {
        switch ((p || '').toLowerCase()) {
            case 'high':   return { background: '#fef2f2', color: '#dc2626' };
            case 'low':    return { background: '#f0fdf4', color: '#166534' };
            default:       return { background: '#fffbeb', color: '#92400e' };
        }
    };

    return (
        <div className="rp-feedback-container">
            <div className="rp-feedback-tabs">
                <button className={view === 'submit' ? 'active' : ''} onClick={() => setView('submit')}>
                    ✏️ Submit Feedback
                </button>
                <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
                    📋 My Feedback {feedbacks.length > 0 ? `(${feedbacks.length})` : ''}
                </button>
            </div>

            {view === 'submit' && (
                <div className="rp-form-card">
                    {successMsg && (
                        <div className="rp-banner rp-banner-success">{successMsg}</div>
                    )}
                    {errorMsg && (
                        <div className="rp-banner rp-banner-error">⚠️ {errorMsg}</div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="rp-form-header">
                            <h3>Send Feedback to Railway Board</h3>
                            <p>Rail-Pad Vendor Feedback · {productContext}</p>
                        </div>

                        <div className="rp-form-group">
                            <label>Subject</label>
                            <input
                                type="text"
                                placeholder="Subject of your feedback..."
                                value={feedbackInput.subject}
                                onChange={e => setFeedbackInput({ ...feedbackInput, subject: e.target.value })}
                                required
                            />
                        </div>
                        <div className="rp-form-group">
                            <label>Priority</label>
                            <select
                                value={feedbackInput.priority}
                                onChange={e => setFeedbackInput({ ...feedbackInput, priority: e.target.value })}
                            >
                                <option value="Low">🟢 Low</option>
                                <option value="Medium">🟡 Medium</option>
                                <option value="High">🔴 High</option>
                            </select>
                        </div>
                        <div className="rp-form-group">
                            <label>Message</label>
                            <textarea
                                placeholder="Describe your issue or suggestion..."
                                value={feedbackInput.message}
                                onChange={e => setFeedbackInput({ ...feedbackInput, message: e.target.value })}
                                required
                            />
                        </div>

                        <div className="rp-context-strip">
                            <span>🏷️ <strong>{productContext}</strong></span>
                            <span>👤 <strong>{displayCode || '—'}</strong></span>
                        </div>

                        <button type="submit" className="rp-submit-btn" disabled={submitting}>
                            {submitting ? '⏳ Submitting...' : '📤 Submit'}
                        </button>
                    </form>
                </div>
            )}

            {view === 'list' && (
                <div className="rp-list">
                    {errorMsg && <div className="rp-banner rp-banner-error">⚠️ {errorMsg}</div>}
                    {loading ? (
                        <div className="rp-center-state">
                            <div className="rp-spinner" />
                            <p>Loading your feedback...</p>
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="rp-center-state">
                            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                            <p>No feedback yet. Submit your first one!</p>
                            <button
                                onClick={() => setView('submit')}
                                className="rp-submit-btn"
                                style={{ marginTop: 16, width: 'auto', padding: '10px 24px' }}
                            >
                                ✏️ Submit Feedback
                            </button>
                        </div>
                    ) : (
                        feedbacks.map((f, idx) => (
                            <div key={f.feedbackId || f.id || idx} className="rp-card">
                                <div className="rp-card-meta">
                                    <span className="rp-priority" style={priorityStyle(f.priority)}>
                                        {f.priority || 'Medium'}
                                    </span>
                                    <span className="rp-date">
                                        {f.createdDate
                                            ? new Date(f.createdDate).toLocaleString()
                                            : f.createdAt
                                            ? new Date(f.createdAt).toLocaleString()
                                            : '—'}
                                    </span>
                                </div>
                                <h4 className="rp-subject">{f.subject}</h4>
                                <p className="rp-message">{f.message}</p>
                                {f.status && (
                                    <span className="rp-status-badge"
                                        style={{
                                            background: f.status === 'RESOLVED' ? '#f0fdf4' : '#eff6ff',
                                            color: f.status === 'RESOLVED' ? '#166534' : '#1d4ed8'
                                        }}>
                                        {f.status}
                                    </span>
                                )}
                                {f.replies && f.replies.length > 0 && (
                                    <div className="rp-replies">
                                        <div className="rp-replies-label">🏛️ Railway Board Replies</div>
                                        {f.replies.map((r, ri) => (
                                            <div key={r.replyId || r.id || ri} className="rp-reply">
                                                <div className="rp-reply-meta">
                                                    <strong>{r.userName || 'Railway Board'}</strong>
                                                    <span>{r.createdDate
                                                        ? new Date(r.createdDate).toLocaleString()
                                                        : r.createdAt
                                                        ? new Date(r.createdAt).toLocaleString()
                                                        : '—'}
                                                    </span>
                                                </div>
                                                <p>{r.replyMessage || r.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {feedbacks.length > 0 && !loading && (
                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <button onClick={fetchFeedbacks} className="rp-refresh-btn">
                                🔄 Refresh
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VendorFeedback;
