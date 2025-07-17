const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  answerId: {
    type: String,
    required: true,
    unique: true
  },
  questionId: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isCorrect: Boolean,
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one answer per student per question
answerSchema.index({ questionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Answer', answerSchema);