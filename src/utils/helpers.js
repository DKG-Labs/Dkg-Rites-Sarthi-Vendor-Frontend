import { PRODUCT_TYPE_DISPLAY_NAMES } from '../data/mockData';

export const getProductTypeDisplayName = (productType) => {
  return PRODUCT_TYPE_DISPLAY_NAMES[productType] || productType;
};

export const getProductTypeInternalValue = (displayName) => {
  const entry = Object.entries(PRODUCT_TYPE_DISPLAY_NAMES).find(([key, value]) => value === displayName);
  return entry ? entry[0] : displayName;
};

export const calculateDaysLeft = (dueDate) => {
  const today = new Date('2025-11-14');
  const due = new Date(dueDate);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  return diff;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Extracts and formats Call Date (DD-MM-YYYY) from Call No using MMDDYY nomenclature.
 * Example: ER-0722260005 -> MMDDYY = 07 (July), 22 (Day), 26 (Year 2026) -> 22-07-2026
 * Example: W/EP-0721260003/DKV -> MMDDYY = 07 (July), 21 (Day), 26 (Year 2026) -> 21-07-2026
 */
export const getCallDateFromCallNo = (callNo, fallbackDate) => {
  if (callNo && typeof callNo === 'string') {
    const match = callNo.match(/(?:[A-Z0-9/]+-)?(\d{2})(\d{2})(\d{2})\d*/);
    if (match) {
      const mm = parseInt(match[1], 10);
      const dd = parseInt(match[2], 10);
      const yy = parseInt(match[3], 10);

      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
        const fullYear = 2000 + yy;
        const mmStr = String(mm).padStart(2, '0');
        const ddStr = String(dd).padStart(2, '0');
        return `${ddStr}-${mmStr}-${fullYear}`;
      }
    }
  }

  return fallbackDate ? formatDate(fallbackDate) : '-';
};
