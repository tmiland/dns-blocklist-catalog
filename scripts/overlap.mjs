import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { fetchList } from './health.mjs';
import { parseList } from './lib/parse-list.mjs';
import { validateCatalog } from './lib/schema.mjs';

export function containment(a, b) {
  if (!a.size || !b.size) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let shared = 0;
  for (const domain of small) {
    if (large.has(domain)) shared++;
  }
  return shared / small.size;
}

export async function computeOverlap(pack, entries, opts = {}) {
  const now = opts.now ?? (() => new Date().toISOString());
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const sets = new Map();
  const unavailable = [];

  for (const id of pack.lists) {
    const entry = byId.get(id);
    if (!entry) {
      unavailable.push({ id, error: 'list not found' });
      continue;
    }
    const url = entry.formats?.[entry.default_format];
    if (!url) {
      unavailable.push({ id, error: 'no URL for default_format' });
      continue;
    }

    try {
      const fetched = await fetchList(url, {
        fetchImpl: opts.fetchImpl,
        timeoutMs: opts.timeoutMs,
      });
      if (fetched.status !== 200) {
        unavailable.push({ id, error: `HTTP ${fetched.status}` });
        continue;
      }
      const parsed = parseList(fetched.text);
      if (parsed.entries === 0) {
        unavailable.push({ id, error: 'no entries' });
        continue;
      }
      sets.set(id, parsed.domains);
    } catch (error) {
      unavailable.push({ id, error: error.message });
    }
  }

  const pairs = [];
  for (let i = 0; i < pack.lists.length; i++) {
    for (let j = i + 1; j < pack.lists.length; j++) {
      const a = pack.lists[i];
      const b = pack.lists[j];
      if (!sets.has(a) || !sets.has(b)) continue;
      pairs.push({ a, b, containment: containment(sets.get(a), sets.get(b)) });
    }
  }

  return {
    checkedAt: now(),
    maxPairwise: pairs.reduce((max, pair) => Math.max(max, pair.containment), 0),
    sampled: false,
    unavailable,
    pairs,
  };
}

function loadYamlDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml') && file !== 'topics.yaml')
    .sort()
    .map((file) => parseYaml(readFileSync(join(dir, file), 'utf8')));
}

async function main() {
  const args = process.argv.slice(2);
  const only = [];
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pack') only.push(args[++i]);
    else if (args[i] === '--dry-run') dryRun = true;
  }

  const entries = loadYamlDir('catalog');
  const topics = existsSync('catalog/topics.yaml')
    ? parseYaml(readFileSync('catalog/topics.yaml', 'utf8'))
    : [];
  const packs = loadYamlDir('packs');
  const selected = only.length
    ? packs.filter((pack) => only.includes(pack.id))
    : packs;

  if (selected.length === 0) {
    console.error('overlap: no matching packs');
    process.exit(1);
  }
  if (only.length > 0 && selected.length !== only.length) {
    console.error(
      `overlap: unknown pack id(s): ${only.filter((id) => !selected.some((pack) => pack.id === id)).join(', ')}`,
    );
    process.exit(1);
  }

  const errors = validateCatalog({ lists: entries, packs: selected, topics });
  if (errors.length > 0) {
    for (const error of errors) console.error(`overlap: ${error}`);
    process.exit(1);
  }

  const reports = {};
  let failed = false;
  for (const pack of selected) {
    const report = await computeOverlap(pack, entries);
    reports[pack.id] = report;

    for (const item of report.unavailable) {
      console.warn(`overlap: ${pack.id}: ${item.id} unavailable (${item.error})`);
    }
    for (const pair of report.pairs) {
      if (pair.containment > 0.25 && !pack.allow_overlap) {
        console.error(
          `overlap: ${pack.id}: ${pair.a} and ${pair.b} share ${(pair.containment * 100).toFixed(1)}%`,
        );
        failed = true;
      } else if (pair.containment > 0.1) {
        console.warn(
          `overlap: ${pack.id}: ${pair.a} and ${pair.b} share ${(pair.containment * 100).toFixed(1)}%`,
        );
      }
    }
    console.log(
      `overlap: ${pack.id}: max ${(report.maxPairwise * 100).toFixed(1)}%${report.unavailable.length ? `, ${report.unavailable.length} unavailable` : ''}`,
    );
  }

  if (failed) {
    console.error('overlap: threshold failure; data/overlap.json was not written');
    process.exit(1);
  }
  if (dryRun) return;

  mkdirSync('data', { recursive: true });
  writeFileSync(
    'data/overlap.json',
    `${JSON.stringify(
      {
        schema: 1,
        checked_at: Object.values(reports)
          .map((report) => report.checkedAt)
          .sort()
          .at(-1),
        packs: reports,
      },
      null,
      2,
    )}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
