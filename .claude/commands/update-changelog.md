# Update changelog

Update `src/partials/changelog-content.mdx` with changelog entries for doc changes not yet covered.

The changelog is a shared partial imported by every hub's `changelog.mdx`. Only update the partial — the hub pages update automatically.

## Choosing the right mode

Run in **current-branch mode** when:
- The user is about to create a PR, or asks to create a PR
- The user says "generate a changelog entry for this branch / these changes"
- There are local commits on the current branch not yet on `main`

Run in **retroactive mode** when:
- The user says "update the changelog" or "catch up the changelog"
- The current branch has no relevant doc changes
- You need to cover PRs that were merged without a changelog entry

---

## Entry format

The changelog groups entries into quarters. Each quarter is a `<Quarter>` block with an H2, and each entry is an `<Entry>` block holding an H3 and a summary:

```
<Quarter>

## YYYY QN

<Entry areas="ci build-cache">

### <time dateTime="YYYY-MM-DD">YYYY-MM-DD</time> Title {#YYYY-MM-DD-slug-of-title}

Summary paragraph.

</Entry>

</Quarter>
```

Rules for the markup:
- Put the `<Quarter>`, `</Quarter>`, `<Entry …>` and `</Entry>` tags at the start of a line, with no indentation, and leave a blank line after every opening tag and before every closing tag. The feed plugin and MDX both depend on this.
- The entry's date is written once, in the heading's `<time dateTime="…">`. The page reads it from there for the date filter. Do not add a `date` attribute to `<Entry>`.
- `areas` is a space-separated list of area ids; see "Choosing areas" below.

The `{#anchor}` ID uses the same slug formula as the feed plugin: lowercase the title, replace every run of non-alphanumeric characters with a single hyphen, strip leading/trailing hyphens, then prepend the date: `YYYY-MM-DD-slug`.

Quarter headers use the format `## YYYY QN` (e.g. `## 2026 Q3`): Q1 is January to March, Q2 April to June, Q3 July to September, Q4 October to December.

### Choosing areas

Tag every entry with the areas whose readers it affects. Use the paths of the changed `docs/` files:

| Changed pages under | Area id |
|---|---|
| `docs/bitrise-ci/`, `docs/bitrise-api/` | `ci` |
| `docs/bitrise-platform/` | `platform` |
| `docs/bitrise-build-cache/` | `build-cache` |
| `docs/bitrise-build-hub/` | `build-hub` |
| `docs/insights/` | `insights` |
| `docs/release-management/`, `docs/release-management-api/` | `release-management` |
| `docs/bitrise-rde/`, `docs/bitrise-rde-api/` | `rde` |

- A change that affects more than one area lists each one. Use at most three. For a shared partial, count every hub whose pages import it.
- API references belong to their product, so there is no separate API area.
- If you are unsure, pick the most likely areas and say so in the draft you show for review.

---

## Current-branch mode

Generate a changelog entry from the current branch's changes, commit it, then create a PR.

### Steps

1. **Find doc changes on this branch.**
   ```
   git diff main...HEAD --name-only
   ```
   Filter to files under `docs/` ending in `.md` or `.mdx`. If there are none, skip to step 4 (no entry needed).

2. **Decide whether to write an entry.** Read the diff:
   ```
   git diff main...HEAD -- 'docs/**/*.md' 'docs/**/*.mdx'
   ```
   Truncate to ~6 000 characters if needed. **Skip changelog generation** if all changes are:
   - Changes only to `src/partials/changelog-content.mdx` or `docs/changelogs/` (changelog infrastructure)
   - Formatting or cleanup (syntax highlighting, whitespace, list numbering)
   - Broken link or image path corrections
   - Navigation or sidebar changes
   - Site-wide changes, such as search or navigation
   - Glossary tooltips or internal cross-references
   - Corrections with no new information
   - File moves or renames with identical content

   If in doubt, skip.

