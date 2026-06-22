#!/usr/bin/env python3
"""
Detect changes in the Bitrise CI API spec and update api/bitrise-ci.json.

Uses HTTP ETag for efficient change detection — only downloads the full 300KB+
spec when the server reports it has changed.

Usage:
  python3 scripts/sync_api_spec.py           # check for changes
  python3 scripts/sync_api_spec.py --update  # force-update stored state

Output (JSON to stdout):
  { "status": "unchanged" | "changed" | "initialized", ... }

On "changed", api/bitrise-ci.json is overwritten with the new spec.
Run `npm run gen-api-docs` afterwards to regenerate the API reference pages.
"""

import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

SPEC_URL = "https://api-docs.bitrise.io/docs/swagger.json"
STATE_FILE = Path(__file__).parent / "api_spec_sync_state.json"
SPEC_FILE = Path(__file__).parent.parent / "api" / "bitrise-ci.json"

FORCE_UPDATE = "--update" in sys.argv


def fetch_spec(etag=None):  # type: (str | None) -> tuple[bytes | None, str]
    """Fetch the spec. Returns (content, etag). content is None on 304."""
    headers = {"User-Agent": "sync-api-spec/1.0"}
    if etag:
        headers["If-None-Match"] = etag
    req = urllib.request.Request(SPEC_URL, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            new_etag = resp.headers.get("ETag", "")
            return resp.read(), new_etag
    except urllib.error.HTTPError as e:
        if e.code == 304:
            return None, etag or ""
        raise


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {}


def save_state(etag, now, last_changed=None):
    state = load_state()
    state["etag"] = etag
    state["last_checked"] = now
    if last_changed:
        state["last_changed"] = last_changed
    STATE_FILE.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    state = load_state()
    now = datetime.now(timezone.utc).isoformat()
    saved_etag = state.get("etag") if not FORCE_UPDATE else None

    content, etag = fetch_spec(saved_etag)

    if content is None:
        # 304 Not Modified — update last_checked timestamp only
        save_state(etag, now)
        print(json.dumps({"status": "unchanged", "etag": etag, "timestamp": now}))
        return

    # New content received — write spec to disk
    SPEC_FILE.write_bytes(content)

    if not state or FORCE_UPDATE:
        save_state(etag, now, last_changed=now)
        print(json.dumps({"status": "initialized", "etag": etag, "timestamp": now}))
        return

    old_etag = state.get("etag", "")
    save_state(etag, now, last_changed=now)

    print(
        json.dumps(
            {
                "status": "changed",
                "previous_etag": old_etag,
                "current_etag": etag,
                "timestamp": now,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
