export interface Question {
  id: string; // was questionId
  type: 'mcq' | 'true-false' | 'short-text' | 'interview';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  timeLimit: number;
  createdAt: Date;
}

export interface Answer {
  id: string; // was answerId
  questionId: string;
  studentName: string;
  answer: string | number;
  submittedAt: Date;
  isCorrect?: boolean;
}

export interface PollResult {
  questionId: string;
  question: Question;
  answers: Answer[];
  totalStudents: number;
  summary: {
    [key: string]: number;
  };
}

export interface Student {
  id: string;
  name: string;
  joinedAt: Date;
  isOnline?: boolean;
}

export interface PollSession {
  id: string;
  teacherId: string;
  currentQuestion?: Question;
  students: Student[];
  results: PollResult[];
  isActive: boolean;
  timeRemaining?: number;
}

export interface ChatMessage {
  id: string; // was messageId
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student';
  message: string;
  timestamp: Date;
  isPrivate?: boolean;
  recipientId?: string;
}