# DNS Blocklist Catalog

A curated, health-checked catalog of DNS blocklists for AdGuard Home, Pi-hole, and other
DNS filters. **{{COUNT}} lists** ({{STATUS_COUNTS}}), **{{PACK_COUNT}} packs**, no
re-hosted content.

## Quick start (AdGuard Home)

1. Open AdGuard Home → **Filters** → **DNS blocklists**.
2. Click **Add blocklist** → **Add custom list**.
3. Paste one URL from a pack below, give it a name, and save.
4. Repeat for each list in the pack.

The AdGuard Home Browser Assistant will do this in one click in a later release.

## Packs

{{PACKS}}

`total_entries` is the sum of the member counts, not deduplicated. The overlap
figure shows how much the members share.

## Browse by topic

{{TOPICS}}

## Health

{{HEALTH}}

Health is measured weekly. `ok` means the URL returned a parseable list; `warn` means the
entry count dropped, the syntax changed, or the list has not updated in 180 days; `fail`
means it could not be fetched or parsed; `unreachable` means three consecutive failures. A
warning never removes a list from a pack automatically.

## What this is not

This repo does not host, mirror, or merge list content. Every URL points at the original
maintainer. Licenses are recorded per list and remain with the upstream project.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The methodology is in
[docs/methodology.md](docs/methodology.md).

Generated from `catalog/` and `packs/` — content hash `{{HASH}}`.
