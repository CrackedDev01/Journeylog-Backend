const express = require('express');
const monthlyReviewController = require('../controllers/monthlyReview.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Monthly review routes
router.post('/', monthlyReviewController.createMonthlyReview);
router.get('/', monthlyReviewController.getMonthlyReviews);
router.get('/current', monthlyReviewController.getCurrentMonthlyReview);
router.get('/preview/current', monthlyReviewController.getCurrentMonthlyReviewPreview);
router.get('/preview/:year/:month', monthlyReviewController.getMonthlyReviewPreviewByMonth);
router.get('/month/:year/:month', monthlyReviewController.getMonthlyReviewByMonth);
router.get('/:reviewId', monthlyReviewController.getMonthlyReviewById);

// Update routes
router.patch('/:reviewId', monthlyReviewController.updateMonthlyReview);
router.patch('/:reviewId/refresh-snapshot', monthlyReviewController.refreshMonthlyReviewSnapshot);

// Delete route
router.delete('/:reviewId', monthlyReviewController.deleteMonthlyReview);

module.exports = router;