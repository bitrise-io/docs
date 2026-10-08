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


class LinkMaskingTests(unittest.TestCase):
    """Only a link's target is masked; the model must see [text](⟦pN⟧)."""

    def mask(self, text):
        store = {}
        masked, _ = T.mask(text, T.load_protect_patterns(GLOSSARY), store)
        self.assertEqual(T.unmask(masked, store), text)  # round trip is exact
        return masked

    def test_internal_link_image_and_anchor_keep_brackets_visible(self):
        self.assertRegex(self.mask("See [the guide](/bitrise-ci/a) and ![alt](/img/b.png)."),
                         r"^See \[the guide\]\(⟦p\d+⟧\) and !\[alt\]\(⟦p\d+⟧\)\.$")
        self.assertRegex(self.mask("[Connect it](#connect-your-workspace)."),
                         r"^\[Connect it\]\(⟦p\d+⟧\)\.$")

    def test_filename_never_swallows_link_bracket_or_bold(self):
        self.assertRegex(self.mask("Open **bitrise.yml** or [Podfile.lock](/x)."),
                         r"^Open \*\*⟦p\d+⟧\*\* or \[⟦p\d+⟧\]\(⟦p\d+⟧\)\.$")

    def test_builder_emits_the_same_patterns(self):
        # build_ui_library.py regenerates the glossary weekly from PROTECT_PATTERNS.
        import build_ui_library as B
        glossary = dict(T.load_protect_patterns(GLOSSARY))
        for name, rx in B.PROTECT_PATTERNS:
            self.assertEqual(glossary.get(name), rx, name)


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


