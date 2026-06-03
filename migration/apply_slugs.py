#!/usr/bin/env python3
"""
Post-processes migrated MD files to inject correct URL slugs.

Matches by: extracting the canonical URL from each HTML file in the Paligo output,
then finding the MD file whose title matches the HTML page title.
For hub/category index pages, also matches by directory structure.

Usage:
    python3 migration/apply_slugs.py migration/docs /path/to/out/en
"""

import os
import re
import sys
from pathlib import Path
from difflib import SequenceMatcher


def extract_html_info(html_path):
    with open(html_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read(5000)
    title_match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE)
    title = title_match.group(1).strip() if title_match else ""
    return title


def parse_frontmatter(content):
    if not content.startswith("---"):
        return {}, content
    end = content.index("---", 3)
    fm_text = content[3:end].strip()
    body = content[end + 3:].lstrip("\n")
    fm = {}
    for line in fm_text.split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            fm[key.strip()] = val.strip().strip('"')
    return fm, body


def write_frontmatter(fm, body):
    lines = ["---"]
    for key, val in fm.items():
        if key in ("title", "description"):
            val_escaped = val.replace('"', '\\"')
            lines.append(f'{key}: "{val_escaped}"')
        else:
            lines.append(f"{key}: {val}")
    lines.append("---")
    lines.append("")
    return "\n".join(lines) + "\n" + body


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <docs-dir> <html-dir>")
        sys.exit(1)

    docs_dir = Path(sys.argv[1])
    html_dir = Path(sys.argv[2])

    # Build index of all HTML pages: title -> URL path, and dir -> URL path
    html_pages = {}
    html_by_title = {}
    html_by_dir_and_title = {}

    for root, _dirs, files in os.walk(html_dir):
        for fname in files:
            if not fname.endswith(".html"):
                continue
            if fname in ("toc-en.html", "index-en.html"):
                continue
            full_path = os.path.join(root, fname)
            rel_path = os.path.relpath(full_path, html_dir)
            title = extract_html_info(full_path)

            html_pages[rel_path] = title
            if title:
                html_by_title.setdefault(title, []).append(rel_path)
                parent_dir = os.path.dirname(rel_path)
                html_by_dir_and_title[(parent_dir, title)] = rel_path

    print(f"Indexed {len(html_pages)} HTML pages")

    # Build index of all MD files
    md_files = {}
    for md_file in sorted(docs_dir.rglob("*.md")):
        rel = str(md_file.relative_to(docs_dir))
        content = md_file.read_text()
        fm, body = parse_frontmatter(content)
        md_files[rel] = {
            "path": md_file,
            "fm": fm,
            "body": body,
            "title": fm.get("title", ""),
        }

    # Match MD files to HTML URLs
    used_urls = set()
    matches = {}
    unmatched_md = []

    # Pass 1: exact title + similar directory match
    for rel, info in md_files.items():
        title = info["title"]
        candidates = html_by_title.get(title, [])
        if len(candidates) == 1 and candidates[0] not in used_urls:
            matches[rel] = candidates[0]
            used_urls.add(candidates[0])
        elif len(candidates) > 1:
            # Pick the one with the most similar path
            md_parts = rel.replace(".md", "").replace("/index", "").split("/")
            best = None
            best_score = -1
            for c in candidates:
                if c in used_urls:
                    continue
                html_parts = c.replace(".html", "").split("/")
                # Score: count matching path segments from the start
                score = 0
                for mp, hp in zip(md_parts, html_parts):
                    if mp == hp:
                        score += 2
                    else:
                        score += SequenceMatcher(None, mp, hp).ratio()
                if score > best_score:
                    best_score = score
                    best = c
            if best:
                matches[rel] = best
                used_urls.add(best)

    # Pass 2: for unmatched MD files, try fuzzy title + path match against unused HTML
    remaining_html = {path: title for path, title in html_pages.items() if path not in used_urls}

    for rel, info in md_files.items():
        if rel in matches:
            continue
        title = info["title"]
        md_parts = rel.replace(".md", "").replace("/index", "").split("/")

        best = None
        best_score = -1
        for html_path, html_title in remaining_html.items():
            html_parts = html_path.replace(".html", "").split("/")

            if md_parts[0] != html_parts[0]:
                continue

            title_sim = SequenceMatcher(None, title.lower(), html_title.lower()).ratio()
            path_sim = SequenceMatcher(None,
                                       "/".join(md_parts),
                                       "/".join(html_parts)).ratio()
            score = title_sim * 2 + path_sim
            if score > best_score and title_sim >= 0.35:
                best_score = score
                best = html_path

        if best and best_score >= 1.5:
            matches[rel] = best
            used_urls.add(best)
            del remaining_html[best]

    # Pass 3: match by HTML filename stem against MD filename stem
    remaining_html = {path: title for path, title in html_pages.items() if path not in used_urls}

    md_by_stem = {}
    for rel, info in md_files.items():
        if rel in matches:
            continue
        stem = Path(rel).stem
        if stem == "index":
            stem = Path(rel).parent.name
        md_by_stem.setdefault(stem, []).append(rel)

    for html_path, html_title in list(remaining_html.items()):
        html_stem = Path(html_path).stem
        candidates = md_by_stem.get(html_stem, [])
        if len(candidates) == 1:
            matches[candidates[0]] = html_path
            used_urls.add(html_path)
            del remaining_html[html_path]
        elif len(candidates) > 1:
            html_parts = html_path.replace(".html", "").split("/")
            best = None
            best_score = -1
            for c in candidates:
                md_parts = c.replace(".md", "").replace("/index", "").split("/")
                score = sum(1 for a, b in zip(md_parts, html_parts) if a == b)
                if score > best_score:
                    best_score = score
                    best = c
            if best:
                matches[best] = html_path
                used_urls.add(html_path)
                del remaining_html[html_path]

    # Apply slugs
    updated = 0
    for rel, html_url in matches.items():
        info = md_files[rel]
        slug_val = html_url.replace(".html", "")

        fm = info["fm"]
        if fm.get("slug") == slug_val:
            continue

        fm["slug"] = slug_val
        info["path"].write_text(write_frontmatter(fm, info["body"]))
        updated += 1

    unmatched_count = len(md_files) - len(matches)
    unmatched_html = len(html_pages) - len(used_urls)

    print(f"Matched: {len(matches)} MD files to HTML URLs")
    print(f"Updated slugs: {updated}")
    print(f"Unmatched MD files: {unmatched_count} (new sub-pages, no HTML equivalent)")
    print(f"Unmatched HTML pages: {unmatched_html}")

    if unmatched_html > 0:
        print("\nUnmatched HTML pages:")
        for path in sorted(html_pages.keys()):
            if path not in used_urls:
                print(f"  {path} -> \"{html_pages[path]}\"")


if __name__ == "__main__":
    main()
