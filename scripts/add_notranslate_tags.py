#!/usr/bin/env python3
"""
Add <NT> wrappers around every UI element, product name, Step name, and
other do-not-translate term in MDX files. (Named `NT`, not `NoTranslate` —
it appears thousands of times across the docs, so a short tag matters for
raw-source readability. Must stay capitalized: JSX treats a lowercase-first
tag name as a plain HTML element, not a component reference.)

This is the source-of-truth counterpart to a glossary-fed translation
pipeline: instead of an external glossary the (fragile) translation step has
to keep in sync with the docs, the docs themselves carry the "never
translate this" marker inline, right next to the term.

Usage:
    python3 scripts/add_notranslate_tags.py                  # all docs + partials
    python3 scripts/add_notranslate_tags.py --dry-run        # preview only, no changes
    python3 scripts/add_notranslate_tags.py path/to/file.mdx # single file

Term source:
    localization/ja-do-not-translate-glossary.yaml (do_not_translate block).
    All categories are wrapped unconditionally EXCEPT two ambiguous groups,
    which are wrapped only where the surrounding markdown already marks them
    as a literal UI reference (bold, a click/select/... verb just before, a
    "button"/"dialog"/"toggle" noun just after, or the start of a numbered/
    bulleted procedure step) — elsewhere they're left as ordinary prose:
      - `ui_labels_context_protect`: ordinary English words ("Add", "Details",
        "Copy", ...) that are only UI labels some of the time.
      - imperative-shaped `ui_labels_hard_protect` entries ("Add owner",
        "Enable AI features", "Request org approval", ...): these read as
        ordinary descriptive sentences about as often as they name a literal
        button, unlike noun-phrase labels ("API key", "Build Cache"), which
        essentially never do.

Rules (same exclusion machinery as add_glossary_terms.py):
  - ALL occurrences are wrapped (not just the first — translation protection
    has to cover every mention, unlike the GlossTerm tooltip convention).
  - The following regions are never touched: frontmatter, fenced code blocks,
    inline code, bare URLs, markdown link text/targets, import/export lines,
    JSX tag attributes, and anything already inside an <NT> block. Headings
    and admonition titles are NOT excluded — unlike <GlossTerm>'s tooltip
    (a real UX/anchor-generation concern inside a heading or title bar),
    <NT> is an inert translate="no" span with no visual footprint, so a
    glossary term inside a heading or admonition title gets wrapped exactly
    like it would in body text.
  - An existing <GlossTerm baseform="X">...</GlossTerm> whose X is also a
    do-not-translate term gets the WHOLE span wrapped in <NT> (so the
    tooltip still works, and the term still can't be translated) instead of
    being double-wrapped or skipped.
  - Single-word terms only match when Title-Cased in the text, to avoid
    catching the term used as an ordinary English word (e.g. "Workflow" the
    feature vs. a lowercase "workflow" in prose). Acronyms and code literals
    require an exact-case match instead. Multi-word terms match
    case-insensitively (they're unambiguous UI phrases).
  - An English inflectional suffix (plural "s", possessive "'s"/"s'") is
    matched but left OUTSIDE the tag: `<NT>Step</NT>'s`, not
    `<NT>Step's</NT>`. Only the term itself is a structurally-frozen literal;
    the suffix is English grammar that a translator needs to freely drop or
    replace (Japanese has no plural marker and shows possession with の, not
    an appended "s"), not something that should be locked in as an atomic
    do-not-touch unit alongside the term.

Step names: fetched live from the same steplib spec.json that
scripts/link_steps.py uses (not just the `step_names_and_field_labels`
glossary tier, which is doc-mined and incomplete) — this is the canonical,
authoritative list of every real Step title, so Step names are always
wrapped, exact-case, no contextual gating. Single-word titles ("Script",
"Bundler") additionally require an adjacent "Step"/"Steps" word, mirroring
link_steps.py's own disambiguation rule for the same ambiguity.
"""

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

