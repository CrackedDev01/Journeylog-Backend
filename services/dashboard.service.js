// Services will be imported as needed to avoid circular dependencies
const mongoose = require('mongoose');

const dashboardService = {};

// Helper function to get today's date range in user's timezone
// For simplicity, we'll use UTC and note that proper timezone handling
// would require a date library like date-fns-tz
dashboardService.getTodayRange = () => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  return { start: startOfToday, end: endOfToday };
};

// Helper function to get this week's date range (Monday to Sunday)
dashboardService.getWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(now);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
  endOfWeek.setHours(23, 59, 59, 999);

  return { start: startOfWeek, end: endOfWeek };
};

// Helper function to get this month's date range
dashboardService.getMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
  endOfMonth.setHours(23, 59, 59, 999);

  return { start: startOfMonth, end: endOfMonth };
};

// Get main dashboard overview
dashboardService.getOverview = async (userId) => {
  try {
    const [todayData, weekData, monthData, projectsData, habitsData, learningData] = await Promise.all([
      dashboardService.getTodayDashboard(userId),
      dashboardService.getWeekDashboard(userId),
      dashboardService.getMonthDashboard(userId),
      dashboardService.getProjectsOverview(userId),
      dashboardService.getHabitsOverview(userId),
      dashboardService.getLearningOverview(userId)
    ]);

    return {
      success: true,
      data: {
        user: {
          // In a real implementation, we would fetch user profile data
          name: "User",
          timezone: "UTC"
        },
        today: todayData.data || {},
        week: weekData.data || {},
        month: monthData.data || {},
        projects: projectsData.data || {},
        habits: habitsData.data || {},
        learning: learningData.data || {}
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw error;
  }
};

// Get today's dashboard
dashboardService.getTodayDashboard = async (userId) => {
  // Import models here to avoid circular dependencies
  const DailyPlan = require('../models/dailyPlan.model');
  const Task = require('../models/task.model');
  const Habit = require('../models/habit.model');
  const HabitLog = require('../models/habitLog.model');
  const WorkSession = require('../models/workSession.model');
  const DailyReview = require('../models/dailyReview.model');

  const { start, end } = dashboardService.getTodayRange();

  try {
    // Get daily plan
    const dailyPlan = await DailyPlan.findOne({
      user: userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 }).lean();

    // Get tasks for today
    const tasks = await Task.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    // Get habits for today
    const habits = await Habit.find({ user: userId }).lean();
    const habitLogs = await HabitLog.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    // Get work sessions for today
    const workSessions = await WorkSession.find({
      user: userId,
      startedAt: { $gte: start, $lte: end }
    }).lean();

    // Get daily review for today
    const dailyReview = await DailyReview.findOne({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    // Calculate metrics
    const plannedMinutes = tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
    const actualMinutes = workSessions.reduce((sum, session) => {
      if (session.status !== 'cancelled' && session.actualMinutes) {
        return sum + session.actualMinutes;
      }
      return sum;
    }, 0);

    const capacityUsage = plannedMinutes > 0 ? (actualMinutes / plannedMinutes) * 100 : 0;
    let capacityStatus = 'realistic';
    if (capacityUsage > 110) capacityStatus = 'overloaded';
    else if (capacityUsage < 50) capacityStatus = 'underloaded';

    const mustDoTasks = tasks.filter(task => task.priority === 'must_do');
    const completedMustDoTasks = mustDoTasks.filter(task => task.status === 'completed');

    const habitItems = habits.map(habit => {
      const log = habitLogs.find(log => log.habit.toString() === habit._id.toString());
      return {
        id: habit._id,
        name: habit.name,
        completed: log ? log.completed : false,
        partial: log ? log.partial : false,
        note: log ? log.note : null
      };
    });

    const scheduledHabitsCount = habits.length;
    const completedHabitsCount = habitItems.filter(item => item.completed).length;
    const partialHabitsCount = habitItems.filter(item => item.partial).length;

    let activeWorkSession = null;
    if (workSessions.length > 0) {
      // Find the most recent active session
      const activeSession = workSessions.find(session =>
        session.status === 'in_progress' ||
        (session.startedAt && !session.stoppedAt)
      );
      if (activeSession) {
        activeWorkSession = {
          id: activeSession._id,
          startedAt: activeSession.startedAt,
          elapsedMinutes: activeSession.actualMinutes || 0,
          task: activeSession.task ? {
            id: activeSession.task,
            title: activeSession.taskTitle || 'Unknown Task'
          } : null,
          sessionType: activeSession.sessionType
        };
      }
    }

    return {
      success: true,
      data: {
        date: start.toISOString().split('T')[0],
        dailyPlan: dailyPlan ? {
          id: dailyPlan._id,
          dailyFocus: dailyPlan.dailyFocus,
          intention: dailyPlan.intention,
          availableMinutes: dailyPlan.availableMinutes
        } : null,
        workload: {
          plannedMinutes,
          actualMinutes,
          capacityUsage: parseFloat(capacityUsage.toFixed(2)),
          capacityStatus
        },
        tasks: {
          total: tasks.length,
          completed: tasks.filter(task => task.status === 'completed').length,
          mustDo: {
            total: mustDoTasks.length,
            completed: completedMustDoTasks.length
          },
          items: tasks.map(task => ({
            id: task._id,
            title: task.title,
            priority: task.priority,
            status: task.status,
            estimatedMinutes: task.estimatedMinutes,
            dueTime: task.dueTime,
            project: task.project ? { id: task.project } : null,
            monthlyGoal: task.monthlyGoal ? { id: task.monthlyGoal } : null,
            weeklyCommitmentId: task.weeklyCommitmentId
          }))
        },
        habits: {
          scheduled: scheduledHabitsCount,
          completed: completedHabitsCount,
          partial: partialHabitsCount,
          remaining: scheduledHabitsCount - completedHabitsCount - partialHabitsCount,
          items: habitItems
        },
        work: {
          activeSession: activeWorkSession,
          completedSessions: workSessions.filter(session => session.status === 'completed').length,
          actualMinutes
        },
        review: {
          completed: dailyReview ? dailyReview.completed : false,
          id: dailyReview ? dailyReview._id : null
        }
      }
    };
  } catch (error) {
    console.error('Error fetching today dashboard:', error);
    throw error;
  }
};

// Get week dashboard
dashboardService.getWeekDashboard = async (userId) => {
  // Import models here to avoid circular dependencies
  const WeeklyPlan = require('../models/weeklyPlan.model');
  const Task = require('../models/task.model');
  const Habit = require('../models/habit.model');
  const HabitLog = require('../models/habitLog.model');
  const WorkSession = require('../models/workSession.model');
  const Project = require('../models/project.model');
  const Skill = require('../models/skill.model');
  const LearningSession = require('../models/learningSession.model');
  const WeeklyReview = require('../models/weeklyReview.model');

  const { start, end } = dashboardService.getWeekRange();

  try {
    // Get weekly plan
    const weeklyPlan = await WeeklyPlan.findOne({
      user: userId,
      weekStart: { $lte: start },
      weekEnd: { $gte: end }
    }).lean();

    // Get tasks for the week
    const tasks = await Task.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    // Get habits for the week
    const habits = await Habit.find({ user: userId }).lean();
    const habitLogs = await HabitLog.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    // Get work sessions for the week
    const workSessions = await WorkSession.find({
      user: userId,
      startedAt: { $gte: start, $lte: end }
    }).lean();

    // Get projects
    const projects = await Project.find({
      user: userId,
      status: { $in: ['active', 'planned'] }
    }).lean();

    // Get learning sessions for the week
    const learningSessions = await LearningSession.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).populate('skill', 'name').lean();

    // Get weekly review
    const weeklyReview = await WeeklyReview.findOne({
      user: userId,
      weekStart: { $lte: start },
      weekEnd: { $gte: end }
    }).lean();

    // Calculate metrics
    const plannedMinutes = tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
    const actualMinutes = workSessions.reduce((sum, session) => {
      if (session.status !== 'cancelled' && session.actualMinutes) {
        return sum + session.actualMinutes;
      }
      return sum;
    }, 0);

    const habitItems = habits.map(habit => {
      const weekLogs = habitLogs.filter(log => log.habit.toString() === habit._id.toString());
      const completedCount = weekLogs.filter(log => log.completed).length;
      return {
        id: habit._id,
        name: habit.name,
        scheduledCount: weekLogs.length,
        completedCount,
        completionRate: weekLogs.length > 0 ? (completedCount / weekLogs.length) * 100 : 0
      };
    });

    const totalScheduledHabits = habitItems.reduce((sum, habit) => sum + habit.scheduledCount, 0);
    const totalCompletedHabits = habitItems.reduce((sum, habit) => sum + habit.completedCount, 0);
    const habitCompletionRate = totalScheduledHabits > 0 ? (totalCompletedHabits / totalScheduledHabits) * 100 : 0;

    const mustDoTasks = tasks.filter(task => task.priority === 'must_do');
    const completedMustDoTasks = mustDoTasks.filter(task => task.status === 'completed');

    // Get daily breakdown
    const dailyBreakdown = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate >= dayStart && taskDate <= dayEnd;
      });

      const dayWorkSessions = workSessions.filter(session => {
        const sessionStart = new Date(session.startedAt);
        return sessionStart >= dayStart && sessionStart <= dayEnd;
      });

      dailyBreakdown.push({
        date: currentDate.toISOString().split('T')[0],
        tasks: {
          total: dayTasks.length,
          completed: dayTasks.filter(task => task.status === 'completed').length
        },
        work: {
          actualMinutes: dayWorkSessions.reduce((sum, session) => {
            if (session.status !== 'cancelled' && session.actualMinutes) {
              return sum + session.actualMinutes;
            }
            return sum;
          }, 0)
        }
      });

      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      success: true,
      data: {
        weekStart: start.toISOString().split('T')[0],
        weekEnd: end.toISOString().split('T')[0],
        weeklyPlan: weeklyPlan ? {
          id: weeklyPlan._id,
          weeklyFocus: weeklyPlan.weeklyFocus
        } : null,
        commitments: {
          total: 0, // Would need to fetch from WeeklyCommitment if we had it separately
          completed: 0,
          progress: 0
        },
        tasks: {
          total: tasks.length,
          completed: tasks.filter(task => task.status === 'completed').length,
          mustDoCount: mustDoTasks.length,
          completedMustDoCount: completedMustDoTasks.length
        },
        time: {
          plannedMinutes,
          actualMinutes
        },
        habits: {
          scheduled: totalScheduledHabits,
          completed: totalCompletedHabits,
          completionRate: parseFloat(habitCompletionRate.toFixed(2))
        },
        learning: {
          sessions: learningSessions.length,
          minutes: learningSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0),
          skillsPracticed: [...new Set(learningSessions.map(session => session.skill ? session.skill._id : null))].filter(id => id !== null).length
        },
        review: {
          completed: weeklyReview ? weeklyReview.completed : false
        },
        dailyBreakdown
      }
    };
  } catch (error) {
    console.error('Error fetching week dashboard:', error);
    throw error;
  }
};

