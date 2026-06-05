#!/usr/bin/env python3
"""
Add <GlossTerm> wrappers to the first occurrence of each glossary term in MDX files.

Usage:
    python3 scripts/add_glossary_terms.py                  # all docs + partials
    python3 scripts/add_glossary_terms.py --dry-run        # preview only, no changes
    python3 scripts/add_glossary_terms.py path/to/file.mdx # single file

Rules:
  - Only the first occurrence of each term per file is wrapped.
  - Plural and possessive forms count as a match (Workflows, Workflow's, Steps, etc.).
  - Multi-word terms are matched before their single-word sub-terms (longest-first).
  - The following regions are never touched:
      frontmatter, fenced code blocks, inline code, existing <GlossTerm> elements,
      markdown link text [...](url), import/export lines, JSX tag attributes.
"""

import re
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
GLOSSARY_PATH = ROOT / "migration" / "glossary.json"
IMPORT_LINE = "import GlossTerm from '@site/src/components/GlossTerm';"

# ---------------------------------------------------------------------------
# Load glossary
# ---------------------------------------------------------------------------

with open(GLOSSARY_PATH) as f:
    glossary: dict[str, dict] = json.load(f)

# Sort longest-first so "workflow editor" is attempted before "workflow",
# and "project scanner" before "project", etc.
TERMS = sorted(glossary.keys(), key=lambda t: (-len(t.split()), -len(t)))


def make_regex(term: str) -> re.Pattern:
    escaped = re.escape(term)
    # Allow any whitespace between words of a multi-word term
    escaped = re.sub(r"\\ ", r"\\s+", escaped)
    # Match the term + optional plural/possessive suffix, with word boundaries
    return re.compile(r"\b" + escaped + r"(?:s|'s|s')?\b", re.IGNORECASE)


TERM_REGEXES = {t: make_regex(t) for t in TERMS}

# Terms where only capitalised occurrences should be wrapped.
# e.g. "Workflow" and "Workflows" → yes; "workflow" and "workflows" → no.
REQUIRE_CAPITALIZED = {"workflow", "step", "pipeline", "secret"}


# ---------------------------------------------------------------------------
# Exclusion-range helpers
# ---------------------------------------------------------------------------

def get_exclude_ranges(content: str) -> list[tuple[int, int]]:
    """
    Return a sorted, merged list of (start, end) character ranges that must
    not be searched or modified.
    """
    raw: list[tuple[int, int]] = []

    # 1. YAML frontmatter  --- ... ---
    fm = re.match(r"^---\r?\n.*?\r?\n---\r?\n", content, re.DOTALL)
    if fm:
        raw.append((0, fm.end()))

    # 2. Fenced code blocks  ```...```  (handles language tags and indented fences)
    in_fence = False
    fence_start = 0
    for m in re.finditer(r"^[ \t]*(?:-\s+)?```", content, re.MULTILINE):
        if not in_fence:
            in_fence = True
            fence_start = m.start()
        else:
            in_fence = False
            raw.append((fence_start, m.end()))
    if in_fence:  # unclosed fence — exclude to end of file
        raw.append((fence_start, len(content)))

    # 3. Inline code  `...`
    for m in re.finditer(r"`[^`\n]+`", content):
        raw.append((m.start(), m.end()))

    # 4. Existing <GlossTerm ...>...</GlossTerm> blocks
    for m in re.finditer(r"<GlossTerm\b[^>]*>.*?</GlossTerm>", content, re.DOTALL):
        raw.append((m.start(), m.end()))

    # 5. Markdown links — exclude both the [text] portion and the (url) portion
    for m in re.finditer(r"\[([^\]\n]*)\]\(([^)]*)\)", content):
        # Exclude [text]
        raw.append((m.start(), m.start() + 1 + len(m.group(1)) + 1))
        # Exclude (url)
        url_start = m.start() + 1 + len(m.group(1)) + 1 + 1  # position of '('
        raw.append((url_start, m.end()))
    # Also exclude reference-style link labels [text][
    for m in re.finditer(r"\[([^\]\n]*)\]\[", content):
        raw.append((m.start(), m.start() + 1 + len(m.group(1)) + 1))

    # 6. import / export lines
    for m in re.finditer(r"^(?:import|export)\b.*$", content, re.MULTILINE):
        raw.append((m.start(), m.end()))

    # 7. JSX / HTML tags — exclude the tag itself (not its children).
    # [^>] intentionally matches newlines to handle multi-line JSX props, e.g.:
    #   <Component
    #     description="text that mentions a Workflow here"
    #   />
    for m in re.finditer(r"<[^>]+>", content):
        raw.append((m.start(), m.end()))

    # Sort and merge overlapping/adjacent ranges
    raw.sort()
    merged: list[list[int]] = []
    for s, e in raw:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])

    return [tuple(r) for r in merged]  # type: ignore[return-value]


