import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { QualityMetricsData } from '../types/index';

interface QualityMetricsProps {
  repositoryId: number;
  fileId: number;
}

const QualityMetrics: React.FC<QualityMetricsProps> = ({ repositoryId, fileId }) => {
  const [metrics, setMetrics] = useState<QualityMetricsData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const calculateMetricsMutation = useMutation({
    mutationFn: () => apiClient.calculateQualityMetrics(repositoryId, fileId),
    onMutate: () => {
      setIsCalculating(true);
    },
    onSuccess: (response) => {
      setMetrics(response.quality_metrics);
      setIsCalculating(false);
    },
    onError: (error) => {
      console.error('Error calculating quality metrics:', error);
      setIsCalculating(false);
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };


  const CircularProgress: React.FC<{
    score: number;
    label: string;
    description: string;
    metricKey: string;
  }> = ({ score, label, description, metricKey }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${getScoreColor(score)}`}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          
          {/* Score text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {score.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">/ 100</div>
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>

        {/* Expandable breakdown */}
        {metrics && (
          <button
            onClick={() => setExpandedMetric(expandedMetric === metricKey ? null : metricKey)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {expandedMetric === metricKey ? 'Hide details' : 'Show details'}
          </button>
        )}

        {/* Breakdown details */}
        {expandedMetric === metricKey && metrics && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-left">
            <p className="text-xs text-gray-700">{metrics.breakdown[metricKey]}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quality Metrics</h2>
          <p className="text-gray-600 mt-1">5-dimensional code quality assessment</p>
        </div>
        
        {!metrics && (
          <button
            onClick={() => calculateMetricsMutation.mutate()}
            disabled={isCalculating}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Calculate Metrics</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Loading State */}
      {isCalculating && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Analyzing code quality metrics...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {calculateMetricsMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold">Calculation Failed</h3>
              <p className="text-red-700 mt-1">Unable to calculate quality metrics. Please try again.</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Results */}
      {metrics && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-xl p-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(metrics.overall)} mb-2`}>
                {metrics.overall.toFixed(1)}
              </div>
              <div className="text-lg text-gray-600 mb-4">Overall Quality Score</div>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                metrics.overall >= 80 ? 'bg-green-100 text-green-800' :
                metrics.overall >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {metrics.overall >= 80 ? 'Excellent' :
                 metrics.overall >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          </div>

          {/* Individual Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <CircularProgress
              score={metrics.maintainability}
              label="Maintainability"
              description="Code structure & modularity"
              metricKey="maintainability"
            />
            
            <CircularProgress
              score={metrics.testability}
              label="Testability"
              description="Ease of testing"
              metricKey="testability"
            />
            
            <CircularProgress
              score={metrics.readability}
              label="Readability"
              description="Code clarity & documentation"
              metricKey="readability"
            />
            
            <CircularProgress
              score={metrics.performance}
              label="Performance"
              description="Efficiency & optimization"
              metricKey="performance"
            />
            
            <CircularProgress
              score={metrics.security}
              label="Security"
              description="Vulnerability assessment"
              metricKey="security"
            />
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
            
            <div className="space-y-4">
              {Object.entries(metrics.breakdown).map(([metric, explanation]) => (
                <div key={metric} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 capitalize">{metric}</h4>
                  <p className="text-gray-700 mt-1">{explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Legend */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Scale</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div>
                  <div className="font-semibold text-gray-900">0-59: Needs Improvement</div>
                  <div className="text-sm text-gray-600">Significant issues detected</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div>
                  <div className="font-semibold text-gray-900">60-79: Good</div>
                  <div className="text-sm text-gray-600">Minor improvements possible</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-semibold text-gray-900">80-100: Excellent</div>
                  <div className="text-sm text-gray-600">High quality code</div>
                </div>
              </div>
            </div>
          </div>

          {/* Regenerate Button */}
          <div className="flex justify-center">
            <button
              onClick={() => calculateMetricsMutation.mutate()}
              disabled={isCalculating}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Recalculate Metrics</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityMetrics;
