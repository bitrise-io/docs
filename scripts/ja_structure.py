#!/usr/bin/env python3
"""
Structural comparison of a translated page with its English source.

structure_issues() is the one implementation of "did translation keep the
Markdown structure?". translate_docs.py runs it on the masked input vs. the
model output (next to verify_tokens, same retry-then-skip handling).

Every check is relative, a count in the translation against the same count
in the source, so whatever the source legitimately contains (reference
links, `:::note[Title]`, a literal `]]`) can never trip it. Fenced code is
compared by block count only; everything else is counted outside it.
"""
import re

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
