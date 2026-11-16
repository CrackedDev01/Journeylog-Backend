const validateWeeklyPlan = (planData) => {
  const errors = {};

  // Validate weekStart
  if (!planData.weekStart) {
    errors.weekStart = 'Please provide a week start date';
  } else {
    const weekStartDate = new Date(planData.weekStart);
    if (isNaN(weekStartDate.getTime())) {
      errors.weekStart = 'Please provide a valid date for week start';
    }
  }

  // Validate weekEnd
  if (!planData.weekEnd) {
    errors.weekEnd = 'Please provide a week end date';
  } else {
    const weekEndDate = new Date(planData.weekEnd);
    if (isNaN(weekEndDate.getTime())) {
      errors.weekEnd = 'Please provide a valid date for week end';
    }
  }

  // Validate weekEnd is after weekStart
  if (planData.weekStart && planData.weekEnd) {
    const weekStartDate = new Date(planData.weekStart);
    const weekEndDate = new Date(planData.weekEnd);

    if (!isNaN(weekStartDate.getTime()) && !isNaN(weekEndDate.getTime())) {
      if (weekEndDate <= weekStartDate) {
        errors.weekEnd = 'Week end date must be after week start date';
      }
    }
  }

  // Validate weeklyFocus
  if (!planData.weeklyFocus || planData.weeklyFocus.trim() === '') {
    errors.weeklyFocus = 'Please provide a weekly focus';
  } else if (planData.weeklyFocus.trim().length > 200) {
    errors.weeklyFocus = 'Weekly focus must not exceed 200 characters';
  }

  // Validate intention (optional)
  if (planData.intention !== undefined && planData.intention !== null) {
    if (typeof planData.intention !== 'string') {
      errors.intention = 'Intention must be a string';
    }
  }

  // Validate availableHours (optional)
  if (planData.availableHours !== undefined && planData.availableHours !== null) {
    if (typeof planData.availableHours !== 'number' || planData.availableHours < 0) {
      errors.availableHours = 'Available hours must be a number greater than or equal to 0';
    }
  }

  // Validate status
  const validStatuses = ['planned', 'active', 'completed', 'reviewed'];
  if (!planData.status) {
    errors.status = 'Please provide a status';
  } else if (!validStatuses.includes(planData.status)) {
    errors.status = 'Please provide a valid status';
  }

  // Validate commitments (optional)
  if (planData.commitments !== undefined && planData.commitments !== null) {
    if (!Array.isArray(planData.commitments)) {
      errors.commitments = 'Commitments must be an array';
    } else {
      planData.commitments.forEach((commitment, index) => {
        // Validate commitment title
        if (!commitment.title || typeof commitment.title !== 'string') {
          errors[`commitments[${index}].title`] = 'Commitment title is required and must be a string';
        } else if (commitment.title.trim() === '') {
          errors[`commitments[${index}].title`] = 'Commitment title cannot be empty';
        } else if (commitment.title.trim().length > 200) {
          errors[`commitments[${index}].title`] = 'Commitment title must not exceed 200 characters';
        }

        // Validate commitment description (optional)
        if (commitment.description !== undefined && commitment.description !== null) {
          if (typeof commitment.description !== 'string') {
            errors[`commitments[${index}].description`] = 'Commitment description must be a string';
          }
        }

        // Validate commitment priority
        if (commitment.priority !== undefined && commitment.priority !== null) {
          const validPriorities = ['low', 'medium', 'high', 'critical'];
          if (!validPriorities.includes(commitment.priority)) {
            errors[`commitments[${index}].priority`] = 'Please provide a valid priority';
          }
        }

        // Validate commitment estimatedHours
        if (commitment.estimatedHours !== undefined && commitment.estimatedHours !== null) {
          if (typeof commitment.estimatedHours !== 'number' || commitment.estimatedHours < 0) {
            errors[`commitments[${index}].estimatedHours`] = 'Estimated hours must be a number greater than or equal to 0';
          }
        }

        // Validate commitment completed
        if (commitment.completed !== undefined && commitment.completed !== null) {
          if (typeof commitment.completed !== 'boolean') {
            errors[`commitments[${index}].completed`] = 'Completed must be a boolean';
          }
        }

        // Validate commitment completedAt
        if (commitment.completedAt !== undefined && commitment.completedAt !== null) {
          if (!(commitment.completedAt instanceof Date) && isNaN(Date.parse(commitment.completedAt))) {
            errors[`commitments[${index}].completedAt`] = 'Completed at must be a valid date';
          }
        }

        // Validate commitment monthlyGoal (optional)
        if (commitment.monthlyGoal !== undefined && commitment.monthlyGoal !== null) {
          // Note: ObjectId validation will happen in service layer when checking ownership
          // Here we just check if it's a string
          if (typeof commitment.monthlyGoal !== 'string') {
            errors[`commitments[${index}].monthlyGoal`] = 'Monthly goal ID must be a string';
          }
        }
      });
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateWeeklyPlanUpdate = (updateData) => {
  const errors = {};

  // Define fields that cannot be updated (server-controlled)
  const protectedFields = ['_id', 'user', 'createdAt', 'updatedAt', 'plannedHours', 'capacityUsage', 'capacityStatus', 'progress'];

  protectedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      errors[field] = `Cannot update ${field} field`;
    }
  });

  // Validate weekStart if provided
  if (updateData.weekStart !== undefined && updateData.weekStart !== null) {
    const weekStartDate = new Date(updateData.weekStart);
    if (isNaN(weekStartDate.getTime())) {
      errors.weekStart = 'Please provide a valid date for week start';
    }
  }

  // Validate weekEnd if provided
  if (updateData.weekEnd !== undefined && updateData.weekEnd !== null) {
    const weekEndDate = new Date(updateData.weekEnd);
    if (isNaN(weekEndDate.getTime())) {
      errors.weekEnd = 'Please provide a valid date for week end';
    }
  }

  // Validate weekEnd is after weekStart if both provided
  if (updateData.weekStart !== undefined && updateData.weekEnd !== undefined &&
      updateData.weekStart !== null && updateData.weekEnd !== null) {
    const weekStartDate = new Date(updateData.weekStart);
    const weekEndDate = new Date(updateData.weekEnd);

    if (!isNaN(weekStartDate.getTime()) && !isNaN(weekEndDate.getTime())) {
      if (weekEndDate <= weekStartDate) {
        errors.weekEnd = 'Week end date must be after week start date';
      }
    }
  }

  // Validate weeklyFocus if provided
  if (updateData.weeklyFocus !== undefined && updateData.weeklyFocus !== null) {
    if (updateData.weeklyFocus.trim() === '') {
      errors.weeklyFocus = 'Please provide a weekly focus';
    } else if (updateData.weeklyFocus.trim().length > 200) {
      errors.weeklyFocus = 'Weekly focus must not exceed 200 characters';
    }
  }

  // Validate intention if provided
  if (updateData.intention !== undefined && updateData.intention !== null) {
    if (typeof updateData.intention !== 'string') {
      errors.intention = 'Intention must be a string';
    }
  }

  // Validate availableHours if provided
  if (updateData.availableHours !== undefined && updateData.availableHours !== null) {
    if (typeof updateData.availableHours !== 'number' || updateData.availableHours < 0) {
      errors.availableHours = 'Available hours must be a number greater than or equal to 0';
    }
  }

  // Validate status if provided
  if (updateData.status !== undefined && updateData.status !== null) {
    const validStatuses = ['planned', 'active', 'completed', 'reviewed'];
    if (!validStatuses.includes(updateData.status)) {
      errors.status = 'Please provide a valid status';
    }
  }

  // Validate commitments if provided
  if (updateData.commitments !== undefined && updateData.commitments !== null) {
    if (!Array.isArray(updateData.commitments)) {
      errors.commitments = 'Commitments must be an array';
    } else {
      updateData.commitments.forEach((commitment, index) => {
        // Validate commitment title
        if (commitment.title !== undefined && commitment.title !== null) {
          if (!commitment.title || typeof commitment.title !== 'string') {
            errors[`commitments[${index}].title`] = 'Commitment title is required and must be a string';
          } else if (commitment.title.trim() === '') {
            errors[`commitments[${index}].title`] = 'Commitment title cannot be empty';
          } else if (commitment.title.trim().length > 200) {
            errors[`commitments[${index}].title`] = 'Commitment title must not exceed 200 characters';
          }
        }

        // Validate commitment description
        if (commitment.description !== undefined && commitment.description !== null) {
          if (typeof commitment.description !== 'string') {
            errors[`commitments[${index}].description`] = 'Commitment description must be a string';
          }
        }

        // Validate commitment priority
        if (commitment.priority !== undefined && commitment.priority !== null) {
          const validPriorities = ['low', 'medium', 'high', 'critical'];
          if (!validPriorities.includes(commitment.priority)) {
            errors[`commitments[${index}].priority`] = 'Please provide a valid priority';
          }
        }

        // Validate commitment estimatedHours
        if (commitment.estimatedHours !== undefined && commitment.estimatedHours !== null) {
          if (typeof commitment.estimatedHours !== 'number' || commitment.estimatedHours < 0) {
            errors[`commitments[${index}].estimatedHours`] = 'Estimated hours must be a number greater than or equal to 0';
          }
        }

        // Validate commitment completed
        if (commitment.completed !== undefined && commitment.completed !== null) {
          if (typeof commitment.completed !== 'boolean') {
            errors[`commitments[${index}].completed`] = 'Completed must be a boolean';
          }
        }

        // Validate commitment completedAt
        if (commitment.completedAt !== undefined && commitment.completedAt !== null) {
          if (!(commitment.completedAt instanceof Date) && isNaN(Date.parse(commitment.completedAt))) {
            errors[`commitments[${index}].completedAt`] = 'Completed at must be a valid date';
          }
        }

        // Validate commitment monthlyGoal
        if (commitment.monthlyGoal !== undefined && commitment.monthlyGoal !== null) {
          if (typeof commitment.monthlyGoal !== 'string') {
            errors[`commitments[${index}].monthlyGoal`] = 'Monthly goal ID must be a string';
          }
        }
      });
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = { validateWeeklyPlan, validateWeeklyPlanUpdate };