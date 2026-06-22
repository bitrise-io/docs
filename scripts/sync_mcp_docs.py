#!/usr/bin/env python3
"""
Sync .md files from bitrise-io/bitrise-mcp/docs into the devcenter.

Usage:
  python3 scripts/sync_mcp_docs.py            # sync all files
  python3 scripts/sync_mcp_docs.py --dry-run  # preview without writing

What it does:
  1. Fetches the file list from the GitHub API for bitrise-io/bitrise-mcp/docs.
  2. For each .md file (skipping bitrise-mcp.md if it ever appears):
     a. Downloads the raw content.
     b. Strips any existing frontmatter.
     c. Derives title (from H1), sidebar_label, slug, and sidebar_position.
     d. Writes to the correct destination:
        - install-*.md → docs/bitrise-platform/ai/bitrise-mcp/installing-the-bitrise-mcp-server/
        - everything else → docs/bitrise-platform/ai/bitrise-mcp/
  3. Idempotent: re-running produces no changes if the source is unchanged.

Authentication:
  Set GITHUB_TOKEN in the environment to use authenticated requests
  (5000 req/hr vs 60 req/hr unauthenticated).
"""

import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional

REPO_ROOT    = Path(__file__).parent.parent
BASE_DIR     = REPO_ROOT / "docs/bitrise-platform/ai/bitrise-mcp"
INSTALL_DIR  = BASE_DIR / "installing-the-bitrise-mcp-server"
API_URL      = "https://api.github.com/repos/bitrise-io/bitrise-mcp/contents/docs"
RAW_BASE     = "https://raw.githubusercontent.com/bitrise-io/bitrise-mcp/main/docs"
SLUG_BASE    = "/bitrise-platform/ai/bitrise-mcp"
SLUG_INSTALL = f"{SLUG_BASE}/installing-the-bitrise-mcp-server"
SKIP_FILES   = {"bitrise-mcp.md"}
DRY_RUN      = "--dry-run" in sys.argv

# sidebar_position within the install subcategory
INSTALL_POSITIONS: Dict[str, int] = {
    "install-claude":             1,
    "install-cursor":             2,
    "install-gemini-cli":         3,
    "install-kiro":               4,
    "install-other-copilot-ides": 5,
    "install-vscode":             6,
    "install-windsurf":           7,
}

# sidebar_position within bitrise-mcp/ (top-level siblings of the install category)
ROOT_POSITIONS: Dict[str, int] = {
    "tools": 3,
}


