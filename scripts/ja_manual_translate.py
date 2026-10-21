#!/usr/bin/env python3
"""
Translate docs to Japanese without the Anthropic API: the model call is done
by hand (by a Claude Code session) between two steps of this script.

It reuses translate_docs.py's own masking, verification and post-processing
(prepare_body / finish_body / plan_sections / assemble_sections), so a page
translated this way goes through exactly what a CI-translated page does:

    prepare   drift report -> per page, the masked English the translator reads
    (by hand) write NN.translated.md next to each NN.masked.md
    finalize  verify -> unmask -> heading ids -> partial imports -> write i18n/ja

prepare
    python3 scripts/ja_manual_translate.py prepare --drift drift.json --work-dir DIR
        [--whole docs/a.mdx,docs/b.mdx]

    The drift report comes from scripts/detect_ja_drift.py. A stale page is
    prepared as just its changed sections plus changed frontmatter values (the
    unchanged Japanese is kept byte for byte), a missing page as a whole page.
    --whole forces whole-page translation for the listed sources, the fallback
    when finalize says a page's sections can't be reassembled.

    Writes into DIR:
      system_prompt.txt  the translator's rules, with the preferred-terms map
      manifest.json      one entry per job (id, src, dst, mode, size)
      NN.masked.md       what to translate. Every ⟦pN⟧ token must come back
                         exactly once, untouched; `%%fm:title%% ...` and
                         `%%js:N%% ...` lines are short strings to translate
                         and return on their own lines, markers kept.
      NN.translated.md   (you write this one)

finalize
    python3 scripts/ja_manual_translate.py finalize --work-dir DIR [--only 00,03]

    Verifies each NN.translated.md (tokens, Markdown structure) and writes the
    page. A page that fails is not written; it is listed in DIR/results.json
    and the exit code is 1. Fix its NN.translated.md and rerun with --only.

Only a hand-written translation is verified here, never judged: fluency and
terminology are the translator's job (JA-TRANSLATION-GUIDE.md, system_prompt.txt).
"""
import argparse
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, ".github", "scripts"))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

import translate_docs as T  # noqa: E402
import translatable_strings as ts  # noqa: E402
from heading_ids import add_english_heading_ids  # noqa: E402
from ja_structure import structure_issues  # noqa: E402
from nt_terms import TermMatcher  # noqa: E402

GLOSSARY = os.path.join(ROOT, "localization", "ja-do-not-translate-glossary.yaml")
PREFERRED = os.path.join(ROOT, "localization", "ja-preferred-translations.yaml")
ROUTES = argparse.Namespace(
    src_root="docs",
    dest_root="i18n/ja/docusaurus-plugin-content-docs/current",
    partials_src_root="src/partials",
    partials_dest_root="i18n/ja/partials",
    partials_import_prefix="@site/i18n/ja/partials",
)


def read(path):
    return open(os.path.join(ROOT, path), encoding="utf-8").read()


