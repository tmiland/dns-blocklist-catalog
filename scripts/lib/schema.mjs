export const FORMATS = [
  'adblock',
  'hosts',
  'domains',
  'dnsmasq',
  'wildcard',
  'rpz',
  'adguard',
];

export const AGH_FORMATS = ['adblock', 'hosts', 'domains'];
export const RISKS = ['low', 'medium', 'high'];
export const STATUSES = ['active', 'stale', 'deprecated', 'dead'];
export const UPDATE_INTERVALS = ['hourly', 'daily', 'weekly', 'irregular'];
export const TOPIC_GROUPS = [
  'ads-tracking',
  'security',
  'content',
  'infrastructure',
  'devices',
  'regional',
];

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REGION_RE = /^(global|multi|[A-Za-z]{2})$/;

const nonEmpty = (value) => typeof value === 'string' && value.trim() !== '';
const stringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
const httpsUrl = (value) =>
  typeof value === 'string' && /^https:\/\/\S+$/.test(value);

function requireString(errors, entry, field) {
  if (!nonEmpty(entry[field])) errors.push(`${field}: required string`);
}

export function validateList(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return ['entry: must be an object'];
  }

  const errors = [];
  for (const field of [
    'id',
    'name',
    'description',
    'homepage',
    'source',
    'maintainer',
    'license',
    'region',
    'family',
    'variant',
    'default_format',
    'update_interval',
    'status',
  ]) {
    requireString(errors, entry, field);
  }

  if (nonEmpty(entry.id) && !ID_RE.test(entry.id)) {
    errors.push('id: must be kebab-case');
  }
  if (nonEmpty(entry.homepage) && !httpsUrl(entry.homepage)) {
    errors.push('homepage: must be an https URL');
  }
  if (entry.license === 'unknown' && !nonEmpty(entry.license_note)) {
    errors.push('license_note: required when license is unknown');
  }

  if (!stringArray(entry.topics) || entry.topics.length === 0) {
    errors.push('topics: must be a non-empty array of topic ids');
  }
  if (nonEmpty(entry.region) && !REGION_RE.test(entry.region)) {
    errors.push('region: must be global, multi, or a two-letter code');
  }
  if (!stringArray(entry.languages)) {
    errors.push('languages: must be an array of language codes');
  }
  if (!RISKS.includes(entry.risk)) {
    errors.push(`risk: must be one of ${RISKS.join(', ')}`);
  }
  if (!stringArray(entry.breaks)) {
    errors.push('breaks: must be an array of strings');
  }
  if (typeof entry.notes !== 'string') {
    errors.push('notes: must be a string');
  }

  if (!entry.formats || typeof entry.formats !== 'object' || Array.isArray(entry.formats)) {
    errors.push('formats: must be an object of format to URL');
  } else {
    const keys = Object.keys(entry.formats);
    if (keys.length === 0) errors.push('formats: must contain at least one format');
    for (const [format, url] of Object.entries(entry.formats)) {
      if (!FORMATS.includes(format)) {
        errors.push(`formats.${format}: unknown format`);
      }
      if (!httpsUrl(url)) {
        errors.push(`formats.${format}: must be an https URL`);
      }
    }
    if (
      nonEmpty(entry.default_format) &&
      !Object.hasOwn(entry.formats, entry.default_format)
    ) {
      errors.push(`default_format: "${entry.default_format}" is not present in formats`);
    }
  }

  if (
    nonEmpty(entry.default_format) &&
    !AGH_FORMATS.includes(entry.default_format)
  ) {
    errors.push(
      `default_format: must be one of ${AGH_FORMATS.join(', ')} for AdGuard Home`,
    );
  }
  if (
    nonEmpty(entry.update_interval) &&
    !UPDATE_INTERVALS.includes(entry.update_interval)
  ) {
    errors.push(`update_interval: must be one of ${UPDATE_INTERVALS.join(', ')}`);
  }
  if (nonEmpty(entry.status) && !STATUSES.includes(entry.status)) {
    errors.push(`status: must be one of ${STATUSES.join(', ')}`);
  }

  return errors;
}

