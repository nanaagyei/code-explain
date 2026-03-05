import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function AnalyticsPanel() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => apiClient.getAnalyticsOverview(),
  });
  const { data: trends } = useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: () => apiClient.getAnalyticsTrends(30),
  });
  const { data: benchmarks } = useQuery({
    queryKey: ['analytics', 'benchmarks'],
    queryFn: () => apiClient.getRepositoryBenchmarks(),
  });

  return (
    <section className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Advanced Analytics</h2>
      <p className="text-sm text-gray-600 mb-5">Account-level quality trends and repository benchmarks.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Repositories</p>
          <p className="text-2xl font-bold text-slate-900">{overview?.repositories_total ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Completed</p>
          <p className="text-2xl font-bold text-slate-900">{overview?.completed_repositories ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Avg Health</p>
          <p className="text-2xl font-bold text-slate-900">{overview?.average_health_score?.toFixed(1) ?? '0.0'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-600">Credits Used</p>
          <p className="text-2xl font-bold text-slate-900">{overview?.total_credits_charged ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">30-Day Quality Trend</h3>
          <ul className="space-y-2 max-h-56 overflow-auto">
            {(trends?.points ?? []).map((p) => (
              <li key={p.date} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{p.date}</span>
                <span className="font-semibold text-slate-900">{p.average_score.toFixed(1)} ({p.snapshots})</span>
              </li>
            ))}
            {!trends?.points?.length && <li className="text-sm text-slate-500">No trend data yet.</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Repository Benchmarks</h3>
          <ul className="space-y-2 max-h-56 overflow-auto">
            {(benchmarks?.items ?? []).slice(0, 10).map((r) => (
              <li key={r.repository_id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 truncate pr-2">{r.repository_name}</span>
                <span className="font-semibold text-slate-900">{r.average_score.toFixed(1)}</span>
              </li>
            ))}
            {!benchmarks?.items?.length && <li className="text-sm text-slate-500">No repository benchmarks yet.</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
