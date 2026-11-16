const express = require('express');
const habitController = require('../controllers/habit.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Habit routes
router.post('/', habitController.createHabit);
router.get('/', habitController.getHabits);
router.get('/today', habitController.getTodayHabits);

// Summary routes
router.get('/summary/week', habitController.getWeeklyHabitSummary);
router.get('/summary/month', habitController.getMonthlyHabitSummary);

// Individual habit routes
router.get('/:habitId', habitController.getHabitById);
router.patch('/:habitId', habitController.updateHabit);
router.delete('/:habitId', habitController.deleteHabit);

// Check-in and skip routes
router.post('/:habitId/check-in', habitController.checkInHabit);
router.post('/:habitId/skip', habitController.skipHabit);

// History route
router.get('/:habitId/history', habitController.getHabitHistory);

// Stats route
router.get('/:habitId/stats', habitController.getHabitStats);

// Habit log routes
router.patch('/:habitId/logs/:logId', habitController.updateHabitLog);
router.delete('/:habitId/logs/:logId', habitController.deleteHabitLog);

module.exports = router;