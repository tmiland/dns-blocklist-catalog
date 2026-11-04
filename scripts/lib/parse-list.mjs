const HOSTS_RE = /^\s*(?:0\.0\.0\.0|127\.0\.0\.1|::1|::)\s+(.+)$/;
const DNSMASQ_RE = /^address=\/([^/]+)\//;
const RPZ_RE = /^(\S+)\s+(?:CNAME|A)\s+/;
const WILDCARD_RE = /^(?:\*\.|\.)(.+)$/;
const DOMAIN_RE =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
const COSMETIC_MARKERS = ['##', '#@#', '#$#', '#%#', '#?#', '#@$#', '#@%#', '#@?#'];

export function normalizeDomain(raw) {
  let domain = String(raw ?? '').trim().toLowerCase();
  if (!domain) return null;

  domain = domain
    .replace(/^\*\./, '')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '');

  if (!domain || domain.length > 253) return null;
  if (
    domain === 'localhost' ||
    domain === 'localhost.localdomain' ||
    domain === 'broadcasthost' ||
    domain === 'local' ||
    domain.startsWith('ip6-')
  ) {
    return null;
  }
  if (!DOMAIN_RE.test(domain)) return null;
  return domain;
}

function adblockDomain(line) {
  const rest = line.slice(2);
  const end = rest.search(/[\^/$]/);
  const raw = end === -1 ? rest : rest.slice(0, end);
  const normalized = normalizeDomain(raw);
  if (normalized) return normalized;

  const tld = raw.trim().toLowerCase().replace(/^\*\./, '').replace(/^\.+/, '').replace(/\.+$/, '');
  if (/^[a-z]{2,63}$/.test(tld)) return tld;
  return null;
}

function isCosmetic(line) {
  return COSMETIC_MARKERS.some((marker) => line.includes(marker));
}

function classify(rawLine) {
  const line = rawLine.trim();
  if (!line) return { kind: 'blank', domains: [] };
  if (line.startsWith('[')) return { kind: 'header', domains: [] };
  if (line.startsWith('!')) return { kind: 'comment', domains: [] };
  if (line.startsWith('//') || line.startsWith(';')) {
    return { kind: 'comment', domains: [] };
  }
  if (line.startsWith('#')) {
    const globalCosmetic = /^(?:##|#@#|#\$#|#%#|#\?#)/.test(line);
    if (!globalCosmetic) return { kind: 'comment', domains: [] };
  }

  if (line.startsWith('@@')) {
    const domain = line.startsWith('@@||') ? adblockDomain(line.slice(2)) : null;
    return { kind: 'exception', domains: domain ? [domain] : [] };
  }
  if (line.startsWith('||')) {
    const domain = adblockDomain(line);
    return { kind: 'adblock', domains: domain ? [domain] : [] };
  }
  if (isCosmetic(line)) return { kind: 'cosmetic', domains: [] };
  if (/^\/.*\/$/.test(line)) return { kind: 'regex', domains: [] };

  const hosts = line.match(HOSTS_RE);
  if (hosts) {
    const domains = hosts[1]
      .split(/\s+/)
      .map(normalizeDomain)
      .filter(Boolean);
    return { kind: 'hosts', domains };
  }

  const dnsmasq = line.match(DNSMASQ_RE);
  if (dnsmasq) {
    const domain = normalizeDomain(dnsmasq[1]);
    return { kind: 'dnsmasq', domains: domain ? [domain] : [] };
  }

  const rpz = line.match(RPZ_RE);
  if (rpz) {
    const domain = normalizeDomain(rpz[1]);
    return { kind: 'rpz', domains: domain ? [domain] : [] };
  }

  const wildcard = line.match(WILDCARD_RE);
  if (wildcard) {
    const domain = normalizeDomain(wildcard[1]);
    return { kind: 'wildcard', domains: domain ? [domain] : [] };
  }

  const domain = normalizeDomain(line);
  if (domain) return { kind: 'domain', domains: [domain] };

  return { kind: 'unknown', domains: [] };
}

export function detectFormat(text) {
  const head = String(text ?? '').slice(0, 1024).trimStart().toLowerCase();
  if (
    head.startsWith('<!doctype html') ||
    head.startsWith('<html') ||
    head.includes('<body')
  ) {
    return 'html';
  }

  const counts = {
    adblock: 0,
    hosts: 0,
    domains: 0,
    dnsmasq: 0,
    wildcard: 0,
    rpz: 0,
  };

  for (const line of String(text ?? '').split(/\r?\n/)) {
    const { kind } = classify(line);
    if (kind === 'adblock' || kind === 'exception') counts.adblock++;
    else if (kind === 'hosts') counts.hosts++;
    else if (kind === 'domain') counts.domains++;
    else if (kind === 'dnsmasq') counts.dnsmasq++;
    else if (kind === 'wildcard') counts.wildcard++;
    else if (kind === 'rpz') counts.rpz++;
  }

  const order = ['adblock', 'hosts', 'domains', 'dnsmasq', 'wildcard', 'rpz'];
  let best = 'unknown';
  let bestCount = 0;
  for (const format of order) {
    if (counts[format] > bestCount) {
      best = format;
      bestCount = counts[format];
    }
  }
  return best;
}

export function parseList(text) {
  const format = detectFormat(text);
  const domains = new Set();
  let rules = 0;
  let exceptions = 0;
  let nonDomainRules = 0;

  if (format === 'html') {
    return { format, entries: 0, rules: 0, exceptions: 0, nonDomainRules: 0, domains };
  }

  for (const line of String(text ?? '').split(/\r?\n/)) {
    const { kind, domains: found } = classify(line);
    if (kind === 'blank' || kind === 'comment' || kind === 'header') continue;

    rules++;
    if (kind === 'exception') {
      exceptions++;
      continue;
    }
    if (kind === 'cosmetic' || kind === 'regex' || kind === 'unknown') {
      nonDomainRules++;
      continue;
    }
    if (found.length === 0) {
      nonDomainRules++;
      continue;
    }
    for (const domain of found) domains.add(domain);
  }

  return {
    format,
    entries: domains.size,
    rules,
    exceptions,
    nonDomainRules,
    domains,
  };
}
