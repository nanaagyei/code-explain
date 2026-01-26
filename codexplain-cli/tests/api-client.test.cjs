'use strict';
const assert = require('assert');
const { test } = require('node:test');

const originalFetch = globalThis.fetch;
test('API client getPrChecklist', async () => {
  globalThis.fetch = async (url, opts) => {
    assert(url.endsWith('/pr-checklist'));
    assert(opts?.method === 'POST');
    return {
      ok: true,
      json: async () => ({ repository: 'repo', checklist: '✓ Do X', tokens_used: 10 })
    };
  };
  try {
    const { CodeXplainClient } = require('../dist/api/client');
    const client = new CodeXplainClient('http://localhost:8000', 'token');
    const result = await client.getPrChecklist(1);
    assert.strictEqual(result.repository, 'repo');
    assert.strictEqual(result.checklist, '✓ Do X');
    assert.strictEqual(result.tokens_used, 10);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('API client explainChangelog', async () => {
  globalThis.fetch = async (url, opts) => {
    assert(url.endsWith('/explain-changelog'));
    assert(opts?.method === 'POST');
    assert(opts?.body instanceof FormData);
    return {
      ok: true,
      json: async () => ({ repository: 'r', explanation: 'Summary.', tokens_used: 5 })
    };
  };
  try {
    const { CodeXplainClient } = require('../dist/api/client');
    const client = new CodeXplainClient('http://localhost:8000', 'token');
    const result = await client.explainChangelog(1, '## 1.0.0\n- Fix bug');
    assert.strictEqual(result.repository, 'r');
    assert.strictEqual(result.explanation, 'Summary.');
    assert.strictEqual(result.tokens_used, 5);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('API client healthCheck', async () => {
  globalThis.fetch = async () => ({ ok: true });
  try {
    const { CodeXplainClient } = require('../dist/api/client');
    const client = new CodeXplainClient('http://localhost:8000');
    const ok = await client.healthCheck();
    assert.strictEqual(ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
