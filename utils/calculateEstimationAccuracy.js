/**
 * Calculate estimation accuracy percentage
 * @param {number} estimatedMinutes - Estimated time in minutes
 * @param {number} actualMinutes - Actual time in minutes
 * @returns {number|null} Accuracy percentage (0-100) or null if estimatedMinutes is 0
 */
const calculateEstimationAccuracy = (estimatedMinutes, actualMinutes) => {
  // Handle edge cases
  if (estimatedMinutes === null || estimatedMinutes === undefined) {
    return null;
  }

  if (estimatedMinutes === 0) {
    // Cannot calculate accuracy when estimate is 0
    return null;
  }

  if (actualMinutes === null || actualMinutes === undefined) {
    return null;
  }

  // Calculate accuracy: 1 - |actual - estimated| / estimated
  const difference = Math.abs(actualMinutes - estimatedMinutes);
  const accuracy = 1 - (difference / estimatedMinutes);

  // Clamp to 0-100 percentage
  const percentage = Math.max(0, Math.min(100, accuracy * 100));

  return parseFloat(percentage.toFixed(2));
};

/**
 * Calculate estimation difference
 * @param {number} estimatedMinutes - Estimated time in minutes
 * @param {number} actualMinutes - Actual time in minutes
 * @returns {number|null} Difference in minutes (actual - estimated)
 */
const calculateEstimationDifference = (estimatedMinutes, actualMinutes) => {
  if (estimatedMinutes === null || estimatedMinutes === undefined ||
      actualMinutes === null || actualMinutes === undefined) {
    return null;
  }

  return actualMinutes - estimatedMinutes;
};

module.exports = {
  calculateEstimationAccuracy,
  calculateEstimationDifference
};