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

Also embedded in the prompt:
- Full-width Japanese punctuation (。 、).
- Keep the long-vowel mark on katakana loanwords (サーバー, not サーバ).
- Half-width numerals.
- Embedded English / product terms stay in Latin script inside the Japanese sentence.

*(The JTF **automated style-checker** that would enforce all of this mechanically is **[ROADMAP]** — see §8. Today these rules live only as prompt instructions.)*

## 3. What never gets translated  **[LIVE]**

Enforced by `ja-do-not-translate-glossary.yaml` (verified against the file):
- **Pattern-masked before the model sees the text** (`protect_patterns`): fenced code blocks, inline code, URLs, env vars, filenames, MDX/JSX components, admonitions, templates, front-matter keys. This is byte-exact and tested. URLs are **not** tagged and **not** translated.
- **Term lists kept English** (`do_not_translate`): `bitrise_products`, `bitrise_concepts`, `third_party`, `platforms_languages`, `acronyms`, `code_literals`, `ui_labels_hard_protect`, `step_names_and_field_labels`.
- **Context-protected** (`ui_labels_context_protect`): common words frozen only when they clearly refer to a UI element.

## 4. Terminology consistency — "same thing, same word, everywhere"  **[LIVE]**

Mechanism: a **preferred-translations map** — one approved Japanese rendering per English term we *do* translate — in its own file `ja-preferred-translations.yaml`, injected into every translation prompt via `translate_docs.py --preferred`.

```yaml
preferred_translations:
  "build number": "ビルド番号"
  "environment variable": "環境変数"
  # English term (lowercased) : the ONE approved Japanese rendering
```

- A term is either **kept English** (§3) **or** has a **fixed rendering here** — never both.
- **Why a separate file:** the glossary is regenerated weekly by the builder, which would overwrite terms added there. This file is human-owned; the builder never touches it, so edits are permanent. *(The old `preferred_translations:` stub inside the glossary is vestigial — ignore it; this file supersedes it.)*
- Growing this map is the main curation job: spot two renderings of one concept → pick one → add it here.

## 5. Reliability checklist that is TRUE today  **[LIVE]**

What actually makes the current output as good as LLM translation gets:
1. Code/URLs/identifiers physically masked, so they can't be mangled (tested byte-exact).
2. Product/UI/Step names forced to stay English via the glossary.
3. JTF register + orthography rules in the prompt.
4. Preferred-terms map for consistent terminology.
5. Claude is a strong model for JA (honorifics/omission handling).

## 6. Human calibration  **[PROCESS]**

Because there's no in-house linguist: have a fluent Japanese reader review a sample of pilot pages **once** to (a) confirm the house style, (b) seed/correct `ja-preferred-translations.yaml`, and (c) sanity-check the do-not-translate behavior. After that, the [LIVE] mechanisms run unattended. This is the single most valuable non-code step.

---

## 7. Reuse of existing translations — translation memory  **[ROADMAP — NOT BUILT]**

*Designed, not yet implemented. Do not assume this is running.*

Plan: a `ja-translation-memory.json` storing each English segment → approved Japanese, so identical English is reused verbatim (free + automatically consistent) instead of re-translated. Seed it from the old pre-drop `/ja/` pages: import old EN↔JA pairs, run them through the checks (§8); passing ones are reused, failing ones are re-translated. This is the "reuse existing translations unless they prove bad" behavior — but it needs building.

## 8. Automated quality gate & propagation  **[ROADMAP — NOT BUILT]**

*Designed, not yet implemented.*

- Automated checks in CI: JTF style-checker, a terminology check (every preferred term rendered its one way), a cross-page consistency check (no English segment rendered two ways), structure check. (Today only the do-not-translate masking is automated; the rest are manual/eyeball.)
- Invalidation & propagation: when a preferred rendering is fixed, invalidate every stored segment containing that term so the correction re-translates on every page ("fix once, fix everywhere"). Requires the translation memory (§7) to exist first.

---

## 9. How it's wired today (files)

| File | Role | Status |
|------|------|--------|
| `ja-do-not-translate-glossary.yaml` | patterns + do-not-translate terms | **LIVE** |
| `ja-preferred-translations.yaml` | terminology consistency map | **LIVE** |
| `translate_docs.py` | masks, injects style + glossary + preferred, translates | **LIVE** |
| translation memory / CI QA checks / invalidation | reuse + gates + propagation | **ROADMAP** |

Run today:
```bash
python3 translate_docs.py \
  --glossary ja-do-not-translate-glossary.yaml \
  --preferred ja-preferred-translations.yaml \
  --src-root docs --dest-root i18n/ja/... path/to/changed.md
```

## 10. Definition of done for a translated page (today)

- [ ] All protected terms/code/URLs still English (masking).
- [ ] Glossary terms kept English; preferred terms use their one rendering.
- [ ] Register/orthography read as natural です・ます Japanese (eyeball until the JTF checker is wired).
- [ ] Markdown/MDX structure intact.

---

### References
- JTF Japanese Standard Style Guide (translation) — base standard + free checker.
- Industry LLM-translation practice: isolation zones for code, prompt-embedded glossary, translation memory for reuse/consistency.
