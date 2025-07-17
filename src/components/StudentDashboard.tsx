import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { usePoll } from '../context/PollContext';
import { Clock, Users, CheckCircle, AlertCircle, Wifi, WifiOff, UserX, Star } from 'lucide-react';
import { ChatWindow } from './ChatWindow';

export const StudentDashboard: React.FC = () => {
  const { state, joinSession, submitAnswer, sendChatMessage } = usePoll();
  const [selectedAnswer, setSelectedAnswer] = useState<string | number>('');
  const [showChat, setShowChat] = useState(true);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // Auto-join global session when student name is set
  useEffect(() => {
    if (state.userRole === 'student' && state.studentName && state.isConnected && !state.session) {
      joinSession();
    }
  }, [state.userRole, state.studentName, state.isConnected, state.session, joinSession]);

  const handleSubmitAnswer = () => {
    if (selectedAnswer !== '') {
      submitAnswer(selectedAnswer);
      setSelectedAnswer('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state while joining session
  if (!state.session) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Joining Live Session...</h2>
          <p className="text-gray-600">Connecting to the global polling session</p>
        </div>
      </div>
    );
  }

  // Connection error state
  if (!state.isConnected) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connection Required</h2>
          <p className="text-gray-600 mb-4">Please check your internet connection to join the session.</p>
          {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
        </div>
      </div>
    );
  }

  // Kicked from session state
  if (state.error && state.error.includes('removed from the session')) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <UserX className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Removed from Session</h2>
          <p className="text-gray-600 mb-4">{state.error}</p>
          <p className="text-sm text-gray-500">You will be redirected to the main screen shortly...</p>
        </div>
      </div>
    );
  }

  const onlineStudents = state.session?.students.filter(s => s.isOnline !== false) || [];

  return (
    <div className="bg-white min-h-screen p-8">
      {/* Window Type Banner */}
      <div className="w-full flex items-center justify-center mb-4">
        <div className="bg-green-100 text-green-800 rounded-full px-6 py-2 font-semibold text-lg flex items-center gap-2 shadow">
          <span role="img" aria-label="Student">🧑‍🎓</span> Student Window
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        <>
          {/* Header */}
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
          <div className="text-sm text-gray-600">
            Welcome, <span className="font-semibold">{state.studentName}</span>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{state.session?.students?.filter(s => s.isOnline !== false).length || 0}</div>
                <div className="text-sm text-gray-600">Students Online</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold">{formatTime(state.timeRemaining)}</div>
                <div className="text-sm text-gray-600">Time Left</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{state.sessionHistory.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* Waiting for Question State */}
          {!state.currentQuestion && state.sessionHistory.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                {/* Animated Spinner */}
                <div className="flex flex-col items-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mb-4"></div>
                </div>
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-semibold mb-2">Waiting for Question</h2>
                <p className="text-gray-600">
                  Your teacher will send a question shortly. Stay tuned!
                </p>
              </CardContent>
            </Card>
          ) : state.currentQuestion && !state.hasAnswered ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    Answer the Question
                    {/* Star icon for interview poll */}
                    {state.currentQuestion.type === 'interview' && (
                      <Star className="w-5 h-5 text-yellow-500" />
                    )}
                  </span>
                  <Badge variant={state.timeRemaining > 10 ? "default" : "destructive"}>
                    {formatTime(state.timeRemaining)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">{state.currentQuestion.question}</h3>
                  <Badge variant="outline" className="mb-4">
                    {state.currentQuestion.type.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      state.timeRemaining > 10 ? 'bg-blue-600' : 'bg-red-600'
                    }`}
                    style={{ 
                      width: `${(state.timeRemaining / (state.currentQuestion?.timeLimit || 60)) * 100}%` 
                    }}
                  ></div>
                </div>

                {state.currentQuestion.type === 'mcq' && state.currentQuestion.options && (
                  <div className="space-y-3">
                    {state.currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedAnswer === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option}
                          checked={selectedAnswer === option}
                          onChange={(e) => setSelectedAnswer(e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-lg">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {state.currentQuestion.type === 'true-false' && (
                  <div className="space-y-3">
                    {['True', 'False'].map((option) => (
                      <label
                        key={option}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedAnswer === option
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option}
                          checked={selectedAnswer === option}
                          onChange={(e) => setSelectedAnswer(e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-lg">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {state.currentQuestion.type === 'short-text' && (
                  <textarea
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none text-lg"
                  />
                )}

                {/* Show typing indicator from context state */}
                {state.isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center gap-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">Someone is typing...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show error/loading state */}
                {state.error && <div className="text-red-500">{state.error}</div>}

                <Button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === '' || state.timeRemaining === 0 || state.hasAnswered}
                  className="w-full h-[50px] rounded-[25px] bg-[linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] font-['Sora',Helvetica] font-semibold text-white text-lg"
                >
                  Submit Answer
                </Button>
              </CardContent>
            </Card>
          ) : state.hasAnswered ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-semibold mb-2">Answer Submitted!</h2>
                <p className="text-gray-600 mb-4">
                  Waiting for other students to finish...
                </p>
                <div className="text-lg">
                  Your answer: <span className="font-semibold">{state.currentAnswer}</span>
                </div>
                {state.timeRemaining > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">Time remaining: {formatTime(state.timeRemaining)}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${(state.timeRemaining / (state.currentQuestion?.timeLimit || 60)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Session History */}
          {state.sessionHistory.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Previous Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {state.sessionHistory.map((result, index) => (
                    <div key={result.questionId} className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold">Question {index + 1}</h4>
                      <p className="text-gray-600 mb-2">{result.question.question}</p>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-xs">
                          Completed
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {result.answers.length} responses
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
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
    </div>
  );
};