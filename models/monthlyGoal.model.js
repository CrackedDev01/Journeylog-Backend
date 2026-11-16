const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define allowed categories
const categories = [
  'career',
  'education',
  'business',
  'finance',
  'health',
  'personal',
  'spiritual',
  'project',
  'skill',
  'other'
];

// Define allowed target types
const targetTypes = [
  'binary',
  'number',
  'percentage',
  'hours'
];

// Define allowed priorities
const priorities = [
  'low',
  'medium',
  'high',
  'critical'
];

// Define allowed statuses
const statuses = [
  'not_started',
  'in_progress',
  'completed',
  'paused',
  'cancelled'
];

const milestoneSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  _id: true // Ensure _id is generated for milestones
});

const monthlyGoalSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true
  },
  why: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: categories,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2050
  },
  priority: {
    type: String,
    enum: priorities,
    default: 'medium'
  },
  status: {
    type: String,
    enum: statuses,
    default: 'not_started'
  },
  // Goal measurement fields
  targetType: {
    type: String,
    enum: targetTypes,
    required: true
  },
  targetValue: {
    type: Number,
    required: true,
    min: 0
  },
  currentValue: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    trim: true
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  deadline: {
    type: Date
  },
  milestones: [milestoneSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for progress calculation
monthlyGoalSchema.virtual('progress').get(function() {
  if (this.targetValue === 0) return 0;

  let progress = 0;

  switch (this.targetType) {
    case 'binary':
      progress = this.status === 'completed' ? 100 : 0;
      break;
    case 'number':
    case 'hours':
      progress = (this.currentValue / this.targetValue) * 100;
      break;
    case 'percentage':
      // For percentage goals, currentValue and targetValue should both be percentages
      // We'll validate this in the service/controller
      progress = (this.currentValue / this.targetValue) * 100;
      break;
  }

  // Constrain progress between 0 and 100
  return Math.min(100, Math.max(0, progress));
});

// Indexes for frequent queries
monthlyGoalSchema.index({ user: 1, year: 1, month: 1 });
monthlyGoalSchema.index({ user: 1, status: 1 });
monthlyGoalSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('MonthlyGoal', monthlyGoalSchema);