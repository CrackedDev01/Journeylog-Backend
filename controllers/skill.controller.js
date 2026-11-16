const skillService = require('../services/skill.service');
const learningSessionService = require('../services/learningSession.service');
const asyncHandler = require('../utils/asyncHandler');

// Create a new skill
const createSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.createSkill(req.user._id, req.body);
  res.status(201).json({
    success: true,
    message: 'Skill created successfully',
    data: { skill }
  });
});

// Get all skills for a user
const getSkills = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.category) filters.category = req.query.category;
  if (req.query.currentLevel) filters.currentLevel = req.query.currentLevel;

  const skills = await skillService.getSkills(req.user._id, filters);
  res.json({
    success: true,
    message: 'Skills retrieved successfully',
    data: { skills }
  });
});

// Get active skills for a user
const getActiveSkills = asyncHandler(async (req, res) => {
  const skills = await skillService.getActiveSkills(req.user._id);
  res.json({
    success: true,
    message: 'Active skills retrieved successfully',
    data: { skills }
  });
});

// Get a single skill by ID
const getSkillById = asyncHandler(async (req, res) => {
  const skill = await skillService.getSkillById(req.user._id, req.params.skillId);
  res.json({
    success: true,
    message: 'Skill retrieved successfully',
    data: { skill }
  });
});

// Update a skill by ID
const updateSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.updateSkill(req.user._id, req.params.skillId, req.body);
  res.json({
    success: true,
    message: 'Skill updated successfully',
    data: { skill }
  });
});

// Archive a skill
const archiveSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.archiveSkill(req.user._id, req.params.skillId);
  res.json({
    success: true,
    message: 'Skill archived successfully',
    data: { skill }
  });
});

// Mark skill as mastered
const masterSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.masterSkill(req.user._id, req.params.skillId);
  res.json({
    success: true,
    message: 'Skill marked as mastered successfully',
    data: { skill }
  });
});

// Update skill level
const updateSkillLevel = asyncHandler(async (req, res) => {
  const skill = await skillService.updateSkillLevel(req.user._id, req.params.skillId, req.body);
  res.json({
    success: true,
    message: 'Skill level updated successfully',
    data: { skill }
  });
});

// Get skill statistics
const getSkillStats = asyncHandler(async (req, res) => {
  const stats = await skillService.getSkillStats(req.user._id, req.params.skillId);
  res.json({
    success: true,
    message: 'Skill statistics retrieved successfully',
    data: { stats }
  });
});

// Create a new learning session for a skill
const createLearningSession = asyncHandler(async (req, res) => {
  const session = await learningSessionService.createLearningSession(
    req.user._id,
    req.params.skillId,
    req.body
  );
  res.status(201).json({
    success: true,
    message: 'Learning session created successfully',
    data: { session }
  });
});

// Get all learning sessions for a skill
const getLearningSessions = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.from) filters.from = req.query.from;
  if (req.query.to) filters.to = req.query.to;
  if (req.query.sessionType) filters.sessionType = req.query.sessionType;

  const sessions = await learningSessionService.getLearningSessions(
    req.user._id,
    req.params.skillId,
    filters
  );
  res.json({
    success: true,
    message: 'Learning sessions retrieved successfully',
    data: { sessions }
  });
});

// Get a single learning session by ID
const getLearningSessionById = asyncHandler(async (req, res) => {
  const session = await learningSessionService.getLearningSessionById(
    req.user._id,
    req.params.skillId,
    req.params.sessionId
  );
  res.json({
    success: true,
    message: 'Learning session retrieved successfully',
    data: { session }
  });
});

// Update a learning session by ID
const updateLearningSession = asyncHandler(async (req, res) => {
  const session = await learningSessionService.updateLearningSession(
    req.user._id,
    req.params.skillId,
    req.params.sessionId,
    req.body
  );
  res.json({
    success: true,
    message: 'Learning session updated successfully',
    data: { session }
  });
});

// Delete a learning session by ID
const deleteLearningSession = asyncHandler(async (req, res) => {
  await learningSessionService.deleteLearningSession(
    req.user._id,
    req.params.skillId,
    req.params.sessionId
  );
  res.json({
    success: true,
    message: 'Learning session deleted successfully'
  });
});

// Get recent learning sessions across all skills
const getRecentLearning = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const sessions = await skillService.getRecentLearning(req.user._id, limit);
  res.json({
    success: true,
    message: 'Recent learning retrieved successfully',
    data: { sessions }
  });
});

// Get skill dashboard summary
const getSkillDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await skillService.getSkillDashboardSummary(req.user._id);
  res.json({
    success: true,
    message: 'Skill dashboard summary retrieved successfully',
    data: { summary }
  });
});

module.exports = {
  createSkill,
  getSkills,
  getActiveSkills,
  getSkillById,
  updateSkill,
  archiveSkill,
  masterSkill,
  updateSkillLevel,
  getSkillStats,
  createLearningSession,
  getLearningSessions,
  getLearningSessionById,
  updateLearningSession,
  deleteLearningSession,
  getRecentLearning,
  getSkillDashboardSummary
};