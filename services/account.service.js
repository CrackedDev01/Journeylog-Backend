const User = require('../models/user.model');
const MonthlyGoal = require('../models/monthlyGoal.model');
const WeeklyPlan = require('../models/weeklyPlan.model');
const DailyPlan = require('../models/dailyPlan.model');
const Task = require('../models/task.model');
const WorkSession = require('../models/workSession.model');
const DailyReview = require('../models/dailyReview.model');
const WeeklyReview = require('../models/weeklyReview.model');
const MonthlyReview = require('../models/monthlyReview.model');
const Habit = require('../models/habit.model');
const HabitLog = require('../models/habitLog.model');
const Project = require('../models/project.model');
const Skill = require('../models/skill.model');
const LearningSession = require('../models/learningSession.model');

const EXPORT_VERSION = 1;

const stripSensitive = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.password;
  return obj;
};

const accountService = {};

// Gather all user-owned data for export
accountService.exportUserData = async (userId) => {
  const user = await User.findById(userId).select('-password').lean();
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const [
    monthlyGoals,
    weeklyPlans,
    dailyPlans,
    tasks,
    workSessions,
    dailyReviews,
    weeklyReviews,
    monthlyReviews,
    habits,
    habitLogs,
    projects,
    skills,
    learningSessions,
  ] = await Promise.all([
    MonthlyGoal.find({ user: userId }).lean(),
    WeeklyPlan.find({ user: userId }).lean(),
    DailyPlan.find({ user: userId }).lean(),
    Task.find({ user: userId }).lean(),
    WorkSession.find({ user: userId }).lean(),
    DailyReview.find({ user: userId }).lean(),
    WeeklyReview.find({ user: userId }).lean(),
    MonthlyReview.find({ user: userId }).lean(),
    Habit.find({ user: userId }).lean(),
    HabitLog.find({ user: userId }).lean(),
    Project.find({ user: userId }).lean(),
    Skill.find({ user: userId }).lean(),
    LearningSession.find({ user: userId }).lean(),
  ]);

  return {
    exportVersion: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    timezone: user.timezone || 'Africa/Lagos',
    profile: stripSensitive(user),
    monthlyGoals,
    weeklyPlans,
    dailyPlans,
    tasks,
    workSessions,
    dailyReviews,
    weeklyReviews,
    monthlyReviews,
    habits,
    habitLogs,
    projects,
    skills,
    learningSessions,
  };
};

// Delete account + all owned records. Uses a transaction when the
// deployment supports it (replica set); otherwise sequential deletes.
accountService.deleteAccount = async (userId, { currentPassword, confirmation }) => {
  if (confirmation !== 'DELETE') {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = { confirmation: 'Please type DELETE to confirm account deletion' };
    throw error;
  }
  if (!currentPassword) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = { currentPassword: 'Please provide your current password' };
    throw error;
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 401;
    throw error;
  }

  const deletions = [
    [MonthlyGoal, 'monthlyGoals'],
    [WeeklyPlan, 'weeklyPlans'],
    [DailyPlan, 'dailyPlans'],
    [Task, 'tasks'],
    [WorkSession, 'workSessions'],
    [DailyReview, 'dailyReviews'],
    [WeeklyReview, 'weeklyReviews'],
    [MonthlyReview, 'monthlyReviews'],
    [HabitLog, 'habitLogs'],
    [Habit, 'habits'],
    [Project, 'projects'],
    [LearningSession, 'learningSessions'],
    [Skill, 'skills'],
  ];

  const counts = {};
  let session = null;
  try {
    session = await User.startSession();
    session.startTransaction();
  } catch {
    session = null; // standalone MongoDB: fall back to sequential deletes
  }

  try {
    for (const [Model, key] of deletions) {
      const res = session
        ? await Model.deleteMany({ user: userId }).session(session)
        : await Model.deleteMany({ user: userId });
      counts[key] = res.deletedCount || 0;
    }
    if (session) {
      await User.deleteOne({ _id: userId }).session(session);
      await session.commitTransaction();
    } else {
      await User.deleteOne({ _id: userId });
    }
    counts.user = 1;
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch { /* ignore */ }
    }
    const error = new Error('Account deletion failed. No data was removed.');
    error.statusCode = 500;
    throw error;
  } finally {
    if (session) {
      try { await session.endSession(); } catch { /* ignore */ }
    }
  }

  return { deletedCounts: counts, transactional: Boolean(session) };
};

module.exports = accountService;
