# Contributing to the Bitrise docs

The Bitrise documentation is written as code: every page lives in this repository as a file, and every change goes in through a pull request. That means anyone at Bitrise — engineers, PMs, support, writers — can fix a typo or add a whole guide, without needing special tools. This page covers what's specific to *this* repo; for GitHub basics (branches, pull requests), see [GitHub's own guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

> This guide is for people inside Bitrise contributing to our own docs. This repository does not accept external open-source contributions — see the README.

## Where things live

The repo mirrors the site's structure, so finding the right file is usually mechanical:

| You want to edit | Look in |
|---|---|
| A documentation page | `docs/<section>/…` — each folder under `docs/` is one product hub: `bitrise-ci`, `bitrise-build-cache`, `bitrise-build-hub`, `bitrise-rde`, `release-management`, `insights`, `bitrise-platform`, `bitrise-api`. The folder tree becomes the sidebar. |
| The portal (homepage) | `src/pages/index.tsx` |
| A shared snippet that appears on several pages | `src/partials/` |
| Images | `static/img/<topic>/` |
| Sidebar labels and ordering | `_category_.json` files next to the pages |

To find the file for a published page: the URL path usually mirrors the file path — `docs.bitrise.io/en/bitrise-ci/testing/…` lives under `docs/bitrise-ci/testing/`. If it doesn't line up (some pages set a custom `slug`), search the repo for the page title.

## Two ways to contribute

You don't need a local setup for small changes. Pick the path that fits your change:

- **Edit straight in GitHub** — best for typos, wording, a new paragraph, or a small fix. No installation needed.
- **Work locally** — best for new pages, moving content around, or anything you want to preview as you write. Setup steps are in the README under "Run the docs locally."

Both paths end the same way: a pull request that the docs team reviews.

### A note on forks

Unless you have write access to this repository, GitHub will have you work on a **fork** (your own copy of the repo) rather than a branch. That's normal and changes nothing about the flow: the web editor sets the fork up for you automatically, and your pull request comes from there. If you do have write access, a branch in this repo works too — either way, `main` is protected and everything lands via pull request.

### Editing in GitHub (no setup)

1. Find the file (see "Where things live" above) and click the pencil (**Edit this file**).
2. Make your change and commit it — GitHub walks you through creating the branch (or fork) and opening the pull request.
3. A preview site builds automatically: a Cloudflare link appears on the pull request, ending in `bitrise-docs.pages.dev`. Open it and check your change looks right.
4. The docs team is added as reviewers automatically. Address any comments; once approved, merge.

### Working locally (larger changes)

Follow "Run the docs locally" in the README to install Node.js and Git and clone (or fork) the repo. Then branch, edit under `docs/`, preview with `npm start` at `localhost:3000`, push, and open a pull request.

## The step people forget: mark your pull request Ready

If your pull request is a **Draft**, it cannot be merged — even after it's approved. When your change is done, click **Ready for review**. (This is worth calling out: a small, already-approved fix once sat unmerged for weeks simply because it was left in Draft.)

## Conventions that keep the docs consistent

**Reuse content instead of copy-pasting.** Shared snippets live in `src/partials/` and are pulled into a page with an import, for example:

```js
import Partial_ReleaseManagementConfiguration from '@site/src/partials/release-management-configuration.mdx';
```

If you're about to paste the same paragraph onto a third page, make it a partial instead — then it's edited in one place.

**If you move, rename, or delete a page, add a redirect.** Old URLs must not start returning "page not found" — that quietly breaks search rankings and other people's links. Add an entry to `redirects.json` mapping the old path to the new one:

```json
"/en/old/path/to-page": "/en/new/path/to-page"
```

Also check `static/llms.txt` (the hand-curated index for AI agents): if your page is listed there, update its link — a weekly CI job fails on dead llms.txt links.

**Links must point to real pages.** Use root-relative links like `/en/bitrise-ci/...`. Broken internal links are the most common bit of debris, so check yours before you push — the repo ships a checker:

```bash
python3 scripts/audit_links.py --internal-only
```

(The team is looking at making this run automatically on every pull request, so eventually a broken link will block the merge rather than slip through.)

**Leave the changelog alone.** The docs changelog is curated by the docs team through a separate, deliberately manual process — your pull request doesn't need a changelog entry, and reviewers will handle it if one is warranted.

**Match the page you're editing.** Each page starts with a small frontmatter block (title, slug, sidebar position). When adding a page, copy the pattern from a neighboring page. (If you edit in VS Code, the repo ships a `frontmatter.json` schema for the Front Matter extension — optional, but it autocompletes these fields.)

## Writing style, in brief

The full rules are in the [Bitrise Style Guide on Confluence](https://bitrise.atlassian.net/wiki/spaces/CX/pages/35029184/Style+Guide) (and `CLAUDE.md` in this repo carries the actionable subset); the essentials:

- Write in American English, active voice, present tense, speaking directly to the reader ("you").
- Use sentence case for titles and headings. Use a gerund for procedures ("Configuring SSH keys") and a noun phrase for concepts ("Selective builds").
- Capitalize product terms: **Step**, **Workflow**, **Organization**. Keep these lowercase: app, build, pull request, repository.
- Bold UI elements (**Save**), and use backticks for filenames and commands (`bitrise.yml`, `git clone`).
- Give links descriptive text — never "click here."

## Getting help

Stuck, or not sure where something belongs? Ping the docs team (@zoltan-baba, @ilanazholobovsky) or ask in the docs channel. A half-finished pull request with a question is completely fine — we'd rather help early than have you guess.

## Before you open a pull request — quick checklist

- [ ] The preview renders your change correctly
- [ ] Internal links point to real pages (ran the link check)
- [ ] Added redirects if you moved, renamed, or deleted a page (and updated `static/llms.txt` if listed)
- [ ] Reused a partial instead of copy-pasting shared content
- [ ] Followed the style basics above
- [ ] Marked the pull request **Ready for review** (not Draft)
