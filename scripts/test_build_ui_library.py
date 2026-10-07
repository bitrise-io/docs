#!/usr/bin/env python3
"""Hand-kept glossary corrections survive build_ui_library.py's weekly regeneration."""
import os
import sys
import tempfile
import unittest
from unittest import mock

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(REPO, ".github", "scripts"))

import build_ui_library as B  # noqa: E402

GLOSSARY = os.path.join(REPO, "localization", "ja-do-not-translate-glossary.yaml")


class OverridesTests(unittest.TestCase):
    def test_builder_applies_extras_and_never_protect(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(f"{tmp}/repo")
            open(f"{tmp}/repo/a.tsx", "w").write(
                "<b>Enable the</b> <b>Save token</b> <b>Add exclusions</b>")
            argv = ["build_ui_library.py", "--repo", f"{tmp}/repo", "--out-dir", tmp]
            with mock.patch.object(sys, "argv", argv), mock.patch("sys.stdout"), \
                 mock.patch.object(B, "EXTRA_UI_LABELS", {"context": ["Save token"], "step": ["Save NPM cache"]}), \
                 mock.patch.object(B, "NEVER_PROTECT", {"enable the"}):
                B.main()
            tiers = yaml.safe_load(open(f"{tmp}/ja-do-not-translate-glossary.yaml"))["do_not_translate"]
        self.assertEqual(tiers["ui_labels_hard_protect"], ["Add exclusions"])
        self.assertEqual(tiers["ui_labels_context_protect"], ["Save token"])
        self.assertEqual(tiers["step_names"], ["Save NPM cache"])

    def test_checked_in_glossary_matches_the_builder_overrides(self):
        tiers = yaml.safe_load(open(GLOSSARY, encoding="utf-8"))["do_not_translate"]
        context = set(tiers["ui_labels_context_protect"])
        always = {t for name, terms in tiers.items() if name != "ui_labels_context_protect" for t in terms}
        for tier, terms in B.EXTRA_UI_LABELS.items():
            for term in terms:
                self.assertIn(term, context if tier == "context" else always, tier)
        self.assertEqual({t for t in context | always if t.lower() in B.NEVER_PROTECT}, set())

    def test_every_extra_label_matches_when_written_as_bold_ui_text(self):
        # nt_terms wraps terms in \b: "(optional)" or "+ Add key" would never match.
        sys.path.insert(0, HERE)
        from nt_terms import TermMatcher
        matcher = TermMatcher(GLOSSARY, fetch_steps=False)
        for terms in B.EXTRA_UI_LABELS.values():
            for term in terms:
                self.assertIn(term, [m.base for m in matcher.find_matches(f"Click **{term}**.")])


if __name__ == "__main__":
    unittest.main()
