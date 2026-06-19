---
title: "About the CodePush CLI"
description: "The Bitrise CodePush CLI is a client for CodePush. Use it on your local machine or in CI to configure and manage your CodePush integration and updates."
sidebar_position: 1
---

The Bitrise CodePush CLI is a client for CodePush. Use it on your local machine to configure and manage your CodePush integration and updates.

The CodePush CLI can run in two modes: as a [Bitrise CLI](/en/bitrise-ci/bitrise-cli/installing-and-updating-the-bitrise-cli) plugin (commands prefixed with `bitrise :codepush`), or as a standalone binary (commands prefixed with `codepush`). Both modes support the same commands and require a Bitrise API token to authenticate to the Bitrise CodePush server.

The CodePush CLI is a Go binary that communicates with the Bitrise API over HTTPS. Most commands require a Bitrise API token for authentication. The exceptions are purely local operations: `bundle` invokes the React Native or Expo bundler directly on your machine (`npx react-native bundle` or `npx expo export:embed`), and `debug` streams logs from a connected device via `adb` or `xcrun` without making any API calls.

With the CodePush CLI, you can:

- Create, list, rename, and delete deployments.
- Push updates, roll back to a previous release, promote a release between deployments, and patch the metadata of an existing release.
- Show update details and update processing status for specific versions.
- Initialize project configuration and store authentication information locally.
- Generate JavaScript bundles for React Native and Expo projects. It auto-detects the project type, the entry file, Hermes, and the Metro config.

You can also create and target different server environments with the CodePush CLI. For example, you can set a staging environment for your CodePush updates before you push them to the Bitrise CodePush server.

The source code for the CodePush CLI is available on GitHub: [bitrise-io/bitrise-plugins-codepush-cli](https://github.com/bitrise-io/bitrise-plugins-codepush-cli).
