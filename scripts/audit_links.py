#!/usr/bin/env python3
"""
Audit hyperlinks in MDX documentation files.

Checks:
  - Internal links (/en/...) resolve to a real page (slug match) and a valid anchor (if present).
  - External links return a 2xx/3xx response.

Skips:
  - Step source links (validated by the link-steps skill).
  - bitrise.io, app.bitrise.io, www.bitrise.io.
  - Fragment-only links (#anchor).

Usage:
  python3 scripts/audit_links.py                   # audit all MDX files
  python3 scripts/audit_links.py --pr 123          # files changed in PR
  python3 scripts/audit_links.py --commit abc123   # files changed in commit
  python3 scripts/audit_links.py --internal-only   # skip external checks
  python3 scripts/audit_links.py --external-only   # skip internal checks
"""

import json
import re
import subprocess
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
DOCS_DIR  = REPO_ROOT / 'docs'
SPEC_URL  = 'https://bitrise-steplib-collection.s3.amazonaws.com/spec.json'

SKIP_DOMAINS = {'bitrise.io', 'app.bitrise.io', 'www.bitrise.io', 'api.bitrise.io'}

# GitHub URL prefixes that are Bitrise steplib repos — skip without fetching spec
SKIP_URL_PREFIXES = (
    'https://github.com/bitrise-steplib/',
    'https://github.com/bitrise-io/steps-',
    'https://www.bitrise.io/integrations/steps/',
)

INTERNAL_ONLY = '--internal-only' in sys.argv
EXTERNAL_ONLY = '--external-only' in sys.argv


# ── Target files ──────────────────────────────────────────────────────────────

def get_target_files():
    args = sys.argv[1:]

    if '--pr' in args:
        idx = args.index('--pr')
        result = subprocess.run(
            ['gh', 'pr', 'diff', '--name-only', args[idx + 1]],
            capture_output=True, text=True, check=True,
        )
        return _mdx_paths(result.stdout.splitlines())

    if '--commit' in args:
        idx = args.index('--commit')
        result = subprocess.run(
            ['git', 'diff-tree', '--no-commit-id', '-r', '--name-only', args[idx + 1]],
            capture_output=True, text=True, check=True,
        )
        return _mdx_paths(result.stdout.splitlines())

    return None


def _mdx_paths(names):
    paths = []
    for name in names:
        name = name.strip()
        if not name.endswith('.mdx'):
            continue
        p = REPO_ROOT / name
        if p.exists():
            paths.append(p)
    return paths


# ── Internal link validation ──────────────────────────────────────────────────

HEADING_RE = re.compile(r'^#{1,6}\s+(.+)', re.MULTILINE)
EXPLICIT_ID_RE = re.compile(r'\{#([\w-]+)\}')
PARTIAL_IMPORT_RE = re.compile(r"from\s+'@site/(src/partials/[^']+)'")
PARTIALS_DIR = REPO_ROOT / 'src' / 'partials'


def heading_to_anchor(text: str) -> str:
    """Convert a heading to its Docusaurus-generated anchor id."""
    text = EXPLICIT_ID_RE.sub('', text).strip()
    text = re.sub(r'[^\w\s-]', '', text.lower())
    text = re.sub(r'\s+', '-', text).strip('-')
    return text


def extract_anchors(content: str) -> set[str]:
    anchors: set[str] = set()
    for heading_text in HEADING_RE.findall(content):
        explicit = EXPLICIT_ID_RE.search(heading_text)
        if explicit:
            anchors.add(explicit.group(1))
        anchors.add(heading_to_anchor(heading_text))
    return anchors


def build_slug_index() -> dict[str, set[str]]:
    """Return a dict mapping slug -> set of anchor ids for that page (including partials)."""
    index: dict[str, set[str]] = {}
    for mdx in [*DOCS_DIR.rglob('*.mdx'), *DOCS_DIR.rglob('*.md')]:
        content = mdx.read_text('utf-8')
        m = re.search(r'^slug:\s*["\']?([^"\'$\n]+)["\']?', content, re.MULTILINE)
        if m:
            slug = m.group(1).strip()
        else:
            rel = mdx.relative_to(DOCS_DIR).with_suffix('')
            slug = '/' + str(rel).replace('\\', '/')
            if slug.endswith('/index'):
                slug = slug[:-6] or '/'

        anchors = extract_anchors(content)

        for partial_path in PARTIAL_IMPORT_RE.findall(content):
            partial_file = REPO_ROOT / partial_path
            if partial_file.exists():
                anchors |= extract_anchors(partial_file.read_text('utf-8'))

        index[slug] = anchors
    return index


def normalise_internal(url: str) -> tuple:
    """Return (slug, anchor) with /en prefix and .html stripped."""
    path = url.removeprefix('/en').rstrip('/')
    if path.endswith('.html'):
        path = path[:-5]
    if '#' in path:
        slug, anchor = path.split('#', 1)
        return (slug or '/'), anchor
    return (path or '/'), None


