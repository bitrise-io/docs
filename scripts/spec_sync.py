#!/usr/bin/env python3
"""
Shared change-detection for the committed API spec snapshots.

Each API reference (CI and RDE) is generated from a committed spec snapshot
that this logic refreshes from its upstream host. Detection is two-layered:

  1. ETag conditional GET — when a previous ETag is stored, the request sends
     `If-None-Match`; a 304 means "unchanged" with no download.
  2. SHA-256 content gate — on a 200, the body's hash is compared to the stored
     hash to decide changed-vs-unchanged. This is the source of truth. It keeps
     detection correct whether the host's ETag is content-derived (RDE) or
     mtime-based (CI's nginx, whose ETag changes on a redeploy even when the
     content is identical), and when a host sends no ETag at all.

On a real change the snapshot file is overwritten; run `npm run gen-api-docs`
afterwards to regenerate the reference pages.

This module is imported by the per-spec wrappers (sync_api_spec.py,
sync_rde_spec.py); it is not meant to be run directly.
"""

import hashlib
import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def _fetch(spec_url, etag):
    """GET spec_url, sending If-None-Match when an ETag is known.
    Returns (content, etag). content is None on a 304 Not Modified."""
    headers = {"User-Agent": "spec-sync/1.0"}
    if etag:
        headers["If-None-Match"] = etag
    req = urllib.request.Request(spec_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read(), resp.headers.get("ETag", "")
    except urllib.error.HTTPError as e:
        if e.code == 304:
            return None, etag or ""
        raise


def run_sync(spec_url, state_file, spec_file, force_update=False):
    """Refresh spec_file from spec_url when its content changed.

    Returns a status dict: {"status": "unchanged"|"changed"|"initialized", ...}.
    Side effects: rewrites spec_file on a real change, and always rewrites
    state_file (etag, sha256, timestamps).
    """
    state_file = Path(state_file)
    spec_file = Path(spec_file)
    state = json.loads(state_file.read_text(encoding="utf-8")) if state_file.exists() else {}
    now = datetime.now(timezone.utc).isoformat()

    saved_etag = None if force_update else state.get("etag")
    saved_sha = None if force_update else state.get("sha256")

    content, etag = _fetch(spec_url, saved_etag)
    sha = hashlib.sha256(content).hexdigest() if content is not None else saved_sha

    # 304, or a 200 whose body still matches the stored hash → unchanged.
    if (content is None or sha == saved_sha) and not force_update:
        _save_state(state_file, state, now, etag=etag, sha=sha)
        return {"status": "unchanged", "etag": etag, "sha256": sha, "timestamp": now}

    # Changed (or first run / forced): write the spec to disk.
    first = not state or force_update
    spec_file.write_bytes(content)
    _save_state(state_file, state, now, etag=etag, sha=sha, last_changed=now)
    return {
        "status": "initialized" if first else "changed",
        "etag": etag,
        "sha256": sha,
        "timestamp": now,
    }


def _save_state(state_file, state, now, etag=None, sha=None, last_changed=None):
    state["etag"] = etag or ""
    if sha is not None:
        state["sha256"] = sha
    state["last_checked"] = now
    if last_changed:
        state["last_changed"] = last_changed
    state_file.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