import yaml

STEP_SPEC_URL = "https://bitrise-steplib-collection.s3.amazonaws.com/spec.json"

ROOT = Path(__file__).parent.parent
GLOSSARY_PATH = ROOT / "localization" / "ja-do-not-translate-glossary.yaml"
IMPORT_LINE = "import NT from '@site/src/components/NT';"

SAFE_CATEGORIES = [
    "bitrise_products",
    "bitrise_concepts",
    "ui_labels_hard_protect",
    "third_party",
    "platforms_languages",
    "step_names_and_field_labels",
    "code_literals",
]
CONTEXT_CATEGORY = "ui_labels_context_protect"
EXACT_CASE_CATEGORIES = {"acronyms", "code_literals"}

# Ordinary English words that only mean the Bitrise feature when it's the
# proper-noun-ish generic docs term — but this repo's own style guide lowercases
# "project" as a plain word, so only wrap the on-screen-feature sense.
REQUIRE_CONTEXT: dict[str, re.Pattern] = {
    "project": re.compile(r"(?i)(?<=bitrise\s)project(s|'s|s')?\b"),
    "projects": re.compile(r"(?i)(?<=bitrise\s)project(s|'s|s')?\b"),
}

# Single-word terms otherwise require Title-Case in the text (a proxy for
# "is this actually the Bitrise concept, not just an ordinary English word
# that happens to overlap" — e.g. "workflow"/"step" have real everyday
# meanings outside Bitrise). "workspace" has no meaningful non-Bitrise sense
# in this docs corpus, so the case check would only cost recall (real
# lowercase mentions like "a Bitrise workspace" going unprotected) without
# buying any precision. Wrap it regardless of case instead.
CASE_INSENSITIVE_SINGLE_WORD_TERMS = {"workspace", "workspaces"}

CLICK_VERB_RE = re.compile(r"(?i)(click|select|tap|press|choose|navigate to|go to)\s+(the\s+)?$")
UI_NOUN_RE = re.compile(
    r"(?i)^['’]?s?\s*(button|tab|field|menu|dropdown|option|page|dialog|toggle|"
    r"checkbox|section|screen|link|icon)\b"
)
LIST_ITEM_START_RE = re.compile(r"^\s*(?:\d+\.|[-*+])\s*(?:\*\*)?$")

# Single-word Step titles ("Script", "Bundler", "Flutter") are common enough
# as ordinary vocabulary that the title alone isn't a safe signal — require
# an adjacent "Step"/"Steps" word, mirroring scripts/link_steps.py's own
# rule for the exact same ambiguity.
STEP_WORD_AFTER_RE = re.compile(r"^\s+[Ss]teps?\b")
STEP_WORD_BEFORE_RE = re.compile(r"[Ss]teps?\s+$")


def is_step_word_adjacent(content: str, start: int, end: int) -> bool:
    if STEP_WORD_AFTER_RE.match(content[end:end + 10]):
        return True
    if STEP_WORD_BEFORE_RE.search(content[max(0, start - 10):start]):
        return True
    return False

# ui_labels_hard_protect terms shaped like an imperative instruction ("Add
# owner", "Enable AI features", "Request org approval") read as ordinary
# descriptive prose about as often as they read as a literal UI reference —
# unlike noun-phrase labels ("API key", "Build Cache"), which essentially
# never do. These get the same contextual gating as ui_labels_context_protect.
IMPERATIVE_VERBS = {
    "add", "enable", "disable", "create", "delete", "remove", "request", "grant",
    "revoke", "configure", "save", "cancel", "clear", "connect", "disconnect",
    "change", "copy", "edit", "confirm", "choose", "select", "check", "give",
    "go", "move", "open", "pause", "resume", "restore", "transfer", "validate",
    "view", "download", "upload", "install", "register", "invite", "send",
    "set", "start", "stop", "update", "reset", "regenerate", "rebuild",
    "extend", "finalize", "sign", "log", "block", "deactivate", "duplicate",
    "embed", "filter", "generate", "manage", "migrate", "notify", "provision",
    "publish", "rename", "replace", "report", "run", "share", "submit",
    "switch", "test", "trigger", "verify", "allow", "apply", "authorize",
    "authenticate", "activate", "abort", "find", "use", "include", "exclude",
}


