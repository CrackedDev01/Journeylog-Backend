const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['personal', 'health', 'education', 'career', 'business', 'spiritual', 'finance', 'skill', 'other'],
    default: 'other'
  },
  schedule: {
    scheduleType: {
      type: String,
      required: true,
      enum: ['daily', 'weekdays', 'weekends', 'specific_days', 'times_per_week']
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    timesPerWeek: {
      type: Number,
      min: 1,
      max: 7
    }
  },
  targetType: {
    type: String,
    required: true,
    enum: ['binary', 'count', 'duration', 'quantity']
  },
  targetValue: {
    type: Number,
    min: 0
  },
  unit: {
    type: String,
    maxlength: 50
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'active'
  },
  reminderTime: {
    type: String,
    match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  },
  linkedMonthlyGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MonthlyGoal'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
habitSchema.index({ user: 1, status: 1 });
habitSchema.index({ user: 1, linkedMonthlyGoal: 1 });

module.exports = mongoose.model('Habit', habitSchema);