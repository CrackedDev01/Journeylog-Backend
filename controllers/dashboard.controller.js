const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

// Get main dashboard overview
const getDashboardOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getOverview(req.user._id);
  res.json({
    success: true,
    message: 'Dashboard overview retrieved successfully',
    data: overview.data
  });
});

// Get today's dashboard
const getTodayDashboard = asyncHandler(async (req, res) => {
  const todayData = await dashboardService.getTodayDashboard(req.user._id);
  res.json({
    success: true,
    message: 'Today dashboard retrieved successfully',
    data: todayData.data
  });
});

// Get week dashboard
const getWeekDashboard = asyncHandler(async (req, res) => {
  const weekData = await dashboardService.getWeekDashboard(req.user._id);
  res.json({
    success: true,
    message: 'Week dashboard retrieved successfully',
    data: weekData.data
  });
});

// Get month dashboard
const getMonthDashboard = asyncHandler(async (req, res) => {
  const monthData = await dashboardService.getMonthDashboard(req.user._id);
  res.json({
    success: true,
    message: 'Month dashboard retrieved successfully',
    data: monthData.data
  });
});

// Get projects overview
const getProjectsOverview = asyncHandler(async (req, res) => {
  const projectsData = await dashboardService.getProjectsOverview(req.user._id);
  res.json({
    success: true,
    message: 'Projects overview retrieved successfully',
    data: projectsData.data
  });
});

// Get habits overview
const getHabitsOverview = asyncHandler(async (req, res) => {
  const habitsData = await dashboardService.getHabitsOverview(req.user._id);
  res.json({
    success: true,
    message: 'Habits overview retrieved successfully',
    data: habitsData.data
  });
});

// Get learning overview
const getLearningOverview = asyncHandler(async (req, res) => {
  const learningData = await dashboardService.getLearningOverview(req.user._id);
  res.json({
    success: true,
    message: 'Learning overview retrieved successfully',
    data: learningData.data
  });
});

// Get reviews overview
const getReviewsOverview = asyncHandler(async (req, res) => {
  const reviewsData = await dashboardService.getReviewsOverview(req.user._id);
  res.json({
    success: true,
    message: 'Reviews overview retrieved successfully',
    data: reviewsData.data
  });
});

// Get insights
const getInsights = asyncHandler(async (req, res) => {
  const insightsData = await dashboardService.getInsights(req.user._id);
  res.json({
    success: true,
    message: 'Insights retrieved successfully',
    data: insightsData.data
  });
});

// Get recent activity
const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const activityData = await dashboardService.getRecentActivity(req.user._id, limit);
  res.json({
    success: true,
    message: 'Recent activity retrieved successfully',
    data: activityData.data
  });
});

module.exports = {
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
};