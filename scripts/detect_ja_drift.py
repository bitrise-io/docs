#!/usr/bin/env python3
"""
Find English pages whose Japanese page is missing or out of date.

Run from a checkout (a worktree on origin/main in the scheduled task) and prints
a JSON report:

  missing  English pages with no JA counterpart
  stale    pages whose English changed since the JA page was last written. The
           English the JA page matches is taken to be the English as of the last
           commit that touched the JA file (`ja_commit`); a page is stale only
           when today's English differs from that one by more than whitespace.
           Comparing content rather than commit dates keeps a cosmetic English
           commit, or an English edit that landed in the same commit as its
           translation, from being reported.
  orphan   JA pages whose English source no longer exists (reported, never
           deleted here)

Covered: docs/**/*.md(x) and src/partials/*.mdx. Not covered: generated API
reference pages (anything under /api-reference/, the same rule translate_docs.py
uses in is_relevant()).

Usage:
    python3 scripts/detect_ja_drift.py [--limit N] [--out drift.json]

--limit caps how many pages are listed for translation (partials first, then
stale pages, then missing ones), so one run stays reviewable; `counts` always
reports the full backlog.
"""
import argparse
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, ".github", "scripts"))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

from translate_docs import is_relevant, split_frontmatter  # noqa: E402,F401
import translatable_strings as ts  # noqa: E402

TREES = [  # (English root, Japanese root)
    ("src/partials", "i18n/ja/partials"),
    ("docs", "i18n/ja/docusaurus-plugin-content-docs/current"),
]


def git(*args):
    return subprocess.run(["git", "-C", ROOT, *args], capture_output=True, text=True)


def pages(root):
    """Repo-relative paths of every .md/.mdx under `root`."""
    found = []
    for base, _, names in os.walk(os.path.join(ROOT, root)):
        for n in names:
            if n.endswith((".md", ".mdx")):
                found.append(os.path.relpath(os.path.join(base, n), ROOT))
    return sorted(found)


def english_to_ja(path):
    for en_root, ja_root in TREES:
        if path.startswith(en_root + "/"):
            return ja_root + path[len(en_root):]
    raise ValueError(path)


def last_commit(path):
    out = git("log", "-1", "--format=%H", "--", path).stdout.strip()
    return out or None


def english_at(commit, path):
    r = git("show", f"{commit}:{path}")
    return r.stdout if r.returncode == 0 else None


def detect():
    missing, stale, orphan = [], [], []
    for en_root, ja_root in TREES:
        for en in pages(en_root):
            if not is_relevant(en):
                continue
            ja = english_to_ja(en)
            if not os.path.isfile(os.path.join(ROOT, ja)):
                missing.append({"src": en, "dst": ja})
                continue
            commit = last_commit(ja)
            if not commit:
                continue  # uncommitted JA page: can't say what it matches
            then = english_at(commit, en)
            now = open(os.path.join(ROOT, en), encoding="utf-8").read()
            if then is None:
                # The English didn't exist yet at that commit: JA came first.
                stale.append({"src": en, "dst": ja, "ja_commit": commit, "reason": "no English at ja_commit"})
            elif ts.normalized(then) != ts.normalized(now):
                stale.append({"src": en, "dst": ja, "ja_commit": commit, "reason": "English changed since"})
        for ja in pages(ja_root):
            en = en_root + ja[len(ja_root):]
            if not os.path.isfile(os.path.join(ROOT, en)):
                orphan.append({"dst": ja, "missing_src": en})
    return missing, stale, orphan


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="max pages to list for translation (0 = all)")
    ap.add_argument("--out", default=None, help="write the JSON here as well as to stdout")
    a = ap.parse_args()

    missing, stale, orphan = detect()
    todo = [dict(p, kind="stale") for p in stale] + [dict(p, kind="missing") for p in missing]
    todo.sort(key=lambda p: not p["src"].startswith("src/partials/"))  # stable: partials first
    selected = todo[:a.limit] if a.limit else todo
    report = {
        "head": git("rev-parse", "HEAD").stdout.strip(),
        "counts": {"missing": len(missing), "stale": len(stale), "orphan": len(orphan),
                   "selected": len(selected)},
        "translate": selected,
        "orphan": orphan,
    }
    text = json.dumps(report, indent=2, ensure_ascii=False)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            f.write(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
