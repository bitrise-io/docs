---
title: "Configuring the build cache for Bazel in local builds"
sidebar_position: 3
slug: /bitrise-build-cache/build-cache-for-bazel/configuring-the-build-cache-for-bazel-in-local-builds
sidebar_label: Configuring the Bitrise Build Cache for Bazel in local environments
---

You can use the Bitrise Build Cache for Bazel on any machine: you just need to create a `bitrise.bazelrc` configuration file that includes the required configuration for the cache endpoints.

1. Select your Bitrise workspace and go to **Build Cache**.
1. Click **New connection**.
1. Select **Other CI provider** and then select your build tool from the dropdown menu.

   ![2025-10-21-choose-build-tool.png](/img/_paligo/uuid-95236863-449a-87ff-2713-11f9a7f3cfdd.png)
1. Click **Create token**.

   ![2025-10-21-create-token.png](/img/_paligo/uuid-20c79dca-f52e-e046-e9f2-3fce1c6019ba.png)
1. Enter a name and set it to never expire.
1. Copy the keys and values of the two variables.
1. Set the variables as Environment Variables in your local configuration.

   ```
   export BITRISE_BUILD_CACHE_WORKSPACE_ID=<workspace ID>
   export BITRISE_BUILD_CACHE_AUTH_TOKEN=<token>
   ```
1. Download the CLI and install it in a temporary location. You will only need to use it to activate the build cache once, or if any of the settings change.

   ```
   curl --retry 5 -sSfL 'https://raw.githubusercontent.com/bitrise-io/bitrise-build-cache-cli/main/install/installer.sh' | sh -s -- -b /tmp/bin -d
   ```
1. Activate the Bitrise Build Cache.

   There are a couple of flags you can use to control the configuration, but we recommend these defaults:

   ```
   /tmp/bin/bitrise-build-cache activate bazel --cache --cache-push=false
   ```

   :::note[Pulling from cache]

   We recommend only pulling artifacts from the cache to avoid accidentally sharing incorrect cache data due to file modifications during a build.

   For the full list of flags check the CLI’s `/tmp/bin/bitrise-build-cache activate bazel --help` command.

   :::
1. If you have Remote Build Execution enabled for your workspace, you can also use it locally by adding the `--rbe` flag.

   :::note[Enabling RBE locally]

   You will need to have the workers set up for your workspace, and the pool configuration in your repository’s `.bazelrc` file before enabling RBE locally!

   :::
1. Optionally, add your repository URL in your repository’s root `.bazelrc` file.

   We recommend doing this to be able to identify your local builds.

   :::note[Replace the URL]

   Make sure to replace the placeholder URL in the command with your own!

   :::

   ```
   build --remote_header='x-repository-url=https://github.com/bazelbuild/bazel.git'
   build --bes_header='x-repository-url=https://github.com/bazelbuild/bazel.git'
   ```

That's it! You can now run any `bazel` commands and take advantage of the Bitrise Build Cache. You can check the invocation details through the link printed during builds:

![bazel-local-printout.png](/img/_paligo/uuid-a87ac3d9-b1bf-89bc-8d33-84e7edc358c9.png)
