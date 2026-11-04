import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { parseList } from './lib/parse-list.mjs';

const USER_AGENT =
  'dns-blocklist-catalog/0.1 (+https://github.com/tmiland/dns-blocklist-catalog)';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_BYTES = 64 * 1024 * 1024;
const DEFAULT_RETRY_DELAY_MS = 5_000;
const STALE_DAYS = 180;
const DAY_MS = 86_400_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchList(url, opts = {}) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const headers = { 'user-agent': USER_AGENT };
  if (opts.etag) headers['if-none-match'] = opts.etag;
  if (opts.lastModified) headers['if-modified-since'] = opts.lastModified;

  const response = await fetchImpl(url, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  const common = {
    status: response.status,
    finalUrl: response.url ?? url,
    contentType: response.headers.get('content-type') ?? '',
    lastModified: response.headers.get('last-modified') ?? null,
    etag: response.headers.get('etag') ?? null,
  };

  if (response.status === 304 || !response.ok) {
    return { ...common, bytes: 0, text: '' };
  }

  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > maxBytes) {
    throw new Error(`response too large: ${declared} bytes`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    const bytes = Buffer.byteLength(text, 'utf8');
    if (bytes > maxBytes) {
      throw new Error(`response too large: ${bytes} bytes`);
    }
    return { ...common, bytes, text };
  }

  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error(`response too large: more than ${maxBytes} bytes`);
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return { ...common, bytes, text };
}

export function computeHealthStatus(record, previous) {
  const reasons = [];

  if (record.httpStatus !== 200 && record.httpStatus !== 304) {
    reasons.push(`http_${record.httpStatus}`);
  }
  if (record.formatDetected === 'html' || record.formatDetected === 'unknown') {
    reasons.push('unparseable');
  }
  if (record.entries === 0) {
    reasons.push('no_entries');
  }
  if (previous?.entries > 0 && record.entries < previous.entries * 0.7) {
    reasons.push('entries_dropped');
  }
  if (
    record.formatDetected &&
    record.declaredFormat &&
    record.formatDetected !== record.declaredFormat &&
    record.formatDetected !== 'html' &&
    record.formatDetected !== 'unknown'
  ) {
    reasons.push('format_mismatch');
  }
  if (record.maintenance?.stale) {
    reasons.push('stale');
  }

  const failed =
    record.httpStatus !== 200 && record.httpStatus !== 304
      ? true
      : reasons.includes('unparseable') || reasons.includes('no_entries');

  if (failed) {
    const failures = record.consecutiveFailures ?? 0;
    return { status: failures >= 3 ? 'unreachable' : 'fail', reasons };
  }
  return { status: reasons.length > 0 ? 'warn' : 'ok', reasons };
}

function maintenanceFor(entry, fetched, opts, previous) {
  const meta = opts.repoMeta?.[entry.source] ?? null;
  const lastPush = meta?.lastPush ?? previous?.lastPush ?? null;
  const archived = meta?.archived ?? previous?.archived ?? false;
  const stamp = lastPush ?? fetched.lastModified ?? previous?.lastModified ?? null;
  const nowMs = Date.parse(opts.now?.() ?? new Date().toISOString());
  const stale = stamp
    ? Number.isFinite(nowMs) && nowMs - Date.parse(stamp) > STALE_DAYS * DAY_MS
    : false;
  return { lastPush, archived, stale };
}

function finalize(entry, previous, base) {
  const failed =
    base.httpStatus !== 200 && base.httpStatus !== 304
      ? true
      : base.formatDetected === 'html' ||
        base.formatDetected === 'unknown' ||
        base.entries === 0;

  base.consecutiveFailures = failed
    ? (previous?.consecutiveFailures ?? 0) + 1
    : 0;

  const { status, reasons } = computeHealthStatus(base, previous);
  return { ...base, status, reasons };
}

function failureRecord(entry, previous, checkedAt, httpStatus, error) {
  const base = {
    checkedAt,
    httpStatus,
    finalUrl: '',
    bytes: 0,
    contentType: '',
    lastModified: null,
    etag: null,
    formatDetected: 'unknown',
    declaredFormat: entry.default_format,
    entries: 0,
    rules: 0,
    exceptions: 0,
    nonDomainRules: 0,
    maintenance: previous?.maintenance ?? { lastPush: null, archived: false, stale: false },
    error: error?.message ?? '',
  };
  return finalize(entry, previous, base);
}

