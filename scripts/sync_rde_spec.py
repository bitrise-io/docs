#!/usr/bin/env python3
"""
Detect changes in the Bitrise RDE API spec and update api/bitrise-rde.json.

Thin wrapper over scripts/spec_sync.py; see that module for the strategy
(ETag conditional GET + SHA-256 content gate). The RDE host only sends an ETag
from a recent backend build, so the SHA gate is what makes detection correct in
the meantime and keeps a fresh checkout a no-op when the snapshot matches live.

Usage:
  python3 scripts/sync_rde_spec.py           # check for changes
  python3 scripts/sync_rde_spec.py --update  # force-refresh the stored state

Output (JSON to stdout): { "status": "unchanged" | "changed" | "initialized", ... }

On "changed"/"initialized", api/bitrise-rde.json is overwritten. Run
`npm run gen-api-docs` afterwards to regenerate the reference pages.
"""

import json
import sys
from pathlib import Path

from spec_sync import run_sync

SPEC_URL = "https://api.bitrise.io/rde/api-docs/swagger.json"
STATE_FILE = Path(__file__).parent / "rde_spec_sync_state.json"
SPEC_FILE = Path(__file__).parent.parent / "api" / "bitrise-rde.json"

if __name__ == "__main__":
    result = run_sync(SPEC_URL, STATE_FILE, SPEC_FILE, force_update="--update" in sys.argv)
    print(json.dumps(result))
