import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CSSProperties } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

export default function BentoChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup EventSource on unmount
  useEffect(() => {
    const eventSource = eventSourceRef.current;
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Add assistant message placeholder with typing indicator
    setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);

    try {
      // Get token
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Create EventSource for streaming
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat/stream`;
      
      // Use fetch with streaming
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.chunk) {
              accumulatedContent += data.chunk;
              // Update the last message with accumulated content
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: accumulatedContent,
                  isTyping: true
                };
                return newMessages;
              });
            } else if (data.done) {
              // Remove typing indicator
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: accumulatedContent,
                  isTyping: false
                };
                return newMessages;
              });
            } else if (data.error) {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: 'Failed to get response. Please try again.',
          isTyping: false
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-2xl shadow-2xl hover:bg-blue-700 hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center group z-50"
          aria-label="Open AI Chat"
        >
          <svg className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-2xl bg-blue-600 animate-ping opacity-20"></span>
        </button>
      )}

      {/* Chat Window - Bento Style */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[500px] sm:h-[600px] max-h-[calc(100vh-2rem)] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-neutral-200/50 flex flex-col z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-5 border-b border-gray-200/50 bg-blue-50/50 rounded-t-3xl">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <CpuChipIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">CodeExplain AI</h3>
                <p className="text-xs text-gray-600 hidden sm:block">Ask me anything about code!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(true)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition duration-200"
                aria-label="Expand chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition duration-200"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-10 h-10 text-blue-600 animate-float" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 mb-2">Start a conversation!</h4>
                  <p className="text-sm text-neutral-600 max-w-xs">
                    Ask me about code patterns, best practices, or get quick explanations.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setInput("What's the difference between async/await and promises?")}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg transition duration-200"
                  >
                    Async/Await vs Promises?
                  </button>
                  <button
                    onClick={() => setInput("Explain React hooks")}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg transition duration-200"
                  >
                    React Hooks
                  </button>
                  <button
                    onClick={() => setInput("What is dependency injection?")}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg transition duration-200"
                  >
                    Dependency Injection
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } ${message.isTyping ? 'animate-pulse' : ''}`}
                    >
                      {message.role === 'assistant' && message.isTyping && message.content === '' ? (
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      ) : message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-invert">
                          <ReactMarkdown
                            components={{
                              code({ className, children }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return match ? (
                                  <SyntaxHighlighter
                                    style={vscDarkPlus as Record<string, CSSProperties>}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-lg text-xs"
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs">
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-neutral-200/50 bg-white/50 rounded-b-3xl">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-neutral-100 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200 outline-none text-xs sm:text-sm disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-3 sm:px-5 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg hover:shadow-xl flex-shrink-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2 text-center hidden sm:block">
              Press Enter to send • AI responses may vary
            </p>
          </div>
        </div>
      )}

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-4xl h-[80vh] flex flex-col animate-modal-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50/50 rounded-t-3xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CpuChipIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">CodeExplain AI - Full Chat</h3>
                  <p className="text-sm text-gray-600">Ask me anything about code!</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition duration-200"
                aria-label="Close expanded chat"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CpuChipIcon className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to CodeExplain AI!</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    I'm here to help you understand code, explain concepts, and answer any programming questions you have.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => setInput("What's the difference between async/await and promises?")}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition duration-200"
                    >
                      Async/Await vs Promises?
                    </button>
                    <button
                      onClick={() => setInput("Explain React hooks")}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition duration-200"
                    >
                      React Hooks
                    </button>
                    <button
                      onClick={() => setInput("What is dependency injection?")}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition duration-200"
                    >
                      Dependency Injection
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-6 py-4 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        } ${message.isTyping ? 'animate-pulse' : ''}`}
                      >
                        {message.role === 'assistant' && message.isTyping && message.content === '' ? (
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        ) : message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              components={{
                                code({ className, children }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return match ? (
                                    <SyntaxHighlighter
                                      style={vscDarkPlus as Record<string, CSSProperties>}
                                      language={match[1]}
                                      PreTag="div"
                                      className="rounded-lg text-sm"
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className="bg-gray-800 px-2 py-1 rounded text-sm">
                                      {children}
                                    </code>
                                  );
                                }
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Modal Input */}
            <div className="p-6 border-t border-gray-200 bg-gray-50/50 rounded-b-3xl">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about code..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom animations */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes modal-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-modal-in {
          animation: modal-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