def is_imperative_shaped(term: str) -> bool:
    first_word = term.split()[0].lower().strip(".,\"'")
    return first_word in IMPERATIVE_VERBS


# ---------------------------------------------------------------------------
# Load terms
# ---------------------------------------------------------------------------

def load_terms() -> tuple[list[str], list[str]]:
    data = yaml.safe_load(GLOSSARY_PATH.read_text(encoding="utf-8"))
    dnt = data.get("do_not_translate", {})

    safe: list[str] = []
    for cat in SAFE_CATEGORIES:
        safe.extend(dnt.get(cat, []) or [])

    context = list(dnt.get(CONTEXT_CATEGORY, []) or [])

    # dedupe, keep first occurrence's original casing
    def dedupe(terms: list[str]) -> list[str]:
        seen: dict[str, str] = {}
        for t in terms:
            key = t.lower()
            if key not in seen:
                seen[key] = t
        return list(seen.values())

    return dedupe(safe), dedupe(context)


def fetch_step_titles() -> list[str]:
    """Canonical Step titles from the live steplib spec — the same source
    scripts/link_steps.py uses — rather than relying solely on the
    doc-mined `step_names_and_field_labels` glossary tier. Network failures
    degrade gracefully: Step names just fall back to glossary coverage."""
    try:
        with urllib.request.urlopen(STEP_SPEC_URL, timeout=30) as r:
            data = json.loads(r.read())
    except Exception as e:
        print(f"  ! could not fetch step spec ({e}) — Step names rely on the glossary tier only", file=sys.stderr)
        return []
    titles: dict[str, str] = {}
    for step in data.get("steps", {}).values():
        latest = step.get("latest_version_number")
        if not latest:
            continue
        version = step.get("versions", {}).get(latest, {})
        title = (version.get("title") or "").strip()
        if title:
            titles.setdefault(title.lower(), title)
    return list(titles.values())


SAFE_TERMS, CONTEXT_TERMS = load_terms()
STEP_SPEC_TITLES = fetch_step_titles()

# Merge in Step titles not already covered (by any tier, under any casing) —
# glossary entries win on conflict since they may carry a deliberately
# adjusted display form.
_already_covered = {t.lower() for t in SAFE_TERMS + CONTEXT_TERMS}
_new_step_titles = [t for t in STEP_SPEC_TITLES if t.lower() not in _already_covered]
SAFE_TERMS = SAFE_TERMS + _new_step_titles
STEP_TITLE_TERMS = {t.lower() for t in STEP_SPEC_TITLES}

ALL_TERMS = SAFE_TERMS + CONTEXT_TERMS

# Longest-first (by word count, then char length) so multi-word terms are
# attempted before a single-word sub-term steals the match.
def sort_key(term: str) -> tuple[int, int]:
    return (-len(term.split()), -len(term))


TERM_ORDER = sorted(range(len(ALL_TERMS)), key=lambda i: sort_key(ALL_TERMS[i]))
TERM_CATEGORY = {t.lower(): "safe" for t in SAFE_TERMS}
TERM_CATEGORY.update({t.lower(): "context" for t in CONTEXT_TERMS})
# terms that came from an EXACT_CASE_CATEGORIES source keep exact casing
EXACT_CASE_TERMS: set[str] = set()


