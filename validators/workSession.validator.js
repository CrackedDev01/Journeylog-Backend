const { isValidObjectId } = require('mongoose');

const validateWorkSession = (data) => {
  const errors = {};

  // Validate title or task requirement (task OR title must exist)
  if (!data.task && (!data.title || data.title.trim() === '')) {
    errors.title = 'Title is required when no task is linked';
  }

  // Validate ObjectIds if provided
  const idFields = ['task', 'dailyPlan', 'weeklyPlan', 'weeklyCommitmentId', 'monthlyGoal'];
  idFields.forEach(field => {
    if (data[field] && !isValidObjectId(data[field])) {
      errors[field] = `${field} must be a valid ObjectId`;
    }
  });

  // Validate sessionType
  const validSessionTypes = ['deep_work', 'focused_work', 'study', 'practice', 'meeting', 'admin', 'planning', 'other'];
  if (data.sessionType && !validSessionTypes.includes(data.sessionType)) {
    errors.sessionType = `Session type must be one of: ${validSessionTypes.join(', ')}`;
  }

  // Validate status (when provided)
  const validStatuses = ['active', 'completed', 'cancelled'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
  }

  // Validate ratings
  if (data.focusRating !== undefined && data.focusRating !== null) {
    if (data.focusRating < 1 || data.focusRating > 5 || !Number.isInteger(data.focusRating)) {
      errors.focusRating = 'Focus rating must be an integer between 1 and 5';
    }
  }

  if (data.energyRating !== undefined && data.energyRating !== null) {
    if (data.energyRating < 1 || data.energyRating > 5 || !Number.isInteger(data.energyRating)) {
      errors.energyRating = 'Energy rating must be an integer between 1 and 5';
    }
  }

  // Validate text field lengths
  if (data.title && data.title.length > 200) {
    errors.title = 'Title must not exceed 200 characters';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must not exceed 1000 characters';
  }

  if (data.outcome && data.outcome.length > 500) {
    errors.outcome = 'Outcome must not exceed 500 characters';
  }

  if (data.blocker && data.blocker.length > 200) {
    errors.blocker = 'Blocker must not exceed 200 characters';
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes must not exceed 500 characters';
  }

  // Validate timestamps
  if (data.startedAt) {
    const startedAt = new Date(data.startedAt);
    if (isNaN(startedAt.getTime())) {
      errors.startedAt = 'StartedAt must be a valid date';
    }
  }

  if (data.endedAt) {
    const endedAt = new Date(data.endedAt);
    if (isNaN(endedAt.getTime())) {
      errors.endedAt = 'EndedAt must be a valid date';
    } else if (data.startedAt) {
      const startedAt = new Date(data.startedAt);
      if (!isNaN(startedAt.getTime()) && endedAt < startedAt) {
        errors.endedAt = 'EndedAt cannot be before startedAt';
      }
    }
  }

  // Validate duration (should be non-negative if provided)
  if (data.durationMinutes !== undefined && data.durationMinutes !== null) {
    if (data.durationMinutes < 0) {
      errors.durationMinutes = 'Duration minutes cannot be negative';
    }
    // Also check for unreasonably large values (more than 24 hours)
    if (data.durationMinutes > 24 * 60) {
      errors.durationMinutes = 'Duration minutes cannot exceed 24 hours (1440 minutes)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateWorkSessionStart = (data) => {
  const errors = {};

  // For starting a session, we need either task or title
  if (!data.task && (!data.title || data.title.trim() === '')) {
    errors.title = 'Title is required when no task is linked';
  }

  // Validate ObjectIds if provided
  const idFields = ['task', 'dailyPlan', 'weeklyPlan', 'weeklyCommitmentId', 'monthlyGoal'];
  idFields.forEach(field => {
    if (data[field] && !isValidObjectId(data[field])) {
      errors[field] = `${field} must be a valid ObjectId`;
    }
  });

  // Validate sessionType
  const validSessionTypes = ['deep_work', 'focused_work', 'study', 'practice', 'meeting', 'admin', 'planning', 'other'];
  if (data.sessionType && !validSessionTypes.includes(data.sessionType)) {
    errors.sessionType = `Session type must be one of: ${validSessionTypes.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateWorkSessionUpdate = (data) => {
  const errors = {};

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt', 'durationMinutes'];
  protectedFields.forEach(field => {
    if (data[field] !== undefined) {
      errors[field] = `${field} cannot be updated directly`;
    }
  });

  // Validate ObjectIds if provided
  const idFields = ['task', 'dailyPlan', 'weeklyPlan', 'weeklyCommitmentId', 'monthlyGoal'];
  idFields.forEach(field => {
    if (data[field] && !isValidObjectId(data[field])) {
      errors[field] = `${field} must be a valid ObjectId`;
    }
  });

  // Validate sessionType
  const validSessionTypes = ['deep_work', 'focused_work', 'study', 'practice', 'meeting', 'admin', 'planning', 'other'];
  if (data.sessionType && !validSessionTypes.includes(data.sessionType)) {
    errors.sessionType = `Session type must be one of: ${validSessionTypes.join(', ')}`;
  }

  // Validate status (when provided)
  const validStatuses = ['active', 'completed', 'cancelled'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
  }

  // Validate ratings
  if (data.focusRating !== undefined && data.focusRating !== null) {
    if (data.focusRating < 1 || data.focusRating > 5 || !Number.isInteger(data.focusRating)) {
      errors.focusRating = 'Focus rating must be an integer between 1 and 5';
    }
  }

  if (data.energyRating !== undefined && data.energyRating !== null) {
    if (data.energyRating < 1 || data.energyRating > 5 || !Number.isInteger(data.energyRating)) {
      errors.energyRating = 'Energy rating must be an integer between 1 and 5';
    }
  }

  // Validate text field lengths
  if (data.title && data.title.length > 200) {
    errors.title = 'Title must not exceed 200 characters';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must not exceed 1000 characters';
  }

  if (data.outcome && data.outcome.length > 500) {
    errors.outcome = 'Outcome must not exceed 500 characters';
  }

  if (data.blocker && data.blocker.length > 200) {
    errors.blocker = 'Blocker must not exceed 200 characters';
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes must not exceed 500 characters';
  }

  // Validate timestamps
  if (data.startedAt) {
    const startedAt = new Date(data.startedAt);
    if (isNaN(startedAt.getTime())) {
      errors.startedAt = 'StartedAt must be a valid date';
    }
  }

  if (data.endedAt) {
    const endedAt = new Date(data.endedAt);
    if (isNaN(endedAt.getTime())) {
      errors.endedAt = 'EndedAt must be a valid date';
    } else if (data.startedAt) {
      const startedAt = new Date(data.startedAt);
      if (!isNaN(startedAt.getTime()) && endedAt < startedAt) {
        errors.endedAt = 'EndedAt cannot be before startedAt';
      }
    }
  }

  // Note: durationMinutes validation is handled in the model pre-save hook
  // We don't validate it here because it's calculated from timestamps

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateWorkSession,
  validateWorkSessionStart,
  validateWorkSessionUpdate
};