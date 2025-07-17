import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { usePoll } from '../context/PollContext';
import { Question } from '../types';
import { Users, Clock, BarChart3, Plus, Wifi, WifiOff, AlertCircle, UserX, Star, CheckCircle2 } from 'lucide-react';
import { ChatWindow } from './ChatWindow';

export const TeacherDashboard: React.FC = () => {
  const { state, createSession, sendQuestion, sendChatMessage, sendEndQuestion, kickStudent, getStudents } = usePoll();
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    type: 'mcq' as 'mcq' | 'true-false' | 'short-text',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    timeLimit: 60
  });
  const [showChat, setShowChat] = useState(true);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kickConfirmation, setKickConfirmation] = useState<{ studentId: string; studentName: string } | null>(null);

  // Create session when teacher role is set
  useEffect(() => {
    if (state.userRole === 'teacher' && state.isConnected && !state.session) {
      createSession();
    }
  }, [state.userRole, state.isConnected, state.session, createSession]);

  // Get students list when session is created
  useEffect(() => {
    if (state.session && state.userRole === 'teacher') {
      getStudents();
    }
  }, [state.session, state.userRole, getStudents]);

  const handleKickStudent = (studentId: string, studentName: string) => {
    setKickConfirmation({ studentId, studentName });
  };

  const confirmKickStudent = () => {
    if (kickConfirmation) {
      kickStudent(kickConfirmation.studentId, kickConfirmation.studentName);
      setKickConfirmation(null);
    }
  };

  const cancelKickStudent = () => {
    setKickConfirmation(null);
  };

  const handleCreateQuestion = () => {
    setLoading(true);
    setError(null);
    try {
      const questionData: Omit<Question, 'id' | 'createdAt'> = {
        type: questionForm.type,
        question: questionForm.question,
        options: questionForm.type === 'mcq' ? questionForm.options.filter(opt => opt.trim()) : 
                 questionForm.type === 'true-false' ? ['True', 'False'] : undefined,
        correctAnswer: questionForm.correctAnswer || undefined,
        timeLimit: questionForm.timeLimit
      };
      sendQuestion(questionData);
      setShowCreateQuestion(false);
      setQuestionForm({
        type: 'mcq',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        timeLimit: 60
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const canSendNewQuestion = !state.currentQuestion && state.isConnected;
  const onlineStudents = state.session?.students.filter(s => s.isOnline !== false) || [];

  // Connection status indicator
  if (!state.isConnected) {
    return (
      <div className="bg-white min-h-screen p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <WifiOff className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-semibold mb-2">Connection Lost</h2>
            <p className="text-gray-600 mb-4">
              Unable to connect to the server. Please check your internet connection.
            </p>
            {state.error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {state.error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state while creating session
  if (!state.session) {
    return (
      <div className="bg-white min-h-screen p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Creating Session...</h2>
            <p className="text-gray-600">Setting up your live polling session</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showCreateQuestion) {
    return (
      <div className="bg-white min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Badge className="flex w-[134px] h-[31px] items-center justify-center gap-[7px] px-[9px] py-0 rounded-3xl bg-[linear-gradient(90deg,rgba(117,101,217,1)_0%,rgba(77,10,205,1)_100%)] font-['Sora',Helvetica] font-semibold text-white text-sm">
              <img className="w-[14.66px] h-[14.65px]" alt="Vector" src="/vector.svg" />
              Intervue Poll
            </Badge>
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Connected</span>
            </div>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Create New Question</CardTitle>
              <p className="text-gray-600">Session ID: <code className="bg-gray-100 px-2 py-1 rounded">{state.session.id}</code></p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Question Type</label>
                <select
                  value={questionForm.type}
                  onChange={(e) => setQuestionForm({...questionForm, type: e.target.value as any})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="short-text">Short Text</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Question</label>
                <textarea
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                  placeholder="Enter your question..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  required
                />
              </div>

              {questionForm.type === 'mcq' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Options</label>
                  {questionForm.options.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options];
                        newOptions[index] = e.target.value;
                        setQuestionForm({...questionForm, options: newOptions});
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    />
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Correct Answer (Optional)</label>
                {questionForm.type === 'mcq' ? (
                  <select
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({...questionForm, correctAnswer: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select correct answer</option>
                    {questionForm.options.map((option, index) => (
                      option.trim() && <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                ) : questionForm.type === 'true-false' ? (
                  <select
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({...questionForm, correctAnswer: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select correct answer</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({...questionForm, correctAnswer: e.target.value})}
                    placeholder="Enter correct answer"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time Limit (seconds)</label>
                <input
                  type="number"
                  value={questionForm.timeLimit}
                  onChange={(e) => setQuestionForm({...questionForm, timeLimit: parseInt(e.target.value)})}
                  min="10"
                  max="300"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleCreateQuestion}
                  disabled={!questionForm.question.trim() || !state.isConnected || loading}
                  className="flex-1 h-[50px] rounded-[25px] bg-[linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] font-['Sora',Helvetica] font-semibold text-white text-lg"
                >
                  {loading ? 'Sending...' : 'Send Question'}
                </Button>
                <Button
                  onClick={() => setShowCreateQuestion(false)}
                  variant="outline"
                  className="flex-1 h-[50px] rounded-[25px] font-['Sora',Helvetica] font-semibold text-lg"
                >
                  Cancel
                </Button>
              </div>
              {error && <div className="text-red-500">{error}</div>}
              {loading && <div className="text-blue-500">Loading...</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-8">
      {/* Window Type Banner */}
      <div className="w-full flex items-center justify-center mb-4">
        <div className="bg-blue-100 text-blue-800 rounded-full px-6 py-2 font-semibold text-lg flex items-center gap-2 shadow">
          <span role="img" aria-label="Teacher">🧑‍🏫</span> Teacher Window
        </div>
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Badge className="flex w-[134px] h-[31px] items-center justify-center gap-[7px] px-[9px] py-0 rounded-3xl bg-[linear-gradient(90deg,rgba(117,101,217,1)_0%,rgba(77,10,205,1)_100%)] font-['Sora',Helvetica] font-semibold text-white text-sm">
            <img className="w-[14.66px] h-[14.65px]" alt="Vector" src="/vector.svg" />
            Intervue Poll
          </Badge>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Connected</span>
            </div>
            <div className="text-sm text-gray-600">
              Session: <code className="bg-gray-100 px-2 py-1 rounded">Global Session</code>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Session Stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Students Online
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-4">
                  {state.session?.students?.filter(s => s.isOnline !== false).length || 0}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {onlineStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{student.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleKickStudent(student.id, student.name)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title={`Kick ${student.name} from session`}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {onlineStudents.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No students online</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {state.currentQuestion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Time Remaining
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {Math.floor(state.timeRemaining / 60)}:{(state.timeRemaining % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${(state.timeRemaining / (state.currentQuestion?.timeLimit || 60)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {!state.currentQuestion ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <Plus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Ready to Create a Question?</h2>
                    <p className="text-gray-600">
                      Create and send questions to your students in real-time
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCreateQuestion(true)}
                    disabled={!canSendNewQuestion}
                    className="h-[50px] px-8 rounded-[25px] bg-[linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] font-['Sora',Helvetica] font-semibold text-white text-lg"
                  >
                    Create New Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Current Question</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">{state.currentQuestion.question}</h3>
                    <Badge variant="outline" className="mb-4">
                      {state.currentQuestion.type.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  {state.currentQuestion.options && (
                    <div className="space-y-2">
                      {state.currentQuestion.options.map((option, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Session History */}
            {state.sessionHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Session Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {state.sessionHistory.map((result, index) => (
                      <div key={result.questionId} className="border-l-4 border-blue-500 pl-4 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            Question {index + 1}
                            {/* Star icon for interview poll */}
                            {result.question.type === 'interview' && (
                              <Star className="w-5 h-5 text-yellow-500" title="Interview Poll" />
                            )}
                          </h4>
                        </div>
                        <p className="text-gray-600 mb-2">{result.question.question}</p>
                        <div className="text-sm text-gray-500 mb-2">
                          {result.answers.length} responses
                        </div>
                        {/* List correct responders */}
                        {result.answers.filter(a => a.isCorrect).length > 0 && (
                          <div className="mb-2">
                            <span className="font-semibold text-green-700 flex items-center gap-1 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-500" /> Correct Responders:
                            </span>
                            <ul className="ml-6 list-disc">
                              {result.answers.filter(a => a.isCorrect).map(a => (
                                <li key={a.studentName} className="text-green-700">
                                  {a.studentName}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Optionally, show all answers with correctness */}
                        <div className="mt-2">
                          <span className="font-semibold">All Answers:</span>
                          <ul className="ml-6">
                            {result.answers.map(a => (
                              <li key={a.studentName} className={a.isCorrect ? 'text-green-700' : 'text-gray-700'}>
                                {a.studentName}: <span className="font-mono">{a.answer}</span> {a.isCorrect && <CheckCircle2 className="inline w-4 h-4 text-green-500 ml-1" />}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {state.currentQuestion && (
              <Button
                onClick={() => {
                  sendEndQuestion(state.currentQuestion.id);
                }}
                className="mt-4 bg-red-600 text-white"
              >
                End Question Now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      {showChat && (
        <ChatWindow
          isMinimized={isChatMinimized}
          onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
          onClose={() => setShowChat(false)}
          onSendMessage={sendChatMessage}
        />
      )}

      {/* Chat Toggle Button (when closed) */}
      {!showChat && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setShowChat(true)}
            className="h-12 w-12 rounded-full bg-[linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Users className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Kick Confirmation Modal */}
      {kickConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Kick</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to kick <strong>{kickConfirmation.studentName}</strong> from the session?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={cancelKickStudent}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmKickStudent}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700"
              >
                Kick Student
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};