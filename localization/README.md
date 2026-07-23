# Bitrise JA docs — UI copy library + translation pipeline

A self-updating system that (1) keeps a **UI copy library** in sync with the live product, (2) generates a **do-not-translate glossary** from it, (3) uses that glossary to **tag protected terms directly in the docs** with `<NT>`, and (4) **translates changed docs to Japanese** on every PR — masking those tags out structurally rather than instructing the model to avoid a term list. Built so nothing goes stale — the library is as dynamic as the product, and the docs always carry their own protection.

## Why this exists (the four gaps it closes)

- **Coverage** — scans all product frontends *and* the Step library, so UI labels and Step names come from the real source, not guesswork.
- **Staleness** — a scheduled job re-scans and regenerates the library/glossary, so they track product changes automatically — and re-tags the docs so newly discovered terms get covered too.
- **Reliability** — do-not-translate enforcement is **structural**, not instruction-following. A term wrapped in `<NT>...</NT>` in the docs source is masked out of the text entirely before the translator ever sees it, the same way code and URLs already are. There's no glossary term list for the model to (mis)follow at translation time.
- **Sync** — when English docs change, the matching Japanese pages are re-translated on the same PR, so JA can never drift behind EN.

> **Standing assumption:** the Bitrise app UI is English-only for Japanese users, so every on-screen string stays English in the JA docs. Confirmed with product/frontend; revisit only if the app UI is ever localized to Japanese.

## The pieces

| File | What it does |
|------|--------------|
| `build_ui_library.py` | Scans frontend repos + `bitrise-steplib` + docs → emits `ui_copy_library.json` (reusable inventory) and `ja-do-not-translate-glossary.yaml` (tiered). Deterministic, CI-runnable. |
| `../scripts/add_notranslate_tags.py` | Reads the glossary and wraps every occurrence of a protected term directly in the docs source with `<NT>...</NT>` (see `src/components/NT`). This — not the glossary file itself — is what actually protects terms during translation; the glossary is just its term source. Idempotent: safe to re-run any time. |
| `translate_docs.py` | Translates changed `.mdx` → Japanese via Claude. Masks fenced code, inline code, URLs, whole `<NT>` spans, and a few other structural patterns before the model sees the text, then restores them verbatim after. Optionally injects a preferred-translations map for terms that ARE translated but need one consistent rendering. |
| `ja-preferred-translations.yaml` | Human-owned terminology-consistency map — one approved Japanese rendering per English term we *do* translate (e.g. "build number" → "ビルド番号"). Separate from the glossary because the glossary is regenerated weekly and would overwrite it. |
| `JA-TRANSLATION-GUIDE.md` | House rules for the translation (register, orthography, terminology) with a LIVE/PROCESS/ROADMAP status legend. |
| `.github/workflows/refresh-ui-library.yml` | Weekly + on-demand: rebuilds the library/glossary, re-tags the docs with `add_notranslate_tags.py`, opens a PR if anything changed. |
| `.github/workflows/translate-ja-docs.yml` | On docs PRs: translates the changed pages and commits the JA versions. |
| `.github/workflows/ja-style-check.yml` + `.textlintrc.yaml` | Runs the JTF Japanese Standard Style Guide checker (textlint) on changed JA docs — the automated stand-in for a native reviewer on style/orthography, not meaning. |

## How it flows

```
 product frontends + steplib + docs
                │  (weekly)
                ▼
        build_ui_library.py
                │
      ┌─────────┴──────────┐
      ▼                    ▼
 ui_copy_library.json   ja-do-not-translate-glossary.yaml
 (UX/consistency reuse)          │
                                 ▼
                    add_notranslate_tags.py
                                 │
                      <NT>...</NT> tags land
                      directly in docs/**/*.mdx
                                 │
                                 ▼   (on every docs PR)
                          translate_docs.py
                    masks <NT> spans + code/URLs,
                    translates the rest, restores them
                                 │
                                 ▼
                  i18n/ja/… committed to the PR
                                 │
                                 ▼
                      ja-style-check.yml (JTF lint)
```

