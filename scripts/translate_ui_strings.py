#!/usr/bin/env python3
"""
translate_ui_strings.py  —  Japanese for the strings that live in JSON, not Markdown
=====================================================================================
translate_docs.py handles pages and partials. The sidebar category labels, navbar
items, breadcrumb names, "See also" and similar UI strings live in the JSON files
`docusaurus write-translations` produces, so a new page or category adds English
entries that nothing translated. This script closes that gap.

    docusaurus write-translations --locale ja     # adds new keys, keeps existing values
    python3 scripts/translate_ui_strings.py ...   # translates what is still English

How it decides what is pending
  * An entry is pending when its message is pure ASCII, has real words outside
    `{placeholders}`, and is not already settled in the sidecar.
  * The sidecar `localization/ja-ui-strings.yaml` maps English text -> Japanese, so a
    label used in several sidebars is translated once, identically. `keep_english`
    lists strings that stay English (product names); a model answer equal to the
    English is recorded there automatically, so it is never asked again.
  * Keys under `sidebar.*.doc.*` are skipped: those are the operation names of the
    generated API reference, which is deliberately not translated.

Modes
  default     call the model (needs ANTHROPIC_API_KEY), like translate_docs.py
  --emit DIR  write the masked batch for a human/agent to translate, then stop
  --apply DIR read DIR's translated batch, verify, and write the results
"""
import argparse
import glob
import json
import os
import re
import sys

import yaml

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO_ROOT, ".github", "scripts"))
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))

JSON_FILES = (
    "code.json",
    "docusaurus-plugin-content-docs/current.json",
    "docusaurus-theme-classic/navbar.json",
    "docusaurus-theme-classic/footer.json",
)
SKIP_KEY_RE = re.compile(r"^sidebar\..*\.doc\.")
ICU_RE = re.compile(r"\{[^{}]*\}")
BATCH = 120


def needs_translation(message):
    words = ICU_RE.sub("", message)
    return message.isascii() and re.search(r"[A-Za-z]{2}", words) is not None


def load_sidecar(path):
    data = yaml.safe_load(open(path, encoding="utf-8")) if os.path.isfile(path) else None
    data = data or {}
    return dict(data.get("translations") or {}), set(data.get("keep_english") or [])


def save_sidecar(path, translations, keep):
    header = ("# English UI string -> Japanese, maintained by scripts/translate_ui_strings.py.\n"
              "# Edit a value to change that string everywhere; delete a line to have it re-translated.\n"
              "# keep_english: strings that intentionally stay English (product names).\n")
    with open(path, "w", encoding="utf-8") as f:
        f.write(header)
        yaml.safe_dump({"translations": dict(sorted(translations.items())),
                        "keep_english": sorted(keep)},
                       f, allow_unicode=True, sort_keys=False, width=1000)


def read_json(i18n_dir, rel):
    p = os.path.join(i18n_dir, rel)
    return json.load(open(p, encoding="utf-8")) if os.path.isfile(p) else None


