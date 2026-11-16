const DailyPlan = require('../models/dailyPlan.model');
const { validateDailyPlan, validateDailyPlanUpdate } = require('../validators/dailyPlan.validator');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const dailyPlanService = {};

// Create a new daily plan
dailyPlanService.createPlan = async (userId, planData) => {
  // Validate input
  const { isValid, errors } = validateDailyPlan(planData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Create plan with user ID from authenticated user (never from client)
  const plan = new DailyPlan({
    ...planData,
    user: userId
  });

  // Save to database
  const savedPlan = await plan.save();
  return savedPlan;
};

// Get all daily plans for a user with optional filtering
dailyPlanService.getPlans = async (userId, filters = {}) => {
  // Build query - always include user ID for ownership protection
  const query = { user: userId };

  // Add optional filters
  if (filters.date) {
    if (mongoose.Types.ObjectId.isValid(filters.date)) {
      // This would be for ObjectId dates, but we store actual Date objects
      // For actual date filtering, we'd need to convert string to Date
      try {
        const date = new Date(filters.date);
        if (!isNaN(date.getTime())) {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          query.date = { $gte: startOfDay, $lte: endOfDay };
        }
      } catch (e) {
        // Invalid date, ignore filter
      }
    }
  }

  if (filters.status !== undefined && filters.status !== null) {
    query.status = filters.status;
  }

  // Execute query - sort by date descending (most recent first)
  const plans = await DailyPlan.find(query).sort({ date: -1 });
  return plans;
};

// Get today's daily plan for a user
dailyPlanService.getTodayPlan = async (userId, timezone = 'UTC') => {
  // For simplicity, we'll use UTC and note that proper timezone handling
  // would require a date library like date-fns-tz
  const now = new Date();

  // Calculate start of today in UTC (00:00:00.000)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Calculate end of today (23:59:59.999)
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // Find today's plan for this user
  const plan = await DailyPlan.findOne({
    user: userId,
    date: { $gte: startOfToday, $lte: endOfToday }
  });

  return plan;
};

// Get daily plan by date for a user
dailyPlanService.getPlanByDate = async (userId, dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    const error = new Error('Invalid date format');
    error.statusCode = 400;
    throw error;
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const plan = await DailyPlan.findOne({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  return plan;
};

// Get a single daily plan by ID with ownership check
dailyPlanService.getPlanById = async (userId, planId) => {
  // Validate planId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    const error = new Error('Invalid plan ID');
    error.statusCode = 400;
    throw error;
  }

  // Find plan with ownership check
  const plan = await DailyPlan.findOne({ _id: planId, user: userId });

  if (!plan) {
    const error = new Error('Daily plan not found');
    error.statusCode = 404;
    throw error;
  }

  return plan;
};

// Update a daily plan by ID
dailyPlanService.updatePlan = async (userId, planId, updateData) => {
  // Validate planId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    const error = new Error('Invalid plan ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate input (excluding protected fields)
  const { isValid, errors } = validateDailyPlanUpdate(updateData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Find plan with ownership check and update
  const plan = await DailyPlan.findOneAndUpdate(
    { _id: planId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!plan) {
    const error = new Error('Daily plan not found');
    error.statusCode = 404;
    throw error;
  }

  return plan;
};

// Delete a daily plan by ID
dailyPlanService.deletePlan = async (userId, planId) => {
  // Validate planId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    const error = new Error('Invalid plan ID');
    error.statusCode = 400;
    throw error;
  }

  // Find plan with ownership check and delete
  const plan = await DailyPlan.findOneAndDelete({ _id: planId, user: userId });

  if (!plan) {
    const error = new Error('Daily plan not found');
    error.statusCode = 404;
    throw error;
  }

  return plan;
};

// Get daily plan summary
dailyPlanService.getPlanSummary = async (userId, planId) => {
  // Get the plan with ownership check
  const plan = await dailyPlanService.getPlanById(userId, planId);

  if (!plan) {
    const error = new Error('Daily plan not found');
    error.statusCode = 404;
    throw error;
  }

  // In a full implementation, we would calculate:
  // - plannedMinutes from linked tasks
  // - actualMinutes from work sessions
  // - capacity usage and status
  // - progress metrics

  // For now, return basic plan info
  return {
    id: plan._id,
    date: plan.date,
    dailyFocus: plan.dailyFocus,
    intention: plan.intention,
    availableMinutes: plan.availableMinutes,
    status: plan.status,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt
  };
};

module.exports = dailyPlanService;