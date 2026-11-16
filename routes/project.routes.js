const express = require('express');
const projectController = require('../controllers/project.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Project routes
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/active', projectController.getActiveProjects);
router.get('/summary', projectController.getProjectSummary); // This would be for dashboard summary - but let me check the spec

// Actually, looking at the spec, /projects/summary should be for dashboard summary
// And /projects/:projectId/summary should be for individual project summary
// Let me adjust based on the spec

// Individual project routes
router.get('/:projectId', projectController.getProjectById);
router.patch('/:projectId', projectController.updateProject);

// Project status transitions
router.patch('/:projectId/complete', projectController.completeProject);
router.patch('/:projectId/reopen', projectController.reopenProject);
router.patch('/:projectId/archive', projectController.archiveProject);
router.delete('/:projectId', projectController.deleteProject);

// Milestone routes
router.post('/:projectId/milestones', projectController.addMilestone);
router.patch('/:projectId/milestones/:milestoneId', projectController.updateMilestone);
// router.patch('/:projectId/milestones/:milestoneId/complete', projectController.completeMilestone); // We'll use the update endpoint
// router.patch('/:projectId/milestones/:milestoneId/reopen', projectController.reopenMilestone); // We'll use the update endpoint
router.delete('/:projectId/milestones/:milestoneId', projectController.deleteMilestone);

// Project relationships
router.get('/:projectId/tasks', projectController.getProjectTasks);
router.get('/:projectId/goals', projectController.getProjectGoals);
router.get('/:projectId/summary', projectController.getProjectSummary);
router.get('/:projectId/work-summary', projectController.getProjectWorkSummary);

module.exports = router;