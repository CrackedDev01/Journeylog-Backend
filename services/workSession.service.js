const WorkSession = require('../models/workSession.model');
const Task = require('../models/task.model');
const DailyPlan = require('../models/dailyPlan.model');
const WeeklyPlan = require('../models/weeklyPlan.model');
const MonthlyGoal = require('../models/monthlyGoal.model');
const { validateWorkSession, validateWorkSessionStart, validateWorkSessionUpdate } = require('../validators/workSession.validator');
const { calculateDuration, calculateElapsedMinutes } = require('../utils/calculateDuration');
const { calculateEstimationAccuracy, calculateEstimationDifference } = require('../utils/calculateEstimationAccuracy');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const workSessionService = {};

// Start a new work session
workSessionService.startSession = async (userId, sessionData) => {
  // Validate input
  const { isValid, errors } = validateWorkSessionStart(sessionData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Check if user already has an active session
  const activeSession = await WorkSession.findOne({ user: userId, status: 'active' });
  if (activeSession) {
    const error = new Error('You already have an active work session');
    error.statusCode = 400; // Bad request - conflict
    throw error;
  }

  // Prepare session data
  const sessionToCreate = {
    ...sessionData,
    user: userId, // Always set user from authenticated user, never from client
    startedAt: new Date(), // Set start time to now
    status: 'active'
  };

  // If task is provided, validate ownership and infer relationships
  if (sessionData.task) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(sessionData.task)) {
      const error = new Error('Invalid task ID');
      error.statusCode = 400;
      throw error;
    }

    // Find task with ownership check
    const task = await Task.findOne({ _id: sessionData.task, user: userId });
    if (!task) {
      const error = new Error('Task not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    // Infer relationships from task if not explicitly provided
    if (!sessionData.dailyPlan && task.dailyPlan) {
      sessionToCreate.dailyPlan = task.dailyPlan;
    }
    if (!sessionData.weeklyPlan && task.weeklyPlan) {
      sessionToCreate.weeklyPlan = task.weeklyPlan;
    }
    if (!sessionData.weeklyCommitmentId && task.weeklyCommitmentId) {
      sessionToCreate.weeklyCommitmentId = task.weeklyCommitmentId;
    }
    if (!sessionData.monthlyGoal && task.monthlyGoal) {
      sessionToCreate.monthlyGoal = task.monthlyGoal;
    }

    // Set title from task if not provided
    if (!sessionToCreate.title && task.title) {
      sessionToCreate.title = task.title;
    }
  } else {
    // No task provided, validate direct relationships if provided
    const relationshipFields = ['dailyPlan', 'weeklyPlan', 'weeklyCommitmentId', 'monthlyGoal'];
    for (const field of relationshipFields) {
      if (sessionData[field]) {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(sessionData[field])) {
          const error = new Error(`Invalid ${field} ID`);
          error.statusCode = 400;
          throw error;
        }

        // Check ownership based on field type
        let relatedItem = null;
        switch (field) {
          case 'dailyPlan':
            relatedItem = await DailyPlan.findOne({ _id: sessionData[field], user: userId });
            break;
          case 'weeklyPlan':
            relatedItem = await WeeklyPlan.findOne({ _id: sessionData[field], user: userId });
            break;
          case 'weeklyCommitmentId':
            // Note: WeeklyCommitment doesn't have its own model in Phase 5, it's embedded in WeeklyPlan
            // For now, we'll skip ownership validation here and rely on weeklyPlan validation
            // In a full implementation, we'd need to check through the weekly plan
            relatedItem = { _id: sessionData[field] }; // Placeholder
            break;
          case 'monthlyGoal':
            relatedItem = await MonthlyGoal.findOne({ _id: sessionData[field], user: userId });
            break;
        }

        if (!relatedItem || !relatedItem._id) {
          const error = new Error(`${field} not found or access denied`);
          error.statusCode = 404;
          throw error;
        }
      }
    }
  }

  // Create and save the work session
  const workSession = new WorkSession(sessionToCreate);
  const savedSession = await workSession.save();

  // If task was provided and task status was 'planned', update it to 'in_progress'
  if (sessionData.task) {
    const task = await Task.findOne({ _id: sessionData.task, user: userId });
    if (task && task.status === 'planned') {
      task.status = 'in_progress';
      await task.save();
    }
  }

  return savedSession;
};

