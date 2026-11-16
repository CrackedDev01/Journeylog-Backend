const validateGoal = (goalData) => {
  const errors = {};

  // Validate title
  if (!goalData.title || goalData.title.trim() === '') {
    errors.title = 'Please provide a title';
  } else if (goalData.title.trim().length > 200) {
    errors.title = 'Title must not exceed 200 characters';
  }

  // Validate description (optional)
  if (goalData.description !== undefined && goalData.description !== null) {
    if (typeof goalData.description !== 'string') {
      errors.description = 'Description must be a string';
    }
  }

  // Validate why (optional)
  if (goalData.why !== undefined && goalData.why !== null) {
    if (typeof goalData.why !== 'string') {
      errors.why = 'Why must be a string';
    }
  }

  // Validate category
  const validCategories = [
    'career', 'education', 'business', 'finance', 'health',
    'personal', 'spiritual', 'project', 'skill', 'other'
  ];
  if (!goalData.category) {
    errors.category = 'Please provide a category';
  } else if (!validCategories.includes(goalData.category)) {
    errors.category = 'Please provide a valid category';
  }

  // Validate month
  if (goalData.month === undefined || goalData.month === null) {
    errors.month = 'Please provide a month';
  } else if (typeof goalData.month !== 'number' || goalData.month < 1 || goalData.month > 12) {
    errors.month = 'Month must be a number between 1 and 12';
  }

  // Validate year
  if (goalData.year === undefined || goalData.year === null) {
    errors.year = 'Please provide a year';
  } else if (typeof goalData.year !== 'number' || goalData.year < 2020 || goalData.year > 2050) {
    errors.year = 'Year must be a number between 2020 and 2050';
  }

  // Validate priority
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (!goalData.priority) {
    errors.priority = 'Please provide a priority';
  } else if (!validPriorities.includes(goalData.priority)) {
    errors.priority = 'Please provide a valid priority';
  }

  // Validate status
  const validStatuses = ['not_started', 'in_progress', 'completed', 'paused', 'cancelled'];
  if (!goalData.status) {
    errors.status = 'Please provide a status';
  } else if (!validStatuses.includes(goalData.status)) {
    errors.status = 'Please provide a valid status';
  }

  // Validate targetType
  const validTargetTypes = ['binary', 'number', 'percentage', 'hours'];
  if (!goalData.targetType) {
    errors.targetType = 'Please provide a target type';
  } else if (!validTargetTypes.includes(goalData.targetType)) {
    errors.targetType = 'Please provide a valid target type';
  }

  // Validate targetValue
  if (goalData.targetValue === undefined || goalData.targetValue === null) {
    errors.targetValue = 'Please provide a target value';
  } else if (typeof goalData.targetValue !== 'number' || goalData.targetValue < 0) {
    errors.targetValue = 'Target value must be a number greater than or equal to 0';
  }

  // Validate currentValue
  if (goalData.currentValue !== undefined && goalData.currentValue !== null) {
    if (typeof goalData.currentValue !== 'number' || goalData.currentValue < 0) {
      errors.currentValue = 'Current value must be a number greater than or equal to 0';
    }
  }

  // Validate unit (optional)
  if (goalData.unit !== undefined && goalData.unit !== null) {
    if (typeof goalData.unit !== 'string') {
      errors.unit = 'Unit must be a string';
    }
  }

  // Validate estimatedHours (optional)
  if (goalData.estimatedHours !== undefined && goalData.estimatedHours !== null) {
    if (typeof goalData.estimatedHours !== 'number' || goalData.estimatedHours < 0) {
      errors.estimatedHours = 'Estimated hours must be a number greater than or equal to 0';
    }
  }

  // Validate deadline (optional)
  if (goalData.deadline !== undefined && goalData.deadline !== null) {
    if (!(goalData.deadline instanceof Date) && isNaN(Date.parse(goalData.deadline))) {
      errors.deadline = 'Please provide a valid date';
    }
  }

  // Validate milestones (optional)
  if (goalData.milestones !== undefined && goalData.milestones !== null) {
    if (!Array.isArray(goalData.milestones)) {
      errors.milestones = 'Milestones must be an array';
    } else {
      goalData.milestones.forEach((milestone, index) => {
        if (!milestone.title || typeof milestone.title !== 'string') {
          errors[`milestones[${index}].title`] = 'Milestone title is required and must be a string';
        } else if (milestone.title.trim() === '') {
          errors[`milestones[${index}].title`] = 'Milestone title cannot be empty';
        }

        if (milestone.completed !== undefined && milestone.completed !== null && typeof milestone.completed !== 'boolean') {
          errors[`milestones[${index}].completed`] = 'Milestone completed must be a boolean';
        }

        if (milestone.completedAt !== undefined && milestone.completedAt !== null) {
          if (!(milestone.completedAt instanceof Date) && isNaN(Date.parse(milestone.completedAt))) {
            errors[`milestones[${index}].completedAt`] = 'Milestone completedAt must be a valid date';
          }
        }
      });
    }
  }

  // Custom validation: for percentage goals, validate values are reasonable
  if (goalData.targetType === 'percentage') {
    if (goalData.targetValue !== undefined && goalData.targetValue !== null) {
      if (goalData.targetValue < 0 || goalData.targetValue > 100) {
        errors.targetValue = 'For percentage goals, target value must be between 0 and 100';
      }
    }

    if (goalData.currentValue !== undefined && goalData.currentValue !== null) {
      if (goalData.currentValue < 0 || goalData.currentValue > 100) {
        errors.currentValue = 'For percentage goals, current value must be between 0 and 100';
      }
    }
  }

  // Custom validation: currentValue should not exceed targetValue for measurable goals
  if (goalData.targetType !== 'binary' &&
      goalData.targetValue !== undefined &&
      goalData.currentValue !== undefined &&
      goalData.targetValue !== null &&
      goalData.currentValue !== null) {
    if (goalData.currentValue > goalData.targetValue) {
      errors.currentValue = 'Current value cannot exceed target value';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateGoalUpdate = (updateData) => {
  const errors = {};

  // Define fields that cannot be updated (server-controlled)
  const protectedFields = ['_id', 'user', 'createdAt', 'updatedAt'];

  protectedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      errors[field] = `Cannot update ${field} field`;
    }
  });

  // Validate title if provided
  if (updateData.title !== undefined && updateData.title !== null) {
    if (updateData.title.trim() === '') {
      errors.title = 'Please provide a title';
    } else if (updateData.title.trim().length > 200) {
      errors.title = 'Title must not exceed 200 characters';
    }
  }

  // Validate description if provided
  if (updateData.description !== undefined && updateData.description !== null) {
    if (typeof updateData.description !== 'string') {
      errors.description = 'Description must be a string';
    }
  }

  // Validate why if provided
  if (updateData.why !== undefined && updateData.why !== null) {
    if (typeof updateData.why !== 'string') {
      errors.why = 'Why must be a string';
    }
  }

  // Validate category if provided
  if (updateData.category !== undefined && updateData.category !== null) {
    const validCategories = [
      'career', 'education', 'business', 'finance', 'health',
      'personal', 'spiritual', 'project', 'skill', 'other'
    ];
    if (!validCategories.includes(updateData.category)) {
      errors.category = 'Please provide a valid category';
    }
  }

  // Validate month if provided
  if (updateData.month !== undefined && updateData.month !== null) {
    if (typeof updateData.month !== 'number' || updateData.month < 1 || updateData.month > 12) {
      errors.month = 'Month must be a number between 1 and 12';
    }
  }

  // Validate year if provided
  if (updateData.year !== undefined && updateData.year !== null) {
    if (typeof updateData.year !== 'number' || updateData.year < 2020 || updateData.year > 2050) {
      errors.year = 'Year must be a number between 2020 and 2050';
    }
  }

  // Validate priority if provided
  if (updateData.priority !== undefined && updateData.priority !== null) {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(updateData.priority)) {
      errors.priority = 'Please provide a valid priority';
    }
  }

  // Validate status if provided
  if (updateData.status !== undefined && updateData.status !== null) {
    const validStatuses = ['not_started', 'in_progress', 'completed', 'paused', 'cancelled'];
    if (!validStatuses.includes(updateData.status)) {
      errors.status = 'Please provide a valid status';
    }
  }

  // Validate targetType if provided
  if (updateData.targetType !== undefined && updateData.targetType !== null) {
    const validTargetTypes = ['binary', 'number', 'percentage', 'hours'];
    if (!validTargetTypes.includes(updateData.targetType)) {
      errors.targetType = 'Please provide a valid target type';
    }
  }

  // Validate targetValue if provided
  if (updateData.targetValue !== undefined && updateData.targetValue !== null) {
    if (typeof updateData.targetValue !== 'number' || updateData.targetValue < 0) {
      errors.targetValue = 'Target value must be a number greater than or equal to 0';
    }
  }

  // Validate currentValue if provided
  if (updateData.currentValue !== undefined && updateData.currentValue !== null) {
    if (typeof updateData.currentValue !== 'number' || updateData.currentValue < 0) {
      errors.currentValue = 'Current value must be a number greater than or equal to 0';
    }
  }

  // Validate unit if provided
  if (updateData.unit !== undefined && updateData.unit !== null) {
    if (typeof updateData.unit !== 'string') {
      errors.unit = 'Unit must be a string';
    }
  }

  // Validate estimatedHours if provided
  if (updateData.estimatedHours !== undefined && updateData.estimatedHours !== null) {
    if (typeof updateData.estimatedHours !== 'number' || updateData.estimatedHours < 0) {
      errors.estimatedHours = 'Estimated hours must be a number greater than or equal to 0';
    }
  }

  // Validate deadline if provided
  if (updateData.deadline !== undefined && updateData.deadline !== null) {
    if (!(updateData.deadline instanceof Date) && isNaN(Date.parse(updateData.deadline))) {
      errors.deadline = 'Please provide a valid date';
    }
  }

  // Validate milestones if provided
  if (updateData.milestones !== undefined && updateData.milestones !== null) {
    if (!Array.isArray(updateData.milestones)) {
      errors.milestones = 'Milestones must be an array';
    } else {
      updateData.milestones.forEach((milestone, index) => {
        if (milestone.title !== undefined && milestone.title !== null) {
          if (!milestone.title || typeof milestone.title !== 'string') {
            errors[`milestones[${index}].title`] = 'Milestone title is required and must be a string';
          } else if (milestone.title.trim() === '') {
            errors[`milestones[${index}].title`] = 'Milestone title cannot be empty';
          }
        }

        if (milestone.completed !== undefined && milestone.completed !== null) {
          if (typeof milestone.completed !== 'boolean') {
            errors[`milestones[${index}].completed`] = 'Milestone completed must be a boolean';
          }
        }

        if (milestone.completedAt !== undefined && milestone.completedAt !== null) {
          if (!(milestone.completedAt instanceof Date) && isNaN(Date.parse(milestone.completedAt))) {
            errors[`milestones[${index}].completedAt`] = 'Milestone completedAt must be a valid date';
          }
        }
      });
    }
  }

  // Custom validation: for percentage goals, validate values are reasonable
  if (updateData.targetType === 'percentage') {
    if (updateData.targetValue !== undefined && updateData.targetValue !== null) {
      if (updateData.targetValue < 0 || updateData.targetValue > 100) {
        errors.targetValue = 'For percentage goals, target value must be between 0 and 100';
      }
    }

    if (updateData.currentValue !== undefined && updateData.currentValue !== null) {
      if (updateData.currentValue < 0 || updateData.currentValue > 100) {
        errors.currentValue = 'For percentage goals, current value must be between 0 and 100';
      }
    }
  }

  // Custom validation: currentValue should not exceed targetValue for measurable goals
  if (updateData.targetType !== 'binary' &&
      updateData.targetValue !== undefined &&
      updateData.currentValue !== undefined &&
      updateData.targetValue !== null &&
      updateData.currentValue !== null) {
    if (updateData.currentValue > updateData.targetValue) {
      errors.currentValue = 'Current value cannot exceed target value';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = { validateGoal, validateGoalUpdate };