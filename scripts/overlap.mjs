import { createHash } from 'node:crypto';
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

export function containment(a, b) {
  if (!a.size || !b.size) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let shared = 0;
  for (const domain of small) {
    if (large.has(domain)) shared++;
  }
  return shared / small.size;
}

const hash = (value) => createHash('sha256').update(value).digest('hex');

export function sampleDomains(domains, limit = 200_000) {
  if (domains.size <= limit) return new Set(domains);
  return new Set(
    [...domains]
      .sort((a, b) => hash(a).localeCompare(hash(b)))
      .slice(0, limit),
  );
}

export async function computeOverlap(pack, entries, opts = {}) {
  const now = opts.now ?? (() => new Date().toISOString());
  const sampleLimit = opts.sampleLimit ?? 200_000;
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const sets = new Map();
  let sampled = false;

  for (const id of pack.lists) {
    const entry = byId.get(id);
    if (!entry) throw new Error(`pack ${pack.id}: list ${id} not found`);
    const url = entry.formats?.[entry.default_format];
    if (!url) throw new Error(`list ${id}: no URL for default_format`);

    const fetched = await fetchList(url, {
      fetchImpl: opts.fetchImpl,
      timeoutMs: opts.timeoutMs,
    });
    if (fetched.status !== 200) {
      throw new Error(`list ${id}: HTTP ${fetched.status}`);
    }

    const parsed = parseList(fetched.text);
    if (parsed.entries === 0) throw new Error(`list ${id}: no entries`);
    const set = sampleDomains(parsed.domains, sampleLimit);
    if (set.size !== parsed.domains.size) sampled = true;
    sets.set(id, set);
  }

  const pairs = [];
  for (let i = 0; i < pack.lists.length; i++) {
    for (let j = i + 1; j < pack.lists.length; j++) {
      const a = pack.lists[i];
      const b = pack.lists[j];
      pairs.push({ a, b, containment: containment(sets.get(a), sets.get(b)) });
    }
  }

  return {
    checkedAt: now(),
    maxPairwise: pairs.reduce((max, pair) => Math.max(max, pair.containment), 0),
    sampled,
    pairs,
  };
}

function loadYamlDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml'))
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
  const packs = loadYamlDir('packs').filter(
    (pack) => only.length === 0 || only.includes(pack.id),
  );
  if (packs.length === 0) {
    console.error('overlap: no matching packs');
    process.exit(1);
  }

  const reports = {};
  let failed = false;
  for (const pack of packs) {
    const report = await computeOverlap(pack, entries);
    reports[pack.id] = report;

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
      `overlap: ${pack.id}: max ${(report.maxPairwise * 100).toFixed(1)}%${report.sampled ? ' (sampled)' : ''}`,
    );
  }

  if (!dryRun) {
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

  if (failed) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
