const express = require('express');
const dailyPlanController = require('../controllers/dailyPlan.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Daily plan routes
router.post('/', dailyPlanController.createPlan);
router.get('/', dailyPlanController.getPlans);
router.get('/today', dailyPlanController.getTodayPlan);
router.get('/date/:date', dailyPlanController.getPlanByDate);
router.get('/:planId', dailyPlanController.getPlanById);
router.patch('/:planId', dailyPlanController.updatePlan);
router.delete('/:planId', dailyPlanController.deletePlan);
router.get('/:planId/summary', dailyPlanController.getPlanSummary);

module.exports = router;