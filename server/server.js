const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const SessionController = require('./controllers/sessionController');

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: corsOptions
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI )
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));
  console.log("Mongo URI:", process.env.MONGODB_URI);

// Store active sessions and socket mappings - now only one global session
const globalSession = {
  teacherId: null,
  teacherSocketId: null,
  students: new Map()
};
const userSockets = new Map(); // userId -> socketId
const socketUsers = new Map(); // socketId -> userInfo

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Teacher creates or joins the global session
  socket.on('teacher:create-session', async (data) => {
    try {
      const { teacherId, teacherName } = data;
      const session = await SessionController.createSession(teacherId, teacherName);
      
      // Join teacher to global session room
      socket.join('global');
      
      // Store session and user info
      globalSession.teacherId = teacherId;
      globalSession.teacherSocketId = socket.id;
      
      userSockets.set(teacherId, socket.id);
      socketUsers.set(socket.id, {
        userId: teacherId,
        role: 'teacher',
        sessionId: 'global',
        name: teacherName
      });

      socket.emit('session:created', {
        sessionId: 'global',
        session: session.toObject()
      });

      console.log(`👩‍🏫 Teacher ${teacherName} joined global session`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Student joins the global session
  socket.on('student:join-session', async (data) => {
    try {
      const { studentId, studentName } = data;
      const session = await SessionController.joinSession('global', studentId, studentName);
      
      socket.join('global');
      
      // Store user info
      userSockets.set(studentId, socket.id);
      socketUsers.set(socket.id, {
        userId: studentId,
        role: 'student',
        sessionId: 'global',
        name: studentName
      });

      socket.emit('session:joined', {
        sessionId: 'global',
        session: session.toObject()
      });

      // Notify teacher and others
      socket.to('global').emit('student:joined', {
        student: { id: studentId, name: studentName } 
      });

      // Load chat history
      const chatMessages = await SessionController.getChatMessages('global');
      socket.emit('chat:history', { messages: chatMessages });

      // If there is an active currentQuestion, send it to the new student
      if (session.currentQuestion && session.currentQuestion.id) {
        socket.emit('question:new', {
          question: {
            id: session.currentQuestion.id,
            type: session.currentQuestion.type,
            question: session.currentQuestion.question,
            options: session.currentQuestion.options,
            timeLimit: session.currentQuestion.timeLimit,
            createdAt: session.currentQuestion.createdAt
          }
        });
      }

      console.log(`🧑‍🎓 Student ${studentName} joined global session`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Teacher sends a question to the global session
  socket.on('teacher:send-question', async (data) => {
    try {
      const { questionData } = data;
      const question = await SessionController.createQuestion('global', questionData);
      
      // Send question to all students in the global session
      socket.to('global').emit('question:new', {
        question: {
          id: question.questionId,
          type: question.type,
          question: question.question,
          options: question.options,
          timeLimit: question.timeLimit,
          createdAt: question.createdAt
        }
      });

      // Confirm to teacher
      socket.emit('question:sent', {
        questionId: question.questionId,
        question: question.toObject()
      });

      // Auto-end question after time limit
      setTimeout(async () => {
        try {
          await SessionController.endQuestion('global');
          const results = await SessionController.getQuestionResults(question.questionId);
          
          // Send results to everyone
          io.to('global').emit('question:results', { results });
          // Emit question:end to all clients
          io.to('global').emit('question:end', { questionId: question.questionId });
          
          console.log(`⏰ Question ${question.questionId} ended automatically`);
        } catch (error) {
          console.error('Error auto-ending question:', error);
        }
      }, questionData.timeLimit * 1000);

      console.log(`❓ Question sent to global session: ${question.question}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Add handler for teacher:end-question
  socket.on('teacher:end-question', async (data) => {
    try {
      const { questionId } = data;
      await SessionController.endQuestion('global');
      const results = await SessionController.getQuestionResults(questionId);
      io.to('global').emit('question:results', { results });
      io.to('global').emit('question:end', { questionId });
      console.log(`🛑 Question ${questionId} ended manually by teacher`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Student submits an answer
  socket.on('student:submit-answer', async (data) => {
    try {
      const { questionId, studentId, studentName, answer } = data;
      
      const answerDoc = await SessionController.submitAnswer(
        questionId, 'global', studentId, studentName, answer
      );

      // Confirm to student
      socket.emit('answer:submitted', {
        answerId: answerDoc.answerId,
        answer: answerDoc.answer,
        isCorrect: answerDoc.isCorrect
      });

      // Notify teacher about new answer
      if (globalSession.teacherSocketId) {
        io.to(globalSession.teacherSocketId).emit('answer:received', {
          studentName,
          answer: answerDoc.answer,
          submittedAt: answerDoc.submittedAt
        });
      }

      console.log(`✅ Answer submitted by ${studentName}: ${answer}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Get question results
  socket.on('teacher:get-results', async (data) => {
    try {
      const { questionId } = data;
      const results = await SessionController.getQuestionResults(questionId);
      socket.emit('question:results', { results });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Chat message handling
  socket.on('chat:send-message', async (data) => {
    try {
      const { senderId, senderName, senderRole, message } = data;
      
      const chatMessage = await SessionController.saveChatMessage(
        'global', senderId, senderName, senderRole, message
      );

      // Broadcast message to all users in the global session
      io.to('global').emit('chat:new-message', {
        message: {
          id: chatMessage.messageId,
          senderId: chatMessage.senderId,
          senderName: chatMessage.senderName,
          senderRole: chatMessage.senderRole,
          message: chatMessage.message,
          timestamp: chatMessage.timestamp
        }
      });

      console.log(`💬 Chat message from ${senderName} (${senderRole}): ${message}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Add chat:typing event
  socket.on('chat:typing', (data) => {
    const { senderId, senderName, senderRole } = data;
    // Broadcast to all except sender
    socket.to('global').emit('chat:typing', {
      senderId,
      senderName,
      senderRole
    });
  });

  // Get session history (past questions and results)
  socket.on('session:get-history', async (data) => {
    try {
      const questions = await SessionController.getSessionQuestions('global');
      
      const history = [];
      for (const question of questions) {
        if (!question.isActive) {
          const results = await SessionController.getQuestionResults(question.questionId);
          history.push(results);
        }
      }

      socket.emit('session:history', { history });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Teacher kicks a student from the global session
  socket.on('teacher:kick-student', async (data) => {
    try {
      const { studentId, studentName } = data;
      
      // Verify the sender is the teacher
      if (globalSession.teacherId !== socketUsers.get(socket.id)?.userId) {
        socket.emit('error', { message: 'Only the teacher can kick students' });
        return;
      }

      const result = await SessionController.kickStudent(studentId, studentName);
      
      // Notify the kicked student
      const studentSocketId = userSockets.get(studentId);
      if (studentSocketId) {
        io.to(studentSocketId).emit('student:kicked', {
          reason: 'You have been removed from the session by the teacher'
        });
      }

      // Notify all other users about the kick
      socket.to('global').emit('student:kicked-by-teacher', {
        studentId,
        studentName,
        kickedBy: socketUsers.get(socket.id)?.name || 'Teacher'
      });

      // Remove from tracking
      userSockets.delete(studentId);
      socketUsers.delete(studentSocketId);
      globalSession.students.delete(studentId);

      console.log(`🚫 Teacher kicked student ${studentName} from global session`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Get list of students in the global session
  socket.on('teacher:get-students', async (data) => {
    try {
      // Verify the sender is the teacher
      if (globalSession.teacherId !== socketUsers.get(socket.id)?.userId) {
        socket.emit('error', { message: 'Only the teacher can get student list' });
        return;
      }

      const students = await SessionController.getSessionStudents();
      socket.emit('session:students-list', { students });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    const userInfo = socketUsers.get(socket.id);
    
    if (userInfo) {
      const { userId, role, name } = userInfo;
      
      // Update student status to offline
      if (role === 'student') {
        await SessionController.updateStudentStatus('global', userId, false);
        
        // Notify others about student going offline
        socket.to('global').emit('student:offline', {
          studentId: userId,
          studentName: name
        });
      }
      
      // Clean up tracking
      userSockets.delete(userId);
      socketUsers.delete(socket.id);
      
      // Clean up global session tracking
      if (role === 'teacher' && globalSession.teacherSocketId === socket.id) {
        globalSession.teacherId = null;
        globalSession.teacherSocketId = null;
      } else if (role === 'student') {
        globalSession.students.delete(userId);
      }
      
      console.log(`🔌 ${role} ${name} disconnected from global session`);
    }
    
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Get global session info endpoint
app.get('/api/session/global', async (req, res) => {
  try {
    const session = await SessionController.getSession('global');
    if (!session) {
      return res.status(404).json({ error: 'Global session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Live Polling System Backend Started`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);
  console.log(`🌍 Global session mode enabled`);
});