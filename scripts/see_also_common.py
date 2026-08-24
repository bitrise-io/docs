"""Shared constants for the see-also pipeline.

Kept separate (and dependency-free -- no numpy/torch/sentence-transformers
imports here) so the embedding generator, the delete/rename pruner, and the
CI gate's file-count threshold all agree on which directories don't count,
without needing to import the heavy generator module just to read a constant.
"""

# Generated API reference docs: auto-generated from OpenAPI specs (not
# hand-written prose), and per-operation pages embed as near-duplicates of
# each other. Excluded from the embedding corpus, from every file-count used
# to decide whether to re-run it, and from the delete/rename pruner (a
# generated page being added/removed by a spec sync is not a "See also"
# event).
EXCLUDED_SOURCE_DIRS = ("bitrise-api/api-reference", "bitrise-rde-api/api-reference")
