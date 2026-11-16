const Task = require('../models/task.model');
const DailyPlan = require('../models/dailyPlan.model');
const WeeklyPlan = require('../models/weeklyPlan.model');
const MonthlyGoal = require('../models/monthlyGoal.model');
const Project = require('../models/project.model');
const { validateTask, validateTaskUpdate } = require('../validators/task.validator');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const taskService = {};

// Create a new task
taskService.createTask = async (userId, taskData) => {
  // Validate input
  const { isValid, errors } = validateTask(taskData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Validate that any referenced resources belong to the user
  if (taskData.dailyPlan) {
    if (!mongoose.Types.ObjectId.isValid(taskData.dailyPlan)) {
      const error = new Error('Invalid daily plan ID');
      error.statusCode = 400;
      throw error;
    }

    const dailyPlan = await DailyPlan.findOne({ _id: taskData.dailyPlan, user: userId });
    if (!dailyPlan) {
      const error = new Error('Daily plan not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  if (taskData.weeklyPlan) {
    if (!mongoose.Types.ObjectId.isValid(taskData.weeklyPlan)) {
      const error = new Error('Invalid weekly plan ID');
      error.statusCode = 400;
      throw error;
    }

    const weeklyPlan = await WeeklyPlan.findOne({ _id: taskData.weeklyPlan, user: userId });
    if (!weeklyPlan) {
      const error = new Error('Weekly plan not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  if (taskData.monthlyGoal) {
    if (!mongoose.Types.ObjectId.isValid(taskData.monthlyGoal)) {
      const error = new Error('Invalid monthly goal ID');
      error.statusCode = 400;
      throw error;
    }

    const monthlyGoal = await MonthlyGoal.findOne({ _id: taskData.monthlyGoal, user: userId });
    if (!monthlyGoal) {
      const error = new Error('Monthly goal not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  // Validate project relationship
  if (taskData.project) {
    if (!mongoose.Types.ObjectId.isValid(taskData.project)) {
      const error = new Error('Invalid project ID');
      error.statusCode = 400;
      throw error;
    }

    const project = await Project.findOne({ _id: taskData.project, user: userId });
    if (!project) {
      const error = new Error('Project not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  // Validate projectMilestoneId relationship
  if (taskData.projectMilestoneId) {
    if (!mongoose.Types.ObjectId.isValid(taskData.projectMilestoneId)) {
      const error = new Error('Invalid project milestone ID');
      error.statusCode = 400;
      throw error;
    }

    // If projectMilestoneId is provided, project must also be provided
    if (!taskData.project) {
      const error = new Error('Project must be specified when projectMilestoneId is provided');
      error.statusCode = 400;
      throw error;
    }

    // Verify that the milestone exists in the project
    const project = await Project.findOne({ _id: taskData.project, user: userId });
    if (!project) {
      const error = new Error('Project not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    const milestone = project.milestones.id(taskData.projectMilestoneId);
    if (!milestone) {
      const error = new Error('Project milestone not found in the specified project');
      error.statusCode = 404;
      throw error;
    }
  }

  // Create task with user ID from authenticated user (never from client)
  const task = new Task({
    ...taskData,
    user: userId
  });

  // Save to database
  const savedTask = await task.save();
  return savedTask;
};

// Get all tasks for a user with optional filtering
taskService.getTasks = async (userId, filters = {}) => {
  // Build query - always include user ID for ownership protection
  const query = { user: userId };

  // Add optional filters
  if (filters.date) {
    try {
      const date = new Date(filters.date);
      if (!isNaN(date.getTime())) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lte: endOfDay };
      }
    } catch (e) {
      // Invalid date, ignore filter
    }
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (filters.status) {
    query.status = filters.status;
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

  // Execute query - sort by date descending, then by order
  const tasks = await Task.find(query).sort({ date: -1, order: 1 });
  return tasks;
};

// Get today's tasks for a user
taskService.getTodayTasks = async (userId, timezone = 'UTC') => {
  // For simplicity, we'll use UTC and note that proper timezone handling
  // would require a date library like date-fns-tz
  const now = new Date();

  // Calculate start of today in UTC (00:00:00.000)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Calculate end of today (23:59:59.999)
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // Find today's tasks for this user
  const tasks = await Task.find({
    user: userId,
    date: { $gte: startOfToday, $lte: endOfToday }
  }).sort({ order: 1 });

  return tasks;
};

// Get a single task by ID with ownership check
taskService.getTaskById = async (userId, taskId) => {
  // Validate taskId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    const error = new Error('Invalid task ID');
    error.statusCode = 400;
    throw error;
  }

  // Find task with ownership check
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  return task;
};

// Update a task by ID
taskService.updateTask = async (userId, taskId, updateData) => {
  // Validate taskId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    const error = new Error('Invalid task ID');
    error.statusCode = 400;
    throw error;
  }

  // Validate input (excluding protected fields)
  const { isValid, errors } = validateTaskUpdate(updateData);
  if (!isValid) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  // Validate that any referenced resources belong to the user
  const relationshipFields = ['dailyPlan', 'weeklyPlan', 'monthlyGoal'];
  for (const field of relationshipFields) {
    if (updateData[field]) {
      if (!mongoose.Types.ObjectId.isValid(updateData[field])) {
        const error = new Error(`Invalid ${field} ID`);
        error.statusCode = 400;
        throw error;
      }

      let relatedItem = null;
      switch (field) {
        case 'dailyPlan':
          relatedItem = await DailyPlan.findOne({ _id: updateData[field], user: userId });
          break;
        case 'weeklyPlan':
          relatedItem = await WeeklyPlan.findOne({ _id: updateData[field], user: userId });
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

  // Validate project relationship
  if (updateData.project !== undefined && updateData.project !== null) {
    if (!mongoose.Types.ObjectId.isValid(updateData.project)) {
      const error = new Error('Invalid project ID');
      error.statusCode = 400;
      throw error;
    }

    const project = await Project.findOne({ _id: updateData.project, user: userId });
    if (!project) {
      const error = new Error('Project not found or access denied');
      error.statusCode = 404;
      throw error;
    }
  }

  // Validate projectMilestoneId relationship
  if (updateData.projectMilestoneId !== undefined && updateData.projectMilestoneId !== null) {
    if (!mongoose.Types.ObjectId.isValid(updateData.projectMilestoneId)) {
      const error = new Error('Invalid project milestone ID');
      error.statusCode = 400;
      throw error;
    }

    // If projectMilestoneId is provided, project must also be provided
    if (!updateData.project) {
      const error = new Error('Project must be specified when projectMilestoneId is provided');
      error.statusCode = 400;
      throw error;
    }

    // Verify that the milestone exists in the project
    const project = await Project.findOne({ _id: updateData.project, user: userId });
    if (!project) {
      const error = new Error('Project not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    const milestone = project.milestones.id(updateData.projectMilestoneId);
    if (!milestone) {
      const error = new Error('Project milestone not found in the specified project');
      error.statusCode = 404;
      throw error;
    }
  }

  // Handle special case for weeklyCommitmentId (embedded in WeeklyPlan)
  if (updateData.weeklyCommitmentId !== undefined) {
    if (updateData.weeklyCommitmentId !== null) {
      if (!mongoose.Types.ObjectId.isValid(updateData.weeklyCommitmentId)) {
        const error = new Error('Invalid weekly commitment ID');
        error.statusCode = 400;
        throw error;
      }
      // Note: We can't easily validate ownership of embedded commitments without
      // getting the weekly plan first. This would require additional logic.
      // For now, we'll assume if the weekly plan is valid and owned by user,
      // then commitments within it are accessible.
    }
  }

  // Find task with ownership check and update
  const task = await Task.findOneAndUpdate(
    { _id: taskId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  return task;
};

// Delete a task by ID
taskService.deleteTask = async (userId, taskId) => {
  // Validate taskId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    const error = new Error('Invalid task ID');
    error.statusCode = 400;
    throw error;
  }

  // Find task with ownership check and delete
  const task = await Task.findOneAndDelete({ _id: taskId, user: userId });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  return task;
};

// Complete a task
taskService.completeTask = async (userId, taskId) => {
  // Validate taskId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    const error = new Error('Invalid task ID');
    error.statusCode = 400;
    throw error;
  }

  // Find task with ownership check
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  // Complete the task
  task.status = 'completed';
  task.completedAt = new Date();

  const completedTask = await task.save();
  return completedTask;
};

// Reopen a task
taskService.reopenTask = async (userId, taskId) => {
  // Validate taskId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    const error = new Error('Invalid task ID');
    error.statusCode = 400;
    throw error;
  }

  // Find task with ownership check
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  // Only allow reopening completed or skipped tasks
  if (task.status !== 'completed' && task.status !== 'skipped') {
    const error = new Error('Only completed or skipped tasks can be reopened');
    error.statusCode = 400;
    throw error;
  }

  // Reopen the task
  task.status = 'planned'; // or 'in_progress' depending on preference
  task.completedAt = null;

  const reopenedTask = await task.save();
  return reopenedTask;
};

// Skip a task
taskService.skipTask = async (userId, taskId, skipData = {}) => {
  // Validate taskId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    const error = new Error('Invalid task ID');
    error.statusCode = 400;
    throw error;
  }

  // Find task with ownership check
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  // Only allow skipping planned or in_progress tasks
  if (task.status !== 'planned' && task.status !== 'in_progress') {
    const error = new Error('Only planned or in progress tasks can be skipped');
    error.statusCode = 400;
    throw error;
  }

  // Validate skip reason if provided
  if (skipData.skipReason) {
    const validSkipReasons = ['low_energy', 'unexpected_obstacle', 'change_in_priority', 'lack_of_resources', 'other'];
    if (!validSkipReasons.includes(skipData.skipReason)) {
      const error = new Error('Invalid skip reason');
      error.statusCode = 400;
      throw error;
    }
  }

  // Skip the task
  task.status = 'skipped';
  if (skipData.skipReason) {
    task.skipReason = skipData.skipReason;
  }
  if (skipData.skipNote) {
    task.skipNote = skipData.skipNote;
  }

  const skippedTask = await task.save();
  return skippedTask;
};

// Reschedule a task
taskService.rescheduleTask = async (userId, taskId, rescheduleData = {}) => {
  // Validate taskId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    const error = new Error('Invalid task ID');
    error.statusCode = 400;
    throw error;
  }

  // Find task with ownership check
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  // Only allow rescheduling planned or in_progress tasks
  if (task.status !== 'planned' && task.status !== 'in_progress') {
    const error = new Error('Only planned or in progress tasks can be rescheduled');
    error.statusCode = 400;
    throw error;
  }

  // Validate new date if provided
  if (rescheduleData.date) {
    const date = new Date(rescheduleData.date);
    if (isNaN(date.getTime())) {
      const error = new Error('Invalid date format');
      error.statusCode = 400;
      throw error;
    }
    task.date = date;
  }

  // Increment reschedule count
  task.rescheduleCount = (task.rescheduleCount || 0) + 1;

  const rescheduledTask = await task.save();
  return rescheduledTask;
};

module.exports = taskService;