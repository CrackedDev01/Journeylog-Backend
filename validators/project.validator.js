const validator = {};

validator.validateProject = (projectData) => {
  const errors = {};

  // Name validation
  if (!projectData.name) {
    errors.name = 'Project name is required';
  } else if (typeof projectData.name !== 'string') {
    errors.name = 'Project name must be a string';
  } else {
    const trimmedName = projectData.name.trim();
    if (trimmedName === '') {
      errors.name = 'Project name cannot be empty';
    } else if (trimmedName.length > 200) {
      errors.name = 'Project name cannot exceed 200 characters';
    }
  }

  // Description validation
  if (projectData.description !== undefined && projectData.description !== null) {
    if (typeof projectData.description !== 'string') {
      errors.description = 'Project description must be a string';
    } else if (projectData.description.length > 1000) {
      errors.description = 'Project description cannot exceed 1000 characters';
    }
  }

  // Objective validation
  if (projectData.objective !== undefined && projectData.objective !== null) {
    if (typeof projectData.objective !== 'string') {
      errors.objective = 'Project objective must be a string';
    } else if (projectData.objective.length > 500) {
      errors.objective = 'Project objective cannot exceed 500 characters';
    }
  }

  // Category validation
  const validCategories = ['project', 'career', 'education', 'business', 'personal', 'finance', 'health', 'spiritual', 'skill', 'other'];
  if (projectData.category !== undefined && projectData.category !== null) {
    if (typeof projectData.category !== 'string') {
      errors.category = 'Project category must be a string';
    } else if (!validCategories.includes(projectData.category)) {
      errors.category = `Project category must be one of: ${validCategories.join(', ')}`;
    }
  }

  // Priority validation
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (projectData.priority !== undefined && projectData.priority !== null) {
    if (typeof projectData.priority !== 'string') {
      errors.priority = 'Project priority must be a string';
    } else if (!validPriorities.includes(projectData.priority)) {
      errors.priority = `Project priority must be one of: ${validPriorities.join(', ')}`;
    }
  }

  // Status validation
  const validStatuses = ['planned', 'active', 'paused', 'completed', 'cancelled', 'archived'];
  if (projectData.status !== undefined && projectData.status !== null) {
    if (typeof projectData.status !== 'string') {
      errors.status = 'Project status must be a string';
    } else if (!validStatuses.includes(projectData.status)) {
      errors.status = `Project status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  // Start date validation
  if (projectData.startDate !== undefined && projectData.startDate !== null) {
    if (!(projectData.startDate instanceof Date) && isNaN(Date.parse(projectData.startDate))) {
      errors.startDate = 'Project start date must be a valid date';
    }
  }

  // Target date validation
  if (projectData.targetDate !== undefined && projectData.targetDate !== null) {
    if (!(projectData.targetDate instanceof Date) && isNaN(Date.parse(projectData.targetDate))) {
      errors.targetDate = 'Project target date must be a valid date';
    } else if (projectData.startDate !== undefined && projectData.startDate !== null) {
      const startDate = projectData.startDate instanceof Date ? projectData.startDate : new Date(projectData.startDate);
      const targetDate = projectData.targetDate instanceof Date ? projectData.targetDate : new Date(projectData.targetDate);
      if (targetDate < startDate) {
        errors.targetDate = 'Project target date must be on or after start date';
      }
    }
  }

  // Estimated hours validation
  if (projectData.estimatedHours !== undefined && projectData.estimatedHours !== null) {
    if (typeof projectData.estimatedHours !== 'number') {
      errors.estimatedHours = 'Project estimated hours must be a number';
    } else if (projectData.estimatedHours < 0) {
      errors.estimatedHours = 'Project estimated hours cannot be negative';
    }
  }

  // Milestones validation
  if (projectData.milestones !== undefined && projectData.milestones !== null) {
    if (!Array.isArray(projectData.milestones)) {
      errors.milestones = 'Project milestones must be an array';
    } else {
      projectData.milestones.forEach((milestone, index) => {
        if (!milestone.title) {
          errors[`milestones[${index}].title`] = `Milestone title is required at index ${index}`;
        } else if (typeof milestone.title !== 'string') {
          errors[`milestones[${index}].title`] = `Milestone title must be a string at index ${index}`;
        } else {
          const trimmedTitle = milestone.title.trim();
          if (trimmedTitle === '') {
            errors[`milestones[${index}].title`] = `Milestone title cannot be empty at index ${index}`;
          } else if (trimmedTitle.length > 200) {
            errors[`milestones[${index}].title`] = `Milestone title cannot exceed 200 characters at index ${index}`;
          }
        }

        if (milestone.description !== undefined && milestone.description !== null) {
          if (typeof milestone.description !== 'string') {
            errors[`milestones[${index}].description`] = `Milestone description must be a string at index ${index}`;
          } else if (milestone.description.length > 1000) {
            errors[`milestones[${index}].description`] = `Milestone description cannot exceed 1000 characters at index ${index}`;
          }
        }

        const validMilestoneStatuses = ['planned', 'in_progress', 'completed', 'skipped'];
        if (milestone.status !== undefined && milestone.status !== null) {
          if (typeof milestone.status !== 'string') {
            errors[`milestones[${index}].status`] = `Milestone status must be a string at index ${index}`;
          } else if (!validMilestoneStatuses.includes(milestone.status)) {
            errors[`milestones[${index}].status`] = `Milestone status must be one of: ${validMilestoneStatuses.join(', ')} at index ${index}`;
          }
        }

        if (milestone.targetDate !== undefined && milestone.targetDate !== null) {
          if (!(milestone.targetDate instanceof Date) && isNaN(Date.parse(milestone.targetDate))) {
            errors[`milestones[${index}].targetDate`] = `Milestone target date must be a valid date at index ${index}`;
          }
        }

        if (milestone.order !== undefined && milestone.order !== null) {
          if (typeof milestone.order !== 'number') {
            errors[`milestones[${index}].order`] = `Milestone order must be a number at index ${index}`;
          } else if (!Number.isInteger(milestone.order)) {
            errors[`milestones[${index}].order`] = `Milestone order must be an integer at index ${index}`;
          }
        }
      });
    }
  }

  // Notes validation
  if (projectData.notes !== undefined && projectData.notes !== null) {
    if (typeof projectData.notes !== 'string') {
      errors.notes = 'Project notes must be a string';
    } else if (projectData.notes.length > 2000) {
      errors.notes = 'Project notes cannot exceed 2000 characters';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

validator.validateProjectUpdate = (updateData) => {
  const errors = {};

  // Define fields that can be updated
  const allowedUpdates = [
    'name', 'description', 'objective', 'category', 'priority', 'status',
    'startDate', 'targetDate', 'estimatedHours', 'notes'
  ];

  // Check for protected fields that cannot be updated
  const protectedFields = ['_id', 'user', 'createdAt', 'updatedAt', 'completedAt', 'milestones'];
  for (const field in updateData) {
    if (protectedFields.includes(field)) {
      errors[field] = `Field '${field}' cannot be updated directly`;
    }
  }

  // Validate each allowed field
  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      // Create temporary object for validation
      const tempData = {};
      tempData[field] = updateData[field];

      // Use the main validator for each field type
      const fieldValidator = {
        validateProject: (data) => {
          const result = validator.validateProject(data);
          // Return only errors for this specific field
          const fieldErrors = {};
          for (const key in result.errors) {
            if (key.startsWith(field)) {
              fieldErrors[key] = result.errors[key];
            }
          }
          return { isValid: Object.keys(fieldErrors).length === 0, errors: fieldErrors };
        }
      };

      const validationResult = fieldValidator.validateProject(tempData);
      if (!validationResult.isValid) {
        for (const key in validationResult.errors) {
          errors[key] = validationResult.errors[key];
        }
      }
    }
  }

  // Special validation for status transitions
  if (updateData.status !== undefined) {
    const validStatuses = ['planned', 'active', 'paused', 'completed', 'cancelled', 'archived'];
    if (typeof updateData.status !== 'string') {
      errors.status = 'Project status must be a string';
    } else if (!validStatuses.includes(updateData.status)) {
      errors.status = `Project status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  // Special validation for date relationship
  if (updateData.startDate !== undefined || updateData.targetDate !== undefined) {
    // We would need the current project to validate this properly
    // This will be handled in the service layer
  }

  // Special validation for estimated hours
  if (updateData.estimatedHours !== undefined && updateData.estimatedHours !== null) {
    if (typeof updateData.estimatedHours !== 'number') {
      errors.estimatedHours = 'Project estimated hours must be a number';
    } else if (updateData.estimatedHours < 0) {
      errors.estimatedHours = 'Project estimated hours cannot be negative';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

validator.validateMilestoneUpdate = (milestoneData) => {
  const errors = {};

  // Title validation
  if (milestoneData.title !== undefined) {
    if (!milestoneData.title) {
      errors.title = 'Milestone title is required';
    } else if (typeof milestoneData.title !== 'string') {
      errors.title = 'Milestone title must be a string';
    } else {
      const trimmedTitle = milestoneData.title.trim();
      if (trimmedTitle === '') {
        errors.title = 'Milestone title cannot be empty';
      } else if (trimmedTitle.length > 200) {
        errors.title = 'Milestone title cannot exceed 200 characters';
      }
    }
  }

  // Description validation
  if (milestoneData.description !== undefined && milestoneData.description !== null) {
    if (typeof milestoneData.description !== 'string') {
      errors.description = 'Milestone description must be a string';
    } else if (milestoneData.description.length > 1000) {
      errors.description = 'Milestone description cannot exceed 1000 characters';
    }
  }

  // Status validation
  const validMilestoneStatuses = ['planned', 'in_progress', 'completed', 'skipped'];
  if (milestoneData.status !== undefined) {
    if (typeof milestoneData.status !== 'string') {
      errors.status = 'Milestone status must be a string';
    } else if (!validMilestoneStatuses.includes(milestoneData.status)) {
      errors.status = `Milestone status must be one of: ${validMilestoneStatuses.join(', ')}`;
    }
  }

  // Target date validation
  if (milestoneData.targetDate !== undefined && milestoneData.targetDate !== null) {
    if (!(milestoneData.targetDate instanceof Date) && isNaN(Date.parse(milestoneData.targetDate))) {
      errors.targetDate = 'Milestone target date must be a valid date';
    }
  }

  // Order validation
  if (milestoneData.order !== undefined && milestoneData.order !== null) {
    if (typeof milestoneData.order !== 'number') {
      errors.order = 'Milestone order must be a number';
    } else if (!Number.isInteger(milestoneData.order)) {
      errors.order = 'Milestone order must be an integer';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = validator;