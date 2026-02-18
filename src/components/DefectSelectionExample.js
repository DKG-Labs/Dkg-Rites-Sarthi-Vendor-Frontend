import React, { useState } from 'react';
import DefectSelectionWithDynamicSpacing from './DefectSelectionWithDynamicSpacing';

/**
 * Example Usage of DefectSelectionWithDynamicSpacing Component
 * 
 * This demonstrates how to use the component with dynamic spacing
 * based on the selected defect type.
 */
const DefectSelectionExample = () => {
  // Sample defect types
  const defectTypes = [
    'Distortion',
    'Twist',
    'Kink',
    'Pitting',
    'Seams',
    'Laps',
    'Cracks',
    'Scratches',
    'Scale',
    'Fins',
    'Other',
    'No Defect'
  ];

  // State to track selected defects
  const [selectedDefects, setSelectedDefects] = useState({});
  
  // State to track defect counts
  const [defectCounts, setDefectCounts] = useState({});

  // Handle defect toggle
  const handleDefectChange = (defectType) => {
    setSelectedDefects(prev => ({
      ...prev,
      [defectType]: !prev[defectType]
    }));
    
    // Initialize count when selecting
    if (!selectedDefects[defectType]) {
      setDefectCounts(prev => ({
        ...prev,
        [defectType]: prev[defectType] || 0
      }));
    }
  };

  // Handle count change
  const handleCountChange = (defectType, count) => {
    setDefectCounts(prev => ({
      ...prev,
      [defectType]: parseInt(count, 10) || 0
    }));
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px', color: '#1f2937' }}>
        Defect Selection with Dynamic Spacing
      </h2>
      
      <div style={{ 
        marginBottom: '16px', 
        padding: '12px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <strong>How it works:</strong> When you select a defect type, 
        the spacing between the checkbox and label reduces for that item 
        (small gap), while other items maintain a larger gap. This provides 
        visual feedback highlighting the selected defect.
      </div>

      <DefectSelectionWithDynamicSpacing
        defectTypes={defectTypes}
        selectedDefects={selectedDefects}
        onDefectChange={handleDefectChange}
        onCountChange={handleCountChange}
        defectCounts={defectCounts}
      />

      {/* Debug info (optional) */}
      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <strong>Selected Defects:</strong>{' '}
        {Object.entries(selectedDefects)
          .filter(([_, selected]) => selected)
          .map(([defect]) => defect)
          .join(', ') || 'None'}
      </div>
    </div>
  );
};

export default DefectSelectionExample;

