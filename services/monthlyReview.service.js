const MonthlyReview = require('../models/monthlyReview.model');
const MonthlyGoal = require('../models/monthlyGoal.model');
const WeeklyPlan = require('../models/weeklyPlan.model');
const Task = require('../models/task.model');
const WorkSession = require('../models/workSession.model');
const DailyReview = require('../models/dailyReview.model');
const WeeklyReview = require('../models/weeklyReview.model');
const { validateMonthlyReview, validateMonthlyReviewUpdate } = require('../validators/monthlyReview.validator');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const monthlyReviewService = {};

// Normalize month to start and end dates in UTC
const normalizeMonth = (year, month) => {
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0); // First day of month, 00:00:00.000
  const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month, 23:59:59.999

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid year/month format');
  }

  return { startDate, endDate };
};

// Generate snapshot from monthly goals, tasks, work sessions, daily reviews, and weekly reviews
const generateSnapshot = async (userId, year, month) => {
  // Initialize snapshot with default values
  const snapshot = {
    // Monthly Goal Metrics
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    pausedGoals: 0,
    cancelledGoals: 0,
    goalCompletionRate: null,

    // Task Metrics
    totalTasks: 0,
    completedTasks: 0,
    skippedTasks: 0,
    cancelledTasks: 0,
    rescheduledTasks: 0,

    // Priority Breakdown
    mustDoCount: 0,
    completedMustDoCount: 0,
    importantCount: 0,
    completedImportantCount: 0,
    optionalCount: 0,
    completedOptionalCount: 0,

    // Time Tracking
    plannedMinutes: 0,
    actualMinutes: 0,
    differenceMinutes: 0,

    // Work Session Metrics
    totalWorkSessions: 0,

    // Session Type Breakdown
    sessionTypeMinutes: {
      deep_work: 0,
      focused_work: 0,
      study: 0,
      practice: 0,
      meeting: 0,
      admin: 0,
      planning: 0,
      other: 0
    },

    // Focus and Energy Ratings
    averageFocusRating: null,
    averageEnergyRating: null,

    // Estimation Accuracy
    tasksWithEstimateAndWork: 0,
    averageEstimationAccuracy: null,
    averageDifferenceMinutes: null,

    // Skip Reasons
    skipReasons: new Map(),
    topSkipReasons: [],

    // Rescheduling Metrics
    totalRescheduleActions: 0,

    // Daily Review Aggregation
    daysReviewed: 0,

    // Monthly Goal Coverage
    goalProgress: [],

    // Goal Time Investment
    goalTimeBreakdown: [],

    // Category Analysis
    categoryBreakdown: [],

    // Weekly Breakdown
    weeklyBreakdown: [],

    // Daily Breakdown (lightweight)
    dailyBreakdown: [],

    // Goal metrics
    unaddressedGoals: []
  };

  const { startDate, endDate } = normalizeMonth(year, month);

  // Fetch Monthly Goals for the user and month
  const monthlyGoals = await MonthlyGoal.find({
    user: userId,
    year: year,
    month: month
  });

  snapshot.totalGoals = monthlyGoals.length;
  snapshot.completedGoals = monthlyGoals.filter(goal => goal.status === 'completed').length;
  snapshot.inProgressGoals = monthlyGoals.filter(goal => goal.status === 'in_progress').length;
  snapshot.pausedGoals = monthlyGoals.filter(goal => goal.status === 'paused').length;
  snapshot.cancelledGoals = monthlyGoals.filter(goal => goal.status === 'cancelled').length;

  // Calculate goal completion rate (excluding cancelled goals from denominator)
  const activeGoals = snapshot.totalGoals - snapshot.cancelledGoals;
  if (activeGoals > 0) {
    snapshot.goalCompletionRate = (snapshot.completedGoals / activeGoals) * 100;
  }

  // Goal progress breakdown
  for (const goal of monthlyGoals) {
    snapshot.goalProgress.push({
      goalId: goal._id,
      title: goal.title,
      category: goal.category || 'other',
      status: goal.status,
      progress: goal.progress || 0,
      estimatedHours: goal.estimatedHours || 0,
      actualMinutes: 0, // Will be calculated later from work sessions
      tasksPlanned: 0, // Will be calculated later from tasks
      tasksCompleted: 0, // Will be calculated later from tasks
      workSessions: 0 // Will be calculated later from work sessions
    });

    // Category breakdown
    const categoryIndex = snapshot.categoryBreakdown.findIndex(cat => cat.category === (goal.category || 'other'));
    if (categoryIndex >= 0) {
      snapshot.categoryBreakdown[categoryIndex].goals += 1;
    } else {
      snapshot.categoryBreakdown.push({
        category: goal.category || 'other',
        goals: 1,
        actualMinutes: 0
      });
    }
  }

  // Fetch Tasks for the user within the month date range
  const tasks = await Task.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  });

  snapshot.totalTasks = tasks.length;
  snapshot.completedTasks = tasks.filter(task => task.status === 'completed').length;
  snapshot.skippedTasks = tasks.filter(task => task.status === 'skipped').length;
  snapshot.cancelledTasks = tasks.filter(task => task.status === 'cancelled').length;

  // Priority breakdown
  for (const task of tasks) {
    if (task.priority === 'must_do') {
      snapshot.mustDoCount += 1;
      if (task.status === 'completed') {
        snapshot.completedMustDoCount += 1;
      }
    } else if (task.priority === 'important') {
      snapshot.importantCount += 1;
      if (task.status === 'completed') {
        snapshot.completedImportantCount += 1;
      }
    } else if (task.priority === 'optional') {
      snapshot.optionalCount += 1;
      if (task.status === 'completed') {
        snapshot.completedOptionalCount += 1;
      }
    }

    // Task estimation accuracy
    if (task.estimatedMinutes && task.estimatedMinutes > 0) {
      // We'll calculate actual work time from work sessions later
    }
  }

  // Fetch Work Sessions for the user within the month date range
  const workSessions = await WorkSession.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  });

  snapshot.totalWorkSessions = workSessions.length;

  // Calculate actual minutes and session type breakdown
  let totalFocusRating = 0;
  let focusRatingCount = 0;
  let totalEnergyRating = 0;
  let energyRatingCount = 0;
  let totalEstimationAccuracy = 0;
  let estimationAccuracyCount = 0;

  for (const session of workSessions) {
    snapshot.actualMinutes += session.durationMinutes || 0;

    // Session type breakdown
    if (session.sessionType) {
      snapshot.sessionTypeMinutes[session.sessionType] = (snapshot.sessionTypeMinutes[session.sessionType] || 0) + (session.durationMinutes || 0);
    }

    // Focus and energy ratings
    if (session.focusRating !== null && session.focusRating !== undefined) {
      totalFocusRating += session.focusRating;
      focusRatingCount += 1;
    }
    if (session.energyRating !== null && session.energyRating !== undefined) {
      totalEnergyRating += session.energyRating;
      energyRatingCount += 1;
    }

    // Estimation accuracy - we'll link this to tasks later
  }

  // Calculate averages
  if (focusRatingCount > 0) {
    snapshot.averageFocusRating = totalFocusRating / focusRatingCount;
  }
  if (energyRatingCount > 0) {
    snapshot.averageEnergyRating = totalEnergyRating / energyRatingCount;
  }

  // Fetch Daily Reviews for the user within the month date range
  const dailyReviews = await DailyReview.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  });

  snapshot.daysReviewed = dailyReviews.length;

  // Daily breakdown (lightweight)
  for (const review of dailyReviews) {
    snapshot.dailyBreakdown.push({
      date: review.date,
      completedTasks: 0, // Will be calculated from tasks
      mustDoCompleted: 0, // Will be calculated from tasks
      actualMinutes: 0, // Will be calculated from work sessions
      reviewed: true
    });
  }

  // Fetch Weekly Reviews for the user within the month date range
  // We'll consider a week as belonging to the month if its weekStart is in the month
  const weeklyReviews = await WeeklyReview.find({
    user: userId,
    weekStart: { $gte: startDate, $lte: endDate }
  });

  snapshot.weeklyReviewsCompleted = weeklyReviews.length;

  // Weekly breakdown
  for (const review of weeklyReviews) {
    snapshot.weeklyBreakdown.push({
      weekStart: review.weekStart,
      weekEnd: review.weekEnd,
      tasksPlanned: 0, // Will be calculated from tasks
      tasksCompleted: 0, // Will be calculated from tasks
      mustDoCompletionRate: null, // Will be calculated from tasks
      plannedMinutes: 0, // Will be calculated from task estimates
      actualMinutes: 0, // Will be calculated from work sessions
      weeklyReviewCompleted: true
    });
  }

  // Now let's calculate task estimates and link work sessions to tasks for estimation accuracy
  // Fetch all tasks with estimates for the month
  const tasksWithEstimates = await Task.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate },
    estimatedMinutes: { $exists: true, $ne: null, $gt: 0 }
  });

  // For each task with estimate, find linked work sessions
  for (const task of tasksWithEstimates) {
    // Find work sessions linked to this task within the month
    const taskWorkSessions = await WorkSession.find({
      user: userId,
      taskId: task._id,
      date: { $gte: startDate, $lte: endDate }
    });

    const actualTaskTime = taskWorkSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
    const estimatedTime = task.estimatedMinutes;

    if (estimatedTime > 0) {
      snapshot.tasksWithEstimateAndWork += 1;
      const accuracy = (1 - Math.abs(actualTaskTime - estimatedTime) / estimatedTime) * 100;
      totalEstimationAccuracy += Math.max(0, accuracy); // Ensure accuracy doesn't go below 0
      snapshot.averageDifferenceMinutes += (actualTaskTime - estimatedTime);
    }
  }

  // Calculate estimation accuracy averages
  if (snapshot.tasksWithEstimateAndWork > 0) {
    snapshot.averageEstimationAccuracy = totalEstimationAccuracy / snapshot.tasksWithEstimateAndWork;
    snapshot.averageDifferenceMinutes = snapshot.averageDifferenceMinutes / snapshot.tasksWithEstimateAndWork;
  }

  // Calculate planned minutes from task estimates
  for (const task of tasks) {
    if (task.estimatedMinutes && task.estimatedMinutes > 0) {
      snapshot.plannedMinutes += task.estimatedMinutes;
    }
  }

  // Calculate difference minutes
  snapshot.differenceMinutes = snapshot.actualMinutes - snapshot.plannedMinutes;

  // Calculate skip reasons aggregation
  const skipReasonCounts = new Map();
  for (const task of tasks) {
    if (task.status === 'skipped' && task.skipReason) {
      const currentCount = skipReasonCounts.get(task.skipReason) || 0;
      skipReasonCounts.set(task.skipReason, currentCount + 1);
    }
  }

  // Convert skip reasons map to plain object for storage
  for (const [reason, count] of skipReasonCounts) {
    snapshot.skipReasons.set(reason, count);
  }

  // Calculate top skip reasons (handle ties)
  if (skipReasonCounts.size > 0) {
    const maxCount = Math.max(...Array.from(skipReasonCounts.values()));
    snapshot.topSkipReasons = Array.from(skipReasonCounts.entries())
      .filter(([_, count]) => count === maxCount)
      .map(([reason]) => reason);
  }

  // Calculate rescheduling metrics
  let totalRescheduleActions = 0;
  const rescheduledTaskIds = new Set();

  for (const task of tasks) {
    if (task.rescheduleCount && task.rescheduleCount > 0) {
      totalRescheduleActions += task.rescheduleCount;
      rescheduledTaskIds.add(task._id);
    }
  }

  snapshot.totalRescheduleActions = totalRescheduleActions;

  // Calculate goal time breakdown and unaddressed goals
  // First, let's aggregate work sessions by goal
  const goalWorkSessionMap = new Map();

  for (const session of workSessions) {
    if (session.goalId) {
      const goalIdStr = session.goalId.toString();
      const currentMinutes = goalWorkSessionMap.get(goalIdStr) || 0;
      goalWorkSessionMap.set(goalIdStr, currentMinutes + (session.durationMinutes || 0));
    }
  }

  // Update goal progress with actual minutes and update goal time breakdown
  for (let i = 0; i < snapshot.goalProgress.length; i++) {
    const goal = snapshot.goalProgress[i];
    const actualMinutes = goalWorkSessionMap.get(goal.goalId.toString()) || 0;

    // Update goal progress
    snapshot.goalProgress[i].actualMinutes = actualMinutes;

    // Update goal time breakdown
    snapshot.goalTimeBreakdown.push({
      goalId: goal.goalId,
      title: goal.title,
      actualMinutes: actualMinutes
    });

    // Update category breakdown actual minutes
    const categoryIndex = snapshot.categoryBreakdown.findIndex(cat => cat.category === goal.category);
    if (categoryIndex >= 0) {
      snapshot.categoryBreakdown[categoryIndex].actualMinutes += actualMinutes;
    }
  }

  // Identify unaddressed goals (goals with no meaningful activity)
  for (const goal of snapshot.goalProgress) {
    if (goal.tasksPlanned === 0 && goal.actualMinutes === 0) {
      snapshot.unaddressedGoals.push({
        goalId: goal.goalId,
        title: goal.title
      });
    }
  }

  // Weekly breakdown - we need to calculate task completion and planned minutes per week
  // For simplicity, we'll leave these as 0 for now and can enhance later
  // In a production system, we would query tasks and work sessions grouped by week

  return snapshot;
};

