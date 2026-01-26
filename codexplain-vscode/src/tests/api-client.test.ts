import { strict as assert } from 'node:assert';
import { test } from 'node:test';

const originalFetch = globalThis.fetch;

test('CodeXplainClient healthCheck', async () => {
  globalThis.fetch = async () => ({ ok: true } as Response);
  try {
    const { CodeXplainClient } = await import('../api/client');
    const client = new CodeXplainClient('http://localhost:8000');
    const ok = await client.healthCheck();
    assert.strictEqual(ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('CodeXplainClient healthCheck fails when not ok', async () => {
  globalThis.fetch = async () => ({ ok: false } as Response);
  try {
    const { CodeXplainClient } = await import('../api/client');
    const client = new CodeXplainClient('http://localhost:8000');
    const ok = await client.healthCheck();
    assert.strictEqual(ok, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('CodeXplainClient quickFileAnalysis', async () => {
  globalThis.fetch = async (url: unknown, opts?: { method?: string; body?: string }) => {
    assert.strictEqual((url as string).endsWith('/code-analysis/quick-file'), true);
    assert.strictEqual(opts?.method, 'POST');
    const body = opts?.body ? JSON.parse(opts.body as string) : {};
    assert.strictEqual(typeof body.code, 'string');
    assert.strictEqual(typeof body.language, 'string');
    assert.strictEqual(typeof body.file_path, 'string');
    return {
      ok: true,
      json: async () => ({
        summary: 'Test summary',
        health_score: { score: 85, grade: 'A', summary: 'Good', metrics: {}, breakdown: {} },
        tokens_used: 100
      })
    } as Response;
  };
  try {
    const { CodeXplainClient } = await import('../api/client');
    const client = new CodeXplainClient('http://localhost:8000', 'token');
    const result = await client.quickFileAnalysis({
      code: 'function foo() {}',
      language: 'javascript',
      file_path: 'test.js'
    });
    assert.strictEqual(result.summary, 'Test summary');
    assert.strictEqual(result.health_score.score, 85);
    assert.strictEqual(result.tokens_used, 100);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
