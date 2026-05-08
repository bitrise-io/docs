#!/usr/bin/env python3
"""
Link Bitrise Step titles to their GitHub source_code_url.

Usage:
  python3 scripts/link_steps.py                  # process all .mdx files
  python3 scripts/link_steps.py --dry-run        # preview changes
  python3 scripts/link_steps.py --files a.mdx b.mdx   # specific files only
  python3 scripts/link_steps.py --pr 123         # files changed in PR #123
  python3 scripts/link_steps.py --commit abc123  # files changed in commit

What it does:
  1. Fetches spec.json from S3 and builds a title → source_code_url mapping
     from each step's latest version.
  2. For every target .mdx file:
     a. Rewrites existing [text](bitrise.io/integrations/...) links whose text
        matches a known step title to use source_code_url instead.
     b. Adds new links for **Title** Step / Title Step occurrences not yet linked.
  3. Single-word titles (e.g. "Script") are only linked when followed by "Step".
"""

import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
DOCS_DIR  = REPO_ROOT / 'docs'
SPEC_URL  = 'https://bitrise-steplib-collection.s3.amazonaws.com/spec.json'
DRY_RUN   = '--dry-run' in sys.argv


# ── Argument parsing ──────────────────────────────────────────────────────────

def get_target_files() -> list[Path] | None:
    """
    Return a list of target .mdx files based on CLI arguments, or None to
    mean "process all .mdx files under DOCS_DIR".
    """
    args = sys.argv[1:]

    if '--files' in args:
        idx = args.index('--files')
        paths = []
        for p in args[idx + 1:]:
            if p.startswith('--'):
                break
            candidate = Path(p)
            if not candidate.is_absolute():
                candidate = REPO_ROOT / candidate
            if candidate.suffix == '.mdx' and candidate.exists():
                paths.append(candidate)
        return paths or []

    if '--pr' in args:
        idx = args.index('--pr')
        pr_number = args[idx + 1]
        result = subprocess.run(
            ['gh', 'pr', 'diff', '--name-only', pr_number],
            capture_output=True, text=True, check=True,
        )
        return _mdx_paths_from_names(result.stdout.splitlines())

    if '--commit' in args:
        idx = args.index('--commit')
        sha = args[idx + 1]
        result = subprocess.run(
            ['git', 'diff-tree', '--no-commit-id', '-r', '--name-only', sha],
            capture_output=True, text=True, check=True,
        )
        return _mdx_paths_from_names(result.stdout.splitlines())

    return None  # process everything


def _mdx_paths_from_names(names: list[str]) -> list[Path]:
    paths = []
    for name in names:
        name = name.strip()
        if not name.endswith('.mdx'):
            continue
        p = REPO_ROOT / name
        if p.exists():
            paths.append(p)
    return paths


# ── Step 1: fetch mapping ─────────────────────────────────────────────────────

def fetch_mapping() -> dict[str, str]:
    print(f'Fetching {SPEC_URL} …', flush=True)
    with urllib.request.urlopen(SPEC_URL, timeout=120) as r:
        data = json.loads(r.read())

    mapping: dict[str, str] = {}
    for slug, step in data.get('steps', {}).items():
        latest = step.get('latest_version_number')
        if not latest:
            continue
        version = step.get('versions', {}).get(latest, {})
        title = (version.get('title') or '').strip()
        url   = (version.get('source_code_url') or '').strip()
        if title and url:
            mapping.setdefault(title, url)

    print(f'  {len(mapping)} step titles loaded.')
    return mapping


# ── Step 2: per-line transformation ──────────────────────────────────────────

# Existing link whose URL is a bitrise.io/integrations/steps/… URL.
# Groups: (open_bold, text_inner, close_bold, integrations_url)
INTEG_LINK_RE = re.compile(
    r'\[(\*\*)?([^\]\n]+?)(\*\*)?\]'
    r'\(https?://(?:www\.)?bitrise\.io/integrations/steps/[^)\s"]+\)'
)


def _make_link(text: str, bold: bool, url: str) -> str:
    inner = f'**{text}**' if bold else text
    return f'[{inner}]({url})'


def compute_skip_spans(line: str) -> list[tuple[int, int]]:
    """
    Return sorted (start, end) spans that must not be modified.
    Covers: existing links, inline code, JSX/HTML attribute values,
    JS object string values, and Docusaurus admonition titles.
    """
    spans = []
    for m in re.finditer(r'\[[^\]\n]*\]\([^)\n]*\)', line):
        spans.append((m.start(), m.end()))
    for m in re.finditer(r'`[^`\n]*`', line):
        spans.append((m.start(), m.end()))
    for m in re.finditer(r'\b\w[\w-]*\s*=\s*(?:"[^"\n]*"|\'[^\'\n]*\')', line):
        spans.append((m.start(), m.end()))
    for m in re.finditer(r':\s*(?:"[^"\n]*"|\'[^\'\n]*\')', line):
        spans.append((m.start(), m.end()))
    for m in re.finditer(r':::\w+\[[^\]\n]*\]', line):
        spans.append((m.start(), m.end()))
    return spans


def in_any_span(start: int, end: int, spans: list[tuple[int, int]]) -> bool:
    return any(ls <= start and end <= le for ls, le in spans)