// Get month dashboard
dashboardService.getMonthDashboard = async (userId) => {
  // Import models here to avoid circular dependencies
  const MonthlyGoal = require('../models/monthlyGoal.model');
  const Task = require('../models/task.model');
  const Habit = require('../models/habit.model');
  const HabitLog = require('../models/habitLog.model');
  const WorkSession = require('../models/workSession.model');
  const Project = require('../models/project.model');
  const Skill = require('../models/skill.model');
  const LearningSession = require('../models/learningSession.model');
  const MonthlyReview = require('../models/monthlyReview.model');

  const { start, end } = dashboardService.getMonthRange();

  try {
    // Get monthly goals
    const monthlyGoals = await MonthlyGoal.find({
      user: userId,
      year: start.getFullYear(),
      month: start.getMonth() + 1 // Month is 0-indexed in JS
    }).lean();

    // Get tasks for the month
    const tasks = await Task.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    // Get habits for the month
    const habits = await Habit.find({ user: userId }).lean();
    const habitLogs = await HabitLog.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).lean();

    // Get work sessions for the month
    const workSessions = await WorkSession.find({
      user: userId,
      startedAt: { $gte: start, $lte: end }
    }).lean();

    // Get projects
    const projects = await Project.find({
      user: userId
    }).lean();

    // Get learning sessions for the month
    const learningSessions = await LearningSession.find({
      user: userId,
      date: { $gte: start, $lte: end }
    }).populate('skill', 'name').lean();

    // Get monthly review
    const monthlyReview = await MonthlyReview.findOne({
      user: userId,
      year: start.getFullYear(),
      month: start.getMonth() + 1
    }).lean();

    // Calculate metrics
    const plannedMinutes = tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
    const actualMinutes = workSessions.reduce((sum, session) => {
      if (session.status !== 'cancelled' && session.actualMinutes) {
        return sum + session.actualMinutes;
      }
      return sum;
    }, 0);

    const habitItems = habits.map(habit => {
      const monthLogs = habitLogs.filter(log => log.habit.toString() === habit._id.toString());
      const completedCount = monthLogs.filter(log => log.completed).length;
      return {
        id: habit._id,
        name: habit.name,
        scheduledCount: monthLogs.length,
        completedCount,
        completionRate: monthLogs.length > 0 ? (completedCount / monthLogs.length) * 100 : 0
      };
    });

    const totalScheduledHabits = habitItems.reduce((sum, habit) => sum + habit.scheduledCount, 0);
    const totalCompletedHabits = habitItems.reduce((sum, habit) => sum + habit.completedCount, 0);
    const habitCompletionRate = totalScheduledHabits > 0 ? (totalCompletedHabits / totalScheduledHabits) * 100 : 0;

    // Get goal progress
    const goalProgress = monthlyGoals.map(goal => ({
      id: goal._id,
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      status: goal.status,
      progress: goal.progress || 0,
      estimatedHours: goal.estimatedHours
    }));

    return {
      success: true,
      data: {
        year: start.getFullYear(),
        month: start.getMonth() + 1,
        monthlyGoals: goalProgress,
        goals: {
          total: monthlyGoals.length,
          completed: monthlyGoals.filter(goal => goal.status === 'completed').length,
          inProgress: monthlyGoals.filter(goal => goal.status === 'active').length,
          notStarted: monthlyGoals.filter(goal => goal.status === 'planned').length,
          paused: monthlyGoals.filter(goal => goal.status === 'paused').length
        },
        tasks: {
          total: tasks.length,
          completed: tasks.filter(task => task.status === 'completed').length,
          mustDoCount: tasks.filter(task => task.priority === 'must_do').length,
          completedMustDoCount: tasks.filter(task => task.priority === 'must_do' && task.status === 'completed').length
        },
        time: {
          plannedMinutes,
          actualMinutes
        },
        habits: {
          scheduled: totalScheduledHabits,
          completed: totalCompletedHabits,
          completionRate: parseFloat(habitCompletionRate.toFixed(2))
        },
        learning: {
          sessions: learningSessions.length,
          minutes: learningSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0),
          skillsPracticed: [...new Set(learningSessions.map(session => session.skill ? session.skill._id : null))].filter(id => id !== null).length
        },
        projects: {
          total: projects.length,
          active: projects.filter(project => project.status === 'active').length,
          paused: projects.filter(project => project.status === 'paused').length,
          completed: projects.filter(project => project.status === 'completed').length
        },
        review: {
          completed: monthlyReview ? monthlyReview.completed : false
        }
      }
    };
  } catch (error) {
    console.error('Error fetching month dashboard:', error);
    throw error;
  }
};

