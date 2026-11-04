# Assistant integration

The browser panel is a separate session. This is the contract it can rely on.

## Catalog URL

```
https://raw.githubusercontent.com/tmiland/dns-blocklist-catalog/main/data/catalog.json
```

## Schema 1

```json
{
  "schema": 1,
  "content_hash": "sha256:…",
  "health_checked_at": "2026-11-04T12:00:00Z",
  "source": "https://github.com/tmiland/dns-blocklist-catalog",
  "topics": [{ "id": "ads", "name": "Ads", "group": "ads-tracking", "description": "…" }],
  "lists": [
    {
      "id": "hagezi-pro",
      "name": "HaGeZi's Multi PRO",
      "description": "…",
      "homepage": "https://github.com/hagezi/dns-blocklists#pro",
      "maintainer": "HaGeZi",
      "license": "GPL-3.0",
      "topics": ["ads", "trackers"],
      "region": "global",
      "family": "hagezi-multi",
      "variant": "pro",
      "risk": "low",
      "breaks": [],
      "notes": "…",
      "formats": { "adblock": "https://…", "dnsmasq": "https://…" },
      "default_format": "adblock",
      "url": "https://…",
      "status": "active",
      "health": {
        "status": "ok",
        "reasons": [],
        "checkedAt": "2026-11-04T12:00:00Z",
        "entries": 247757,
        "rules": 247757,
        "httpStatus": 200,
        "maintenance": { "lastCommit": "2026-11-03T18:00:00Z", "stale": false }
      }
    }
  ],
  "packs": [
    {
      "id": "balanced",
      "name": "Balanced",
      "order": 2,
      "tagline": "…",
      "description": "…",
      "risk": "low",
      "footprint": "medium",
      "lists": ["hagezi-pro", "hagezi-tif-medium"],
      "total_entries": 566335,
      "overlap": { "maxPairwise": 0.2, "sampled": true, "pairs": [] },
      "notes": "…"
    }
  ]
}
```

- `lists[].url` is already the `formats[default_format]` URL. Use it for `add_url`.
- `packs[].lists` are IDs that resolve in `lists`.
- `packs` are ordered by `order` for display.
- `content_hash` changes when the catalog or health data changes. Use it to skip a
  refresh; do not cache by wall-clock time.
- `schema` is bumped only for breaking changes. Additive fields are allowed.

## Import flow

1. Fetch the catalog. If `content_hash` matches the cached copy, reuse it.
2. Show packs first, individual lists under **Advanced**.
3. Fetch `GET /control/filtering/status` and collect the existing `filters[].url` values.
4. For each selected list whose `url` is not already present:
   `POST /control/filtering/add_url` with `{ "name": list.name, "url": list.url, "whitelist": false }`.
5. After all adds, call `POST /control/filtering/refresh` once with `{}`.
6. Show per-list progress and the AGH error text if a URL is rejected.

AGH rebuilds its filtering engine asynchronously. A large list can take several seconds;
poll `/control/filtering/status` or `check_host` before declaring success.

## Health handling

`health.status` is advisory:

- `ok`: import normally.
- `warn`: show a warning next to the list, but allow import.
- `fail` / `unreachable`: show a stronger warning. Do not skip the list silently; the
  user may still want to import it and fix it later.

`health` may be `null` for a list that has not been checked yet.

## Errors

- **Session expired:** AGH returns a login page or 401. Ask the user to open AGH and log
  in, then retry.
- **`add_url` 400:** show the list name and URL, and the response body. Do not retry the
  same request.
- **`refresh` rate-limited:** wait and retry once; AGH rate-limits refreshes by design.
- **Duplicate URL:** skip it and report "already subscribed".
- **Offline / raw GitHub unavailable:** keep the last cached catalog and tell the user it
  may be stale.

## Minimal example

```js
const CATALOG =
  'https://raw.githubusercontent.com/tmiland/dns-blocklist-catalog/main/data/catalog.json';

async function loadCatalog() {
  const response = await fetch(CATALOG, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`catalog: HTTP ${response.status}`);
  const catalog = await response.json();
  if (catalog.schema !== 1) throw new Error(`catalog: unsupported schema ${catalog.schema}`);
  return catalog;
}

async function addPack(pack, catalog, aghApi) {
  const byId = new Map(catalog.lists.map((list) => [list.id, list]));
  const status = await aghApi('/control/filtering/status');
  const existing = new Set((status.filters ?? []).map((filter) => filter.url));

  for (const id of pack.lists) {
    const list = byId.get(id);
    if (!list) continue;
    if (existing.has(list.url)) continue;
    await aghApi('/control/filtering/add_url', {
      method: 'POST',
      body: { name: list.name, url: list.url, whitelist: false },
    });
  }

  await aghApi('/control/filtering/refresh', { method: 'POST', body: {} });
}
```

The assistant's `aghApi` already handles the session and the same-origin bridge; pass the
paths and bodies through it.
