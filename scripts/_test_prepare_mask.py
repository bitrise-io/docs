#!/usr/bin/env python3
"""Scratch helper for a local translation timing/token test.
Reuses translate_docs.py's own mask()/mask_terms()/system_prompt() logic,
dumps one masked-body + system-prompt pair per input file, plus a JSON
store, into --out-dir. Does NOT call any API.
"""
import argparse
import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, ".github", "scripts"))
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))

from translate_docs import (  # noqa: E402
    load_protect_patterns, load_preferred_translations, split_frontmatter,
    mask, mask_terms, system_prompt,
)
from nt_terms import TermMatcher  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--glossary", required=True)
    ap.add_argument("--preferred", default=None)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("files", nargs="+")
    a = ap.parse_args()

    os.makedirs(a.out_dir, exist_ok=True)
    patterns = load_protect_patterns(a.glossary)
    matcher = TermMatcher(a.glossary, include_acronyms=True)
    preferred = load_preferred_translations(a.preferred)
    sysp = system_prompt(preferred)
    with open(os.path.join(a.out_dir, "system_prompt.txt"), "w", encoding="utf-8") as f:
        f.write(sysp)

    manifest = []
    for idx, src in enumerate(a.files):
        raw = open(src, encoding="utf-8").read()
        frontmatter, body = split_frontmatter(raw)
        store = {}
        masked, n = mask(body, patterns, store)
        masked, n = mask_terms(masked, matcher, store, n)
        base = f"file{idx:02d}"
        with open(os.path.join(a.out_dir, base + ".masked.md"), "w", encoding="utf-8") as f:
            f.write(masked)
        with open(os.path.join(a.out_dir, base + ".store.json"), "w", encoding="utf-8") as f:
            json.dump(store, f, ensure_ascii=False, indent=1)
        with open(os.path.join(a.out_dir, base + ".frontmatter.txt"), "w", encoding="utf-8") as f:
            f.write(frontmatter)
        manifest.append({"src": src, "base": base, "char_len": len(masked)})
        print(f"  prepared {src} -> {base} ({len(masked)} chars masked)")

    with open(os.path.join(a.out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=1)


if __name__ == "__main__":
    main()
