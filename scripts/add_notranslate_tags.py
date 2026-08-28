#!/usr/bin/env python3
"""
OPTIONAL review/escape-hatch tool: report (or, with --write, wrap in <NT>)
every do-not-translate term occurrence in MDX files.

Do-not-translate enforcement does NOT depend on this tool. The translation
pipeline (.github/scripts/translate_docs.py) masks protected terms out of
the text at translation time, driven by the same shared matcher
(scripts/nt_terms.py) and the same glossary — so the docs source stays free
of tags and the term lists stay the single source of truth.

This tool exists for two things:
  1. REVIEW (default, read-only): show exactly which spans the matcher
     protects on a page — what a translation run would mask — so a human
     can spot false positives/negatives before or after a glossary change.
  2. ESCAPE HATCH (--write): materialize <NT>...</NT> wrappers in the
     source for the rare page-specific case the list-driven matcher can't
     decide on its own. translate_docs.py masks whole <NT> spans before
     any term matching runs, so a manual tag always wins. (The component is
     src/components/NT; named `NT`, not `NoTranslate`, for raw-source
     readability, and it must stay capitalized — JSX treats a
     lowercase-first tag name as a plain HTML element.)

Usage:
    python3 scripts/add_notranslate_tags.py                  # report, all docs + partials
    python3 scripts/add_notranslate_tags.py path/to/file.mdx # report, single file
    python3 scripts/add_notranslate_tags.py --write [paths]  # actually edit the files

Term source and matching rules: scripts/nt_terms.py (shared with the
translator — see its docstring for the tier semantics and every
disambiguation rule). What this tool adds on top is source-awareness:

  - The following regions are never touched: frontmatter, fenced code blocks,
    inline code, bare URLs, markdown link text/targets, import/export lines,
    JSX tag attributes, explicit heading anchor IDs (`{#custom-id}`), and
    anything already inside an <NT> block (idempotency). Headings and
    admonition titles are otherwise NOT excluded — <NT> is an inert
    translate="no" span with no visual footprint, so a glossary term inside
    a heading or admonition title gets wrapped exactly like it would in body
    text; only the `{#custom-id}` suffix itself is protected, since wrapping
    inside it produces an invalid anchor.
  - An existing <GlossTerm baseform="X">...</GlossTerm> whose X is also a
    do-not-translate term gets the WHOLE span wrapped in <NT> (so the
    tooltip still works, and the term still can't be translated) instead of
    being double-wrapped or skipped.
  - An English inflectional suffix (plural "s", possessive "'s"/"s'") is
    matched but left OUTSIDE the tag: `<NT>Step</NT>'s`, not
    `<NT>Step's</NT>`. Only the term itself is a structurally-frozen literal;
    the suffix is English grammar that a translator needs to freely drop or
    replace (Japanese has no plural marker and shows possession with の, not
    an appended "s"), not something that should be locked in as an atomic
    do-not-touch unit alongside the term.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from nt_terms import TermMatcher, overlaps  # noqa: E402

GLOSSARY_PATH = ROOT / "localization" / "ja-do-not-translate-glossary.yaml"
IMPORT_LINE = "import NT from '@site/src/components/NT';"


# ---------------------------------------------------------------------------
# Exclusion-range helpers (same machinery as add_glossary_terms.py)
# ---------------------------------------------------------------------------

def get_exclude_ranges(content: str) -> list[tuple[int, int]]:
    raw: list[tuple[int, int]] = []

    fm = re.match(r"^---\r?\n.*?\r?\n---\r?\n", content, re.DOTALL)
    if fm:
        raw.append((0, fm.end()))

    in_fence = False
    fence_start = 0
    for m in re.finditer(r"^[ \t]*(?:-\s+)?```", content, re.MULTILINE):
        if not in_fence:
            in_fence = True
            fence_start = m.start()
        else:
            in_fence = False
            raw.append((fence_start, m.end()))
    if in_fence:
        raw.append((fence_start, len(content)))

    for m in re.finditer(r"`[^`\n]+`", content):
        raw.append((m.start(), m.end()))

    # Already-wrapped <NT>...</NT> blocks — idempotency.
    for m in re.finditer(r"<NT\b[^>]*>.*?</NT>", content, re.DOTALL):
        raw.append((m.start(), m.end()))

    for m in re.finditer(r"\[([^\]\n]*)\]\(([^)]*)\)", content):
        raw.append((m.start(), m.start() + 1 + len(m.group(1)) + 1))
        url_start = m.start() + 1 + len(m.group(1)) + 1 + 1
        raw.append((url_start, m.end()))
    for m in re.finditer(r"\[([^\]\n]*)\]\[", content):
        raw.append((m.start(), m.start() + 1 + len(m.group(1)) + 1))

    for m in re.finditer(r"^(?:import|export)\b.*$", content, re.MULTILINE):
        raw.append((m.start(), m.end()))

    for m in re.finditer(r"https?://\S+", content):
        raw.append((m.start(), m.end()))

    # JSX/HTML tags — exclude the tag itself, not its children.
    for m in re.finditer(r"<[^>]+>", content):
        raw.append((m.start(), m.end()))

    # Explicit heading anchor IDs (`## Workspace {#workspace}`). The `{#...}`
    # suffix is Docusaurus's custom-ID syntax, not prose — wrapping a term
    # inside it (e.g. `{#<NT>workspace</NT>}`) produces an invalid anchor that
    # silently breaks every link pointing at that heading.
    for m in re.finditer(r"\{#[^}\n]*\}", content):
        raw.append((m.start(), m.end()))

    raw.sort()
    merged: list[list[int]] = []
    for s, e in raw:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return [tuple(r) for r in merged]  # type: ignore[return-value]


def ensure_import(content: str) -> str:
    if "import NT from '@site/src/components/NT'" in content:
        return content
    fm_end = 0
    fm = re.match(r"^---\r?\n.*?\r?\n---\r?\n", content, re.DOTALL)
    if fm:
        fm_end = fm.end()
    insert_at = fm_end
    has_existing_import = False
    for m in re.finditer(r"^import\b.*$", content[fm_end:], re.MULTILINE):
        insert_at = fm_end + m.end()
        has_existing_import = True
    if has_existing_import:
        # Stack directly under the last import — the blank line separating
        # the import block from the body already exists in the suffix.
        return content[:insert_at] + "\n" + IMPORT_LINE + content[insert_at:]
    # No imports yet: insert our own blank-line buffer on both sides to match
    # this repo's convention (blank line after frontmatter, blank line before body).
    body = content[fm_end:].lstrip("\n")
    return content[:fm_end] + "\n" + IMPORT_LINE + "\n\n" + body


# ---------------------------------------------------------------------------
# GlossTerm handling
# ---------------------------------------------------------------------------

def find_glosterm_spans(content: str, matcher: TermMatcher) -> list[tuple[int, int, str, str, str]]:
    """Existing <GlossTerm baseform="X">children</GlossTerm> spans whose X is
    also a do-not-translate term — these get wrapped in <NT>, splitting a
    plain inflectional suffix off the displayed children the same way the
    generic term-matching loop splits it off a fresh match (see
    split_glossterm_suffix): a human author may have typed the plural or
    possessive form directly as GlossTerm's children (e.g.
    `<GlossTerm baseform="Secret">Secrets</GlossTerm>`), and that "s" is
    exactly as much English grammar needing to stay negotiable for
    translation as any other inflectional suffix."""
    spans = []
    for m in re.finditer(r'(<GlossTerm\s+baseform="([^"]+)"[^>]*>)(.*?)</GlossTerm>', content, re.DOTALL):
        opening_tag, baseform_attr, children = m.group(1), m.group(2), m.group(3)
        if matcher.has_term(baseform_attr):
            spans.append((m.start(), m.end(), opening_tag, baseform_attr, children))
    return spans


def split_glossterm_suffix(baseform_attr: str, children: str) -> tuple[str, str]:
    """If `children` is exactly `baseform_attr` plus a plain inflectional
    suffix (s/'s/s'), return (children_without_suffix, suffix). Otherwise
    (children is some other inflection, a synonym, a different phrase
    entirely, ...) return (children, "") — no suffix to split off, the span
    wraps as one atomic unit exactly as before."""
    base_len = len(baseform_attr)
    if len(children) <= base_len or children[:base_len].lower() != baseform_attr.lower():
        return children, ""
    remainder = children[base_len:]
    if remainder.lower() in ("s", "'s", "s'"):
        return children[:base_len], remainder
    return children, ""


# ---------------------------------------------------------------------------
# Processing
# ---------------------------------------------------------------------------

def process_content(content: str, matcher: TermMatcher) -> tuple[str, list[str]]:
    excluded = get_exclude_ranges(content)
    replacements: list[tuple[int, int, str, str]] = []  # (start, end, new_text, term)

    # 1. Existing GlossTerm spans that double as do-not-translate terms:
    #    wrap the whole span, and exclude it from further matching either way
    #    (whether or not it matched — a GlossTerm block is never touched by
    #    the generic term matching below, same as add_glossary_terms.py).
    # A span's own opening/closing tags are always present in the base
    # exclusion set (the generic "<[^>]+>" tag scan) — that's not a real
    # conflict, so it's filtered out here. What's left (fenced code, inline
    # code, URLs, frontmatter) IS a real conflict: a GlossTerm that already
    # ended up inside backticks or a code fence (a pre-existing bug
    # elsewhere) must not be wrapped further — it needs a content fix, not
    # more markup piled on top.
    nt_ranges = [
        (m.start(), m.end())
        for m in re.finditer(r"<NT\b[^>]*>.*?</NT>", content, re.DOTALL)
    ]
    for s, e, opening_tag, baseform_attr, children in find_glosterm_spans(content, matcher):
        real_conflicts = [r for r in excluded if not (s <= r[0] and r[1] <= e)]
        if overlaps(s, e, real_conflicts) or overlaps(s, e, nt_ranges):
            continue
        inner, suffix = split_glossterm_suffix(baseform_attr, children)
        new_glossterm = f"{opening_tag}{inner}</GlossTerm>"
        replacements.append((s, e, f"<NT>{new_glossterm}</NT>{suffix}", baseform_attr.lower()))
    # Exclude ALL GlossTerm spans (matched or not) from generic scanning —
    # duplicate ranges are harmless for overlaps(), which just needs any
    # overlapping pair present.
    for m in re.finditer(r"<GlossTerm\b[^>]*>.*?</GlossTerm>", content, re.DOTALL):
        excluded.append((m.start(), m.end()))
    excluded.sort()

    # 2. Generic term matching — shared with translate_docs.py's
    #    translation-time masking (scripts/nt_terms.py), so this report shows
    #    exactly what a translation run would protect.
    for tm in matcher.find_matches(content, excluded):
        replacements.append((tm.start, tm.end, f"<NT>{tm.base}</NT>{tm.suffix}", tm.term))

    if not replacements:
        return content, []

    result = content
    for s, e, new_text, _ in sorted(replacements, key=lambda x: x[0], reverse=True):
        result = result[:s] + new_text + result[e:]

    result = ensure_import(result)
    wrapped_terms = [t for _, _, _, t in sorted(replacements, key=lambda x: x[0])]
    return result, wrapped_terms


def process_file(path: Path, matcher: TermMatcher, write: bool = False) -> list[str]:
    content = path.read_text(encoding="utf-8")
    new_content, wrapped = process_content(content, matcher)
    if wrapped and write:
        path.write_text(new_content, encoding="utf-8")
    return wrapped


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    args = sys.argv[1:]
    write = "--write" in args
    args = [a for a in args if not a.startswith("--")]

    if args:
        targets = [Path(a) if Path(a).is_absolute() else ROOT / a for a in args]
    else:
        targets = sorted(ROOT.glob("docs/**/*.mdx")) + sorted(ROOT.glob("src/partials/**/*.mdx"))

    matcher = TermMatcher(GLOSSARY_PATH)

    total_files = 0
    total_wraps = 0

    for path in targets:
        wrapped = process_file(path, matcher, write=write)
        if wrapped:
            total_files += 1
            total_wraps += len(wrapped)
            prefix = "" if write else "[report] "
            try:
                shown = path.relative_to(ROOT)
            except ValueError:  # explicit target outside the repo root
                shown = path
            print(f"  {prefix}{shown}: {len(wrapped)} wrapped")

    mode = "" if write else " (report only — pass --write to edit files)"
    print(f"\nTotal{mode}: {total_wraps} terms wrapped across {total_files} files")


if __name__ == "__main__":
    main()