// Create a manual work session (with explicit start and end times)
workSessionService.createSession = async (userId, sessionData) => {
  // Validate input
  const { isValid, errors } = validateWorkSession(sessionData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Prepare session data
  const sessionToCreate = {
    ...sessionData,
    user: userId // Always set user from authenticated user, never from client
  };

  // If task is provided, validate ownership and infer relationships
  if (sessionData.task) {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(sessionData.task)) {
      const error = new Error('Invalid task ID');
      error.statusCode = 400;
      throw error;
    }

    // Find task with ownership check
    const task = await Task.findOne({ _id: sessionData.task, user: userId });
    if (!task) {
      const error = new Error('Task not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    // Infer relationships from task if not explicitly provided
    if (!sessionData.dailyPlan && task.dailyPlan) {
      sessionToCreate.dailyPlan = task.dailyPlan;
    }
    if (!sessionData.weeklyPlan && task.weeklyPlan) {
      sessionToCreate.weeklyPlan = task.weeklyPlan;
    }
    if (!sessionData.weeklyCommitmentId && task.weeklyCommitmentId) {
      sessionToCreate.weeklyCommitmentId = task.weeklyCommitmentId;
    }
    if (!sessionData.monthlyGoal && task.monthlyGoal) {
      sessionToCreate.monthlyGoal = task.monthlyGoal;
    }

    // Set title from task if not provided
    if (!sessionToCreate.title && task.title) {
      sessionToCreate.title = task.title;
    }
  } else {
    // No task provided, validate direct relationships if provided
    const relationshipFields = ['dailyPlan', 'weeklyPlan', 'weeklyCommitmentId', 'monthlyGoal'];
    for (const field of relationshipFields) {
      if (sessionData[field]) {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(sessionData[field])) {
          const error = new Error(`Invalid ${field} ID`);
          error.statusCode = 400;
          throw error;
        }

        // Check ownership based on field type
        let relatedItem = null;
        switch (field) {
          case 'dailyPlan':
            relatedItem = await DailyPlan.findOne({ _id: sessionData[field], user: userId });
            break;
          case 'weeklyPlan':
            relatedItem = await WeeklyPlan.findOne({ _id: sessionData[field], user: userId });
            break;
          case 'weeklyCommitmentId':
            // Note: WeeklyCommitment doesn't have its own model in Phase 5, it's embedded in WeeklyPlan
            // For now, we'll skip ownership validation here and rely on weeklyPlan validation
            // In a full implementation, we'd need to check through the weekly plan
            relatedItem = { _id: sessionData[field] }; // Placeholder
            break;
          case 'monthlyGoal':
            relatedItem = await MonthlyGoal.findOne({ _id: sessionData[field], user: userId });
            break;
        }

        if (!relatedItem || !relatedItem._id) {
          const error = new Error(`${field} not found or access denied`);
          error.statusCode = 404;
          throw error;
        }
      }
    }
  }

  // Create and save the work session
  const workSession = new WorkSession(sessionToCreate);
  const savedSession = await workSession.save();

  return savedSession;
};

// Get all work sessions for a user with filtering
workSessionService.getSessions = async (userId, filters = {}) => {
  // Build query - always include user ID for ownership protection
  const query = { user: userId };

  // Add optional filters
  if (filters.task) {
    if (mongoose.Types.ObjectId.isValid(filters.task)) {
      query.task = filters.task;
    }
    // Invalid task ID will be ignored (no matches)
  }

  if (filters.dailyPlan) {
    if (mongoose.Types.ObjectId.isValid(filters.dailyPlan)) {
      query.dailyPlan = filters.dailyPlan;
    }
  }

  if (filters.weeklyPlan) {
    if (mongoose.Types.ObjectId.isValid(filters.weeklyPlan)) {
      query.weeklyPlan = filters.weeklyPlan;
    }
  }

  if (filters.monthlyGoal) {
    if (mongoose.Types.ObjectId.isValid(filters.monthlyGoal)) {
      query.monthlyGoal = filters.monthlyGoal;
    }
  }

  if (filters.sessionType) {
    query.sessionType = filters.sessionType;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  // Date filtering
  if (filters.date) {
    const date = new Date(filters.date);
    if (!isNaN(date.getTime())) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.startedAt = { $gte: startOfDay, $lte: endOfDay };
    }
  }

  if (filters.from) {
    const fromDate = new Date(filters.from);
    if (!isNaN(fromDate.getTime())) {
      if (!query.startedAt) query.startedAt = {};
      query.startedAt.$gte = fromDate;
    }
  }

  if (filters.to) {
    const toDate = new Date(filters.to);
    if (!isNaN(toDate.getTime())) {
      if (!query.startedAt) query.startedAt = {};
      query.startedAt.$lte = toDate;
    }
  }

  // Execute query - sort by startedAt descending (most recent first)
  const sessions = await WorkSession.find(query).sort({ startedAt: -1 });
  return sessions;
};

// Get today's work sessions for a user
workSessionService.getTodaySessions = async (userId, timezone = 'UTC') => {
  // For simplicity, we'll use UTC and note that proper timezone handling
  // would require a date library like date-fns-tz
  const now = new Date();

  // Calculate start of today in UTC (00:00:00.000)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Calculate end of today (23:59:59.999)
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // Find sessions for this user today
  const sessions = await WorkSession.find({
    user: userId,
    startedAt: { $gte: startOfToday, $lte: endOfToday }
  }).sort({ startedAt: 1 }); // Chronological order for timeline view

  return sessions;
};

// Get active session for a user. Sessions running 24h+ are auto-stopped
// here so a forgotten session can never run forever, even if the user
// never presses Stop.
workSessionService.getActiveSession = async (userId) => {
  const session = await WorkSession.findOne({ user: userId, status: 'active' });
  if (!session) return session;
  const MAX_SESSION_MS = 24 * 60 * 60 * 1000;
  if (Date.now() - session.startedAt.getTime() >= MAX_SESSION_MS) {
    const endedAt = new Date(session.startedAt.getTime() + MAX_SESSION_MS);
    await WorkSession.findOneAndUpdate(
      { _id: session._id, user: userId, status: 'active' },
      { $set: {
        endedAt,
        status: 'completed',
        durationMinutes: Math.floor((endedAt - session.startedAt) / 60000),
        notes: [session.notes, 'Auto-stopped after 24 hours.'].filter(Boolean).join(' '),
      } },
      { new: true, runValidators: true }
    );
    return null;
  }
  return session;
};

// Get a single work session by ID with ownership check
workSessionService.getSessionById = async (userId, sessionId) => {
  // Validate sessionId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('Invalid session ID');
    error.statusCode = 400;
    throw error;
  }

  // Find session with ownership check
  const session = await WorkSession.findOne({ _id: sessionId, user: userId });

  if (!session) {
    const error = new Error('Work session not found');
    error.statusCode = 404;
    throw error;
  }

  return session;
};

