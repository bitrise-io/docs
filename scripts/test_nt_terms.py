#!/usr/bin/env python3
"""Tests for the UI-context gating in scripts/nt_terms.py."""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from nt_terms import TermMatcher  # noqa: E402

GLOSSARY = """do_not_translate:
  ui_labels_context_protect:
    - "Log in"
    - "Workspace owners"
    - "Select an option"
"""


class ListItemContextTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False) as f:
            f.write(GLOSSARY)
        cls.matcher = TermMatcher(f.name, fetch_steps=False)
        os.unlink(f.name)

    def matched(self, text):
        return [m.base for m in self.matcher.find_matches(text)]

    def test_list_item_that_is_only_the_label_is_ui(self):
        self.assertEqual(self.matched("- Workspace owners\n"), ["Workspace owners"])
        self.assertEqual(self.matched("1. Select an option:\n"), ["Select an option"])
        self.assertEqual(self.matched("- Workspace owners - always have access\n"), ["Workspace owners"])

    def test_list_item_that_opens_a_sentence_is_prose(self):
        self.assertEqual(self.matched("1. Log in to Bitrise and select your app.\n"), [])
        self.assertEqual(self.matched("1. Select an option to install the app to.\n"), [])

    def test_bold_and_click_verb_still_mark_ui(self):
        self.assertEqual(self.matched("1. Click **Log in** to continue.\n"), ["Log in"])
        self.assertEqual(self.matched("Then select Log in.\n"), ["Log in"])


if __name__ == "__main__":
    unittest.main()