export function validatePack(pack, lists) {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) {
    return ['pack: must be an object'];
  }

  const errors = [];
  for (const field of ['id', 'name', 'tagline', 'description', 'risk', 'notes']) {
    requireString(errors, pack, field);
  }
  if (nonEmpty(pack.id) && !ID_RE.test(pack.id)) {
    errors.push('id: must be kebab-case');
  }
  if (!RISKS.includes(pack.risk)) {
    errors.push(`risk: must be one of ${RISKS.join(', ')}`);
  }
  if (
    Object.hasOwn(pack, 'order') &&
    (!Number.isInteger(pack.order) || pack.order < 1)
  ) {
    errors.push('order: must be a positive integer');
  }
  if (!stringArray(pack.lists) || pack.lists.length === 0) {
    errors.push('lists: must be a non-empty array of list ids');
  }

  for (const generated of ['footprint', 'total_entries', 'overlap']) {
    if (Object.hasOwn(pack, generated)) {
      errors.push(`${generated}: is computed by the build; do not author it`);
    }
  }

  if (Object.hasOwn(pack, 'allow_overlap')) {
    if (typeof pack.allow_overlap !== 'boolean') {
      errors.push('allow_overlap: must be a boolean');
    } else if (pack.allow_overlap && !nonEmpty(pack.overlap_note)) {
      errors.push('overlap_note: required when allow_overlap is true');
    }
  }

  if (!Array.isArray(pack.lists)) return errors;

  const byId = new Map(lists.map((entry) => [entry.id, entry]));
  const seen = new Set();
  const families = new Map();

  for (const id of pack.lists) {
    if (seen.has(id)) {
      errors.push(`lists: duplicate id "${id}"`);
      continue;
    }
    seen.add(id);

    const entry = byId.get(id);
    if (!entry) {
      errors.push(`lists: "${id}" does not exist`);
      continue;
    }
    if (entry.status === 'dead' || entry.status === 'deprecated') {
      errors.push(`lists: "${id}" is ${entry.status}`);
    }
    if (entry.risk === 'high' && pack.risk !== 'high') {
      errors.push(`lists: "${id}" is high risk but the pack is ${pack.risk}`);
    }
    if (entry.family) {
      if (families.has(entry.family)) {
        errors.push(
          `lists: more than one list from family "${entry.family}" (${families.get(entry.family)}, ${id})`,
        );
      } else {
        families.set(entry.family, id);
      }
    }
  }

  return errors;
}

export function validateCatalog({ lists, packs, topics }) {
  const errors = [];

  if (!Array.isArray(topics)) {
    errors.push('topics: must be an array');
  } else {
    const topicIds = new Set();
    for (const topic of topics) {
      if (!topic || typeof topic !== 'object') {
        errors.push('topic: must be an object');
        continue;
      }
      if (!nonEmpty(topic.id) || !ID_RE.test(topic.id)) {
        errors.push('topic id: must be kebab-case');
      }
      if (!nonEmpty(topic.name)) errors.push(`topic ${topic.id}: name is required`);
      if (!TOPIC_GROUPS.includes(topic.group)) {
        errors.push(`topic ${topic.id}: unknown group "${topic.group}"`);
      }
      if (!nonEmpty(topic.description)) {
        errors.push(`topic ${topic.id}: description is required`);
      }
      if (topicIds.has(topic.id)) {
        errors.push(`topic duplicate id: "${topic.id}"`);
      }
      topicIds.add(topic.id);
    }
  }

  const listIds = new Set();
  if (!Array.isArray(lists)) {
    errors.push('lists: must be an array');
  } else {
    for (const entry of lists) {
      const id = entry?.id ?? '?';
      const entryErrors = validateList(entry);
      for (const error of entryErrors) errors.push(`list ${id}: ${error}`);

      if (entry?.id) {
        if (listIds.has(entry.id)) {
          errors.push(`list duplicate id: "${entry.id}"`);
        }
        listIds.add(entry.id);
      }

      if (Array.isArray(entry?.topics) && Array.isArray(topics)) {
        const known = new Set(topics.map((topic) => topic.id));
        for (const topic of entry.topics) {
          if (!known.has(topic)) {
            errors.push(`list ${id}: topic "${topic}" is not defined`);
          }
        }
      }
    }
  }

  const packIds = new Set();
  if (!Array.isArray(packs)) {
    errors.push('packs: must be an array');
  } else {
    for (const pack of packs) {
      const id = pack?.id ?? '?';
      if (pack?.id) {
        if (packIds.has(pack.id)) {
          errors.push(`pack duplicate id: "${pack.id}"`);
        }
        packIds.add(pack.id);
      }
      for (const error of validatePack(pack, Array.isArray(lists) ? lists : [])) {
        errors.push(`pack ${id}: ${error}`);
      }
    }
  }

  return errors;
}
