const LearningSession = require('../models/learningSession.model');
const Skill = require('../models/skill.model');
const WorkSession = require('../models/workSession.model');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const { validateLearningSession, validateLearningSessionUpdate } = require('../validators/skill.validator');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const learningSessionService = {};

// Create a new learning session
learningSessionService.createLearningSession = async (userId, skillId, sessionData) => {
  // Validate input
  const { isValid, errors } = validateLearningSession(sessionData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Verify skill ownership
  const skill = await Skill.findOne({ _id: skillId, user: userId });
  if (!skill) {
    const error = new Error('Skill not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  // Validate workSession ownership if provided
  if (sessionData.workSession) {
    if (!mongoose.Types.ObjectId.isValid(sessionData.workSession)) {
      const error = new Error('Invalid work session ID');
      error.statusCode = 400;
      throw error;
    }

    const workSession = await WorkSession.findOne({ _id: sessionData.workSession, user: userId });
    if (!workSession) {
      const error = new Error('Work session not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  // Validate project ownership if provided
  if (sessionData.project) {
    if (!mongoose.Types.ObjectId.isValid(sessionData.project)) {
      const error = new Error('Invalid project ID');
      error.statusCode = 400;
      throw error;
    }

    const project = await Project.findOne({ _id: sessionData.project, user: userId });
    if (!project) {
      const error = new Error('Project not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  // Validate task ownership if provided
  if (sessionData.task) {
    if (!mongoose.Types.ObjectId.isValid(sessionData.task)) {
      const error = new Error('Invalid task ID');
      error.statusCode = 400;
      throw error;
    }

    const task = await Task.findOne({ _id: sessionData.task, user: userId });
    if (!task) {
      const error = new Error('Task not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    // Validate cross-resource consistency: if both task and project are provided, task must belong to project
    if (sessionData.task && sessionData.project) {
      const task = await Task.findOne({ _id: sessionData.task });
      if (task && task.project && task.project.toString() !== sessionData.project.toString()) {
        const error = new Error('Task does not belong to the specified project');
        error.statusCode = 400;
        throw error;
      }
    }
  }

  // Create learning session with user ID and skill ID from authenticated user (never from client)
  const learningSession = new LearningSession({
    ...sessionData,
    user: userId,
    skill: skillId
  });

  // Save to database
  const savedLearningSession = await learningSession.save();
  return savedLearningSession;
};

// Get all learning sessions for a skill with optional filtering
learningSessionService.getLearningSessions = async (userId, skillId, filters = {}) => {
  // Validate skillId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    const error = new Error('Invalid skill ID');
    error.statusCode = 400;
    throw error;
  }

  // Verify skill ownership
  const skill = await Skill.findOne({ _id: skillId, user: userId });
  if (!skill) {
    const error = new Error('Skill not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  // Build query - always include user ID and skill ID for ownership protection
  const query = { user: userId, skill: skillId };

  // Add optional filters
  if (filters.from) {
    const fromDate = new Date(filters.from);
    if (!isNaN(fromDate.getTime())) {
      query.date = { $gte: fromDate };
    }
  }

  if (filters.to) {
    const toDate = new Date(filters.to);
    if (!isNaN(toDate.getTime())) {
      if (!query.date) query.date = {};
      query.date.$lte = toDate;
    }
  }

  if (filters.sessionType) {
    query.sessionType = filters.sessionType;
  }

  // Execute query - sort by date descending (newest first)
  const sessions = await LearningSession.find(query).sort({ date: -1 });
  return sessions;
};

// Get a single learning session by ID with ownership check
learningSessionService.getLearningSessionById = async (userId, skillId, sessionId) => {
  // Validate IDs are valid MongoDB ObjectIds
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    const error = new Error('Invalid skill ID');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('Invalid session ID');
    error.statusCode = 400;
    throw error;
  }

  // Verify skill ownership
  const skill = await Skill.findOne({ _id: skillId, user: userId });
  if (!skill) {
    const error = new Error('Skill not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  // Find learning session with ownership check and skill relationship
  const session = await LearningSession.findOne({ _id: sessionId, user: userId, skill: skillId });

  if (!session) {
    const error = new Error('Learning session not found');
    error.statusCode = 404;
    throw error;
  }

  return session;
};

// Update a learning session by ID
learningSessionService.updateLearningSession = async (userId, skillId, sessionId, updateData) => {
  // Validate IDs are valid MongoDB ObjectIds
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    const error = new Error('Invalid skill ID');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('Invalid session ID');
    error.statusCode = 400;
    throw error;
  }

  // Verify skill ownership
  const skill = await Skill.findOne({ _id: skillId, user: userId });
  if (!skill) {
    const error = new Error('Skill not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  // Validate input (excluding protected fields)
  const { isValid, errors } = validateLearningSessionUpdate(updateData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Validate workSession ownership if provided
  if (updateData.workSession) {
    if (!mongoose.Types.ObjectId.isValid(updateData.workSession)) {
      const error = new Error('Invalid work session ID');
      error.statusCode = 400;
      throw error;
    }

    const workSession = await WorkSession.findOne({ _id: updateData.workSession, user: userId });
    if (!workSession) {
      const error = new Error('Work session not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  // Validate project ownership if provided
  if (updateData.project) {
    if (!mongoose.Types.ObjectId.isValid(updateData.project)) {
      const error = new Error('Invalid project ID');
      error.statusCode = 400;
      throw error;
    }

    const project = await Project.findOne({ _id: updateData.project, user: userId });
    if (!project) {
      const error = new Error('Project not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  // Validate task ownership if provided
  if (updateData.task) {
    if (!mongoose.Types.ObjectId.isValid(updateData.task)) {
      const error = new Error('Invalid task ID');
      error.statusCode = 400;
      throw error;
    }

    const task = await Task.findOne({ _id: updateData.task, user: userId });
    if (!task) {
      const error = new Error('Task not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    // Validate cross-resource consistency: if both task and project are provided, task must belong to project
    if (updateData.task && updateData.project) {
      const task = await Task.findOne({ _id: updateData.task });
      if (task && task.project && task.project.toString() !== updateData.project.toString()) {
        const error = new Error('Task does not belong to the specified project');
        error.statusCode = 400;
        throw error;
      }
    }
  }

  // Find learning session with ownership check and update
  const session = await LearningSession.findOneAndUpdate(
    { _id: sessionId, user: userId, skill: skillId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!session) {
    const error = new Error('Learning session not found');
    error.statusCode = 404;
    throw error;
  }

  return session;
};

// Delete a learning session by ID
learningSessionService.deleteLearningSession = async (userId, skillId, sessionId) => {
  // Validate IDs are valid MongoDB ObjectIds
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    const error = new Error('Invalid skill ID');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('Invalid session ID');
    error.statusCode = 400;
    throw error;
  }

  // Verify skill ownership
  const skill = await Skill.findOne({ _id: skillId, user: userId });
  if (!skill) {
    const error = new Error('Skill not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  // Find learning session with ownership check and delete
  const session = await LearningSession.findOneAndDelete({ _id: sessionId, user: userId, skill: skillId });

  if (!session) {
    const error = new Error('Learning session not found');
    error.statusCode = 404;
    throw error;
  }

  return session;
};

module.exports = learningSessionService;