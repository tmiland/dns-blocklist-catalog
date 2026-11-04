import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { validateCatalog } from './lib/schema.mjs';

const SOURCE = 'https://github.com/tmiland/dns-blocklist-catalog';
const GROUP_ORDER = [
  'ads-tracking',
  'security',
  'content',
  'infrastructure',
  'devices',
  'regional',
];
const GROUP_NAMES = {
  'ads-tracking': 'Ads & tracking',
  security: 'Security',
  content: 'Content',
  infrastructure: 'Infrastructure',
  devices: 'Devices',
  regional: 'Regional',
};

export function footprintFor(entries) {
  if (entries < 300_000) return 'small';
  if (entries < 1_000_000) return 'medium';
  return 'large';
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function contentHash(inputs) {
  return `sha256:${createHash('sha256').update(canonicalize(inputs)).digest('hex')}`;
}

function loadYamlDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml') && file !== 'topics.yaml')
    .sort()
    .map((file) => parseYaml(readFileSync(join(dir, file), 'utf8')));
}

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

const fmt = (value) =>
  Number.isFinite(value) ? value.toLocaleString('en-US') : 'unknown';

const statusSuffix = (list) =>
  list.status && list.status !== 'active' ? ` — ${list.status}` : '';

const healthLabel = (list) => list.health?.status ?? 'unknown';

function renderPacks(catalog) {
  const byId = new Map(catalog.lists.map((entry) => [entry.id, entry]));
  return catalog.packs
    .map((pack) => {
      const rows = pack.lists
        .map((id) => {
          const list = byId.get(id);
          const entries = list.health?.entries;
          return `| [${list.name}](${list.homepage})${statusSuffix(list)} | ${list.description} | ${fmt(entries)} | ${list.default_format} | ${list.risk} | ${healthLabel(list)} |`;
        })
        .join('\n');

      const overlap = pack.overlap
        ? ` · **Max overlap:** ${(pack.overlap.maxPairwise * 100).toFixed(1)}%${pack.overlap.sampled ? ' (sampled)' : ''}${pack.overlap.unavailable?.length ? ` · **Unavailable:** ${pack.overlap.unavailable.map((item) => item.id).join(', ')}` : ''}`
        : '';
      const urls = pack.lists
        .map((id) => byId.get(id)?.url)
        .filter(Boolean)
        .join('\n');
      return `### ${pack.name}

${pack.tagline}

**Risk:** ${pack.risk} · **Footprint:** ${pack.footprint} · **Entries:** ${fmt(pack.total_entries)}${overlap}

${pack.description}

| List | What it blocks | Entries | Format | Risk | Health |
|---|---|---:|---|---|---|
${rows}

**Import URLs**

~~~
${urls}
~~~

${pack.notes}
`;
    })
    .join('\n');
}

function renderTopics(catalog) {
  const byGroup = new Map(GROUP_ORDER.map((group) => [group, []]));
  const topicGroup = new Map(catalog.topics.map((topic) => [topic.id, topic.group]));
  const topicName = new Map(catalog.topics.map((topic) => [topic.id, topic.name]));

  for (const list of catalog.lists) {
    const groups = new Set(
      list.topics.map((id) => topicGroup.get(id)).filter(Boolean),
    );
    for (const group of groups) {
      if (byGroup.has(group)) byGroup.get(group).push(list);
    }
  }

  return GROUP_ORDER.map((group) => {
    const lists = byGroup.get(group);
    if (!lists.length) return '';
    const rows = lists
      .map(
        (list) =>
          `| [${list.name}](${list.homepage})${statusSuffix(list)} | ${list.topics.map((id) => topicName.get(id) ?? id).join(', ')} | ${fmt(list.health?.entries)} | ${list.default_format} | ${list.risk} | ${list.license} | ${healthLabel(list)} |`,
      )
      .join('\n');
    return `### ${GROUP_NAMES[group]}

| List | Topics | Entries | Format | Risk | License | Health |
|---|---|---:|---|---|---|---|
${rows}
`;
  })
    .filter(Boolean)
    .join('\n');
}

function renderHealth(catalog) {
  const counts = { ok: 0, warn: 0, fail: 0, unreachable: 0, unknown: 0 };
  for (const list of catalog.lists) {
    const status = list.health?.status ?? 'unknown';
    counts[status] = (counts[status] ?? 0) + 1;
  }
  const checked = catalog.health_checked_at ?? 'never';
  return `Last checked: **${checked}** — ${counts.ok} ok, ${counts.warn} warn, ${counts.fail} fail, ${counts.unreachable} unreachable, ${counts.unknown} unknown.`;
}

