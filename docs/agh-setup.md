# AdGuard Home setup

This walkthrough uses the AGH web UI. The API examples are for scripts and for the
browser assistant; you do not need them for a manual setup.

## Add one list

1. Open AdGuard Home and log in.
2. Go to **Filters** → **DNS blocklists**.
3. Click **Add blocklist** → **Add custom list**.
4. Give it a name you will recognize, paste the URL from a catalog entry, and save.
5. Repeat for each list in the pack you chose.

AGH downloads the list and rebuilds its filtering engine. A large list can take a few
seconds; the UI shows the rule count when it finishes.

## Add a pack

A pack is an ordered set of catalog entries, not a single file. Add each member URL in
the order shown in the README. The catalog's `packs` section lists the members and their
entry counts.

Start with **Starter** on a router with limited RAM. Move to **Balanced** when the box has
headroom. **Strict** is for a server-class machine; it is roughly 2.1M rules.

## Allowlist something that broke

Add a user rule under **Filters** → **Custom filtering rules**:

```
@@||example.com^
```

For a client-specific exception:

```
@@||example.com^$client='192.168.1.50'
```

Then clear the DNS cache if the old answer is still cached. The browser assistant does
this automatically; in the UI, use **Filters** → **Clear cache** or restart AGH.

## API examples

AGH's API accepts HTTP Basic auth or a logged-in session cookie. The examples below use
Basic auth; replace the host and credentials.

Add a list:

```bash
curl -u admin:password \
  -X POST 'http://192.168.1.1/control/filtering/add_url' \
  -H 'Content-Type: application/json' \
  -d '{"name":"HaGeZi Multi PRO","url":"https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.txt","whitelist":false}'
```

Reload the filters:

```bash
curl -u admin:password \
  -X POST 'http://192.168.1.1/control/filtering/refresh' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

List the current subscriptions:

```bash
curl -u admin:password 'http://192.168.1.1/control/filtering/status'
```

The browser assistant uses the same endpoints through the logged-in AGH session, so it
does not need the password.

## Memory and footprint

The catalog's `footprint` is qualitative:

- `small`: under ~300k entries.
- `medium`: under ~1M entries.
- `large`: 1M entries or more.

Entry counts are measured from each list's `default_format`. A pack's `total_entries` is
the sum of its members and is not deduplicated; the pack's overlap report shows how much
the members share.

## Troubleshooting

- **A list shows `fail` or `unreachable`:** the upstream URL may be down. Check the
  catalog's health column and the upstream project before removing it.
- **A site breaks after adding a list:** add an allowlist rule, then report the false
  positive to the list maintainer. The catalog entry links to the maintainer.
- **The rule count is lower than expected:** AGH may have deduplicated rules or the list
  changed. Compare with the entry count in the catalog; the health check records it
  weekly.
