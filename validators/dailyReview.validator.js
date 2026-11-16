const { isValidObjectId } = require('mongoose');

const validateDailyReview = (data) => {
  const errors = {};

  // Validate date
  if (!data.date) {
    errors.date = 'Date is required';
  } else {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      errors.date = 'Date must be a valid date';
    }
  }

  // Validate ObjectIds if provided
  if (data.dailyPlan && !isValidObjectId(data.dailyPlan)) {
    errors.dailyPlan = 'Daily plan ID must be a valid ObjectId';
  }

  // Validate text field lengths
  if (data.mainWin && data.mainWin.length > 500) {
    errors.mainWin = 'Main win must not exceed 500 characters';
  }

  if (data.mainChallenge && data.mainChallenge.length > 500) {
    errors.mainChallenge = 'Main challenge must not exceed 500 characters';
  }

  if (data.whatWentWell && data.whatWentWell.length > 500) {
    errors.whatWentWell = 'What went well must not exceed 500 characters';
  }

  if (data.whatDidNotGoWell && data.whatDidNotGoWell.length > 500) {
    errors.whatDidNotGoWell = 'What did not go well must not exceed 500 characters';
  }

  if (data.lessonLearned && data.lessonLearned.length > 500) {
    errors.lessonLearned = 'Lesson learned must not exceed 500 characters';
  }

  if (data.tomorrowFocus && data.tomorrowFocus.length > 500) {
    errors.tomorrowFocus = 'Tomorrow focus must not exceed 500 characters';
  }

  if (data.notes && data.notes.length > 1000) {
    errors.notes = 'Notes must not exceed 1000 characters';
  }

  // Validate ratings
  if (data.dayRating !== undefined && data.dayRating !== null) {
    if (!Number.isInteger(data.dayRating) || data.dayRating < 1 || data.dayRating > 5) {
      errors.dayRating = 'Day rating must be an integer between 1 and 5';
    }
  }

  if (data.satisfactionRating !== undefined && data.satisfactionRating !== null) {
    if (!Number.isInteger(data.satisfactionRating) || data.satisfactionRating < 1 || data.satisfactionRating > 5) {
      errors.satisfactionRating = 'Satisfaction rating must be an integer between 1 and 5';
    }
  }

  // Validate dayFeeling
  const validFeelings = ['great', 'good', 'neutral', 'tired', 'difficult'];
  if (data.dayFeeling !== undefined && data.dayFeeling !== null) {
    if (!validFeelings.includes(data.dayFeeling)) {
      errors.dayFeeling = `Day feeling must be one of: ${validFeelings.join(', ')}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateDailyReviewUpdate = (data) => {
  const errors = {};

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt', 'date', 'dailyPlan', 'snapshot'];
  protectedFields.forEach(field => {
    if (data[field] !== undefined) {
      errors[field] = `${field} cannot be updated directly`;
    }
  });

  // Validate ObjectIds if provided
  if (data.dailyPlan && !isValidObjectId(data.dailyPlan)) {
    errors.dailyPlan = 'Daily plan ID must be a valid ObjectId';
  }

  // Validate text field lengths
  if (data.mainWin && data.mainWin.length > 500) {
    errors.mainWin = 'Main win must not exceed 500 characters';
  }

  if (data.mainChallenge && data.mainChallenge.length > 500) {
    errors.mainChallenge = 'Main challenge must not exceed 500 characters';
  }

  if (data.whatWentWell && data.whatWentWell.length > 500) {
    errors.whatWentWell = 'What went well must not exceed 500 characters';
  }

  if (data.whatDidNotGoWell && data.whatDidNotGoWell.length > 500) {
    errors.whatDidNotGoWell = 'What did not go well must not exceed 500 characters';
  }

  if (data.lessonLearned && data.lessonLearned.length > 500) {
    errors.lessonLearned = 'Lesson learned must not exceed 500 characters';
  }

  if (data.tomorrowFocus && data.tomorrowFocus.length > 500) {
    errors.tomorrowFocus = 'Tomorrow focus must not exceed 500 characters';
  }

  if (data.notes && data.notes.length > 1000) {
    errors.notes = 'Notes must not exceed 1000 characters';
  }

  // Validate ratings
  if (data.dayRating !== undefined && data.dayRating !== null) {
    if (!Number.isInteger(data.dayRating) || data.dayRating < 1 || data.dayRating > 5) {
      errors.dayRating = 'Day rating must be an integer between 1 and 5';
    }
  }

  if (data.satisfactionRating !== undefined && data.satisfactionRating !== null) {
    if (!Number.isInteger(data.satisfactionRating) || data.satisfactionRating < 1 || data.satisfactionRating > 5) {
      errors.satisfactionRating = 'Satisfaction rating must be an integer between 1 and 5';
    }
  }

  // Validate dayFeeling
  const validFeelings = ['great', 'good', 'neutral', 'tired', 'difficult'];
  if (data.dayFeeling !== undefined && data.dayFeeling !== null) {
    if (!validFeelings.includes(data.dayFeeling)) {
      errors.dayFeeling = `Day feeling must be one of: ${validFeelings.join(', ')}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateDailyReview,
  validateDailyReviewUpdate
};