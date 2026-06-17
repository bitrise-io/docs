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
   - Glossary tooltips or internal cross-references
   - Corrections with no new information
   - File moves or renames with identical content

   If in doubt, skip.

3. **Draft the changelog entry** and show it in chat for review. Wait for approval or edits before writing anything to disk.
   - **Title**: 5–8 words from the reader's perspective.
   - **Summary**: 1–2 sentences. Write from the reader's perspective ("You can now…", "The X guide now covers…"), not the author's ("We added…"). Use today's date.
   - **Linking**: if the changes are concentrated in one page, end the summary with a link to that page using its `slug` (e.g. `See [Running Xcode tests](/en/bitrise-ci/testing/running-xcode-tests).`). If changes span multiple pages, include a link to the most relevant one at your discretion — or omit if no single page stands out.
   - One entry per PR even if multiple files changed.

4. **Write and commit** once approved. Prepend the entry after the `<!-- changelog-entries -->` marker in `src/partials/changelog-content.mdx` using this format:
   ```
   ## <time dateTime="YYYY-MM-DD">YYYY-MM-DD</time> — Title {#YYYY-MM-DD-slug-of-title}

   Summary paragraph.

   ```
   The `{#anchor}` ID uses the same slug formula as the feed plugin: lowercase the title, replace every run of non-alphanumeric characters with a single hyphen, strip leading/trailing hyphens, then prepend the date: `YYYY-MM-DD-slug`. Then commit:
   ```
   git add src/partials/changelog-content.mdx
   git commit -m "Update changelog"
   ```

5. **Create the PR.** Show a draft title and body in chat and wait for approval before running `gh pr create`. Base branch is `main` unless the user says otherwise.

---

## Retroactive mode

Generate entries for all merged PRs not yet covered by the changelog.

### Steps

1. **Find the cutoff date.** Read `src/partials/changelog-content.mdx` and extract the date from the first line matching `## YYYY-MM-DD`. That date is the cutoff; generate entries for PRs merged *after* it. If the changelog has no entries, use `2026-06-03` (the Docusaurus migration date).

2. **Find uncovered PRs.**
   ```
   gh pr list --state merged --limit 100 --json number,title,mergedAt,files
   ```
   Filter to PRs where:
   - `mergedAt` is strictly after the cutoff date
   - at least one file path starts with `docs/` and ends with `.md` or `.mdx`

   Sort ascending by `mergedAt` (oldest first — you'll prepend in reverse so newest ends up on top).

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
      - Glossary tooltips or internal cross-references
      - Corrections with no new information
      - File moves or renames with identical content

   d. If keeping, write:
      - **Title**: 5–8 words from the reader's perspective.
      - **Summary**: 1–2 sentences. Reader's perspective, not the author's.
      - **Linking**: if the changes are concentrated in one page, end the summary with a link to that page using its `slug`. If changes span multiple pages, link to the most relevant one at your discretion — or omit if no single page stands out.

4. **Prepend new entries** immediately after `<!-- changelog-entries -->`, newest first. Format:
   ```
   ## <time dateTime="YYYY-MM-DD">YYYY-MM-DD</time> — Title {#YYYY-MM-DD-slug-of-title}

   Summary paragraph.

   ```
   The `{#anchor}` ID must use the same slug formula as the feed plugin: lowercase the title, replace every run of non-alphanumeric characters with a single hyphen, strip leading/trailing hyphens, then prepend the date with a single hyphen: `YYYY-MM-DD-slug`.

5. **Report** how many entries were added and list any skipped PRs with reasons.

### Notes
- If there are no uncovered PRs, say so and make no changes.
- Do not commit or push — leave that to the user.
