#!/usr/bin/env python3
"""
translate_docs.py  —  translate changed English docs to Japanese
=====================================================================
Given a list of changed English Markdown files, translate each to Japanese
with the Claude API. Do-not-translate enforcement is LIST-DRIVEN and
STRUCTURAL: the tiered term lists in the glossary (product names, UI labels,
Step names, Bitrise concepts — see localization/ja-do-not-translate-glossary.yaml)
are compiled into masking regexes at translation time via the shared matcher
in scripts/nt_terms.py, and every term occurrence is masked out of the text
the same way code and URLs are — the docs source itself stays free of
translation markup. A manual <NT>...</NT> wrapper in the source (the rare
page-specific escape hatch — see scripts/add_notranslate_tags.py) is masked
too, before any term matching runs, so it always wins.

Design:
  1. MASK — two passes, one placeholder-token store:
       a. protect_patterns (code, URLs, <NT> spans, env vars, filenames,
          MDX, admonitions, import lines, heading anchors, templates) are
          replaced with placeholder tokens. Structural, protects by shape.
       b. every glossary-term match (scripts/nt_terms.py — with all of its
          disambiguation: Title-Case gating for ambiguous single words,
          context gating for UI labels, canonical steplib Step titles,
          exact-case acronyms/code literals) is masked the same way. An
          inflectional suffix ("s", "'s") stays OUTSIDE the token, visible
          to the model, so it can be dropped or rendered as Japanese grammar.
     The model literally cannot see, let alone alter, anything masked.
  2. INSTRUCT — a short system prompt: translate naturally, preserve
     structure, never touch a placeholder token. Optionally, a preferred-
     translations map (terms we DO translate, but want rendered the same
     way everywhere — see ja-preferred-translations.yaml) is injected too.
  3. VERIFY — deterministic post-check: every placeholder token visible in
     the masked input must appear exactly once in the model output, and the
     response must not be truncated (stop_reason). On mismatch the page is
     retried, and if it still fails, the script exits non-zero WITHOUT
     writing the page — a bad translation can never be silently committed.
     This also gives protection a measurable guarantee: a token that
     survives verbatim IS the term surviving verbatim.
  4. WRITE — output goes to the Japanese i18n path. Front matter is split
     off and never sent to the model at all, so there's no risk of it
     touching the slug — only the body is translated.

USAGE
  python3 translate_docs.py \
      --glossary ja-do-not-translate-glossary.yaml \
      --preferred ja-preferred-translations.yaml \
      --src-root docs --dest-root i18n/ja/docusaurus-plugin-content-docs/current \
      file1.mdx file2.mdx ...

  # or read changed files from stdin (one per line) — see the workflow.

ENV
  ANTHROPIC_API_KEY  (required)
  TRANSLATE_MODEL    (optional, default claude-sonnet-5)

REQUIREMENTS
  pip install anthropic pyyaml
"""
import argparse
import os
import re
import sys
import time
from collections import Counter

import yaml

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))

from nt_terms import TermMatcher  # noqa: E402

TOKEN_RE = re.compile(r"⟦p\d+⟧")
MAX_ATTEMPTS = 3


def load_protect_patterns(glossary_path):
    data = yaml.safe_load(open(glossary_path, encoding="utf-8"))
    return [(p["name"], p["regex"]) for p in data.get("protect_patterns", [])]


def load_preferred_translations(preferred_path):
    if not preferred_path or not os.path.isfile(preferred_path):
        return {}
    data = yaml.safe_load(open(preferred_path, encoding="utf-8")) or {}
    return data.get("preferred_translations", {}) or {}


def split_frontmatter(content):
    m = re.match(r"^(---\r?\n.*?\r?\n---\r?\n)", content, re.DOTALL)
    if m:
        return m.group(1), content[m.end():]
    return "", content


def mask(text, patterns, store, n=0):
    """Replace every protect_pattern match with a placeholder token, applying
    patterns in order (NT spans before generic MDX tags — see
    build_ui_library.py's PROTECT_PATTERNS comment for why order matters).
    Tokens use a lowercase prefix so they can never themselves be re-matched
    by a later pattern (the env_var pattern matches "P34"-shaped substrings —
    an uppercase prefix collided with its own placeholders in testing)."""
    def make_repl():
        nonlocal n

        def repl(m):
            nonlocal n
            tok = f"⟦p{n}⟧"
            store[tok] = m.group(0)
            n += 1
            return tok

        return repl

    for _, rx in patterns:
        text = re.sub(rx, make_repl(), text)
    return text, n


def mask_terms(text, matcher, store, n):
    """Mask every glossary-term match the same way mask() masks structural
    patterns, continuing the same token store/counter. Runs AFTER the
    structural pass, so code, URLs, and manual <NT> spans are already tokens
    (a term inside them can't double-match — tokens are lowercase p+digits).
    Only the base term becomes the token; an inflectional suffix stays
    visible so the model can drop it or express it as Japanese grammar.
    All matches are found on the unmodified text first, then applied in
    reverse document order, so context lookarounds (e.g. "project" requiring
    a preceding "Bitrise ") see real text, never a half-masked line."""
    matches = matcher.find_matches(text)
    for tm in sorted(matches, key=lambda t: t.start, reverse=True):
        tok = f"⟦p{n}⟧"
        store[tok] = tm.base
        n += 1
        text = text[:tm.start] + tok + tm.suffix + text[tm.end:]
    return text, n


