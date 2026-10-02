#!/usr/bin/env python3
"""Tests for heading_ids.py: slug rules (checked against github-slugger's
documented behaviour), pairing, fenced code, explicit ids and the skip cases.

Plain stdlib unittest. Usage:
    python3 scripts/test_heading_ids.py
"""
import unittest

from heading_ids import Slugger, add_english_heading_ids, plain_text, scan, slugify


class SlugTests(unittest.TestCase):
    def test_basic(self):
        self.assertEqual(slugify("Cache push mode"), "cache-push-mode")

    def test_punctuation_removed_spaces_not_collapsed(self):
        self.assertEqual(slugify("Before you start!"), "before-you-start")
        self.assertEqual(slugify("a - b"), "a---b")

    def test_underscore_and_hyphen_kept(self):
        self.assertEqual(slugify("snake_case-name"), "snake_case-name")

    def test_duplicates_are_numbered(self):
        s = Slugger()
        self.assertEqual([s.slug("Notes"), s.slug("Notes"), s.slug("Notes")],
                         ["notes", "notes-1", "notes-2"])


class PlainTextTests(unittest.TestCase):
    def test_markup_is_stripped(self):
        self.assertEqual(plain_text("Use `bitrise.yml` and **bold**"), "Use bitrise.yml and **bold**")
        self.assertEqual(plain_text("See [the guide](/x)"), "See the guide")
        self.assertEqual(plain_text("A <strong>b</strong>"), "A b")

    def test_explicit_id_is_removed(self):
        self.assertEqual(plain_text("Title {#custom}"), "Title")


class ScanTests(unittest.TestCase):
    def test_fenced_code_is_skipped(self):
        md = "## A\n\n```bash\n# comment\n```\n\n## B\n"
        self.assertEqual([h.raw for h in scan(md.split("\n"))], ["A", "B"])

    def test_indented_fence_inside_a_list(self):
        md = "1. step\n\n   ```bash\n   # comment\n   ```\n\n## After\n"
        self.assertEqual([h.raw for h in scan(md.split("\n"))], ["After"])

    def test_tilde_fence(self):
        md = "~~~\n# x\n~~~\n## Real\n"
        self.assertEqual([h.raw for h in scan(md.split("\n"))], ["Real"])


class AddIdsTests(unittest.TestCase):
    def test_adds_english_id(self):
        out, note = add_english_heading_ids("## Cache push mode\n", "## キャッシュのプッシュモード\n")
        self.assertIsNone(note)
        self.assertEqual(out, "## キャッシュのプッシュモード {#cache-push-mode}\n")

    def test_heading_left_in_english_is_untouched(self):
        out, note = add_english_heading_ids("## Webhooks\n", "## Webhooks\n")
        self.assertEqual(out, "## Webhooks\n")

    def test_existing_explicit_id_is_kept(self):
        en = "## Title\n"
        ja = "## タイトル {#already}\n"
        self.assertEqual(add_english_heading_ids(en, ja)[0], ja)

    def test_english_explicit_id_wins(self):
        out, _ = add_english_heading_ids("## Title {#chosen}\n", "## タイトル\n")
        self.assertEqual(out, "## タイトル {#chosen}\n")

    def test_duplicates_follow_english_numbering(self):
        en = "## Notes\n\n## Notes\n"
        ja = "## 注意\n\n## 注意\n"
        out, _ = add_english_heading_ids(en, ja)
        self.assertEqual(out, "## 注意 {#notes}\n\n## 注意 {#notes-1}\n")

    def test_fenced_comment_is_not_paired_with_a_heading(self):
        en = "## A\n\n```\n# x\n```\n\n## B\n"
        ja = "## あ\n\n```\n# x\n```\n\n## び\n"
        out, note = add_english_heading_ids(en, ja)
        self.assertIsNone(note)
        self.assertIn("## あ {#a}", out)
        self.assertIn("## び {#b}", out)

    def test_count_mismatch_is_skipped_with_a_reason(self):
        out, note = add_english_heading_ids("## A\n\n## B\n", "## あ\n")
        self.assertEqual(out, "## あ\n")
        self.assertIn("count differs", note)

    def test_level_mismatch_is_skipped_with_a_reason(self):
        out, note = add_english_heading_ids("## A\n", "### あ\n")
        self.assertEqual(out, "### あ\n")
        self.assertIn("level differs", note)

    def test_idempotent(self):
        once, _ = add_english_heading_ids("## Notes\n\n## Notes\n", "## 注意\n\n## 注意\n")
        twice, _ = add_english_heading_ids("## Notes\n\n## Notes\n", once)
        self.assertEqual(once, twice)

    def test_crlf_line_endings_are_preserved(self):
        out, _ = add_english_heading_ids("## Title\r\n", "## タイトル\r\n")
        self.assertEqual(out, "## タイトル {#title}\r\n")


if __name__ == "__main__":
    unittest.main()
