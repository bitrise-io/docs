# Bitrise documentation — contributor guide

This repo is the source of [docs.bitrise.io](https://docs.bitrise.io). It's a Docusaurus 3 site sourced from Markdown / MDX in `docs/` plus reusable fragments in `src/partials/`. Anyone editing here — human or AI — must keep the build green and **all 444 live URLs intact**. The rules below let you do that deterministically.

If a question isn't answered here, the canonical sources are:
- [Bitrise Style Guide on Confluence](https://bitrise.atlassian.net/wiki/spaces/CX/pages/35029184/Style+Guide) — voice, tone, terminology, formatting (longer-form)
- `migration/glossary.json` — every Bitrise-specific term we recognize
- `migration/partials_index.json` — every reusable content chunk

## Run locally

See [README.md](./README.md#run-the-docs-locally) — it has the full step-by-step (Node install → `npm install` → `npm start`).

---

## Repo layout

| Path | What it's for | Touch when |
|---|---|---|
| `docs/<section>/<page>.md` (or `.mdx`) | A documentation page. Subfolder structure becomes the sidebar tree. | Editing or adding pages. |
| `docs/<section>/<sub>/_category_.json` | Sidebar category metadata (label, position, optional link). `link: null` means "non-clickable toggle". | Renaming/reordering sidebar entries; never delete by hand. |
| `src/partials/<slug>.mdx` | Reusable content fragment imported by `<Partial_X />`. **Edit here once, every consumer updates.** | Editing shared content; adding new reusable chunks. |
| `static/img/<topic>/<file>.png` | Static images served at `/img/<topic>/<file>.png`. UUID-prefixed files in `_paligo/` are migration-managed — don't rename. | Adding new screenshots; replacing existing ones. |
| `static/llms.txt` | Hand-curated index of the docs for AI agents (#114). `docusaurus-plugin-llms` generates `llms-full.txt` and per-page `.md` mirrors, but not the root `llms.txt` — that file is maintained by hand. | Adding a product area or major section; renaming or moving a page listed in it. |
| `src/pages/index.tsx` | The portal landing page (`/`). | Changing the homepage cards/links. |
| `src/components/GlossTerm/` | Tooltip glossary component. | Almost never. |
| `migration/` | Paligo→Markdown converter + supporting JSON (URL map, partial index, glossary, nav labels). | Re-running the full migration only. |
| `docusaurus.config.ts` | Site config + `markdown.preprocessor` (escapes JSX-looking text, expands list-context partials). | Changing site-wide config, navbar, footer, integrations. |
| `redirects.json` | Cloudflare redirect rules. The 444 live URLs are the source of truth. | Anytime a page slug changes. |
| `src/css/custom.css` | Brand colors and Docusaurus IFM overrides. | Visual changes. |

---

## Writing style

The full guide is on Confluence. The actionable rules:

### Voice

We talk to people, not at them. **American English.** Three properties:

- **Clear** — a quick scan tells the reader what the page is about.
- **Direct** — get to the point. Lead with what they need.
- **Helpful** — the goal is to help users get things done, not to impress.

### Examples (verbose ✗ / scannable ✓)

| ✗ Don't | ✓ Do |
|---|---|
| Configure your Bitrise user account to receive email notifications on the subject of the builds triggered either automatically or manually. | Set up email notifications for your builds on your account. |
| Bitrise is a platform with many different capabilities. We have a lot of features that are very simple to use for your Continuous Integration needs. | Bitrise is a CI/CD service that is easy to use, with a wide range of features. |
| The setting enables user-created tests with valid targets only. | Set it to run your tests but make sure they have valid targets. |
| The bitrise.yml will determine the configuration of your build. | The `bitrise.yml` determines the configuration of your build. |
| An Organization is set up from the Account settings page of a user's account. | Set up a new Organization from the **Account settings** page of your account. |

### Grammar

- **Tense:** present. Things you describe happen now, not later.
- **Voice:** active. ("Bitrise downloads the source" — not "the source is downloaded by Bitrise".)
- **Mood:** indicative for descriptions, imperative for procedures. Don't switch within a sentence.
- **Acronyms:** spell out on first use, then use the acronym (`Unique Device Identifier (UDID)`, then `UDID`). Skip if your audience certainly knows it (`SSH`, `URL`, `API`).

### Capitalization

- **Sentence case for all titles, headings, and UI labels.** Not title case.
  - ✓ `Registering a test device`
  - ✗ `Registering a Test Device`
- **Capitalize Bitrise-specific proper nouns:**
  `Bitrise`, `Step`, `Workflow`, `Workflow Editor`, `Environment Variable` (`Env Var`), `Organization` (`Org`), `Org Elite`, `Org Standard`, `Dashboard`, `Identity Provider` (`IdP`).
- **Lowercase** general-purpose nouns even though they describe Bitrise features:
  `app`, `project`, `build`, `repository`, `stack`, `certificate`, `provisioning profile`, `pull request`, `virtual machine` (`VM` is OK uppercase), `log in`, `sign up`.
- **Match UI capitalization** when you reference a UI element verbatim — `**APPS & ARTIFACTS**` if that's how the screen reads.

### Numbers

- Spell out **0–9**, use numerals for **10+**.
- Be consistent within a category: if any number in the category needs numerals, all of them do (`between 5 and 50`, not `between five and 50`).
- Inside tables and UI text, numerals are always fine.

### Lists

- Use **2–7 items**. Never a list with one item.
- **Ordered** for procedures (numbered steps).
- **Unordered** for grouped options or requirements.
- **Never nest lists.**
- Capitalize the first word of each item.
- End each item with a period **only if any item is a full sentence** (or completes one with the introduction). Otherwise no period.
- Introduce lists with a sentence or fragment ending in a colon.

### Titles

- **Procedures** — gerund: `Running Xcode tests on Bitrise`.
- **Concepts** — short noun phrase, replaceable with "it": `Selective builds`.
- Avoid generic page titles (`Overview`, `Introduction`) — they're fine as section headings inside a page.

### Punctuation

- **No end punctuation** in titles, headings, UI labels, or short list items (≤ 3 words).
- **Periods** end sentences. Avoid exclamation marks except in critical warnings.
- **Question marks** sparingly — we answer questions, we don't ask them.
- **No quotation marks** for emphasis. Say it directly.

### UI elements

- **Bold** for permanent UI labels: `Click **Save changes**.`, `Open the **Workflows** tab.`
- **Backticks** for user-renameable identifiers: workflow names (`` `release-build` ``), branch names (`` `main` ``), Step IDs.

---

## Terminology cheat sheet

`migration/glossary.json` is the canonical list. Most-used entries:

| Term | Use | Don't use |
|---|---|---|
| Bitrise | The product. | bitrise (lowercase, except in `bitrise.yml`) |
| `bitrise.yml` | Always lowercase, in backticks. | Bitrise YAML, Bitrise YML |
| Step (capital S) | A single integration in a Workflow. | step, integration |
| Workflow (capital W) | A sequence of Steps. | workflow (except in code) |
| Workflow Editor | The UI for editing Workflows. | workflow editor |
| Environment Variable / `Env Var` | Capitalized. Use abbreviation in titles. | environment variable |
| Organization / Org | Capitalized. Use `Org` in titles. | organization |
| project | Lowercase. Within an app. | Project, app (synonyms — they're not) |
| app | Lowercase. The Bitrise unit. | application, project |
| build | Lowercase. The output of a Workflow run. | Build |
| pull request | Lowercase. Spelled out. | PR, pull-request |
| repository | Lowercase. Spelled out in DevCenter. | repo |
| URL | Always uppercase. | url, Url |
| CI/CD | The shorter form. Use `continuous integration and delivery` only on landing pages. | CI / CD with spaces |
| log in (verb) | Two words for the action. | sign in, login |
| sign up (verb) | Two words for the action. | signup, register |
| stack | Lowercase generic. Capitalize when quoting a specific stack name (`Android & Docker, on Ubuntu 16.04 - LTS Stack`). | Stack |
| guide / article | Synonyms for a DevCenter document. | post (that's blog content) |
| deploy key | Two words. GitHub's term — keep it. | deployment key |

If you introduce a new Bitrise-specific term, add it to `migration/glossary.json` so `<GlossTerm>` works. The format is one entry per term:
```json
"workflow": {
  "term": "Workflow",
  "definition": "A collection of Steps, environment variables, and other configurations."
}
```

---

## Authoring mechanics

### Frontmatter

Every page starts with YAML frontmatter:

```yaml
---
title: "Running Xcode tests on Bitrise"
description: "Configure the Xcode Test Step to run unit and UI tests on Bitrise."
sidebar_position: 3
slug: /bitrise-ci/testing/running-xcode-tests-on-bitrise
sidebar_label: "Run Xcode tests"   # optional, only if it differs from title
---
```

- `title` and `slug` are required.
- **Slugs always start with `/`.** Otherwise Docusaurus prefixes them with the file's natural path and you get duplicated segments.
- **Don't change an existing slug** without adding a redirect in `redirects.json`. Live URLs are part of our SEO contract.
- `sidebar_label` lets the navigation entry differ from the page's H1.

### `.md` vs `.mdx`

- **`.md`** — plain Markdown. Use this when the page has no JSX.
- **`.mdx`** — Markdown + JSX. Required when the page imports a partial, uses `<Tabs>`, or includes `<GlossTerm>`.
- Adding any of those? Rename `.md` → `.mdx` and add the matching `import` line at the top:
  ```mdx
  import Tabs from '@theme/Tabs';
  import TabItem from '@theme/TabItem';
  import GlossTerm from '@site/src/components/GlossTerm';
  ```

### Images

- New images go to `static/img/<topic>/<filename>.<ext>` (e.g. `static/img/code-signing/keychain-export.png`). Reference as `/img/code-signing/keychain-export.png`.
- Always include alt text: `![Keychain export dialog](/img/code-signing/keychain-export.png)`.
- Capture at **1728 × 875** (per Style Guide). Resize the browser window to that exact size before screenshotting; it gives consistent dialog framing.
- Don't rename the UUID-prefixed files in `static/img/_paligo/` — they're migration-managed and referenced by UUID across the corpus.

### Code

- Inline: backticks for filenames, command names, env var names. ``Open `bitrise.yml`.``
- Blocks: triple backticks with a language hint (one of `yaml`, `bash`, `json`, `swift`, `kotlin`, `groovy`, `ruby`, `dart` — those are the languages our Prism config loads).
- **Don't put code blocks inside admonitions.** Render the admonition first, then the code block as a sibling.

### Admonitions

```mdx
:::note[Workflows in YAML]

This guide is about creating a Workflow in the Workflow Editor.

:::
```

Available types: `note`, `tip`, `info`, `warning`, `important`, `caution`. Title in square brackets is optional.

When to use which (per Style Guide):
- `note` — heads-up ("Please note that…").
- `important` — non-skippable info on prerequisites or constraints.
- `warning` — something that can break or can't be undone.
- `info` — extra context, tips & tricks.
- `tip` — best-practice suggestion.
- `caution` — sharper than `note`, less than `warning`.

### Tabs

Use for parallel instructions (e.g. Workflow Editor vs Configuration YAML):

```mdx
<Tabs>
<TabItem value="workflow-editor" label="Workflow Editor" default>

1. Open the Workflow Editor.
1. Click **Save changes**.

</TabItem>
<TabItem value="configuration-yaml" label="Configuration YAML">

```yaml
workflows:
  primary:
    steps: []
```

</TabItem>
</Tabs>
```

- `value` is the URL hash slug (kebab-case).
- `label` is what the user sees.
- Mark the first tab `default`.

### Cross-references

- Internal links use **absolute paths starting with `/en/...`**.
- The link target is the page's **slug**, not its file path:
  ```mdx
  See [Adding a new project](/en/bitrise-ci/getting-started/adding-a-new-project).
  ```
- Don't add the `.html` suffix; Docusaurus handles it.
- For glossary terms, prefer `<GlossTerm baseform="Workflow">Workflow</GlossTerm>` on first mention so readers get the inline tooltip.

---

## Reusable content (partials)

The biggest authoring lever in this repo. **Edit one file, every page that uses it updates.**

### What's a partial

Anything reused across pages: a setup-prerequisites paragraph, a "how to open the Workflow Editor" set of steps, a shared admonition. Each lives at `src/partials/<readable-slug>.mdx` (e.g. `opening-the-workflow-editor.mdx`).

### Use an existing partial

1. Find the right one in `migration/partials_index.json` (key = component name, value = file slug).
2. In your page (`.mdx`), add the import at the top:
   ```mdx
   import Partial_OpeningTheWorkflowEditor from '@site/src/partials/opening-the-workflow-editor.mdx';
   ```
3. Reference it where the content goes:
   - **Block context** (between paragraphs, in a section): on its own line — `<Partial_OpeningTheWorkflowEditor />`
   - **List context** (inside a numbered procedure): as a list item — `1. <Partial_OpeningTheWorkflowEditor />`. The build's preprocessor splices the partial's actual list items in, so step numbering stays continuous.

### Create a new partial

1. Create `src/partials/<readable-slug>.mdx` with the standard import header (`Tabs`, `TabItem`, `GlossTerm`) and your content.
2. The slug is kebab-case derived from the topic title (`opening-the-workflow-editor`, not `opening_the_workflow_editor` or `OpeningTheWorkflowEditor`).
3. The component name is `Partial_` + PascalCased title (`Partial_OpeningTheWorkflowEditor`).
4. Update `migration/partials_index.json` to register the mapping (component → slug).
5. Reference it from any page that needs it (see above).

### Don't

- Don't paste a partial's content directly into a page. The whole point is one source of truth.
- Don't put a section heading at the top of a partial that's used in list context — the preprocessor only extracts the first list block, and a heading would be left dangling.

---

## Glossary terms

Every Bitrise-specific term that appears in body text should use the `<GlossTerm>` component on its first mention per page. The reader gets a hover tooltip with the definition, and clicking jumps to the glossary page.

```mdx
A <GlossTerm baseform="Workflow">Workflow</GlossTerm> is a collection of Steps.
```

- `baseform` is the canonical form (matches a key in `migration/glossary.json`).
- The element's text is what's displayed (so it can be inflected — `Workflows`, `workflow`).
- If `migration/glossary.json` doesn't have the term yet, add it:
  ```json
  {
    "workflow": {
      "term": "Workflow",
      "definition": "A sequence of Steps that Bitrise runs to build, test, or deploy your app."
    }
  }
  ```

---

## Common pitfalls

These caused build failures during the migration. Watch for them.

### Don't write raw `<Word>` placeholders

```mdx
✗  Replace <username> with your handle.
✓  Replace `<username>` with your handle.
```

MDX parses bare `<Word>` as a JSX tag and the build fails. Wrap placeholder tokens in backticks (or HTML entities `&lt;username&gt;`).

### Escape `{kebab-case}` in tables

```mdx
✗  | `GET /apps/{app-slug}/builds` | List builds. |
✓  | `GET /apps/\{app-slug\}/builds` | List builds. |
```

MDX reads `{...}` as a JSX expression. Hyphens make it invalid (kebab-case isn't a valid JS identifier), so MDX errors. Escape both braces.

### Don't change a slug without a redirect

If you rename a page or change its `slug`, add a rule in `redirects.json` so the old URL still resolves. Cloudflare serves the redirects; the 444 live URLs are part of our SEO contract. If the page is listed in `static/llms.txt` (the hand-curated AI-agent index), update its link there too — the weekly `check-llms-txt.yml` job fails on dead llms.txt links.

### Don't add an `index.md` to a topichead category

Some sidebar categories are intentionally non-clickable — they only toggle expand/collapse. Their `_category_.json` has `"link": null`. Adding an `index.md` makes Docusaurus auto-link the category and breaks that behavior.

### Don't put images at random paths

All images go under `static/img/`. References in pages start with `/img/...` (Docusaurus serves `static/` from root). Don't reference `static/img/...` directly — that path doesn't exist at runtime.

### Don't break numbered lists with unindented content

Code blocks, admonitions, and plain text that belong to a numbered list item must be indented to the item's content column (3 spaces for `1. `, 4 for `10. `, etc.). Unindented content terminates the list, causing every subsequent item to restart numbering from 1.

````mdx
✗  1. Do the thing
   ```bash
   code
   ```
   2. Do the next thing   ← renders as step 1

✓  1. Do the thing

      ```bash
      code
      ```

   2. Do the next thing   ← renders as step 2
````

The same rule applies to admonitions and continuation paragraphs mid-procedure.

### Don't introduce `Title Case` titles

Sentence case only. ✓ `Adding a new project` ✗ `Adding a New Project`.

---

## Syncing MCP docs

When asked to sync, pull, or update the Bitrise MCP docs, run:

```bash
python3 scripts/sync_mcp_docs.py
```

This fetches `.md` files from `bitrise-io/bitrise-mcp/docs/` on GitHub and writes them (with injected frontmatter, link rewriting, and list rendering fixes) to `docs/bitrise-platform/ai/bitrise-mcp/`. Set `GITHUB_TOKEN` in the environment for authenticated requests (5,000 req/hr vs 60 req/hr unauthenticated).

The script is idempotent. After running, review the diff and commit if the changes look correct. Never manually edit the synced files — edits belong in the source repo.

---

## Generating API reference docs

The Bitrise CI API reference (`docs/bitrise-api/api-reference/`) and the RDE API reference (`docs/bitrise-rde-api/api-reference/`) are generated from their OpenAPI specs using `docusaurus-plugin-openapi-docs` (specs configured in `docusaurus.config.ts`). Never edit the generated files by hand — they are overwritten on every run.

### Regenerating after a spec update

```bash
npm run gen-api-docs
```

This runs two things in sequence:

1. `docusaurus gen-api-docs all` — generates the `.api.mdx` files and `sidebar.ts` for every configured spec (the CI API and the RDE API).
2. `node scripts/patch-api-info.js` — applies fixes the plugin doesn't handle, to each generated `*.info.mdx`:
   - Adds `displayed_sidebar` so the page renders inside the correct sidebar (`bitriseAPISidebar` for the CI API, `rdeSidebar` for the RDE API).
   - Fills in the empty License section with the name from the spec — CI API only (`MIT`).

Always use the npm script, not the bare `docusaurus` command, so the patch is always applied.

### Preprocessor skip rule

`docusaurus.config.ts` has a `markdown.preprocessor` that escapes JSX-looking text across all `.mdx` files. The generated API files contain multi-line JSX components (`<StatusCodes>`, `<RequestSchema>`, etc.) that the line-by-line escaper would mangle. They are skipped entirely via an early return that matches every generated reference (`bitrise-api`, `bitrise-rde-api`, …):

```ts
if (filePath.includes('/api-reference/')) return fileContent;
```

Do not remove this rule — it prevents the preprocessor from breaking the generated files.

### Cache gotcha after merging

If `docusaurus.config.ts` changes (including merge commits that touch it), the webpack cache in `.docusaurus/` can become partially stale, producing confusing MDX parse errors like `Expected a closing tag for <StatusCodes>` even though the generated files are correct. Fix: clear the cache before starting the dev server.

```bash
npm run clear   # or: rm -rf .docusaurus
npm start
```

---

## Updating this file

If you discover a new convention or pitfall while editing, **add it here** so the next contributor (human or AI) doesn't relearn it. Keep the file < 400 lines; if a section grows long, link to a deeper page on Confluence instead.
