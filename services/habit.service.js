const Habit = require('../models/habit.model');
const HabitLog = require('../models/habitLog.model');
const MonthlyGoal = require('../models/monthlyGoal.model');
const { validateHabit, validateHabitUpdate } = require('../validators/habit.validator');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const habitService = {};

// Utility function to check if a habit is scheduled for a given date
const isHabitScheduledForDate = (habit, date) => {
  // Check if habit is active
  if (habit.status !== 'active') {
    return false;
  }

  // Check if date is within habit's start and end date range
  const habitStart = new Date(habit.startDate);
  habitStart.setHours(0, 0, 0, 0);

  const habitEnd = habit.endDate ? new Date(habit.endDate) : null;
  if (habitEnd) {
    habitEnd.setHours(23, 59, 59, 999);
  }

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate < habitStart) {
    return false;
  }

  if (habitEnd && checkDate > habitEnd) {
    return false;
  }

  // Check schedule type
  switch (habit.schedule.scheduleType) {
    case 'daily':
      return true;
    case 'weekdays': {
      const dayOfWeek = checkDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
    }
    case 'weekends': {
      const dayOfWeek = checkDate.getUTCDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    }
    case 'specific_days': {
      const dayOfWeek = checkDate.getUTCDay();
      return habit.schedule.daysOfWeek.includes(dayOfWeek);
    }
    case 'times_per_week':
      // For times_per_week, we don't check specific days here
      // The weekly target is handled separately in stats calculation
      return true; // It's scheduled, but weekly target logic is handled elsewhere
    default:
      return false;
  }
};

// Utility function to get the start and end of a week for a given date
const getWeekRange = (date) => {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  // Get Sunday of this week (start of week)
  const dayOfWeek = checkDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(checkDate);
  startOfWeek.setDate(checkDate.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  // Get Saturday of this week (end of week)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

// Utility function to get the start and end of a month for a given date
const getMonthRange = (date) => {
  const checkDate = new Date(date);
  const year = checkDate.getFullYear();
  const month = checkDate.getMonth(); // 0-11

  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return { startOfMonth, endOfMonth };
};

habitService.createHabit = async (userId, habitData) => {
  // Validate that linkedMonthlyGoal belongs to the user if provided
  if (habitData.linkedMonthlyGoal) {
    const monthlyGoal = await MonthlyGoal.findOne({
      _id: habitData.linkedMonthlyGoal,
      user: userId
    });

    if (!monthlyGoal) {
      const error = new Error('Linked monthly goal not found or does not belong to user');
      error.statusCode = 404;
      throw error;
    }
  }

  // Create the habit
  const habit = await Habit.create({
    user: userId,
    name: habitData.name.trim(),
    description: habitData.description,
    category: habitData.category,
    schedule: habitData.schedule,
    targetType: habitData.targetType,
    targetValue: habitData.targetValue,
    unit: habitData.unit,
    startDate: new Date(habitData.startDate),
    endDate: habitData.endDate ? new Date(habitData.endDate) : null,
    status: habitData.status || 'active',
    reminderTime: habitData.reminderTime,
    linkedMonthlyGoal: habitData.linkedMonthlyGoal
  });

  return habit;
};

habitService.getHabits = async (userId, filters = {}) => {
  const query = { user: userId };

  // Add filters
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.linkedMonthlyGoal) {
    query.linkedMonthlyGoal = filters.linkedMonthlyGoal;
  }

  return await Habit.find(query).sort({ createdAt: -1 });
};

habitService.getHabitById = async (userId, habitId) => {
  if (!mongoose.Types.ObjectId.isValid(habitId)) {
    return null;
  }

  return await Habit.findOne({
    _id: habitId,
    user: userId
  });
};

habitService.getTodayHabits = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all active habits for the user
  const habits = await Habit.find({
    user: userId,
    status: 'active'
  });

  // Filter habits that are scheduled for today
  const todayHabits = [];

  for (const habit of habits) {
    if (isHabitScheduledForDate(habit, today)) {
      // Get today's log for this habit if it exists
      const todayLog = await HabitLog.findOne({
        user: userId,
        habit: habit._id,
        date: today
      });

      todayHabits.push({
        habit,
        todayLog
      });
    }
  }

  return todayHabits;
};

