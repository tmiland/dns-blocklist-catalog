import { fetchList } from './health.mjs';
import { parseList } from './lib/parse-list.mjs';

const url = process.argv[2];
if (!url) {
  console.error('usage: node scripts/check-url.mjs <url>');
  process.exit(2);
}

try {
  const fetched = await fetchList(url, { timeoutMs: 30_000 });
  const parsed = fetched.status === 200 ? parseList(fetched.text) : null;
  console.log(
    JSON.stringify(
      {
        url,
        status: fetched.status,
        finalUrl: fetched.finalUrl,
        bytes: fetched.bytes,
        contentType: fetched.contentType,
        lastModified: fetched.lastModified,
        etag: fetched.etag,
        format: parsed?.format ?? null,
        entries: parsed?.entries ?? 0,
        rules: parsed?.rules ?? 0,
        exceptions: parsed?.exceptions ?? 0,
        nonDomainRules: parsed?.nonDomainRules ?? 0,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(`check-url: ${error.message}`);
  process.exit(1);
}
