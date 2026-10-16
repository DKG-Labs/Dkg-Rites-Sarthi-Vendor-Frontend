import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../services/api';

// Native SVG Icons to ensure 100% React 19 compatibility
const SearchIcon = ({ size = 18, color = '#94a3b8' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const FileTextIcon = ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);

const CalendarIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const EyeIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const AlertCircleIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const CheckCircleIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const ClockIcon = ({ size = 12, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const AwardIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
);

const ClipboardListIcon = ({ size = 64, color = '#94a3b8' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
    </svg>
);

const DownloadIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const ExternalLinkIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const XCloseIcon = ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const LoaderIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ animation: 'spin 1s linear infinite' }}>
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
);

const InfoIcon = ({ size = 18, color = '#fff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const getCallStatusInfo = (statusStr, actionStr, jobStatusStr) => {
    const raw = String(actionStr || jobStatusStr || statusStr || '').toUpperCase().trim();
    if (raw.includes('CANCEL')) {
        return {
            label: 'Cancelled',
            bg: '#fef2f2',
            color: '#b91c1c',
            border: '#fca5a5',
            dot: '#ef4444',
            type: 'cancel'
        };
    }
    if (raw.includes('WITHDRAW')) {
        return {
            label: 'Withdrawn',
            bg: '#fef2f2',
            color: '#991b1b',
            border: '#fecaca',
            dot: '#dc2626',
            type: 'withdraw'
        };
    }
    return {
        label: 'SEND_CALL_TO_IBS',
        bg: '#eff6ff',
        color: '#1d4ed8',
        border: '#bfdbfe',
        dot: '#3b82f6',
        type: 'ibs'
    };
};

const formatDateDDMMYY = (val) => {
    if (!val) return 'N/A';
    try {
        if (typeof val === 'string' && val.includes('T')) {
            const parts = val.split('T')[0].split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
            return val.split('T')[0];
        }
        if (typeof val === 'string' && val.includes('-')) {
            const parts = val.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
        }
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear()).slice(-2);
            return `${day}/${month}/${year}`;
        }
    } catch (e) {}
    return String(val);
};

const formatPoSrNo = (call) => {
    if (!call) return '-';
    const rly = call.rlyShortName || call.scrCode || call.rlyCode;
    let po = String(call.poNo || '').trim();
    let sr = String(call.poSr || call.srNo || '').trim();
    if (sr && sr.includes('/')) {
        sr = sr.split('/').pop().trim();
    }

    let fullPoSr = po;
    if (sr && sr !== 'null' && sr !== 'undefined' && sr !== '') {
        if (!po.includes('/')) {
            fullPoSr = `${po}/${sr}`;
        } else {
            const parts = po.split('/');
            if (parts.length === 1 || !parts[1] || parts[1] !== sr) {
                fullPoSr = `${parts[0]}/${sr}`;
            }
        }
    }

    if (rly) {
        return `${rly} / ${fullPoSr}`;
    }
    return fullPoSr || 'N/A';
};

const cleanPlantStr = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const isPlantMatching = (callPlantId, allowedPlantList) => {
    if (!allowedPlantList || allowedPlantList.length === 0 || !allowedPlantList[0]) return true;
    const cleanCall = cleanPlantStr(callPlantId);
    if (!cleanCall) return false;

    return allowedPlantList.some(target => {
        const cleanTarget = cleanPlantStr(target);
        if (!cleanTarget) return false;
        
        if (cleanCall === cleanTarget) return true;
        
        if (cleanCall.includes(cleanTarget) || cleanTarget.includes(cleanCall)) {
            const callParts = String(callPlantId).split(/[/:]/).filter(Boolean);
            const targetParts = String(target).split(/[/:]/).filter(Boolean);
            if (callParts.length > 1 && targetParts.length > 1) {
                const callUnit = cleanPlantStr(callParts[callParts.length - 1]);
                const targetUnit = cleanPlantStr(targetParts[targetParts.length - 1]);
                return callUnit === targetUnit || callUnit.includes(targetUnit) || targetUnit.includes(callUnit);
            }
            return true;
        }
        return false;
    });
};

