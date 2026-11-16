const express = require('express');
const router = express.Router();

const {
  getDashboardOverview,
  getTodayDashboard,
  getWeekDashboard,
  getMonthDashboard,
  getProjectsOverview,
  getHabitsOverview,
  getLearningOverview,
  getReviewsOverview,
  getInsights,
  getRecentActivity
} = require('../controllers/dashboard.controller');

const { protect } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(protect);

// Main dashboard endpoints
router.get('/', getDashboardOverview);
router.get('/today', getTodayDashboard);
router.get('/week', getWeekDashboard);
router.get('/month', getMonthDashboard);

// Overview endpoints
router.get('/projects', getProjectsOverview);
router.get('/habits', getHabitsOverview);
router.get('/learning', getLearningOverview);
router.get('/reviews', getReviewsOverview);

// Insights and activity endpoints
router.get('/insights', getInsights);
router.get('/activity', getRecentActivity);

module.exports = router;