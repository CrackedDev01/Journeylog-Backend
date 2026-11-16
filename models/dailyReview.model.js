const mongoose = require('mongoose');

const dailyReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  dailyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyPlan'
  },
  snapshot: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    skippedTasks: { type: Number, default: 0 },
    cancelledTasks: { type: Number, default: 0 },
    rescheduledTasks: { type: Number, default: 0 },

    mustDoCount: { type: Number, default: 0 },
    completedMustDoCount: { type: Number, default: 0 },

    importantCount: { type: Number, default: 0 },
    completedImportantCount: { type: Number, default: 0 },

    optionalCount: { type: Number, default: 0 },
    completedOptionalCount: { type: Number, default: 0 },

    plannedMinutes: { type: Number, default: 0 },
    actualMinutes: { type: Number, default: 0 },
    differenceMinutes: { type: Number, default: 0 },

    totalWorkSessions: { type: Number, default: 0 },
    deepWorkMinutes: { type: Number, default: 0 },
    focusedWorkMinutes: { type: Number, default: 0 },
    studyMinutes: { type: Number, default: 0 },
    practiceMinutes: { type: Number, default: 0 },
    meetingMinutes: { type: Number, default: 0 },
    adminMinutes: { type: Number, default: 0 },
    planningMinutes: { type: Number, default: 0 },
    otherMinutes: { type: Number, default: 0 },

    averageFocusRating: { type: Number, min: 0, max: 5, default: null },
    averageEnergyRating: { type: Number, min: 0, max: 5, default: null },

    completionRate: { type: Number, min: 0, max: 100, default: null },
    mustDoCompletionRate: { type: Number, min: 0, max: 100, default: null },

    skipReasons: { type: Map, of: Number },

    sessionTypeMinutes: {
      deep_work: { type: Number, default: 0 },
      focused_work: { type: Number, default: 0 },
      study: { type: Number, default: 0 },
      practice: { type: Number, default: 0 },
      meeting: { type: Number, default: 0 },
      admin: { type: Number, default: 0 },
      planning: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },

  mainWin: { type: String, maxlength: 500 },
  mainChallenge: { type: String, maxlength: 500 },
  whatWentWell: { type: String, maxlength: 500 },
  whatDidNotGoWell: { type: String, maxlength: 500 },
  lessonLearned: { type: String, maxlength: 500 },
  tomorrowFocus: { type: String, maxlength: 500 },
  notes: { type: String, maxlength: 1000 },

  dayRating: { type: Number, min: 1, max: 5 },
  satisfactionRating: { type: Number, min: 1, max: 5 },
  dayFeeling: {
    type: String,
    enum: ['great', 'good', 'neutral', 'tired', 'difficult']
  },

  reviewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate daily reviews per user per date
dailyReviewSchema.index({ user: 1, date: 1 }, { unique: true });

// Index for listing reviews by date range
dailyReviewSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('DailyReview', dailyReviewSchema);