export function renderReadme(catalog, templatePath = 'templates/README.md') {
  const template = readFileSync(templatePath, 'utf8');
  const counts = {};
  for (const list of catalog.lists) {
    counts[list.status] = (counts[list.status] ?? 0) + 1;
  }
  const statusCounts = ['active', 'stale', 'deprecated', 'dead']
    .filter((status) => counts[status])
    .map((status) => `${counts[status]} ${status}`)
    .join(', ');

  return template
    .replaceAll('{{COUNT}}', String(catalog.lists.length))
    .replaceAll('{{STATUS_COUNTS}}', statusCounts)
    .replaceAll('{{PACK_COUNT}}', String(catalog.packs.length))
    .replaceAll('{{PACKS}}', renderPacks(catalog))
    .replaceAll('{{TOPICS}}', renderTopics(catalog))
    .replaceAll('{{HEALTH}}', renderHealth(catalog))
    .replaceAll(
      '{{HASH}}',
      catalog.content_hash.replace(/^sha256:/, '').slice(0, 12),
    );
}

export function buildCatalog(opts = {}) {
  const catalogDir = opts.catalogDir ?? 'catalog';
  const packsDir = opts.packsDir ?? 'packs';
  const topicsPath = opts.topicsPath ?? join(catalogDir, 'topics.yaml');
  const healthPath = opts.healthPath ?? 'data/health.json';
  const overlapPath = opts.overlapPath ?? 'data/overlap.json';

  const topics = parseYaml(readFileSync(topicsPath, 'utf8'));
  const lists = loadYamlDir(catalogDir);
  const packs = loadYamlDir(packsDir);
  const health = loadJson(healthPath, {
    schema: 1,
    checked_at: null,
    lists: {},
  });
  const overlap = loadJson(overlapPath, {
    schema: 1,
    checked_at: null,
    packs: {},
  });

  const errors = validateCatalog({ lists, packs, topics });
  const healthLists = health.lists ?? {};
  const overlapPacks = overlap.packs ?? {};

  for (const entry of lists) {
    if (
      (entry.status === 'active' || entry.status === 'stale') &&
      !healthLists[entry.id]
    ) {
      errors.push(
        `list ${entry.id}: missing health record; run npm run health --only ${entry.id}`,
      );
    }
  }

  for (const pack of packs) {
    const report = overlapPacks[pack.id];
    if (!report) {
      errors.push(`pack ${pack.id}: overlap report is missing; run npm run overlap`);
      continue;
    }
    const expected = [];
    for (let i = 0; i < pack.lists.length; i++) {
      for (let j = i + 1; j < pack.lists.length; j++) {
        expected.push([pack.lists[i], pack.lists[j]].sort().join('|'));
      }
    }
    const actual = (report.pairs ?? []).map((pair) =>
      [pair.a, pair.b].sort().join('|'),
    );
    if (expected.sort().join(',') !== actual.sort().join(',')) {
      errors.push(
        `pack ${pack.id}: overlap report is stale; run npm run overlap`,
      );
    }
    if (report.maxPairwise > 0.25 && !pack.allow_overlap) {
      errors.push(
        `pack ${pack.id}: max overlap ${(report.maxPairwise * 100).toFixed(1)}% exceeds 25% without allow_overlap`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`catalog validation failed:\n${errors.join('\n')}`);
  }

  const enrichedLists = lists
    .map((entry) => ({
      ...entry,
      url: entry.formats[entry.default_format],
      health: healthLists[entry.id] ?? null,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const byId = new Map(enrichedLists.map((entry) => [entry.id, entry]));
  const enrichedPacks = packs
    .map((pack) => {
      const totalEntries = pack.lists.reduce(
        (sum, id) => sum + (byId.get(id)?.health?.entries ?? 0),
        0,
      );
      return {
        ...pack,
        total_entries: totalEntries,
        footprint: footprintFor(totalEntries),
        overlap: overlapPacks[pack.id] ?? null,
      };
    })
    .sort(
      (a, b) =>
        (a.order ?? 999) - (b.order ?? 999) || a.id.localeCompare(b.id),
    );

  const hash = contentHash({ lists, packs, topics, health, overlap });
  const catalog = {
    schema: 1,
    content_hash: hash,
    health_checked_at: health.checked_at ?? null,
    source: SOURCE,
    topics,
    lists: enrichedLists,
    packs: enrichedPacks,
  };

  const readme = renderReadme(catalog, opts.templatePath);
  return { catalog, readme };
}

function main() {
  const { catalog, readme } = buildCatalog();
  mkdirSync('data', { recursive: true });
  writeFileSync('data/catalog.json', `${JSON.stringify(catalog, null, 2)}\n`);
  writeFileSync('README.md', readme);
  console.log(
    `build: ${catalog.lists.length} lists, ${catalog.packs.length} packs, ${catalog.content_hash.slice(0, 19)}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