## Deploy (one-time, needs a repo admin)

1. In `bitrise-io/docs`, add:
   - `build_ui_library.py` and `translate_docs.py` → `.github/scripts/`
   - `add_notranslate_tags.py` → `scripts/` (repo root, alongside the other authoring scripts)
   - `src/components/NT/index.tsx` — the do-not-translate marker component
   - the workflow files → `.github/workflows/`
   - the current `ja-do-not-translate-glossary.yaml`, `ja-preferred-translations.yaml`, `JA-TRANSLATION-GUIDE.md` → `localization/`
   - `.textlintrc.yaml` → repo root
2. Add `NT` to the `ALLOWED` set in `docusaurus.config.ts`'s markdown preprocessor — it escapes any JSX tag name not on that list, so without this every `<NT>` renders as literal escaped text instead of the component.
3. Add repo secrets:
   - `ANTHROPIC_API_KEY` — for translation.
   - `CI_REPO_TOKEN` — a PAT or GitHub App token with **read** access to `bitrise-website`, `bitrise-workflow-editor`, `bitrise-codespaces`, `bitkit`, `bitrise-steplib` (the default `GITHUB_TOKEN` can't read other repos).
4. Enable Actions. Run **Refresh UI copy library** once manually to seed `localization/`, then run `python3 scripts/add_notranslate_tags.py` once across the whole `docs/` tree to tag existing content.

## Run locally (no CI)

```bash
pip install pyyaml anthropic
# rebuild library + glossary from local clones
python3 .github/scripts/build_ui_library.py --repo ../bitrise-website --repo ../bitrise-workflow-editor \
  --repo ../bitrise-codespaces --repo ../bitkit --steplib ../bitrise-steplib --docs . --out-dir localization
# tag the docs with <NT> for every glossary term (idempotent, safe to re-run)
python3 scripts/add_notranslate_tags.py
# translate a page
ANTHROPIC_API_KEY=sk-... python3 .github/scripts/translate_docs.py \
  --glossary localization/ja-do-not-translate-glossary.yaml \
  --preferred localization/ja-preferred-translations.yaml \
  --src-root docs --dest-root i18n/ja/docusaurus-plugin-content-docs/current \
  path/to/changed.mdx
```

## Reuse beyond translation (UX copy library)

`ui_copy_library.json` is a structured inventory of every UI string — where it lives, how often, and how the docs reference it. That's directly useful for:
- **UX-copy consistency / staleness detection** — compare on-screen strings against docs/marketing to catch mismatches when the UI is renamed.
- **A single source of truth for terminology** — for the style guide, onboarding writers, keeping docs/app/marketing aligned.
- **Any future localization** — same library, any target language.

## Assumption — confirmed

**Confirmed with product/frontend:** the Bitrise app UI stays English-only for Japanese users, so docs keep UI labels in English to match the screen. (Revisit only if the app UI is ever localized to Japanese.)

## Known gaps / honest caveats

- **Front matter is not translated.** `translate_docs.py` splits front matter off and never sends it to the model, so `title`/`description`/`slug` stay in English in the JA output. This sidesteps any risk of the model touching `slug` (which would break routing/redirects), but means page titles in the JA site nav are currently still English. If title/description translation is wanted, it needs its own narrower mechanism that explicitly never touches `slug` — don't just remove the front-matter split.
- The glossary extraction is regex-based → it's a strong **candidate** list; `add_notranslate_tags.py`'s contextual gating (bold/click-verb/UI-noun/list-item-start signals) catches most false positives on ambiguous common words, but a light human review of the tagged docs is still advisable after a large re-tag.
- The library/glossary are only as current as the last refresh run (weekly) — good enough for docs; the schedule can be tightened.
- First real translation should be eyeballed to confirm UI terms and Step names survived in English. After that, it's a proven loop.
- `ja-preferred-translations.yaml` seed values need a fluent Japanese reviewer to confirm/replace before being treated as authoritative (see `JA-TRANSLATION-GUIDE.md`).
