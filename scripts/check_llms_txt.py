#!/usr/bin/env python3
"""
Check that every link in static/llms.txt resolves.

The root llms.txt is a hand-curated index (see PR #114), so its links can go
stale when pages move — unlike the auto-generated llms-full.txt and per-page
markdown, which are rebuilt from source on every deploy. This script extracts
every URL from static/llms.txt and checks it against the live site.

Note: links are checked against production, so a page that is added or moved
in the same PR won't be live yet. To avoid a false failure, a link whose page
is newly added in this PR (per `git diff` against the PR base branch) is
reported separately as "pending deploy" instead of counting as broken.

Usage:
  python3 scripts/check_llms_txt.py
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

# Domains scripts/audit_links.py also skips: the bot-protected marketing site
# rejects automated requests and would false-alarm. docs.bitrise.io and
# support.bitrise.io stay checked.
SKIP_DOMAINS = {'bitrise.io', 'app.bitrise.io', 'www.bitrise.io', 'api.bitrise.io'}

ROOT = Path(__file__).parent.parent
LLMS_TXT = ROOT / 'static' / 'llms.txt'
LINK_RE = re.compile(r'\[[^\]]*\]\((https?://[^)\s]+)\)')
SLUG_RE = re.compile(r'^slug:\s*(.+?)\s*$')


def frontmatter_slug(doc_path: Path) -> str | None:
    """Read the `slug:` frontmatter field of a docs page, normalized to a
    leading-slash path (e.g. '/bitrise-rde/configuration/github-integration').
    Returns None if the file has no slug frontmatter (or can't be read)."""
    try:
        text = doc_path.read_text('utf-8')
    except OSError:
        return None
    if not text.startswith('---'):
        return None
    end = text.find('\n---', 3)
    if end == -1:
        return None
    for line in text[3:end].splitlines():
        m = SLUG_RE.match(line.strip())
        if m:
            slug = m.group(1).strip().strip('"\'')
            return slug if slug.startswith('/') else '/' + slug
    return None


def added_page_slugs() -> set[str]:
    """Slugs of docs pages added in this PR, vs. its base branch. Empty
    outside a pull_request run (e.g. the weekly schedule) — there, links are
    checked strictly against production with no "pending deploy" carve-out."""
    base_ref = os.environ.get('GITHUB_BASE_REF')
    if not base_ref:
        return set()
    try:
        subprocess.run(
            ['git', 'fetch', '--depth=1', 'origin', base_ref],
            check=True, capture_output=True, cwd=ROOT,
        )
        # Two-dot diff (not three-dot): CI checks out a shallow merge ref and
        # a separately shallow-fetched base ref, which share no common
        # ancestor commit. Three-dot diff needs a merge-base to compute and
        # fails in that case; two-dot compares the two tree snapshots
        # directly and needs no shared history.
        diff = subprocess.run(
            ['git', 'diff', '--name-status', f'origin/{base_ref}..HEAD'],
            check=True, capture_output=True, text=True, cwd=ROOT,
        ).stdout
    except (subprocess.CalledProcessError, OSError):
        return set()

    slugs = set()
    for line in diff.splitlines():
        parts = line.split('\t')
        if len(parts) < 2 or parts[0] != 'A':
            continue
        rel = parts[-1]
        if not (rel.startswith('docs/') and rel.endswith(('.md', '.mdx'))):
            continue
        slug = frontmatter_slug(ROOT / rel)
        if slug:
            slugs.add(slug)
    return slugs


def url_page_path(url: str) -> str:
    """The page path a llms.txt link's generated-markdown URL maps to, e.g.
    'https://docs.bitrise.io/bitrise-rde/configuration/x.md' -> '/bitrise-rde/configuration/x'."""
    path = urlparse(url).path
    if path.endswith('.md'):
        path = path[:-3]
    return path


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

    new_slugs = added_page_slugs()

    broken = []
    pending = []
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(check_url, url): url for url in url_lines}
        done = 0
        for future in as_completed(futures):
            url, status = future.result()
            done += 1
            print(f'  [{done}/{len(url_lines)}] {status}  {url}', flush=True)
            if isinstance(status, int) and 200 <= status < 400:
                continue
            target = (pending if url_page_path(url) in new_slugs else broken)
            for lineno in url_lines[url]:
                target.append((lineno, url, str(status)))

    print()
    if pending:
        print(f'ℹ {len(pending)} link(s) point at pages added in this PR — not live yet, not failing the build:\n')
        for lineno, url, reason in sorted(pending):
            print(f'  static/llms.txt:{lineno}  {reason}  {url}')
        print()

    if not broken:
        print('✓ All other llms.txt links resolve.' if pending else '✓ All llms.txt links resolve.')
        return

    print(f'✗ {len(broken)} broken link(s) in static/llms.txt:\n')
    for lineno, url, reason in sorted(broken):
        print(f'  static/llms.txt:{lineno}  {reason}  {url}')

    sys.exit(1)


if __name__ == '__main__':
    main()
