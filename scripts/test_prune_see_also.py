#!/usr/bin/env python3
"""Tests for prune_see_also.py's pure logic -- id derivation, diff parsing,
and the actual prune/remap. No git, no filesystem, no network: everything
here is plain data in, plain data out.

Deliberately plain stdlib unittest, not pytest -- this repo has no other
Python test tooling, and these three functions don't need fixtures or
parametrize to stay readable.

Usage:
    python3 scripts/test_prune_see_also.py
"""
import unittest

from prune_see_also import parse_changes, path_to_id, prune


class PathToIdTests(unittest.TestCase):
    def test_mdx_page(self):
        self.assertEqual(
            path_to_id("docs/bitrise-ci/foo.mdx"),
            "bitrise-ci/foo",
        )

    def test_md_page(self):
        self.assertEqual(path_to_id("docs/bitrise-ci/foo.md"), "bitrise-ci/foo")

    def test_outside_docs_dir(self):
        self.assertIsNone(path_to_id("src/components/SeeAlso/index.tsx"))

    def test_non_doc_extension(self):
        self.assertIsNone(path_to_id("docs/img/foo.png"))

    def test_excluded_api_reference_dir(self):
        self.assertIsNone(
            path_to_id("docs/bitrise-api/api-reference/activity-list.api.mdx")
        )
        self.assertIsNone(
            path_to_id("docs/bitrise-rde-api/api-reference/some-endpoint.api.mdx")
        )


class ParseChangesTests(unittest.TestCase):
    def test_delete(self):
        deleted, renamed = parse_changes(["D\tdocs/bitrise-ci/foo.mdx"])
        self.assertEqual(deleted, {"bitrise-ci/foo"})
        self.assertEqual(renamed, {})

    def test_rename(self):
        deleted, renamed = parse_changes(
            ["R100\tdocs/bitrise-ci/foo.mdx\tdocs/bitrise-ci/bar.mdx"]
        )
        self.assertEqual(deleted, set())
        self.assertEqual(renamed, {"bitrise-ci/foo": "bitrise-ci/bar"})

    def test_rename_without_minus_m_falls_back_to_delete(self):
        # Without -M, git reports an unpaired delete + add instead of one R
        # line. Should behave as a plain delete, not silently do nothing.
        deleted, renamed = parse_changes(
            [
                "D\tdocs/bitrise-ci/foo.mdx",
                "A\tdocs/bitrise-ci/bar.mdx",
            ]
        )
        self.assertEqual(deleted, {"bitrise-ci/foo"})
        self.assertEqual(renamed, {})

    def test_rename_to_same_id_is_ignored(self):
        # e.g. only the extension changed (.mdx -> .md); same doc id either way.
        deleted, renamed = parse_changes(
            ["R100\tdocs/bitrise-ci/foo.mdx\tdocs/bitrise-ci/foo.md"]
        )
        self.assertEqual(renamed, {})

    def test_excluded_and_malformed_lines_are_ignored(self):
        lines = [
            "",
            "M\tdocs/bitrise-ci/foo.mdx",
            "D\tdocs/bitrise-api/api-reference/activity-list.api.mdx",
            "D\tsrc/components/SeeAlso/index.tsx",
            "not-a-real-diff-line",
        ]
        deleted, renamed = parse_changes(lines)
        self.assertEqual(deleted, set())
        self.assertEqual(renamed, {})


class PruneTests(unittest.TestCase):
    def test_delete_removes_own_entry_and_all_references(self):
        data = {
            "a": ["b", "c"],
            "b": ["a"],
            "c": ["a", "b"],
        }
        data, changed = prune(data, deleted={"b"}, renamed={})
        self.assertTrue(changed)
        self.assertNotIn("b", data)
        self.assertEqual(data["a"], ["c"])
        self.assertEqual(data["c"], ["a"])

    def test_rename_remaps_own_entry_and_all_references(self):
        data = {
            "a": ["b", "c"],
            "b": ["a"],
            "c": ["a", "b"],
        }
        data, changed = prune(data, deleted=set(), renamed={"b": "b2"})
        self.assertTrue(changed)
        self.assertNotIn("b", data)
        self.assertEqual(data["b2"], ["a"])
        self.assertEqual(data["a"], ["b2", "c"])
        self.assertEqual(data["c"], ["a", "b2"])

    def test_page_with_no_related_ids_left_is_dropped(self):
        data = {"a": ["b"], "b": ["a"]}
        data, changed = prune(data, deleted={"b"}, renamed={})
        self.assertTrue(changed)
        # "a" only ever pointed to "b", which is now gone -- no entry left to show.
        self.assertNotIn("a", data)
        self.assertNotIn("b", data)

    def test_no_matching_ids_is_a_no_op(self):
        data = {"a": ["b", "c"]}
        original = {"a": ["b", "c"]}
        data, changed = prune(data, deleted={"z"}, renamed={"y": "y2"})
        self.assertFalse(changed)
        self.assertEqual(data, original)


if __name__ == "__main__":
    unittest.main()
