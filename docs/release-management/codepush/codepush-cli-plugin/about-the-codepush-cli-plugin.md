---
title: "About the CodePush CLI plugin"
description: "The Bitrise CodePush plugin is a CLI client for CodePush. You can use it your local machine to configure and manage your CodePush integration and updates."
sidebar_position: 1
---

The Bitrise CodePush plugin is a CLI client for CodePush. You can use it your local machine to configure and manage your CodePush integration and updates.

:::important

You can find the code for the CodePush CLI plugin, with a detailed guide, on GitHub: [CodePush CLI repository](https://github.com/bitrise-io/bitrise-plugins-codepush-cli).

:::

The CodePush plugin requires [the Bitrise CLI](/en/bitrise-ci/bitrise-cli/installing-and-updating-the-bitrise-cli). After successfully installing it, the plugin is available as `:codepush`. It requires a Bitrise API token to authenticate to the Bitrise CodePush server.

With the plugin, you can:

- Create, list, rename, and delete deployments.
- Initialize project configuration.
- Push updates.
- Show update details and update processing status for specific versions.
- Store authentication information locally.
- Generate Javascript bundles for React Native and Expo projects. It auto-detects the project type, the entry file, Hermes, and the Metro config.

You can also create and target different server environments with the plugin. For example, you can set a staging environments for your CodePush updates before you push them to the Bitrise CodePush server.
