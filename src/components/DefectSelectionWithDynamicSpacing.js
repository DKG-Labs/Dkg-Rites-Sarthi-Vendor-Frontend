import React, { useState } from 'react';

/**
 * DefectSelectionWithDynamicSpacing Component
 * 
 * Renders a list of defect types with checkboxes and labels.
 * The spacing between checkbox and label changes dynamically:
 * - Small gap when the defect type matches the selected one
 * - Large gap when it doesn't match
 * 
 * @param {Array} defectTypes - List of defect type strings
 * @param {Object} selectedDefects - Object mapping defect types to their selection state
 * @param {Function} onDefectChange - Callback when a defect is toggled
 * @param {Function} onCountChange - Optional callback for count changes
 * @param {Object} defectCounts - Optional object mapping defect types to counts
 */
const DefectSelectionWithDynamicSpacing = ({
  defectTypes = [],
  selectedDefects = {},
  onDefectChange,
  onCountChange,
  defectCounts = {}
}) => {
  // Track the currently selected/active defect type
  const [selectedDefectType, setSelectedDefectType] = useState(null);

  const handleDefectToggle = (defectType) => {
    const isCurrentlySelected = selectedDefects[defectType];
    
    // Update the selected defect type for spacing logic
    if (!isCurrentlySelected) {
      // When selecting a new defect, set it as the active one
      setSelectedDefectType(defectType);
    } else {
      // When deselecting, clear the active defect if it was the one being deselected
      if (selectedDefectType === defectType) {
        setSelectedDefectType(null);
      }
    }
    
    // Call the parent's change handler
    if (onDefectChange) {
      onDefectChange(defectType);
    }
  };

  return (
    <>
      <style>{defectSpacingStyles}</style>
      <div className="defect-selection-container">
        {defectTypes.map((defectType) => {
          const isSelected = selectedDefects[defectType] || false;
          const isMatchingDefectType = selectedDefectType === defectType;
          const count = defectCounts[defectType] || 0;

          return (
            <div
              key={defectType}
              className={`defect-item ${isMatchingDefectType ? 'defect-item--matching' : 'defect-item--non-matching'}`}
            >
              <div className="defect-checkbox-wrapper">
                <input
                  type="checkbox"
                  id={`defect-${defectType}`}
                  checked={isSelected}
                  onChange={() => handleDefectToggle(defectType)}
                  className="defect-checkbox"
                />
                <label
                  htmlFor={`defect-${defectType}`}
                  className="defect-label"
                >
                  {defectType}
                </label>
              </div>
              
              {isSelected && onCountChange && (
                <input
                  type="number"
                  className="defect-count-input"
                  value={count}
                  onChange={(e) => onCountChange(defectType, e.target.value)}
                  placeholder={`${defectType} Count`}
                  min="0"
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

/**
 * CSS Styles with CSS Variables for Easy Tuning
 * 
 * Spacing Logic:
 * - When isMatchingDefectType is true: Uses --defect-gap-matching (small gap, e.g., 8px)
 * - When isMatchingDefectType is false: Uses --defect-gap-non-matching (large gap, e.g., 24px)
 * 
 * The gap is applied via the `gap` property on the flex container,
 * creating visual feedback that highlights the selected defect type.
 */
const defectSpacingStyles = `
  :root {
    /* Spacing Variables - Easy to tune */
    --defect-gap-matching: 8px;        /* Small gap when defect matches selected */
    --defect-gap-non-matching: 24px;   /* Large gap when defect doesn't match */
    
    /* Layout Variables */
    --defect-item-padding: 12px 16px;
    --defect-item-border-radius: 8px;
    --defect-item-transition: all 0.3s ease;
    
    /* Checkbox Variables */
    --defect-checkbox-size: 20px;
    --defect-checkbox-accent: #16a34a;
    
    /* Label Variables */
    --defect-label-font-size: 14px;
    --defect-label-font-weight: 500;
    --defect-label-color: #374151;
    
    /* Count Input Variables */
    --defect-count-input-width: 120px;
    --defect-count-input-padding: 8px 12px;
  }

  .defect-selection-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .defect-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--defect-item-padding);
    border-radius: var(--defect-item-border-radius);
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    transition: var(--defect-item-transition);
  }

  .defect-item:hover {
    border-color: #d1d5db;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .defect-checkbox-wrapper {
    display: flex;
    align-items: center;
    flex: 1;
    /* Dynamic gap based on matching state */
    gap: var(--defect-gap-non-matching);
    transition: gap 0.3s ease;
  }

  /* When defect type matches selected, reduce gap */
  .defect-item--matching .defect-checkbox-wrapper {
    gap: var(--defect-gap-matching);
  }

  /* When defect type doesn't match, use larger gap */
  .defect-item--non-matching .defect-checkbox-wrapper {
    gap: var(--defect-gap-non-matching);
  }

  .defect-checkbox {
    width: var(--defect-checkbox-size);
    height: var(--defect-checkbox-size);
    cursor: pointer;
    accent-color: var(--defect-checkbox-accent);
    flex-shrink: 0;
  }

  .defect-label {
    font-size: var(--defect-label-font-size);
    font-weight: var(--defect-label-font-weight);
    color: var(--defect-label-color);
    cursor: pointer;
    user-select: none;
    flex: 1;
    transition: color 0.2s ease;
  }

  .defect-label:hover {
    color: #1f2937;
  }

  .defect-count-input {
    width: var(--defect-count-input-width);
    padding: var(--defect-count-input-padding);
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .defect-count-input:focus {
    outline: none;
    border-color: var(--defect-checkbox-accent);
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    :root {
      --defect-gap-matching: 6px;
      --defect-gap-non-matching: 20px;
      --defect-item-padding: 10px 12px;
    }

    .defect-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .defect-checkbox-wrapper {
      width: 100%;
    }

    .defect-count-input {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    :root {
      --defect-gap-matching: 4px;
      --defect-gap-non-matching: 16px;
      --defect-label-font-size: 13px;
    }
  }
`;

export default DefectSelectionWithDynamicSpacing;

