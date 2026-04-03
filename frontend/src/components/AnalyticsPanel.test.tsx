import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AnalyticsPanel } from './AnalyticsPanel';

vi.mock('../api/client', () => ({
  apiClient: {
    getAnalyticsOverview: vi.fn().mockResolvedValue({
      repositories_total: 2,
      completed_repositories: 1,
      files_total: 10,
      average_health_score: 77.5,
      total_tokens_used: 1200,
      total_credits_charged: 34,
    }),
    getAnalyticsTrends: vi.fn().mockResolvedValue({
      days: 30,
      points: [{ date: '2026-03-01', average_score: 80, snapshots: 2 }],
    }),
    getRepositoryBenchmarks: vi.fn().mockResolvedValue({
      items: [{ repository_id: 1, repository_name: 'Repo A', average_score: 80, latest_score: 82, snapshots: 4 }],
    }),
  },
}));

test('renders analytics overview cards', async () => {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <AnalyticsPanel />
    </QueryClientProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
  });
  expect(screen.getByText('Repositories')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
