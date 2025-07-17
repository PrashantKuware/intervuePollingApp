import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Question, Answer, PollResult, Student, PollSession, ChatMessage } from '../types';
import { useSocket } from '../hooks/useSocket';
import { v4 as uuidv4 } from 'uuid';

interface PollState {
  session: PollSession | null;
  userRole: 'teacher' | 'student' | null;
  userId: string;
  studentName: string;
  currentQuestion: Question | null;
  timeRemaining: number;
  hasAnswered: boolean;
  currentAnswer: string | number | null;
  pollResults: PollResult[];
  chatMessages: ChatMessage[];
  isConnected: boolean;
  error: string | null;
  sessionHistory: PollResult[];
  isTyping: boolean;
  roleConfirmed: boolean; // New field to track if role selection is confirmed
}

type PollAction =
  | { type: 'SET_ROLE'; payload: 'teacher' | 'student' }
  | { type: 'CONFIRM_ROLE'; payload: void } // New action to confirm role selection
  | { type: 'SET_STUDENT_NAME'; payload: string }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SESSION_CREATED'; payload: { sessionId: string; session: PollSession } }
  | { type: 'SESSION_JOINED'; payload: { sessionId: string; session: PollSession } }
  | { type: 'STUDENT_JOINED'; payload: Student }
  | { type: 'STUDENT_OFFLINE'; payload: { studentId: string } }
  | { type: 'NEW_QUESTION'; payload: Question }
  | { type: 'SUBMIT_ANSWER'; payload: { answer: string | number } }
  | { type: 'ANSWER_SUBMITTED'; payload: { answer: string | number; isCorrect?: boolean } }
  | { type: 'UPDATE_TIME'; payload: number }
  | { type: 'SHOW_RESULTS'; payload: PollResult }
  | { type: 'RESET_QUESTION' }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_HISTORY'; payload: ChatMessage[] }
  | { type: 'SET_SESSION_HISTORY'; payload: PollResult[] }
  | { type: 'CLEAR_CHAT' }
  | { type: 'SET_TYPING'; payload: boolean };

const initialState: PollState = {
  session: null,
  userRole: null,
  userId: uuidv4(),
  studentName: '',
  currentQuestion: null,
  timeRemaining: 0,
  hasAnswered: false,
  currentAnswer: null,
  pollResults: [],
  chatMessages: [],
  isConnected: false,
  error: null,
  sessionHistory: [],
  isTyping: false,
  roleConfirmed: false, // Initialize as false
};

const pollReducer = (state: PollState, action: PollAction): PollState => {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, userRole: action.payload, roleConfirmed: false }; // Reset confirmation when role changes
    
    case 'CONFIRM_ROLE':
      return { ...state, roleConfirmed: true };
    
    case 'SET_STUDENT_NAME':
      return { ...state, studentName: action.payload };
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SESSION_CREATED':
      return {
        ...state,
        session: {
          ...action.payload.session,
          id: action.payload.sessionId
        }
      };
    
    case 'SESSION_JOINED':
      return {
        ...state,
        session: {
          ...action.payload.session,
          id: action.payload.sessionId
        }
      };
    
    case 'STUDENT_JOINED':
      return {
        ...state,
        session: state.session ? {
          ...state.session,
          students: [...state.session.students.filter(s => s.id !== action.payload.id), action.payload]
        } : null
      };
    
    case 'STUDENT_OFFLINE':
      return {
        ...state,
        session: state.session ? {
          ...state.session,
          students: state.session.students.map(s => 
            s.id === action.payload.studentId ? { ...s, isOnline: false } : s
          )
        } : null
      };
    
    case 'NEW_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload,
        timeRemaining: action.payload.timeLimit,
        hasAnswered: false,
        currentAnswer: null
      };
    
    case 'SUBMIT_ANSWER':
      return {
        ...state,
        currentAnswer: action.payload.answer
      };
    
    case 'ANSWER_SUBMITTED':
      return {
        ...state,
        hasAnswered: true,
        currentAnswer: action.payload.answer
      };
    
    case 'UPDATE_TIME':
      return { ...state, timeRemaining: Math.max(0, action.payload) };
    
    case 'SHOW_RESULTS':
      return {
        ...state,
        pollResults: [...state.pollResults, action.payload],
        sessionHistory: [...state.sessionHistory, action.payload],
        currentQuestion: null,
        timeRemaining: 0,
        hasAnswered: false,
        currentAnswer: null
      };
    
    case 'RESET_QUESTION':
      return {
        ...state,
        currentQuestion: null,
        hasAnswered: false,
        currentAnswer: null,
        timeRemaining: 0
      };
    
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };
    
    case 'SET_CHAT_HISTORY':
      return {
        ...state,
        chatMessages: action.payload
      };
    
    case 'SET_SESSION_HISTORY':
      return {
        ...state,
        sessionHistory: action.payload
      };
    
    case 'CLEAR_CHAT':
      return {
        ...state,
        chatMessages: []
      };
    
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    
    default:
      return state;
  }
};

