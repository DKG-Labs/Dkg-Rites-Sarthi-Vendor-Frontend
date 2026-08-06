import React, { useState, useEffect, useRef } from 'react';
import poAssignedService from '../../services/poAssignedService';

const SyncPOModal = ({ isOpen, onClose, onSuccess, vendorCode: propVendorCode, plantId }) => {
    const [syncType, setSyncType] = useState('PO DATA'); // PO DATA, POMA DATA, IBS_CASE_NO
    const [formData, setFormData] = useState({
        rly: '',
        poNo: '',
        poDate: '',
        maNo: '',
        maDate: '',
        vcode: ''
    });

    const [vendorPos, setVendorPos] = useState([]);
    const [poLoading, setPoLoading] = useState(false);
    const [selectedPoId, setSelectedPoId] = useState('');
    const [ibsResult, setIbsResult] = useState(null);

    useEffect(() => {
        if (isOpen) {
            let vcode = propVendorCode || 
                         localStorage.getItem('railpad_vendorCode') || 
                         localStorage.getItem('vendorCode') || 
                         sessionStorage.getItem('vendorCode') || 
                         sessionStorage.getItem('vcode') || "";
            
            if (!vcode && plantId && plantId.includes(':')) {
                const parts = plantId.split('/');
                const colonPart = parts.find(p => p.includes(':'));
                if (colonPart) vcode = colonPart;
            } else if (!vcode && !plantId) {
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

    const [isPoDropdownOpen, setIsPoDropdownOpen] = useState(false);
    const poDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (poDropdownRef.current && !poDropdownRef.current.contains(event.target)) {
                setIsPoDropdownOpen(false);
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

    const fetchVendorPos = async (vcode) => {
        const cleanVcode = vcode || formData.vcode;
        if (!cleanVcode) return;
        setPoLoading(true);
        try {
            const data = await poAssignedService.getPoAssigned(cleanVcode);
            const list = Array.isArray(data) ? data : (data.responseData || []);
            setVendorPos(list);
        } catch (err) {
            console.error('Failed to fetch vendor POs:', err);
        } finally {
            setPoLoading(false);
        }
    };

    const handlePoSelectForIbs = (poId) => {
        setSelectedPoId(poId);
        const poObj = vendorPos.find(p => String(p.id || p.poNo) === String(poId));
        if (poObj) {
            setFormData(prev => ({
                ...prev,
                poNo: poObj.poNo || poObj.po_no || '',
                poDate: poObj.poDate || poObj.po_dt || '',
                rly: poObj.rlyCd || poObj.rly_cd || poObj.rly || ''
            }));
        }
    };

    const handleSync = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setStatus('loading');
        setErrorMsg('');

        try {
            const finalVcode = formData.vcode.startsWith(':') ? formData.vcode : `:${formData.vcode}`;

            if (syncType === 'IBS_CASE_NO') {
                const poObj = vendorPos.find(p => String(p.id || p.poNo) === String(selectedPoId)) || {};
                const ibsPayload = {
                    POKEY: poObj.po_key || poObj.poKey || poObj.pokey || poObj.poNo || formData.poNo,
                    PO_NO: poObj.poNo || poObj.po_no || formData.poNo,
                    PO_DT: poObj.poDate || poObj.po_dt || formData.poDate,
                    RLY_CD: poObj.rlyCd || poObj.rly_cd || formData.rly
                };

                const res = await poAssignedService.getIbsCaseNo(ibsPayload);
                const data = res?.data || res;

                if (data && (data.caseNo || data.CASE_NO)) {
                    setIbsResult(data);
                    setView('review');
                    setStatus('idle');
                } else {
                    setErrorMsg(data?.message || 'Case Number not found for the specified PO details.');
                    setStatus('error');
                }
                return;
            }

            let immsToken = sessionStorage.getItem('imms_token');
            if (!immsToken) {
                immsToken = await poAssignedService.authenticateIMMS();
            }

            if (syncType === 'POMA DATA') {
                const formattedMaDate = formatDate(formData.maDate);
                let poDateFormatted = '';
                
                try {
                    const poDateRes = await poAssignedService.getPoDateByPoNo(formData.poNo);
                    if (poDateRes) {
                        poDateFormatted = formatDate(poDateRes);
                    }
                } catch (err) {
                    console.log('PO Date lookup failed, fallback to prompt/manual');
                }

                if (!poDateFormatted) {
                    poDateFormatted = formatDate(formData.poDate);
                }

                if (!poDateFormatted) {
                    const userInput = prompt("PO Date is required for MA Sync (dd/mm/yyyy or yyyy-mm-dd):");
                    if (!userInput) {
                        setLoading(false);
                        setStatus('idle');
                        setErrorMsg('PO Date is required to fetch MA details');
                        return;
                    }
                    poDateFormatted = formatDate(userInput);
                }

                const maPayload = {
                    rly: formData.rly,
                    poNo: formData.poNo,
                    poDate: poDateFormatted,
                    vcode: finalVcode,
                    maNo: formData.maNo,
                    maDate: formattedMaDate,
                    amended: "true"
                };

                const res = await poAssignedService.getIMMSMAData(maPayload);
                
                if (res && res.status === 'Success' && res.data) {
                    setFetchedData(res);
                    setView('review');
                    setStatus('idle');
                } else {
                    setErrorMsg(res.message || 'Failed to fetch MA details from CRIS/IMMS.');
                    setStatus('error');
                }

            } else {
                const formattedPoDate = formatDate(formData.poDate);
                const payload = {
                    rly: formData.rly,
                    poNo: formData.poNo,
                    poDate: formattedPoDate,
                    vcode: finalVcode
                };

                const res = await poAssignedService.getIMMSPOData(payload);
                if (res && res.status === 'Success' && res.data) {
                    setFetchedData(res);
                    setView('review');
                    setStatus('idle');
                } else {
                    setErrorMsg(res.message || 'Failed to fetch PO details from CRIS/IMMS.');
                    setStatus('error');
                }
            }
        } catch (err) {
            setErrorMsg(err.message || 'An error occurred during proxy sync.');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (syncType === 'IBS_CASE_NO') {
            if (!ibsResult || (!ibsResult.caseNo && !ibsResult.CASE_NO)) {
                setErrorMsg('No valid IBS Case Number to save.');
                return;
            }
            setLoading(true);
            try {
                const poObj = vendorPos.find(p => String(p.id || p.poNo) === String(selectedPoId)) || {};
                const savePayload = {
                    poNo: poObj.poNo || poObj.po_no || formData.poNo,
                    poKey: poObj.po_key || poObj.poKey || poObj.pokey || formData.poNo,
                    caseNo: ibsResult.caseNo || ibsResult.CASE_NO,
                    caseStatus: ibsResult.caseStatus || ibsResult.STATUS || 'AVAILABLE'
                };
                await poAssignedService.saveIbsCaseNo(savePayload);
                setStatus('success');
                if (onSuccess) onSuccess();
            } catch (err) {
                setErrorMsg(err.message || 'Failed to save IBS Case Number to PO Header.');
                setStatus('error');
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            if (syncType === 'POMA DATA') {
                const saveMaPayload = {
                    ...fetchedData,
                    vcode: formData.vcode.startsWith(':') ? formData.vcode : `:${formData.vcode}`
                };
                const res = await poAssignedService.savePoMaData(saveMaPayload);
                if (res && (res.status === 'Success' || res.status === 200 || res.responseStatus?.statusCode === '200')) {
                    setStatus('success');
                    if (onSuccess) onSuccess();
                } else {
                    setErrorMsg(res.message || 'Failed to save MA data');
                    setStatus('error');
                }
            } else {
                let categoryToSave = fetchedData.PoHdr?.ITEM_CAT_DESCR;
                if (!categoryToSave) {
                    categoryToSave = manualCategory;
                }

                if (!categoryToSave) {
                    setErrorMsg('Item category is required to save.');
                    setLoading(false);
                    return;
                }

                const savePayload = {
                    ...fetchedData,
                    vcode: formData.vcode.startsWith(':') ? formData.vcode : `:${formData.vcode}`,
                    PoHdr: {
                        ...fetchedData.PoHdr,
                        ITEM_CAT_DESCR: categoryToSave
                    }
                };

                const res = await poAssignedService.savePOData(savePayload);
                if (res && (res.status === 'Success' || res.status === 200 || res.responseStatus?.statusCode === '200')) {
                    setStatus('success');
                    if (onSuccess) onSuccess();
                } else {
                    setErrorMsg(res.message || 'Failed to save PO data');
                    setStatus('error');
                }
            }
        } catch (err) {
            setErrorMsg(err.message || 'An error occurred while saving.');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const resetModal = () => {
        setView('input');
        setFetchedData(null);
        setStatus('idle');
        setErrorMsg('');
        setSelectedPoId('');
        setIbsResult(null);
    };

    const renderInputView = () => {
        const availableVendorPos = vendorPos.filter(po => {
            const caseNo = po.caseNo || po.case_no || po.caseNumber || po.CASE_NO;
            return !caseNo || String(caseNo).trim() === '' || String(caseNo).trim().toUpperCase() === 'N/A' || String(caseNo).trim().toLowerCase() === 'null';
        });

        return (
            <form onSubmit={handleSync} style={{ ...styles.body, paddingBottom: (isPoDropdownOpen || isDropdownOpen) ? '140px' : '24px' }}>
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
                        <span style={{ fontSize: '15px' }}>📦</span> PO Sync
                    </button>
                    <button
                        type="button"
                        onClick={() => { setSyncType('POMA DATA'); setErrorMsg(''); }}
                        style={{
                            ...styles.tabButton,
                            ...(syncType === 'POMA DATA' ? styles.tabButtonActive : {})
                        }}
                    >
                        <span style={{ fontSize: '15px' }}>📝</span> MA Sync
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSyncType('IBS_CASE_NO');
                            setErrorMsg('');
                            fetchVendorPos(formData.vcode);
                        }}
                        style={{
                            ...styles.tabButton,
                            ...(syncType === 'IBS_CASE_NO' ? styles.tabButtonActive : {})
                        }}
                    >
                        <span style={{ fontSize: '15px' }}>🔢</span> IBS Case No
                    </button>
                </div>

                {syncType === 'IBS_CASE_NO' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Select Purchase Order (PO)</label>
                            <div ref={poDropdownRef} style={{ position: 'relative' }}>
                                <div 
                                    onClick={() => !poLoading && availableVendorPos.length > 0 && setIsPoDropdownOpen(!isPoDropdownOpen)}
                                    style={{
                                        ...styles.input,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: (poLoading || availableVendorPos.length === 0) ? 'not-allowed' : 'pointer',
                                        backgroundColor: (poLoading || availableVendorPos.length === 0) ? '#f8fafc' : '#ffffff',
                                        height: '46px',
                                        borderColor: isPoDropdownOpen ? '#0284c7' : '#cbd5e1',
                                        boxShadow: isPoDropdownOpen ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                        <span style={{ fontSize: '16px' }}>📦</span>
                                        {selectedPoId ? (
                                            <span style={{ color: '#0f172a', fontWeight: '700', fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                PO No: <span style={{ color: '#0284c7' }}>{formData.poNo}</span> | Rly: {formData.rly || 'N/A'} | Date: {formData.poDate || 'N/A'}
                                            </span>
                                        ) : (
                                            <span style={{ color: availableVendorPos.length === 0 ? '#94a3b8' : '#64748b', fontSize: '13px', fontWeight: '500' }}>
                                                {poLoading 
                                                    ? 'Loading Vendor POs...' 
                                                    : (availableVendorPos.length === 0 
                                                        ? 'No pending POs (All POs have Case Numbers)' 
                                                        : '-- Select PO to Fetch Case Number --')
                                                }
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#64748b', transform: isPoDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
                                </div>

                                {isPoDropdownOpen && availableVendorPos.length > 0 && (
                                    <div style={styles.poDropdownList}>
                                        {availableVendorPos.map((po, index) => {
                                            const poIdVal = po.id || po.poNo;
                                            const poNoVal = po.poNo || po.po_no || '';
                                            const rlyVal = po.rlyCd || po.rly_cd || po.rlyShortName || po.rly || 'N/A';
                                            const dateVal = po.poDate || po.po_dt || 'N/A';
                                            const isSelected = String(poIdVal) === String(selectedPoId);

                                            return (
                                                <div 
                                                    key={poIdVal || index}
                                                    onClick={() => {
                                                        handlePoSelectForIbs(poIdVal);
                                                        setIsPoDropdownOpen(false);
                                                    }}
                                                    style={{
                                                        ...styles.poDropdownOption,
                                                        backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
                                                        borderLeft: isSelected ? '4px solid #0284c7' : '4px solid transparent'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>
                                                            PO No: <span style={{ color: '#0284c7' }}>{poNoVal}</span>
                                                        </span>
                                                        <span style={{ 
                                                            backgroundColor: '#e0f2fe', 
                                                            color: '#0369a1', 
                                                            fontSize: '11px', 
                                                            fontWeight: '700', 
                                                            padding: '2px 8px', 
                                                            borderRadius: '6px' 
                                                        }}>
                                                            RLY {rlyVal}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                                                        <span>PO Key: {po.po_key || po.poKey || po.pokey || poNoVal}</span>
                                                        <span>📅 {dateVal}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedPoId && (
                            <div style={styles.poSummaryCard}>
                                <div style={styles.poSummaryGrid}>
                                    <div style={styles.poSummaryItem}>
                                        <span style={styles.poSummaryLabel}>PO Key</span>
                                        <span style={styles.poSummaryValue}>
                                            {vendorPos.find(p => String(p.id || p.poNo) === String(selectedPoId))?.po_key || 
                                             vendorPos.find(p => String(p.id || p.poNo) === String(selectedPoId))?.poKey || 
                                             vendorPos.find(p => String(p.id || p.poNo) === String(selectedPoId))?.pokey || selectedPoId}
                                        </span>
                                    </div>
                                    <div style={styles.poSummaryItem}>
                                        <span style={styles.poSummaryLabel}>PO Number</span>
                                        <span style={styles.poSummaryValue}>{formData.poNo || 'N/A'}</span>
                                    </div>
                                    <div style={styles.poSummaryItem}>
                                        <span style={styles.poSummaryLabel}>PO Date</span>
                                        <span style={styles.poSummaryValue}>{formData.poDate || 'N/A'}</span>
                                    </div>
                                    <div style={styles.poSummaryItem}>
                                        <span style={styles.poSummaryLabel}>Railway Code</span>
                                        <span style={styles.poSummaryValue}>{formData.rly || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={styles.formGrid}>
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
                                    <span style={{ color: !formData.rly ? '#94a3b8' : '#0f172a', fontWeight: formData.rly ? '600' : '400', fontSize: '13px' }}>
                                        {formData.rly 
                                            ? (railways.find(r => r.rlyCd === formData.rly) ? `${formData.rly} - ${railways.find(r => r.rlyCd === formData.rly).rlyShortName}` : formData.rly)
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
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f9ff'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                                <strong style={{ color: '#0284c7' }}>{r.rlyCd}</strong> - {r.rlyShortName}
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

                        <div style={{
                            ...styles.formGroup,
                            ...(syncType === 'POMA DATA' ? { gridColumn: 'span 2' } : {})
                        }}>
                            <label style={styles.label}>Vendor Code</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input value={formData.vcode} readOnly style={{ ...styles.input, backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', paddingLeft: '32px' }} />
                                <span style={{ position: 'absolute', left: '10px', fontSize: '13px', color: '#94a3b8' }}>🔒</span>
                            </div>
                        </div>
                    </div>
                )}
                {status === 'error' && <div style={styles.errorBanner}>⚠️ {errorMsg}</div>}
                <div style={styles.footer}>
                    <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                    <button type="submit" disabled={loading || (syncType === 'IBS_CASE_NO' && !selectedPoId)} style={styles.syncBtn}>
                        {loading ? 'Fetching Details...' : (syncType === 'IBS_CASE_NO' ? 'Fetch IBS Case Number' : `Fetch ${syncType === 'POMA DATA' ? 'MA' : 'PO'} Details`)}
                    </button>
                </div>
            </form>
        );
    };

    const renderReviewView = () => {
        if (syncType === 'IBS_CASE_NO' && ibsResult) {
            return (
                <div style={styles.body}>
                    <div style={styles.heroCaseCard}>
                        <div style={styles.heroCaseHeader}>
                            <span style={styles.heroCaseLabel}>IBS CASE NUMBER</span>
                            <span style={styles.statusBadge}>
                                {ibsResult.STATUS || ibsResult.status || 'AVAILABLE'}
                            </span>
                        </div>
                        <div style={styles.heroCaseNumber}>
                            {ibsResult.CASE_NO || ibsResult.caseNo || 'N/A'}
                        </div>
                    </div>

                    <div style={styles.reviewGridCard}>
                        <div style={styles.reviewGridItem}>
                            <span style={styles.reviewGridLabel}>PO Number</span>
                            <span style={styles.reviewGridValue}>{ibsResult.PO_NO || formData.poNo}</span>
                        </div>
                        <div style={styles.reviewGridItem}>
                            <span style={styles.reviewGridLabel}>PO Key</span>
                            <span style={styles.reviewGridValue}>{ibsResult.POKEY || 'N/A'}</span>
                        </div>
                        <div style={styles.reviewGridItem}>
                            <span style={styles.reviewGridLabel}>PO Date</span>
                            <span style={styles.reviewGridValue}>{ibsResult.PO_DT || formData.poDate}</span>
                        </div>
                        <div style={styles.reviewGridItem}>
                            <span style={styles.reviewGridLabel}>Railway Code</span>
                            <span style={styles.reviewGridValue}>{ibsResult.RLY_CD || formData.rly}</span>
                        </div>
                    </div>

                    {status === 'error' && <div style={styles.errorBanner}>⚠️ {errorMsg}</div>}

                    <div style={styles.footer}>
                        <button onClick={resetModal} style={styles.cancelBtn}>Back</button>
                        <button 
                            onClick={handleSave} 
                            disabled={loading} 
                            style={{ ...styles.syncBtn, backgroundColor: '#10b981', backgroundImage: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
                        >
                            {loading ? 'Saving...' : 'Save Case Number to PO'}
                        </button>
                    </div>
                </div>
            );
        }

        let h = {};
        let d = [];

        if (fetchedData) {
            h = fetchedData.PoHdr || fetchedData.data?.MMP_PO_HDR || fetchedData.MMP_PO_HDR || fetchedData.data?.MMP_POMA_HDR || fetchedData.MMP_POMA_HDR || {};
            d = fetchedData.PoDtl || fetchedData.data?.MMP_PO_DTL || fetchedData.MMP_PO_DTL || fetchedData.data?.MMP_POMA_DTL || fetchedData.MMP_POMA_DTL || [];
        }

        const allowedCategory = "Rail Pads";
        const dashboardRole = "Rail Pad";
        
        const currentCat = h.ITEM_CAT_DESCR;
        const isNullRequest = !currentCat;
        
        const isMatch = currentCat === allowedCategory;
        const isMismatch = currentCat && !isMatch;

        return (
            <div style={styles.body}>
                <div style={styles.reviewGridCard}>
                    <div style={styles.reviewGridItem}>
                        <span style={styles.reviewGridLabel}>PO Number</span>
                        <span style={styles.reviewGridValue}>{h.PO_NO}</span>
                    </div>
                    {syncType === 'POMA DATA' && (
                        <div style={styles.reviewGridItem}>
                            <span style={styles.reviewGridLabel}>MA Number</span>
                            <span style={styles.reviewGridValue}>{h.MA_NO || formData.maNo}</span>
                        </div>
                    )}
                    <div style={styles.reviewGridItem}>
                        <span style={styles.reviewGridLabel}>PO Date</span>
                        <span style={styles.reviewGridValue}>{h.PO_DT || formData.poDate}</span>
                    </div>
                    <div style={styles.reviewGridItem}>
                        <span style={styles.reviewGridLabel}>Items Count</span>
                        <span style={styles.reviewGridValue}>{d.length} Items</span>
                    </div>
                    <div style={{ ...styles.reviewGridItem, gridColumn: 'span 2' }}>
                        <span style={styles.reviewGridLabel}>Detected Category</span>
                        <span style={{ 
                            ...styles.reviewGridValue, 
                            color: isMatch ? '#059669' : (isMismatch ? '#dc2626' : '#d97706'),
                            fontWeight: '700'
                        }}>
                            {currentCat ? currentCat : '⚠️ Missing Category'}
                        </span>
                    </div>
                </div>

                {isMismatch ? (
                    <div style={styles.errorBanner}>
                        🚫 <strong>Category Mismatch:</strong> This PO belongs to "{currentCat}". You cannot save it under {dashboardRole}.
                    </div>
                ) : isNullRequest ? (
                    <div style={styles.warningBanner}>
                        <label style={{ ...styles.label, color: '#92400e', marginBottom: '4px', display: 'block' }}>Select Mandatory Category:</label>
                        <select 
                            value={manualCategory} 
                            onChange={(e) => setManualCategory(e.target.value)}
                            style={{
                                ...styles.input, 
                                height: '42px',
                                borderColor: !manualCategory ? '#ef4444' : '#cbd5e1',
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                fontWeight: '600'
                            }}
                            required
                        >
                            <option value="" disabled>-- Select Category --</option>
                            <option value="Elastic Rail Clips">Elastic Rail Clips</option>
                            <option value="Rail Pads">Rail Pads</option>
                            <option value="PSC Mainline Sleeper">PSC Mainline Sleeper</option>
                        </select>
                        <p style={{ color: '#64748b', fontSize: '11px', marginTop: '6px', lineHeight: '1.4' }}>
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
                            style={{ ...styles.syncBtn, backgroundColor: '#10b981', backgroundImage: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
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
                                {view === 'input' ? 'CRIS / IMMS Portal Sync' : `Verify ${syncType === 'POMA DATA' ? 'MA Data' : (syncType === 'IBS_CASE_NO' ? 'IBS Case Data' : 'PO Data')}`}
                            </h3>
                            <p style={styles.subtitle}>
                                {view === 'input' ? 'Fetch & verify Purchase Orders, MAs, and Case Numbers' : 'Validate details before saving to system'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                {view === 'input' ? renderInputView() : renderReviewView()}

                {status === 'success' && (
                    <div style={{ ...styles.overlay, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1001 }}>
                        <div style={styles.successModalCard}>
                            <div style={styles.successIconBadge}>✅</div>
                            <h3 style={{ color: '#0f172a', margin: '0 0 6px 0', fontSize: '20px', fontWeight: '700' }}>
                                {syncType === 'IBS_CASE_NO' ? 'IBS Case Number Saved Successfully!' : (syncType === 'POMA DATA' ? 'MA Saved Successfully!' : 'PO Saved Successfully!')}
                            </h3>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>
                                {syncType === 'IBS_CASE_NO' ? 'The IBS Case Number has been saved to PO Header.' : 'The data has been synced to your dashboard.'}
                            </p>
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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: '#ffffff',
        width: '490px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        border: '1px solid #e2e8f0',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
    },
    header: {
        padding: '20px 24px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        flexShrink: 0
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
    },
    headerIconBadge: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        backgroundColor: '#0284c7',
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        boxShadow: '0 6px 16px rgba(2, 132, 199, 0.28)',
        color: '#ffffff'
    },
    title: {
        margin: 0,
        fontSize: '17px',
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: '-0.3px'
    },
    subtitle: {
        margin: '3px 0 0 0',
        fontSize: '12px',
        color: '#64748b'
    },
    closeBtn: {
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        fontSize: '18px',
        color: '#64748b',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
    },
    body: {
        padding: '24px',
        overflowY: 'auto',
        maxHeight: 'calc(90vh - 85px)'
    },
    tabContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        backgroundColor: '#f1f5f9',
        borderRadius: '14px',
        padding: '5px',
        marginBottom: '22px',
        gap: '4px',
        border: '1px solid #e2e8f0'
    },
    tabButton: {
        padding: '10px 8px',
        borderRadius: '10px',
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
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease'
    },
    tabButtonActive: {
        backgroundColor: '#0284c7',
        backgroundImage: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    label: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.6px'
    },
    input: {
        padding: '10px 14px',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        fontSize: '13px',
        color: '#0f172a',
        outline: 'none',
        transition: 'all 0.2s ease',
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
        borderRadius: '14px',
        maxHeight: '170px',
        overflowY: 'auto',
        zIndex: 50,
        boxShadow: '0 16px 32px -6px rgba(15, 23, 42, 0.18)'
    },
    dropdownOption: {
        padding: '10px 14px',
        fontSize: '13px',
        cursor: 'pointer',
        color: '#1e293b',
        transition: 'background-color 0.15s'
    },
    poDropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '6px',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '16px',
        maxHeight: '170px',
        overflowY: 'auto',
        zIndex: 50,
        boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.22)',
        padding: '6px'
    },
    poDropdownOption: {
        padding: '10px 14px',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        marginBottom: '4px'
    },
    poSummaryCard: {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '14px 16px'
    },
    poSummaryGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
    },
    poSummaryItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    poSummaryLabel: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase'
    },
    poSummaryValue: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#0f172a'
    },
    heroCaseCard: {
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        borderRadius: '16px',
        padding: '18px 20px',
        color: '#ffffff',
        boxShadow: '0 8px 20px rgba(2, 132, 199, 0.25)',
        marginBottom: '16px'
    },
    heroCaseHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px'
    },
    heroCaseLabel: {
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '1px',
        color: '#bae6fd',
        textTransform: 'uppercase'
    },
    statusBadge: {
        backgroundColor: '#10b981',
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: '700',
        padding: '3px 10px',
        borderRadius: '20px',
        letterSpacing: '0.5px'
    },
    heroCaseNumber: {
        fontSize: '26px',
        fontWeight: '800',
        letterSpacing: '1px',
        fontFamily: 'monospace'
    },
    reviewGridCard: {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px'
    },
    reviewGridItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '3px'
    },
    reviewGridLabel: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    reviewGridValue: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#0f172a'
    },
    errorBanner: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '13px',
        lineHeight: '1.4',
        marginBottom: '16px'
    },
    warningBanner: {
        backgroundColor: '#fffbeb',
        border: '1px solid #fde68a',
        padding: '14px 16px',
        borderRadius: '12px',
        marginBottom: '16px'
    },
    successBanner: {
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '13px',
        lineHeight: '1.4',
        marginBottom: '16px'
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '20px'
    },
    cancelBtn: {
        padding: '11px 20px',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#ffffff',
        color: '#475569',
        fontWeight: '600',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    syncBtn: {
        padding: '11px 24px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#0284c7',
        backgroundImage: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        fontWeight: '600',
        fontSize: '13px',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
        transition: 'all 0.2s ease'
    },
    successModalCard: {
        backgroundColor: '#ffffff',
        padding: '32px 28px',
        borderRadius: '20px',
        textAlign: 'center',
        width: '360px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
    },
    successIconBadge: {
        fontSize: '48px',
        marginBottom: '12px'
    }
};

export default SyncPOModal;
