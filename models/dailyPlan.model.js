const mongoose = require('mongoose');

const dailyPlanSchema = new mongoose.Schema({
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
  dailyFocus: {
    type: String,
    trim: true
  },
  intention: {
    type: String,
    enum: ['growth', 'maintenance', 'recovery', 'exploration'],
    default: 'growth'
  },
  availableMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'reviewed'],
    default: 'planned'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate daily plans per user per date
dailyPlanSchema.index({ user: 1, date: 1 }, { unique: true });

// Virtual for formatted date (YYYY-MM-DD)
dailyPlanSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Virtual for day name
dailyPlanSchema.virtual('dayName').get(function() {
  return this.date.toLocaleDateString(undefined, { weekday: 'long' });
});

module.exports = mongoose.model('DailyPlan', dailyPlanSchema);