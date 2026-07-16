#!/usr/bin/env python3
"""
Check that every link in static/llms.txt resolves.

The root llms.txt is a hand-curated index (see PR #114), so its links can go
stale when pages move — unlike the auto-generated llms-full.txt and per-page
markdown, which are rebuilt from source on every deploy. This script extracts
every URL from static/llms.txt and checks it against the live site.

Note: links are checked against production, so a page that is added or moved
in the same PR will be reported as broken until the change is deployed.

Usage:
  python3 scripts/check_llms_txt.py
"""

import re
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# Domains scripts/audit_links.py also skips: the bot-protected marketing site
# rejects automated requests and would false-alarm. docs.bitrise.io and
# support.bitrise.io stay checked.
SKIP_DOMAINS = {'bitrise.io', 'app.bitrise.io', 'www.bitrise.io', 'api.bitrise.io'}

LLMS_TXT = Path(__file__).parent.parent / 'static' / 'llms.txt'
LINK_RE = re.compile(r'\[[^\]]*\]\((https?://[^)\s]+)\)')


def check_url(url: str):
    try:
        req = urllib.request.Request(
            url, method='HEAD',
            headers={'User-Agent': 'Mozilla/5.0 (check_llms_txt)'},
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            return url, r.status
    except urllib.error.HTTPError as e:
        if e.code in (403, 405):  # some CDNs reject HEAD; retry with GET
            try:
                req2 = urllib.request.Request(
                    url, method='GET',
                    headers={'User-Agent': 'Mozilla/5.0 (check_llms_txt)'},
                )
                with urllib.request.urlopen(req2, timeout=15) as r:
                    return url, r.status
            except urllib.error.HTTPError as e2:
                return url, e2.code
            except Exception as e2:
                return url, str(e2)
        return url, e.code
    except Exception as e:
        return url, str(e)


def main() -> None:
    if not LLMS_TXT.exists():
        print(f'✗ {LLMS_TXT} not found.')
        sys.exit(1)

    url_lines: dict[str, list[int]] = {}
    for lineno, line in enumerate(LLMS_TXT.read_text('utf-8').splitlines(), 1):
        for m in LINK_RE.finditer(line):
            url = m.group(1)
            dom = re.match(r'https?://([^/]+)', url)
            if dom and dom.group(1) in SKIP_DOMAINS:
                continue
            url_lines.setdefault(url, []).append(lineno)

    print(f'Checking {len(url_lines)} links from static/llms.txt …\n', flush=True)

    broken = []
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(check_url, url): url for url in url_lines}
        done = 0
        for future in as_completed(futures):
            url, status = future.result()
            done += 1
            print(f'  [{done}/{len(url_lines)}] {status}  {url}', flush=True)
            if isinstance(status, int) and 200 <= status < 400:
                continue
            for lineno in url_lines[url]:
                broken.append((lineno, url, str(status)))

    print()
    if not broken:
        print('✓ All llms.txt links resolve.')
        return

    print(f'✗ {len(broken)} broken link(s) in static/llms.txt:\n')
    for lineno, url, reason in sorted(broken):
        print(f'  static/llms.txt:{lineno}  {reason}  {url}')

    sys.exit(1)


if __name__ == '__main__':
    main()
