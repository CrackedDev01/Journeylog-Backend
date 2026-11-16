const dailyReviewService = require('../services/dailyReview.service');
const asyncHandler = require('../utils/asyncHandler');

const dailyReviewController = {};

// Create a new daily review
dailyReviewController.createReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const reviewData = req.body;

  const review = await dailyReviewService.createReview(userId, reviewData);

  res.status(201).json({
    success: true,
    message: 'Daily review created successfully',
    data: {
      review
    }
  });
});

// Get today's daily review
dailyReviewController.getTodayReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.user.timezone || 'UTC';

  const review = await dailyReviewService.getTodayReview(userId, timezone);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'No daily review found for today'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      review
    }
  });
});

// Get daily review by date
dailyReviewController.getReviewByDate = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const dateString = req.params.date;

  const review = await dailyReviewService.getReviewByDate(userId, dateString);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: `No daily review found for date: ${dateString}`
    });
  }

  res.status(200).json({
    success: true,
    data: {
      review
    }
  });
});

// Get a specific daily review by ID
dailyReviewController.getReviewById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const reviewId = req.params.reviewId;

  const review = await dailyReviewService.getReviewById(userId, reviewId);

  res.status(200).json({
    success: true,
    data: {
      review
    }
  });
});

// Get all daily reviews for the authenticated user with filtering and pagination
dailyReviewController.getReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = req.query;
  const pagination = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };

  const result = await dailyReviewService.getReviews(userId, filters, pagination);

  res.status(200).json({
    success: true,
    data: {
      reviews: result.reviews,
      pagination: result.pagination
    }
  });
});

// Get today's review preview
dailyReviewController.getTodayPreview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.user.timezone || 'UTC';

  const preview = await dailyReviewService.getTodayPreview(userId, timezone);

  res.status(200).json({
    success: true,
    data: {
      preview
    }
  });
});

// Get review preview by date
dailyReviewController.getPreviewByDate = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const dateString = req.params.date;

  const preview = await dailyReviewService.getPreviewByDate(userId, dateString);

  res.status(200).json({
    success: true,
    data: {
      preview
    }
  });
});

// Update a daily review
dailyReviewController.updateReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const reviewId = req.params.reviewId;
  const updateData = req.body;

  const review = await dailyReviewService.updateReview(userId, reviewId, updateData);

  res.status(200).json({
    success: true,
    message: 'Daily review updated successfully',
    data: {
      review
    }
  });
});

// Refresh snapshot for a daily review
dailyReviewController.refreshSnapshot = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const reviewId = req.params.reviewId;

  const review = await dailyReviewService.refreshSnapshot(userId, reviewId);

  res.status(200).json({
    success: true,
    message: 'Daily review snapshot refreshed successfully',
    data: {
      review
    }
  });
});

// Delete a daily review
dailyReviewController.deleteReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const reviewId = req.params.reviewId;

  await dailyReviewService.deleteReview(userId, reviewId);

  res.status(200).json({
    success: true,
    message: 'Daily review deleted successfully'
  });
});

module.exports = dailyReviewController;