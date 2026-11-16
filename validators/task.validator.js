const { isValidObjectId } = require('mongoose');

const validateTask = (data) => {
  const errors = {};

  // Validate title
  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.title = 'Title is required and must be a non-empty string';
  } else if (data.title.length > 200) {
    errors.title = 'Title must not exceed 200 characters';
  }

  // Validate description
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.description = 'Description must be a string';
    } else if (data.description.length > 1000) {
      errors.description = 'Description must not exceed 1000 characters';
    }
  }

  // Validate date
  if (!data.date) {
    errors.date = 'Date is required';
  } else {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      errors.date = 'Date must be a valid date';
    }
  }

  // Validate priority
  const validPriorities = ['must_do', 'important', 'optional'];
  if (data.priority !== undefined && data.priority !== null) {
    if (!validPriorities.includes(data.priority)) {
      errors.priority = `Priority must be one of: ${validPriorities.join(', ')}`;
    }
  }

  // Validate status
  const validStatuses = ['planned', 'in_progress', 'completed', 'skipped', 'cancelled'];
  if (data.status !== undefined && data.status !== null) {
    if (!validStatuses.includes(data.status)) {
      errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  // Validate estimatedMinutes
  if (data.estimatedMinutes !== undefined && data.estimatedMinutes !== null) {
    if (!Number.isInteger(data.estimatedMinutes) || data.estimatedMinutes < 0) {
      errors.estimatedMinutes = 'Estimated minutes must be a non-negative integer';
    }
    // Also check for unreasonably large values (more than 24 hours)
    if (data.estimatedMinutes > 24 * 60) {
      errors.estimatedMinutes = 'Estimated minutes cannot exceed 24 hours (1440 minutes)';
    }
  }

  // Validate dueTime format
  if (data.dueTime !== undefined && data.dueTime !== null) {
    if (typeof data.dueTime !== 'string') {
      errors.dueTime = 'Due time must be a string in HH:MM format';
    } else if (!/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(data.dueTime)) {
      errors.dueTime = 'Due time must be in HH:MM format (24-hour clock)';
    }
  }

  // Validate ObjectIds if provided
  const idFields = ['dailyPlan', 'weeklyPlan', 'weeklyCommitmentId', 'monthlyGoal', 'project'];
  idFields.forEach(field => {
    if (data[field] && !isValidObjectId(data[field])) {
      errors[field] = `${field} must be a valid ObjectId`;
    }
  });

  // Validate projectMilestoneId
  if (data.projectMilestoneId && !isValidObjectId(data.projectMilestoneId)) {
    errors.projectMilestoneId = 'projectMilestoneId must be a valid ObjectId';
  }

  // Validate skipReason
  const validSkipReasons = ['low_energy', 'unexpected_obstacle', 'change_in_priority', 'lack_of_resources', 'other'];
  if (data.skipReason !== undefined && data.skipReason !== null) {
    if (!validSkipReasons.includes(data.skipReason)) {
      errors.skipReason = `Skip reason must be one of: ${validSkipReasons.join(', ')}`;
    }
  }

  // Validate skipNote
  if (data.skipNote !== undefined && data.skipNote !== null) {
    if (typeof data.skipNote !== 'string') {
      errors.skipNote = 'Skip note must be a string';
    } else if (data.skipNote.length > 500) {
      errors.skipNote = 'Skip note must not exceed 500 characters';
    }
  }

  // Validate rescheduleCount
  if (data.rescheduleCount !== undefined && data.rescheduleCount !== null) {
    if (!Number.isInteger(data.rescheduleCount) || data.rescheduleCount < 0) {
      errors.rescheduleCount = 'Reschedule count must be a non-negative integer';
    }
  }

  // Validate notes
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      errors.notes = 'Notes must be a string';
    } else if (data.notes.length > 1000) {
      errors.notes = 'Notes must not exceed 1000 characters';
    }
  }

  // Validate order
  if (data.order !== undefined && data.order !== null) {
    if (!Number.isInteger(data.order) || data.order < 0) {
      errors.order = 'Order must be a non-negative integer';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateTaskUpdate = (data) => {
  const errors = {};

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt'];
  protectedFields.forEach(field => {
    if (data[field] !== undefined) {
      errors[field] = `${field} cannot be updated directly`;
    }
  });

  // Validate title
  if (data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      errors.title = 'Title is required and must be a non-empty string';
    } else if (data.title.length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }
  }

  // Validate description
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.description = 'Description must be a string';
    } else if (data.description.length > 1000) {
      errors.description = 'Description must not exceed 1000 characters';
    }
  }

  // Validate date
  if (data.date !== undefined) {
    if (!data.date) {
      errors.date = 'Date is required';
    } else {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.date = 'Date must be a valid date';
      }
    }
  }

  // Validate priority
  const validPriorities = ['must_do', 'important', 'optional'];
  if (data.priority !== undefined && data.priority !== null) {
    if (!validPriorities.includes(data.priority)) {
      errors.priority = `Priority must be one of: ${validPriorities.join(', ')}`;
    }
  }

  // Validate status
  const validStatuses = ['planned', 'in_progress', 'completed', 'skipped', 'cancelled'];
  if (data.status !== undefined && data.status !== null) {
    if (!validStatuses.includes(data.status)) {
      errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  // Validate estimatedMinutes
  if (data.estimatedMinutes !== undefined && data.estimatedMinutes !== null) {
    if (!Number.isInteger(data.estimatedMinutes) || data.estimatedMinutes < 0) {
      errors.estimatedMinutes = 'Estimated minutes must be a non-negative integer';
    }
    // Also check for unreasonably large values (more than 24 hours)
    if (data.estimatedMinutes > 24 * 60) {
      errors.estimatedMinutes = 'Estimated minutes cannot exceed 24 hours (1440 minutes)';
    }
  }

  // Validate dueTime format
  if (data.dueTime !== undefined && data.dueTime !== null) {
    if (typeof data.dueTime !== 'string') {
      errors.dueTime = 'Due time must be a string in HH:MM format';
    } else if (!/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(data.dueTime)) {
      errors.dueTime = 'Due time must be in HH:MM format (24-hour clock)';
    }
  }

  // Validate ObjectIds if provided
  const idFields = ['dailyPlan', 'weeklyPlan', 'weeklyCommitmentId', 'monthlyGoal', 'project'];
  idFields.forEach(field => {
    if (data[field] && !isValidObjectId(data[field])) {
      errors[field] = `${field} must be a valid ObjectId`;
    }
  });

  // Validate projectMilestoneId
  if (data.projectMilestoneId && !isValidObjectId(data.projectMilestoneId)) {
    errors.projectMilestoneId = 'projectMilestoneId must be a valid ObjectId';
  }

  // Validate skipReason
  const validSkipReasons = ['low_energy', 'unexpected_obstacle', 'change_in_priority', 'lack_of_resources', 'other'];
  if (data.skipReason !== undefined && data.skipReason !== null) {
    if (!validSkipReasons.includes(data.skipReason)) {
      errors.skipReason = `Skip reason must be one of: ${validSkipReasons.join(', ')}`;
    }
  }

  // Validate skipNote
  if (data.skipNote !== undefined && data.skipNote !== null) {
    if (typeof data.skipNote !== 'string') {
      errors.skipNote = 'Skip note must be a string';
    } else if (data.skipNote.length > 500) {
      errors.skipNote = 'Skip note must not exceed 500 characters';
    }
  }

  // Validate rescheduleCount
  if (data.rescheduleCount !== undefined && data.rescheduleCount !== null) {
    if (!Number.isInteger(data.rescheduleCount) || data.rescheduleCount < 0) {
      errors.rescheduleCount = 'Reschedule count must be a non-negative integer';
    }
  }

  // Validate notes
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      errors.notes = 'Notes must be a string';
    } else if (data.notes.length > 1000) {
      errors.notes = 'Notes must not exceed 1000 characters';
    }
  }

  // Validate order
  if (data.order !== undefined && data.order !== null) {
    if (!Number.isInteger(data.order) || data.order < 0) {
      errors.order = 'Order must be a non-negative integer';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateTask,
  validateTaskUpdate
};