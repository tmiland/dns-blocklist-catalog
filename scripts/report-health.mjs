import { readFileSync } from 'node:fs';

export function failingLists(health) {
  return Object.entries(health.lists ?? {})
    .filter(([, record]) => record.status === 'fail' || record.status === 'unreachable')
    .sort(([a], [b]) => a.localeCompare(b));
}

export function buildIssueBody(health, source = 'https://github.com/tmiland/dns-blocklist-catalog') {
  const lists = failingLists(health);
  if (lists.length === 0) return null;

  return [
    'The weekly health check found lists that could not be fetched or parsed.',
    '',
    '| List | Status | Reasons |',
    '|---|---|---|',
    ...lists.map(
      ([id, record]) =>
        `| \`${id}\` | ${record.status} | ${(record.reasons ?? []).join(', ')} |`,
    ),
    '',
    `Catalog: ${source}`,
  ].join('\n');
}

async function main() {
  const health = JSON.parse(readFileSync('data/health.json', 'utf8'));
  const lists = failingLists(health);
  if (lists.length === 0) {
    console.log('report-health: no failing lists');
    return;
  }

  const repo = process.env.GITHUB_REPOSITORY || 'tmiland/dns-blocklist-catalog';
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('report-health: GITHUB_TOKEN is required');
    process.exit(1);
  }

  const api = `https://api.github.com/repos/${repo}/issues`;
  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'user-agent': 'dns-blocklist-catalog',
  };
  const body = buildIssueBody(health);
  const title = `Health check: ${lists.length} list${lists.length === 1 ? '' : 's'} need attention`;

  const open = await fetch(`${api}?labels=health&state=open`, { headers });
  const issues = open.ok ? await open.json() : [];

  if (issues.length > 0) {
    const issue = issues[0];
    const response = await fetch(`${api}/${issue.number}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title, body }),
    });
    if (!response.ok) throw new Error(`PATCH failed: ${response.status}`);
    console.log(`report-health: updated #${issue.number}`);
    return;
  }

  const response = await fetch(api, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, body, labels: ['health'] }),
  });
  if (!response.ok) throw new Error(`POST failed: ${response.status}`);
  const created = await response.json();
  console.log(`report-health: opened #${created.number}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
