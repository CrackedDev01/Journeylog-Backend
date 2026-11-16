const taskService = require('../services/task.service');
const asyncHandler = require('../utils/asyncHandler');

const taskController = {};

// Create a new task
taskController.createTask = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskData = req.body;

  const task = await taskService.createTask(userId, taskData);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: {
      task
    }
  });
});

// Get all tasks for the authenticated user with filtering
taskController.getTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filters = req.query;

  const tasks = await taskService.getTasks(userId, filters);

  res.status(200).json({
    success: true,
    data: {
      tasks
    }
  });
});

// Get today's tasks
taskController.getTodayTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timezone = req.user.timezone || 'UTC';

  const tasks = await taskService.getTodayTasks(userId, timezone);

  res.status(200).json({
    success: true,
    data: {
      tasks
    }
  });
});

// Get a specific task by ID
taskController.getTaskById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskId = req.params.taskId;

  const task = await taskService.getTaskById(userId, taskId);

  res.status(200).json({
    success: true,
    data: {
      task
    }
  });
});

// Update a task by ID
taskController.updateTask = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskId = req.params.taskId;
  const updateData = req.body;

  const task = await taskService.updateTask(userId, taskId, updateData);

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: {
      task
    }
  });
});

// Delete a task by ID
taskController.deleteTask = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskId = req.params.taskId;

  await taskService.deleteTask(userId, taskId);

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
});

// Complete a task
taskController.completeTask = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskId = req.params.taskId;

  const task = await taskService.completeTask(userId, taskId);

  res.status(200).json({
    success: true,
    message: 'Task completed successfully',
    data: {
      task
    }
  });
});

// Reopen a task
taskController.reopenTask = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskId = req.params.taskId;

  const task = await taskService.reopenTask(userId, taskId);

  res.status(200).json({
    success: true,
    message: 'Task reopened successfully',
    data: {
      task
    }
  });
});

// Skip a task
taskController.skipTask = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskId = req.params.taskId;
  const skipData = req.body || {};

  const task = await taskService.skipTask(userId, taskId, skipData);

  res.status(200).json({
    success: true,
    message: 'Task skipped successfully',
    data: {
      task
    }
  });
});

// Reschedule a task
taskController.rescheduleTask = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const taskId = req.params.taskId;
  const rescheduleData = req.body || {};

  const task = await taskService.rescheduleTask(userId, taskId, rescheduleData);

  res.status(200).json({
    success: true,
    message: 'Task rescheduled successfully',
    data: {
      task
    }
  });
});

module.exports = taskController;