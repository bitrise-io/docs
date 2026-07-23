#!/usr/bin/env python3
"""
Detect changes in the CodePush CLI README and output a structured diff report.

Usage:
  python3 scripts/sync_codepush_readme.py         # check for changes
  python3 scripts/sync_codepush_readme.py --update # force-update stored state

Output (JSON to stdout):
  { "status": "unchanged" | "changed" | "initialized", ... }

Set GITHUB_TOKEN in the environment for authenticated requests (5000 req/hr vs 60).
"""

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

STATE_FILE = Path(__file__).parent / "codepush_readme_sync_state.json"

API_URL = "https://api.github.com/repos/bitrise-io/bitrise-plugins-codepush-cli/contents/README.md"
RAW_URL = "https://raw.githubusercontent.com/bitrise-io/bitrise-plugins-codepush-cli/main/README.md"

FORCE_UPDATE = "--update" in sys.argv


def gh_request(url: str) -> bytes:
    token = os.environ.get("GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "sync-codepush-readme"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return resp.read()


def fetch_readme() -> tuple[str, str]:
    """Returns (content, sha)."""
    meta = json.loads(gh_request(API_URL))
    sha = meta["sha"]
    content = gh_request(RAW_URL).decode("utf-8")
    return content, sha


def parse_sections(content: str) -> dict[str, str]:
    """Split README into top-level ## sections. Duplicate headings get a [N] suffix."""
    sections: dict[str, str] = {}
    heading_counts: dict[str, int] = {}
    current_heading = "__preamble__"
    current_lines: list[str] = []

    for line in content.splitlines():
        if line.startswith("## "):
            if current_lines:
                sections[current_heading] = "\n".join(current_lines).strip()
            raw = line[3:].strip()
            n = heading_counts.get(raw, 0) + 1
            heading_counts[raw] = n
            current_heading = f"{raw} [{n}]" if n > 1 else raw
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        sections[current_heading] = "\n".join(current_lines).strip()

    return sections


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {}


def save_state(sha: str, content: str) -> None:
    STATE_FILE.write_text(
        json.dumps(
            {
                "sha": sha,
                "last_checked": datetime.now(timezone.utc).isoformat(),
                "content": content,
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def diff_sections(old: dict[str, str], new: dict[str, str]) -> list[dict]:
    changes = []
    for heading in sorted(set(old) | set(new)):
        if heading == "__preamble__":
            continue
        o, n = old.get(heading), new.get(heading)
        if o == n:
            continue
        change_type = "added" if o is None else "removed" if n is None else "modified"
        changes.append(
            {
                "heading": heading,
                "change_type": change_type,
                "old_content": o,
                "new_content": n,
            }
        )
    return changes


def main() -> None:
    content, sha = fetch_readme()
    state = load_state()
    now = datetime.now(timezone.utc).isoformat()

    if FORCE_UPDATE or not state:
        save_state(sha, content)
        print(json.dumps({"status": "initialized", "sha": sha, "timestamp": now}))
        return

    if state.get("sha") == sha:
        state["last_checked"] = now
        STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")
        print(json.dumps({"status": "unchanged", "sha": sha, "timestamp": now}))
        return

    changes = diff_sections(parse_sections(state.get("content", "")), parse_sections(content))
    save_state(sha, content)

    print(
        json.dumps(
            {
                "status": "changed",
                "previous_sha": state.get("sha"),
                "current_sha": sha,
                "timestamp": now,
                "section_changes": changes,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
