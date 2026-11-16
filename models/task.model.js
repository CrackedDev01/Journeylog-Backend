const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['must_do', 'important', 'optional'],
    default: 'important'
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'skipped', 'cancelled'],
    default: 'planned'
  },
  estimatedMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  dueTime: {
    type: String, // Store as HH:MM format for time of day
    match: /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/
  },
  // Relationships to planning hierarchy
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
    ref: 'WeeklyCommitment' // Note: This is embedded in WeeklyPlan, not a separate model
  },
  monthlyGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MonthlyGoal'
  },
  // Project relationships
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  projectMilestoneId: {
    type: mongoose.Schema.Types.ObjectId
  },
  // Skip/reschedule tracking
  skipReason: {
    type: String,
    enum: ['low_energy', 'unexpected_obstacle', 'change_in_priority', 'lack_of_resources', 'other']
  },
  skipNote: {
    type: String,
    maxlength: 500
  },
  rescheduleCount: {
    type: Number,
    min: 0,
    default: 0
  },
  completedAt: {
    type: Date
  },
  // Task notes/description field
  notes: {
    type: String,
    maxlength: 1000
  },
  // Task ordering/position field
  order: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ user: 1, date: 1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ dailyPlan: 1 });
taskSchema.index({ weeklyPlan: 1 });
taskSchema.index({ monthlyGoal: 1 });

module.exports = mongoose.model('Task', taskSchema);