/**
 * Annexure Helper Functions
 * Utility functions for working with annexure data and formatting
 */

/**
 * Format date to DD/MM/YYYY
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Validate chemical analysis data
 */
export const validateChemicalData = (data) => {
  const errors = [];
  
  if (!data.date) errors.push('Date is required');
  if (!data.source) errors.push('Source is required');
  if (!data.heatNo) errors.push('Heat number is required');
  
  // Validate chemical percentages
  const validatePercentage = (value, name, min, max) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      errors.push(`${name} must be a number`);
    } else if (num < min || num > max) {
      errors.push(`${name} must be between ${min} and ${max}`);
    }
  };
  
  if (data.c) validatePercentage(data.c, 'Carbon', 0.50, 0.60);
  if (data.mn) validatePercentage(data.mn, 'Manganese', 0.80, 1.00);
  if (data.si) validatePercentage(data.si, 'Silicon', 1.50, 2.00);
  if (data.s) validatePercentage(data.s, 'Sulfur', 0, 0.03);
  if (data.p) validatePercentage(data.p, 'Phosphorus', 0, 0.03);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate empty rows for table
 */
export const generateEmptyRows = (count, startIndex = 1) => {
  return Array(count).fill(null).map((_, index) => ({
    sNo: startIndex + index,
    date: '',
    source: '',
    certNo: '',
    heatNo: '',
    coilCode: '',
    sampleNo: '',
    c: '',
    mn: '',
    si: '',
    s: '',
    p: '',
    grainSize: '',
    inclusion: '',
    hardness: '',
    decarb: '',
    freedom: '',
    accepted: '',
    sign: ''
  }));
};

/**
 * Merge data with empty rows to ensure minimum row count
 */
export const ensureMinimumRows = (data, minRows = 4) => {
  if (data.length >= minRows) return data;
  
  const emptyRowsNeeded = minRows - data.length;
  const emptyRows = generateEmptyRows(emptyRowsNeeded, data.length + 1);
  
  return [...data, ...emptyRows];
};

/**
 * Export table data to CSV
 */
export const exportToCSV = (data, filename = 'annexure-data.csv') => {
  if (!data || data.length === 0) return;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Import CSV data
 */
export const importFromCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            return obj;
          });
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Calculate statistics for chemical analysis
 */
export const calculateStatistics = (data) => {
  if (!data || data.length === 0) return null;
  
  const stats = {
    totalSamples: data.length,
    accepted: data.filter(d => d.accepted === 'Accepted').length,
    rejected: data.filter(d => d.accepted === 'Rejected').length,
    averages: {}
  };
  
  // Calculate averages for chemical elements
  const elements = ['c', 'mn', 'si', 's', 'p'];
  elements.forEach(element => {
    const values = data
      .map(d => parseFloat(d[element]))
      .filter(v => !isNaN(v));
    
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      stats.averages[element] = (sum / values.length).toFixed(3);
    }
  });
  
  return stats;
};

/**
 * Format number with specified decimal places
 */
export const formatNumber = (value, decimals = 2) => {
  if (!value || isNaN(value)) return '';
  return parseFloat(value).toFixed(decimals);
};

/**
 * Check if value is within acceptable range
 */
export const isInRange = (value, min, max) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
};

/**
 * Get status color based on acceptance
 */
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
      return '#10b981'; // green
    case 'rejected':
      return '#ef4444'; // red
    case 'pending':
      return '#f59e0b'; // orange
    default:
      return '#64748b'; // gray
  }
};

