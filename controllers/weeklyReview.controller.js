const asyncHandler = require('../utils/asyncHandler');
const weeklyReviewService = require('../services/weeklyReview.service');

/**
 * Create a new weekly review
 */
const createWeeklyReview = asyncHandler(async (req, res) => {
  const reviewData = req.body;
  const userId = req.user._id;

  const review = await weeklyReviewService.createReview(userId, reviewData);

  res.status(201).json({
    success: true,
    message: 'Weekly review created successfully',
    data: { review }
  });
});

/**
 * Get current week's weekly review
 */
const getCurrentWeeklyReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.query.timezone || 'UTC';

  const review = await weeklyReviewService.getCurrentReview(userId, timezone);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'No weekly review found for current week'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Current weekly review retrieved successfully',
    data: { review }
  });
});

/**
 * Get weekly review by week start date
 */
const getWeeklyReviewByWeek = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { weekStart } = req.params;

  const review = await weeklyReviewService.getReviewByWeek(userId, weekStart);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'No weekly review found for the specified week'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Weekly review retrieved successfully',
    data: { review }
  });
});

/**
 * Get single weekly review by ID
 */
const getWeeklyReviewById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.params;

  const review = await weeklyReviewService.getReviewById(userId, reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Weekly review not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Weekly review retrieved successfully',
    data: { review }
  });
});

/**
 * Get all weekly reviews with filtering and pagination
 */
const getWeeklyReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = {};

  // Add date range filters if provided
  if (req.query.from) {
    filters.from = req.query.from;
  }
  if (req.query.to) {
    filters.to = req.query.to;
  }

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };

  const { reviews, count } = await weeklyReviewService.getReviews(userId, filters, pagination);

  res.status(200).json({
    success: true,
    message: 'Weekly reviews retrieved successfully',
    data: {
      reviews,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: count,
        pages: Math.ceil(count / pagination.limit)
      }
    }
  });
});

/**
 * Update weekly review
 */
const updateWeeklyReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.params;
  const updateData = req.body;

  const review = await weeklyReviewService.updateReview(userId, reviewId, updateData);

  res.status(200).json({
    success: true,
    message: 'Weekly review updated successfully',
    data: { review }
  });
});

/**
 * Delete weekly review
 */
const deleteWeeklyReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.params;

  await weeklyReviewService.deleteReview(userId, reviewId);

  res.status(200).json({
    success: true,
    message: 'Weekly review deleted successfully',
    data: {}
  });
});

/**
 * Refresh weekly review snapshot
 */
const refreshWeeklyReviewSnapshot = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.params;

  const review = await weeklyReviewService.refreshSnapshot(userId, reviewId);

  res.status(200).json({
    success: true,
    message: 'Weekly review snapshot refreshed successfully',
    data: { review }
  });
});

/**
 * Get current week's weekly review preview
 */
const getCurrentWeeklyReviewPreview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.query.timezone || 'UTC';

  const preview = await weeklyReviewService.getCurrentPreview(userId, timezone);

  res.status(200).json({
    success: true,
    message: 'Current weekly review preview retrieved successfully',
    data: { preview }
  });
});

/**
 * Get weekly review preview by week start date
 */
const getWeeklyReviewPreviewByWeek = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { weekStart } = req.params;

  const preview = await weeklyReviewService.getPreviewByWeek(userId, weekStart);

  res.status(200).json({
    success: true,
    message: 'Weekly review preview retrieved successfully',
    data: { preview }
  });
});

module.exports = {
  createWeeklyReview,
  getCurrentWeeklyReview,
  getWeeklyReviewByWeek,
  getWeeklyReviewById,
  getWeeklyReviews,
  updateWeeklyReview,
  deleteWeeklyReview,
  refreshWeeklyReviewSnapshot,
  getCurrentWeeklyReviewPreview,
  getWeeklyReviewPreviewByWeek
};