monthlyReviewService.createReview = async (userId, reviewData) => {
  // Check if review already exists for this user/month/year
  const existingReview = await MonthlyReview.findOne({
    user: userId,
    year: reviewData.year,
    month: reviewData.month
  });

  if (existingReview) {
    const error = new Error('Monthly review already exists for this month');
    error.statusCode = 409;
    throw error;
  }

  // Generate snapshot
  const snapshot = await generateSnapshot(userId, reviewData.year, reviewData.month);

  // Create the review
  const review = await MonthlyReview.create({
    user: userId,
    year: reviewData.year,
    month: reviewData.month,
    snapshot: snapshot,
    biggestWin: reviewData.biggestWin,
    biggestChallenge: reviewData.biggestChallenge,
    whatWorked: reviewData.whatWorked,
    whatDidNotWork: reviewData.whatDidNotWork,
    mainLesson: reviewData.mainLesson,
    whatToContinue: reviewData.whatToContinue,
    whatToStop: reviewData.whatToStop,
    whatToImprove: reviewData.whatToImprove,
    nextMonthFocus: reviewData.nextMonthFocus,
    notes: reviewData.notes,
    monthRating: reviewData.monthRating,
    satisfactionRating: reviewData.satisfactionRating
  });

  return review;
};

monthlyReviewService.getCurrentReview = async (userId, timezone = 'UTC') => {
  // Get current date in user's timezone
  // For simplicity, we'll use UTC and note that timezone conversion would be needed for production
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11

  const review = await MonthlyReview.findOne({
    user: userId,
    year: year,
    month: month
  });

  return review;
};

