---
title: "Gradle configuration cache"
description: "Gradle configuration cache reduces build times by caching the result of a Gradle project's configuration phase and reusing it in subsequent builds. For details, read [Gradle's official documentation](https://docs.gradle.org/current/userguide/configuration_cache.html). The Bitrise Build Cache supports this feature for Gradle 8.6 and later versions."
sidebar_position: 4
slug: /bitrise-build-cache/build-cache-for-gradle/gradle-configuration-cache
---

Gradle configuration cache reduces build times by caching the result of a Gradle project's configuration phase and reusing it in subsequent builds. For details, read [Gradle's official documentation](https://docs.gradle.org/current/userguide/configuration_cache.html). The [Bitrise Build Cache](https://bitrise.io/platform/devops/build-caching) supports this feature for Gradle 8.6 and later versions.

## Setting up the configuration cache

To set up the configuration cache:

1. Make sure you have a subscription or a trial for the [Bitrise Build Cache](https://bitrise.io/platform/devops/build-caching).
1. Run a build locally with the `--configuration-cache` flag.

   This ensures that your Gradle project supports configuration caching. To enable configuration caching in the Gradle settings, [refer to Gradle's official guide](https://docs.gradle.org/current/userguide/configuration_cache.html#config_cache:usage:enable).
1. Generate a Bitrise [personal access token](/en/bitrise-platform/accounts/personal-access-tokens#creating-a-personal-access-token) and add it as a [Secret](/en/bitrise-ci/configure-builds/secrets.html) with the BITRISE_BUILD_CACHE_AUTH_TOKEN key.

   :::note[Token consistency]

   For the configuration cache to function correctly, the authentication token used by the Gradle plugins must remain consistent across builds.

   :::
1. Generate a Gradle encryption key:

   ```
   openssl rand -base64 16
   ```
1. Save the key as a [Secret](/en/bitrise-ci/configure-builds/secrets.html) named GRADLE_ENCRYPTION_KEY in your Bitrise project.

   This ensures that the encrypted value of the configuration cache remains the same across different builds. Using a fixed encryption key is supported from Gradle version 8.6 or later. Bitrise doesn't support Gradle configuration cache for earlier Gradle versions.
1. Set your Bitrise [workspace slug](/en/bitrise-ci/api/identifying-workspaces-and-apps-with-their-slugs) as an Environment Variable named BITRISE_BUILD_CACHE_WORKSPACE_ID.
1. Add the **Build Cache for Gradle** Step to your Workflow.

   The Step must be of version 2.7.7 or later. Any subsequent updates to the Step will cause a one-off invalidation of the configuration cache. If this happens, do a rebuild to fix the issue.
1. Add the **Restore Gradle configuration cache** and the **Restore Gradle Cache** Steps before your Gradle invocation in the Workflow.

   The Steps retrieve cached configuration data and enable the configuration cache to access artifacts it references.

   :::note[Configuration cache directory]

   The **Restore Gradle configuration cache** Step saves data in the `./.gradle/configuration-cache` directory. You can override this by changing the **Configuration cache directory** input.

   :::

   For example, if you use **Android Build** to build your Gradle project, these two Steps must come before it in the Workflow.
1. Add the **Save Gradle configuration cache** and the **Save Gradle Cache** Steps after your Gradle invocation in the Workflow.

   The Steps save the configuration data to the cache and save artifacts referenced by the configuration cache.
1. Enable the **Save transforms** input of the **Save Gradle Cache** Step. You need Step version 1.4.1 or later.

## Saving the Gradle configuration cache log

Gradle's build logs might contain information about why it didn't reuse the configuration cache. You can save the log to the **Artifacts** page of your build:

1. Enable the `--info` [log level](https://docs.gradle.org/current/userguide/logging.html) in Gradle.
1. Add the **Deploy to Bitrise.io** Step to your Workflow.
1. Set the **Deploy directory or file path** input to what Gradle outputs as the file path.

You can check the deployed file on the **Artifacts** page: open Bitrise CI, select your project and then the build, and select the **Artifacts** tab.

## Troubleshooting the configuration cache

If your build doesn't reuse the configuration cache, you can check a number of potential problems.

### General troubleshooting

- Make sure to add the Save/Restore Gradle cache Steps to utilize dependency caching. Gradle configuration cache references artifacts that must be present.
- It may take multiple runs before the configuration cache is fully applied and reused.
- Check the Gradle logs to find out why Gradle didn't reuse the configuration cache. You can [save the gradle configuration cache log](#section-idm23460613639422) to your build artifacts.
- Updates to the **Build Cache for Gradle** Step will cause a one-off invalidation of the configuration cache. Just run another build to fix the problem.

### Failed to instrument class error

Your build could fail with the following error:

```
org.gradle.internal.operations.BuildOperationInvocationException: Failed to instrument class io/bitrise/gradle/cache/BitriseBuildCache in ClassLoaderScopeIdentifier.Id{coreAndPlugins:init-file:/root/.gradle/init.d/bitrise-build-cache.init.gradle.kts(export)}
```

To fix this issue:

1. In the **Save Gradle cache** Step, set the **Save transforms** input to **true**.

   :::note[Version requirement]

   The input is only available from version 1.4.1 or later.

   :::
1. Force a save by running a build without the **Restore Gradle cache** Step.