def english_at(commit, path):
    r = subprocess.run(["git", "-C", ROOT, "show", f"{commit}:{path}"], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


def read_json(path):
    return json.load(open(path, encoding="utf-8"))


def prepare(a):
    os.makedirs(a.work_dir, exist_ok=True)
    patterns = T.load_protect_patterns(GLOSSARY)
    ctx = argparse.Namespace(patterns=patterns, matcher=TermMatcher(GLOSSARY, include_acronyms=True))
    sysp = T.system_prompt(T.load_preferred_translations(PREFERRED))
    with open(os.path.join(a.work_dir, "system_prompt.txt"), "w", encoding="utf-8") as f:
        f.write(sysp)

    whole = set(a.whole.split(",")) if a.whole else set()
    items = read_json(a.drift)["translate"]
    manifest = []
    for idx, item in enumerate(items):
        src, dst = item["src"], item["dst"]
        raw = read(src)
        frontmatter, body = T.split_frontmatter(raw)
        base = f"{idx:02d}"
        plan, old_raw, ja_raw = None, None, None
        if item["kind"] == "stale" and src not in whole:
            old_raw, ja_raw = english_at(item["ja_commit"], src), read(dst)
            plan = T.plan_sections(old_raw, raw, ja_raw) if old_raw is not None else None
        if plan is not None:
            mode, send_body, fm_values = "sections", plan["send_body"], plan["fm_send"]
            with open(os.path.join(a.work_dir, base + ".old.mdx"), "w", encoding="utf-8") as f:
                f.write(old_raw)
            with open(os.path.join(a.work_dir, base + ".ja.mdx"), "w", encoding="utf-8") as f:
                f.write(ja_raw)
        else:
            mode, send_body, fm_values = "whole", body, ts.extract_frontmatter(frontmatter)
        nothing = mode == "sections" and not plan["changed"] and not plan["fm_send"]
        masked, state = ("", {"store": {}, "jsx_strings": []}) if nothing else T.prepare_body(ctx, send_body, fm_values)
        with open(os.path.join(a.work_dir, base + ".masked.md"), "w", encoding="utf-8") as f:
            f.write(masked)
        write_json(os.path.join(a.work_dir, base + ".state.json"), state)
        entry = {"id": base, "src": src, "dst": dst, "kind": item["kind"], "mode": mode,
                 "needs_translation": not nothing, "masked_chars": len(masked)}
        if mode == "sections":
            entry["sections"] = f"{len(plan['changed'])} of {len(plan['new'])}"
        manifest.append(entry)
        print(f"  {base} {mode:8} {entry.get('sections', ''):7} {len(masked):>7} chars  {src}")
    write_json(os.path.join(a.work_dir, "manifest.json"), manifest)
    total = sum(e["masked_chars"] for e in manifest)
    print(f"\nPrepared {len(manifest)} page(s), {total:,} masked characters, in {a.work_dir}")


def finalize_one(entry, work_dir):
    """Returns (text_to_write, note) or raises ValueError with the reason."""
    base, src, dst = entry["id"], entry["src"], entry["dst"]
    raw = read(src)
    frontmatter, body = T.split_frontmatter(raw)
    masked = open(os.path.join(work_dir, base + ".masked.md"), encoding="utf-8").read()
    state = read_json(os.path.join(work_dir, base + ".state.json"))
    plan = None
    if entry["mode"] == "sections":
        plan = T.plan_sections(open(os.path.join(work_dir, base + ".old.mdx"), encoding="utf-8").read(), raw,
                               open(os.path.join(work_dir, base + ".ja.mdx"), encoding="utf-8").read())
        if plan is None:
            raise ValueError("sections can't be reused any more; prepare it again with --whole")
    result = None
    if entry["needs_translation"]:
        tpath = os.path.join(work_dir, base + ".translated.md")
        if not os.path.isfile(tpath):
            raise ValueError("no .translated.md")
        translated = open(tpath, encoding="utf-8").read()
        problems = T.verify_tokens(masked, translated) + structure_issues(masked, translated)
        if problems:
            raise ValueError("; ".join(problems))
        result = T.finish_body(masked, translated, state)
        if result is None:
            raise ValueError("unresolved placeholder after unmask")
    if plan is not None:
        result = T.assemble_sections(plan, result)
        if result is None:
            raise ValueError("assembled page doesn't match the English structure; "
                             "prepare it again with --whole")
    translated_body, fm_tr = result
    translated_body, heading_note = add_english_heading_ids(body, translated_body)
    translated_body = T.point_imports_at_translated_partials(
        translated_body, os.path.join(ROOT, ROUTES.partials_dest_root), ROUTES.partials_import_prefix)
    return ts.apply_frontmatter(frontmatter, fm_tr) + translated_body, heading_note


def finalize(a):
    manifest = read_json(os.path.join(a.work_dir, "manifest.json"))
    only = set(a.only.split(",")) if a.only else None
    # Partials first, so a page can point its import at one written this run.
    manifest.sort(key=lambda e: not e["src"].startswith("src/partials/"))
    results = {"written": [], "failed": [], "notes": []}
    for entry in manifest:
        if only and entry["id"] not in only:
            continue
        try:
            text, note = finalize_one(entry, a.work_dir)
        except ValueError as e:
            print(f"  FAILED {entry['src']}: {e}")
            results["failed"].append({"src": entry["src"], "id": entry["id"], "reason": str(e)})
            continue
        dst = os.path.join(ROOT, entry["dst"])
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"  OK     {entry['src']}")
        results["written"].append({"src": entry["src"], "dst": entry["dst"], "kind": entry["kind"],
                                   "mode": entry["mode"], "sections": entry.get("sections")})
        if note:
            results["notes"].append({"src": entry["src"], "note": f"heading ids not added: {note}"})
    write_json(os.path.join(a.work_dir, "results.json"), results)
    print(f"\n{len(results['written'])} written, {len(results['failed'])} failed")
    sys.exit(1 if results["failed"] else 0)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("prepare")
    p.add_argument("--drift", required=True, help="JSON from detect_ja_drift.py")
    p.add_argument("--work-dir", required=True)
    p.add_argument("--whole", default=None, help="comma-separated sources to translate as whole pages")
    f = sub.add_parser("finalize")
    f.add_argument("--work-dir", required=True)
    f.add_argument("--only", default=None, help="comma-separated job ids (e.g. 00,03)")
    a = ap.parse_args()
    {"prepare": prepare, "finalize": finalize}[a.cmd](a)


if __name__ == "__main__":
    main()