// Get projects overview
dashboardService.getProjectsOverview = async (userId) => {
  const projectService = require('./project.service');
  const Task = require('../models/task.model');
  const result = await projectService.getProjects(userId, {}, { limit: 100 });
  const [summary, counts] = await Promise.all([
    projectService.getProjectSummary(userId),
    Task.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(String(userId)), project: { $in: result.projects.map(project => project._id) } } },
      { $group: { _id: '$project', taskCount: { $sum: 1 }, completedTaskCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
    ])
  ]);
  const byProject = new Map(counts.map(count => [String(count._id), count]));
  return { success: true, data: {
    activeProjects: summary.statusCounts.active || 0,
    pausedProjects: summary.statusCounts.paused || 0,
    projects: result.projects.map(project => ({ ...project, id: project._id,
      taskCount: byProject.get(String(project._id))?.taskCount || 0,
      completedTaskCount: byProject.get(String(project._id))?.completedTaskCount || 0
    }))
  } };
};

// Get habits overview
dashboardService.getHabitsOverview = async (userId) => {
  const Habit = require('../models/habit.model');
  const HabitLog = require('../models/habitLog.model');

  try {
    const habits = await Habit.find({ user: userId }).lean();

    // Get logs for the last 30 days for better accuracy
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const habitLogs = await HabitLog.find({
      user: userId,
      date: { $gte: thirtyDaysAgo }
    }).lean();

    const habitItems = habits.map(habit => {
      const habitSpecificLogs = habitLogs.filter(log => log.habit.toString() === habit._id.toString());
      const completedCount = habitSpecificLogs.filter(log => log.completed).length;

      return {
        id: habit._id,
        name: habit.name,
        // For simplicity, we'll calculate basic stats
        // In a real implementation, we would use the habit's schedule to calculate properly
        todayStatus: 'unknown', // Would need to check today's log
        currentStreak: 0, // Would need to calculate properly
        completionRate: habitSpecificLogs.length > 0 ?
          parseFloat((completedCount / habitSpecificLogs.length) * 100).toFixed(2) : 0
      };
    });

    return {
      success: true,
      data: {
        today: {
          scheduled: 0, // Would need to check today's schedule
          completed: 0,
          partial: 0,
          remaining: 0
        },
        week: {
          scheduled: 0, // Would need to calculate for the week
          completed: 0,
          completionRate: 0
        },
        habits: habitItems
      }
    };
  } catch (error) {
    console.error('Error fetching habits overview:', error);
    throw error;
  }
};

