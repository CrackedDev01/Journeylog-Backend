const workSessionService = require('../services/workSession.service');
const asyncHandler = require('../utils/asyncHandler');

const workSessionController = {};

// Start a new work session
workSessionController.startSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionData = req.body;

  const workSession = await workSessionService.startSession(userId, sessionData);

  res.status(201).json({
    success: true,
    message: 'Work session started successfully',
    data: {
      workSession
    }
  });
});

// Create a manual work session
workSessionController.createSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionData = req.body;

  const workSession = await workSessionService.createSession(userId, sessionData);

  res.status(201).json({
    success: true,
    message: 'Work session created successfully',
    data: {
      workSession
    }
  });
});

// Get all work sessions for the authenticated user with filtering
workSessionController.getSessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = req.query;

  const sessions = await workSessionService.getSessions(userId, filters);

  res.status(200).json({
    success: true,
    data: {
      sessions
    }
  });
});

// Get today's work sessions
workSessionController.getTodaySessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.user.timezone || 'UTC';

  const sessions = await workSessionService.getTodaySessions(userId, timezone);

  res.status(200).json({
    success: true,
    data: {
      sessions
    }
  });
});

// Get active work session
workSessionController.getActiveSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const session = await workSessionService.getActiveSession(userId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'No active work session found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      workSession: session
    }
  });
});

// Get a specific work session by ID
workSessionController.getSessionById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionId = req.params.sessionId;

  const session = await workSessionService.getSessionById(userId, sessionId);

  res.status(200).json({
    success: true,
    data: {
      workSession: session
    }
  });
});

// Update a work session
workSessionController.updateSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionId = req.params.sessionId;
  const updateData = req.body;

  const workSession = await workSessionService.updateSession(userId, sessionId, updateData);

  res.status(200).json({
    success: true,
    message: 'Work session updated successfully',
    data: {
      workSession
    }
  });
});

// Stop an active work session
workSessionController.stopSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionId = req.params.sessionId;
  const updateData = req.body || {};

  const workSession = await workSessionService.stopSession(userId, sessionId, updateData);

  res.status(200).json({
    success: true,
    message: 'Work session stopped successfully',
    data: {
      workSession
    }
  });
});

// Cancel an active work session
workSessionController.cancelSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionId = req.params.sessionId;

  const workSession = await workSessionService.cancelSession(userId, sessionId);

  res.status(200).json({
    success: true,
    message: 'Work session cancelled successfully',
    data: {
      workSession
    }
  });
});

// Delete a work session
workSessionController.deleteSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionId = req.params.sessionId;

  await workSessionService.deleteSession(userId, sessionId);

  res.status(200).json({
    success: true,
    message: 'Work session deleted successfully'
  });
});

// Get work session summary for today
workSessionController.getTodaySummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.user.timezone || 'UTC';

  const summary = await workSessionService.getTodaySummary(userId, timezone);

  res.status(200).json({
    success: true,
    data: {
      summary
    }
  });
});

// Get task work summary
workSessionController.getTaskWorkSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskId = req.params.taskId;

  const summary = await workSessionService.getTaskWorkSummary(userId, taskId);

  res.status(200).json({
    success: true,
    data: {
      summary
    }
  });
});

module.exports = workSessionController;