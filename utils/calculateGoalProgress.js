/**
 * Calculate progress for a monthly goal based on its target type and values
 * @param {Object} goal - The goal object containing targetType, targetValue, currentValue, status
 * @returns {number} Progress percentage (0-100)
 */
const calculateGoalProgress = (goal) => {
  // Handle binary goals - progress is based on completion status
  if (goal.targetType === 'binary') {
    return goal.status === 'completed' ? 100 : 0;
  }

  // Handle cases where targetValue is 0 to avoid division by zero
  if (goal.targetValue === 0) {
    return 0;
  }

  // Calculate progress for measurable goals
  let progress = 0;

  switch (goal.targetType) {
    case 'number':
    case 'hours':
      progress = (goal.currentValue / goal.targetValue) * 100;
      break;
    case 'percentage':
      // For percentage goals, we treat currentValue and targetValue as percentages
      // The progress is the ratio of current to target
      progress = (goal.currentValue / goal.targetValue) * 100;
      break;
  }

  // Constrain progress between 0 and 100
  return Math.min(100, Math.max(0, progress));
};

module.exports = calculateGoalProgress;