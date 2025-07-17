const Session = require('../models/Session');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const ChatMessage = require('../models/ChatMessage');
const { v4: uuidv4 } = require('uuid');

class SessionController {
  // Create or get the single global session
  static async createSession(teacherId, teacherName = 'Teacher') {
    try {
      // Check if global session exists
      let session = await Session.findOne({ sessionId: 'global' });
      
      if (!session) {
        // Create new global session
        session = new Session({
          sessionId: 'global',
          teacherId,
          teacherName,
          isActive: true
        });
        await session.save();
        console.log('✅ Created new global session');
      } else {
        // Update existing global session with new teacher info
        session.teacherId = teacherId;
        session.teacherName = teacherName;
        session.isActive = true;
        await session.save();
        console.log('✅ Reused existing global session');
      }
      
      return session;
    } catch (error) {
      throw new Error(`Failed to create/get global session: ${error.message}`);
    }
  }

  // Join the global session as student
  static async joinSession(sessionId, studentId, studentName) {
    try {
      // Always use global session, ignore sessionId parameter
      const session = await Session.findOne({ sessionId: 'global', isActive: true });
      if (!session) {
        throw new Error('Global session not found or inactive');
      }

      // Check if student already exists
      const existingStudent = session.students.find(s => s.id === studentId);
      if (!existingStudent) {
        session.students.push({
          id: studentId,
          name: studentName,
          joinedAt: new Date(),
          isOnline: true
        });
        await session.save();
        console.log(`✅ New student ${studentName} joined global session`);
      } else {
        // Update student as online
        existingStudent.isOnline = true;
        await session.save();
        console.log(`✅ Student ${studentName} reconnected to global session`);
      }

      return session;
    } catch (error) {
      throw new Error(`Failed to join global session: ${error.message}`);
    }
  }

  // Get the global session details
  static async getSession(sessionId) {
    try {
      // Always return global session, ignore sessionId parameter
      const session = await Session.findOne({ sessionId: 'global' });
      return session;
    } catch (error) {
      throw new Error(`Failed to get global session: ${error.message}`);
    }
  }

  // Update student online status in global session
  static async updateStudentStatus(sessionId, studentId, isOnline) {
    try {
      // Always use global session, ignore sessionId parameter
      const session = await Session.findOne({ sessionId: 'global' });
      if (session) {
        const student = session.students.find(s => s.id === studentId);
        if (student) {
          student.isOnline = isOnline;
          await session.save();
        }
      }
    } catch (error) {
      console.error('Failed to update student status:', error);
    }
  }

  // Create and start a new question in global session
  static async createQuestion(sessionId, questionData) {
    try {
      const questionId = uuidv4();
      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + (questionData.timeLimit * 1000));

      // Create question record
      const question = new Question({
        questionId,
        sessionId: 'global', // Always use global session
        type: questionData.type,
        question: questionData.question,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        timeLimit: questionData.timeLimit,
        startedAt,
        isActive: true
      });

      await question.save();

      // Update global session with current question
      await Session.findOneAndUpdate(
        { sessionId: 'global' },
        {
          currentQuestion: {
            id: questionId,
            type: questionData.type,
            question: questionData.question,
            options: questionData.options,
            correctAnswer: questionData.correctAnswer,
            timeLimit: questionData.timeLimit,
            createdAt: new Date(),
            startedAt,
            endsAt
          }
        }
      );

      return question;
    } catch (error) {
      throw new Error(`Failed to create question: ${error.message}`);
    }
  }

  // Submit an answer to a question
  static async submitAnswer(questionId, sessionId, studentId, studentName, answer) {
    try {
      const answerId = uuidv4();
      
      // Get question to check correct answer
      const question = await Question.findOne({ questionId });
      let isCorrect = undefined;
      
      if (question && question.correctAnswer) {
        isCorrect = answer.toString().toLowerCase() === question.correctAnswer.toLowerCase();
      }

      const answerDoc = new Answer({
        answerId,
        questionId,
        sessionId: 'global', // Always use global session
        studentId,
        studentName,
        answer,
        isCorrect
      });

      await answerDoc.save();
      return answerDoc;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Answer already submitted for this question');
      }
      throw new Error(`Failed to submit answer: ${error.message}`);
    }
  }

  // Get question results
  static async getQuestionResults(questionId) {
    try {
      const question = await Question.findOne({ questionId });
      const answers = await Answer.find({ questionId });

      if (!question) {
        throw new Error('Question not found');
      }

      // Calculate summary
      const summary = {};
      answers.forEach(answer => {
        const key = answer.answer.toString();
        summary[key] = (summary[key] || 0) + 1;
      });

      return {
        questionId,
        question,
        answers,
        totalStudents: answers.length,
        summary
      };
    } catch (error) {
      throw new Error(`Failed to get results: ${error.message}`);
    }
  }

  // End current question in global session
  static async endQuestion(sessionId) {
    try {
      // Always use global session, ignore sessionId parameter
      const session = await Session.findOne({ sessionId: 'global' });
      if (session && session.currentQuestion) {
        // Mark question as inactive
        await Question.findOneAndUpdate(
          { questionId: session.currentQuestion.id },
          { isActive: false, endedAt: new Date() }
        );

        // Clear current question from session
        session.currentQuestion = null;
        await session.save();
      }
    } catch (error) {
      throw new Error(`Failed to end question: ${error.message}`);
    }
  }

  // Get all questions for global session
  static async getSessionQuestions(sessionId) {
    try {
      // Always use global session, ignore sessionId parameter
      const questions = await Question.find({ sessionId: 'global' }).sort({ createdAt: -1 });
      return questions;
    } catch (error) {
      throw new Error(`Failed to get session questions: ${error.message}`);
    }
  }

  // Save chat message to global session
  static async saveChatMessage(sessionId, senderId, senderName, senderRole, message) {
    try {
      const messageId = uuidv4();
      const chatMessage = new ChatMessage({
        messageId,
        sessionId: 'global', // Always use global session
        senderId,
        senderName,
        senderRole,
        message
      });

      await chatMessage.save();
      return chatMessage;
    } catch (error) {
      throw new Error(`Failed to save chat message: ${error.message}`);
    }
  }

  // Get chat messages for global session
  static async getChatMessages(sessionId) {
    try {
      // Always use global session, ignore sessionId parameter
      const messages = await ChatMessage.find({ sessionId: 'global' }).sort({ timestamp: 1 });
      return messages;
    } catch (error) {
      throw new Error(`Failed to get chat messages: ${error.message}`);
    }
  }

  // Kick a student from the global session
  static async kickStudent(studentId, studentName) {
    try {
      const session = await Session.findOne({ sessionId: 'global' });
      if (!session) {
        throw new Error('Global session not found');
      }

      // Remove student from session
      session.students = session.students.filter(s => s.id !== studentId);
      await session.save();

      console.log(`🚫 Student ${studentName} (${studentId}) kicked from global session`);
      return { success: true, studentId, studentName };
    } catch (error) {
      throw new Error(`Failed to kick student: ${error.message}`);
    }
  }

  // Get all students in the global session
  static async getSessionStudents() {
    try {
      const session = await Session.findOne({ sessionId: 'global' });
      if (!session) {
        return [];
      }
      return session.students;
    } catch (error) {
      console.error('Failed to get session students:', error);
      return [];
    }
  }
}

module.exports = SessionController;