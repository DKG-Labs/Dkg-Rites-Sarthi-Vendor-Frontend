/**
 * Utility functions for Batch Weighment Statistics
 */

/**
 * Calculates mean deviation percentage for a batch
 * @param {Array} actuals - Array of actual weights
 * @param {Array} sets - Array of set points
 */
export const calculateMeanDeviation = (actuals, sets) => {
  if (!actuals || !sets || actuals.length === 0 || sets.length === 0) return 0;
  
  const deviations = actuals.map((act, i) => {
    const set = sets[i];
    if (!set) return 0;
    return ((act - set) / set) * 100;
  });

  const sum = deviations.reduce((acc, curr) => acc + curr, 0);
  return sum / deviations.length;
};

/**
 * Calculates standard deviation for a set of values
 */
export const calculateStdDev = (values) => {
  if (!values || values.length === 0) return 0;
  const n = values.length;
  const mean = values.reduce((a, b) => a + b) / n;
  return Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

/**
 * Calculates max positive and negative deviations
 */
export const getMaxDeviations = (actuals, sets) => {
  if (!actuals || !sets || actuals.length === 0) return { maxPos: 0, maxNeg: 0 };
  
  const deviations = actuals.map((act, i) => {
    const set = sets[i];
    if (!set) return 0;
    return ((act - set) / set) * 100;
  });

  return {
    maxPos: Math.max(...deviations, 0),
    maxNeg: Math.min(...deviations, 0)
  };
};

/**
 * Detects outliers based on a tolerance threshold
 */
export const detectOutliers = (actual, set, tolerancePercent) => {
  if (!set || set === 0) return false;
  const deviation = Math.abs(((actual - set) / set) * 100);
  return deviation > tolerancePercent;
};

export const formatBatchStats = (actuals, sets, tolerance = 5) => {
  const meanDev = calculateMeanDeviation(actuals, sets);
  const { maxPos, maxNeg } = getMaxDeviations(actuals, sets);
  
  // Example for Cement specifically or overall
  const deviations = actuals.map((act, i) => ((act - sets[i]) / sets[i]) * 100);
  const stdDev = calculateStdDev(deviations);

  return {
    meanDeviation: meanDev.toFixed(2),
    standardDeviation: stdDev.toFixed(2),
    maxPositive: maxPos.toFixed(2),
    maxNegative: maxNeg.toFixed(2),
    hasOutliers: actuals.some((act, i) => detectOutliers(act, sets[i], tolerance))
  };
};
