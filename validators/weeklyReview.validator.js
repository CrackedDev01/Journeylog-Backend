const { isValidObjectId } = require('mongoose');

const validateWeeklyReview = (data) => {
  const errors = {};

  // Validate weekStart
  if (!data.weekStart) {
    errors.weekStart = 'Week start is required';
  } else {
    const weekStart = new Date(data.weekStart);
    if (isNaN(weekStart.getTime())) {
      errors.weekStart = 'Week start must be a valid date';
    }
  }

  // Validate weekEnd
  if (!data.weekEnd) {
    errors.weekEnd = 'Week end is required';
  } else {
    const weekEnd = new Date(data.weekEnd);
    if (isNaN(weekEnd.getTime())) {
      errors.weekEnd = 'Week end must be a valid date';
    } else if (data.weekStart) {
      const weekStart = new Date(data.weekStart);
      if (!isNaN(weekStart.getTime()) && weekEnd < weekStart) {
        errors.weekEnd = 'Week end cannot be before week start';
      }
    }
  }

  // Validate ObjectIds if provided
  if (data.weeklyPlan && !isValidObjectId(data.weeklyPlan)) {
    errors.weeklyPlan = 'Weekly plan ID must be a valid ObjectId';
  }

  // Validate text field lengths
  const textFields = [
    { field: 'biggestWin', max: 500 },
    { field: 'biggestChallenge', max: 500 },
    { field: 'whatWorked', max: 500 },
    { field: 'whatDidNotWork', max: 500 },
    { field: 'mainLesson', max: 500 },
    { field: 'whatToImprove', max: 500 },
    { field: 'nextWeekFocus', max: 500 },
    { field: 'notes', max: 1000 }
  ];

  textFields.forEach(({ field, max }) => {
    if (data[field] && data[field].length > max) {
      errors[field] = `${field} must not exceed ${max} characters`;
    }
  });

  // Validate ratings
  if (data.weekRating !== undefined && data.weekRating !== null) {
    if (!Number.isInteger(data.weekRating) || data.weekRating < 1 || data.weekRating > 5) {
      errors.weekRating = 'Week rating must be an integer between 1 and 5';
    }
  }

  if (data.nextWeekConfidence !== undefined && data.nextWeekConfidence !== null) {
    if (!Number.isInteger(data.nextWeekConfidence) || data.nextWeekConfidence < 1 || data.nextWeekConfidence > 5) {
      errors.nextWeekConfidence = 'Next week confidence must be an integer between 1 and 5';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateWeeklyReviewUpdate = (data) => {
  const errors = {};

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt', 'weekStart', 'weekEnd', 'weeklyPlan', 'snapshot'];
  protectedFields.forEach(field => {
    if (data[field] !== undefined) {
      errors[field] = `${field} cannot be updated directly`;
    }
  });

  // Validate ObjectIds if provided
  if (data.weeklyPlan && !isValidObjectId(data.weeklyPlan)) {
    errors.weeklyPlan = 'Weekly plan ID must be a valid ObjectId';
  }

  // Validate text field lengths
  const textFields = [
    { field: 'biggestWin', max: 500 },
    { field: 'biggestChallenge', max: 500 },
    { field: 'whatWorked', max: 500 },
    { field: 'whatDidNotWork', max: 500 },
    { field: 'mainLesson', max: 500 },
    { field: 'whatToImprove', max: 500 },
    { field: 'nextWeekFocus', max: 500 },
    { field: 'notes', max: 1000 }
  ];

  textFields.forEach(({ field, max }) => {
    if (data[field] && data[field].length > max) {
      errors[field] = `${field} must not exceed ${max} characters`;
    }
  });

  // Validate ratings
  if (data.weekRating !== undefined && data.weekRating !== null) {
    if (!Number.isInteger(data.weekRating) || data.weekRating < 1 || data.weekRating > 5) {
      errors.weekRating = 'Week rating must be an integer between 1 and 5';
    }
  }

  if (data.nextWeekConfidence !== undefined && data.nextWeekConfidence !== null) {
    if (!Number.isInteger(data.nextWeekConfidence) || data.nextWeekConfidence < 1 || data.nextWeekConfidence > 5) {
      errors.nextWeekConfidence = 'Next week confidence must be an integer between 1 and 5';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateWeeklyReview,
  validateWeeklyReviewUpdate
};