#!/usr/bin/env python3
"""
Shared do-not-translate term matcher for the Japanese translation pipeline.

One source of matching semantics, two consumers:

  - .github/scripts/translate_docs.py — the PRIMARY consumer. At translation
    time it masks every term match out of the text (the same way it masks
    code and URLs) before the model sees it, so protected terms are enforced
    structurally without any tags in the docs source.
  - scripts/add_notranslate_tags.py — the OPTIONAL consumer. A report tool
    (and, with --write, a source tagger) for reviewing what the matcher
    would protect, or for pinning down rare page-specific cases with a
    manual <NT> wrapper.

Both must agree on what counts as a protected term — that's why the term
loading, regex construction, and every disambiguation rule live here and
nowhere else.

Term sources
  - localization/ja-do-not-translate-glossary.yaml — every tier under
    `do_not_translate`. Tiers are interpreted by NAME, generically, so a
    renamed or newly added tier in the regenerated glossary can't silently
    drop out of protection (every unknown tier gets the strongest "always
    protect" treatment):
      * `ui_labels_context_protect` -> context-gated (see context_allows)
      * `acronyms`, `code_literals` -> exact-case match required
      * `acronyms` additionally is only matched when include_acronyms=True:
        tagging every "CI"/"UI" in source would be noise, but masking them
        at translation time costs nothing — so the translator opts in and
        the tagger doesn't (2-char acronyms are invisible to the env_var
        protect pattern, which needs 3+ ALL-CAPS chars).
      * everything else -> always protected
  - the live steplib spec.json — canonical Step titles (the same source
    scripts/link_steps.py uses), merged in on top of the glossary tiers.
    Network failures degrade gracefully to glossary-only coverage.

Disambiguation rules (shared verbatim by both consumers)
  - Single-word terms only match when Title-Cased in the text, to avoid
    catching the term used as an ordinary English word ("Workflow" the
    feature vs. a lowercase "workflow" in prose). Acronyms and code
    literals require an exact-case match instead.
  - Multi-word terms match case-insensitively (unambiguous UI phrases).
  - `ui_labels_context_protect` terms and imperative-shaped
    `ui_labels_hard_protect` terms ("Add owner", "Enable AI features") only
    match where the surrounding markdown marks them as a literal UI
    reference — bold, a click/select/... verb just before, a "button"/
    "dialog"/... noun just after, or (multi-word only) the start of a
    numbered/bulleted procedure step.
  - Single-word Step titles ("Script", "Bundler") require an adjacent
    "Step"/"Steps" word, mirroring scripts/link_steps.py's rule.
  - "project"/"projects" only match right after "Bitrise " (the style guide
    lowercases "project" as a plain word, so Title-Case can't disambiguate).
  - An English inflectional suffix (plural "s", possessive "'s"/"s'") is
    matched but reported separately from the base term: only the term
    itself is a frozen literal; the suffix is English grammar a translator
    needs to freely drop or replace (Japanese has no plural marker and
    shows possession with の).
"""

from __future__ import annotations

import bisect
import json
import re
import sys
import urllib.request
from dataclasses import dataclass

import yaml

STEP_SPEC_URL = "https://bitrise-steplib-collection.s3.amazonaws.com/spec.json"

CONTEXT_CATEGORY = "ui_labels_context_protect"
EXACT_CASE_CATEGORIES = {"acronyms", "code_literals"}
ACRONYM_CATEGORY = "acronyms"

# Ordinary English words that only mean the Bitrise feature when it's the
# proper-noun-ish generic docs term — but this repo's own style guide lowercases
# "project" as a plain word, so only match the on-screen-feature sense.
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
# buying any precision. Match it regardless of case instead.
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


def is_title_cased(text: str) -> bool:
    return bool(text) and text[0].isupper()


def is_step_word_adjacent(content: str, start: int, end: int) -> bool:
    if STEP_WORD_AFTER_RE.match(content[end:end + 10]):
        return True
    if STEP_WORD_BEFORE_RE.search(content[max(0, start - 10):start]):
        return True
    return False


def context_allows(content: str, start: int, end: int, matched_text: str) -> bool:
    """For ambiguous terms (ui_labels_context_protect, and imperative-shaped
    ui_labels_hard_protect entries): only match where the surrounding markdown
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
        prefix_on_line = content[line_start_bold:start]
        if LIST_ITEM_START_RE.match(prefix_on_line):
            return True
    return False


def overlaps(start: int, end: int, ranges: list[tuple[int, int]]) -> bool:
    """ranges must be sorted by start."""
    for s, e in ranges:
        if s >= end:
            break
        if start < e and end > s:
            return True
    return False


def fetch_step_titles() -> list[str]:
    """Canonical Step titles from the live steplib spec — the same source
    scripts/link_steps.py uses — rather than relying solely on the doc-mined
    Step-name glossary tier. Network failures degrade gracefully: Step names
    just fall back to glossary coverage."""
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


# Longest-first (by word count, then char length) so multi-word terms are
# attempted before a single-word sub-term steals the match.
def _sort_key(term: str) -> tuple[int, int]:
    return (-len(term.split()), -len(term))


def _dedupe(terms: list[str]) -> list[str]:
    """Dedupe, keeping the first occurrence's original casing."""
    seen: dict[str, str] = {}
    for t in terms:
        key = t.lower()
        if key not in seen:
            seen[key] = t
    return list(seen.values())


