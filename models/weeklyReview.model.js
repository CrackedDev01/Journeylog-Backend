const mongoose = require('mongoose');

const weeklyReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  weekStart: {
    type: Date,
    required: true,
    index: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  weeklyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyPlan'
  },
  snapshot: {
    // Weekly Focus
    weeklyFocus: { type: String },

    // Commitment Metrics
    totalCommitments: { type: Number, default: 0 },
    completedCommitments: { type: Number, default: 0 },
    commitmentCompletionRate: { type: Number, min: 0, max: 100, default: null },

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

    // Completion Rates
    completionRate: { type: Number, min: 0, max: 100, default: null },
    mustDoCompletionRate: { type: Number, min: 0, max: 100, default: null },
    importantCompletionRate: { type: Number, min: 0, max: 100, default: null },
    optionalCompletionRate: { type: Number, min: 0, max: 100, default: null },

    // Work Session Metrics
    totalWorkSessions: { type: Number, default: 0 },
    completedWorkSessions: { type: Number, default: 0 },

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

    // Daily Breakdown (lightweight)
    dailyBreakdown: [{
      date: { type: Date },
      plannedTasks: { type: Number, default: 0 },
      completedTasks: { type: Number, default: 0 },
      mustDoCount: { type: Number, default: 0 },
      completedMustDoCount: { type: Number, default: 0 },
      plannedMinutes: { type: Number, default: 0 },
      actualMinutes: { type: Number, default: 0 },
      reviewed: { type: Boolean, default: false }
    }],

    // Monthly Goal Coverage
    monthlyGoalCoverage: [{
      goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyGoal' },
      title: { type: String },
      tasksPlanned: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      actualMinutes: { type: Number, default: 0 }
    }],

    // Unaddressed Monthly Goals
    unaddressedMonthlyGoals: [{
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
  whatToImprove: { type: String, maxlength: 500 },
  nextWeekFocus: { type: String, maxlength: 500 },
  notes: { type: String, maxlength: 1000 },

  // Ratings
  weekRating: { type: Number, min: 1, max: 5 },
  nextWeekConfidence: { type: Number, min: 1, max: 5 },

  // Timestamps
  reviewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate weekly reviews per user per week
weeklyReviewSchema.index({ user: 1, weekStart: 1 }, { unique: true });

// Index for listing reviews by date range
weeklyReviewSchema.index({ user: 1, weekStart: -1 });

module.exports = mongoose.model('WeeklyReview', weeklyReviewSchema);