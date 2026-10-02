#!/usr/bin/env python3
"""
heading_ids.py  —  keep English heading anchors on translated pages
=====================================================================
Docusaurus builds a heading's anchor from its text (github-slugger). Once a
heading is translated its anchor changes, so every `#anchor` link written
against the English heading breaks. The fix is to give each translated
heading the explicit id its English counterpart has:

    ## キャッシュのプッシュモード {#cache-push-mode}

Docusaurus supports this syntax natively; headings that already carry an
explicit `{#id}` are left alone.

This module is shared by two callers:
  * .github/scripts/translate_docs.py calls add_english_heading_ids() on every
    page it translates, so new translations are correct from the start.
  * Run as a script, it repairs pages that were translated without it:

        python3 scripts/heading_ids.py --check    # report only, exit 1 if work is needed
        python3 scripts/heading_ids.py --write    # apply

How ids are derived
  1. Headings are paired by position between the English and Japanese file.
     If the counts or levels differ the page is skipped and reported, never
     guessed at.
  2. The id is the English heading's explicit `{#id}` if it has one, otherwise
     the github-slugger slug of its plain text, numbered -1, -2, ... for
     duplicates exactly as Docusaurus numbers them.
  3. A Japanese heading only gets an id when its own auto-generated anchor
     would differ, so headings left in English stay untouched.
  4. Because explicit ids do not consume slugger numbers, the page is
     re-simulated after the edit and any heading whose final anchor still
     differs from English also gets an explicit id.

Headings inside fenced code blocks (shell comments such as `# [start] ...`)
are not headings and are skipped.
"""
import argparse
import os
import re
import sys
import unicodedata

FENCE_RE = re.compile(r"^[ \t]*(`{3,}|~{3,})")
ATX_RE = re.compile(r"^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$")
EXPLICIT_ID_RE = re.compile(r"[ \t]*\{#([^}\s]+)\}[ \t]*$")


def _keep(ch):
    """github-slugger keeps letters, marks, numbers, '-', '_' and space."""
    if ch in "-_ ":
        return True
    return unicodedata.category(ch)[0] in ("L", "M", "N")


def slugify(text):
    """github-slugger's slug() (lower-case, drop non word characters, spaces to -)."""
    return "".join(c for c in text.lower() if _keep(c)).replace(" ", "-")


class Slugger:
    """github-slugger's per-document slugger: duplicates become slug-1, slug-2."""

    def __init__(self):
        self.occurrences = {}

    def slug(self, text):
        base = slugify(text)
        slug = base
        while slug in self.occurrences:
            self.occurrences[base] += 1
            slug = f"{base}-{self.occurrences[base]}"
        self.occurrences[slug] = 0
        return slug


_IMAGE_RE = re.compile(r"!\[([^\]]*)\]\([^)]*\)")
_LINK_RE = re.compile(r"\[([^\]]*)\]\([^)]*\)")
_CODE_RE = re.compile(r"`([^`]*)`")
_TAG_RE = re.compile(r"</?[A-Za-z][^>]*>")
_UNDERSCORE_EM_RE = re.compile(r"(?<![A-Za-z0-9])_([^_]+)_(?![A-Za-z0-9])")
_ESCAPE_RE = re.compile(r"\\([!-/:-@\[-`{-~])")


def plain_text(raw):
    """Heading markdown -> the plain text Docusaurus slugs (mdast toString)."""
    t = EXPLICIT_ID_RE.sub("", raw)
    t = _IMAGE_RE.sub(r"\1", t)
    t = _LINK_RE.sub(r"\1", t)
    t = _CODE_RE.sub(r"\1", t)
    t = _TAG_RE.sub("", t)
    t = _UNDERSCORE_EM_RE.sub(r"\1", t)
    t = _ESCAPE_RE.sub(r"\1", t)
    return t


class Heading:
    __slots__ = ("line", "level", "raw", "explicit")

    def __init__(self, line, level, raw, explicit):
        self.line, self.level, self.raw, self.explicit = line, level, raw, explicit


def scan(lines):
    """Return the ATX headings in `lines`, skipping fenced code blocks."""
    out, fence = [], None
    for i, line in enumerate(lines):
        line = line.rstrip("\r")
        m = FENCE_RE.match(line)
        if m:
            marker = m.group(1)
            if fence is None:
                fence = (marker[0], len(marker))
            elif marker[0] == fence[0] and len(marker) >= fence[1]:
                fence = None
            continue
        if fence is not None:
            continue
        m = ATX_RE.match(line)
        if m:
            em = EXPLICIT_ID_RE.search(m.group(2))
            out.append(Heading(i, len(m.group(1)), m.group(2), em.group(1) if em else None))
    return out


def final_ids(headings):
    """The id Docusaurus will give each heading (explicit ids skip the slugger)."""
    sl, ids = Slugger(), []
    for h in headings:
        ids.append(h.explicit if h.explicit else sl.slug(plain_text(h.raw)))
    return ids


_ANY_ID_RE = re.compile(r"[ \t]*\{#([^}\s]+)\}")


