const WeeklyPlan = require('../models/weeklyPlan.model');
const MonthlyGoal = require('../models/monthlyGoal.model');
const { validateWeeklyPlan, validateWeeklyPlanUpdate } = require('../validators/weeklyPlan.validator');
const calculateWeeklyCapacity = require('../utils/calculateWeeklyCapacity');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const weeklyPlanService = {};

// Create a new weekly plan
weeklyPlanService.createPlan = async (userId, planData) => {
  // Validate input
  const { isValid, errors } = validateWeeklyPlan(planData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Validate that any referenced monthly goals belong to the user
  if (planData.commitments && planData.commitments.length > 0) {
    for (const commitment of planData.commitments) {
      if (commitment.monthlyGoal) {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(commitment.monthlyGoal)) {
          const error = new Error('Invalid monthly goal ID');
          error.statusCode = 400;
          throw error;
        }

        // Check if the monthly goal exists and belongs to the user
        const monthlyGoal = await MonthlyGoal.findOne({
          _id: commitment.monthlyGoal,
          user: userId
        });

        if (!monthlyGoal) {
          const error = new Error('Monthly goal not found or access denied');
          error.statusCode = 404;
          throw error;
        }
      }
    }
  }

  // Create plan with user ID from authenticated user (never from client)
  const plan = new WeeklyPlan({
    ...planData,
    user: userId
  });

  // Save to database
  const savedPlan = await plan.save();
  return savedPlan;
};

// Get all weekly plans for a user with optional filtering
weeklyPlanService.getPlans = async (userId, filters = {}) => {
  // Build query - always include user ID for ownership protection
  const query = { user: userId };

  // Add optional filters
  if (filters.status !== undefined && filters.status !== null) {
    query.status = filters.status;
  }

  // Note: month/year filtering is complex for weeks that span months
  // For simplicity, we'll implement basic weekStart/weekEnd filtering if needed
  // But per requirements, we'll focus on the current week endpoint for now

  // Execute query - sort by weekStart descending (most recent first)
  const plans = await WeeklyPlan.find(query).sort({ weekStart: -1 });
  return plans;
};

// Get a single weekly plan by ID with ownership check
weeklyPlanService.getPlanById = async (userId, planId) => {
  // Validate planId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    const error = new Error('Invalid plan ID');
    error.statusCode = 400;
    throw error;
  }

  // Find plan with ownership check
  const plan = await WeeklyPlan.findOne({ _id: planId, user: userId });

  if (!plan) {
    const error = new Error('Weekly plan not found');
    error.statusCode = 404;
    throw error;
  }

  return plan;
};

// Update a weekly plan by ID
weeklyPlanService.updatePlan = async (userId, planId, updateData) => {
  // Validate planId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    const error = new Error('Invalid plan ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate input (excluding protected fields)
  const { isValid, errors } = validateWeeklyPlanUpdate(updateData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Validate that any referenced monthly goals belong to the user
  if (updateData.commitments && updateData.commitments.length > 0) {
    for (const commitment of updateData.commitments) {
      if (commitment.monthlyGoal) {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(commitment.monthlyGoal)) {
          const error = new Error('Invalid monthly goal ID');
          error.statusCode = 400;
          throw error;
        }

        // Check if the monthly goal exists and belongs to the user
        const monthlyGoal = await MonthlyGoal.findOne({
          _id: commitment.monthlyGoal,
          user: userId
        });

        if (!monthlyGoal) {
          const error = new Error('Monthly goal not found or access denied');
          error.statusCode = 404;
          throw error;
        }
      }
    }
  }

  // Find plan with ownership check and update
  const plan = await WeeklyPlan.findOneAndUpdate(
    { _id: planId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!plan) {
    const error = new Error('Weekly plan not found');
    error.statusCode = 404;
    throw error;
  }

  return plan;
};

// Delete a weekly plan by ID
weeklyPlanService.deletePlan = async (userId, planId) => {
  // Validate planId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    const error = new Error('Invalid plan ID');
    error.statusCode = 400;
    throw error;
  }

  // Find plan with ownership check and delete
  const plan = await WeeklyPlan.findOneAndDelete({ _id: planId, user: userId });

  if (!plan) {
    const error = new Error('Weekly plan not found');
    error.statusCode = 404;
    throw error;
  }

  return plan;
};

// Get current week's plan for a user
weeklyPlanService.getCurrentWeekPlan = async (userId, timezone = 'UTC') => {
  // Get current date in user's timezone
  // For simplicity, we'll use UTC and note that proper timezone handling
  // would require a date library like date-fns-tz
  const now = new Date();

  // Calculate start of week (Monday) in UTC
  // This is a simplified implementation - in production, use proper timezone handling
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to make Monday the start

  const weekStart = new Date(now);
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(weekStart.getUTCDate() + diffToMonday);

  // Calculate end of week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6); // Sunday
  weekEnd.setUTCHours(23, 59, 59, 999);

  // Find plan for this user and week
  const plan = await WeeklyPlan.findOne({
    user: userId,
    weekStart: weekStart,
    weekEnd: weekEnd
  });

  return plan;
};

