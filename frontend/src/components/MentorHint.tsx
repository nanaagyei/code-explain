import React, { useState, useEffect } from 'react';
import { 
  LightBulbIcon, 
  XMarkIcon, 
  BookOpenIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

interface MentorHintProps {
  fileId: number;
  repositoryId: number;
  onDismiss?: () => void;
  className?: string;
}

interface LearningSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'concept' | 'practice' | 'pattern' | 'tool';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  resources?: string[];
}

export default function MentorHint({ fileId, repositoryId, onDismiss, className = '' }: MentorHintProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [suggestions, setSuggestions] = useState<LearningSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock suggestions for now - in real implementation, this would come from AI analysis
  const mockSuggestions: LearningSuggestion[] = [
    {
      id: 'async-patterns',
      title: 'Async/Await Patterns',
      description: 'Your code uses async/await effectively. Consider learning about Promise.all() for parallel execution.',
      type: 'pattern',
      difficulty: 'intermediate',
      estimatedTime: '15 min',
      resources: ['MDN Promises', 'JavaScript.info Async']
    },
    {
      id: 'error-handling',
      title: 'Error Handling Best Practices',
      description: 'Implement comprehensive error handling with try-catch blocks and proper error propagation.',
      type: 'practice',
      difficulty: 'beginner',
      estimatedTime: '20 min'
    },
    {
      id: 'testing-strategies',
      title: 'Unit Testing Strategies',
      description: 'Learn about testing patterns like mocking, stubbing, and test-driven development.',
      type: 'practice',
      difficulty: 'intermediate',
      estimatedTime: '45 min',
      resources: ['Jest Documentation', 'Testing Library Guide']
    }
  ];

  useEffect(() => {
    // Show hint after a delay to avoid overwhelming users
    const timer = setTimeout(() => {
      setIsVisible(true);
      setSuggestions(mockSuggestions);
    }, 3000);

    return () => clearTimeout(timer);
  }, [fileId]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'concept': return <AcademicCapIcon className="w-4 h-4" />;
      case 'practice': return <BookOpenIcon className="w-4 h-4" />;
      case 'pattern': return <LightBulbIcon className="w-4 h-4" />;
      default: return <BookOpenIcon className="w-4 h-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <LightBulbIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Learning Suggestions</h3>
            <p className="text-xs text-gray-600">AI-powered insights</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMinimize}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition duration-200"
            aria-label={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition duration-200"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 text-sm">Analyzing your code...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-blue-600">
                        {getTypeIcon(suggestion.type)}
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {suggestion.title}
                      </h4>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(suggestion.difficulty)}`}>
                      {suggestion.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-xs mb-2 leading-relaxed">
                    {suggestion.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{suggestion.estimatedTime}</span>
                    </span>
                    <Link
                      to="/mentor"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition duration-200"
                    >
                      Learn More →
                    </Link>
                  </div>
                  
                  {suggestion.resources && suggestion.resources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Resources:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.resources.map((resource, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md"
                          >
                            {resource}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Link
                  to="/mentor"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition duration-200 text-center"
                >
                  View Full Learning Path
                </Link>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition duration-200"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating indicator when minimized */}
      {isMinimized && (
        <div className="p-3 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <LightBulbIcon className="w-4 h-4" />
            <span className="text-xs font-medium">
              {suggestions.length} learning suggestions available
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