def relocate_inline_anchors(lines):
    """Move a heading's {#id} to the end of its line, in place.

    The id is masked as a placeholder token during translation, and a model may
    legally reorder tokens, so it sometimes lands mid-heading
    ("Bitrise CLI {#id}が公開する Env Vars"). Docusaurus only reads an id at the
    very end of the line and MDX rejects the stray braces, so the page would not
    compile. Returns True if any line changed.
    """
    changed = False
    for h in scan(lines):
        ids = _ANY_ID_RE.findall(h.raw)
        if not ids or (len(ids) == 1 and h.explicit):
            continue
        line = lines[h.line].rstrip("\r")
        cr = lines[h.line][len(line):]
        prefix = re.match(r"^ {0,3}#{1,6}[ \t]+", line).group(0)
        text = _ANY_ID_RE.sub("", h.raw).rstrip()
        lines[h.line] = f"{prefix}{text} {{#{ids[0]}}}{cr}"
        changed = True
    return changed


def add_english_heading_ids(src_text, ja_text):
    """Give translated headings the explicit id of their English counterpart.

    Returns (new_ja_text, note). `note` is None on success, or a short reason
    when the page was left untouched because the headings could not be paired.
    """
    src_lines = src_text.split("\n")
    ja_lines = ja_text.split("\n")
    relocated = relocate_inline_anchors(ja_lines)
    if relocated:
        ja_text = "\n".join(ja_lines)
    src, ja = scan(src_lines), scan(ja_lines)
    if len(src) != len(ja):
        return ja_text, f"heading count differs (en {len(src)}, ja {len(ja)})"
    for n, (s, j) in enumerate(zip(src, ja), 1):
        if s.level != j.level:
            return ja_text, f"heading #{n} level differs (en h{s.level}, ja h{j.level})"

    target = final_ids(src)
    add = {}
    # Adding an explicit id changes what the remaining headings are numbered
    # as, so re-simulate until every heading resolves to its English id.
    for _ in range(len(ja) + 1):
        trial = [Heading(h.line, h.level, h.raw, h.explicit or add.get(k)) for k, h in enumerate(ja)]
        got = final_ids(trial)
        bad = [k for k, (g, t) in enumerate(zip(got, target)) if g != t and k not in add]
        if not bad:
            break
        for k in bad:
            if ja[k].explicit is None:
                add[k] = target[k]
    else:
        return ja_text, "heading ids did not converge"
    if not add:
        return ja_text, None
    for k, hid in add.items():
        i = ja[k].line
        stripped = ja_lines[i].rstrip("\r")
        cr = ja_lines[i][len(stripped):]
        ja_lines[i] = f"{stripped} {{#{hid}}}{cr}"
    return "\n".join(ja_lines), None


_TOKEN_RE = re.compile(r"⟦p\d+⟧")


def untranslated_headings(masked, translated):
    """Headings the model handed back word-for-word.

    Compares the masked input with the model output heading by heading (same
    position). A heading counts as left in English when its text is unchanged and
    still holds a real English word once protected tokens are removed; a heading
    made only of tokens (a product name) is fine. Returns [text, ...]; a page
    whose heading counts differ returns [] (the id pairing reports that).
    """
    a, b = scan(masked.split("\n")), scan(translated.split("\n"))
    if len(a) != len(b):
        return []
    out = []
    for x, y in zip(a, b):
        tx = EXPLICIT_ID_RE.sub("", x.raw).strip()
        if tx == EXPLICIT_ID_RE.sub("", y.raw).strip() and re.search(r"[A-Za-z]{2,}", _TOKEN_RE.sub("", tx)):
            out.append(tx)
    return out


def _split_frontmatter(content):
    m = re.match(r"^(---\r?\n.*?\r?\n---\r?\n)", content, re.DOTALL)
    return (m.group(1), content[m.end():]) if m else ("", content)


def _pairs(args):
    """Yield (src_path, ja_path) for every translated page and partial."""
    for src_root, ja_root in ((args.src_root, args.ja_root), (args.src_partials, args.ja_partials)):
        for dirpath, _, names in os.walk(ja_root):
            for name in sorted(names):
                if not name.endswith(".mdx"):
                    continue
                ja = os.path.join(dirpath, name)
                src = os.path.join(src_root, os.path.relpath(ja, ja_root))
                yield src, ja


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true", help="report only; exit 1 if any page needs ids")
    mode.add_argument("--write", action="store_true", help="add the missing ids in place")
    ap.add_argument("--src-root", default="docs")
    ap.add_argument("--ja-root", default="i18n/ja/docusaurus-plugin-content-docs/current")
    ap.add_argument("--src-partials", default="src/partials")
    ap.add_argument("--ja-partials", default="i18n/ja/partials")
    args = ap.parse_args()

    files = changed = added = 0
    skipped = []
    for src, ja in _pairs(args):
        if not os.path.isfile(src):
            skipped.append((ja, "no English source"))
            continue
        files += 1
        _, src_body = _split_frontmatter(open(src, encoding="utf-8").read())
        ja_fm, ja_body = _split_frontmatter(open(ja, encoding="utf-8").read())
        new_body, note = add_english_heading_ids(src_body, ja_body)
        if note:
            skipped.append((ja, note))
            continue
        if new_body != ja_body:
            changed += 1
            added += new_body.count("{#") - ja_body.count("{#")
            if args.write:
                open(ja, "w", encoding="utf-8").write(ja_fm + new_body)
    verb = "updated" if args.write else "would update"
    print(f"{files} pages checked; {verb} {changed} pages, {added} heading ids added")
    for path, why in skipped:
        print(f"  SKIPPED {path}: {why}", file=sys.stderr)
    if args.check and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
