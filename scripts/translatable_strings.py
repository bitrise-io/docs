#!/usr/bin/env python3
"""
translatable_strings.py  —  the readable text that hides outside the prose
===========================================================================
translate_docs.py masks code and JSX so the model cannot corrupt syntax. Two
kinds of reader-visible text live inside that protected syntax and were
therefore never translated:

  * frontmatter values  (`title`, `description`, `sidebar_label`) — they feed
    the browser tab, the sidebar, search results and social cards;
  * string props in JSX pages (`title="…"`, `label: '…'`, `description: '…'`)
    — a hub page such as docs/bitrise-ci/index.mdx is one big <ProductOverview>
    whose text is all in props, so masking swallows the whole page.

This module pulls those strings out, lets the caller send them to the model as
`%%key%% text` lines, and writes the translations back without touching any
other key, quote style or piece of syntax.

Everything here is pure string handling; the model call stays in
translate_docs.py.
"""
import json
import re

import yaml

FM_KEYS = ("title", "description", "sidebar_label")

FENCE_RE = re.compile(r"^[ \t]*(`{3,}|~{3,})")
# `  title="Bitrise CI"`  /  `  label: 'Workflows overview',`  — one string per line
JSX_STR_RE = re.compile(r"^(\s*)(title|label|description)(\s*[:=]\s*)(['\"])(.*)\4(,?)\s*$")
MARK_RE = re.compile(r"^%%([A-Za-z0-9_:.\-]+)%%[ \t]?(.*)$")
SENTINEL = "@@JS{}@@"
SENTINEL_RE = re.compile(r"@@JS(\d+)@@")


# --- frontmatter ----------------------------------------------------------

def _fm_lines(frontmatter):
    return frontmatter.split("\n")


def extract_frontmatter(frontmatter):
    """{key: text} for the translatable single-line scalars in a frontmatter block."""
    lines = _fm_lines(frontmatter)
    out = {}
    for i, line in enumerate(lines):
        m = re.match(r"^(title|description|sidebar_label):[ \t]*(.*?)[ \t]*$", line)
        if not m or not m.group(2) or m.group(2)[0] in ">|&*!":
            continue
        if i + 1 < len(lines) and lines[i + 1][:1] in (" ", "\t"):
            continue  # continuation line: not a plain one-line scalar
        try:
            val = yaml.safe_load(m.group(2))
        except yaml.YAMLError:
            continue
        if isinstance(val, str) and val.strip():
            out[m.group(1)] = val
    return out


def apply_frontmatter(frontmatter, translations):
    """Replace only the listed keys' values; every other byte is left alone."""
    lines = _fm_lines(frontmatter)
    for i, line in enumerate(lines):
        m = re.match(r"^(title|description|sidebar_label):[ \t]", line)
        if m and m.group(1) in translations:
            cr = "\r" if line.endswith("\r") else ""
            lines[i] = f"{m.group(1)}: {json.dumps(translations[m.group(1)], ensure_ascii=False)}{cr}"
    return "\n".join(lines)


# --- JSX string props -----------------------------------------------------

def extract_jsx_strings(body):
    """Swap each prop string outside fenced code for a sentinel.

    Returns (body_with_sentinels, [(quote, sep, text), ...]); the list index is
    the sentinel number. Sentinels sit inside the original quotes, so the
    masker still treats the surrounding JSX as one protected span.
    """
    strings, out, fence = [], [], None
    for line in body.split("\n"):
        stripped = line.rstrip("\r")
        fm = FENCE_RE.match(stripped)
        if fm:
            marker = fm.group(1)
            if fence is None:
                fence = (marker[0], len(marker))
            elif marker[0] == fence[0] and len(marker) >= fence[1]:
                fence = None
            out.append(line)
            continue
        m = None if fence else JSX_STR_RE.match(stripped)
        if m and re.search(r"[A-Za-z]{2}", m.group(5)):
            n = len(strings)
            strings.append((m.group(4), m.group(3), m.group(5)))
            cr = line[len(stripped):]
            out.append(f"{m.group(1)}{m.group(2)}{m.group(3)}{m.group(4)}{SENTINEL.format(n)}{m.group(4)}{m.group(6)}{cr}")
        else:
            out.append(line)
    return "\n".join(out), strings


def _escape(text, quote, sep):
    text = text.replace("\n", " ")
    if "=" in sep:  # JSX attribute: no backslash escapes, use the entity
        return text.replace('"', "&quot;") if quote == '"' else text.replace("'", "&#39;")
    return text.replace("\\", "\\\\").replace(quote, "\\" + quote)


def apply_jsx_strings(text, strings, translations):
    """Put translations (by sentinel number) back; missing ones restore the English."""
    def repl(m):
        n = int(m.group(1))
        quote, sep, original = strings[n]
        if n in translations and translations[n].strip():
            return _escape(translations[n].strip(), quote, sep)
        return original
    return SENTINEL_RE.sub(repl, text)


# --- the block sent to the model -------------------------------------------

def build_block(fm_values, jsx_strings, prefix=""):
    """`%%fm:title%% text` / `%%js:3%% text` lines. `prefix` namespaces the keys
    when several pages share one request (e.g. "p12:")."""
    lines = [f"%%{prefix}fm:{k}%% {v.replace(chr(10), ' ')}" for k, v in fm_values.items()]
    lines += [f"%%{prefix}js:{i}%% {s[2]}" for i, s in enumerate(jsx_strings)]
    return "\n".join(lines)


def parse_block(translated):
    """Pull every `%%key%% text` line out of a model response.

    Returns ({key: text}, remaining_text). Tolerant: unknown or missing keys
    just mean "keep the English".
    """
    found, rest = {}, []
    for line in translated.split("\n"):
        m = MARK_RE.match(line.rstrip("\r"))
        if m:
            found[m.group(1)] = m.group(2).strip()
        else:
            rest.append(line)
    return found, "\n".join(rest)


def split_block(found, prefix=""):
    """({fm key: text}, {js number: text}) for one page out of parse_block()'s dict."""
    fm, js = {}, {}
    for key, val in found.items():
        if not key.startswith(prefix):
            continue
        kind, _, name = key[len(prefix):].partition(":")
        if kind == "fm" and name in FM_KEYS:
            fm[name] = val
        elif kind == "js" and name.isdigit():
            js[int(name)] = val
    return fm, js


def normalized(text):
    """Whitespace-insensitive form, for 'did the English really change?'"""
    return re.sub(r"\s+", " ", text).strip()
