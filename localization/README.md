# Bitrise JA docs — UI copy library + translation pipeline

A self-updating system that (1) keeps a **UI copy library** in sync with the live product, (2) generates the **do-not-translate glossary** from it, and (3) **translates changed docs to Japanese** on every PR. Built so nothing goes stale — the library is as dynamic as the product.

## Why this exists (the three gaps it closes)

- **Coverage** — scans all product frontends *and* the Step library, so UI labels and Step names come from the real source, not guesswork.
- **Staleness** — a scheduled job re-scans and regenerates the library/glossary, so they track product changes automatically.
- **Sync** — when English docs change, the matching Japanese pages are re-translated on the same PR, so JA can never drift behind EN.

> **Standing assumption:** the Bitrise app UI is English-only for Japanese users, so every on-screen string stays English in the JA docs. Confirmed with product/frontend; revisit only if the app UI is ever localized to Japanese.

## The pieces

| File | What it does |
|------|--------------|
| `build_ui_library.py` | Scans frontend repos + `bitrise-steplib` + docs → emits `ui_copy_library.json` (reusable inventory) and `ja-do-not-translate-glossary.yaml` (tiered). Deterministic, CI-runnable. |
| `translate_docs.py` | Translates changed English `.md`/`.mdx` → Japanese via Claude, masking code/URLs and enforcing the glossary. |
| `.github/workflows/refresh-ui-library.yml` | Weekly + on-demand: rebuilds the library/glossary, opens a PR if anything changed. |
| `.github/workflows/translate-ja-docs.yml` | On docs PRs: translates the changed pages and commits the JA versions. |

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
                                 ▼   (on every docs PR)
                          translate_docs.py ──► i18n/ja/… committed to the PR
```

## Deploy (one-time, needs a repo admin)

1. In `bitrise-io/docs`, add:
   - `build_ui_library.py` and `translate_docs.py` → `.github/scripts/`
   - the two workflow files → `.github/workflows/`
   - the current `ja-do-not-translate-glossary.yaml` → `localization/`
2. Add repo secrets:
   - `ANTHROPIC_API_KEY` — for translation.
   - `CI_REPO_TOKEN` — a PAT or GitHub App token with **read** access to `bitrise-website`, `bitrise-workflow-editor`, `bitrise-codespaces`, `bitkit`, `bitrise-steplib` (the default `GITHUB_TOKEN` can't read other repos).
3. Adjust to your Docusaurus i18n layout: the `paths:` filter and `--src-root`/`--dest-root` in `translate-ja-docs.yml`.
4. Enable Actions. Run **Refresh UI copy library** once manually to seed `localization/`.

## Run locally (no CI)

```bash
pip install pyyaml anthropic
# rebuild library + glossary from local clones
python3 build_ui_library.py --repo ../bitrise-website --repo ../bitrise-workflow-editor \
  --repo ../bitrise-codespaces --repo ../bitkit --steplib ../bitrise-steplib --docs ../docs --out-dir .
# translate a page
ANTHROPIC_API_KEY=sk-... python3 translate_docs.py --glossary ja-do-not-translate-glossary.yaml \
  --src-root docs --dest-root i18n/ja/... path/to/changed.md
```

## Reuse beyond translation (UX copy library)

`ui_copy_library.json` is a structured inventory of every UI string — where it lives, how often, and how the docs reference it. That's directly useful for:
- **UX-copy consistency / staleness detection** — compare on-screen strings against docs/marketing to catch mismatches when the UI is renamed.
- **A single source of truth for terminology** — for the style guide, onboarding writers, keeping docs/app/marketing aligned.
- **Any future localization** — same library, any target language.

## Assumption — confirmed

**Confirmed with product/frontend:** the Bitrise app UI stays English-only for Japanese users, so docs keep UI labels in English to match the screen. (Revisit only if the app UI is ever localized to Japanese.)

## Confidence / honest caveats

- The extraction is regex-based → the glossary is a strong **candidate** list; a light human review keeps it airtight.
- The library is only as current as the last refresh run (weekly) — good enough for docs; the schedule can be tightened.
- First real translation should be eyeballed to confirm UI terms and Step names survived in English. After that, it's a proven loop.