const getEffectivePlantId = (propPlantId) => {
    if (propPlantId) return propPlantId;
    const sessionPlant = sessionStorage.getItem('plantId');
    if (sessionPlant) return sessionPlant;
    const localPlant = localStorage.getItem('plantId');
    if (localPlant) return localPlant;
    try {
        const savedPlant = localStorage.getItem('selectedPlant');
        if (savedPlant) {
            const parsed = JSON.parse(savedPlant);
            if (parsed?.plantId) return parsed.plantId;
        }
    } catch (e) {}
    return '';
};

const CallsCompletedDashboard = ({ plantId: propPlantId, initialCalls, onRefresh }) => {
    const [calls, setCalls] = useState(initialCalls || []);
    const [loading, setLoading] = useState(initialCalls === undefined || initialCalls === null);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(5);
    const [toast, setToast] = useState(null);

    const plantId = getEffectivePlantId(propPlantId);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchCompletedCalls = async () => {
        try {
            setLoading(true);
            setError(null);
            const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId') || 118;
            const [completedRes, vendorCallsRes] = await Promise.allSettled([
                apiService.getCompletedFinalCalls(plantId),
                apiService.getVendorInspectionCalls(userId)
            ]);

            const isSendCallToIbs = (c) => {
                const raw = String(c?.status || c?.action || c?.rawStatus || '').trim().toUpperCase();
                const rawJob = String(c?.jobStatus || c?.job_status || '').trim().toUpperCase();
                return (
                    raw === 'SEND_CALL_TO_IBS' ||
                    rawJob === 'SEND_CALL_TO_IBS' ||
                    raw.includes('SEND_CALL_TO_IBS') ||
                    rawJob.includes('SEND_CALL_TO_IBS') ||
                    raw.includes('IBS') ||
                    rawJob.includes('IBS')
                );
            };

            const list1 = (completedRes.status === 'fulfilled' && Array.isArray(completedRes.value)) 
                ? completedRes.value.filter(isSendCallToIbs) 
                : [];
            const list2 = (vendorCallsRes.status === 'fulfilled' && Array.isArray(vendorCallsRes.value)) 
                ? vendorCallsRes.value.filter(isSendCallToIbs) 
                : [];

            const combined = [...list1];
            list2.forEach(c => {
                const callKey = (c.callNo || c.requestId || c.id || '').toString();
                if (!combined.some(item => (item.callNo || item.requestId || item.id || '').toString() === callKey)) {
                    combined.push(c);
                }
            });

            const plantFiltered = plantId ? combined.filter(item => isPlantMatching(item.plantId, [plantId])) : combined;
            setCalls(plantFiltered);
        } catch (err) {
            console.error('Error fetching completed calls:', err);
            setError('Failed to load completed inspection calls.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialCalls !== undefined && initialCalls !== null && initialCalls.length > 0) {
            setCalls(initialCalls);
            setLoading(false);
        } else {
            fetchCompletedCalls();
        }
    }, [initialCalls, plantId]);

    const filteredCalls = useMemo(() => {
        if (!search.trim()) return calls;
        const q = search.toLowerCase();
        return calls.filter(call => {
            const callNo = (call.requestId || call.callNo || '').toLowerCase();
            const icNo = (call.icNo || call.icNumber || call.certificateNo || '').toLowerCase();
            const icDate = (call.icDate ? formatDateDDMMYY(call.icDate) : '').toLowerCase();
            const poNo = (call.poNo || '').toLowerCase();
            const sleeperType = (call.sleeperType || call.productType || '').toLowerCase();
            const ieName = (call.assignedToUserName || call.ieName || '').toLowerCase();
            return callNo.includes(q) || icNo.includes(q) || icDate.includes(q) || poNo.includes(q) || sleeperType.includes(q) || ieName.includes(q);
        });
    }, [calls, search]);

    const paginatedCalls = useMemo(() => {
        const start = page * size;
        return filteredCalls.slice(start, start + size);
    }, [filteredCalls, page, size]);

    const totalPages = Math.ceil(filteredCalls.length / size) || 1;

    const [actionCall, setActionCall] = useState(null);
    const [icLoading, setIcLoading] = useState(false);
    const [icDownloading, setIcDownloading] = useState(false);
    const [icError, setIcError] = useState(null);
    const [icData, setIcData] = useState(null);
    const [showIcPreview, setShowIcPreview] = useState(false);

    const handleCloseActionsModal = () => {
        if (icData?.blobUrl && icData.isLocalBlob) {
            try {
                window.URL.revokeObjectURL(icData.blobUrl);
            } catch (e) {}
        }
        setActionCall(null);
        setIcData(null);
        setIcError(null);
        setIcLoading(false);
        setIcDownloading(false);
        setShowIcPreview(false);
    };

    const handleViewActions = (call) => {
        if (icData?.blobUrl && icData.isLocalBlob) {
            try {
                window.URL.revokeObjectURL(icData.blobUrl);
            } catch (e) {}
        }
        setActionCall(call);
        setIcData(null);
        setIcError(null);
        setIcLoading(false);
        setIcDownloading(false);
        setShowIcPreview(false);
    };

    const fetchCertificateData = async (call) => {
        if (icData && icData.blobUrl) {
            return icData;
        }

        const callNo = (call.requestId || call.callNo || '').trim();
        const rawIc = (call.icNo || call.icNumber || call.certificateNo || call.certificate_no || '').trim();
        const searchTarget = rawIc || callNo;

        if (!searchTarget) {
            throw new Error("No IC Number or Call Number found for this call.");
        }

        let response = null;
        let lastError = null;

        // 1. Try with IC Number
        if (rawIc) {
            try {
                response = await apiService.getSignedCertificate(rawIc);
            } catch (e) {
                lastError = e;
            }
        }

        // 2. Try with Call Number
        if (!response && callNo) {
            try {
                response = await apiService.getSignedCertificate(callNo);
            } catch (e) {
                lastError = e;
            }
        }

        // 3. Try parts / tokens if slash exists
        if (!response && rawIc.includes('/')) {
            const parts = rawIc.split('/').filter(p => p.length >= 6 && /\d/.test(p));
            for (const part of parts) {
                try {
                    response = await apiService.getSignedCertificate(part);
                    if (response) break;
                } catch (e) {
                    lastError = e;
                }
            }
        }

        if (!response) {
            throw new Error(lastError?.message || "No signed Inspection Certificate (IC) found in storage for this call.");
        }

        let blobUrl = null;
        let isLocalBlob = false;
        let fileName = response.fileName || `Inspection_Certificate_${(rawIc || callNo).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

        if (response.signedData) {
            const byteCharacters = atob(response.signedData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            blobUrl = window.URL.createObjectURL(blob);
            isLocalBlob = true;
        } else if (response.url) {
            blobUrl = response.url;
            isLocalBlob = false;
        } else {
            throw new Error("Signed certificate data is empty.");
        }

        const result = {
            blobUrl,
            isLocalBlob,
            fileName,
            icNumber: response.icNumber || rawIc || callNo,
            url: response.url
        };
        setIcData(result);
        return result;
    };

    const handlePreviewIC = async (call) => {
        setIcLoading(true);
        setIcError(null);
        try {
            await fetchCertificateData(call);
            setShowIcPreview(true);
        } catch (err) {
            console.error("Preview IC error:", err);
            const msg = err.message || "Failed to load Inspection Certificate.";
            setIcError(msg);
            showToast('error', msg);
        } finally {
            setIcLoading(false);
        }
    };

    const handleDownloadIC = async (call) => {
        setIcDownloading(true);
        setIcError(null);
        try {
            showToast('info', 'Fetching Inspection Certificate for download...');
            const cert = await fetchCertificateData(call);
            const a = document.createElement('a');
            a.href = cert.blobUrl;
            a.download = cert.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('success', `Inspection Certificate (${cert.icNumber}) downloaded successfully!`);
        } catch (err) {
            console.error("Download IC error:", err);
            const msg = err.message || "Failed to download Inspection Certificate.";
            setIcError(msg);
            showToast('error', msg);
        } finally {
            setIcDownloading(false);
        }
    };

    const SkeletonRow = () => (
        <div style={{ 
            display: 'flex', gap: '16px', padding: '16px', background: '#fff', 
            borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '12px',
            animation: 'pulse 1.5s infinite ease-in-out'
        }}>
            <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '8px' }}></div>
            <div style={{ flex: 1 }}>
                <div style={{ width: '120px', height: '14px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div style={{ width: '200px', height: '10px', background: '#f1f5f9', borderRadius: '4px' }}></div>
            </div>
            <div style={{ width: '80px', height: '32px', background: '#f1f5f9', borderRadius: '20px' }}></div>
        </div>
    );

    if (loading) {
        return (
            <div className="fade-in">
                <style>{`
                    @keyframes pulse {
                        0% { opacity: 0.6; }
                        50% { opacity: 1; }
                        100% { opacity: 0.6; }
                    }
                `}</style>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ width: '200px', height: '24px', background: '#f1f5f9', borderRadius: '6px', marginBottom: '8px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                    <div style={{ width: '300px', height: '14px', background: '#f1f5f9', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                </div>
                {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: '"Inter", -apple-system, sans-serif' }}>
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                    background: toast.type === 'error' ? '#ef4444' : (toast.type === 'success' ? '#059669' : '#0f172a'),
                    color: '#fff', padding: '12px 24px', borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 600, fontSize: '14px', animation: 'slideUp 0.3s ease-out'
                }}>
                    {toast.type === 'error' && <AlertCircleIcon size={18} color="#fff" />}
                    {toast.type === 'success' && <CheckCircleIcon size={18} color="#fff" />}
                    {toast.type === 'info' && <InfoIcon size={18} color="#fff" />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header with Title & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>Completed Calls</h1>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>View and manage your completed inspection requests and download certificates</p>
                </div>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <SearchIcon size={18} color="#94a3b8" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search Call No / PO No / IC No..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        style={{
                            padding: '12px 12px 12px 40px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            width: '320px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            background: '#fff'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>
            </div>

            {error ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2', color: '#991b1b' }}>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                        <AlertCircleIcon size={48} color="#dc2626" />
                    </div>
                    <h3 style={{ margin: 0, fontWeight: 800 }}>Error</h3>
                    <p>{error}</p>
                    <button onClick={fetchCompletedCalls} style={{ marginTop: '16px', padding: '8px 24px', borderRadius: '8px', background: '#991b1b', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
                </div>
            ) : filteredCalls.length === 0 ? (
                <div style={{ padding: '100px 0', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px dashed #e2e8f0', color: '#94a3b8' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <ClipboardListIcon size={64} color="#94a3b8" />
                    </div>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>No completed inspection calls found</h3>
                    <p style={{ marginTop: '4px' }}>{search ? "No calls match your search criteria." : "Completed inspection calls and certificates will appear here."}</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#fcf8ee', borderBottom: '1px solid #f2e9d8' }}>
                                <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Call Details</th>
                                <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>PO Reference</th>
                                <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Item Details</th>
                                <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>IC Number & Date</th>
                                <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Status</th>
                                <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', whiteSpace: 'nowrap' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCalls.map((call, idx) => {
                                const callNo = call.requestId || call.callNo || (call.workflowTransitionId ? `CALL-${call.workflowTransitionId}` : 'N/A');
                                const inspectionDate = call.callDate || call.desiredInspectionDate || call.createdDate;
                                const sleeperItem = call.sleeperType || call.productType || 'Sleeper';
                                const offeredQuantity = Number(call.offeredQty || call.qtyOffered || call.totalCastedSleepers || 0);
                                const acceptedQuantity = Number(call.acceptedQty != null ? call.acceptedQty : (call.totalOffered != null ? call.totalOffered : (call.qtyAccepted != null ? call.qtyAccepted : offeredQuantity)));
                                const statusInfo = getCallStatusInfo(call.status, call.action, call.jobStatus);
                                const icNumber = call.icNo || call.icNumber || call.certificateNo || call.certificate_no || (callNo && callNo !== 'N/A' ? `N/${callNo}/OPS1` : null);
                                const icDate = call.icDate || call.certificateDate || call.updatedDate || call.createdDate || call.callDate;

                                return (
                                    <tr 
                                        key={call.workflowTransitionId || call.id || idx} 
                                        style={{ borderBottom: idx === paginatedCalls.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.15s ease' }} 
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} 
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {/* 1. Call Details */}
                                        <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #dbeafe' }}>
                                                    <FileTextIcon size={17} color="#2563eb" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>{callNo}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                        <CalendarIcon size={12} color="#64748b" /> {formatDateDDMMYY(inspectionDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. PO Reference */}
                                        <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                                            <div style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>
                                                {formatPoSrNo(call)}
                                            </div>
                                        </td>

                                        {/* 3. Item & Quantities */}
                                        <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px' }}>{sleeperItem}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                <span style={{ background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '5px', fontWeight: 600 }}>Off: {offeredQuantity.toLocaleString()}</span>
                                                <span style={{ color: '#15803d', fontWeight: 800, background: '#dcfce7', padding: '1px 7px', borderRadius: '5px', border: '1px solid #bbf7d0' }}>
                                                    Acc: {acceptedQuantity.toLocaleString()} (Nos.)
                                                </span>
                                            </div>
                                        </td>

                                        {/* 4. IC Number & IC Date */}
                                        <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                                            {icNumber ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #d1fae5' }}>
                                                        <AwardIcon size={18} color="#059669" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', letterSpacing: '-0.01em' }}>
                                                            {icNumber}
                                                        </div>
                                                        {icDate ? (
                                                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                                <CalendarIcon size={12} color="#64748b" /> {formatDateDDMMYY(icDate)}
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>-</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>-</span>
                                            )}
                                        </td>

                                        {/* 5. Status */}
                                        <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                                            <div style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '5px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700,
                                                whiteSpace: 'nowrap',
                                                background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusInfo.dot || statusInfo.color, flexShrink: 0 }} />
                                                {statusInfo.label}
                                            </div>
                                        </td>

                                        {/* 6. Action */}
                                        <td style={{ padding: '16px 20px', textAlign: 'right', verticalAlign: 'middle' }}>
                                            <button 
                                                onClick={() => handleViewActions(call)}
                                                style={{ 
                                                    padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                                    background: '#fff', color: '#1e293b', fontSize: '12.5px', fontWeight: 700,
                                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            >
                                                <EyeIcon size={14} color="#475569" /> View Actions
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {filteredCalls.length > 0 && (
                        <div style={{
                            padding: '16px 24px', background: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontSize: '13px', color: '#64748b', flexWrap: 'wrap', gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div>
                                    Showing page <strong style={{ color: '#0f172a' }}>{page + 1}</strong> of <strong style={{ color: '#0f172a' }}>{totalPages}</strong> 
                                    <span style={{ marginLeft: 8 }}>({filteredCalls.length} total calls)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <label htmlFor="pageSize" style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>Rows per page:</label>
                                    <select
                                        id="pageSize"
                                        value={size}
                                        onChange={(e) => {
                                            setSize(Number(e.target.value));
                                            setPage(0);
                                        }}
                                        style={{
                                            padding: '6px 10px', borderRadius: '8px',
                                            border: '1px solid #cbd5e1', background: '#fff',
                                            color: '#0f172a', fontSize: '13px', fontWeight: 600, 
                                            outline: 'none', cursor: 'pointer', minWidth: '60px'
                                        }}
                                    >
                                        {[5, 10, 15, 20, 25].map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px',
                                        border: '1px solid #e2e8f0', background: '#fff',
                                        color: page === 0 ? '#cbd5e1' : '#475569',
                                        cursor: page === 0 ? 'not-allowed' : 'pointer', fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                >Previous</button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px',
                                        border: '1px solid #e2e8f0', background: '#fff',
                                        color: page >= totalPages - 1 ? '#cbd5e1' : '#475569',
                                        cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                >Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Actions Modal & IC Viewer */}
            {actionCall && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 99999, padding: '20px'
                    }}
                    onClick={handleCloseActionsModal}
                >
                    <div 
                        style={{
                            background: '#fff', 
                            borderRadius: '24px', 
                            width: showIcPreview ? '96vw' : '640px',
                            maxWidth: showIcPreview ? '1280px' : '640px',
                            height: showIcPreview ? '92vh' : 'auto',
                            maxHeight: '92vh', 
                            display: 'flex', 
                            flexDirection: 'column',
                            overflow: 'hidden', 
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            border: '1px solid #e2e8f0', 
                            animation: 'slideUp 0.25s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {showIcPreview ? (
                            /* Mode A: In-App Interactive IC PDF Viewer */
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                                {/* Viewer Toolbar */}
                                <div style={{
                                    padding: '14px 20px', background: '#0f172a', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    borderBottom: '1px solid #334155', flexShrink: 0, flexWrap: 'wrap', gap: '10px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button 
                                            onClick={() => setShowIcPreview(false)}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px', border: '1px solid #475569',
                                                background: '#1e293b', color: '#f1f5f9', fontSize: '12.5px', fontWeight: 700,
                                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#1e293b'}
                                        >
                                            ← Back to Options
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AwardIcon size={18} color="#10b981" />
                                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#f8fafc', letterSpacing: '-0.01em' }}>
                                                {icData?.icNumber || 'Inspection Certificate'}
                                            </span>
                                            {icData?.fileName && (
                                                <span style={{ fontSize: '11.5px', color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: '6px' }}>
                                                    {icData.fileName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button
                                            onClick={() => handleDownloadIC(actionCall)}
                                            disabled={icDownloading}
                                            style={{
                                                padding: '7px 16px', borderRadius: '8px', border: 'none',
                                                background: '#059669', color: '#fff', fontSize: '12.5px', fontWeight: 800,
                                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.4)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#047857'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#059669'}
                                        >
                                            {icDownloading ? <LoaderIcon size={15} color="#fff" /> : <DownloadIcon size={15} color="#fff" />}
                                            Download PDF
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (icData?.blobUrl) {
                                                    window.open(icData.blobUrl, '_blank');
                                                }
                                            }}
                                            style={{
                                                padding: '7px 14px', borderRadius: '8px', border: '1px solid #475569',
                                                background: '#1e293b', color: '#f1f5f9', fontSize: '12.5px', fontWeight: 700,
                                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#1e293b'}
                                        >
                                            <ExternalLinkIcon size={14} color="#94a3b8" /> Open in New Tab
                                        </button>
                                        <button
                                            onClick={handleCloseActionsModal}
                                            style={{
                                                padding: '7px', borderRadius: '8px', border: 'none',
                                                background: 'transparent', color: '#94a3b8', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#fff'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                                        >
                                            <XCloseIcon size={20} />
                                        </button>
                                    </div>
                                </div>
                                {/* Iframe container */}
                                <div style={{ flex: 1, position: 'relative', background: '#525659', overflow: 'hidden' }}>
                                    <iframe 
                                        src={icData?.blobUrl} 
                                        title={icData?.fileName || "Inspection Certificate"} 
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Mode B: Actions Selection Card (See IC & Download IC) */
                            <div>
                                {/* Modal Header */}
                                <div style={{
                                    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: '#f8fafc'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '42px', height: '42px', borderRadius: '12px',
                                            background: '#eff6ff', color: '#2563eb', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', border: '1px solid #dbeafe'
                                        }}>
                                            <AwardIcon size={22} color="#2563eb" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                                Inspection Call Actions
                                            </div>
                                            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                                                Call: <strong>{actionCall.requestId || actionCall.callNo || 'N/A'}</strong> • PO: {formatPoSrNo(actionCall)}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleCloseActionsModal}
                                        style={{
                                            padding: '8px', borderRadius: '8px', border: 'none',
                                            background: 'transparent', color: '#64748b', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                                    >
                                        <XCloseIcon size={20} />
                                    </button>
                                </div>

                                {/* Call Details Summary Box */}
                                <div style={{ padding: '20px 24px' }}>
                                    <div style={{
                                        background: '#fcf8ee', border: '1px solid #fef3c7', borderRadius: '16px',
                                        padding: '16px', marginBottom: '20px'
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Item Type</div>
                                                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1c1917', marginTop: '3px' }}>
                                                    {actionCall.sleeperType || actionCall.productType || 'Sleeper'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quantities</div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', marginTop: '3px' }}>
                                                    Off: {Number(actionCall.offeredQty || actionCall.qtyOffered || 0).toLocaleString()} • Acc: {Number(actionCall.acceptedQty != null ? actionCall.acceptedQty : (actionCall.offeredQty || 0)).toLocaleString()} (Nos.)
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IC Number</div>
                                                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <AwardIcon size={14} color="#059669" />
                                                    {actionCall.icNo || actionCall.icNumber || actionCall.certificateNo || 'Available in System'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IC Date</div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '3px' }}>
                                                    {actionCall.icDate ? formatDateDDMMYY(actionCall.icDate) : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Error Banner */}
                                    {icError && (
                                        <div style={{
                                            padding: '12px 16px', background: '#fef2f2', border: '1px solid #fee2e2',
                                            borderRadius: '12px', color: '#991b1b', fontSize: '13px', display: 'flex',
                                            alignItems: 'center', gap: '10px', marginBottom: '20px'
                                        }}>
                                            <AlertCircleIcon size={18} color="#dc2626" />
                                            <span>{icError}</span>
                                        </div>
                                    )}

                                    {/* Action Cards Grid */}
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                                        Inspection Certificate (IC) Actions
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                                        {/* Card 1: See / Preview IC */}
                                        <div
                                            onClick={() => !icLoading && handlePreviewIC(actionCall)}
                                            style={{
                                                background: '#f8fafc',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '18px',
                                                padding: '20px',
                                                cursor: icLoading ? 'wait' : 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!icLoading) {
                                                    e.currentTarget.style.borderColor = '#3b82f6';
                                                    e.currentTarget.style.background = '#eff6ff';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.15)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!icLoading) {
                                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                                    e.currentTarget.style.background = '#f8fafc';
                                                    e.currentTarget.style.transform = 'none';
                                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                                                <div style={{
                                                    width: '46px', height: '46px', borderRadius: '14px',
                                                    background: '#dbeafe', color: '#1d4ed8',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {icLoading ? <LoaderIcon size={22} color="#1d4ed8" /> : <EyeIcon size={22} color="#1d4ed8" />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>
                                                        See Your IC
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                        Interactive PDF preview
                                                    </div>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                                                Open and review the official e-signed Inspection Certificate directly inside the browser.
                                            </p>
                                            <button
                                                disabled={icLoading}
                                                style={{
                                                    width: '100%', padding: '9px 16px', borderRadius: '10px',
                                                    border: 'none', background: '#2563eb', color: '#fff',
                                                    fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                                                }}
                                            >
                                                {icLoading ? (
                                                    <>
                                                        <LoaderIcon size={16} color="#fff" /> Loading IC...
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeIcon size={16} color="#fff" /> View IC Certificate
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Card 2: Download IC */}
                                        <div
                                            onClick={() => !icDownloading && handleDownloadIC(actionCall)}
                                            style={{
                                                background: '#f8fafc',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '18px',
                                                padding: '20px',
                                                cursor: icDownloading ? 'wait' : 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!icDownloading) {
                                                    e.currentTarget.style.borderColor = '#10b981';
                                                    e.currentTarget.style.background = '#ecfdf5';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.15)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!icDownloading) {
                                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                                    e.currentTarget.style.background = '#f8fafc';
                                                    e.currentTarget.style.transform = 'none';
                                                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                                                <div style={{
                                                    width: '46px', height: '46px', borderRadius: '14px',
                                                    background: '#d1fae5', color: '#047857',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {icDownloading ? <LoaderIcon size={22} color="#047857" /> : <DownloadIcon size={22} color="#047857" />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>
                                                        Download IC
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                        Save official PDF copy
                                                    </div>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                                                Download the verified e-signed Inspection Certificate PDF file directly to your computer.
                                            </p>
                                            <button
                                                disabled={icDownloading}
                                                style={{
                                                    width: '100%', padding: '9px 16px', borderRadius: '10px',
                                                    border: 'none', background: '#059669', color: '#fff',
                                                    fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                                                }}
                                            >
                                                {icDownloading ? (
                                                    <>
                                                        <LoaderIcon size={16} color="#fff" /> Downloading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <DownloadIcon size={16} color="#fff" /> Download IC PDF
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div style={{
                                    padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9',
                                    display: 'flex', justifyContent: 'flex-end', gap: '10px'
                                }}>
                                    <button
                                        onClick={handleCloseActionsModal}
                                        style={{
                                            padding: '8px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                            background: '#fff', color: '#334155', fontSize: '13px', fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallsCompletedDashboard;
