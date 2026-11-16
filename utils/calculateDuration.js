/**
 * Calculate duration in minutes between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Duration in minutes
 */
const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null;
  }

  if (end < start) {
    return null; // Invalid: end before start
  }

  const durationMs = end - start;
  return Math.floor(durationMs / (1000 * 60));
};

/**
 * Calculate elapsed time for an active session
 * @param {Date} startDate - Start date
 * @returns {number} Elapsed minutes
 */
const calculateElapsedMinutes = (startDate) => {
  if (!startDate) {
    return null;
  }

  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return null;
  }

  const elapsedMs = Date.now() - start.getTime();
  return Math.floor(elapsedMs / (1000 * 60));
};

module.exports = {
  calculateDuration,
  calculateElapsedMinutes
};