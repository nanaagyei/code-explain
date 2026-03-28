import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Repository } from '../types/index';
import { BackButton } from '../components/BackButton';
import {
  ArrowLeftRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  GitCompare,
} from 'lucide-react';

interface ComparisonResult {
  repo1: { id: number; name: string };
  repo2: { id: number; name: string };
  comparison: {
    overview: string;
    similarities: string[];
    differences: string[];
    architecture_comparison: string;
    complexity_comparison: string;
    recommendations: string[];
    learning_opportunities: string;
  };
  tokens_used: number;
}

export default function Compare() {
  const [repo1Id, setRepo1Id] = useState<number | null>(null);
  const [repo2Id, setRepo2Id] = useState<number | null>(null);

  const { data: repositories = [] } = useQuery({
    queryKey: ['repositories'],
    queryFn: () => apiClient.getRepositories(),
  });

  const completedRepos = repositories.filter(
    (r: Repository) => r.status === 'completed'
  );

  const compareMutation = useMutation({
    mutationFn: () => apiClient.compareRepositories(repo1Id!, repo2Id!),
  });

  const handleCompare = () => {
    if (repo1Id && repo2Id && repo1Id !== repo2Id) {
      compareMutation.mutate();
    }
  };

  const result = compareMutation.data as ComparisonResult | undefined;

  return (
    <div className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 lg:mb-8">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-charcoal-950">Compare Repositories</h1>
              <p className="text-sm text-slate-600">Analyze differences between codebases</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Repo 1 Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                First Repository
              </label>
              <div className="relative">
                <select
                  value={repo1Id || ''}
                  onChange={(e) => setRepo1Id(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select repository...</option>
                  {completedRepos.map((repo: Repository) => (
                    <option key={repo.id} value={repo.id} disabled={repo.id === repo2Id}>
                      {repo.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Compare Icon */}
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
                <ArrowLeftRight className="w-6 h-6 text-primary-600" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Second Repository
              </label>
              <div className="relative">
                <select
                  value={repo2Id || ''}
                  onChange={(e) => setRepo2Id(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select repository...</option>
                  {completedRepos.map((repo: Repository) => (
                    <option key={repo.id} value={repo.id} disabled={repo.id === repo1Id}>
                      {repo.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleCompare}
              disabled={!repo1Id || !repo2Id || repo1Id === repo2Id || compareMutation.isPending}
              className="px-8 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
            >
              {compareMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <GitCompare className="w-5 h-5" />
                  <span>Compare Repositories</span>
                </>
              )}
            </button>
          </div>

          {completedRepos.length < 2 && (
            <p className="text-center text-sm text-amber-600 mt-4">
              You need at least 2 completed repositories to compare.
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-display font-bold text-lg text-charcoal-950 mb-3">Overview</h2>
              <p className="text-slate-700 leading-relaxed">{result.comparison.overview}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-lg text-charcoal-950 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success-600" />
                  Similarities
                </h3>
                <ul className="space-y-2">
                  {result.comparison.similarities.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-lg text-charcoal-950 mb-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span>Differences</span>
                </h3>
                <ul className="space-y-2">
                  {result.comparison.differences.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Architecture & Complexity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-lg text-charcoal-950 mb-3">Architecture Comparison</h3>
                <p className="text-slate-700 leading-relaxed">{result.comparison.architecture_comparison}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-display font-bold text-lg text-charcoal-950 mb-3">Complexity Analysis</h3>
                <p className="text-slate-700 leading-relaxed">{result.comparison.complexity_comparison}</p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-50 rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="font-display font-bold text-lg text-charcoal-950 mb-4 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <span>Recommendations</span>
              </h3>
              <ul className="space-y-3">
                {result.comparison.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Learning Opportunities */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display font-bold text-lg text-charcoal-950 mb-3">Learning Opportunities</h3>
              <p className="text-slate-700 leading-relaxed">{result.comparison.learning_opportunities}</p>
            </div>
          </div>
        )}

        {compareMutation.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Failed to compare repositories. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