const PollContext = createContext<{
  state: PollState;
  dispatch: React.Dispatch<PollAction>;
  createSession: () => void;
  joinSession: () => void;
  sendQuestion: (questionData: Omit<Question, 'id' | 'createdAt'>) => void;
  submitAnswer: (answer: string | number) => void;
  sendChatMessage: (message: string) => void;
  sendEndQuestion: (questionId: string) => void;
  kickStudent: (studentId: string, studentName: string) => void;
  getStudents: () => void;
  sendTypingIndicator: () => void;
} | null>(null);

export const PollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pollReducer, initialState);
  const { isConnected, error, emit, on, off } = useSocket();

  // Update connection status
  useEffect(() => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: isConnected });
  }, [isConnected]);

  // Update error status
  useEffect(() => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, [error]);

  // Load student name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('studentName');
    if (savedName) {
      dispatch({ type: 'SET_STUDENT_NAME', payload: savedName });
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Session events
    const handleSessionCreated = (data: any) => {
      dispatch({ type: 'SESSION_CREATED', payload: data });
    };

    const handleSessionJoined = (data: any) => {
      dispatch({ type: 'SESSION_JOINED', payload: data });
    };

    const handleStudentJoined = (data: any) => {
      dispatch({ type: 'STUDENT_JOINED', payload: data.student });
    };

    const handleStudentOffline = (data: any) => {
      dispatch({ type: 'STUDENT_OFFLINE', payload: data });
    };

    // Question events
    const handleNewQuestion = (data: any) => {
      dispatch({ type: 'NEW_QUESTION', payload: data.question });
    };

    const handleAnswerSubmitted = (data: any) => {
      dispatch({ type: 'ANSWER_SUBMITTED', payload: data });
    };

    const handleQuestionResults = (data: any) => {
      dispatch({ type: 'SHOW_RESULTS', payload: data.results });
    };

    const handleQuestionEnd = (data: any) => {
      // Stop timer, disable answer UI
      dispatch({ type: 'RESET_QUESTION' });
    };

    // Chat events
    const handleNewChatMessage = (data: any) => {
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: data.message });
    };

    const handleChatHistory = (data: any) => {
      dispatch({ type: 'SET_CHAT_HISTORY', payload: data.messages });
    };

    const handleChatTyping = (data: any) => {
      dispatch({ type: 'SET_TYPING', payload: true });
      setTimeout(() => dispatch({ type: 'SET_TYPING', payload: false }), 1500);
    };

    // Session history
    const handleSessionHistory = (data: any) => {
      dispatch({ type: 'SET_SESSION_HISTORY', payload: data.history });
    };

    // Add event handlers for kick functionality
    const handleStudentKicked = (data: any) => {
      // If this user is the one being kicked, show message and redirect
      if (data.studentId === state.userId) {
        dispatch({ type: 'SET_ERROR', payload: data.reason });
        // Reset to role selection after a delay
        setTimeout(() => {
          dispatch({ type: 'SET_ROLE', payload: null });
          dispatch({ type: 'CONFIRM_ROLE' });
        }, 3000);
      }
    };

    const handleStudentKickedByTeacher = (data: any) => {
      // Update session state to remove the kicked student
      if (state.session) {
        dispatch({
          type: 'SESSION_JOINED',
          payload: {
            sessionId: state.session.id,
            session: {
              ...state.session,
              students: state.session.students.filter(s => s.id !== data.studentId)
            }
          }
        });
      }
    };

    const handleStudentsList = (data: any) => {
      // Update session with current students list
      if (state.session) {
        dispatch({
          type: 'SESSION_JOINED',
          payload: {
            sessionId: state.session.id,
            session: {
              ...state.session,
              students: data.students
            }
          }
        });
      }
    };

    // Register event listeners
    on('session:created', handleSessionCreated);
    on('session:joined', handleSessionJoined);
    on('student:joined', handleStudentJoined);
    on('student:offline', handleStudentOffline);
    on('question:new', handleNewQuestion);
    on('answer:submitted', handleAnswerSubmitted);
    on('question:results', handleQuestionResults);
    on('question:end', handleQuestionEnd);
    on('chat:new-message', handleNewChatMessage);
    on('chat:history', handleChatHistory);
    on('chat:typing', handleChatTyping);
    on('session:history', handleSessionHistory);
    on('student:kicked', handleStudentKicked);
    on('student:kicked-by-teacher', handleStudentKickedByTeacher);
    on('session:students-list', handleStudentsList);

    // Cleanup
    return () => {
      off('session:created', handleSessionCreated);
      off('session:joined', handleSessionJoined);
      off('student:joined', handleStudentJoined);
      off('student:offline', handleStudentOffline);
      off('question:new', handleNewQuestion);
      off('answer:submitted', handleAnswerSubmitted);
      off('question:results', handleQuestionResults);
      off('question:end', handleQuestionEnd);
      off('chat:new-message', handleNewChatMessage);
      off('chat:history', handleChatHistory);
      off('chat:typing', handleChatTyping);
      off('session:history', handleSessionHistory);
      off('student:kicked', handleStudentKicked);
      off('student:kicked-by-teacher', handleStudentKickedByTeacher);
      off('session:students-list', handleStudentsList);
    };
  }, [isConnected, on, off, state.userId, state.session]);

  // Timer effect for current question
  useEffect(() => {
    if (state.timeRemaining > 0 && state.currentQuestion && !state.hasAnswered) {
      const timer = setTimeout(() => {
        dispatch({ type: 'UPDATE_TIME', payload: state.timeRemaining - 1 });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.timeRemaining, state.currentQuestion, state.hasAnswered]);

  // Actions
  const createSession = () => {
    if (!isConnected) return;
    emit('teacher:create-session', {
      teacherId: state.userId,
      teacherName: 'Teacher'
    });
  };

  // Update joinSession to always join global session
  const joinSession = () => {
    if (!isConnected || !state.studentName) return;
    emit('student:join-session', {
      studentId: state.userId,
      studentName: state.studentName
    });
  };

  // Update sendQuestion to work with global session
  const sendQuestion = (questionData: Omit<Question, 'id' | 'createdAt'>) => {
    if (!isConnected) return;
    emit('teacher:send-question', {
      questionData
    });
  };

  // Update submitAnswer to work with global session
  const submitAnswer = (answer: string | number) => {
    if (!isConnected || !state.currentQuestion) return;
    
    dispatch({ type: 'SUBMIT_ANSWER', payload: { answer } });
    
    emit('student:submit-answer', {
      questionId: state.currentQuestion.id,
      studentId: state.userId,
      studentName: state.studentName,
      answer
    });
  };

  // Add sendTypingIndicator function
  const sendTypingIndicator = () => {
    if (!isConnected) return;
    emit('chat:typing', {
      senderId: state.userId,
      senderName: state.userRole === 'teacher' ? 'Teacher' : state.studentName,
      senderRole: state.userRole
    });
  };

  // Update sendChatMessage to not emit typing for empty messages
  const sendChatMessage = (message: string) => {
    if (!isConnected) return;
    
    // Only emit typing indicator if message is not empty
    if (message.trim()) {
      emit('chat:typing', {
        senderId: state.userId,
        senderName: state.userRole === 'teacher' ? 'Teacher' : state.studentName,
        senderRole: state.userRole
      });
      
      emit('chat:send-message', {
        senderId: state.userId,
        senderName: state.userRole === 'teacher' ? 'Teacher' : state.studentName,
        senderRole: state.userRole,
        message
      });
    }
  };

  // Update sendEndQuestion to work with global session
  const sendEndQuestion = (questionId: string) => {
    if (!isConnected) return;
    emit('teacher:end-question', { questionId });
  };

  // Add kick student function
  const kickStudent = (studentId: string, studentName: string) => {
    if (!isConnected) return;
    emit('teacher:kick-student', { studentId, studentName });
  };

  // Add get students function
  const getStudents = () => {
    if (!isConnected) return;
    emit('teacher:get-students');
  };

  return (
    <PollContext.Provider value={{
      state,
      dispatch,
      createSession,
      joinSession,
      sendQuestion,
      submitAnswer,
      sendChatMessage,
      sendEndQuestion,
      kickStudent,
      getStudents,
      sendTypingIndicator
    }}>
      {children}
    </PollContext.Provider>
  );
};

export const usePoll = () => {
  const context = useContext(PollContext);
  if (!context) {
    throw new Error('usePoll must be used within a PollProvider');
  }
  return context;
};