@dataclass(frozen=True)
class TermMatch:
    start: int          # span start in content (includes the suffix)
    end: int            # span end in content (includes the suffix)
    base: str           # the matched term text, suffix stripped
    suffix: str         # inflectional suffix ("s", "'s", "s'") or ""
    term: str           # the glossary term that matched (canonical casing)


class TermMatcher:
    def __init__(self, glossary_path, fetch_steps: bool = True,
                 include_acronyms: bool = False):
        data = yaml.safe_load(open(glossary_path, encoding="utf-8"))
        dnt = data.get("do_not_translate", {}) or {}

        safe: list[str] = []
        context: list[str] = []
        exact_case: set[str] = set()
        for tier, terms in dnt.items():
            terms = list(terms or [])
            if tier in EXACT_CASE_CATEGORIES:
                exact_case.update(t.lower() for t in terms)
            if tier == ACRONYM_CATEGORY and not include_acronyms:
                continue
            if tier == CONTEXT_CATEGORY:
                context.extend(terms)
            else:
                safe.extend(terms)
        safe = _dedupe(safe)
        context = _dedupe(context)

        step_titles = fetch_step_titles() if fetch_steps else []
        # Merge in Step titles not already covered (by any tier, under any
        # casing) — glossary entries win on conflict since they may carry a
        # deliberately adjusted display form.
        covered = {t.lower() for t in safe + context}
        safe = safe + [t for t in step_titles if t.lower() not in covered]

        self.step_title_terms = {t.lower() for t in step_titles}
        self.exact_case_terms = exact_case | self.step_title_terms
        self.all_terms = safe + context
        self.term_category = {t.lower(): "safe" for t in safe}
        self.term_category.update({t.lower(): "context" for t in context})
        self.term_order = sorted(range(len(self.all_terms)),
                                 key=lambda i: _sort_key(self.all_terms[i]))
        self.term_regexes = {t: self._make_regex(t) for t in self.all_terms}

    def _make_regex(self, term: str) -> re.Pattern:
        escaped = re.escape(term)
        escaped = re.sub(r"\\ ", r"\\s+", escaped)
        # Suffix is captured (not just matched) so it can be split back out
        # at replacement time — see the module docstring.
        pattern = r"\b" + escaped + r"(s|'s|s')?\b"
        if term.lower() in self.exact_case_terms:
            return re.compile(pattern)  # exact case only
        return re.compile(pattern, re.IGNORECASE)

    def has_term(self, term: str) -> bool:
        return term.lower() in self.term_category

    def find_matches(self, content: str,
                     exclude_ranges: list[tuple[int, int]] | None = None) -> list[TermMatch]:
        """Every protected-term occurrence in `content` (not just the first —
        translation protection has to cover every mention), applying all
        disambiguation rules. Matches never overlap each other or any of the
        caller's exclude_ranges; longer terms win over their sub-terms.
        Returned in document order."""
        excluded: list[tuple[int, int]] = sorted(exclude_ranges or [])
        matches: list[TermMatch] = []

        for idx in self.term_order:
            term = self.all_terms[idx]
            category = self.term_category[term.lower()]
            rx = REQUIRE_CONTEXT.get(term.lower()) or self.term_regexes[term]
            is_step_title = term.lower() in self.step_title_terms
            for m in rx.finditer(content):
                s, e = m.start(), m.end()
                if overlaps(s, e, excluded):
                    continue
                matched_text = m.group(0)
                is_single_word = " " not in term
                if is_step_title and is_single_word:
                    # Ambiguous single-word Step titles ("Script", "Bundler")
                    # need an adjacent "Step"/"Steps" word instead of relying
                    # on Title-Case — see is_step_word_adjacent's docstring.
                    if not is_step_word_adjacent(content, s, e):
                        continue
                else:
                    skip_case_check = (
                        term.lower() in self.exact_case_terms
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
                # Step names are always matched — never gated behind bold/verb/
                # list-item context, even when the title happens to look like an
                # imperative instruction ("Restore Cache", "Send a Slack message").
                needs_context = not is_step_title and (
                    category == "context" or (category == "safe" and is_imperative_shaped(term))
                )
                if needs_context and not context_allows(content, s, e, matched_text):
                    continue
                suffix = m.group(1) or ""
                base = matched_text[:len(matched_text) - len(suffix)] if suffix else matched_text
                matches.append(TermMatch(s, e, base, suffix, term))
                bisect.insort(excluded, (s, e))

        return sorted(matches, key=lambda t: t.start)
