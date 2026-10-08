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
     the masked input must appear exactly once in the model output, the
     Markdown structure must match the input (scripts/ja_structure.py: links,
     headings, admonitions, ...), and the response must not be truncated
     (stop_reason). On mismatch the page is
     retried, and if it still fails, the script exits non-zero WITHOUT
     writing the page — a bad translation can never be silently committed.
     This also gives protection a measurable guarantee: a token that
     survives verbatim IS the term surviving verbatim.
  3b. PIN HEADING IDS — each translated heading is given its English heading's
     anchor as an explicit {#id} (scripts/heading_ids.py), so links to
     #anchors keep working after translation.
  4. WRITE — output goes to the Japanese i18n path. Front matter is split
     off and never sent to the model at all, so there's no risk of it
     touching the slug — only the body is translated.

CHANGED PAGES
  When a JA page exists and --base-ref gives the English it was translated
  from, only the sections (cut at every heading, keyed by heading id) and
  frontmatter values whose English changed are sent; every other section
  keeps its Japanese byte for byte, so a one-line edit can't reword the rest
  of the page. Anything unexpected (ids that don't line up, a structure
  mismatch after reassembly) falls back to translating the whole page.

PARTIALS
  Reusable partials (src/partials/*.mdx) are translated exactly like pages,
  into i18n/ja/partials/ (--partials-src-root / --partials-dest-root). They
  are processed first, and every translated page's `@site/src/partials/x.mdx`
  import is repointed at `@site/i18n/ja/partials/x.mdx` when that translated
  partial exists, so a JA page never renders the English partial.

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
import functools
import os
import re
import sys
import time
from collections import Counter

import yaml

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))

from heading_ids import add_english_heading_ids, final_ids, scan, untranslated_headings  # noqa: E402
from ja_structure import structure_issues  # noqa: E402
from nt_terms import TermMatcher  # noqa: E402
import translatable_strings as ts  # noqa: E402

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


LATIN_RE = re.compile(r"[A-Za-z0-9]")
JUNCTION_RE = re.compile(r"(⟦p\d+⟧|[A-Za-z0-9])(?=(⟦p\d+⟧|[A-Za-z0-9]))")


def restore_token_spacing(masked_text, translated, store):
    """Put back the space the model drops next to a token. Japanese has no
    word spaces, so `⟦p1⟧ ⟦p0⟧` comes back as `⟦p1⟧⟦p0⟧` ("OktaSSO") and
    `⟦p0⟧ 13` as `⟦p0⟧13` ("Xcode13"). Runs before unmask: a space goes back
    at a token junction only where the token had whitespace on that side in
    the masked input AND the characters meeting after unmasking are both
    Latin, so suffixes (`⟦p0⟧s`), Japanese text and `**⟦p0⟧**` are untouched."""
    spaced = {(m.group(), side) for m in TOKEN_RE.finditer(masked_text)
              for side, ch in (("before", masked_text[m.start() - 1:m.start()]),
                               ("after", masked_text[m.end():m.end() + 1])) if ch.isspace()}
    full = functools.lru_cache(maxsize=None)(lambda piece: unmask(piece, store))

    def junction(m):
        left, right = m.groups()
        if (left, "after") not in spaced and (right, "before") not in spaced:
            return left
        if LATIN_RE.match(full(left)[-1:]) and LATIN_RE.match(full(right)[:1]):
            return left + " "
        return left

    return JUNCTION_RE.sub(junction, translated)


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
# **Key pair name - *required***: bold whose last words are italic, so the
# span ends in a run of three asterisks. Left to BOLD_SPAN_RE alone, the
# non-greedy match closes on the first two of the three and strands the third,
# producing <strong>...*required</strong>* — an unbalanced emphasis that fails
# MDX compilation.
BOLD_ENDING_IN_ITALIC_RE = re.compile(r"\*\*([^*\n]+?)\*([^*\s][^*\n]*?)\*\*\*(?!\*)")


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
    non-greedy same-line pair at a time. A bold span that ends in an italic
    (**text *italic***) is rewritten first, as <strong>text <em>italic</em>
    </strong>, so its closing *** is not split."""
    text = BOLD_ENDING_IN_ITALIC_RE.sub(
        lambda m: f"<strong>{m.group(1)}<em>{m.group(2)}</em></strong>", text)
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
        "3a. Lines that start with %%name%% (for example `%%fm:title%% Selective builds`) "
        "are separate short strings to translate (page title, description, UI labels). "
        "Translate only the text after the marker, keep the %%name%% marker and put each "
        "on its own line, in the same order. Keep a title short and noun-like, with no "
        "trailing period.",
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
        problems.extend(structure_issues(masked, translated))
        if not problems:
            return translated
        print(f"    attempt {attempt}/{MAX_ATTEMPTS} failed verification: "
              + "; ".join(problems), file=sys.stderr)
    return None


def translate_body(ctx, body, fm_values):
    """Mask, translate, verify and unmask one Markdown body together with the
    frontmatter values in `fm_values`. Returns (japanese_body, {key: japanese})
    or None. Heading ids are pinned by the caller, against the whole page."""
    # Frontmatter values and JSX string props are readable text the masker
    # would otherwise protect; send them as %%key%% lines instead.
    body, jsx_strings = ts.extract_jsx_strings(body)
    store = {}
    masked, n = mask(body, ctx.patterns, store)
    masked, n = mask_terms(masked, ctx.matcher, store, n)
    block = ts.build_block(fm_values, jsx_strings)
    if block:
        block, n = mask(block, ctx.patterns, store, n)
        block, n = mask_terms(block, ctx.matcher, store, n)
        masked = block + "\n\n" + masked
    translated = translate_verified(ctx.client, ctx.model, ctx.sysp, masked)
    if translated is None:
        print(f"    failed verification after {MAX_ATTEMPTS} attempts", file=sys.stderr)
        return None
    # Before the block is split off, so title/description lines get it too.
    translated = restore_token_spacing(masked, translated, store)
    found, translated = ts.parse_block(translated)
    left_english = untranslated_headings(masked, translated)
    if left_english:
        print(f"  warning: {len(left_english)} heading(s) left in English: "
              + "; ".join(h for h in left_english[:5]), file=sys.stderr)
    translated = promote_bold_to_strong(translated.lstrip("\n"))  # pre-unmask: code is still tokens
    translated = unmask(translated, store)
    found = {k: unmask(v, store) for k, v in found.items()}
    if TOKEN_RE.search(translated):
        # Can't happen if verify_tokens passed and the store is sound —
        # belt and braces against a placeholder leaking into the page.
        print("    unresolved placeholder after unmask", file=sys.stderr)
        return None
    fm_tr, js_tr = ts.split_block(found)
    return ts.apply_jsx_strings(translated, jsx_strings, js_tr), fm_tr


def split_sections(body):
    """Cut a body before every heading: [(id, text), ...], where id is the
    anchor Docusaurus gives the heading (explicit {#id} or slug, as
    heading_ids.final_ids computes it) and "" keys the text before the first
    heading. "".join(texts) == body. A ### starts its own section like a ##
    does: ids are unique on a page, so editing one subsection leaves its parent
    and siblings alone."""
    lines = body.split("\n")
    heads = scan(lines)
    cuts = [0] + [h.line for h in heads] + [len(lines)]
    texts = ["".join(line + "\n" for line in lines[a:b]) for a, b in zip(cuts, cuts[1:])]
    texts[-1] = texts[-1][:-1]  # the body has no "\n" after its last line
    return list(zip([""] + final_ids(heads), texts))


def translate_sections(ctx, old_raw, new_raw, ja_raw):
    """Re-translate only what changed since `old_raw`, the English that the
    JA page `ja_raw` matches: new or changed sections (split_sections) and
    frontmatter values. Unchanged sections keep their Japanese byte for byte,
    removed ones are dropped, and the page follows the new English order.
    Returns translate_body()'s (body, fm values), or None when the page must
    be translated whole: section ids repeat or differ between the old English
    and the JA page, the translation fails, or the assembled page's structure
    differs from the English (scripts/ja_structure.py)."""
    (_, old_body), (_, new_body), (_, ja_body) = (
        split_frontmatter(r) for r in (old_raw, new_raw, ja_raw))
    old, new, ja = (split_sections(b) for b in (old_body, new_body, ja_body))
    if [k for k, _ in ja] != [k for k, _ in old] or len(dict(old)) < len(old) or len(dict(new)) < len(new):
        return None
    old, ja, new_text = dict(old), dict(ja), dict(new)
    changed = [k for k, t in new if k not in old or ts.normalized(t) != ts.normalized(old[k])]
    old_fm, new_fm, ja_fm = (ts.extract_frontmatter(split_frontmatter(r)[0])
                             for r in (old_raw, new_raw, ja_raw))
    fm_send = {k: v for k, v in new_fm.items() if old_fm.get(k) != v or k not in ja_fm}
    out, fm_tr = "", {}
    if changed or fm_send:
        print(f"  re-translating {len(changed)} of {len(new)} section(s), "
              f"{len(fm_send)} frontmatter value(s)")
        result = translate_body(ctx, "".join(new_text[k] for k in changed), fm_send)
        if result is None:
            return None
        out, fm_tr = result
    parts = [t for _, t in split_sections(out)]
    if changed[:1] != [""] and parts.pop(0).strip():
        return None  # text before the first heading that no section owns
    if len(parts) != len(changed):
        return None
    # Each translated section ends with the blank lines its English one has.
    done = {k: t.rstrip("\n") + new_text[k][len(new_text[k].rstrip("\n")):]
            for k, t in zip(changed, parts)}
    body = "".join(done.get(k, ja.get(k)) for k, _ in new)
    if structure_issues(new_body, body):
        return None
    return body, {**ja_fm, **fm_tr}


def dest_path(src, src_root, dest_root):
    # map .../<src_root>/rest -> <dest_root>/rest
    marker = f"/{src_root}/"
    if marker in src:
        rest = src.split(marker, 1)[1]
        return os.path.join(dest_root, rest)
    if src.startswith(src_root + "/"):
        return os.path.join(dest_root, src[len(src_root) + 1:])
    raise ValueError(f"{src!r} is not under src_root {src_root!r}")


def route(src, a):
    """Destination path for `src`: partials map to the translated-partials
    root, everything else to the docs root."""
    if src.startswith(a.partials_src_root.rstrip("/") + "/"):
        return dest_path(src, a.partials_src_root, a.partials_dest_root)
    return dest_path(src, a.src_root, a.dest_root)


PARTIAL_IMPORT_RE = re.compile(r"@site/src/partials/([A-Za-z0-9_./-]+\.mdx?)")


def point_imports_at_translated_partials(text, translated_dir, import_prefix):
    """Repoint `@site/src/partials/x.mdx` imports at the translated copy.

    A page's import lines are masked, so the model hands them back unchanged
    and a translated page would keep rendering the ENGLISH partial. Rewrite an
    import only when the translated partial exists, so a page can never end up
    importing a file that isn't there."""
    def sub(m):
        if os.path.isfile(os.path.join(translated_dir, m.group(1))):
            return f"{import_prefix}/{m.group(1)}"
        return m.group(0)
    return PARTIAL_IMPORT_RE.sub(sub, text)


def english_at(base_ref, src):
    """The English page as it was at `base_ref`, or None when unknown (new
    file, git failure)."""
    import subprocess
    try:
        return subprocess.run(["git", "show", f"{base_ref}:{src}"], capture_output=True,
                              text=True, check=True).stdout
    except (subprocess.CalledProcessError, OSError):
        return None


def is_relevant(path):
    return path.endswith((".md", ".mdx")) and "/api-reference/" not in path


def parse_changes(lines):
    """Parse `git diff --name-status` lines into (to_translate, to_delete,
    to_rename). A plain path with no status prefix (no tab) is treated as
    something to translate — the original interface, still used for manual
    CLI invocation (`translate_docs.py file1.mdx file2.mdx`) and preserved
    unchanged.

    Without this, a deleted or renamed English page leaves its Japanese
    translation orphaned forever: the old `--diff-filter=AM` in the
    workflow discarded D and R entries outright, so neither case was ever
    even visible to this script.
    """
    to_translate = []
    to_delete = []
    to_rename = []  # (old, new)
    for line in lines:
        line = line.rstrip("\n")
        if not line:
            continue
        parts = line.split("\t")
        status = parts[0]
        if len(parts) == 1:
            to_translate.append(parts[0])
        elif status.startswith("R"):
            if len(parts) != 3:
                raise ValueError(f"malformed rename line: {line!r}")
            to_rename.append((parts[1], parts[2]))
        elif status == "D":
            to_delete.append(parts[1])
        elif status in ("A", "M"):
            to_translate.append(parts[1])
        else:
            # C (copy), T (typechange), or anything else unrecognized —
            # treat conservatively as "translate", the same as every
            # status used to be handled before this function existed.
            to_translate.append(parts[1])
    return (
        [p for p in to_translate if is_relevant(p)],
        [p for p in to_delete if is_relevant(p)],
        [(o, n) for o, n in to_rename if is_relevant(o) or is_relevant(n)],
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--glossary", required=True)
    ap.add_argument("--preferred", default=None,
                    help="ja-preferred-translations.yaml — optional terminology-consistency map")
    ap.add_argument("--src-root", default="docs")
    ap.add_argument("--dest-root", default="i18n/ja/docusaurus-plugin-content-docs/current")
    ap.add_argument("--partials-src-root", default="src/partials",
                    help="reusable partials; translated like pages")
    ap.add_argument("--partials-dest-root", default="i18n/ja/partials")
    ap.add_argument("--partials-import-prefix", default="@site/i18n/ja/partials",
                    help="import path JA pages use for a translated partial")
    ap.add_argument("--base-ref", default=None,
                    help="git ref the changes are measured against; a page whose English text only "
                         "changed in whitespace there is not re-translated")
    ap.add_argument("files", nargs="*")
    a = ap.parse_args()

    lines = a.files or [l.strip() for l in sys.stdin if l.strip()]
    files, to_delete, to_rename = parse_changes(lines)

    # Deletes and renames are pure filesystem operations — handle them
    # before anything that needs an API key, so a PR that only deletes or
    # moves pages (no content changes) doesn't require one at all.
    for src in to_delete:
        dst = route(src, a)
        if os.path.isfile(dst):
            os.remove(dst)
            print(f"  deleted {dst} (source {src} was deleted)")
        else:
            print(f"  skip delete (no JA counterpart): {src}")

    for old_src, new_src in to_rename:
        old_dst = route(old_src, a)
        new_dst = route(new_src, a)
        if not os.path.isfile(old_dst):
            # Renamed page was never translated in the first place — nothing
            # to move, but the content at its new path still needs a first
            # translation, same as if it had just been added.
            print(f"  skip rename (no JA counterpart): {old_src} -> {new_src}")
            if is_relevant(new_src):
                files.append(new_src)
            continue
        os.makedirs(os.path.dirname(new_dst) or ".", exist_ok=True)
        os.rename(old_dst, new_dst)
        print(f"  moved {old_dst} -> {new_dst} (source renamed {old_src} -> {new_src})")

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
    ctx = argparse.Namespace(client=anthropic.Anthropic(), patterns=patterns, matcher=matcher,
                             model=os.environ.get("TRANSLATE_MODEL", "claude-sonnet-5"),
                             sysp=system_prompt(preferred))

    # Partials first: a page translated in the same run points its imports at
    # the translated partial only if that file already exists.
    partials_prefix = a.partials_src_root.rstrip("/") + "/"
    files.sort(key=lambda p: not p.startswith(partials_prefix))

    # Cost guard: say what this run will spend before spending it, and leave a
    # page alone when its English only changed in whitespace (sync scripts that
    # rewrite files cosmetically would otherwise re-translate everything).
    todo = []
    for src in files:
        if not os.path.isfile(src):
            print(f"  skip (missing): {src}")
            continue
        raw = open(src, encoding="utf-8").read()
        old = english_at(a.base_ref, src) if a.base_ref and os.path.isfile(route(src, a)) else None
        if old is not None and ts.normalized(old) == ts.normalized(raw):
            print(f"  skip (English only changed in whitespace): {src}")
            continue
        todo.append((src, raw, old))
    print(f"Plan: translating {len(todo)} file(s), at most "
          f"{sum(len(r) for _, r, _ in todo):,} characters of English.")

    failures = []
    for src, raw, old in todo:
        dst = route(src, a)
        frontmatter, body = split_frontmatter(raw)
        # With the English the JA page was translated from, only the sections
        # that changed since are sent; anything unexpected falls back to the
        # whole page.
        result = translate_sections(ctx, old, raw, open(dst, encoding="utf-8").read()) if old else None
        if result is None:
            if old:
                print(f"  translating the whole page (sections can't be reused): {src}")
            result = translate_body(ctx, body, ts.extract_frontmatter(frontmatter))
        if result is None:
            print(f"  FAILED, not writing: {src}", file=sys.stderr)
            failures.append(src)
            continue
        translated, fm_tr = result
        # Translated headings get new auto-generated anchors, which breaks
        # every #anchor link written against the English heading. Pin each
        # one to its English id. A page whose headings can't be paired is
        # written unchanged and reported, never guessed at.
        translated, heading_note = add_english_heading_ids(body, translated)
        if heading_note:
            print(f"  warning: heading ids not added to {src}: {heading_note}",
                  file=sys.stderr)
        translated = point_imports_at_translated_partials(
            translated, a.partials_dest_root, a.partials_import_prefix)
        frontmatter = ts.apply_frontmatter(frontmatter, fm_tr)
        os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
        open(dst, "w", encoding="utf-8").write(frontmatter + translated)
        print(f"  translated {src} -> {dst}")

    if failures:
        print(f"\n{len(failures)} file(s) failed verification: "
              + ", ".join(failures), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
