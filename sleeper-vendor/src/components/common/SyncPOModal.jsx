import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';

const SyncPOModal = ({ isOpen, onClose, onSuccess }) => {
    const vcode = sessionStorage.getItem('vendorCode') || ":41647";
    const [formData, setFormData] = useState({
        rly: '',
        poNo: '',
        poDate: '',
        vcode: vcode
    });
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
                const list = await apiService.getRlyList();
                // Sort railways numerically by their code (e.g., 01-CR before 16-WCR)
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
            const payload = { ...formData, poDate: formatDate(formData.poDate), vcode: finalVcode };

            console.log('Fetching IMMS Data...', payload);
            const result = await apiService.getIMMSPOData(payload);
            
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
            setErrorMsg(error.message || 'Sync failed. Check connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus('loading');
        
        try {
            // Map the PascalCase CRIS format to camelCase local backend format
            const savePayload = {
                poHdr: {
                    ...fetchedData.PoHdr,
                    ITEM_CAT_DESCR: manualCategory // use manual value if it was null
                },
                poDtl: fetchedData.PoDtl.map(item => ({ ...item }))
            };

            const response = await apiService.savePOData(savePayload);
            
            if (response && (response.responseStatus?.statusCode === 0 || response.status === 'success')) {
                setStatus('success');
                setTimeout(() => {
                    if (onSuccess) onSuccess(response);
                    onClose();
                    resetModal();
                }, 2000);
            } else {
                throw new Error(response.responseStatus?.message || 'Failed to save PO data to system.');
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
                    <label style={styles.label}>PO Number (poNo)</label>
                    <input name="poNo" value={formData.poNo} onChange={handleInputChange} placeholder="Enter PO Number" style={styles.input} required />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>PO Date (poDate)</label>
                    <input name="poDate" type="date" value={formData.poDate} onChange={handleInputChange} style={styles.input} required />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Vendor Code (vcode)</label>
                    <input value={formData.vcode} readOnly style={{...styles.input, backgroundColor: '#f1f5f9'}} />
                </div>
            </div>
            {status === 'error' && <div style={styles.errorBanner}>⚠️ {errorMsg}</div>}
            <div style={styles.footer}>
                <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={loading} style={styles.syncBtn}>
                    {loading ? 'Fetching...' : 'Fetch PO Details'}
                </button>
            </div>
        </form>
    );

    const renderReviewView = () => {
        const h = fetchedData.PoHdr;
        const d = fetchedData.PoDtl || [];
        
        // Get role from localStorage (it's stored as a JSON string array)
        let userRoles = [];
        try {
            userRoles = JSON.parse(localStorage.getItem('roleName') || '[]');
        } catch (e) {
            userRoles = [localStorage.getItem('roleName')];
        }

        // Determine which category this user is allowed to sync
        const isSleeperUser = userRoles.some(r => r === 'Sleeper Vendor');
        
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
                    <p style={styles.summaryLine}><strong>PO No:</strong> {h.PO_NO}</p>
                    <p style={styles.summaryLine}><strong>Current Category:</strong> {currentCat || 'NULL (Not Found)'}</p>
                    <p style={styles.summaryLine}><strong>Items Found:</strong> {d.length}</p>
                </div>

                {isMismatch ? (
                    <div style={styles.errorBanner}>
                        🚫 <strong>Access Denied:</strong> This PO is categorized as "{currentCat}". 
                        Since you are logged in as a <strong>{dashboardRole} Vendor</strong>, 
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
                                height: '38px', // Increased height for better interaction
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
                            * Category was missing in IMMS. Please select the appropriate category to continue.
                        </p>
                    </div>
                ) : (
                    <div style={styles.successBanner}>
                        ✨ <strong>Verified:</strong> This is a valid {dashboardRole} PO. You can proceed with saving.
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
                            <h3 style={styles.title}>{view === 'input' ? 'sync PO' : 'Verify PO Data'}</h3>
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
                            <h3 style={{color: '#0f172a'}}>PO Saved Successfully!</h3>
                            <p style={{color: '#64748b'}}>The PO has been synced to your dashboard.</p>
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
    warningBanner: {
        padding: '10px 12px',
        borderRadius: '8px',
        backgroundColor: '#fffbeb',
        border: '1px solid #fef3c7',
        color: '#92400e',
        fontSize: '12px',
        fontWeight: '500',
        marginTop: '12px',
        lineHeight: '1.4'
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
    }
};

export default SyncPOModal;
