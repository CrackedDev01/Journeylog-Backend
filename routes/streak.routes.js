const express = require('express');
const router = express.Router();

const { getStreak } = require('../controllers/streak.controller');
const { protect } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(protect);

router.get('/', getStreak);

module.exports = router;