# ── External link validation ──────────────────────────────────────────────────

def fetch_step_urls() -> set[str]:
    print('Fetching steplib spec to identify step links …', flush=True)
    with urllib.request.urlopen(SPEC_URL, timeout=120) as r:
        data = json.loads(r.read())
    urls: set[str] = set()
    for slug, step in data.get('steps', {}).items():
        latest = step.get('latest_version_number')
        if not latest:
            continue
        version = step.get('versions', {}).get(latest, {})
        url = (version.get('source_code_url') or '').strip().rstrip('/')
        if url:
            urls.add(url)
    print(f'  {len(urls)} step URLs loaded.', flush=True)
    return urls


def domain_of(url: str) -> str:
    m = re.match(r'https?://([^/]+)', url)
    return m.group(1) if m else ''


def should_skip_external(url: str) -> bool:
    d = domain_of(url)
    if d in SKIP_DOMAINS:
        return True
    for prefix in SKIP_URL_PREFIXES:
        if url.startswith(prefix):
            return True
    return False


def check_url(url: str):
    try:
        req = urllib.request.Request(
            url, method='HEAD',
            headers={'User-Agent': 'Mozilla/5.0 (audit_links)'},
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            return url, r.status
    except urllib.error.HTTPError as e:
        if e.code == 405:
            try:
                req2 = urllib.request.Request(
                    url, method='GET',
                    headers={'User-Agent': 'Mozilla/5.0 (audit_links)'},
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


# ── Link extraction ───────────────────────────────────────────────────────────

LINK_RE = re.compile(r'\[(?:[^\]]*)\]\(([^)]+)\)')
HREF_RE = re.compile(r'href=["\']([^"\']+)["\']')


def extract_links(filepath: Path):
    links = []
    in_fence = False
    for i, line in enumerate(filepath.read_text('utf-8').splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith('```'):
            in_fence = not in_fence
        if in_fence:
            continue
        for m in LINK_RE.finditer(line):
            links.append((i, m.group(1).strip()))
        for m in HREF_RE.finditer(line):
            links.append((i, m.group(1).strip()))
    return links


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    target_files = get_target_files()
    files = sorted(target_files if target_files is not None else [*DOCS_DIR.rglob('*.mdx'), *DOCS_DIR.rglob('*.md')])
    scope = f'{len(files)} file(s)' if target_files is not None else str(DOCS_DIR)
    print(f'Auditing links in {scope} …\n', flush=True)

    broken = []

    # ── Internal links ────────────────────────────────────────────────────────
    if not EXTERNAL_ONLY:
        print('Building slug index …', flush=True)
        slug_index = build_slug_index()
        print(f'  {len(slug_index)} pages indexed.\n', flush=True)

        print('Checking internal links …', flush=True)
        internal_checked = 0
        for filepath in files:
            for lineno, url in extract_links(filepath):
                if not url.startswith('/en/'):
                    continue
                slug, anchor = normalise_internal(url)
                internal_checked += 1
                if slug not in slug_index:
                    broken.append((filepath, lineno, url, 'no matching page'))
                elif anchor and anchor not in slug_index[slug]:
                    broken.append((filepath, lineno, url, 'anchor not found'))
        print(f'  {internal_checked} internal links checked.\n', flush=True)

    # ── External links ────────────────────────────────────────────────────────
    if not INTERNAL_ONLY:
        # Collect unique external URLs and where they appear
        url_locations = {}
        for filepath in files:
            for lineno, url in extract_links(filepath):
                if not url.startswith('http'):
                    continue
                if should_skip_external(url):
                    continue
                url_locations.setdefault(url, []).append((filepath, lineno))

        print(f'Checking {len(url_locations)} external URLs …', flush=True)
        with ThreadPoolExecutor(max_workers=10) as pool:
            futures = {pool.submit(check_url, url): url for url in url_locations}
            done = 0
            for future in as_completed(futures):
                url, status = future.result()
                done += 1
                print(f'  [{done}/{len(url_locations)}] {status}  {url}', flush=True)
                if isinstance(status, int) and 200 <= status < 400:
                    continue
                for filepath, lineno in url_locations[url]:
                    broken.append((filepath, lineno, url, str(status)))

    # ── Report ────────────────────────────────────────────────────────────────
    print()
    if not broken:
        print('✓ No broken links found.')
        return

    print(f'✗ {len(broken)} broken link(s) found:\n')
    for filepath, lineno, url, reason in sorted(broken, key=lambda x: (x[0], x[1])):
        try:
            rel = filepath.relative_to(REPO_ROOT)
        except ValueError:
            rel = filepath
        print(f'  {rel}:{lineno}  {reason}  {url}')

    sys.exit(1)


if __name__ == '__main__':
    main()