def settle(i18n_dir, translations, keep):
    """Fill every entry the sidecar already knows. Returns (files_changed, pending)
    where pending is the sorted list of English strings still unknown."""
    pending, changed = set(), 0
    # A Japanese rendering can itself be plain ASCII ("Webhooks" -> "Webhook"):
    # that is a finished value, not new English.
    done = set(translations.values())
    for rel in JSON_FILES:
        data = read_json(i18n_dir, rel)
        if data is None:
            continue
        dirty = False
        for key, entry in data.items():
            msg = entry["message"]
            if SKIP_KEY_RE.match(key) or not needs_translation(msg) or msg in keep or msg in done:
                continue
            if msg in translations:
                entry["message"] = translations[msg]
                dirty = True
            else:
                pending.add(msg)
        if dirty:
            changed += 1
            with open(os.path.join(i18n_dir, rel), "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
    return changed, sorted(pending)


def mask_batch(messages, patterns, matcher, T):
    """-> (masked text of `%%uN%% msg` lines, token store)."""
    store, n = {}, 0
    lines = [f"%%u{i}%% {m}" for i, m in enumerate(messages)]
    text = "\n".join(lines)
    text, n = T.mask(text, [("icu", ICU_RE.pattern)] + patterns, store, n)
    text, n = T.mask_terms(text, matcher, store, n)
    return text, store


def read_batch(translated_text, masked_text, store, messages, T):
    """Verify and unmask a model answer. Returns ({english: japanese}, problems)."""
    problems = T.verify_tokens(masked_text, translated_text)
    got = {}
    for line in translated_text.split("\n"):
        m = re.match(r"^%%u(\d+)%%[ \t]?(.*)$", line.strip())
        if m:
            got[int(m.group(1))] = T.unmask(m.group(2).strip(), store)
    missing = [i for i in range(len(messages)) if i not in got]
    if missing:
        problems.append(f"missing lines: {missing[:10]}")
    return {messages[i]: ja for i, ja in got.items() if i < len(messages) and ja}, problems


CJK = "\u3040-\u30ff\u3400-\u9fff"
_SPACE_BEFORE_CJK = re.compile(rf"([A-Za-z0-9]) +(?=[{CJK}])")
_SPACE_AFTER_CJK = re.compile(rf"(?<=[{CJK}]) +(?=[A-Za-z0-9])")


def tighten(text):
    """House style: no space between Latin text and Japanese (AIエージェント, not AI エージェント)."""
    return _SPACE_AFTER_CJK.sub("", _SPACE_BEFORE_CJK.sub(r"\1", text))


def record(translations, keep, results):
    for en, ja in results.items():
        ja = tighten(ja)
        if ja == en:
            keep.add(en)
        else:
            translations[en] = ja


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--glossary", default="localization/ja-do-not-translate-glossary.yaml")
    ap.add_argument("--preferred", default="localization/ja-preferred-translations.yaml")
    ap.add_argument("--i18n-dir", default="i18n/ja")
    ap.add_argument("--sidecar", default="localization/ja-ui-strings.yaml")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--emit", metavar="DIR")
    mode.add_argument("--apply", metavar="DIR")
    a = ap.parse_args()

    import translate_docs as T
    from nt_terms import TermMatcher
    patterns = T.load_protect_patterns(a.glossary)
    matcher = TermMatcher(a.glossary, include_acronyms=True)
    translations, keep = load_sidecar(a.sidecar)

    if a.apply:
        meta = json.load(open(os.path.join(a.apply, "meta.json"), encoding="utf-8"))
        bad = 0
        for b in meta["batches"]:
            tp = os.path.join(a.apply, b["name"] + ".translated.md")
            if not os.path.isfile(tp):
                print(f"MISSING {tp}"); bad += 1; continue
            res, problems = read_batch(open(tp, encoding="utf-8").read(),
                                       open(os.path.join(a.apply, b["name"] + ".masked.md"), encoding="utf-8").read(),
                                       b["store"], b["messages"], T)
            if problems:
                print(f"VERIFY FAILED {b['name']}: {'; '.join(problems)}"); bad += 1; continue
            record(translations, keep, res)
        save_sidecar(a.sidecar, translations, keep)
        changed, pending = settle(a.i18n_dir, translations, keep)
        print(f"updated {changed} JSON file(s); {len(pending)} string(s) still pending")
        sys.exit(1 if bad else 0)

    changed, pending = settle(a.i18n_dir, translations, keep)
    print(f"{changed} JSON file(s) filled from the sidecar; {len(pending)} new string(s) to translate")
    if not pending:
        return
    chunks = [pending[i:i + BATCH] for i in range(0, len(pending), BATCH)]

    if a.emit:
        os.makedirs(a.emit, exist_ok=True)
        batches = []
        for n, msgs in enumerate(chunks):
            masked, store = mask_batch(msgs, patterns, matcher, T)
            name = f"ui_{n:02d}"
            open(os.path.join(a.emit, name + ".masked.md"), "w", encoding="utf-8").write(masked + "\n")
            batches.append({"name": name, "messages": msgs, "store": store})
        json.dump({"batches": batches}, open(os.path.join(a.emit, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False)
        print(f"emitted {len(chunks)} batch(es) to {a.emit}")
        return

    import anthropic
    client = anthropic.Anthropic()
    model = os.environ.get("TRANSLATE_MODEL", "claude-sonnet-5")
    sysp = T.system_prompt(T.load_preferred_translations(a.preferred)) + (
        "\nEvery input line is `%%uN%% text`: one short UI label. Keep the %%uN%% marker, "
        "translate only the text, and output exactly one line per input line, same order.")
    failed = 0
    for msgs in chunks:
        masked, store = mask_batch(msgs, patterns, matcher, T)
        out = T.translate_verified(client, model, sysp, masked)
        if out is None:
            failed += 1
            continue
        res, problems = read_batch(out, masked, store, msgs, T)
        if problems:
            print(f"  batch failed: {'; '.join(problems)}", file=sys.stderr)
            failed += 1
            continue
        record(translations, keep, res)
    save_sidecar(a.sidecar, translations, keep)
    settle(a.i18n_dir, translations, keep)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
