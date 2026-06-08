---
title: "Bitrise MCP"
description: "The Bitrise Model Context Protocol (MCP) Server lets you talk to Bitrise via an AI client of your choice. It enables seamless interaction with your existing CI setup, including troubleshooting and automation."
sidebar_position: 4
slug: /bitrise-platform/ai/bitrise-mcp
---

The Bitrise Model Context Protocol (MCP) Server lets you talk to Bitrise via an AI client of your choice. It enables seamless interaction with your existing CI setup:

- Troubleshoot issues by directly asking about failure reasons. The AI analyzes logs and configurations, providing actionble recommendations.
- Optimize configurations by instructing the AI to suggest improvements. You will receive instant insights and practical suggestions.
- Automate manual tasks such as handling permissions, inviting members to a project, or looking for old builds. Tell the AI agent about your requirements: it will send you the proposed steps for review and ask for permission before executing each action. You can review the results at each step of the process.

The remote MCP server is hosted at mcp.bitrise.io.

You can find [the Bitrise MCP repository on GitHub](https://github.com/bitrise-io/bitrise-mcp). Among other things, it includes:

- Install guides for specific MCP clients. The currently supported clients are: VS Code, GitHub Copilot in other IDEs , Claude Applications (Desktop and Code CLI), Cursor, Windsurf, AWS Kiro, and Gemini CLI.
- How to use local MCP server instead of the remote one.
- What tools are available and how you can limit their usage.
