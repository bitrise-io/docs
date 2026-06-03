---
title: "Configuring the build cache for Bazel in other CI environments"
sidebar_position: 2
slug: /bitrise-build-cache/build-cache-for-bazel/configuring-the-build-cache-for-bazel-in-other-ci-environments
sidebar_label: Configuring the Build Cache for Bazel in non-Bitrise CI environments
---

The Bitrise Build Cache does not require using the Bitrise CI. You can use other CI/CD services and still take advantage of remote caching to improve your Bazel build times.

To do so, you need to configure your CI environment to download the Bitrise Build Cache CLI during the build and then run the CLI to enable the Bitrise Build Cache.

1. Select your Bitrise workspace and go to **Build Cache**.
1. Click **New connection**.
1. Select **Other CI provider** and then select your build tool from the dropdown menu.

   ![2025-10-21-choose-build-tool.png](/img/_paligo/uuid-95236863-449a-87ff-2713-11f9a7f3cfdd.png)
1. Click **Create token**.

   ![2025-10-21-create-token.png](/img/_paligo/uuid-20c79dca-f52e-e046-e9f2-3fce1c6019ba.png)
1. Enter a name and set it to never expire.
1. Copy the variables and add them to your CI configuration as Environment Variables.
1. Add the following script to your CI configuration before the step you want to speed up:

   :::important[Environment]

   Make sure to run the script in the same environment as the Bazel command you want to speed up. For example, if you use multiple Docker containers throughout the build, make sure that the Bitrise Build Cache CLI runs in the same Docker container as the Bazel command.

   :::

   ```
   #!/usr/bin/env bash
   set -euxo pipefail

   # download Bitrise Build Cache CLI
   curl --retry 5 -sSfL 'https://raw.githubusercontent.com/bitrise-io/bitrise-build-cache-cli/main/install/installer.sh' | sh -s -- -b /tmp/bin -d

   # run the CLI to enable Bitrise build cache for Bazel
   /tmp/bin/bitrise-build-cache activate bazel --cache --cache-push
   ```
1. If you have Remote Build Execution enabled for your workspace, you can also use it locally by adding the `--rbe` flag.

   :::note[Enabling RBE locally]

   You will need to have the workers set up for your workspace, and the pool configuration in your repository’s `.bazelrc` file before enabling RBE locally!

   :::
