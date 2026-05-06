#!/usr/bin/env python3
"""
Builds a title → URL mapping from the current Paligo HTML output.

Walks all HTML files under out/en/, extracts <title> from each,
and outputs a JSON mapping of title → relative URL path.

Usage:
    python3 migration/build_url_map.py /path/to/out/en migration/url_map.json
"""

import json
import os
import re
import sys


def extract_title(html_path):
    with open(html_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read(4000)
    match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE)
    return match.group(1).strip() if match else ""


def build_map(html_dir):
    url_map = {}
    title_to_url = {}

    for root, _dirs, files in os.walk(html_dir):
        for fname in files:
            if not fname.endswith(".html"):
                continue
            if fname in ("toc-en.html", "index-en.html"):
                continue

            full_path = os.path.join(root, fname)
            rel_path = os.path.relpath(full_path, html_dir)
            title = extract_title(full_path)

            if title:
                title_to_url[title] = rel_path
            url_map[rel_path] = title

    return url_map, title_to_url


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <html-dir> <output-json>")
        sys.exit(1)

    html_dir = sys.argv[1]
    output_path = sys.argv[2]

    print(f"Scanning {html_dir}...")
    url_map, title_to_url = build_map(html_dir)

    result = {
        "by_path": url_map,
        "by_title": title_to_url,
    }

    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Mapped {len(url_map)} URLs, {len(title_to_url)} unique titles")
    print(f"Output: {output_path}")


if __name__ == "__main__":
    main()
