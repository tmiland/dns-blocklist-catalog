import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AGH_FORMATS,
  validateList,
  validatePack,
  validateCatalog,
} from '../scripts/lib/schema.mjs';

const list = (over = {}) => ({
  id: 'example-list',
  name: 'Example List',
  description: 'Blocks example domains.',
  homepage: 'https://example.com',
  source: 'example/repo',
  maintainer: 'Example',
  license: 'MIT',
  topics: ['ads'],
  region: 'global',
  languages: ['en'],
  family: 'example',
  variant: 'default',
  risk: 'low',
  breaks: [],
  notes: '',
  formats: { adblock: 'https://example.com/list.txt' },
  default_format: 'adblock',
  update_interval: 'daily',
  status: 'active',
  ...over,
});

const pack = (over = {}) => ({
  id: 'example-pack',
  name: 'Example Pack',
  tagline: 'An example.',
  description: 'An example pack.',
  risk: 'low',
  lists: ['example-list'],
  notes: 'Nothing notable.',
  ...over,
});

const topics = [
  { id: 'ads', name: 'Ads', group: 'ads-tracking', description: 'Ads.' },
];

test('a valid list passes', () => {
  assert.deepEqual(validateList(list()), []);
});

test('AGH_FORMATS is the three supported syntaxes', () => {
  assert.deepEqual(AGH_FORMATS, ['adblock', 'hosts', 'domains']);
});

test('an invalid id is rejected', () => {
  assert.match(validateList(list({ id: 'Bad_ID' })).join('\n'), /id/);
});

test('a non-AGH default format is rejected', () => {
  assert.match(
    validateList(list({ default_format: 'dnsmasq' })).join('\n'),
    /default_format/,
  );
});

test('an unknown license needs a note', () => {
  assert.match(
    validateList(list({ license: 'unknown' })).join('\n'),
    /license_note/,
  );
});

test('a default format missing from formats is rejected', () => {
  assert.match(
    validateList(list({ formats: { hosts: 'https://example.com/hosts.txt' } })).join('\n'),
    /default_format/,
  );
});

test('a valid pack passes', () => {
  assert.deepEqual(validatePack(pack(), [list()]), []);
});

test('a pack referencing a missing list is rejected', () => {
  assert.match(
    validatePack(pack({ lists: ['missing'] }), [list()]).join('\n'),
    /missing/,
  );
});

test('two lists of the same family in one pack are rejected', () => {
  const a = list({ id: 'a', family: 'same' });
  const b = list({ id: 'b', family: 'same' });
  assert.match(
    validatePack(pack({ lists: ['a', 'b'] }), [a, b]).join('\n'),
    /family/,
  );
});

test('a dead list in a pack is rejected', () => {
  assert.match(
    validatePack(pack({ lists: ['dead'] }), [list({ id: 'dead', status: 'dead' })]).join('\n'),
    /dead/,
  );
});

test('a computed footprint in pack input is rejected', () => {
  assert.match(
    validatePack(pack({ footprint: 'small' }), [list()]).join('\n'),
    /footprint/,
  );
});

test('a high-risk list in a low-risk pack is rejected', () => {
  assert.match(
    validatePack(pack(), [list({ risk: 'high' })]).join('\n'),
    /risk/,
  );
});

test('allow_overlap requires a note', () => {
  assert.match(
    validatePack(pack({ allow_overlap: true }), [list()]).join('\n'),
    /overlap_note/,
  );
});

test('duplicate list ids are rejected', () => {
  assert.match(
    validateCatalog({ lists: [list(), list()], packs: [], topics }).join('\n'),
    /duplicate/,
  );
});

test('a list topic that does not exist is rejected', () => {
  assert.match(
    validateCatalog({ lists: [list({ topics: ['nope'] })], packs: [], topics }).join('\n'),
    /topic/,
  );
});