def overlaps(start: int, end: int, ranges: list[tuple[int, int]]) -> bool:
    """True if [start, end) overlaps any excluded range."""
    for s, e in ranges:
        if s >= end:
            break
        if start < e and end > s:
            return True
    return False


# ---------------------------------------------------------------------------
# Import insertion
# ---------------------------------------------------------------------------

def ensure_import(content: str) -> str:
    """Add the GlossTerm import if it is not already present."""
    if "import GlossTerm" in content:
        return content

    fm_end = 0
    fm = re.match(r"^---\r?\n.*?\r?\n---\r?\n", content, re.DOTALL)
    if fm:
        fm_end = fm.end()

    # Insert after the last existing import line, or right after frontmatter
    insert_at = fm_end
    for m in re.finditer(r"^import\b.*$", content[fm_end:], re.MULTILINE):
        insert_at = fm_end + m.end()

    return content[:insert_at] + "\n" + IMPORT_LINE + content[insert_at:]


# ---------------------------------------------------------------------------
# Core per-file processor
# ---------------------------------------------------------------------------

def process_content(content: str) -> tuple[str, list[str]]:
    """
    Return (modified_content, list_of_wrapped_term_keys).
    Does not write to disk.
    """
    excluded = get_exclude_ranges(content)
    replacements: list[tuple[int, int, str, str]] = []  # (start, end, new_text, term)

    # Terms that already have a <GlossTerm> anywhere in the file are considered
    # "already wrapped" — skip them entirely so we don't wrap a later occurrence
    # just because the first one happened to be inside an excluded region.
    already_wrapped = {
        m.group(1).lower()
        for m in re.finditer(r'<GlossTerm\s+baseform="([^"]+)"', content)
    }

    for term in TERMS:
        if term in already_wrapped:
            continue
        rx = TERM_REGEXES[term]
        for m in rx.finditer(content):
            s, e = m.start(), m.end()
            # Skip lowercase matches for terms that require capitalisation
            if term in REQUIRE_CAPITALIZED and not m.group(0)[0].isupper():
                continue
            if not overlaps(s, e, excluded):
                wrapped = f'<GlossTerm baseform="{term}">{m.group(0)}</GlossTerm>'
                replacements.append((s, e, wrapped, term))
                # Mark this span as excluded so no other term matches inside it
                excluded.append((s, e))
                excluded.sort()
                break

    if not replacements:
        return content, []

    # Apply right-to-left to keep earlier offsets valid
    result = content
    for s, e, new_text, _ in sorted(replacements, key=lambda x: x[0], reverse=True):
        result = result[:s] + new_text + result[e:]

    result = ensure_import(result)

    wrapped_terms = [t for _, _, _, t in sorted(replacements, key=lambda x: x[0])]
    return result, wrapped_terms


def process_file(path: Path, dry_run: bool = False) -> list[str]:
    """Process one file. Returns list of term keys that were wrapped."""
    content = path.read_text(encoding="utf-8")
    new_content, wrapped = process_content(content)
    if wrapped and not dry_run:
        path.write_text(new_content, encoding="utf-8")
    return wrapped


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    args = [a for a in args if not a.startswith("--")]

    if args:
        targets = [Path(a) for a in args]
    else:
        targets = sorted(ROOT.glob("docs/**/*.mdx")) + sorted(
            ROOT.glob("src/partials/**/*.mdx")
        )

    total_files = 0
    total_wraps = 0

    for path in targets:
        wrapped = process_file(path, dry_run=dry_run)
        if wrapped:
            total_files += 1
            total_wraps += len(wrapped)
            prefix = "[dry-run] " if dry_run else ""
            print(f"  {prefix}{path.relative_to(ROOT)}: {', '.join(wrapped)}")

    mode = " (dry run)" if dry_run else ""
    print(f"\nTotal{mode}: {total_wraps} terms wrapped across {total_files} files")


if __name__ == "__main__":
    main()
