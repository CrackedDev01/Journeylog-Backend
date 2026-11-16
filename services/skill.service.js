const Skill = require('../models/skill.model');
const LearningSession = require('../models/learningSession.model');
const { validateSkill, validateSkillUpdate } = require('../validators/skill.validator');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const skillService = {};

// Create a new skill
skillService.createSkill = async (userId, skillData) => {
  // Validate input
  const { isValid, errors } = validateSkill(skillData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Create skill with user ID from authenticated user (never from client)
  const skill = new Skill({
    ...skillData,
    user: userId
  });

  // Save to database
  const savedSkill = await skill.save();
  return savedSkill;
};

// Get all skills for a user with optional filtering
skillService.getSkills = async (userId, filters = {}) => {
  // Build query - always include user ID for ownership protection
  const query = { user: userId };

  // Add optional filters
  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.currentLevel) {
    query.currentLevel = filters.currentLevel;
  }

  // Execute query - sort by name ascending
  const skills = await Skill.find(query).sort({ name: 1 });
  return skills;
};

// Get active skills for a user
skillService.getActiveSkills = async (userId) => {
  const skills = await Skill.find({ user: userId, status: 'active' }).sort({ name: 1 });
  return skills;
};

// Get a single skill by ID with ownership check
skillService.getSkillById = async (userId, skillId) => {
  // Validate skillId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    const error = new Error('Invalid skill ID');
    error.statusCode = 400;
    throw error;
  }

  // Find skill with ownership check
  const skill = await Skill.findOne({ _id: skillId, user: userId });

  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  return skill;
};

