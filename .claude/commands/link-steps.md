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

3. If any files were changed, commit them:
   ```
   git add docs/
   git commit -m "Link Bitrise Step names to GitHub source"
   ```

4. Report how many files were modified and which ones.

The script is idempotent: running it again on already-linked files makes no
further changes.
