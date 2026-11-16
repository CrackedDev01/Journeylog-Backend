const { isValidObjectId } = require('mongoose');

const validateSkill = (data) => {
  const errors = {};

  // Validate name
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.name = 'Name is required and must be a non-empty string';
  } else if (data.name.length > 100) {
    errors.name = 'Name must not exceed 100 characters';
  }

  // Validate description
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.description = 'Description must be a string';
    } else if (data.description.length > 500) {
      errors.description = 'Description must not exceed 500 characters';
    }
  }

  // Validate category
  const validCategories = ['technical', 'design', 'business', 'communication', 'academic', 'creative', 'personal', 'other'];
  if (data.category !== undefined && data.category !== null) {
    if (!validCategories.includes(data.category)) {
      errors.category = `Category must be one of: ${validCategories.join(', ')}`;
    }
  }

  // Validate currentLevel
  const validLevels = ['beginner', 'foundational', 'intermediate', 'advanced', 'expert'];
  if (data.currentLevel !== undefined && data.currentLevel !== null) {
    if (!validLevels.includes(data.currentLevel)) {
      errors.currentLevel = `Current level must be one of: ${validLevels.join(', ')}`;
    }
  }

  // Validate targetLevel
  if (data.targetLevel !== undefined && data.targetLevel !== null) {
    if (!validLevels.includes(data.targetLevel)) {
      errors.targetLevel = `Target level must be one of: ${validLevels.join(', ')}`;
    }
  }

  // Validate status
  const validStatuses = ['active', 'paused', 'mastered', 'archived'];
  if (data.status !== undefined && data.status !== null) {
    if (!validStatuses.includes(data.status)) {
      errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  // Validate startedAt
  if (data.startedAt !== undefined && data.startedAt !== null) {
    const startedAt = new Date(data.startedAt);
    if (isNaN(startedAt.getTime())) {
      errors.startedAt = 'Started at must be a valid date';
    }
  }

  // Validate targetDate
  if (data.targetDate !== undefined && data.targetDate !== null) {
    const targetDate = new Date(data.targetDate);
    if (isNaN(targetDate.getTime())) {
      errors.targetDate = 'Target date must be a valid date';
    }
  }

  // Validate date range consistency
  if (data.startedAt && data.targetDate) {
    const startedAt = new Date(data.startedAt);
    const targetDate = new Date(data.targetDate);
    if (!isNaN(startedAt.getTime()) && !isNaN(targetDate.getTime()) && targetDate < startedAt) {
      errors.targetDate = 'Target date must be on or after started at';
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

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateSkillUpdate = (data) => {
  const errors = {};

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt'];
  protectedFields.forEach(field => {
    if (data[field] !== undefined) {
      errors[field] = `${field} cannot be updated directly`;
    }
  });

  // Validate name
  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.name = 'Name is required and must be a non-empty string';
    } else if (data.name.length > 100) {
      errors.name = 'Name must not exceed 100 characters';
    }
  }

  // Validate description
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.description = 'Description must be a string';
    } else if (data.description.length > 500) {
      errors.description = 'Description must not exceed 500 characters';
    }
  }

  // Validate category
  const validCategories = ['technical', 'design', 'business', 'communication', 'academic', 'creative', 'personal', 'other'];
  if (data.category !== undefined && data.category !== null) {
    if (!validCategories.includes(data.category)) {
      errors.category = `Category must be one of: ${validCategories.join(', ')}`;
    }
  }

  // Validate currentLevel
  const validLevels = ['beginner', 'foundational', 'intermediate', 'advanced', 'expert'];
  if (data.currentLevel !== undefined && data.currentLevel !== null) {
    if (!validLevels.includes(data.currentLevel)) {
      errors.currentLevel = `Current level must be one of: ${validLevels.join(', ')}`;
    }
  }

  // Validate targetLevel
  if (data.targetLevel !== undefined && data.targetLevel !== null) {
    if (!validLevels.includes(data.targetLevel)) {
      errors.targetLevel = `Target level must be one of: ${validLevels.join(', ')}`;
    }
  }

  // Validate status
  const validStatuses = ['active', 'paused', 'mastered', 'archived'];
  if (data.status !== undefined && data.status !== null) {
    if (!validStatuses.includes(data.status)) {
      errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  // Validate startedAt
  if (data.startedAt !== undefined && data.startedAt !== null) {
    const startedAt = new Date(data.startedAt);
    if (isNaN(startedAt.getTime())) {
      errors.startedAt = 'Started at must be a valid date';
    }
  }

  // Validate targetDate
  if (data.targetDate !== undefined && data.targetTargetDate !== null) {
    const targetDate = new Date(data.targetDate);
    if (isNaN(targetDate.getTime())) {
      errors.targetDate = 'Target date must be a valid date';
    }
  }

  // Validate date range consistency
  if (data.startedAt !== undefined && data.targetDate !== undefined && data.startedAt !== null && data.targetDate !== null) {
    const startedAt = new Date(data.startedAt);
    const targetDate = new Date(data.targetDate);
    if (!isNaN(startedAt.getTime()) && !isNaN(targetDate.getTime()) && targetDate < startedAt) {
      errors.targetDate = 'Target date must be on or after started at';
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

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateLearningSession = (data) => {
  const errors = {};

  // Validate skill (ObjectId)
  if (!data.skill || !isValidObjectId(data.skill)) {
    errors.skill = 'Skill ID is required and must be a valid ObjectId';
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

  // Validate sessionType
  const validSessionTypes = ['study', 'practice', 'course', 'tutorial', 'reading', 'project_application', 'review', 'other'];
  if (data.sessionType !== undefined && data.sessionType !== null) {
    if (!validSessionTypes.includes(data.sessionType)) {
      errors.sessionType = `Session type must be one of: ${validSessionTypes.join(', ')}`;
    }
  }

  // Validate durationMinutes
  if (data.durationMinutes !== undefined && data.durationMinutes !== null) {
    if (!Number.isInteger(data.durationMinutes) || data.durationMinutes < 0) {
      errors.durationMinutes = 'Duration minutes must be a non-negative integer';
    }
    // Also check for unreasonably large values (more than 24 hours)
    if (data.durationMinutes > 24 * 60) {
      errors.durationMinutes = 'Duration minutes cannot exceed 24 hours (1440 minutes)';
    }
  }

  // Validate resource fields
  if (data.resource) {
    if (data.resource.resourceType !== undefined && data.resource.resourceType !== null) {
      const validResourceTypes = ['course', 'video', 'book', 'article', 'documentation', 'mentor', 'practice', 'other'];
      if (!validResourceTypes.includes(data.resource.resourceType)) {
        errors.resource = { resourceType: `Resource type must be one of: ${validResourceTypes.join(', ')}` };
      }
    }

    if (data.resource.resourceTitle !== undefined && data.resource.resourceTitle !== null) {
      if (typeof data.resource.resourceTitle !== 'string') {
        errors.resource = { ...(errors.resource || {}), resourceTitle: 'Resource title must be a string' };
      } else if (data.resource.resourceTitle.length > 200) {
        errors.resource = { ...(errors.resource || {}), resourceTitle: 'Resource title must not exceed 200 characters' };
      }
    }

    if (data.resource.resourceUrl !== undefined && data.resource.resourceUrl !== null) {
      if (typeof data.resource.resourceUrl !== 'string') {
        errors.resource = { ...(errors.resource || {}), resourceUrl: 'Resource URL must be a string' };
      }
    }
  }

  // Validate topics
  if (data.topics !== undefined && data.topics !== null) {
    if (!Array.isArray(data.topics)) {
      errors.topics = 'Topics must be an array';
    } else {
      // Validate each topic
      data.topics.forEach((topic, index) => {
        if (typeof topic !== 'string') {
          errors.topics = { ...(errors.topics || {}), [index]: 'Each topic must be a string' };
        } else if (topic.trim() === '') {
          errors.topics = { ...(errors.topics || {}), [index]: 'Topic must not be empty' };
        } else if (topic.length > 100) {
          errors.topics = { ...(errors.topics || {}), [index]: 'Topic must not exceed 100 characters' };
        }
      });
    }
  }

  // Validate confidenceBefore
  if (data.confidenceBefore !== undefined && data.confidenceBefore !== null) {
    if (!Number.isInteger(data.confidenceBefore) || data.confidenceBefore < 1 || data.confidenceBefore > 5) {
      errors.confidenceBefore = 'Confidence before must be an integer between 1 and 5';
    }
  }

  // Validate confidenceAfter
  if (data.confidenceAfter !== undefined && data.confidenceAfter !== null) {
    if (!Number.isInteger(data.confidenceAfter) || data.confidenceAfter < 1 || data.confidenceAfter > 5) {
      errors.confidenceAfter = 'Confidence after must be an integer between 1 and 5';
    }
  }

  // Validate takeaway
  if (data.takeaway !== undefined && data.takeaway !== null) {
    if (typeof data.takeaway !== 'string') {
      errors.takeaway = 'Takeaway must be a string';
    } else if (data.takeaway.length > 500) {
      errors.takeaway = 'Takeaway must not exceed 500 characters';
    }
  }

  // Validate difficulty
  if (data.difficulty !== undefined && data.difficulty !== null) {
    if (!Number.isInteger(data.difficulty) || data.difficulty < 1 || data.difficulty > 5) {
      errors.difficulty = 'Difficulty must be an integer between 1 and 5';
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

  // Validate ObjectIds for optional relationships
  const idFields = ['workSession', 'project', 'task'];
  idFields.forEach(field => {
    if (data[field] && !isValidObjectId(data[field])) {
      errors[field] = `${field} must be a valid ObjectId`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateLearningSessionUpdate = (data) => {
  const errors = {};

  // Prevent updating protected fields
  const protectedFields = ['user', 'skill', '_id', 'createdAt', 'updatedAt'];
  protectedFields.forEach(field => {
    if (data[field] !== undefined) {
      errors[field] = `${field} cannot be updated directly`;
    }
  });

  // Validate date
  if (data.date !== undefined && data.date !== null) {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      errors.date = 'Date must be a valid date';
    }
  }

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

  // Validate sessionType
  const validSessionTypes = ['study', 'practice', 'course', 'tutorial', 'reading', 'project_application', 'review', 'other'];
  if (data.sessionType !== undefined && data.sessionType !== null) {
    if (!validSessionTypes.includes(data.sessionType)) {
      errors.sessionType = `Session type must be one of: ${validSessionTypes.join(', ')}`;
    }
  }

  // Validate durationMinutes
  if (data.durationMinutes !== undefined && data.durationMinutes !== null) {
    if (!Number.isInteger(data.durationMinutes) || data.durationMinutes < 0) {
      errors.durationMinutes = 'Duration minutes must be a non-negative integer';
    }
    // Also check for unreasonably large values (more than 24 hours)
    if (data.durationMinutes > 24 * 60) {
      errors.durationMinutes = 'Duration minutes cannot exceed 24 hours (1440 minutes)';
    }
  }

  // Validate resource fields
  if (data.resource) {
    if (data.resource.resourceType !== undefined && data.resource.resourceType !== null) {
      const validResourceTypes = ['course', 'video', 'book', 'article', 'documentation', 'mentor', 'practice', 'other'];
      if (!validResourceTypes.includes(data.resource.resourceType)) {
        errors.resource = { resourceType: `Resource type must be one of: ${validResourceTypes.join(', ')}` };
      }
    }

    if (data.resource.resourceTitle !== undefined && data.resource.resourceTitle !== null) {
      if (typeof data.resource.resourceTitle !== 'string') {
        errors.resource = { ...(errors.resource || {}), resourceTitle: 'Resource title must be a string' };
      } else if (data.resource.resourceTitle.length > 200) {
        errors.resource = { ...(errors.resource || {}), resourceTitle: 'Resource title must not exceed 200 characters' };
      }
    }

    if (data.resource.resourceUrl !== undefined && data.resource.resourceUrl !== null) {
      if (typeof data.resource.resourceUrl !== 'string') {
        errors.resource = { ...(errors.resource || {}), resourceUrl: 'Resource URL must be a string' };
      }
    }
  }

  // Validate topics
  if (data.topics !== undefined && data.topics !== null) {
    if (!Array.isArray(data.topics)) {
      errors.topics = 'Topics must be an array';
    } else {
      // Validate each topic
      data.topics.forEach((topic, index) => {
        if (typeof topic !== 'string') {
          errors.topics = { ...(errors.topics || {}), [index]: 'Each topic must be a string' };
        } else if (topic.trim() === '') {
          errors.topics = { ...(errors.topics || {}), [index]: 'Topic must not be empty' };
        } else if (topic.length > 100) {
          errors.topics = { ...(errors.topics || {}), [index]: 'Topic must not exceed 100 characters' };
        }
      });
    }
  }

  // Validate confidenceBefore
  if (data.confidenceBefore !== undefined && data.confidenceBefore !== null) {
    if (!Number.isInteger(data.confidenceBefore) || data.confidenceBefore < 1 || data.confidenceBefore > 5) {
      errors.confidenceBefore = 'Confidence before must be an integer between 1 and 5';
    }
  }

  // Validate confidenceAfter
  if (data.confidenceAfter !== undefined && data.confidenceAfter !== null) {
    if (!Number.isInteger(data.confidenceAfter) || data.confidenceAfter < 1 || data.confidenceAfter > 5) {
      errors.confidenceAfter = 'Confidence after must be an integer between 1 and 5';
    }
  }

  // Validate takeaway
  if (data.takeaway !== undefined && data.takeaway !== null) {
    if (typeof data.takeaway !== 'string') {
      errors.takeaway = 'Takeaway must be a string';
    } else if (data.takeaway.length > 500) {
      errors.takeaway = 'Takeaway must not exceed 500 characters';
    }
  }

  // Validate difficulty
  if (data.difficulty !== undefined && data.difficulty !== null) {
    if (!Number.isInteger(data.difficulty) || data.difficulty < 1 || data.difficulty > 5) {
      errors.difficulty = 'Difficulty must be an integer between 1 and 5';
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

  // Validate ObjectIds for optional relationships
  const idFields = ['workSession', 'project', 'task'];
  idFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && !isValidObjectId(data[field])) {
      errors[field] = `${field} must be a valid ObjectId`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateSkill,
  validateSkillUpdate,
  validateLearningSession,
  validateLearningSessionUpdate
};