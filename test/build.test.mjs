import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildCatalog, contentHash, footprintFor } from '../scripts/build.mjs';

const fixture = (name) =>
  new URL(`./fixtures/build/${name}`, import.meta.url).pathname;

const opts = () => ({
  catalogDir: fixture('catalog'),
  packsDir: fixture('packs'),
  topicsPath: fixture('catalog/topics.yaml'),
  healthPath: fixture('health.json'),
  overlapPath: fixture('overlap.json'),
  templatePath: new URL('../templates/README.md', import.meta.url).pathname,
});

test('builds two lists and one pack with computed totals', () => {
  const { catalog, readme } = buildCatalog(opts());
  assert.equal(catalog.schema, 1);
  assert.equal(catalog.lists.length, 2);
  assert.equal(catalog.packs.length, 1);
  assert.equal(catalog.packs[0].total_entries, 350000);
  assert.equal(catalog.packs[0].footprint, 'medium');
  assert.equal(catalog.packs[0].overlap.maxPairwise, 0.02);
  assert.equal(
    catalog.lists.find((entry) => entry.id === 'list-b').health.status,
    'fail',
  );
  assert.ok(readme.includes('Pack A'));
  assert.ok(readme.includes('2 active'));
  assert.ok(readme.includes('Ads'));
  assert.ok(readme.includes('Malware'));
  assert.ok(!readme.includes('{{'));
});

test('two builds are byte-identical', () => {
  const first = JSON.stringify(buildCatalog(opts()).catalog);
  const second = JSON.stringify(buildCatalog(opts()).catalog);
  assert.equal(first, second);
});

test('contentHash is stable and changes with input', () => {
  assert.match(contentHash({ a: 1 }), /^sha256:[a-f0-9]{64}$/);
  assert.equal(contentHash({ a: 1 }), contentHash({ a: 1 }));
  assert.notEqual(contentHash({ a: 1 }), contentHash({ a: 2 }));
});

test('footprint thresholds are small, medium, large', () => {
  assert.equal(footprintFor(299999), 'small');
  assert.equal(footprintFor(300000), 'medium');
  assert.equal(footprintFor(999999), 'medium');
  assert.equal(footprintFor(1000000), 'large');
});

test('a dead list in a pack fails the build', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-build-'));
  cpSync(fixture('.'), dir, { recursive: true });
  writeFileSync(
    join(dir, 'catalog/list-dead.yaml'),
    readFileSync(fixture('catalog/list-a.yaml'), 'utf8')
      .replaceAll('list-a', 'list-dead')
      .replace('status: active', 'status: dead'),
  );
  writeFileSync(
    join(dir, 'packs/pack-a.yaml'),
    readFileSync(fixture('packs/pack-a.yaml'), 'utf8').replace(
      'lists: [list-a, list-b]',
      'lists: [list-dead]',
    ),
  );
  assert.throws(
    () =>
      buildCatalog({
        ...opts(),
        catalogDir: join(dir, 'catalog'),
        packsDir: join(dir, 'packs'),
        topicsPath: join(dir, 'catalog/topics.yaml'),
        healthPath: join(dir, 'health.json'),
        overlapPath: join(dir, 'overlap.json'),
      }),
    /dead/,
  );
});

test('a missing overlap report fails the build', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-overlap-'));
  writeFileSync(
    join(dir, 'overlap.json'),
    JSON.stringify({ schema: 1, checked_at: null, packs: {} }),
  );
  assert.throws(
    () => buildCatalog({ ...opts(), overlapPath: join(dir, 'overlap.json') }),
    /overlap report is missing/,
  );
});

test('a stale overlap report fails the build', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-stale-'));
  cpSync(fixture('.'), dir, { recursive: true });
  writeFileSync(
    join(dir, 'catalog/list-c.yaml'),
    readFileSync(fixture('catalog/list-a.yaml'), 'utf8')
      .replaceAll('list-a', 'list-c')
      .replace('family: family-a', 'family: family-c'),
  );
  writeFileSync(
    join(dir, 'packs/pack-a.yaml'),
    readFileSync(fixture('packs/pack-a.yaml'), 'utf8').replace(
      'lists: [list-a, list-b]',
      'lists: [list-a, list-b, list-c]',
    ),
  );
  assert.throws(
    () =>
      buildCatalog({
        ...opts(),
        catalogDir: join(dir, 'catalog'),
        packsDir: join(dir, 'packs'),
        topicsPath: join(dir, 'catalog/topics.yaml'),
        healthPath: join(dir, 'health.json'),
        overlapPath: join(dir, 'overlap.json'),
      }),
    /overlap report is stale/,
  );
});

test('a pack over 25 percent without allow_overlap fails the build', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-threshold-'));
  writeFileSync(
    join(dir, 'overlap.json'),
    JSON.stringify({
      schema: 1,
      checked_at: null,
      packs: {
        'pack-a': {
          checkedAt: null,
          maxPairwise: 0.3,
          sampled: false,
          unavailable: [],
          pairs: [{ a: 'list-a', b: 'list-b', containment: 0.3 }],
        },
      },
    }),
  );
  assert.throws(
    () => buildCatalog({ ...opts(), overlapPath: join(dir, 'overlap.json') }),
    /25%/,
  );
});

test('the README prints every pack member URL', () => {
  const { catalog, readme } = buildCatalog(opts());
  for (const pack of catalog.packs) {
    for (const id of pack.lists) {
      const list = catalog.lists.find((entry) => entry.id === id);
      assert.ok(readme.includes(list.url), `${pack.id}: ${id}`);
    }
  }
});

test('an active list without a health record fails the build', () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-health-'));
  writeFileSync(
    join(dir, 'health.json'),
    JSON.stringify({
      schema: 1,
      checked_at: null,
      lists: {
        'list-a': { status: 'ok', entries: 1 },
      },
    }),
  );
  assert.throws(
    () => buildCatalog({ ...opts(), healthPath: join(dir, 'health.json') }),
    /missing health record/,
  );
});

test('catalog JSON uses the schema-1 measured field names', () => {
  const { catalog } = buildCatalog(opts());
  const list = catalog.lists.find((entry) => entry.id === 'list-a');
  assert.deepEqual(Object.keys(list.health).sort(), [
    'checkedAt',
    'entries',
    'httpStatus',
    'reasons',
    'status',
  ]);
  const pack = catalog.packs[0];
  assert.deepEqual(Object.keys(pack.overlap).sort(), [
    'checkedAt',
    'maxPairwise',
    'pairs',
    'sampled',
    'unavailable',
  ]);
});