def gh_request(url: str) -> bytes:
    token = os.environ.get("GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "sync-mcp-docs"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return resp.read()


def list_source_files() -> List[str]:
    data = json.loads(gh_request(API_URL))
    return [e["name"] for e in data if e["type"] == "file" and e["name"].endswith(".md")]


def fetch_raw(filename: str) -> str:
    return gh_request(f"{RAW_BASE}/{filename}").decode("utf-8")


def strip_frontmatter(content: str) -> str:
    if content.startswith("---"):
        end = content.find("\n---", 3)
        if end != -1:
            return content[end + 4:].lstrip("\n")
    return content


def extract_h1(content: str) -> Optional[str]:
    for line in content.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return None


def is_install_file(stem: str) -> bool:
    return stem.startswith("install-")


def derive_sidebar_label(stem: str, h1: Optional[str]) -> str:
    if stem == "tools":
        return "Tools"
    if h1:
        prefix = "Install Bitrise MCP Server in "
        if h1.startswith(prefix):
            return h1[len(prefix):]
        return h1
    return stem.replace("-", " ").capitalize()


def derive_position(stem: str, install_stems: List[str], root_stems: List[str]) -> int:
    if is_install_file(stem):
        if stem in INSTALL_POSITIONS:
            return INSTALL_POSITIONS[stem]
        known_max = max(INSTALL_POSITIONS.values(), default=0)
        unknown = sorted(s for s in install_stems if s not in INSTALL_POSITIONS)
        return known_max + 1 + (unknown.index(stem) if stem in unknown else len(unknown))
    else:
        if stem in ROOT_POSITIONS:
            return ROOT_POSITIONS[stem]
        known_max = max(ROOT_POSITIONS.values(), default=2)
        unknown = sorted(s for s in root_stems if s not in ROOT_POSITIONS)
        return known_max + 1 + (unknown.index(stem) if stem in unknown else len(unknown))


def rewrite_internal_links(content: str) -> str:
    """
    Rewrite links that use the source repo's path (/docs/<file>.md) to the
    equivalent devcenter slug (/en/bitrise-platform/ai/bitrise-mcp/...).
    """
    def replace(m: re.Match) -> str:
        stem = m.group(1)
        anchor = m.group(2) or ""  # e.g. "#section" or ""
        if is_install_file(stem):
            slug = f"{SLUG_INSTALL}/{stem}"
        else:
            slug = f"{SLUG_BASE}/{stem}"
        return f"(/en{slug}{anchor})"

    # Matches (/docs/<stem>.md) or (/docs/<stem>.md#anchor)
    return re.sub(r'\(/docs/([^)#]+?)\.md(#[^)]*)?\)', replace, content)


def fix_list_code_blocks(content: str) -> str:
    """
    Indent code fences that follow ordered list items so they are parsed as
    list item content rather than terminating the list.

    Without this, each list item followed by an unindented code fence becomes
    its own <ol>, causing all items to render as step 1.

    Before:
        1. Do thing
        ```bash
        code
        ```

        2. Do next thing

    After:
        1. Do thing

           ```bash
           code
           ```

        2. Do next thing
    """
    lines = content.split('\n')
    out = []
    i = 0
    content_col = None  # indentation level for code blocks in the current list item

    while i < len(lines):
        line = lines[i]

        # Ordered list item — record the content column ("1. " = 3, "10. " = 4, etc.)
        m = re.match(r'^( *)(\d+)\. ', line)
        if m:
            content_col = len(m.group(1)) + len(m.group(2)) + 2
            out.append(line)
            i += 1
            continue

        # Blank line — keep list context, pass through
        if not line.strip():
            out.append(line)
            i += 1
            continue

        # Unindented code fence inside a list context — indent the whole block
        if content_col is not None and line.startswith('```'):
            pad = ' ' * content_col
            if out and out[-1].strip():  # ensure a blank line precedes the fence
                out.append('')
            out.append(pad + line)
            i += 1
            while i < len(lines):
                out.append(pad + lines[i])
                i += 1
                if lines[i - 1].startswith('```'):
                    break
            continue

        # Any other non-blank, non-indented line resets list context
        if not line.startswith(' '):
            content_col = None

        out.append(line)
        i += 1

    return '\n'.join(out)


def build_frontmatter(stem: str, h1: Optional[str], sidebar_label: str, position: int) -> str:
    title = h1 if h1 else stem.replace("-", " ").capitalize()
    slug  = f"{SLUG_INSTALL}/{stem}" if is_install_file(stem) else f"{SLUG_BASE}/{stem}"
    return "\n".join([
        "---",
        f'title: "{title}"',
        f'sidebar_label: "{sidebar_label}"',
        f"sidebar_position: {position}",
        f"slug: {slug}",
        "---",
        "",
    ])


def sync():
    filenames = [f for f in list_source_files() if f not in SKIP_FILES]
    install_stems = [Path(f).stem for f in filenames if is_install_file(Path(f).stem)]
    root_stems    = [Path(f).stem for f in filenames if not is_install_file(Path(f).stem)]

    changed = 0
    for filename in sorted(filenames):
        stem = Path(filename).stem
        raw  = fetch_raw(filename)
        body = strip_frontmatter(raw)
        h1   = extract_h1(body)
        label    = derive_sidebar_label(stem, h1)
        position = derive_position(stem, install_stems, root_stems)
        body = rewrite_internal_links(body)
        new_content = build_frontmatter(stem, h1, label, position) + fix_list_code_blocks(body)

        dest = (INSTALL_DIR if is_install_file(stem) else BASE_DIR) / filename
        existing = dest.read_text(encoding="utf-8") if dest.exists() else None

        if existing == new_content:
            print(f"  unchanged  {filename}")
            continue

        print(f"  {'(dry-run) ' if DRY_RUN else ''}write      {filename}")
        if not DRY_RUN:
            dest.write_text(new_content, encoding="utf-8")
        changed += 1

    print(f"\n{changed} file(s) {'would be ' if DRY_RUN else ''}written.")


if __name__ == "__main__":
    sync()