def unmask(text, store):
    """Restore tokens in REVERSE creation order. A token's stored value can
    itself contain an earlier (lower-numbered) token as literal text — e.g.
    an <NT> span captured after inline code inside it was already masked.
    Replacing later tokens first reveals any nested inner token text, which
    the rest of this same descending pass then resolves in turn. A forward
    pass would miss this: by the time a later token's replacement
    reintroduces an earlier token's placeholder, that token is already
    behind us in the loop."""
    def token_number(tok):
        return int(tok.strip("⟦⟧p"))

    for tok in sorted(store, key=token_number, reverse=True):
        text = text.replace(tok, store[tok])
    return text


def verify_tokens(masked_text, translated):
    """Deterministic protection check: every placeholder token visible in the
    masked input must appear in the model output exactly as many times as in
    the input (i.e. once — tokens are unique). A missing token means the
    model dropped protected content (or the output was truncated); an
    unexpected token means it duplicated or invented one. Nested tokens
    (inside another token's stored value) are invisible in the masked text,
    so comparing against the masked text — not the store — is exact."""
    want = Counter(TOKEN_RE.findall(masked_text))
    got = Counter(TOKEN_RE.findall(translated))
    problems = []
    missing = want - got
    extra = got - want
    if missing:
        problems.append(f"missing tokens: {', '.join(sorted(missing.elements())[:10])}"
                        + (" …" if sum(missing.values()) > 10 else ""))
    if extra:
        problems.append(f"unexpected tokens: {', '.join(sorted(extra.elements())[:10])}"
                        + (" …" if sum(extra.values()) > 10 else ""))
    return problems


BOLD_SPAN_RE = re.compile(r"\*\*(.+?)\*\*")


def promote_bold_to_strong(text):
    """Rewrite every **...** pair in the translated text to
    <strong>...</strong>.

    Markdown's ** emphasis is CommonMark-delimiter-based: it depends on
    whitespace/punctuation adjacent to the ** run to disambiguate which pair
    of ** matches which. Japanese (and other languages with no inter-word
    spaces) routinely puts a bold span hard against the surrounding text
    with nothing but a particle between spans, e.g. **⟦p3⟧**で**⟦p7⟧**を...
    — this reliably breaks remark/MDX's delimiter matching (verified against
    a real build: bold gets attached to the wrong span and a literal **
    leaks into the rendered page). Swapping to a literal <strong> JSX
    element sidesteps delimiter matching entirely — deterministic, not
    dependent on the model or on surrounding whitespace.

    MUST run on the translated text BEFORE unmasking: at that point fenced
    code, inline code, and URLs are still placeholder tokens, so a literal
    ** inside restored code can never be caught by this rewrite. Matches one
    non-greedy same-line pair at a time."""
    return BOLD_SPAN_RE.sub(lambda m: f"<strong>{m.group(1)}</strong>", text)


def system_prompt(preferred):
    parts = [
        "You are a professional technical translator localizing Bitrise developer "
        "documentation from English to Japanese.",
        "STYLE (house standard, based on the JTF Japanese Standard Style Guide):\n"
        "- Register: polite です・ます調 throughout; phrase instructions as 〜してください / 〜します. "
        "Do not mix in plain だ・である style. Keep honorifics light and neutral (no heavy keigo).\n"
        "- Orthography: full-width Japanese punctuation (。 、); keep the long-vowel mark on katakana "
        "loanwords (サーバー, not サーバ); half-width numerals; keep embedded English/product terms in "
        "Latin script inside the Japanese sentence.\n"
        "- Voice: clear and instructional; it is natural to omit the subject — do not force 「あなた」.",
        "RULES:",
        "1. Translate prose into natural, professional Japanese following the STYLE above.",
        "2. Never alter placeholder tokens shaped like ⟦p0⟧, ⟦p1⟧ — keep them "
        "exactly and in place. Restructure the surrounding sentence grammar as "
        "needed around them (e.g. use の for possession instead of reproducing "
        "an English possessive \"'s\", and don't add a Japanese plural marker — "
        "Japanese doesn't inflect nouns for number). An English inflectional "
        "suffix left dangling right after a token (⟦p3⟧s, ⟦p3⟧'s) is English "
        "grammar, not content — drop it or express it in Japanese instead.",
        "3. Preserve all Markdown/MDX structure: headings, lists, bold/italic, "
        "links, table structure, admonition (:::type[...]) syntax.",
    ]
    if preferred:
        parts.append(
            "4. The following English terms ARE translated (they are not "
            "protected), but must use EXACTLY this Japanese rendering every "
            "time, for consistency across pages:\n"
            + "\n".join(f"   - \"{en}\" → {ja}" for en, ja in sorted(preferred.items()))
        )
    parts.append(
        "Output ONLY the translated Markdown, nothing else — no preamble, "
        "no code fence around the whole output."
    )
    return "\n".join(parts)


