import test from 'node:test';
import assert from 'node:assert/strict';
import { CodeXplainClient } from '../api/client';

test('repositoryOverview sends payload and returns parsed response', async () => {
  const originalFetch = globalThis.fetch;
  let seenUrl = '';
  let seenBody = '';
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    seenUrl = String(input);
    seenBody = String(init?.body || '');
    return new Response(
      JSON.stringify({
        repo_name: 'repo',
        files_analyzed: 1,
        average_complexity: 2,
        entry_points: [],
        summary: 'ok',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  try {
    const client = new CodeXplainClient('http://localhost:8000', 'token');
    const result = await client.repositoryOverview({
      repo_name: 'repo',
      files: [{ path: 'a.py', content: 'print(1)', language: 'python' }],
    });
    assert.equal(seenUrl, 'http://localhost:8000/code-analysis/repository-overview');
    assert.match(seenBody, /a\.py/);
    assert.equal(result.files_analyzed, 1);
    assert.equal(result.repo_name, 'repo');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
