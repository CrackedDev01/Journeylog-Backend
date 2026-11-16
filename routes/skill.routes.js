const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/skill.controller');
const { protect } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(protect);

// Skill routes
router.post('/', createSkill);
router.get('/', getSkills);
router.get('/active', getActiveSkills);
router.get('/recent', getRecentLearning);
router.get('/summary', getSkillDashboardSummary);

// Skill specific routes
router.get('/:skillId', getSkillById);
router.patch('/:skillId', updateSkill);
router.delete('/:skillId', archiveSkill); // Using archive instead of delete for soft delete
router.patch('/:skillId/archive', archiveSkill);
router.patch('/:skillId/master', masterSkill);
router.patch('/:skillId/level', updateSkillLevel);
router.get('/:skillId/stats', getSkillStats);

// Learning session routes
router.post('/:skillId/sessions', createLearningSession);
router.get('/:skillId/sessions', getLearningSessions);
router.get('/:skillId/sessions/:sessionId', getLearningSessionById);
router.patch('/:skillId/sessions/:sessionId', updateLearningSession);
router.delete('/:skillId/sessions/:sessionId', deleteLearningSession);

module.exports = router;