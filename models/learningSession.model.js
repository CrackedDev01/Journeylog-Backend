const mongoose = require('mongoose');

const learningSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  date: {
    type: Date,
    required: true
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
  sessionType: {
    type: String,
    enum: ['study', 'practice', 'course', 'tutorial', 'reading', 'project_application', 'review', 'other'],
    default: 'study'
  },
  durationMinutes: {
    type: Number,
    min: 0
  },
  resource: {
    resourceType: {
      type: String,
      enum: ['course', 'video', 'book', 'article', 'documentation', 'mentor', 'practice', 'other']
    },
    resourceTitle: {
      type: String,
      trim: true
    },
    resourceUrl: {
      type: String,
      trim: true
    }
  },
  topics: [{
    type: String,
    trim: true
  }],
  confidenceBefore: {
    type: Number,
    min: 1,
    max: 5
  },
  confidenceAfter: {
    type: Number,
    min: 1,
    max: 5
  },
  takeaway: {
    type: String,
    trim: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: {
    type: String
  },
  // Optional links to other entities
  workSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkSession'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
learningSessionSchema.index({ user: 1, skill: 1, date: -1 });
learningSessionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('LearningSession', learningSessionSchema);