// Stage mapping for display
export const stageReverseMapping = {
  'RM': 'Raw Material',
  'Process Inspection': 'Process Material',
  'Final': 'Final'
};

/**
 * Validates that all selected calls have the same stage
 * @param {Array} selectedCalls - Array of call objects with stage property
 * @returns {Object} - { isValid: boolean, errorMessage: string }
 */
export const validateStageSelection = (selectedCalls) => {
  if (!selectedCalls || selectedCalls.length === 0) {
    return { isValid: true, errorMessage: '' };
  }

  // Check if all selected calls have the same stage
  const firstStage = selectedCalls[0].stage;
  const hasDifferentStages = selectedCalls.some(call => call.stage !== firstStage);

  if (hasDifferentStages) {
    // Find the different stages for error message
    const stages = [...new Set(selectedCalls.map(call => call.stage))];
    const stageNames = stages.map(stage => stageReverseMapping[stage] || stage);
    
    return {
      isValid: false,
      errorMessage: `Cannot select different stages: ${stageNames.join(', ')}. Select only one stage at a time.`
    };
  }

  return { isValid: true, errorMessage: '' };
};

/**
 * Creates a selection change handler that validates stage consistency
 * @param {Array} filteredCalls - All available calls after filtering
 * @param {Array} selectedRows - Currently selected row IDs
 * @param {Function} setSelectedRows - Function to update selected rows
 * @param {Function} setSelectionError - Function to set error message
 * @returns {Function} - Handler function for selection changes
 */
export const createStageValidationHandler = (
  filteredCalls,
  selectedRows,
  setSelectedRows,
  setSelectionError
) => {
  return (newSelectedRows) => {
    // If deselecting (new selection is smaller), allow it and clear errors
    if (newSelectedRows.length < selectedRows.length) {
      setSelectedRows(newSelectedRows);
      setSelectionError('');
      return;
    }

    // Get all calls that will be selected
    const allSelectedCalls = filteredCalls.filter(call => newSelectedRows.includes(call.id));
    
    // If no calls selected, allow it and clear errors
    if (allSelectedCalls.length === 0) {
      setSelectedRows(newSelectedRows);
      setSelectionError('');
      return;
    }
    
    // Validate stage consistency - check if all selected calls have the same stage
    const validation = validateStageSelection(allSelectedCalls);
    
    if (!validation.isValid) {
      // Show error notification for different stages
      setSelectionError(validation.errorMessage);
      // Clear error after 5 seconds
      setTimeout(() => setSelectionError(''), 5000);
      // IMPORTANT: Don't update selection - keep the previous valid selection
      // This ensures the UI checkbox state (controlled by selectedRows) matches reality
      // The checkbox will remain unchecked because selectedRows doesn't include the invalid selection
      return;
    }
    
    // Validation passed - all selected calls have the same stage
    // Update selection and clear any previous errors immediately
    // This works correctly even after a previous error, as long as the new selection is valid
    setSelectedRows(newSelectedRows);
    setSelectionError('');
  };
};

