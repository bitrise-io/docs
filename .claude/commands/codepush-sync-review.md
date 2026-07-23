---
name: codepush-sync-review
description: Check out the latest CodePush README sync branch and show the diff against main.
---

You are running the `/codepush-sync-review` command.

1. Run `git fetch origin` to get the latest remote branches.
2. Find the most recent branch matching `codepush-readme-sync-*`:
   ```
   git branch -r --list 'origin/codepush-readme-sync-*' | sort | tail -1
   ```
3. If no branch is found, report: "No CodePush sync branch found. The README may not have changed since the last check."
4. Check out that branch:
   ```
   git checkout <branch-name>
   ```
5. Show the diff against `main`:
   ```
   git diff main...HEAD
   ```
6. Summarize the changes: which files were touched, what was updated in each, and flag anything that may need manual adjustment before merging.
