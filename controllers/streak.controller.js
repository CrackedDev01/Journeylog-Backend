const streakService = require('../services/streak.service');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/streak — current daily streak for the authenticated user
const getStreak = asyncHandler(async (req, res) => {
  const streak = await streakService.getStreak(req.user._id);
  res.json({
    success: true,
    message: 'Daily streak retrieved successfully',
    data: streak,
  });
});

module.exports = { getStreak };