def _load_exact_case_terms() -> set[str]:
    data = yaml.safe_load(GLOSSARY_PATH.read_text(encoding="utf-8"))
    dnt = data.get("do_not_translate", {})
    out = set()
    for cat in EXACT_CASE_CATEGORIES:
        for t in dnt.get(cat, []) or []:
            out.add(t.lower())
    return out


EXACT_CASE_TERMS = _load_exact_case_terms() | STEP_TITLE_TERMS


def make_regex(term: str) -> re.Pattern:
    escaped = re.escape(term)
    escaped = re.sub(r"\\ ", r"\\s+", escaped)
    # Suffix is captured (not just matched) so it can be split back out of
    # the <NT> tag at replacement time — see the module docstring.
    pattern = r"\b" + escaped + r"(s|'s|s')?\b"
    if term.lower() in EXACT_CASE_TERMS:
        return re.compile(pattern)  # exact case only
    return re.compile(pattern, re.IGNORECASE)


TERM_REGEXES = {t: make_regex(t) for t in ALL_TERMS}


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

    raw.sort()
    merged: list[list[int]] = []
    for s, e in raw:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return [tuple(r) for r in merged]  # type: ignore[return-value]


def overlaps(start: int, end: int, ranges: list[tuple[int, int]]) -> bool:
    for s, e in ranges:
        if s >= end:
            break
        if start < e and end > s:
            return True
    return False


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
# Matching
# ---------------------------------------------------------------------------

def is_title_cased(text: str) -> bool:
    return bool(text) and text[0].isupper()


def context_allows(content: str, start: int, end: int, matched_text: str) -> bool:
    """For ambiguous terms (ui_labels_context_protect, and imperative-shaped
    ui_labels_hard_protect entries): only wrap where the surrounding markdown
    already marks the term as a literal UI reference rather than ordinary
    prose. Any of these count as evidence:
      - Bold-wrapped — loosely: a `**` within a short lookback/lookahead
        window, not requiring exact adjacency, so "**+ Add owner**" (a
        leading icon character inside the bold span) still counts.
      - Right after a click/select/tap/press/choose/navigate-to/go-to verb.
      - Right before a UI noun ("... button", "... dialog", "... toggle").
      - For multi-word terms only: the first thing on a numbered/bulleted
        list item line (a procedure step naming its own action target, e.g.
        "1. Enable AI features..."). Single words ("Add", "Run", "Check")
        start ordinary instructional bullets constantly regardless of
        whether they name a UI element, so this signal is too weak for them.
    """
    # Same-line-only: a "**" from the previous line's closing bold (or the
    # next line's opening bold) can otherwise land inside these windows and
    # falsely look like an enclosing pair for a term that isn't bold at all.
    line_start_bold = content.rfind("\n", 0, start) + 1
    line_end_bold = content.find("\n", end)
    if line_end_bold == -1:
        line_end_bold = len(content)
    lookback = content[max(line_start_bold, start - 15):start]
    lookahead_bold = content[end:min(line_end_bold, end + 50)]
    if "**" in lookback and "**" in lookahead_bold:
        return True
    lookbehind = content[max(line_start_bold, start - 30):start]
    if CLICK_VERB_RE.search(lookbehind):
        return True
    lookahead = content[end:min(line_end_bold, end + 20)]
    if UI_NOUN_RE.search(lookahead):
        return True
    if " " in matched_text.strip():
        line_start = line_start_bold
        prefix_on_line = content[line_start:start]
        if LIST_ITEM_START_RE.match(prefix_on_line):
            return True
    return False


def find_glosterm_spans(content: str) -> list[tuple[int, int, str, str, str]]:
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
        if baseform_attr.lower() in TERM_CATEGORY:
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


