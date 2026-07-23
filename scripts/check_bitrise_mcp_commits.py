#!/usr/bin/env python3
"""
Detect new commits touching docs/ in bitrise-io/bitrise-mcp since the last sync.

Usage:
  python3 scripts/check_bitrise_mcp_commits.py           # check for changes
  python3 scripts/check_bitrise_mcp_commits.py --update  # force-refresh the stored SHA

Output (JSON to stdout): { "status": "unchanged" | "changed" | "initialized", "head_sha": "..." }

On "changed"/"initialized", scripts/mcp_docs_sync_state.json is overwritten with
the new HEAD SHA. Run scripts/sync_mcp_docs.py afterwards to pull the content.

Authentication:
  Set GITHUB_TOKEN in the environment to use authenticated requests and to
  read bitrise-io/bitrise-mcp if it isn't public.
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

REPO = "bitrise-io/bitrise-mcp"
STATE_FILE = Path(__file__).parent / "mcp_docs_sync_state.json"


def gh_request(url: str):
    token = os.environ.get("GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "mcp-docs-sync/1.0"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def main():
    force_update = "--update" in sys.argv
    state = json.loads(STATE_FILE.read_text(encoding="utf-8")) if STATE_FILE.exists() else {}
    last_sha = None if force_update else state.get("last_sha")

    head_sha = gh_request(f"https://api.github.com/repos/{REPO}/commits/main")["sha"]

    if last_sha is None:
        status = "initialized"
    elif last_sha == head_sha:
        status = "unchanged"
    else:
        compare = gh_request(f"https://api.github.com/repos/{REPO}/compare/{last_sha}...{head_sha}")
        touched = [f["filename"] for f in compare.get("files", []) if f["filename"].startswith("docs/")]
        status = "changed" if touched else "unchanged"

    if status != "unchanged":
        STATE_FILE.write_text(json.dumps({"last_sha": head_sha}, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"status": status, "head_sha": head_sha}))


if __name__ == "__main__":
    main()
