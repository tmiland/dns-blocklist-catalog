import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { buildCatalog, footprintFor } from '../scripts/build.mjs';
import { validateCatalog } from '../scripts/lib/schema.mjs';

const load = (dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.yaml') && file !== 'topics.yaml')
    .sort()
    .map((file) => parseYaml(readFileSync(join(dir, file), 'utf8')));

const topics = parseYaml(readFileSync('catalog/topics.yaml', 'utf8'));
const lists = load('catalog');
const packs = load('packs');
const { catalog } = buildCatalog();

test('the real catalog and packs validate', () => {
  assert.deepEqual(validateCatalog({ lists, packs, topics }), []);
});

test('there are seven packs', () => {
  assert.equal(packs.length, 7);
  assert.deepEqual(
    packs.map((pack) => pack.id).sort(),
    ['balanced', 'family', 'privacy', 'security', 'smart-home', 'starter', 'strict'],
  );
});

test('every pack has a tagline, notes, and at least one list', () => {
  for (const pack of packs) {
    assert.ok(pack.tagline.length > 0, pack.id);
    assert.ok(pack.notes.length > 0, pack.id);
    assert.ok(pack.lists.length >= 1, pack.id);
  }
});

test('no pack stacks two lists from the same family', () => {
  const byId = new Map(lists.map((entry) => [entry.id, entry]));
  for (const pack of packs) {
    const families = pack.lists.map((id) => byId.get(id).family);
    assert.equal(new Set(families).size, families.length, pack.id);
  }
});

test('pack totals, footprints, and overlap are computed', () => {
  for (const pack of catalog.packs) {
    assert.equal(typeof pack.total_entries, 'number', pack.id);
    assert.ok(pack.total_entries > 0, pack.id);
    assert.equal(pack.footprint, footprintFor(pack.total_entries), pack.id);
    assert.ok(pack.overlap, pack.id);
    if (pack.allow_overlap) {
      assert.ok(pack.overlap_note, pack.id);
    } else {
      assert.ok(pack.overlap.maxPairwise <= 0.25, pack.id);
    }
  }
});

test('Starter is small and Strict is large and high risk', () => {
  const starter = catalog.packs.find((pack) => pack.id === 'starter');
  const strict = catalog.packs.find((pack) => pack.id === 'strict');
  assert.equal(starter.footprint, 'small');
  assert.equal(starter.risk, 'low');
  assert.equal(strict.footprint, 'large');
  assert.equal(strict.risk, 'high');
});

test('Family contains adult and gambling, Security contains no ads', () => {
  const byId = new Map(catalog.lists.map((entry) => [entry.id, entry]));
  const familyTopics = catalog.packs
    .find((pack) => pack.id === 'family')
    .lists.flatMap((id) => byId.get(id).topics);
  assert.ok(familyTopics.includes('adult'));
  assert.ok(familyTopics.includes('gambling'));

  const securityTopics = catalog.packs
    .find((pack) => pack.id === 'security')
    .lists.flatMap((id) => byId.get(id).topics);
  assert.ok(!securityTopics.includes('ads'));
});

test('the balanced pack documents its measured overlap', () => {
  const balanced = catalog.packs.find((pack) => pack.id === 'balanced');
  assert.equal(balanced.allow_overlap, true);
  assert.ok(balanced.overlap.maxPairwise <= 0.3);
  assert.match(balanced.overlap_note, /26%/);
  assert.match(balanced.notes, /overlap/i);
});

test('packs are ordered for presentation', () => {
  assert.deepEqual(
    catalog.packs.map((pack) => pack.id),
    ['starter', 'balanced', 'strict', 'security', 'family', 'privacy', 'smart-home'],
  );
});