def process_content(content: str) -> tuple[str, list[str]]:
    excluded = get_exclude_ranges(content)
    replacements: list[tuple[int, int, str, str]] = []  # (start, end, new_text, term)

    # 1. Existing GlossTerm spans that double as do-not-translate terms:
    #    wrap the whole span, and exclude it from further matching either way
    #    (whether or not it matched — a GlossTerm block is never touched by
    #    the generic term regexes below, same as add_glossary_terms.py).
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
    for s, e, opening_tag, baseform_attr, children in find_glosterm_spans(content):
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

    # 2. Generic term matching — every occurrence, not just the first.
    for idx in TERM_ORDER:
        term = ALL_TERMS[idx]
        category = TERM_CATEGORY[term.lower()]
        rx = REQUIRE_CONTEXT.get(term.lower()) or TERM_REGEXES[term]
        is_step_title = term.lower() in STEP_TITLE_TERMS
        for m in rx.finditer(content):
            s, e = m.start(), m.end()
            if overlaps(s, e, excluded):
                continue
            matched_text = m.group(0)
            is_single_word = " " not in term
            if is_step_title and is_single_word:
                # Ambiguous single-word Step titles ("Script", "Bundler")
                # need an adjacent "Step"/"Steps" word instead of relying on
                # Title-Case — see is_step_word_adjacent's docstring.
                if not is_step_word_adjacent(content, s, e):
                    continue
            else:
                skip_case_check = (
                    term.lower() in EXACT_CASE_TERMS
                    or term.lower() in CASE_INSENSITIVE_SINGLE_WORD_TERMS
                    # REQUIRE_CONTEXT terms have their own lookbehind-based
                    # disambiguation (e.g. "project" only matches right after
                    # "Bitrise "), which does a better job than a blanket
                    # capitalization check — and for "project" specifically the
                    # style guide keeps it lowercase even when it IS the Bitrise
                    # concept, so the title-case check would always reject it.
                    or term.lower() in REQUIRE_CONTEXT
                )
                if not skip_case_check and is_single_word and not is_title_cased(matched_text):
                    continue
            # Step names are always wrapped — never gated behind bold/verb/
            # list-item context, even when the title happens to look like an
            # imperative instruction ("Restore Cache", "Send a Slack message").
            needs_context = not is_step_title and (
                category == "context" or (category == "safe" and is_imperative_shaped(term))
            )
            if needs_context and not context_allows(content, s, e, matched_text):
                continue
            # The inflectional suffix (plural "s", possessive "'s"/"s'") is
            # matched so it doesn't break word-boundary detection, but stays
            # OUTSIDE the tag — it's English grammar a translator needs to
            # freely drop or replace with の, not a frozen part of the term.
            suffix = m.group(1) or ""
            base_text = matched_text[:len(matched_text) - len(suffix)] if suffix else matched_text
            replacements.append((s, e, f"<NT>{base_text}</NT>{suffix}", term))
            excluded.append((s, e))
            excluded.sort()

    if not replacements:
        return content, []

    result = content
    for s, e, new_text, _ in sorted(replacements, key=lambda x: x[0], reverse=True):
        result = result[:s] + new_text + result[e:]

    result = ensure_import(result)
    wrapped_terms = [t for _, _, _, t in sorted(replacements, key=lambda x: x[0])]
    return result, wrapped_terms


def process_file(path: Path, dry_run: bool = False) -> list[str]:
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
        targets = [Path(a) if Path(a).is_absolute() else ROOT / a for a in args]
    else:
        targets = sorted(ROOT.glob("docs/**/*.mdx")) + sorted(ROOT.glob("src/partials/**/*.mdx"))

    total_files = 0
    total_wraps = 0

    for path in targets:
        wrapped = process_file(path, dry_run=dry_run)
        if wrapped:
            total_files += 1
            total_wraps += len(wrapped)
            prefix = "[dry-run] " if dry_run else ""
            print(f"  {prefix}{path.relative_to(ROOT)}: {len(wrapped)} wrapped")

    mode = " (dry run)" if dry_run else ""
    print(f"\nTotal{mode}: {total_wraps} terms wrapped across {total_files} files")


if __name__ == "__main__":
    main()
