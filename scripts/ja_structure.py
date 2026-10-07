#!/usr/bin/env python3
"""
Structural comparison of a translated page with its English source.

structure_issues() is the one implementation of "did translation keep the
Markdown structure?". translate_docs.py runs it on the masked input vs. the
model output (next to verify_tokens, same retry-then-skip handling); CI runs
`python3 scripts/ja_structure.py` on every committed JA page vs. its
English source, which also checks the frontmatter keys that are never
translated (all but translatable_strings.FM_KEYS) still equal English.

Every check is relative, a count in the translation against the same count
in the source, so whatever the source legitimately contains (reference
links, `:::note[Title]`, a literal `]]`) can never trip it. Fenced code is
compared by block count only; everything else is counted outside it.
"""
import glob
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TREES = [("i18n/ja/docusaurus-plugin-content-docs/current", "docs"), ("i18n/ja/partials", "src/partials")]

FENCE_RE = re.compile(r"^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$", re.M)
# [text](target) / ![alt](target); one level of nested [] in the text and of
# () in the target.
LINK_RE = re.compile(r"!?\[(?:[^\[\]\n]|\[[^\[\]\n]*\])*\]\((?:[^()\n]|\([^()\n]*\))*\)")
HEADING_RE = re.compile(r"^#{1,6}[ \t]", re.M)
ADMONITION_RE = re.compile(r"^[ \t>]*:::", re.M)
TOKEN_RE = re.compile(r"⟦p\d+⟧")
MARKER_RE = re.compile(r"^%%[^%\n]+%%", re.M)


def orphan_link_closers(text):
    """`](` with no unmatched `[` before it on its line."""
    n = 0
    for line in text.split("\n"):
        depth = 0
        for i, ch in enumerate(line):
            if ch == "[":
                depth += 1
            elif ch == "]":
                n += depth == 0 and line.startswith("](", i)
                depth = max(depth - 1, 0)
    return n


COUNTS = {
    "Markdown links/images": lambda t: len(LINK_RE.findall(t)),
    "']](' links": lambda t: t.count("]]("),
    "'](' without '['": orphan_link_closers,
    "headings": lambda t: len(HEADING_RE.findall(t)),
    "admonition ':::' lines": lambda t: len(ADMONITION_RE.findall(t)),
    "placeholder tokens": lambda t: len(TOKEN_RE.findall(t)),
    "%%marker%% lines": lambda t: len(MARKER_RE.findall(t)),
}


def structure_issues(source, translated):
    """One message per structural count that differs; [] when all match."""
    problems = []
    fences = len(FENCE_RE.findall(source)), len(FENCE_RE.findall(translated))
    if fences[0] != fences[1]:
        problems.append(f"fenced code blocks: {fences[0]} in source, {fences[1]} in translation")
    source, translated = FENCE_RE.sub("", source), FENCE_RE.sub("", translated)
    for name, count in COUNTS.items():
        want, got = count(source), count(translated)
        if want != got:
            problems.append(f"{name}: {want} in source, {got} in translation")
    return problems


def check_committed_pages():
    """Every JA page against its English source; prints GitHub annotations."""
    sys.path.insert(0, os.path.join(ROOT, ".github", "scripts"))
    from translate_docs import split_frontmatter
    from translatable_strings import FM_KEYS
    count = 0
    for ja_root, en_root in TREES:
        for ja in sorted(glob.glob(f"{ROOT}/{ja_root}/**/*.md*", recursive=True)):
            en = ja.replace(f"/{ja_root}/", f"/{en_root}/", 1)
            if not os.path.isfile(en):
                continue
            (en_fm, en_body), (ja_fm, ja_body) = (
                split_frontmatter(open(p, encoding="utf-8").read()) for p in (en, ja))
            problems = structure_issues(en_body, ja_body)
            en_meta, ja_meta = (next(yaml.safe_load_all(fm), None) or {} for fm in (en_fm, ja_fm))
            problems += [f"frontmatter {k}: {ja_meta.get(k)!r}, English has {en_meta.get(k)!r}"
                         for k in sorted(set(en_meta) | set(ja_meta))
                         if k not in FM_KEYS and en_meta.get(k) != ja_meta.get(k)]
            for problem in problems:
                print(f"::error file={os.path.relpath(ja, ROOT)}::{problem}")
            count += len(problems)
    print(f"{count} structural problem(s) in JA pages")
    return 1 if count else 0


if __name__ == "__main__":
    sys.exit(check_committed_pages())