export async function checkList(entry, previous, opts = {}) {
  const now = opts.now ?? (() => new Date().toISOString());
  const url = entry.formats?.[entry.default_format];
  if (!url) throw new Error(`list ${entry.id}: no URL for default_format`);

  const request = {
    fetchImpl: opts.fetchImpl,
    etag: previous?.etag,
    lastModified: previous?.lastModified,
    timeoutMs: opts.timeoutMs,
    maxBytes: opts.maxBytes,
  };

  let fetched;
  try {
    fetched = await fetchList(url, request);
  } catch (error) {
    if (opts.retryDelayMs !== 0) {
      await sleep(opts.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);
    }
    try {
      fetched = await fetchList(url, request);
    } catch (retryError) {
      return failureRecord(entry, previous, now(), 0, retryError);
    }
  }

  if (fetched.status === 304 && previous) {
    const base = {
      ...previous,
      checkedAt: now(),
      httpStatus: 304,
      consecutiveFailures: 0,
      maintenance: maintenanceFor(
        entry,
        { lastModified: fetched.lastModified ?? previous.lastModified },
        opts,
        previous.maintenance,
      ),
    };
    const { status, reasons } = computeHealthStatus(base, previous);
    return { ...base, status, reasons };
  }

  if (fetched.status !== 200) {
    return failureRecord(entry, previous, now(), fetched.status, null);
  }

  const parsed = parseList(fetched.text);
  const html =
    fetched.contentType.toLowerCase().includes('text/html') ||
    parsed.format === 'html';
  const base = {
    checkedAt: now(),
    httpStatus: fetched.status,
    finalUrl: fetched.finalUrl,
    bytes: fetched.bytes,
    contentType: fetched.contentType,
    lastModified: fetched.lastModified,
    etag: fetched.etag,
    formatDetected: html ? 'html' : parsed.format,
    declaredFormat: entry.default_format,
    entries: html ? 0 : parsed.entries,
    rules: html ? 0 : parsed.rules,
    exceptions: html ? 0 : parsed.exceptions,
    nonDomainRules: html ? 0 : parsed.nonDomainRules,
    maintenance: maintenanceFor(entry, fetched, opts, previous?.maintenance),
  };
  return finalize(entry, previous, base);
}

export async function getRepoMeta(slug, token, opts = {}) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const request = () =>
    fetchImpl(`https://api.github.com/repos/${slug}`, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': USER_AGENT,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000),
    });

  let response;
  try {
    response = await request();
  } catch {
    await sleep(opts.retryDelayMs ?? 1_000);
    response = await request();
  }
  if (!response.ok) return { lastPush: null, archived: false };
  const data = await response.json();
  return {
    lastPush: data.pushed_at ?? null,
    archived: Boolean(data.archived),
  };
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

function loadCatalog(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml') && file !== 'topics.yaml')
    .sort()
    .map((file) => parseYaml(readFileSync(join(dir, file), 'utf8')));
}

function loadHealth(path) {
  if (!existsSync(path)) return { schema: 1, checked_at: null, lists: {} };
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function main() {
  const args = process.argv.slice(2);
  const only = [];
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--only') only.push(args[++i]);
    else if (args[i] === '--dry-run') dryRun = true;
  }

  const entries = loadCatalog('catalog');
  const selected = only.length
    ? entries.filter((entry) => only.includes(entry.id))
    : entries;
  if (selected.length === 0) {
    console.error('health: no matching catalog entries');
    process.exit(1);
  }

  const healthPath = 'data/health.json';
  const previous = loadHealth(healthPath);
  const token = process.env.GITHUB_TOKEN || '';
  const repoMeta = {};

  const slugs = [...new Set(selected.map((entry) => entry.source).filter(Boolean))];
  await mapLimit(slugs, 4, async (slug) => {
    if (!/^[\w.-]+\/[\w.-]+$/.test(slug)) return;
    try {
      repoMeta[slug] = await getRepoMeta(slug, token);
    } catch {
      repoMeta[slug] = null;
    }
  });

  const results = await mapLimit(selected, 4, async (entry) => {
    const record = await checkList(entry, previous.lists?.[entry.id] ?? null, {
      repoMeta,
    });
    return [entry.id, record];
  });

  const lists = { ...previous.lists };
  for (const [id, record] of results) lists[id] = record;

  const checkedAt = results
    .map(([, record]) => record.checkedAt)
    .sort()
    .at(-1);

  const summary = { ok: 0, warn: 0, fail: 0, unreachable: 0 };
  for (const [, record] of results) summary[record.status]++;

  console.log(
    `health: ${selected.length} checked — ok ${summary.ok}, warn ${summary.warn}, fail ${summary.fail}, unreachable ${summary.unreachable}`,
  );
  for (const [id, record] of results) {
    if (record.status !== 'ok') {
      console.log(`  ${record.status.padEnd(11)} ${id} (${record.reasons.join(', ')})`);
    }
  }

  if (dryRun) return;
  mkdirSync('data', { recursive: true });
  writeFileSync(
    healthPath,
    `${JSON.stringify({ schema: 1, checked_at: checkedAt, lists }, null, 2)}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
