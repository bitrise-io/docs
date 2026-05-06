#!/usr/bin/env python3
"""
Smarter slug applier with strict validation.

For each HTML page in out/en/, find the best MD file match using:
- Same top-level section (mandatory)
- Title similarity >= 0.5 (mandatory)
- Combined score: title_sim * 3 + path_sim * 2 + parent_match * 2

Each MD file gets at most one slug. Each slug used at most once.

Usage:
    python3 migration/apply_slugs_v2.py docs /path/to/out/en
"""

import os
import re
import sys
from pathlib import Path
from difflib import SequenceMatcher


def extract_html_title(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read(5000)
    m = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE)
    return m.group(1).strip() if m else ""


def parse_fm(content):
    if not content.startswith("---"):
        return None, None
    try:
        end = content.index("---", 3)
    except ValueError:
        return None, None
    return content[3:end], content[end+3:]


def get_title(fm):
    m = re.search(r'^title:\s*"(.+?)"', fm, re.MULTILINE)
    return m.group(1) if m else ""


def main():
    docs_dir = Path(sys.argv[1])
    html_dir = Path(sys.argv[2])

    # Index HTML pages
    html_pages = {}
    for root, _dirs, files in os.walk(html_dir):
        for fname in files:
            if not fname.endswith(".html") or fname in ("toc-en.html", "index-en.html"):
                continue
            full_path = os.path.join(root, fname)
            rel_path = os.path.relpath(full_path, html_dir)
            title = extract_html_title(full_path)
            if title:
                html_pages[rel_path] = title

    print(f"Indexed {len(html_pages)} HTML pages")

    # Index MD files
    md_files = {}
    for md_file in docs_dir.rglob("*.md"):
        content = md_file.read_text()
        fm, body = parse_fm(content)
        if fm is None:
            continue
        title = get_title(fm)
        rel = str(md_file.relative_to(docs_dir))
        natural = rel.replace(".md", "").replace("/index", "")
        md_files[rel] = {
            "path": md_file,
            "title": title,
            "natural": natural,
            "fm": fm,
            "body": body,
        }

    print(f"Indexed {len(md_files)} MD files")

    # Score every (html, md) pair within same section
    candidates = []  # list of (score, html_url, md_rel, title_sim)
    for url, html_title in html_pages.items():
        url_stem = url.replace(".html", "")
        url_parts = url_stem.split("/")
        url_section = url_parts[0]
        url_parent = "/".join(url_parts[:-1])
        url_basename = url_parts[-1]

        for rel, info in md_files.items():
            md_parts = info["natural"].split("/")
            if md_parts[0] != url_section:
                continue
            md_parent = "/".join(md_parts[:-1])
            md_basename = md_parts[-1]

            title_sim = SequenceMatcher(None, info["title"].lower(), html_title.lower()).ratio()
            if title_sim < 0.5:
                continue

            path_sim = SequenceMatcher(None, info["natural"].lower(), url_stem.lower()).ratio()
            basename_sim = SequenceMatcher(None, md_basename.lower(), url_basename.lower()).ratio()
            parent_match = 1.0 if url_parent == md_parent else 0.0

            score = title_sim * 3 + path_sim * 2 + basename_sim + parent_match * 2

            candidates.append((score, url_stem, rel, title_sim))

    # Greedy assignment: highest score first, each url and md used at most once
    candidates.sort(reverse=True)
    used_urls = set()
    used_md = set()
    matches = {}  # md_rel -> slug (url_stem)

    for score, url_stem, md_rel, title_sim in candidates:
        if url_stem in used_urls or md_rel in used_md:
            continue
        # Don't assign if score is too low (likely a poor match)
        if score < 4.0:
            break
        matches[md_rel] = url_stem
        used_urls.add(url_stem)
        used_md.add(md_rel)

    # Apply slugs (skip if natural path == slug)
    applied = 0
    redundant = 0
    for md_rel, slug in matches.items():
        info = md_files[md_rel]
        if info["natural"] == slug:
            redundant += 1
            continue
        fm = info["fm"]
        body = info["body"]
        fm = fm.rstrip() + f"\nslug: {slug}\n"
        info["path"].write_text("---" + fm + "---" + body)
        applied += 1

    unmatched_html = [url for url in html_pages if url.replace(".html", "") not in used_urls]
    print(f"Total matches: {len(matches)} (applied {applied}, redundant {redundant})")
    print(f"Unmatched HTML: {len(unmatched_html)}")
    for u in sorted(unmatched_html)[:20]:
        print(f"  {u} -> {html_pages[u]}")


if __name__ == "__main__":
    main()
