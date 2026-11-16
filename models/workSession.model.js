const mongoose = require('mongoose');

const workSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  dailyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyPlan'
  },
  weeklyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyPlan'
  },
  weeklyCommitmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyCommitment'
  },
  monthlyGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MonthlyGoal'
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startedAt: {
    type: Date,
    required: true
  },
  endedAt: {
    type: Date
  },
  durationMinutes: {
    type: Number
  },
  sessionType: {
    type: String,
    enum: ['deep_work', 'focused_work', 'study', 'practice', 'meeting', 'admin', 'planning', 'other'],
    default: 'focused_work'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  focusRating: {
    type: Number,
    min: 1,
    max: 5
  },
  energyRating: {
    type: Number,
    min: 1,
    max: 5
  },
  outcome: {
    type: String,
    maxlength: 500
  },
  blocker: {
    type: String,
    maxlength: 200
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better query performance
workSessionSchema.index({ user: 1, startedAt: -1 });
workSessionSchema.index({ user: 1, task: 1, status: 1 });
workSessionSchema.index({ user: 1, status: 1 }); // For active session lookup
workSessionSchema.index({ task: 1 }); // For task work summary

// Virtual for elapsed time (for active sessions)
workSessionSchema.virtual('elapsedMinutes').get(function() {
  if (this.status === 'active' && this.startedAt) {
    return Math.floor((Date.now() - this.startedAt) / (1000 * 60));
  }
  return null;
});

// Always derive duration from timestamps. Never trust client-supplied minutes.
workSessionSchema.pre('save', function() {
  if (this.startedAt && this.endedAt) {
    if (this.endedAt < this.startedAt) throw new Error('EndedAt cannot be before startedAt');
    this.durationMinutes = Math.floor((this.endedAt - this.startedAt) / 60000);
  } else {
    this.durationMinutes = undefined;
  }
});

// Method to safely update duration (used internally)
workSessionSchema.methods._updateDuration = function() {
  if (this.startedAt && this.endedAt) {
    if (this.endedAt < this.startedAt) {
      throw new Error('EndedAt cannot be before startedAt');
    }
    const durationMs = this.endedAt - this.startedAt;
    this.durationMinutes = Math.floor(durationMs / (1000 * 60));
  } else {
    this.durationMinutes = undefined;
  }
};

module.exports = mongoose.model('WorkSession', workSessionSchema);