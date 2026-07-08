#!/usr/bin/env python3
"""Generate 'See also' related-links data for every docs page.

Embeds each page locally (sentence-transformers, no external API calls) and
picks, per page, the top 5 nearest neighbors by cosine similarity, dropping
any below a floor score so unrelated pages don't get forced matches, and
capping how many picks can come from the same directory so a tightly-related
cluster (e.g. the Bazel build-cache pages) doesn't crowd out cross-cutting
matches.

Writers can override the automatic picks per page via frontmatter:

    see_also: [/bitrise-ci/testing/running-xcode-tests-on-bitrise, ...]
    see_also_exclude: [/bitrise-ci/some-loosely-related-page]

`see_also` fully replaces the automatic picks for that page. `see_also_exclude`
removes specific candidates from the automatic picks (ignored if `see_also` is
also set). Entries can be a slug (as written in frontmatter) or a full
`/en/...` permalink (as written in a Markdown link).

Requires a Docusaurus *production build* cache to exist (for authoritative
permalinks, since ~1/3 of pages compute their slug implicitly rather than
declaring it in frontmatter). Run `npm run build` first -- not `npm start`:
dev-mode metadata includes draft/unlisted docs that a production build (and
therefore the live site) excludes, which would otherwise let a draft page
leak into see_also.json as a link that 404s once published.

Usage:
    pip install -r scripts/requirements-see-also.txt
    npm run build
    python scripts/generate_see_also.py
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import yaml
from sentence_transformers import SentenceTransformer

REPO_ROOT = Path(__file__).resolve().parent.parent
DOCS_ROOT = REPO_ROOT / "docs"
CONTENT_DOCS_CACHE = REPO_ROOT / ".docusaurus" / "docusaurus-plugin-content-docs" / "default"
OUTPUT_PATH = REPO_ROOT / "src" / "data" / "see_also.json"

MODEL_NAME = "all-mpnet-base-v2"
TOP_K = 5
FLOOR = 0.45
MAX_PER_SOURCE_DIR = 2

# Generated API reference docs are excluded entirely: they're auto-generated
# from OpenAPI specs (not hand-written prose), and per-operation pages embed
# as near-duplicates of each other, crowding out genuine matches.
EXCLUDED_SOURCE_DIRS = ("bitrise-api/api-reference", "bitrise-rde-api/api-reference")

# Top-level product landing pages (e.g. /en/bitrise-ci/) are built entirely
# from a <ProductOverview> component, so once the JSX is stripped there's
# almost no real prose left to embed -- they end up as near-empty vectors
# that loosely match each other by accident rather than by genuine relevance.
# Excluded both as candidates (no See also section on them) and as targets
# (never suggested from other pages).
LANDING_PAGE_MARKER = "<ProductOverview"

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
IMPORT_RE = re.compile(r"^import .*?;?\s*$", re.MULTILINE)
PARTIAL_IMPORT_RE = re.compile(r"^import\s+(Partial_\w+)\s+from\s+['\"]@site/(src/partials/[^'\"]+\.mdx)['\"];?\s*$", re.MULTILINE)
JSX_TAG_RE = re.compile(r"</?[A-Z][A-Za-z0-9_.]*[^>]*/?>")
ADMONITION_RE = re.compile(r":::\w+(\[[^\]]*\])?")
CODE_BLOCK_RE = re.compile(r"```.*?```", re.DOTALL)
INLINE_CODE_RE = re.compile(r"`[^`]*`")
MD_LINK_RE = re.compile(r"\[([^\]]*)\]\([^)]*\)")
MD_IMAGE_RE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
HEADING_HASH_RE = re.compile(r"^#{1,6}\s*", re.MULTILINE)

_partial_text_cache = {}


def _load_partial_text(rel_path: str) -> str:
    """Reusable content fragments (src/partials/*.mdx, see CLAUDE.md) are the
    biggest authoring lever in this repo -- pages just reference them as
    <Partial_X />. Without resolving them, the actual instructions they
    contain would never reach the embedder, only an empty placeholder tag."""
    if rel_path not in _partial_text_cache:
        raw = (REPO_ROOT / rel_path).read_text(encoding="utf-8")
        _partial_text_cache[rel_path] = IMPORT_RE.sub("", raw)
    return _partial_text_cache[rel_path]


def resolve_partials(body: str) -> str:
    for name, rel_path in PARTIAL_IMPORT_RE.findall(body):
        partial_text = _load_partial_text(rel_path)
        body = re.sub(rf"<{name}\s*/>", lambda m: partial_text, body)
    return body


def clean_body(raw: str) -> str:
    fm_match = FRONTMATTER_RE.match(raw)
    body = raw[fm_match.end():] if fm_match else raw
    body = resolve_partials(body)
    body = IMPORT_RE.sub("", body)
    body = CODE_BLOCK_RE.sub(" ", body)
    body = MD_IMAGE_RE.sub("", body)
    body = HTML_COMMENT_RE.sub(" ", body)
    body = JSX_TAG_RE.sub(" ", body)
    body = ADMONITION_RE.sub(" ", body)
    body = INLINE_CODE_RE.sub(" ", body)
    body = MD_LINK_RE.sub(r"\1", body)
    body = HEADING_HASH_RE.sub("", body)
    return re.sub(r"\s+", " ", body).strip()


def _is_draft_or_unlisted(path: Path) -> bool:
    fm_match = FRONTMATTER_RE.match(path.read_text(encoding="utf-8"))
    if not fm_match:
        return False
    front_matter = yaml.safe_load(fm_match.group(1)) or {}
    return bool(front_matter.get("draft") or front_matter.get("unlisted"))


def check_cache_is_fresh(cache_files):
    """Warn if the docs on disk and the cache entries loaded from
    .docusaurus disagree -- the symptom of forgetting to rebuild the cache
    (`npm run build`) after adding, removing, or renaming pages. A production
    build cache legitimately omits draft/unlisted pages entirely, so those
    are excluded from the disk side of the comparison rather than flagged."""
    disk_paths = {
        p.relative_to(REPO_ROOT).as_posix()
        for p in list(DOCS_ROOT.rglob("*.md")) + list(DOCS_ROOT.rglob("*.mdx"))
        if not _is_draft_or_unlisted(p)
    }
    cache_paths = set()
    for f in cache_files:
        meta = json.loads(f.read_text(encoding="utf-8"))
        source = meta.get("source", "")
        if source.startswith("@site/docs/"):
            cache_paths.add(source.removeprefix("@site/"))

    missing_from_cache = disk_paths - cache_paths
    stale_in_cache = cache_paths - disk_paths
    if missing_from_cache or stale_in_cache:
        print("WARNING: docs on disk and the Docusaurus cache disagree -- rebuild with `npm run build` first.", file=sys.stderr)
        for p in sorted(missing_from_cache):
            print(f"  on disk but not in cache: {p}", file=sys.stderr)
        for p in sorted(stale_in_cache):
            print(f"  in cache but not on disk: {p}", file=sys.stderr)


def load_doc_metadata():
    """Read Docusaurus's own generated per-doc metadata: authoritative
    source path, permalink, title, and description for every page.

    Returns (docs, lookup): `docs` is the filtered list used for embedding;
    `lookup` maps every page's slug and permalink (including pages excluded
    from `docs`, e.g. API reference) to {title, permalink, source}, so
    frontmatter overrides can reference any page in the site.
    """
    if not CONTENT_DOCS_CACHE.is_dir():
        raise SystemExit(
            f"No Docusaurus cache found at {CONTENT_DOCS_CACHE}.\n"
            "Run `npm run build` once first, then re-run this script."
        )

    cache_files = sorted(CONTENT_DOCS_CACHE.glob("site-docs-*.json"))
    check_cache_is_fresh(cache_files)

    docs = []
    lookup = {}
    for f in cache_files:
        meta = json.loads(f.read_text(encoding="utf-8"))
        source = meta["source"]  # e.g. "@site/docs/bitrise-ci/foo.mdx"
        if not source.startswith("@site/docs/"):
            continue

        entry = {"title": meta["title"], "permalink": meta["permalink"], "source": source}
        lookup[meta["permalink"]] = entry
        if meta.get("slug"):
            lookup[meta["slug"]] = entry

        if meta.get("draft") or meta.get("unlisted"):
            # Belt-and-suspenders: a production build cache already excludes
            # these, but a dev-mode (`npm start`) cache wouldn't.
            continue
        if meta.get("sourceDirName", "") in EXCLUDED_SOURCE_DIRS:
            continue
        rel_path = source.removeprefix("@site/")
        raw = (REPO_ROOT / rel_path).read_text(encoding="utf-8")
        if LANDING_PAGE_MARKER in raw:
            continue

        front_matter = meta.get("frontMatter", {}) or {}
        docs.append({
            "source": source,
            "raw": raw,
            "permalink": meta["permalink"],
            "title": meta["title"],
            "description": meta.get("description", ""),
            "sourceDirName": meta.get("sourceDirName", ""),
            "see_also_override": front_matter.get("see_also") or [],
            "see_also_exclude": front_matter.get("see_also_exclude") or [],
        })
    return docs, lookup


def resolve_refs(refs, lookup, doc_source):
    """Resolve frontmatter slug/permalink references to lookup entries,
    warning (not failing) on typos or renamed pages."""
    resolved = []
    for ref in refs:
        entry = lookup.get(ref)
        if entry is None:
            print(f"WARNING: {doc_source} references unknown page '{ref}' in frontmatter -- skipping.", file=sys.stderr)
            continue
        resolved.append(entry)
    return resolved


def main():
    docs, lookup = load_doc_metadata()
    print(f"Loaded metadata for {len(docs)} pages")

    texts = []
    for doc in docs:
        body = clean_body(doc["raw"])
        texts.append(f"{doc['title']}. {doc['description']}. {body}"[:4000])

    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(texts, batch_size=32, show_progress_bar=True, normalize_embeddings=True)

    sims = embeddings @ embeddings.T
    np.fill_diagonal(sims, -1)

    output = {}
    for i, doc in enumerate(docs):
        if doc["see_also_override"]:
            resolved = resolve_refs(doc["see_also_override"], lookup, doc["source"])
            neighbors = [{"title": e["title"], "href": e["permalink"]} for e in resolved]
        else:
            excluded_sources = {e["source"] for e in resolve_refs(doc["see_also_exclude"], lookup, doc["source"])}
            order = np.argsort(-sims[i])
            neighbors = []
            dir_counts = {}
            for j in order:
                if sims[i][j] < FLOOR or len(neighbors) >= TOP_K:
                    break
                candidate = docs[j]
                if candidate["source"] in excluded_sources:
                    continue
                subdir = candidate["sourceDirName"]
                if dir_counts.get(subdir, 0) >= MAX_PER_SOURCE_DIR:
                    continue
                neighbors.append({"title": candidate["title"], "href": candidate["permalink"]})
                dir_counts[subdir] = dir_counts.get(subdir, 0) + 1

        if neighbors:
            output[doc["source"]] = neighbors

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {len(output)} pages with related links to {OUTPUT_PATH}")
    print(f"{len(docs) - len(output)} pages had no match above the {FLOOR} floor")


if __name__ == "__main__":
    main()
