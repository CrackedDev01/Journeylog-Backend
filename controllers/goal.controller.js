const goalService = require('../services/goal.service');
const asyncHandler = require('../utils/asyncHandler');

const goalController = {};

// Create a new monthly goal
goalController.createGoal = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const goalData = req.body;

  const goal = await goalService.createGoal(userId, goalData);

  res.status(201).json({
    success: true,
    message: 'Goal created successfully',
    data: {
      goal
    }
  });
});

// Get all goals for the authenticated user
goalController.getGoals = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = req.query;

  // Convert numeric query parameters
  if (filters.month !== undefined) filters.month = parseInt(filters.month);
  if (filters.year !== undefined) filters.year = parseInt(filters.year);

  const goals = await goalService.getGoals(userId, filters);

  res.status(200).json({
    success: true,
    data: {
      goals
    }
  });
});

// Get a single goal by ID
goalController.getGoalById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const goalId = req.params.goalId;

  const goal = await goalService.getGoalById(userId, goalId);

  res.status(200).json({
    success: true,
    data: {
      goal
    }
  });
});

// Update a goal by ID
goalController.updateGoal = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const goalId = req.params.goalId;
  const updateData = req.body;

  const goal = await goalService.updateGoal(userId, goalId, updateData);

  res.status(200).json({
    success: true,
    message: 'Goal updated successfully',
    data: {
      goal
    }
  });
});

// Delete a goal by ID
goalController.deleteGoal = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const goalId = req.params.goalId;

  await goalService.deleteGoal(userId, goalId);

  res.status(200).json({
    success: true,
    message: 'Goal deleted successfully'
  });
});

// Update goal progress
goalController.updateGoalProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const goalId = req.params.goalId;
  const progressData = req.body;

  const goal = await goalService.updateGoalProgress(userId, goalId, progressData);

  res.status(200).json({
    success: true,
    message: 'Goal progress updated successfully',
    data: {
      goal
    }
  });
});

// Get goal summary
goalController.getGoalSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = req.query;

  // Convert numeric query parameters
  if (filters.month !== undefined) filters.month = parseInt(filters.month);
  if (filters.year !== undefined) filters.year = parseInt(filters.year);

  const summary = await goalService.getGoalSummary(userId, filters);

  res.status(200).json({
    success: true,
    data: {
      summary
    }
  });
});

// Add a milestone to a goal
goalController.addMilestone = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { goalId } = req.params;
  const milestoneData = req.body;

  const goal = await goalService.addMilestone(userId, goalId, milestoneData);

  res.status(201).json({
    success: true,
    message: 'Milestone added successfully',
    data: { goal }
  });
});

// Update a milestone
goalController.updateMilestone = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { goalId, milestoneId } = req.params;
  const updateData = req.body;

  const goal = await goalService.updateMilestone(userId, goalId, milestoneId, updateData);

  res.status(200).json({
    success: true,
    message: 'Milestone updated successfully',
    data: { goal }
  });
});

// Delete a milestone
goalController.deleteMilestone = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { goalId, milestoneId } = req.params;

  const goal = await goalService.deleteMilestone(userId, goalId, milestoneId);

  res.status(200).json({
    success: true,
    message: 'Milestone deleted successfully',
    data: { goal }
  });
});

module.exports = goalController;