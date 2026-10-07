#!/usr/bin/env python3
"""Tests for scripts/ja_structure.py and its use in translate_docs.py."""
import os
import sys
import types
import unittest
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), ".github", "scripts"))

from ja_structure import structure_issues  # noqa: E402

SOURCE = """%%fm:title%% Title

## Setting up {#setup}

See [the guide](⟦p1⟧) and ![alt](⟦p2⟧).

:::note[Reference]
A [ref link][1] and a literal ]] stay as they are.
:::

```yaml
not: [a](link
```
"""
GOOD = """%%fm:title%% タイトル

## 設定 {#setup}

[ガイド](⟦p1⟧)と![alt](⟦p2⟧)を参照してください。

:::note[Reference]
[ref link][1]と ]] はそのまま残ります。
:::

```yaml
not: [a](link
```
"""


class StructureIssuesTests(unittest.TestCase):
    def test_faithful_translation_passes(self):
        self.assertEqual(structure_issues(SOURCE, GOOD), [])

    def test_dropped_opening_bracket(self):
        bad = GOOD.replace("[ガイド](", "ガイド](")
        self.assertEqual(structure_issues(SOURCE, bad), [
            "Markdown links/images: 2 in source, 1 in translation",
            "'](' without '[': 0 in source, 1 in translation"])

    def test_doubled_closing_bracket(self):
        bad = GOOD.replace("[ガイド](", "[ガイド]](")
        self.assertIn("']](' links: 0 in source, 1 in translation", structure_issues(SOURCE, bad))

    def test_lost_fence_heading_admonition_marker(self):
        bad = (GOOD.replace("## 設定", "設定").replace(":::\n\n```", "\n\n```")
               .replace("%%fm:title%% ", ""))
        self.assertEqual(structure_issues(SOURCE, bad), [
            "headings: 1 in source, 0 in translation",
            "admonition ':::' lines: 2 in source, 1 in translation",
            "%%marker%% lines: 1 in source, 0 in translation"])
        unfenced = GOOD.replace("```yaml\n", "").replace("```\n", "")
        self.assertEqual(structure_issues(SOURCE, unfenced),
                         ["fenced code blocks: 1 in source, 0 in translation"])

    def test_leftover_token(self):
        self.assertEqual(structure_issues("[a](/x)\n", "[a](/x) ⟦p3⟧\n"),
                         ["placeholder tokens: 0 in source, 1 in translation"])


class TranslateVerifiedTests(unittest.TestCase):
    def test_broken_structure_is_retried_then_skipped(self):
        import translate_docs as T
        bad = GOOD.replace("[ガイド](", "ガイド](")
        replies = iter([(bad, "end_turn"), (GOOD, "end_turn")])
        anthropic = types.SimpleNamespace(APIStatusError=OSError, APIConnectionError=OSError)
        with mock.patch.dict(sys.modules, {"anthropic": anthropic}), \
             mock.patch.object(T, "translate_text", lambda *a: next(replies)):
            self.assertEqual(T.translate_verified(None, "m", "s", SOURCE), GOOD)
        with mock.patch.dict(sys.modules, {"anthropic": anthropic}), \
             mock.patch.object(T, "translate_text", lambda *a: (bad, "end_turn")):
            self.assertIsNone(T.translate_verified(None, "m", "s", SOURCE))


class CheckCommittedPagesTests(unittest.TestCase):
    def run_check(self, ja_page):
        import tempfile
        import ja_structure as J
        en_page = "---\ntitle: A\nslug: /a\nsidebar_position: 6\n---\nSee [x](/y).\n"
        with tempfile.TemporaryDirectory() as root:
            for rel, text in (("docs/a.mdx", en_page),
                              ("i18n/ja/docusaurus-plugin-content-docs/current/a.mdx", ja_page)):
                os.makedirs(os.path.dirname(f"{root}/{rel}"), exist_ok=True)
                open(f"{root}/{rel}", "w", encoding="utf-8").write(text)
            with mock.patch.object(J, "ROOT", root), mock.patch("sys.stdout"):
                return J.check_committed_pages()

    def test_translated_page_matching_english_passes(self):
        self.assertEqual(self.run_check("---\ntitle: エー\nslug: /a\nsidebar_position: 6\n---\n[x](/y)を参照。\n"), 0)

    def test_broken_link_or_changed_sidebar_position_fails(self):
        self.assertEqual(self.run_check("---\ntitle: A\nslug: /a\nsidebar_position: 6\n---\nx](/y)を参照。\n"), 1)
        self.assertEqual(self.run_check("---\ntitle: A\nslug: /a\nsidebar_position: 3\n---\n[x](/y)を参照。\n"), 1)


if __name__ == "__main__":
    unittest.main()
