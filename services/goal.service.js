const mongoose = require('mongoose');
const MonthlyGoal = require('../models/monthlyGoal.model');
const { validateGoal, validateGoalUpdate } = require('../validators/goal.validator');
const calculateGoalProgress = require('../utils/calculateGoalProgress');
const asyncHandler = require('../utils/asyncHandler');

const goalService = {};

// The monthly goal owns this relationship; projects only read it.
const validateProjectLink = async (userId, projectId) => {
  if (projectId == null) return;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    const error = new Error('Invalid project'); error.statusCode = 400; throw error;
  }
  const Project = require('../models/project.model');
  if (!await Project.exists({ _id: projectId, user: userId })) {
    const error = new Error('Project not found'); error.statusCode = 404; throw error;
  }
};


// Create a new monthly goal
goalService.createGoal = async (userId, goalData) => {
  // Validate input
  const { isValid, errors } = validateGoal(goalData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  await validateProjectLink(userId, goalData.project);

  // Create goal with user ID from authenticated user (never from client)
  const goal = new MonthlyGoal({
    ...goalData,
    user: userId
  });

  // Save to database
  const savedGoal = await goal.save();
  return savedGoal;
};

// Get all goals for a user with optional filtering
goalService.getGoals = async (userId, filters = {}) => {
  // Build query - always include user ID for ownership protection
  const query = { user: userId };

  // Add optional filters
  if (filters.month !== undefined && filters.month !== null) {
    query.month = filters.month;
  }

  if (filters.year !== undefined && filters.year !== null) {
    query.year = filters.year;
  }

  if (filters.status !== undefined && filters.status !== null) {
    query.status = filters.status;
  }

  if (filters.category !== undefined && filters.category !== null) {
    query.category = filters.category;
  }

  if (filters.priority !== undefined && filters.priority !== null) {
    query.priority = filters.priority;
  }

  // Execute query
  const goals = await MonthlyGoal.find(query).sort({ createdAt: -1 });
  return goals;
};

// Get a single goal by ID with ownership check
goalService.getGoalById = async (userId, goalId) => {
  // Validate goalId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    const error = new Error('Invalid goal ID');
    error.statusCode = 400;
    throw error;
  }

  // Find goal with ownership check
  const goal = await MonthlyGoal.findOne({ _id: goalId, user: userId });

  if (!goal) {
    const error = new Error('Goal not found');
    error.statusCode = 404;
    throw error;
  }

  return goal;
};

