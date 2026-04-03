import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CollaborationPanel } from './CollaborationPanel';

const {
  createCollabSession,
  getCollabSession,
  createCollabNote,
  createCollabWebSocket,
} = vi.hoisted(() => {
  const createCollabSession = vi.fn().mockResolvedValue({
    id: 9,
    repository_id: 1,
    title: 'Repository Collaboration',
    is_active: true,
    created_at: new Date().toISOString(),
    notes: [],
  });
  const getCollabSession = vi.fn().mockResolvedValue({
    id: 9,
    repository_id: 1,
    title: 'Repository Collaboration',
    is_active: true,
    created_at: new Date().toISOString(),
    notes: [],
  });
  const createCollabNote = vi.fn().mockResolvedValue({
    id: 1,
    content: 'hello',
    user_id: 1,
    created_at: new Date().toISOString(),
  });
  const createCollabWebSocket = vi.fn().mockReturnValue({
    close: vi.fn(),
    onmessage: null,
  });
  return { createCollabSession, getCollabSession, createCollabNote, createCollabWebSocket };
});

vi.mock('../api/client', () => ({
  apiClient: {
    createCollabSession,
    getCollabSession,
    createCollabNote,
    createCollabWebSocket,
  },
}));

test('starts collaboration session', async () => {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <CollaborationPanel repositoryId={1} />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByText('Start Session'));
  await waitFor(() => {
    expect(createCollabSession).toHaveBeenCalled();
  });
});
