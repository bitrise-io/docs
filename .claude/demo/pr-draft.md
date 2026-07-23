# Demo PR draft

## Trigger phrase
"Let's do the GitHub App update"

## Demo flow

1. Trigger phrase → present the new "Event subscriptions" section content as if generating it live
2. User says "looks good, create the PR and the changelog" → present the PR description and changelog entry as if generating them live
3. User approves → commit, push, create the PR

## New section content

```mdx
## Event subscriptions

When you install the Bitrise GitHub App on a repository or organization, GitHub automatically registers event subscriptions for that installation. These are separate from the repo-level webhooks you can configure manually in GitHub's repository settings.

The Bitrise GitHub App subscribes to the following events:

- `push`: triggers builds on branch pushes and tag pushes.
- `pull_request`: triggers builds when a pull request is opened, updated, or synchronized.
- `issue_comment`: enables comment-based build triggers on pull requests.

These subscriptions are managed by GitHub at the app installation level. They do not appear as webhooks under **Settings → Webhooks** in your GitHub repository.

:::warning[Remove manual webhooks after switching to the GitHub App]

If your repository also has manually configured webhooks pointing to `hooks.bitrise.io` — for example, from a previous OAuth-based Bitrise connection — each qualifying event will trigger two builds: one from the GitHub App subscription and one from the manual webhook.

After switching to the GitHub App, remove any manual Bitrise webhooks from your repository's **Settings → Webhooks** page on GitHub to avoid duplicate builds.

:::
```

## Branch
`docs/github-app-event-subscriptions`

## PR title
Add event subscriptions section to GitHub App integration docs

## PR description
```
## Summary

- Adds a new "Event subscriptions" section to the GitHub App integration page, explaining that the Bitrise GitHub App subscribes to `push`, `pull_request`, and `issue_comment` events via GitHub's app installation mechanism — not through repo-level webhooks
- Adds a warning admonition explaining that manual webhooks pointing to `hooks.bitrise.io` must be removed after switching to the GitHub App, or duplicate builds will be triggered
- Links from step 6 of the "Switching from OAuth" section to the new Event subscriptions section
- Fixes a minor bold formatting issue in the "Using a private Step library" section

## Test plan

- [ ] New section renders correctly above "Installing the GitHub app integration"
- [ ] Warning admonition displays correctly
- [ ] Link from the switching guide resolves to the correct anchor
- [ ] Preview URL works

🤖 Generated with [Claude Code](https://claude.ai/claude-code)
```

## Changelog entry
To be added to `src/partials/changelog-content.mdx` above the first existing entry:

```
### <time dateTime="2026-06-17">2026-06-17</time> GitHub App integration: event subscriptions clarified {#2026-06-17-github-app-integration-event-subscriptions-clarified}

The [GitHub App integration](/en/bitrise-platform/repository-access/github-app-integration) page now has an Event subscriptions section explaining that the Bitrise GitHub App subscribes to `push`, `pull_request`, and `issue_comment` events via GitHub's app installation mechanism, not through repo-level webhooks. The section also warns that any existing manual webhooks pointing to `hooks.bitrise.io` must be removed after switching to the GitHub App to avoid duplicate builds.
```