// Update a skill by ID
skillService.updateSkill = async (userId, skillId, updateData) => {
  // Validate skillId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    const error = new Error('Invalid skill ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate input (excluding protected fields)
  const { isValid, errors } = validateSkillUpdate(updateData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Find skill with ownership check and update
  const skill = await Skill.findOneAndUpdate(
    { _id: skillId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  return skill;
};

// Archive a skill
skillService.archiveSkill = async (userId, skillId) => {
  // Validate skillId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    const error = new Error('Invalid skill ID');
    error.statusCode = 400;
    throw error;
  }

  // Find skill with ownership check and update
  const skill = await Skill.findOneAndUpdate(
    { _id: skillId, user: userId },
    { $set: { status: 'archived' } },
    { new: true, runValidators: true }
  );

  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  return skill;
};

// Mark skill as mastered
skillService.masterSkill = async (userId, skillId) => {
  // Validate skillId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    const error = new Error('Invalid skill ID');
    error.statusCode = 400;
    throw error;
  }

  // Find skill with ownership check and update
  const skill = await Skill.findOneAndUpdate(
    { _id: skillId, user: userId },
    { $set: { status: 'mastered' } },
    { new: true, runValidators: true }
  );

  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  return skill;
};

// Update skill level
skillService.updateSkillLevel = async (userId, skillId, levelData) => {
  // Validate skillId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    const error = new Error('Invalid skill ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate level data
  const validLevels = ['beginner', 'foundational', 'intermediate', 'advanced', 'expert'];
  const errors = {};

  if (levelData.currentLevel !== undefined && !validLevels.includes(levelData.currentLevel)) {
    errors.currentLevel = `Current level must be one of: ${validLevels.join(', ')}`;
  }

  if (levelData.targetLevel !== undefined && !validLevels.includes(levelData.targetLevel)) {
    errors.targetLevel = `Target level must be one of: ${validLevels.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Find skill with ownership check and update
  const skill = await Skill.findOneAndUpdate(
    { _id: skillId, user: userId },
    { $set: levelData },
    { new: true, runValidators: true }
  );

  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  return skill;
};

// Get skill statistics
skillService.getSkillStats = async (userId, skillId) => {
  // Validate skillId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    const error = new Error('Invalid skill ID');
    error.statusCode = 400;
    throw error;
  }

  // Verify skill ownership
  const skill = await Skill.findOne({ _Id: skillId, user: userId });
  if (!skill) {
    const error = new Error('Skill not found');
    error.statusCode = 404;
    throw error;
  }

  // Get learning sessions for this skill
  const sessions = await LearningSession.find({ user: userId, skill: skillId });

  // Calculate statistics
  let totalLearningMinutes = 0;
  let totalSessions = sessions.length;
  const practiceDates = new Set();
  let confidenceBeforeSum = 0;
  let confidenceAfterSum = 0;
  let confidenceCount = 0;
  const sessionTypeBreakdown = {};
  const topicCounts = {};

  sessions.forEach(session => {
    // Total learning minutes
    if (session.durationMinutes) {
      totalLearningMinutes += session.durationMinutes;
    }

    // Unique practice days
    if (session.date) {
      const dateKey = session.date.toISOString().split('T')[0]; // YYYY-MM-DD
      practiceDates.add(dateKey);
    }

    // Confidence ratings
    if (session.confidenceBefore !== null && session.confidenceBefore !== undefined) {
      confidenceBeforeSum += session.confidenceBefore;
      confidenceCount++;
    }

    if (session.confidenceAfter !== null && session.confidenceAfter !== undefined) {
      confidenceAfterSum += session.confidenceAfter;
      confidenceCount++;
    }

    // Session type breakdown
    if (session.sessionType) {
      sessionTypeBreakdown[session.sessionType] = (sessionTypeBreakdown[session.sessionType] || 0) + 1;
    }

    // Topic counts
    if (session.topics && Array.isArray(session.topics)) {
      session.topics.forEach(topic => {
        if (topic && typeof topic === 'string') {
          const trimmedTopic = topic.trim();
          if (trimmedTopic) {
            topicCounts[trimmedTopic] = (topicCounts[trimmedTopic] || 0) + 1;
          }
        }
      });
    }
  });

  const uniquePracticeDays = practiceDates.size;
  const averageSessionMinutes = totalSessions > 0 ? Math.round(totalLearningMinutes / totalSessions) : 0;
  const averageConfidenceBefore = confidenceCount > 0 ? Math.round((confidenceBeforeSum / confidenceCount) * 10) / 10 : null;
  const averageConfidenceAfter = confidenceCount > 0 ? Math.round((confidenceAfterSum / confidenceCount) * 10) / 10 : null;
  const averageConfidenceChange = averageConfidenceBefore !== null && averageConfidenceAfter !== null
    ? Math.round((averageConfidenceAfter - averageConfidenceBefore) * 10) / 10
    : null;

  // Calculate learning streak (consecutive calendar dates with at least one learning session)
  let currentLearningStreak = 0;
  let longestLearningStreak = 0;

  if (practiceDates.size > 0) {
    const sortedDates = Array.from(practiceDates).map(date => new Date(date)).sort((a, b) => a - b);

    let currentStreak = 0;
    let maxStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      const previousDate = i > 0 ? sortedDates[i - 1] : null;

      if (previousDate) {
        const timeDiff = currentDate.getTime() - previousDate.getTime();
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

        if (daysDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1; // Reset streak counter
        }
      } else {
        currentStreak = 1; // First date
      }

      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }

    currentLearningStreak = currentStreak;
    longestLearningStreak = maxStreak;
  }

  // Format topic counts for response
  const topicsCovered = Object.entries(topicCounts)
    .map(([topic, sessions]) => ({ topic, sessions }))
    .sort((a, b) => b.sessions - a.sessions);

  return {
    totalSessions,
    totalLearningMinutes,
    uniquePracticeDays,
    averageSessionMinutes,
    currentLearningStreak,
    longestLearningStreak,
    averageConfidenceBefore,
    averageConfidenceAfter,
    averageConfidenceChange,
    sessionTypeBreakdown,
    topicsCovered
  };
};

// Get recent learning sessions across all skills
skillService.getRecentLearning = async (userId, limit = 10) => {
  const sessions = await LearningSession.find({ user: userId })
    .sort({ date: -1 })
    .limit(limit)
    .populate('skill', 'name')
    .lean();

  return sessions.map(session => ({
    _id: session._id,
    skill: session.skill ? session.skill.name : 'Unknown Skill',
    title: session.title,
    date: session.date,
    durationMinutes: session.durationMinutes
  }));
};

// Get skill dashboard summary
skillService.getSkillDashboardSummary = async (userId) => {
  const skills = await Skill.find({ user: userId });

  const totalSkills = skills.length;
  const activeSkills = skills.filter(s => s.status === 'active').length;
  const pausedSkills = skills.filter(s => s.status === 'paused').length;
  const masteredSkills = skills.filter(s => s.status === 'mastered').length;

  return {
    totalSkills,
    activeSkills,
    pausedSkills,
    masteredSkills
  };
};

module.exports = skillService;