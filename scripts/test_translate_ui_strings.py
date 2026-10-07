#!/usr/bin/env python3
"""Tests for scripts/translate_ui_strings.py. Run: python3 scripts/test_translate_ui_strings.py"""
import json
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), ".github", "scripts"))
import translate_ui_strings as U  # noqa: E402
import translate_docs as T  # noqa: E402


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False)


class Pending(unittest.TestCase):
    def test_needs_translation(self):
        self.assertTrue(U.needs_translation("Getting started"))
        self.assertFalse(U.needs_translation("はじめに"))
        self.assertFalse(U.needs_translation("{authorName} - {nPosts}"))
        self.assertFalse(U.needs_translation("42"))

    def test_settle_fills_known_skips_generated_api_and_collects_pending(self):
        with tempfile.TemporaryDirectory() as d:
            f = "docusaurus-plugin-content-docs/current.json"
            write(os.path.join(d, f), {
                "sidebar.ci.category.Workflows": {"message": "Workflows"},
                "sidebar.ci.category.Brand new": {"message": "Brand new"},
                "sidebar.api.doc.Get an app": {"message": "Get an app"},
                "sidebar.ci.category.Bitrise CLI": {"message": "Bitrise CLI"},
                "sidebar.ci.category.Done": {"message": "完了"},
            })
            changed, pending = U.settle(d, {"Workflows": "ワークフロー"}, {"Bitrise CLI"})
            data = json.load(open(os.path.join(d, f), encoding="utf-8"))
            self.assertEqual(changed, 1)
            self.assertEqual(pending, ["Brand new"])
            self.assertEqual(data["sidebar.ci.category.Workflows"]["message"], "ワークフロー")
            self.assertEqual(data["sidebar.api.doc.Get an app"]["message"], "Get an app")
            self.assertEqual(data["sidebar.ci.category.Bitrise CLI"]["message"], "Bitrise CLI")

    def test_same_label_in_two_sidebars_is_translated_identically(self):
        with tempfile.TemporaryDirectory() as d:
            f = "docusaurus-plugin-content-docs/current.json"
            write(os.path.join(d, f), {"a.category.Apps": {"message": "Apps"}, "b.category.Apps": {"message": "Apps"}})
            U.settle(d, {"Apps": "アプリ"}, set())
            data = json.load(open(os.path.join(d, f), encoding="utf-8"))
            self.assertEqual({v["message"] for v in data.values()}, {"アプリ"})


    def test_ascii_japanese_rendering_is_not_pending_again(self):
        with tempfile.TemporaryDirectory() as d:
            f = "docusaurus-plugin-content-docs/current.json"
            write(os.path.join(d, f), {"a.category.Webhooks": {"message": "Webhook"}})
            _, pending = U.settle(d, {"Webhooks": "Webhook"}, set())
            self.assertEqual(pending, [])


class Batch(unittest.TestCase):
    def test_placeholders_survive_and_identical_answers_become_keep(self):
        msgs = ["Expand category '{label}'", "Bitrise CLI"]
        masked, store = U.mask_batch(msgs, [], _NoTerms(), T)
        self.assertNotIn("{label}", masked)
        translated = masked.replace("Expand category", "カテゴリを展開")
        res, problems = U.read_batch(translated, masked, store, msgs, T)
        self.assertEqual(problems, [])
        self.assertEqual(res["Expand category '{label}'"], "カテゴリを展開 '{label}'")
        tr, keep = {}, set()
        U.record(tr, keep, {"Bitrise CLI": "Bitrise CLI", "Apps": "アプリ"})
        self.assertEqual((tr, keep), ({"Apps": "アプリ"}, {"Bitrise CLI"}))

    def test_dropped_token_or_line_is_a_problem(self):
        msgs = ["Use {x} here", "Other"]
        masked, store = U.mask_batch(msgs, [], _NoTerms(), T)
        _, problems = U.read_batch("%%u0%% ここ\n", masked, store, msgs, T)
        self.assertTrue(problems)


class Tighten(unittest.TestCase):
    def test_no_space_between_latin_and_japanese(self):
        self.assertEqual(U.tighten("API ガイド"), "APIガイド")
        self.assertEqual(U.tighten("GitHub Actions 向け Build Hub"), "GitHub Actions向けBuild Hub")
        self.assertEqual(U.tighten("Build Hub"), "Build Hub")


class _NoTerms:
    """TermMatcher stand-in: no glossary terms."""
    def find_matches(self, text):
        return []


if __name__ == "__main__":
    unittest.main()
