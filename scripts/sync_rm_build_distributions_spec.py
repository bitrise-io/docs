#!/usr/bin/env python3
"""
Detect changes in the Release Management Build Distributions API spec and
update api/bitrise-rm-build-distributions.json.

Thin wrapper over scripts/spec_sync.py; see that module for the strategy
(ETag conditional GET + SHA-256 content gate).

Usage:
  python3 scripts/sync_rm_build_distributions_spec.py           # check for changes
  python3 scripts/sync_rm_build_distributions_spec.py --update  # force-refresh the stored state

Output (JSON to stdout): { "status": "unchanged" | "changed" | "initialized", ... }

On "changed"/"initialized", api/bitrise-rm-build-distributions.json is
overwritten. Run `npm run gen-api-docs` afterwards to regenerate the
reference pages.
"""

import json
import sys
from pathlib import Path

from spec_sync import run_sync

SPEC_URL = "https://api.bitrise.io/release-management/api-docs/release_management/v2/build_distributions/swagger.json"
STATE_FILE = Path(__file__).parent / "rm_build_distributions_spec_sync_state.json"
SPEC_FILE = Path(__file__).parent.parent / "api" / "bitrise-rm-build-distributions.json"

if __name__ == "__main__":
    result = run_sync(SPEC_URL, STATE_FILE, SPEC_FILE, force_update="--update" in sys.argv)
    print(json.dumps(result))
