# Bitrise Japanese Docs — Auto-Translation Guide

House rules for machine-translating docs.bitrise.io into Japanese as reliably as an LLM can, for a Claude-driven pipeline with no full-time in-house Japanese linguist.

**Status legend — read this first, so nothing here is mistaken for magic that isn't wired:**
- **[LIVE]** — implemented and working in the scripts today.
- **[PROCESS]** — a human step we recommend (not code).
- **[ROADMAP]** — designed here but **not built yet**; do not rely on it until it ships.

> **Standing assumption:** the Bitrise app UI is English-only for Japanese users, so on-screen labels, product names, Step names, code, and URLs stay in English; only the surrounding prose is translated.

Base standard: the **JTF Japanese Standard Style Guide (translation)** — native-authored, has an English edition and a free style-checker tool.

---

## 1. What Japanese to write — register & tone  **[LIVE]**

These rules are embedded in the translator's system prompt (`translate_docs.py`), so every run applies them:
- **Register:** polite **です・ます調** throughout; instructions as 〜してください / 〜します. No plain だ・である style. Light, neutral honorifics (no heavy keigo).
- **Voice:** clear and instructional; subject omission is natural — don't force 「あなた」.

## 2. Orthography  **[LIVE]**

Embedded in the prompt, and mechanically checked afterward:
- Full-width Japanese punctuation (。 、).
- Keep the long-vowel mark on katakana loanwords (サーバー, not サーバ).
- Half-width numerals.
- Embedded English / product terms stay in Latin script inside the Japanese sentence.

The JTF **automated style-checker** (`.github/workflows/ja-style-check.yml` + `.textlintrc.yaml`, textlint + `textlint-rule-preset-jtf-style`) runs on changed JA docs and mechanically enforces the JTF rule set — register, katakana long-vowels, punctuation, spacing. It's a non-blocking CI check for now (see its own file header: `.mdx`/JSX support needs validating on a sample page before it's trusted as a required check).

## 3. What never gets translated  **[LIVE]**

Enforcement is **structural**, not instruction-following — the model is never shown the protected text at all, so there's nothing for it to get wrong:

- **`<NT>...</NT>` tags in the docs source** are the actual mechanism. `scripts/add_notranslate_tags.py` reads `ja-do-not-translate-glossary.yaml` and wraps every occurrence of a protected term — product names, UI labels, Step names, Bitrise-specific concepts — directly in the `.mdx` source (see `src/components/NT`). `translate_docs.py` then masks whole `<NT>...</NT>` spans out of the text before the model sees it, the same way it masks code and URLs, and restores them verbatim afterward.
- **`ja-do-not-translate-glossary.yaml` is the *term source* for tagging, not something read at translation time.** `build_ui_library.py` regenerates it weekly from the live product + steplib + docs, and `add_notranslate_tags.py` re-runs to tag anything newly discovered. The tiers (`bitrise_products`, `bitrise_concepts`, `third_party`, `platforms_languages`, `acronyms`, `code_literals`, `ui_labels_hard_protect`, `step_names_and_field_labels`, `ui_labels_context_protect`) all still exist and mean what they did before — they now drive *tagging*, not *prompt instructions*.
- **`ui_labels_context_protect` terms** (common words that are only sometimes UI labels, e.g. "Add", "Details") are tagged contextually — only where the surrounding markdown already marks them as a literal UI reference (bold, a click/select verb just before, a button/dialog/toggle noun just after, or the start of a numbered procedure step). Elsewhere they're left as ordinary, translatable prose.
- **Pattern-masked before the model sees the text** (`protect_patterns` in the glossary, also used directly by `translate_docs.py`): fenced code blocks, inline code, URLs, `<NT>` spans, env vars, filenames, MDX/JSX components, admonitions, templates, front-matter keys. This is byte-exact and tested. URLs are **not** tagged with `<NT>` and **not** translated — the `url` pattern masks them independently.
- **Inflectional suffixes are NOT frozen with the term.** `<NT>Step</NT>'s`, not `<NT>Step's</NT>` — the plural/possessive "s" sits outside the tag so the model can drop it or replace it with の, since Japanese has no plural marker and shows possession with の, not an appended "s". This applies both to fresh term matches and to pre-existing `<GlossTerm baseform="X">Y</GlossTerm>` spans that get wrapped in `<NT>`.
- **Front matter is never sent to the model.** `translate_docs.py` splits it off before masking/translating and reattaches it untouched — `title`/`description` stay in English for now (see the "Known gaps" section in `README.md`), and `slug` can never be touched no matter what the model does.

## 4. Terminology consistency — "same thing, same word, everywhere"  **[LIVE]**

Mechanism: a **preferred-translations map** — one approved Japanese rendering per English term we *do* translate — in its own file `ja-preferred-translations.yaml`, injected into every translation prompt via `translate_docs.py --preferred`.

