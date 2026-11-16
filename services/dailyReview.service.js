const DailyReview = require('../models/dailyReview.model');
const DailyPlan = require('../models/dailyPlan.model');
const Task = require('../models/task.model');
const WorkSession = require('../models/workSession.model');
const { validateDailyReview, validateDailyReviewUpdate } = require('../validators/dailyReview.validator');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const dailyReviewService = {};

// Normalize date to start of day in UTC
const normalizeDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Generate snapshot from daily plan, tasks, and work sessions
const generateSnapshot = async (userId, date) => {
  // Normalize date to start of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Initialize snapshot with default values
  const snapshot = {
    totalTasks: 0,
    completedTasks: 0,
    skippedTasks: 0,
    cancelledTasks: 0,
    rescheduledTasks: 0,
    mustDoCount: 0,
    completedMustDoCount: 0,
    importantCount: 0,
    completedImportantCount: 0,
    optionalCount: 0,
    completedOptionalCount: 0,
    plannedMinutes: 0,
    actualMinutes: 0,
    differenceMinutes: 0,
    totalWorkSessions: 0,
    deepWorkMinutes: 0,
    focusedWorkMinutes: 0,
    studyMinutes: 0,
    practiceMinutes: 0,
    meetingMinutes: 0,
    adminMinutes: 0,
    planningMinutes: 0,
    otherMinutes: 0,
    averageFocusRating: null,
    averageEnergyRating: null,
    completionRate: null,
    mustDoCompletionRate: null,
    skipReasons: new Map(),
    sessionTypeMinutes: {
      deep_work: 0,
      focused_work: 0,
      study: 0,
      practice: 0,
      meeting: 0,
      admin: 0,
      planning: 0,
      other: 0
    }
  };

  // Get daily plan for the date
  const dailyPlan = await DailyPlan.findOne({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  // Get tasks for the date
  const tasks = await Task.find({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  // Get work sessions for the date
  const workSessions = await WorkSession.find({
    user: userId,
    status: 'completed',
    startedAt: { $gte: startOfDay, $lte: endOfDay }
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

  // Calculate completion rates
  if (snapshot.totalTasks > 0) {
    snapshot.completionRate = parseFloat(((snapshot.completedTasks / snapshot.totalTasks) * 100).toFixed(2));
  }

  if (snapshot.mustDoCount > 0) {
    snapshot.mustDoCompletionRate = parseFloat(((snapshot.completedMustDoCount / snapshot.mustDoCount) * 100).toFixed(2));
  }

  // Process work sessions
  workSessions.forEach(session => {
    snapshot.totalWorkSessions++;
    snapshot.actualMinutes += session.durationMinutes || 0;

    // Add to session type breakdown
    if (session.sessionType) {
      const current = snapshot.sessionTypeMinutes[session.sessionType] || 0;
      snapshot.sessionTypeMinutes[session.sessionType] = current + (session.durationMinutes || 0);
    }

    // Calculate average ratings (only from sessions that have ratings)
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

  // Calculate difference minutes
  snapshot.differenceMinutes = snapshot.actualMinutes - snapshot.plannedMinutes;

  // Convert skipReasons from Map to plain object for storage
  const skipReasonsObj = {};
  snapshot.skipReasons.forEach((count, reason) => {
    skipReasonsObj[reason] = count;
  });
  snapshot.skipReasons = skipReasonsObj;

  return { snapshot, dailyPlan };
};

// Create a new daily review
dailyReviewService.createReview = async (userId, reviewData) => {
  // Validate input
  const { isValid, errors } = validateDailyReview(reviewData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Normalize date
  const normalizedDate = normalizeDate(reviewData.date);

  // Check if review already exists for this date
  const existingReview = await DailyReview.findOne({
    user: userId,
    date: normalizedDate
  });

  if (existingReview) {
    const error = new Error('Daily review already exists for this date');
    error.statusCode = 409; // Conflict
    throw error;
  }

  // Generate snapshot from existing data
  const { snapshot, dailyPlan } = await generateSnapshot(userId, normalizedDate);

  // Create review with user ID from authenticated user (never from client)
  const review = new DailyReview({
    ...reviewData,
    user: userId,
    date: normalizedDate,
    dailyPlan: dailyPlan ? dailyPlan._id : null,
    snapshot: snapshot
  });

  // Save to database
  const savedReview = await review.save();
  return savedReview;
};

// Get today's daily review for a user
dailyReviewService.getTodayReview = async (userId, timezone = 'UTC') => {
  // For simplicity, we'll use UTC and note that proper timezone handling
  // would require a date library like date-fns-tz
  const now = new Date();

  // Calculate start of today in UTC (00:00:00.000)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Calculate end of today (23:59:59.999)
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // Find today's review for this user
  const review = await DailyReview.findOne({
    user: userId,
    date: { $gte: startOfToday, $lte: endOfToday }
  });

  return review;
};

// Get daily review by date for a user
dailyReviewService.getReviewByDate = async (userId, dateString) => {
  const normalizedDate = normalizeDate(dateString);

  const review = await DailyReview.findOne({
    user: userId,
    date: normalizedDate
  });

  return review;
};

// Get a single daily review by ID with ownership check
dailyReviewService.getReviewById = async (userId, reviewId) => {
  // Validate reviewId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  // Find review with ownership check
  const review = await DailyReview.findOne({ _id: reviewId, user: userId });

  if (!review) {
    const error = new Error('Daily review not found');
    error.statusCode = 404;
    throw error;
  }

  return review;
};

// Get all daily reviews for a user with filtering and pagination
dailyReviewService.getReviews = async (userId, filters = {}, pagination = {}) => {
  // Build query - always include user ID for ownership protection
  const query = { user: userId };

  // Add optional filters
  if (filters.from) {
    try {
      const fromDate = normalizeDate(filters.from);
      if (!query.date) query.date = {};
      query.date.$gte = fromDate;
    } catch (e) {
      // Invalid date, ignore filter
    }
  }

  if (filters.to) {
    try {
      const toDate = normalizeDate(filters.to);
      if (!query.date) query.date = {};
      query.date.$lte = toDate;
    } catch (e) {
      // Invalid date, ignore filter
    }
  }

  // Execute query - sort by date descending (most recent first)
  const limit = Math.min(pagination.limit || 10, 100); // Max 100 per page
  const skip = (pagination.page || 1) > 0 ? ((pagination.page || 1) - 1) * limit : 0;

  const [reviews, totalCount] = await Promise.all([
    DailyReview.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    DailyReview.countDocuments(query)
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

// Update a daily review
dailyReviewService.updateReview = async (userId, reviewId, updateData) => {
  // Validate reviewId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate input
  const { isValid, errors } = validateDailyReviewUpdate(updateData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Find review with ownership check
  const review = await DailyReview.findOne({ _id: reviewId, user: userId });

  if (!review) {
    const error = new Error('Daily review not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt', 'date', 'dailyPlan', 'snapshot'];
  protectedFields.forEach(field => {
    delete updateData[field]; // Remove any attempt to update protected fields
  });

  // Update the review
  const updatedReview = await DailyReview.findOneAndUpdate(
    { _id: reviewId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updatedReview;
};

// Refresh snapshot for a daily review
dailyReviewService.refreshSnapshot = async (userId, reviewId) => {
  // Validate reviewId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  // Find review with ownership check
  const review = await DailyReview.findOne({ _id: reviewId, user: userId });

  if (!review) {
    const error = new Error('Daily review not found');
    error.statusCode = 404;
    throw error;
  }

  // Regenerate snapshot from current data
  const { snapshot } = await generateSnapshot(userId, review.date);

  // Update the review with new snapshot
  const updatedReview = await DailyReview.findOneAndUpdate(
    { _id: reviewId, user: userId },
    { $set: { snapshot: snapshot } },
    { new: true, runValidators: true }
  );

  return updatedReview;
};

// Delete a daily review
dailyReviewService.deleteReview = async (userId, reviewId) => {
  // Validate reviewId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review ID');
    error.statusCode = 400;
    throw error;
  }

  // Find review with ownership check and delete
  const review = await DailyReview.findOneAndDelete({ _id: reviewId, user: userId });

  if (!review) {
    const error = new Error('Daily review not found');
    error.statusCode = 404;
    throw error;
  }

  return review;
};

// Get today's review preview (without saving)
dailyReviewService.getTodayPreview = async (userId, timezone = 'UTC') => {
  // For simplicity, we'll use UTC and note that proper timezone handling
  // would require a date library like date-fns-tz
  const now = new Date();

  // Calculate start of today in UTC (00:00:00.000)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Calculate end of today (23:59:59.999)
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // Generate preview snapshot
  const { snapshot, dailyPlan } = await generateSnapshot(userId, startOfToday);

  // Get daily focus if daily plan exists
  let dailyFocus = null;
  if (dailyPlan) {
    dailyFocus = dailyPlan.dailyFocus;
  }

  // Get top completed tasks (limit to 3)
  const topCompletedTasks = await Task.find({
    user: userId,
    date: { $gte: startOfToday, $lte: endOfToday },
    status: 'completed'
  })
  .sort({ priority: -1 }) // must_do > important > optional
  .limit(3)
  .select('_id title priority');

  // Get incomplete must-do tasks
  const incompleteMustDos = await Task.find({
    user: userId,
    date: { $gte: startOfToday, $lte: endOfToday },
    priority: 'must_do',
    status: { $nin: ['completed'] }
  })
  .select('_id title');

  return {
    date: startOfToday,
    dailyPlan: dailyPlan ? dailyPlan._id : null,
    dailyFocus: dailyFocus,
    snapshot: snapshot,
    topCompletedTasks: topCompletedTasks.map(task => ({
      id: task._id,
      title: task.title,
      priority: task.priority
    })),
    incompleteMustDos: incompleteMustDos.map(task => ({
      id: task._id,
      title: task.title
    }))
  };
};

// Get review preview by date (without saving)
dailyReviewService.getPreviewByDate = async (userId, dateString) => {
  const normalizedDate = normalizeDate(dateString);

  // Calculate start of day
  const startOfDay = new Date(normalizedDate);
  startOfDay.setHours(0, 0, 0, 0);

  // Calculate end of day
  const endOfDay = new Date(normalizedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Generate preview snapshot
  const { snapshot, dailyPlan } = await generateSnapshot(userId, normalizedDate);

  // Get daily focus if daily plan exists
  let dailyFocus = null;
  if (dailyPlan) {
    dailyFocus = dailyPlan.dailyFocus;
  }

  // Get top completed tasks (limit to 3)
  const topCompletedTasks = await Task.find({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'completed'
  })
  .sort({ priority: -1 }) // must_do > important > optional
  .limit(3)
  .select('_id title priority');

  // Get incomplete must-do tasks
  const incompleteMustDos = await Task.find({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    priority: 'must_do',
    status: { $nin: ['completed'] }
  })
  .select('_id title');

  return {
    date: normalizedDate,
    dailyPlan: dailyPlan ? dailyPlan._id : null,
    dailyFocus: dailyFocus,
    snapshot: snapshot,
    topCompletedTasks: topCompletedTasks.map(task => ({
      id: task._id,
      title: task.title,
      priority: task.priority
    })),
    incompleteMustDos: incompleteMustDos.map(task => ({
      id: task._id,
      title: task.title
    }))
  };
};

module.exports = dailyReviewService;