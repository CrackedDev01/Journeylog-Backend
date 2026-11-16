const mongoose = require('mongoose');

const monthlyReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2050
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  snapshot: {
    // Monthly Goal Metrics
    totalGoals: { type: Number, default: 0 },
    completedGoals: { type: Number, default: 0 },
    inProgressGoals: { type: Number, default: 0 },
    pausedGoals: { type: Number, default: 0 },
    cancelledGoals: { type: Number, default: 0 },
    goalCompletionRate: { type: Number, min: 0, max: 100, default: null },

    // Task Metrics
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    skippedTasks: { type: Number, default: 0 },
    cancelledTasks: { type: Number, default: 0 },
    rescheduledTasks: { type: Number, default: 0 },

    // Priority Breakdown
    mustDoCount: { type: Number, default: 0 },
    completedMustDoCount: { type: Number, default: 0 },
    importantCount: { type: Number, default: 0 },
    completedImportantCount: { type: Number, default: 0 },
    optionalCount: { type: Number, default: 0 },
    completedOptionalCount: { type: Number, default: 0 },

    // Time Tracking
    plannedMinutes: { type: Number, default: 0 },
    actualMinutes: { type: Number, default: 0 },
    differenceMinutes: { type: Number, default: 0 },

    // Work Session Metrics
    totalWorkSessions: { type: Number, default: 0 },

    // Session Type Breakdown
    sessionTypeMinutes: {
      deep_work: { type: Number, default: 0 },
      focused_work: { type: Number, default: 0 },
      study: { type: Number, default: 0 },
      practice: { type: Number, default: 0 },
      meeting: { type: Number, default: 0 },
      admin: { type: Number, default: 0 },
      planning: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },

    // Focus and Energy Ratings
    averageFocusRating: { type: Number, min: 0, max: 5, default: null },
    averageEnergyRating: { type: Number, min: 0, max: 5, default: null },

    // Estimation Accuracy
    tasksWithEstimateAndWork: { type: Number, default: 0 },
    averageEstimationAccuracy: { type: Number, min: 0, max: 100, default: null },
    averageDifferenceMinutes: { type: Number, default: null },

    // Skip Reasons
    skipReasons: { type: Map, of: Number },
    topSkipReasons: { type: [String] }, // Array to handle ties

    // Rescheduling Metrics
    totalRescheduleActions: { type: Number, default: 0 },

    // Daily Review Aggregation
    daysReviewed: { type: Number, default: 0 },

    // Monthly Goal Coverage
    goalProgress: [{
      goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyGoal' },
      title: { type: String },
      category: { type: String },
      status: { type: String },
      progress: { type: Number, default: 0 },
      estimatedHours: { type: Number, default: 0 },
      actualMinutes: { type: Number, default: 0 },
      tasksPlanned: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      workSessions: { type: Number, default: 0 }
    }],

    // Goal Time Investment
    goalTimeBreakdown: [{
      goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyGoal' },
      title: { type: String },
      actualMinutes: { type: Number, default: 0 }
    }],

    // Category Analysis
    categoryBreakdown: [{
      category: { type: String },
      goals: { type: Number, default: 0 },
      actualMinutes: { type: Number, default: 0 }
    }],

    // Weekly Breakdown
    weeklyBreakdown: [{
      weekStart: { type: Date },
      weekEnd: { type: Date },
      tasksPlanned: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      mustDoCompletionRate: { type: Number, min: 0, max: 100, default: null },
      plannedMinutes: { type: Number, default: 0 },
      actualMinutes: { type: Number, default: 0 },
      weeklyReviewCompleted: { type: Boolean, default: false }
    }],

    // Daily Breakdown (lightweight)
    dailyBreakdown: [{
      date: { type: Date },
      completedTasks: { type: Number, default: 0 },
      mustDoCompleted: { type: Number, default: 0 },
      actualMinutes: { type: Number, default: 0 },
      reviewed: { type: Boolean, default: false }
    }],

    // Goal metrics
    unaddressedGoals: [{
      goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyGoal' },
      title: { type: String }
    }]
  },

  // User Reflection
  biggestWin: { type: String, maxlength: 500 },
  biggestChallenge: { type: String, maxlength: 500 },
  whatWorked: { type: String, maxlength: 500 },
  whatDidNotWork: { type: String, maxlength: 500 },
  mainLesson: { type: String, maxlength: 500 },
  whatToContinue: { type: String, maxlength: 500 },
  whatToStop: { type: String, maxlength: 500 },
  whatToImprove: { type: String, maxlength: 500 },
  nextMonthFocus: { type: String, maxlength: 500 },
  notes: { type: String, maxlength: 1000 },

  // Ratings
  monthRating: { type: Number, min: 1, max: 5 },
  satisfactionRating: { type: Number, min: 1, max: 5 },

  // Timestamps
  reviewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate monthly reviews per user per month
monthlyReviewSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

// Index for listing reviews by date range
monthlyReviewSchema.index({ user: 1, year: -1, month: -1 });

module.exports = mongoose.model('MonthlyReview', monthlyReviewSchema);