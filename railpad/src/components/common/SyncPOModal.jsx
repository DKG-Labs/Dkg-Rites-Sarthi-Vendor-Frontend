import React, { useState, useEffect, useRef } from 'react';
import poAssignedService from '../../services/poAssignedService';

const SyncPOModal = ({ isOpen, onClose, onSuccess, vendorCode: propVendorCode, plantId }) => {
    const [syncType, setSyncType] = useState('PO DATA'); // PO DATA, POMA DATA
    const [formData, setFormData] = useState({
        rly: '',
        poNo: '',
        poDate: '',
        maNo: '',
        maDate: '',
        vcode: ''
    });

    useEffect(() => {
        if (isOpen) {
            let vcode = propVendorCode || 
                         localStorage.getItem('railpad_vendorCode') || 
                         localStorage.getItem('vendorCode') || 
                         sessionStorage.getItem('vendorCode') || 
                         sessionStorage.getItem('vcode') || "";
            
            // If still empty and we have plantId, try to extract from it (e.g., ":1007406/sarthi" -> ":1007406")
            if (!vcode && plantId && plantId.includes(':')) {
                const parts = plantId.split('/');
                const colonPart = parts.find(p => p.includes(':'));
                if (colonPart) vcode = colonPart;
            } else if (!vcode && !plantId) {
                // Check localStorage for plantId fallback
                const storedPlantId = localStorage.getItem('railpad_selectedPlantId');
                if (storedPlantId && storedPlantId.includes(':')) {
                    const parts = storedPlantId.split('/');
                    const colonPart = parts.find(p => p.includes(':'));
                    if (colonPart) vcode = colonPart;
                }
            }
            
            setFormData(prev => ({ ...prev, vcode }));
        }
    }, [isOpen, propVendorCode, plantId]);

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMsg, setErrorMsg] = useState('');
    const [fetchedData, setFetchedData] = useState(null);
    const [manualCategory, setManualCategory] = useState('');
    const [view, setView] = useState('input'); // input, review, result
    const [railways, setRailways] = useState([]);
    const [railwayLoading, setRailwayLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchRailways = async () => {
            setRailwayLoading(true);
            try {
                const list = await poAssignedService.getRlyList();
                const sorted = [...list].sort((a, b) => 
                    String(a.rlyCd).localeCompare(String(b.rlyCd), undefined, { numeric: true })
                );
                setRailways(sorted);
            } catch (error) {
                console.error('Error fetching railways:', error);
            } finally {
                setRailwayLoading(false);
            }
        };
        if (isOpen) {
            fetchRailways();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        if (dateStr.includes('/')) return dateStr;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    const handleSync = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setStatus('loading');
        setErrorMsg('');

        try {
            const finalVcode = formData.vcode.startsWith(':') ? formData.vcode : `:${formData.vcode}`;

            if (syncType === 'POMA DATA') {
                const maPayload = {
                    rly: formData.rly,
                    poNo: formData.poNo,
                    vcode: finalVcode,
                    maDate: formatDate(formData.maDate),
                    maNo: formData.maNo
                };

                // 1. Fetch MA Details
                const maResult = await poAssignedService.getIMMSMAData(maPayload);
                if (!maResult || maResult.status !== 'OK' || !maResult.data) {
                    throw new Error(maResult?.error || maResult?.message || 'MA not found or invalid response.');
                }

                // 2. Fetch PO Date from our database
                const poDateResult = await poAssignedService.getPoDateByPoNo(maPayload.poNo);
                if (!poDateResult || !poDateResult.poDate) {
                    throw new Error('PO Date not found in our system for the given PO Number. Ensure the original PO is synced first.');
                }

                // 3. Fetch Amended PO Details
                const amendedPayload = {
                    rly: maPayload.rly,
                    poNo: maPayload.poNo,
                    poDate: poDateResult.poDate,
                    vcode: finalVcode,
                    amended: "true"
                };
                const amendedResult = await poAssignedService.getIMMSPOData(amendedPayload);
                if (!amendedResult || amendedResult.status !== 'OK' || !amendedResult.data) {
                    throw new Error(amendedResult?.error || amendedResult?.message || 'Amended PO data not found or invalid response.');
                }

                const combinedData = {
                    status: "OK",
                    message: "Success",
                    error: [],
                    timestamp: new Date().toISOString(),
                    data: {
                        MMP_POMA_HDR: maResult.data.MMP_POMA_HDR,
                        MMP_POMA_DTL: maResult.data.MMP_POMA_DTL,
                        PoHdr: amendedResult.data.PoHdr || amendedResult.data.mmpPoHdr,
                        PoDtl: amendedResult.data.PoDtl || amendedResult.data.mmpPoItem
                    }
                };

                setFetchedData(combinedData);
                setManualCategory(maResult.data.MMP_POMA_HDR?.ITEM_CAT_DESCR || '');
                setView('review');
                setStatus('idle');
                return;
            }

            const payload = { 
                rly: formData.rly, 
                poNo: formData.poNo, 
                poDate: formatDate(formData.poDate), 
                vcode: finalVcode 
            };
            const result = await poAssignedService.getIMMSPOData(payload);
            
            if (result && result.status === 'OK' && result.data) {
                setFetchedData(result.data);
                setManualCategory(result.data.PoHdr?.ITEM_CAT_DESCR || '');
                setView('review');
                setStatus('idle');
            } else {
                throw new Error(result.error || result.message || 'PO not found or invalid response.');
            }
        } catch (error) {
            setStatus('error');
            const rawMsg = error.message || '';
            let friendlyMsg = 'Sync failed. Please verify your PO details are correct and RITES is the inspecting agency.';
            
            // Check if there is an embedded JSON error payload from CRIS
            let hasCrisError = false;
            try {
                const cleanMsg = rawMsg.replace(/\\"/g, '"').replace(/\\n/g, '\n');
                const jsonStart = cleanMsg.indexOf('{');
                const jsonEnd = cleanMsg.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    const jsonStr = cleanMsg.substring(jsonStart, jsonEnd + 1);
                    const parsed = JSON.parse(jsonStr);
                    if (parsed && parsed.error) {
                        friendlyMsg = `CRIS ERROR: ${parsed.error}`;
                        hasCrisError = true;
                    }
                }
            } catch {
                // ignore parse failure
            }

            if (!hasCrisError) {
                if (rawMsg.toLowerCase().includes('insp agency is not rites') || rawMsg.toLowerCase().includes('rites as per po record')) {
                    friendlyMsg = 'This purchase order cannot be synced because the Inspecting Agency is not set to RITES. Sarthi only supports syncing POs officially designated for RITES inspection.';
                } else if (syncType === 'POMA DATA' && (rawMsg.toLowerCase().includes('invalid ma request') || rawMsg.toLowerCase().includes('ma not found'))) {
                    friendlyMsg = 'MA details are invalid or could not be found. Please check your MA Number, Date, and PO details.';
                } else if (rawMsg.toLowerCase().includes('invalid po request') || rawMsg.toLowerCase().includes('invalid po') || rawMsg.toLowerCase().includes('po not found')) {
                    friendlyMsg = 'PO details are invalid or could not be found. Please check your PO Number, Date, and Railway Code.';
                } else if (rawMsg.toLowerCase().includes('expectation failed') || rawMsg.toLowerCase().includes('417') || rawMsg.toLowerCase().includes('connection failed') || rawMsg.toLowerCase().includes('timeout')) {
                    friendlyMsg = 'CRIS Railway Server is currently unresponsive. Please try again in a few minutes.';
                } else if (rawMsg.toLowerCase().includes('failed to fetch') || rawMsg.toLowerCase().includes('networkerror')) {
                    friendlyMsg = 'Network error. Please check your internet connection.';
                } else if (rawMsg) {
                    friendlyMsg = rawMsg;
                }
            }
            
            setErrorMsg(friendlyMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus('loading');
        
        try {
            let response;
            if (syncType === 'POMA DATA') {
                response = await poAssignedService.savePoMaData(fetchedData);
            } else {
                const savePayload = {
                    poHdr: {
                        ...fetchedData.PoHdr,
                        ITEM_CAT_DESCR: manualCategory
                    },
                    poDtl: fetchedData.PoDtl.map(item => ({ ...item }))
                };
                response = await poAssignedService.savePOData(savePayload);
            }
            
            if (response && (response.responseStatus?.statusCode === 0 || response.status === 'success' || response.status === 'OK')) {
                setStatus('success');
                setTimeout(() => {
                    if (onSuccess) onSuccess(response);
                    onClose();
                    resetModal();
                }, 2000);
            } else {
                throw new Error(response.responseStatus?.message || response.message || 'Failed to save data to system.');
            }
        } catch (error) {
            setStatus('error');
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetModal = () => {
        setView('input');
        setFetchedData(null);
        setManualCategory('');
        setStatus('idle');
    };

    const renderInputView = () => (
        <form onSubmit={handleSync} style={styles.body}>
            {/* Segmented Control Switcher */}
            <div style={styles.tabContainer}>
                <button
                    type="button"
                    onClick={() => { setSyncType('PO DATA'); setErrorMsg(''); }}
                    style={{
                        ...styles.tabButton,
                        ...(syncType === 'PO DATA' ? styles.tabButtonActive : {})
                    }}
                >
                    <span style={{ fontSize: '14px' }}>📦</span> Sync PO
                </button>
                <button
                    type="button"
                    onClick={() => { setSyncType('POMA DATA'); setErrorMsg(''); }}
                    style={{
                        ...styles.tabButton,
                        ...(syncType === 'POMA DATA' ? styles.tabButtonActive : {})
                    }}
                >
                    <span style={{ fontSize: '14px' }}>📝</span> MA Sync
                </button>
            </div>

            <div style={styles.grid2col}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Railway Code (Rly)</label>
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <div 
                            onClick={() => !railwayLoading && setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                ...styles.input,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: railwayLoading ? 'not-allowed' : 'pointer',
                                backgroundColor: railwayLoading ? '#f8fafc' : '#fff'
                            }}
                        >
                            <span style={{ color: !formData.rly ? '#94a3b8' : '#0f172a', fontWeight: formData.rly ? '600' : '400' }}>
                                {formData.rly 
                                    ? (railways.find(r => r.rlyCd === formData.rly) ? `${formData.rly}-${railways.find(r => r.rlyCd === formData.rly).rlyShortName}` : formData.rly)
                                    : (railwayLoading ? 'Loading Railways...' : '-- Select Railway --')
                                }
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748b', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                        </div>
                        
                        {isDropdownOpen && (
                            <div style={styles.dropdownList}>
                                {railways.map(r => (
                                    <div 
                                        key={r.rlyCd}
                                        onClick={() => {
                                            handleInputChange({ target: { name: 'rly', value: r.rlyCd } });
                                            setIsDropdownOpen(false);
                                        }}
                                        style={styles.dropdownOption}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e0f2fe'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        <strong>{r.rlyCd}</strong> - {r.rlyShortName}
                                    </div>
                                ))}
                                {railways.length === 0 && !railwayLoading && (
                                    <div style={{ ...styles.dropdownOption, color: '#94a3b8', cursor: 'default' }}>
                                        No railways found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>PO Number</label>
                    <input name="poNo" value={formData.poNo} onChange={handleInputChange} placeholder="e.g. 63245440201377" style={styles.input} required />
                </div>

                {syncType === 'PO DATA' && (
                    <div style={styles.formGroup}>
                        <label style={styles.label}>PO Date</label>
                        <input name="poDate" type="date" value={formData.poDate} onChange={handleInputChange} style={styles.input} required />
                    </div>
                )}

                {syncType === 'POMA DATA' && (
                    <>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>MA Number</label>
                            <input name="maNo" value={formData.maNo} onChange={handleInputChange} placeholder="e.g. MA01" style={styles.input} required />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>MA Date</label>
                            <input name="maDate" type="date" value={formData.maDate} onChange={handleInputChange} style={styles.input} required />
                        </div>
                    </>
                )}

                <div style={styles.formGroup}>
                    <label style={styles.label}>Vendor Code</label>
                    <input value={formData.vcode} readOnly style={{...styles.input, backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '600'}} />
                </div>
            </div>
            {status === 'error' && <div style={styles.errorBanner}>⚠️ {errorMsg}</div>}
            <div style={styles.footer}>
                <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={loading} style={styles.syncBtn}>
                    {loading ? 'Fetching...' : `Fetch ${syncType === 'POMA DATA' ? 'MA' : 'PO'} Details`}
                </button>
            </div>
        </form>
    );

    const renderReviewView = () => {
        let h, d;
        if (syncType === 'PO DATA') {
            h = fetchedData.PoHdr || {};
            d = fetchedData.PoDtl || [];
        } else if (syncType === 'POMA DATA') {
            h = fetchedData.data?.MMP_POMA_HDR || fetchedData.MMP_POMA_HDR || {};
            d = fetchedData.data?.MMP_POMA_DTL || fetchedData.MMP_POMA_DTL || [];
        }

        const allowedCategory = "Rail Pads";
        const dashboardRole = "Rail Pad";
        
        const currentCat = h.ITEM_CAT_DESCR;
        const isNullRequest = !currentCat;
        
        const isMatch = currentCat === allowedCategory;
        const isMismatch = currentCat && !isMatch;

        return (
            <div style={styles.body}>
                <div style={styles.summaryCard}>
                    <p style={styles.summaryLine}><strong>PO No:</strong> {h.PO_NO}</p>
                    {syncType === 'POMA DATA' && <p style={styles.summaryLine}><strong>MA No:</strong> {h.MA_NO || formData.maNo}</p>}
                    <p style={styles.summaryLine}><strong>Current Category:</strong> {currentCat || 'NULL (Not Found)'}</p>
                    <p style={styles.summaryLine}><strong>Items Found:</strong> {d.length}</p>
                </div>

                {isMismatch ? (
                    <div style={styles.errorBanner}>
                        🚫 <strong>Access Denied:</strong> This {syncType === 'POMA DATA' ? 'MA' : 'PO'} is categorized as "{currentCat}". 
                        Since you are in the <strong>{dashboardRole} Dashboard</strong>, 
                        you cannot sync this data.
                    </div>
                ) : isNullRequest ? (
                    <div style={{...styles.formGroup, marginBottom: '20px'}}>
                        <label style={styles.label}>Select Item Category</label>
                        <select 
                            value={manualCategory} 
                            onChange={(e) => setManualCategory(e.target.value)}
                            style={{
                                ...styles.input, 
                                height: '38px',
                                borderColor: !manualCategory ? '#ef4444' : '#cbd5e1',
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            required
                        >
                            <option value="" disabled>-- Select Category --</option>
                            <option value="Elastic Rail Clips">Elastic Rail Clips</option>
                            <option value="Rail Pads">Rail Pads</option>
                            <option value="PSC Mainline Sleeper">PSC Mainline Sleeper</option>
                        </select>
                        <p style={{color: '#64748b', fontSize: '11px', marginTop: '6px', lineHeight: '1.4'}}>
                            * Category was missing in IMMS. Please select "{allowedCategory}" to continue.
                        </p>
                    </div>
                ) : (
                    <div style={styles.successBanner}>
                        ✨ <strong>Verified:</strong> This is a valid {dashboardRole} {syncType === 'POMA DATA' ? 'MA' : 'PO'}. You can proceed with saving.
                    </div>
                )}

                {status === 'error' && <div style={styles.errorBanner}>⚠️ {errorMsg}</div>}
                
                <div style={styles.footer}>
                    <button onClick={resetModal} style={styles.cancelBtn}>Back</button>
                    {!isMismatch && (
                        <button 
                            onClick={handleSave} 
                            disabled={loading || (isNullRequest && !manualCategory)} 
                            style={{...styles.syncBtn, backgroundColor: '#10b981', backgroundImage: 'linear-gradient(135deg, #10b981, #059669)'}}
                        >
                            {loading ? 'Saving...' : `Sync & Save ${syncType === 'POMA DATA' ? 'MA' : 'PO'}`}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={styles.headerTitle}>
                        <div style={styles.headerIconBadge}>
                            {view === 'input' ? '🔄' : '📄'}
                        </div>
                        <div>
                            <h3 style={styles.title}>
                                {view === 'input' ? 'CRIS / IMMS Portal Sync' : `Verify ${syncType === 'POMA DATA' ? 'MA Data' : 'PO Data'}`}
                            </h3>
                            <p style={styles.subtitle}>
                                {view === 'input' ? 'Fetch & verify Purchase Orders & Modification Advices' : 'Validate category before saving to system'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                {view === 'input' ? renderInputView() : renderReviewView()}

                {status === 'success' && (
                    <div style={{...styles.overlay, backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 1001}}>
                        <div style={{textAlign: 'center'}}>
                            <div style={{fontSize: '52px', marginBottom: '8px'}}>✅</div>
                            <h3 style={{color: '#0f172a', margin: '0 0 6px 0', fontSize: '20px', fontWeight: '700'}}>
                                {syncType === 'POMA DATA' ? 'MA' : 'PO'} Saved Successfully!
                            </h3>
                            <p style={{color: '#64748b', margin: 0, fontSize: '13px'}}>The data has been synced to your dashboard.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: '#ffffff',
        width: '440px',
        maxWidth: '95vw',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
    },
    header: {
        padding: '18px 22px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    headerIconBadge: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
        color: '#ffffff'
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: '-0.2px'
    },
    subtitle: {
        margin: '2px 0 0 0',
        fontSize: '12px',
        color: '#64748b'
    },
    closeBtn: {
        background: '#f1f5f9',
        border: 'none',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        fontSize: '18px',
        color: '#64748b',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s'
    },
    body: {
        padding: '22px'
    },
    tabContainer: {
        display: 'flex',
        backgroundColor: '#f1f5f9',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '20px',
        gap: '4px',
        border: '1px solid #e2e8f0'
    },
    tabButton: {
        flex: 1,
        padding: '9px 14px',
        borderRadius: '9px',
        border: 'none',
        backgroundColor: 'transparent',
        color: '#64748b',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s ease'
    },
    tabButtonActive: {
        backgroundColor: '#0284c7',
        backgroundImage: 'linear-gradient(135deg, #0284c7, #0369a1)',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
    },
    grid2col: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    label: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    input: {
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        fontSize: '14px',
        color: '#0f172a',
        outline: 'none',
        transition: 'all 0.2s',
        boxSizing: 'border-box',
        width: '100%',
        backgroundColor: '#ffffff'
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '6px',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        maxHeight: '180px',
        overflowY: 'auto',
        zIndex: 20,
        boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.15)'
    },
    dropdownOption: {
        padding: '10px 14px',
        fontSize: '13px',
        cursor: 'pointer',
        color: '#1e293b',
        transition: 'background-color 0.15s'
    },
    summaryCard: {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '16px'
    },
    summaryLine: {
        margin: '5px 0',
        fontSize: '13px',
        color: '#334155'
    },
    errorBanner: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b',
        padding: '12px 14px',
        borderRadius: '10px',
        fontSize: '13px',
        marginBottom: '16px'
    },
    successBanner: {
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
        padding: '12px 14px',
        borderRadius: '10px',
        fontSize: '13px',
        marginBottom: '16px'
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '18px'
    },
    cancelBtn: {
        padding: '10px 18px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#ffffff',
        color: '#475569',
        fontWeight: '600',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    syncBtn: {
        padding: '10px 22px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: '#0284c7',
        backgroundImage: 'linear-gradient(135deg, #0284c7, #0369a1)',
        color: '#ffffff',
        fontWeight: '600',
        fontSize: '13px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
        transition: 'all 0.2s'
    }
};

export default SyncPOModal;
