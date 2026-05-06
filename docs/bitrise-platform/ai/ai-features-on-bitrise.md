---
title: "AI features on Bitrise"
description: "Bitrise offers several AI features that you can toggle on and off at any time to enhance your Mobile DevOps processes."
sidebar_position: 2
slug: /bitrise-platform/ai/ai-features-on-bitrise
---

:::tip[AI FAQ]

This page offers a short summary of the available AI features on Bitrise. For a detailed breakdown of how Bitrise uses AI and how we handle customer data related to AI features, see the [AI FAQ](/en/bitrise-platform/ai/ai-faq---how-bitrise-leverages-ai-technologies-in-its-features-and-services.html).

:::

Bitrise offers multiple AI features to help enhance your Mobile DevOps processes. You can enable or disable any individual feature, or completely disable AI features altogether: [Enabling AI features on Bitrise](/en/bitrise-platform/ai/enabling-ai-features-on-bitrise).

The following features are available:

## Code reviewer

The AI [code reviewer](/en/bitrise-platform/integrations/ai-code-reviewer.html) creates a comment every time a new pull request is opened on GitHub, and every time a user adds a new commit to the pull request. It can provide:

- A summary: Highlights key code changes and their potential impact.
- Walkthrough: Generates context-aware documentation to help team members quickly understand code changes.
- Code review: Detects potential issues, suggests improvements, and enhances code quality.

The code reviewer only works with a GitHub connection, either via the Bitrise GitHub app or an OAuth connection.

:::note[Code reviewer and credit usage]

You can enable the code reviewer on three projects if you have the [Pro or the Enterprise plans](https://bitrise.io/pricing). Running the code reviewer consumes one AI credit per review.

If you need more projects or AI credits, go to **Workspace settings** →**Plan and billing** →**Bitrise AI** and subscribe to the add-on. For example, if you subscribe for an extra project, you will have 4 projects and an extra 100 AI credits along with your base plan AI credit.

:::

## AI build summary

The [AI build summary](/en/bitrise-ci/run-and-analyze-builds/build-data-and-troubleshooting/ai-build-summary.html) gives you a summary of why a CI build failed and suggests the fix right there on the build page. You can turn off the feature at any time.

![2025-09-30-ai-summary.png](/img/_paligo/uuid-09bb51b3-e156-8f2e-4141-e71b46951f5c.png)

## AI build fixer

If you have a failed build, the [AI build fixer](/en/bitrise-ci/run-and-analyze-builds/build-data-and-troubleshooting/ai-build-fixer.html) corrects it right on the build’s details page without you having to switch to other tools and processes. The AI build fixer executes the suggested code changes and pushes a PR to your GitHub repository. You can check the changes through a link to the repo. Based on your configured build triggers, Bitrise kicks off a new CI build to validate the AI changes. This means less fragmented work and quicker debugging.

## Bitrise MCP

The [Bitrise Model Context Protocol (MCP) Server](/en/bitrise-platform/ai/bitrise-mcp.html) lets you talk to Bitrise via an AI client of your choice. It enables seamless interaction with your existing CI setup.

- Troubleshoot issues by directly asking about failure reasons. The AI analyzes logs and configurations, providing actionble recommendations.
- Optimize configurations by instructing the AI to suggest improvements. You will receive instant insights and practical suggestions.
- Automate manual tasks such as handling permissions, inviting members to a project, or looking for old builds. Tell the AI agent about your requirements: it will send you the proposed steps for review and ask for permission before executing each action. You can review the results at each step of the process.

For now, the Bitrise MCP is supported for the Claude desktop app. You can find the [Bitrise MCP repository on GitHub](https://github.com/bitrise-io/bitrise-mcp).
