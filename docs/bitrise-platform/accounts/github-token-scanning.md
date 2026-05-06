---
title: "GitHub token scanning"
description: "Bitrise is a partner of GitHub's secret scanning program: GitHub scans repositories for known secret formats to prevent fraudulent use of credentials that were committed accidentally."
sidebar_position: 7
slug: /bitrise-platform/accounts/github-token-scanning
---

Bitrise is a partner of [GitHub's secret scanning program](https://docs.github.com/en/code-security/secret-scanning/secret-scanning-partnership-program/secret-scanning-partner-program): GitHub scans repositories for known secret formats to prevent fraudulent use of credentials that were committed accidentally.

Bitrise uses this scanning to look for your [personal access tokens](/en/bitrise-platform/accounts/personal-access-tokens.html) and [Workspace API tokens](/en/bitrise-platform/workspaces/workspace-api-token.html) in your repositories. If a scan finds either type of token committed to your repository, Bitrise sends you both an email and an in-app notification to remove it for security reasons.

Scanning is automatically turned on if your tokens are in the correct format. No configuration is required.

:::important[Regenerating tokens]

If you generated your tokens before November 2024, regenerate them to make sure they are in the correct format.

We recommend regenerating your tokens if you encounter any other issues, too.

- [Regenerating a personal access token](/en/bitrise-platform/accounts/personal-access-tokens/regenerating-a-personal-access-token).
- [Regenerating a Workspace API token](/en/bitrise-platform/workspaces/workspace-api-token/regenerating-a-workspace-api-token).

:::