```yaml
preferred_translations:
  "build number": "ビルド番号"
  "environment variable": "環境変数"
  # English term (lowercased) : the ONE approved Japanese rendering
```

- A term is either **kept English via `<NT>`** (§3) **or** has a **fixed rendering here** — never both.
- **Why a separate file:** the glossary is regenerated weekly by the builder, which would overwrite terms added there. This file is human-owned; the builder never touches it, so edits are permanent. *(The old `preferred_translations:` stub inside the glossary is vestigial — ignore it; this file supersedes it.)*
- Growing this map is the main curation job: spot two renderings of one concept → pick one → add it here.

## 5. Reliability checklist that is TRUE today  **[LIVE]**

What actually makes the current output as good as LLM translation gets:
1. Code/URLs/identifiers physically masked, so they can't be mangled (tested byte-exact).
2. Product/UI/Step names tagged with `<NT>` directly in the docs and physically masked out before translation — the model never sees them, so it can't mistranslate them.
3. JTF register + orthography rules in the prompt, mechanically checked afterward by the textlint JTF style checker.
4. Preferred-terms map for consistent terminology.
5. Claude is a strong model for JA (honorifics/omission handling).

## 6. Human calibration  **[PROCESS]**

Because there's no in-house linguist: have a fluent Japanese reader review a sample of pilot pages **once** to (a) confirm the house style, (b) seed/correct `ja-preferred-translations.yaml`, and (c) sanity-check that the `<NT>`-tagged terms actually read naturally with the surrounding Japanese grammar (the inflection-split behavior in particular — see §3). After that, the [LIVE] mechanisms run unattended. This is the single most valuable non-code step.

---

## 7. Reuse of existing translations — translation memory  **[ROADMAP — NOT BUILT]**

*Designed, not yet implemented. Do not assume this is running.*

Plan: a `ja-translation-memory.json` storing each English segment → approved Japanese, so identical English is reused verbatim (free + automatically consistent) instead of re-translated. Seed it from the old pre-drop `/ja/` pages: import old EN↔JA pairs, run them through the checks (§8); passing ones are reused, failing ones are re-translated. This is the "reuse existing translations unless they prove bad" behavior — but it needs building.

## 8. Automated quality gate & propagation  **[PARTIALLY LIVE / ROADMAP]**

- JTF style-checker: **[LIVE]**, see §2 — non-blocking until validated on `.mdx`.
- A terminology check (every preferred term rendered its one way), a cross-page consistency check (no English segment rendered two ways), a structure check: **[ROADMAP — NOT BUILT]**.
- Invalidation & propagation: when a preferred rendering is fixed, invalidate every stored segment containing that term so the correction re-translates on every page ("fix once, fix everywhere"). Requires the translation memory (§7) to exist first. **[ROADMAP — NOT BUILT]**.

---

## 9. How it's wired today (files)

| File | Role | Status |
|------|------|--------|
| `ja-do-not-translate-glossary.yaml` | protect_patterns + term source for `<NT>` tagging | **LIVE** |
| `../scripts/add_notranslate_tags.py` | tags protected terms with `<NT>` directly in the docs | **LIVE** |
| `../src/components/NT` | the do-not-translate marker component | **LIVE** |
| `ja-preferred-translations.yaml` | terminology consistency map | **LIVE** |
| `translate_docs.py` | masks `<NT>`/code/URLs, injects style + preferred, translates | **LIVE** |
| `.github/workflows/ja-style-check.yml` + `.textlintrc.yaml` | JTF style checker (textlint) | **LIVE** (non-blocking) |
| translation memory / terminology & consistency CI checks / invalidation | reuse + gates + propagation | **ROADMAP** |

Run today:
```bash
python3 scripts/add_notranslate_tags.py   # tag any new terms first (idempotent)
python3 .github/scripts/translate_docs.py \
  --glossary localization/ja-do-not-translate-glossary.yaml \
  --preferred localization/ja-preferred-translations.yaml \
  --src-root docs --dest-root i18n/ja/docusaurus-plugin-content-docs/current \
  path/to/changed.mdx
```

## 10. Definition of done for a translated page (today)

- [ ] All `<NT>`-tagged terms, code, and URLs still English (masking).
- [ ] Preferred terms use their one rendering.
- [ ] Register/orthography read as natural です・ます Japanese (JTF style checker passes; eyeball until it's validated as a required check).
- [ ] Markdown/MDX structure intact, including inflectional suffixes split naturally from `<NT>` terms (no stray English "'s" or plural "s").

---

### References
- JTF Japanese Standard Style Guide (translation) — base standard + free checker.
- Industry LLM-translation practice: isolation zones for code, structural do-not-translate markup, translation memory for reuse/consistency.