3. **Draft the changelog entry** and show it in chat for review. Wait for approval or edits before writing anything to disk.
   - **Title**: 5–8 words from the reader's perspective.
   - **Summary**: 1–2 sentences. Write from the reader's perspective ("You can now…", "The X guide now covers…"), not the author's ("We added…"). Use today's date.
   - **Linking**: if the changes are concentrated in one page, end the summary with a link to that page using its `slug` (e.g. `See [Running Xcode tests](/en/bitrise-ci/testing/running-xcode-tests).`). If changes span multiple pages, include a link to the most relevant one at your discretion — or omit if no single page stands out.
   - **Areas**: pick the area ids as described in "Choosing areas" and show them in the draft.
   - One entry per PR even if multiple files changed.

4. **Write and commit** once approved. Insert the entry into `src/partials/changelog-content.mdx`:
   - Find the `<Quarter>` for the current quarter (e.g. the one whose heading is `## 2026 Q3`).
   - Insert the new `<Entry>` block at the top of that quarter, immediately after the H2 line and its blank line.
   - If no quarter exists for the current one yet, create a new `<Quarter>` block with its `## YYYY QN` heading at the top of the entries (immediately after `<!-- changelog-entries -->`), then add the `<Entry>` block beneath the heading.

   Then commit:
   ```
   git add src/partials/changelog-content.mdx
   git commit -m "Update changelog"
   ```

5. **Create the PR.** Show a draft title and body in chat and wait for approval before running `gh pr create`. Base branch is `main` unless the user says otherwise.

---

## Retroactive mode

Generate entries for all merged PRs not yet covered by the changelog.

### Steps

1. **Find the cutoff date.** Read `src/partials/changelog-content.mdx` and extract the date from the first H3 line matching `### ...YYYY-MM-DD...`. That date is the cutoff; generate entries for PRs merged *after* it. If the changelog has no entries, use `2026-06-03` (the Docusaurus migration date).

2. **Find uncovered PRs.**
   ```
   gh pr list --state merged --limit 100 --json number,title,mergedAt,files
   ```
   Filter to PRs where:
   - `mergedAt` is strictly after the cutoff date
   - at least one file path starts with `docs/` and ends with `.md` or `.mdx`

   Sort ascending by `mergedAt` (oldest first — you'll insert in reverse so newest ends up on top within each quarter).

3. **For each uncovered PR**, ascending order:
   a. Fetch the diff:
      ```
      gh pr diff <number>
      ```
      Extract only hunks for `.md`/`.mdx` files under `docs/`. Truncate to ~6 000 characters if needed.

   b. Read title and body:
      ```
      gh pr view <number> --json title,body
      ```

   c. **Skip the PR entirely** if all changes are:
      - Changes only to `src/partials/changelog-content.mdx` or `docs/changelogs/` (changelog infrastructure)
      - Formatting or cleanup
      - Broken link or image path corrections
      - Navigation or sidebar changes
      - Site-wide changes, such as search or navigation
      - Glossary tooltips or internal cross-references
      - Corrections with no new information
      - File moves or renames with identical content

   d. If keeping, write:
      - **Title**: 5–8 words from the reader's perspective.
      - **Areas**: area ids from the PR's changed `docs/` paths, as described in "Choosing areas".
      - **Summary**: 1–2 sentences. Reader's perspective, not the author's.
      - **Linking**: if the changes are concentrated in one page, end the summary with a link to that page using its `slug`. If changes span multiple pages, link to the most relevant one at your discretion — or omit if no single page stands out.

4. **Insert new entries** into their respective quarters, newest first within each quarter. For each entry:
   - Find the `<Quarter>` whose H2 matches the entry's date (e.g. `## 2026 Q3`).
   - Insert the `<Entry>` block at the top of that quarter, after the H2 line and its blank line.
   - If no quarter exists for that date, create a new `<Quarter>` block in the correct chronological position.

   The `{#anchor}` ID must use the same slug formula as the feed plugin: lowercase the title, replace every run of non-alphanumeric characters with a single hyphen, strip leading/trailing hyphens, then prepend the date: `YYYY-MM-DD-slug`.

5. **Report** how many entries were added and list any skipped PRs with reasons.

### Notes
- If there are no uncovered PRs, say so and make no changes.
- Do not commit or push — leave that to the user.
