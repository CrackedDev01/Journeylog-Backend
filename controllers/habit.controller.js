const asyncHandler = require('../utils/asyncHandler');
const habitService = require('../services/habit.service');
const habitLogService = require('../services/habitLog.service');

/**
 * Create a new habit
 */
const createHabit = asyncHandler(async (req, res) => {
  const habitData = req.body;
  const userId = req.user._id;

  const habit = await habitService.createHabit(userId, habitData);

  res.status(201).json({
    success: true,
    message: 'Habit created successfully',
    data: { habit }
  });
});

/**
 * Get all habits with filtering
 */
const getHabits = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = {};

  // Add filters if provided
  if (req.query.status) {
    filters.status = req.query.status;
  }
  if (req.query.category) {
    filters.category = req.query.category;
  }
  if (req.query.linkedMonthlyGoal) {
    filters.linkedMonthlyGoal = req.query.linkedMonthlyGoal;
  }

  const habits = await habitService.getHabits(userId, filters);

  res.status(200).json({
    success: true,
    message: 'Habits retrieved successfully',
    data: { habits }
  });
});

/**
 * Get today's habits
 */
const getTodayHabits = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const todayHabits = await habitService.getTodayHabits(userId);

  // Format response
  const habitsData = todayHabits.map(({ habit, todayLog }) => ({
    id: habit._id,
    name: habit.name,
    description: habit.description,
    category: habit.category,
    schedule: habit.schedule,
    targetType: habit.targetType,
    targetValue: habit.targetValue,
    unit: habit.unit,
    startDate: habit.startDate,
    endDate: habit.endDate,
    status: habit.status,
    reminderTime: habit.reminderTime,
    linkedMonthlyGoal: habit.linkedMonthlyGoal,
    todayLog: todayLog ? {
      id: todayLog._id,
      status: todayLog.status,
      value: todayLog.value,
      note: todayLog.note,
      completedAt: todayLog.completedAt,
      skipReason: todayLog.skipReason
    } : null
  }));

  res.status(200).json({
    success: true,
    message: 'Today\'s habits retrieved successfully',
    data: {
      date: new Date().toISOString().split('T')[0],
      habits: habitsData
    }
  });
});

/**
 * Get single habit by ID
 */
const getHabitById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { habitId } = req.params;

  const habit = await habitService.getHabitById(userId, habitId);

  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Habit retrieved successfully',
    data: { habit }
  });
});

/**
 * Update habit
 */
const updateHabit = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { habitId } = req.params;
  const updateData = req.body;

  const habit = await habitService.updateHabit(userId, habitId, updateData);

  if (!habit) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Habit updated successfully',
    data: { habit }
  });
});

/**
 * Delete habit (archive)
 */
const deleteHabit = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { habitId } = req.params;

  const deleted = await habitService.deleteHabit(userId, habitId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Habit archived successfully',
    data: {}
  });
});

/**
 * Check-in to habit
 */
const checkInHabit = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { habitId } = req.params;
  const checkInData = req.body;

  const habitLog = await habitService.checkInHabit(userId, habitId, checkInData);

  if (!habitLog) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Habit check-in successful',
    data: {
      id: habitLog._id,
      status: habitLog.status,
      value: habitLog.value,
      note: habitLog.note,
      completedAt: habitLog.completedAt,
      skipReason: habitLog.skipReason
    }
  });
});

/**
 * Skip habit
 */
const skipHabit = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { habitId } = req.params;
  const skipData = req.body;

  const habitLog = await habitService.skipHabit(userId, habitId, skipData);

  if (!habitLog) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Habit skipped successfully',
    data: {
      id: habitLog._id,
      status: habitLog.status,
      value: habitLog.value,
      note: habitLog.note,
      completedAt: habitLog.completedAt,
      skipReason: habitLog.skipReason
    }
  });
});

/**
 * Get habit history
 */
const getHabitHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { habitId } = req.params;
  const filters = {};

  // Add date filters if provided
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

  const result = await habitService.getHabitHistory(userId, habitId, filters, pagination);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  const { habitLogs, count } = result;

  // Format logs for response
  const logsData = habitLogs.map(log => ({
    id: log._id,
    date: log.date,
    status: log.status,
    value: log.value,
    note: log.note,
    completedAt: log.completedAt,
    skipReason: log.skipReason,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt
  }));

  res.status(200).json({
    success: true,
    message: 'Habit history retrieved successfully',
    data: {
      habitId,
      logs: logsData,
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
 * Get habit stats
 */
const getHabitStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { habitId } = req.params;

  const stats = await habitService.getHabitStats(userId, habitId);

  if (!stats) {
    return res.status(404).json({
      success: false,
      message: 'Habit not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Habit statistics retrieved successfully',
    data: { stats }
  });
});

/**
 * Get weekly habit summary
 */
const getWeeklyHabitSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const summary = await habitService.getWeeklyHabitSummary(userId);

  res.status(200).json({
    success: true,
    message: 'Weekly habit summary retrieved successfully',
    data: { summary }
  });
});

/**
 * Get monthly habit summary
 */
const getMonthlyHabitSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = {};

  // Add year/month filters if provided
  if (req.query.year) {
    filters.year = parseInt(req.query.year);
  }
  if (req.query.month) {
    filters.month = parseInt(req.query.month);
  }

  const summary = await habitService.getMonthlyHabitSummary(userId, filters.year, filters.month);

  res.status(200).json({
    success: true,
    message: 'Monthly habit summary retrieved successfully',
    data: { summary }
  });
});

/**
 * Update habit log
 */
const updateHabitLog = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { habitId, logId } = req.params;
  const updateData = req.body;

  const habitLog = await habitLogService.updateHabitLog(userId, habitId, logId, updateData);

  if (!habitLog) {
    return res.status(404).json({
      success: false,
      message: 'Habit log not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Habit log updated successfully',
    data: {
      id: habitLog._id,
      status: habitLog.status,
      value: habitLog.value,
      note: habitLog.note,
      completedAt: habitLog.completedAt,
      skipReason: habitLog.skipReason
    }
  });
});

/**
 * Delete habit log
 */
const deleteHabitLog = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { habitId, logId } = req.params;

  const deleted = await habitLogService.deleteHabitLog(userId, habitId, logId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Habit log not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Habit log deleted successfully',
    data: {}
  });
});

module.exports = {
  createHabit,
  getHabits,
  getTodayHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  checkInHabit,
  skipHabit,
  getHabitHistory,
  getHabitStats,
  getWeeklyHabitSummary,
  getMonthlyHabitSummary,
  updateHabitLog,
  deleteHabitLog
};