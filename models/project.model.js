const mongoose = require('mongoose');
const { Schema } = mongoose;

const milestoneSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'skipped'],
    default: 'planned'
  },
  targetDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const projectSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true
  },
  objective: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['project', 'career', 'education', 'business', 'personal', 'finance', 'health', 'spiritual', 'skill', 'other'],
    default: 'project'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'paused', 'completed', 'cancelled', 'archived'],
    default: 'planned'
  },
  startDate: {
    type: Date
  },
  targetDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  milestones: [milestoneSchema],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for common queries
projectSchema.index({ user: 1, status: 1 });
projectSchema.index({ user: 1, targetDate: 1 });

module.exports = mongoose.model('Project', projectSchema);