// Get learning overview
dashboardService.getLearningOverview = async (userId) => {
  const Skill = require('../models/skill.model');
  const LearningSession = require('../models/learningSession.model');

  try {
    const skills = await Skill.find({ user: userId }).lean();

    // Get learning sessions for different time periods
    const { start: weekStart, end: weekEnd } = dashboardService.getWeekRange();
    const { start: monthStart, end: monthEnd } = dashboardService.getMonthRange();

    const [weekSessions, monthSessions, recentSessions] = await Promise.all([
      LearningSession.find({
        user: userId,
        date: { $gte: weekStart, $lte: weekEnd }
      }).populate('skill', 'name').lean(),

      LearningSession.find({
        user: userId,
        date: { $gte: monthStart, $lte: monthEnd }
      }).populate('skill', 'name').lean(),

      LearningSession.find({
        user: userId
      })
      .sort({ date: -1 })
      .limit(10)
      .populate('skill', 'name')
      .lean()
    ]);

    return {
      success: true,
      data: {
        week: {
          sessions: weekSessions.length,
          minutes: weekSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0),
          skillsPracticed: [...new Set(weekSessions.map(session => session.skill ? session.skill._id : null))].filter(id => id !== null).length
        },
        month: {
          sessions: monthSessions.length,
          minutes: monthSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0),
          skillsPracticed: [...new Set(monthSessions.map(session => session.skill ? session.skill._id : null))].filter(id => id !== null).length
        },
        recent: recentSessions.map(session => ({
          skill: session.skill ? session.skill.name : 'Unknown Skill',
          title: session.title,
          durationMinutes: session.durationMinutes,
          date: session.date
        }))
      }
    };
  } catch (error) {
    console.error('Error fetching learning overview:', error);
    throw error;
  }
};