habitService.updateHabit = async (userId, habitId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(habitId)) {
    const error = new Error('Invalid habit ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate that linkedMonthlyGoal belongs to the user if provided
  if (updateData.linkedMonthlyGoal) {
    const monthlyGoal = await MonthlyGoal.findOne({
      _id: updateData.linkedMonthlyGoal,
      user: userId
    });

    if (!monthlyGoal) {
      const error = new Error('Linked monthly goal not found or does not belong to user');
      error.statusCode = 404;
      throw error;
    }
  }

  const habit = await Habit.findOneAndUpdate(
    {
      _id: habitId,
      user: userId
    },
    {
      $set: {
        name: updateData.name ? updateData.name.trim() : undefined,
        description: updateData.description,
        category: updateData.category,
        schedule: updateData.schedule,
        targetType: updateData.targetType,
        targetValue: updateData.targetValue,
        unit: updateData.unit,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        status: updateData.status,
        reminderTime: updateData.reminderTime,
        linkedMonthlyGoal: updateData.linkedMonthlyGoal
      }
    },
    { new: true, runValidators: true }
  );

  return habit;
};

habitService.deleteHabit = async (userId, habitId) => {
  if (!mongoose.Types.ObjectId.isValid(habitId)) {
    const error = new Error('Invalid habit ID');
    error.statusCode = 400;
    throw error;
  }

  // Instead of deleting, we'll archive the habit (soft delete)
  const habit = await Habit.findOneAndUpdate(
    {
      _id: habitId,
      user: userId
    },
    { $set: { status: 'archived' } },
    { new: true }
  );

  return habit !== null;
};

habitService.checkInHabit = async (userId, habitId, checkInData) => {
  if (!mongoose.Types.ObjectId.isValid(habitId)) {
    const error = new Error('Invalid habit ID');
    error.statusCode = 400;
    throw error;
  }

  const habit = await Habit.findOne({
    _id: habitId,
    user: userId
  });

  if (!habit) {
    return null;
  }

  // Check if habit is active
  if (habit.status !== 'active') {
    const error = new Error('Cannot check in to inactive habit');
    error.statusCode = 400;
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if habit is scheduled for today
  if (!isHabitScheduledForDate(habit, today)) {
    const error = new Error('Habit is not scheduled for today');
    error.statusCode = 400;
    throw error;
  }

  // Determine status based on value and target
  let status = 'skipped'; // Default to skipped
  if (checkInData.value !== undefined && checkInData.value !== null) {
    if (habit.targetType === 'binary') {
      // For binary habits, we expect a boolean completed flag
      status = checkInData.completed === true ? 'completed' : 'skipped';
    } else {
      // For measurable habits, compare value to target
      if (checkInData.value >= habit.targetValue) {
        status = 'completed';
      } else if (checkInData.value > 0) {
        status = 'partial';
      } else {
        status = 'skipped';
      }
    }
  } else if (habit.targetType === 'binary') {
    // For binary habits without value, check completed flag
    status = checkInData.completed === true ? 'completed' : 'skipped';
  }

  // Update or create today's log
  const habitLog = await HabitLog.findOneAndUpdate(
    {
      user: userId,
      habit: habitId,
      date: today
    },
    {
      $set: {
        status: status,
        value: checkInData.value || 0,
        note: checkInData.note,
        completedAt: status === 'completed' || status === 'partial' ? new Date() : undefined,
        skipReason: status === 'skipped' ? checkInData.skipReason : undefined
      }
    },
    { upsert: true, new: true }
  );

  return habitLog;
};

habitService.skipHabit = async (userId, habitId, skipData) => {
  if (!mongoose.Types.ObjectId.isValid(habitId)) {
    const error = new Error('Invalid habit ID');
    error.statusCode = 400;
    throw error;
  }

  const habit = await Habit.findOne({
    _id: habitId,
    user: userId
  });

  if (!habit) {
    return null;
  }

  // Check if habit is active
  if (habit.status !== 'active') {
    const error = new Error('Cannot skip inactive habit');
    error.statusCode = 400;
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if habit is scheduled for today
  if (!isHabitScheduledForDate(habit, today)) {
    const error = new Error('Habit is not scheduled for today');
    error.statusCode = 400;
    throw error;
  }

  // Update or create today's log as skipped
  const habitLog = await HabitLog.findOneAndUpdate(
    {
      user: userId,
      habit: habitId,
      date: today
    },
    {
      $set: {
        status: 'skipped',
        value: 0,
        note: skipData.note,
        completedAt: undefined,
        skipReason: skipData.skipReason
      }
    },
    { upsert: true, new: true }
  );

  return habitLog;
};

habitService.getHabitHistory = async (userId, habitId, filters = {}, pagination = {}) => {
  if (!mongoose.Types.ObjectId.isValid(habitId)) {
    const error = new Error('Invalid habit ID');
    error.statusCode = 400;
    throw error;
  }

  // Verify habit belongs to user
  const habit = await Habit.findOne({
    _id: habitId,
    user: userId
  });

  if (!habit) {
    return null;
  }

  const query = { user: userId, habit: habitId };

  // Add date filters
  if (filters.from) {
    query.date = { $gte: new Date(filters.from) };
  }
  if (filters.to) {
    if (query.date) {
      query.date.$lte = new Date(filters.to);
    } else {
      query.date = { $lte: new Date(filters.to) };
    }
  }

  // Add pagination
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  const [habitLogs, count] = await Promise.all([
    HabitLog.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    HabitLog.countDocuments(query)
  ]);

  return { habitLogs, count };
};

habitService.getHabitStats = async (userId, habitId) => {
  if (!mongoose.Types.ObjectId.isValid(habitId)) {
    const error = new Error('Invalid habit ID');
    error.statusCode = 400;
    throw error;
  }

  // Verify habit belongs to user
  const habit = await Habit.findOne({
    _id: habitId,
    user: userId
  });

  if (!habit) {
    return null;
  }

  // Get all logs for this habit
  const habitLogs = await HabitLog.find({
    user: userId,
    habit: habitId
  }).sort({ date: 1 });

  // Calculate stats
  let scheduledOccurrences = 0;
  let completedOccurrences = 0;
  let partialOccurrences = 0;
  let skippedOccurrences = 0;

  // For times_per_week habits, we need to calculate weekly targets
  let weeklyTargetMetCount = 0;
  let weeksChecked = 0;

  // Group logs by week for times_per_week habits
  const logsByWeek = new Map();

  for (const log of habitLogs) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);

    // Check if this occurrence was scheduled
    if (isHabitScheduledForDate(habit, logDate)) {
      scheduledOccurrences++;

      if (log.status === 'completed') {
        completedOccurrences++;
      } else if (log.status === 'partial') {
        partialOccurrences++;
      } else if (log.status === 'skipped') {
        skippedOccurrences++;
      }

      // For times_per_week habits, group by week
      if (habit.schedule.scheduleType === 'times_per_week') {
        const weekStart = new Date(logDate);
        const dayOfWeek = weekStart.getUTCDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);

        const weekKey = weekStart.toISOString();
        if (!logsByWeek.has(weekKey)) {
          logsByWeek.set(weekKey, { completed: 0, partial: 0, skipped: 0 });
        }

        if (log.status === 'completed') {
          logsByWeek.get(weekKey).completed++;
        } else if (log.status === 'partial') {
          logsByWeek.get(weekKey).partial++;
        } else if (log.status === 'skipped') {
          logsByWeek.get(weekKey).skipped++;
        }
      }
    }
  }

  // Calculate weekly targets for times_per_week habits
  if (habit.schedule.scheduleType === 'times_per_week') {
    const targetPerWeek = habit.schedule.timesPerWeek;

    for (const [weekKey, weekLogs] of logsByWeek) {
      weeksChecked++;
      const totalCompleted = weekLogs.completed;
      const totalPartial = weekLogs.partial;

      // Consider a week successful if we met or exceeded the target
      // For now, we'll count completed occurrences only toward the target
      // This can be adjusted based on requirements
      if (totalCompleted >= targetPerWeek) {
        weeklyTargetMetCount++;
      }
    }
  }

  // Calculate streak (consecutive scheduled completions)
  let currentStreak = 0;
  let longestStreak = 0;
  let currentStreakTemp = 0;

  // We need to check dates in order and see if they were scheduled and completed
  // Get all dates for which we have logs, plus we need to check for gaps
  const logDates = habitLogs
    .filter(log => isHabitScheduledForDate(habit, new Date(log.date)))
    .map(log => new Date(log.date))
    .sort((a, b) => a - b);

  // Check each date in sequence
  let prevDate = null;

  for (const logDate of logDates) {
    const currentDate = new Date(logDate);
    currentDate.setHours(0, 0, 0, 0);

    // Check if this date is consecutive to the previous date
    if (prevDate !== null) {
      const timeDiff = currentDate.getTime() - prevDate.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      // If there's a gap, reset streak
      if (daysDiff > 1) {
        currentStreakTemp = 0;
      }
    }

    // Find the log for this date
    const logForDate = habitLogs.find(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === currentDate.getTime();
    });

    // If the habit was scheduled and completed on this date, increment streak
    if (isHabitScheduledForDate(habit, currentDate) &&
        logForDate &&
        logForDate.status === 'completed') {
      currentStreakTemp++;
      currentStreak = Math.max(currentStreak, currentStreakTemp);
    } else {
      // Reset streak if not completed or not scheduled
      currentStreakTemp = 0;
    }

    prevDate = currentDate;
  }

  longestStreak = currentStreak;

  // Calculate consistency rate
  const consistencyRate = scheduledOccurrences > 0
    ? (completedOccurrences / scheduledOccurrences) * 100
    : 0;

  // Calculate engagement rate (completed + partial)
  const engagementRate = scheduledOccurrences > 0
    ? ((completedOccurrences + partialOccurrences) / scheduledOccurrences) * 100
    : 0;

  // For times_per_week habits, calculate weekly success rate
  let weeklySuccessRate = 0;
  if (habit.schedule.scheduleType === 'times_per_week' && weeksChecked > 0) {
    weeklySuccessRate = (weeklyTargetMetCount / weeksChecked) * 100;
  }

  return {
    habitId: habit._id,
    name: habit.name,
    currentStreak: currentStreak,
    longestStreak: longestStreak,
    scheduledOccurrences: scheduledOccurrences,
    completedOccurrences: completedOccurrences,
    partialOccurrences: partialOccurrences,
    skippedOccurrences: skippedOccurrences,
    missedOccurrences: 0, // We don't track missed occurrences directly
    consistencyRate: parseFloat(consistencyRate.toFixed(2)),
    engagementRate: parseFloat(engagementRate.toFixed(2)),
    weeklySuccessRate: habit.schedule.scheduleType === 'times_per_week'
      ? parseFloat(weeklySuccessRate.toFixed(2))
      : null
  };
};

