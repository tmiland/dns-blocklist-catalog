# DNS Blocklist Catalog

A curated, health-checked catalog of DNS blocklists for AdGuard Home, Pi-hole, and other
DNS filters. **92 lists** (81 active, 1 stale, 10 deprecated), **7 packs**, no
re-hosted content.

## Quick start (AdGuard Home)

1. Open AdGuard Home → **Filters** → **DNS blocklists**.
2. Click **Add blocklist** → **Add custom list**.
3. Paste one URL from a pack below, give it a name, and save.
4. Repeat for each list in the pack.

The AdGuard Home Browser Assistant will do this in one click in a later release.

## Packs

### Starter

First install on a small router.

**Risk:** low · **Footprint:** small · **Entries:** 271,968 · **Max overlap:** 8.8%

A light ads, tracker, and telemetry base plus the Mini threat feed. The smallest useful setup for a router with limited RAM.


| List | What it blocks | Entries | Format | Risk | Health |
|---|---|---:|---|---|---|
| [HaGeZi's Multi LIGHT](https://github.com/hagezi/dns-blocklists#light) | Relaxed ads, tracker, and telemetry blocking with minimal breakage. | 80,509 | adblock | low | ok |
| [HaGeZi's Threat Intelligence Feeds — Mini](https://github.com/hagezi/dns-blocklists#tifmini) | The smallest threat feed variant, for very constrained devices. | 191,459 | adblock | low | ok |

**Import URLs**

~~~
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/light.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/tif.mini.txt
~~~

Good for a first install or a low-power router. It will not block every ad or tracker; move to Balanced when the box has headroom.


### Balanced

Everyday protection with low breakage.

**Risk:** low · **Footprint:** medium · **Entries:** 566,335 · **Max overlap:** 26.3%

Ads, trackers, telemetry, malware, and scams. A good default for a home network that does not want to babysit allowlists.


| List | What it blocks | Entries | Format | Risk | Health |
|---|---|---:|---|---|---|
| [HaGeZi's Multi PRO](https://github.com/hagezi/dns-blocklists#pro) | Extended ads, tracker, telemetry, malware, and scam blocking. | 247,757 | adblock | low | ok |
| [HaGeZi's Threat Intelligence Feeds — Medium](https://github.com/hagezi/dns-blocklists#tifmedium) | A size-optimized threat feed for routers and small boxes. | 318,578 | adblock | low | ok |

**Import URLs**

~~~
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/tif.medium.txt
~~~

TIF Medium trades some threat coverage for memory. On a router with limited free RAM, use Starter instead. About a quarter of TIF Medium overlaps the base list; the rest adds live threat domains.


### Strict

Maximum blocking on a server-class box.

**Risk:** high · **Footprint:** large · **Entries:** 2,101,253 · **Max overlap:** 25.8%

The most aggressive Multi tier plus the full threat feed. For people who prefer to allowlist the occasional broken site.


| List | What it blocks | Entries | Format | Risk | Health |
|---|---|---:|---|---|---|
| [HaGeZi's Multi ULTIMATE](https://github.com/hagezi/dns-blocklists#ultimate) | The most aggressive Multi tier: ads, trackers, telemetry, malware, and scams. | 286,890 | adblock | high | ok |
| [HaGeZi's Threat Intelligence Feeds](https://github.com/hagezi/dns-blocklists#tif) | Live malware, phishing, and scam domains from threat-intelligence feeds. | 1,814,363 | adblock | low | ok |

**Import URLs**

~~~
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/ultimate.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/tif.txt
~~~

About 2.1M rules; AGH needs a box with plenty of RAM. Expect to allowlist apps, share links, and some analytics. Not for a small router.


### Security

Threats only, without touching ads.

**Risk:** low · **Footprint:** medium · **Entries:** 553,445 · **Max overlap:** 4.5%

Malware, phishing, and scam domains from the Medium threat feed and a live phishing list. No ad or tracker blocking.


| List | What it blocks | Entries | Format | Risk | Health |
|---|---|---:|---|---|---|
| [HaGeZi's Threat Intelligence Feeds — Medium](https://github.com/hagezi/dns-blocklists#tifmedium) | A size-optimized threat feed for routers and small boxes. | 318,578 | adblock | low | ok |
| [PhishDestroy](https://github.com/phishdestroy/destroylist) | A live phishing and scam domain feed. | 234,867 | domains | low | ok |

**Import URLs**

~~~
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/tif.medium.txt
https://raw.githubusercontent.com/phishdestroy/destroylist/main/list.txt
~~~

Use this when ads are acceptable but malicious domains are not. Pair it with any ad-blocking list you already run.


### Family

Ads, adult content, and gambling.

**Risk:** medium · **Footprint:** medium · **Entries:** 475,893 · **Max overlap:** 8.8%

A light base with adult, gambling, and threat blocking. Intended for a household network where those categories should not resolve.


| List | What it blocks | Entries | Format | Risk | Health |
|---|---|---:|---|---|---|
| [HaGeZi's Multi LIGHT](https://github.com/hagezi/dns-blocklists#light) | Relaxed ads, tracker, and telemetry blocking with minimal breakage. | 80,509 | adblock | low | ok |
| [HaGeZi's NSFW Blocklist](https://github.com/hagezi/dns-blocklists#nsfw) | Adult content domains. | 92,021 | adblock | medium | ok |
| [HaGeZi's Gambling Blocklist — Mini](https://github.com/hagezi/dns-blocklists#gamblingmini) | The smallest gambling and betting list. | 111,904 | adblock | medium | ok |
| [HaGeZi's Threat Intelligence Feeds — Mini](https://github.com/hagezi/dns-blocklists#tifmini) | The smallest threat feed variant, for very constrained devices. | 191,459 | adblock | low | ok |

**Import URLs**

~~~
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/light.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/nsfw.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/gambling.mini.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/tif.mini.txt
~~~

Adult and gambling blocking can catch health and education sites. Review the allowlist if something legitimate stops resolving.


### Privacy

Native device trackers on phones and PCs.

**Risk:** medium · **Footprint:** small · **Entries:** 574 · **Max overlap:** 1.3%

Android, Apple, and Windows/Office native tracker lists. This is an add-on pack: pair it with Starter or Balanced if you also want ads and trackers blocked.


| List | What it blocks | Entries | Format | Risk | Health |
|---|---|---:|---|---|---|
| [Perflyst Android Tracking](https://github.com/Perflyst/PiHoleBlocklist) | Android tracking and telemetry domains. | 80 | domains | medium | ok |
| [HaGeZi's Apple Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Apple built-in trackers and telemetry. | 110 | adblock | medium | ok |
| [HaGeZi's Windows/Office Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Windows/Office built-in trackers and telemetry. | 384 | adblock | medium | ok |

**Import URLs**

~~~
https://raw.githubusercontent.com/Perflyst/PiHoleBlocklist/master/android-tracking.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.apple.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.winoffice.txt
~~~

Device-specific lists can break app features and updates. Start with one device list and add the others only if you need them.


### Smart home

TVs, consoles, and IoT.

**Risk:** medium · **Footprint:** small · **Entries:** 1,005 · **Max overlap:** 3.5%

Smart TV and vendor tracker lists for Samsung, LG, Roku, and Amazon. This is an add-on pack: pair it with Starter or Balanced if you also want ads.


| List | What it blocks | Entries | Format | Risk | Health |
|---|---|---:|---|---|---|
| [Perflyst SmartTV (AGH)](https://github.com/Perflyst/PiHoleBlocklist) | Smart TV ads and telemetry, in AdGuard Home syntax. | 147 | adblock | medium | ok |
| [HaGeZi's Samsung Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Samsung built-in trackers and telemetry. | 201 | adblock | medium | ok |
| [HaGeZi's LG webOS Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | LG webOS built-in trackers and telemetry. | 231 | adblock | medium | ok |
| [HaGeZi's Roku Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Roku built-in trackers and telemetry. | 57 | adblock | medium | ok |
| [HaGeZi's Amazon Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Amazon built-in trackers and telemetry. | 369 | adblock | medium | ok |

**Import URLs**

~~~
https://raw.githubusercontent.com/Perflyst/PiHoleBlocklist/master/SmartTV-AGH.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.samsung.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.lgwebos.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.roku.txt
https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.amazon.txt
~~~

TV apps and firmware updates may stop working. Keep the vendor list you actually own; remove the others to reduce rule count.



`total_entries` is the sum of the member counts, not deduplicated. The overlap
figure shows how much the members share.

## Browse by topic

### Ads & tracking

| List | Topics | Entries | Format | Risk | License | Health |
|---|---|---:|---|---|---|---|
| [1Hosts Lite](https://github.com/badmojr/1Hosts) | Ads, Trackers, Telemetry | 202,868 | domains | low | MPL-2.0 | ok |
| [1Hosts Xtra](https://github.com/badmojr/1Hosts) | Ads, Trackers, Telemetry, Malware | 1,116,328 | domains | medium | MPL-2.0 | ok |
| [ABPindo](https://github.com/ABPindo/indonesianadblockrules) | Regional, Ads, Trackers | 1,751 | adblock | medium | GPL-3.0-or-later OR CC-BY-SA-3.0 | ok |
| [AdAway hosts](https://adaway.org) | Ads, Trackers | 6,540 | hosts | low | GPL-3.0 | ok |
| [AdGuard DNS filter](https://github.com/AdguardTeam/AdGuardSDNSFilter) | Ads, Trackers, Telemetry, Malware, Phishing | 187,727 | adblock | low | GPL-3.0 | ok |
| [anti-AD](https://github.com/privacy-protection-tools/anti-AD) | Ads, Trackers, Telemetry | 101,113 | adblock | medium | MIT | ok |
| [The Block List Project — Ads](https://github.com/blocklistproject/Lists) — deprecated | Ads | 235,867 | hosts | low | Unlicense | ok |
| [The Block List Project — Tracking](https://github.com/blocklistproject/Lists) — deprecated | Trackers | 143,866 | hosts | low | Unlicense | ok |
| [Dan Pollock's Hosts](https://someonewhocares.org/hosts/) | Ads, Trackers | 12,974 | hosts | low | unknown | ok |
| [FadeMind's 2o7 Network Trackers](https://github.com/FadeMind/hosts.extras) — deprecated | Trackers | 2,030 | hosts | low | MIT | warn |
| [FadeMind's Unchecky Ads](https://github.com/FadeMind/hosts.extras) — deprecated | Ads | 9 | hosts | low | MIT | warn |
| [HaGeZi's Multi LIGHT](https://github.com/hagezi/dns-blocklists#light) | Ads, Trackers, Telemetry | 80,509 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Multi NORMAL](https://github.com/hagezi/dns-blocklists#normal) | Ads, Trackers, Telemetry, Malware, Scams & fraud | 179,493 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Pop-Up Ads](https://github.com/hagezi/dns-blocklists#popupads) | Ads, Scams & fraud | 77,680 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Multi PRO](https://github.com/hagezi/dns-blocklists#pro) | Ads, Trackers, Telemetry, Malware, Scams & fraud | 247,757 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Multi PRO++](https://github.com/hagezi/dns-blocklists#proplus) | Ads, Trackers, Telemetry, Malware, Scams & fraud | 261,413 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Multi ULTIMATE](https://github.com/hagezi/dns-blocklists#ultimate) | Ads, Trackers, Telemetry, Malware, Scams & fraud | 286,890 | adblock | high | GPL-3.0 | ok |
| [hBlock](https://github.com/hectorm/hblock) | Ads, Trackers, Malware, Phishing | 481,982 | hosts | medium | MIT | ok |
| [hostsVN](https://github.com/bigdargon/hostsVN) | Ads, Trackers | 18,537 | hosts | medium | MIT | ok |
| [KADhosts](https://github.com/PolishFiltersTeam/KADhosts) | Ads, Trackers, Spam | 44,525 | hosts | medium | CC-BY-SA-4.0 | ok |
| [lightswitch05 hosts](https://github.com/lightswitch05/hosts) — deprecated | Ads, Trackers | 428,454 | hosts | low | Apache-2.0 | warn |
| [notracking](https://github.com/notracking/hosts-blocklists) — deprecated | Ads, Trackers, Malware | 250,110 | hosts | medium | unknown | warn |
| [OISD Blocklist Big](https://oisd.nl) | Ads, Trackers, Malware, Phishing | 232,325 | adblock | medium | unknown | ok |
| [OISD Blocklist Small](https://oisd.nl) | Ads, Trackers, Malware, Phishing | 60,126 | adblock | low | unknown | ok |
| [Perflyst Android Tracking](https://github.com/Perflyst/PiHoleBlocklist) | Mobile, Telemetry | 80 | domains | medium | MIT | ok |
| [Perflyst Session Replay](https://github.com/Perflyst/PiHoleBlocklist) | Telemetry, Trackers | 24 | domains | low | MIT | ok |
| [Perflyst SmartTV (AGH)](https://github.com/Perflyst/PiHoleBlocklist) | Smart TV, Telemetry | 147 | adblock | medium | MIT | ok |
| [Peter Lowe's Ad and Tracking Server List](https://pgl.yoyo.org/adservers/) | Ads | 3,563 | hosts | low | unknown | ok |
| [ShadowWhisperer's Ads](https://github.com/ShadowWhisperer/BlockLists) | Ads | 28,663 | domains | low | Unlicense | ok |
| [ShadowWhisperer's Tracking](https://github.com/ShadowWhisperer/BlockLists) | Trackers | 121,056 | domains | low | Unlicense | ok |
| [Steven Black's Unified Hosts](https://github.com/StevenBlack/hosts) | Ads, Trackers, Malware, Scams & fraud | 77,760 | hosts | low | MIT | ok |
| [WindowsSpyBlocker — Extra](https://github.com/crazy-max/WindowsSpyBlocker) | Telemetry, Ads | 399 | hosts | medium | MIT | ok |
| [WindowsSpyBlocker — Spy](https://github.com/crazy-max/WindowsSpyBlocker) | Telemetry, Trackers | 347 | hosts | medium | MIT | ok |
| [WindowsSpyBlocker — Update](https://github.com/crazy-max/WindowsSpyBlocker) | Telemetry | 538 | hosts | medium | MIT | ok |
| [yhosts](https://github.com/VeleSila/yhosts) — deprecated | Regional, Ads, Trackers | 6,419 | hosts | medium | unknown | warn |

### Security

| List | Topics | Entries | Format | Risk | License | Health |
|---|---|---:|---|---|---|---|
| [1Hosts Xtra](https://github.com/badmojr/1Hosts) | Ads, Trackers, Telemetry, Malware | 1,116,328 | domains | medium | MPL-2.0 | ok |
| [AdGuard DNS filter](https://github.com/AdguardTeam/AdGuardSDNSFilter) | Ads, Trackers, Telemetry, Malware, Phishing | 187,727 | adblock | low | GPL-3.0 | ok |
| [The Block List Project — Phishing](https://github.com/blocklistproject/Lists) — deprecated | Phishing, Scams & fraud | 190,191 | hosts | low | Unlicense | ok |
| [FadeMind's Risk List](https://github.com/FadeMind/hosts.extras) — deprecated | Malware, Scams & fraud | 2,189 | hosts | low | MIT | warn |
| [FadeMind's Spam List](https://github.com/FadeMind/hosts.extras) — deprecated | Spam | 57 | hosts | low | MIT | warn |
| [HaGeZi's Fake Blocklist](https://github.com/hagezi/dns-blocklists#fake) | Scams & fraud | 17,529 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Badware Hoster Blocklist](https://github.com/hagezi/dns-blocklists#hoster) | Badware hosters, Malware | 1,074 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Multi NORMAL](https://github.com/hagezi/dns-blocklists#normal) | Ads, Trackers, Telemetry, Malware, Scams & fraud | 179,493 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Newly Registered Domains](https://github.com/hagezi/dns-blocklists#nrd) | Newly registered domains, Malware, Phishing | 2,342,440 | adblock | high | GPL-3.0 | ok |
| [HaGeZi's Pop-Up Ads](https://github.com/hagezi/dns-blocklists#popupads) | Ads, Scams & fraud | 77,680 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Multi PRO](https://github.com/hagezi/dns-blocklists#pro) | Ads, Trackers, Telemetry, Malware, Scams & fraud | 247,757 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Multi PRO++](https://github.com/hagezi/dns-blocklists#proplus) | Ads, Trackers, Telemetry, Malware, Scams & fraud | 261,413 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Threat Intelligence Feeds](https://github.com/hagezi/dns-blocklists#tif) | Malware, Phishing, Scams & fraud | 1,814,363 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Threat Intelligence Feeds — Medium](https://github.com/hagezi/dns-blocklists#tifmedium) | Malware, Phishing, Scams & fraud | 318,578 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Threat Intelligence Feeds — Mini](https://github.com/hagezi/dns-blocklists#tifmini) | Malware, Phishing, Scams & fraud | 191,459 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Multi ULTIMATE](https://github.com/hagezi/dns-blocklists#ultimate) | Ads, Trackers, Telemetry, Malware, Scams & fraud | 286,890 | adblock | high | GPL-3.0 | ok |
| [hBlock](https://github.com/hectorm/hblock) | Ads, Trackers, Malware, Phishing | 481,982 | hosts | medium | MIT | ok |
| [KADhosts](https://github.com/PolishFiltersTeam/KADhosts) | Ads, Trackers, Spam | 44,525 | hosts | medium | CC-BY-SA-4.0 | ok |
| [NoCoin](https://github.com/hoshsadiq/adblock-nocoin-list) | Crypto mining | 312 | hosts | low | MIT | ok |
| [notracking](https://github.com/notracking/hosts-blocklists) — deprecated | Ads, Trackers, Malware | 250,110 | hosts | medium | unknown | warn |
| [OISD Blocklist Big](https://oisd.nl) | Ads, Trackers, Malware, Phishing | 232,325 | adblock | medium | unknown | ok |
| [OISD Blocklist Small](https://oisd.nl) | Ads, Trackers, Malware, Phishing | 60,126 | adblock | low | unknown | ok |
| [PhishDestroy](https://github.com/phishdestroy/destroylist) | Phishing, Scams & fraud, Malware | 234,867 | domains | low | MIT | ok |
| [Phishing Army](https://phishing.army) | Phishing | 151,456 | domains | low | unknown | ok |
| [RPiList Crypto](https://github.com/RPiList/specials) | Crypto mining | 98,659 | adblock | low | CC-BY-NC-4.0 | ok |
| [RPiList Malware](https://github.com/RPiList/specials) | Malware | 668,933 | adblock | low | CC-BY-NC-4.0 | ok |
| [RPiList Phishing](https://github.com/RPiList/specials) | Phishing, Scams & fraud | 151,060 | adblock | low | CC-BY-NC-4.0 | ok |
| [ShadowWhisperer's Cryptocurrency](https://github.com/ShadowWhisperer/BlockLists) | Crypto mining | 1,281 | domains | low | Unlicense | ok |
| [ShadowWhisperer's Malware](https://github.com/ShadowWhisperer/BlockLists) | Malware | 46,735 | domains | low | Unlicense | ok |
| [ShadowWhisperer's Scam](https://github.com/ShadowWhisperer/BlockLists) | Scams & fraud | 7,454 | domains | low | Unlicense | ok |
| [Spam404](https://github.com/Spam404/lists) — stale | Spam, Scams & fraud | 8,140 | domains | low | unknown | warn |
| [Steven Black's Unified Hosts](https://github.com/StevenBlack/hosts) | Ads, Trackers, Malware, Scams & fraud | 77,760 | hosts | low | MIT | ok |
| [Steven Black's Fake News](https://github.com/StevenBlack/hosts) | Scams & fraud | 80,329 | hosts | low | MIT | ok |
| [Steven Black's Fake News + Gambling + Porn](https://github.com/StevenBlack/hosts) | Scams & fraud, Gambling, Adult | 163,116 | hosts | medium | MIT | ok |

### Content

| List | Topics | Entries | Format | Risk | License | Health |
|---|---|---:|---|---|---|---|
| [HaGeZi's Anti-Piracy Blocklist](https://github.com/hagezi/dns-blocklists#piracy) | Piracy | 58,659 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Gambling Blocklist](https://github.com/hagezi/dns-blocklists#gambling) | Gambling | 626,316 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Gambling Blocklist — Medium](https://github.com/hagezi/dns-blocklists#gamblingmedium) | Gambling | 178,549 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Gambling Blocklist — Mini](https://github.com/hagezi/dns-blocklists#gamblingmini) | Gambling | 111,904 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's TikTok Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Social | 550 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's TikTok Tracker Blocklist — Aggressive](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Social | 764 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's NSFW Blocklist](https://github.com/hagezi/dns-blocklists#nsfw) | Adult | 92,021 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Social Networks Blocklist](https://github.com/hagezi/dns-blocklists#social) | Social | 8,166 | adblock | high | GPL-3.0 | ok |
| [OISD NSFW Blocklist](https://oisd.nl) | Adult | 486,736 | adblock | medium | unknown | ok |
| [RPiList Streaming](https://github.com/RPiList/specials) | Piracy | 23,868 | adblock | medium | CC-BY-NC-4.0 | ok |
| [ShadowWhisperer's Dating](https://github.com/ShadowWhisperer/BlockLists) | Dating | 1,382 | domains | low | Unlicense | ok |
| [Steven Black's Fake News + Gambling + Porn](https://github.com/StevenBlack/hosts) | Scams & fraud, Gambling, Adult | 163,116 | hosts | medium | MIT | ok |
| [Steven Black's Gambling](https://github.com/StevenBlack/hosts) | Gambling | 84,853 | hosts | medium | MIT | ok |
| [Steven Black's Porn](https://github.com/StevenBlack/hosts) | Adult | 154,219 | hosts | medium | MIT | ok |
| [Steven Black's Social](https://github.com/StevenBlack/hosts) | Social | 81,918 | hosts | high | MIT | ok |

### Infrastructure

| List | Topics | Entries | Format | Risk | License | Health |
|---|---|---:|---|---|---|---|
| [HaGeZi's DoH Bypass Blocklist](https://github.com/hagezi/dns-blocklists#bypass_dns) | DoH/VPN bypass | 3,596 | adblock | high | GPL-3.0 | ok |
| [HaGeZi's DoH/VPN/Tor Bypass Blocklist](https://github.com/hagezi/dns-blocklists#bypass_all) | DoH/VPN bypass | 16,579 | adblock | high | GPL-3.0 | ok |
| [HaGeZi's Dynamic DNS Blocklist](https://github.com/hagezi/dns-blocklists#dyndns) | Dynamic DNS | 1,533 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Badware Hoster Blocklist](https://github.com/hagezi/dns-blocklists#hoster) | Badware hosters, Malware | 1,074 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's SafeSearch Blocklist](https://github.com/hagezi/dns-blocklists#safesearch) | SafeSearch | 201 | adblock | low | GPL-3.0 | ok |
| [HaGeZi's Newly Registered Domains](https://github.com/hagezi/dns-blocklists#nrd) | Newly registered domains, Malware, Phishing | 2,342,440 | adblock | high | GPL-3.0 | ok |
| [HaGeZi's Most Abused TLDs — Aggressive](https://github.com/hagezi/dns-blocklists#tlds) | Abused TLDs | 294 | adblock | high | GPL-3.0 | ok |
| [HaGeZi's URL Shortener Blocklist](https://github.com/hagezi/dns-blocklists#urlshortener) | URL shorteners | 9,846 | adblock | medium | GPL-3.0 | ok |
| [ShadowWhisperer's Dynamic DNS](https://github.com/ShadowWhisperer/BlockLists) | Dynamic DNS | 1,463 | domains | medium | Unlicense | ok |
| [ShadowWhisperer's Tunnels](https://github.com/ShadowWhisperer/BlockLists) | DoH/VPN bypass | 1,026 | domains | high | Unlicense | ok |
| [ShadowWhisperer's URL Shortener](https://github.com/ShadowWhisperer/BlockLists) | URL shorteners | 5,969 | domains | medium | Unlicense | ok |

### Devices

| List | Topics | Entries | Format | Risk | License | Health |
|---|---|---:|---|---|---|---|
| [HaGeZi's Amazon Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Smart TV | 369 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Apple Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Mobile | 110 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Huawei Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Mobile | 135 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's LG webOS Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Smart TV | 231 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's OPPO/Realme Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Mobile | 490 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Roku Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Smart TV | 57 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Samsung Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Smart TV | 201 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's TikTok Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Social | 550 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's TikTok Tracker Blocklist — Aggressive](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Social | 764 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Vivo Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Mobile | 247 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Windows/Office Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry | 384 | adblock | medium | GPL-3.0 | ok |
| [HaGeZi's Xiaomi Tracker Blocklist](https://github.com/hagezi/dns-blocklists#native) | Device telemetry, Mobile | 350 | adblock | medium | GPL-3.0 | ok |
| [Perflyst Amazon Fire TV](https://github.com/Perflyst/PiHoleBlocklist) | Smart TV, IoT | 16 | domains | medium | MIT | ok |
| [Perflyst Android Tracking](https://github.com/Perflyst/PiHoleBlocklist) | Mobile, Telemetry | 80 | domains | medium | MIT | ok |
| [Perflyst SmartTV (AGH)](https://github.com/Perflyst/PiHoleBlocklist) | Smart TV, Telemetry | 147 | adblock | medium | MIT | ok |
| [RPiList LG TV](https://github.com/RPiList/specials) | Smart TV | 109 | adblock | medium | CC-BY-NC-4.0 | ok |
| [RPiList Windows 10 Telemetry](https://github.com/RPiList/specials) | Device telemetry | 45 | domains | medium | CC-BY-NC-4.0 | ok |

### Regional

| List | Topics | Entries | Format | Risk | License | Health |
|---|---|---:|---|---|---|---|
| [ABPindo](https://github.com/ABPindo/indonesianadblockrules) | Regional, Ads, Trackers | 1,751 | adblock | medium | GPL-3.0-or-later OR CC-BY-SA-3.0 | ok |
| [yhosts](https://github.com/VeleSila/yhosts) — deprecated | Regional, Ads, Trackers | 6,419 | hosts | medium | unknown | warn |


## Health

Last checked: **2026-11-04T13:26:06.258Z** — 84 ok, 8 warn, 0 fail, 0 unreachable, 0 unknown.

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

Generated from `catalog/` and `packs/` — content hash `315a12ccdc03`.
