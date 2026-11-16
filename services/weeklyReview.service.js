const WeeklyReview = require('../models/weeklyReview.model');
const WeeklyPlan = require('../models/weeklyPlan.model');
const MonthlyGoal = require('../models/monthlyGoal.model');
const DailyPlan = require('../models/dailyPlan.model');
const Task = require('../models/task.model');
const WorkSession = require('../models/workSession.model');
const DailyReview = require('../models/dailyReview.model');
const { validateWeeklyReview, validateWeeklyReviewUpdate } = require('../validators/weeklyReview.validator');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const weeklyReviewService = {};

// Normalize week to start (Monday) and end (Sunday) in UTC
const normalizeWeek = (weekStartString) => {
  const weekStart = new Date(weekStartString);
  if (isNaN(weekStart.getTime())) {
    throw new Error('Invalid week start format');
  }

  // Set to start of day (00:00:00.000)
  const normalizedStart = new Date(weekStart);
  normalizedStart.setHours(0, 0, 0, 0);

  // Calculate week end (Sunday 23:59:59.999)
  // Assuming weekStart is Monday (day 1 in UTC, where 0=Sunday, 1=Monday, etc.)
  const dayOfWeek = normalizedStart.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToAdd = (dayOfWeek === 0) ? 6 : (8 - dayOfWeek); // Days to reach next Sunday

  const weekEnd = new Date(normalizedStart);
  weekEnd.setDate(weekEnd.getDate() + daysToAdd);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart: normalizedStart, weekEnd };
};

