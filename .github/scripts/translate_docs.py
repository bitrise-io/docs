#!/usr/bin/env python3
"""
translate_docs.py  —  translate changed English docs to Japanese
=====================================================================
Given a list of changed English Markdown files, translate each to Japanese
with the Claude API. Do-not-translate enforcement is now STRUCTURAL: product
names, UI labels, Step names, and other Bitrise-specific terms are tagged
directly in the docs source with <NT>...</NT> (see scripts/add_notranslate_tags.py
and src/components/NT), so this script never has to instruct the model to
avoid a giant list of words — it just masks the tag out entirely, the same
way it already masks code and URLs.

Design:
  1. MASK — protect_patterns (code, URLs, <NT> spans, env vars, filenames,
     MDX, admonitions, templates) are replaced with placeholder tokens
     BEFORE the model sees the text, then restored after. The model
     literally cannot see, let alone alter, anything inside them.
  2. INSTRUCT — a short system prompt: translate naturally, preserve
     structure, never touch a placeholder token. Optionally, a preferred-
     translations map (terms we DO translate, but want rendered the same
     way everywhere — see ja-preferred-translations.yaml) is injected too.
  3. WRITE — output goes to the Japanese i18n path. Front matter is split
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

import yaml


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


def mask(text, patterns):
    """Replace every protect_pattern match with a placeholder token, applying
    patterns in order (NT spans before generic MDX tags — see
    build_ui_library.py's PROTECT_PATTERNS comment for why order matters).
    Tokens use a lowercase prefix so they can never themselves be re-matched
    by a later pattern (the env_var pattern matches "P34"-shaped substrings —
    an uppercase prefix collided with its own placeholders in testing)."""
    store = {}
    n = 0

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
    return text, store


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
        "Japanese doesn't inflect nouns for number).",
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
    msg = client.messages.create(
        model=model, max_tokens=8000, system=sysp,
        messages=[{"role": "user", "content": text}])
    return "".join(b.text for b in msg.content if getattr(b, "type", None) == "text")


def dest_path(src, src_root, dest_root):
    # map .../<src_root>/rest -> <dest_root>/rest ; fallback: swap /en/ -> /ja/
    marker = f"/{src_root}/"
    if marker in src:
        rest = src.split(marker, 1)[1]
        return os.path.join(dest_root, rest)
    if src.startswith(src_root + "/"):
        return os.path.join(dest_root, src[len(src_root) + 1:])
    return src.replace("/en/", "/ja/")


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
    if not files:
        print("No markdown files to translate.")
        return

    try:
        import anthropic
    except ImportError:
        print("pip install anthropic", file=sys.stderr)
        sys.exit(1)
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    patterns = load_protect_patterns(a.glossary)
    preferred = load_preferred_translations(a.preferred)
    client = anthropic.Anthropic()
    model = os.environ.get("TRANSLATE_MODEL", "claude-sonnet-5")
    sysp = system_prompt(preferred)

    for src in files:
        if not os.path.isfile(src):
            print(f"  skip (missing): {src}")
            continue
        raw = open(src, encoding="utf-8").read()
        frontmatter, body = split_frontmatter(raw)
        masked, store = mask(body, patterns)
        translated = translate_text(client, model, sysp, masked)
        translated = unmask(translated, store)
        dst = dest_path(src, a.src_root, a.dest_root)
        os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
        open(dst, "w", encoding="utf-8").write(frontmatter + translated)
        print(f"  translated {src} -> {dst}")


if __name__ == "__main__":
    main()
