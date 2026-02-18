// ============================================================
// IC NUMBER GENERATOR UTILITY
// ============================================================
// Description: Utility functions for auto-generating Inspection Call Numbers
// New Format: E[TYPE]-[MMDD][NNNN]
// Where:
// - E = Fixed prefix representing "ERC"
// - [TYPE] = Single letter (R=Raw Material, P=Process, F=Final)
// - [MMDD] = Current month and date (2 digits each, zero-padded)
// - [NNNN] = Sequential serial number (4 digits, zero-padded, resets daily)
//
// Examples: ER-01060001, EP-01060001, EF-01060001
// ============================================================

const ERC_PREFIX = 'E';

/**
 * IC Number Type Codes for different inspection types
 */
export const IC_TYPE_CODES = {
  'Raw Material': 'R',
  'Process': 'P',
  'Final': 'F'
};

/**
 * Generate IC Number format
 * @param {string} typeOfCall - Type of inspection call ('Raw Material', 'Process', 'Final')
 * @param {number} sequence - Sequence number (resets daily)
 * @param {Date} date - Date for IC number (defaults to current date)
 * @returns {string} - Formatted IC number
 */
export const generateICNumber = (typeOfCall, sequence, date = null) => {
  const typeCode = IC_TYPE_CODES[typeOfCall];
  if (!typeCode) {
    throw new Error(`Invalid type of call: ${typeOfCall}`);
  }

  const currentDate = date || new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const paddedSequence = String(sequence).padStart(4, '0');

  // Format: E + TYPE + - + MMDD + NNNN
  return `${ERC_PREFIX}${typeCode}-${month}${day}${paddedSequence}`;
};

/**
 * Parse IC Number to extract components
 * @param {string} icNumber - IC number to parse
 * @returns {Object} - Object with typeCode, month, day, and sequence
 */
export const parseICNumber = (icNumber) => {
  if (!icNumber || typeof icNumber !== 'string' || icNumber.length !== 11) {
    throw new Error(`Invalid IC number format: ${icNumber}. Expected format: E[TYPE]-[MMDD][NNNN]`);
  }

  if (!icNumber.startsWith(ERC_PREFIX)) {
    throw new Error(`IC number must start with 'E': ${icNumber}`);
  }

  if (icNumber.charAt(2) !== '-') {
    throw new Error(`IC number must have hyphen at position 3: ${icNumber}`);
  }

  const typeCode = icNumber.substring(1, 2);
  const month = icNumber.substring(3, 5);
  const day = icNumber.substring(5, 7);
  const sequence = icNumber.substring(7, 11);

  return {
    typeCode,
    month: parseInt(month),
    day: parseInt(day),
    sequence: parseInt(sequence)
  };
};

/**
 * Get next IC number for a given type
 * This function should be called from the backend API
 * Frontend can use this for display/validation purposes only
 *
 * @param {string} typeOfCall - Type of inspection call
 * @param {number} currentSequence - Current sequence number from database (resets daily)
 * @param {Date} date - Date for IC number (defaults to current date)
 * @returns {string} - Next IC number
 */
export const getNextICNumber = (typeOfCall, currentSequence = 0, date = null) => {
  const nextSequence = currentSequence + 1;
  return generateICNumber(typeOfCall, nextSequence, date);
};

/**
 * Validate IC Number format
 * @param {string} icNumber - IC number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateICNumber = (icNumber) => {
  if (!icNumber || typeof icNumber !== 'string') {
    return false;
  }

  // Regex pattern: E[TYPE]-[MMDD][NNNN]
  // Examples: ER-01060001, EP-01060001, EF-01060001
  const pattern = /^E[RPF]-\d{8}$/;
  return pattern.test(icNumber);
};

/**
 * Get type of call from IC number
 * @param {string} icNumber - IC number
 * @returns {string} - Type of call ('Raw Material', 'Process', 'Final')
 */
export const getTypeFromICNumber = (icNumber) => {
  if (!validateICNumber(icNumber)) {
    throw new Error(`Invalid IC number: ${icNumber}`);
  }

  const typeCode = icNumber.substring(1, 2);

  switch (typeCode) {
    case 'R':
      return 'Raw Material';
    case 'P':
      return 'Process';
    case 'F':
      return 'Final';
    default:
      throw new Error(`Unknown type code: ${typeCode}`);
  }
};

/**
 * Compare IC numbers (for sorting)
 * @param {string} icNumber1 - First IC number
 * @param {string} icNumber2 - Second IC number
 * @returns {number} - -1 if icNumber1 < icNumber2, 0 if equal, 1 if icNumber1 > icNumber2
 */
export const compareICNumbers = (icNumber1, icNumber2) => {
  const parsed1 = parseICNumber(icNumber1);
  const parsed2 = parseICNumber(icNumber2);

  // Compare by month first
  if (parsed1.month !== parsed2.month) {
    return parsed1.month - parsed2.month;
  }

  // Then by day
  if (parsed1.day !== parsed2.day) {
    return parsed1.day - parsed2.day;
  }

  // Then by sequence
  return parsed1.sequence - parsed2.sequence;
};

/**
 * Format IC number for display
 * @param {string} icNumber - IC number
 * @returns {string} - Formatted IC number with type label
 */
export const formatICNumberForDisplay = (icNumber) => {
  if (!validateICNumber(icNumber)) {
    return icNumber;
  }

  const type = getTypeFromICNumber(icNumber);
  return `${icNumber} (${type})`;
};

/**
 * Format IC number with additional separators for readability
 * @param {string} icNumber - IC number (e.g., ER-01060001)
 * @returns {string} - Formatted IC number with extra separators (e.g., ER-0106-0001)
 */
export const formatICNumberWithSeparators = (icNumber) => {
  if (!validateICNumber(icNumber)) {
    return icNumber;
  }

  const parsed = parseICNumber(icNumber);
  const typeCode = icNumber.substring(1, 2);
  const monthDay = icNumber.substring(3, 7);
  const sequence = icNumber.substring(7, 11);

  return `E${typeCode}-${monthDay}-${sequence}`;
};

export default {
  IC_TYPE_CODES,
  generateICNumber,
  parseICNumber,
  getNextICNumber,
  validateICNumber,
  getTypeFromICNumber,
  compareICNumbers,
  formatICNumberForDisplay,
  formatICNumberWithSeparators
};