// Get reviews overview
dashboardService.getReviewsOverview = async (userId) => {
  const DailyReview = require('../models/dailyReview.model');
  const WeeklyReview = require('../models/weeklyReview.model');
  const MonthlyReview = require('../models/monthlyReview.model');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { start: weekStart, end: weekEnd } = dashboardService.getWeekRange();
    const { start: monthStart, end: monthEnd } = dashboardService.getMonthRange();

    const [dailyReview, weeklyReview, monthlyReview] = await Promise.all([
      DailyReview.findOne({
        user: userId,
        date: { $gte: today, $lte: new Date(today) }
      }).lean(),

      WeeklyReview.findOne({
        user: userId,
        weekStart: { $lte: weekStart },
        weekEnd: { $gte: weekEnd }
      }).lean(),

      MonthlyReview.findOne({
        user: userId,
        year: monthStart.getFullYear(),
        month: monthStart.getMonth() + 1
      }).lean()
    ]);

    // Get counts for the week
    const weekStartDate = new Date(weekStart);
    weekStartDate.setHours(0, 0, 0, 0);
    const weekEndDate = new Date(weekEnd);
    weekEndDate.setHours(23, 59, 59, 999);

    const dailyReviewsCount = await DailyReview.countDocuments({
      user: userId,
      date: { $gte: weekStartDate, $lte: weekEndDate },
      completed: true
    });

    const weekDays = 7; // Simplified

    return {
      success: true,
      data: {
        today: {
          dailyReviewCompleted: dailyReview ? dailyReview.completed : false
        },
        week: {
          weeklyReviewCompleted: weeklyReview ? weeklyReview.completed : false,
          daysReviewed: dailyReviewsCount
        },
        month: {
          monthlyReviewCompleted: monthlyReview ? monthlyReview.completed : false,
          dailyReviewsCompleted: await DailyReview.countDocuments({
            user: userId,
            year: monthStart.getFullYear(),
            month: monthStart.getMonth() + 1,
            completed: true
          }),
          weeklyReviewsCompleted: await WeeklyReview.countDocuments({
            user: userId,
            year: monthStart.getFullYear(),
            month: monthStart.getMonth() + 1
          })
        }
      }
    };
  } catch (error) {
    console.error('Error fetching reviews overview:', error);
    throw error;
  }
};

