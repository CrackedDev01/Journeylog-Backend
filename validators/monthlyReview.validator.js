const { isValidObjectId } = require('mongoose');

const validateMonthlyReview = (data) => {
  const errors = {};

  // Validate year
  if (!data.year) {
    errors.year = 'Year is required';
  } else if (!Number.isInteger(data.year) || data.year < 2020 || data.year > 2050) {
    errors.year = 'Year must be an integer between 2020 and 2050';
  }

  // Validate month
  if (!data.month) {
    errors.month = 'Month is required';
  } else if (!Number.isInteger(data.month) || data.month < 1 || data.month > 12) {
    errors.month = 'Month must be an integer between 1 and 12';
  }

  // Validate ObjectIds if provided
  if (data.user && !isValidObjectId(data.user)) {
    errors.user = 'User ID must be a valid ObjectId';
  }

  // Validate text field lengths
  const textFields = [
    { field: 'biggestWin', max: 500 },
    { field: 'biggestChallenge', max: 500 },
    { field: 'whatWorked', max: 500 },
    { field: 'whatDidNotWork', max: 500 },
    { field: 'mainLesson', max: 500 },
    { field: 'whatToContinue', max: 500 },
    { field: 'whatToStop', max: 500 },
    { field: 'whatToImprove', max: 500 },
    { field: 'nextMonthFocus', max: 500 },
    { field: 'notes', max: 1000 }
  ];

  textFields.forEach(({ field, max }) => {
    if (data[field] && data[field].length > max) {
      errors[field] = `${field} must not exceed ${max} characters`;
    }
  });

  // Validate ratings
  if (data.monthRating !== undefined && data.monthRating !== null) {
    if (!Number.isInteger(data.monthRating) || data.monthRating < 1 || data.monthRating > 5) {
      errors.monthRating = 'Month rating must be an integer between 1 and 5';
    }
  }

  if (data.satisfactionRating !== undefined && data.satisfactionRating !== null) {
    if (!Number.isInteger(data.satisfactionRating) || data.satisfactionRating < 1 || data.satisfactionRating > 5) {
      errors.satisfactionRating = 'Satisfaction rating must be an integer between 1 and 5';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateMonthlyReviewUpdate = (data) => {
  const errors = {};

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt', 'year', 'month', 'snapshot', 'reviewedAt'];
  protectedFields.forEach(field => {
    if (data[field] !== undefined) {
      errors[field] = `${field} cannot be updated directly`;
    }
  });

  // Validate ObjectIds if provided
  if (data.user && !isValidObjectId(data.user)) {
    errors.user = 'User ID must be a valid ObjectId';
  }

  // Validate text field lengths
  const textFields = [
    { field: 'biggestWin', max: 500 },
    { field: 'biggestChallenge', max: 500 },
    { field: 'whatWorked', max: 500 },
    { field: 'whatDidNotWork', max: 500 },
    { field: 'mainLesson', max: 500 },
    { field: 'whatToContinue', max: 500 },
    { field: 'whatToStop', max: 500 },
    { field: 'whatToImprove', max: 500 },
    { field: 'nextMonthFocus', max: 500 },
    { field: 'notes', max: 1000 }
  ];

  textFields.forEach(({ field, max }) => {
    if (data[field] && data[field].length > max) {
      errors[field] = `${field} must not exceed ${max} characters`;
    }
  });

  // Validate ratings
  if (data.monthRating !== undefined && data.monthRating !== null) {
    if (!Number.isInteger(data.monthRating) || data.monthRating < 1 || data.monthRating > 5) {
      errors.monthRating = 'Month rating must be an integer between 1 and 5';
    }
  }

  if (data.satisfactionRating !== undefined && data.satisfactionRating !== null) {
    if (!Number.isInteger(data.satisfactionRating) || data.satisfactionRating < 1 || data.satisfactionRating > 5) {
      errors.satisfactionRating = 'Satisfaction rating must be an integer between 1 and 5';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateMonthlyReview,
  validateMonthlyReviewUpdate
};