// Update a goal by ID
goalService.updateGoal = async (userId, goalId, updateData) => {
  // Validate goalId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    const error = new Error('Invalid goal ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate input (excluding protected fields)
  const { isValid, errors } = validateGoalUpdate(updateData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  await validateProjectLink(userId, updateData.project);

  // Find goal with ownership check and update
  const goal = await MonthlyGoal.findOneAndUpdate(
    { _id: goalId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!goal) {
    const error = new Error('Goal not found');
    error.statusCode = 404;
    throw error;
  }

  return goal;
};

// Delete a goal by ID
goalService.deleteGoal = async (userId, goalId) => {
  // Validate goalId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    const error = new Error('Invalid goal ID');
    error.statusCode = 400;
    throw error;
  }

  // Find goal with ownership check and delete
  const goal = await MonthlyGoal.findOneAndDelete({ _id: goalId, user: userId });

  if (!goal) {
    const error = new Error('Goal not found');
    error.statusCode = 404;
    throw error;
  }

  return goal;
};

// Update goal progress
goalService.updateGoalProgress = async (userId, goalId, progressData) => {
  // Validate goalId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    const error = new Error('Invalid goal ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate currentValue
  if (progressData.currentValue === undefined || progressData.currentValue === null) {
    const error = new Error('Please provide a current value');
    error.statusCode = 400;
    throw error;
  }

  if (typeof progressData.currentValue !== 'number' || progressData.currentValue < 0) {
    const error = new Error('Current value must be a number greater than or equal to 0');
    error.statusCode = 400;
    throw error;
  }

  // Find the goal with ownership check
  const goal = await MonthlyGoal.findOne({ _id: goalId, user: userId });

  if (!goal) {
    const error = new Error('Goal not found');
    error.statusCode = 404;
    throw error;
  }

  // Update currentValue
  goal.currentValue = progressData.currentValue;

  // Auto-complete measurable goals when target is reached
  if (goal.targetType !== 'binary' &&
      goal.targetValue > 0 &&
      goal.currentValue >= goal.targetValue &&
      goal.status !== 'completed') {
    goal.status = 'completed';
    goal.completedAt = new Date();
  }

  // Reopen goal if progress is less than target and it was completed
  if (goal.status === 'completed' &&
      goal.currentValue < goal.targetValue) {
    goal.status = 'in_progress';
    goal.completedAt = null;
  }

  // Save the updated goal
  const updatedGoal = await goal.save();
  return updatedGoal;
};

// Get goal summary for a user
goalService.getGoalSummary = async (userId, filters = {}) => {
  // Build match criteria for aggregation
  const matchCriteria = { user: userId };

  if (filters.month !== undefined && filters.month !== null) {
    matchCriteria.month = filters.month;
  }

  if (filters.year !== undefined && filters.year !== null) {
    matchCriteria.year = filters.year;
  }

  // Aggregation pipeline
  const summary = await MonthlyGoal.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: null,
        totalGoals: { $sum: 1 },
        completedGoals: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        inProgressGoals: {
          $sum: {
            $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0]
          }
        },
        notStartedGoals: {
          $sum: {
            $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0]
          }
        },
        pausedGoals: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paused'] }, 1, 0]
          }
        },
        cancelledGoals: {
          $sum: {
            $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
          }
        },
        totalEstimatedHours: {
          $sum: {
            $cond: [{ $gt: ['$estimatedHours', 0] }, '$estimatedHours', 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalGoals: 1,
        completedGoals: 1,
        inProgressGoals: 1,
        notStartedGoals: 1,
        pausedGoals: 1,
        cancelledGoals: 1,
        completionRate: {
          $cond: [
            { $eq: ['$totalGoals', 0] },
            0,
            { $multiply: [{ $divide: ['$completedGoals', '$totalGoals'] }, 100] }
          ]
        },
        totalEstimatedHours: 1
      }
    }
  ]);

  // Return default values if no goals found
  if (summary.length === 0) {
    return {
      totalGoals: 0,
      completedGoals: 0,
      inProgressGoals: 0,
      notStartedGoals: 0,
      pausedGoals: 0,
      cancelledGoals: 0,
      completionRate: 0,
      totalEstimatedHours: 0
    };
  }

  return summary[0];
};

// Add a milestone to a goal
goalService.addMilestone = async (userId, goalId, milestoneData) => {
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    const error = new Error('Invalid goal ID');
    error.statusCode = 400;
    throw error;
  }
  if (!milestoneData.title || !milestoneData.title.trim()) {
    const error = new Error('Milestone title is required');
    error.statusCode = 400;
    throw error;
  }
  const goal = await MonthlyGoal.findOneAndUpdate(
    { _id: goalId, user: userId },
    { $push: { milestones: { title: milestoneData.title.trim(), completed: false } } },
    { new: true, runValidators: true }
  );
  if (!goal) {
    const error = new Error('Goal not found');
    error.statusCode = 404;
    throw error;
  }
  return goal;
};

// Update a milestone
goalService.updateMilestone = async (userId, goalId, milestoneId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(goalId) || !mongoose.Types.ObjectId.isValid(milestoneId)) {
    const error = new Error('Invalid ID');
    error.statusCode = 400;
    throw error;
  }
  const goal = await MonthlyGoal.findOne({ _id: goalId, user: userId });
  if (!goal) {
    const error = new Error('Goal not found');
    error.statusCode = 404;
    throw error;
  }
  const milestone = goal.milestones.id(milestoneId);
  if (!milestone) {
    const error = new Error('Milestone not found');
    error.statusCode = 404;
    throw error;
  }
  if (updateData.title !== undefined) milestone.title = updateData.title.trim();
  if (updateData.completed !== undefined) {
    milestone.completed = updateData.completed;
    milestone.completedAt = updateData.completed ? new Date() : null;
  }
  await goal.save();
  return goal;
};

// Delete a milestone
goalService.deleteMilestone = async (userId, goalId, milestoneId) => {
  if (!mongoose.Types.ObjectId.isValid(goalId) || !mongoose.Types.ObjectId.isValid(milestoneId)) {
    const error = new Error('Invalid ID');
    error.statusCode = 400;
    throw error;
  }
  const goal = await MonthlyGoal.findOneAndUpdate(
    { _id: goalId, user: userId },
    { $pull: { milestones: { _id: new mongoose.Types.ObjectId(milestoneId) } } },
    { new: true }
  );
  if (!goal) {
    const error = new Error('Goal not found');
    error.statusCode = 404;
    throw error;
  }
  return goal;
};

module.exports = goalService;