habitService.getWeeklyHabitSummary = async (userId) => {
  const today = new Date();
  const { startOfWeek, endOfWeek } = getWeekRange(today);

  // Get all active habits for the user
  const habits = await Habit.find({
    user: userId,
    status: 'active'
  });

  let totalScheduled = 0;
  let totalCompleted = 0;
  let totalPartial = 0;
  let totalSkipped = 0;
  const habitBreakdown = [];

  for (const habit of habits) {
    // Get logs for this habit in the current week
    const habitLogs = await HabitLog.find({
      user: userId,
      habit: habit._id,
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });

    let habitScheduled = 0;
    let habitCompleted = 0;
    let habitPartial = 0;
    let habitSkipped = 0;

    // Count scheduled occurrences for this habit in the week
    // We need to check each day in the week to see if the habit was scheduled
    let currentDate = new Date(startOfWeek);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endOfWeek) {
      if (isHabitScheduledForDate(habit, currentDate)) {
        habitScheduled++;

        // Check if we have a log for this date
        const logForDate = habitLogs.find(log => {
          const logDate = new Date(log.date);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === currentDate.getTime();
        });

        if (logForDate) {
          if (logForDate.status === 'completed') {
            habitCompleted++;
          } else if (logForDate.status === 'partial') {
            habitPartial++;
          } else if (logForDate.status === 'skipped') {
            habitSkipped++;
          }
        }
        // If no log, it's a missed occurrence (not counted in scheduled for simplicity)
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    totalScheduled += habitScheduled;
    totalCompleted += habitCompleted;
    totalPartial += habitPartial;
    totalSkipped += habitSkipped;

    habitBreakdown.push({
      habitId: habit._id,
      name: habit.name,
      scheduled: habitScheduled,
      completed: habitCompleted,
      partial: habitPartial,
      skipped: habitSkipped,
      completionRate: habitScheduled > 0
        ? parseFloat((habitCompleted / habitScheduled) * 100).toFixed(2)
        : 0
    });
  }

  return {
    scheduled: totalScheduled,
    completed: totalCompleted,
    partial: totalPartial,
    skipped: totalSkipped,
    missed: 0, // Not tracking missed directly for simplicity
    completionRate: totalScheduled > 0
      ? parseFloat((totalCompleted / totalScheduled) * 100).toFixed(2)
      : 0,
    habitBreakdown: habitBreakdown
  };
};

habitService.getMonthlyHabitSummary = async (userId, year, month) => {
  // If year/month not provided, use current month
  const targetDate = year && month ? new Date(year, month - 1, 1) : new Date();
  const { startOfMonth, endOfMonth } = getMonthRange(targetDate);

  // Get all active habits for the user
  const habits = await Habit.find({
    user: userId,
    status: 'active'
  });

  let totalScheduled = 0;
  let totalCompleted = 0;
  let totalPartial = 0;
  let totalSkipped = 0;
  const habitBreakdown = [];

  for (const habit of habits) {
    // Get logs for this habit in the current month
    const habitLogs = await HabitLog.find({
      user: userId,
      habit: habit._id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let habitScheduled = 0;
    let habitCompleted = 0;
    let habitPartial = 0;
    let habitSkipped = 0;

    // Count scheduled occurrences for this habit in the month
    // We need to check each day in the month to see if the habit was scheduled
    let currentDate = new Date(startOfMonth);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endOfMonth) {
      if (isHabitScheduledForDate(habit, currentDate)) {
        habitScheduled++;

        // Check if we have a log for this date
        const logForDate = habitLogs.find(log => {
          const logDate = new Date(log.date);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === currentDate.getTime();
        });

        if (logForDate) {
          if (logForDate.status === 'completed') {
            habitCompleted++;
          } else if (logForDate.status === 'partial') {
            habitPartial++;
          } else if (logForDate.status === 'skipped') {
            habitSkipped++;
          }
        }
        // If no log, it's a missed occurrence (not counted in scheduled for simplicity)
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    totalScheduled += habitScheduled;
    totalCompleted += habitCompleted;
    totalPartial += habitPartial;
    totalSkipped += habitSkipped;

    habitBreakdown.push({
      habitId: habit._id,
      name: habit.name,
      scheduled: habitScheduled,
      completed: habitCompleted,
      partial: habitPartial,
      skipped: habitSkipped,
      completionRate: habitScheduled > 0
        ? parseFloat((habitCompleted / habitScheduled) * 100).toFixed(2)
        : 0
    });
  }

  return {
    scheduled: totalScheduled,
    completed: totalCompleted,
    partial: totalPartial,
    skipped: totalSkipped,
    missed: 0, // Not tracking missed directly for simplicity
    completionRate: totalScheduled > 0
      ? parseFloat((totalCompleted / totalScheduled) * 100).toFixed(2)
      : 0,
    habitBreakdown: habitBreakdown
  };
};

module.exports = habitService;