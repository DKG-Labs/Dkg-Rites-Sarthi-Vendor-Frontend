/**
 * Sample Annexure Data
 * This file contains sample data structures for different annexures
 * In production, this data would come from API/Database
 */

export const SAMPLE_CHEMICAL_ANALYSIS_DATA = [
  {
    sNo: 1,
    date: '15/01/2025',
    source: 'Steel Corp Ltd.',
    certNo: 'CERT-2025-001',
    heatNo: 'HEAT-A123',
    coilCode: 'COIL-001',
    sampleNo: 'SMP-001',
    c: '0.55',
    mn: '0.92',
    si: '1.75',
    s: '0.025',
    p: '0.028',
    grainSize: '7',
    inclusion: '1.5',
    hardness: '285',
    decarb: '0.00',
    freedom: 'OK',
    accepted: 'Accepted',
    sign: ''
  },
  {
    sNo: 2,
    date: '15/01/2025',
    source: 'Steel Corp Ltd.',
    certNo: 'CERT-2025-002',
    heatNo: 'HEAT-A124',
    coilCode: 'COIL-002',
    sampleNo: 'SMP-002',
    c: '0.58',
    mn: '0.95',
    si: '1.80',
    s: '0.022',
    p: '0.025',
    grainSize: '7',
    inclusion: '1.8',
    hardness: '290',
    decarb: '0.00',
    freedom: 'OK',
    accepted: 'Accepted',
    sign: '',
    note: 'Stage 2C attached'
  },
  {
    sNo: 3,
    date: '16/01/2025',
    source: 'Metal Industries',
    certNo: 'CERT-2025-003',
    heatNo: 'HEAT-B201',
    coilCode: 'COIL-003',
    sampleNo: 'SMP-003',
    c: '0.52',
    mn: '0.88',
    si: '1.65',
    s: '0.028',
    p: '0.029',
    grainSize: '8',
    inclusion: '1.2',
    hardness: '280',
    decarb: '0.00',
    freedom: 'OK',
    accepted: 'Accepted',
    sign: ''
  },
  {
    sNo: 4,
    date: '16/01/2025',
    source: 'Metal Industries',
    certNo: 'CERT-2025-004',
    heatNo: 'HEAT-B202',
    coilCode: 'COIL-004',
    sampleNo: 'SMP-004',
    c: '0.56',
    mn: '0.91',
    si: '1.72',
    s: '0.024',
    p: '0.027',
    grainSize: '7',
    inclusion: '1.6',
    hardness: '288',
    decarb: '0.00',
    freedom: 'OK',
    accepted: 'Accepted',
    sign: ''
  }
];

// Template for empty row
export const EMPTY_CHEMICAL_ANALYSIS_ROW = {
  sNo: '',
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
};

// Function to generate empty rows
export const generateEmptyRows = (count) => {
  return Array(count).fill(null).map((_, index) => ({
    ...EMPTY_CHEMICAL_ANALYSIS_ROW,
    sNo: index + 1
  }));
};

// Sample data for Dimension Annexure
export const SAMPLE_DIMENSION_DATA = [
  {
    sNo: 2,
    date: '15/01/2025',
    source: 'Steel Corp Ltd.',
    certNo: 'CERT-2025-001',
    heatNo: 'HEAT-A123',
    coilCode: 'COIL-001',
    quantity: '500 kg',
    samples: [
      { sampleNo: 1, dia6: '12.5', dia7: '13.2', dia11: '14.8', dia16: '15.3' },
      { sampleNo: 2, dia6: '12.6', dia7: '13.1', dia11: '14.9', dia16: '15.2' },
      { sampleNo: 3, dia6: '12.4', dia7: '13.3', dia11: '14.7', dia16: '15.4' },
      { sampleNo: 4, dia6: '12.5', dia7: '13.2', dia11: '14.8', dia16: '15.3' },
      { sampleNo: 5, dia6: '12.6', dia7: '13.1', dia11: '14.9', dia16: '15.2' }
    ],
    accepted: 'Accepted',
    sign: ''
  }
];

