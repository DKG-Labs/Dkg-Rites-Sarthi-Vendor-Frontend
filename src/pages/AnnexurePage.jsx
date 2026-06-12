import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import InclusionRatingAnnexure from '../components/annexures/InclusionRatingAnnexure';
import ApplicationDeflectionAnnexure from '../components/annexures/ApplicationDeflectionAnnexure';
import { captureElementToPdfBlob } from '../utils/annexurePdfUtils';
import { ANNEXURE_LIST } from '../data/annexureList';
import { fetchAnnexureData } from '../data/annexureData';
import { annexureService } from '../services/annexureService';
import AnnexureLoader from '../components/annexures/AnnexureLoader';
import { getAnnexureErrorMessage } from '../utils/annexureErrorHandlers';
import './AnnexurePage.css';

/**
 * Annexure Page - Main page to view all annexures
 * Displays list of available annexures and allows viewing them
 */

// Use the centralized list outside to avoid re-renders
const annexureList = ANNEXURE_LIST.map(a => {
  if (a.id === 'inclusion-rating') return { ...a, component: InclusionRatingAnnexure };
  if (a.id === 'application-deflection') return { ...a, component: ApplicationDeflectionAnnexure };
  return a;
});

const AnnexurePage = ({
  onBack,
  selectedCall,
  hiddenMode = false,
  triggerAutoDownloadAll = false,
  onAllGenerated = null,
  onGenerationError = null
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type');

  const [selectedAnnexure, setSelectedAnnexure] = useState(null);
  const [annexureData, setAnnexureData] = useState({});
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const annexureRef = useRef(null);
  const lastLoadedType = useRef(null);
  const fetchingRef = useRef(null);

  const [isGeneratingAllPdf, setIsGeneratingAllPdf] = useState(false);
  const allAnnexuresRef = useRef(null);

  // Filtering Logic based on Call Prefix
  const getFilteredAnnexures = () => {
    if (!selectedCall || !selectedCall.call_no) return annexureList;

    const prefix = selectedCall.call_no.substring(0, 2).toUpperCase();

    if (prefix === 'ER') {
      // ER Prefix (Raw Material): ITP, Annexure-I, Annexure-II
      return annexureList.filter(a =>
        a.id === 'inspection-test-plan' ||
        a.code === 'Annexure-I' ||
        a.code === 'Annexure-II'
      );
    }

    if (prefix === 'EF') {
      // EF Prefix (Final): ITP, III, VI, VII, VIII, IX, X, XI, XV
      const finalCodes = ['Annexure-III', 'Annexure-VI', 'Annexure-VII', 'Annexure-VIII', 'Annexure-IX', 'Annexure-X', 'Annexure-XI', 'Annexure-XV'];
      return annexureList.filter(a =>
        a.id === 'inspection-test-plan' ||
        finalCodes.includes(a.code)
      );
    }

    if (prefix === 'EP') {
      // EP Prefix (Process Inspection): Process Inspection Register (F/ERC-01)
      return annexureList.filter(a => a.id === 'process-inspection');
    }

    // Fallback: show all
    return annexureList;
  };

  const filteredAnnexures = getFilteredAnnexures();

  useEffect(() => {
    if (triggerAutoDownloadAll) {
      handleDownloadAllAnnexures();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAutoDownloadAll]);

  const fetchDataForAnnexure = async (annexureId) => {
    if (annexureId === 'chemical-analysis' && selectedCall?.call_no) {
      return await annexureService.getChemicalAnalysis(selectedCall.call_no);
    } else if (annexureId === 'dimensional-check' && selectedCall?.call_no) {
      return await annexureService.getDimensionalCheck(selectedCall.call_no);
    } else if (annexureId === 'final-chemical-analysis' && selectedCall?.call_no) {
      const response = await annexureService.getFinalChemicalAnalysis(selectedCall.call_no);
      return response?.responseData || response || [];
    } else if (annexureId === 'hardness-test' && selectedCall?.call_no) {
      return await annexureService.getFinalHardnessTest(selectedCall.call_no);
    } else if (annexureId === 'toe-load-test' && selectedCall?.call_no) {
      return await annexureService.getFinalToeLoadTest(selectedCall.call_no);
    } else if (annexureId === 'weight-test' && selectedCall?.call_no) {
      return await annexureService.getFinalWeightTest(selectedCall.call_no);
    } else if (annexureId === 'dimension-test' && selectedCall?.call_no) {
      const response = await annexureService.getFinalDimensionalInspection(selectedCall.call_no);
      return response?.responseData || response || [];
    } else if (annexureId === 'final-inspection' && selectedCall?.call_no) {
      return await annexureService.getDimensionalCheck(selectedCall.call_no);
    } else if (annexureId === 'inclusion-rating' && selectedCall?.call_no) {
      const response = await annexureService.getFinalInclusion(selectedCall.call_no);
      return response?.responseData || response || [];
    } else if (annexureId === 'application-deflection' && selectedCall?.call_no) {
      const response = await annexureService.getFinalApplicationDeflection(selectedCall.call_no);
      return response?.responseData || response || [];
    } else if (annexureId === 'process-inspection' && selectedCall?.call_no) {
      const selectedDate = searchParams.get('date');
      const selectedShift = searchParams.get('shift');
      const response = await annexureService.getProcessInspectionRegister(selectedCall.call_no, selectedDate, selectedShift);
      return response || [];
    } else {
      return await fetchAnnexureData(annexureId);
    }
  };

  // Single Source of Truth: URL Logic
  useEffect(() => {
    const syncStateWithUrl = async () => {
      // CASE 1: Back to list
      if (!typeParam) {
        if (selectedAnnexure) {
          setSelectedAnnexure(null);
          lastLoadedType.current = null;
          fetchingRef.current = null;
        }
        return;
      }

      // CASE 2: New Annexure Selection or Page Load
      const currentAnnexureId = selectedAnnexure?.id;
      const isNewType = typeParam && (currentAnnexureId !== typeParam || lastLoadedType.current !== typeParam);
      
      if (isNewType) {
        // PREVENT DOUBLE FETCH (Strict Mode or Rapid Clicks)
        if (fetchingRef.current === typeParam) return;

        const annexure = annexureList.find(a => a.id === typeParam);
        if (!annexure) {
          setSelectedAnnexure(null);
          return;
        }

        setSelectedAnnexure(annexure);
        
        // Check if data already exists to avoid refetching
        if (annexureData[typeParam] && lastLoadedType.current === typeParam) {
           return;
        }

        setLoading(true);
        fetchingRef.current = typeParam;
        lastLoadedType.current = typeParam;
        
        console.log(`[Annexure] Fetching data for ${typeParam} (Call: ${selectedCall?.call_no})`);
        
        try {
          const data = await fetchDataForAnnexure(typeParam);
          setAnnexureData(prev => ({ ...prev, [typeParam]: data }));
        } catch (error) {
          const friendlyMessage = getAnnexureErrorMessage(error);
          showNotification(friendlyMessage, 'error');
          setAnnexureData(prev => ({ ...prev, [typeParam]: [] }));
        } finally {
          setLoading(false);
          fetchingRef.current = null;
        }
      }
    };

    syncStateWithUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeParam, selectedCall]); // Only re-run if URL param or call changes

  // Handlers now only update the URL
  const handleSelectAnnexure = (annexure) => {
    setSearchParams({ type: annexure.id });
  };

  const handleBackToList = () => {
    setSearchParams({});
  };

  const showNotification = (message, type = 'success') => {
    if (hiddenMode) {
      console.log(`[Annexure Auto-Generate] [${type}] ${message}`);
      return;
    }
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleExportPDF = async () => {
    if (!annexureRef.current || !selectedAnnexure) {
      showNotification('Unable to generate PDF. Please try again.', 'error');
      return;
    }

    setPdfGenerating(true);

    try {
      const annexureElement = annexureRef.current;
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const filename = `${selectedAnnexure.code}_${selectedCall?.call_no || 'report'}_${dateStr}.pdf`;

      const pdfBlob = await captureElementToPdfBlob(annexureElement, {
        filename,
        orientation: selectedAnnexure.orientation || 'landscape'
      });

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Open automatically in new tab
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      showNotification('PDF exported successfully!');
    } catch (error) {
      const friendlyMessage = getAnnexureErrorMessage(error);
      showNotification(friendlyMessage, 'error');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadAllAnnexures = async () => {
    setPdfGenerating(true);
    showNotification('Preparing all annexures...', 'info');

    try {
      // 1. Identify all filtered annexures that have components
      const annexuresToFetch = filteredAnnexures.filter(a => a.component);
      
      // 2. Fetch data for any annexure that doesn't have data loaded yet
      const newData = { ...annexureData };
      let updated = false;
      
      for (const annexure of annexuresToFetch) {
        if (!newData[annexure.id]) {
          try {
            console.log(`[Annexure] Prefetching data for ${annexure.id}`);
            const data = await fetchDataForAnnexure(annexure.id);
            newData[annexure.id] = data;
          } catch (err) {
            console.warn(`[Annexure] Failed to prefetch data for ${annexure.id}:`, err);
            newData[annexure.id] = []; // fallback to empty array
          }
          updated = true;
        }
      }
      
      if (updated) {
        setAnnexureData(newData);
      }

      // 3. Trigger rendering of the hidden components
      setIsGeneratingAllPdf(true);
    } catch (error) {
      console.error('Error prefetching annexures:', error);
      showNotification('Failed to fetch data for all annexures.', 'error');
      setPdfGenerating(false);
      if (onGenerationError) {
        onGenerationError(error);
      }
    }
  };

  useEffect(() => {
    if (!isGeneratingAllPdf) return;

    const captureAll = async () => {
      try {
        // Wait a small delay to ensure all images and layouts are fully rendered in the DOM
        await new Promise(resolve => setTimeout(resolve, 800));

        if (!allAnnexuresRef.current) {
          throw new Error('Capture target not found');
        }

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const filename = `Annexures_${selectedCall?.call_no || 'report'}_${dateStr}.pdf`;

        // Capture the hidden container using landscape orientation as default
        const pdfBlob = await captureElementToPdfBlob(allAnnexuresRef.current, {
          filename,
          orientation: 'landscape'
        });

        if (onAllGenerated) {
          onAllGenerated(pdfBlob);
        } else {
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Open automatically in new tab
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showNotification('All annexures downloaded in a single PDF!');
        }
      } catch (error) {
        console.error('Error generating combined PDF:', error);
        if (onGenerationError) {
          onGenerationError(error);
        } else {
          showNotification('Failed to generate combined PDF.', 'error');
        }
      } finally {
        setIsGeneratingAllPdf(false);
        setPdfGenerating(false);
      }
    };

    captureAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeneratingAllPdf, selectedCall]);


  // If hiddenMode is active, only render the hidden capture container
  if (hiddenMode) {
    return (
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1600px' }}>
        {isGeneratingAllPdf && (
          <div ref={allAnnexuresRef}>
            {filteredAnnexures.map((annexure) => {
              const AnnexureComponent = annexure.component;
              if (!AnnexureComponent) return null;
              return (
                <div key={annexure.id} className="annexure-pdf-wrapper">
                  <AnnexureComponent
                    data={annexureData[annexure.id] || []}
                    selectedCall={selectedCall}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // If an annexure is selected, show it
  if (selectedAnnexure) {
    const AnnexureComponent = selectedAnnexure.component;

    if (!AnnexureComponent) {
      return (
        <div className="annexure-page">
          <div className="annexure-header-bar">
            <button className="btn-back" onClick={handleBackToList}>
              ← Back to Annexure List
            </button>
          </div>
          <div className="annexure-not-available">
            <h2>Annexure Not Available</h2>
            <p>This annexure is not yet implemented.</p>
            <button className="btn-primary" onClick={handleBackToList}>
              Back to List
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="annexure-page">
        {notification && (
          <div className={`notification notification--${notification.type}`}>
            {notification.message}
          </div>
        )}

        {pdfGenerating && (
          <AnnexureLoader 
            title="Generating PDF" 
            subtitle="Preparing high-quality certificate export..." 
          />
        )}

        <div className="annexure-view-header no-print">
          <div className="header-section-left">
            <button className="btn-nav-premium secondary" onClick={handleBackToList}>
              <svg className="btn-icon-svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to Reports</span>
            </button>
          </div>

          <div className="view-title-group">
            <span className="view-badge">{selectedAnnexure.code}</span>
            <h2 className="view-title">{selectedAnnexure.title}</h2>
          </div>

          <div className="header-actions">
            <button className="btn-action-premium" onClick={handleExportPDF} disabled={pdfGenerating}>
              {pdfGenerating ? (
                <span className="loading-dots">Generating...</span>
              ) : (
                <>
                  <svg className="btn-icon-svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <span>Export PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="annexure-content" ref={annexureRef}>
          {loading ? (
            <AnnexureLoader 
              title="Loading Report" 
              subtitle="Fetching secure IC data from Sarthi..." 
              fullScreen={false}
            />
          ) : (
            <AnnexureComponent
              data={annexureData[selectedAnnexure.id] || []}
              selectedCall={selectedCall}
            />
          )}
        </div>
      </div>
    );
  }



  // Show list of annexures
  return (
    <div className="annexure-page">
      {notification && (
        <div className={`notification notification--${notification.type}`}>
          {notification.message}
        </div>
      )}

      {pdfGenerating && (
        <AnnexureLoader 
          title={isGeneratingAllPdf ? "Generating Combined PDF" : "Generating PDF"} 
          subtitle="Preparing high-quality certificate export..." 
        />
      )}

      <div className="annexure-page-header">
        <div className="header-top-row">
          <div className="annexure-title-block">
            <h1 className="annexure-page-title">Annexures</h1>
          </div>

          <div className="annexure-header-actions no-print">
            <button 
              className="btn-nav-premium primary" 
              onClick={handleDownloadAllAnnexures} 
              disabled={pdfGenerating}
            >
              {pdfGenerating ? (
                <span className="loading-dots">Preparing...</span>
              ) : (
                <>
                  <svg className="btn-icon-svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download Annexures</span>
                </>
              )}
            </button>
            <button className="btn-nav-premium secondary" onClick={onBack}>
              <svg className="btn-icon-svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to Completed Calls</span>
            </button>
          </div>
        </div>

        {selectedCall && (
          <div className="modern-info-bar">
            <div className="info-card">
              <span className="info-label">VENDOR NAME</span>
              <span className="info-value">{selectedCall.vendorName || selectedCall.vendor_name || localStorage.getItem('vendorName') || localStorage.getItem('userName') || 'N/A'}</span>
            </div>
            <div className="info-card">
              <span className="info-label">CALL NO</span>
              <span className="info-value highlight">{selectedCall.call_no}</span>
            </div>
            <div className="info-card">
              <span className="info-label">DATE</span>
              <span className="info-value">
                {selectedCall.icIssuedDate 
                  ? new Date(selectedCall.icIssuedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                  : '15/04/2026'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="annexure-grid">
        {filteredAnnexures.map((annexure) => (
          <div 
            key={annexure.id} 
            className="modern-annexure-card"
            onClick={() => handleSelectAnnexure(annexure)}
          >
            <div className={`icon-circle ${annexure.category}`}>
              {annexure.icon}
            </div>
            <div className="card-content">
              <h3 className="annexure-card-title">{annexure.cardTitle}</h3>
              <p className="annexure-card-code">{annexure.code}</p>
            </div>
            <button className="btn-view-annexure">View Report</button>
          </div>
        ))}
      </div>

      {/* Hidden container for exporting all annexures */}
      {isGeneratingAllPdf && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1600px' }} ref={allAnnexuresRef}>
          {filteredAnnexures.map((annexure) => {
            const AnnexureComponent = annexure.component;
            if (!AnnexureComponent) return null;
            return (
              <div key={annexure.id} className="annexure-pdf-wrapper">
                <AnnexureComponent
                  data={annexureData[annexure.id] || []}
                  selectedCall={selectedCall}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnnexurePage;