// Generate snapshot from weekly plan, tasks, work sessions, daily reviews, and monthly goals
const generateSnapshot = async (userId, weekStart, weekEnd) => {
  // Initialize snapshot with default values
  const snapshot = {
    weeklyFocus: null,

    // Commitment Metrics
    totalCommitments: 0,
    completedCommitments: 0,
    commitmentCompletionRate: null,

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

    // Completion Rates
    completionRate: null,
    mustDoCompletionRate: null,
    importantCompletionRate: null,
    optionalCompletionRate: null,

    // Work Session Metrics
    totalWorkSessions: 0,
    completedWorkSessions: 0,

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

    // Daily Breakdown (lightweight)
    dailyBreakdown: [],

    // Monthly Goal Coverage
    monthlyGoalCoverage: [],

    // Unaddressed Monthly Goals
    unaddressedMonthlyGoals: []
  };

  // Get weekly plan for the week
  const weeklyPlan = await WeeklyPlan.findOne({
    user: userId,
    weekStart: { $lte: weekStart },
    weekEnd: { $gte: weekEnd }
  });

  // Set weekly focus if weekly plan exists
  if (weeklyPlan) {
    snapshot.weeklyFocus = weeklyPlan.weeklyFocus;
  }

  // Get tasks for the week
  const tasks = await Task.find({
    user: userId,
    date: { $gte: weekStart, $lte: weekEnd }
  });

  // Get work sessions for the week (only completed ones for actual work)
  const workSessions = await WorkSession.find({
    user: userId,
    status: 'completed',
    startedAt: { $gte: weekStart, $lte: weekEnd }
  });

  // Get daily reviews for the week
  const dailyReviews = await DailyReview.find({
    user: userId,
    date: { $gte: weekStart, $lte: weekEnd }
  });

  // Get monthly goals for the user (to check coverage)
  const monthlyGoals = await MonthlyGoal.find({
    user: userId
  });

  // Process tasks
  tasks.forEach(task => {
    snapshot.totalTasks++;

    if (task.status === 'completed') {
      snapshot.completedTasks++;
    } else if (task.status === 'skipped') {
      snapshot.skippedTasks++;
      if (task.skipReason) {
        const currentCount = snapshot.skipReasons.get(task.skipReason) || 0;
        snapshot.skipReasons.set(task.skipReason, currentCount + 1);
      }
    } else if (task.status === 'cancelled') {
      snapshot.cancelledTasks++;
    }

    // Count by priority
    if (task.priority === 'must_do') {
      snapshot.mustDoCount++;
      if (task.status === 'completed') {
        snapshot.completedMustDoCount++;
      }
    } else if (task.priority === 'important') {
      snapshot.importantCount++;
      if (task.status === 'completed') {
        snapshot.completedImportantCount++;
      }
    } else if (task.priority === 'optional') {
      snapshot.optionalCount++;
      if (task.status === 'completed') {
        snapshot.completedOptionalCount++;
      }
    }

    // Add to planned minutes
    if (task.estimatedMinutes) {
      snapshot.plannedMinutes += task.estimatedMinutes;
    }
  });

  // Calculate task completion rates
  if (snapshot.totalTasks > 0) {
    snapshot.completionRate = parseFloat(((snapshot.completedTasks / snapshot.totalTasks) * 100).toFixed(2));
  }

  if (snapshot.mustDoCount > 0) {
    snapshot.mustDoCompletionRate = parseFloat(((snapshot.completedMustDoCount / snapshot.mustDoCount) * 100).toFixed(2));
  }

  if (snapshot.importantCount > 0) {
    snapshot.importantCompletionRate = parseFloat(((snapshot.completedImportantCount / snapshot.importantCount) * 100).toFixed(2));
  }

  if (snapshot.optionalCount > 0) {
    snapshot.optionalCompletionRate = parseFloat(((snapshot.completedOptionalCount / snapshot.optionalCount) * 100).toFixed(2));
  }

  // Process work sessions
  workSessions.forEach(session => {
    snapshot.totalWorkSessions++;
    snapshot.completedWorkSessions++;
    snapshot.actualMinutes += session.durationMinutes || 0;

    // Add to session type breakdown
    if (session.sessionType) {
      const current = snapshot.sessionTypeMinutes[session.sessionType] || 0;
      snapshot.sessionTypeMinutes[session.sessionType] = current + (session.durationMinutes || 0);
    }

    // Calculate average focus and energy ratings
    // We'll calculate these after processing all sessions
  });

  // Calculate average focus and energy ratings
  const focusRatings = workSessions
    .filter(s => s.focusRating !== null && s.focusRating !== undefined)
    .map(s => s.focusRating);

  const energyRatings = workSessions
    .filter(s => s.energyRating !== null && s.energyRating !== undefined)
    .map(s => s.energyRating);

  if (focusRatings.length > 0) {
    const sum = focusRatings.reduce((acc, rating) => acc + rating, 0);
    snapshot.averageFocusRating = parseFloat((sum / focusRatings.length).toFixed(2));
  }

  if (energyRatings.length > 0) {
    const sum = energyRatings.reduce((acc, rating) => acc + rating, 0);
    snapshot.averageEnergyRating = parseFloat((sum / energyRatings.length).toFixed(2));
  }

  // Calculate estimation accuracy
  const tasksWithEstimateAndWork = [];
  const differences = [];

  tasks.forEach(task => {
    if (task.estimatedMinutes > 0) {
      // Find completed work sessions for this task
      const taskWorkSessions = workSessions.filter(session =>
        session.task && session.task.equals(task._id)
      );

      if (taskWorkSessions.length > 0) {
        tasksWithEstimateAndWork.push(task);

        const taskActualMinutes = taskWorkSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
        const difference = taskActualMinutes - task.estimatedMinutes;
        differences.push(difference);
      }
    }
  });

  snapshot.tasksWithEstimateAndWork = tasksWithEstimateAndWork.length;

  if (tasksWithEstimateAndWork.length > 0) {
    const accuracySum = tasksWithEstimateAndWork.map(task => {
      const taskWorkSessions = workSessions.filter(session =>
        session.task && session.task.equals(task._id)
      );
      const taskActualMinutes = taskWorkSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
      const estimated = task.estimatedMinutes;
      if (estimated > 0) {
        const accuracy = 1 - Math.abs(taskActualMinutes - estimated) / estimated;
        return Math.max(0, Math.min(1, accuracy)); // Clamp to 0-1
      }
      return 0;
    }).reduce((sum, acc) => sum + acc, 0);

    snapshot.averageEstimationAccuracy = parseFloat(((accuracySum / tasksWithEstimateAndWork.length) * 100).toFixed(2));
  }

  if (differences.length > 0) {
    const avgDiff = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    snapshot.averageDifferenceMinutes = parseFloat(avgDiff.toFixed(2));
  }

  // Process skip reasons
  snapshot.skipReasons.forEach((count, reason) => {
    // Keep track for top skip reasons calculation
  });

  // Find top skip reasons (handle ties)
  if (snapshot.skipReasons.size > 0) {
    let maxCount = 0;
    snapshot.skipReasons.forEach((count) => {
      if (count > maxCount) {
        maxCount = count;
      }
    });

    snapshot.topSkipReasons = [];
    snapshot.skipReasons.forEach((count, reason) => {
      if (count === maxCount) {
        snapshot.topSkipReasons.push(reason);
      }
    });
  }

  // Convert skipReasons from Map to plain object for storage
  const skipReasonsObj = {};
  snapshot.skipReasons.forEach((count, reason) => {
    skipReasonsObj[reason] = count;
  });
  snapshot.skipReasons = skipReasonsObj;

  // Calculate total reschedule actions
  snapshot.totalRescheduleActions = tasks.reduce((sum, task) => sum + (task.rescheduleCount || 0), 0);

  // Process commitments from weekly plan
  if (weeklyPlan && weeklyPlan.commitments && weeklyPlan.commitments.length > 0) {
    snapshot.totalCommitments = weeklyPlan.commitments.length;
    snapshot.completedCommitments = weeklyPlan.commitments.filter(c => c.completed).length;

    if (snapshot.totalCommitments > 0) {
      snapshot.commitmentCompletionRate = parseFloat(((snapshot.completedCommitments / snapshot.totalCommitments) * 100).toFixed(2));
    }
  }

  // Process daily reviews
  snapshot.daysReviewed = dailyReviews.length;

  snapshot.dailyBreakdown = dailyReviews.map(review => ({
    date: review.date,
    plannedTasks: review.snapshot?.totalTasks || 0,
    completedTasks: review.snapshot?.completedTasks || 0,
    mustDoCount: review.snapshot?.mustDoCount || 0,
    completedMustDoCount: review.snapshot?.completedMustDoCount || 0,
    plannedMinutes: review.snapshot?.plannedMinutes || 0,
    actualMinutes: review.snapshot?.actualMinutes || 0,
    reviewed: true
  }));

  // Sort daily breakdown by date
  snapshot.dailyBreakdown.sort((a, b) => a.date - b.date);

  // Process monthly goal coverage
  monthlyGoals.forEach(goal => {
    // Find tasks for this goal in the week
    const goalTasks = tasks.filter(task => task.monthlyGoal && task.monthlyGoal.equals(goal._id));

    // Find work sessions for these tasks
    const goalWorkSessions = workSessions.filter(session =>
      session.task &&
      session.task.monthlyGoal &&
      session.task.monthlyGoal.equals(goal._id)
    );

    const tasksPlanned = goalTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
    const tasksCompleted = goalTasks.filter(task => task.status === 'completed').length;
    const actualMinutes = goalWorkSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);

    // Only include if there was meaningful activity
    if (tasksPlanned > 0 || tasksCompleted > 0 || actualMinutes > 0) {
      snapshot.monthlyGoalCoverage.push({
        goalId: goal._id,
        title: goal.title,
        tasksPlanned: Math.round(tasksPlanned),
        tasksCompleted: tasksCompleted,
        actualMinutes: Math.round(actualMinutes)
      });
    }
  });

  // Find unaddressed monthly goals (active goals with no activity)
  snapshot.unaddressedMonthlyGoals = monthlyGoals
    .filter(goal => {
      const goalTasks = tasks.filter(task => task.monthlyGoal && task.monthlyGoal.equals(goal._id));
      const goalWorkSessions = workSessions.filter(session =>
        session.task &&
        session.task.monthlyGoal &&
        session.task.monthlyGoal.equals(goal._id)
      );

      const hasActivity =
        goalTasks.length > 0 ||
        goalWorkSessions.length > 0;

      return !hasActivity;
    })
    .map(goal => ({
      goalId: goal._id,
      title: goal.title
    }));

  return { snapshot, weeklyPlan };
};

