const asyncHandler = require('../utils/asyncHandler');
const monthlyReviewService = require('../services/monthlyReview.service');

/**
 * Create a new monthly review
 */
const createMonthlyReview = asyncHandler(async (req, res) => {
  const reviewData = req.body;
  const userId = req.user._id;

  const review = await monthlyReviewService.createReview(userId, reviewData);

  res.status(201).json({
    success: true,
    message: 'Monthly review created successfully',
    data: { review }
  });
});

/**
 * Get current month's monthly review
 */
const getCurrentMonthlyReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.query.timezone || 'UTC';

  const review = await monthlyReviewService.getCurrentReview(userId, timezone);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'No monthly review found for current month'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Current monthly review retrieved successfully',
    data: { review }
  });
});

/**
 * Get monthly review by year and month
 */
const getMonthlyReviewByMonth = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { year, month } = req.params;

  const review = await monthlyReviewService.getReviewByMonth(userId, parseInt(year), parseInt(month));

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'No monthly review found for the specified month'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Monthly review retrieved successfully',
    data: { review }
  });
});

/**
 * Get single monthly review by ID
 */
const getMonthlyReviewById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.params;

  const review = await monthlyReviewService.getReviewById(userId, reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Monthly review not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Monthly review retrieved successfully',
    data: { review }
  });
});

/**
 * Get all monthly reviews with filtering and pagination
 */
const getMonthlyReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = {};

  // Add year filters if provided
  if (req.query.year) {
    filters.year = parseInt(req.query.year);
  }
  if (req.query.fromYear) {
    filters.fromYear = parseInt(req.query.fromYear);
  }
  if (req.query.toYear) {
    filters.toYear = parseInt(req.query.toYear);
  }
  if (req.query.month) {
    filters.month = parseInt(req.query.month);
  }

  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };

  const { reviews, count } = await monthlyReviewService.getReviews(userId, filters, pagination);

  res.status(200).json({
    success: true,
    message: 'Monthly reviews retrieved successfully',
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
 * Update monthly review
 */
const updateMonthlyReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.params;
  const updateData = req.body;

  const review = await monthlyReviewService.updateReview(userId, reviewId, updateData);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Monthly review not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Monthly review updated successfully',
    data: { review }
  });
});

/**
 * Delete monthly review
 */
const deleteMonthlyReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.params;

  const deleted = await monthlyReviewService.deleteReview(userId, reviewId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Monthly review not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Monthly review deleted successfully',
    data: {}
  });
});

/**
 * Refresh monthly review snapshot
 */
const refreshMonthlyReviewSnapshot = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.params;

  const review = await monthlyReviewService.refreshSnapshot(userId, reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Monthly review not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Monthly review snapshot refreshed successfully',
    data: { review }
  });
});

/**
 * Get current month's monthly review preview
 */
const getCurrentMonthlyReviewPreview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.query.timezone || 'UTC';

  const preview = await monthlyReviewService.getCurrentPreview(userId, timezone);

  res.status(200).json({
    success: true,
    message: 'Current monthly review preview retrieved successfully',
    data: { preview }
  });
});

/**
 * Get monthly review preview by year and month
 */
const getMonthlyReviewPreviewByMonth = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { year, month } = req.params;

  const preview = await monthlyReviewService.getPreviewByMonth(userId, parseInt(year), parseInt(month));

  res.status(200).json({
    success: true,
    message: 'Monthly review preview retrieved successfully',
    data: { preview }
  });
});

module.exports = {
  createMonthlyReview,
  getCurrentMonthlyReview,
  getMonthlyReviewByMonth,
  getMonthlyReviewById,
  getMonthlyReviews,
  updateMonthlyReview,
  deleteMonthlyReview,
  refreshMonthlyReviewSnapshot,
  getCurrentMonthlyReviewPreview,
  getMonthlyReviewPreviewByMonth
};