// Sample data for Final Inspection Annexure
export const SAMPLE_FINAL_INSPECTION_DATA = [
  { sNo: 1, parameter: 'Length', mkIII: '107.5', mkV: '110', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 2, parameter: 'Dimension', mkIII: '54', mkV: '54', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 3, parameter: 'Dimension', mkIII: '15', mkV: '15', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 4, parameter: 'Dimension', mkIII: '42.5', mkV: '42.5', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 5, parameter: 'Dimension', mkIII: '39.5', mkV: '41.8', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 6, parameter: 'Width', mkIII: '33.5/48.7', mkV: '34.7/48.7', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 7, parameter: 'Height 1', mkIII: '68', mkV: '68', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 8, parameter: 'Height 2', mkIII: '48', mkV: '50.5', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 9, parameter: 'Height 3', mkIII: '21.2', mkV: '21.2', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 10, parameter: 'Gap', mkIII: '4.9', mkV: '4.9', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 11, parameter: 'Straight length', mkIII: '75', mkV: '82', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 12, parameter: 'Pressing size', mkIII: '35 ± 2*\n12 (-1/-2)*', mkV: '35 ± 2*\n12 (-1/-2)*', samplesPassed: '50', samplesFailed: '0' },
  { sNo: 13, parameter: 'Diameter', mkIII: '20.64 (+0.2/-0.17)*', mkV: '23(-0.23/-0.19)*\n20.64 (+0.2/-0.15)*', samplesPassed: '50', samplesFailed: '0' }
];

// Sample data for Final Chemical Analysis Annexure
export const SAMPLE_FINAL_CHEMICAL_ANALYSIS_DATA = [
  { sNo: 1, castHeatNo: '', colourCode: '', lotNo: '', quantityEa: '', sampleSize: '', c: '', mn: '', si: '', s: '', p: '', remark: '', acceptedOrRejected: '', signOfSupervisor: '' },
  { sNo: 2, castHeatNo: '', colourCode: '', lotNo: '', quantityEa: '', sampleSize: '', c: '', mn: '', si: '', s: '', p: '', remark: '', acceptedOrRejected: '', signOfSupervisor: '' },
  { sNo: 3, castHeatNo: '', colourCode: '', lotNo: '', quantityEa: '', sampleSize: '', c: '', mn: '', si: '', s: '', p: '', remark: '', acceptedOrRejected: '', signOfSupervisor: '' }
];

// Sample data for Inclusion Rating Annexure
export const SAMPLE_INCLUSION_RATING_DATA = [
  {
    sNo: '',
    castHeatNo: '',
    colourCode: '',
    lotNo: '',
    quantityInNos: '',
    sampleSize: '',
    sampleNos: '',
    inclusionRating: [
      { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
      { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
      { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
      { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
      { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
      { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
      { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } },
      { a: { thin: '', thick: '' }, b: { thin: '', thick: '' }, c: { thin: '', thick: '' }, d: { thin: '', thick: '' } }
    ],
    depthOfDecarb: '',
    microstructure: '',
    freePearlite: '',
    remarks: '',
    signOfSupervisor: ''
  }
];

// Sample data for other annexures (to be implemented)
export const SAMPLE_HARDNESS_TEST_DATA = [];
export const SAMPLE_VISUAL_INSPECTION_DATA = [];

// API simulation function
export const fetchAnnexureData = async (annexureId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  switch (annexureId) {
    case 'chemical-analysis':
      return SAMPLE_CHEMICAL_ANALYSIS_DATA;
    case 'dimensional-check':
      return SAMPLE_DIMENSION_DATA;
    case 'final-inspection':
      return SAMPLE_FINAL_INSPECTION_DATA;
    case 'final-chemical-analysis':
      return SAMPLE_FINAL_CHEMICAL_ANALYSIS_DATA;
    case 'inclusion-rating':
      return SAMPLE_INCLUSION_RATING_DATA;
    case 'hardness-test':
      return SAMPLE_HARDNESS_TEST_DATA;
    case 'visual-inspection':
      return SAMPLE_VISUAL_INSPECTION_DATA;
    default:
      return [];
  }
};

