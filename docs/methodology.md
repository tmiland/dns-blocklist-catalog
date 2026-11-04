# Methodology

This catalog answers one question: **which DNS blocklists should I put in AdGuard Home,
and what happens if I do?**

It is a recommendation layer, not a list host. Every URL points at the original
maintainer. The repo records the facts that decide whether a list belongs in a setup and
measures the ones that change over time.

## What gets included

A list enters the catalog only if all of these hold:

1. **DNS-level.** It contains domains, hosts entries, or Adblock-style DNS rules. Lists
   that only block URL paths or IP addresses are out.
2. **Publicly reachable.** No account, payment, or CAPTCHA.
3. **Clear purpose.** One sentence explains what it blocks.
4. **Declared license**, or `unknown` with a note explaining why.
5. **Maintained.** A commit or list update within the last six months, or an explicit
   `stale`/`deprecated` status.
6. **Public contact.** A repository, issue tracker, or website where false positives can
   be reported.
7. **Not a raw mirror.** Curated compilations are allowed when the compilation is the
   product. A copy of another catalog entry is not.
8. **Not an opinion list.** Lists that target people by politics, religion, ethnicity, or
   similar are rejected.

Archived lists stay in the catalog as `deprecated` so existing setups can migrate. They
are never members of a pack.

## AdGuard Home syntax

AGH supports exactly three list syntaxes:

- Adblock-style (`||example.com^`)
- `/etc/hosts` (`0.0.0.0 example.com`)
- domains-only (`example.com`)

`default_format` must be one of those three. The catalog also records `dnsmasq`,
`wildcard`, `rpz`, and `adguard` URLs for other DNS filters, but never selects them for
AGH.

## Risk

Risk is about **breakage**, not danger:

| Risk | Meaning |
|---|---|
| `low` | Unlikely to break a normal site or app. |
| `medium` | May break app features, logins, updates, or a category of sites. |
| `high` | Expect breakage and allowlisting: whole TLDs, newly registered domains, DoH bypass, social networks. |

Every entry has a concrete `breaks` note where one applies.

## Families and variants

A **family** is a set of lists that substitute for each other: the five HaGeZi Multi
tiers, the three OISD sizes, the three TIF variants. A pack may contain at most one list
from a family. Different product lines are different families, even when they cover the
same topic.

A one-off list uses its own ID as its family.

The family rule is the hard guard against stacking two tiers of the same product. It does
not claim that different products never overlap — that is measured.

## Overlap

For every pack, the build downloads its members, normalizes them to domain sets, and
computes pairwise containment:

```
containment(A, B) = |A ∩ B| / min(|A|, |B|)
```

- Above **10%** is a warning, shown in the README.
- Above **25%** is a build error unless the pack sets `allow_overlap: true` and explains
  why in `overlap_note`.
- Lists over 1M entries are sampled deterministically to 200k domains; the report marks
  the pack as sampled.

`total_entries` is the sum of member entry counts. It is not deduplicated across lists;
the overlap report tells you how much double counting there is.

## Health

The weekly workflow measures:

- HTTP status, redirect target, content type, bytes.
- Detected syntax and unique blocking domains.
- `Last-Modified` / `ETag`.
- GitHub `pushed_at` and archived flag for repository-backed lists.

States:

| State | Meaning |
|---|---|
| `ok` | 200, parseable, entries > 0. |
| `warn` | Entry count dropped >30%, syntax changed, or no update in 180 days. |
| `fail` | Non-200, timeout, parse error, or zero entries. |
| `unreachable` | Three consecutive `fail` checks. |

`health.status` is advisory. A list is never removed from a pack automatically. A human
decides whether to replace or deprecate it.

## Licenses

The catalog metadata is CC-BY-4.0. The code is MIT. Upstream lists keep their own
licenses; the catalog only links to them and records the license in each entry. No list
content is copied or re-hosted.
