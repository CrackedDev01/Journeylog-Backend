const { isValidObjectId } = require('mongoose');

const validateHabit = (data) => {
  const errors = {};

  // Validate name
  if (!data.name || !data.name.trim()) {
    errors.name = 'Habit name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Habit name must not exceed 100 characters';
  }

  // Validate description
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must not exceed 500 characters';
  }

  // Validate category
  const validCategories = ['personal', 'health', 'education', 'career', 'business', 'spiritual', 'finance', 'skill', 'other'];
  if (data.category && !validCategories.includes(data.category)) {
    errors.category = 'Invalid category';
  }

  // Validate schedule
  if (!data.schedule) {
    errors.schedule = 'Schedule is required';
  } else {
    const validScheduleTypes = ['daily', 'weekdays', 'weekends', 'specific_days', 'times_per_week'];
    if (!data.schedule.scheduleType || !validScheduleTypes.includes(data.schedule.scheduleType)) {
      errors.schedule = 'Invalid schedule type';
    } else {
      // Validate daysOfWeek for specific_days schedule
      if (data.schedule.scheduleType === 'specific_days') {
        if (!Array.isArray(data.schedule.daysOfWeek)) {
          errors.schedule = 'daysOfWeek must be an array for specific_days schedule';
        } else {
          // Validate each day is integer 0-6
          for (const day of data.schedule.daysOfWeek) {
            if (!Number.isInteger(day) || day < 0 || day > 6) {
              errors.schedule = 'daysOfWeek must contain integers between 0 and 6';
              break;
            }
          }
          // Check for duplicates
          if (new Set(data.schedule.daysOfWeek).size !== data.schedule.daysOfWeek.length) {
            errors.schedule = 'daysOfWeek must not contain duplicate values';
          }
        }
      }

      // Validate timesPerWeek for times_per_week schedule
      if (data.schedule.scheduleType === 'times_per_week') {
        if (!Number.isInteger(data.schedule.timesPerWeek) || data.schedule.timesPerWeek < 1 || data.schedule.timesPerWeek > 7) {
          errors.schedule = 'timesPerWeek must be an integer between 1 and 7 for times_per_week schedule';
        }
      }
    }
  }

  // Validate targetType
  const validTargetTypes = ['binary', 'count', 'duration', 'quantity'];
  if (!data.targetType || !validTargetTypes.includes(data.targetType)) {
    errors.targetType = 'Invalid target type';
  } else {
    // Validate targetValue based on targetType
    if (data.targetType === 'binary') {
      // For binary, targetValue is not required but if provided should be 0 or 1
      if (data.targetValue !== undefined && data.targetValue !== null) {
        if (data.targetValue !== 0 && data.targetValue !== 1) {
          errors.targetValue = 'For binary habits, targetValue must be 0 or 1 if provided';
        }
      }
    } else {
      // For measurable habits, targetValue is required and must be > 0
      if (data.targetValue === undefined || data.targetValue === null) {
        errors.targetValue = 'Target value is required for measurable habits';
      } else if (!Number.isInteger(data.targetValue) || data.targetValue <= 0) {
        errors.targetValue = 'Target value must be a positive integer';
      }
    }
  }

  // Validate unit
  if (data.unit && data.unit.length > 50) {
    errors.unit = 'Unit must not exceed 50 characters';
  }

  // Validate startDate
  if (!data.startDate) {
    errors.startDate = 'Start date is required';
  } else {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.startDate = 'Invalid start date';
    }
  }

  // Validate endDate
  if (data.endDate !== undefined && data.endDate !== null) {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.endDate = 'Invalid end date';
    } else if (data.startDate) {
      const startDate = new Date(data.startDate);
      if (endDate < startDate) {
        errors.endDate = 'End date must be on or after start date';
      }
    }
  }

  // Validate status
  const validStatuses = ['active', 'paused', 'archived'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.status = 'Invalid status';
  }

  // Validate reminderTime
  if (data.reminderTime && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(data.reminderTime)) {
    errors.reminderTime = 'Reminder time must be in HH:mm format';
  }

  // Validate ObjectId for linkedMonthlyGoal
  if (data.linkedMonthlyGoal && !isValidObjectId(data.linkedMonthlyGoal)) {
    errors.linkedMonthlyGoal = 'Linked monthly goal must be a valid ObjectId';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateHabitUpdate = (data) => {
  const errors = {};

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt'];
  protectedFields.forEach(field => {
    if (data[field] !== undefined) {
      errors[field] = `${field} cannot be updated directly`;
    }
  });

  // Validate name if provided
  if (data.name !== undefined) {
    if (!data.name || !data.name.trim()) {
      errors.name = 'Habit name is required';
    } else if (data.name.length > 100) {
      errors.name = 'Habit name must not exceed 100 characters';
    }
  }

  // Validate description if provided
  if (data.description !== undefined && data.description.length > 500) {
    errors.description = 'Description must not exceed 500 characters';
  }

  // Validate category if provided
  if (data.category !== undefined) {
    const validCategories = ['personal', 'health', 'education', 'career', 'business', 'spiritual', 'finance', 'skill', 'other'];
    if (!validCategories.includes(data.category)) {
      errors.category = 'Invalid category';
    }
  }

  // Validate schedule if provided
  if (data.schedule !== undefined) {
    const validScheduleTypes = ['daily', 'weekdays', 'weekends', 'specific_days', 'times_per_week'];
    if (!data.schedule.scheduleType || !validScheduleTypes.includes(data.schedule.scheduleType)) {
      errors.schedule = 'Invalid schedule type';
    } else {
      // Validate daysOfWeek for specific_days schedule
      if (data.schedule.scheduleType === 'specific_days') {
        if (!Array.isArray(data.schedule.daysOfWeek)) {
          errors.schedule = 'daysOfWeek must be an array for specific_days schedule';
        } else {
          // Validate each day is integer 0-6
          for (const day of data.schedule.daysOfWeek) {
            if (!Number.isInteger(day) || day < 0 || day > 6) {
              errors.schedule = 'daysOfWeek must contain integers between 0 and 6';
              break;
            }
          }
          // Check for duplicates
          if (new Set(data.schedule.daysOfWeek).size !== data.schedule.daysOfWeek.length) {
            errors.schedule = 'daysOfWeek must not contain duplicate values';
          }
        }
      }

      // Validate timesPerWeek for times_per_week schedule
      if (data.schedule.scheduleType === 'times_per_week') {
        if (!Number.isInteger(data.schedule.timesPerWeek) || data.schedule.timesPerWeek < 1 || data.schedule.timesPerWeek > 7) {
          errors.schedule = 'timesPerWeek must be an integer between 1 and 7 for times_per_week schedule';
        }
      }
    }
  }

  // Validate targetType if provided
  if (data.targetType !== undefined) {
    const validTargetTypes = ['binary', 'count', 'duration', 'quantity'];
    if (!validTargetTypes.includes(data.targetType)) {
      errors.targetType = 'Invalid target type';
    } else {
      // Validate targetValue based on targetType
      if (data.targetType === 'binary') {
        // For binary, targetValue is not required but if provided should be 0 or 1
        if (data.targetValue !== undefined && data.targetValue !== null) {
          if (data.targetValue !== 0 && data.targetValue !== 1) {
            errors.targetValue = 'For binary habits, targetValue must be 0 or 1 if provided';
          }
        }
      } else {
        // For measurable habits, targetValue is required and must be > 0
        if (data.targetValue === undefined || data.targetValue === null) {
          errors.targetValue = 'Target value is required for measurable habits';
        } else if (!Number.isInteger(data.targetValue) || data.targetValue <= 0) {
          errors.targetValue = 'Target value must be a positive integer';
        }
      }
    }
  }

  // Validate unit if provided
  if (data.unit !== undefined && data.unit.length > 50) {
    errors.unit = 'Unit must not exceed 50 characters';
  }

  // Validate startDate if provided
  if (data.startDate !== undefined) {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.startDate = 'Invalid start date';
    }
  }

  // Validate endDate if provided
  if (data.endDate !== undefined && data.endDate !== null) {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.endDate = 'Invalid end date';
    } else if (data.startDate !== undefined) {
      const startDate = new Date(data.startDate);
      if (endDate < startDate) {
        errors.endDate = 'End date must be on or after start date';
      }
    }
  }

  // Validate status if provided
  if (data.status !== undefined) {
    const validStatuses = ['active', 'paused', 'archived'];
    if (!validStatuses.includes(data.status)) {
      errors.status = 'Invalid status';
    }
  }

  // Validate reminderTime if provided
  if (data.reminderTime !== undefined && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(data.reminderTime)) {
    errors.reminderTime = 'Reminder time must be in HH:mm format';
  }

  // Validate ObjectId for linkedMonthlyGoal
  if (data.linkedMonthlyGoal !== undefined && data.linkedMonthlyGoal !== null && !isValidObjectId(data.linkedMonthlyGoal)) {
    errors.linkedMonthlyGoal = 'Linked monthly goal must be a valid ObjectId';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateHabitCheckIn = (data) => {
  const errors = {};

  // Validate value
  if (data.value === undefined || data.value === null) {
    errors.value = 'Value is required';
  } else if (!Number.isInteger(data.value) || data.value < 0) {
    errors.value = 'Value must be a non-negative integer';
  }

  // Validate note
  if (data.note && data.note.length > 500) {
    errors.note = 'Note must not exceed 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateHabitSkip = (data) => {
  const errors = {};

  // Validate skipReason
  const validSkipReasons = ['illness', 'travel', 'schedule_change', 'rest_day', 'forgot', 'lack_of_time', 'other'];
  if (data.skipReason && !validSkipReasons.includes(data.skipReason)) {
    errors.skipReason = 'Invalid skip reason';
  }

  // Validate skipNote
  if (data.skipNote && data.skipNote.length > 500) {
    errors.skipNote = 'Skip note must not exceed 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateHabitLogUpdate = (data) => {
  const errors = {};

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'habit', 'createdAt', 'date'];
  protectedFields.forEach(field => {
    if (data[field] !== undefined) {
      errors[field] = `${field} cannot be updated directly`;
    }
  });

  // Validate value if provided
  if (data.value !== undefined) {
    if (!Number.isInteger(data.value) || data.value < 0) {
      errors.value = 'Value must be a non-negative integer';
    }
  }

  // Validate note if provided
  if (data.note && data.note.length > 500) {
    errors.note = 'Note must not exceed 500 characters';
  }

  // Validate status if provided
  if (data.status !== undefined) {
    const validStatuses = ['completed', 'partial', 'skipped'];
    if (!validStatuses.includes(data.status)) {
      errors.status = 'Invalid status';
    }
  }

  // Validate skipReason if provided
  if (data.skipReason !== undefined) {
    const validSkipReasons = ['illness', 'travel', 'schedule_change', 'rest_day', 'forgot', 'lack_of_time', 'other'];
    if (data.skipReason && !validSkipReasons.includes(data.skipReason)) {
      errors.skipReason = 'Invalid skip reason';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateHabit,
  validateHabitUpdate,
  validateHabitCheckIn,
  validateHabitSkip,
  validateHabitLogUpdate
};