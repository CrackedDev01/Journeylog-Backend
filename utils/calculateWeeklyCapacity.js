/**
 * Calculate weekly capacity status based on planned vs available hours
 * @param {number} plannedHours - Total planned hours from commitments
 * @param {number} availableHours - User's available hours for the week
 * @returns {string|null} Capacity status: 'under_planned', 'realistic', 'heavy', 'overloaded', or null if availableHours not provided
 */
const calculateWeeklyCapacity = (plannedHours, availableHours) => {
  // If available hours not provided, return null
  if (availableHours === null || availableHours === undefined || availableHours === 0) {
    return null;
  }

  // Calculate usage percentage
  const usagePercentage = (plannedHours / availableHours) * 100;

  // Determine capacity status based on usage
  if (usagePercentage <= 60) {
    return 'under_planned';
  } else if (usagePercentage <= 90) {
    return 'realistic';
  } else if (usagePercentage <= 110) {
    return 'heavy';
  } else {
    return 'overloaded';
  }
};

module.exports = calculateWeeklyCapacity;