monthlyReviewService.getReviewByMonth = async (userId, year, month) => {
  const review = await MonthlyReview.findOne({
    user: userId,
    year: year,
    month: month
  });

  return review;
};

monthlyReviewService.getReviewById = async (userId, reviewId) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return null;
  }

  const review = await MonthlyReview.findOne({
    _id: reviewId,
    user: userId
  });

  return review;
};

monthlyReviewService.getReviews = async (userId, filters = {}, pagination = {}) => {
  const query = { user: userId };

  // Add filters
  if (filters.year) {
    query.year = filters.year;
  }
  if (filters.fromYear) {
    query.year = { $gte: filters.fromYear };
  }
  if (filters.toYear) {
    if (query.year) {
      query.year.$lte = filters.toYear;
    } else {
      query.year = { $lte: filters.toYear };
    }
  }
  if (filters.month) {
    query.month = filters.month;
  }

  // Add pagination
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  const [reviews, count] = await Promise.all([
    MonthlyReview.find(query)
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit),
    MonthlyReview.countDocuments(query)
  ]);

  return { reviews, count };
};

monthlyReviewService.updateReview = async (userId, reviewId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  const review = await MonthlyReview.findOne({
    _o: reviewId,
    user: userId
  });

  if (!review) {
    return null;
  }

  // Update only allowed fields
  const allowedUpdates = [
    'biggestWin', 'biggestChallenge', 'whatWorked', 'whatDidNotWork',
    'mainLesson', 'whatToContinue', 'whatToStop', 'whatToImprove',
    'nextMonthFocus', 'notes', 'monthRating', 'satisfactionRating'
  ];

  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      review[field] = updateData[field];
    }
  }

  // Update reviewedAt timestamp
  review.reviewedAt = new Date();

  await review.save();
  return review;
};

