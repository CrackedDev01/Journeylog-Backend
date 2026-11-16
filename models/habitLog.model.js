const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  habit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['completed', 'partial', 'skipped'],
    required: true
  },
  value: {
    type: Number,
    min: 0
  },
  note: {
    type: String,
    maxlength: 500
  },
  completedAt: {
    type: Date
  },
  skipReason: {
    type: String,
    enum: ['illness', 'travel', 'schedule_change', 'rest_day', 'forgot', 'lack_of_time', 'other'],
    maxlength: 100
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate logs for the same habit on the same date
habitLogSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });

// Index for querying logs by user and date range
habitLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('HabitLog', habitLogSchema);