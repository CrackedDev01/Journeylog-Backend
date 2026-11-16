const express = require('express');
const weeklyPlanController = require('../controllers/weeklyPlan.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Weekly plan routes
router.post('/', weeklyPlanController.createPlan);
router.get('/', weeklyPlanController.getPlans);
router.get('/current', weeklyPlanController.getCurrentPlan);
router.get('/:planId', weeklyPlanController.getPlanById);
router.patch('/:planId', weeklyPlanController.updatePlan);
router.delete('/:planId', weeklyPlanController.deletePlan);

// Commitment routes
router.post('/:planId/commitments', weeklyPlanController.addCommitment);
router.patch('/:planId/commitments/:commitmentId', weeklyPlanController.updateCommitment);
router.delete('/:planId/commitments/:commitmentId', weeklyPlanController.removeCommitment);

// Summary route
router.get('/:planId/summary', weeklyPlanController.getPlanSummary);

module.exports = router;