// Get insights
dashboardService.getInsights = async (userId) => {
  const insights = [];

  try {
    // Get data needed for insights
    const [todayData, weekData, monthData] = await Promise.all([
      dashboardService.getTodayDashboard(userId),
      dashboardService.getWeekDashboard(userId),
      dashboardService.getMonthDashboard(userId)
    ]);

    const today = todayData.data || {};
    const week = weekData.data || {};
    const month = monthData.data || {};

    // Overplanning insight
    if (week.time && week.time.plannedMinutes > 0 && week.time.actualMinutes > 0) {
      const overplannedDays = week.dailyBreakdown?.filter(day =>
        day.work.actualMinutes > 0 &&
        day.tasks.total > 0 &&
        ((day.work.actualMinutes / (day.tasks.total * 30)) > 1.1) // Assuming 30 min per task as rough estimate
      ).length || 0;

      if (overplannedDays > 0) {
        insights.push({
          type: 'overplanning',
          severity: 'info',
          period: 'week',
          message: `You planned above available capacity on ${overplannedDays} day${overplannedDays !== 1 ? 's' : ''} this week.`,
          data: { days: overplannedDays }
        });
      }
    }

    // Skip reason insight (simplified)
    // In a real implementation, we would analyze skip reasons from tasks

    // Goal attention insight
    if (month.goals && month.goals.total > 0) {
      const inactiveGoals = month.goals.total -
        (month.goals.completed || 0) -
        (month.goals.inProgress || 0);

      if (inactiveGoals > 0) {
        insights.push({
          type: 'goalAttention',
          severity: 'notice',
          period: 'month',
          message: `${inactiveGoals} monthly goal${inactiveGoals !== 1 ? 's' : ''} has no recorded progress this month.`,
          data: { count: inactiveGoals }
        });
      }
    }

    // Limit insights to prevent overwhelming response
    return {
      success: true,
      data: {
        insights: insights.slice(0, 5) // Limit to 5 insights
      }
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    // Return empty insights rather than failing
    return {
      success: true,
      data: {
        insights: []
      }
    };
  }
};

// Get recent activity
dashboardService.getRecentActivity = async (userId, limit = 20) => {
  try {
    // Ensure limit is within reasonable bounds
    const safeLimit = Math.min(Math.max(1, limit), 100);

    // Import models
    const Task = require('../models/task.model');
    const HabitLog = require('../models/habitLog.model');
    const LearningSession = require('../models/learningSession.model');
    const DailyReview = require('../models/dailyReview.model');
    const WeeklyReview = require('../models/weeklyReview.model');
    const MonthlyReview = require('../models/monthlyReview.model');
    const Project = require('../models/project.model');
    const WorkSession = require('../models/workSession.model');

    // Get activities from different collections
    const [tasks, habitLogs, learningSessions, dailyReviews, weeklyReviews, monthlyReviews, projects, workSessions] = await Promise.all([
      Task.find({ user: userId, status: 'completed' })
        .select('title date')
        .sort({ date: -1 })
        .limit(safeLimit)
        .lean(),

      HabitLog.find({ user: userId, completed: true })
        .select('title date')
        .sort({ date: -1 })
        .limit(safeLimit)
        .lean(),

      LearningSession.find({ user: userId })
        .select('title date')
        .sort({ date: -1 })
        .limit(safeLimit)
        .lean(),

      DailyReview.find({ user: userId, completed: true })
        .select('title date')
        .sort({ date: -1 })
        .limit(safeLimit)
        .lean(),

      WeeklyReview.find({ user: userId, completed: true })
        .select('title date')
        .sort({ date: -1 })
        .limit(safeLimit)
        .lean(),

      MonthlyReview.find({ user: userId, completed: true })
        .select('title date')
        .sort({ date: -1 })
        .limit(safeLimit)
        .lean(),

      Project.find({ user: userId, status: 'completed' })
        .select('title date')
        .sort({ date: -1 })
        .limit(safeLimit)
        .lean(),

      WorkSession.find({ user: userId, status: 'completed' })
        .select('title date')
        .sort({ date: -1 })
        .limit(safeLimit)
        .lean()
    ]).then(results => {
      // Flatten and tag each activity with its type
      const activities = [];

      tasks.forEach(task => {
        activities.push({
          type: 'task_completed',
          timestamp: task.date,
          title: task.title,
          resourceId: task._id
        });
      });

      habitLogs.forEach(log => {
        activities.push({
          type: 'habit_completed',
          timestamp: log.date,
          title: log.title || 'Habit completed',
          resourceId: log._id
        });
      });

      learningSessions.forEach(session => {
        activities.push({
          type: 'learning_session_completed',
          timestamp: session.date,
          title: session.title,
          resourceId: session._id
        });
      });

      dailyReviews.forEach(review => {
        activities.push({
          type: 'daily_review_completed',
          timestamp: review.date,
          title: review.title || 'Daily review completed',
          resourceId: review._id
        });
      });

      weeklyReviews.forEach(review => {
        activities.push({
          type: 'weekly_review_completed',
          timestamp: review.date,
          title: review.title || 'Weekly review completed',
          resourceId: review._id
        });
      });

      monthlyReviews.forEach(review => {
        activities.push({
          type: 'monthly_review_completed',
          timestamp: review.date,
          title: review.title || 'Monthly review completed',
          resourceId: review._id
        });
      });

      projects.forEach(project => {
        activities.push({
          type: 'project_completed',
          timestamp: project.date,
          title: project.title,
          resourceId: project._id
        });
      });

      workSessions.forEach(session => {
        activities.push({
          type: 'work_session_completed',
          timestamp: session.date,
          title: session.title || 'Work session completed',
          resourceId: session._id
        });
      });

      // Sort by timestamp newest first
      return activities
        .filter(activity => activity.timestamp) // Remove any without timestamp
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, safeLimit);
    });

    return {
      success: true,
      data: {
        activity: activities
      }
    };
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};

module.exports = dashboardService;