import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface CollaborationPanelProps {
  repositoryId: number;
}

export function CollaborationPanel({ repositoryId }: CollaborationPanelProps) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [liveUsers, setLiveUsers] = useState<string[]>([]);

  const createSession = useMutation({
    mutationFn: () => apiClient.createCollabSession({ repository_id: repositoryId, title: 'Repository Collaboration' }),
    onSuccess: (session) => setSessionId(session.id),
  });

  const { data: session, refetch } = useQuery({
    queryKey: ['collab', 'session', sessionId],
    queryFn: () => apiClient.getCollabSession(sessionId!),
    enabled: Boolean(sessionId),
  });

  const addNote = useMutation({
    mutationFn: (content: string) => apiClient.createCollabNote(sessionId!, content),
    onSuccess: () => {
      setDraft('');
      refetch();
    },
  });

  useEffect(() => {
    if (!sessionId) return;
    const ws = apiClient.createCollabWebSocket(sessionId);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; users?: string[] };
        if (payload.type === 'presence') {
          setLiveUsers(payload.users ?? []);
          return;
        }
      } catch {
        // Ignore malformed websocket events.
      }
      refetch();
    };
    return () => ws.close();
  }, [sessionId, refetch]);

  const notes = useMemo(() => session?.notes ?? [], [session]);

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Real-time Collaboration</h3>
        {sessionId ? (
          <span className="text-xs text-slate-500">Session #{sessionId}</span>
        ) : (
          <button
            type="button"
            onClick={() => createSession.mutate()}
            disabled={createSession.isPending}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white"
          >
            {createSession.isPending ? 'Starting...' : 'Start Session'}
          </button>
        )}
      </div>

      <p className="text-xs text-slate-600 mb-3">
        Presence: {liveUsers.length ? liveUsers.join(', ') : 'No active collaborators'}
      </p>

      {sessionId && (
        <>
          <div className="space-y-2 max-h-56 overflow-auto mb-3">
            {notes.length > 0 ? notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-slate-500 mt-1">
                  user {note.user_id} · {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
            )) : (
              <p className="text-sm text-slate-500">No notes yet.</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add shared note..."
              className="flex-1 min-h-[84px] border border-slate-200 rounded-lg px-3 py-2"
            />
            <button
              type="button"
              onClick={() => draft.trim() && addNote.mutate(draft)}
              disabled={addNote.isPending || !draft.trim()}
              className="sm:self-end px-3 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white disabled:opacity-50"
            >
              {addNote.isPending ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
