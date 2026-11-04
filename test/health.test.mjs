import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFileSync } from 'node:fs';

import {
  checkList,
  computeHealthStatus,
  getRepoMeta,
} from '../scripts/health.mjs';

const fixture = (name) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

function serve(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

const entry = (url) => ({
  id: 'test-list',
  default_format: 'adblock',
  formats: { adblock: url },
  source: '',
});

const now = () => '2026-11-04T00:00:00.000Z';

test('a 200 response records format, entries, and rules', async () => {
  const srv = await serve((req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain', etag: '"abc"' });
    res.end(fixture('adblock.txt'));
  });
  try {
    const record = await checkList(entry(srv.url), null, { now });
    assert.equal(record.status, 'ok');
    assert.equal(record.httpStatus, 200);
    assert.equal(record.formatDetected, 'adblock');
    assert.equal(record.entries, 2);
    assert.equal(record.rules, 5);
    assert.equal(record.exceptions, 1);
    assert.equal(record.consecutiveFailures, 0);
    assert.equal(record.checkedAt, now());
  } finally {
    await srv.close();
  }
});

test('a 304 response keeps the previous entry count', async () => {
  let calls = 0;
  const srv = await serve((req, res) => {
    calls++;
    if (calls === 1) {
      res.writeHead(200, { 'content-type': 'text/plain', etag: '"abc"' });
      res.end(fixture('adblock.txt'));
      return;
    }
    assert.equal(req.headers['if-none-match'], '"abc"');
    res.writeHead(304);
    res.end();
  });
  try {
    let clock = 0;
    const tick = () => `2026-11-04T00:00:0${clock++}.000Z`;
    const first = await checkList(entry(srv.url), null, { now: tick });
    const second = await checkList(entry(srv.url), first, { now: tick });
    assert.equal(second.httpStatus, 304);
    assert.equal(second.entries, first.entries);
    assert.equal(second.status, 'ok');
    assert.equal(second.consecutiveFailures, 0);
    assert.notEqual(second.checkedAt, first.checkedAt);
  } finally {
    await srv.close();
  }
});

test('a 404 is a failure', async () => {
  const srv = await serve((req, res) => {
    res.writeHead(404);
    res.end('not found');
  });
  try {
    const record = await checkList(entry(srv.url), null, { now });
    assert.equal(record.status, 'fail');
    assert.ok(record.reasons.includes('http_404'));
    assert.equal(record.consecutiveFailures, 1);
  } finally {
    await srv.close();
  }
});

test('an HTML page with status 200 is unparseable', async () => {
  const srv = await serve((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(fixture('html.txt'));
  });
  try {
    const record = await checkList(entry(srv.url), null, { now });
    assert.equal(record.status, 'fail');
    assert.ok(record.reasons.includes('unparseable'));
    assert.equal(record.entries, 0);
  } finally {
    await srv.close();
  }
});

test('an entry drop over 30 percent is a warning', async () => {
  const big = Array.from({ length: 10 }, (_, i) => `a${i}.example.com`).join('\n');
  const small = Array.from({ length: 3 }, (_, i) => `a${i}.example.com`).join('\n');
  let calls = 0;
  const srv = await serve((req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(calls++ === 0 ? big : small);
  });
  try {
    const first = await checkList(entry(srv.url), null, { now });
    const second = await checkList(entry(srv.url), first, { now });
    assert.equal(second.status, 'warn');
    assert.ok(second.reasons.includes('entries_dropped'));
  } finally {
    await srv.close();
  }
});

test('a format mismatch is a warning', async () => {
  const srv = await serve((req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(fixture('hosts.txt'));
  });
  try {
    const record = await checkList(entry(srv.url), null, { now });
    assert.equal(record.status, 'warn');
    assert.ok(record.reasons.includes('format_mismatch'));
  } finally {
    await srv.close();
  }
});

test('three consecutive failures become unreachable', async () => {
  const srv = await serve((req, res) => {
    res.writeHead(500);
    res.end('boom');
  });
  try {
    const first = await checkList(entry(srv.url), null, { now });
    const second = await checkList(entry(srv.url), first, { now });
    const third = await checkList(entry(srv.url), second, { now });
    assert.equal(first.status, 'fail');
    assert.equal(second.status, 'fail');
    assert.equal(third.status, 'unreachable');
    assert.equal(third.consecutiveFailures, 3);
  } finally {
    await srv.close();
  }
});

test('a success after a failure resets the counter', async () => {
  let calls = 0;
  const srv = await serve((req, res) => {
    if (calls++ === 0) {
      res.writeHead(500);
      res.end('boom');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(fixture('adblock.txt'));
  });
  try {
    const first = await checkList(entry(srv.url), null, { now });
    const second = await checkList(entry(srv.url), first, { now });
    assert.equal(second.status, 'ok');
    assert.equal(second.consecutiveFailures, 0);
  } finally {
    await srv.close();
  }
});

test('a network error is retried once', async () => {
  let calls = 0;
  const srv = await serve((req, res) => {
    if (calls++ === 0) {
      req.socket.destroy();
      return;
    }
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(fixture('adblock.txt'));
  });
  try {
    const record = await checkList(entry(srv.url), null, {
      now,
      retryDelayMs: 0,
    });
    assert.equal(record.status, 'ok');
    assert.equal(calls, 2);
  } finally {
    await srv.close();
  }
});

test('computeHealthStatus flags stale maintenance', () => {
  const result = computeHealthStatus(
    {
      httpStatus: 200,
      formatDetected: 'adblock',
      declaredFormat: 'adblock',
      entries: 10,
      maintenance: { stale: true },
    },
    null,
  );
  assert.equal(result.status, 'warn');
  assert.ok(result.reasons.includes('stale'));
});

test('getRepoMeta reads pushed_at and archived', async () => {
  const meta = await getRepoMeta('owner/repo', 'token', {
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        pushed_at: '2026-01-01T00:00:00Z',
        archived: true,
      }),
    }),
  });
  assert.deepEqual(meta, {
    lastCommit: '2026-01-01T00:00:00Z',
    archived: true,
  });
});
