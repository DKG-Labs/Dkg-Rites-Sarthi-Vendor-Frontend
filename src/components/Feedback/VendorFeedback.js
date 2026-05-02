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
            // Handle both array and wrapped response formats
            if (Array.isArray(data)) {
                setFeedbacks(data);
            } else if (data?.responseData && Array.isArray(data.responseData)) {
                setFeedbacks(data.responseData);
            } else {
                setFeedbacks([]);
            }
        } catch (err) {
            console.error("Failed to load feedbacks", err);
            setErrorMsg("Could not load feedback. Please try again.");
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
            const newFeedback = {
                userId: effectiveUserId,           // Vendor Code e.g. ":41647"
                userCode: displayCode,             
                userName: currentUser?.vendorName || currentUser?.userName || displayCode || 'Vendor User',
                productType: productContext,
                roleName: Array.isArray(currentUser?.roleName)
                    ? currentUser.roleName.join(', ')
                    : (currentUser?.roleName || 'Vendor'),
                subject: feedbackInput.subject,
                message: feedbackInput.message,
                priority: feedbackInput.priority
            };
            const result = await submitFeedback(newFeedback);
            if (result?.responseStatus?.statusCode === 0 || result?.id || result?.feedbackId || result?.success) {
                setSuccessMsg("✓ Feedback submitted successfully! The Railway Board will review and respond.");
                setFeedbackInput({ subject: '', message: '', priority: 'Medium' });
                setTimeout(() => {
                    setSuccessMsg('');
                    setView('list');
                }, 2000);
            } else {
                setErrorMsg(result?.responseStatus?.message || "Failed to submit. Please try again.");
            }
        } catch (err) {
            console.error("Error submitting feedback:", err);
            setErrorMsg("Network error. Please check your connection and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const getPriorityClass = (priority) => {
        switch ((priority || '').toLowerCase()) {
            case 'high': return 'priority-pill' ;
            case 'low':  return 'priority-pill' ;
            default:     return 'priority-pill' ;
        }
    };

    const getPriorityStyle = (priority) => {
        switch ((priority || '').toLowerCase()) {
            case 'high':   return { background: '#fef2f2', color: '#dc2626' };
            case 'low':    return { background: '#f0fdf4', color: '#166534' };
            default:       return { background: '#fffbeb', color: '#92400e' };
        }
    };

    return (
        <div className="feedback-section-container">
            {/* Tab Navigation */}
            <div className="feedback-header-card">
                <nav className="feedback-nav">
                    <button
                        className={`feedback-tab-btn ${view === 'submit' ? 'active' : ''}`}
                        onClick={() => setView('submit')}
                    >
                        ✏️ &nbsp;Submit Feedback
                    </button>
                    <button
                        className={`feedback-tab-btn ${view === 'list' ? 'active' : ''}`}
                        onClick={() => setView('list')}
                    >
                        📋 &nbsp;My Feedback {feedbacks.length > 0 ? `(${feedbacks.length})` : ''}
                    </button>
                </nav>
            </div>

            {/* ── SUBMIT VIEW ── */}
            {view === 'submit' && (
                <>

                    {/* Success / Error banners */}
                    {successMsg && (
                        <div style={{
                            maxWidth: 700, margin: '0 auto 1rem',
                            background: '#f0fdf4', border: '1px solid #d1fae5',
                            borderRadius: 12, padding: '14px 20px',
                            color: '#065f46', fontWeight: 600, fontSize: 14
                        }}>
                            {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div style={{
                            maxWidth: 700, margin: '0 auto 1rem',
                            background: '#fef2f2', border: '1px solid #fee2e2',
                            borderRadius: 12, padding: '14px 20px',
                            color: '#991b1b', fontWeight: 600, fontSize: 14
                        }}>
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    {/* Form */}
                    <form className="feedback-form-card" onSubmit={handleSubmit}>
                        <div className="sec-title-enhanced">
                            <span>📝</span> New Feedback
                        </div>

                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label><i>📌</i> Subject</label>
                                <input
                                    className="prof-input"
                                    type="text"
                                    placeholder="Brief summary of your feedback..."
                                    value={feedbackInput.subject}
                                    onChange={e => setFeedbackInput({ ...feedbackInput, subject: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group flex-1">
                                <label><i>🎯</i> Priority</label>
                                <select
                                    className="prof-select"
                                    value={feedbackInput.priority}
                                    onChange={e => setFeedbackInput({ ...feedbackInput, priority: e.target.value })}
                                >
                                    <option value="Low">🟢 Low</option>
                                    <option value="Medium">🟡 Medium</option>
                                    <option value="High">🔴 High</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label><i>💭</i> Detailed Message</label>
                            <textarea
                                className="prof-textarea-enhanced"
                                placeholder="Describe your issue or suggestion in detail. Include any relevant PO numbers, dates, or specific concerns..."
                                value={feedbackInput.message}
                                onChange={e => setFeedbackInput({ ...feedbackInput, message: e.target.value })}
                                required
                            />
                        </div>

                        {/* Context info */}
                        <div style={{
                            background: '#f8fafc', borderRadius: 10, padding: '10px 14px',
                            fontSize: 12, color: '#64748b', marginBottom: '1.5rem',
                            display: 'flex', gap: '1.5rem'
                        }}>
                            <span>🏷️ Module: <strong>{productContext}</strong></span>
                            <span>👤 User: <strong>{displayCode || '—'}</strong></span>
                            <span>🎭 Role: <strong>{Array.isArray(currentUser?.roleName) ? currentUser.roleName.join(', ') : (currentUser?.roleName || '—')}</strong></span>
                        </div>

                        <div className="form-footer">
                            <button
                                type="submit"
                                className="btn-submit-feedback-v2"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>⏳ Submitting...</>
                                ) : (
                                    <>📤 &nbsp;Submit</>
                                )}
                            </button>
                        </div>
                    </form>
                </>
            )}

            {/* ── LIST VIEW ── */}
            {view === 'list' && (
                <div className="feedback-list-container">
                    {errorMsg && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fee2e2',
                            borderRadius: 12, padding: '14px 20px',
                            color: '#991b1b', fontWeight: 600, fontSize: 14,
                            marginBottom: '1rem'
                        }}>
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    {loading ? (
                        <div style={{
                            textAlign: 'center', padding: '60px 0',
                            color: '#64748b'
                        }}>
                            <div style={{
                                width: 40, height: 40,
                                border: '4px solid #e2e8f0',
                                borderTop: '4px solid #10b981',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                margin: '0 auto 16px'
                            }} />
                            <p>Loading your feedback...</p>
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '60px 20px',
                            background: 'white', borderRadius: 16,
                            border: '1px dashed #d1fae5'
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                            <h3 style={{ color: '#374151', marginBottom: 8 }}>No feedback yet</h3>
                            <p style={{ color: '#64748b', fontSize: 14 }}>
                                You haven't submitted any feedback. Use the Submit tab to get started.
                            </p>
                            <button
                                onClick={() => setView('submit')}
                                className="btn-submit-feedback-v2"
                                style={{ margin: '16px auto 0', display: 'inline-flex' }}
                            >
                                ✏️ &nbsp;Submit First Feedback
                            </button>
                        </div>
                    ) : (
                        feedbacks.map((f, idx) => (
                            <div key={f.feedbackId || f.id || idx} className="feedback-item-card">
                                <div className="feedback-item-header">
                                    <div className="user-info">
                                        <div className="avatar">
                                            {(displayCode || currentUser?.userName || 'V').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="user-name">
                                                {f.userName || displayCode || 'Vendor'}
                                                <span className="role-tag">{f.roleName || productContext}</span>
                                            </div>
                                            <div className="date-time">
                                                {f.createdDate
                                                    ? new Date(f.createdDate).toLocaleString()
                                                    : f.createdAt
                                                    ? new Date(f.createdAt).toLocaleString()
                                                    : '—'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <span
                                        className={getPriorityClass(f.priority)}
                                        style={getPriorityStyle(f.priority)}
                                    >
                                        {f.priority || 'Medium'}
                                    </span>
                                </div>

                                <div className="feedback-subject">{f.subject}</div>
                                <div className="feedback-message">{f.message}</div>

                                {/* Status */}
                                {f.status && (
                                    <div style={{ marginTop: 8 }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 700,
                                            padding: '3px 10px', borderRadius: 50,
                                            background: f.status === 'RESOLVED' ? '#f0fdf4' : '#eff6ff',
                                            color: f.status === 'RESOLVED' ? '#166534' : '#1d4ed8'
                                        }}>
                                            {f.status}
                                        </span>
                                    </div>
                                )}

                                {/* Replies from Railway Board */}
                                {f.replies && f.replies.length > 0 && (
                                    <div className="replies-section">
                                        <div style={{
                                            fontSize: 12, fontWeight: 700, color: '#10b981',
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                            marginBottom: 10
                                        }}>
                                            🏛️ Railway Board Replies
                                        </div>
                                        {f.replies.map((r, ri) => (
                                            <div key={r.replyId || r.id || ri} className="reply-card">
                                                <div className="reply-header">
                                                    <span className="reply-user">
                                                        🏛️ {r.userName || r.repliedBy || 'Railway Board'}
                                                    </span>
                                                    <span className="reply-date">
                                                        {r.createdDate
                                                            ? new Date(r.createdDate).toLocaleString()
                                                            : r.createdAt
                                                            ? new Date(r.createdAt).toLocaleString()
                                                            : '—'
                                                        }
                                                    </span>
                                                </div>
                                                <p className="reply-text">
                                                    {r.replyMessage || r.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {/* Refresh button */}
                    {feedbacks.length > 0 && (
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <button
                                onClick={fetchFeedbacks}
                                style={{
                                    background: 'none', border: '1.5px solid #10b981',
                                    color: '#10b981', padding: '8px 20px',
                                    borderRadius: 10, fontWeight: 700,
                                    cursor: 'pointer', fontSize: 13
                                }}
                            >
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
