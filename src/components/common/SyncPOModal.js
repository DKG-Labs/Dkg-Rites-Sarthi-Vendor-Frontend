import React, { useState, useEffect, useRef } from 'react';
import { immsService } from '../../services/immsService';

const SyncPOModal = ({ isOpen, onClose, onSuccess }) => {
    // Get vendor code from localStorage (standardized across modules in authService.js)
    const vendorCode = localStorage.getItem('vendorCode');
    const userName = localStorage.getItem('userName');
    const vcode = vendorCode || userName || sessionStorage.getItem('vendorCode') || ":41647";
    
    const syncType = 'PO DATA'; // PO DATA, POMA DATA, POCA DATA
    const [formData, setFormData] = useState({
        rly: '',
        poNo: '',
        poDate: '',
        maNo: '',
        maDate: '',
        caNo: '',
        caDate: '',
        vcode: vcode
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMsg, setErrorMsg] = useState('');
    const [fetchedData, setFetchedData] = useState(null);
    const [manualCategory, setManualCategory] = useState('');
    const [view, setView] = useState('input'); // input, review
    const [railways, setRailways] = useState([]);
    const [railwayLoading, setRailwayLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dateErrors, setDateErrors] = useState({});
    const dropdownRef = useRef(null);

    // Today's date string in YYYY-MM-DD format for max date validation
    const todayStr = new Date().toISOString().split('T')[0];

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
                const list = await immsService.getRlyList();
                // Sort railways numerically by their code (e.g., 01-CR before 16-WCR)
                const sorted = [...list].sort((a, b) => {
                    const numA = parseInt(a.rlyCd, 10);
                    const numB = parseInt(b.rlyCd, 10);
                    return numA - numB;
                });
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

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        // Validate: date must not be in the future
        if (value && value > todayStr) {
            setDateErrors(prev => ({ ...prev, [name]: 'Date cannot be in the future.' }));
        } else {
            setDateErrors(prev => ({ ...prev, [name]: '' }));
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Returns true if any date field has a validation error
    const hasDateErrors = () => Object.values(dateErrors).some(err => err);

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
        if (hasDateErrors()) return; // Block submit if date validation fails
        setLoading(true);
        setStatus('loading');
        setErrorMsg('');

        try {
            const finalVcode = formData.vcode.startsWith(':') ? formData.vcode : `:${formData.vcode}`;
            
            let payload = { rly: formData.rly, poNo: formData.poNo, vcode: finalVcode };
            
            if (syncType === 'PO DATA') {
                payload.poDate = formatDate(formData.poDate);
            } else if (syncType === 'POMA DATA') {
                payload.maDate = formatDate(formData.maDate);
                payload.maNo = formData.maNo;
            } else if (syncType === 'POCA DATA') {
                payload.caDate = formatDate(formData.caDate);
                payload.caNo = formData.caNo;
            }

            console.log('Fetching IMMS Data...', payload);
            const result = await immsService.getIMMSPOData(payload);
            
            if (result && result.status === 'OK' && result.data) {
                setFetchedData(result.data);
                
                // Determine manual category (existing logic)
                const header = result.data.PoHdr || result.data.MMP_POMA_HDR || result.data.MMP_POCA_HDR || result.data.header;
                setManualCategory(header?.ITEM_CAT_DESCR || '');
                
                setView('review');
                setStatus('idle');
            } else {
                throw new Error(result.error || result.message || 'Data not found or invalid response from IMMS.');
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
            } catch (e) {
                // ignore parse failure
            }

            if (!hasCrisError) {
                if (rawMsg.toLowerCase().includes('insp agency is not rites') || rawMsg.toLowerCase().includes('rites as per po record')) {
                    friendlyMsg = 'This purchase order cannot be synced because the Inspecting Agency is not set to RITES. Sarthi only supports syncing POs officially designated for RITES inspection.';
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
            if (syncType === 'PO DATA') {
                const savePayload = {
                    poHdr: { ...fetchedData.PoHdr, ITEM_CAT_DESCR: manualCategory },
                    poDtl: fetchedData.PoDtl.map(item => ({ 
                        ...item,
                        // Round quantities to nearest integer since backend expects Integer
                        QTY: item.QTY ? Math.round(parseFloat(item.QTY)).toString() : item.QTY,
                        QTY_CANCELLED: item.QTY_CANCELLED ? Math.round(parseFloat(item.QTY_CANCELLED)).toString() : item.QTY_CANCELLED
                    }))
                };
                response = await immsService.savePOToSarthi(savePayload);
            } else if (syncType === 'POMA DATA') {
                const savePayload = {
                    MMP_POMA_HDR: { ...fetchedData.MMP_POMA_HDR },
                    MMP_POMA_DTL: fetchedData.MMP_POMA_DTL.map(item => ({ ...item }))
                };
                response = await immsService.savePoMaToSarthi(savePayload);
            } else if (syncType === 'POCA DATA') {
                const savePayload = {
                    MMP_POCA_HDR: { ...fetchedData.MMP_POCA_HDR || fetchedData.header },
                    MMP_POCA_DTL: (fetchedData.MMP_POCA_DTL || fetchedData.details).map(item => ({ ...item }))
                };
                response = await immsService.savePoCaToSarthi(savePayload);
            }
            
            if (response && (response.responseStatus?.statusCode === 0 || response.status === 'success' || response.success || response.status === 'OK' || response.statusCode === 200)) {
                setStatus('success');
                setTimeout(() => {
                    if (onSuccess) onSuccess(response);
                    onClose();
                    resetModal();
                }, 2000);
            } else {
                throw new Error(response.message || response.responseStatus?.message || 'Failed to save data to system.');
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
            {/* Sync Type dropdown hidden as requested, defaults to PO DATA */}
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
                                backgroundColor: railwayLoading ? '#f1f5f9' : '#fff'
                            }}
                        >
                            <span style={{ color: !formData.rly ? '#94a3b8' : '#1e293b' }}>
                                {formData.rly 
                                    ? (railways.find(r => r.rlyCd === formData.rly) ? `${formData.rly}-${railways.find(r => r.rlyCd === formData.rly).rlyShortName}` : formData.rly)
                                    : (railwayLoading ? 'Loading...' : '-- Select Railway --')
                                }
                            </span>
                            <span style={{ fontSize: '10px', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
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
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        {r.rlyCd}-{r.rlyShortName}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>PO Number (poNo)</label>
                    <input name="poNo" value={formData.poNo} onChange={handleInputChange} placeholder="Enter PO Number" style={styles.input} required />
                </div>

                {syncType === 'PO DATA' && (
                    <div style={styles.formGroup}>
                        <label style={styles.label}>PO Date (poDate)</label>
                        <input
                            name="poDate"
                            type="date"
                            value={formData.poDate}
                            onChange={handleDateChange}
                            max={todayStr}
                            style={{
                                ...styles.input,
                                borderColor: dateErrors.poDate ? '#ef4444' : '#e2e8f0'
                            }}
                            required
                        />
                        {dateErrors.poDate && (
                            <span style={styles.dateError}>{dateErrors.poDate}</span>
                        )}
                    </div>
                )}

                {syncType === 'POMA DATA' && (
                    <>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>MA Number (maNo)</label>
                            <input name="maNo" value={formData.maNo} onChange={handleInputChange} placeholder="Enter MA Number" style={styles.input} required />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>MA Date (maDate)</label>
                            <input
                                name="maDate"
                                type="date"
                                value={formData.maDate}
                                onChange={handleDateChange}
                                max={todayStr}
                                style={{
                                    ...styles.input,
                                    borderColor: dateErrors.maDate ? '#ef4444' : '#e2e8f0'
                                }}
                                required
                            />
                            {dateErrors.maDate && (
                                <span style={styles.dateError}>{dateErrors.maDate}</span>
                            )}
                        </div>
                    </>
                )}

                {syncType === 'POCA DATA' && (
                    <>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>CA Number (caNo)</label>
                            <input name="caNo" value={formData.caNo} onChange={handleInputChange} placeholder="Enter CA Number" style={styles.input} required />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>CA Date (caDate)</label>
                            <input
                                name="caDate"
                                type="date"
                                value={formData.caDate}
                                onChange={handleDateChange}
                                max={todayStr}
                                style={{
                                    ...styles.input,
                                    borderColor: dateErrors.caDate ? '#ef4444' : '#e2e8f0'
                                }}
                                required
                            />
                            {dateErrors.caDate && (
                                <span style={styles.dateError}>{dateErrors.caDate}</span>
                            )}
                        </div>
                    </>
                )}

                <div style={styles.formGroup}>
                    <label style={styles.label}>Vendor Code (vcode)</label>
                    <input value={formData.vcode} readOnly style={{...styles.input, backgroundColor: '#f1f5f9'}} />
                </div>
            </div>
            {status === 'error' && <div style={styles.errorBanner}>⚠️ {errorMsg}</div>}
            <div style={styles.footer}>
                <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={loading} style={styles.syncBtn}>
                    {loading ? 'Fetching...' : `Fetch ${syncType} Details`}
                </button>
            </div>
        </form>
    );

    const renderReviewView = () => {
        let h, d;
        
        if (syncType === 'PO DATA') {
            h = fetchedData.PoHdr;
            d = fetchedData.PoDtl || [];
        } else if (syncType === 'POMA DATA') {
            h = fetchedData.MMP_POMA_HDR;
            d = fetchedData.MMP_POMA_DTL || [];
        } else if (syncType === 'POCA DATA') {
            h = fetchedData.MMP_POCA_HDR || fetchedData.header;
            d = fetchedData.MMP_POCA_DTL || fetchedData.details || [];
        }
        
        // Get role from localStorage (it's stored as a JSON string array)
        let userRoles = [];
        try {
            const storedRoles = localStorage.getItem('roleName');
            userRoles = storedRoles ? JSON.parse(storedRoles) : [];
        } catch (e) {
            userRoles = [localStorage.getItem('roleName')];
        }

        const activeRole = localStorage.getItem('activeRole');

        // Determine if current user is a Sleeper user
        let isSleeperUser = (activeRole === 'Sleeper Vendor' || activeRole === 'SLEEPER_VENDOR') ||
                            (Array.isArray(userRoles) && userRoles.some(r => r === 'Sleeper Vendor' || r === 'SLEEPER_VENDOR'));
        
        // Fallback: If no explicit role data found in localStorage, 
        // we check if we are in a context that implies Sleeper Vendor.
        if (!isSleeperUser && activeRole !== 'Vendor' && activeRole !== 'Rail Vendor') {
            isSleeperUser = true;
        }
        
        const dashboardRole = isSleeperUser ? "Sleeper" : "ERC";
        const allowedCategory = isSleeperUser ? "PSC Mainline Sleeper" : "Elastic Rail Clips";
        
        const currentCat = h.ITEM_CAT_DESCR;
        const isNullRequest = !currentCat;
        
        // Exact match for the category string
        const isMatch = currentCat === allowedCategory;
        const isMismatch = currentCat && !isMatch;

        return (
            <div style={styles.body}>
                <div style={styles.summaryCard}>
                    <p style={styles.summaryLine}><strong>Type:</strong> {syncType}</p>
                    <p style={styles.summaryLine}><strong>No:</strong> {h.PO_NO || h.poNo}</p>
                    {syncType === 'POMA DATA' && <p style={styles.summaryLine}><strong>MA No:</strong> {h.MA_NO || h.maNo}</p>}
                    {syncType === 'POCA DATA' && <p style={styles.summaryLine}><strong>CA No:</strong> {h.CA_NO || h.caNo}</p>}
                    <p style={styles.summaryLine}><strong>Category:</strong> {h.ITEM_CAT_DESCR || 'N/A'}</p>
                    <p style={styles.summaryLine}><strong>Items/Details:</strong> {d.length}</p>
                </div>

                {isMismatch ? (
                    <div style={styles.errorBanner}>
                        🚫 <strong>Access Denied:</strong> This record is categorized as "{currentCat}". 
                        Since you are logged in as an <strong>{dashboardRole} Vendor</strong>, 
                        you cannot sync this data.
                    </div>
                ) : (h.ITEM_CAT_DESCR || manualCategory) ? (
                    <div style={styles.successBanner}>
                        ✨ <strong>Verified:</strong> Valid {dashboardRole} record. You can proceed with saving.
                    </div>
                ) : (
                    <div style={{...styles.formGroup, marginBottom: '20px'}}>
                        <label style={styles.label}>Select Item Category</label>
                        <select 
                            value={manualCategory} 
                            onChange={(e) => setManualCategory(e.target.value)}
                            style={{
                                ...styles.input, 
                                height: '38px',
                                borderColor: !manualCategory ? '#ef4444' : '#e2e8f0',
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
                            * Category was missing. Please select to continue.
                        </p>
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
                            {loading ? 'Saving...' : 'Sync & Save PO'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} className="fade-in">
                <div style={styles.header}>
                    <div style={styles.headerTitle}>
                        <span style={styles.headerIcon}>{view === 'input' ? '🔄' : '📄'}</span>
                        <div>
                            <h3 style={styles.title}>{view === 'input' ? `sync ${syncType}` : `Verify ${syncType}`}</h3>
                            <p style={styles.subtitle}>
                                {view === 'input' ? 'Connect to CRIS/IMMS portal' : 'Validate category before saving to system'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                {view === 'input' ? renderInputView() : renderReviewView()}

                {status === 'success' && (
                    <div style={{...styles.overlay, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 1001}}>
                        <div style={{textAlign: 'center'}} className="fade-in">
                            <div style={{fontSize: '50px'}}>✅</div>
                            <h3 style={{color: '#0f172a'}}>{syncType} Saved Successfully!</h3>
                            <p style={{color: '#64748b'}}>The data has been synced to your dashboard.</p>
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
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease'
    },
    modal: {
        backgroundColor: '#fff',
        width: '420px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflowY: 'auto',
        overflowX: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        padding: '12px 16px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
    },
    headerTitle: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },
    headerIcon: {
        fontSize: '16px',
        background: '#fff',
        padding: '5px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    title: {
        margin: 0,
        fontSize: '14px',
        fontWeight: '800',
        color: '#0f172a'
    },
    subtitle: {
        margin: '1px 0 0',
        fontSize: '10px',
        color: '#64748b'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '18px',
        color: '#94a3b8',
        cursor: 'pointer',
        padding: 0
    },
    body: {
        padding: '16px 20px',
        flex: 1
    },
    grid2col: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px 12px'
    },
    formGroup: {
        marginBottom: 0
    },
    label: {
        display: 'block',
        fontSize: '11px',
        fontWeight: '600',
        color: '#475569',
        marginBottom: '3px'
    },
    input: {
        width: '100%',
        height: '32px',
        padding: '0 8px',
        borderRadius: '7px',
        border: '1.5px solid #e2e8f0',
        fontSize: '12px',
        color: '#1e293b',
        transition: 'all 0.2s',
        outline: 'none',
        boxSizing: 'border-box'
    },
    footer: {
        marginTop: '20px',
        display: 'flex',
        gap: '8px'
    },
    cancelBtn: {
        flex: 1,
        height: '38px',
        borderRadius: '10px',
        border: '1.5px solid #e2e8f0',
        backgroundColor: '#fff',
        color: '#64748b',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    syncBtn: {
        flex: 2,
        height: '38px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: '#4f46e5',
        backgroundImage: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: '#fff',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)',
        transition: 'all 0.2s'
    },
    errorBanner: {
        padding: '10px 12px',
        borderRadius: '8px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fee2e2',
        color: '#b91c1c',
        fontSize: '12px',
        fontWeight: '600',
        marginTop: '12px'
    },
    successBanner: {
        padding: '10px 12px',
        borderRadius: '8px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #dcfce7',
        color: '#15803d',
        fontSize: '12px',
        fontWeight: '600',
        marginTop: '12px'
    },
    summaryCard: {
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
    },
    summaryLine: {
        margin: '4px 0',
        fontSize: '13px',
        color: '#1e293b'
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        zIndex: 10,
        marginTop: '4px',
        maxHeight: '200px',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease'
    },
    dropdownOption: {
        padding: '8px 12px',
        fontSize: '12px',
        color: '#1e293b',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    dateError: {
        display: 'block',
        color: '#ef4444',
        fontSize: '10px',
        fontWeight: '600',
        marginTop: '3px'
    }
};

export default SyncPOModal;