class TokenSpacingTests(unittest.TestCase):
    """The model glues tokens to each other and to Latin words; the space the
    English had between two Latin words comes back, nothing else changes."""

    def round_trip(self, english, model_output):
        from nt_terms import TermMatcher
        store = {}
        masked, n = T.mask(english, T.load_protect_patterns(GLOSSARY), store)
        masked, _ = T.mask_terms(masked, TermMatcher(GLOSSARY, fetch_steps=False,
                                                     include_acronyms=True), store, n)
        glued = model_output(masked)
        return T.unmask(T.restore_token_spacing(masked, glued, store), store)

    def test_observed_glued_phrases_get_their_space_back(self):
        # Cases from i18n/ja: OktaSSO, AndroidSDK, BitrisePipelineの設定, Xcode13.
        english = "Okta SSO, Android SDK, Bitrise Pipeline settings, Xcode 13"
        out = self.round_trip(english, lambda m: re.sub(r"\s*(⟦p\d+⟧)\s*", r"\1", m)
                              .replace("settings", "の設定"))
        self.assertEqual(out, "Okta SSO,Android SDK,Bitrise Pipelineの設定,Xcode 13")

    def test_suffix_japanese_and_markdown_stay_glued(self):
        out = self.round_trip("Add two Steps to **Workflow** settings.",
                              lambda m: m.replace("Add two ", "2つの").replace(" to ", "を")
                              .replace(" settings.", "の設定に追加します。"))
        self.assertEqual(out, "2つのStepsを**Workflow**の設定に追加します。")


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
    def run_main(self, tmp, files, translate=fake_translate):
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
             mock.patch.object(T, "translate_verified", translate):
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

    def test_failed_page_is_skipped_others_written_then_exit_1(self):
        # translate-ja-docs.yml commits whatever this wrote, then fails the job.
        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(f"{tmp}/docs")
            for name in ("good", "bad"):
                open(f"{tmp}/docs/{name}.mdx", "w", encoding="utf-8").write(f"## {name}\n")
            fail_bad = lambda c, m, s, masked: None if "bad" in masked else masked
            with self.assertRaises(SystemExit) as exit_:
                self.run_main(tmp, [f"{tmp}/docs/bad.mdx", f"{tmp}/docs/good.mdx"], fail_bad)
            self.assertEqual(exit_.exception.code, 1)
            self.assertTrue(os.path.isfile(f"{tmp}/out/docs/good.mdx"))
            self.assertFalse(os.path.exists(f"{tmp}/out/docs/bad.mdx"))

    def test_deleted_partial_removes_its_translation(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(f"{tmp}/out/partials")
            gone = f"{tmp}/out/partials/old.mdx"
            open(gone, "w").close()
            self.run_main(tmp, [f"D\t{tmp}/src/partials/old.mdx"])
            self.assertFalse(os.path.exists(gone))


HUB = """---
title: "Hub"
description: "About the hub."
sidebar_position: 2
slug: /hub
---

import ProductOverview from '@site/src/components/ProductOverview';

<ProductOverview
  title="Hub"
  columns={[
    {
      label: 'Getting started',
      href: '/hub/start',
    },
  ]}
/>

Intro text.
"""


def fake_translate_strings(client, model, sysp, masked):
    """Translate %%marker%% lines and prose; leave tokens alone."""
    out = re.sub(r"^(%%[^%]+%% )(.*)$", r"\1JA:\2", masked, flags=re.M)
    return re.sub(r"^Intro text\.$", "JA:Intro text.", out, flags=re.M)


class FrontmatterAndHubTests(EndToEndTests):
    def test_frontmatter_and_jsx_props_are_translated_and_syntax_survives(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(f"{tmp}/docs")
            open(f"{tmp}/docs/hub.mdx", "w", encoding="utf-8").write(HUB)
            with mock.patch.object(T, "translate_verified", fake_translate_strings):
                argv = ["translate_docs.py", "--glossary", GLOSSARY,
                        "--src-root", f"{tmp}/docs", "--dest-root", f"{tmp}/out/docs",
                        "--partials-src-root", f"{tmp}/src/partials",
                        "--partials-dest-root", f"{tmp}/out/partials", f"{tmp}/docs/hub.mdx"]
                with mock.patch.object(sys, "argv", argv), \
                     mock.patch.dict(sys.modules, {"anthropic": types.SimpleNamespace(Anthropic=lambda: object())}), \
                     mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test"}):
                    T.main()
            out = open(f"{tmp}/out/docs/hub.mdx", encoding="utf-8").read()
            self.assertIn('title: "JA:Hub"', out)
            self.assertIn('description: "JA:About the hub."', out)
            self.assertIn("sidebar_position: 2\nslug: /hub\n", out)
            self.assertIn('title="JA:Hub"', out)
            self.assertIn("label: 'JA:Getting started',", out)
            self.assertIn("href: '/hub/start',", out)
            self.assertNotIn("@@JS", out)
            self.assertNotIn("%%", out)
            self.assertIn("JA:Intro text.", out)

    def test_whitespace_only_change_is_not_retranslated(self):
        calls = []
        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(f"{tmp}/docs")
            os.makedirs(f"{tmp}/out/docs")
            open(f"{tmp}/out/docs/page.mdx", "w").write("existing")
            open(f"{tmp}/docs/page.mdx", "w", encoding="utf-8").write(PAGE + "\n\n")
            argv = ["translate_docs.py", "--glossary", GLOSSARY, "--base-ref", "BASE",
                    "--src-root", f"{tmp}/docs", "--dest-root", f"{tmp}/out/docs",
                    "--partials-src-root", f"{tmp}/src/partials",
                    "--partials-dest-root", f"{tmp}/out/partials", f"{tmp}/docs/page.mdx"]
            with mock.patch.object(sys, "argv", argv), \
                 mock.patch.dict(sys.modules, {"anthropic": types.SimpleNamespace(Anthropic=lambda: object())}), \
                 mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test"}), \
                 mock.patch.object(T, "english_at", lambda *_: PAGE), \
                 mock.patch.object(T, "translate_verified", lambda *a: calls.append(1)):
                T.main()
            self.assertEqual(calls, [])
            self.assertEqual(open(f"{tmp}/out/docs/page.mdx").read(), "existing")


EN_V1 = """---
title: "Fruit"
sidebar_position: 1
---

Intro.

## Quinces {#quinces}

Quince text with [a link](/quinces).

### Quince details

Detail text.

## Plums

Plum text.
"""

JA_V1 = """---
title: "果物"
sidebar_position: 1
---

はじめに。

## マルメロ {#quinces}

マルメロの[リンク](/quinces)。

### マルメロの詳細 {#quince-details}

詳細。

## すもも {#plums}

すももの本文。
"""


class SectionRetranslationTests(unittest.TestCase):
    """A page whose JA counterpart matches the English at --base-ref only has
    its changed sections sent; every other byte of the JA page is kept."""

    def run_main(self, new_en, old_en=EN_V1, ja=JA_V1, translate=None):
        calls = []

        def fake(client, model, sysp, masked):
            calls.append(masked)
            if translate:
                return translate(masked)
            out = re.sub(r"^(#{1,6} )(.*)$", r"\1JA-\2", masked, flags=re.M)
            return re.sub(r"^(%%[^%]+%% )", r"\1JA:", out, flags=re.M)

        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(f"{tmp}/docs")
            os.makedirs(f"{tmp}/out/docs")
            open(f"{tmp}/docs/page.mdx", "w", encoding="utf-8").write(new_en)
            open(f"{tmp}/out/docs/page.mdx", "w", encoding="utf-8").write(ja)
            argv = ["translate_docs.py", "--glossary", GLOSSARY, "--base-ref", "BASE",
                    "--src-root", f"{tmp}/docs", "--dest-root", f"{tmp}/out/docs",
                    "--partials-src-root", f"{tmp}/src/partials",
                    "--partials-dest-root", f"{tmp}/out/partials", f"{tmp}/docs/page.mdx"]
            with mock.patch.object(sys, "argv", argv), \
                 mock.patch.dict(sys.modules, {"anthropic": types.SimpleNamespace(Anthropic=lambda: object())}), \
                 mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test"}), \
                 mock.patch.object(T, "english_at", lambda *_: old_en), \
                 mock.patch.object(T, "translate_verified", fake):
                T.main()
            return open(f"{tmp}/out/docs/page.mdx", encoding="utf-8").read(), calls

    def test_only_the_changed_section_is_sent_the_rest_is_byte_identical(self):
        out, calls = self.run_main(EN_V1.replace("Plum text.", "Plum text, revised."))
        self.assertEqual(len(calls), 1)
        self.assertIn("Plum text, revised.", calls[0])
        self.assertNotIn("Quince", calls[0])
        self.assertNotIn("%%", calls[0])  # frontmatter unchanged: not sent
        self.assertEqual(out, JA_V1.replace("## すもも {#plums}\n\nすももの本文。",
                                            "## JA-Plums {#plums}\n\nPlum text, revised."))

    def test_new_section_is_inserted_in_english_order(self):
        out, calls = self.run_main(EN_V1.replace("## Plums", "## Cherries\n\nCherry text.\n\n## Plums"))
        self.assertEqual(len(calls), 1)
        self.assertNotIn("Plum", calls[0])
        self.assertEqual(out, JA_V1.replace("## すもも", "## JA-Cherries {#cherries}\n\nCherry text.\n\n## すもも"))

    def test_removed_section_is_dropped_without_a_model_call(self):
        out, calls = self.run_main(EN_V1.replace("### Quince details\n\nDetail text.\n\n", ""))
        self.assertEqual(calls, [])
        self.assertEqual(out, JA_V1.replace("### マルメロの詳細 {#quince-details}\n\n詳細。\n\n", ""))

    def test_frontmatter_only_change(self):
        out, calls = self.run_main(EN_V1.replace('title: "Fruit"', 'title: "Fruits"'))
        self.assertEqual(calls, ["%%fm:title%% Fruits\n\n"])
        self.assertEqual(out, JA_V1.replace('title: "果物"', 'title: "JA:Fruits"'))

    def test_non_translatable_frontmatter_change_is_copied_without_a_model_call(self):
        out, calls = self.run_main(EN_V1.replace("sidebar_position: 1", "sidebar_position: 4"))
        self.assertEqual(calls, [])
        self.assertEqual(out, JA_V1.replace("sidebar_position: 1", "sidebar_position: 4"))

    def assert_whole_page(self, calls):
        for text in ("Intro.", "Quince", "Plum"):
            self.assertIn(text, calls[-1])

    def test_falls_back_to_whole_page_when_ja_is_out_of_sync(self):
        new_en = EN_V1.replace("Plum text.", "Plum text, revised.")
        _, calls = self.run_main(new_en, ja=JA_V1.split("## すもも")[0])
        self.assertEqual(len(calls), 1)
        self.assert_whole_page(calls)

    def test_falls_back_to_whole_page_without_base_english(self):
        new_en = EN_V1.replace("Plum text.", "Plum text, revised.")
        _, calls = self.run_main(new_en, old_en=None)
        self.assertEqual(len(calls), 1)
        self.assert_whole_page(calls)

    def test_falls_back_to_whole_page_on_duplicate_ids(self):
        new_en = EN_V1.replace("## Plums", "## Plums {#quinces}")
        _, calls = self.run_main(new_en)
        self.assertEqual(len(calls), 1)
        self.assert_whole_page(calls)

    def test_falls_back_to_whole_page_when_assembled_structure_differs(self):
        # The section call drops the link; the page then has one link fewer
        # than the English, so the whole page is translated instead.
        new_en = EN_V1.replace("Quince text", "Quince prose")
        drop_link_once = lambda m: (re.sub(r"\[([^\]]*)\]\(⟦p\d+⟧\)", r"\1", m)
                                    if "Plum" not in m else m)
        out, calls = self.run_main(new_en, translate=drop_link_once)
        self.assertEqual(len(calls), 2)
        self.assert_whole_page(calls)
        self.assertIn("[a link](/quinces)", out)

    def test_changelog_entry_prepended_sends_only_that_entry(self):
        head = "<!-- changelog-entries -->\n\n## 2026 September\n\n"
        entry = ("### <time dateTime=\"2026-09-{d}\">2026-09-{d}</time> Entry {d} {{#entry-{d}}}\n\n"
                 "Entry {d} text. See [page](/p{d}).\n\n")
        ja_entry = ("### <time dateTime=\"2026-09-{d}\">2026-09-{d}</time> 項目{d} {{#entry-{d}}}\n\n"
                    "項目{d}の本文。[page](/p{d})を参照してください。\n\n")
        old_en = head + "".join(entry.format(d=d) for d in (29, 28, 27))
        ja = ("<!-- changelog-entries -->\n\n## 2026年9月 {#2026-september}\n\n"
              + "".join(ja_entry.format(d=d) for d in (29, 28, 27)))
        new_en = head + entry.format(d=30) + old_en[len(head):]
        out, calls = self.run_main(new_en, old_en=old_en, ja=ja)
        self.assertEqual(len(calls), 1)
        self.assertNotIn("Entry 29", calls[0])
        first = ja.index("### <time")
        self.assertEqual(out, ja[:first] + entry.format(d=30).replace("### ", "### JA-") + ja[first:])


class SplitSectionsTests(unittest.TestCase):
    def test_round_trip_and_ids(self):
        body = "Intro\n\n## A\n\nx\n\n```\n# not a heading\n```\n\n### B\n\ny\n## A\n"
        sections = T.split_sections(body)
        self.assertEqual("".join(t for _, t in sections), body)
        self.assertEqual([k for k, _ in sections], ["", "a", "b", "a-1"])

    def test_body_starting_with_a_heading_has_an_empty_preamble(self):
        self.assertEqual(T.split_sections("## A\nx"), [("", ""), ("a", "## A\nx")])


class PreferredTranslationsTests(unittest.TestCase):
    def test_no_preferred_term_is_also_kept_english_by_the_glossary(self):
        # ja-preferred-translations.yaml's own rule: kept English OR a fixed rendering, never both.
        from nt_terms import TermMatcher
        matcher = TermMatcher(GLOSSARY, fetch_steps=False)
        preferred = T.load_preferred_translations(
            os.path.join(REPO, "localization", "ja-preferred-translations.yaml"))
        self.assertEqual([t for t in preferred if matcher.find_matches(t)], [])


if __name__ == "__main__":
    unittest.main()
