import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildIssueBody,
  failingLists,
  issueAction,
} from '../scripts/report-health.mjs';

const health = {
  lists: {
    ok: { status: 'ok' },
    broken: { status: 'fail', reasons: ['http_500'] },
    gone: { status: 'unreachable', reasons: ['http_0'] },
  },
};

test('failingLists returns only fail and unreachable entries', () => {
  assert.deepEqual(
    failingLists(health).map(([id]) => id),
    ['broken', 'gone'],
  );
});

test('buildIssueBody lists the failing entries', () => {
  const body = buildIssueBody(health);
  assert.match(body, /`broken`/);
  assert.match(body, /`gone`/);
  assert.match(body, /http_500/);
  assert.doesNotMatch(body, /`ok`/);
});

test('buildIssueBody returns null when everything is healthy', () => {
  assert.equal(buildIssueBody({ lists: { ok: { status: 'ok' } } }), null);
});


test('issueAction closes when healthy and upserts when not', () => {
  assert.equal(issueAction({ lists: { ok: { status: 'ok' } } }), 'close');
  assert.equal(issueAction(health), 'upsert');
});
