const express = require('express');
const weeklyReviewController = require('../controllers/weeklyReview.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Weekly review routes
router.post('/', weeklyReviewController.createWeeklyReview);
router.get('/', weeklyReviewController.getWeeklyReviews);
router.get('/current', weeklyReviewController.getCurrentWeeklyReview);
router.get('/preview/current', weeklyReviewController.getCurrentWeeklyReviewPreview);
router.get('/preview/:weekStart', weeklyReviewController.getWeeklyReviewPreviewByWeek);
router.get('/week/:weekStart', weeklyReviewController.getWeeklyReviewByWeek);
router.get('/:reviewId', weeklyReviewController.getWeeklyReviewById);

// Update routes
router.patch('/:reviewId', weeklyReviewController.updateWeeklyReview);
router.patch('/:reviewId/refresh-snapshot', weeklyReviewController.refreshWeeklyReviewSnapshot);

// Delete route
router.delete('/:reviewId', weeklyReviewController.deleteWeeklyReview);

module.exports = router;