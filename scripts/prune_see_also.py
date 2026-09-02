#!/usr/bin/env python3
"""Prune or remap doc ids in see_also.json after a page is deleted or renamed.

Cheap, dependency-free companion to generate_see_also.py: dropping a dead
reference, or updating one to match a rename, doesn't require re-embedding
anything -- it's pure JSON bookkeeping. This script never imports numpy/
torch/sentence-transformers, so it's fast enough to run on every PR that
touches docs/, not just the ones a full regeneration is scheduled for.

Reads a `git diff --name-status -M` listing from stdin (the same format
translate_docs.py already reads changed files from), restricted to docs/:

    git diff --name-status -M <base> <head> -- docs \
        | python3 scripts/prune_see_also.py

For each deleted path (status D), the corresponding doc id is dropped from
its own top-level entry and from every other page's related-ids list. For
each renamed path (status R<score>), the old id is rewritten to the new id
everywhere it appears instead of being dropped -- the content didn't change,
so a page shouldn't lose a "See also" link just because a file moved.

-M (rename detection) matters: without it, a rename shows up as an unpaired
delete plus an unpaired add, and this script still behaves safely -- it just
falls back to dropping the old id rather than remapping it to the new one.

Doc ids are derived the same way Docusaurus derives them by default: the
path relative to docs/, minus its extension. A page with a custom `id:`
frontmatter override won't match this derivation, so a change to that page
is silently skipped here -- that's fine, not a correctness gap: the
render-time skip in <SeeAlso> already treats any stale id as safe to drop,
and the next scheduled full regeneration (see generate_see_also.py) fixes
the underlying data for real.

API reference pages (see_also_common.EXCLUDED_SOURCE_DIRS) are ignored:
they're generated, not embedded, so their churn isn't a "See also" event.
"""
import json
import sys
from pathlib import Path
from typing import Optional

from see_also_common import EXCLUDED_SOURCE_DIRS

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = REPO_ROOT / "src" / "data" / "see_also.json"
DOCS_PREFIX = "docs/"
DOC_EXTENSIONS = (".mdx", ".md")


def path_to_id(path: str) -> Optional[str]:
    """Mirror Docusaurus's default doc id derivation: the path relative to
    docs/, minus its extension. None for anything outside docs/, without a
    doc extension, or in an excluded (generated) directory."""
    if not path.startswith(DOCS_PREFIX):
        return None
    rel = path[len(DOCS_PREFIX):]
    for ext in DOC_EXTENSIONS:
        if rel.endswith(ext):
            rel = rel[: -len(ext)]
            break
    else:
        return None
    if rel.startswith(EXCLUDED_SOURCE_DIRS):
        return None
    return rel


def parse_changes(lines):
    """Parse `git diff --name-status -M` lines into (deleted_ids, renamed_ids)
    -- renamed_ids maps old id -> new id. Lines that don't resolve to a doc
    id (wrong extension, outside docs/, excluded dir) are ignored."""
    deleted = set()
    renamed = {}
    for line in lines:
        line = line.rstrip("\n")
        if not line:
            continue
        parts = line.split("\t")
        status = parts[0]
        if status == "D" and len(parts) >= 2:
            doc_id = path_to_id(parts[1])
            if doc_id:
                deleted.add(doc_id)
        elif status.startswith("R") and len(parts) >= 3:
            old_id = path_to_id(parts[1])
            new_id = path_to_id(parts[2])
            if old_id and new_id and old_id != new_id:
                renamed[old_id] = new_id
    return deleted, renamed


def prune(data, deleted, renamed):
    """Mutates and returns (data, changed)."""
    changed = False

    for doc_id in deleted:
        if data.pop(doc_id, None) is not None:
            changed = True

    for old_id, new_id in renamed.items():
        if old_id in data:
            data[new_id] = data.pop(old_id)
            changed = True

    for doc_id, related_ids in list(data.items()):
        new_related_ids = []
        for related_id in related_ids:
            if related_id in deleted:
                changed = True
                continue
            if related_id in renamed:
                related_id = renamed[related_id]
                changed = True
            new_related_ids.append(related_id)

        if new_related_ids:
            data[doc_id] = new_related_ids
        else:
            del data[doc_id]
            changed = True

    return data, changed


def main():
    deleted, renamed = parse_changes(sys.stdin)
    if not deleted and not renamed:
        print("No deleted or renamed docs pages -- nothing to prune.")
        return

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    data, changed = prune(data, deleted, renamed)

    if not changed:
        print("No matching ids found in see_also.json -- nothing to prune.")
        return

    DATA_PATH.write_text(json.dumps(data, indent=2) + "\n")
    print(
        f"Pruned {len(deleted)} deleted and remapped {len(renamed)} renamed "
        f"doc id(s) in {DATA_PATH.relative_to(REPO_ROOT)}."
    )


if __name__ == "__main__":
    main()
