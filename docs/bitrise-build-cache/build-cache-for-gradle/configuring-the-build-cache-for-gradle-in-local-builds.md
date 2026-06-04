---
title: "Configuring the build cache for Gradle in local builds"
sidebar_position: 3
slug: /bitrise-build-cache/build-cache-for-gradle/configuring-the-build-cache-for-gradle-in-local-builds
sidebar_label: Configuring the Build Cache for Gradle in local environments
---

You can use the Bitrise Build Cache even for local Gradle builds. In this way your local builds and CI builds will use the same build cache, minimizing build times in both environments.

There are two ways to set up the Bitrise Build Cache for a Gradle project:

- Configuring caching in a separate file, without changing Gradle project files.
- Configuring caching directly in the Gradle project build files.

1. Select your Bitrise workspace and go to **Build Cache**.
1. Click **New connection**.
1. Select **Other CI provider** and then select your build tool from the dropdown menu.

   ![2025-10-21-choose-build-tool.png](/img/_paligo/uuid-95236863-449a-87ff-2713-11f9a7f3cfdd.png)
1. Click **Create token**.

   ![2025-10-21-create-token.png](/img/_paligo/uuid-20c79dca-f52e-e046-e9f2-3fce1c6019ba.png)
1. Enter a name and set it to never expire.
1. Copy the keys and values of the two variables.
1. Set the variables as Environment Variables in your local configuration.

   ```bash
   export BITRISE_BUILD_CACHE_WORKSPACE_ID=<workspace ID>
   export BITRISE_BUILD_CACHE_AUTH_TOKEN=<token>
   ```
1. Download the CLI and install it in a temporary location. You will only need to use it to activate the build cache once, or if any of the settings change.

   ```bash
   curl --retry 5 -sSfL 'https://raw.githubusercontent.com/bitrise-io/bitrise-build-cache-cli/main/install/installer.sh' | sh -s -- -b /tmp/bin -d
   ```
1. Activate the Bitrise Build Cache.

   There are a couple of flags you can use to control the configuration, but we recommend these defaults:

   ```
   /tmp/bin/bitrise-build-cache activate gradle --cache --cache-push=false
   ```

   :::note[Pulling from cache]

   We recommend only pulling artifacts from the cache to avoid accidentally sharing incorrect cache data due to file modifications during a build.

   For the full list of flags check the CLI’s `/tmp/bin/bitrise-build-cache activate gradle --help` command.

   :::

Now Bitrise Build Cache will be used for your local builds. You can check the invocation details through the link printed during builds:

![DevCenter_article_gradle_bazel_local_dev_env_guide_-_Google_Docs.png](/img/_paligo/uuid-f2b9bb79-63bb-0c15-7e8d-4304c3fa2a51.png)
