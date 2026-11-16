const express = require('express');
const dailyReviewController = require('../controllers/dailyReview.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Daily review routes
router.post('/', dailyReviewController.createReview);
router.get('/', dailyReviewController.getReviews);
router.get('/today', dailyReviewController.getTodayReview);
router.get('/date/:date', dailyReviewController.getReviewByDate);
router.get('/:reviewId', dailyReviewController.getReviewById);

// Preview routes
router.get('/preview/today', dailyReviewController.getTodayPreview);
router.get('/preview/:date', dailyReviewController.getPreviewByDate);

// Update routes
router.patch('/:reviewId', dailyReviewController.updateReview);
router.patch('/:reviewId/refresh-snapshot', dailyReviewController.refreshSnapshot);

// Delete route
router.delete('/:reviewId', dailyReviewController.deleteReview);

module.exports = router;