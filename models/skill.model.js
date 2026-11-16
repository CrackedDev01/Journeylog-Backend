const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['technical', 'design', 'business', 'communication', 'academic', 'creative', 'personal', 'other'],
    default: 'other'
  },
  currentLevel: {
    type: String,
    enum: ['beginner', 'foundational', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  targetLevel: {
    type: String,
    enum: ['beginner', 'foundational', 'intermediate', 'advanced', 'expert']
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'mastered', 'archived'],
    default: 'active'
  },
  startedAt: {
    type: Date
  },
  targetDate: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
skillSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Skill', skillSchema);