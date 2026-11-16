const dailyPlanService = require('../services/dailyPlan.service');
const asyncHandler = require('../utils/asyncHandler');

const dailyPlanController = {};

// Create a new daily plan
dailyPlanController.createPlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planData = req.body;

  const plan = await dailyPlanService.createPlan(userId, planData);

  res.status(201).json({
    success: true,
    message: 'Daily plan created successfully',
    data: {
      plan
    }
  });
});

// Get all daily plans for the authenticated user
dailyPlanController.getPlans = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = req.query;

  const plans = await dailyPlanService.getPlans(userId, filters);

  res.status(200).json({
    success: true,
    data: {
      plans
    }
  });
});

// Get today's daily plan
dailyPlanController.getTodayPlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.user.timezone || 'UTC';

  const plan = await dailyPlanService.getTodayPlan(userId, timezone);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'No daily plan found for today'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      plan
    }
  });
});

// Get daily plan by date
dailyPlanController.getPlanByDate = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const dateString = req.params.date;

  const plan = await dailyPlanService.getPlanByDate(userId, dateString);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: `No daily plan found for date: ${dateString}`
    });
  }

  res.status(200).json({
    success: true,
    data: {
      plan
    }
  });
});

// Get a specific daily plan by ID
dailyPlanController.getPlanById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;

  const plan = await dailyPlanService.getPlanById(userId, planId);

  res.status(200).json({
    success: true,
    data: {
      plan
    }
  });
});

// Update a daily plan by ID
dailyPlanController.updatePlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;
  const updateData = req.body;

  const plan = await dailyPlanService.updatePlan(userId, planId, updateData);

  res.status(200).json({
    success: true,
    message: 'Daily plan updated successfully',
    data: {
      plan
    }
  });
});

// Delete a daily plan by ID
dailyPlanController.deletePlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;

  await dailyPlanService.deletePlan(userId, planId);

  res.status(200).json({
    success: true,
    message: 'Daily plan deleted successfully'
  });
});

// Get daily plan summary
dailyPlanController.getPlanSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;

  const summary = await dailyPlanService.getPlanSummary(userId, planId);

  res.status(200).json({
    success: true,
    data: {
      summary
    }
  });
});

module.exports = dailyPlanController;