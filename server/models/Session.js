const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  teacherId: {
    type: String,
    required: true
  },
  teacherName: {
    type: String,
    default: 'Teacher'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  students: [{
    id: String,
    name: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isOnline: {
      type: Boolean,
      default: true
    }
  }],
  currentQuestion: {
    id: String,
    type: {
      type: String,
      enum: ['mcq', 'true-false', 'short-text']
    },
    question: String,
    options: [String],
    correctAnswer: String,
    timeLimit: Number,
    createdAt: Date,
    startedAt: Date,
    endsAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

sessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Session', sessionSchema);