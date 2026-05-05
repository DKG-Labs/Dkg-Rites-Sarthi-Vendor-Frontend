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
                // Backend returned error or empty — just show empty list
                setFeedbacks([]);
            }
        } catch (err) {
            console.error("Failed to load feedbacks", err);
            setErrorMsg("Could not load feedback history. The backend may not have any records yet.");
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
        if (!effectiveUserId) {
            setErrorMsg("User not identified. Please log in again.");
            return;
        }
        setSubmitting(true);
        setErrorMsg('');
        try {
            const payload = {
                userId: effectiveUserId,      // Vendor Code e.g. ":41647"
                userCode: displayCode,        
                userName: currentUser?.userName || displayCode || 'Sleeper Vendor',
                productType: productContext,
                roleName: currentUser?.roleName || 'Sleeper Vendor',
                subject: feedbackInput.subject,
                message: feedbackInput.message,
                priority: feedbackInput.priority
            };
            const result = await submitFeedback(payload);

            // Accept various success response shapes
            const isSuccess =
                result?.responseStatus?.statusCode === 0 ||
                result?.id != null ||
                result?.feedbackId != null ||
                result?.success === true ||
                (result && !result?.responseStatus); // no status = raw object

            if (isSuccess) {
                setSuccessMsg("✓ Feedback submitted! The Railway Board will review and respond shortly.");
                setFeedbackInput({ subject: '', message: '', priority: 'Medium' });
                setTimeout(() => {
                    setSuccessMsg('');
                    setView('list');
                }, 2200);
            } else {
                setErrorMsg(result?.responseStatus?.message || "Submission failed. Please try again.");
            }
        } catch (err) {
            console.error("Feedback submit error:", err);
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
        <div className="feedback-container-v2">
            {/* Tab bar */}
            <div className="feedback-tabs-v2">
                <button
                    className={view === 'submit' ? 'active' : ''}
                    onClick={() => setView('submit')}
                >
                    ✏️&nbsp; Submit Feedback
                </button>
                <button
                    className={view === 'list' ? 'active' : ''}
                    onClick={() => setView('list')}
                >
                    📋&nbsp; My Feedback {feedbacks.length > 0 ? `(${feedbacks.length})` : ''}
                </button>
            </div>

            {/* ── SUBMIT TAB ── */}
            {view === 'submit' && (
                <div className="feedback-form-wrapper">
                    {successMsg && (
                        <div style={{
                            background: '#f0fdf4', borderBottom: '1px solid #d1fae5',
                            padding: '14px 40px', color: '#065f46', fontWeight: 600, fontSize: 14
                        }}>
                            {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div style={{
                            background: '#fef2f2', borderBottom: '1px solid #fee2e2',
                            padding: '14px 40px', color: '#991b1b', fontWeight: 600, fontSize: 14
                        }}>
                            ⚠️ {errorMsg}
                        </div>
                    )}
                    <form className="feedback-form-v2" onSubmit={handleSubmit}>
                        <div className="form-header">
                            <h3>submit your feedback, issue & Suggestion</h3>
                        </div>

                        <div className="form-group">
                            <label>Subject</label>
                            <input
                                type="text"
                                placeholder="Brief subject of your feedback..."
                                value={feedbackInput.subject}
                                onChange={e => setFeedbackInput({ ...feedbackInput, subject: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
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

                        <div className="form-group">
                            <label>Detailed Message</label>
                            <textarea
                                placeholder="Describe your issue or suggestion in detail..."
                                value={feedbackInput.message}
                                onChange={e => setFeedbackInput({ ...feedbackInput, message: e.target.value })}
                                required
                            />
                        </div>

                        {/* Context strip */}
                        <div style={{
                            background: '#f8fafc', borderRadius: 10, padding: '10px 14px',
                            fontSize: 12, color: '#64748b', marginBottom: '1.5rem',
                            display: 'flex', gap: '1.5rem', flexWrap: 'wrap'
                        }}>
                            <span>🏷️ Module: <strong>{productContext}</strong></span>
                            <span>👤 Vendor Code: <strong>{displayCode || '—'}</strong></span>
                        </div>

                        <button type="submit" className="submit-btn" disabled={submitting}>
                            {submitting ? '⏳ Submitting...' : '📤 Submit'}
                        </button>
                    </form>
                </div>
            )}

            {/* ── LIST TAB ── */}
            {view === 'list' && (
                <div className="feedback-list-v2">
                    {errorMsg && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fee2e2',
                            borderRadius: 12, padding: '14px 20px',
                            color: '#991b1b', fontWeight: 600, fontSize: 14, marginBottom: 16
                        }}>
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner" />
                            <p>Loading your feedback...</p>
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="empty-state">
                            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                            <p>No feedback yet. Submit your first one!</p>
                            <button
                                onClick={() => setView('submit')}
                                className="submit-btn"
                                style={{ marginTop: 16, width: 'auto', padding: '10px 24px' }}
                            >
                                ✏️ Submit Feedback
                            </button>
                        </div>
                    ) : (
                        feedbacks.map((f, idx) => (
                            <div key={f.feedbackId || f.id || idx} className="feedback-card-v2">
                                <div className="feedback-card-header">
                                    <div className="feedback-meta">
                                        <span
                                            className="priority-badge"
                                            style={priorityStyle(f.priority)}
                                        >
                                            {f.priority || 'Medium'}
                                        </span>
                                        <span className="feedback-date">
                                            {f.createdDate
                                                ? new Date(f.createdDate).toLocaleString()
                                                : f.createdAt
                                                ? new Date(f.createdAt).toLocaleString()
                                                : '—'
                                            }
                                        </span>
                                    </div>
                                    <h4>{f.subject}</h4>
                                </div>
                                <div className="feedback-body">
                                    <p>{f.message}</p>
                                </div>

                                {f.status && (
                                    <div style={{ marginTop: 8 }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 700, padding: '3px 10px',
                                            borderRadius: 50,
                                            background: f.status === 'RESOLVED' ? '#f0fdf4' : '#eff6ff',
                                            color: f.status === 'RESOLVED' ? '#166534' : '#1d4ed8'
                                        }}>
                                            {f.status}
                                        </span>
                                    </div>
                                )}

                                {f.replies && f.replies.length > 0 && (
                                    <div className="feedback-replies">
                                        <div className="replies-divider">
                                            <span>🏛️ Railway Board Replies</span>
                                        </div>
                                        {f.replies.map((r, ri) => (
                                            <div key={r.replyId || r.id || ri} className="reply-item">
                                                <div className="reply-user-info">
                                                    <strong>{r.userName || r.repliedBy || 'Railway Board'}</strong>
                                                    <span className="reply-date">
                                                        {r.createdDate
                                                            ? new Date(r.createdDate).toLocaleString()
                                                            : r.createdAt
                                                            ? new Date(r.createdAt).toLocaleString()
                                                            : '—'
                                                        }
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
                            <button onClick={fetchFeedbacks} style={{
                                background: 'none', border: '1.5px solid #3b82f6',
                                color: '#3b82f6', padding: '8px 20px',
                                borderRadius: 10, fontWeight: 700,
                                cursor: 'pointer', fontSize: 13
                            }}>
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
