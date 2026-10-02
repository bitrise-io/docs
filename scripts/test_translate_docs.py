#!/usr/bin/env python3
"""Tests for the pure helpers in .github/scripts/translate_docs.py plus one
end-to-end run of main() with only the model call faked, so the real masking,
verification, heading-id, import-rewriting and routing code all executes.

Plain stdlib unittest, like test_prune_see_also.py. No network, no API key.

Usage:
    python3 scripts/test_translate_docs.py
"""
import argparse
import os
import re
import sys
import tempfile
import types
import unittest
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(REPO, ".github", "scripts"))
sys.path.insert(0, HERE)

import translate_docs as T  # noqa: E402

GLOSSARY = os.path.join(REPO, "localization", "ja-do-not-translate-glossary.yaml")


class PromoteBoldTests(unittest.TestCase):
    def test_plain_bold(self):
        self.assertEqual(T.promote_bold_to_strong("a **b** c"), "a <strong>b</strong> c")

    def test_adjacent_bold_spans_are_not_merged(self):
        self.assertEqual(
            T.promote_bold_to_strong("**a**で**b**を"),
            "<strong>a</strong>で<strong>b</strong>を",
        )

    def test_bold_ending_in_italic(self):
        self.assertEqual(
            T.promote_bold_to_strong("- **Key pair name - *required***:"),
            "- <strong>Key pair name - <em>required</em></strong>:",
        )

    def test_bold_ending_in_italic_followed_by_text(self):
        self.assertEqual(
            T.promote_bold_to_strong("**VPC - *required***: 選択します。"),
            "<strong>VPC - <em>required</em></strong>: 選択します。",
        )

    def test_two_such_spans_on_one_line_stay_separate(self):
        self.assertEqual(
            T.promote_bold_to_strong("**A - *x*** and **B - *y***"),
            "<strong>A - <em>x</em></strong> and <strong>B - <em>y</em></strong>",
        )

    def test_no_stranded_asterisk_remains(self):
        out = T.promote_bold_to_strong("**Name - *required***")
        self.assertNotIn("*required<", out)
        self.assertEqual(out.count("*"), 0)


class PartialImportTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        open(os.path.join(self.tmp.name, "have.mdx"), "w").close()

    def rewrite(self, text):
        return T.point_imports_at_translated_partials(text, self.tmp.name, "@site/i18n/ja/partials")

    def test_rewrites_when_translated_partial_exists(self):
        self.assertEqual(
            self.rewrite("import P from '@site/src/partials/have.mdx';"),
            "import P from '@site/i18n/ja/partials/have.mdx';",
        )

    def test_leaves_import_when_no_translation(self):
        line = "import P from '@site/src/partials/missing.mdx';"
        self.assertEqual(self.rewrite(line), line)

    def test_only_touches_partial_imports(self):
        line = "import Tabs from '@theme/Tabs';"
        self.assertEqual(self.rewrite(line), line)

    def test_rewrites_every_occurrence(self):
        text = ("import A from '@site/src/partials/have.mdx';\n"
                "import B from '@site/src/partials/have.mdx';\n")
        self.assertEqual(self.rewrite(text).count("@site/i18n/ja/partials/have.mdx"), 2)


class RouteTests(unittest.TestCase):
    ARGS = argparse.Namespace(
        src_root="docs", dest_root="i18n/ja/docs",
        partials_src_root="src/partials", partials_dest_root="i18n/ja/partials",
    )

    def test_page(self):
        self.assertEqual(T.route("docs/a/b.mdx", self.ARGS), "i18n/ja/docs/a/b.mdx")

    def test_partial(self):
        self.assertEqual(T.route("src/partials/x.mdx", self.ARGS), "i18n/ja/partials/x.mdx")

    def test_partial_root_is_not_confused_with_a_similarly_named_page(self):
        self.assertEqual(T.route("docs/src/partials/x.mdx", self.ARGS), "i18n/ja/docs/src/partials/x.mdx")


PAGE = """---
title: "A page"
slug: /a-page
---

import P from '@site/src/partials/note.mdx';
import Other from '@site/src/partials/other.mdx';

## Overview

Hello **world**.

<P />
<Other />

- **Key pair name - *required***: value

```bash
# not a heading
```

## Overview
"""

PARTIAL = """## Note

Be careful.
"""


def fake_translate(client, model, sysp, masked):
    """Stand-in for the model: keep every placeholder, mark each heading."""
    return re.sub(r"^(#{1,6} )(.*)$", r"\1JA-\2", masked, flags=re.M)


class EndToEndTests(unittest.TestCase):
    def run_main(self, tmp, files):
        argv = [
            "translate_docs.py", "--glossary", GLOSSARY,
            "--src-root", f"{tmp}/docs", "--dest-root", f"{tmp}/out/docs",
            "--partials-src-root", f"{tmp}/src/partials",
            "--partials-dest-root", f"{tmp}/out/partials",
            *files,
        ]
        fake_anthropic = types.SimpleNamespace(Anthropic=lambda: object())
        with mock.patch.object(sys, "argv", argv), \
             mock.patch.dict(sys.modules, {"anthropic": fake_anthropic}), \
             mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test"}), \
             mock.patch.object(T, "translate_verified", fake_translate):
            T.main()

    def test_partials_first_imports_rewritten_ids_and_bold(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(f"{tmp}/docs")
            os.makedirs(f"{tmp}/src/partials")
            open(f"{tmp}/docs/page.mdx", "w", encoding="utf-8").write(PAGE)
            open(f"{tmp}/src/partials/note.mdx", "w", encoding="utf-8").write(PARTIAL)
            # Page listed BEFORE its partial: the script must still translate
            # the partial first so the page can point at it.
            self.run_main(tmp, [f"{tmp}/docs/page.mdx", f"{tmp}/src/partials/note.mdx"])

            page = open(f"{tmp}/out/docs/page.mdx", encoding="utf-8").read()
            partial = open(f"{tmp}/out/partials/note.mdx", encoding="utf-8").read()

            self.assertIn("## JA-Note {#note}", partial)
            self.assertIn("import P from '@site/i18n/ja/partials/note.mdx';", page)
            self.assertIn("import Other from '@site/src/partials/other.mdx';", page)
            self.assertIn("## JA-Overview {#overview}", page)
            self.assertIn("## JA-Overview {#overview-1}", page)
            self.assertNotIn("# not a heading {#", page)
            self.assertIn("Hello <strong>world</strong>.", page)
            self.assertIn("<strong>Key pair name - <em>required</em></strong>: value", page)
            self.assertTrue(page.startswith("---\ntitle: \"A page\"\nslug: /a-page\n---\n"))

    def test_deleted_partial_removes_its_translation(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(f"{tmp}/out/partials")
            gone = f"{tmp}/out/partials/old.mdx"
            open(gone, "w").close()
            self.run_main(tmp, [f"D\t{tmp}/src/partials/old.mdx"])
            self.assertFalse(os.path.exists(gone))


if __name__ == "__main__":
    unittest.main()
