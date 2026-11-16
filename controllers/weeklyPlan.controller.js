const weeklyPlanService = require('../services/weeklyPlan.service');
const asyncHandler = require('../utils/asyncHandler');

const weeklyPlanController = {};

// Create a new weekly plan
weeklyPlanController.createPlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planData = req.body;

  const plan = await weeklyPlanService.createPlan(userId, planData);

  res.status(201).json({
    success: true,
    message: 'Weekly plan created successfully',
    data: {
      plan
    }
  });
});

// Get all weekly plans for the authenticated user
weeklyPlanController.getPlans = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = req.query;

  const plans = await weeklyPlanService.getPlans(userId, filters);

  res.status(200).json({
    success: true,
    data: {
      plans
    }
  });
});

// Get current week's plan
weeklyPlanController.getCurrentPlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get timezone from user (would come from user model in real implementation)
  const timezone = req.user.timezone || 'UTC';

  const plan = await weeklyPlanService.getCurrentWeekPlan(userId, timezone);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'No weekly plan found for current week'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      plan
    }
  });
});

// Get a specific weekly plan by ID
weeklyPlanController.getPlanById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;

  const plan = await weeklyPlanService.getPlanById(userId, planId);

  res.status(200).json({
    success: true,
    data: {
      plan
    }
  });
});

// Update a weekly plan by ID
weeklyPlanController.updatePlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;
  const updateData = req.body;

  const plan = await weeklyPlanService.updatePlan(userId, planId, updateData);

  res.status(200).json({
    success: true,
    message: 'Weekly plan updated successfully',
    data: {
      plan
    }
  });
});

// Delete a weekly plan by ID
weeklyPlanController.deletePlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;

  await weeklyPlanService.deletePlan(userId, planId);

  res.status(200).json({
    success: true,
    message: 'Weekly plan deleted successfully'
  });
});

// Add a commitment to a weekly plan
weeklyPlanController.addCommitment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;
  const commitmentData = req.body;

  const plan = await weeklyPlanService.addCommitment(userId, planId, commitmentData);

  res.status(200).json({
    success: true,
    message: 'Commitment added successfully',
    data: {
      plan
    }
  });
});

// Update a commitment in a weekly plan
weeklyPlanController.updateCommitment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;
  const commitmentId = req.params.commitmentId;
  const updateData = req.body;

  const plan = await weeklyPlanService.updateCommitment(userId, planId, commitmentId, updateData);

  res.status(200).json({
    success: true,
    message: 'Commitment updated successfully',
    data: {
      plan
    }
  });
});

// Remove a commitment from a weekly plan
weeklyPlanController.removeCommitment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;
  const commitmentId = req.params.commitmentId;

  const plan = await weeklyPlanService.removeCommitment(userId, planId, commitmentId);

  res.status(200).json({
    success: true,
    message: 'Commitment removed successfully',
    data: {
      plan
    }
  });
});

// Get weekly plan summary
weeklyPlanController.getPlanSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const planId = req.params.planId;

  const summary = await weeklyPlanService.getPlanSummary(userId, planId);

  res.status(200).json({
    success: true,
    data: {
      summary
    }
  });
});

module.exports = weeklyPlanController;