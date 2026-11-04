import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { containment, computeOverlap } from '../scripts/overlap.mjs';

function serve(routes) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const body = routes[req.url];
      if (!body) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end(body);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

const entry = (id, url) => ({
  id,
  default_format: 'adblock',
  formats: { adblock: url },
});

test('containment is 1 for identical sets', () => {
  const a = new Set(['a.example.com', 'b.example.com']);
  assert.equal(containment(a, a), 1);
});

test('containment is 0 for disjoint sets', () => {
  assert.equal(
    containment(new Set(['a.example.com']), new Set(['b.example.com'])),
    0,
  );
});

test('containment is symmetric and uses the smaller set', () => {
  const a = new Set(['a.example.com', 'b.example.com', 'c.example.com', 'd.example.com']);
  const b = new Set(['c.example.com', 'd.example.com', 'e.example.com', 'f.example.com']);
  assert.equal(containment(a, b), 0.5);
  assert.equal(containment(b, a), 0.5);
});

test('a single-list pack reports zero overlap', async () => {
  const srv = await serve({ '/a': 'a.example.com\n' });
  try {
    const report = await computeOverlap(
      { id: 'one', lists: ['a'] },
      [entry('a', `${srv.url}/a`)],
      { now: () => '2026-11-04T00:00:00.000Z' },
    );
    assert.equal(report.maxPairwise, 0);
    assert.deepEqual(report.pairs, []);
    assert.equal(report.sampled, false);
  } finally {
    await srv.close();
  }
});

test('two half-overlapping lists report 0.5', async () => {
  const srv = await serve({
    '/a': 'a.example.com\nb.example.com\nc.example.com\nd.example.com\n',
    '/b': 'c.example.com\nd.example.com\ne.example.com\nf.example.com\n',
  });
  try {
    const report = await computeOverlap(
      { id: 'two', lists: ['a', 'b'] },
      [entry('a', `${srv.url}/a`), entry('b', `${srv.url}/b`)],
      { now: () => '2026-11-04T00:00:00.000Z' },
    );
    assert.equal(report.maxPairwise, 0.5);
    assert.equal(report.pairs.length, 1);
    assert.equal(report.pairs[0].containment, 0.5);
  } finally {
    await srv.close();
  }
});

test('identical lists report 1.0', async () => {
  const body = 'a.example.com\nb.example.com\n';
  const srv = await serve({ '/a': body, '/b': body });
  try {
    const report = await computeOverlap(
      { id: 'same', lists: ['a', 'b'] },
      [entry('a', `${srv.url}/a`), entry('b', `${srv.url}/b`)],
      { now: () => '2026-11-04T00:00:00.000Z' },
    );
    assert.equal(report.maxPairwise, 1);
  } finally {
    await srv.close();
  }
});

test('an unavailable member is reported and skipped', async () => {
  const srv = await serve({ '/a': 'a.example.com\n' });
  try {
    const report = await computeOverlap(
      { id: 'missing', lists: ['a', 'missing'] },
      [entry('a', `${srv.url}/a`), entry('missing', `${srv.url}/missing`)],
      { now: () => '2026-11-04T00:00:00.000Z' },
    );
    assert.equal(report.unavailable.length, 1);
    assert.equal(report.unavailable[0].id, 'missing');
    assert.deepEqual(report.pairs, []);
    assert.equal(report.sampled, false);
  } finally {
    await srv.close();
  }
});
