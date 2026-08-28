# Bitrise JA docs — UI copy library + translation pipeline

A self-updating system that (1) keeps a **UI copy library** in sync with the live product, (2) generates a **do-not-translate glossary** from it, and (3) **translates changed docs to Japanese** on every PR — masking every glossary-term occurrence out of the text structurally at translation time, then verifying every masked token survived. The docs source stays plain English — no translation markup — and the two term lists are the single source of truth. Built so nothing goes stale: the library is as dynamic as the product, and a glossary change takes effect everywhere on the next translation with a one-file diff.

## Why this exists (the four gaps it closes)

- **Coverage** — scans all product frontends *and* the Step library, so UI labels and Step names come from the real source, not guesswork.
- **Staleness** — a scheduled job re-scans and regenerates the library/glossary, so they track product changes automatically. Because protection is applied at translation time from the lists, the refresh PR touches only `localization/` — there's no re-tagging pass and no mass diff across the docs.
- **Reliability** — do-not-translate enforcement is **structural**, not instruction-following. Every glossary-term match is masked out of the text entirely before the translator ever sees it, the same way code and URLs already are — and after translation, every masked token is deterministically verified restored (retry, then hard-fail without committing). There's no term list for the model to (mis)follow, and no unprotected term to hope about.
- **Sync** — when English docs change, the matching Japanese pages are re-translated on the same PR, so JA can never drift behind EN. The bot commit only adds files under `i18n/ja/`; a contributor's own files are never touched.

> **Standing assumption:** the Bitrise app UI is English-only for Japanese users, so every on-screen string stays English in the JA docs. Confirmed with product/frontend; revisit only if the app UI is ever localized to Japanese.

## The pieces

| File | What it does |
|------|--------------|
| `build_ui_library.py` | Scans frontend repos + `bitrise-steplib` + docs → emits `ui_copy_library.json` (reusable inventory) and `ja-do-not-translate-glossary.yaml` (tiered). Deterministic, CI-runnable. |
| `../scripts/nt_terms.py` | The shared term matcher: loads the glossary tiers (generically, by name) plus canonical steplib Step titles, and applies every disambiguation rule (Title-Case gating, UI-context gating, exact-case acronyms, suffix splitting). Single source of matching semantics for the translator and the review tool. |
| `translate_docs.py` | Translates changed `.mdx` → Japanese via Claude. Masks fenced code, inline code, URLs, manual `<NT>` spans, other structural patterns, **and every glossary-term match** (via `nt_terms.py`) before the model sees the text, restores them verbatim after, then verifies every masked token survived — retrying and hard-failing rather than committing a bad page. Optionally injects a preferred-translations map for terms that ARE translated but need one consistent rendering. |
| `../scripts/add_notranslate_tags.py` | **Optional** review/escape-hatch tool, not part of the pipeline. Default mode reports what the matcher would protect on a page (exactly what a translation run masks); `--write` materializes `<NT>...</NT>` wrappers (see `src/components/NT`) for the rare page-specific case the lists can't decide — a manual span is masked before term matching, so it always wins. |
| `ja-preferred-translations.yaml` | Human-owned terminology-consistency map — one approved Japanese rendering per English term we *do* translate (e.g. "build number" → "ビルド番号"). Separate from the glossary because the glossary is regenerated weekly and would overwrite it. |
| `JA-TRANSLATION-GUIDE.md` | House rules for the translation (register, orthography, terminology) with a LIVE/PROCESS/ROADMAP status legend. |
| `.github/workflows/refresh-ui-library.yml` | Weekly + on-demand: rebuilds the library/glossary and opens a PR if anything changed — touching only `localization/`, a diff a human can actually review. |
| `.github/workflows/translate-ja-docs.yml` | On docs PRs: translates the changed pages and commits the JA versions. **Ships disabled** — gated on the existence of the `ANTHROPIC_API_KEY` secret; until it's added, the job skips silently on every PR. |
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
                                 ▼   (on every docs PR)
                          translate_docs.py
                 masks code/URLs/manual <NT> spans +
                 every glossary-term match (nt_terms.py),
                 translates the rest, restores the masks,
                 verifies every token survived (else fail)
                                 │
                                 ▼
                  i18n/ja/… committed to the PR
                                 │
                                 ▼
                      ja-style-check.yml (JTF lint)

 (optional, on demand: add_notranslate_tags.py — report what the matcher
  protects on a page, or --write a manual <NT> escape-hatch tag)
```

## Deploy (one-time, needs a repo admin)

1. In `bitrise-io/docs`, add:
   - `build_ui_library.py` and `translate_docs.py` → `.github/scripts/`
   - `nt_terms.py` and `add_notranslate_tags.py` → `scripts/` (repo root, alongside the other authoring scripts)
   - `src/components/NT/index.tsx` — the do-not-translate marker component (only needed for manual escape-hatch tags)
   - the workflow files → `.github/workflows/`
   - the current `ja-do-not-translate-glossary.yaml`, `ja-preferred-translations.yaml`, `JA-TRANSLATION-GUIDE.md` → `localization/`
   - `.textlintrc.yaml` → repo root
2. Add `NT` to the `ALLOWED` set in `docusaurus.config.ts`'s markdown preprocessor — it escapes any JSX tag name not on that list, so without this a manual `<NT>` renders as literal escaped text instead of the component.
3. Add the `CI_REPO_TOKEN` repo secret — a PAT or GitHub App token with **read** access to `bitrise-website`, `bitrise-workflow-editor`, `bitrise-codespaces`, `bitkit`, `bitrise-steplib` (the default `GITHUB_TOKEN` can't read other repos).
4. Enable Actions. Run **Refresh UI copy library** once manually to seed `localization/`. No tagging pass is needed — the docs source stays as-is; protection is applied at translation time.
5. When enough pages are migrated to keep `/ja/` in lock-step, add the `ANTHROPIC_API_KEY` repo secret — its existence is the ON switch for translate-on-PR. Until then the job skips silently on every docs PR.

## Run locally (no CI)

```bash
pip install pyyaml anthropic
# rebuild library + glossary from local clones
python3 .github/scripts/build_ui_library.py --repo ../bitrise-website --repo ../bitrise-workflow-editor \
  --repo ../bitrise-codespaces --repo ../bitkit --steplib ../bitrise-steplib --docs . --out-dir localization
# (optional) report what the matcher would protect on a page — what translation masks
python3 scripts/add_notranslate_tags.py docs/path/to/page.mdx
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
- The glossary extraction is regex-based → it's a strong **candidate** list; the matcher's contextual gating (bold/click-verb/UI-noun/list-item-start signals, in `nt_terms.py`) catches most false positives on ambiguous common words. For a page-specific miss in either direction, the manual `<NT>` escape hatch (`add_notranslate_tags.py --write`, or hand-placed) overrides the lists.
- The library/glossary are only as current as the last refresh run (weekly) — good enough for docs; the schedule can be tightened.
- Token verification guarantees masked content survives byte-exact, but it can't judge fluency — the first few real translations should still be eyeballed for how protected terms sit in the surrounding Japanese grammar. After that, it's a proven loop.
- `ja-preferred-translations.yaml` seed values need a fluent Japanese reviewer to confirm/replace before being treated as authoritative (see `JA-TRANSLATION-GUIDE.md`).
