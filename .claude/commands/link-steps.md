# Link Step names in docs

Scans MDX documentation files for Bitrise Step name mentions and links them to
the step's GitHub source via `scripts/link_steps.py`.

## Usage

```
/link-steps           # scan and fix the entire docs directory
/link-steps pr 123    # scan only files changed in PR #123
/link-steps commit abc123  # scan only files changed in a commit
```

## What to do

1. Determine the scope from the argument:
   - No argument → run `python3 scripts/link_steps.py`
   - `pr <number>` → run `python3 scripts/link_steps.py --pr <number>`
   - `commit <sha>` → run `python3 scripts/link_steps.py --commit <sha>`

2. Run the script (it fetches the latest Bitrise steplib spec from S3 and
   modifies files in place).

3. After the script runs, scan the same target files for **unresolved Step
   references** — bold text (`**...**`) followed by "Step" or "Steps" that
   the script left unlinked. These are cases where the doc uses a shortened
   or informal name that doesn't exactly match the spec title.

   For each unresolved reference:
   a. Fetch the steplib spec (`https://bitrise-steplib-collection.s3.amazonaws.com/spec.json`)
      and find the closest matching step title using substring or fuzzy matching.
      For example, "Activate SSH key" is a shorthand for "Activate SSH key
      (RSA private key)".
   b. If a confident match is found, update the file to use the full spec title
      in the link text and link it to the step's `source_code_url`.
   c. If no confident match exists, report the unresolved reference to the user
      and ask for guidance rather than guessing.

4. If any files were changed, commit them:
   ```
   git add docs/
   git commit -m "Link Bitrise Step names to GitHub source"
   ```

5. Report:
   - How many files were modified.
   - Which Step names were auto-linked by the script.
   - Which shortened names were resolved manually (and what full title was used).
   - Any unresolved references that need human review.

The script is idempotent: running it again on already-linked files makes no
further changes.