// Update a work session
workSessionService.updateSession = async (userId, sessionId, updateData) => {
  // Validate sessionId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('Invalid session ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate input
  const { isValid, errors } = validateWorkSessionUpdate(updateData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Find session with ownership check
  const session = await WorkSession.findOne({ _id: sessionId, user: userId });

  if (!session) {
    const error = new Error('Work session not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent updating protected fields
  const protectedFields = ['user', '_id', 'createdAt', 'updatedAt', 'durationMinutes'];
  protectedFields.forEach(field => {
    delete updateData[field]; // Remove any attempt to update protected fields
  });

  // Handle task changes and relationship inference
  if (updateData.task !== undefined) {
    if (updateData.task === null) {
      // Clearing task
      updateData.task = null;
      // Clear inferred relationships when task is cleared (unless explicitly provided)
      if (updateData.dailyPlan === undefined) updateData.dailyPlan = null;
      if (updateData.weeklyPlan === undefined) updateData.weeklyPlan = null;
      if (updateData.weeklyCommitmentId === undefined) updateData.weeklyCommitmentId = null;
      if (updateData.monthlyGoal === undefined) updateData.monthlyGoal = null;
    } else {
      // Changing task
      if (!mongoose.Types.ObjectId.isValid(updateData.task)) {
        const error = new Error('Invalid task ID');
        error.statusCode = 400;
        throw error;
      }

      // Find task with ownership check
      const task = await Task.findOne({ _id: updateData.task, user: userId });
      if (!task) {
        const error = new Error('Task not found or access denied');
        error.statusCode = 404;
        throw error;
      }

      // Infer relationships from task if not explicitly provided
      if (updateData.dailyPlan === undefined && task.dailyPlan) {
        updateData.dailyPlan = task.dailyPlan;
      }
      if (updateData.weeklyPlan === undefined && task.weeklyPlan) {
        updateData.weeklyPlan = task.weeklyPlan;
      }
      if (updateData.weeklyCommitmentId === undefined && task.weeklyCommitmentId) {
        updateData.weeklyCommitmentId = task.weeklyCommitmentId;
      }
      if (updateData.monthlyGoal === undefined && task.monthlyGoal) {
        updateData.monthlyGoal = task.monthlyGoal;
      }

      // Set title from task if not provided
      if (updateData.title === undefined && task.title) {
        updateData.title = task.title;
      }
    }
  }

  // Handle direct relationship validation (when task is not changing but relationships are)
  const relationshipFields = ['dailyPlan', 'weeklyPlan', 'weeklyCommitmentId', 'monthlyGoal'];
  for (const field of relationshipFields) {
    if (updateData[field] !== undefined && updateData[field] !== null) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(updateData[field])) {
        const error = new Error(`Invalid ${field} ID`);
        error.statusCode = 400;
        throw error;
      }

      // Check ownership based on field type
      let relatedItem = null;
      switch (field) {
        case 'dailyPlan':
          relatedItem = await DailyPlan.findOne({ _id: updateData[field], user: userId });
          break;
        case 'weeklyPlan':
          relatedItem = await WeeklyPlan.findOne({ _id: updateData[field], user: userId });
          break;
        case 'weeklyCommitmentId':
          // Note: WeeklyCommitment doesn't have its own model in Phase 5
          relatedItem = { _id: updateData[field] }; // Placeholder
          break;
        case 'monthlyGoal':
          relatedItem = await MonthlyGoal.findOne({ _id: updateData[field], user: userId });
          break;
      }

      if (!relatedItem || !relatedItem._id) {
        const error = new Error(`${field} not found or access denied`);
        error.statusCode = 404;
        throw error;
      }
    }
  }

  // For active sessions, prevent arbitrary manipulation of timestamps that breaks session integrity
  if (session.status === 'active') {
    if (updateData.startedAt !== undefined || updateData.endedAt !== undefined) {
      const error = new Error('Cannot modify timestamps of active session directly');
      error.statusCode = 400;
      throw error;
    }
  }

  // Update the session
  const updatedSession = await WorkSession.findOneAndUpdate(
    { _id: sessionId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  // If task was provided and task status was 'planned', update it to 'in_progress'
  if (updateData.task) {
    const task = await Task.findOne({ _id: updateData.task, user: userId });
    if (task && task.status === 'planned') {
      task.status = 'in_progress';
      await task.save();
    }
  }

  return updatedSession;
};

// Stop an active work session
workSessionService.stopSession = async (userId, sessionId, updateData = {}) => {
  // Validate sessionId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('Invalid session ID');
    error.statusCode = 400;
    throw error;
  }

  // Find session with ownership check
  const session = await WorkSession.findOne({ _id: sessionId, user: userId, status: 'active' });

  if (!session) {
    const error = new Error('Active work session not found');
    error.statusCode = 404;
    throw error;
  }

  // Safety cap: a forgotten session auto-stops at 24h from start so a
  // single session can never run forever. The recorded duration is capped
  // and the session is marked auto-stopped in notes for transparency.
  const now = new Date();
  const MAX_SESSION_MS = 24 * 60 * 60 * 1000;
  const elapsedMs = now - session.startedAt;
  const autoStopped = elapsedMs >= MAX_SESSION_MS;
  const endedAt = autoStopped ? new Date(session.startedAt.getTime() + MAX_SESSION_MS) : now;
  const stopUpdate = {
    endedAt, status: 'completed',
    durationMinutes: Math.floor((endedAt - session.startedAt) / 60000),
    ...Object.fromEntries(['focusRating','energyRating','outcome','blocker','notes'].filter(key => updateData[key] !== undefined).map(key => [key, updateData[key]]))
  };
  if (autoStopped) {
    stopUpdate.notes = [updateData.notes, 'Auto-stopped after 24 hours.'].filter(Boolean).join(' ');
  }

  // Validate reflection data if provided
  if (updateData.focusRating !== undefined && updateData.focusRating !== null) {
    if (updateData.focusRating < 1 || updateData.focusRating > 5 || !Number.isInteger(updateData.focusRating)) {
      const error = new Error('Focus rating must be an integer between 1 and 5');
      error.statusCode = 400;
      throw error;
    }
  }

  if (updateData.energyRating !== undefined && updateData.energyRating !== null) {
    if (updateData.energyRating < 1 || updateData.energyRating > 5 || !Number.isInteger(updateData.energyRating)) {
      const error = new Error('Energy rating must be an integer between 1 and 5');
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate text field lengths for reflection data
  if (updateData.outcome && updateData.outcome.length > 500) {
    const error = new Error('Outcome must not exceed 500 characters');
    error.statusCode = 400;
    throw error;
  }

  if (updateData.blocker && updateData.blocker.length > 200) {
    const error = new Error('Blocker must not exceed 200 characters');
    error.statusCode = 400;
    throw error;
  }

  if (updateData.notes && updateData.notes.length > 500) {
    const error = new Error('Notes must not exceed 500 characters');
    error.statusCode = 400;
    throw error;
  }

  // Atomic transition; query updates do not execute document pre-save middleware.
  const stoppedSession = await WorkSession.findOneAndUpdate(
    { _id: sessionId, user: userId, status: 'active' },
    { $set: stopUpdate },
    { new: true, runValidators: true }
  );

  return stoppedSession;
};

// Cancel an active work session
workSessionService.cancelSession = async (userId, sessionId) => {
  // Validate sessionId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('Invalid session ID');
    error.statusCode = 400;
    throw error;
  }

  // Find session with ownership check
  const session = await WorkSession.findOne({ _id: sessionId, user: userId, status: 'active' });

  if (!session) {
    const error = new Error('Active work session not found');
    error.statusCode = 404;
    throw error;
  }

  // Cancel the session
  // For cancelled sessions, we generally don't record endedAt as it shouldn't count toward productive work
  const cancelledSession = await WorkSession.findOneAndUpdate(
    { _id: sessionId, user: userId, status: 'active' },
    { $set: { status: 'cancelled' } },
    { new: true, runValidators: true }
  );

  return cancelledSession;
};

// Delete a work session
workSessionService.deleteSession = async (userId, sessionId) => {
  // Validate sessionId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    const error = new Error('Invalid session ID');
    error.statusCode = 400;
    throw error;
  }

  // Find session with ownership check and delete
  const session = await WorkSession.findOneAndDelete({ _id: sessionId, user: userId });

  if (!session) {
    const error = new Error('Work session not found');
    error.statusCode = 404;
    throw error;
  }

  return session;
};

// Get work session summary for today
workSessionService.getTodaySummary = async (userId, timezone = 'UTC') => {
  // Get today's sessions
  const sessions = await workSessionService.getTodaySessions(userId, timezone);

  // Calculate summary statistics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const activeSessions = sessions.filter(s => s.status === 'active').length;

  // Calculate actual minutes from completed sessions only
  const actualMinutes = sessions.reduce((total, session) => {
    if (session.status === 'completed' && session.durationMinutes !== null) {
      return total + session.durationMinutes;
    }
    return total;
  }, 0);

  // Calculate session type breakdown
  const sessionTypeBreakdown = {};
  sessions.forEach(session => {
    const type = session.sessionType || 'focused_work'; // Default if not set
    if (!sessionTypeBreakdown[type]) {
      sessionTypeBreakdown[type] = 0;
    }
    if (session.status === 'completed' && session.durationMinutes !== null) {
      sessionTypeBreakdown[type] += session.durationMinutes;
    }
  });

  // Calculate average ratings (only from sessions that have ratings)
  const focusRatings = sessions
    .filter(s => s.focusRating !== null && s.focusRating !== undefined)
    .map(s => s.focusRating);

  const energyRatings = sessions
    .filter(s => s.energyRating !== null && s.energyRating !== undefined)
    .map(s => s.energyRating);

  const averageFocusRating = focusRatings.length > 0
    ? focusRatings.reduce((sum, rating) => sum + rating, 0) / focusRatings.length
    : null;

  const averageEnergyRating = energyRatings.length > 0
    ? energyRatings.reduce((sum, rating) => sum + rating, 0) / energyRatings.length
    : null;

  // Count unique tasks worked on
  const tasksWorkedOn = new Set(
    sessions
      .filter(s => s.task)
      .map(s => s.task.toString())
  ).size;

  return {
    totalSessions,
    completedSessions,
    activeSessions,
    actualMinutes,
    deepWorkMinutes: sessionTypeBreakdown['deep_work'] || 0,
    focusedWorkMinutes: sessionTypeBreakdown['focused_work'] || 0,
    studyMinutes: sessionTypeBreakdown['study'] || 0,
    practiceMinutes: sessionTypeBreakdown['practice'] || 0,
    meetingMinutes: sessionTypeBreakdown['meeting'] || 0,
    adminMinutes: sessionTypeBreakdown['admin'] || 0,
    planningMinutes: sessionTypeBreakdown['planning'] || 0,
    otherMinutes: sessionTypeBreakdown['other'] || 0,
    averageFocusRating,
    averageEnergyRating,
    tasksWorkedOn
  };
};

// Get task work summary
workSessionService.getTaskWorkSummary = async (userId, taskId) => {
  // Validate taskId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    const error = new Error('Invalid task ID');
    error.statusCode = 400;
    throw error;
  }

  // Find task with ownership check
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    const error = new Error('Task not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  // Get all completed work sessions for this task
  const sessions = await WorkSession.find({
    user: userId,
    task: taskId,
    status: 'completed'
  });

  // Calculate summary statistics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length; // Should be all of them

  // Calculate actual minutes from completed sessions
  const actualMinutes = sessions.reduce((total, session) => {
    if (session.durationMinutes !== null) {
      return total + session.durationMinutes;
    }
    return total;
  }, 0);

  // Calculate estimation metrics
  const estimatedMinutes = task.estimatedMinutes || 0;
  const differenceMinutes = actualMinutes - estimatedMinutes;
  const estimationAccuracy = estimatedMinutes > 0
    ? calculateEstimationAccuracy(estimatedMinutes, actualMinutes)
    : null;

  return {
    taskId: task._id,
    taskTitle: task.title,
    estimatedMinutes,
    actualMinutes,
    differenceMinutes,
    estimationAccuracy,
    totalSessions,
    completedSessions
  };
};

module.exports = workSessionService;