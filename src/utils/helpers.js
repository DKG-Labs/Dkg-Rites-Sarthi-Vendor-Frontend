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
  return `${day}/${month}/${year}`;
};
