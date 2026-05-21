---
title: "Getting started with the Build Cache"
description: "The [Bitrise Build Cache](https://bitrise.io/platform/devops/build-caching) is a fully managed caching solution that reduces CI build durations for applications built with Gradle and Bazel build systems. It specifically caches build and test outputs to minimize how much work is done in subsequent builds, making it more efficient in environments with frequent updates. Compatible with any CI tool, it accelerates the build cycle without requiring you to manage a caching infrastructure."
sidebar_position: 1
slug: /bitrise-build-cache/getting-started-with-the-build-cache/getting-started-with-the-build-cache
sidebar_label: Getting started
---

The [Bitrise Build Cache](https://bitrise.io/platform/devops/build-caching) is a fully managed caching solution that reduces CI build durations for applications built with Gradle, Bazel, and Xcode. It specifically caches build and test outputs to minimize how much work is done in subsequent builds, making it more efficient in environments with frequent updates. Compatible with any CI tool, it accelerates the build cycle without requiring you to manage a caching infrastructure.

:::tip[Try it for free]

We offer a 30-day free trial at no cost; you don't even need to provide payment information. The trial starts automatically when you set up the Bitrise Build Cache.

[Click here to get started with the Bitrise Build Cache](https://app.bitrise.io/build-cache). If you don't have a Bitrise account, you will be prompted to create one first before proceeding to set up the Build Cache.

:::

Bitrise supports remote build caching for the following build systems:

- [Build Cache for Gradle](/en/bitrise-build-cache/build-cache-for-gradle/configuring-the-build-cache-for-gradle-in-the-bitrise-ci-environment).
- [Build Cache for Bazel](/en/bitrise-build-cache/build-cache-for-bazel/configuring-the-build-cache-for-bazel-in-the-bitrise-ci-environment).
- [Build Cache for Xcode](/en/bitrise-build-cache/build-cache-for-xcode/configuring-the-build-cache-for-xcode-in-the-bitrise-ci-environment).

## Adding a new connection to the Build Cache

To start using the Bitrise Build Cache, you have to add a new connection. The process consists of:

- Selecting a CI provider: you can use either Bitrise or another CI provider.
- Selecting a build tool: currently, Bazel, Gradle, and Xcode are supported.
- If you use Bitrise as your CI provider, selecting a Bitrise project.
- If you use a different CI provider, adding [a personal access token](/en/bitrise-platform/accounts/personal-access-tokens#creating-a-personal-access-token) to allow the Bitrise Build Cache access to your CI.
- Adding the cache activation scripts to your CI process. On Bitrise, we have dedicated [Steps](/en/bitrise-ci/workflows-and-pipelines/steps/steps-overview) for this.

To add a new connection:

1. Log in to Bitrise and select the **Build Cache** from the left navigation menu.
1. On the top right corner, click **New connection**.

   ![cache-new-connection.png](/img/_paligo/uuid-bdbb02c7-b8e7-bf04-fb52-7cacd2231760.png)
1. Follow the instructions.

   :::tip[Detailed instructions]

   For more information on configuring the Build Cache, refer to our dedicated guides:

   - [Build Cache for Gradle](/en/bitrise-build-cache/build-cache-for-gradle/configuring-the-build-cache-for-gradle-in-the-bitrise-ci-environment).
   - [Build Cache for Bazel](/en/bitrise-build-cache/build-cache-for-bazel/configuring-the-build-cache-for-bazel-in-the-bitrise-ci-environment).
   - [Build Cache for Xcode](/en/bitrise-build-cache/build-cache-for-xcode/configuring-the-build-cache-for-xcode-in-the-bitrise-ci-environment).

   :::