// Create a new weekly review
weeklyReviewService.createReview = async (userId, reviewData) => {
  // Validate input
  const { isValid, errors } = validateWeeklyReview(reviewData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Normalize week
  const { weekStart, weekEnd } = normalizeWeek(reviewData.weekStart);

  // Check if review already exists for this week
  const existingReview = await WeeklyReview.findOne({
    user: userId,
    weekStart: weekStart
  });

  if (existingReview) {
    const error = new Error('Weekly review already exists for this week');
    error.statusCode = 409; // Conflict
    throw error;
  }

  // Generate snapshot from existing data
  const { snapshot, weeklyPlan } = await generateSnapshot(userId, weekStart, weekEnd);

  // Create review with user ID from authenticated user (never from client)
  const review = new WeeklyReview({
    ...reviewData,
    user: userId,
    weekStart: weekStart,
    weekEnd: weekEnd,
    weeklyPlan: weeklyPlan ? weeklyPlan._id : null,
    snapshot: snapshot
  });

  // Save to database
  const savedReview = await review.save();
  return savedReview;
};

// Get current week's weekly review for a user
weeklyReviewService.getCurrentReview = async (userId, timezone = 'UTC') => {
  // For simplicity, we'll use UTC and note that proper timezone handling
  // would require a date library like date-fns-tz
  const now = new Date();

  // Calculate start of current week (Monday)
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const dayOfWeek = weekStart.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek; // Days to get to Monday
  weekStart.setDate(weekStart.getDate() + daysToMonday);

  // Calculate end of week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
  weekEnd.setHours(23, 59, 59, 999);

  // Find current week's review for this user
  const review = await WeeklyReview.findOne({
    user: userId,
    weekStart: weekStart
  });

  return review;
};

// Get weekly review by week start for a user
weeklyReviewService.getReviewByWeek = async (userId, weekStartString) => {
  const { weekStart, weekEnd } = normalizeWeek(weekStartString);

  const review = await WeeklyReview.findOne({
    user: userId,
    weekStart: weekStart
  });

  return review;
};

// Get a single weekly review by ID with ownership check
weeklyReviewService.getReviewById = async (userId, reviewId) => {
  // Validate reviewId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  // Find review with ownership check
  const review = await WeeklyReview.findOne({ _id: reviewId, user: userId });

  if (!review) {
    const error = new Error('Weekly review not found');
    error.statusCode = 404;
    throw error;
  }

  return review;
};

// Get all weekly reviews for a user with filtering and pagination
weeklyReviewService.getReviews = async (userId, filters = {}, pagination = {}) => {
  // Build query - always include user ID for ownership protection
  const query = { user: userId };

  // Add optional filters
  if (filters.from) {
    try {
      const fromDate = new Date(filters.from);
      if (!isNaN(fromDate.getTime())) {
        // Convert to week start (Monday)
        const weekStart = new Date(fromDate);
        weekStart.setHours(0, 0, 0, 0);
        const dayOfWeek = weekStart.getUTCDay();
        const daysToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
        weekStart.setDate(weekStart.getDate() + daysToMonday);

        if (!query.weekStart) query.weekStart = {};
        query.weekStart.$gte = weekStart;
      }
    } catch (e) {
      // Invalid date, ignore filter
    }
  }

  if (filters.to) {
    try {
      const toDate = new Date(filters.to);
      if (!isNaN(toDate.getTime())) {
        // Convert to week end (Sunday)
        const weekStart = new Date(toDate);
        weekStart.setHours(0, 0, 0, 0);
        const dayOfWeek = weekStart.getUTCDay();
        const daysToSunday = (dayOfWeek === 0) ? 0 : 7 - dayOfWeek;
        weekStart.setDate(weekStart.getDate() + daysToSunday);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        if (!query.weekEnd) query.weekEnd = {};
        query.weekEnd.$lte = weekEnd;
      }
    } catch (e) {
      // Invalid date, ignore filter
    }
  }

  // Execute query - sort by weekStart descending (most recent first)
  const limit = Math.min(pagination.limit || 10, 100); // Max 100 per page
  const skip = (pagination.page || 1) > 0 ? ((pagination.page || 1) - 1) * limit : 0;

  const [reviews, totalCount] = await Promise.all([
    WeeklyReview.find(query)
      .sort({ weekStart: -1 })
      .skip(skip)
      .limit(limit),
    WeeklyReview.countDocuments(query)
  ]);

  return {
    reviews,
    pagination: {
      page: pagination.page || 1,
      limit: limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

// Update a weekly review
weeklyReviewService.updateReview = async (userId, reviewId, updateData) => {
  // Validate reviewId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate input
  const { isValid, errors } = validateWeeklyReviewUpdate(updateData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Find review with ownership check
  const review = await WeeklyReview.findOne({ _id: reviewId, user: userId });

  if (!review) {
    const error = new Error('Weekly review not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt', 'weekStart', 'weekEnd', 'weeklyPlan', 'snapshot'];
  protectedFields.forEach(field => {
    delete updateData[field]; // Remove any attempt to update protected fields
  });

  // Update the review
  const updatedReview = await WeeklyReview.findOneAndUpdate(
    { _id: reviewId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updatedReview;
};

// Refresh snapshot for a weekly review
weeklyReviewService.refreshSnapshot = async (userId, reviewId) => {
  // Validate reviewId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  // Find review with ownership check
  const review = await WeeklyReview.findOne({ _id: reviewId, user: userId });

  if (!review) {
    const error = new Error('Weekly review not found');
    error.statusCode = 404;
    throw error;
  }

  // Regenerate snapshot from current data
  const { snapshot } = await generateSnapshot(userId, review.weekStart, review.weekEnd);

  // Update the review with new snapshot
  const updatedReview = await WeeklyReview.findOneAndUpdate(
    { _id: reviewId, user: userId },
    { $set: { snapshot: snapshot } },
    { new: true, runValidators: true }
  );

  return updatedReview;
};

// Delete a weekly review
weeklyReviewService.deleteReview = async (userId, reviewId) => {
  // Validate reviewId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  // Find review with ownership check and delete
  const review = await WeeklyReview.findOneAndDelete({ _id: reviewId, user: userId });

  if (!review) {
    const error = new Error('Weekly review not found');
    error.statusCode = 404;
    throw error;
  }

  return review;
};

// Get current week's review preview (without saving)
weeklyReviewService.getCurrentPreview = async (userId, timezone = 'UTC') => {
  // For simplicity, we'll use UTC and note that proper timezone handling
  // would require a date library like date-fns-tz
  const now = new Date();

  // Calculate start of current week (Monday)
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const dayOfWeek = weekStart.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek; // Days to get to Monday
  weekStart.setDate(weekStart.getDate() + daysToMonday);

  // Calculate end of week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
  weekEnd.setHours(23, 59, 59, 999);

  // Generate preview snapshot
  const { snapshot, weeklyPlan } = await generateSnapshot(userId, weekStart, weekEnd);

  // Get top completed tasks (limit to 5)
  const topCompletedTasks = await Task.find({
    user: userId,
    date: { $gte: weekStart, $lte: weekEnd },
    status: 'completed'
  })
  .sort({ priority: -1 }) // must_do > important > optional
  .limit(5)
  .select('_id title priority');

  // Get incomplete must-do tasks
  const incompleteMustDos = await Task.find({
    user: userId,
    date: { $gte: weekStart, $lte: weekEnd },
    priority: 'must_do',
    status: { $nin: ['completed'] }
  })
  .select('_id title');

  // Get monthly goal coverage
  const monthlyGoalCoverage = [];
  const monthlyGoals = await MonthlyGoal.find({ user: userId });

  monthlyGoals.forEach(goal => {
    // Find tasks for this goal in the week
    const goalTasks = tasks.filter(task => task.monthlyGoal && task.monthlyGoal.equals(goal._id));

    // Find work sessions for these tasks
    const goalWorkSessions = workSessions.filter(session =>
      session.task &&
      session.task.monthlyGoal &&
      session.task.monthlyGoal.equals(goal._id)
    );

    const tasksPlanned = goalTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
    const tasksCompleted = goalTasks.filter(task => task.status === 'completed').length;
    const actualMinutes = goalWorkSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);

    // Only include if there was meaningful activity
    if (tasksPlanned > 0 || tasksCompleted > 0 || actualMinutes > 0) {
      monthlyGoalCoverage.push({
        goalId: goal._id,
        title: goal.title,
        tasksPlanned: Math.round(tasksPlanned),
        tasksCompleted: tasksCompleted,
        actualMinutes: Math.round(actualMinutes)
      });
    }
  });

  // Find unaddressed monthly goals (active goals with no activity)
  const unaddressedMonthlyGoals = monthlyGoals
    .filter(goal => {
      const goalTasks = tasks.filter(task => task.monthlyGoal && task.monthlyGoal.equals(goal._id));
      const goalWorkSessions = workSessions.filter(session =>
        session.task &&
        session.task.monthlyGoal &&
        session.task.monthlyGoal.equals(goal._id)
      );

      const hasActivity =
        goalTasks.length > 0 ||
        goalWorkSessions.length > 0;

      return !hasActivity;
    })
    .map(goal => ({
      goalId: goal._id,
      title: goal.title
    }));

  return {
    weekStart: weekStart,
    weekEnd: weekEnd,
    weeklyPlan: weeklyPlan ? weeklyPlan._id : null,
    weeklyFocus: weeklyPlan ? weeklyPlan.weeklyFocus : null,
    snapshot: snapshot,
    topCompletedTasks: topCompletedTasks.map(task => ({
      id: task._id,
      title: task.title,
      priority: task.priority
    })),
    incompleteMustDos: incompleteMustDos.map(task => ({
      id: task._id,
      title: task.title
    })),
    monthlyGoalCoverage: monthlyGoalCoverage,
    unaddressedMonthlyGoals: unaddressedMonthlyGoals
  };
};

// Get weekly review preview by week start (without saving)
weeklyReviewService.getPreviewByWeek = async (userId, weekStartString) => {
  const { weekStart, weekEnd } = normalizeWeek(weekStartString);

  // Generate preview snapshot
  const { snapshot, weeklyPlan } = await generateSnapshot(userId, weekStart, weekEnd);

  // Get top completed tasks (limit to 5)
  const topCompletedTasks = await Task.find({
    user: userId,
    date: { $gte: weekStart, $lte: weekEnd },
    status: 'completed'
  })
  .sort({ priority: -1 }) // must_do > important > optional
  .limit(5)
  .select('_id title priority');

  // Get incomplete must-do tasks
  const incompleteMustDos = await Task.find({
    user: userId,
    date: { $gte: weekStart, $lte: weekEnd },
    priority: 'must_do',
    status: { $nin: ['completed'] }
  })
  .select('_id title');

  // Get monthly goal coverage
  const monthlyGoalCoverage = [];
  const monthlyGoals = await MonthlyGoal.find({ user: userId });

  monthlyGoals.forEach(goal => {
    // Find tasks for this goal in the week
    const goalTasks = tasks.filter(task => task.monthlyGoal && task.monthlyGoal.equals(goal._id));

    // Find work sessions for these tasks
    const goalWorkSessions = workSessions.filter(session =>
      session.task &&
      session.task.monthlyGoal &&
      session.task.monthlyGoal.equals(goal._id)
    );

    const tasksPlanned = goalTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
    const tasksCompleted = goalTasks.filter(task => task.status === 'completed').length;
    const actualMinutes = goalWorkSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);

    // Only include if there was meaningful activity
    if (tasksPlanned > 0 || tasksCompleted > 0 || actualMinutes > 0) {
      monthlyGoalCoverage.push({
        goalId: goal._id,
        title: goal.title,
        tasksPlanned: Math.round(tasksPlanned),
        tasksCompleted: tasksCompleted,
        actualMinutes: Math.round(actualMinutes)
      });
    }
  });

  // Find unaddressed monthly goals (active goals with no activity)
  const unaddressedMonthlyGoals = monthlyGoals
    .filter(goal => {
      const goalTasks = tasks.filter(task => task.monthlyGoal && task.monthlyGoal.equals(goal._id));
      const goalWorkSessions = workSessions.filter(session =>
        session.task &&
        session.task.monthlyGoal &&
        session.task.monthlyGoal.equals(goal._id)
      );

      const hasActivity =
        goalTasks.length > 0 ||
        goalWorkSessions.length > 0;

      return !hasActivity;
    })
    .map(goal => ({
      goalId: goal._id,
      title: goal.title
    }));

  return {
    weekStart: weekStart,
    weekEnd: weekEnd,
    weeklyPlan: weeklyPlan ? weeklyPlan._id : null,
    weeklyFocus: weeklyPlan ? weeklyPlan.weeklyFocus : null,
    snapshot: snapshot,
    topCompletedTasks: topCompletedTasks.map(task => ({
      id: task._id,
      title: task.title,
      priority: task.priority
    })),
    incompleteMustDos: incompleteMustDos.map(task => ({
      id: task._id,
      title: task.title
    })),
    monthlyGoalCoverage: monthlyGoalCoverage,
    unaddressedMonthlyGoals: unaddressedMonthlyGoals
  };
};

module.exports = weeklyReviewService;