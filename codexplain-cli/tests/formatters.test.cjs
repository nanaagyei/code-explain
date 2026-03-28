'use strict';
const { formatError, formatProgress, writeOutput } = require('../dist/output/formatters');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { test } = require('node:test');

test('formatError includes Error and message', () => {
  const out = formatError('something broke');
  assert(out.includes('Error:'));
  assert(out.includes('something broke'));
});

test('formatProgress includes status and counts', () => {
  const s = formatProgress('completed', 5, 10);
  assert(s.includes('completed'));
  assert(s.includes('5'));
  assert(s.includes('10'));
});

test('writeOutput writes to file when path given', () => {
  const tmp = path.join(os.tmpdir(), 'codexplain-writeOutput-' + Date.now());
  try {
    writeOutput('hello', tmp);
    assert.strictEqual(fs.readFileSync(tmp, 'utf-8'), 'hello');
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
});