monthlyReviewService.deleteReview = async (userId, reviewId) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  const result = await MonthlyReview.deleteOne({
    _id: reviewId,
    user: userId
  });

  return result.deletedCount > 0;
};

monthlyReviewService.refreshSnapshot = async (userId, reviewId) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  const review = await MonthlyReview.findOne({
    _id: reviewId,
    user: userId
  });

  if (!review) {
    return null;
  }

  // Regenerate snapshot
  const snapshot = await generateSnapshot(userId, review.year, review.month);

  // Update snapshot and reviewedAt
  review.snapshot = snapshot;
  review.reviewedAt = new Date();

  await review.save();
  return review;
};

monthlyReviewService.getCurrentPreview = async (userId, timezone = 'UTC') => {
  // Get current date in user's timezone
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Generate preview snapshot (same as generateSnapshot but don't save)
  const snapshot = await generateSnapshot(userId, year, month);

  return {
    year: year,
    month: month,
    snapshot: snapshot
  };
};

monthlyReviewService.getPreviewByMonth = async (userId, year, month) => {
  // Validate year/month
  if (!Number.isInteger(year) || year < 2020 || year > 2050) {
    throw new Error('Invalid year');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Invalid month');
  }

  // Generate preview snapshot
  const snapshot = await generateSnapshot(userId, year, month);

  return {
    year: year,
    month: month,
    snapshot: snapshot
  };
};

module.exports = monthlyReviewService;