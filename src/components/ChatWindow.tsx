import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { usePoll } from '../context/PollContext';
import { ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Send, MessageCircle, X, Minimize2, Maximize2, AlertCircle } from 'lucide-react';

interface ChatWindowProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  isMinimized, 
  onToggleMinimize, 
  onClose,
  onSendMessage
}) => {
  const { state, sendTypingIndicator } = usePoll();
  const [message, setMessage] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      try {
        onSendMessage(message.trim());
        setMessage('');
        setChatError(null);
      } catch (error) {
        setChatError('Failed to send message. Please try again.');
        console.error('Chat send error:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setChatError(null); // Clear error when user types
    
    // Send typing indicator
    if (state.isConnected) {
      sendTypingIndicator();
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '--:--';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Safety check - if state is not available, show error
  if (!state) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200">
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Chat unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleMinimize}
          className="h-12 w-12 rounded-full bg-[linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)] shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
        {state.chatMessages && state.chatMessages.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {state.chatMessages.length > 99 ? '99+' : state.chatMessages.length}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Chat
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
            {!state.isConnected ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Not connected to server</p>
                <p className="text-xs mt-1">Chat will be available when connected</p>
              </div>
            ) : state.chatMessages && state.chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No messages yet. Start the conversation!
              </div>
            ) : (
              state.chatMessages && state.chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderRole === state.userRole ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.senderRole === state.userRole
                        ? 'bg-blue-600 text-white'
                        : msg.senderRole === 'teacher'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {msg.senderName || 'Unknown'}
                      </span>
                      {msg.senderRole === 'teacher' && (
                        <span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded">
                          Teacher
                        </span>
                      )}
                      <span className="text-xs opacity-70">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
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
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {chatError && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-red-600 text-xs">{chatError}</p>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={
                  state.userRole === 'teacher' 
                    ? "Send a message to students..." 
                    : "Ask a question or give feedback..."
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                maxLength={500}
                disabled={!state.isConnected}
              />
              <Button
                type="submit"
                disabled={!message.trim() || !state.isConnected}
                className="h-10 w-10 p-0 rounded-lg bg-[linear-gradient(159deg,rgba(143,100,225,1)_0%,rgba(29,104,189,1)_100%)]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="text-xs text-gray-500 mt-1">
              Press Enter to send • {500 - message.length} characters left
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};