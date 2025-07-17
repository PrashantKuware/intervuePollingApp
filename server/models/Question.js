const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    unique: true
  },
  sessionId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['mcq', 'true-false', 'short-text'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [String],
  correctAnswer: String,
  timeLimit: {
    type: Number,
    default: 60
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  endedAt: Date,
  isActive: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Question', questionSchema);