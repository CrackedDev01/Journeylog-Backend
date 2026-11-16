const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define allowed statuses
const statuses = [
  'planned',
  'active',
  'completed',
  'reviewed'
];

// Define allowed priorities (reusing from goals for consistency)
const priorities = [
  'low',
  'medium',
  'high',
  'critical'
];

const commitmentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: priorities,
    default: 'medium'
  },
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  monthlyGoal: {
    type: Schema.Types.ObjectId,
    ref: 'MonthlyGoal'
  }
}, {
  _id: true // Ensure _id is generated for commitments
});

const weeklyPlanSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  weekStart: {
    type: Date,
    required: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  weeklyFocus: {
    type: String,
    required: true,
    trim: true
  },
  intention: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: statuses,
    default: 'planned'
  },
  availableHours: {
    type: Number,
    min: 0
  },
  commitments: [commitmentSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total estimated hours from commitments
weeklyPlanSchema.virtual('plannedHours').get(function() {
  return this.commitments.reduce((total, commitment) => {
    return total + (commitment.estimatedHours || 0);
  }, 0);
});

// Virtual for capacity usage percentage
weeklyPlanSchema.virtual('capacityUsage').get(function() {
  if (!this.availableHours || this.availableHours === 0) {
    return null;
  }

  const plannedHours = this.plannedHours;
  return Math.min(100, Math.max(0, (plannedHours / this.availableHours) * 100));
});

// Virtual for capacity status based on usage
weeklyPlanSchema.virtual('capacityStatus').get(function() {
  const capacityUsage = this.capacityUsage;

  if (capacityUsage === null) {
    return null;
  }

  if (capacityUsage <= 60) {
    return 'under_planned';
  } else if (capacityUsage <= 90) {
    return 'realistic';
  } else if (capacityUsage <= 110) {
    return 'heavy';
  } else {
    return 'overloaded';
  }
});

// Virtual for weekly progress based on completed commitments
weeklyPlanSchema.virtual('progress').get(function() {
  if (this.commitments.length === 0) {
    return 0;
  }

  const completedCount = this.commitments.filter(commitment => commitment.completed).length;
  return Math.round((completedCount / this.commitments.length) * 100);
});

// Virtual for linked monthly goals count
weeklyPlanSchema.virtual('linkedMonthlyGoalsCount').get(function() {
  const monthlyGoalIds = this.commitments
    .filter(commitment => commitment.monthlyGoal)
    .map(commitment => commitment.monthlyGoal.toString());

  // Count unique monthly goal IDs
  const uniqueIds = new Set(monthlyGoalIds);
  return uniqueIds.size;
});

// Indexes for frequent queries
weeklyPlanSchema.index({ user: 1, weekStart: 1 }, { unique: true });
weeklyPlanSchema.index({ user: 1, status: 1 });
weeklyPlanSchema.index({ user: 1, weekStart: -1 }); // For getting recent plans

module.exports = mongoose.model('WeeklyPlan', weeklyPlanSchema);