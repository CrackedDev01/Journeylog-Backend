const express = require('express');
const goalController = require('../controllers/goal.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Goal routes
router.post('/', goalController.createGoal);
router.get('/', goalController.getGoals);
router.get('/summary', goalController.getGoalSummary);
router.get('/:goalId', goalController.getGoalById);
router.patch('/:goalId', goalController.updateGoal);
router.delete('/:goalId', goalController.deleteGoal);

// Progress update route
router.patch('/:goalId/progress', goalController.updateGoalProgress);

// Milestone routes
router.post('/:goalId/milestones', goalController.addMilestone);
router.patch('/:goalId/milestones/:milestoneId', goalController.updateMilestone);
router.delete('/:goalId/milestones/:milestoneId', goalController.deleteMilestone);

module.exports = router;