// Add a commitment to a weekly plan
weeklyPlanService.addCommitment = async (userId, planId, commitmentData) => {
  // Validate planId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    const error = new Error('Invalid plan ID');
    error.statusCode = 400;
    throw error;
  }

  // Find the plan with ownership check
  const plan = await WeeklyPlan.findOne({ _id: planId, user: userId });

  if (!plan) {
    const error = new Error('Weekly plan not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate that the monthly goal belongs to the user (if provided)
  if (commitmentData.monthlyGoal) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(commitmentData.monthlyGoal)) {
      const error = new Error('Invalid monthly goal ID');
      error.statusCode = 400;
      throw error;
    }

    // Check if the monthly goal exists and belongs to the user
    const monthlyGoal = await MonthlyGoal.findOne({
      _id: commitmentData.monthlyGoal,
      user: userId
    });

    if (!monthlyGoal) {
      const error = new Error('Monthly goal not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  // Add the commitment to the plan
  plan.commitments.push(commitmentData);

  // Save the updated plan
  const updatedPlan = await plan.save();
  return updatedPlan;
};

// Update a commitment in a weekly plan
weeklyPlanService.updateCommitment = async (userId, planId, commitmentId, updateData) => {
  // Validate IDs are valid MongoDB ObjectIds
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    const error = new Error('Invalid plan ID');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(commitmentId)) {
    const error = new Error('Invalid commitment ID');
    error.statusCode = 400;
    throw error;
  }

  // Find the plan with ownership check
  const plan = await WeeklyPlan.findOne({ _id: planId, user: userId });

  if (!plan) {
    const error = new Error('Weekly plan not found');
    error.statusCode = 404;
    throw error;
  }

  // Find the commitment
  const commitment = plan.commitments.id(commitmentId);

  if (!commitment) {
    const error = new Error('Commitment not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate that the monthly goal belongs to the user (if provided)
  if (updateData.monthlyGoal) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(updateData.monthlyGoal)) {
      const error = new Error('Invalid monthly goal ID');
      error.statusCode = 400;
      throw error;
    }

    // Check if the monthly goal exists and belongs to the user
    const monthlyGoal = await MonthlyGoal.findOne({
      _id: updateData.monthlyGoal,
      user: userId
    });

    if (!monthlyGoal) {
      const error = new Error('Monthly goal not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  // Update the commitment fields
  Object.assign(commitment, updateData);

  // Handle completedAt when completed status changes
  if (updateData.completed !== undefined) {
    if (updateData.completed === true && !commitment.completedAt) {
      commitment.completedAt = new Date();
    } else if (updateData.completed === false && commitment.completedAt) {
      commitment.completedAt = null;
    }
  }

  // Save the updated plan
  const updatedPlan = await plan.save();
  return updatedPlan;
};

// Remove a commitment from a weekly plan
weeklyPlanService.removeCommitment = async (userId, planId, commitmentId) => {
  // Validate IDs are valid MongoDB ObjectIds
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    const error = new Error('Invalid plan ID');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(commitmentId)) {
    const error = new Error('Invalid commitment ID');
    error.statusCode = 400;
    throw error;
  }

  // Find the plan with ownership check
  const plan = await WeeklyPlan.findOne({ _id: planId, user: userId });

  if (!plan) {
    const error = new Error('Weekly plan not found');
    error.statusCode = 404;
    throw error;
  }

  // Remove the commitment
  plan.commitments.pull(commitmentId);

  // Save the updated plan
  const updatedPlan = await plan.save();
  return updatedPlan;
};

// Get weekly plan summary
weeklyPlanService.getPlanSummary = async (userId, planId) => {
  // Get the plan with ownership check
  const plan = await weeklyPlanService.getPlanById(userId, planId);

  if (!plan) {
    const error = new Error('Weekly plan not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate summary statistics
  const totalCommitments = plan.commitments.length;
  const completedCommitments = plan.commitments.filter(c => c.completed).length;
  const remainingCommitments = totalCommitments - completedCommitments;
  const progress = totalCommitments === 0 ? 0 : Math.round((completedCommitments / totalCommitments) * 100);
  const plannedHours = plan.plannedHours;
  const capacityUsage = plan.capacityUsage;
  const capacityStatus = plan.capacityStatus;

  // Count unique monthly goals linked in commitments
  const monthlyGoalIds = plan.commitments
    .filter(commitment => commitment.monthlyGoal)
    .map(commitment => commitment.monthlyGoal.toString());

  const uniqueMonthlyGoalIds = new Set(monthlyGoalIds);
  const linkedMonthlyGoalsCount = uniqueMonthlyGoalIds.size;

  return {
    totalCommitments,
    completedCommitments,
    remainingCommitments,
    progress,
    plannedHours,
    availableHours: plan.availableHours,
    capacityUsage,
    capacityStatus,
    linkedMonthlyGoalsCount
  };
};

module.exports = weeklyPlanService;