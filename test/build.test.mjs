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