def process_line(
    line: str,
    sorted_titles: list[str],
    mapping: dict[str, str],
    lower_mapping: dict[str, str],
) -> str:
    # a. Rewrite existing integrations links ──────────────────────────────────
    def rewrite_integ(m: re.Match) -> str:
        ob, text, cb = m.group(1) or '', m.group(2), m.group(3) or ''
        lookup = re.sub(r'\s+[Ss]tep[s]?\s*$', '', text).strip()
        src_url = mapping.get(lookup) or lower_mapping.get(lookup.lower())
        if src_url:
            return _make_link(lookup, bool(ob), src_url)
        return m.group(0)

    line = INTEG_LINK_RE.sub(rewrite_integ, line)

    # b. Add new links for unlinked title occurrences ─────────────────────────
    for title in sorted_titles:
        url = mapping[title]
        esc = re.escape(title)

        # Single-word titles are too generic without an explicit "Step" suffix.
        needs_step_suffix = len(title.split()) == 1
        step_suffix = r' ([Ss]tep[s]?)\b'

        if needs_step_suffix:
            bold_pat  = r'(?<!\[)\*\*(' + esc + r')\*\*' + step_suffix
            plain_pat = r'(?<!\[)(?<!\*)\b(' + esc + r')\b' + step_suffix
        else:
            bold_pat  = r'(?<!\[)\*\*(' + esc + r')\*\*(?:' + step_suffix + r')?'
            plain_pat = r'(?<!\[)(?<!\*)\b(' + esc + r')\b(?:' + step_suffix + r')?'

        spans = compute_skip_spans(line)

        # Bold: IGNORECASE handles doc casing that differs from spec
        # (e.g. "Save NPM cache" in doc vs "Save NPM Cache" in spec).
        new_line = line
        for m in re.finditer(bold_pat, line, re.IGNORECASE):
            if in_any_span(m.start(), m.end(), spans):
                continue
            step_part = f' {m.group(2)}' if m.lastindex >= 2 and m.group(2) else ''
            new_line = new_line[:m.start()] + f'[**{m.group(1)}**]({url}){step_part}' + new_line[m.end():]
            break
        if new_line != line:
            line = new_line
            continue

        # Plain: case-sensitive to avoid false positives on common words
        # (e.g. "git tag" as a concept vs "Git Tag" step).
        new_line = line
        for m in re.finditer(plain_pat, line):
            if in_any_span(m.start(), m.end(), spans):
                continue
            step_part = f' {m.group(2)}' if m.lastindex >= 2 and m.group(2) else ''
            new_line = new_line[:m.start()] + f'[{m.group(1)}]({url}){step_part}' + new_line[m.end():]
            break
        if new_line != line:
            line = new_line

    return line


# ── Step 3: process files ─────────────────────────────────────────────────────

def process_file(
    filepath: Path,
    sorted_titles: list[str],
    mapping: dict[str, str],
    lower_mapping: dict[str, str],
) -> bool:
    original = filepath.read_text('utf-8')
    lines = original.splitlines(keepends=True)
    new_lines = []
    in_fence       = False
    in_frontmatter = False

    for i, line in enumerate(lines):
        stripped = line.strip()

        if i == 0 and stripped == '---':
            in_frontmatter = True
            new_lines.append(line)
            continue
        if in_frontmatter:
            if stripped == '---':
                in_frontmatter = False
            new_lines.append(line)
            continue

        if stripped.startswith('```'):
            in_fence = not in_fence
        if in_fence:
            new_lines.append(line)
            continue

        new_lines.append(process_line(line, sorted_titles, mapping, lower_mapping))

    new_text = ''.join(new_lines)
    if new_text == original:
        return False

    if DRY_RUN:
        orig_lines = original.splitlines()
        new_l_list = new_text.splitlines()
        for old, new in zip(orig_lines, new_l_list):
            if old != new:
                print(f'  - {old.rstrip()}')
                print(f'  + {new.rstrip()}')
    else:
        filepath.write_text(new_text, 'utf-8')
    return True


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    target_files = get_target_files()

    mapping = fetch_mapping()
    lower_mapping = {t.lower(): url for t, url in mapping.items()}
    sorted_titles = sorted(mapping.keys(), key=len, reverse=True)

    if target_files is None:
        files = sorted(DOCS_DIR.rglob('*.mdx'))
        scope = str(DOCS_DIR)
    else:
        files = sorted(target_files)
        scope = f'{len(files)} file(s)'

    print(f"\n{'DRY RUN — ' if DRY_RUN else ''}Processing {scope} …")

    changed_files = []
    for f in files:
        if DRY_RUN:
            import contextlib, io
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                changed = process_file(f, sorted_titles, mapping, lower_mapping)
            out = buf.getvalue()
            if changed:
                try:
                    rel = f.relative_to(DOCS_DIR)
                except ValueError:
                    rel = f
                print(f'\n--- {rel}')
                print(out, end='')
                changed_files.append(f)
        else:
            if process_file(f, sorted_titles, mapping, lower_mapping):
                changed_files.append(f)
                try:
                    rel = f.relative_to(DOCS_DIR)
                except ValueError:
                    rel = f
                print(f'  modified: {rel}')

    print(f"\n{'Would modify' if DRY_RUN else 'Modified'} {len(changed_files)} files.")


if __name__ == '__main__':
    main()
