import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { HealthScoreData } from '../types/index';

interface QualityMetricsProps {
  repositoryId: number;
  fileId: number;
}

const QualityMetrics: React.FC<QualityMetricsProps> = ({ repositoryId, fileId }) => {
  const [healthScore, setHealthScore] = useState<HealthScoreData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const calculateMetricsMutation = useMutation({
    mutationFn: () => apiClient.calculateQualityMetrics(repositoryId, fileId),
    onMutate: () => {
      setIsCalculating(true);
    },
    onSuccess: (response) => {
      setHealthScore(response.health_score);
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

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const metricOrder = ['maintainability', 'testability', 'readability', 'performance', 'security'];
  const metricLabels: Record<string, string> = {
    maintainability: 'Maintainability',
    testability: 'Testability',
    readability: 'Readability',
    performance: 'Performance',
    security: 'Security',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Health Score</h2>
          <p className="text-gray-600 mt-1">Single score with detailed breakdown</p>
        </div>
        
        {!healthScore && (
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
                <span>Calculate Health Score</span>
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
            <p className="text-gray-600 mt-4">Calculating health score...</p>
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
              <p className="text-red-700 mt-1">Unable to calculate health score. Please try again.</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Results */}
      {healthScore && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-gray-600">Health Score</div>
                <div className="flex items-baseline space-x-3 mt-2">
                  <div className={`text-5xl font-bold ${getScoreColor(healthScore.score)}`}>
                    {healthScore.score.toFixed(1)}
                  </div>
                  <span className="text-lg font-semibold text-gray-700">/ 100</span>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white border border-gray-200">
                    Grade {healthScore.grade}
                  </span>
                </div>
                <p className="text-gray-600 mt-3">{healthScore.summary}</p>
              </div>
              <button
                onClick={() => setShowBreakdown((prev) => !prev)}
                className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                {showBreakdown ? 'Hide breakdown' : 'View detailed breakdown'}
              </button>
            </div>
          </div>

          {showBreakdown && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metricOrder.map((metricKey) => {
                  const score = healthScore.metrics[metricKey] ?? 0;
                  return (
                    <div key={metricKey} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          {metricLabels[metricKey] || metricKey}
                        </span>
                        <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                          {score.toFixed(0)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-2 ${getScoreBg(score)}`}
                          style={{ width: `${Math.min(score, 100)}%` }}
                        />
                      </div>
                      {healthScore.breakdown[metricKey] && (
                        <p className="text-xs text-gray-600 mt-2">
                          {healthScore.breakdown[metricKey]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              <span>Recalculate Health Score</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityMetrics;
