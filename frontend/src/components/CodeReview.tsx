import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { CodeReviewData, SecurityIssue, PerformanceIssue, BestPractice } from '../types/index';

interface CodeReviewProps {
  repositoryId: number;
  fileId: number;
}

const CodeReview: React.FC<CodeReviewProps> = ({ repositoryId, fileId }) => {
  const [review, setReview] = useState<CodeReviewData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReviewMutation = useMutation({
    mutationFn: () => apiClient.generateCodeReview(repositoryId, fileId),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (response) => {
      setReview(response.code_review);
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Error generating code review:', error);
      setIsGenerating(false);
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Code Review</h2>
          <p className="text-gray-600 mt-1">AI-powered security, performance, and best practices analysis</p>
        </div>
        
        {!review && (
          <button
            onClick={() => generateReviewMutation.mutate()}
            disabled={isGenerating}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Generate Review</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Analyzing your code for issues...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {generateReviewMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold">Analysis Failed</h3>
              <p className="text-red-700 mt-1">Unable to generate code review. Please try again.</p>
            </div>
          </div>
        </div>
      )}

      {/* Review Results */}
      {review && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
                <p className="text-gray-600 mt-1">Code quality assessment</p>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(review.overall_score)}`}>
                  {review.overall_score.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">/ 100</div>
              </div>
            </div>
            
            {/* Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{review.summary}</p>
            </div>
          </div>

          {/* Security Issues */}
          {review.security_issues.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Security Issues</h3>
                <span className="ml-3 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {review.security_issues.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {review.security_issues.map((issue: SecurityIssue, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(issue.severity)}`}>
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {issue.type}
                          </span>
                          <span className="text-sm text-gray-500">Line {issue.line_number}</span>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{issue.description}</p>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>Fix:</strong> {issue.fix_suggestion}
                          </p>
                          <button
                            onClick={() => copyToClipboard(issue.fix_suggestion)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Copy fix to clipboard
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Issues */}
          {review.performance_issues.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Performance Issues</h3>
                <span className="ml-3 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  {review.performance_issues.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {review.performance_issues.map((issue: PerformanceIssue, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getImpactColor(issue.impact)}`}>
                            {issue.impact.toUpperCase()} IMPACT
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {issue.type}
                          </span>
                          <span className="text-sm text-gray-500">Line {issue.line_number}</span>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{issue.description}</p>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            <strong>Optimization:</strong> {issue.optimization_suggestion}
                          </p>
                          <button
                            onClick={() => copyToClipboard(issue.optimization_suggestion)}
                            className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
                          >
                            Copy suggestion to clipboard
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {review.best_practices.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Best Practices</h3>
                <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {review.best_practices.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {review.best_practices.map((practice: BestPractice, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(practice.priority)}`}>
                            {practice.priority.toUpperCase()} PRIORITY
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {practice.category}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{practice.description}</p>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <p className="text-sm text-purple-800">
                            <strong>Suggestion:</strong> {practice.suggestion}
                          </p>
                          <button
                            onClick={() => copyToClipboard(practice.suggestion)}
                            className="mt-2 text-xs text-purple-600 hover:text-purple-800 underline"
                          >
                            Copy suggestion to clipboard
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Issues */}
          {review.security_issues.length === 0 && 
           review.performance_issues.length === 0 && 
           review.best_practices.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Excellent Code Quality!</h3>
              <p className="text-green-700">No security vulnerabilities, performance issues, or best practice violations found.</p>
            </div>
          )}

          {/* Regenerate Button */}
          <div className="flex justify-center">
            <button
              onClick={() => generateReviewMutation.mutate()}
              disabled={isGenerating}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Regenerate Review</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeReview;
