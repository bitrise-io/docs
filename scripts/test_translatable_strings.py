#!/usr/bin/env python3
"""Tests for scripts/translatable_strings.py. Run: python3 scripts/test_translatable_strings.py"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from translatable_strings import (  # noqa: E402
    apply_frontmatter, apply_jsx_strings, build_block, extract_frontmatter,
    extract_jsx_strings, normalized, parse_block, split_block)

FM = '---\ntitle: "Selective builds"\ndescription: Run less.\nsidebar_position: 3\nslug: /a/b\nsidebar_label: \'Select\'\nhide_title: true\n---\n'


class Frontmatter(unittest.TestCase):
    def test_extracts_only_the_three_keys(self):
        self.assertEqual(extract_frontmatter(FM),
                         {"title": "Selective builds", "description": "Run less.", "sidebar_label": "Select"})

    def test_folded_and_multiline_values_are_left_alone(self):
        fm = "---\ndescription: >\n  long\n  text\ntitle: T\n---\n"
        self.assertEqual(extract_frontmatter(fm), {"title": "T"})

    def test_apply_changes_nothing_but_the_listed_keys(self):
        out = apply_frontmatter(FM, {"title": "選択的ビルド"})
        self.assertIn('title: "選択的ビルド"', out)
        self.assertEqual(out.replace('title: "選択的ビルド"', 'title: "Selective builds"'), FM)

    def test_values_with_colons_and_quotes_stay_valid_yaml(self):
        import yaml
        out = apply_frontmatter(FM, {"description": 'A: "b" #c'})
        self.assertEqual(yaml.safe_load(out.strip("-\n"))["description"], 'A: "b" #c')


class JsxStrings(unittest.TestCase):
    BODY = ("import X from 'y';\n\n<ProductOverview\n  title=\"Bitrise CI\"\n"
            "  columns={[\n    {\n      label: 'Getting started',\n"
            "      href: '/a/b',\n      description: 'It\\'s quick.',\n    },\n  ]}\n/>\n\n"
            "```yaml\ntitle: \"in code\"\n```\n")

    def test_extracts_props_outside_code_only(self):
        new, strings = extract_jsx_strings(self.BODY)
        self.assertEqual([s[2] for s in strings], ["Bitrise CI", "Getting started", "It\\'s quick."])
        self.assertIn('title: "in code"', new)
        self.assertNotIn("href: '@@", new)

    def test_round_trip_without_translations_is_identity(self):
        new, strings = extract_jsx_strings(self.BODY)
        self.assertEqual(apply_jsx_strings(new, strings, {}), self.BODY)

    def test_translation_is_escaped_for_its_quote_style(self):
        new, strings = extract_jsx_strings(self.BODY)
        out = apply_jsx_strings(new, strings, {1: "はじめに", 2: "it's 簡単"})
        self.assertIn("label: 'はじめに',", out)
        self.assertIn("description: 'it\\'s 簡単',", out)
        out = apply_jsx_strings(new, strings, {0: 'a "b"'})
        self.assertIn('title="a &quot;b&quot;"', out)

    def test_hrefs_and_keys_are_never_touched(self):
        new, strings = extract_jsx_strings(self.BODY)
        out = apply_jsx_strings(new, strings, {0: "x", 1: "y", 2: "z"})
        self.assertIn("href: '/a/b',", out)
        self.assertIn("columns={[", out)


class Block(unittest.TestCase):
    def test_block_round_trip_with_prefix(self):
        block = build_block({"title": "T"}, [("'", ": ", "Hello")], prefix="p3:")
        found, rest = parse_block(block + "\n\nBody text\n")
        self.assertEqual(rest.strip(), "Body text")
        self.assertEqual(split_block(found, "p3:"), ({"title": "T"}, {0: "Hello"}))
        self.assertEqual(split_block(found, "p4:"), ({}, {}))

    def test_missing_keys_mean_keep_english(self):
        self.assertEqual(split_block({}, ""), ({}, {}))


class Normalized(unittest.TestCase):
    def test_whitespace_only_changes_compare_equal(self):
        self.assertEqual(normalized("a  b\n\nc "), normalized("a b c"))
        self.assertNotEqual(normalized("a b"), normalized("a c"))


if __name__ == "__main__":
    unittest.main()
