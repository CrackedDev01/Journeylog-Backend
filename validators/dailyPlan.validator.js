const validateDailyPlan = (data) => {
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

  // Validate dailyFocus
  if (data.dailyFocus !== undefined && data.dailyFocus !== null) {
    if (typeof data.dailyFocus !== 'string' || data.dailyFocus.trim() === '') {
      errors.dailyFocus = 'Daily focus must be a non-empty string';
    } else if (data.dailyFocus.length > 200) {
      errors.dailyFocus = 'Daily focus must not exceed 200 characters';
    }
  }

  // Validate intention
  const validIntentions = ['growth', 'maintenance', 'recovery', 'exploration'];
  if (data.intention !== undefined && data.intention !== null) {
    if (!validIntentions.includes(data.intention)) {
      errors.intention = `Intention must be one of: ${validIntentions.join(', ')}`;
    }
  }

  // Validate availableMinutes
  if (data.availableMinutes !== undefined && data.availableMinutes !== null) {
    if (!Number.isInteger(data.availableMinutes) || data.availableMinutes < 0) {
      errors.availableMinutes = 'Available minutes must be a non-negative integer';
    }
    // Also check for unreasonably large values (more than 24 hours)
    if (data.availableMinutes > 24 * 60) {
      errors.availableMinutes = 'Available minutes cannot exceed 24 hours (1440 minutes)';
    }
  }

  // Validate status
  const validStatuses = ['planned', 'active', 'completed', 'reviewed'];
  if (data.status !== undefined && data.status !== null) {
    if (!validStatuses.includes(data.status)) {
      errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateDailyPlanUpdate = (data) => {
  const errors = {};

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt'];
  protectedFields.forEach(field => {
    if (data[field] !== undefined) {
      errors[field] = `${field} cannot be updated directly`;
    }
  });

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

  // Validate dailyFocus
  if (data.dailyFocus !== undefined && data.dailyFocus !== null) {
    if (typeof data.dailyFocus !== 'string' || data.dailyFocus.trim() === '') {
      errors.dailyFocus = 'Daily focus must be a non-empty string';
    } else if (data.dailyFocus.length > 200) {
      errors.dailyFocus = 'Daily focus must not exceed 200 characters';
    }
  }

  // Validate intention
  const validIntentions = ['growth', 'maintenance', 'recovery', 'exploration'];
  if (data.intention !== undefined && data.intention !== null) {
    if (!validIntentions.includes(data.intention)) {
      errors.intention = `Intention must be one of: ${validIntentions.join(', ')}`;
    }
  }

  // Validate availableMinutes
  if (data.availableMinutes !== undefined && data.availableMinutes !== null) {
    if (!Number.isInteger(data.availableMinutes) || data.availableMinutes < 0) {
      errors.availableMinutes = 'Available minutes must be a non-negative integer';
    }
    // Also check for unreasonably large values (more than 24 hours)
    if (data.availableMinutes > 24 * 60) {
      errors.availableMinutes = 'Available minutes cannot exceed 24 hours (1440 minutes)';
    }
  }

  // Validate status
  const validStatuses = ['planned', 'active', 'completed', 'reviewed'];
  if (data.status !== undefined && data.status !== null) {
    if (!validStatuses.includes(data.status)) {
      errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateDailyPlan,
  validateDailyPlanUpdate
};