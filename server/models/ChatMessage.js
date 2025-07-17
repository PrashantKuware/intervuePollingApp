const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  sessionId: {
    type: String,
    required: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    enum: ['teacher', 'student'],
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  recipientId: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);