def translate_text(client, model, sysp, text):
    # Streamed because the SDK refuses non-streaming requests whose
    # max_tokens implies a >10 min worst case — 32k output tokens does.
    with client.messages.stream(
            model=model, max_tokens=32000, system=sysp,
            messages=[{"role": "user", "content": text}]) as stream:
        msg = stream.get_final_message()
    out = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text")
    return out, msg.stop_reason


def translate_verified(client, model, sysp, masked):
    """Translate with the deterministic post-check, retrying on failure.
    Transient API errors (429s, 5xx — beyond the SDK's own retries) count as
    failed attempts too, with a linear backoff, instead of crashing the run.
    Returns the verified translation, or None if every attempt failed."""
    import anthropic
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            translated, stop_reason = translate_text(client, model, sysp, masked)
        except (anthropic.APIStatusError, anthropic.APIConnectionError) as e:
            print(f"    attempt {attempt}/{MAX_ATTEMPTS} API error: {e}", file=sys.stderr)
            if attempt < MAX_ATTEMPTS:
                delay = 30 * attempt
                print(f"    backing off {delay}s", file=sys.stderr)
                time.sleep(delay)
            continue
        problems = []
        if stop_reason != "end_turn":
            problems.append(f"stop_reason={stop_reason!r} (output truncated?)")
        problems.extend(verify_tokens(masked, translated))
        if not problems:
            return translated
        print(f"    attempt {attempt}/{MAX_ATTEMPTS} failed verification: "
              + "; ".join(problems), file=sys.stderr)
    return None


def dest_path(src, src_root, dest_root):
    # map .../<src_root>/rest -> <dest_root>/rest
    marker = f"/{src_root}/"
    if marker in src:
        rest = src.split(marker, 1)[1]
        return os.path.join(dest_root, rest)
    if src.startswith(src_root + "/"):
        return os.path.join(dest_root, src[len(src_root) + 1:])
    raise ValueError(f"{src!r} is not under src_root {src_root!r}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--glossary", required=True)
    ap.add_argument("--preferred", default=None,
                    help="ja-preferred-translations.yaml — optional terminology-consistency map")
    ap.add_argument("--src-root", default="docs")
    ap.add_argument("--dest-root", default="i18n/ja/docusaurus-plugin-content-docs/current")
    ap.add_argument("files", nargs="*")
    a = ap.parse_args()

    files = a.files or [l.strip() for l in sys.stdin if l.strip()]
    files = [f for f in files if f.endswith((".md", ".mdx"))]
    excluded = [f for f in files if "/api-reference/" in f]
    files = [f for f in files if f not in excluded]
    for f in excluded:
        print(f"  skip (auto-generated API reference, out of scope): {f}")
    if not files:
        print("No markdown files to translate.")
        return

    try:
        import anthropic
    except ImportError:
        print("pip install anthropic", file=sys.stderr)
        sys.exit(1)
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        # The SDK picks up either automatically: an API key (CI) is sent as
        # x-api-key, an OAuth token (local runs) as a Bearer header.
        print("neither ANTHROPIC_API_KEY nor ANTHROPIC_AUTH_TOKEN is set", file=sys.stderr)
        sys.exit(1)

    patterns = load_protect_patterns(a.glossary)
    # include_acronyms: masking "CI"/"UI"/"PR" at translation time costs
    # nothing (unlike tagging them in source, which would be noise), and the
    # env_var protect pattern only catches 3+ char ALL-CAPS runs.
    matcher = TermMatcher(a.glossary, include_acronyms=True)
    preferred = load_preferred_translations(a.preferred)
    client = anthropic.Anthropic()
    model = os.environ.get("TRANSLATE_MODEL", "claude-sonnet-5")
    sysp = system_prompt(preferred)

    failures = []
    for src in files:
        if not os.path.isfile(src):
            print(f"  skip (missing): {src}")
            continue
        raw = open(src, encoding="utf-8").read()
        frontmatter, body = split_frontmatter(raw)
        store = {}
        masked, n = mask(body, patterns, store)
        masked, n = mask_terms(masked, matcher, store, n)
        translated = translate_verified(client, model, sysp, masked)
        if translated is None:
            print(f"  FAILED verification after {MAX_ATTEMPTS} attempts, not writing: {src}",
                  file=sys.stderr)
            failures.append(src)
            continue
        translated = promote_bold_to_strong(translated)  # pre-unmask: code is still tokens
        translated = unmask(translated, store)
        if TOKEN_RE.search(translated):
            # Can't happen if verify_tokens passed and the store is sound —
            # belt and braces against a placeholder leaking into the page.
            print(f"  FAILED: unresolved placeholder after unmask, not writing: {src}",
                  file=sys.stderr)
            failures.append(src)
            continue
        dst = dest_path(src, a.src_root, a.dest_root)
        os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
        open(dst, "w", encoding="utf-8").write(frontmatter + translated)
        print(f"  translated {src} -> {dst}")

    if failures:
        print(f"\n{len(failures)} file(s) failed verification: "
              + ", ".join(failures), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
