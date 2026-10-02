#!/usr/bin/env python3
"""Scratch helper: run translate_docs.py's own post-translation steps on
agent-produced translations, mirroring the tail of main() exactly:
verify tokens -> bold promotion -> unmask -> heading ids -> partial imports -> route+write.
"""
import argparse
import json
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, ".github", "scripts"))
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))

import translate_docs as T  # noqa: E402
from heading_ids import add_english_heading_ids  # noqa: E402

ARGS = argparse.Namespace(
    src_root="docs",
    dest_root="i18n/ja/docusaurus-plugin-content-docs/current",
    partials_src_root="src/partials",
    partials_dest_root="i18n/ja/partials",
    partials_import_prefix="@site/i18n/ja/partials",
)


def main():
    work_dir = sys.argv[1]
    only = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None  # optional: base names
    manifest = json.load(open(os.path.join(work_dir, "manifest.json")))
    # partials first, like main(), so pages can point at a partial written this run
    manifest.sort(key=lambda e: not e["src"].startswith("src/partials/"))
    failures, notes = [], []
    for entry in manifest:
        base, src = entry["base"], entry["src"]
        if only and base not in only:
            continue
        masked = open(os.path.join(work_dir, base + ".masked.md"), encoding="utf-8").read()
        tpath = os.path.join(work_dir, base + ".translated.md")
        if not os.path.isfile(tpath):
            print(f"  MISSING output for {src}")
            failures.append(src)
            continue
        translated = open(tpath, encoding="utf-8").read()
        store = json.load(open(os.path.join(work_dir, base + ".store.json"), encoding="utf-8"))
        frontmatter = open(os.path.join(work_dir, base + ".frontmatter.txt"), encoding="utf-8").read()

        problems = T.verify_tokens(masked, translated)
        if problems:
            print(f"  VERIFY FAILED {src}: {'; '.join(problems)}")
            failures.append(src)
            continue
        out = T.promote_bold_to_strong(translated)
        out = T.unmask(out, store)
        if T.TOKEN_RE.search(out):
            print(f"  UNRESOLVED PLACEHOLDER after unmask: {src}")
            failures.append(src)
            continue
        _, en_body = T.split_frontmatter(open(src, encoding="utf-8").read())
        out, note = add_english_heading_ids(en_body, out)
        if note:
            notes.append((src, note))
        out = T.point_imports_at_translated_partials(out, ARGS.partials_dest_root, ARGS.partials_import_prefix)
        dst = T.route(src, ARGS)
        os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
        open(dst, "w", encoding="utf-8").write(frontmatter + out)
        print(f"  OK {src}")
    n = len([e for e in manifest if not only or e["base"] in only])
    print(f"\n{n - len(failures)}/{n} files verified and written.")
    for src, note in notes:
        print(f"  HEADING-ID NOTE {src}: {note}")
    if failures:
        print("FAILED: " + ", ".join(failures))
        sys.exit(1)


if __name__ == "__main__":
    main()
