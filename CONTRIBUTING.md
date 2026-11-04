# Contributing

Thanks for helping keep the catalog accurate. Most contributions are one YAML file.

## Add a list

1. Pick a stable, AGH-compatible URL. It must return HTTP 200 and contain Adblock,
   hosts, or domains-only rules. Run:

   ```bash
   node scripts/check-url.mjs '<url>'
   ```

   The output shows the detected format, unique domains, and rule count.

2. Create `catalog/<id>.yaml`. Use this template:

   ```yaml
   id: example-list
   name: Example List
   description: One sentence about what it blocks.
   homepage: https://example.com
   source: owner/repo            # or website:https://example.com
   maintainer: Example
   license: MIT                  # SPDX where possible; use "unknown" with license_note
   topics: [ads, trackers]
   region: global                # global | multi | ISO 3166-1 alpha-2
   languages: [en]
   family: example-list          # lists that substitute for each other share a family
   variant: default
   risk: low                     # low | medium | high
   breaks: []                    # concrete breakage notes
   notes: ""
   formats:
     adblock: https://example.com/list.txt
   default_format: adblock       # must be adblock, hosts, or domains
   update_interval: daily        # hourly | daily | weekly | irregular
   status: active                # active | stale | deprecated | dead
   ```

3. Run the checks:

   ```bash
   npm run validate
   npm test
   npm run build
   ```

4. Commit `catalog/<id>.yaml`, `data/health.json` (if you ran the health check), and the
   regenerated `data/catalog.json` and `README.md`.

## Add a pack

A pack is a short YAML file in `packs/`:

```yaml
id: example-pack
name: Example pack
tagline: One line.
description: Who this is for and what it does.
risk: low
lists: [example-list, another-list]
notes: What may break.
```

Rules:

- Every list must exist and be `active` or `stale`.
- At most one list per `family`.
- No `high` risk list in a non-`high` pack.
- A pair with more than 25% overlap fails unless you set `allow_overlap: true` and explain
  why in `overlap_note`.
- `footprint`, `total_entries`, and `overlap` are computed; do not author them.

Run `npm run overlap` to measure the pack, then `npm run validate` and `npm test`.

## Report a dead list

Open the **Dead list** issue with the catalog ID and the URL. If you want to fix it,
update the entry:

- Prefer a replacement URL from the same maintainer.
- If the project is archived, set `status: deprecated` and add a note.
- Never silently remove an entry from a pack; the build will tell you if a pack references
  a dead list.

## Health checks

The weekly workflow writes `data/health.json` and rebuilds the catalog. Do not hand-edit
that file. To check locally:

```bash
GITHUB_TOKEN=$(gh auth token) npm run health
npm run build
```

`--only <id>` checks one entry; `--dry-run` prints without writing.

## Pull request checklist

- [ ] `npm run validate` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` leaves no unexpected diff.
- [ ] New URLs return 200 and parse as adblock, hosts, or domains.
- [ ] The license is recorded, or `unknown` has a `license_note`.
- [ ] The entry has topics, family, risk, and a concrete `breaks` note where needed.
- [ ] Packs do not stack two tiers of the same family.
- [ ] No list content is copied into this repository.
